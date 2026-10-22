import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, test } from 'vitest';
import { buildFileCoverageSkill } from '../evaluation/prototypes/build-file-coverage-skill.mjs';
import { buildLedgerFormatSkill } from '../evaluation/prototypes/build-ledger-format-skill.mjs';
import { prepareFileCoverageComparison } from '../evaluation/prototypes/prepare-file-coverage-comparison.mjs';
import { prepareFileCoverageQuickReplacement, verifyBoundedReadDelivery } from '../evaluation/prototypes/prepare-file-coverage-quick-replacement.mjs';
import { prepareLedgerFormatQuick, verifyLedgerFormatQuick } from '../evaluation/prototypes/prepare-ledger-format-quick.mjs';
import { prepareLedgerFormatDeep, verifyLedgerFormatDeep } from '../evaluation/prototypes/prepare-ledger-format-deep.mjs';
import { verifyBoundedReviewMaterials } from '../evaluation/prototypes/bounded-review-materials.mjs';
import { rootDir } from './test-utils';

const temporary = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'fe-format-deep-')));
const sha = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const previousCandidate = buildFileCoverageSkill(path.join(temporary, 'file-candidate'));
const original = prepareFileCoverageComparison({ output: path.join(temporary, 'original'), candidateBundle: previousCandidate.output });
const previous = prepareFileCoverageQuickReplacement({ output: path.join(temporary, 'replacement'), previousMaterials: original.output, previousFreezeSha256: original.freezeSha256 });
const candidate = buildLedgerFormatSkill(path.join(temporary, 'format-candidate'));
const quickContext = { candidateBundle: candidate.output, previousMaterials: previous.output, originalMaterials: original.output };
const quick = prepareLedgerFormatQuick({ output: path.join(temporary, 'quick'), ...quickContext,
  previousFreezeSha256: previous.freezeSha256, candidateManifestSha256: sha(fs.readFileSync(path.join(candidate.output, 'manifest.json'))) });
const context = { ...quickContext, quickMaterials: quick.output };
const prepare = (output: string, overrides: any = {}) => prepareLedgerFormatDeep({ output, ...context, quickFreezeSha256: quick.freezeSha256, ...overrides });
const prepared = prepare(path.join(temporary, 'deep'));
const read = (name: string) => fs.readFileSync(path.join(prepared.output, name), 'utf8');
const json = (name: string) => JSON.parse(read(name));
const receipts = () => prepared.manifest.run.reads.map((pin: any) => ({ id: pin.id, output: read('workspace/' + pin.path) }));
const material = json('workspace/materials.json');
const outputs = material.batches.map((pin: any) => read('workspace/' + pin.path));
const recovered = new Map<string, string>();
for (const output of outputs) for (const segment of JSON.parse(output).segments) recovered.set(segment.path, (recovered.get(segment.path) ?? '') + segment.content);
afterAll(() => fs.rmSync(temporary, { recursive: true, force: true }));

describe('format-only Deep frozen preparation', () => {
  test('prepares one unexecuted Deep window with the unchanged Quick candidate and history', () => {
    expect(verifyLedgerFormatDeep(prepared.output, prepared.freezeSha256, context)).toMatchObject({ status: 'Offline Pass', files: 5, reads: 4, modelInvocations: 0, executionAuthorized: false, reportAcceptance: 'Not Evaluated' });
    expect(verifyLedgerFormatQuick(quick.output, quick.freezeSha256, quickContext).status).toBe('Offline Pass');
    expect(prepared.manifest).toMatchObject({ quickFreezeSha256: quick.freezeSha256, sourceTransmitted: false, runtimeReady: false });
    expect(prepared.manifest.run).toMatchObject({ caseId: 'FC-D-001', mode: 'deep', status: 'Not Run' });
    expect(json('control/plan.json')).toMatchObject({ maxSourceBearingRuns: 1, maxAttemptsPerRun: 1, executionAuthorized: false, runtimeReady: false });
    expect(read('control/candidate-manifest.json')).toBe(fs.readFileSync(path.join(quick.output, 'control/candidate-manifest.json'), 'utf8'));
  });

  test('reconstructs nine exact files including Deep and release-risk, without Quick or Fix instructions', () => {
    expect(verifyBoundedReviewMaterials(material, outputs)).toMatchObject({ files: 9, batches: 3, status: 'Pass' });
    const sourceRun = original.manifest.runs.find((run: any) => run.id === prepared.manifest.sourceRunId);
    expect(sourceRun).toMatchObject({ mode: 'deep', variant: 'stable', caseId: 'FC-D-001' });
    for (const [name, text] of recovered) {
      const expected = name.startsWith('skill/')
        ? path.join(candidate.output, 'fe-code-review', name.slice(6))
        : path.join(original.output, sourceRun.workspace, name);
      expect(text).toBe(fs.readFileSync(expected, 'utf8'));
    }
    expect([...recovered.keys()].filter(name => name.startsWith('skill/'))).toEqual([
      'skill/SKILL.md', 'skill/references/deep-review.md', 'skill/references/javascript.md', 'skill/references/release-risk.md'
    ]);
  });

  test('retains the missing target implementation as an evidence gap, not a deletion or invented source', () => {
    const packet = JSON.parse(recovered.get('packet/packet.json')!);
    expect(packet.inventory.files.map((file: any) => file.path)).toEqual(['src/auth/session.mjs', 'src/profile.mjs']);
    expect(packet.snapshots[0]).toMatchObject({ path: 'src/auth/session.mjs', after: null });
    expect(packet.snapshots[0].absence).toContain('changed, not deleted');
    expect([...recovered.keys()].filter(name => /\/src\//u.test(name))).toHaveLength(3);
    expect([...recovered.keys()].some(name => name.endsWith('after/src/auth/session.mjs'))).toBe(false);
    expect(recovered.get('packet/context.md')).toContain('session 的目标源码缺失');
    expect(recovered.get('packet/context.md')).toContain('未提供运行记录');
  });

  test('preserves every semantic oracle field except the two unrelated file-feature fields', () => {
    const prior = JSON.parse(fs.readFileSync(path.join(original.output, 'control/oracles.json'), 'utf8'));
    const current = json('control/oracle.json');
    const { candidateFileCoverage, stableComparison, ...expected } = prior.cases['FC-D-001'];
    expect(current.cases).toEqual({ 'FC-D-001': expected });
    expect(current.common).toEqual(prior.common);
    expect(current.excludedParentFields).toEqual(['candidateFileCoverage', 'stableComparison']);
    expect(expected).toMatchObject({ findingCount: 0, findings: [], design: 'Cannot Verify', recommendation: '暂不建议进入下一步' });
    expect(expected.requiredPrerequisite).toContain('Do not fabricate a defect');
    expect(expected.fileEvidence.map((entry: any) => entry.state)).toEqual(['Cannot Verify', 'Reviewed']);
    expect(json('control/plan.json').qualityGates).toEqual(JSON.parse(fs.readFileSync(path.join(quick.output, 'control/plan.json'), 'utf8')).qualityGates);
  });

  test('changes startup only for the selected mode and required reference names, without evaluator answers', () => {
    const expected = fs.readFileSync(path.join(quick.output, 'workspace/bootstrap.md'), 'utf8')
      .replace('执行一次 Quick Review', '执行一次 Deep Review')
      .replace('唯一 Quick reference 和 JavaScript reference', '唯一 Deep reference、JavaScript reference 和 release-risk reference');
    expect(read('workspace/bootstrap.md')).toBe(expected);
    expect(expected).not.toMatch(/FC-D-001|Cannot Verify|零问题|暂不建议|900|oracle|Coverage|session/u);
    expect(material.files.some((pin: any) => /oracle|control|history|report|repair/u.test(pin.path))).toBe(false);
    expect(prepared.manifest.run.filePins.map((pin: any) => pin.path)).toEqual(['materials.json', 'batches/01.json', 'batches/02.json', 'batches/03.json', 'bootstrap.md']);
  });

  test('accounts for four bounded reads plus the startup exactly once', () => {
    const run = prepared.manifest.run;
    expect(run.reads.map((pin: any) => pin.path)).toEqual(['materials.json', 'batches/01.json', 'batches/02.json', 'batches/03.json']);
    expect(run.reads.every((pin: any) => pin.bytes <= 20000)).toBe(true);
    expect(run.originalContentBytes).toBe([...recovered.values()].reduce((sum, text) => sum + Buffer.byteLength(text), 0));
    expect(run.toolPayloadBytes).toBe(run.reads.reduce((sum: number, pin: any) => sum + pin.bytes, 0));
    const launch = read(run.launchPath);
    expect(launch).toBe(`本次唯一工作目录：${path.join(prepared.output, 'workspace')}\n\n${read('workspace/bootstrap.md')}`);
    expect(run.launchSha256).toBe(sha(Buffer.from(launch)));
    expect(run.startupBytes).toBe(Buffer.byteLength(launch));
    expect(run.totalTransferredContentBytes).toBe(run.toolPayloadBytes + run.startupBytes);
    expect(verifyBoundedReadDelivery(run.reads, receipts()).status).toBe('Pass');
  });

  test('retains the original 900-second Deep ceiling, no-retry policy and limited acceptance claims', () => {
    const plan = json('control/plan.json');
    expect(plan.elapsed.acceptanceCeilingMs).toBe(900000);
    expect(plan.elapsed.acceptanceCeilingMs).toBe(original.manifest.plan.costBudget.hardElapsedSecondsPerRun.deep * 1000);
    expect(plan.elapsed.enforcement).toContain('automatic cancellation unavailable');
    expect(plan.elapsed.overrun).toContain('No-Go');
    expect(plan.stopPolicy).toContain('No retry, replacement, follow-up');
    expect(plan.costAcceptance).toContain('Not Evaluated');
    expect(plan.selectionReason).toContain('Repeated finding IDs were exercised by Quick and are not exercised here');
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
    expect(() => verifyLedgerFormatDeep(copy, prepared.freezeSha256, context)).toThrow();
  });

  test('requires independent hashes and rejects overwrite, historical and aliased formal destinations', () => {
    expect(() => verifyLedgerFormatDeep(prepared.output, undefined, context)).toThrow('digest');
    expect(() => verifyLedgerFormatDeep(prepared.output, '0'.repeat(64), context)).toThrow('digest');
    expect(() => prepare(path.join(temporary, 'bad-quick'), { quickFreezeSha256: '0'.repeat(64) })).toThrow('digest');
    expect(() => prepare(prepared.output)).toThrow('already exists');
    for (const directory of [quick.output, candidate.output, previous.output, original.output, path.join(rootDir, 'skills')]) expect(() => prepare(path.join(directory, 'blocked'))).toThrow('overlaps');
    const alias = path.join(temporary, 'formal-alias');
    fs.symlinkSync(path.join(rootDir, 'skills'), alias);
    expect(() => prepare(path.join(alias, 'blocked'))).toThrow('overlaps');
  });

  test.each(['candidateBundle', 'quickMaterials', 'previousMaterials', 'originalMaterials'] as const)('rejects %s drift without rewriting upstream freezes', key => {
    const copy = path.join(temporary, 'input-' + key);
    fs.cpSync(context[key], copy, { recursive: true });
    const file = key === 'candidateBundle' ? 'fe-code-review/SKILL.md' : 'control/plan.json';
    fs.appendFileSync(path.join(copy, file), '\n');
    expect(() => prepare(path.join(temporary, 'rejected-' + key), { [key]: copy })).toThrow();
    expect(() => verifyLedgerFormatDeep(prepared.output, prepared.freezeSha256, { ...context, [key]: copy })).toThrow();
    expect(verifyLedgerFormatQuick(quick.output, quick.freezeSha256, quickContext).status).toBe('Offline Pass');
  });
});
