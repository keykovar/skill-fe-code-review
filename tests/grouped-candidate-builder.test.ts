import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterEach, describe, expect, test } from 'vitest';

import { buildGroupedLedgerCandidate } from '../scripts/build-grouped-ledger-candidate.mjs';

const temporaryDirectories: string[] = [];

function sha256(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { force: true, recursive: true });
  }
});

describe('grouped-ledger candidate builder', () => {
  test('builds and executes the frozen grouped Quick/Deep validator while preserving Fix', async () => {
    const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fe-grouped-candidate-'));
    temporaryDirectories.push(outputDir);
    const candidate = buildGroupedLedgerCandidate(outputDir);
    const validatorPath = path.join(candidate.validatorDir, 'validate-review-output.mjs');
    const { validateReviewOutput } = await import(
      `${pathToFileURL(validatorPath).href}?test=${Date.now()}`
    );
    const groupedReport = `## Changed-Condition Coverage：变更条件覆盖

- [F-001]
  - 合并依据：同一原子修复
  - [src/url.ts:3] base：使用 -> 忽略
  - [src/url.ts:4] slash：保留 -> 删除

## Risk：建议修改

- [F-001] [src/url.ts:3] URL 合同回归
  - 触发场景：传入自定义 base
  - 影响：请求错误地址
  - 根因：实现忽略参数并删除归一化
  - 建议方案：恢复参数与归一化
  - 验证方式：运行 URL 合同测试
`;
    const fixReport = `## Issue Verification：问题验证

- [F-001] URL 合同回归
  - 当前状态：Resolved
`;
    const legacyFlat = `## Changed-Condition Coverage

- [src/url.ts:3] base: used -> ignored; Disposition: [F-001]

## Risk

- [F-001] [src/url.ts:3] URL contract regressed
`;

    expect(validateReviewOutput(groupedReport, 'quick')).toMatchObject({
      coverageLedgerEntries: 2,
      errors: [],
      findingIds: ['F-001'],
      valid: true,
    });
    expect(validateReviewOutput(groupedReport, 'deep')).toMatchObject({
      coverageLedgerEntries: 2,
      errors: [],
      findingIds: ['F-001'],
      valid: true,
    });
    expect(validateReviewOutput(fixReport, 'fix')).toMatchObject({
      errors: [],
      findingIds: ['F-001'],
      valid: true,
    });
    expect(validateReviewOutput(legacyFlat, 'quick')).toMatchObject({ valid: false });
    expect(candidate.hashes.reviewOutputValidator).toBe(
      sha256(fs.readFileSync(validatorPath, 'utf8')),
    );
  });
});
