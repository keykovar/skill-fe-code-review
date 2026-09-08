import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';

import {
  candidate09ForbiddenFlags,
  hashCursorEvaluationTreeV5,
} from '../scripts/run-cursor-evaluation-v5.mjs';
import { rootDir } from './test-utils';

const temporaryDirectories: string[] = [];
const runnerPath = path.join(rootDir, 'scripts', 'run-cursor-evaluation-v5.mjs');

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
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fe-cursor-runner-v5-'));
  temporaryDirectories.push(root);
  const control = path.join(root, 'control');
  const home = path.join(root, 'home');
  const protectedRoot = path.join(root, 'protected');
  const workspace = path.join(root, 'workspace');
  const skillDirectory = path.join(workspace, '.cursor', 'skills', 'fe-code-review');
  fs.mkdirSync(control, { recursive: true });
  fs.mkdirSync(home);
  fs.mkdirSync(protectedRoot);
  fs.mkdirSync(skillDirectory, { recursive: true });
  fs.writeFileSync(path.join(skillDirectory, 'SKILL.md'), '# Frozen Candidate 09 Skill\n');
  fs.writeFileSync(path.join(workspace, 'source.ts'), 'export const value = 1;\n');
  git(workspace, ['init', '-b', 'candidate']);
  git(workspace, ['config', 'user.name', 'Fixture']);
  git(workspace, ['config', 'user.email', 'fixture@local.invalid']);
  git(workspace, ['add', '.']);
  git(workspace, ['commit', '-m', 'test: freeze workspace']);

  const capturePath = path.join(control, 'capture.json');
  const sandboxCapturePath = path.join(control, 'sandbox-capture.json');
  const executable = path.join(control, 'fake-cursor.mjs');
  fs.writeFileSync(
    executable,
    `#!${process.execPath}\nimport fs from 'node:fs';\nif (process.argv[2] === '--version') { process.stdout.write('fake-cursor-v5\\n'); process.exit(0); }\nfs.writeFileSync(process.env.FAKE_CAPTURE, JSON.stringify({ argv: process.argv.slice(2), credentialStore: process.env.AGENT_CLI_CREDENTIAL_STORE }));\nprocess.stdout.write(JSON.stringify({ type: 'assistant', text: process.argv.at(-1) }) + '\\n');\nif (process.env.FAKE_STDERR) process.stderr.write(process.env.FAKE_STDERR);\n`,
  );
  fs.chmodSync(executable, 0o755);
  const sandboxExecutable = path.join(control, 'fake-sandbox.mjs');
  fs.writeFileSync(
    sandboxExecutable,
    `#!${process.execPath}\nimport fs from 'node:fs';\nimport { spawnSync } from 'node:child_process';\nconst args = process.argv.slice(2);\nfs.writeFileSync(process.env.FAKE_SANDBOX_CAPTURE, JSON.stringify(args));\nconst result = spawnSync(args[6], args.slice(7), { env: process.env, stdio: 'inherit' });\nprocess.exit(result.status ?? 1);\n`,
  );
  fs.chmodSync(sandboxExecutable, 0o755);
  const seatbeltProfile = path.join(control, 'read-only.sb');
  fs.writeFileSync(
    seatbeltProfile,
    '(version 1)\n(allow default)\n(deny file-write* (subpath (param "WORKSPACE")))\n(deny file-write* (subpath (param "PROTECTED_ROOT")))\n',
  );

  const prompt = 'Use $fe-code-review. Keep this Prompt literal.';
  const promptPath = path.join(control, 'prompt.txt');
  fs.writeFileSync(promptPath, prompt);
  const workspaceTree = hashCursorEvaluationTreeV5(workspace);
  const skillTree = hashCursorEvaluationTreeV5(skillDirectory);
  const status = git(workspace, ['status', '--short', '--untracked-files=all']);
  const args = [
    runnerPath,
    '--executable', executable,
    '--expected-branch', 'candidate',
    '--expected-client-version', 'fake-cursor-v5',
    '--expected-head', git(workspace, ['rev-parse', 'HEAD']).trimEnd(),
    '--expected-prompt-sha256', sha256(prompt),
    '--expected-runner-sha256', sha256(fs.readFileSync(runnerPath)),
    '--expected-seatbelt-profile-sha256', sha256(fs.readFileSync(seatbeltProfile)),
    '--expected-skill-tree-sha256', skillTree.sha256,
    '--expected-status-sha256', sha256(status),
    '--expected-workspace-tree-sha256', workspaceTree.sha256,
    '--git-executable', resolveExecutable('git'),
    '--home', home,
    '--prompt-file', promptPath,
    '--protected-root', protectedRoot,
    '--sandbox-executable', sandboxExecutable,
    '--seatbelt-profile', seatbeltProfile,
    '--stderr-output', path.join(control, 'stderr.txt'),
    '--trace-output', path.join(control, 'trace.jsonl'),
    '--workspace', workspace,
  ];
  return {
    args,
    capturePath,
    prompt,
    sandboxCapturePath,
    sandboxExecutable,
    seatbeltProfile,
    protectedRoot,
    workspace,
  };
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { force: true, recursive: true });
  }
});

describe('Cursor evaluation runner v5 Candidate 09 contract', () => {
  test('wraps exact plan-mode arguments in the frozen Seatbelt profile', () => {
    const fixture = createFixture();
    const result = spawnSync(process.execPath, fixture.args, {
      encoding: 'utf8',
      env: {
        ...process.env,
        FAKE_CAPTURE: fixture.capturePath,
        FAKE_SANDBOX_CAPTURE: fixture.sandboxCapturePath,
      },
    });
    expect(result.status, result.stderr).toBe(0);
    const capture = JSON.parse(fs.readFileSync(fixture.capturePath, 'utf8'));
    expect(capture.argv).toEqual([
      '--print', '--output-format', 'stream-json', '--mode', 'plan', '--sandbox', 'enabled',
      '--trust', '--workspace', fs.realpathSync(fixture.workspace), fixture.prompt,
    ]);
    expect(candidate09ForbiddenFlags.every((flag) => !capture.argv.includes(flag))).toBe(true);
    expect(capture.credentialStore).toBe('file');
    expect(JSON.parse(fs.readFileSync(fixture.sandboxCapturePath, 'utf8'))).toEqual([
      '-D',
      `WORKSPACE=${fs.realpathSync(fixture.workspace)}`,
      '-D',
      `PROTECTED_ROOT=${fs.realpathSync(fixture.protectedRoot)}`,
      '-f',
      fs.realpathSync(fixture.seatbeltProfile),
      fs.realpathSync(path.join(path.dirname(fixture.capturePath), 'fake-cursor.mjs')),
      '--print',
      '--output-format',
      'stream-json',
      '--mode',
      'plan',
      '--sandbox',
      'enabled',
      '--trust',
      '--workspace',
      fs.realpathSync(fixture.workspace),
      fixture.prompt,
    ]);
  });

  test('rejects runner hash drift before starting Cursor', () => {
    const fixture = createFixture();
    const index = fixture.args.indexOf('--expected-runner-sha256');
    fixture.args[index + 1] = sha256('drift');
    const result = spawnSync(process.execPath, fixture.args, {
      encoding: 'utf8',
      env: {
        ...process.env,
        FAKE_CAPTURE: fixture.capturePath,
        FAKE_SANDBOX_CAPTURE: fixture.sandboxCapturePath,
      },
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Runner SHA-256 mismatch');
    expect(fs.existsSync(fixture.capturePath)).toBe(false);
  });

  test('rejects Seatbelt profile drift before starting Cursor', () => {
    const fixture = createFixture();
    const index = fixture.args.indexOf('--expected-seatbelt-profile-sha256');
    fixture.args[index + 1] = sha256('drift');
    const result = spawnSync(process.execPath, fixture.args, {
      encoding: 'utf8',
      env: {
        ...process.env,
        FAKE_CAPTURE: fixture.capturePath,
        FAKE_SANDBOX_CAPTURE: fixture.sandboxCapturePath,
      },
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Seatbelt profile SHA-256 mismatch');
    expect(fs.existsSync(fixture.capturePath)).toBe(false);
  });

  test('rejects permission or mode fallback warnings', () => {
    const fixture = createFixture();
    const result = spawnSync(process.execPath, fixture.args, {
      encoding: 'utf8',
      env: {
        ...process.env,
        FAKE_CAPTURE: fixture.capturePath,
        FAKE_SANDBOX_CAPTURE: fixture.sandboxCapturePath,
        FAKE_STDERR: 'Warning: plan mode requires permission; falling back to Allowlist.\n',
      },
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Cursor client-contract warning');
  });
});
