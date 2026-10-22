import { describe, expect, test } from 'vitest';
import { validateFileCoverageReport } from '../evaluation/prototypes/validate-file-coverage-report.mjs';
import { parseGitStatusInventory } from '../evaluation/prototypes/file-coverage.mjs';
import { validateReviewOutput } from '../scripts/validate-review-output.mjs';
import { readText } from './test-utils';

type Mode = 'quick' | 'deep' | 'fix';
type Language = 'en' | 'zh-CN';
const states = ['Reviewed', 'Partial', 'Deferred', 'Cannot Verify'];
const scope = { en: { quick: 'Review Scope', deep: 'Change Understanding' }, 'zh-CN': { quick: '审查范围', deep: '变更理解' } };
const example = (mode: Mode, language: Language) => readText(`examples/outputs/${mode}.${language}.md`);

function comparison(mode: Mode = 'quick', complete = true, mixed = false, renamedPath?: string) {
  const name = mode === 'deep' ? 'src/auth/session.ts' : 'src/url.ts';
  const inventory = parseGitStatusInventory(`MM ${name}\0${mixed ? ' M src/generated.ts\0?? assets/status.png\0 M src/settings.ts\0' : ''}`,
    { scopeKey: 'public-synthetic:HEAD:all-uncommitted', baseline: 'HEAD', enumerationComplete: complete });
  const entries: any[] = [{ path: name, state: mixed ? 'Partial' : 'Reviewed',
    reviewedLayers: mixed ? ['staged'] : ['staged', 'unstaged'], evidence: 'Compared relevant baseline, index and worktree contracts.',
    ...(mixed ? { remaining: 'Unstaged fallback remains unexamined.' } : {}) }];
  if (mixed) entries.push(
    { path: 'src/generated.ts', state: 'Deferred', reviewedLayers: [], remaining: 'Producer and compatibility impact remain unreviewed.' },
    { path: 'assets/status.png', state: 'Cannot Verify', reviewedLayers: [], remaining: 'Required binary visual comparison unavailable.' },
    { path: 'src/settings.ts', state: 'Reviewed', reviewedLayers: ['unstaged'], evidence: 'Compared removed guard and direct consumer.' },
  );
  if (renamedPath) {
    inventory.files[1] = { ...inventory.files[1], path: renamedPath, oldPath: 'src/old.ts' };
    entries[1].path = renamedPath;
  }
  const accounting = { mode, scopeKey: inventory.scopeKey, baseline: inventory.baseline, entries,
    summary: { inventory: complete ? 'Complete' : 'Incomplete', knownFiles: entries.length,
      totalFiles: complete ? entries.length : null,
      counts: Object.fromEntries(states.map(state => [state, entries.filter(entry => entry.state === state).length])),
      fullyReviewed: complete && !mixed, ...(!complete ? { inventoryGap: 'Delivery truncated; unknown paths remain unenumerated.' } : {}) } };
  return { inventory, accounting };
}

function fields(accounting: any, language: Language) {
  const { summary } = accounting;
  const zh = language === 'zh-CN';
  const complete = summary.inventory === 'Complete';
  const counts = states.map(state => `${state} ${summary.counts[state]}`).join(' / ');
  const result = [zh
    ? `- 文件覆盖：清单 ${summary.inventory}；${complete ? `${summary.knownFiles} 个变更路径` : `至少 ${summary.knownFiles} 个已知变更路径`}；${counts}。`
    : `- File coverage: inventory ${summary.inventory}; ${complete ? `${summary.knownFiles} changed paths` : `at least ${summary.knownFiles} known changed paths`}; ${counts}.`];
  for (const entry of accounting.entries.filter((entry: any) => entry.state !== 'Reviewed')) {
    result.push(zh
      ? `- 文件缺口：${entry.state}；路径 ${JSON.stringify(entry.path)}；原因 ${entry.remaining}`
      : `- File gap: ${entry.state}; path ${JSON.stringify(entry.path)}; reason ${entry.remaining}`);
  }
  if (!complete) result.push(zh ? '- 清单缺口：' + summary.inventoryGap : '- Inventory gap: ' + summary.inventoryGap);
  return result.join('\n');
}

function fixture(mode: 'quick' | 'deep' = 'quick', language: Language = 'en', complete = true, mixed = false, renamedPath?: string) {
  const data = comparison(mode, complete, mixed, renamedPath);
  const output = fields(data.accounting, language);
  const report = example(mode, language).replace(`## ${scope[language][mode]}\n\n`, `## ${scope[language][mode]}\n\n${output}\n`);
  const options = { ...data, language, sourceRoot: '/review' };
  return { report, output, options, mode, language };
}
const inspect = (item: ReturnType<typeof fixture>, report = item.report) => validateFileCoverageReport(report, item.mode, item.options);
const codes = (result: ReturnType<typeof validateFileCoverageReport>) => result.coverage.errors.map((error: any) => error.code);

describe('evaluator-only file-coverage report profile', () => {
  test.each([
    ['quick', 'en'], ['quick', 'zh-CN'], ['deep', 'en'], ['deep', 'zh-CN'],
  ] as const)('accepts compact %s %s summaries and preserves existing fields', (mode, language) => {
    const item = fixture(mode, language);
    const result = inspect(item);
    expect(result.valid, JSON.stringify(result)).toBe(true);
    expect(result.coverage.details).toEqual([]);
    expect(result.base).toEqual(validateReviewOutput(item.report, mode, { profile: 'v0.6.0', sourceRoot: '/review' }));
    expect(result.base.findings.map((finding: any) => [finding.id, finding.origin, finding.reproduction])).toEqual(
      validateReviewOutput(example(mode, language), mode, { profile: 'v0.6.0', sourceRoot: '/review' }).findings
        .map((finding: any) => [finding.id, finding.origin, finding.reproduction]),
    );
    expect(result.semanticStatus).toBe('Not Evaluated');
    expect(result.reportAcceptance).toBe('Not Evaluated');
  });

  test.each(['en', 'zh-CN'] as const)('accounts for each incomplete state with %s labels', language => {
    const item = fixture('quick', language, true, true);
    const result = inspect(item);
    expect(result.valid, JSON.stringify(result)).toBe(true);
    expect(result.coverage.summary?.counts).toEqual({ Reviewed: 1, Partial: 1, Deferred: 1, 'Cannot Verify': 1 });
    expect(result.coverage.details).toHaveLength(3);
  });

  test.each(['en', 'zh-CN'] as const)('keeps incomplete inventory a lower bound with %s labels', language => {
    const item = fixture('deep', language, false, true);
    expect(inspect(item).valid).toBe(true);
    expect(inspect(item).coverage.summary?.totalFiles).toBeNull();
    expect(inspect(item).coverage.inventoryGaps).toHaveLength(1);
  });

  test.each([
    ['missing summary', (s: string) => s.replace(/^- File coverage:.*\n/m, ''), 'missing-coverage-summary'],
    ['duplicate summary', (s: string) => s.replace(/^(- File coverage:.*)$/m, '$1\n$1'), 'duplicate-coverage-summary'],
    ['wrong total', (s: string) => s.replace('4 changed paths', '3 changed paths'), 'coverage-summary-mismatch'],
    ['wrong tally', (s: string) => s.replace('Reviewed 1 / Partial 1', 'Reviewed 2 / Partial 0'), 'coverage-summary-mismatch'],
    ['unsafe count', (s: string) => s.replace('4 changed paths', '9007199254740992 changed paths'), 'unsafe-coverage-count'],
    ['negative count', (s: string) => s.replace('Reviewed 1', 'Reviewed -1'), 'invalid-coverage-field-grammar'],
    ['decimal count', (s: string) => s.replace('Reviewed 1', 'Reviewed 1.0'), 'invalid-coverage-field-grammar'],
    ['leading zero', (s: string) => s.replace('Reviewed 1', 'Reviewed 01'), 'invalid-coverage-field-grammar'],
    ['missing detail', (s: string) => s.replace(/^- File gap: Partial.*\n/m, ''), 'missing-file-gap'],
    ['duplicate detail', (s: string) => s.replace(/^(- File gap: Partial.*)$/m, '$1\n$1'), 'duplicate-file-gap'],
    ['outside path', (s: string) => s.replace('path "src/generated.ts"', 'path "src/unchanged-caller.ts"'), 'unexpected-file-gap'],
    ['rename old path', (s: string) => s.replace('path "src/generated.ts"', 'path "src/old.ts"'), 'unexpected-file-gap'],
    ['wrong state', (s: string) => s.replace('File gap: Partial', 'File gap: Deferred'), 'file-gap-state-mismatch'],
    ['missing reason', (s: string) => s.replace(/reason Unstaged[^\n]*/, 'reason '), 'missing-file-gap-reason'],
    ['placeholder reason', (s: string) => s.replace(/reason Unstaged[^\n]*/, 'reason TODO'), 'missing-file-gap-reason'],
    ['invalid path quoting', (s: string) => s.replace('path "src/generated.ts"', 'path "src/\\q.ts"'), 'invalid-file-gap-path'],
    ['noncanonical JSON escapes', (s: string) => s.replace('path "src/generated.ts"', 'path "src/\\ud800.ts"'), 'invalid-file-gap-path'],
    ['unquoted path', (s: string) => s.replace('path "src/generated.ts"', 'path src/generated.ts'), 'invalid-coverage-field-grammar'],
    ['extra gap on complete inventory', (s: string) => s.replace('## Review Scope\n', '## Review Scope\n- Inventory gap: Missing baseline.\n'), 'inventory-gap-count'],
    ['nested field', (s: string) => s.replace('- File coverage:', '  - File coverage:'), 'invalid-coverage-field-grammar'],
    ['wrong placement', (s: string) => s.replace('## Review Scope\n', '## Review Scope\n### Details\n'), 'coverage-field-outside-scope'],
    ['new section', (s: string) => s.replace('## Review Scope\n', '## Review Scope\n## File Coverage\n'), 'coverage-field-outside-scope'],
  ] as const)('rejects %s', (_name, mutate, expected) => {
    const item = fixture('quick', 'en', true, true);
    const result = inspect(item, mutate(item.report));
    expect(result.valid).toBe(false);
    expect(codes(result)).toContain(expected);
  });

  test.each([
    ['total instead of lower bound', (s: string) => s.replace('at least 4 known changed paths', '4 changed paths'), 'coverage-count-form-mismatch'],
    ['false complete claim', (s: string) => s.replace('inventory Incomplete; at least 4 known changed paths', 'inventory Complete; 4 changed paths'), 'coverage-summary-mismatch'],
    ['missing inventory reason', (s: string) => s.replace(/^- Inventory gap:.*\n/m, ''), 'inventory-gap-count'],
    ['empty inventory reason', (s: string) => s.replace(/^- Inventory gap:.*$/m, '- Inventory gap: '), 'missing-inventory-gap-reason'],
    ['duplicate inventory reason', (s: string) => s.replace(/^(- Inventory gap:.*)$/m, '$1\n$1'), 'inventory-gap-count'],
  ] as const)('rejects incomplete inventory: %s', (_name, mutate, expected) => {
    const item = fixture('deep', 'en', false, true);
    const result = inspect(item, mutate(item.report));
    expect(result.valid).toBe(false);
    expect(codes(result)).toContain(expected);
  });

  test('requires independent inventory, matching scope/baseline and every applicable layer', () => {
    const item = fixture();
    for (const [key, value] of [['scopeKey', 'different-packet'], ['baseline', 'other-HEAD'], ['mode', 'deep']]) {
      const options = structuredClone(item.options);
      (options.accounting as any)[key] = value;
      expect(validateFileCoverageReport(item.report, item.mode, options).valid).toBe(false);
    }
    item.options.accounting.entries[0].reviewedLayers = ['staged'];
    expect(codes(inspect(item))).toContain('unsupported-reviewed');
    expect(validateFileCoverageReport(item.report, 'quick', { language: 'en', sourceRoot: '/review' }).valid).toBe(false);
  });

  test('keeps exact unusual path identity in gap details and accepts CRLF', () => {
    const name = 'src/ 帐户 "line"\nnext\\file` .ts';
    const item = fixture('quick', 'zh-CN', true, true, name);
    const result = inspect(item, item.report.replaceAll('\n', '\r\n'));
    expect(result.valid, JSON.stringify(result)).toBe(true);
    expect(result.coverage.details[1].path).toBe(name);
  });

  test('does not count fenced samples as actual summaries or gap details', () => {
    const item = fixture();
    expect(inspect(item, item.report.replace(item.output, '```md\n' + item.output + '\n```')).valid).toBe(false);
    expect(inspect(item, item.report + '\n```md\n' + item.output + '\n```').valid).toBe(true);
  });

  test('requires Chinese scope and coverage labels for a Chinese report', () => {
    const item = fixture('quick', 'zh-CN');
    expect(codes(inspect(item, item.report.replace('## 审查范围', '## Review Scope')))).toContain('coverage-scope-heading-count');
    expect(codes(inspect(item, item.report.replace(item.output, fields(item.options.accounting, 'en'))))).toContain('invalid-coverage-field-grammar');
    expect(() => validateFileCoverageReport(item.report, 'quick', { ...item.options, language: undefined })).toThrow('Explicit language');
  });

  test.each(['en', 'zh-CN'] as const)('preserves %s Fix without coverage or new evaluator inputs', language => {
    const report = example('fix', language);
    const result = validateFileCoverageReport(report, 'fix', { language, sourceRoot: '/review' });
    expect(result.valid).toBe(true);
    expect(result.accounting).toBeNull();
    expect(result.base).toEqual(validateReviewOutput(report, 'fix', { profile: 'v0.6.0', sourceRoot: '/review' }));
  });

  test.each(['- File coverage: inventory Complete; 0 changed paths; Reviewed 0 / Partial 0 / Deferred 0 / Cannot Verify 0.',
    '- 文件覆盖：清单 Complete；0 个变更路径；Reviewed 0 / Partial 0 / Deferred 0 / Cannot Verify 0。',
    '## File Coverage', '- File gap: Deferred; path "src/a.ts"; reason Pending.',
    '## Changed-Condition Coverage\n- [src/a.ts:1] test: before -> after; Disposition: Behavior Preserving'])('rejects Fix expansion %#', suffix => {
    expect(validateFileCoverageReport(example('fix', 'en') + '\n' + suffix, 'fix', { language: 'en' }).valid).toBe(false);
  });

  test('does not weaken Origin/Reproduction, finding IDs or changed-condition syntax', () => {
    const item = fixture();
    for (const mutate of [
      (s: string) => s.replace(/^  - Origin:.*\n/m, ''),
      (s: string) => s.replace(/^  - Reproduction:.*\n/m, ''),
      (s: string) => s.replace('Disposition: [F-001]', 'Disposition: [F-999]'),
      (s: string) => s.replace(' -> ', ' versus '),
    ]) {
      const result = inspect(item, mutate(item.report));
      expect(result.base.valid).toBe(false);
      expect(result.valid).toBe(false);
    }
  });

  test.each(['quick-no-finding.zh-CN.md', 'quick-improve-only.en.md'])('preserves nonblocking authored control %s', name => {
    const language = name.includes('zh-CN') ? 'zh-CN' : 'en';
    const data = comparison();
    const report = readText(`evaluation/prototypes/file-coverage/reports/${name}`);
    const result = validateFileCoverageReport(report, 'quick', { ...data, language });
    expect(result.valid, JSON.stringify(result)).toBe(true);
    expect(result.base.findings.every((finding: any) => finding.severity === 'Improve')).toBe(true);
    expect(result.coverage.summary?.counts.Reviewed).toBe(1);
  });

  test('does not call self-consistent forged evidence semantic acceptance', () => {
    const item = fixture();
    item.options.accounting.entries[0].evidence = 'An unverified assertion claiming every contract was reviewed.';
    const result = inspect(item);
    expect(result.valid).toBe(true);
    expect(result.semanticStatus).toBe('Not Evaluated');
    expect(result.reportAcceptance).toBe('Not Evaluated');
  });
});
