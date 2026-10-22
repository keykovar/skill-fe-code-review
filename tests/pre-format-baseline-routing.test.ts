import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterAll, describe, expect, test } from 'vitest';
import { preFormatRoot, preFormatSuites, verifyPreFormatBaseline } from '../scripts/pre-format-baseline.mjs';
import config from '../vitest.config';

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'fe-pre-format-routing-'));
afterAll(() => fs.rmSync(temporary, { recursive: true, force: true }));
const hash = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

describe('v0.6.0 pre-format baseline routing', () => {
  test('pins exactly the original closure and keeps each historical suite in one project', () => {
    const manifest = verifyPreFormatBaseline();
    expect(manifest.files).toHaveLength(87);
    expect(manifest.files.filter((pin: any) => pin.path.startsWith('skills/'))).toHaveLength(12);
    expect(new Set(preFormatSuites).size).toBe(17);
    expect(manifest.files.filter((pin: any) => pin.path.endsWith('.test.ts')).map((pin: any) => pin.path)).toEqual(preFormatSuites);
    for (const name of preFormatSuites) {
      expect(fs.readFileSync(path.join(process.cwd(), name)), name).toEqual(fs.readFileSync(path.join(preFormatRoot, name)));
    }
    const [current, historical] = config.test!.projects as any[];
    expect(current.test.exclude.filter((name: string) => preFormatSuites.includes(name))).toEqual(preFormatSuites);
    expect(historical.root).toBe(preFormatRoot);
    expect(historical.test.include).toEqual(preFormatSuites);
    expect(historical.test.pool).toBe('forks');
    expect(process.cwd()).not.toBe(preFormatRoot);
    for (const name of ['skill-content', 'skill-structure', 'review-output-profile', 'output-examples']) {
      expect(current.test.exclude).not.toContain(`tests/${name}.test.ts`);
    }
  });

  test('retains the first baseline and all its original input hashes', () => {
    const originalRoot = path.join(process.cwd(), 'evaluation/baselines/v0.6.0-pre-format');
    const bytes = fs.readFileSync(path.join(originalRoot, 'manifest.json'));
    const current = verifyPreFormatBaseline();
    expect(hash(bytes)).toBe(current.parentManifestSha256);
    const original = JSON.parse(bytes.toString('utf8'));
    for (const pin of original.files) {
      expect(hash(fs.readFileSync(path.join(originalRoot, pin.path))), pin.path).toBe(pin.sha256);
      expect(current.files.find((item: any) => item.path === pin.path)).toEqual(pin);
    }
  });

  test('rebuilds the accepted manifest independently of a changed sibling live Skill', async () => {
    const host = path.join(temporary, 'host');
    const baseline = path.join(host, 'evaluation/baselines/v0.6.0-pre-format-02');
    fs.cpSync(preFormatRoot, baseline, { recursive: true });
    const live = path.join(host, 'skills/fe-code-review');
    fs.mkdirSync(live, { recursive: true });
    fs.writeFileSync(path.join(live, 'SKILL.md'), 'Unrelated future Skill contents.');
    const { buildLedgerFormatSkill } = await import(pathToFileURL(path.join(baseline, 'evaluation/prototypes/build-ledger-format-skill.mjs')).href);
    for (const name of ['first', 'second']) {
      const built = buildLedgerFormatSkill(path.join(temporary, name));
      expect(hash(fs.readFileSync(path.join(built.output, 'manifest.json')))).toBe(verifyPreFormatBaseline().candidateManifestSha256);
      fs.appendFileSync(path.join(live, 'SKILL.md'), '\nChanged live tree.');
    }
    expect(verifyPreFormatBaseline(baseline)).toEqual(verifyPreFormatBaseline());
  });

  test.each(['source', 'manifest', 'extra', 'missing', 'symlink'])('rejects %s drift before dispatch', kind => {
    const copy = path.join(temporary, kind);
    fs.cpSync(preFormatRoot, copy, { recursive: true });
    const core = path.join(copy, 'skills/fe-code-review/SKILL.md');
    if (kind === 'source') fs.appendFileSync(core, '\n');
    if (kind === 'manifest') fs.appendFileSync(path.join(copy, 'manifest.json'), '\n');
    if (kind === 'extra') fs.writeFileSync(path.join(copy, 'unexpected.txt'), 'extra');
    if (kind === 'missing' || kind === 'symlink') fs.unlinkSync(core);
    if (kind === 'symlink') fs.symlinkSync(path.join(preFormatRoot, 'skills/fe-code-review/SKILL.md'), core);
    expect(() => verifyPreFormatBaseline(copy)).toThrow();
  });
});
