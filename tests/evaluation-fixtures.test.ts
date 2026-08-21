import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';

import { exists, readText, rootDir } from './test-utils';

type FixtureMode = 'quick' | 'deep' | 'fix';

interface PreparedFixture {
  branch: string;
  caseName: string;
  expectedTestResult: 'pass' | 'fail';
  mode: FixtureMode;
  oracle: Record<string, unknown>;
  prompt: string;
  status: string[];
  targetDir: string;
  testCommand: string;
}

const temporaryDirectories: string[] = [];
const prepareScript = path.join(rootDir, 'scripts', 'prepare-evaluation-fixture.mjs');

function run(command: string, args: string[], cwd = rootDir) {
  return spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, LANG: 'C', LC_ALL: 'C' },
  });
}

function prepare(mode: FixtureMode): PreparedFixture {
  const targetDir = fs.mkdtempSync(path.join(os.tmpdir(), `fe-code-review-${mode}-test-`));
  temporaryDirectories.push(targetDir);

  const result = run(process.execPath, [prepareScript, mode, '--output', targetDir]);
  expect(result.status, result.stderr).toBe(0);

  return JSON.parse(result.stdout) as PreparedFixture;
}

function git(targetDir: string, args: string[]): string {
  const result = run('git', args, targetDir);
  expect(result.status, result.stderr).toBe(0);
  return result.stdout.trim();
}

afterEach(() => {
  for (const targetDir of temporaryDirectories.splice(0)) {
    fs.rmSync(targetDir, { force: true, recursive: true });
  }
});

describe('reproducible evaluation fixtures', () => {
  test('defines machine-readable Quick, Deep, and Fix oracles without changing the skill contract', () => {
    const urlCase = JSON.parse(
      readText('evaluation/fixtures/url-regression/case.json'),
    ) as { modes: Record<string, unknown> };
    const deepCase = JSON.parse(
      readText('evaluation/fixtures/deep-session-ownership/case.json'),
    ) as {
      modes: {
        deep: {
          expectedDesignDecision: string;
        };
      };
    };

    expect(Object.keys(urlCase.modes)).toEqual(['quick', 'fix']);
    expect(Object.keys(deepCase.modes)).toEqual(['deep']);
    expect(deepCase.modes.deep.expectedDesignDecision).toBe('Simplify');
    expect(exists('evaluation/fixtures/url-regression/previous-findings.md')).toBe(true);
    expect(readText('skills/fe-code-review/SKILL.md')).not.toContain('evaluation/fixtures');
    const evaluation = readText('docs/evaluation.md');
    expect(evaluation).toContain('pnpm fixture:prepare quick');
    expect(evaluation).toContain(
      'pnpm fixture:prepare quick --output /private/tmp/fe-code-review-quick',
    );
    expect(evaluation).not.toContain('pnpm fixture:prepare quick -- --output');
    expect(readText('docs/evaluation.md')).toContain('Do not compare complete model text');
    expect(readText('docs/roadmap.md')).toContain('## Completed v0.2.1 Promotion Evidence');
    expect(readText('CHANGELOG.md')).toContain('reproducible Quick, Deep, and Fix evaluation fixtures');
    expect(exists('docs/evaluation-results/v0.2.0-post-release.md')).toBe(true);
    expect(exists('docs/evaluation-results/v0.2.1.md')).toBe(true);
    expect(exists('docs/evaluation-results/v0.3.0-post-release.md')).toBe(true);
  });

  test('prepares the Quick fixture with the seeded untracked dependency and behavior regression', () => {
    const baselineResult = run(
      process.execPath,
      ['--test'],
      path.join(rootDir, 'evaluation', 'fixtures', 'url-regression', 'baseline'),
    );
    expect(baselineResult.status, `${baselineResult.stdout}\n${baselineResult.stderr}`).toBe(0);

    const prepared = prepare('quick');

    expect(prepared.caseName).toBe('url-regression');
    expect(prepared.branch).toBe('main');
    expect(prepared.status).toEqual([' M src/url.ts', '?? src/request-config.ts']);
    expect(prepared.expectedTestResult).toBe('fail');
    expect(git(prepared.targetDir, ['ls-files', 'src/request-config.ts'])).toBe('');
    expect(
      fs.existsSync(path.join(prepared.targetDir, '.agents', 'skills', 'fe-code-review', 'SKILL.md')),
    ).toBe(true);
    expect(
      fs.existsSync(path.join(prepared.targetDir, '.cursor', 'skills', 'fe-code-review', 'SKILL.md')),
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(prepared.targetDir, '.agents', 'skills', 'fe-code-review', '.plugin-eval'),
      ),
    ).toBe(false);
    expect(
      fs.existsSync(
        path.join(prepared.targetDir, '.cursor', 'skills', 'fe-code-review', '.plugin-eval'),
      ),
    ).toBe(false);

    const testResult = run(process.execPath, ['--test'], prepared.targetDir);
    expect(testResult.status).toBe(1);
    expect(`${testResult.stdout}\n${testResult.stderr}`).toContain(
      'https://api.example.com///users/42',
    );
  });

  test('prepares the Fix fixture with tracked dependencies and passing behavior', () => {
    const prepared = prepare('fix');

    expect(prepared.caseName).toBe('url-regression');
    expect(prepared.branch).toBe('main');
    expect(prepared.status).toEqual([' M src/url.ts']);
    expect(prepared.expectedTestResult).toBe('pass');
    expect(git(prepared.targetDir, ['ls-files', 'src/request-config.ts'])).toBe(
      'src/request-config.ts',
    );
    expect(fs.existsSync(path.join(prepared.targetDir, '.evaluation', 'previous-findings.md'))).toBe(
      true,
    );

    const testResult = run(process.execPath, ['--test'], prepared.targetDir);
    expect(testResult.status, `${testResult.stdout}\n${testResult.stderr}`).toBe(0);
  });

  test('prepares a clean Deep branch whose cross-module session regression is reproducible', () => {
    const baselineResult = run(
      process.execPath,
      ['--test'],
      path.join(rootDir, 'evaluation', 'fixtures', 'deep-session-ownership', 'baseline'),
    );
    expect(baselineResult.status, `${baselineResult.stdout}\n${baselineResult.stderr}`).toBe(0);

    const prepared = prepare('deep');

    expect(prepared.caseName).toBe('deep-session-ownership');
    expect(prepared.branch).toBe('candidate');
    expect(prepared.status).toEqual([]);
    expect(prepared.expectedTestResult).toBe('fail');
    expect(git(prepared.targetDir, ['diff', '--name-status', 'main...HEAD']).split('\n')).toEqual([
      'M\tsrc/profile/load-profile.ts',
      'A\tsrc/profile/profile-session.ts',
    ]);

    const testResult = run(process.execPath, ['--test'], prepared.targetDir);
    expect(testResult.status).toBe(1);
    expect(`${testResult.stdout}\n${testResult.stderr}`).toContain("actual: 'Bearer session-token'");
    expect(`${testResult.stdout}\n${testResult.stderr}`).toContain('expected: null');
  });

  test('refuses to overwrite a non-empty output directory', () => {
    const targetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fe-code-review-non-empty-test-'));
    temporaryDirectories.push(targetDir);
    fs.writeFileSync(path.join(targetDir, 'keep.txt'), 'keep\n');

    const result = run(process.execPath, [prepareScript, 'quick', '--output', targetDir]);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Output directory must be empty');
    expect(fs.readFileSync(path.join(targetDir, 'keep.txt'), 'utf8')).toBe('keep\n');
  });
});
