import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

import { validateGroupedLedger } from '../scripts/grouped-ledger-validator.mjs';
import { rootDir } from './test-utils';

const validChineseLedger = `## Changed-Condition Coverage：变更条件覆盖

- [F-001]
  - [src/url.ts:1] 模块依赖：无 request-config -> 导入 request-config
- [F-002]
  - 合并依据：同一原子修复必须同时恢复 base 与 path 的斜杠归一化
  - [src/url.ts:4] base 尾斜杠：去除 -> 保留
  - [src/url.ts:4] path 首斜杠：去除 -> 保留
- Behavior Preserving：行为保持
  - [src/profile.ts:3] 返回类型：string -> string
- Cannot Verify：无法验证
  - [src/runtime.ts:8] 生产配置：旧环境 -> 新环境

## Blocking：必须修改
`;

describe('grouped ledger validator', () => {
  test('replays every saved synthetic case without model calls or repair', () => {
    const replay = spawnSync(
      process.execPath,
      [path.join(rootDir, 'evaluation/prototypes/replay-grouped-ledger-cases.mjs')],
      { cwd: rootDir, encoding: 'utf8' },
    );
    const result = JSON.parse(replay.stdout);

    expect(replay.status, replay.stderr).toBe(0);
    expect(result).toMatchObject({ failed: 0, passed: 7, total: 7, valid: true });
    expect(result.cases.every(({ hashMatches }: { hashMatches: boolean }) => hashMatches)).toBe(true);
    expect(result.cases).toContainEqual(
      expect.objectContaining({
        id: 'Q-ID-001-SEMANTIC-MERGE-INVALID',
        semanticOracleExpected: 'Fail: independently repairable contracts were merged',
        structuralValid: true,
      }),
    );
  });

  test('accepts Chinese Finding-owned groups with single and multiple conditions', () => {
    const result = validateGroupedLedger(validChineseLedger, {
      expectedFindingIds: ['F-001', 'F-002'],
    });

    expect(result).toMatchObject({
      conditionCount: 5,
      errors: [],
      findingIds: ['F-001', 'F-002'],
      valid: true,
    });
    expect(result.groups[1]).toMatchObject({
      key: 'F-002',
      mergeBases: [
        expect.objectContaining({
          value: '同一原子修复必须同时恢复 base 与 path 的斜杠归一化',
        }),
      ],
    });
  });

  test('accepts English groups and Markdown-linked locations', () => {
    const result = validateGroupedLedger(
      `## Changed-Condition Coverage

- [F-001]
  - Merge basis: one indivisible session-owner repair
  - [src/session.ts:9](/tmp/fixture/src/session.ts:9) owner: shared -> local
  - [src/session.ts:12] cache: shared -> duplicated
- Cannot Verify
  - [src/runtime.ts:8] deployment: old -> new
`,
      { expectedFindingIds: ['F-001'] },
    );

    expect(result).toMatchObject({ conditionCount: 3, errors: [], valid: true });
  });

  test('keeps semantic merge validity outside the structural parser', () => {
    const structurallyValidButSemanticallyInvalid = validateGroupedLedger(
      `## Changed-Condition Coverage

- [F-001]
  - Merge basis: shared URL contract
  - [src/url.ts:3] base parameter: used -> ignored
  - [src/url.ts:4] slash normalization: present -> removed
`,
      { expectedFindingIds: ['F-001'] },
    );

    expect(structurallyValidButSemanticallyInvalid.valid).toBe(true);
    expect(structurallyValidButSemanticallyInvalid.errors).toEqual([]);
  });

  test.each([
    {
      name: 'missing basis on a multi-condition Finding',
      report: `## Changed-Condition Coverage

- [F-001]
  - [src/a.ts:1] value: old -> new
  - [src/a.ts:2] owner: old -> new
`,
      type: 'multi-condition-merge-basis-count',
    },
    {
      name: 'basis on a single-condition Finding',
      report: `## Changed-Condition Coverage

- [F-001]
  - Merge basis: unnecessary
  - [src/a.ts:1] value: old -> new
`,
      type: 'single-condition-merge-basis-forbidden',
    },
    {
      name: 'basis on a non-Finding group',
      report: `## Changed-Condition Coverage

- Behavior Preserving
  - Merge basis: invalid
  - [src/a.ts:1] value: old -> old
`,
      type: 'non-finding-merge-basis-forbidden',
    },
    {
      name: 'empty basis',
      report: `## Changed-Condition Coverage

- [F-001]
  - Merge basis:
  - [src/a.ts:1] value: old -> new
  - [src/a.ts:2] owner: old -> new
`,
      type: 'merge-basis-empty',
    },
    {
      name: 'missing before-to-after transition',
      report: `## Changed-Condition Coverage

- [F-001]
  - [src/a.ts:1] value remains new
`,
      type: 'condition-transition-missing',
    },
    {
      name: 'child without a file-line location',
      report: `## Changed-Condition Coverage

- [F-001]
  - [not-a-location] value: old -> new
`,
      type: 'group-child-invalid',
    },
    {
      name: 'legacy flat entry',
      report: `## Changed-Condition Coverage

- [src/a.ts:1] value: old -> new; Disposition: [F-001]
`,
      type: 'group-header-invalid',
    },
    {
      name: 'malformed nested child',
      report: `## Changed-Condition Coverage

- [F-001]
    - [src/a.ts:1] value: old -> new
`,
      type: 'group-child-invalid',
    },
    {
      name: 'empty group',
      report: `## Changed-Condition Coverage

- [F-001]
`,
      type: 'group-empty',
    },
  ])('rejects $name', ({ report, type }) => {
    const result = validateGroupedLedger(report);

    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(expect.objectContaining({ type }));
  });

  test('rejects duplicate and non-sequential Finding groups', () => {
    const duplicate = validateGroupedLedger(`## Changed-Condition Coverage

- [F-001]
  - [src/a.ts:1] value: old -> new
- [F-001]
  - [src/b.ts:1] value: old -> new
`);
    const nonSequential = validateGroupedLedger(`## Changed-Condition Coverage

- [F-002]
  - [src/a.ts:1] value: old -> new
`);

    expect(duplicate.errors).toContainEqual(
      expect.objectContaining({ group: 'F-001', type: 'group-duplicate' }),
    );
    expect(nonSequential.errors).toContainEqual(
      expect.objectContaining({ type: 'finding-group-order' }),
    );
  });

  test('rejects missing and unknown Finding groups against the rendered Finding set', () => {
    const result = validateGroupedLedger(
      `## Changed-Condition Coverage

- [F-001]
  - [src/a.ts:1] value: old -> new
- [F-002]
  - [src/b.ts:1] value: old -> new
`,
      { expectedFindingIds: ['F-001', 'F-003'] },
    );

    expect(result.errors).toContainEqual(
      expect.objectContaining({ findingId: 'F-002', type: 'finding-group-unknown' }),
    );
    expect(result.errors).toContainEqual(
      expect.objectContaining({ findingId: 'F-003', type: 'finding-group-missing' }),
    );
  });
});
