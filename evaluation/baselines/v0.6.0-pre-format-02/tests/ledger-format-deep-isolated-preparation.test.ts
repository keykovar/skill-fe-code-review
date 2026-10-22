import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, test } from 'vitest';
import { buildFileCoverageSkill } from '../evaluation/prototypes/build-file-coverage-skill.mjs';
import { buildLedgerFormatSkill } from '../evaluation/prototypes/build-ledger-format-skill.mjs';
import { prepareFileCoverageComparison } from '../evaluation/prototypes/prepare-file-coverage-comparison.mjs';
import { prepareFileCoverageQuickReplacement, verifyBoundedReadDelivery } from '../evaluation/prototypes/prepare-file-coverage-quick-replacement.mjs';
import { prepareLedgerFormatQuick } from '../evaluation/prototypes/prepare-ledger-format-quick.mjs';
import { prepareLedgerFormatDeep } from '../evaluation/prototypes/prepare-ledger-format-deep.mjs';
import { prepareLedgerFormatDeepIsolated, verifyLedgerFormatDeepIsolated } from '../evaluation/prototypes/prepare-ledger-format-deep-isolated.mjs';
import { verifyBoundedReviewMaterials } from '../evaluation/prototypes/bounded-review-materials.mjs';
import { rootDir } from './test-utils';

const temporary = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'fe-format-deep-isolated-')));
const sha = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const previousCandidate = buildFileCoverageSkill(path.join(temporary, 'file-candidate'));
const original = prepareFileCoverageComparison({ output: path.join(temporary, 'original'), candidateBundle: previousCandidate.output });
const previous = prepareFileCoverageQuickReplacement({ output: path.join(temporary, 'replacement'), previousMaterials: original.output, previousFreezeSha256: original.freezeSha256 });
const candidate = buildLedgerFormatSkill(path.join(temporary, 'format-candidate'));
const quickContext = { candidateBundle: candidate.output, previousMaterials: previous.output, originalMaterials: original.output };
const quick = prepareLedgerFormatQuick({ output: path.join(temporary, 'quick'), ...quickContext,
  previousFreezeSha256: previous.freezeSha256, candidateManifestSha256: sha(fs.readFileSync(path.join(candidate.output, 'manifest.json'))) });
const deepContext = { ...quickContext, quickMaterials: quick.output };
const deep = prepareLedgerFormatDeep({ output: path.join(temporary, 'deep'), ...deepContext, quickFreezeSha256: quick.freezeSha256 });
const parent = deep.output;
const context = { ...deepContext, deepMaterials: parent };
const snapshot = (root: string): any[] => fs.readdirSync(root, { withFileTypes: true }).flatMap(entry => entry.isDirectory()
  ? snapshot(path.join(root, entry.name)) : [{ path: path.join(root, entry.name), sha256: sha(fs.readFileSync(path.join(root, entry.name))) }]);
const parentBefore = snapshot(parent);
const prepare = (output: string, overrides: any = {}) => prepareLedgerFormatDeepIsolated({ output, deepFreezeSha256: deep.freezeSha256, ...context, ...overrides });
const prepared = prepare(path.join(temporary, 'window'));
const read = (name: string) => fs.readFileSync(path.join(prepared.output, name));
const resign = (output: string, mutate: (freeze: any) => void) => {
  const filename = path.join(output, 'control/freeze.json');
  const freeze = JSON.parse(fs.readFileSync(filename, 'utf8'));
  mutate(freeze);
  const bytes = Buffer.from(JSON.stringify(freeze, null, 2) + '\n');
  fs.writeFileSync(filename, bytes);
  return sha(bytes);
};
afterAll(() => fs.rmSync(temporary, { recursive: true, force: true }));

describe('projectless Deep isolation preparation', () => {
  test('freezes a new window without changing the parent Deep material', () => {
    expect(verifyLedgerFormatDeepIsolated(prepared.output, prepared.freezeSha256, context)).toMatchObject({ status: 'Offline Pass', environment: 'projectless', files: 5, reads: 4, modelInvocations: 0, executionAuthorized: false });
    expect(prepared.manifest).toMatchObject({ kind: 'offline-ledger-format-deep-projectless-isolation', parentDeepFreezeSha256: deep.freezeSha256 });
    expect(JSON.parse(read('control/plan.json').toString())).toMatchObject({ clientProposal: { executionEnvironment: 'projectless', directoryName: 'fe-code-review-deep-isolated-01' }, isolationContract: { workingDirectory: path.join(prepared.output, 'workspace'), firstAllowedRead: 'materials.json' } });
    expect(snapshot(parent)).toEqual(parentBefore);
  });

  test('uses a neutral instruction body and separates transport failure from declared evidence gaps', () => {
    const launch = read('control/launch.md').toString();
    const bootstrap = read('workspace/bootstrap.md').toString();
    expect(launch).toContain('不要调用、加载或搜索任何本地已安装 Skill');
    expect(launch).toContain('材料包中的 skill/SKILL.md');
    expect(bootstrap).not.toMatch(/fe-code-review|\/Users\/|\.agents|\.codex/u);
    expect(launch).toContain('materials.json');
    expect(launch).toContain('三个 JSON 文件');
    expect(launch).toContain('manifest 列出的批次/segments 缺失、截断');
    expect(launch).toContain('这属于审查证据缺口，不属于交付失败');
    expect(bootstrap).not.toMatch(/FC-D-001|Cannot Verify|零问题|暂不建议|oracle|session/u);
    expect(launch).not.toContain('任何工具失败、内容缺失或截断');
  });

  test('replays the four reads using the launch cwd even when the caller has no materials', () => {
    const defaultCwd = path.join(temporary, 'empty-projectless');
    fs.mkdirSync(defaultCwd);
    const launchCwd = JSON.parse(read('control/launch.md').toString().split('\n')[0].split('：')[1]);
    expect(launchCwd).toBe(path.join(prepared.output, 'workspace'));
    expect(fs.existsSync(path.join(defaultCwd, 'materials.json'))).toBe(false);
    const script = 'process.stdout.write(require("node:child_process").execFileSync("/bin/cat", [process.argv[2]], {cwd:process.argv[1]}));';
    const receipts = prepared.manifest.run.reads.map((pin: any) => ({ id: pin.id, output: execFileSync(process.execPath, ['-e', script, launchCwd, pin.path], { cwd: defaultCwd, encoding: 'utf8' }) }));
    expect(verifyBoundedReadDelivery(prepared.manifest.run.reads, receipts).status).toBe('Pass');
    expect(verifyBoundedReviewMaterials(JSON.parse(receipts[0].output), receipts.slice(1).map((receipt: any) => receipt.output))).toMatchObject({ status: 'Pass', files: 9, batches: 3 });
  });

  test('keeps the same five workspace files, four bounded reads and exact evidence bytes', () => {
    const oldFreeze = JSON.parse(fs.readFileSync(path.join(parent, 'control/freeze.json'), 'utf8'));
    expect(prepared.manifest.run.filePins.filter((pin: any) => pin.path !== 'bootstrap.md')).toEqual(oldFreeze.run.filePins.filter((pin: any) => pin.path !== 'bootstrap.md'));
    expect(prepared.manifest.run.filePins.find((pin: any) => pin.path === 'bootstrap.md').sha256).not.toBe(oldFreeze.run.filePins.find((pin: any) => pin.path === 'bootstrap.md').sha256);
    expect(prepared.manifest.run.reads).toEqual(oldFreeze.run.reads);
    expect(prepared.manifest.run.originalContentBytes).toBe(oldFreeze.run.originalContentBytes);
    expect(prepared.manifest.run.toolPayloadBytes).toBe(oldFreeze.run.toolPayloadBytes);
    expect(prepared.manifest.run.startupBytes).toBe(fs.readFileSync(path.join(prepared.output, 'control/launch.md')).length);
    expect(prepared.manifest.run.totalTransferredContentBytes).toBe(prepared.manifest.run.toolPayloadBytes + prepared.manifest.run.startupBytes);
    expect(prepared.manifest.run.bootstrapSha256).toBe(sha(read('workspace/bootstrap.md')));
    expect(prepared.manifest.run.launchSha256).toBe(sha(read('control/launch.md')));
    for (const name of ['control/oracle.json', 'control/candidate-manifest.json']) expect(read(name)).toEqual(fs.readFileSync(path.join(parent, name)));
    expect(prepared.manifest.inputs).toContainEqual(expect.objectContaining({ path: 'evaluation/prototypes/prepare-ledger-format-deep-isolated.mjs', sha256: sha(fs.readFileSync(path.join(rootDir, 'evaluation/prototypes/prepare-ledger-format-deep-isolated.mjs'))) }));
  });

  test.each(['overwrite', 'formal', 'parent'] as const)('rejects %s destination', kind => {
    const destinations: Record<string, string> = { overwrite: prepared.output, formal: path.join(rootDir, 'skills/blocked-isolated'), parent: path.join(parent, 'blocked-isolated') };
    expect(() => prepare(destinations[kind])).toThrow();
  });

  test.each(['bootstrapSha256', 'launchSha256', 'startupBytes', 'totalTransferredContentBytes', 'toolPayloadBytes'] as const)('rejects inconsistent %s even with a recomputed freeze digest', field => {
    const changed = prepare(path.join(temporary, 'accounting-' + field));
    const digest = resign(changed.output, freeze => { freeze.run[field] = typeof freeze.run[field] === 'string' ? '0'.repeat(64) : freeze.run[field] + 1; });
    expect(() => verifyLedgerFormatDeepIsolated(changed.output, digest, context)).toThrow(/hash mismatch|accounting mismatch/u);
  });

  test.each(['missing', 'changed'] as const)('rejects %s recipe provenance', kind => {
    const changed = prepare(path.join(temporary, 'recipe-' + kind));
    const digest = resign(changed.output, freeze => {
      if (kind === 'missing') freeze.inputs.pop();
      else freeze.inputs[freeze.inputs.length - 1].sha256 = '0'.repeat(64);
    });
    expect(() => verifyLedgerFormatDeepIsolated(changed.output, digest, context)).toThrow('recipe inputs');
  });

  test.each(['batch', 'manifest', 'startup', 'launch', 'oracle', 'extra', 'missing', 'symlink'] as const)('rejects %s material drift', kind => {
    const changed = prepare(path.join(temporary, 'drift-' + kind));
    const targets = { batch: 'workspace/batches/01.json', manifest: 'workspace/materials.json', startup: 'workspace/bootstrap.md', launch: 'control/launch.md', oracle: 'control/oracle.json', extra: 'workspace/extra.txt', missing: 'workspace/batches/01.json', symlink: 'workspace/batches/01.json' };
    const filename = path.join(changed.output, targets[kind]);
    if (kind === 'missing' || kind === 'symlink') fs.unlinkSync(filename);
    if (kind === 'symlink') fs.symlinkSync(path.join(prepared.output, targets[kind]), filename);
    else if (kind !== 'missing') fs.appendFileSync(filename, '\n');
    expect(() => verifyLedgerFormatDeepIsolated(changed.output, changed.freezeSha256, context)).toThrow();
  });

  test('rejects relocation without a newly prepared launch and freeze', () => {
    const copy = path.join(temporary, 'relocated');
    fs.cpSync(prepared.output, copy, { recursive: true });
    expect(() => verifyLedgerFormatDeepIsolated(copy, prepared.freezeSha256, context)).toThrow('working directory');
  });

  test('requires independent digests and a valid window identity', () => {
    expect(() => verifyLedgerFormatDeepIsolated(prepared.output, undefined, context)).toThrow('digest');
    expect(() => prepare(path.join(temporary, 'invalid-window'), { windowId: '../escape' })).toThrow('window ID');
    expect(() => prepare(path.join(temporary, 'invalid-parent'), { deepFreezeSha256: '0'.repeat(64) })).toThrow('digest');
    expect(snapshot(parent)).toEqual(parentBefore);
  });
});
