import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

import { validateReviewOutput } from '../scripts/validate-review-output.mjs';
import { readText, rootDir } from './test-utils';

const examples = [
  { file: 'quick-review.md', mode: 'quick', ids: ['F-001', 'F-002'], entries: 2 },
  { file: 'quick-review.zh-CN.md', mode: 'quick', ids: ['F-001'], entries: 1 },
  { file: 'deep-review.md', mode: 'deep', ids: ['F-001'], entries: 3 },
  { file: 'fix-review.zh-CN.md', mode: 'fix', ids: ['F-001', 'F-002'], entries: 0 },
] as const;

describe('public output examples', () => {
  test('covers every published output example', () => {
    expect(fs.readdirSync(path.join(rootDir, 'examples/outputs')).sort()).toEqual(
      examples.map(({ file }) => file).sort(),
    );
  });

  test.each(examples)('$file passes the actual read-only CLI and API', (example) => {
    const relativePath = `examples/outputs/${example.file}`;
    const markdown = readText(relativePath);
    const result = validateReviewOutput(markdown, example.mode);

    expect(markdown).not.toContain('```');
    expect(result).toMatchObject({
      valid: true,
      errors: [],
      findingIds: [...example.ids],
      coverageLedgerEntries: example.entries,
    });

    const cli = spawnSync(process.execPath, [
      path.join(rootDir, 'scripts/validate-review-output.mjs'),
      '--mode', example.mode, path.join(rootDir, relativePath),
    ], { encoding: 'utf8' });

    expect(cli.status, cli.stderr).toBe(0);
    expect(JSON.parse(cli.stdout)).toEqual(result);
    expect(readText(relativePath)).toBe(markdown);
  });

  test.each(examples.filter(({ mode }) => mode !== 'fix'))(
    '$file rejects missing coverage and incomplete transitions', (example) => {
      const markdown = readText(`examples/outputs/${example.file}`);
      const missing = validateReviewOutput(
        markdown.replace('## Changed-Condition Coverage', '## Missing Coverage'),
        example.mode,
      );
      const incomplete = validateReviewOutput(
        markdown.replace(/^(- \[[^\]\r\n]+:\d+\].*) -> /mu, '$1 / '),
        example.mode,
      );

      expect(missing.valid).toBe(false);
      expect(missing.errors).toContainEqual(
        expect.objectContaining({ type: 'coverage-ledger-section-count' }),
      );
      expect(incomplete.valid).toBe(false);
      expect(incomplete.errors).toContainEqual(
        expect.objectContaining({ type: 'coverage-ledger-missing-before-after' }),
      );
    },
  );

  test('keeps prior Fix IDs and the new regression distinct without a Deep ledger', () => {
    const markdown = readText('examples/outputs/fix-review.zh-CN.md');
    const findingRows = [...markdown.matchAll(/^- \[(F-\d{3})\] /gmu)];
    expect(findingRows.map((match) => match[1])).toEqual(['F-001', 'F-002', 'F-003']);
    expect(markdown).not.toContain('## Changed-Condition Coverage');

    const ambiguous = validateReviewOutput(markdown.replace(
      '  - 当前状态：Resolved：已解决',
      '  - 当前状态：Resolved：已解决\n  - 当前状态：Unresolved：未解决',
    ), 'fix');
    expect(ambiguous.valid).toBe(false);
    expect(ambiguous.errors).toContainEqual(
      expect.objectContaining({ findingId: 'F-001', type: 'fix-finding-status-count' }),
    );
  });
});
