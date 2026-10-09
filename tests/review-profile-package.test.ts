import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterAll, describe, expect, test } from 'vitest';
import { prepareReviewProfilePackage, verifyReviewProfilePackage } from '../scripts/prepare-review-profile-package.mjs';
import { validateReviewOutput as legacy } from '../scripts/legacy/validate-review-output.mjs';
import { readText, rootDir } from './test-utils';

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'fe-package-test-'));
afterAll(() => fs.rmSync(temp, { recursive: true, force: true }));
const output = path.join(temp, 'preview');
const manifest = prepareReviewProfilePackage(output);
const run = (args: string[]) => spawnSync(process.execPath, [path.join(output, 'scripts/validate-review-output.mjs'), ...args], { cwd: temp, encoding: 'utf8' });

describe('standalone preview package', () => {
  test('preserves all twelve accepted Skill files byte for byte', () => {
    const pins = JSON.parse(readText('evaluation/prototypes/origin-occurrence/integration-12/manifest.json')).outputs;
    for (const pin of pins) {
      expect(fs.readFileSync(path.join(output, pin.path.replace(/^skill\//u, 'skills/')), 'utf8'))
        .toBe(readText(`evaluation/prototypes/origin-occurrence/integration-12/${pin.path}`));
    }
    expect(verifyReviewProfilePackage(output)).toMatchObject({ status: 'Pass', skillFiles: 12, runtimeReady: false });
  });

  test.each(['quick.en', 'quick.zh-CN', 'deep.en', 'deep.zh-CN', 'fix.en', 'fix.zh-CN'])('validates %s using only the relocated package dependencies', (name) => {
    const result = run(['--profile', 'v0.6.0', '--mode', name.split('.')[0], '--source-root', '/review', path.join(output, `examples/outputs/${name}.md`)]);
    expect(result.status, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({ profile: 'v0.6.0', valid: true, reportAcceptance: 'Not Evaluated' });
  });

  test('preserves the default CLI and includes only self-contained relative runtime imports', () => {
    const filename = path.join(output, 'examples/outputs/quick.en.md');
    const expected = legacy(fs.readFileSync(filename, 'utf8'), 'quick');
    const result = run(['--mode', 'quick', filename]);
    expect(result.status).toBe(expected.valid ? 0 : 1);
    expect(JSON.parse(result.stdout)).toEqual(expected);
    for (const pin of manifest.outputs.filter((item: any) => item.path.startsWith('scripts/') && item.path.endsWith('.mjs'))) {
      const source = fs.readFileSync(path.join(output, pin.path), 'utf8');
      for (const match of source.matchAll(/from '([^']+)'/gu)) {
        if (match[1].startsWith('node:')) continue;
        const target = path.resolve(output, path.dirname(pin.path), match[1]);
        expect(target.startsWith(output + path.sep)).toBe(true);
        expect(fs.existsSync(target)).toBe(true);
      }
    }
  });

  test.each(['stdin', 'eval'])('imports and calls both packaged API profiles from a %s host', (host) => {
    const filename = path.join(output, 'examples/outputs/quick.en.md');
    const module = pathToFileURL(path.join(output, 'scripts/validate-review-output.mjs')).href;
    const code = `import { validateReviewOutput } from ${JSON.stringify(module)};
      import fs from 'node:fs';
      const text = fs.readFileSync(${JSON.stringify(filename)}, 'utf8');
      console.log(JSON.stringify([validateReviewOutput(text, 'quick'),
        validateReviewOutput(text, 'quick', { profile: 'v0.6.0', sourceRoot: '/review' })]));`;
    const result = spawnSync(process.execPath, ['--input-type=module', ...(host === 'stdin' ? ['-'] : ['--eval', code])],
      { input: host === 'stdin' ? code : undefined, cwd: temp, encoding: 'utf8' });
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe('');
    const [old, selected] = JSON.parse(result.stdout);
    expect(old).toEqual(legacy(fs.readFileSync(filename, 'utf8'), 'quick'));
    expect(selected).toMatchObject({ profile: 'v0.6.0', valid: true, reportAcceptance: 'Not Evaluated', raw: old });
  });

  test.each(['stdin', 'eval'])('imports and calls the builder verification API from a %s host', (host) => {
    const module = pathToFileURL(path.join(rootDir, 'scripts/prepare-review-profile-package.mjs')).href;
    const code = `import { verifyReviewProfilePackage } from ${JSON.stringify(module)};
      console.log(JSON.stringify(verifyReviewProfilePackage(${JSON.stringify(output)})));`;
    const result = spawnSync(process.execPath, ['--input-type=module', ...(host === 'stdin' ? ['-'] : ['--eval', code])],
      { input: host === 'stdin' ? code : undefined, cwd: temp, encoding: 'utf8' });
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe('');
    expect(JSON.parse(result.stdout)).toEqual(verifyReviewProfilePackage(output));
  });

  test.each([false, true])('runs both CLIs through directory aliases, preserve-symlinks-main=%s', (preserve) => {
    const alias = path.join(temp, `package-alias-${preserve}`);
    const repoAlias = path.join(temp, `repo-alias-${preserve}`);
    fs.symlinkSync(output, alias, 'dir');
    fs.symlinkSync(rootDir, repoAlias, 'dir');
    const flags = preserve ? ['--preserve-symlinks-main'] : [];
    const checked = spawnSync(process.execPath, [...flags, path.join(alias, 'scripts/validate-review-output.mjs'),
      '--mode', 'quick', '--profile', 'v0.6.0', '--source-root', '/review', path.join(alias, 'examples/outputs/quick.en.md')],
    { cwd: temp, encoding: 'utf8' });
    expect(checked.status, checked.stderr).toBe(0);
    expect(JSON.parse(checked.stdout).valid).toBe(true);
    const verified = spawnSync(process.execPath, [...flags, path.join(repoAlias, 'scripts/prepare-review-profile-package.mjs'), '--verify', alias],
      { cwd: temp, encoding: 'utf8' });
    expect(verified.status, verified.stderr).toBe(0);
    expect(JSON.parse(verified.stdout)).toEqual(verifyReviewProfilePackage(output));
  });

  test('generates deterministic content without copying evaluation machinery or runtime records', () => {
    const second = path.join(temp, 'second');
    expect(prepareReviewProfilePackage(second)).toEqual(manifest);
    const paths = manifest.outputs.map((item: any) => item.path);
    expect(paths.some((p: string) => /oracle|raw-session|preparation|candidate|adjudicate/.test(p))).toBe(false);
    expect(fs.readFileSync(path.join(second, 'manifest.json'), 'utf8')).toBe(fs.readFileSync(path.join(output, 'manifest.json'), 'utf8'));
  });

  test('refuses to overwrite a prepared package', () => {
    expect(() => prepareReviewProfilePackage(output)).toThrow(/new directory/);
  });

  test.each(['changed', 'extra', 'symlink'])('rejects package integrity drift: %s', (kind) => {
    const dir = path.join(temp, kind);
    prepareReviewProfilePackage(dir);
    if (kind === 'changed') fs.appendFileSync(path.join(dir, 'README.md'), '\nchanged');
    if (kind === 'extra') fs.writeFileSync(path.join(dir, 'unexpected.md'), 'extra');
    if (kind === 'symlink') fs.symlinkSync(path.join(temp, 'absent'), path.join(dir, 'unexpected-link'));
    expect(() => verifyReviewProfilePackage(dir)).toThrow();
  });
});
