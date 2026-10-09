import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';

import {
  codexCheckSha256, codexOfflineToolHashes, inspectCodexSourceFreeTrace,
  preflightCodexOfflineCheck, runCodexOfflineCheck, snapshotCodexCheckTree,
} from '../scripts/run-codex-offline-check.mjs';
import { rootDir } from './test-utils';

const temporaryDirectories: string[] = [];
const hashes = codexOfflineToolHashes();
const probePrompt = 'Return exactly CLIENT_ISOLATION_OK and nothing else. Do not use tools.';

function fixture(scenario = 'pass', phase = 'source-free', prompt = probePrompt) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'fe-codex-offline-test-')));
  temporaryDirectories.push(root);
  const dirs = Object.fromEntries(['workspace', 'home', 'codexHome', 'temp', 'output']
    .map((key) => { const value = path.join(root, key); fs.mkdirSync(value); return [key, value]; }));
  const promptFile = path.join(root, 'prompt.txt');
  fs.writeFileSync(promptFile, prompt);
  return {
    root, options: {
      kind: 'offline-test-double', phase, authorized: true,
      ...dirs, promptFile, expected: { ...hashes,
        workspace: snapshotCodexCheckTree(dirs.workspace).sha256, prompt: codexCheckSha256(prompt),
      }, scenario, timeoutMs: 3000,
    },
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
  for (const directory of temporaryDirectories.splice(0)) fs.rmSync(directory, { recursive: true, force: true });
});

describe('Codex offline process boundary (not live acceptance)', () => {
  test('passes the fake source-free contract with pinned flags and raw evidence', () => {
    const { options } = fixture();
    const result = runCodexOfflineCheck(options);
    expect(result).toMatchObject({ status: 'Pass', errors: [], childInvocations: 1,
      externalModelInvocations: 0, liveCapabilityVerified: false });
    const capture = JSON.parse(fs.readFileSync(path.join(options.output, 'capture.json'), 'utf8'));
    expect(capture.args).toEqual(['exec', '--strict-config', '--ignore-user-config', '--ignore-rules',
      '--ephemeral', '--sandbox', 'read-only', '--json', '--skip-git-repo-check',
      '--cd', options.workspace, '--output-last-message', path.join(options.output, 'final.md'), '-']);
    expect(Buffer.from(capture.promptBase64, 'base64').toString()).toBe(probePrompt);
    expect(result.before.sha256).toBe(result.after.sha256);
    expect(fs.readdirSync(options.output).sort()).toEqual([
      'attempt.json', 'capture.json', 'final.md', 'result.json', 'stderr.txt', 'trace.jsonl',
    ]);
    expect(JSON.parse(fs.readFileSync(path.join(options.output, 'result.json'), 'utf8'))).toEqual(result);
  });

  test('transmits shell metacharacters and Chinese literally through stdin', () => {
    const prompt = '使用 $fe-code-review\n`touch SHELL_SIDE_EFFECT` $(touch SHELL_SIDE_EFFECT) "quotes" \\ end\n';
    const { options } = fixture('pass', 'transport-check', prompt);
    expect(runCodexOfflineCheck(options).status).toBe('Pass');
    const capture = JSON.parse(fs.readFileSync(path.join(options.output, 'capture.json'), 'utf8'));
    expect(Buffer.from(capture.promptBase64, 'base64').equals(Buffer.from(prompt))).toBe(true);
    expect(fs.existsSync(path.join(options.workspace, 'SHELL_SIDE_EFFECT'))).toBe(false);
    expect(capture.args).not.toContain(prompt);
  });

  test('drops secret/config/proxy canaries for both the fake client and its child', () => {
    const canaries = ['OPENAI_API_KEY', 'CODEX_API_KEY', 'CURSOR_API_KEY', 'NODE_OPTIONS',
      'BASH_ENV', 'ZDOTDIR', 'HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY', 'GIT_CONFIG_COUNT',
      'AWS_SECRET_ACCESS_KEY', 'CODEX_HOME', 'HOME', '__CF_USER_TEXT_ENCODING'];
    for (const name of canaries) vi.stubEnv(name, `NONSECRET_CANARY_${name}`);
    const { options } = fixture('canary-child');
    const expectedKeys = Object.keys(preflightCodexOfflineCheck(options).env);
    expect(runCodexOfflineCheck(options).status).toBe('Pass');
    const capture = JSON.parse(fs.readFileSync(path.join(options.output, 'capture.json'), 'utf8'));
    expect(JSON.stringify(capture)).not.toContain('NONSECRET_CANARY_');
    for (const environment of [capture.env, capture.childEnvironment]) {
      expect(environment.HOME).toBe(options.home);
      expect(environment.CODEX_HOME).toBe(options.codexHome);
      expect(environment.GIT_CONFIG_NOSYSTEM).toBe('1');
      // CoreFoundation may add its own encoding metadata after exec on macOS.
      if (process.platform === 'darwin' && environment.__CF_USER_TEXT_ENCODING !== undefined) {
        expect(environment.__CF_USER_TEXT_ENCODING).toMatch(/^0x[0-9a-f]+:0x[0-9a-f]+:0x[0-9a-f]+$/iu);
      }
      const actualKeys = Object.keys(environment).filter((key) =>
        !(process.platform === 'darwin' && key === '__CF_USER_TEXT_ENCODING'));
      expect(actualKeys.sort()).toEqual([...expectedKeys].sort());
    }
  });

  test.each(['runner', 'fakeClient', 'node', 'workspace', 'prompt'])(
    'rejects %s hash drift before launching anything', (field) => {
      const { options } = fixture();
      options.expected[field] = '0'.repeat(64);
      expect(() => runCodexOfflineCheck(options)).toThrow('SHA-256 mismatch');
      expect(fs.readdirSync(options.output)).toEqual([]);
    },
  );

  test.each(['source-bearing', 'stage1', 'stage2'])('refuses unsupported phase %s', (phase) => {
    const { options } = fixture('pass', phase);
    expect(() => runCodexOfflineCheck(options)).toThrow('Source-bearing stages');
    expect(fs.readdirSync(options.output)).toEqual([]);
  });

  test('rejects live mode, absent authorization and arbitrary executable injection', () => {
    const { options } = fixture();
    expect(() => runCodexOfflineCheck({ ...options, kind: 'live' })).toThrow('live execution is disabled');
    expect(() => runCodexOfflineCheck({ ...options, authorized: false })).toThrow('explicitly authorized');
    expect(() => runCodexOfflineCheck({ ...options, executable: '/usr/bin/false' })).toThrow('Unknown offline option');
    expect(fs.readdirSync(options.output)).toEqual([]);
  });

  test.each(['home', 'codexHome', 'temp', 'output'])('requires fresh %s without inherited files', (key) => {
    const { options } = fixture();
    fs.writeFileSync(path.join(options[key], 'config.toml'), 'not a real configuration');
    expect(() => runCodexOfflineCheck(options)).toThrow('fresh and empty');
  });

  test('rejects overlapping paths, prompt leakage and symlink escapes', () => {
    const { root, options } = fixture();
    const nested = path.join(options.workspace, 'output');
    fs.mkdirSync(nested);
    expect(() => runCodexOfflineCheck({ ...options, output: nested })).toThrow('overlap');
    const localPrompt = path.join(options.workspace, 'prompt.txt');
    fs.writeFileSync(localPrompt, probePrompt);
    expect(() => runCodexOfflineCheck({ ...options, promptFile: localPrompt })).toThrow('Prompt must stay outside');
    const link = path.join(root, 'output-link');
    fs.symlinkSync(options.output, link);
    expect(() => runCodexOfflineCheck({ ...options, output: link })).toThrow('Symlink');
    fs.symlinkSync(options.promptFile, path.join(options.workspace, 'escape'));
    expect(() => snapshotCodexCheckTree(options.workspace)).toThrow('Unsupported frozen');
  });

  test.each(['AGENTS.md', '.codex', '.agents', '.cursor'])('rejects inherited %s', (name) => {
    const { root, options } = fixture();
    fs.writeFileSync(path.join(root, name), 'not a real instruction');
    expect(() => runCodexOfflineCheck(options)).toThrow('Inherited instruction');
  });

  test('rejects local client configuration and source-bearing probe contamination', () => {
    const { options } = fixture();
    fs.mkdirSync(path.join(options.workspace, '.codex'));
    expect(() => runCodexOfflineCheck(options)).toThrow('contains instructions');
    const another = fixture().options;
    fs.writeFileSync(path.join(another.workspace, 'source.ts'), 'const value = 1;');
    expect(() => runCodexOfflineCheck(another)).toThrow('Source-free workspace must be empty');
  });

  test('requires the exact source-free Prompt and bounded timeout', () => {
    const { options } = fixture('pass', 'source-free', 'OK');
    expect(() => runCodexOfflineCheck(options)).toThrow('frozen contract');
    for (const timeoutMs of [0, -1, 120001, Infinity, 0.5]) {
      expect(() => runCodexOfflineCheck({ ...options, timeoutMs })).toThrow('timeout');
    }
  });

  test.each([
    ['nonzero', 'process-failure'], ['stderr', 'unexpected-stderr'],
    ['malformed', 'malformed-jsonl'], ['incomplete', 'incomplete-trace'],
    ['duplicate-final', 'final-response-contract'], ['mismatch', 'final-file-mismatch'],
    ['missing-final', 'final-file-mismatch'], ['tool-call', 'forbidden-or-invalid-item'],
    ['unknown-event', 'unexpected-event'], ['failed-turn', 'incomplete-trace'],
    ['output-limit', 'process-failure'],
  ])('retains %s failure and prevents retry', (scenario, error) => {
    const { options } = fixture(scenario);
    const result = runCodexOfflineCheck(options);
    expect(result.status).toBe('Fail');
    expect(result.errors).toContain(error);
    expect(result.childInvocations).toBe(1);
    expect(fs.existsSync(path.join(options.output, 'trace.jsonl'))).toBe(true);
    expect(() => runCodexOfflineCheck(options)).toThrow('attempts cannot be reused');
  });

  test('kills a hung fake client within the deadline and records its failure', () => {
    const { options } = fixture('timeout');
    options.timeoutMs = 150;
    const result = runCodexOfflineCheck(options);
    expect(result.status).toBe('Fail');
    expect(result.processError).toBe('ETIMEDOUT');
    expect(result.signal).toBe('SIGKILL');
    expect(result.elapsedMs).toBeLessThan(3000);
  });

  test.each(['final-directory', 'final-symlink'])('records %s as a failure without following or repairing it', (scenario) => {
    const { options } = fixture(scenario);
    const result = runCodexOfflineCheck(options);
    expect(result.status).toBe('Fail');
    expect(result.errors).toContain('invalid-final-file');
    expect(result.finalSha256).toBeNull();
    expect(result.childInvocations).toBe(1);
    expect(fs.existsSync(path.join(options.output, 'trace.jsonl'))).toBe(true);
    expect(JSON.parse(fs.readFileSync(path.join(options.output, 'result.json'), 'utf8'))).toEqual(result);
    const finalStat = fs.lstatSync(path.join(options.output, 'final.md'));
    expect(scenario === 'final-directory' ? finalStat.isDirectory() : finalStat.isSymbolicLink()).toBe(true);
    expect(() => runCodexOfflineCheck(options)).toThrow('attempts cannot be reused');
  });

  test.each(['write', 'git-write', 'empty-directory-write'])('detects %s without repairing the workspace', (scenario) => {
    const { options } = fixture(scenario, 'transport-check');
    fs.mkdirSync(path.join(options.workspace, '.git'));
    fs.writeFileSync(path.join(options.workspace, '.git', 'HEAD'), 'mock bytes, not a Git repository');
    options.expected.workspace = snapshotCodexCheckTree(options.workspace).sha256;
    const result = runCodexOfflineCheck(options);
    expect(result.errors).toContain('workspace-mutated');
    expect(result.before.sha256).not.toBe(result.after.sha256);
  });

  test('direct CLI usage cannot launch Codex or a test-double run', () => {
    const result = spawnSync(process.execPath, [path.join(rootDir, 'scripts/run-codex-offline-check.mjs'), '--live'],
      { encoding: 'utf8', shell: false });
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('live Codex execution is disabled');
  });

  test('rejects events after completion and serialization beyond a terminal newline', () => {
    const { options } = fixture();
    runCodexOfflineCheck(options);
    const trace = fs.readFileSync(path.join(options.output, 'trace.jsonl'), 'utf8');
    expect(inspectCodexSourceFreeTrace(`${trace}{"type":"turn.started"}\n`, Buffer.from('CLIENT_ISOLATION_OK')))
      .toContain('unexpected-event');
    expect(inspectCodexSourceFreeTrace(trace, Buffer.from('CLIENT_ISOLATION_OK\n\n'))).toContain('final-file-mismatch');
  });
});
