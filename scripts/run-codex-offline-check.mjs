#!/usr/bin/env node

import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const runnerPath = fileURLToPath(import.meta.url);
const fakePath = fileURLToPath(new URL('../evaluation/tooling-fixtures/fake-codex.mjs', import.meta.url));
const allowedScenarios = new Set([
  'pass', 'timeout', 'nonzero', 'stderr', 'malformed', 'incomplete', 'duplicate-final',
  'mismatch', 'tool-call', 'unknown-event', 'write', 'git-write', 'empty-directory-write',
  'failed-turn', 'output-limit', 'missing-final', 'canary-child',
  'final-directory', 'final-symlink',
]);

export function codexCheckSha256(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function checkedPath(value, directory) {
  if (typeof value !== 'string' || !path.isAbsolute(value)) throw new Error('An absolute path is required.');
  const resolved = path.resolve(value);
  for (let current = resolved; ; current = path.dirname(current)) {
    if (fs.lstatSync(current).isSymbolicLink()) throw new Error('Symlink paths are forbidden.');
    if (current === path.dirname(current)) break;
  }
  const stat = fs.statSync(resolved);
  if (directory ? !stat.isDirectory() : !stat.isFile() || stat.nlink !== 1) {
    throw new Error('Expected an ordinary directory or single-link regular file.');
  }
  return resolved;
}

function inside(parent, child) {
  const relative = path.relative(parent, child);
  return relative === '' || (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}

export function snapshotCodexCheckTree(directory) {
  const root = checkedPath(directory, true);
  const entries = [];
  function walk(relative) {
    for (const name of fs.readdirSync(path.join(root, relative)).sort()) {
      const child = path.posix.join(relative, name);
      const filename = path.join(root, child);
      const stat = fs.lstatSync(filename);
      if (stat.isSymbolicLink() || (!stat.isDirectory() && (!stat.isFile() || stat.nlink !== 1))) {
        throw new Error('Unsupported frozen filesystem entry.');
      }
      entries.push({ path: child, mode: stat.mode & 0o777, type: stat.isDirectory() ? 'directory' : 'file',
        ...(stat.isFile() ? { sha256: codexCheckSha256(fs.readFileSync(filename)) } : {}) });
      if (stat.isDirectory()) walk(child);
    }
  }
  walk('');
  return { sha256: codexCheckSha256(JSON.stringify(entries)), entries };
}

export function codexOfflineToolHashes() {
  return Object.fromEntries([
    ['runner', runnerPath], ['fakeClient', fakePath], ['node', fs.realpathSync(process.execPath)],
  ].map(([name, filename]) => [name, codexCheckSha256(fs.readFileSync(filename))]));
}

function assertDigest(actual, expected, label) {
  if (!/^[a-f0-9]{64}$/u.test(expected ?? '') || actual !== expected) {
    throw new Error(`${label} SHA-256 mismatch.`);
  }
}

export function preflightCodexOfflineCheck(options) {
  const keys = ['kind', 'phase', 'authorized', 'workspace', 'home', 'codexHome', 'temp',
    'output', 'promptFile', 'expected', 'scenario', 'timeoutMs'];
  if (Object.keys(options).some((key) => !keys.includes(key))) throw new Error('Unknown offline option.');
  if (options.kind !== 'offline-test-double' || options.authorized !== true) {
    throw new Error('Only explicitly authorized offline test doubles are supported; live execution is disabled.');
  }
  if (!['source-free', 'transport-check'].includes(options.phase)) {
    throw new Error('Source-bearing stages are not implemented or authorized.');
  }
  if (!allowedScenarios.has(options.scenario)) throw new Error('Unknown fake-client scenario.');
  if (!Number.isInteger(options.timeoutMs) || options.timeoutMs < 1 || options.timeoutMs > 120000) {
    throw new Error('Offline timeout must be between 1 and 120000 ms.');
  }
  const dirs = Object.fromEntries(['workspace', 'home', 'codexHome', 'temp', 'output']
    .map((key) => [key, checkedPath(options[key], true)]));
  const paths = Object.values(dirs);
  for (let i = 0; i < paths.length; i += 1) {
    for (let j = i + 1; j < paths.length; j += 1) {
      if (inside(paths[i], paths[j]) || inside(paths[j], paths[i])) throw new Error('Isolation directories overlap.');
    }
  }
  for (const key of ['home', 'codexHome', 'temp', 'output']) {
    if (fs.readdirSync(dirs[key]).length !== 0) throw new Error(`${key} must be fresh and empty; attempts cannot be reused.`);
  }
  const promptFile = checkedPath(options.promptFile, false);
  if (paths.some((dir) => inside(dir, promptFile))) throw new Error('Prompt must stay outside isolation and output directories.');
  for (let parent = path.dirname(dirs.workspace); ; parent = path.dirname(parent)) {
    if (['AGENTS.md', '.codex', '.agents', '.cursor'].some((name) => fs.existsSync(path.join(parent, name)))) {
      throw new Error('Inherited instruction or configuration path detected.');
    }
    if (parent === path.dirname(parent)) break;
  }
  const before = snapshotCodexCheckTree(dirs.workspace);
  if (before.entries.some((entry) => entry.path.split('/').some((part) => ['AGENTS.md', '.codex', '.agents', '.cursor'].includes(part)))) {
    throw new Error('Offline workspace contains instructions or client configuration.');
  }
  if (options.phase === 'source-free' && before.entries.length !== 0) {
    throw new Error('Source-free workspace must be empty.');
  }
  const prompt = fs.readFileSync(promptFile);
  if (options.phase === 'source-free' && prompt.toString('utf8') !==
    'Return exactly CLIENT_ISOLATION_OK and nothing else. Do not use tools.') {
    throw new Error('Source-free Prompt does not match the frozen contract.');
  }
  const hashes = codexOfflineToolHashes();
  for (const [name, digest] of Object.entries(hashes)) assertDigest(digest, options.expected?.[name], name);
  assertDigest(before.sha256, options.expected?.workspace, 'workspace');
  assertDigest(codexCheckSha256(prompt), options.expected?.prompt, 'Prompt');
  const finalFile = path.join(dirs.output, 'final.md');
  const args = ['exec', '--strict-config', '--ignore-user-config', '--ignore-rules',
    '--ephemeral', '--sandbox', 'read-only', '--json', '--skip-git-repo-check',
    '--cd', dirs.workspace, '--output-last-message', finalFile, '-'];
  const env = {
    HOME: dirs.home, CODEX_HOME: dirs.codexHome, TMPDIR: dirs.temp,
    PATH: [path.dirname(fs.realpathSync(process.execPath)), '/usr/bin', '/bin'].join(path.delimiter),
    LANG: 'C', LC_ALL: 'C', GIT_CONFIG_NOSYSTEM: '1',
    GIT_CONFIG_GLOBAL: path.join(dirs.home, 'absent-git-config'), GIT_OPTIONAL_LOCKS: '0',
  };
  return { dirs, prompt, before, hashes, args, env, finalFile };
}

export function inspectCodexSourceFreeTrace(stdout, finalBytes) {
  let events;
  try {
    events = stdout.split(/\r?\n/u).filter((line) => line.length > 0).map((line) => JSON.parse(line));
  } catch {
    return ['malformed-jsonl'];
  }
  const errors = [];
  let thread = false;
  let started = false;
  let completed = false;
  const messages = [];
  const pending = new Set();
  const finished = new Set();
  for (const event of events) {
    if (!event || typeof event !== 'object' || completed) { errors.push('unexpected-event'); continue; }
    if (event.type === 'thread.started') {
      if (thread || started || typeof event.thread_id !== 'string') errors.push('thread-contract');
      thread = true;
    } else if (event.type === 'turn.started') {
      if (!thread || started) errors.push('turn-start-contract');
      started = true;
    } else if (['item.started', 'item.completed'].includes(event.type)) {
      const item = event.item;
      if (!started || !item || !['agent_message', 'reasoning'].includes(item.type) || typeof item.id !== 'string') {
        errors.push('forbidden-or-invalid-item'); continue;
      }
      if (finished.has(item.id)) errors.push('duplicate-item');
      if (event.type === 'item.started') {
        if (pending.has(item.id)) errors.push('duplicate-item-start');
        pending.add(item.id);
      } else {
        pending.delete(item.id);
        finished.add(item.id);
        if (item.type === 'agent_message') messages.push(item.text);
      }
    } else if (event.type === 'turn.completed') {
      if (!started || pending.size !== 0) errors.push('turn-completion-contract');
      completed = true;
    } else {
      errors.push('unexpected-event');
    }
  }
  if (!thread || !started || !completed) errors.push('incomplete-trace');
  if (messages.length !== 1 || messages[0] !== 'CLIENT_ISOLATION_OK') errors.push('final-response-contract');
  const expected = Buffer.from('CLIENT_ISOLATION_OK');
  if (!Buffer.isBuffer(finalBytes) || (!finalBytes.equals(expected) && !finalBytes.equals(Buffer.concat([expected, Buffer.from('\n')])))) {
    errors.push('final-file-mismatch');
  }
  return [...new Set(errors)];
}

export function runCodexOfflineCheck(options) {
  const prepared = preflightCodexOfflineCheck(options);
  const { dirs, prompt, before, hashes, args, env, finalFile } = prepared;
  // Reserving the evidence directory consumes this attempt even if the child fails.
  fs.writeFileSync(path.join(dirs.output, 'attempt.json'), JSON.stringify({
    kind: options.kind, phase: options.phase, hashes, expected: options.expected,
    liveExecution: false, scenario: options.scenario,
  }, null, 2), { flag: 'wx' });
  const startedAt = Date.now();
  const child = spawnSync(fs.realpathSync(process.execPath), [fakePath, options.scenario,
    path.join(dirs.output, 'capture.json'), ...args], {
    cwd: dirs.workspace, env, input: prompt, shell: false,
    timeout: options.timeoutMs, killSignal: 'SIGKILL', maxBuffer: 1024 * 1024,
  });
  const stdout = child.stdout ?? Buffer.alloc(0);
  const stderr = child.stderr ?? Buffer.alloc(0);
  fs.writeFileSync(path.join(dirs.output, 'trace.jsonl'), stdout, { flag: 'wx' });
  fs.writeFileSync(path.join(dirs.output, 'stderr.txt'), stderr, { flag: 'wx' });
  const errors = [];
  let finalBytes;
  try {
    if (fs.lstatSync(finalFile, { throwIfNoEntry: false })) {
      finalBytes = fs.readFileSync(checkedPath(finalFile, false));
    }
  } catch {
    errors.push('invalid-final-file');
  }
  errors.push(...inspectCodexSourceFreeTrace(stdout.toString('utf8'), finalBytes));
  if (child.error || child.status !== 0 || child.signal) errors.push('process-failure');
  if (stderr.length !== 0) errors.push('unexpected-stderr');
  let after;
  try {
    after = snapshotCodexCheckTree(dirs.workspace);
    if (before.sha256 !== after.sha256) errors.push('workspace-mutated');
  } catch {
    errors.push('invalid-workspace-after-run');
  }
  for (const key of ['home', 'codexHome']) {
    if (fs.readdirSync(dirs[key]).length !== 0) errors.push('unexpected-client-state');
  }
  const result = {
    kind: 'offline-test-double', status: errors.length === 0 ? 'Pass' : 'Fail', errors,
    exitCode: child.status, signal: child.signal, processError: child.error?.code ?? null,
    elapsedMs: Date.now() - startedAt, before, after: after ?? null,
    traceSha256: codexCheckSha256(stdout), stderrSha256: codexCheckSha256(stderr),
    finalSha256: finalBytes ? codexCheckSha256(finalBytes) : null,
    childInvocations: 1, externalModelInvocations: 0, liveCapabilityVerified: false,
  };
  fs.writeFileSync(path.join(dirs.output, 'result.json'), JSON.stringify(result, null, 2), { flag: 'wx' });
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  process.stderr.write('Offline test API only. Run the Vitest suite; live Codex execution is disabled.\n');
  process.exitCode = 2;
}
