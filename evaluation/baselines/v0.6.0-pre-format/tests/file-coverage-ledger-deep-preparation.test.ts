import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, test } from 'vitest';
import { buildFileCoverageSkill } from '../evaluation/prototypes/build-file-coverage-skill.mjs';
import { buildFileCoverageLedgerSkill } from '../evaluation/prototypes/build-file-coverage-ledger-skill.mjs';
import { buildFileCoverageLedgerDedup } from '../evaluation/prototypes/build-file-coverage-ledger-dedup.mjs';
import { prepareFileCoverageComparison } from '../evaluation/prototypes/prepare-file-coverage-comparison.mjs';
import { prepareFileCoverageLedgerDeep, verifyFileCoverageLedgerDeep, verifyFileCoverageLedgerDeepDelivery } from '../evaluation/prototypes/prepare-file-coverage-ledger-deep.mjs';
import { rootDir } from './test-utils';

const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'fe-composed-deep-')));
const sha = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const parentCandidate = buildFileCoverageSkill(path.join(root, 'parent-candidate'));
const parent = prepareFileCoverageComparison({ output: path.join(root, 'parent-materials'), candidateBundle: parentCandidate.output });
const candidate = buildFileCoverageLedgerSkill({ sourceBundle: parentCandidate.output,
  sourceManifestSha256: sha(fs.readFileSync(path.join(parentCandidate.output, 'manifest.json'))), output: path.join(root, 'candidate') });
const options = { previousMaterials: parent.output, previousFreezeSha256: parent.freezeSha256,
  candidateBundle: candidate.output, candidateManifestSha256: candidate.manifestSha256 };
const prepared = prepareFileCoverageLedgerDeep({ ...options, output: path.join(root, 'deep') });
const read = (name: string) => fs.readFileSync(path.join(prepared.output, name), 'utf8');
const parse = (name: string) => JSON.parse(read(name));
const verify = () => verifyFileCoverageLedgerDeep(prepared.output, prepared.freezeSha256, options);
const physicalLines = (text: string) => text.match(/[^\n]*\n|[^\n]+$/gu) ?? [];
const localReceipts = (run: typeof prepared.manifest.runs[number]) => run.calls.map(call => {
  const content = read(call.id === 'L-001' ? call.path : run.workspace + '/' + call.path);
  return { id: call.id, input: call.input, exitCode: 0, truncated: false,
    output: call.id === 'L-001' ? content : physicalLines(content).slice(call.start - 1, call.end).join('') };
});

test('accepts a child candidate with an explicit parent manifest pin', () => {
  const dedup = buildFileCoverageLedgerDedup({ sourceBundle: candidate.output,
    sourceManifestSha256: candidate.manifestSha256, output: path.join(root, 'dedup-candidate') });
  const childOptions = { ...options, candidateBundle: dedup.output, candidateManifestSha256: dedup.manifestSha256,
    candidateKind: 'offline-file-coverage-ledger-dedup-candidate', candidateParentManifestSha256: candidate.manifestSha256 };
  const child = prepareFileCoverageLedgerDeep({ ...childOptions, output: path.join(root, 'dedup-deep') });
  expect(verifyFileCoverageLedgerDeep(child.output, child.freezeSha256, childOptions)).toMatchObject({ status: 'Offline Pass', executionAuthorized: false });
  expect(child.manifest.runs.every(run => run.status === 'Not Run')).toBe(true);
  expect(child.manifest.candidateManifestSha256).toBe(dedup.manifestSha256);
});
afterAll(() => fs.rmSync(root, { recursive: true, force: true }));

describe('composed file-coverage Deep preparation', () => {
  test('freezes only Candidate then Stable, with unchanged quality/cost gates and no execution authorization', () => {
    expect(verify()).toMatchObject({ status: 'Offline Pass', runs: 2, executionAuthorized: false, modelInvocations: 0, runtimeDelivery: 'Not Evaluated' });
    const plan = parse('control/plan.json');
    expect(plan.runs.map((run: any) => [run.variant, run.mode])).toEqual([['candidate', 'deep'], ['stable', 'deep']]);
    expect(plan.costBudget).toEqual(parent.manifest.plan.costBudget);
    expect(plan.stopPolicy).toBe(parent.manifest.plan.stopPolicy);
    expect(plan.maxAttemptsPerRun).toBe(1);
    expect(plan.maxSourceBearingRuns).toBe(2);
    expect(plan.candidateManifestSha256).toBe(candidate.manifestSha256);
    expect(prepared.manifest.runs.every(run => run.status === 'Not Run')).toBe(true);
    const oldOracle = JSON.parse(fs.readFileSync(path.join(parent.output, 'control/oracles.json'), 'utf8'));
    expect(parse('control/oracles.json')).toEqual({ ...oldOracle, cases: { 'FC-D-001': oldOracle.cases['FC-D-001'] } });
  });

  test('keeps exact nine-file evidence allowlists, source parity and unchanged selected candidate bytes', () => {
    const [candidateRun, stableRun] = prepared.manifest.runs;
    for (const run of prepared.manifest.runs) {
      expect(run.filePins).toHaveLength(11);
      const material = parse(run.workspace + '/materials.json');
      expect(material.files.filter((item: any) => item.delivery !== 'startup')).toHaveLength(9);
      expect(run.filePins.some(item => /oracle|plan|history|report|fix-review|quick-review/.test(item.path))).toBe(false);
      expect(parse(run.workspace + '/packet/packet.json').snapshots[0].after).toBeNull();
      for (const item of run.filePins.filter(item => item.path.startsWith('packet/'))) {
        expect(read(candidateRun.workspace + '/' + item.path)).toBe(read(stableRun.workspace + '/' + item.path));
      }
      for (const item of run.filePins.filter(item => item.path.startsWith('skill/'))) {
        const original = run.variant === 'candidate'
          ? path.join(candidate.output, item.path.replace('skill/', 'fe-code-review/'))
          : path.join(rootDir, 'skills/fe-code-review', item.path.slice('skill/'.length));
        expect(read(run.workspace + '/' + item.path)).toBe(fs.readFileSync(original, 'utf8'));
      }
    }
    expect(read(candidateRun.workspace + '/bootstrap.md')).toBe(read(stableRun.workspace + '/bootstrap.md'));
    expect(candidateRun.reads.length).toBe(stableRun.reads.length);
  });

  test('reconstructs each file once with contiguous ranges no larger than 6000 bytes', () => {
    for (const run of prepared.manifest.runs) {
      expect(run.reads[0].path).toBe('materials.json');
      for (const item of parse(run.workspace + '/materials.json').files.filter((item: any) => item.delivery !== 'startup')) {
        const original = read(run.workspace + '/' + item.path);
        let next = 1;
        let reconstructed = '';
        for (const receipt of run.reads.filter(receipt => receipt.path === item.path)) {
          expect(receipt.start).toBe(next);
          const output = physicalLines(original).slice(receipt.start - 1, receipt.end).join('');
          expect(Buffer.byteLength(output)).toBeLessThanOrEqual(6000);
          expect(sha(Buffer.from(output))).toBe(receipt.sha256);
          reconstructed += output;
          next = receipt.end + 1;
        }
        expect(reconstructed).toBe(original);
      }
    }
  });

  test.each(['candidate', 'stable'])('%s native read-call replay matches startup, full bytes and both budgets', variant => {
    const run = prepared.manifest.runs.find(run => run.variant === variant)!;
    const receipts = run.calls.map(call => {
      expect(call.input.startsWith('// @exec: {"max_output_tokens":20000}\n')).toBe(true);
      const match = call.input.match(/^const result = await tools\.exec_command\((.+)\);$/m)!;
      expect(match).toBeTruthy();
      const args = JSON.parse(match[1]);
      expect(args.max_output_tokens).toBe(20000);
      expect(args.login).toBe(false);
      expect(args.workdir).toBe(call.id === 'L-001' ? prepared.output : path.join(prepared.output, run.workspace));
      expect(args.cmd).toMatch(call.id === 'L-001' ? /^\/bin\/cat '/ : /^\/usr\/bin\/sed -n '\d+,\d+p' '/);
      const result = spawnSync('/bin/sh', ['-c', args.cmd], { cwd: args.workdir, encoding: 'utf8', maxBuffer: 1024 * 1024 });
      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
      return { id: call.id, input: call.input, output: result.stdout, exitCode: result.status, truncated: false };
    });
    expect(verifyFileCoverageLedgerDeepDelivery(run, receipts)).toMatchObject({ status: 'Pass', reads: run.calls.length, semanticStatus: 'Not Evaluated' });
    expect(read(run.dispatchPath)).toContain(run.calls[0].input);
    for (const call of run.calls.slice(1)) expect(read(run.launchPath)).toContain(call.input);
    expect(run.deliveredBytes).toBe(receipts.reduce((sum, item) => sum + Buffer.byteLength(item.output), 0) + Buffer.byteLength(read(run.dispatchPath)));
  });

  test.each(['missing', 'extra', 'reorder', 'truncate', 'truncation-flag', 'failed', 'budget', 'cwd', 'tool-code'] as const)('rejects %s observed-call deviation', kind => {
    const run = prepared.manifest.runs[0];
    const receipts = localReceipts(run);
    if (kind === 'missing') receipts.pop();
    if (kind === 'extra') receipts.push(receipts[0]);
    if (kind === 'reorder') [receipts[1], receipts[2]] = [receipts[2], receipts[1]];
    if (kind === 'truncate') receipts[1].output = receipts[1].output.slice(0, -1);
    if (kind === 'truncation-flag') receipts[1].truncated = true;
    if (kind === 'failed') receipts[1].exitCode = 1;
    if (kind === 'budget') receipts[1].input = receipts[1].input.replace('20000', '10000');
    if (kind === 'cwd') receipts[1].input = receipts[1].input.replace('"workdir":', '"ignoredWorkdir":');
    if (kind === 'tool-code') receipts[1].input += 'text("extra");\n';
    expect(() => verifyFileCoverageLedgerDeepDelivery(run, receipts)).toThrow();
  });

  test.each(['launch', 'dispatch', 'source', 'plan', 'oracle', 'extra', 'symlink'] as const)('rejects %s output drift at the original frozen path', kind => {
    const run = prepared.manifest.runs[0];
    const name = kind === 'launch' ? run.launchPath : kind === 'dispatch' ? run.dispatchPath
      : kind === 'plan' ? 'control/plan.json' : kind === 'oracle' ? 'control/oracles.json'
        : kind === 'extra' ? run.workspace + '/answer.md' : run.workspace + '/packet/after/src/profile.mjs';
    const filename = path.join(prepared.output, name);
    const original = kind === 'extra' ? null : fs.readFileSync(filename);
    try {
      if (kind === 'symlink') {
        fs.unlinkSync(filename);
        fs.symlinkSync(path.join(parent.output, 'workspaces/03-deep-candidate/packet/after/src/profile.mjs'), filename);
      } else fs.writeFileSync(filename, original ? Buffer.concat([original, Buffer.from('\nchanged\n')]) : 'extra');
      expect(verify).toThrow();
    } finally {
      if (kind === 'symlink' || kind === 'extra') fs.unlinkSync(filename);
      if (original) fs.writeFileSync(filename, original);
    }
    expect(verify().status).toBe('Offline Pass');
  });

  test('refuses missing/wrong digests, parent/formal aliases and overwrites', () => {
    expect(() => verifyFileCoverageLedgerDeep(prepared.output, undefined, options)).toThrow('digest');
    expect(() => verifyFileCoverageLedgerDeep(prepared.output, '0'.repeat(64), options)).toThrow('digest');
    expect(() => prepareFileCoverageLedgerDeep({ ...options, output: prepared.output })).toThrow('exists');
    expect(() => prepareFileCoverageLedgerDeep({ ...options, output: path.join(candidate.output, 'nested') })).toThrow('overlaps');
    const alias = path.join(root, 'formal-alias');
    fs.symlinkSync(path.join(rootDir, 'skills'), alias);
    expect(() => prepareFileCoverageLedgerDeep({ ...options, output: path.join(alias, 'nested') })).toThrow('overlaps');
    expect(() => prepareFileCoverageLedgerDeep({ ...options, output: path.join(root, 'wrong-candidate'), candidateManifestSha256: '0'.repeat(64) })).toThrow('digest');
    expect(fs.existsSync(path.join(root, 'wrong-candidate'))).toBe(false);
  });
});
