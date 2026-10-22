import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, test } from 'vitest';
import { buildLedgerFormatSkill, clarifyLedgerCore, clarifyLedgerReference } from '../evaluation/prototypes/build-ledger-format-skill.mjs';
import { validateReviewOutput } from '../scripts/validate-review-output.mjs';
import { readText, rootDir } from './test-utils';

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'fe-ledger-format-'));
const built = buildLedgerFormatSkill(path.join(temporary, 'candidate'));
const readCandidate = (name: string) => fs.readFileSync(path.join(built.output, 'fe-code-review', name), 'utf8');
const sha = (value: Buffer) => createHash('sha256').update(value).digest('hex');
const ledger = (text: string) => text.match(/## Changed-Condition Coverage[^\n]*\n([\s\S]*?)(?=\n## )/)![1];
afterAll(() => fs.rmSync(temporary, { recursive: true, force: true }));

describe('isolated ledger-format clarification', () => {
  test('changes only core and Quick/Deep, preserving nine other files byte for byte', () => {
    expect(built.manifest.files).toHaveLength(12);
    expect(built.manifest.files.filter((file: any) => file.changed).map((file: any) => file.path).sort()).toEqual([
      'fe-code-review/SKILL.md', 'fe-code-review/references/deep-review.md', 'fe-code-review/references/quick-review.md',
    ]);
    for (const pin of built.manifest.files) {
      const bytes = fs.readFileSync(path.join(built.output, pin.path));
      expect(sha(bytes)).toBe(pin.sha256);
      if (!pin.changed) expect(bytes).toEqual(fs.readFileSync(path.join(rootDir, 'skills', pin.path)));
    }
    for (const pin of built.manifest.sources) expect(sha(fs.readFileSync(path.join(rootDir, pin.path)))).toBe(pin.sha256);
    expect(built.manifest).toMatchObject({ installed: false, runtimeReady: false, modelInvocations: 0 });
  });

  test('retains the entire original core around one local insertion', () => {
    const original = readText('skills/fe-code-review/SKILL.md');
    const boundary = '\n\nThe initial `[file:line]` may remain plain';
    const index = original.indexOf(boundary);
    const current = readCandidate('SKILL.md');
    expect(current.startsWith(original.slice(0, index))).toBe(true);
    expect(current.endsWith(original.slice(index))).toBe(true);
    expect(current.slice(index, current.length - original.slice(index).length).trim()).not.toContain('\n');
  });

  test.each(['quick', 'deep'])('%s template has only one ledger entry and all prior instructions survive outside the fence', mode => {
    const source = readText(`skills/fe-code-review/references/${mode}-review.md`);
    const current = readCandidate(`references/${mode}-review.md`);
    const template = current.match(/```md\n([\s\S]*?)\n```/)![1];
    const lines = ledger(template).split('\n').filter(line => line.trim());
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/^- \[file:line\] .+: .+ -> .+; Disposition: .+$/);
    for (const line of source.split('\n').filter(line => line.trim() && !line.startsWith('- [file:line] 条件'))) expect(current.split('\n')).toContain(line);
    for (const line of ledger(source).split('\n').filter(line => line.trim() && !line.startsWith('- [file:line]'))) {
      expect(current.indexOf(line)).toBeLessThan(current.indexOf('```md'));
      expect(template).not.toContain(line);
    }
    expect(current.match(/^## .+$/gm)).toEqual(source.match(/^## .+$/gm));
  });

  test.each(['quick', 'deep'] as const)('%s template ledger slot can render valid unchanged validator grammar', mode => {
    const original = readText(`examples/outputs/${mode}.zh-CN.md`);
    const originalEntry = ledger(original).trim().split('\n')[0];
    const match = originalEntry.match(/^(- \[[^\]]+\]) (.+): (.+) -> (.+); Disposition: (.+)$/)!;
    expect(match).toBeTruthy();
    const slot = ledger(readCandidate(`references/${mode}-review.md`)).trim();
    const rendered = slot.replace('- [file:line]', match[1]).replace('条件:', match[2] + ':')
      .replace('修改前 -> 修改后', match[3] + ' -> ' + match[4])
      .replace('<单个最终 Finding ID 或 Behavior Preserving 或 Cannot Verify>', match[5]);
    const updated = original.replace(originalEntry, rendered);
    expect(validateReviewOutput(updated, mode, { profile: 'v0.6.0' }).valid).toBe(true);
  });

  test.each([['quick', 'en'], ['quick', 'zh-CN'], ['deep', 'en'], ['deep', 'zh-CN']] as const)('keeps %s %s prose rejection and allows that note in Evidence', (mode, language) => {
    const original = readText(`examples/outputs/${mode}.${language}.md`);
    const options = { profile: 'v0.6.0', sourceRoot: '/review' };
    const coverage = original.match(/^## Changed-Condition Coverage.*$/m)![0];
    const note = language === 'en' ? 'All outcomes are static inferences.' : '以下结果均为静态推演。';
    const malformed = original.replace(coverage, coverage + '\n\n' + note);
    expect(validateReviewOutput(malformed, mode, options).errors).toEqual(expect.arrayContaining([expect.objectContaining({ type: 'coverage-ledger-unexpected-content' })]));
    const evidence = original.match(/^## Evidence.*$/m)![0];
    const valid = original.replace(evidence, evidence + '\n\n' + note);
    const assessment = validateReviewOutput(valid, mode, options);
    expect(assessment.valid).toBe(true);
    expect(assessment.findings).toEqual(expect.arrayContaining(validateReviewOutput(original, mode, options).findings));
    expect(assessment.semanticStatus).toBe('Not Evaluated');
  });

  test('rejects anchor drift and repeated application', () => {
    expect(() => clarifyLedgerCore('no anchor')).toThrow('exactly once');
    const original = readText('skills/fe-code-review/references/quick-review.md');
    expect(() => clarifyLedgerReference(original.replace('位置可使用', 'changed'))).toThrow('missing');
    expect(() => clarifyLedgerReference(original + original)).toThrow('exactly once');
    expect(() => clarifyLedgerReference(readCandidate('references/quick-review.md'))).toThrow();
  });

  test('rebuilds deterministically and rejects formal destinations and overwrite', () => {
    expect(buildLedgerFormatSkill(path.join(temporary, 'second')).manifest).toEqual(built.manifest);
    expect(() => buildLedgerFormatSkill(built.output)).toThrow('already exists');
    expect(() => buildLedgerFormatSkill(path.join(rootDir, 'skills', 'blocked-ledger'))).toThrow('formal');
    const alias = path.join(temporary, 'alias');
    fs.symlinkSync(path.join(rootDir, 'skills'), alias);
    expect(() => buildLedgerFormatSkill(path.join(alias, 'blocked-ledger'))).toThrow('formal');
  });
});
