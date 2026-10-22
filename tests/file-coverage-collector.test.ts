import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';

import { buildFileCoverageCollector, makeInventoryCollector } from '../evaluation/prototypes/build-file-coverage-collector.mjs';
import { rootDir } from './test-utils';

const directories: string[] = [];
const stablePath = path.join(rootDir, 'skills/fe-code-review/scripts/collect-review-context.mjs');
const original = fs.readFileSync(stablePath);

function temporary() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fe-inventory-candidate-'));
  directories.push(directory);
  return directory;
}

function git(directory: string, args: string[]) {
  const result = spawnSync('git', ['-C', directory, ...args], { encoding: 'utf8' });
  expect(result.status, result.stderr).toBe(0);
  return result.stdout;
}

function repository(directory: string) {
  fs.mkdirSync(directory);
  git(directory, ['init', '--quiet']);
  git(directory, ['config', 'user.name', 'Evaluation Fixture']);
  git(directory, ['config', 'user.email', 'fixture@example.invalid']);
  fs.mkdirSync(path.join(directory, 'src'));
  fs.writeFileSync(path.join(directory, 'src/a.ts'), 'export const a = 1;\n');
  git(directory, ['add', '.']);
  git(directory, ['-c', 'commit.gpgsign=false', '-c', 'core.hooksPath=/dev/null', 'commit', '--quiet', '-m', 'synthetic baseline']);
}

function candidate(directory: string) {
  return path.join(buildFileCoverageCollector(path.join(directory, 'candidate')).output, 'collect-review-context.mjs');
}

function run(script: string, args: string[], cwd: string, env?: NodeJS.ProcessEnv) {
  return spawnSync(process.execPath, [script, ...args], { cwd, env, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
}

function fakeGit(parent: string, status: Buffer, failure = false) {
  const bin = path.join(parent, 'bin');
  fs.mkdirSync(bin);
  const statusFile = path.join(parent, 'status.bin');
  const traceFile = path.join(parent, 'git-calls.jsonl');
  fs.writeFileSync(statusFile, status);
  fs.writeFileSync(path.join(bin, 'git'), `#!${process.execPath}
const fs = require('node:fs');
const args = process.argv.slice(2);
fs.appendFileSync(process.env.FE_INVENTORY_TRACE, JSON.stringify(args) + '\\n');
if (args.includes('--show-toplevel')) process.stdout.write(process.env.FE_INVENTORY_ROOT + '\\n');
else if (args.includes('rev-parse') && args.includes('HEAD')) process.stdout.write('a'.repeat(40) + '\\n');
else if (args.includes('status')) {
  if (process.env.FE_INVENTORY_FAIL === '1') { process.stderr.write('synthetic status failure'); process.exitCode = 17; }
  else process.stdout.write(fs.readFileSync(process.env.FE_INVENTORY_STATUS));
} else { process.stderr.write('unexpected Git command'); process.exitCode = 99; }
`, { mode: 0o700 });
  return {
    env: {
      ...process.env, PATH: bin + path.delimiter + (process.env.PATH ?? ''),
      FE_INVENTORY_ROOT: fs.realpathSync(parent), FE_INVENTORY_TRACE: traceFile,
      FE_INVENTORY_STATUS: statusFile, FE_INVENTORY_FAIL: failure ? '1' : '0',
    },
    trace: () => fs.readFileSync(traceFile, 'utf8').trim().split('\n').map(line => JSON.parse(line) as string[]),
  };
}

afterEach(() => {
  expect(fs.readFileSync(stablePath)).toEqual(original);
  for (const directory of directories.splice(0)) fs.rmSync(directory, { recursive: true, force: true });
});

describe('isolated inventory-only collector candidate', () => {
  test('builds a self-contained copy with reproducible hashes and no overwrite', () => {
    const directory = temporary();
    const built = buildFileCoverageCollector(path.join(directory, 'candidate'));
    expect(built.manifest.sources[0].sha256).toBe(createHash('sha256').update(original).digest('hex'));
    for (const file of built.manifest.files) {
      expect(createHash('sha256').update(fs.readFileSync(path.join(built.output, file.path))).digest('hex')).toBe(file.sha256);
    }
    expect(fs.readdirSync(built.output).sort()).toEqual(['collect-review-context.mjs', 'file-coverage.mjs', 'manifest.json']);
    expect(() => buildFileCoverageCollector(built.output)).toThrow();
    expect(() => buildFileCoverageCollector(path.join(rootDir, 'skills', 'blocked-output'))).toThrow('outside the formal Skill tree');
    expect(() => makeInventoryCollector(original.toString('utf8') + original.toString('utf8'))).toThrow('exactly once');
  });

  test('matches the original default output byte for byte for explicit and implicit workspace', () => {
    const directory = temporary();
    const workspace = path.join(directory, 'workspace');
    repository(workspace);
    fs.writeFileSync(path.join(workspace, 'src/a.ts'), 'export const a = 2;\n');
    git(workspace, ['add', 'src/a.ts']);
    fs.writeFileSync(path.join(workspace, 'src/a.ts'), 'export const a = 3; \n');
    fs.writeFileSync(path.join(workspace, 'src/new.ts'), 'export {};\n');
    const script = candidate(directory);
    for (const args of [[], ['--workspace', workspace]]) {
      const before = run(stablePath, args, path.join(workspace, 'src'));
      const after = run(script, args, path.join(workspace, 'src'));
      expect(before.status, before.stderr).toBe(0);
      expect(after.status, after.stderr).toBe(0);
      expect(after.stdout).toBe(before.stdout);
      expect(after.stderr).toBe(before.stderr);
    }
  });

  test('collects every layer and exact path without patches or index writes', () => {
    const directory = temporary();
    const workspace = path.join(directory, 'workspace');
    repository(workspace);
    git(workspace, ['config', 'status.showUntrackedFiles', 'no']);
    git(workspace, ['config', 'status.renames', 'false']);
    git(workspace, ['mv', 'src/a.ts', 'src/renamed.ts']);
    fs.appendFileSync(path.join(workspace, 'src/renamed.ts'), 'export const b = 2;\n');
    const odd = 'line\nwith\ttab \u4e2d\u6587.ts';
    fs.writeFileSync(path.join(workspace, 'src', odd), 'export {};\n');
    fs.mkdirSync(path.join(workspace, '.codegraph'));
    const indexBefore = fs.readFileSync(path.join(workspace, '.git/index'));
    const result = run(candidate(directory), ['--inventory-only', '--workspace', path.join(workspace, 'src')], directory);
    expect(result.status, result.stderr).toBe(0);
    const output = JSON.parse(result.stdout);
    expect(output).toMatchObject({
      kind: 'file-inventory', scope: 'all-uncommitted', patchesIncluded: false, codegraphPresent: true,
      repositoryRoot: fs.realpathSync(workspace), inventory: { complete: true, issues: [] },
    });
    expect(output.inventory.files).toEqual(expect.arrayContaining([
      { path: 'src/renamed.ts', oldPath: 'src/a.ts', status: 'RM', layers: ['staged', 'unstaged'] },
      { path: 'src/' + odd, status: '??', layers: ['untracked'] },
    ]));
    expect(output.inventory.files).toHaveLength(2);
    expect(output.inventory.scopeKey).toMatch(/^all-uncommitted:[a-f0-9]{64}$/u);
    expect(output.inventory.baseline).toBe(output.head);
    for (const forbidden of ['stagedPatch', 'unstagedPatch', 'diffCheck', 'Reviewed']) expect(result.stdout).not.toContain(forbidden);
    expect(fs.readFileSync(path.join(workspace, '.git/index'))).toEqual(indexBefore);
  });

  test('runs only root, HEAD and one explicit read-only status command', () => {
    const directory = temporary();
    const stub = fakeGit(directory, Buffer.from(' M src/a.ts\0'));
    const result = run(candidate(directory), ['--workspace', directory, '--inventory-only'], directory, stub.env);
    expect(result.status, result.stderr).toBe(0);
    const calls = stub.trace();
    expect(calls).toHaveLength(3);
    expect(calls[2].slice(2)).toEqual([
      '--no-optional-locks', '-c', 'core.fsmonitor=false', 'status', '--porcelain=v1', '-z', '--untracked-files=all', '--ignore-submodules=none', '--renames',
    ]);
    expect(calls.some(args => args.includes('diff') || args.includes('ls-files'))).toBe(false);
  });

  test('preserves whitespace at the end of the repository directory name', () => {
    const directory = temporary();
    const workspace = path.join(directory, 'workspace \n');
    repository(workspace);
    const result = run(candidate(directory), ['--inventory-only', '--workspace', workspace], directory);
    expect(result.status, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout).repositoryRoot).toBe(fs.realpathSync(workspace));
    expect(JSON.parse(result.stdout).inventory.complete).toBe(true);
  });

  test.each([
    ['truncated status', Buffer.from(' M complete.ts\0 M missing'), 'unterminated-status'],
    ['missing rename source', Buffer.from('R  renamed.ts\0'), 'missing-original-path'],
    ['invalid UTF-8', Buffer.from([0x3f, 0x3f, 0x20, 0xff, 0]), 'invalid-status-encoding'],
    ['unmerged change', Buffer.from('UU src/a.ts\0'), 'unmerged-status'],
  ])('returns explicit incomplete JSON and nonzero exit for %s', (_name, status, issue) => {
    const directory = temporary();
    const stub = fakeGit(directory, status);
    const result = run(candidate(directory), ['--inventory-only'], directory, stub.env);
    expect(result.status, result.stderr).toBe(2);
    expect(JSON.parse(result.stdout).inventory).toMatchObject({ complete: false, issues: [issue] });
  });

  test('fails without success JSON on Git failure', () => {
    const directory = temporary();
    const stub = fakeGit(directory, Buffer.alloc(0), true);
    const result = run(candidate(directory), ['--inventory-only'], directory, stub.env);
    expect(result.status).toBe(1);
    expect(result.stdout).toBe('');
    expect(result.stderr).toContain('synthetic status failure');
  });

  test('does not invoke a configured fsmonitor hook while enumerating', () => {
    const directory = temporary();
    const workspace = path.join(directory, 'workspace');
    repository(workspace);
    const marker = path.join(directory, 'hook-ran');
    const hook = path.join(directory, 'fsmonitor-hook');
    fs.writeFileSync(hook, `#!${process.execPath}\nrequire('node:fs').writeFileSync(${JSON.stringify(marker)}, 'called');\nprocess.stdout.write(Buffer.from('token\\0'));\n`, { mode: 0o700 });
    git(workspace, ['config', 'core.fsmonitor', hook]);
    git(workspace, ['status', '--porcelain=v1']);
    expect(fs.existsSync(marker)).toBe(true);
    fs.unlinkSync(marker);
    const indexBefore = fs.readFileSync(path.join(workspace, '.git/index'));
    const result = run(candidate(directory), ['--inventory-only'], workspace);
    expect(result.status, result.stderr).toBe(0);
    expect(fs.existsSync(marker)).toBe(false);
    expect(fs.readFileSync(path.join(workspace, '.git/index'))).toEqual(indexBefore);
  });

  test('rejects spawn output overflow without treating partial bytes as an inventory', () => {
    const directory = temporary();
    const script = candidate(directory);
    // Exercise the same spawn failure with a smaller test-only buffer budget.
    fs.writeFileSync(script, fs.readFileSync(script, 'utf8').replace('maxBuffer: 50 * 1024 * 1024', 'maxBuffer: 256'));
    const stub = fakeGit(directory, Buffer.from(' M src/a.ts\0'.repeat(100)));
    const result = run(script, ['--inventory-only'], directory, stub.env);
    expect(result.status).toBe(1);
    expect(result.stdout).toBe('');
    expect(result.stderr).toContain('ENOBUFS');
    expect(stub.trace().at(-1)).toContain('status');
  });

  test.each([['--staged'], ['--inventory-only', '--inventory-only'], ['--workspace'], ['--workspace', '.', '--workspace', '.']])(
    'rejects unsupported or duplicate arguments %j', (...args) => {
      const directory = temporary();
      const result = run(candidate(directory), args, directory);
      expect(result.status).toBe(1);
      expect(result.stdout).toBe('');
      expect(result.stderr).toContain('Usage:');
    },
  );

  test('does not invent a baseline outside a repository or before the first commit', () => {
    const directory = temporary();
    const script = candidate(directory);
    const workspace = path.join(directory, 'empty');
    fs.mkdirSync(workspace);
    for (const initialize of [false, true]) {
      if (initialize) git(workspace, ['init', '--quiet']);
      const result = run(script, ['--inventory-only', '--workspace', workspace], directory);
      expect(result.status).toBe(1);
      expect(result.stdout).toBe('');
    }
  });

  test('omits a large patch while preserving the complete known-file inventory', () => {
    const directory = temporary();
    const workspace = path.join(directory, 'workspace');
    repository(workspace);
    for (let file = 0; file < 24; file++) {
      fs.writeFileSync(path.join(workspace, 'src', `large-${file}.ts`), Array.from({ length: 200 }, (_, line) => `export const item${line} = "old-${file}-${line}";`).join('\n') + '\n');
    }
    git(workspace, ['add', '.']);
    git(workspace, ['-c', 'commit.gpgsign=false', '-c', 'core.hooksPath=/dev/null', 'commit', '--quiet', '-m', 'synthetic large baseline']);
    for (let file = 0; file < 24; file++) {
      const filename = path.join(workspace, 'src', `large-${file}.ts`);
      fs.writeFileSync(filename, fs.readFileSync(filename, 'utf8').replaceAll('old-', 'new-'));
    }
    const script = candidate(directory);
    const full = run(script, [], workspace);
    const compact = run(script, ['--inventory-only'], workspace);
    expect(full.status, full.stderr).toBe(0);
    expect(compact.status, compact.stderr).toBe(0);
    expect(JSON.parse(compact.stdout).inventory.files).toHaveLength(24);
    expect(JSON.parse(compact.stdout).inventory.complete).toBe(true);
    expect(JSON.parse(full.stdout).unstagedPatch).toContain('new-23-199');
    expect(compact.stdout).not.toContain('new-23-199');
    expect(Buffer.byteLength(compact.stdout)).toBeLessThan(Buffer.byteLength(full.stdout));
  });
});
