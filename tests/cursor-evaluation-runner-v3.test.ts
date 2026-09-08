import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';

import {
  candidate06ForbiddenFlags,
  hashCursorEvaluationTreeV3,
} from '../scripts/run-cursor-evaluation-v3.mjs';
import { rootDir } from './test-utils';

const temporaryDirectories: string[] = [];
const runnerPath = path.join(rootDir, 'scripts', 'run-cursor-evaluation-v3.mjs');

function sha256(value: string | Buffer) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function resolveExecutable(name: string) {
  for (const directory of (process.env.PATH ?? '').split(path.delimiter)) {
    const candidate = path.join(directory, name);
    if (fs.existsSync(candidate)) {
      return fs.realpathSync(candidate);
    }
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
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fe-cursor-runner-v3-'));
  temporaryDirectories.push(root);
  const control = path.join(root, 'control');
  const home = path.join(root, 'home');
  const workspace = path.join(root, 'workspace');
  const skillDirectory = path.join(workspace, '.cursor', 'skills', 'fe-code-review');
  fs.mkdirSync(control, { recursive: true });
  fs.mkdirSync(home);
  fs.mkdirSync(skillDirectory, { recursive: true });
  fs.writeFileSync(path.join(skillDirectory, 'SKILL.md'), '# Frozen Candidate 06 Skill\n');
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
    `#!${process.execPath}
import fs from 'node:fs';
if (process.argv[2] === '--version') {
  process.stdout.write('fake-cursor-v3\\n');
  process.exit(0);
}
fs.writeFileSync(process.env.FAKE_CAPTURE, JSON.stringify({
  argv: process.argv.slice(2),
  credentialStore: process.env.AGENT_CLI_CREDENTIAL_STORE,
  cwd: process.cwd(),
  home: process.env.HOME,
}));
process.stdout.write(JSON.stringify({ type: 'assistant', text: process.argv.at(-1) }) + '\\n');
if (process.env.FAKE_STDERR) process.stderr.write(process.env.FAKE_STDERR);
`,
  );
  fs.chmodSync(executable, 0o755);

  const marker = path.join(control, 'must-not-exist');
  const prompt = `Use $fe-code-review. Keep $(touch ${marker}) and "$PWD" literal.`;
  const promptPath = path.join(control, 'prompt.txt');
  fs.writeFileSync(promptPath, prompt);
  const workspaceTree = hashCursorEvaluationTreeV3(workspace);
  const skillTree = hashCursorEvaluationTreeV3(skillDirectory);
  const status = git(workspace, ['status', '--short', '--untracked-files=all']);
  const stderrPath = path.join(control, 'stderr.txt');
  const tracePath = path.join(control, 'trace.jsonl');
  const args = [
    runnerPath,
    '--executable',
    executable,
    '--expected-branch',
    'candidate',
    '--expected-client-version',
    'fake-cursor-v3',
    '--expected-head',
    git(workspace, ['rev-parse', 'HEAD']).trimEnd(),
    '--expected-prompt-sha256',
    sha256(prompt),
    '--expected-runner-sha256',
    sha256(fs.readFileSync(runnerPath)),
    '--expected-skill-tree-sha256',
    skillTree.sha256,
    '--expected-status-sha256',
    sha256(status),
    '--expected-workspace-tree-sha256',
    workspaceTree.sha256,
    '--git-executable',
    resolveExecutable('git'),
    '--home',
    home,
    '--prompt-file',
    promptPath,
    '--stderr-output',
    stderrPath,
    '--trace-output',
    tracePath,
    '--workspace',
    workspace,
  ];

  return {
    args,
    capturePath,
    marker,
    prompt,
    stderrPath,
    tracePath,
    workspace,
  };
}

function replaceArgument(args: string[], name: string, value: string) {
  const updated = [...args];
  const index = updated.indexOf(name);
  expect(index).toBeGreaterThan(0);
  updated[index + 1] = value;
  return updated;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { force: true, recursive: true });
  }
});

describe('Cursor evaluation runner v3 Candidate 06 contract', () => {
  test('uses exact ask-mode arguments and passes the Prompt as one literal argv', () => {
    const fixture = createFixture();
    const result = spawnSync(process.execPath, fixture.args, {
      encoding: 'utf8',
      env: { ...process.env, FAKE_CAPTURE: fixture.capturePath },
    });

    expect(result.status, result.stderr).toBe(0);
    expect(fs.existsSync(fixture.marker)).toBe(false);
    const capture = JSON.parse(fs.readFileSync(fixture.capturePath, 'utf8'));
    expect(capture.argv).toEqual([
      '--print',
      '--output-format',
      'stream-json',
      '--mode',
      'ask',
      '--sandbox',
      'enabled',
      '--trust',
      '--workspace',
      fs.realpathSync(fixture.workspace),
      fixture.prompt,
    ]);
    expect(candidate06ForbiddenFlags.every((flag) => !capture.argv.includes(flag))).toBe(true);
    expect(capture).toMatchObject({
      credentialStore: 'file',
      cwd: fs.realpathSync(fixture.workspace),
    });
  });

  test('rejects runner hash drift before starting the review client', () => {
    const fixture = createFixture();
    const result = spawnSync(
      process.execPath,
      replaceArgument(fixture.args, '--expected-runner-sha256', sha256('drift')),
      { encoding: 'utf8', env: { ...process.env, FAKE_CAPTURE: fixture.capturePath } },
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Runner SHA-256 mismatch');
    expect(fs.existsSync(fixture.capturePath)).toBe(false);
  });

  test('rejects Git status drift before starting the review client', () => {
    const fixture = createFixture();
    fs.writeFileSync(path.join(fixture.workspace, 'unexpected.txt'), 'drift\n');
    const result = spawnSync(process.execPath, fixture.args, {
      encoding: 'utf8',
      env: { ...process.env, FAKE_CAPTURE: fixture.capturePath },
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Git status SHA-256 mismatch');
    expect(fs.existsSync(fixture.capturePath)).toBe(false);
  });

  test.each([
    'Warning: Ask mode requires team permission; falling back to Allowlist.\n',
    'Warning: this model lacks the required ask-mode capability.\n',
    'Effective mode: Allowlist.\n',
  ])('classifies capability, permission, or mode stderr drift as a client-contract failure', (warning) => {
    const fixture = createFixture();
    const result = spawnSync(process.execPath, fixture.args, {
      encoding: 'utf8',
      env: {
        ...process.env,
        FAKE_CAPTURE: fixture.capturePath,
        FAKE_STDERR: warning,
      },
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Cursor client-contract warning');
    expect(fs.existsSync(fixture.capturePath)).toBe(true);
    expect(fs.readFileSync(fixture.stderrPath, 'utf8')).toBe(warning);
    expect(fs.existsSync(fixture.tracePath)).toBe(true);
  });
});
