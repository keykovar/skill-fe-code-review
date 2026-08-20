import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';

import { rootDir } from './test-utils';

interface ReviewContext {
  codegraphPresent: boolean;
  diffCheck: {
    clean: boolean;
    staged: {
      clean: boolean;
      exitCode: number;
      output: string;
    };
    unstaged: {
      clean: boolean;
      exitCode: number;
      output: string;
    };
  };
  head: string;
  repositoryRoot: string;
  stagedPatch: string;
  status: string[];
  unstagedPatch: string;
  unstagedStat: string;
  untrackedFiles: string[];
}

const temporaryDirectories: string[] = [];
const scriptPath = path.join(
  rootDir,
  'skills',
  'fe-code-review',
  'scripts',
  'collect-review-context.mjs',
);

function makeDirectory(): string {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fe-review-context-'));
  temporaryDirectories.push(directory);
  return directory;
}

function run(directory: string, args: string[]) {
  const result = spawnSync('git', ['-C', directory, ...args], { encoding: 'utf8' });
  expect(result.status, result.stderr).toBe(0);
}

function initializeRepository(directory: string) {
  run(directory, ['init', '--quiet']);
  run(directory, ['config', 'user.name', 'Evaluation Fixture']);
  run(directory, ['config', 'user.email', 'fixture@example.invalid']);
  fs.mkdirSync(path.join(directory, 'src'));
  fs.writeFileSync(path.join(directory, 'src', 'request.ts'), 'export const value = 1;\n');
  run(directory, ['add', 'src/request.ts']);
  run(directory, ['commit', '--quiet', '-m', 'baseline']);
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { force: true, recursive: true });
  }
});

describe('review context collector', () => {
  test('collects the complete read-only Git inventory in one invocation', () => {
    const directory = makeDirectory();
    initializeRepository(directory);
    fs.mkdirSync(path.join(directory, '.codegraph'));
    fs.writeFileSync(path.join(directory, 'src', 'request.ts'), 'export const value = 2;\n');
    run(directory, ['add', 'src/request.ts']);
    fs.writeFileSync(path.join(directory, 'src', 'request.ts'), 'export const value = 3;\n');
    fs.writeFileSync(path.join(directory, 'src', 'untracked.ts'), 'export {};\n');

    const result = spawnSync(
      process.execPath,
      [scriptPath, '--workspace', path.join(directory, 'src')],
      { encoding: 'utf8' },
    );
    const context = JSON.parse(result.stdout) as ReviewContext;

    expect(result.status, result.stderr).toBe(0);
    expect(context.repositoryRoot).toBe(fs.realpathSync(directory));
    expect(context.head).toMatch(/^[a-f0-9]{40}$/u);
    expect(context.codegraphPresent).toBe(true);
    expect(context.status).toEqual(['MM src/request.ts', '?? src/untracked.ts']);
    expect(context.stagedPatch).toContain('export const value = 2;');
    expect(context.unstagedPatch).toContain('export const value = 3;');
    expect(context.unstagedStat).toContain('src/request.ts');
    expect(context.untrackedFiles).toEqual(['src/untracked.ts']);
    expect(context.diffCheck).toEqual({
      clean: true,
      staged: { clean: true, exitCode: 0, output: '' },
      unstaged: { clean: true, exitCode: 0, output: '' },
    });
  });

  test('fails clearly outside a Git repository', () => {
    const directory = makeDirectory();
    const result = spawnSync(process.execPath, [scriptPath, '--workspace', directory], {
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    expect(result.stdout).toBe('');
    expect(result.stderr).toContain('not a git repository');
  });

  test('rejects unsupported arguments', () => {
    const result = spawnSync(process.execPath, [scriptPath, '--unknown'], {
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Usage: node collect-review-context.mjs');
  });
});
