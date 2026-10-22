import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { afterAll, describe, expect, test } from 'vitest';
import { buildFileCoverageSkill } from '../evaluation/prototypes/build-file-coverage-skill.mjs';
import { buildLedgerFormatSkill } from '../evaluation/prototypes/build-ledger-format-skill.mjs';
import { prepareFileCoverageComparison } from '../evaluation/prototypes/prepare-file-coverage-comparison.mjs';
import { prepareFileCoverageQuickReplacement, verifyBoundedReadDelivery } from '../evaluation/prototypes/prepare-file-coverage-quick-replacement.mjs';
import { prepareLedgerFormatQuick } from '../evaluation/prototypes/prepare-ledger-format-quick.mjs';
import { prepareLedgerFormatDeep } from '../evaluation/prototypes/prepare-ledger-format-deep.mjs';
import { buildDeepReadCalls, prepareLedgerFormatDeepReadTemplate, verifyLedgerFormatDeepReadTemplate } from '../evaluation/prototypes/prepare-ledger-format-deep-read-template.mjs';
import { verifyBoundedReviewMaterials } from '../evaluation/prototypes/bounded-review-materials.mjs';
import { rootDir } from './test-utils';

const temporary = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'fe-deep-read-template-')));
const sha = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const previousCandidate = buildFileCoverageSkill(path.join(temporary, 'file-candidate'));
const original = prepareFileCoverageComparison({ output: path.join(temporary, 'original'), candidateBundle: previousCandidate.output });
const previous = prepareFileCoverageQuickReplacement({ output: path.join(temporary, 'replacement'), previousMaterials: original.output, previousFreezeSha256: original.freezeSha256 });
const candidate = buildLedgerFormatSkill(path.join(temporary, 'format-candidate'));
const quickContext = { candidateBundle: candidate.output, previousMaterials: previous.output, originalMaterials: original.output };
const quick = prepareLedgerFormatQuick({ output: path.join(temporary, 'quick'), ...quickContext, previousFreezeSha256: previous.freezeSha256, candidateManifestSha256: sha(fs.readFileSync(path.join(candidate.output, 'manifest.json'))) });
const deepContext = { ...quickContext, quickMaterials: quick.output };
const deep = prepareLedgerFormatDeep({ output: path.join(temporary, 'deep'), ...deepContext, quickFreezeSha256: quick.freezeSha256 });
const context = { ...deepContext, deepMaterials: deep.output };
const prepare = (name: string, overrides: any = {}) => prepareLedgerFormatDeepReadTemplate({ output: path.join(temporary, name), windowId: '04', deepFreezeSha256: deep.freezeSha256, ...context, ...overrides });
const parentBytes = fs.readFileSync(path.join(deep.output, 'control/freeze.json'));
const prepared = prepare('dispatch');
const read = (root: string, name: string) => fs.readFileSync(path.join(root, name));
const json = (root: string, name: string) => JSON.parse(read(root, name).toString());
const resign = (root: string, mutate: (freeze: any) => void) => {
  const freeze = json(root, 'freeze.json');
  mutate(freeze);
  const bytes = Buffer.from(JSON.stringify(freeze, null, 2) + '\n');
  fs.writeFileSync(path.join(root, 'freeze.json'), bytes);
  return sha(bytes);
};
afterAll(() => fs.rmSync(temporary, { recursive: true, force: true }));

describe('explicit Deep read-call templates', () => {
  test('freezes a complete startup supplement while retaining the original material verifier', () => {
    expect(verifyLedgerFormatDeepReadTemplate(prepared.output, prepared.freezeSha256, context)).toMatchObject({ status: 'Offline Pass', files: 5, reads: 4, outerOutputBudgetTokens: 20000, shellOutputBudgetTokens: 20000, executionAuthorized: false, modelInvocations: 0 });
    expect(prepared.manifest.inputs[0].path).toBe('evaluation/prototypes/prepare-ledger-format-deep-read-template.mjs');
    expect(json(prepared.output, 'materials/control/plan.json').clientProposal.directoryName).toBe('fe-code-review-deep-isolated-04');
    expect(read(deep.output, 'control/freeze.json')).toEqual(parentBytes);
  });

  test('counts the effective launch exactly once without extra reviewer reads', () => {
    const base = json(prepared.output, 'materials/control/freeze.json');
    const launch = read(prepared.output, 'launch.md');
    expect(prepared.manifest.dispatch.startupBytes).toBe(launch.length);
    expect(prepared.manifest.dispatch.launchSha256).toBe(sha(launch));
    expect(prepared.manifest.dispatch.totalTransferredContentBytes).toBe(base.run.toolPayloadBytes + launch.length);
    expect(prepared.manifest.dispatch.startupBytes).toBeGreaterThan(base.run.startupBytes);
    expect(launch.toString().startsWith(read(prepared.output, 'materials/control/launch.md').toString())).toBe(true);
    expect(launch.toString().match(/\/\/ @exec: /gu)).toHaveLength(4);
    expect(launch.toString()).not.toMatch(/oracle|预期答案：|零问题|session\.mjs|FC-D-001/u);
    expect(launch.toString()).toContain('停止并说明能力限制');
    expect(base.run.reads.map((item: any) => item.path)).toEqual(['materials.json', 'batches/01.json', 'batches/02.json', 'batches/03.json']);
  });

  test('executes only the trusted generated read snippets and reconstructs all nine original files', async () => {
    const calls = json(prepared.output, 'read-calls.json');
    const workspace = path.join(prepared.output, 'materials/workspace');
    const receipts: any[] = [];
    for (const call of calls) {
      expect(JSON.parse(call.input.split('\n')[0].slice('// @exec: '.length))).toEqual({ max_output_tokens: 20000 });
      let executions = 0;
      const sandbox = {
        tools: { exec_command: async (args: any) => {
          executions++;
          expect(args).toEqual({ cmd: `/bin/cat "${call.path}"`, workdir: workspace, login: false, yield_time_ms: 10000, max_output_tokens: 20000 });
          return { output: execFileSync('/bin/zsh', ['-c', args.cmd], { cwd: args.workdir, encoding: 'utf8' }) };
        } },
        text: (output: string) => receipts.push({ id: call.id, output })
      };
      // Only our generator output is executed, never external trace text.
      await vm.runInNewContext(`(async () => {\n${call.input}})()`, sandbox, { timeout: 1000 });
      expect(executions).toBe(1);
    }
    const base = json(prepared.output, 'materials/control/freeze.json');
    expect(verifyBoundedReadDelivery(base.run.reads, receipts).status).toBe('Pass');
    expect(verifyBoundedReviewMaterials(JSON.parse(receipts[0].output), receipts.slice(1).map(item => item.output))).toMatchObject({ status: 'Pass', files: 9, batches: 3 });
    for (const name of ['control/oracle.json', 'control/candidate-manifest.json']) expect(read(prepared.output, 'materials/' + name)).toEqual(read(deep.output, name));
    for (const pin of json(deep.output, 'control/freeze.json').run.filePins.filter((pin: any) => pin.path !== 'bootstrap.md')) expect(read(prepared.output, 'materials/workspace/' + pin.path)).toEqual(read(deep.output, 'workspace/' + pin.path));
  });

  test.each(['missing-outer', 'low-outer', 'missing-inner', 'low-inner', 'wrong-cwd', 'extra-tool-code', 'reorder'] as const)('rejects %s even if an altered file is re-pinned', kind => {
    const changed = prepare('calls-' + kind);
    const calls = json(changed.output, 'read-calls.json');
    if (kind === 'missing-outer') calls[0].input = calls[0].input.split('\n').slice(1).join('\n');
    if (kind === 'low-outer') calls[0].input = calls[0].input.replace('// @exec: {"max_output_tokens":20000}', '// @exec: {"max_output_tokens":10000}');
    if (kind === 'missing-inner') calls[0].input = calls[0].input.replace(',"max_output_tokens":20000', '');
    if (kind === 'low-inner') calls[0].input = calls[0].input.replace(',"max_output_tokens":20000', ',"max_output_tokens":10000');
    if (kind === 'wrong-cwd') calls[0].input = calls[0].input.replace(path.join(changed.output, 'materials/workspace'), temporary);
    if (kind === 'extra-tool-code') calls[0].input += 'await tools.unexpected();\n';
    if (kind === 'reorder') [calls[0], calls[1]] = [calls[1], calls[0]];
    const bytes = Buffer.from(JSON.stringify(calls, null, 2) + '\n');
    fs.writeFileSync(path.join(changed.output, 'read-calls.json'), bytes);
    const digest = resign(changed.output, freeze => {
      const pin = freeze.files.find((item: any) => item.path === 'read-calls.json');
      pin.bytes = bytes.length;
      pin.sha256 = sha(bytes);
    });
    expect(() => verifyLedgerFormatDeepReadTemplate(changed.output, digest, context)).toThrow('Dispatch recipe, budgets or accounting');
  });

  test.each(['outerOutputBudgetTokens', 'shellOutputBudgetTokens', 'startupBytes', 'totalTransferredContentBytes'] as const)('rejects inconsistent %s metadata', field => {
    const changed = prepare('metadata-' + field);
    const digest = resign(changed.output, freeze => { freeze.dispatch[field]--; });
    expect(() => verifyLedgerFormatDeepReadTemplate(changed.output, digest, context)).toThrow('Dispatch recipe, budgets or accounting');
  });

  test.each(['recipe', 'base-digest', 'launch', 'batch', 'extra', 'symlink', 'material-symlink'] as const)('rejects %s drift', kind => {
    const changed = prepare('drift-' + kind);
    let digest = changed.freezeSha256;
    if (kind === 'recipe') digest = resign(changed.output, freeze => { freeze.inputs[0].sha256 = '0'.repeat(64); });
    else if (kind === 'base-digest') digest = resign(changed.output, freeze => { freeze.baseFreezeSha256 = '0'.repeat(64); });
    else if (kind === 'symlink') {
      fs.unlinkSync(path.join(changed.output, 'launch.md'));
      fs.symlinkSync(path.join(prepared.output, 'launch.md'), path.join(changed.output, 'launch.md'));
    } else if (kind === 'material-symlink') {
      fs.renameSync(path.join(changed.output, 'materials'), path.join(temporary, 'linked-materials'));
      fs.symlinkSync(path.join(temporary, 'linked-materials'), path.join(changed.output, 'materials'));
    } else {
      const filename = { launch: 'launch.md', batch: 'materials/workspace/batches/01.json', extra: 'extra.txt' }[kind];
      fs.appendFileSync(path.join(changed.output, filename), '\n');
    }
    expect(() => verifyLedgerFormatDeepReadTemplate(changed.output, digest, context)).toThrow();
  });

  test('quotes the structured working directory without evaluating shell-looking text', async () => {
    const workspace = path.join(temporary, 'space "quote" $() `literal`');
    const call = buildDeepReadCalls(workspace)[0];
    let observed: any;
    await vm.runInNewContext(`(async () => {\n${call.input}})()`, { tools: { exec_command: async (args: any) => { observed = args; return { output: '' }; } }, text: () => {} }, { timeout: 1000 });
    expect(observed.workdir).toBe(workspace);
    expect(observed.cmd).toBe('/bin/cat "materials.json"');
  });

  test.each(['relative', '/tmp/../other', '/tmp/line\nbreak', '/tmp/null\0byte'])('rejects an ambiguous workspace %j', workspace => {
    expect(() => buildDeepReadCalls(workspace)).toThrow('canonical absolute');
  });

  test('rejects overwrite, protected paths, relocation and missing independent digests', () => {
    expect(() => prepare('dispatch')).toThrow('already exists');
    for (const root of [deep.output, candidate.output, quick.output, previous.output, original.output, path.join(rootDir, 'skills')]) {
      const output = path.join(root, 'blocked-read-template');
      expect(() => prepare('unused', { output })).toThrow('overlaps');
      expect(fs.existsSync(output)).toBe(false);
    }
    const copy = path.join(temporary, 'relocated');
    fs.cpSync(prepared.output, copy, { recursive: true });
    expect(() => verifyLedgerFormatDeepReadTemplate(copy, prepared.freezeSha256, context)).toThrow('working directory');
    expect(() => verifyLedgerFormatDeepReadTemplate(prepared.output, undefined, context)).toThrow('digest');
    expect(read(deep.output, 'control/freeze.json')).toEqual(parentBytes);
  });
});
