#!/usr/bin/env node

import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { runCursorEvaluation } from './run-cursor-evaluation.mjs';

const runnerPath = fileURLToPath(import.meta.url);
const baseOptions = [
  '--executable',
  '--expected-prompt-sha256',
  '--home',
  '--prompt-file',
  '--stderr-output',
  '--trace-output',
  '--workspace',
];
const preflightOptions = [
  '--expected-branch',
  '--expected-client-version',
  '--expected-head',
  '--expected-runner-sha256',
  '--expected-skill-tree-sha256',
  '--expected-status-sha256',
  '--expected-workspace-tree-sha256',
  '--git-executable',
];
const requiredOptions = [...baseOptions, ...preflightOptions];

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

function requireAbsoluteFile(value, name) {
  if (!path.isAbsolute(value)) {
    throw new Error(`${name} must be an absolute path.`);
  }
  const resolved = fs.realpathSync(path.resolve(value));
  if (!fs.statSync(resolved).isFile()) {
    throw new Error(`${name} must be a file.`);
  }
  fs.accessSync(resolved, fs.constants.X_OK);
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

export function hashCursorEvaluationTree(directory) {
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

export function preflightCursorEvaluation(argv) {
  const options = parseArguments(argv);
  const workspace = requireAbsoluteDirectory(options['--workspace'], '--workspace');
  const executable = requireAbsoluteFile(options['--executable'], '--executable');
  const gitExecutable = requireAbsoluteFile(options['--git-executable'], '--git-executable');

  const expectedRunnerSha256 = requireSha256(
    options['--expected-runner-sha256'],
    '--expected-runner-sha256',
  );
  const actualRunnerSha256 = sha256(fs.readFileSync(runnerPath));
  requireEqual(actualRunnerSha256, expectedRunnerSha256, 'Runner SHA-256');

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
  const expectedStatusSha256 = requireSha256(
    options['--expected-status-sha256'],
    '--expected-status-sha256',
  );
  const statusSha256 = sha256(status);
  requireEqual(statusSha256, expectedStatusSha256, 'Git status SHA-256');

  const expectedWorkspaceTreeSha256 = requireSha256(
    options['--expected-workspace-tree-sha256'],
    '--expected-workspace-tree-sha256',
  );
  const workspaceTree = hashCursorEvaluationTree(workspace);
  requireEqual(
    workspaceTree.sha256,
    expectedWorkspaceTreeSha256,
    'Workspace tree SHA-256',
  );

  const skillDirectory = path.join(workspace, '.cursor', 'skills', 'fe-code-review');
  if (!fs.existsSync(path.join(skillDirectory, 'SKILL.md'))) {
    throw new Error('Frozen Cursor Skill must contain SKILL.md.');
  }
  const expectedSkillTreeSha256 = requireSha256(
    options['--expected-skill-tree-sha256'],
    '--expected-skill-tree-sha256',
  );
  const skillTree = hashCursorEvaluationTree(skillDirectory);
  requireEqual(skillTree.sha256, expectedSkillTreeSha256, 'Cursor Skill tree SHA-256');

  const clientVersion = runChecked(
    executable,
    ['--version'],
    workspace,
    'Cursor version',
  ).trimEnd();
  requireEqual(clientVersion, options['--expected-client-version'], 'Cursor version');

  const baseArguments = baseOptions.flatMap((name) => [name, options[name]]);
  return {
    baseArguments,
    summary: {
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
  };
}

export function runCursorEvaluationV2(argv, environment = process.env) {
  const preflight = preflightCursorEvaluation(argv);
  return {
    ...runCursorEvaluation(preflight.baseArguments, environment),
    preflight: preflight.summary,
  };
}

function main() {
  try {
    const summary = runCursorEvaluationV2(process.argv.slice(2));
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
