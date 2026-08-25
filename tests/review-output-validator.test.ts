import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';

import { validateReviewOutput } from '../scripts/validate-review-output.mjs';
import { rootDir } from './test-utils';

const temporaryDirectories: string[] = [];
const validatorScript = path.join(rootDir, 'scripts', 'validate-review-output.mjs');

const quickReport = `## 总体结论

提交建议：修改后提交

## 审查范围

- 比较基线：HEAD

## Changed-Condition Coverage：变更条件覆盖

- [src/url.ts:4] 条件：空值回退 -> 空字符串回退；结论：[F-001]
- [src/url.ts:8] 条件：固定路径 -> 等价常量；结论：Behavior Preserving：行为保持

## Blocking：必须修改

- [F-001] [src/url.ts:4] 空值分支破坏构建
  - 触发场景：导入缺失模块
  - 影响：构建失败
  - 阻断结果：Build Failure - clean checkout cannot resolve the import
  - 根因：引用了未提交文件
  - 建议方案：纳入提交范围
  - 验证方式：在干净工作区构建

## Risk：建议修改

无明确问题。
`;

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { force: true, recursive: true });
  }
});

describe('review output validator', () => {
  test('accepts a Quick report with a reconciled ledger and supported Blocking outcome', () => {
    const result = validateReviewOutput(quickReport, 'quick');

    expect(result).toMatchObject({
      blockingFindingCount: 1,
      coverageLedgerEntries: 2,
      errors: [],
      findingIds: ['F-001'],
      mode: 'quick',
      valid: true,
    });
  });

  test('accepts a Markdown-linked file location without weakening outcome validation', () => {
    const linked = quickReport.replace(
      '- [F-001] [src/url.ts:4] 空值分支破坏构建',
      '- [F-001] [src/url.ts:4](/private/tmp/fixture/src/url.ts:4) 空值分支破坏构建',
    );
    const accepted = validateReviewOutput(linked, 'quick');
    const unsupportedOutcome = validateReviewOutput(
      linked.replace(
        '  - 阻断结果：Build Failure - clean checkout cannot resolve the import',
        '  - 阻断结果：local test failure',
      ),
      'quick',
    );

    expect(accepted).toMatchObject({
      blockingFindingCount: 1,
      errors: [],
      findingIds: ['F-001'],
      valid: true,
    });
    expect(unsupportedOutcome.errors).toContainEqual(
      expect.objectContaining({ findingId: 'F-001', type: 'blocking-outcome-unsupported' }),
    );
  });

  test('accepts a Deep report with Finding and evidence dispositions', () => {
    const result = validateReviewOutput(
      `## Overall Conclusion

Proceed after changes.

## Change Map

- Before: one request
- After: two requests

## Changed-Condition Coverage

- [src/session.ts:9] condition: one owner -> two owners; Disposition: [F-001]
- [src/session.ts:12] condition: cached -> cached; Disposition: Cannot Verify

## Findings

### Risk

- [F-001] [src/session.ts:9] Request ownership can race
  - Trigger: concurrent refresh
  - Impact: stale state
  - Root cause: two writers
  - Suggested fix: retain one owner
  - Verification: deterministic concurrency test
`,
      'deep',
    );

    expect(result.valid).toBe(true);
    expect(result.findingIds).toEqual(['F-001']);
    expect(result.coverageLedgerEntries).toBe(2);
  });

  test('accepts Fix Review without applying the new ledger contract', () => {
    const result = validateReviewOutput(
      `## 回审结论

可以关闭。

## Issue Verification：问题验证

- [F-003] Resolved：已解决
  - 当前状态：Resolved：已解决
`,
      'fix',
    );

    expect(result).toMatchObject({ errors: [], mode: 'fix', valid: true });
    expect(result.findingIds).toEqual(['F-003']);
  });

  test('rejects an empty or ambiguous Fix verification result', () => {
    const empty = validateReviewOutput('', 'fix');
    const ambiguous = validateReviewOutput(
      `## Issue Verification

- [F-003] Previous issue
  - Current status: Resolved
  - Current status: Cannot Verify
- [F-003] Duplicate issue
  - Current status: Resolved
`,
      'fix',
    );

    expect(empty.errors).toContainEqual(
      expect.objectContaining({ type: 'fix-verification-section-count' }),
    );
    expect(ambiguous.errors).toContainEqual(
      expect.objectContaining({ type: 'fix-finding-id-duplicate' }),
    );
    expect(ambiguous.errors).toContainEqual(
      expect.objectContaining({
        findingId: 'F-003',
        type: 'fix-finding-status-count',
      }),
    );
  });

  test('rejects missing, duplicate, and empty coverage ledger sections', () => {
    const missing = validateReviewOutput('## Overall Conclusion\n\nNo clear issue.\n', 'quick');
    const duplicate = validateReviewOutput(
      '## Changed-Condition Coverage\n\n- a -> b; Disposition: Behavior Preserving\n\n## Changed-Condition Coverage\n\n- c -> d; Disposition: Cannot Verify\n',
      'deep',
    );
    const empty = validateReviewOutput('## Changed-Condition Coverage\n\n## Risk\n\nNo clear issue.\n', 'quick');

    expect(missing.errors).toContainEqual(
      expect.objectContaining({ type: 'coverage-ledger-section-count' }),
    );
    expect(duplicate.errors).toContainEqual(
      expect.objectContaining({ type: 'coverage-ledger-section-count' }),
    );
    expect(empty.errors).toContainEqual(expect.objectContaining({ type: 'coverage-ledger-empty' }));
  });

  test('rejects malformed dispositions and references to absent Findings', () => {
    const result = validateReviewOutput(
      `## Changed-Condition Coverage

- [src/a.ts:1] condition: false -> true; Disposition: [F-002]
- [src/a.ts:2] condition unchanged; Disposition: accepted
`,
      'quick',
    );

    expect(result.errors).toContainEqual(
      expect.objectContaining({ findingId: 'F-002', type: 'coverage-ledger-unknown-finding-id' }),
    );
    expect(result.errors).toContainEqual(
      expect.objectContaining({ type: 'coverage-ledger-missing-before-after' }),
    );
    expect(result.errors).toContainEqual(
      expect.objectContaining({ type: 'coverage-ledger-invalid-disposition' }),
    );
  });

  test('requires one identical merge key when ledger entries share a Finding ID', () => {
    const report = `## Changed-Condition Coverage

- [src/a.ts:1] first: false -> true; Disposition: [F-001]
- [src/a.ts:2] second: old -> new; Disposition: [F-001]

## Risk

- [F-001] [src/a.ts:1] Shared contract regressed
  - Verification: test
`;
    const missing = validateReviewOutput(report, 'quick');
    const matching = validateReviewOutput(
      report
        .replace('Disposition: [F-001]\n', 'Disposition: [F-001]; Merge key: shared-contract\n')
        .replace('Disposition: [F-001]\n', 'Disposition: [F-001]; Merge key: shared-contract\n'),
      'quick',
    );
    const mismatch = validateReviewOutput(
      report
        .replace('Disposition: [F-001]\n', 'Disposition: [F-001]; Merge key: first-contract\n')
        .replace('Disposition: [F-001]\n', 'Disposition: [F-001]; Merge key: second-contract\n'),
      'quick',
    );

    expect(missing.errors).toContainEqual(
      expect.objectContaining({
        findingId: 'F-001',
        type: 'coverage-ledger-repeated-finding-id-merge-key-missing',
      }),
    );
    expect(matching.valid).toBe(true);
    expect(mismatch.errors).toContainEqual(
      expect.objectContaining({
        findingId: 'F-001',
        type: 'coverage-ledger-repeated-finding-id-merge-key-mismatch',
      }),
    );
  });

  test('rejects duplicate or non-sequential Finding IDs in rendered order', () => {
    const result = validateReviewOutput(
      `## Changed-Condition Coverage

- a -> b; Disposition: [F-002]

## Risk

- [F-002] [src/a.ts:1] First issue
  - Verification: test
- [F-002] [src/b.ts:1] Second issue
  - Verification: test
`,
      'quick',
    );

    expect(result.errors).toContainEqual(expect.objectContaining({ type: 'finding-id-duplicate' }));
    expect(result.errors).toContainEqual(expect.objectContaining({ type: 'finding-id-order' }));
  });

  test('rejects missing or unsupported Blocking outcomes', () => {
    const missing = validateReviewOutput(
      quickReport.replace(
        '  - 阻断结果：Build Failure - clean checkout cannot resolve the import\n',
        '',
      ),
      'quick',
    );
    const testFailureOnly = validateReviewOutput(
      quickReport.replace(
        '  - 阻断结果：Build Failure - clean checkout cannot resolve the import',
        '  - 阻断结果：local test failure',
      ),
      'quick',
    );
    const categoryNotFirst = validateReviewOutput(
      quickReport.replace(
        '  - 阻断结果：Build Failure - clean checkout cannot resolve the import',
        '  - 阻断结果：clean checkout causes Build Failure',
      ),
      'quick',
    );

    expect(missing.errors).toContainEqual(
      expect.objectContaining({ findingId: 'F-001', type: 'blocking-outcome-missing' }),
    );
    expect(testFailureOnly.errors).toContainEqual(
      expect.objectContaining({ findingId: 'F-001', type: 'blocking-outcome-unsupported' }),
    );
    expect(categoryNotFirst.errors).toContainEqual(
      expect.objectContaining({ findingId: 'F-001', type: 'blocking-outcome-unsupported' }),
    );
  });

  test('rejects a backtick-only Finding location', () => {
    const result = validateReviewOutput(
      quickReport.replace(
        '- [F-001] [src/url.ts:4] 空值分支破坏构建',
        '- [F-001] `src/url.ts:4` 空值分支破坏构建',
      ),
      'quick',
    );

    expect(result.errors).toContainEqual(
      expect.objectContaining({ findingId: 'F-001', type: 'finding-location-invalid' }),
    );
  });

  test('rejects the Quick/Deep coverage ledger in Fix Review', () => {
    const result = validateReviewOutput(
      '## Changed-Condition Coverage\n\n- a -> b; Disposition: Behavior Preserving\n',
      'fix',
    );

    expect(result.errors).toContainEqual(
      expect.objectContaining({ type: 'fix-review-coverage-ledger-forbidden' }),
    );
  });

  test('provides a read-only CLI with JSON output and meaningful exit status', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fe-review-output-test-'));
    const reportPath = path.join(directory, 'review.md');
    temporaryDirectories.push(directory);
    fs.writeFileSync(reportPath, quickReport);

    const result = spawnSync(
      process.execPath,
      [validatorScript, '--mode', 'quick', reportPath],
      { encoding: 'utf8' },
    );

    expect(result.status, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({ mode: 'quick', valid: true });
    expect(fs.readFileSync(reportPath, 'utf8')).toBe(quickReport);
  });
});
