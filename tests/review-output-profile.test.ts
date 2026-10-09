import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterAll, describe, expect, test } from 'vitest';
import { validateReviewOutput } from '../scripts/review-output-profile.mjs';
import { validateReviewOutput as legacy } from '../scripts/legacy/validate-review-output.mjs';
import { validateOriginOccurrenceEmptySections } from '../scripts/validate-origin-occurrence-empty-sections.mjs';
import { readText, rootDir } from './test-utils';

const base = 'evaluation/prototypes/origin-occurrence';
const selection = JSON.parse(readText(`${base}/integration-11-example-corrections-01/manifest.json`));
const quick = readText(`${base}/examples/quick.en.md`);
const fix = readText(selection.examples.find((item: any) => item.name === 'fix.en.md').path);
const inspect = (report: string, mode = 'quick', sourceRoot = '/review') =>
  validateReviewOutput(report, mode, { profile: 'v0.6.0', sourceRoot });
const bullet = (report: string) => report.replaceAll('\nNo clear issue.\n', '\n- No clear issue.\n');
const legacyFix = fix.replace('- [F-001] [src/auth/session.ts:44]', '- [src/auth/session.ts:44]').replaceAll('[F-002]', '[F-001]');
const forbidden = '\n## Changed-Condition Coverage\n- [src/a.ts:1] value: old -> new; Disposition: Behavior Preserving\n';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fe-profile-test-'));
afterAll(() => fs.rmSync(tmp, { recursive: true, force: true }));

describe('explicit public v0.6.0 profile', () => {
  test.each(selection.examples)('preserves accepted $name fields and the old default', (example: any) => {
    const report = readText(example.path);
    const mode = example.name.split('.')[0];
    const candidate = validateOriginOccurrenceEmptySections(report, mode, { sourceRoot: '/review' });
    const result = inspect(report, mode);
    expect(result.valid).toBe(true);
    expect(result.findings).toEqual(candidate.candidate.findings);
    expect(result.raw).toEqual(legacy(report, mode));
    expect(validateReviewOutput(report, mode)).toEqual(legacy(report, mode));
    expect(result.semanticStatus).toBe('Not Evaluated');
    expect(result.reportAcceptance).toBe('Not Evaluated');
  });

  test('keeps missing new fields a failure only in the selected contract', () => {
    const report = quick.replace(/^  - (?:Origin|Reproduction):.*\n/gmu, '');
    expect(validateReviewOutput(report, 'quick')).toEqual(legacy(report, 'quick'));
    expect(validateReviewOutput(report, 'quick').valid).toBe(true);
    expect(inspect(report).valid).toBe(false);
  });

  test.each(['New', 'Amplified', 'Retained', 'Unknown'])('accepts supported Origin %s without claiming its truth', (state) => {
    const result = inspect(quick.replace('Origin: New', `Origin: ${state}`));
    expect(result.valid).toBe(true);
    expect(result.findings[0].origin.state).toBe(state);
    expect(result.semanticStatus).toBe('Not Evaluated');
  });

  test.each([
    ['Observed - 0/3 completed Node trials in current snapshot, record A.', true],
    ['Observed - 1/1 completed Node trials in current snapshot, record A.', true],
    ['Not Run - no executions supplied.', true],
    ['Cannot Verify - completion logs are unavailable.', true],
    ['Not Applicable - naming only, no runtime trigger.', true],
    ['Observed - 2/1 completed trials.', false],
    ['Observed - 0/0 completed trials.', false],
    ['Observed - -1/3 completed trials.', false],
    ['Observed - 1.5/3 completed trials.', false],
    ['Observed - 1/9007199254740992 completed trials.', false],
    ['Observed - 1/2', false],
    ['Not Run - 1/1 completed trials.', false],
    ['Not Run - 10% likely.', false],
    ['Not Run - 百分之十 likely.', false],
    ['Not Run - TODO', false],
    ['[a] Observed - 1/1 current Node trials. | [a] Observed - 0/1 current Node trials.', false],
    ['Observed - 1/1 current Node trials. | [a] Observed - 0/1 current Node trials.', false],
  ])('validates observation grammar %#', (value, valid) => {
    const report = quick.replace(/^  - Reproduction:.*$/mu, `  - Reproduction: ${value}`);
    expect(inspect(report).valid).toBe(valid);
  });

  test('retains distinct pre/post groups without aggregation', () => {
    const result = inspect(fix, 'fix');
    expect(result.findings[0].reproduction.map((group: any) => [group.context, group.count])).toEqual([
      ['pre-fix', { failures: 1, trials: 1 }], ['post-fix', { failures: 0, trials: 1 }],
    ]);
  });

  test.each([
    '[src/url.ts:12](/review/src/url.ts:12)',
    '[src/url.ts:12](src/url.ts:12)',
    '[src/My File.ts:12](</review/src/My File.ts:12>)',
    '[src/入口.ts:12](/review/src/入口.ts:12)',
  ])('accepts matching lexical location %s', (location) => {
    const report = quick.replace('- [src/url.ts:12] base', `- ${location} base`);
    const result = inspect(report);
    expect(result.valid).toBe(true);
    expect(result.raw.valid).toBe(false);
    expect(result.compatibility.coverage.mappings).toHaveLength(1);
  });

  test.each([
    '/outside/src/url.ts:12', '/review-suffix/src/url.ts:12', '/review/src/url.ts:13',
    '/review/src/other.ts:12', '../src/url.ts:12', '/review/src/../src/url.ts:12',
    'https://example.test/src/url.ts:12', 'file:///review/src/url.ts:12',
    '/review/src/%75rl.ts:12', '/review/src/url.ts:12?x=1', '/review/src/url.ts#L12',
    'C:\\review\\src\\url.ts:12', '/review/src/url.ts:0', '/review/src/url.ts:01',
    '/review/src/url.ts:9007199254740992',
  ])('rejects mismatched or unsupported target %s', (target) => {
    const report = quick.replace('- [src/url.ts:12] base', `- [src/url.ts:12](${target}) base`);
    expect(inspect(report).valid).toBe(false);
  });

  test.each([undefined, '', '/', 'relative', '/review/', '/review/./other', '/review/../other'])('does not infer source root %s', (sourceRoot) => {
    const report = quick.replace('- [src/url.ts:12] base', '- [src/url.ts:12](/review/src/url.ts:12) base');
    expect(() => validateReviewOutput(report, 'quick', { profile: 'v0.6.0', sourceRoot })).toThrow(/source root/);
  });

  test.each([
    (s: string) => s.replace(/^  - Origin:.*\n/mu, ''),
    (s: string) => s.replace('Origin: New', 'Origin: Unknown - absent\n  - Origin: New'),
    (s: string) => s.replace(' -> ', ' versus '),
    (s: string) => s.replace('Disposition: [F-001]', 'Disposition: [F-099]'),
    (s: string) => s.replace('Disposition: [F-001]', 'Disposition: [F-001] Behavior Preserving'),
    (s: string) => s.replace('## Changed-Condition Coverage', '### Changed-Condition Coverage'),
  ])('cannot hide a field or ledger error behind presentation compatibility %#', (mutate) => {
    const report = bullet(quick).replace('- [src/url.ts:12] base', '- [src/url.ts:12](/review/src/url.ts:12) base');
    expect(inspect(mutate(report)).valid).toBe(false);
  });

  test.each(selection.examples)('normalizes only standalone empty markers in $name', (example: any) => {
    const mode = example.name.split('.')[0];
    const report = readText(example.path).replaceAll('\nNo clear issue.\n', '\n- No clear issue.\n').replaceAll('\n无明确问题。\n', '\n- 无明确问题。\n');
    const result = inspect(report, mode);
    expect(result.valid).toBe(true);
    expect(result.findings).toEqual(inspect(readText(example.path), mode).findings);
    expect(result.compatibility.emptySections.mappings.length).toBeGreaterThan(0);
  });

  test.each([
    '- No clear issue.\n- No clear issue.', '- No clear issue.\nExtra explanation.',
    '- No clear issue.\n  - Origin: New - evidence.', '- No clear issue.\n- [F-002] [src/a.ts:1] bug',
    '- No clear issue.\n```text\nextra\n```', '- No clear issue.\n### Detail\nextra',
  ])('rejects mixed or duplicate empty markers %#', (contents) => {
    const report = quick.replace('## Blocking\n\nNo clear issue.', `## Blocking\n\n${contents}`);
    expect(inspect(report).valid).toBe(false);
  });

  test('preserves line numbers across CRLF and ignores fenced presentation markers', () => {
    const report = bullet(quick);
    expect(inspect(report.replaceAll('\n', '\r\n')).findings).toEqual(inspect(report).findings);
    const fenced = quick.replace('## Blocking\n\nNo clear issue.', '## Blocking\n\n```md\n- No clear issue.\n```');
    expect(inspect(fenced).compatibility.emptySections.mappings).toEqual([]);
    expect(inspect(report.replace('## Blocking', '### Blocking')).valid).toBe(false);
  });

  test('accepts checked legacy Fix items without inventing IDs', () => {
    const result = inspect(bullet(legacyFix), 'fix');
    expect(result.valid).toBe(true);
    expect(result.findings.map((item: any) => item.id)).toEqual([null, 'F-001']);
    expect(result.compatibility.legacy.status).toBe('Pass');
  });

  test.each([
    (s: string) => s + forbidden,
    (s: string) => s.replace('Current status: Resolved', 'Current status: Unknown'),
    (s: string) => s.replace('Current status: Resolved', 'Current status: Resolved\n  - Current status: Resolved'),
    (s: string) => s.replace(/^  - Current status:.*\n/mu, ''),
    (s: string) => s.replace('## Issue Verification', '### Issue Verification'),
    (s: string) => s.replace('## Issue Verification', '## Issue Verification\n## Issue Verification'),
    (s: string) => s.replace('- [src/auth/session.ts:44]', '- [F-bad] [src/auth/session.ts:44]'),
    (s: string) => s.replace('[F-001]', '[F-003]'),
    (s: string) => s.replace('Origin: Amplified', 'Origin: Retained'),
    (s: string) => s.replace(/^  - Origin:.*\n/mu, ''),
  ])('keeps legacy Fix failures fatal %#', (mutate) => {
    expect(inspect(mutate(bullet(legacyFix)), 'fix').valid).toBe(false);
  });

  test('supports numbered status emphasis without hiding forbidden Coverage', () => {
    const report = fix.replace('Current status: Resolved', 'Current status: **Resolved**');
    expect(inspect(report, 'fix').valid).toBe(true);
    expect(inspect(report + forbidden, 'fix').valid).toBe(false);
  });

  test('keeps oracle and group adjudication outside the public API', () => {
    for (const options of [null, [], { profile: 'unknown' }, { sourceRoot: '/review' },
      { profile: 'v0.6.0', oracle: {} }, { profile: 'v0.6.0', assignments: [] }]) {
      expect(() => validateReviewOutput(quick, 'quick', options)).toThrow();
    }
  });
});

describe('preview CLI exit and default compatibility', () => {
  const filename = path.join(tmp, 'report.md');
  fs.writeFileSync(filename, quick);
  const run = (args: string[]) => spawnSync(process.execPath, ['scripts/review-output-profile.mjs', ...args], { cwd: rootDir, encoding: 'utf8' });
  test.each(['stdin', 'eval'])('imports and calls the public API from a %s host without executing the CLI', (host) => {
    const module = pathToFileURL(path.join(rootDir, 'scripts/review-output-profile.mjs')).href;
    const code = `import { validateReviewOutput } from ${JSON.stringify(module)};
      import fs from 'node:fs';
      const text = fs.readFileSync(${JSON.stringify(filename)}, 'utf8');
      console.log(JSON.stringify([validateReviewOutput(text, 'quick'),
        validateReviewOutput(text, 'quick', { profile: 'v0.6.0' })]));`;
    const result = spawnSync(process.execPath, ['--input-type=module', ...(host === 'stdin' ? ['-'] : ['--eval', code])],
      { input: host === 'stdin' ? code : undefined, cwd: tmp, encoding: 'utf8' });
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe('');
    expect(JSON.parse(result.stdout)).toEqual([legacy(quick, 'quick'), inspect(quick, 'quick', undefined)]);
  });
  test('returns old JSON by default and structured opt-in JSON without requiring an oracle', () => {
    const old = run(['--mode', 'quick', filename]);
    expect(old.status, old.stderr).toBe(0);
    expect(JSON.parse(old.stdout)).toEqual(legacy(quick, 'quick'));
    const result = run(['--', '--profile', 'v0.6.0', '--mode', 'quick', filename]);
    expect(result.status, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({ profile: 'v0.6.0', valid: true, reportAcceptance: 'Not Evaluated' });
  });
  test('returns 1 for an invalid report, without rewriting it', () => {
    const invalid = path.join(tmp, 'invalid.md');
    const text = quick.replace(/^  - Origin:.*\n/mu, '');
    fs.writeFileSync(invalid, text);
    expect(run(['--mode', 'quick', '--profile', 'v0.6.0', invalid]).status).toBe(1);
    expect(fs.readFileSync(invalid, 'utf8')).toBe(text);
  });
  test.each([
    ['--mode', 'other'], ['--mode'], ['--unknown'], ['--mode', 'quick', '--profile', 'other'],
    ['--mode', 'quick', '--source-root', '/review'], ['--mode', 'quick', '--profile'],
    ['--mode', 'quick', '--profile', 'v0.6.0', '--profile', 'v0.6.0'],
  ])('returns 2 for invalid invocation %j', (args) => {
    const result = run([...args, filename]);
    expect(result.status).toBe(2);
    expect(result.stdout).toBe('');
  });
});
