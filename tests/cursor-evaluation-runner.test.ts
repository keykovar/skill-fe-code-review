import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterEach, describe, expect, test } from 'vitest';

import { rootDir } from './test-utils';

const temporaryDirectories: string[] = [];
const runnerPath = path.join(rootDir, 'scripts', 'run-cursor-evaluation.mjs');

function createFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fe-cursor-runner-'));
  temporaryDirectories.push(root);
  const control = path.join(root, 'control');
  const home = path.join(root, 'home');
  const workspace = path.join(root, 'workspace');
  fs.mkdirSync(control);
  fs.mkdirSync(home);
  fs.mkdirSync(workspace);

  const capturePath = path.join(control, 'capture.json');
  const executable = path.join(control, 'fake-cursor.mjs');
  fs.writeFileSync(
    executable,
    `#!/usr/bin/env node
import fs from 'node:fs';
fs.writeFileSync(process.env.FAKE_CAPTURE, JSON.stringify({
  argv: process.argv.slice(2),
  credentialStore: process.env.AGENT_CLI_CREDENTIAL_STORE,
  cwd: process.cwd(),
  home: process.env.HOME,
}));
process.stdout.write(JSON.stringify({ type: 'assistant', text: process.argv.at(-1) }) + '\\n');
process.stderr.write('fake stderr\\n');
`,
  );
  fs.chmodSync(executable, 0o755);

  return { capturePath, control, executable, home, root, workspace };
}

function sha256(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { force: true, recursive: true });
  }
});

describe('Cursor evaluation runner', () => {
  test('passes the frozen prompt as one literal argv value without shell expansion', () => {
    const fixture = createFixture();
    const marker = path.join(fixture.control, 'must-not-exist');
    const prompt = `Use $fe-code-review. Keep \`node --test\` literal.\nDo not expand $(touch ${marker}) or "$PWD".`;
    const promptPath = path.join(fixture.control, 'prompt.txt');
    const tracePath = path.join(fixture.control, 'trace.jsonl');
    const stderrPath = path.join(fixture.control, 'stderr.txt');
    fs.writeFileSync(promptPath, prompt);

    const result = spawnSync(
      process.execPath,
      [
        runnerPath,
        '--',
        '--executable',
        fixture.executable,
        '--expected-prompt-sha256',
        sha256(prompt),
        '--home',
        fixture.home,
        '--prompt-file',
        promptPath,
        '--stderr-output',
        stderrPath,
        '--trace-output',
        tracePath,
        '--workspace',
        fixture.workspace,
      ],
      {
        encoding: 'utf8',
        env: { ...process.env, FAKE_CAPTURE: fixture.capturePath },
      },
    );

    expect(result.status, result.stderr).toBe(0);
    expect(fs.existsSync(marker)).toBe(false);
    const capture = JSON.parse(fs.readFileSync(fixture.capturePath, 'utf8'));
    expect(capture).toMatchObject({
      credentialStore: 'file',
      cwd: fs.realpathSync(fixture.workspace),
      home: fs.realpathSync(fixture.home),
    });
    expect(capture.argv.slice(0, -1)).toEqual([
      '--print',
      '--output-format',
      'stream-json',
      '--auto-review',
      '--sandbox',
      'enabled',
      '--trust',
      '--workspace',
      fs.realpathSync(fixture.workspace),
    ]);
    expect(capture.argv.at(-1)).toBe(prompt);
    expect(fs.readFileSync(tracePath, 'utf8')).toContain(JSON.stringify(prompt));
    expect(fs.readFileSync(stderrPath, 'utf8')).toBe('fake stderr\n');
  });

  test('fails before client execution when the frozen prompt hash differs', () => {
    const fixture = createFixture();
    const promptPath = path.join(fixture.control, 'prompt.txt');
    fs.writeFileSync(promptPath, 'actual prompt');

    const result = spawnSync(
      process.execPath,
      [
        runnerPath,
        '--executable',
        fixture.executable,
        '--expected-prompt-sha256',
        sha256('different prompt'),
        '--home',
        fixture.home,
        '--prompt-file',
        promptPath,
        '--stderr-output',
        path.join(fixture.control, 'stderr.txt'),
        '--trace-output',
        path.join(fixture.control, 'trace.jsonl'),
        '--workspace',
        fixture.workspace,
      ],
      {
        encoding: 'utf8',
        env: { ...process.env, FAKE_CAPTURE: fixture.capturePath },
      },
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Prompt SHA-256 mismatch');
    expect(fs.existsSync(fixture.capturePath)).toBe(false);
  });

  test('rejects evaluator artifacts inside the reviewed workspace', () => {
    const fixture = createFixture();
    const promptPath = path.join(fixture.control, 'prompt.txt');
    fs.writeFileSync(promptPath, 'safe prompt');

    const result = spawnSync(
      process.execPath,
      [
        runnerPath,
        '--executable',
        fixture.executable,
        '--expected-prompt-sha256',
        sha256('safe prompt'),
        '--home',
        fixture.home,
        '--prompt-file',
        promptPath,
        '--stderr-output',
        path.join(fixture.control, 'stderr.txt'),
        '--trace-output',
        path.join(fixture.workspace, 'trace.jsonl'),
        '--workspace',
        fixture.workspace,
      ],
      { encoding: 'utf8' },
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('--trace-output must stay outside the reviewed workspace');
    expect(fs.existsSync(fixture.capturePath)).toBe(false);
  });
});
