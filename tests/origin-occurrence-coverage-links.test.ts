import crypto from 'node:crypto';
import { describe, expect, test } from 'vitest';

import { evaluateOriginOccurrenceReport } from '../scripts/adjudicate-origin-occurrence-candidate.mjs';
import { evaluateLinkedOriginOccurrenceReport } from '../scripts/adjudicate-origin-occurrence-coverage-links.mjs';
import { readText } from './test-utils';

const sourceRoot = '/review';
const examples = JSON.parse(readText('evaluation/prototypes/origin-occurrence/examples/oracles.json')).examples;
const example = (name: string) => readText(`evaluation/prototypes/origin-occurrence/examples/${name}`);
const deep = example('deep.en.md');
const oracle = examples['deep.en.md'].oracle;
const plainEntry = deep.split('\n').find((line) => line.startsWith('- [src/auth/session.ts:44]'))!;
const linkedEntry = plainEntry.replace('[src/auth/session.ts:44]', '[src/auth/session.ts:44](/review/src/auth/session.ts:44)');
const reportWith = (entry: string) => deep.replace(plainEntry, entry);
const evaluate = (markdown: string) => evaluateLinkedOriginOccurrenceReport(markdown, 'deep', oracle, sourceRoot);

describe('Coverage links opt-in profile', () => {
  test.each(['quick.en.md', 'quick.zh-CN.md', 'deep.en.md', 'deep.zh-CN.md'])('%s accepts linked locations while retaining raw failures', (name) => {
    const definition = examples[name];
    const original = example(name);
    const entry = original.split('\n').find((line) => /^- \[[^\]]+:\d+\]/u.test(line))!;
    const label = entry.match(/^(- \[([^\]]+)\])/u)!;
    const changed = original.replace(entry, entry.replace(label[1], `${label[1]}(${sourceRoot}/${label[2]})`));
    const result = evaluateLinkedOriginOccurrenceReport(changed, definition.mode, definition.oracle, sourceRoot);
    expect(result.raw).toEqual(evaluateOriginOccurrenceReport(changed, definition.mode, definition.oracle));
    expect(result.raw.candidate.baseValidation.report.valid).toBe(false);
    expect(result.compatibility.status).toBe('Pass');
    expect(result.compatibility.mappings).toHaveLength(1);
    expect(result.compatibility.validation.candidate.findings).toEqual(
      evaluateOriginOccurrenceReport(original, definition.mode, definition.oracle).candidate.findings,
    );
    expect(result.adjudication.status).toBe('Pass');
    expect(result.reportAcceptance).toBe('Not Evaluated');
    expect(result.adjudication.reportAcceptance).toBe('Not Evaluated');
    expect(changed).toContain(`${sourceRoot}/${label[2]}`);
  });

  test.each([
    '[src/auth/session.ts:44](src/auth/session.ts:44)',
    '[/review/src/auth/session.ts:44](/review/src/auth/session.ts:44)',
    '[src/认证.ts:44](/review/src/认证.ts:44)',
    '[src/My File.ts:44](</review/src/My File.ts:44>)',
  ])('accepts matching supported local location %s', (location) => {
    const result = evaluate(reportWith(plainEntry.replace('[src/auth/session.ts:44]', location)));
    expect(result.compatibility.status).toBe('Pass');
    expect(result.adjudication.status).toBe('Pass');
    expect(result.compatibility.mappings[0].line).toBe(deep.split('\n').indexOf(plainEntry) + 1);
  });

  test('does not apply a transform to valid plain locations', () => {
    const result = evaluate(deep);
    expect(result.compatibility).toEqual({ status: 'Not Applied', mappings: [], errors: [], validation: null });
    expect(result.adjudication).toEqual(result.raw.adjudication);
    expect(result.adjudication.status).toBe('Pass');
  });

  test('preserves CRLF lines, metadata and line numbering', () => {
    const report = reportWith(linkedEntry).replace(/\n/g, '\r\n');
    const result = evaluate(report);
    expect(result.compatibility.status).toBe('Pass');
    expect(result.compatibility.validation.candidate.findings).toEqual(evaluate(deep).raw.candidate.findings);
    expect(result.compatibility.mappings[0].line).toBe(deep.split('\n').indexOf(plainEntry) + 1);
  });

  test.each(['Changed-Condition Coverage', 'Changed-Condition Coverage：变更条件覆盖', '变更条件覆盖'])('recognizes only the existing heading %s', (heading) => {
    const result = evaluate(reportWith(linkedEntry).replace('## Changed-Condition Coverage', `## ${heading}`));
    expect(result.compatibility.status).toBe('Pass');
  });

  test('ignores location-looking links outside Coverage', () => {
    const markdown = `${deep}\n${linkedEntry}\n`;
    const result = evaluate(markdown);
    expect(result.compatibility.mappings).toEqual([]);
    expect(result.raw).toEqual(evaluateOriginOccurrenceReport(markdown, 'deep', oracle));
  });

  test.each([
    '[src/auth/session.ts:44](/review/src/auth/session.ts:45)',
    '[src/auth/session.ts:44](/review/src/auth/other.ts:44)',
    '[src/auth/session.ts:44](/outside/src/auth/session.ts:44)',
    '[src/auth/session.ts:44](/review-other/src/auth/session.ts:44)',
    '[src/auth/session.ts:44](../../review/src/auth/session.ts:44)',
    '[src/auth/session.ts:44](/review/src/../src/auth/session.ts:44)',
    '[src/auth/session.ts:44](https://example.com/src/auth/session.ts:44)',
    '[src/auth/session.ts:44](javascript:session.ts:44)',
    '[src/auth/session.ts:44](file:///review/src/auth/session.ts:44)',
    '[src/auth/session.ts:44](/review/src/auth/session.ts#L44)',
    '[src/auth/session.ts:44](/review/src/auth/session.ts:44?view=1)',
    '[src/auth/session.ts:44](/review/src/auth/%73ession.ts:44)',
    '[src/auth/session.ts:44](C:\\review\\src\\auth\\session.ts:44)',
    '[src/auth/session.ts:0](/review/src/auth/session.ts:0)',
    '[src/auth/session.ts:01](/review/src/auth/session.ts:01)',
    '[src/auth/session.ts:9007199254740992](/review/src/auth/session.ts:9007199254740992)',
    '[src/auth/session.ts](/review/src/auth/session.ts:44)',
    '[src/auth/session.ts:44](/review/src/auth/session.ts:44 "title")',
    '[src/auth/session.ts:44](</review/src/auth/session.ts:44)',
    '[src/My File.ts:44](/review/src/My File.ts:44)',
    '[src/foo(bar).ts:44](/review/src/foo(bar).ts:44)',
  ])('rejects unsupported or inconsistent location %s', (location) => {
    const result = evaluate(reportWith(plainEntry.replace('[src/auth/session.ts:44]', location)));
    expect(result.adjudication.status).toBe('Fail');
    expect(result.compatibility.mappings).toHaveLength(0);
  });

  test.each([
    ['missing arrow', (entry: string) => entry.replace(' -> ', ' versus ')],
    ['missing before', (entry: string) => entry.replace('`getCurrentToken()` ->', '->')],
    ['missing after', (entry: string) => entry.replace('-> `capturedToken`', '->')],
    ['extra arrow', (entry: string) => entry.replace('; Disposition:', ' -> extra; Disposition:')],
    ['missing disposition', (entry: string) => entry.replace('; Disposition: [F-001]', '')],
    ['unknown ID', (entry: string) => entry.replace('Disposition: [F-001]', 'Disposition: [F-099]')],
    ['multiple dispositions', (entry: string) => entry.replace('Disposition: [F-001]', 'Disposition: [F-001] Behavior Preserving')],
    ['child line', (entry: string) => entry.replace('; Disposition:', '\n  - Disposition:')],
    ['single-ID merge key', (entry: string) => `${entry}; Merge key: stale-token`],
  ])('keeps the original %s gate after link normalization', (_name, change) => {
    const result = evaluate(reportWith(change(linkedEntry)));
    expect(result.adjudication.status).toBe('Fail');
    expect(result.compatibility.validation?.candidate.structurallyValid ?? false).toBe(false);
  });

  test('preserves repeated-ID grouping checks and accepts only matching merge keys', () => {
    const merged = `${linkedEntry}; Merge key: stale-token`;
    const same = evaluate(reportWith(`${merged}\n${merged.replace('resume token source:', 'entry token source:')}`));
    expect(same.adjudication.status).toBe('Pass');
    expect(same.compatibility.mappings).toHaveLength(2);
    for (const bad of [linkedEntry, `${linkedEntry}; Merge key: different`]) {
      expect(evaluate(reportWith(`${merged}\n${bad}`)).adjudication.status).toBe('Fail');
    }
  });

  test('does not hide one invalid target behind another valid normalization', () => {
    const valid = `${linkedEntry}; Merge key: stale-token`;
    const invalid = valid.replace('](/review/src/auth/session.ts:44)', '](/outside/src/auth/session.ts:44)');
    const result = evaluate(reportWith(`${valid}\n${invalid}`));
    expect(result.compatibility.status).toBe('Fail');
    expect(result.compatibility.mappings).toHaveLength(1);
    expect(result.compatibility.errors).toHaveLength(1);
    expect(result.adjudication.status).toBe('Fail');
  });

  test.each([
    ['missing Origin', (text: string) => text.replace(/^  - Origin:.*\n/mu, '')],
    ['wrong Origin', (text: string) => text.replace('Origin: New', 'Origin: Retained')],
    ['fabricated count', (text: string) => text.replace('Reproduction: Not Run -', 'Reproduction: Not Run - 1/1')],
    ['wrong outcome', (text: string) => text.replace('Blocking outcome: Login/Auth Failure', 'Blocking outcome: Authentication failure')],
    ['duplicate Coverage', (text: string) => text + `\n## Changed-Condition Coverage\n${linkedEntry}\n`],
    ['fenced Coverage line', (text: string) => text.replace(linkedEntry, `\x60\x60\x60md\n${linkedEntry}\n\x60\x60\x60`)],
  ])('does not weaken %s validation', (_name, change) => {
    expect(evaluate(change(reportWith(linkedEntry))).adjudication.status).toBe('Fail');
  });

  test.each(['fix.en.md', 'fix.zh-CN.md'])('%s stays on its unchanged Fix path', (name) => {
    const definition = examples[name];
    const original = example(name);
    const result = evaluateLinkedOriginOccurrenceReport(original, 'fix', definition.oracle, sourceRoot);
    expect(result.compatibility.status).toBe('Not Applicable');
    expect(result.adjudication).toEqual(result.raw.adjudication);
    expect(result.adjudication.status).toBe('Pass');
    const forbidden = original + `\n## Changed-Condition Coverage\n${linkedEntry}\n`;
    const rejected = evaluateLinkedOriginOccurrenceReport(forbidden, 'fix', definition.oracle, sourceRoot);
    expect(rejected.compatibility.mappings).toEqual([]);
    expect(rejected.adjudication.status).toBe('Fail');
  });

  test.each([undefined, '', '/', 'relative', '/review/', '/review/../review', 'https://review', 'C:\\review'])('requires an explicit supported root: %s', (root) => {
    expect(() => evaluateLinkedOriginOccurrenceReport(reportWith(linkedEntry), 'deep', oracle, root)).toThrow(/source root/);
  });

  test('keeps no-finding reviews free of invented findings', () => {
    const original = `## 总体结论
可以提交。
## Changed-Condition Coverage：变更条件覆盖
- [src/session.ts:9](/review/src/session.ts:9) label: before -> equivalent after; Disposition: Behavior Preserving
## Blocking：必须修改
无明确问题。
## Risk：建议修改
无明确问题。
## Improve：可优化
无明确问题。
`;
    const result = evaluateLinkedOriginOccurrenceReport(original, 'quick', { origins: [], states: [] }, sourceRoot);
    expect(result.raw.candidate.findings).toEqual([]);
    expect(result.compatibility.status).toBe('Pass');
    expect(result.adjudication.status).toBe('Pass');
    expect(result.adjudication.actual.findingCount).toBe(0);
  });

  test('preserves stable validators, the oracle, candidate instructions and baseline version', () => {
    const profile = JSON.parse(readText('evaluation/prototypes/origin-occurrence/coverage-links-09.json'));
    for (const pin of profile.frozenFiles) {
      expect(crypto.createHash('sha256').update(readText(`evaluation/baselines/pre-v0.6.0/${pin.path}`)).digest('hex')).toBe(pin.sha256);
    }
    expect(profile.modelInvocations).toBe(0);
    expect(JSON.parse(readText('evaluation/baselines/pre-v0.6.0/package.json')).version).toBe('0.5.0');
    expect(readText(profile.instructionFile)).toContain('Fix Review still has no Coverage ledger');
  });
});
