#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixturesDir = path.join(rootDir, 'evaluation', 'fixtures');
const modeConfig = {
  quick: {
    caseName: 'url-regression',
    expectedTestResult: 'fail',
  },
  fix: {
    caseName: 'url-regression',
    expectedTestResult: 'pass',
  },
  deep: {
    caseName: 'deep-session-ownership',
    expectedTestResult: 'fail',
  },
};

function usage() {
  return 'Usage: node scripts/prepare-evaluation-fixture.mjs <quick|deep|fix> [--output <directory>]';
}

function parseArguments(argv) {
  const [mode, ...rest] = argv;

  if (!(mode in modeConfig)) {
    throw new Error(usage());
  }

  let outputDir;
  for (let index = 0; index < rest.length; index += 1) {
    if (rest[index] !== '--output' || !rest[index + 1] || index + 2 !== rest.length) {
      throw new Error(usage());
    }

    outputDir = path.resolve(rest[index + 1]);
    index += 1;
  }

  return { mode, outputDir };
}

function createTarget(mode, requestedOutput) {
  if (!requestedOutput) {
    return fs.mkdtempSync(path.join(os.tmpdir(), `fe-code-review-${mode}-`));
  }

  if (fs.existsSync(requestedOutput) && fs.readdirSync(requestedOutput).length > 0) {
    throw new Error(`Output directory must be empty: ${requestedOutput}`);
  }

  fs.mkdirSync(requestedOutput, { recursive: true });
  return requestedOutput;
}

function copyOverlay(sourceDir, targetDir) {
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      fs.mkdirSync(targetPath, { recursive: true });
      copyOverlay(sourcePath, targetPath);
      continue;
    }

    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(sourcePath, targetPath);
  }
}

function runGit(targetDir, args) {
  const result = spawnSync('git', args, {
    cwd: targetDir,
    encoding: 'utf8',
    env: { ...process.env, LANG: 'C', LC_ALL: 'C' },
  });

  if (result.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed:\n${result.stderr || result.stdout}`);
  }

  return result.stdout.replace(/\r?\n$/u, '');
}

function installSkill(targetDir) {
  const skillSource = path.join(rootDir, 'skills', 'fe-code-review');
  const codexTarget = path.join(targetDir, '.agents', 'skills', 'fe-code-review');
  const cursorTarget = path.join(targetDir, '.cursor', 'skills', 'fe-code-review');
  const cursorRuleTarget = path.join(targetDir, '.cursor', 'rules', 'fe-code-review.mdc');

  fs.mkdirSync(path.dirname(codexTarget), { recursive: true });
  fs.mkdirSync(path.dirname(cursorTarget), { recursive: true });
  fs.mkdirSync(path.dirname(cursorRuleTarget), { recursive: true });
  const copyOptions = {
    filter: (source) => path.basename(source) !== '.plugin-eval',
    recursive: true,
  };

  fs.cpSync(skillSource, codexTarget, copyOptions);
  fs.cpSync(skillSource, cursorTarget, copyOptions);
  fs.copyFileSync(
    path.join(rootDir, 'adapters', 'cursor', 'rules', 'fe-code-review.mdc'),
    cursorRuleTarget,
  );
}

function commitAll(targetDir, message) {
  runGit(targetDir, ['add', '--all']);
  runGit(targetDir, ['commit', '-m', message]);
}

function initializeRepository(targetDir, caseDir, mode) {
  copyOverlay(path.join(caseDir, 'baseline'), targetDir);
  installSkill(targetDir);

  if (mode === 'fix') {
    const findingsTarget = path.join(targetDir, '.evaluation', 'previous-findings.md');
    fs.mkdirSync(path.dirname(findingsTarget), { recursive: true });
    fs.copyFileSync(path.join(caseDir, 'previous-findings.md'), findingsTarget);
  }

  runGit(targetDir, ['init', '-b', 'main']);
  runGit(targetDir, ['config', 'user.name', 'FE Code Review Fixture']);
  runGit(targetDir, ['config', 'user.email', 'fixture@local.invalid']);
  commitAll(targetDir, 'test: establish evaluation baseline');
}

function prepareMode(targetDir, caseDir, mode) {
  if (mode === 'quick') {
    copyOverlay(path.join(caseDir, 'problem'), targetDir);
    return;
  }

  if (mode === 'fix') {
    copyOverlay(path.join(caseDir, 'problem'), targetDir);
    commitAll(targetDir, 'test: establish previous review problem');
    copyOverlay(path.join(caseDir, 'fixed'), targetDir);
    return;
  }

  runGit(targetDir, ['switch', '-c', 'candidate']);
  copyOverlay(path.join(caseDir, 'problem'), targetDir);
  commitAll(targetDir, 'test: introduce cross-module session ownership regression');
}

const { mode, outputDir } = parseArguments(process.argv.slice(2));
const config = modeConfig[mode];
const caseDir = path.join(fixturesDir, config.caseName);
const caseDefinition = JSON.parse(fs.readFileSync(path.join(caseDir, 'case.json'), 'utf8'));
const targetDir = createTarget(mode, outputDir);

initializeRepository(targetDir, caseDir, mode);
prepareMode(targetDir, caseDir, mode);

const status = runGit(targetDir, ['status', '--short']);
const branch = runGit(targetDir, ['branch', '--show-current']);
const modeOracle = caseDefinition.modes[mode];

process.stdout.write(
  `${JSON.stringify(
    {
      mode,
      caseName: config.caseName,
      targetDir,
      branch,
      status: status ? status.split('\n') : [],
      prompt: modeOracle.prompt,
      oracle: modeOracle,
      testCommand: 'node --test',
      expectedTestResult: config.expectedTestResult,
    },
    null,
    2,
  )}\n`,
);
