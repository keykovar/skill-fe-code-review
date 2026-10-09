import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';

import { validateOriginOccurrenceCandidate } from '../scripts/validate-origin-occurrence-candidate.mjs';
import { adjudicateOriginOccurrenceCandidate, evaluateOriginOccurrenceReport } from '../scripts/adjudicate-origin-occurrence-candidate.mjs';
import { validateReviewOutput } from '../scripts/validate-review-output.mjs';
import * as source from '../evaluation/prototypes/origin-occurrence/source-cases.mjs';
import { parseFrontmatter, readText, rootDir } from './test-utils';

const data = JSON.parse(readText('evaluation/prototypes/origin-occurrence/cases.json'));
const examples = JSON.parse(readText('evaluation/prototypes/origin-occurrence/examples/oracles.json')) as {
  version: number; status: string;
  examples: Record<string, { mode: string; caseId: string; oracle: { origins?: string[]; states?: string[][]; counts?: number[][] } }>;
};
const cases = data.cases as Array<{
  id: string; mode: string; scenario: string; input: Record<string, any>;
  findings: Array<{ id: string; kind: string; severity: string; status?: string; origin: string; reproduction: string }>;
  oracle: { origins?: string[]; states?: string[][]; counts?: number[][]; recommendation?: string;
    blockingOutcome?: string; closure?: string; design?: string };
}>;
const caseById = (id: string) => cases.find((item) => item.id === id)!;
type Fixture = (typeof cases)[number];

function withDocumentedLabels(markdown: string) {
  const instructions = readText('evaluation/prototypes/origin-occurrence/fe-code-review-origin-candidate/SKILL.md');
  const labels = [...instructions.matchAll(/^- (.+?)：(New|Observed)\b/gmu)].map((match) => match[1]);
  expect(labels).toHaveLength(2);
  return markdown
    .replace(/^(\s+-\s*)(?:Origin|问题来源)\s*[:：]/gmu, `$1${labels[0]}：`)
    .replace(/^(\s+-\s*)(?:Reproduction|复现观测)\s*[:：]/gmu, `$1${labels[1]}：`);
}

function documentedReproductionExamples() {
  const instructions = readText('evaluation/prototypes/origin-occurrence/fe-code-review-origin-candidate/SKILL.md');
  const examples = [...instructions.matchAll(/^ {2}- Reproduction: (.+)$/gmu)].map((match) => match[1]);
  expect(examples).toHaveLength(3);
  const counts: Record<string, string> = { 'n/N': '2/5', 'a/A': '1/3', 'b/B': '0/4' };
  return examples.map((value) => value.replace(/\b(?:n\/N|a\/A|b\/B)\b/gu, (count) => counts[count]));
}

// Checks the authored Fix examples, not arbitrary model-output closure semantics.
function fixExampleTallies(markdown: string, chinese: boolean) {
  const statuses = ['Resolved', 'Partially Resolved', 'Unresolved', 'Cannot Verify'];
  const labels = chinese ? ['已解决', '部分解决', '未解决', '无法验证', '新增回归'] : [...statuses, 'New Regression'];
  const summary = labels.map((label) => {
    const match = markdown.match(new RegExp(`^- ${label}[:：]\\s*(\\d+)\\s*$`, 'mu'));
    return match ? Number(match[1]) : null;
  });
  const current = [...markdown.matchAll(/^ {2}- (?:Current status|当前状态)[:：]\s*(Resolved|Partially Resolved|Unresolved|Cannot Verify)(?=\s|：|$)/gmu)]
    .map((match) => match[1]);
  const regressions = validateOriginOccurrenceCandidate(markdown, 'fix').findings.filter((finding: any) => finding.kind === 'regression');
  return { summary, details: [...statuses.map((status) => current.filter((value) => value === status).length), regressions.length] };
}

// Minimal authored parser reports, not complete mode templates or model-generated acceptance evidence.
function renderFixture(item: Fixture, chinese = false) {
  const label = (en: string, zh: string) => chinese ? zh : en;
  const metadata = (finding: Fixture['findings'][number]) =>
    `  - ${label('Origin', '问题来源')}: ${finding.origin}\n  - ${label('Reproduction', '复现观测')}: ${finding.reproduction}`;
  const renderFinding = (finding: Fixture['findings'][number]) => [
    `- [${finding.id}] [source-cases.mjs:7] ${item.scenario}`,
    ...(finding.kind === 'previous' ? [
      `  - ${label('Original severity', '原严重级别')}: ${finding.severity}`,
      `  - ${label('Current status', '当前状态')}: ${finding.status}`,
      `  - ${label('Before fix', '修复前行为')}: brokenUrl violates the supplied normalization contract.`,
      `  - ${label('After fix', '修复后行为')}: normalizedUrl restores the supplied contract.`,
    ] : [
      `  - ${label('Trigger', '触发场景')}: the explicitly supplied ${item.scenario} input.`,
      `  - ${label('Impact', '影响')}: the named source contract or maintenance owner is affected.`,
      ...(finding.severity === 'Blocking' ? [`  - ${label('Blocking outcome', '阻断结果')}: ${item.oracle.blockingOutcome} - synthetic auth contract rejects the current resume token.`] : []),
      `  - ${label('Root cause', '根因')}: see the supplied baseline/current source comparison.`,
      `  - ${label('Suggested fix', '建议方案')}: restore the stated contract within the existing owner.`,
      `  - ${label('Verification', '验证方式')}: exercise the explicitly supplied contract and preserve adjacent behavior.`,
    ]), metadata(finding),
  ].join('\n');
  const severitySections = (findings: Fixture['findings'], level: string) =>
    ['Blocking', 'Risk', 'Improve'].map((severity) => `${level} ${severity}\n\n${findings.filter((finding) =>
      finding.severity === severity).map(renderFinding).join('\n\n') || label('No clear issue.', '无明确问题。')}`).join('\n\n');
  if (item.mode === 'fix') {
    return `## ${label('Review Conclusion', '回审结论')}\n\n${item.oracle.recommendation}\n\n` +
      `## ${label('Review Scope', '回审范围')}\n\nOriginal attribution and fix closure use distinct declared baselines.\n\n` +
      `## ${label('Issue Verification', 'Issue Verification：问题验证')}\n\n${item.findings.filter((finding) => finding.kind === 'previous').map(renderFinding).join('\n\n')}\n\n` +
      `## ${label('New Regression', 'New Regression：新增回归')}\n\n${severitySections(item.findings.filter((finding) => finding.kind === 'regression'), '###')}\n\n` +
      `## Behavior Delta\n\nRestore normalization; inspect directly affected cache exposure only.\n\n## Test Gaps\n\nNo browser or production validation.\n\n` +
      `## Evidence\n\nEvaluator-only public synthetic inputs: ${item.id}.\n\n## ${label('Final Recommendation', '最终建议')}\n\n${item.oracle.recommendation}\n`;
  }
  const coverage = item.findings.length ? item.findings.map((finding) =>
    `- [source-cases.mjs:7] ${finding.id} contract: declared baseline -> selected current; Disposition: [${finding.id}]`).join('\n') :
    '- [source-cases.mjs:7] relocation: correct owner -> same correct owner; Disposition: Behavior Preserving';
  return `## ${label('Overall Conclusion', '总体结论')}\n\n${item.oracle.recommendation}\n\n## ${label('Review Scope', '审查范围')}\n\nOnly supplied ${item.id} inputs; no runtime client.\n\n` +
    (item.mode === 'deep' ? '## Change Map\n\nDeclared initial baseline -> supplied current contract.\n\n' : '') +
    `## ${label('Changed-Condition Coverage', 'Changed-Condition Coverage：变更条件覆盖')}\n\n${coverage}\n\n` +
    (item.mode === 'deep' ? '## Findings\n\n' : '') + severitySections(item.findings, item.mode === 'deep' ? '###' : '##') +
    `\n\n## Design / Simplify\n\n${item.oracle.design ?? (item.id === 'O-12' ? 'Extract [F-001]' : 'Simplify [F-001]')}\n\n` +
    `## Naming / Readability\n\nNo clear issue.\n\n## File Placement / Module Boundary\n\nNo clear issue.\n\n` +
    `## Test Gaps\n\nNo browser or production evidence.\n\n## Evidence\n\nPublic synthetic input and declared observations: ${item.id}.\n\n` +
    `## ${label('Final Recommendation', '最终建议')}\n\n${item.oracle.recommendation}\n`;
}

describe('Origin/occurrence candidate field fixtures', () => {
  test.each(cases.filter((item) => item.id !== 'O-14').flatMap((item) => [
    { item, chinese: false, name: `${item.id} English` }, { item, chinese: true, name: `${item.id} Chinese labels` },
  ]))('$name passes field grammar and matches its explicit oracle labels/counts', ({ item, chinese }) => {
    const result = validateOriginOccurrenceCandidate(renderFixture(item, chinese), item.mode);
    expect(result.errors).toEqual([]);
    expect(result.structurallyValid).toBe(true);
    expect(result.baseValidation.report.valid).toBe(true);
    expect(result.semanticStatus).toBe('Not Evaluated');
    expect(result.findings.map((finding: any) => finding.origin.state)).toEqual(item.oracle.origins);
    expect(result.findings.map((finding: any) => finding.reproduction.map((group: any) => group.state))).toEqual(item.oracle.states);
    const counts = result.findings.flatMap((finding: any) => finding.reproduction.filter((group: any) => group.count)
      .map((group: any) => [group.count.failures, group.count.trials]));
    expect(counts).toEqual(item.oracle.counts ?? []);
    expect(result.findings.map((finding: any) => finding.id)).toEqual(item.findings.map((finding) => finding.id));
  });

  test.each(Object.entries(examples.examples))('accepts the documented bilingual labels in complete %s output', (filename, definition) => {
    const original = readText(`evaluation/prototypes/origin-occurrence/examples/${filename}`);
    const report = withDocumentedLabels(original);
    const result = evaluateOriginOccurrenceReport(report, definition.mode, definition.oracle);
    expect(result.candidate.errors).toEqual([]);
    expect(result.candidate.structurallyValid).toBe(true);
    expect(result.candidate.findings).toEqual(validateOriginOccurrenceCandidate(original, definition.mode).findings);
    expect(result.adjudication.status).toBe('Pass');
    expect(result.adjudication.reportAcceptance).toBe('Not Evaluated');
  });

  test('preserves original origin and separate pre/post observations with documented Fix labels', () => {
    const item = caseById('O-09');
    const result = evaluateOriginOccurrenceReport(withDocumentedLabels(renderFixture(item)), 'fix', item.oracle);
    expect(result.adjudication.status).toBe('Pass');
    expect(result.candidate.findings[0]).toMatchObject({ id: 'F-001', origin: { state: 'New' },
      reproduction: [{ context: 'pre-fix', count: { failures: 1, trials: 1 } },
        { context: 'post-fix', count: { failures: 0, trials: 1 } }] });
  });

  test('accepts a bold Fix status without changing field meaning or claiming full-report acceptance', () => {
    const item = caseById('O-09');
    const original = withDocumentedLabels(renderFixture(item, true));
    const report = original.replace('当前状态: Resolved', '当前状态: **Resolved：已解决**');
    expect(report).not.toBe(original);
    const result = evaluateOriginOccurrenceReport(report, 'fix', item.oracle);
    expect(result.candidate.baseValidation.status).toBe('Fail');
    expect(result.candidate.emphasisCompatibility.status).toBe('Pass');
    expect(result.candidate.baseValidation.report.errors).toContainEqual(expect.objectContaining({ type: 'fix-finding-status-count' }));
    expect(result.candidate.findings).toEqual(evaluateOriginOccurrenceReport(original, 'fix', item.oracle).candidate.findings);
    expect(result.adjudication.status).toBe('Pass');
    expect(result.adjudication.reportAcceptance).toBe('Not Evaluated');
  });

  test.each([
    ['Resolved', '已解决'],
    ['Partially Resolved', '部分解决'],
    ['Unresolved', '未解决'],
    ['Cannot Verify', '无法验证'],
  ].flatMap(([status, translation]) => [
    { label: 'Current status:', value: status },
    { label: '当前状态：', value: `${status}：${translation}` },
    { label: 'Current status:', value: `**${status}**` },
    { label: '当前状态：', value: `**${status}：${translation}**` },
    { label: '当前状态：', value: `**${status}**：${translation}` },
  ]))('accepts candidate Fix status $label $value while retaining the raw check', ({ label, value }) => {
    const original = renderFixture(caseById('O-09'));
    const report = original.replace('Current status: Resolved', `${label} ${value}`);
    const result = validateOriginOccurrenceCandidate(report, 'fix');
    expect(result.structurallyValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.findings).toEqual(validateOriginOccurrenceCandidate(original, 'fix').findings);
    expect(result.baseValidation.report).toEqual(validateReviewOutput(report, 'fix'));
    expect(result.emphasisCompatibility.status).toBe(value.startsWith('**') ? 'Pass' : 'Not Applicable');
    expect(result.semanticStatus).toBe('Not Evaluated');
  });

  test.each([
    '**Fixed**', '**Resolved', '**Resolved*', '***Resolved***', '**Resolved / Unresolved**',
    '**ResolvedExtra**', '**Resolved：已解决 / Cannot Verify：无法验证**', '**Resolved** / Unresolved',
  ])('rejects unsupported or malformed candidate Fix status %s', (value) => {
    const report = renderFixture(caseById('O-09')).replace('Current status: Resolved', `Current status: ${value}`);
    const result = validateOriginOccurrenceCandidate(report, 'fix');
    expect(result.structurallyValid).toBe(false);
    expect(result.baseValidation.report.errors).toContainEqual(expect.objectContaining({
      type: 'fix-finding-status-count', findingId: 'F-001', actual: 0, expected: 1,
    }));
  });

  test.each(['Resolved', '**Resolved**'])('counts %s plus a bold status as two statuses', (first) => {
    const report = renderFixture(caseById('O-09')).replace('Current status: Resolved',
      `Current status: ${first}\n  - 当前状态：**Cannot Verify：无法验证**`);
    const result = validateOriginOccurrenceCandidate(report, 'fix');
    expect(result.structurallyValid).toBe(false);
    expect(result.emphasisCompatibility.status).toBe('Fail');
    expect(result.emphasisCompatibility.report.errors).toContainEqual(expect.objectContaining({
      type: 'fix-finding-status-count', findingId: 'F-001', actual: 2, expected: 1,
    }));
  });

  test.each([
    { suffix: '\n## Changed-Condition Coverage\n\n- forbidden ledger\n', error: 'fix-review-coverage-ledger-forbidden' },
    { suffix: '\n## Issue Verification\n\n- [F-001] Duplicate section\n  - Current status: Resolved\n', error: 'fix-verification-section-count' },
  ])('does not mask $error when accepting candidate status emphasis', ({ suffix, error }) => {
    const report = renderFixture(caseById('O-09')).replace('Current status: Resolved', 'Current status: **Resolved**') + suffix;
    const result = validateOriginOccurrenceCandidate(report, 'fix');
    expect(result.structurallyValid).toBe(false);
    expect(result.emphasisCompatibility.status).toBe('Fail');
    expect(result.emphasisCompatibility.report.errors).toContainEqual(expect.objectContaining({ type: error }));
  });

  test.each(['O-01', 'O-05', 'O-09'].flatMap((id) => [0, 1, 2].map((example) => ({ id, example }))))
    ('$id parses documented reproduction example $example without changing its group meaning', ({ id, example }) => {
      const item = structuredClone(caseById(id));
      item.findings[0].reproduction = documentedReproductionExamples()[example];
      const result = validateOriginOccurrenceCandidate(withDocumentedLabels(renderFixture(item)), item.mode);
      const expected = [
        [{ context: null, state: 'Observed', count: { failures: 2, trials: 5 } }],
        [{ context: 'group-a', state: 'Observed', count: { failures: 1, trials: 3 } },
          { context: 'group-b', state: 'Observed', count: { failures: 0, trials: 4 } }],
        [{ context: 'group-a', state: 'Observed', count: { failures: 1, trials: 3 } },
          { context: 'group-b', state: 'Cannot Verify', count: null }],
      ];
      expect(result.errors).toEqual([]);
      expect(result.structurallyValid).toBe(true);
      expect(result.findings[0].reproduction).toMatchObject(expected[example]);
      expect(result.findings[0].reproduction).toHaveLength(expected[example].length);
      expect(result.semanticStatus).toBe('Not Evaluated');
    });

  test.each([
    { example: 1, from: '[group-b]', to: '[group-a]', error: 'candidate-observation-groups-ambiguous' },
    { example: 1, from: '[group-b] Observed - ', to: '[group-b] ', error: 'candidate-reproduction-state-or-evidence-missing' },
    { example: 1, from: ' | ', to: '; ', error: 'candidate-observation-count-required' },
    { example: 2, from: 'Cannot Verify - ', to: 'Cannot Verify - 1/2 ', error: 'candidate-count-without-observation' },
  ])('rejects a documented grouping mutation: $error', ({ example, from, to, error }) => {
    const item = structuredClone(caseById('O-01'));
    const original = documentedReproductionExamples()[example];
    item.findings[0].reproduction = original.replace(from, to);
    expect(item.findings[0].reproduction).not.toBe(original);
    const result = validateOriginOccurrenceCandidate(renderFixture(item), item.mode);
    expect(result.structurallyValid).toBe(false);
    expect(result.errors).toContainEqual(expect.objectContaining({ type: error }));
  });

  test.each([
    ['Origin', 'origin', 'New - duplicate origin evidence.'],
    ['问题来源', 'origin', 'New - duplicate origin evidence.'],
    ['Reproduction', 'reproduction', 'Not Run - duplicate observation evidence.'],
    ['复现观测', 'reproduction', 'Not Run - duplicate observation evidence.'],
  ])('counts bilingual and %s aliases as duplicate fields', (label, key, value) => {
    const report = withDocumentedLabels(renderFixture(caseById('O-01')))
      .replace('  - 问题来源 / Origin：', `  - ${label}: ${value}\n  - 问题来源 / Origin：`);
    const result = validateOriginOccurrenceCandidate(report, 'quick');
    expect(result.errors).toContainEqual(expect.objectContaining({ type: `candidate-${key}-field-count`, actual: 2 }));
    expect(result.structurallyValid).toBe(false);
  });

  test.each(['问题来源 / Origin：New - misplaced origin.', '复现观测 / Reproduction：Not Run - misplaced evidence.'])
    ('rejects a bilingual field outside a Finding: %s', (field) => {
      const report = `${renderFixture(caseById('O-13'))}\n  - ${field}`;
      const result = validateOriginOccurrenceCandidate(report, 'quick');
      expect(result.errors).toContainEqual(expect.objectContaining({ type: 'candidate-metadata-outside-finding' }));
      expect(result.findings).toEqual([]);
      expect(result.structurallyValid).toBe(false);
    });

  test.each(['3/2', '0/0'])('still rejects invalid count %s under a bilingual label', (count) => {
    const report = withDocumentedLabels(renderFixture(caseById('O-06'))).replace('2/3', count);
    expect(validateOriginOccurrenceCandidate(report, 'quick').errors)
      .toContainEqual(expect.objectContaining({ type: 'candidate-observation-count-invalid' }));
  });

  test('still rejects an unsupported probability under a bilingual label', () => {
    const report = withDocumentedLabels(renderFixture(caseById('O-06'))).replace('2/3 completed', '2/3, production probability 1%; completed');
    expect(validateOriginOccurrenceCandidate(report, 'quick').errors)
      .toContainEqual(expect.objectContaining({ type: 'candidate-percentage-literal-unsupported' }));
  });

  test.each([
    ['O-01', 'Origin： New', 'Origin： Retained'],
    ['O-08', '1/2 valid', '1/3 valid'],
  ])('bilingual grammar does not turn unsupported %s semantics into an oracle pass', (id, from, to) => {
    const item = caseById(id);
    const report = withDocumentedLabels(renderFixture(item)).replace(from, to);
    const result = evaluateOriginOccurrenceReport(report, item.mode, item.oracle);
    expect(result.candidate.structurallyValid).toBe(true);
    expect(result.adjudication.status).toBe('Fail');
    expect(result.adjudication.reportAcceptance).toBe('Not Evaluated');
  });

  test.each(caseById('O-14').input.invalidCounts)('rejects invalid observed count %s', (count) => {
    const report = renderFixture(caseById('O-06')).replace('2/3', count);
    const result = validateOriginOccurrenceCandidate(report, 'quick');
    expect(result.metadataValid).toBe(false);
    expect(result.errors).toContainEqual(expect.objectContaining({ type: 'candidate-observation-count-invalid' }));
  });

  test.each(caseById('O-14').input.unsupportedPercentages)('rejects a percentage literal: %s', (percentage) => {
    const report = renderFixture(caseById('O-06')).replace('2/3 completed', `2/3, production probability ${percentage}; completed`);
    expect(validateOriginOccurrenceCandidate(report, 'quick').errors)
      .toContainEqual(expect.objectContaining({ type: 'candidate-percentage-literal-unsupported' }));
  });

  test('accepts Chinese state descriptions, evidence and unspaced occurrence units', () => {
    const item = structuredClone(caseById('O-06'));
    item.findings[0].origin = 'New：本次引入；原始基线有版本保护，当前分支移除了保护，旧响应可以覆盖新状态。';
    item.findings[0].reproduction = 'Observed：已观测；本地 Node 合成场景共2/3次失败；证据为 mixed-current 的逐次记录，环境及 revision 相同。';
    const result = validateOriginOccurrenceCandidate(renderFixture(item, true), 'quick');
    expect(result.errors).toEqual([]);
    expect(result.findings[0].reproduction[0].count).toEqual({ failures: 2, trials: 3 });
  });

  test.each([
    ['missing-origin', '  - Origin: New - initial source changed.', ''],
    ['duplicate-origin', '  - Origin: New - initial source changed.', '  - Origin: New - baseline evidence.\n  - 问题来源: New - duplicate evidence.'],
    ['unknown-label', '  - Origin: New - initial source changed.', '  - Origin: ProbablyNew - unsupported state.'],
    ['empty-origin', '  - Origin: New - initial source changed.', '  - Origin: New'],
    ['translation-only', '  - Origin: New - initial source changed.', '  - Origin: New：本次引入'],
    ['missing-reproduction', '  - Reproduction: Not Run - no execution evidence.', ''],
    ['count-without-run', '  - Reproduction: Not Run - no execution evidence.', '  - Reproduction: Not Run - 1/1 inferred from source.'],
    ['count-without-context', '  - Reproduction: Not Run - no execution evidence.', '  - Reproduction: Observed - 2/3'],
    ['observed-without-count', '  - Reproduction: Not Run - no execution evidence.', '  - Reproduction: Observed - executed somewhere.'],
    ['two-counts-one-group', '  - Reproduction: Not Run - no execution evidence.', '  - Reproduction: Observed - 1/2 Node and 3/4 browser trials.'],
    ['ambiguous-groups', '  - Reproduction: Not Run - no execution evidence.', '  - Reproduction: Observed - 1/2 Node trials. | Observed - 3/4 browser trials.'],
  ])('rejects %s', (_name, original, replacement) => {
    const item = structuredClone(caseById('O-01'));
    item.findings[0].origin = 'New - initial source changed.';
    item.findings[0].reproduction = 'Not Run - no execution evidence.';
    expect(validateOriginOccurrenceCandidate(renderFixture(item).replace(original, replacement), 'quick').metadataValid).toBe(false);
  });

  test('keeps unsupported runtime evidence separate from prior valid observations', () => {
    const report = renderFixture(caseById('O-09')).replace(
      /\[post-fix\] Observed[^\n]+/u, '[post-fix] Cannot Verify - equivalent WebView environment unavailable; no valid post-fix trial.');
    const result = validateOriginOccurrenceCandidate(report, 'fix');
    expect(result.metadataValid).toBe(true);
    expect(result.findings[0].reproduction.map((group: any) => group.state)).toEqual(['Observed', 'Cannot Verify']);
    // Grammar does not approve the authored Resolved status when required runtime evidence is absent.
    expect(result.semanticStatus).toBe('Not Evaluated');
  });

  test('does not relabel a retained defect as a New Regression', () => {
    const report = renderFixture(caseById('O-10')).replace('Origin: Amplified', 'Origin: Retained');
    expect(validateOriginOccurrenceCandidate(report, 'fix').errors)
      .toContainEqual(expect.objectContaining({ type: 'candidate-regression-origin-unsupported' }));
  });

  test('inspects legacy prose metadata without inventing IDs or claiming a stable validator pass', () => {
    const report = renderFixture(caseById('O-11')).replace('- [F-001] [source-cases.mjs:7]', '- [source-cases.mjs:7]');
    const result = validateOriginOccurrenceCandidate(report, 'fix');
    expect(result.metadataValid).toBe(true);
    expect(result.findings[0].id).toBeNull();
    expect(result.findings[0].origin.state).toBe('Unknown');
    expect(result.baseValidation.status).toBe('Pass (candidate-legacy)');
    expect(result.legacyCompatibility).toBe('Pass');
    expect(result.baseValidation.report.valid).toBe(false);
    expect(result.structurallyValid).toBe(true);
  });

  test('rejects legacy Fix output with a missing status instead of weakening the adapter', () => {
    const report = renderFixture(caseById('O-11'), true)
      .replace('- [F-001] [source-cases.mjs:7]', '- [source-cases.mjs:7]')
      .replace(/^\s*- 当前状态\s*[:：].*$/mu, '');
    const result = validateOriginOccurrenceCandidate(report, 'fix');
    expect(result.legacyCompatibility).toBe('Fail');
    expect(result.structurallyValid).toBe(false);
    expect(result.errors).toContainEqual(expect.objectContaining({ type: 'candidate-legacy-status-count' }));
  });

  test('does not retroactively require metadata in stable saved outputs', () => {
    const report = renderFixture(caseById('O-01')).split('\n').filter((line) => !/  - (Origin|Reproduction):/u.test(line)).join('\n');
    expect(validateReviewOutput(report, 'quick').valid).toBe(true);
    expect(validateOriginOccurrenceCandidate(report, 'quick').metadataValid).toBe(false);
  });

  test('rejects misplaced metadata and does not manufacture a Finding in Keep output', () => {
    const report = renderFixture(caseById('O-13'));
    expect(validateOriginOccurrenceCandidate(report, 'quick').findings).toEqual([]);
    expect(validateOriginOccurrenceCandidate(`${report}\n  - Origin: New - outside any finding.`, 'quick').metadataValid).toBe(false);
  });

  test('does not use fenced example fields to satisfy missing real metadata', () => {
    const report = renderFixture(caseById('O-01')).replace('  - Origin:', '```md\n  - Origin:').replace('  - Reproduction:', '```\n  - Reproduction:');
    expect(validateOriginOccurrenceCandidate(report, 'quick').errors)
      .toContainEqual(expect.objectContaining({ type: 'candidate-origin-field-count', actual: 0 }));
  });

  test('preserves base coverage failures instead of passing only the new fields', () => {
    const report = renderFixture(caseById('O-01')).replace('declared baseline -> selected current', 'current only');
    const result = validateOriginOccurrenceCandidate(report, 'quick');
    expect(result.metadataValid).toBe(true);
    expect(result.baseValidation.status).toBe('Fail');
    expect(result.structurallyValid).toBe(false);
  });

  test('a false origin can pass grammar, but fails the explicit evidence-backed fixture oracle', () => {
    const item = caseById('O-01');
    const report = renderFixture(item).replace('Origin: New', 'Origin: Retained');
    const result = validateOriginOccurrenceCandidate(report, 'quick');
    expect(result.structurallyValid).toBe(true);
    expect(result.findings[0].origin.state).not.toBe(item.oracle.origins![0]);
    expect(result.semanticStatus).toBe('Not Evaluated');
  });

  test('a numerically valid ratio can still contradict raw observations', () => {
    const item = caseById('O-08');
    const result = validateOriginOccurrenceCandidate(renderFixture(item).replace('1/2 valid', '1/3 valid'), 'quick');
    expect(result.structurallyValid).toBe(true);
    const count = result.findings[0].reproduction[0].count;
    expect([count.failures, count.trials]).not.toEqual(item.oracle.counts![0]);
    expect(result.semanticStatus).toBe('Not Evaluated');
  });

  test.each(cases.filter((item) => item.id !== 'O-14'))('%s authored report matches its synthetic oracle', (item) => {
    const result = evaluateOriginOccurrenceReport(renderFixture(item), item.mode, item.oracle);
    expect(result.adjudication.status).toBe('Pass');
    expect(result.adjudication.checks).toEqual({ findingCount: true, originStates: true,
      reproductionStates: true, observationCounts: true, candidateStructure: true });
  });

  test('separates structural validity from semantic adjudication for a wrong origin', () => {
    const item = caseById('O-01');
    const result = evaluateOriginOccurrenceReport(renderFixture(item).replace('Origin: New', 'Origin: Retained'), 'quick', item.oracle);
    expect(result.candidate.structurallyValid).toBe(true);
    expect(result.adjudication.status).toBe('Fail');
    expect(result.adjudication.checks.originStates).toBe(false);
    expect(result.adjudication.checks.candidateStructure).toBe(true);
  });

  test('separates structural validity from semantic adjudication for a wrong valid count', () => {
    const item = caseById('O-08');
    const result = evaluateOriginOccurrenceReport(renderFixture(item).replace('1/2 valid', '1/3 valid'), 'quick', item.oracle);
    expect(result.candidate.structurallyValid).toBe(true);
    expect(result.adjudication.status).toBe('Fail');
    expect(result.adjudication.checks.observationCounts).toBe(false);
  });

  test('does not mark semantic status on the parser result itself', () => {
    const item = caseById('O-06');
    const result = adjudicateOriginOccurrenceCandidate(
      validateOriginOccurrenceCandidate(renderFixture(item), item.mode), item.oracle,
    );
    expect(result.semanticStatus).toBe('Pass');
    expect(validateOriginOccurrenceCandidate(renderFixture(item), item.mode).semanticStatus).toBe('Not Evaluated');
    expect(result.limitation).toContain('authored synthetic oracle');
  });

  test.each([
    { name: 'absent oracle', oracle: undefined },
    { name: 'null oracle', oracle: null },
    { name: 'empty oracle', oracle: {} },
    { name: 'mutation instructions instead of expectations', oracle: caseById('O-14').oracle },
    { name: 'missing states', oracle: { origins: [] } },
    { name: 'missing origins', oracle: { states: [] } },
    { name: 'mismatched finding counts', oracle: { origins: ['New'], states: [] } },
    { name: 'unsupported origin', oracle: { origins: ['Maybe'], states: [['Not Run']] } },
    { name: 'unsupported reproduction state', oracle: { origins: ['New'], states: [['Maybe']] } },
    { name: 'empty reproduction group', oracle: { origins: ['New'], states: [[]] } },
    { name: 'Observed without counts', oracle: { origins: ['New'], states: [['Observed']] } },
    { name: 'counts without Observed', oracle: { origins: ['New'], states: [['Not Run']], counts: [[1, 1]] } },
    { name: 'null counts', oracle: { origins: [], states: [], counts: null } },
    { name: 'impossible count', oracle: { origins: ['New'], states: [['Observed']], counts: [[2, 1]] } },
    { name: 'string count', oracle: { origins: ['New'], states: [['Observed']], counts: [['1', '1']] } },
  ])('rejects $name instead of treating it as an empty expected report', ({ oracle }) => {
    const candidate = validateOriginOccurrenceCandidate(renderFixture(caseById('O-13')), 'quick');
    expect(() => adjudicateOriginOccurrenceCandidate(candidate, oracle)).toThrow(/Invalid origin\/occurrence oracle/u);
  });
});

describe('Canonical Blocking outcomes with candidate metadata', () => {
  const reports = ['quick', 'deep'].flatMap((mode) => [false, true].map((chinese) => {
    const item = structuredClone(caseById('O-05'));
    item.mode = mode;
    return { mode, language: chinese ? 'Chinese' : 'English', item,
      report: withDocumentedLabels(renderFixture(item, chinese)) };
  }));

  test.each(reports)('$mode $language preserves the canonical outcome and unobserved source finding', ({ mode, item, report }) => {
    const result = evaluateOriginOccurrenceReport(report, mode, item.oracle);
    expect(result.candidate.baseValidation.report).toMatchObject({ valid: true, blockingFindingCount: 1, errors: [] });
    expect(result.candidate.findings[0]).toMatchObject({ severity: 'Blocking', origin: { state: 'New' },
      reproduction: [{ state: 'Not Run', count: null }] });
    expect(result.adjudication.status).toBe('Pass');
    expect(result.adjudication.reportAcceptance).toBe('Not Evaluated');
  });

  test.each(reports.flatMap((entry) => [
    'Authentication failure', 'login/auth failure', 'Login / Auth Failure', '**Login/Auth Failure**',
  ].map((outcome) => ({ ...entry, outcome }))))
    ('$mode $language rejects noncanonical outcome $outcome despite correct candidate fields', ({ mode, item, report, outcome }) => {
      const changed = report.replace('Login/Auth Failure - ', `${outcome} - `);
      expect(changed).not.toBe(report);
      const result = evaluateOriginOccurrenceReport(changed, mode, item.oracle);
      expect(result.candidate.metadataValid).toBe(true);
      expect(result.candidate.structurallyValid).toBe(false);
      expect(result.candidate.baseValidation.report.errors).toEqual([
        expect.objectContaining({ findingId: 'F-001', type: 'blocking-outcome-unsupported' }),
      ]);
      expect(result.adjudication.checks).toEqual({ findingCount: true, originStates: true,
        reproductionStates: true, observationCounts: true, candidateStructure: false });
      expect(result.adjudication.status).toBe('Fail');
      expect(result.adjudication.reportAcceptance).toBe('Not Evaluated');
    });

  test.each(['quick', 'deep'])('%s canonical syntax alone does not validate the claimed outcome', (mode) => {
    const item = structuredClone(caseById('O-05'));
    item.mode = mode;
    const report = renderFixture(item).replace('Login/Auth Failure - ', 'Build Failure - ');
    expect(source.authenticationFlow(item.input.current)).toBe(401);
    expect(item.oracle.blockingOutcome).toBe('Login/Auth Failure');
    const result = evaluateOriginOccurrenceReport(report, mode, item.oracle);
    // A listed but causally wrong outcome still needs the separate full-report evidence check.
    expect(result.candidate.structurallyValid).toBe(true);
    expect(result.adjudication.status).toBe('Pass');
    expect(result.adjudication.evaluatedScope).toBe('origin-reproduction-fields-only');
    expect(result.adjudication.reportAcceptance).toBe('Not Evaluated');
  });
});

describe('Public synthetic origin/occurrence source and observation contracts', () => {
  test('covers all 14 planned cases without invoking a model', () => {
    expect(cases.map((item) => item.id)).toEqual(Array.from({ length: 14 }, (_, index) => `O-${String(index + 1).padStart(2, '0')}`));
    expect(data.modelInvocations).toBe(0);
    expect(data.status).toBe('offline-prototype-only');
  });

  test('keeps the complete example-oracle map explicit and offline', () => {
    expect(examples).toMatchObject({ version: 1, status: 'offline-prototype-only' });
    expect(Object.keys(examples.examples).sort()).toEqual([
      'deep.en.md', 'deep.zh-CN.md', 'fix.en.md', 'fix.zh-CN.md', 'quick.en.md', 'quick.zh-CN.md',
    ]);
    for (const definition of Object.values(examples.examples)) {
      expect(['quick', 'deep', 'fix']).toContain(definition.mode);
      expect(definition.oracle).toEqual(expect.objectContaining({ origins: expect.any(Array), states: expect.any(Array), counts: expect.any(Array) }));
    }
  });

  test('O-01/O-02/O-04 distinguish new, retained and missing-baseline evidence', () => {
    const introduced = caseById('O-01').input;
    expect(source.normalizedUrl(...introduced.args)).toBe(introduced.expected);
    expect(source.brokenUrl(...introduced.args)).not.toBe(introduced.expected);
    const retained = caseById('O-02').input;
    expect(source.retainedUrlBefore(...retained.args)).not.toBe(retained.expected);
    expect(source.retainedUrlAfter(...retained.args)).toBe(source.retainedUrlBefore(...retained.args));
    const unknown = caseById('O-04').input;
    expect(unknown.baseline).toBeNull();
    expect(source.brokenUrl(...unknown.args)).not.toBe(unknown.expected);
  });

  test('O-03/O-10 show an existing collision and a concrete exposure expansion, not a frequency estimate', () => {
    expect(new Set(source.previousAccounts.map(source.sharedCacheKey)).size).toBeLessThan(source.previousAccounts.length);
    expect(source.expandedAccounts).toEqual([...source.previousAccounts, 'gamma']);
    expect(source.sharedCacheKey('gamma')).toBe(source.sharedCacheKey('alpha'));
  });

  test('O-05 exercises the supported restrictive auth state and its ordinary-path control', () => {
    const input = caseById('O-05').input;
    expect(source.authenticationFlow(input.baseline)).toBe(200);
    expect(source.authenticationFlow(input.current)).toBe(401);
    expect(source.authenticationFlow(input.control)).toBe(200);
  });

  test.each(['O-06', 'O-07', 'O-08'])('%s observation counts agree with individually replayed valid trials', (id) => {
    const item = caseById(id);
    const group = data.observationGroups[item.input.observations];
    const completed = group.trials.filter((trial: { completed: boolean }) => trial.completed);
    const outcomes = completed.map((trial: { order: number[]; outcome: string }) => {
      const failure = source.applyResponses(trial.order) !== 2;
      expect(trial.outcome).toBe(failure ? 'failure' : 'success');
      return failure;
    });
    expect([outcomes.filter(Boolean).length, outcomes.length]).toEqual(item.oracle.counts![0]);
    expect(group.environment).toContain('local Node');
    expect(group.revision).toBe('unguarded-current');
    expect(group.unit).toBe('one completed two-response scenario');
    if (id === 'O-08') expect(group.trials.length - completed.length).toBe(1);
  });

  test('O-07 distinguishes non-refuting samples from a genuinely refuted causal claim', () => {
    const order = caseById('O-07').input.reachableCounterSchedule;
    expect(source.applyResponses(order)).toBe(1);
    expect(source.applyResponsesWithGuard(order)).toBe(2);
    expect(source.applyResponsesWithGuard([1, 2])).toBe(2);
    const refuted = structuredClone(caseById('O-07'));
    refuted.findings = [];
    refuted.oracle = { origins: [], states: [], design: 'Keep', recommendation: 'can-submit' };
    expect(validateOriginOccurrenceCandidate(renderFixture(refuted), 'quick').findings).toEqual([]);
  });

  test('O-09 pre/post raw observations agree with separate executions and are never pooled', () => {
    const item = caseById('O-09');
    const actual = [source.brokenUrl(...item.input.args), source.normalizedUrl(...item.input.args)];
    const counts = item.input.observations.map((observation: { completed: boolean; phase: string; actual: string; outcome: string }, index: number) => {
      expect(observation.completed).toBe(true);
      expect(observation.phase).toBe(index === 0 ? 'pre-fix' : 'post-fix');
      expect(observation.actual).toBe(actual[index]);
      expect(observation.outcome).toBe(actual[index] === item.input.expected ? 'success' : 'failure');
      return [Number(observation.outcome === 'failure'), 1];
    });
    expect(counts).toEqual(item.oracle.counts);
  });

  test.each(['O-09', 'O-11'])('%s closure evidence does not redefine original attribution', (id) => {
    const item = caseById(id);
    expect(source.brokenUrl(...item.input.args)).not.toBe(item.input.expected);
    expect(source.normalizedUrl(...item.input.args)).toBe(item.input.expected);
    expect(item.findings[0].status).toBe('Resolved');
    expect(item.findings[0].severity).toBe(item.input.previous.severity);
    expect(item.oracle.origins).toEqual(id === 'O-09' ? ['New'] : ['Unknown']);
  });

  test('O-12/O-13 separate an explicit duplicated-rule maintenance contract from correct relocation', () => {
    for (const value of caseById('O-12').input.values) {
      expect(source.copiedProfileLabel(value)).toBe(source.profileLabel(value));
      expect(source.relocatedLabel(value)).toBe(source.profileLabel(value));
    }
    expect(caseById('O-12').input.contract).toContain('same profile-label rule');
    expect(caseById('O-12').oracle.recommendation).toBe('can-submit');
    expect(caseById('O-13').findings).toEqual([]);
    expect(caseById('O-13').oracle.design).toBe('Keep');
  });

  test('preserves frozen production validators, oracles and baseline version', () => {
    const plan = JSON.parse(readText('evaluation/runtime-windows/v0.5.0-codex-runtime-acceptance-plan.json'));
    for (const [filename, hash] of Object.entries({ ...plan.baseline.toolingHashes, ...plan.baseline.oracleHashes })) {
      expect(crypto.createHash('sha256').update(readText(`evaluation/baselines/pre-v0.6.0/${filename}`)).digest('hex')).toBe(hash);
    }
    expect(JSON.parse(readText('evaluation/baselines/pre-v0.6.0/package.json')).version).toBe('0.5.0');
  });
});

describe('Candidate validator local CLI', () => {
  const directories: string[] = [];
  afterEach(() => directories.splice(0).forEach((directory) => fs.rmSync(directory, { recursive: true, force: true })));

  test('reads one report and returns JSON without modifying it', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'origin-occurrence-cli-'));
    directories.push(directory);
    const filename = path.join(directory, 'review.md');
    const markdown = renderFixture(caseById('O-06'), true);
    fs.writeFileSync(filename, markdown);
    const result = spawnSync(process.execPath, [path.join(rootDir, 'scripts/validate-origin-occurrence-candidate.mjs'),
      '--mode', 'quick', filename], { encoding: 'utf8', shell: false, env: { LANG: 'C', LC_ALL: 'C' } });
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({ metadataValid: true, structurallyValid: true, semanticStatus: 'Not Evaluated' });
    expect(fs.readFileSync(filename, 'utf8')).toBe(markdown);
    expect(fs.readdirSync(directory)).toEqual(['review.md']);
  });

  test('requires an explicit mode and report path', () => {
    const result = spawnSync(process.execPath, [path.join(rootDir, 'scripts/validate-origin-occurrence-candidate.mjs')],
      { encoding: 'utf8', shell: false, env: { LANG: 'C', LC_ALL: 'C' } });
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('Usage:');
  });

  test.each([
    ['quick.zh-CN.md', 'quick'], ['quick.en.md', 'quick'],
    ['deep.zh-CN.md', 'deep'], ['deep.en.md', 'deep'],
    ['fix.zh-CN.md', 'fix'], ['fix.en.md', 'fix'],
  ])('full bilingual example %s passes stable and candidate contracts', (filename, mode) => {
    const markdown = readText(`evaluation/prototypes/origin-occurrence/examples/${filename}`);
    expect(validateReviewOutput(markdown, mode).valid).toBe(true);
    expect(validateOriginOccurrenceCandidate(markdown, mode)).toMatchObject({
      metadataValid: true, structurallyValid: true, semanticStatus: 'Not Evaluated',
    });
  });

  test.each(Object.entries(examples.examples))('full bilingual example %s matches its explicit example oracle', (filename, definition) => {
    const markdown = readText(`evaluation/prototypes/origin-occurrence/examples/${filename}`);
    const result = evaluateOriginOccurrenceReport(markdown, definition.mode, definition.oracle);
    expect(result.adjudication.status).toBe('Pass');
    expect(result.adjudication.checks).toEqual({ findingCount: true, originStates: true,
      reproductionStates: true, observationCounts: true, candidateStructure: true });
  });

  test.each(Object.entries(examples.examples))('CLI adjudicates example %s without changing the report', (filename, definition) => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'origin-occurrence-example-cli-'));
    directories.push(directory);
    const reportPath = path.join(directory, filename);
    const markdown = readText(`evaluation/prototypes/origin-occurrence/examples/${filename}`);
    fs.writeFileSync(reportPath, markdown);
    const result = spawnSync(process.execPath, [path.join(rootDir, 'scripts/adjudicate-origin-occurrence-candidate.mjs'),
      '--mode', definition.mode, '--example', filename, filename], { cwd: directory, encoding: 'utf8', shell: false, env: { LANG: 'C', LC_ALL: 'C' } });
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({ caseId: definition.caseId, adjudication: { status: 'Pass', semanticStatus: 'Pass' } });
    expect(fs.readFileSync(reportPath, 'utf8')).toBe(markdown);
    expect(fs.readdirSync(directory)).toEqual([filename]);
  });

  test.each([
    ['deep', '--case', 'O-01', 'requires mode quick'],
    ['quick', '--case', 'O-14', 'Invalid origin/occurrence oracle'],
    ['quick', '--case', 'O-99', 'Unknown origin/occurrence case'],
    ['quick', '--example', 'missing.md', 'Unknown origin/occurrence example'],
    ['quick', '--example', 'deep.en.md', 'requires mode deep'],
    ['invalid', '--case', 'O-01', 'Usage:'],
  ])('CLI rejects mode %s selector %s %s before returning an adjudication', (mode, flag, selector, message) => {
    const result = spawnSync(process.execPath, [path.join(rootDir, 'scripts/adjudicate-origin-occurrence-candidate.mjs'),
      '--mode', mode, flag, selector, path.join(rootDir, 'evaluation/prototypes/origin-occurrence/examples/deep.en.md')],
    { encoding: 'utf8', shell: false, env: { LANG: 'C', LC_ALL: 'C' } });
    expect(result.status).toBe(2);
    expect(result.stdout).toBe('');
    expect(result.stderr).toContain(message);
  });

  test.each(['O-01', 'O-13'])('CLI accepts explicit case %s expectations, including no-finding output', (id) => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'origin-occurrence-case-cli-'));
    directories.push(directory);
    const markdown = renderFixture(caseById(id));
    fs.writeFileSync(path.join(directory, 'review.md'), markdown);
    const result = spawnSync(process.execPath, [path.join(rootDir, 'scripts/adjudicate-origin-occurrence-candidate.mjs'),
      '--mode', 'quick', '--case', id, 'review.md'], { cwd: directory, encoding: 'utf8', shell: false, env: { LANG: 'C', LC_ALL: 'C' } });
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout).adjudication.status).toBe('Pass');
    expect(fs.readFileSync(path.join(directory, 'review.md'), 'utf8')).toBe(markdown);
  });

  test('CLI distinguishes a field mismatch from invalid evaluator input', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'origin-occurrence-mismatch-cli-'));
    directories.push(directory);
    fs.writeFileSync(path.join(directory, 'review.md'), renderFixture(caseById('O-01')).replace('Origin: New', 'Origin: Retained'));
    const result = spawnSync(process.execPath, [path.join(rootDir, 'scripts/adjudicate-origin-occurrence-candidate.mjs'),
      '--mode', 'quick', '--case', 'O-01', 'review.md'], { cwd: directory, encoding: 'utf8', shell: false, env: { LANG: 'C', LC_ALL: 'C' } });
    expect(result.status).toBe(1);
    expect(JSON.parse(result.stdout)).toMatchObject({ adjudication: { status: 'Fail', reportAcceptance: 'Not Evaluated', checks: { originStates: false } } });
  });

  test.each(['fix.en.md', 'fix.zh-CN.md'])('%s summary matches its actual closure and regression entries', (filename) => {
    const markdown = readText(`evaluation/prototypes/origin-occurrence/examples/${filename}`);
    const tally = fixExampleTallies(markdown, filename.includes('zh-CN'));
    expect(tally.details).toEqual([1, 0, 0, 0, 1]);
    expect(tally.summary).toEqual(tally.details);
  });

  test.each(['fix.en.md', 'fix.zh-CN.md'])('%s inconsistent summary is not covered by field-only adjudication', (filename) => {
    const markdown = readText(`evaluation/prototypes/origin-occurrence/examples/${filename}`)
      .replace(/^- (Resolved|已解决)([:：])\s*1$/mu, '- $1$2 0');
    const tally = fixExampleTallies(markdown, filename.includes('zh-CN'));
    expect(tally.summary).not.toEqual(tally.details);
    const result = evaluateOriginOccurrenceReport(markdown, 'fix', examples.examples[filename].oracle);
    expect(result.adjudication).toMatchObject({ status: 'Pass', evaluatedScope: 'origin-reproduction-fields-only', reportAcceptance: 'Not Evaluated' });
  });

  test('keeps the isolated candidate Skill separate from the released Skill tree', () => {
    const directory = 'evaluation/prototypes/origin-occurrence/fe-code-review-origin-candidate';
    const candidate = readText(`${directory}/SKILL.md`);
    expect(parseFrontmatter(candidate)).toMatchObject({ name: 'fe-code-review-origin-candidate' });
    expect(parseFrontmatter(candidate).name).toBe(path.basename(directory));
    expect(candidate).toContain('fe-code-review-origin-candidate');
    expect(candidate).toContain('does not authorize source transfer');
    expect(candidate).toContain('Never call a sample ratio a production probability');
    expect(fs.existsSync(path.join(rootDir, 'skills/fe-code-review/SKILL.md'))).toBe(true);
    expect(candidate).not.toContain('v0.5.0 Codex Runtime Acceptance');
  });
});
