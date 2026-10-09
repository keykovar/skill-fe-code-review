import { createHash } from 'node:crypto';
import { describe, expect, test } from 'vitest';
import { validateOriginOccurrenceCandidate } from '../scripts/validate-origin-occurrence-candidate.mjs';
import { validateOriginOccurrenceLegacyFix } from '../scripts/validate-origin-occurrence-legacy-fix.mjs';
import { adjudicateOriginOccurrenceCandidate } from '../scripts/adjudicate-origin-occurrence-candidate.mjs';
import { readText } from './test-utils';

const fixture = (items: string, regressions = 'No clear issue.', heading = 'Issue Verification') =>
  `## Review Conclusion\nReview again after changes.\n\n## ${heading}\n\n${items}\n\n## New Regression\n\n### Risk\n\n${regressions}\n\n## Final Recommendation\nReview again after changes.\n`;
const item = (title = 'Legacy URL issue', status = 'Resolved', metadata = '') =>
  `- ${title}\n  - Original severity: Risk\n  - Current status: ${status}\n  - Origin: Unknown - the original comparison is unavailable.\n  - Reproduction: Not Run - no execution observations supplied.\n${metadata}`;
const regression = (id = 'F-001') =>
  `- [${id}] [src/url.mjs:8] Repair expands a cache collision\n  - Origin: Amplified - the repair adds a consumer to the existing shared key.\n  - Reproduction: Not Run - the affected path was inspected statically.\n`;
const forbidden = '\n## Changed-Condition Coverage\n\n- [src/url.mjs:2] join: old -> new; Disposition: Behavior Preserving\n';
const inspect = (report: string) => validateOriginOccurrenceLegacyFix(report, 'fix');

describe('Explicit legacy-fix-10 compatibility', () => {
  test('rejects I-01 without changing the retained original false acceptance', () => {
    const report = fixture(item()) + forbidden;
    const raw = validateOriginOccurrenceCandidate(report, 'fix');
    expect(raw.structurallyValid).toBe(true);
    const result = inspect(report);
    expect(result.raw).toEqual(raw);
    expect(result.candidate.structurallyValid).toBe(false);
    expect(result.compatibility.errors).toContainEqual(expect.objectContaining({ type: 'fix-review-coverage-ledger-forbidden' }));
  });

  test.each(['Legacy URL issue', '[src/url.mjs:2] Legacy URL issue'])('accepts legacy prose %s without manufacturing an ID', (title) => {
    const result = inspect(fixture(item(title)));
    expect(result.compatibility.status).toBe('Pass');
    expect(result.candidate.structurallyValid).toBe(true);
    expect(result.candidate.findings[0].id).toBeNull();
    expect(result.candidate.baseValidation.report.valid).toBe(false);
    expect(result.candidate.baseValidation.status).toBe('Fail');
    expect(result.candidate.semanticStatus).toBe('Not Evaluated');
  });

  test.each(['Resolved', 'Partially Resolved', 'Unresolved', 'Cannot Verify', '**Resolved**', '**Resolved：已解决**', 'resolved', '**RESOLVED**'])('accepts an item-owned supported status %s', (status) => {
    expect(inspect(fixture(item('Legacy issue', status))).candidate.structurallyValid).toBe(true);
  });

  test('accepts bilingual fields and CRLF without modifying the input', () => {
    const report = fixture(item(), 'No clear issue.', 'Issue Verification：问题验证')
      .replace('Current status:', '当前状态：').replace('Origin:', '问题来源 / Origin：')
      .replace('Reproduction:', '复现观测 / Reproduction：').replaceAll('\n', '\r\n');
    const result = inspect(report);
    expect(result.candidate.structurallyValid).toBe(true);
    expect(result.raw).toEqual(validateOriginOccurrenceCandidate(report, 'fix'));
    expect(report).toContain('\r\n');
  });

  test.each([
    ['legacy then numbered', item() + '\n' + item('[F-003] [src/url.mjs:4] Numbered issue')],
    ['numbered then legacy', item('[F-003] [src/url.mjs:4] Numbered issue') + '\n' + item()],
  ])('supports %s and the next new-regression ID', (_name, items) => {
    const result = inspect(fixture(items, regression('F-004')));
    expect(result.candidate.structurallyValid).toBe(true);
    expect(result.candidate.findings.map((f: any) => f.id).filter(Boolean)).toEqual(['F-003', 'F-004']);
    expect(result.candidate.findings.filter((f: any) => !f.id)).toHaveLength(1);
  });

  test('starts regression IDs at F-001 when prior issues have no IDs', () => {
    expect(inspect(fixture(item(), regression())).candidate.structurallyValid).toBe(true);
  });

  test('rejects duplicated and missing item statuses even when the total matches', () => {
    const first = item('First', 'Resolved', '  - Current status: Unresolved\n');
    const second = item('Second').replace('  - Current status: Resolved\n', '');
    const result = inspect(fixture(first + '\n' + second));
    expect(result.raw.structurallyValid).toBe(true);
    expect(result.candidate.structurallyValid).toBe(false);
    expect(result.compatibility.errors.filter((e: any) => e.type === 'legacy-item-status-count').map((e: any) => e.actual)).toEqual([2, 0]);
  });

  test.each(['', 'Closed', 'ResolvedPending', '**Resolved'])('rejects malformed status %s', (status) => {
    expect(inspect(fixture(item('Legacy', status))).candidate.structurallyValid).toBe(false);
  });

  test.each([
    ['missing section', (s: string) => s.replace('## Issue Verification', '## Other')],
    ['duplicate section', (s: string) => s + '\n## Issue Verification\n' + item('Another')],
    ['wrong heading level', (s: string) => s.replace('## Issue Verification', '### Issue Verification')],
    ['Coverage', (s: string) => s + forbidden],
    ['missing status', (s: string) => s.replace('  - Current status: Resolved\n', '')],
    ['duplicate status', (s: string) => s.replace('  - Current status: Resolved', '  - Current status: Resolved\n  - Current status: Unresolved')],
    ['status outside item', (s: string) => s.replace('  - Current status: Resolved\n', '') + '\n  - Current status: Resolved\n'],
    ['malformed prior ID', (s: string) => s.replace('- Legacy URL issue', '- [F-01] [src/url.mjs:2] Legacy URL issue')],
    ['missing metadata', (s: string) => s.replace(/  - Origin:.*\n/u, '')],
    ['unsupported count', (s: string) => s.replace('Not Run - no execution observations supplied.', 'Observed - 3/2 failures; supplied records.')],
    ['unsupported probability', (s: string) => s.replace('Not Run - no execution observations supplied.', 'Not Run - 1% production probability.')],
  ])('rejects %s', (_name, mutate) => {
    expect(inspect(mutate(fixture(item()))).candidate.structurallyValid).toBe(false);
  });

  test('does not count a fenced status as an item status', () => {
    const text = item().replace('  - Current status: Resolved', '```md\n  - Current status: Resolved\n```');
    expect(inspect(fixture(text)).candidate.structurallyValid).toBe(false);
  });

  test('does not hide Coverage inside a legacy item code block', () => {
    const text = item('Legacy', 'Resolved', '```md\n## Changed-Condition Coverage\n```\n');
    expect(inspect(fixture(text)).candidate.structurallyValid).toBe(false);
  });

  test.each([
    fixture(item() + '\n' + item('[F-002] [src/url.mjs:2] A') + '\n' + item('[F-002] [src/url.mjs:4] B')),
    fixture(item(), regression('F-002')),
    fixture(item() + '\n' + item('[F-002] [src/url.mjs:4] A'), regression('F-002')),
    fixture(item(), regression().replace('Origin: Amplified', 'Origin: Retained')),
    fixture(item(), regression().replace('[F-001] ', '')),
  ])('rejects malformed regression/ID shape %#', (report) => {
    expect(inspect(report).candidate.structurallyValid).toBe(false);
  });

  test.each(['quick.en.md', 'quick.zh-CN.md', 'deep.en.md', 'deep.zh-CN.md', 'fix.en.md', 'fix.zh-CN.md'])('leaves non-legacy %s unchanged', (name) => {
    const report = readText(`evaluation/prototypes/origin-occurrence/examples/${name}`);
    const mode = name.split('.')[0];
    const result = validateOriginOccurrenceLegacyFix(report, mode);
    expect(result.compatibility.status).toBe('Not Applicable');
    expect(result.candidate).toEqual(validateOriginOccurrenceCandidate(report, mode));
    expect(result.candidate.structurallyValid).toBe(true);
  });

  test('passes only the selected candidate to field adjudication and preserves raw failure evidence', () => {
    const result = inspect(fixture(item(), regression()));
    const oracle = { origins: ['Unknown', 'Amplified'], states: [['Not Run'], ['Not Run']] };
    expect(result.raw.structurallyValid).toBe(false);
    expect(adjudicateOriginOccurrenceCandidate(result.candidate, oracle).status).toBe('Pass');
    const rejected = inspect(fixture(item(), regression()) + forbidden);
    expect(adjudicateOriginOccurrenceCandidate(rejected.candidate, oracle).status).toBe('Fail');
  });

  test('keeps every historical dependency and formal instruction pinned by the explicit profile', () => {
    const profile = JSON.parse(readText('evaluation/prototypes/origin-occurrence/legacy-fix-10.json'));
    expect(profile.revision).toBe('legacy-fix-10');
    expect(profile.modelInvocations).toBe(0);
    expect(profile.frozenFiles.length).toBeGreaterThan(10);
    for (const pin of profile.frozenFiles) {
      expect(createHash('sha256').update(readText(`evaluation/baselines/pre-v0.6.0/${pin.path}`)).digest('hex'), pin.path).toBe(pin.sha256);
    }
  });
});
