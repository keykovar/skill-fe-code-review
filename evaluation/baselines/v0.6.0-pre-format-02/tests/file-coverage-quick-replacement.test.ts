import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, test } from 'vitest';
import { buildFileCoverageSkill } from '../evaluation/prototypes/build-file-coverage-skill.mjs';
import { prepareFileCoverageComparison, verifyFileCoverageComparison } from '../evaluation/prototypes/prepare-file-coverage-comparison.mjs';
import { fileCoverageRuntimeFixtures } from '../evaluation/prototypes/file-coverage/runtime-fixtures.mjs';
import { pairedReadRanges, prepareFileCoverageQuickReplacement, verifyBoundedReadDelivery, verifyFileCoverageQuickReplacement } from '../evaluation/prototypes/prepare-file-coverage-quick-replacement.mjs';
import { validateReviewOutput } from '../scripts/validate-review-output.mjs';
import { readText, rootDir } from './test-utils';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fe-quick-replacement-'));
const candidate = buildFileCoverageSkill(path.join(root, 'candidate'));
const previous = prepareFileCoverageComparison({ output: path.join(root, 'previous'), candidateBundle: candidate.output });
const prepare = (output: string) => prepareFileCoverageQuickReplacement({ output, previousMaterials: previous.output, previousFreezeSha256: previous.freezeSha256 });
const prepared = prepare(path.join(root, 'replacement'));
const json = (relative: string) => JSON.parse(fs.readFileSync(path.join(prepared.output, relative), 'utf8'));
const sha = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
const physicalLines = (text: string) => text.match(/[^\n]*\n|[^\n]+$/gu) ?? [];
const source = fileCoverageRuntimeFixtures()[0].files;
const load = (text: string): Promise<any> => import(/* @vite-ignore */ 'data:text/javascript;base64,' + Buffer.from(text).toString('base64'));
const receipts = (run: any) => run.reads.map((pin: any) => ({ id: pin.id, output: physicalLines(fs.readFileSync(path.join(prepared.output, run.workspace, pin.path), 'utf8')).slice(pin.start - 1, pin.end).join('') }));
afterAll(() => fs.rmSync(root, { recursive: true, force: true }));

describe('Quick replacement oracle and delivery', () => {
  test('preserves historical preparation and only prepares a new Quick pair', () => {
    expect(verifyFileCoverageComparison(previous.output, previous.freezeSha256)).toMatchObject({ status: 'Pass', runs: 6 });
    expect(verifyFileCoverageQuickReplacement(prepared.output, prepared.freezeSha256, previous.output)).toMatchObject({ status: 'Offline Pass', runs: 2, modelInvocations: 0, executionAuthorized: false, runtimeDelivery: 'Not Evaluated' });
    expect(JSON.parse(fs.readFileSync(path.join(previous.output, 'control/oracles.json'), 'utf8')).cases['FC-Q-001'].findingCount).toBe(1);
    expect(json('control/oracles.json').cases['FC-Q-001'].findingCount).toBe(2);
    expect(Object.keys(json('control/oracles.json').cases)).toEqual(['FC-Q-001']);
    expect(prepared.manifest.runs.map((run: any) => [run.mode, run.variant, run.status])).toEqual([['quick', 'stable', 'Not Run'], ['quick', 'candidate', 'Not Run']]);
  });

  test.each(['', '?tab=info&sort=name'])( 'proves independent repairs over all four slash combinations with query %s', async query => {
    const { requestUrl: baseline } = await load(source['before/src/url.mjs']);
    const { requestUrl: problem } = await load(source['after/src/url.mjs']);
    const { profileUrl } = await load(source['support/profile-caller.mjs']);
    const missingOnly = (base: string, route: string) => base + (!base.endsWith('/') && !route.startsWith('/') ? '/' : '') + route;
    const duplicateOnly = (base: string, route: string) => base + (base.endsWith('/') && route.startsWith('/') ? route.slice(1) : route);
    const cases = [[false, false], [true, true], [true, false], [false, true]];
    const evaluate = (helper: any) => cases.map(([baseSlash, routeSlash]) => profileUrl(helper, 'https://example.test' + (baseSlash ? '/' : ''), (routeSlash ? '/' : '') + 'profile' + query) === 'https://example.test/profile' + query);
    expect(evaluate(baseline)).toEqual([true, true, true, true]);
    expect(evaluate(problem)).toEqual([false, false, true, true]);
    expect(evaluate(missingOnly)).toEqual([true, false, true, true]);
    expect(evaluate(duplicateOnly)).toEqual([false, true, true, true]);
  });

  test('freezes distinct acceptance conditions without prescribing tied finding IDs', () => {
    const oracle = json('control/oracles.json').cases['FC-Q-001'];
    expect(oracle.findings.map((finding: any) => finding.key)).toEqual(['url-missing-boundary-slash', 'url-duplicate-boundary-slash']);
    for (const finding of oracle.findings) expect(finding).toMatchObject({ path: 'src/url.mjs', line: 2, origin: 'New', severity: 'Risk', reproduction: 'Not Run' });
    expect(oracle.findings[0].acceptance).not.toBe(oracle.findings[1].acceptance);
    expect(oracle.findingIdentity).toContain('not a hard-coded assignment');
    expect(readText('skills/fe-code-review/SKILL.md')).toContain('If either can, split them.');
  });

  test('keeps every source and Skill byte identical to its parent and expected answers outside delivery', () => {
    for (const run of prepared.manifest.runs) {
      const parent = previous.manifest.runs.find((item: any) => item.id === run.id);
      expect(run.filePins).toHaveLength(17);
      for (const pin of run.filePins.filter((item: any) => !['bootstrap.md', 'materials.json'].includes(item.path))) {
        expect(pin.sha256).toBe(parent.filePins.find((item: any) => item.path === pin.path).sha256);
      }
      expect(run.filePins.some((pin: any) => /oracle|control|report|history|repair/u.test(pin.path))).toBe(false);
      const bootstrap = fs.readFileSync(path.join(prepared.output, run.workspace, 'bootstrap.md'), 'utf8');
      expect(bootstrap).not.toMatch(/F-00[12]|two findings|两项|缺失斜线|双斜线|ledger|格式提醒/u);
    }
    expect(prepared.manifest.runs[0].bootstrapSha256).toBe(prepared.manifest.runs[1].bootstrapSha256);
  });

  test('preserves unchanged quality/cost ceilings and no-retry stop policy', () => {
    const plan = json('control/plan.json');
    expect(plan.costBudget).toEqual(previous.manifest.plan.costBudget);
    expect(plan.stopPolicy).toBe(previous.manifest.plan.stopPolicy);
    expect(plan.maxSourceBearingRuns).toBe(2);
    expect(plan.maxAttemptsPerRun).toBe(1);
    expect(plan.executionAuthorized).toBe(false);
    expect(plan.runtimeReady).toBe(false);
    expect(plan.replacementReason).toContain('rendering failure remains unresolved');
  });

  test('plans identical per-file read counts with contiguous complete UTF-8 ranges', () => {
    const [stable, current] = prepared.manifest.runs;
    expect(stable.reads.length).toBe(current.reads.length);
    for (const run of [stable, current]) {
      const pins = json(run.workspace + '/materials.json').files;
      expect(pins.slice(0, 5).map((pin: any) => pin.path)).toEqual(['skill/SKILL.md', 'skill/references/quick-review.md', 'skill/references/javascript.md', 'packet/packet.json', 'packet/context.md']);
      expect(run.reads.every((pin: any) => pin.bytes <= 6000)).toBe(true);
      for (const pin of pins.filter((item: any) => item.delivery !== 'startup')) {
        const content = fs.readFileSync(path.join(prepared.output, run.workspace, pin.path), 'utf8');
        let next = 1;
        const reconstructed = pin.readRanges.map(([start, end]: number[]) => {
          expect(start).toBe(next);
          expect(end).toBeGreaterThanOrEqual(start);
          next = end + 1;
          return physicalLines(content).slice(start - 1, end).join('');
        }).join('');
        expect(reconstructed).toBe(content);
        const other = json((run === stable ? current : stable).workspace + '/materials.json');
        expect(pin.readRanges.length).toBe(other.files.find((item: any) => item.path === pin.path).readRanges.length);
      }
      expect(verifyBoundedReadDelivery(run.reads, receipts(run))).toMatchObject({ status: 'Pass', semanticStatus: 'Not Evaluated' });
    }
  });

  test('preserves multibyte lines and unterminated EOF', () => {
    const texts = [('中文'.repeat(300) + '\n').repeat(4) + 'EOF', ('English\n').repeat(1100) + '尾行'];
    const ranges = pairedReadRanges(...texts);
    expect(ranges[0].length).toBe(ranges[1].length);
    ranges.forEach((items: number[][], index: number) => {
      const parts = items.map(([start, end]) => physicalLines(texts[index]).slice(start - 1, end).join(''));
      expect(parts.every(part => Buffer.byteLength(part) <= 6000)).toBe(true);
      expect(parts.join('')).toBe(texts[index]);
    });
  });

  test.each(['missing', 'duplicate', 'order', 'truncated', 'native-wrapper', 'core-line-169'] as const)('rejects %s model-visible receipt corruption', kind => {
    const run = prepared.manifest.runs[0];
    const actual = receipts(run);
    if (kind === 'missing') actual.pop();
    if (kind === 'duplicate') actual.push(actual[0]);
    if (kind === 'order') [actual[1], actual[2]] = [actual[2], actual[1]];
    if (kind === 'truncated') actual[1].output = actual[1].output.slice(0, 50) + '...truncated...';
    if (kind === 'native-wrapper') actual[1].output = JSON.stringify(actual[1].output);
    if (kind === 'core-line-169') {
      const index = run.reads.findIndex((pin: any) => pin.path === 'skill/SKILL.md' && pin.start <= 169 && pin.end >= 169);
      const lines = physicalLines(actual[index].output);
      lines.splice(169 - run.reads[index].start, 1);
      actual[index].output = lines.join('');
    }
    expect(() => verifyBoundedReadDelivery(run.reads, actual)).toThrow();
  });

  test('retains the strict coverage-prose failure without editing a historical report', () => {
    const original = readText('examples/outputs/quick.zh-CN.md');
    expect(validateReviewOutput(original, 'quick', { profile: 'v0.6.0' }).valid).toBe(true);
    const changed = original.replace('## Changed-Condition Coverage：变更条件覆盖\n', '## Changed-Condition Coverage：变更条件覆盖\n\n以下内容为静态推演。\n');
    expect(changed).not.toBe(original);
    expect(validateReviewOutput(changed, 'quick', { profile: 'v0.6.0' }).errors).toEqual(expect.arrayContaining([expect.objectContaining({ type: 'coverage-ledger-unexpected-content' })]));
  });

  test('rejects unsafe or impossible preparation', () => {
    expect(() => prepare(prepared.output)).toThrow('already exists');
    expect(() => prepare(path.join(previous.output, 'nested'))).toThrow('historical');
    expect(() => prepare(path.join(rootDir, 'skills/blocked-replacement'))).toThrow('formal');
    expect(() => pairedReadRanges('x'.repeat(6001), 'ok\n')).toThrow('line exceeds');
    expect(() => pairedReadRanges('', 'ok\n')).toThrow('Empty');
    expect(() => pairedReadRanges('x', ('a'.repeat(3000) + '\n').repeat(3))).toThrow('equalize');
    expect(() => prepareFileCoverageQuickReplacement({ output: path.join(root, 'wrong-parent'), previousMaterials: previous.output, previousFreezeSha256: '0'.repeat(64) })).toThrow('digest');
  });

  test.each(['source', 'extra', 'control', 'symlink'] as const)('rejects post-freeze %s changes', kind => {
    const copy = path.join(root, 'changed-' + kind);
    fs.cpSync(prepared.output, copy, { recursive: true });
    const target = path.join(copy, prepared.manifest.runs[0].workspace, 'packet/after/src/url.mjs');
    if (kind === 'source') fs.appendFileSync(target, '\nchanged\n');
    if (kind === 'extra') fs.writeFileSync(path.join(path.dirname(target), 'extra.txt'), 'unexpected');
    if (kind === 'control') fs.appendFileSync(path.join(copy, 'control/oracles.json'), '\n');
    if (kind === 'symlink') { fs.unlinkSync(target); fs.symlinkSync(path.join(prepared.output, prepared.manifest.runs[0].workspace, 'packet/after/src/url.mjs'), target); }
    expect(() => verifyFileCoverageQuickReplacement(copy, prepared.freezeSha256, previous.output)).toThrow();
  });

  test('requires an independent digest even when the manifest is rewritten', () => {
    const copy = path.join(root, 'changed-manifest');
    fs.cpSync(prepared.output, copy, { recursive: true });
    fs.appendFileSync(path.join(copy, 'control/freeze.json'), '\n');
    expect(() => verifyFileCoverageQuickReplacement(copy, prepared.freezeSha256, previous.output)).toThrow('digest');
    expect(() => verifyFileCoverageQuickReplacement(prepared.output, undefined, previous.output)).toThrow('digest');
    expect(sha(fs.readFileSync(path.join(prepared.output, 'control/freeze.json')))).toBe(prepared.freezeSha256);
  });
});
