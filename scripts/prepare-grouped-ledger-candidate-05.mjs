#!/usr/bin/env node

import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { prepareCandidate04 } from './prepare-grouped-ledger-candidate-04.mjs';
import { hashCursorEvaluationTree } from './run-cursor-evaluation-v2.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function usage() {
  return 'Usage: node scripts/prepare-grouped-ledger-candidate-05.mjs --output <directory> --cursor-executable <absolute-file> --git-executable <absolute-file>';
}

function parseArguments(argv) {
  const normalized = argv[0] === '--' ? argv.slice(1) : argv;
  const required = ['--cursor-executable', '--git-executable', '--output'];
  const options = {};
  for (let index = 0; index < normalized.length; index += 2) {
    const name = normalized[index];
    const value = normalized[index + 1];
    if (!required.includes(name) || !value || Object.hasOwn(options, name)) {
      throw new Error(usage());
    }
    options[name] = value;
  }
  if (required.some((name) => !options[name])) {
    throw new Error(usage());
  }
  return options;
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function requireAbsoluteExecutable(value, label) {
  if (!path.isAbsolute(value)) {
    throw new Error(`${label} must be an absolute path.`);
  }
  const executable = fs.realpathSync(path.resolve(value));
  if (!fs.statSync(executable).isFile()) {
    throw new Error(`${label} must be a file.`);
  }
  fs.accessSync(executable, fs.constants.X_OK);
  return executable;
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

function preflightInput(runDefinition, runner, client, gitExecutable) {
  const status = runChecked(
    gitExecutable,
    ['status', '--short', '--untracked-files=all'],
    runDefinition.workspace,
    `${runDefinition.caseId} Git status`,
  );
  const head = runChecked(
    gitExecutable,
    ['rev-parse', 'HEAD'],
    runDefinition.workspace,
    `${runDefinition.caseId} Git HEAD`,
  ).trimEnd();
  const branch = runChecked(
    gitExecutable,
    ['branch', '--show-current'],
    runDefinition.workspace,
    `${runDefinition.caseId} Git branch`,
  ).trimEnd();
  const workspaceTree = hashCursorEvaluationTree(runDefinition.workspace);
  const skillTree = hashCursorEvaluationTree(
    path.join(runDefinition.workspace, '.cursor', 'skills', 'fe-code-review'),
  );

  if (
    head !== runDefinition.head ||
    branch !== runDefinition.branch ||
    workspaceTree.sha256 !== runDefinition.workspaceTreeSha256 ||
    skillTree.sha256 !== runDefinition.skillTreeSha256
  ) {
    throw new Error(`${runDefinition.caseId} frozen input changed during Candidate 05 preparation.`);
  }

  return {
    baseArguments: {
      executable: client.executable,
      expectedPromptSha256: runDefinition.promptSha256,
      promptFile: runDefinition.promptPath,
      workspace: runDefinition.workspace,
    },
    preflightArguments: {
      expectedBranch: branch,
      expectedClientVersion: client.version,
      expectedHead: head,
      expectedRunnerSha256: runner.sha256,
      expectedSkillTreeSha256: skillTree.sha256,
      expectedStatusSha256: sha256(status),
      expectedWorkspaceTreeSha256: workspaceTree.sha256,
      gitExecutable,
    },
  };
}

export function prepareCandidate05(requestedOutput, requestedCursorExecutable, requestedGitExecutable) {
  const outputDir = path.resolve(requestedOutput);
  const cursorExecutable = requireAbsoluteExecutable(
    requestedCursorExecutable,
    'Cursor executable',
  );
  const gitExecutable = requireAbsoluteExecutable(requestedGitExecutable, 'Git executable');
  const seed = prepareCandidate04(outputDir, cursorExecutable);
  const literalRunnerPath = path.join(rootDir, 'scripts', 'run-cursor-evaluation.mjs');
  const runnerPath = path.join(rootDir, 'scripts', 'run-cursor-evaluation-v2.mjs');
  const runner = {
    path: runnerPath,
    sha256: sha256(fs.readFileSync(runnerPath)),
    literalRunnerPath,
    literalRunnerSha256: sha256(fs.readFileSync(literalRunnerPath)),
  };
  const preparedRuns = seed.preparedRuns.map((runDefinition) => ({
    ...runDefinition,
    preflight: preflightInput(runDefinition, runner, seed.client, gitExecutable),
  }));

  const manifest = {
    schemaVersion: 1,
    candidate: 'post-v0.4.0-grouped-ledger-candidate-05',
    preparedDate: '2026-08-28',
    status: 'offline-freeze-complete-runtime-not-authorized',
    predecessor: {
      candidate: 'post-v0.4.0-grouped-ledger-candidate-04',
      decision: 'No-Go',
      reason: 'Evaluator preflight used zsh special variable path and replaced PATH before Cursor started.',
      retried: false,
      reinterpreted: false,
    },
    outputDir,
    artifacts: seed.artifacts,
    client: seed.client,
    runner,
    preflightContract: {
      implementation: 'single Node process with absolute Git and Cursor executables',
      shell: false,
      checks: [
        'runner SHA-256',
        'Prompt SHA-256',
        'Cursor version',
        'Git HEAD',
        'Git branch',
        'Git status SHA-256',
        'workspace tree SHA-256',
        'Cursor Skill tree SHA-256',
        'fresh output paths outside workspace',
      ],
      adHocShellPreflightAllowed: false,
      zshPathIndependent: true,
    },
    promptContract: seed.promptContract,
    generationBoundary: {
      source: 'Candidate 04 deterministic offline fixture preparer',
      freshOutputDirectory: true,
      runtimeResultsCarriedForward: false,
      sourceFreeResultCarriedForward: false,
      sourceBearingResultCarriedForward: false,
      runtimeCandidateDeltaComparedWithCandidate04: 'byte-identical',
    },
    fixedGitDate: seed.fixedGitDate,
    preparedRuns,
    repeatAssertions: seed.repeatAssertions,
    sourcePolicy: {
      externalModelRequests: 0,
      privateSourceAllowed: false,
      sourceBearingAuthorized: false,
      sourceFreeProbeAuthorized: false,
      sourceTransmitted: false,
      visibility: 'public-synthetic-only',
    },
  };

  fs.unlinkSync(seed.manifestPath);
  const manifestPath = seed.manifestPath;
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' });
  return { ...manifest, manifestPath, manifestSha256: sha256(fs.readFileSync(manifestPath)) };
}

function main() {
  try {
    const options = parseArguments(process.argv.slice(2));
    const result = prepareCandidate05(
      options['--output'],
      options['--cursor-executable'],
      options['--git-executable'],
    );
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main();
}
