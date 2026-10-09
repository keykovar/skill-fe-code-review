#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function usage() {
  return 'Usage: node collect-review-context.mjs [--workspace <directory>]';
}

function parseArguments(argv) {
  if (argv.length === 0) {
    return process.cwd();
  }

  if (argv.length !== 2 || argv[0] !== '--workspace' || !argv[1]) {
    throw new Error(usage());
  }

  return argv[1];
}

function runGit(workspace, args, allowFailure = false) {
  const result = spawnSync('git', ['-C', workspace, ...args], {
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024,
  });

  if (result.error) {
    throw result.error;
  }

  if (!allowFailure && result.status !== 0) {
    throw new Error(result.stderr.trim() || `git ${args.join(' ')} failed`);
  }

  return {
    exitCode: result.status,
    stderr: result.stderr.trim(),
    stdout: result.stdout.trimEnd(),
  };
}

function lines(value) {
  return value ? value.split(/\r?\n/u) : [];
}

function collectContext(requestedWorkspace) {
  const workspace = fs.realpathSync(path.resolve(requestedWorkspace));
  const rootResult = runGit(workspace, ['rev-parse', '--show-toplevel']);
  const repositoryRoot = fs.realpathSync(rootResult.stdout);
  const head = runGit(repositoryRoot, ['rev-parse', 'HEAD']).stdout;
  const status = runGit(repositoryRoot, [
    'status',
    '--short',
    '--untracked-files=all',
  ]).stdout;
  const unstagedStat = runGit(repositoryRoot, ['diff', '--stat']).stdout;
  const unstagedPatch = runGit(repositoryRoot, ['diff', '--find-renames']).stdout;
  const stagedPatch = runGit(repositoryRoot, [
    'diff',
    '--cached',
    '--find-renames',
  ]).stdout;
  const untracked = runGit(repositoryRoot, [
    'ls-files',
    '--others',
    '--exclude-standard',
  ]).stdout;
  const unstagedDiffCheck = runGit(repositoryRoot, ['diff', '--check'], true);
  const stagedDiffCheck = runGit(
    repositoryRoot,
    ['diff', '--cached', '--check'],
    true,
  );

  const summarizeDiffCheck = (result) => ({
    clean: result.exitCode === 0,
    exitCode: result.exitCode,
    output: [result.stdout, result.stderr].filter(Boolean).join('\n'),
  });

  return {
    codegraphPresent: fs.existsSync(path.join(repositoryRoot, '.codegraph')),
    diffCheck: {
      clean: unstagedDiffCheck.exitCode === 0 && stagedDiffCheck.exitCode === 0,
      staged: summarizeDiffCheck(stagedDiffCheck),
      unstaged: summarizeDiffCheck(unstagedDiffCheck),
    },
    head,
    repositoryRoot,
    stagedPatch,
    status: lines(status),
    unstagedPatch,
    unstagedStat,
    untrackedFiles: lines(untracked),
  };
}

try {
  const workspace = parseArguments(process.argv.slice(2));
  process.stdout.write(`${JSON.stringify(collectContext(workspace), null, 2)}\n`);
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
