#!/usr/bin/env node

import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const runnerPath = fileURLToPath(import.meta.url);
const requiredOptions = [
  '--executable',
  '--expected-branch',
  '--expected-client-version',
  '--expected-head',
  '--expected-prompt-sha256',
  '--expected-runner-sha256',
  '--expected-skill-tree-sha256',
  '--expected-status-sha256',
  '--expected-workspace-tree-sha256',
  '--git-executable',
  '--home',
  '--prompt-file',
  '--stderr-output',
  '--trace-output',
  '--workspace',
];
export const candidate08ArgumentsBeforeWorkspace = [
  '--print',
  '--output-format',
  'stream-json',
  '--mode',
  'plan',
  '--sandbox',
  'enabled',
  '--trust',
  '--workspace',
];
export const candidate08ForbiddenFlags = [
  '--auto-review',
  '--force',
  '--yolo',
  '--approve-mcps',
];

function parseArguments(argv) {
  const normalized = argv[0] === '--' ? argv.slice(1) : argv;
  const options = {};
  for (let index = 0; index < normalized.length; index += 2) {
    const name = normalized[index];
    const value = normalized[index + 1];
    if (!name?.startsWith('--') || value === undefined) {
      throw new Error(`Expected --name value pairs; received ${name ?? '<end>'}.`);
    }
    if (Object.hasOwn(options, name)) {
      throw new Error(`Duplicate option: ${name}`);
    }
    options[name] = value;
  }
  for (const name of requiredOptions) {
    if (!options[name]) {
      throw new Error(`Missing required option: ${name}`);
    }
  }
  const unknown = Object.keys(options).filter((name) => !requiredOptions.includes(name));
  if (unknown.length > 0) {
    throw new Error(`Unknown option: ${unknown[0]}`);
  }
  return options;
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function requireSha256(value, name) {
  if (!/^[a-f0-9]{64}$/u.test(value)) {
    throw new Error(`${name} must be a lowercase SHA-256 value.`);
  }
  return value;
}

function requireAbsoluteFile(value, name, executable = false) {
  if (!path.isAbsolute(value)) {
    throw new Error(`${name} must be an absolute path.`);
  }
  const resolved = fs.realpathSync(path.resolve(value));
  if (!fs.statSync(resolved).isFile()) {
    throw new Error(`${name} must be a file.`);
  }
  if (executable) {
    fs.accessSync(resolved, fs.constants.X_OK);
  }
  return resolved;
}

function requireAbsoluteDirectory(value, name) {
  if (!path.isAbsolute(value)) {
    throw new Error(`${name} must be an absolute path.`);
  }
  const resolved = fs.realpathSync(path.resolve(value));
  if (!fs.statSync(resolved).isDirectory()) {
    throw new Error(`${name} must be a directory.`);
  }
  return resolved;
}

function isInside(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..');
}

function requireFreshOutput(value, name, workspace) {
  if (!path.isAbsolute(value)) {
    throw new Error(`${name} must be an absolute path.`);
  }
  const resolved = path.resolve(value);
  if (fs.existsSync(resolved)) {
    throw new Error(`${name} must not already exist.`);
  }
  const parent = fs.realpathSync(path.dirname(resolved));
  const output = path.join(parent, path.basename(resolved));
  if (isInside(workspace, output)) {
    throw new Error(`${name} must stay outside the reviewed workspace.`);
  }
  return output;
}

function listFiles(directory, relative = '') {
  const files = [];
  for (const entry of fs.readdirSync(path.join(directory, relative), { withFileTypes: true })) {
    const child = path.join(relative, entry.name);
    if (relative === '' && entry.name === '.git') {
      continue;
    }
    if (entry.isDirectory()) {
      files.push(...listFiles(directory, child));
    } else if (entry.isFile()) {
      files.push(child);
    } else {
      throw new Error(`Unsupported filesystem entry in frozen tree: ${child}`);
    }
  }
  return files.sort();
}

export function hashCursorEvaluationTreeV4(directory) {
  const files = listFiles(directory);
  const hash = crypto.createHash('sha256');
  for (const file of files) {
    hash.update(file.split(path.sep).join('/'));
    hash.update('\0');
    hash.update(fs.readFileSync(path.join(directory, file)));
    hash.update('\0');
  }
  return { fileCount: files.length, sha256: hash.digest('hex') };
}

function runChecked(command, args, cwd, label) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    shell: false,
    timeout: 60_000,
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`${label} failed: ${result.stderr || result.stdout}`.trimEnd());
  }
  return result.stdout;
}

function requireEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label} mismatch: expected ${expected}, received ${actual}.`);
  }
}

function clientContractWarning(stderr) {
  return stderr
    .replace(/\r\n?/gu, '\n')
    .split('\n')
    .find(
      (line) =>
        /(?:auto-review|allowlist|permission|capabilit|interactive\s+(?:approval|confirmation)|mode\s+(?:fallback|changed|drift))/iu.test(
          line,
        ) &&
        /(?:warn|unavailable|not\s+available|fallback|fell\s+back|falling\s+back|denied|do\s+not\s+have|requires?|lacks?|effective\s+mode|changed|drift)/iu.test(
          line,
        ),
    );
}

export function runCursorEvaluationV4(argv, environment = process.env) {
  const options = parseArguments(argv);
  const workspace = requireAbsoluteDirectory(options['--workspace'], '--workspace');
  const executable = requireAbsoluteFile(options['--executable'], '--executable', true);
  const gitExecutable = requireAbsoluteFile(
    options['--git-executable'],
    '--git-executable',
    true,
  );
  const home = requireAbsoluteDirectory(options['--home'], '--home');
  const promptFile = requireAbsoluteFile(options['--prompt-file'], '--prompt-file');
  if (isInside(workspace, home) || isInside(workspace, promptFile)) {
    throw new Error('Cursor HOME and Prompt must stay outside the reviewed workspace.');
  }
  const traceOutput = requireFreshOutput(options['--trace-output'], '--trace-output', workspace);
  const stderrOutput = requireFreshOutput(options['--stderr-output'], '--stderr-output', workspace);
  if (traceOutput === stderrOutput) {
    throw new Error('--trace-output and --stderr-output must be different files.');
  }

  const actualRunnerSha256 = sha256(fs.readFileSync(runnerPath));
  requireEqual(
    actualRunnerSha256,
    requireSha256(options['--expected-runner-sha256'], '--expected-runner-sha256'),
    'Runner SHA-256',
  );

  const expectedHead = options['--expected-head'];
  if (!/^[a-f0-9]{40,64}$/u.test(expectedHead)) {
    throw new Error('--expected-head must be a lowercase Git object ID.');
  }
  const head = runChecked(gitExecutable, ['rev-parse', 'HEAD'], workspace, 'Git HEAD').trimEnd();
  requireEqual(head, expectedHead, 'Git HEAD');
  const branch = runChecked(
    gitExecutable,
    ['branch', '--show-current'],
    workspace,
    'Git branch',
  ).trimEnd();
  requireEqual(branch, options['--expected-branch'], 'Git branch');
  const status = runChecked(
    gitExecutable,
    ['status', '--short', '--untracked-files=all'],
    workspace,
    'Git status',
  );
  const statusSha256 = sha256(status);
  requireEqual(
    statusSha256,
    requireSha256(options['--expected-status-sha256'], '--expected-status-sha256'),
    'Git status SHA-256',
  );
  const workspaceTree = hashCursorEvaluationTreeV4(workspace);
  requireEqual(
    workspaceTree.sha256,
    requireSha256(
      options['--expected-workspace-tree-sha256'],
      '--expected-workspace-tree-sha256',
    ),
    'Workspace tree SHA-256',
  );
  const skillDirectory = path.join(workspace, '.cursor', 'skills', 'fe-code-review');
  if (!fs.existsSync(path.join(skillDirectory, 'SKILL.md'))) {
    throw new Error('Frozen Cursor Skill must contain SKILL.md.');
  }
  const skillTree = hashCursorEvaluationTreeV4(skillDirectory);
  requireEqual(
    skillTree.sha256,
    requireSha256(options['--expected-skill-tree-sha256'], '--expected-skill-tree-sha256'),
    'Cursor Skill tree SHA-256',
  );
  const clientVersion = runChecked(
    executable,
    ['--version'],
    workspace,
    'Cursor version',
  ).trimEnd();
  requireEqual(clientVersion, options['--expected-client-version'], 'Cursor version');

  const prompt = fs.readFileSync(promptFile, 'utf8');
  if (prompt.length === 0) {
    throw new Error('--prompt-file must not be empty.');
  }
  const promptSha256 = sha256(prompt);
  requireEqual(
    promptSha256,
    requireSha256(options['--expected-prompt-sha256'], '--expected-prompt-sha256'),
    'Prompt SHA-256',
  );

  const clientArguments = [...candidate08ArgumentsBeforeWorkspace, workspace, prompt];
  if (candidate08ForbiddenFlags.some((flag) => clientArguments.includes(flag))) {
    throw new Error('Candidate 08 client arguments contain a forbidden permission flag.');
  }
  const result = spawnSync(executable, clientArguments, {
    cwd: workspace,
    encoding: 'utf8',
    env: {
      ...environment,
      AGENT_CLI_CREDENTIAL_STORE: 'file',
      HOME: home,
    },
    maxBuffer: 64 * 1024 * 1024,
    shell: false,
    timeout: 15 * 60 * 1000,
  });
  fs.writeFileSync(traceOutput, result.stdout ?? '', { flag: 'wx' });
  fs.writeFileSync(stderrOutput, result.stderr ?? '', { flag: 'wx' });
  if (result.error) {
    throw result.error;
  }
  const warning = clientContractWarning(result.stderr ?? '');
  if (warning) {
    throw new Error(`Cursor client-contract warning: ${warning}`);
  }

  return {
    clientArgumentsBeforePrompt: clientArguments.slice(0, -1),
    exitCode: result.status,
    preflight: {
      branch,
      clientVersion,
      gitExecutable,
      head,
      runnerSha256: actualRunnerSha256,
      skillTreeSha256: skillTree.sha256,
      statusSha256,
      workspace,
      workspaceTreeSha256: workspaceTree.sha256,
    },
    promptCharacters: prompt.length,
    promptSha256,
    signal: result.signal,
    stderrBytes: Buffer.byteLength(result.stderr ?? ''),
    stderrOutput,
    traceBytes: Buffer.byteLength(result.stdout ?? ''),
    traceOutput,
    timeoutSeconds: 15 * 60,
  };
}

function main() {
  try {
    const summary = runCursorEvaluationV4(process.argv.slice(2));
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
    process.exitCode = summary.exitCode ?? 1;
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main();
}
