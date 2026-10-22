import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, test } from 'vitest';
import { buildFileCoverageSkill } from '../evaluation/prototypes/build-file-coverage-skill.mjs';
import { fileCoverageRuntimeFixtures } from '../evaluation/prototypes/file-coverage/runtime-fixtures.mjs';
import { prepareFileCoverageComparison, verifyFileCoverageComparison } from '../evaluation/prototypes/prepare-file-coverage-comparison.mjs';
import { validateFileCoverage } from '../evaluation/prototypes/file-coverage.mjs';
import { readText, rootDir } from './test-utils';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fe-file-coverage-comparison-'));
const candidate = buildFileCoverageSkill(path.join(root, 'candidate'));
const fixtureList = fileCoverageRuntimeFixtures();
const oracles = JSON.parse(readText('evaluation/prototypes/file-coverage/runtime-oracles.json'));
const prepared = prepareFileCoverageComparison({ output: path.join(root, 'comparison'), candidateBundle: candidate.output });
const read = (relative: string) => fs.readFileSync(path.join(prepared.output, relative), 'utf8');
const loadModule = (source: string): Promise<any> => import(/* @vite-ignore */ 'data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
afterAll(() => fs.rmSync(root, { recursive: true, force: true }));

describe('frozen public file-coverage comparison preparation', () => {
  test('prepares six independent source packets without Git, executions or oracle delivery', () => {
    expect(verifyFileCoverageComparison(prepared.output, prepared.freezeSha256)).toMatchObject({ status: 'Pass', runs: 6, modelInvocations: 0, executionAuthorized: false });
    expect(prepared.manifest.runs.map((run: any) => run.id)).toEqual([
      '01-quick-stable', '02-quick-candidate', '03-deep-candidate', '04-deep-stable', '05-fix-stable', '06-fix-candidate',
    ]);
    for (const run of prepared.manifest.runs) {
      expect(fs.existsSync(path.join(prepared.output, run.workspace, '.git'))).toBe(false);
      const files = run.filePins.map((pin: any) => pin.path);
      expect(files.filter((name: string) => /(?:oracle|control|runtime-plan|runtime-fixtures|history|report|collector)/u.test(name))).toEqual([]);
      expect(files.filter((name: string) => /^skill\/references\/.*-review\.md$/u.test(name))).toEqual([`skill/references/${run.mode}-review.md`]);
      expect(files).toContain('skill/references/javascript.md');
      expect(files.includes('skill/references/release-risk.md')).toBe(run.mode === 'deep');
      const material = JSON.parse(read(run.workspace + '/materials.json'));
      expect([...material.files.map((pin: any) => pin.path), 'materials.json'].sort()).toEqual(files.sort());
      expect(material.files.map((pin: any) => read(run.workspace + '/' + pin.path)).join('\n')).not.toContain('neverDeliverToReviewer');
      expect(run.status).toBe('Not Run');
    }
  });

  test.each(['FC-Q-001', 'FC-D-001', 'FC-F-001'])('keeps %s source, bootstrap and selected references identical except candidate instructions', id => {
    const pair = prepared.manifest.runs.filter((run: any) => run.caseId === id);
    expect(pair[0].packetSha256).toBe(pair[1].packetSha256);
    expect(pair[0].bootstrapSha256).toBe(pair[1].bootstrapSha256);
    const stable = pair.find((run: any) => run.variant === 'stable');
    const current = pair.find((run: any) => run.variant === 'candidate');
    const expectedDelta = stable.mode === 'quick' ? 7021 : stable.mode === 'deep' ? 7029 : 6482;
    expect(current.selectedInstructionBytes - stable.selectedInstructionBytes).toBe(expectedDelta);
    expect(read(stable.workspace + '/skill/references/javascript.md')).toBe(read(current.workspace + '/skill/references/javascript.md'));
    if (stable.mode === 'fix') expect(read(stable.workspace + '/skill/references/fix-review.md')).toBe(read(current.workspace + '/skill/references/fix-review.md'));
  });

  test.each(fixtureList)('keeps $id snapshots aligned with logical inventory and explicit missing/deleted material', fixture => {
    expect(fixture.inventory.complete).toBe(true);
    expect(fixture.packet.snapshots.map((item: any) => item.path)).toEqual(fixture.inventory.files.map((item: any) => item.path));
    const used = new Set(['context.md', ...fixture.packet.support]);
    for (const snapshot of fixture.packet.snapshots) {
      for (const role of ['original', 'before', 'index', 'after']) {
        if (!(role in snapshot)) continue;
        const material = (snapshot as any)[role];
        if (material === null) expect((snapshot as any).absence).toBeTruthy();
        else {
          expect(Object.hasOwn(fixture.files, material)).toBe(true);
          used.add(material);
        }
      }
    }
    expect([...used].sort()).toEqual(Object.keys(fixture.files).sort());
    if (fixture.mode === 'fix') return;
    const oracle = oracles.cases[fixture.id];
    const accounting = {
      mode: fixture.mode, scopeKey: fixture.inventory.scopeKey, baseline: fixture.inventory.baseline,
      summary: { ...oracle.candidateFileCoverage, fullyReviewed: fixture.mode === 'quick' },
      entries: oracle.fileEvidence.map((item: any) => ({ path: item.path, state: item.state,
        reviewedLayers: item.state === 'Reviewed' ? item.layers : [],
        ...(item.state === 'Reviewed' ? { evidence: item.requires } : { remaining: item.requires }) })),
    };
    expect(validateFileCoverage(fixture.inventory, accounting).valid).toBe(true);
  });

  test('models one changed file with two layers, a rename, generation and an actual deletion', () => {
    const quick = fixtureList[0];
    expect(quick.inventory.files).toHaveLength(4);
    expect(quick.inventory.files[0].layers).toEqual(['staged', 'unstaged']);
    expect(quick.inventory.files[1]).toMatchObject({ path: 'src/label.mjs', oldPath: 'src/name.mjs' });
    expect(quick.inventory.files[3].status).toBe('D ');
    expect(quick.packet.snapshots[3].after).toBeNull();
    expect(quick.packet.snapshots[3].absence).toContain('Deleted');
  });

  test('retains a complete Deep inventory with the critical target genuinely undelivered', () => {
    const deep = fixtureList[1];
    expect(deep.inventory.files).toHaveLength(2);
    expect(deep.inventory.files[0].status).toBe(' M');
    expect(deep.packet.snapshots[0].after).toBeNull();
    expect(deep.files['after/src/auth/session.mjs']).toBeUndefined();
    for (const run of prepared.manifest.runs.filter((item: any) => item.mode === 'deep')) {
      expect(fs.existsSync(path.join(prepared.output, run.workspace, 'packet/after/src/auth/session.mjs'))).toBe(false);
    }
    expect(oracles.cases['FC-D-001'].findingCount).toBe(0);
  });

  test.each([
    ['https://example.invalid', 'profile?view=compact', false],
    ['https://example.invalid/', '/profile?view=compact', false],
    ['https://example.invalid/', 'profile?view=compact', true],
    ['https://example.invalid', '/profile?view=compact', true],
  ] as const)('executes authored URL snapshots for supported slash pair %#', async (base, route, problemCorrect) => {
    const quick = fixtureList[0];
    const fix = fixtureList[2];
    const expected = 'https://example.invalid/profile?view=compact';
    for (const source of [quick.files['before/src/url.mjs'], quick.files['index/src/url.mjs'], fix.files['after/src/url.mjs']]) {
      expect((await loadModule(source)).requestUrl(base, route)).toBe(expected);
    }
    expect((await loadModule(quick.files['after/src/url.mjs'])).requestUrl(base, route) === expected).toBe(problemCorrect);
    expect(fix.files['before/src/url.mjs']).toBe(quick.files['after/src/url.mjs']);
    expect(fix.files['original/src/url.mjs']).toBe(quick.files['before/src/url.mjs']);
  });

  test('checks rename bytes and generated output against its supplied producer', async () => {
    const quick = fixtureList[0];
    expect(quick.files['before/src/name.mjs']).toBe(quick.files['after/src/label.mjs']);
    const { displayName } = await loadModule(quick.files['after/src/label.mjs']);
    expect(displayName({ displayName: ' Ada ', username: 'ada' })).toBe('Ada');
    expect(displayName({ displayName: ' ', username: ' ada ' })).toBe('ada');
    expect(displayName({ displayName: '', username: '' })).toBe('Anonymous');
    const generator = await loadModule(quick.files['support/path-generator.mjs']);
    const generated = await loadModule(quick.files['after/src/generated-path.mjs']);
    expect(generated.profilePath).toBe(generator.generateProfilePath());
  });

  test('freezes strict cost and stop gates without preauthorizing execution', () => {
    const plan = prepared.manifest.plan;
    expect(plan.executionAuthorized).toBe(false);
    expect(plan.maxSourceBearingRuns).toBe(6);
    expect(plan.maxAttemptsPerRun).toBe(1);
    expect(plan.costBudget.maxCandidateToStableRatioPerPair).toEqual({ totalReportedInputPlusOutputTokens: 1, elapsedMilliseconds: 1, toolCalls: 1 });
    expect(plan.costBudget.missingOrIncomparableTelemetry).toContain('hold cost acceptance');
    expect(plan.stopPolicy).toContain('no automatic retry');
  });

  test('rejects overwrite, formal-tree output and candidate input drift before creating output', () => {
    expect(() => prepareFileCoverageComparison({ output: prepared.output, candidateBundle: candidate.output })).toThrow();
    expect(() => prepareFileCoverageComparison({ output: path.join(rootDir, 'skills/blocked-comparison'), candidateBundle: candidate.output })).toThrow('outside formal');
    const drift = path.join(root, 'drift-candidate');
    fs.cpSync(candidate.output, drift, { recursive: true });
    fs.appendFileSync(path.join(drift, 'fe-code-review/SKILL.md'), '\nmodified\n');
    const output = path.join(root, 'must-not-exist');
    expect(() => prepareFileCoverageComparison({ output, candidateBundle: drift })).toThrow('Frozen input changed');
    expect(fs.existsSync(output)).toBe(false);
  });

  test.each(['source', 'extra-file', 'oracle', 'manifest', 'symlink'] as const)('detects post-preparation %s changes', kind => {
    const copy = path.join(root, 'changed-' + kind);
    fs.cpSync(prepared.output, copy, { recursive: true });
    const run = prepared.manifest.runs[0];
    const target = path.join(copy, run.workspace, 'packet/after/src/url.mjs');
    if (kind === 'source') fs.appendFileSync(target, '\nchanged\n');
    if (kind === 'extra-file') fs.writeFileSync(path.join(copy, run.workspace, 'oracle.json'), '{}');
    if (kind === 'oracle') fs.appendFileSync(path.join(copy, 'control/oracles.json'), '\n');
    if (kind === 'manifest') fs.appendFileSync(path.join(copy, 'control/freeze.json'), '\n');
    if (kind === 'symlink') { fs.unlinkSync(target); fs.symlinkSync(path.join(prepared.output, run.workspace, 'packet/after/src/url.mjs'), target); }
    expect(() => verifyFileCoverageComparison(copy, prepared.freezeSha256)).toThrow();
  });

  test('requires an independent receipt digest rather than trusting a self-rewritten manifest', () => {
    expect(() => verifyFileCoverageComparison(prepared.output)).toThrow('Independent freeze digest');
    expect(() => verifyFileCoverageComparison(prepared.output, '0'.repeat(64))).toThrow('Independent freeze digest');
  });
});
