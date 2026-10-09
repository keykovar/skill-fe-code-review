import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, test } from 'vitest';
import { validateOriginOccurrenceEmptySections } from '../scripts/validate-origin-occurrence-empty-sections.mjs';
import { validateOriginOccurrenceIntegrated } from '../scripts/validate-origin-occurrence-integrated.mjs';
import { adjudicateOriginOccurrenceCandidate } from '../scripts/adjudicate-origin-occurrence-candidate.mjs';
import { buildOriginOccurrenceFinalization } from '../scripts/build-origin-occurrence-finalization.mjs';
import { readText, rootDir } from './test-utils';

const base = 'evaluation/prototypes/origin-occurrence';
const quick = readText(`${base}/examples/quick.en.md`);
const deep = readText(`${base}/examples/deep.en.md`);
const fix = readText(`${base}/examples/fix.en.md`);
const fixtures: Record<string, string> = { quick, deep, fix };
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'fe-finalization-test-'));
afterAll(() => fs.rmSync(temporary, { recursive: true, force: true }));
const inspect = (report: string, mode = 'quick') => validateOriginOccurrenceEmptySections(report, mode, { sourceRoot: '/review' });
const bullet = (report: string) => report.replaceAll('\nNo clear issue.\n', '\n- No clear issue.\n');
const bulleted = bullet(quick);
const hash = (value: string) => createHash('sha256').update(value).digest('hex');

describe('integration-12 strict empty severity sections', () => {
  test.each(['quick', 'deep', 'fix'].flatMap((mode) =>
    ['No clear issue.', '无明确问题。'].flatMap((marker) => ['', '- '].map((prefix) => [mode, marker, prefix]))))(
    'accepts a sole %s empty marker %s with prefix %s', (mode, marker, prefix) => {
      const original = fixtures[mode];
      const report = original.replaceAll('\nNo clear issue.\n', `\n${prefix}${marker}\n`);
      const result = inspect(report, mode);
      expect(result.candidate.structurallyValid).toBe(true);
      expect(result.candidate.findings).toEqual(inspect(original, mode).candidate.findings);
      expect(result.previousValidation).toEqual(validateOriginOccurrenceIntegrated(report, mode, { sourceRoot: '/review' }));
      expect(result.raw).toEqual(result.previousValidation.raw);
      expect(result.reportAcceptance).toBe('Not Evaluated');
      expect(result.candidate.semanticStatus).toBe('Not Evaluated');
      expect(result.compatibility.emptySections.mappings).toHaveLength(prefix ? 2 : 0);
    });

  test.each([
    '- No clear issue.\n- No clear issue.',
    'No clear issue.\nNo clear issue.',
    '- No clear issue.\n无明确问题。',
    '- No clear issue.\nUnnumbered explanatory content.',
    'No clear issue.\n- An unnumbered real problem.',
    '- No clear issue.\n  - Origin: New - evidence.',
    '- No clear issue.\n- [F-002] [src/url.ts:1] Real problem',
    '- No clear issue.\n```text\nexplanation\n```',
    '- No clear issue.\n### Details\nexplanation',
    '- No clear issue.\n<!-- hidden content -->',
  ])('rejects contradictory, duplicate or non-empty content %#', (contents) => {
    const report = quick.replace('## Blocking\n\nNo clear issue.', `## Blocking\n\n${contents}`);
    const result = inspect(report);
    expect(result.candidate.structurallyValid).toBe(false);
    expect(result.compatibility.emptySections.errors).toContainEqual(expect.objectContaining({ type: 'empty-marker-mixed-or-duplicate-content' }));
    expect(result.compatibility.emptySections.mappings).toHaveLength(0);
  });

  test.each(['No clear issue.\n', '- No clear issue.\n'])('rejects a marker in a populated section, prefix %s', (marker) => {
    const report = quick.replace('## Risk\n', `## Risk\n${marker}`);
    expect(inspect(report).candidate.structurallyValid).toBe(false);
  });

  test.each(['- No clear issue. But a bug remains.', '- No clear issue', '- 无明确问题', '- [F-002] title only', '- Unnumbered bug'])('does not recognize unsupported prose as an empty marker: %s', (value) => {
    const result = inspect(quick.replace('## Blocking\n\nNo clear issue.', `## Blocking\n\n${value}`));
    expect(result.candidate.structurallyValid).toBe(false);
    expect(result.compatibility.emptySections.mappings).toEqual([]);
  });

  test.each([
    ['quick', '## Blocking', '### Blocking'],
    ['quick', '## Blocking', '#### Blocking'],
    ['deep', '## Findings', '## Other'],
    ['deep', '### Risk', '## Risk'],
    ['fix', '## New Regression', '## Other'],
    ['fix', '### Blocking', '#### Blocking'],
  ])('rejects an exact marker in a wrong-level or wrong-parent section %#', (mode, before, after) => {
    const result = inspect(bullet(fixtures[mode]).replace(before, after), mode);
    expect(result.candidate.structurallyValid).toBe(false);
    expect(result.compatibility.emptySections.errors.length).toBeGreaterThan(0);
  });

  test('never consumes fenced/outside markers; preserves CRLF finding and marker line numbers', () => {
    const report = quick.replace('## Blocking\n\nNo clear issue.', '## Blocking\n\n```md\n- No clear issue.\n```');
    expect(inspect(report).compatibility.emptySections.mappings).toEqual([]);
    const appended = quick + '\n- No clear issue.\n';
    expect(inspect(appended).candidate).toEqual(validateOriginOccurrenceIntegrated(appended, 'quick', { sourceRoot: '/review' }).candidate);
    const unix = inspect(bulleted);
    const windows = inspect(bulleted.replaceAll('\n', '\r\n'));
    expect(windows.candidate.findings).toEqual(unix.candidate.findings);
    expect(windows.compatibility.emptySections).toEqual(unix.compatibility.emptySections);
  });

  test.each([
    (s: string) => s.replace(/^  - Origin:.*\n/mu, ''),
    (s: string) => s.replace(/^  - Reproduction:.*\n/mu, ''),
    (s: string) => s.replace('  - Origin: New', '  - Origin: Unknown - no baseline\n  - Origin: New'),
    (s: string) => s.replace('Reproduction: Not Run -', 'Reproduction: Not Run - 1/1'),
    (s: string) => s.replace('Reproduction: Not Run -', 'Reproduction: Observed - 2/1'),
    (s: string) => s.replace('Reproduction: Not Run -', 'Reproduction: Not Run - 10%'),
    (s: string) => s.replace('- [F-001] [src/url.ts:12]', '- [src/url.ts:12]'),
    (s: string) => s.replace('Disposition: [F-001]', 'Disposition: [F-099]'),
    (s: string) => s.replace(' -> ', ' versus '),
    (s: string) => s.replace('## Changed-Condition Coverage', '### Changed-Condition Coverage'),
  ])('does not conceal unrelated finding/field/Coverage failure %#', (mutate) => {
    const result = inspect(mutate(bulleted));
    expect(result.compatibility.emptySections.status).toBe('Applied');
    expect(result.candidate.structurallyValid).toBe(false);
  });

  test('composes only valid local Coverage links', () => {
    const linked = bulleted.replace('- [src/url.ts:12] base', '- [src/url.ts:12](/review/src/url.ts:12) base');
    expect(inspect(linked).candidate.structurallyValid).toBe(true);
    expect(inspect(linked).compatibility.coverage.status).toBe('Pass');
    expect(inspect(linked.replace('](/review/', '](/outside/')).candidate.structurallyValid).toBe(false);
    expect(() => validateOriginOccurrenceEmptySections(linked, 'quick')).toThrow(/source root/);
  });

  test('does not invent findings, metadata or sample counts for a zero-finding report', () => {
    const report = '## Overall Conclusion\nCan submit.\n## Changed-Condition Coverage\n- [src/a.ts:1] value: old -> equivalent; Disposition: Behavior Preserving\n## Blocking\n- No clear issue.\n## Risk\n- 无明确问题。\n## Improve\nNo clear issue.\n';
    const result = inspect(report);
    expect(result.candidate.structurallyValid).toBe(true);
    expect(result.candidate.findings).toEqual([]);
    expect(adjudicateOriginOccurrenceCandidate(result.candidate, { origins: [], states: [] }).status).toBe('Pass');
  });

  test('retains explicit observed group boundaries', () => {
    const result = inspect(bullet(fix), 'fix');
    expect(result.candidate.findings[0].reproduction.map((group: any) => [group.context, group.count])).toEqual([
      ['pre-fix', { failures: 1, trials: 1 }], ['post-fix', { failures: 0, trials: 1 }],
    ]);
  });

  test('supports legacy previous findings without reintroducing I-01 or assigning IDs', () => {
    const legacy = bullet(fix).replace('- [F-001] [src/auth/session.ts:44]', '- [src/auth/session.ts:44]').replaceAll('[F-002]', '[F-001]');
    const result = inspect(legacy, 'fix');
    expect(result.candidate.structurallyValid).toBe(true);
    expect(result.candidate.findings.map((finding: any) => finding.id)).toEqual([null, 'F-001']);
    expect(result.compatibility.legacy.status).toBe('Pass');
    const forbidden = '\n## Changed-Condition Coverage\n- [src/a.ts:1] value: old -> new; Disposition: Behavior Preserving\n';
    expect(inspect(legacy + forbidden, 'fix').candidate.structurallyValid).toBe(false);
    expect(inspect(legacy.replace('Current status: Resolved', 'Current status: Unknown'), 'fix').candidate.structurallyValid).toBe(false);
  });

  test.each(['No clear issue.', '- No clear issue.'])('cannot replace a previous finding with %s', (marker) => {
    const report = fix.replace(/(## Issue Verification\n)[\s\S]*?(\n## New Regression)/u, `$1\n${marker}\n$2`);
    const result = inspect(report, 'fix');
    expect(result.candidate.structurallyValid).toBe(false);
    expect(result.compatibility.emptySections.mappings).toHaveLength(0);
  });

  test('requires explicit new CLI profile and keeps unknown options fatal', () => {
    const filename = path.join(temporary, 'report.md');
    fs.writeFileSync(filename, bulleted);
    const args = ['--profile', 'integration-12', '--mode', 'quick', filename];
    const run = (args: string[]) => spawnSync(process.execPath, ['scripts/validate-origin-occurrence-empty-sections.mjs', ...args], { cwd: rootDir, encoding: 'utf8' });
    const result = run(args);
    expect(result.status, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout).profile).toBe('integration-12');
    for (const invalid of [args.slice(2), args.map((arg) => arg === 'integration-12' ? 'integration-11' : arg), [...args, '--unknown']]) {
      expect(run(invalid).status).toBe(2);
    }
    expect(() => validateOriginOccurrenceEmptySections(quick, 'quick', { oracle: {} })).toThrow(/sourceRoot/);
  });
});

describe('integration-12 candidate scope and retained evidence', () => {
  const output = path.join(temporary, 'candidate');
  const manifest = buildOriginOccurrenceFinalization(output);
  const read = (filename: string) => fs.readFileSync(path.join(output, filename), 'utf8');

  test('changes only core finalization and Deep rendering; preserves other safeguards', () => {
    expect(manifest.outputs).toHaveLength(12);
    expect(manifest.outputs.filter((pin: any) => pin.byteDelta).map((pin: any) => pin.path)).toEqual([
      'skill/fe-code-review/SKILL.md', 'skill/fe-code-review/references/deep-review.md',
    ]);
    for (const pin of manifest.outputs.filter((pin: any) => !pin.byteDelta)) {
      expect(read(pin.path)).toBe(readText(`${base}/integration-11/${pin.path}`));
    }
    const original = readText(`${base}/integration-11/skill/fe-code-review/SKILL.md`);
    const candidate = read('skill/fe-code-review/SKILL.md');
    const expectedChanges = ['7. Trace affected callers', '- The final recommendation must restate'];
    for (const paragraph of original.trim().split('\n\n')) {
      if (expectedChanges.some((anchor) => paragraph.includes(anchor))) continue;
      expect(candidate).toContain(paragraph);
    }
    // Preserve all other list items even inside the two edited paragraphs.
    for (const line of original.split('\n').filter((line) => /^(?:[1-9]\. |-[ ]|  - )/u.test(line))) {
      if (expectedChanges.some((anchor) => line.startsWith(anchor))) continue;
      expect(candidate).toContain(line);
    }
    expect(candidate.split('---')[1]).toBe(original.split('---')[1]);
    expect(manifest.runtimeReady).toBe(false);
    expect(manifest.modelInvocations).toBe(0);
  });

  test('pins inputs/outputs, reproduces exactly and refuses to overwrite', () => {
    for (const pin of manifest.inputs) expect(hash(readText(pin.path)), pin.path).toBe(pin.sha256);
    for (const pin of manifest.outputs) expect(hash(read(pin.path)), pin.path).toBe(pin.sha256);
    expect(buildOriginOccurrenceFinalization(path.join(temporary, 'repeat'))).toEqual(manifest);
    expect(() => buildOriginOccurrenceFinalization(output)).toThrow(/new directory/);
  });

  test.each(JSON.parse(readText(`${base}/integration-11-example-corrections-01/manifest.json`)).examples)(
    'reuses selected authored example $name without changing its semantic claim', (example: any) => {
      const definition = JSON.parse(readText(`${base}/examples/oracles.json`)).examples[example.name];
      const result = inspect(readText(example.path), definition.mode);
      expect(result.candidate.structurallyValid).toBe(true);
      expect(adjudicateOriginOccurrenceCandidate(result.candidate, definition.oracle).status).toBe('Pass');
      expect(result.reportAcceptance).toBe('Not Evaluated');
    });
});
