import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, test } from 'vitest';
import { buildFileCoverageSkill } from '../evaluation/prototypes/build-file-coverage-skill.mjs';
import { buildFileCoverageLedgerSkill } from '../evaluation/prototypes/build-file-coverage-ledger-skill.mjs';
import { clarifyLedgerCore, clarifyLedgerReference } from '../evaluation/prototypes/build-ledger-format-skill.mjs';
import { validateReviewOutput } from '../scripts/validate-review-output.mjs';
import { validateFileCoverageReport } from '../evaluation/prototypes/validate-file-coverage-report.mjs';
import { parseGitStatusInventory } from '../evaluation/prototypes/file-coverage.mjs';
import { readText, rootDir } from './test-utils';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fe-file-coverage-ledger-'));
const hash = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const parent = buildFileCoverageSkill(path.join(root, 'parent'));
const sourceManifestSha256 = hash(fs.readFileSync(path.join(parent.output, 'manifest.json')));
const build = (output: string, sourceBundle = parent.output, digest = sourceManifestSha256) =>
  buildFileCoverageLedgerSkill({ sourceBundle, sourceManifestSha256: digest, output });
const built = build(path.join(root, 'candidate'));
const candidate = (name: string) => fs.readFileSync(path.join(built.output, 'fe-code-review', name), 'utf8');
const parentText = (name: string) => fs.readFileSync(path.join(parent.output, 'fe-code-review', name), 'utf8');
const ledger = (text: string) => text.match(/## Changed-Condition Coverage[^\n]*\n([\s\S]*?)(?=\n## )/)![1];
afterAll(() => fs.rmSync(root, { recursive: true, force: true }));

describe('file coverage with the existing ledger format correction', () => {
  test('changes only three instruction files and preserves all parent/dependency pins', () => {
    expect(built.manifest.files).toHaveLength(13);
    expect(built.manifest.files.filter(file => file.changedFromParent).map(file => file.path).sort()).toEqual([
      'fe-code-review/SKILL.md', 'fe-code-review/references/deep-review.md', 'fe-code-review/references/quick-review.md',
    ]);
    for (const pin of built.manifest.files) {
      const bytes = fs.readFileSync(path.join(built.output, pin.path));
      expect(hash(bytes)).toBe(pin.sha256);
      expect(bytes.length).toBe(pin.bytes);
      if (!pin.changedFromParent) expect(bytes).toEqual(fs.readFileSync(path.join(parent.output, pin.path)));
    }
    for (const pin of parent.manifest.files) expect(hash(fs.readFileSync(path.join(parent.output, pin.path)))).toBe(pin.sha256);
    for (const pin of [...built.manifest.sources, ...built.manifest.recipes]) expect(hash(fs.readFileSync(path.join(rootDir, pin.path)))).toBe(pin.sha256);
    expect(hash(fs.readFileSync(path.join(parent.output, 'manifest.json')))).toBe(sourceManifestSha256);
    expect(built.manifest).toMatchObject({ parentManifestSha256: sourceManifestSha256, installed: false, runtimeReady: false, modelInvocations: 0 });
    expect(candidate('SKILL.md')).toBe(clarifyLedgerCore(parentText('SKILL.md')));
    expect(candidate('SKILL.md')).toContain(readText('evaluation/prototypes/file-coverage/skill-rules.md').trim());
  });

  test.each(['quick', 'deep'] as const)('%s composed template retains file accounting and renders the strict ledger slot', mode => {
    const name = `references/${mode}-review.md`;
    const current = candidate(name);
    expect(current).toBe(clarifyLedgerReference(parentText(name)));
    expect(current.match(/^## .+$/gm)).toEqual(parentText(name).match(/^## .+$/gm));
    expect(current.match(/^- 文件覆盖：.*$/m)![0]).toBe(parentText(name).match(/^- 文件覆盖：.*$/m)![0]);
    const template = current.match(/```md\n([\s\S]*?)\n```/)![1];
    const slot = ledger(template).trim();
    expect(slot.split('\n')).toHaveLength(1);
    const rendered = slot.replace('[file:line]', '[src/a.mjs:1]').replace('条件:', 'target evidence:')
      .replace('修改前 -> 修改后', 'baseline available -> target unavailable')
      .replace('<单个最终 Finding ID 或 Behavior Preserving 或 Cannot Verify>', 'Cannot Verify');
    const report = `## Changed-Condition Coverage\n\n${rendered}\n\n## Evidence\n\nLocations refer to the delivered baseline.\n`;
    expect(validateReviewOutput(report, mode, { profile: 'v0.6.0' }).valid).toBe(true);
  });

  test.each([['quick', 'en'], ['quick', 'zh-CN'], ['deep', 'en'], ['deep', 'zh-CN']] as const)(
    '%s %s composes missing-target accounting with strict prose rejection', (mode, language) => {
      const zh = language === 'zh-CN';
      const section = zh ? (mode === 'quick' ? '审查范围' : '变更理解') : (mode === 'quick' ? 'Review Scope' : 'Change Understanding');
      const inventory = parseGitStatusInventory(' M src/a.mjs\0', { scopeKey: 'synthetic:packet', baseline: 'baseline', enumerationComplete: true });
      const accounting = { mode, scopeKey: inventory.scopeKey, baseline: inventory.baseline,
        entries: [{ path: 'src/a.mjs', state: 'Cannot Verify', reviewedLayers: [], remaining: 'Target source unavailable.' }],
        summary: { inventory: 'Complete', knownFiles: 1, totalFiles: 1, fullyReviewed: false,
          counts: { Reviewed: 0, Partial: 0, Deferred: 0, 'Cannot Verify': 1 } } };
      const summary = zh
        ? '- 文件覆盖：清单 Complete；1 个变更路径；Reviewed 0 / Partial 0 / Deferred 0 / Cannot Verify 1。\n- 文件缺口：Cannot Verify；路径 "src/a.mjs"；原因 目标源码未交付。'
        : '- File coverage: inventory Complete; 1 changed paths; Reviewed 0 / Partial 0 / Deferred 0 / Cannot Verify 1.\n- File gap: Cannot Verify; path "src/a.mjs"; reason Target source unavailable.';
      const note = zh ? '行号定位已交付的 baseline，不代表目标源码行号。' : 'Line numbers refer to the delivered baseline, not the target.';
      const original = readText(`examples/outputs/${mode}.${language}.md`);
      const report = original.replace(`## ${section}\n`, `## ${section}\n\n${summary}\n`)
        .replace(/(^## Evidence[^\n]*)/m, '$1\n\n' + note)
        .replace(/(^## Changed-Condition Coverage[^\n]*)/m, '$1\n\n- [src/a.mjs:1] target: baseline available -> target unavailable; Disposition: Cannot Verify');
      const options = { inventory, accounting, language, sourceRoot: '/review' };
      const valid = validateFileCoverageReport(report, mode, options);
      expect(valid.valid, JSON.stringify(valid)).toBe(true);
      expect(valid.base.findings.map(f => [f.id, f.severity, f.origin, f.reproduction])).toEqual(
        validateReviewOutput(original, mode, { profile: 'v0.6.0', sourceRoot: '/review' }).findings.map(f => [f.id, f.severity, f.origin, f.reproduction]));
      expect(valid.reportAcceptance).toBe('Not Evaluated');
      const malformed = report.replace(/(^## Changed-Condition Coverage[^\n]*)/m, '$1\n\n' + note);
      const rejected = validateFileCoverageReport(malformed, mode, options);
      expect(rejected.valid).toBe(false);
      expect(rejected.base.errors).toContainEqual(expect.objectContaining({ type: 'coverage-ledger-unexpected-content' }));
      expect(validateFileCoverageReport(report.replace(summary, ''), mode, options).coverage.errors)
        .toContainEqual({ code: 'missing-coverage-summary' });
    });

  test.each(['en', 'zh-CN'] as const)('keeps %s Fix unchanged and rejects ledger expansion', language => {
    expect(candidate('references/fix-review.md')).toBe(readText('skills/fe-code-review/references/fix-review.md'));
    const report = readText(`examples/outputs/fix.${language}.md`);
    const options = { language, sourceRoot: '/review' };
    expect(validateFileCoverageReport(report, 'fix', options).valid).toBe(true);
    expect(validateFileCoverageReport(report + '\n## Changed-Condition Coverage\n- [src/a.mjs:1] a: b -> c; Disposition: Cannot Verify\n', 'fix', options).valid).toBe(false);
  });

  test('is deterministic, refuses overwrite, parent/formal destinations and symlink aliases', () => {
    expect(build(path.join(root, 'second')).manifestSha256).toBe(built.manifestSha256);
    expect(() => build(built.output)).toThrow('already exists');
    expect(() => build(path.join(parent.output, 'child'))).toThrow('overlaps');
    expect(() => build(path.join(rootDir, 'skills', 'blocked-composition'))).toThrow('overlaps');
    const alias = path.join(root, 'formal-alias');
    fs.symlinkSync(path.join(rootDir, 'skills'), alias);
    expect(() => build(path.join(alias, 'child'))).toThrow('overlaps');
    expect(() => build(path.join(root, 'bad-digest'), parent.output, '0'.repeat(64))).toThrow('digest');
    expect(() => build(path.join(root, 'repeat'), built.output, built.manifestSha256)).toThrow('original file-coverage');
  });

  test.each(['missing', 'changed', 'extra', 'symlink'] as const)('rejects %s parent material before writing output', kind => {
    const copy = path.join(root, kind);
    fs.cpSync(parent.output, copy, { recursive: true });
    const core = path.join(copy, 'fe-code-review/SKILL.md');
    if (kind === 'missing' || kind === 'symlink') fs.unlinkSync(core);
    if (kind === 'changed') fs.appendFileSync(core, '\nchanged\n');
    if (kind === 'extra') fs.writeFileSync(path.join(copy, 'report.md'), 'Evaluator-only data.');
    if (kind === 'symlink') fs.symlinkSync(path.join(parent.output, 'fe-code-review/SKILL.md'), core);
    const output = path.join(root, kind + '-output');
    expect(() => build(output, copy)).toThrow();
    expect(fs.existsSync(output)).toBe(false);
  });
});
