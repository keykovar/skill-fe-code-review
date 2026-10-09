import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterAll, describe, expect, test } from 'vitest';
import { readText, readHistoricalText, rootDir } from './test-utils';

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'fe-historical-routing-'));
afterAll(() => fs.rmSync(temporary, { recursive: true, force: true }));
const builders = ['build-grouped-ledger-candidate.mjs', 'build-origin-occurrence-integrated.mjs', 'build-origin-occurrence-finalization.mjs'];
const hash = (value: string) => createHash('sha256').update(value).digest('hex');

describe('frozen historical builder routing', () => {
  test('retains every baseline byte and every accepted promoted Skill byte independently', () => {
    const historical = JSON.parse(readText('evaluation/baselines/pre-v0.6.0/manifest.json'));
    for (const pin of historical.files) expect(hash(readHistoricalText(pin.path)), pin.path).toBe(pin.sha256);
    const candidate = JSON.parse(readText('evaluation/prototypes/origin-occurrence/integration-12/manifest.json'));
    for (const pin of candidate.outputs) expect(hash(readText(pin.path.replace(/^skill\//u, 'skills/'))), pin.path).toBe(pin.sha256);
    expect(readHistoricalText('skills/fe-code-review/SKILL.md')).not.toBe(readText('skills/fe-code-review/SKILL.md'));
  });

  test.each(builders)('%s supports stdin API import without starting the CLI', (filename) => {
    const moduleUrl = pathToFileURL(path.join(rootDir, 'scripts', filename)).href;
    const result = spawnSync(process.execPath, ['--input-type=module', '-'], {
      input: `const api = await import(${JSON.stringify(moduleUrl)}); console.log(Object.keys(api).filter(key => key.startsWith('build')).length);`,
      cwd: temporary, encoding: 'utf8',
    });
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toBe('1\n');
  });

  test.each(builders)('%s builds via its retained CLI and propagates errors', (filename) => {
    const output = path.join(temporary, filename);
    const run = (args: string[]) => spawnSync(process.execPath, [path.join(rootDir, 'scripts', filename), ...args],
      { cwd: temporary, encoding: 'utf8' });
    const built = run(['--output', output]);
    expect(built.status, built.stderr).toBe(0);
    expect(() => JSON.parse(built.stdout)).not.toThrow();
    const rejected = run(['--invalid']);
    expect(rejected.status).toBe(1);
    expect(rejected.stdout).toBe('');
    expect(rejected.stderr).toContain('Usage:');
    if (filename === 'build-origin-occurrence-finalization.mjs') {
      const actual = JSON.parse(fs.readFileSync(path.join(output, 'manifest.json'), 'utf8'));
      const accepted = JSON.parse(readText('evaluation/prototypes/origin-occurrence/integration-12/manifest.json'));
      expect(actual.outputs).toEqual(accepted.outputs);
    }
  });
});
