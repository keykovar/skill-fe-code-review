import { spawnSync } from 'node:child_process';
import { describe, expect, test } from 'vitest';
import { validateOriginOccurrenceCandidate } from '../scripts/validate-origin-occurrence-candidate.mjs';
import { validateOriginOccurrenceIntegrated } from '../scripts/validate-origin-occurrence-integrated.mjs';
import { evaluateIntegratedOriginOccurrenceReport } from '../scripts/adjudicate-origin-occurrence-integrated.mjs';
import { readText, rootDir } from './test-utils';

const base = 'evaluation/prototypes/origin-occurrence';
const definitions = JSON.parse(readText(`${base}/examples/oracles.json`)).examples;
const quick = readText(`${base}/examples/quick.en.md`);
const fix = readText(`${base}/examples/fix.en.md`);
const sourceRoot = '/review';
const plain = quick.split('\n').find((line) => line.startsWith('- [src/url.ts:12]'))!;
const link = plain.replace('[src/url.ts:12]', '[src/url.ts:12](/review/src/url.ts:12)');
const linked = quick.replace(plain, link);
const inspect = (report: string) => validateOriginOccurrenceIntegrated(report, 'quick', { sourceRoot });
const legacy = fix.replace('- [F-001] [src/auth/session.ts:44]', '- [src/auth/session.ts:44]')
  .replaceAll('[F-002]', '[F-001]');
const forbidden = `\n## Changed-Condition Coverage\n${link}\n`;

describe('integration-11 standalone structure profile', () => {
  test.each(Object.keys(definitions))('accepts %s without a case oracle or source root', (name) => {
    const report = readText(`${base}/examples/${name}`);
    const result = validateOriginOccurrenceIntegrated(report, definitions[name].mode);
    expect(result.candidate.structurallyValid).toBe(true);
    expect(result.raw).toEqual(validateOriginOccurrenceCandidate(report, definitions[name].mode));
    expect(result.reportAcceptance).toBe('Not Evaluated');
    expect(result.candidate.semanticStatus).toBe('Not Evaluated');
  });

  test('retains raw rejection and source text while validating only the linked presentation', () => {
    const result = inspect(linked);
    expect(result.raw.baseValidation.report.valid).toBe(false);
    expect(result.raw).toEqual(validateOriginOccurrenceCandidate(linked, 'quick'));
    expect(result.candidate.structurallyValid).toBe(true);
    expect(result.compatibility.coverage).toMatchObject({ status: 'Pass', errors: [], mappings: [{ label: 'src/url.ts:12', target: '/review/src/url.ts:12' }] });
    expect(result.candidate.findings).toEqual(inspect(quick).candidate.findings);
    expect(linked).toContain('](/review/src/url.ts:12)');
  });

  test.each([
    '[src/url.ts:12](src/url.ts:12)', '[/review/src/url.ts:12](/review/src/url.ts:12)',
    '[src/My File.ts:12](</review/src/My File.ts:12>)', '[src/入口.ts:12](/review/src/入口.ts:12)',
  ])('accepts the supported location %s', (location) => {
    expect(inspect(quick.replace(plain, plain.replace('[src/url.ts:12]', location))).candidate.structurallyValid).toBe(true);
  });

  test.each([
    '[src/url.ts:12](/review/src/url.ts:13)', '[src/url.ts:12](/review/src/other.ts:12)',
    '[src/url.ts:12](/outside/src/url.ts:12)', '[src/url.ts:12](/review-suffix/src/url.ts:12)',
    '[src/url.ts:12](../src/url.ts:12)', '[src/url.ts:12](/review/src/../src/url.ts:12)',
    '[src/url.ts:12](https://example.com/src/url.ts:12)', '[src/url.ts:12](file:///review/src/url.ts:12)',
    '[src/url.ts:12](/review/src/%75rl.ts:12)', '[src/url.ts:12](/review/src/url.ts:12?x=1)',
    '[src/url.ts:12](/review/src/url.ts#L12)', '[src/url.ts:12](C:\\review\\src\\url.ts:12)',
    '[src/url.ts:0](/review/src/url.ts:0)', '[src/url.ts:01](/review/src/url.ts:01)',
    '[src/url.ts:9007199254740992](/review/src/url.ts:9007199254740992)',
    '[src/url.ts:12](/review/src/url.ts:12 "title")', '[src/url.ts:12](</review/src/url.ts:12)',
    '[src/My File.ts:12](/review/src/My File.ts:12)', '[src/a(b).ts:12](/review/src/a(b).ts:12)',
  ])('rejects the unsupported or mismatched link %s', (location) => {
    const result = inspect(quick.replace(plain, plain.replace('[src/url.ts:12]', location)));
    expect(result.candidate.structurallyValid).toBe(false);
    expect(result.compatibility.coverage.status).toBe('Fail');
  });

  test.each([undefined, '', '/', 'relative', '/review/', '/review/./other', '/review/../other'])('does not infer or repair source root %s', (root) => {
    expect(() => validateOriginOccurrenceIntegrated(linked, 'quick', { sourceRoot: root })).toThrow(/source root/);
  });

  test.each([
    (s: string) => s.replace(' -> ', ' versus '),
    (s: string) => s.replace('Disposition: [F-001]', 'Disposition: [F-099]'),
    (s: string) => s.replace('Disposition: [F-001]', 'Disposition: [F-001] Behavior Preserving'),
    (s: string) => s.replace('; Disposition:', '\n  - Disposition:'),
    (s: string) => s.replace(link, `${link}; Merge key: unused`),
    (s: string) => s.replace(/^  - Origin:.*\n/mu, ''),
    (s: string) => s.replace('Reproduction: Not Run -', 'Reproduction: Not Run - 1/1'),
    (s: string) => s.replace('Reproduction: Not Run -', 'Reproduction: Not Run - 10%'),
  ])('does not hide the structural/field error %#', (mutate) => {
    expect(inspect(mutate(linked)).candidate.structurallyValid).toBe(false);
  });

  test('requires evidence adjudication for a plausible but wrong origin', () => {
    const changed = linked.replace('Origin: New', 'Origin: Retained');
    expect(inspect(changed).candidate.structurallyValid).toBe(true);
    expect(evaluateIntegratedOriginOccurrenceReport(changed, 'quick', definitions['quick.en.md'].oracle, { sourceRoot }).adjudication.status).toBe('Fail');
  });

  test('preserves repeated-ID merge rules and rejects one invalid link alongside a valid link', () => {
    const entry = `${link}; Merge key: separator`;
    const other = entry.replace('base/path separator:', 'caller separator:');
    expect(inspect(quick.replace(plain, `${entry}\n${other}`)).candidate.structurallyValid).toBe(true);
    expect(inspect(quick.replace(plain, `${entry}\n${link}`)).candidate.structurallyValid).toBe(false);
    const bad = other.replace('](/review/', '](/outside/');
    expect(inspect(quick.replace(plain, `${entry}\n${bad}`)).candidate.structurallyValid).toBe(false);
  });

  test('preserves CRLF line numbers and does not normalize fenced or outside links', () => {
    expect(inspect(linked.replaceAll('\n', '\r\n')).candidate.findings).toEqual(inspect(linked).candidate.findings);
    expect(inspect(quick + `\n${link}`).compatibility.coverage.mappings).toEqual([]);
    expect(inspect(linked.replace(link, `\x60\x60\x60md\n${link}\n\x60\x60\x60`)).candidate.structurallyValid).toBe(false);
  });

  test('accepts zero findings without invented metadata', () => {
    const noFindings = `## Overall Conclusion\nCan submit.\n## Changed-Condition Coverage\n- [src/a.ts:1](/review/src/a.ts:1) label: old -> equivalent new; Disposition: Behavior Preserving\n## Blocking\nNo clear issue.\n## Risk\nNo clear issue.\n## Improve\nNo clear issue.\n`;
    const result = evaluateIntegratedOriginOccurrenceReport(noFindings, 'quick', { origins: [], states: [] }, { sourceRoot });
    expect(result.adjudication.status).toBe('Pass');
    expect(result.candidate.findings).toEqual([]);
  });

  test('uses repaired legacy Fix for mixed old prose and numbered regression', () => {
    const result = validateOriginOccurrenceIntegrated(legacy, 'fix');
    expect(result.raw.structurallyValid).toBe(false);
    expect(result.candidate.structurallyValid).toBe(true);
    expect(result.candidate.findings.map((f: any) => f.id)).toEqual([null, 'F-001']);
    expect(result.compatibility.legacy.status).toBe('Pass');
    expect(result.compatibility.coverage.status).toBe('Not Applicable');
    expect(validateOriginOccurrenceIntegrated(legacy + forbidden, 'fix').candidate.structurallyValid).toBe(false);
  });

  test('does not reintroduce I-01 even when the raw legacy-only result passes', () => {
    const oldOnly = legacy.slice(0, legacy.indexOf('## New Regression')) + '\n## New Regression\n### Risk\nNo clear issue.\n' + forbidden;
    const result = validateOriginOccurrenceIntegrated(oldOnly, 'fix');
    expect(result.raw.structurallyValid).toBe(true);
    expect(result.candidate.structurallyValid).toBe(false);
    expect(result.compatibility.legacy.errors).toContainEqual(expect.objectContaining({ type: 'fix-review-coverage-ledger-forbidden' }));
  });

  test('requires explicit CLI selection and preserves old CLI behavior', () => {
    const args = ['--profile', 'integration-11', '--mode', 'quick', `${base}/examples/quick.en.md`];
    const run = (args: string[]) => spawnSync(process.execPath, ['scripts/validate-origin-occurrence-integrated.mjs', ...args], { cwd: rootDir, encoding: 'utf8' });
    const result = run(args);
    expect(result.status, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout).profile).toBe('integration-11');
    for (const invalid of [args.slice(2), ['--profile', 'v0.6.0', ...args.slice(2)], [...args, '--unknown'], ['--profile', 'integration-11', '--mode', 'other', args[4]]]) {
      expect(run(invalid).status).toBe(2);
    }
    expect(() => validateOriginOccurrenceIntegrated(quick, 'quick', { oracle: {} })).toThrow(/sourceRoot/);
    const old = spawnSync(process.execPath, ['scripts/validate-review-output.mjs', '--mode', 'quick', `${base}/examples/quick.en.md`], { cwd: rootDir, encoding: 'utf8' });
    expect(old.status).toBe(0);
  });
});

describe('integrated explicit group adjudication', () => {
  const reproduction = '[forward] Observed - 0/1 completed Node trials, current revision, reset 0, order 1 then 2; record B. | [reverse-a] Observed - 1/1 completed Node trials, current revision, reset 0, order 2 then 1; record A. | [reverse-b] Observed - 1/1 completed Node trials, same conditions as reverse-a; record C.';
  const grouped = linked.replace(/^  - Reproduction:.*$/mu, `  - Reproduction: ${reproduction}`);
  const oracle = { origins: ['New'], states: [['Observed', 'Observed']], counts: [[2, 2], [0, 1]], groupKeys: [['reverse', 'forward']] };
  const assignments = [{ reverse: ['reverse-a', 'reverse-b'], forward: ['forward'] }];
  const evaluate = (report: string, mapping: any = assignments) => evaluateIntegratedOriginOccurrenceReport(report, 'quick', oracle, { sourceRoot, assignments: mapping });

  test('composes links and mapped groups while retaining positional failure and original groups', () => {
    const result = evaluate(grouped);
    expect(result.compatibility.coverage.status).toBe('Pass');
    expect(result.positionalAdjudication.status).toBe('Fail');
    expect(result.groupAlignment).toBe('Applied');
    expect(result.adjudication.status).toBe('Pass');
    expect(result.candidate.findings[0].reproduction).toHaveLength(3);
    expect(result.reportAcceptance).toBe('Not Evaluated');
  });

  test.each([[], [{}], [{ reverse: ['reverse-a', 'reverse-b'], forward: ['reverse-a'] }], [{ reverse: ['missing', 'reverse-b'], forward: ['forward'] }]].map((mapping) => [mapping]))('rejects incomplete or overlapping assignments %#', (mapping) => {
    expect(() => evaluate(grouped, mapping)).toThrow(TypeError);
  });

  test('does not accept pooled, swapped or invalid-denominator observations', () => {
    expect(evaluate(grouped.replace(reproduction, 'Observed - 2/3 Node trials, pooled schedules.')).adjudication.status).toBe('Fail');
    expect(evaluate(grouped.replace('0/1', '1/1').replace('1/1 completed Node trials, current revision, reset 0, order 2', '0/1 completed Node trials, current revision, reset 0, order 2')).adjudication.status).toBe('Fail');
    expect(evaluate(grouped.replace('0/1', '0/2')).adjudication.status).toBe('Fail');
  });

  test('requires declared keys and assignments even when positional values would match', () => {
    expect(() => evaluateIntegratedOriginOccurrenceReport(grouped, 'quick', oracle, { sourceRoot })).toThrow(/assignment/);
    for (const groupKeys of [[], [['reverse', 'reverse']], [['reverse', '']]]) {
      expect(() => evaluateIntegratedOriginOccurrenceReport(grouped, 'quick', { ...oracle, groupKeys }, { sourceRoot, assignments })).toThrow(/key/);
    }
    expect(() => evaluateIntegratedOriginOccurrenceReport(quick, 'quick', definitions['quick.en.md'].oracle, { assignments })).toThrow(/grouped oracle/);
  });

  test('does not combine non-observed states or counts beyond safe integer range', () => {
    const notRun = grouped.replace('[reverse-b] Observed - 1/1 completed Node trials, same conditions as reverse-a; record C.', '[reverse-b] Not Run - no equivalent execution record.');
    expect(() => evaluate(notRun)).toThrow(/Only Observed/);
    const overflow = grouped.replaceAll('1/1', '9007199254740991/9007199254740991');
    expect(() => evaluate(overflow)).toThrow(/safe integers/);
  });

  test('cannot use group mapping to bypass link, field or legacy structural failures', () => {
    for (const report of [grouped.replace('](/review/', '](/outside/'), grouped.replace(/^  - Origin:.*\n/mu, '')]) {
      const result = evaluate(report);
      expect(result.groupAlignment).toBe('Not Applied');
      expect(result.adjudication.status).toBe('Fail');
    }
    const fixOracle = { ...definitions['fix.en.md'].oracle, groupKeys: [['before', 'after'], ['unrun']] };
    const options = { assignments: [{ before: ['pre-fix'], after: ['post-fix'] }, { unrun: [null] }] };
    expect(evaluateIntegratedOriginOccurrenceReport(legacy, 'fix', fixOracle, options).adjudication.status).toBe('Pass');
    const rejected = evaluateIntegratedOriginOccurrenceReport(legacy + forbidden, 'fix', fixOracle, options);
    expect(rejected.groupAlignment).toBe('Not Applied');
    expect(rejected.adjudication.status).toBe('Fail');
  });
});
