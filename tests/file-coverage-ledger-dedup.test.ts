import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, test } from 'vitest';
import { buildFileCoverageSkill } from '../evaluation/prototypes/build-file-coverage-skill.mjs';
import { buildFileCoverageLedgerSkill } from '../evaluation/prototypes/build-file-coverage-ledger-skill.mjs';
import { buildFileCoverageLedgerDedup } from '../evaluation/prototypes/build-file-coverage-ledger-dedup.mjs';
import { readText, rootDir } from './test-utils';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fe-file-coverage-dedup-'));
const hash = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const parent = buildFileCoverageSkill(path.join(root, 'parent'));
const composed = buildFileCoverageLedgerSkill({
  sourceBundle: parent.output,
  sourceManifestSha256: hash(fs.readFileSync(path.join(parent.output, 'manifest.json'))),
  output: path.join(root, 'composed'),
});
const candidate = buildFileCoverageLedgerDedup({
  sourceBundle: composed.output,
  sourceManifestSha256: composed.manifestSha256,
  output: path.join(root, 'candidate'),
});
const readCandidate = (name: string) => fs.readFileSync(path.join(candidate.output, 'fe-code-review', name), 'utf8');
const readComposed = (name: string) => fs.readFileSync(path.join(composed.output, 'fe-code-review', name), 'utf8');
afterAll(() => fs.rmSync(root, { recursive: true, force: true }));

describe('file coverage ledger reference deduplication', () => {
  test('changes only Quick and Deep references and removes the repeated guidance block', () => {
    expect(candidate.manifest.files.filter(file => file.changedFromParent).map(file => file.path).sort()).toEqual([
      'fe-code-review/references/deep-review.md', 'fe-code-review/references/quick-review.md',
    ]);
    expect(candidate.manifest.removedDuplicateGuidanceBytes).toEqual({ quick: 792, deep: 921 });
    for (const pin of candidate.manifest.files) {
      const bytes = fs.readFileSync(path.join(candidate.output, pin.path));
      expect(hash(bytes)).toBe(pin.sha256);
      expect(bytes.length).toBe(pin.bytes);
      if (!pin.changedFromParent) expect(bytes).toEqual(fs.readFileSync(path.join(composed.output, pin.path)));
    }
    expect(readCandidate('SKILL.md')).toBe(readComposed('SKILL.md'));
    for (const mode of ['quick', 'deep']) {
      const current = readCandidate(`references/${mode}-review.md`);
      expect(current).not.toContain('以下为格式说明，不属于报告正文。');
      expect(current).not.toContain('合法示例：');
      expect(current).toContain('Apply the mandatory File Coverage rules in `SKILL.md`.');
      expect(current).toContain('- [file:line] 条件: 修改前 -> 修改后; Disposition:');
      expect(current).toContain('- 文件覆盖：清单 <Complete/Incomplete>；');
    }
  });

  test('keeps Fix, core rules, dependencies and parent pins unchanged', () => {
    expect(readCandidate('references/fix-review.md')).toBe(readText('skills/fe-code-review/references/fix-review.md'));
    expect(readCandidate('SKILL.md')).toContain('For Quick and Deep Review in either language, the Changed-Condition Coverage section contains only ledger list items and blank lines.');
    for (const pin of [...composed.manifest.sources, ...composed.manifest.recipes]) {
      expect(hash(fs.readFileSync(path.join(rootDir, pin.path)))).toBe(pin.sha256);
    }
    expect(hash(fs.readFileSync(path.join(composed.output, 'manifest.json')))).toBe(composed.manifestSha256);
  });

  test('is deterministic and rejects overwrite, wrong parent and formal destinations', () => {
    const second = buildFileCoverageLedgerDedup({
      sourceBundle: composed.output,
      sourceManifestSha256: composed.manifestSha256,
      output: path.join(root, 'second'),
    });
    expect(second.manifestSha256).toBe(candidate.manifestSha256);
    expect(() => buildFileCoverageLedgerDedup({ sourceBundle: composed.output, sourceManifestSha256: composed.manifestSha256, output: candidate.output })).toThrow('already exists');
    expect(() => buildFileCoverageLedgerDedup({ sourceBundle: composed.output, sourceManifestSha256: '0'.repeat(64), output: path.join(root, 'bad-digest') })).toThrow('digest');
    expect(() => buildFileCoverageLedgerDedup({ sourceBundle: composed.output, sourceManifestSha256: composed.manifestSha256, output: path.join(rootDir, 'skills', 'blocked-dedup') })).toThrow('overlaps');
  });
});
