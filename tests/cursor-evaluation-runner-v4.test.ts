import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';

import {
  candidate08ForbiddenFlags,
  hashCursorEvaluationTreeV4,
} from '../scripts/run-cursor-evaluation-v4.mjs';
import { rootDir } from './test-utils';

const temporaryDirectories: string[] = [];
const runnerPath = path.join(rootDir, 'scripts', 'run-cursor-evaluation-v4.mjs');

function sha256(value: string | Buffer) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function resolveExecutable(name: string) {
  for (const directory of (process.env.PATH ?? '').split(path.delimiter)) {
    const candidate = path.join(directory, name);
    if (fs.existsSync(candidate)) return fs.realpathSync(candidate);
  }
  throw new Error(`Could not resolve ${name}.`);
}

function git(workspace: string, args: string[]) {
  const result = spawnSync(resolveExecutable('git'), args, {
    cwd: workspace,
    encoding: 'utf8',
    shell: false,
  });
  expect(result.status, result.stderr).toBe(0);
  return result.stdout;
}

function createFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fe-cursor-runner-v4-'));
  temporaryDirectories.push(root);
  const control = path.join(root, 'control');
  const home = path.join(root, 'home');
  const workspace = path.join(root, 'workspace');
  const skillDirectory = path.join(workspace, '.cursor', 'skills', 'fe-code-review');
  fs.mkdirSync(control, { recursive: true });
  fs.mkdirSync(home);
  fs.mkdirSync(skillDirectory, { recursive: true });
  fs.writeFileSync(path.join(skillDirectory, 'SKILL.md'), '# Frozen Candidate 08 Skill\n');
  fs.writeFileSync(path.join(workspace, 'source.ts'), 'export const value = 1;\n');
  git(workspace, ['init', '-b', 'candidate']);
  git(workspace, ['config', 'user.name', 'Fixture']);
  git(workspace, ['config', 'user.email', 'fixture@local.invalid']);
  git(workspace, ['add', '.']);
  git(workspace, ['commit', '-m', 'test: freeze workspace']);

  const capturePath = path.join(control, 'capture.json');
  const executable = path.join(control, 'fake-cursor.mjs');
  fs.writeFileSync(
    executable,
    `#!${process.execPath}\nimport fs from 'node:fs';\nif (process.argv[2] === '--version') { process.stdout.write('fake-cursor-v4\\n'); process.exit(0); }\nfs.writeFileSync(process.env.FAKE_CAPTURE, JSON.stringify({ argv: process.argv.slice(2), credentialStore: process.env.AGENT_CLI_CREDENTIAL_STORE }));\nprocess.stdout.write(JSON.stringify({ type: 'assistant', text: process.argv.at(-1) }) + '\\n');\nif (process.env.FAKE_STDERR) process.stderr.write(process.env.FAKE_STDERR);\n`,
  );
  fs.chmodSync(executable, 0o755);

  const prompt = 'Use $fe-code-review. Keep this Prompt literal.';
  const promptPath = path.join(control, 'prompt.txt');
  fs.writeFileSync(promptPath, prompt);
  const workspaceTree = hashCursorEvaluationTreeV4(workspace);
  const skillTree = hashCursorEvaluationTreeV4(skillDirectory);
  const status = git(workspace, ['status', '--short', '--untracked-files=all']);
  const args = [
    runnerPath,
    '--executable', executable,
    '--expected-branch', 'candidate',
    '--expected-client-version', 'fake-cursor-v4',
    '--expected-head', git(workspace, ['rev-parse', 'HEAD']).trimEnd(),
    '--expected-prompt-sha256', sha256(prompt),
    '--expected-runner-sha256', sha256(fs.readFileSync(runnerPath)),
    '--expected-skill-tree-sha256', skillTree.sha256,
    '--expected-status-sha256', sha256(status),
    '--expected-workspace-tree-sha256', workspaceTree.sha256,
    '--git-executable', resolveExecutable('git'),
    '--home', home,
    '--prompt-file', promptPath,
    '--stderr-output', path.join(control, 'stderr.txt'),
    '--trace-output', path.join(control, 'trace.jsonl'),
    '--workspace', workspace,
  ];
  return { args, capturePath, prompt, workspace };
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { force: true, recursive: true });
  }
});

describe('Cursor evaluation runner v4 Candidate 08 contract', () => {
  test('uses exact plan-mode arguments with literal Prompt transport', () => {
    const fixture = createFixture();
    const result = spawnSync(process.execPath, fixture.args, {
      encoding: 'utf8',
      env: { ...process.env, FAKE_CAPTURE: fixture.capturePath },
    });
    expect(result.status, result.stderr).toBe(0);
    const capture = JSON.parse(fs.readFileSync(fixture.capturePath, 'utf8'));
    expect(capture.argv).toEqual([
      '--print', '--output-format', 'stream-json', '--mode', 'plan', '--sandbox', 'enabled',
      '--trust', '--workspace', fs.realpathSync(fixture.workspace), fixture.prompt,
    ]);
    expect(candidate08ForbiddenFlags.every((flag) => !capture.argv.includes(flag))).toBe(true);
    expect(capture.credentialStore).toBe('file');
  });

  test('rejects runner hash drift before starting Cursor', () => {
    const fixture = createFixture();
    const index = fixture.args.indexOf('--expected-runner-sha256');
    fixture.args[index + 1] = sha256('drift');
    const result = spawnSync(process.execPath, fixture.args, {
      encoding: 'utf8',
      env: { ...process.env, FAKE_CAPTURE: fixture.capturePath },
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Runner SHA-256 mismatch');
    expect(fs.existsSync(fixture.capturePath)).toBe(false);
  });

  test('rejects permission or mode fallback warnings', () => {
    const fixture = createFixture();
    const result = spawnSync(process.execPath, fixture.args, {
      encoding: 'utf8',
      env: {
        ...process.env,
        FAKE_CAPTURE: fixture.capturePath,
        FAKE_STDERR: 'Warning: plan mode requires permission; falling back to Allowlist.\n',
      },
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Cursor client-contract warning');
  });
});
