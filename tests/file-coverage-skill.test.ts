import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, test } from 'vitest';
import { buildFileCoverageSkill, makeFileCoverageCore } from '../evaluation/prototypes/build-file-coverage-skill.mjs';
import { makeInventoryCollector } from '../evaluation/prototypes/build-file-coverage-collector.mjs';
import { readText, rootDir } from './test-utils';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fe-file-coverage-skill-'));
const formal = path.join(rootDir, 'skills/fe-code-review');
const core = fs.readFileSync(path.join(formal, 'SKILL.md'), 'utf8');
const rules = readText('evaluation/prototypes/file-coverage/skill-rules.md');
const built = buildFileCoverageSkill(path.join(root, 'candidate'));
const candidateRoot = path.join(built.output, 'fe-code-review');
const candidate = (name: string) => fs.readFileSync(path.join(candidateRoot, name), 'utf8');
const hash = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
afterAll(() => fs.rmSync(root, { recursive: true, force: true }));

describe('isolated file-coverage Skill candidate', () => {
  test('changes only the core, Quick/Deep, collector and its new helper', () => {
    expect(built.manifest.files.filter((item: any) => item.changed).map((item: any) => item.path).sort()).toEqual([
      'fe-code-review/SKILL.md', 'fe-code-review/references/deep-review.md',
      'fe-code-review/references/quick-review.md', 'fe-code-review/scripts/collect-review-context.mjs',
      'fe-code-review/scripts/file-coverage.mjs',
    ]);
    expect(built.manifest.sources).toHaveLength(12);
    expect(built.manifest.files).toHaveLength(13);
    expect(fs.existsSync(path.join(candidateRoot, '.plugin-eval'))).toBe(false);
    for (const item of built.manifest.files) {
      const bytes = fs.readFileSync(path.join(built.output, item.path));
      expect(hash(bytes)).toBe(item.sha256);
      if (!item.changed) expect(bytes).toEqual(fs.readFileSync(path.join(formal, item.path.replace('fe-code-review/', ''))));
    }
    for (const item of built.manifest.sources) {
      expect(hash(fs.readFileSync(path.join(rootDir, item.path)))).toBe(item.sha256);
    }
    expect(built.manifest).toMatchObject({ installed: false, runtimeReady: false, modelInvocations: 0 });
  });

  test('preserves every existing core rule outside the explicit collector routing replacement', () => {
    const start = 'When the requested scope is all uncommitted changes,';
    const end = 'Establish and report the comparison baseline before reviewing:';
    const current = candidate('SKILL.md');
    expect(current.startsWith(core.slice(0, core.indexOf(start)))).toBe(true);
    expect(current.slice(current.indexOf(end)).replace(rules.trim() + '\n\n', '')).toBe(core.slice(core.indexOf(end)));
    expect(current.split(rules.trim())).toHaveLength(2);
  });

  test('preserves mode sections and existing guidance, without a new report heading', () => {
    for (const mode of ['quick', 'deep']) {
      const name = `references/${mode}-review.md`;
      const headings = (text: string) => text.match(/^## .+$/gm);
      expect(headings(candidate(name))).toEqual(headings(fs.readFileSync(path.join(formal, name), 'utf8')));
    }
    expect(candidate('references/fix-review.md')).toBe(fs.readFileSync(path.join(formal, 'references/fix-review.md'), 'utf8'));
    expect(candidate('agents/openai.yaml')).toBe(fs.readFileSync(path.join(formal, 'agents/openai.yaml'), 'utf8'));
  });

  test('reuses the previously tested collector transformation and colocated helper', () => {
    expect(candidate('scripts/collect-review-context.mjs')).toBe(
      makeInventoryCollector(fs.readFileSync(path.join(formal, 'scripts/collect-review-context.mjs'), 'utf8')),
    );
    expect(candidate('scripts/file-coverage.mjs')).toBe(readText('evaluation/prototypes/file-coverage.mjs'));
  });

  test('is reproducible and refuses existing destinations or live Skill paths including aliases', () => {
    const second = buildFileCoverageSkill(path.join(root, 'second'));
    expect(second.manifest).toEqual(built.manifest);
    expect(() => buildFileCoverageSkill(built.output)).toThrow();
    expect(() => buildFileCoverageSkill(path.join(formal, 'blocked-candidate'))).toThrow('outside the formal Skill tree');
    const alias = path.join(root, 'formal-alias');
    fs.symlinkSync(formal, alias);
    expect(() => buildFileCoverageSkill(path.join(alias, 'blocked-candidate'))).toThrow('outside the formal Skill tree');
    expect(fs.existsSync(path.join(formal, 'blocked-candidate'))).toBe(false);
  });

  test('fails closed when a required source anchor is missing or duplicated', () => {
    expect(() => makeFileCoverageCore(core.replace('Establish and report', 'Changed anchor'), rules)).toThrow('anchors');
    expect(() => makeFileCoverageCore(core + core, rules)).toThrow('exactly once');
  });
});
