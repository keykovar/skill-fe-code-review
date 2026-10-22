import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, test } from 'vitest';
import { buildFileCoverageSkill } from '../evaluation/prototypes/build-file-coverage-skill.mjs';
import { buildLedgerFormatSkill } from '../evaluation/prototypes/build-ledger-format-skill.mjs';
import { prepareFileCoverageComparison } from '../evaluation/prototypes/prepare-file-coverage-comparison.mjs';
import { prepareFileCoverageQuickReplacement, verifyBoundedReadDelivery, verifyFileCoverageQuickReplacement } from '../evaluation/prototypes/prepare-file-coverage-quick-replacement.mjs';
import { prepareLedgerFormatQuick, verifyLedgerFormatQuick } from '../evaluation/prototypes/prepare-ledger-format-quick.mjs';
import { verifyBoundedReviewMaterials } from '../evaluation/prototypes/bounded-review-materials.mjs';
import { rootDir } from './test-utils';

const temporary = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'fe-format-quick-')));
const sha = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const previousCandidate = buildFileCoverageSkill(path.join(temporary, 'file-candidate'));
const original = prepareFileCoverageComparison({ output: path.join(temporary, 'original'), candidateBundle: previousCandidate.output });
const previous = prepareFileCoverageQuickReplacement({ output: path.join(temporary, 'replacement'), previousMaterials: original.output, previousFreezeSha256: original.freezeSha256 });
const candidate = buildLedgerFormatSkill(path.join(temporary, 'format-candidate'));
const context = { candidateBundle: candidate.output, previousMaterials: previous.output, originalMaterials: original.output };
const prepare = (output: string, overrides: any = {}) => prepareLedgerFormatQuick({ output, ...context,
  previousFreezeSha256: previous.freezeSha256, candidateManifestSha256: sha(fs.readFileSync(path.join(candidate.output, 'manifest.json'))), ...overrides });
const prepared = prepare(path.join(temporary, 'window'));
const read = (name: string) => fs.readFileSync(path.join(prepared.output, name), 'utf8');
const json = (name: string) => JSON.parse(read(name));
const receipts = () => prepared.manifest.run.reads.map((pin: any) => ({ id: pin.id, output: read('workspace/' + pin.path) }));
afterAll(() => fs.rmSync(temporary, { recursive: true, force: true }));

describe('format-only Quick frozen preparation', () => {
  test('prepares one unexecuted candidate run and preserves the two historical windows', () => {
    expect(verifyLedgerFormatQuick(prepared.output, prepared.freezeSha256, context)).toMatchObject({ status: 'Offline Pass', files: 5, reads: 4, modelInvocations: 0, executionAuthorized: false, reportAcceptance: 'Not Evaluated' });
    expect(verifyFileCoverageQuickReplacement(previous.output, previous.freezeSha256, original.output).status).toBe('Offline Pass');
    expect(prepared.manifest.run).toMatchObject({ caseId: 'FC-Q-001', mode: 'quick', status: 'Not Run' });
    expect(json('control/plan.json')).toMatchObject({ maxSourceBearingRuns: 1, maxAttemptsPerRun: 1, executionAuthorized: false, runtimeReady: false });
  });

  test('preserves the exact candidate instructions and all original packet files', () => {
    const material = json('workspace/materials.json');
    const outputs = material.batches.map((pin: any) => read('workspace/' + pin.path));
    expect(verifyBoundedReviewMaterials(material, outputs)).toMatchObject({ files: 15, batches: 3, status: 'Pass' });
    const recovered = new Map<string, string>();
    for (const output of outputs) for (const segment of JSON.parse(output).segments) recovered.set(segment.path, (recovered.get(segment.path) ?? '') + segment.content);
    for (const [name, text] of recovered) {
      const expected = name.startsWith('skill/')
        ? path.join(candidate.output, 'fe-code-review', name.slice(6))
        : path.join(previous.output, 'workspaces/01-quick-stable', name);
      expect(text).toBe(fs.readFileSync(expected, 'utf8'));
    }
    expect(material.files.map((pin: any) => pin.path)).toEqual(JSON.parse(fs.readFileSync(path.join(previous.output, 'workspaces/01-quick-stable/materials.json'), 'utf8')).files.filter((pin: any) => pin.readRanges).map((pin: any) => pin.path));
  });

  test('keeps finding and source-evidence gates, removing only file-feature and paired-comparison fields', () => {
    const prior = JSON.parse(fs.readFileSync(path.join(previous.output, 'control/oracles.json'), 'utf8'));
    const current = json('control/oracle.json');
    const { candidateFileCoverage, stableComparison, ...expected } = prior.cases['FC-Q-001'];
    expect(current.cases).toEqual({ 'FC-Q-001': expected });
    expect(current.common).toEqual(prior.common);
    expect(expected.findings).toHaveLength(2);
    for (const finding of expected.findings) expect(finding).toMatchObject({ severity: 'Risk', origin: 'New', reproduction: 'Not Run' });
    const priorPlan = JSON.parse(fs.readFileSync(path.join(previous.output, 'control/plan.json'), 'utf8'));
    expect(json('control/plan.json').qualityGates).toEqual(priorPlan.qualityGates.filter((gate: string) => !gate.startsWith('Candidate Quick/Deep compact file grammar')));
  });

  test('does not expose answers, history or evaluation controls in reviewer content', () => {
    const material = json('workspace/materials.json');
    expect(material.files.some((pin: any) => /oracle|control|history|report|repair/u.test(pin.path))).toBe(false);
    expect(prepared.manifest.run.filePins.map((pin: any) => pin.path)).toEqual(['materials.json', 'batches/01.json', 'batches/02.json', 'batches/03.json', 'bootstrap.md']);
    const startup = read('workspace/bootstrap.md');
    expect(startup).not.toMatch(/F-00[12]|两项|缺失斜线|双斜线|Coverage|Disposition|Merge key|23|24|600/u);
    expect(startup).toContain('content 是 JSON 解码后的原文');
    expect(startup).toContain('不运行 JSON 解码脚本');
    expect(startup).toContain('立即停止');
  });

  test('accounts for all selected reads and exact startup separately', () => {
    const run = prepared.manifest.run;
    expect(run.reads.map((pin: any) => pin.path)).toEqual(['materials.json', 'batches/01.json', 'batches/02.json', 'batches/03.json']);
    expect(run.reads.every((pin: any) => pin.bytes <= 20000)).toBe(true);
    expect(run.toolPayloadBytes).toBe(run.reads.reduce((sum: number, pin: any) => sum + pin.bytes, 0));
    const launch = read(run.launchPath);
    expect(launch).toBe(`本次唯一工作目录：${path.join(prepared.output, 'workspace')}\n\n${read('workspace/bootstrap.md')}`);
    expect(run.launchSha256).toBe(sha(Buffer.from(launch)));
    expect(run.startupBytes).toBe(Buffer.byteLength(launch));
    expect(run.totalTransferredContentBytes).toBe(run.toolPayloadBytes + run.startupBytes);
    expect(verifyBoundedReadDelivery(run.reads, receipts()).status).toBe('Pass');
  });

  test('retains the 600-second acceptance ceiling without claiming automatic cancellation or cost savings', () => {
    const plan = json('control/plan.json');
    expect(plan.elapsed.acceptanceCeilingMs).toBe(600000);
    expect(plan.elapsed.enforcement).toContain('automatic cancellation unavailable');
    expect(plan.elapsed.overrun).toContain('No-Go');
    expect(plan.stopPolicy).toContain('No retry, replacement, follow-up');
    expect(plan.costAcceptance).toContain('Not Evaluated');
    expect(plan).not.toHaveProperty('maxCandidateToStableRatioPerPair');
    expect(plan.promotion).toContain('Not authorized');
  });

  test.each(['missing', 'extra', 'reorder', 'truncate', 'same-length-change', 'wrapped'] as const)('rejects %s model-visible receipt', kind => {
    const actual = receipts();
    if (kind === 'missing') actual.pop();
    if (kind === 'extra') actual.push(actual[0]);
    if (kind === 'reorder') [actual[1], actual[2]] = [actual[2], actual[1]];
    if (kind === 'truncate') actual[2].output = actual[2].output.slice(0, -1);
    if (kind === 'same-length-change') actual[2].output = actual[2].output.replace('verbatim', 'VERBATIM');
    if (kind === 'wrapped') actual[2].output = JSON.stringify(actual[2].output);
    expect(() => verifyBoundedReadDelivery(prepared.manifest.run.reads, actual)).toThrow();
  });

  test.each(['batch', 'manifest', 'startup', 'launch', 'oracle', 'extra', 'symlink'] as const)('rejects %s drift after freeze', kind => {
    const copy = path.join(temporary, 'changed-' + kind);
    fs.cpSync(prepared.output, copy, { recursive: true });
    const targets = { batch: 'workspace/batches/01.json', manifest: 'workspace/materials.json', startup: 'workspace/bootstrap.md', launch: 'control/launch.md', oracle: 'control/oracle.json', extra: 'workspace/extra.txt', symlink: 'workspace/batches/01.json' };
    const filename = path.join(copy, targets[kind]);
    if (kind === 'symlink') { fs.unlinkSync(filename); fs.symlinkSync(path.join(prepared.output, targets[kind]), filename); }
    else fs.appendFileSync(filename, '\n');
    expect(() => verifyLedgerFormatQuick(copy, prepared.freezeSha256, context)).toThrow();
  });

  test('requires independent pins and rejects overwrite or protected destinations', () => {
    expect(() => verifyLedgerFormatQuick(prepared.output, undefined, context)).toThrow('digest');
    expect(() => verifyLedgerFormatQuick(prepared.output, '0'.repeat(64), context)).toThrow('digest');
    expect(() => prepare(path.join(temporary, 'bad-candidate'), { candidateManifestSha256: '0'.repeat(64) })).toThrow('candidate digest');
    expect(() => prepare(path.join(temporary, 'bad-parent'), { previousFreezeSha256: '0'.repeat(64) })).toThrow('digest');
    expect(() => prepare(prepared.output)).toThrow('already exists');
    for (const directory of [candidate.output, previous.output, original.output, path.join(rootDir, 'skills')]) expect(() => prepare(path.join(directory, 'blocked'))).toThrow('overlaps');
    const alias = path.join(temporary, 'formal-alias');
    fs.symlinkSync(path.join(rootDir, 'skills'), alias);
    expect(() => prepare(path.join(alias, 'blocked'))).toThrow('overlaps');
  });

  test('rejects changed candidate contents and undeclared files even when the original manifest is kept', () => {
    for (const mode of ['change', 'extra']) {
      const copy = path.join(temporary, 'candidate-' + mode);
      fs.cpSync(candidate.output, copy, { recursive: true });
      fs.appendFileSync(path.join(copy, mode === 'change' ? 'fe-code-review/SKILL.md' : 'extra.md'), '\n');
      expect(() => prepare(path.join(temporary, 'rejected-' + mode), { candidateBundle: copy })).toThrow();
      expect(() => verifyLedgerFormatQuick(prepared.output, prepared.freezeSha256, { ...context, candidateBundle: copy })).toThrow();
    }
  });
});
