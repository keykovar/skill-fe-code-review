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
    workflow: 'quick',
  },
  fix: {
    caseName: 'url-regression',
    expectedTestResult: 'pass',
    previousFindings: 'previous-findings.md',
    workflow: 'fix',
  },
  deep: {
    caseName: 'deep-session-ownership',
    expectedTestResult: 'fail',
    workflow: 'deep',
  },
  'deep-identity': {
    caseName: 'deep-session-ownership',
    expectedTestResult: 'fail',
    workflow: 'deep',
  },
  'quick-independent': {
    caseName: 'independent-findings',
    expectedTestResult: 'fail',
    workflow: 'quick',
  },
  'quick-identity': {
    caseName: 'url-regression',
    expectedTestResult: 'fail',
    workflow: 'quick',
  },
  'quick-keep': {
    caseName: 'no-clear-issue',
    expectedTestResult: 'pass',
    workflow: 'quick',
  },
  'fix-identity': {
    caseName: 'url-regression',
    expectedTestResult: 'pass',
    previousFindings: 'previous-findings.identity.md',
    workflow: 'fix',
  },
};

function usage() {
  return `Usage: node scripts/prepare-evaluation-fixture.mjs <${Object.keys(modeConfig).join('|')}> [--output <directory>] [--skill-source <directory>]`;
}

function parseArguments(argv) {
  const [mode, ...rest] = argv;

  if (!Object.hasOwn(modeConfig, mode)) {
    throw new Error(usage());
  }

  const options = {};
  for (let index = 0; index < rest.length; index += 1) {
    const name = rest[index];
    const value = rest[index + 1];
    if (!['--output', '--skill-source'].includes(name) || !value || Object.hasOwn(options, name)) {
      throw new Error(usage());
    }

    options[name] = path.resolve(value);
    index += 1;
  }

  return {
    mode,
    outputDir: options['--output'],
    skillSource: options['--skill-source'],
  };
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

function installSkill(targetDir, requestedSkillSource) {
  const skillSource = fs.realpathSync(
    requestedSkillSource ?? path.join(rootDir, 'skills', 'fe-code-review'),
  );
  if (!fs.statSync(skillSource).isDirectory() || !fs.existsSync(path.join(skillSource, 'SKILL.md'))) {
    throw new Error(`Skill source must contain SKILL.md: ${skillSource}`);
  }
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

function initializeRepository(targetDir, caseDir, previousFindings, skillSource) {
  copyOverlay(path.join(caseDir, 'baseline'), targetDir);
  installSkill(targetDir, skillSource);

  if (previousFindings) {
    const findingsTarget = path.join(targetDir, '.evaluation', 'previous-findings.md');
    fs.mkdirSync(path.dirname(findingsTarget), { recursive: true });
    fs.copyFileSync(path.join(caseDir, previousFindings), findingsTarget);
  }

  runGit(targetDir, ['init', '-b', 'main']);
  runGit(targetDir, ['config', 'user.name', 'FE Code Review Fixture']);
  runGit(targetDir, ['config', 'user.email', 'fixture@local.invalid']);
  commitAll(targetDir, 'test: establish evaluation baseline');
}

function prepareMode(targetDir, caseDir, workflow) {
  if (workflow === 'quick') {
    copyOverlay(path.join(caseDir, 'problem'), targetDir);
    return;
  }

  if (workflow === 'fix') {
    copyOverlay(path.join(caseDir, 'problem'), targetDir);
    commitAll(targetDir, 'test: establish previous review problem');
    copyOverlay(path.join(caseDir, 'fixed'), targetDir);
    return;
  }

  runGit(targetDir, ['switch', '-c', 'candidate']);
  copyOverlay(path.join(caseDir, 'problem'), targetDir);
  commitAll(targetDir, 'test: introduce cross-module session ownership regression');
}

const { mode, outputDir, skillSource } = parseArguments(process.argv.slice(2));
const config = modeConfig[mode];
const caseDir = path.join(fixturesDir, config.caseName);
const caseDefinition = JSON.parse(fs.readFileSync(path.join(caseDir, 'case.json'), 'utf8'));
const targetDir = createTarget(mode, outputDir);

initializeRepository(targetDir, caseDir, config.previousFindings, skillSource);
prepareMode(targetDir, caseDir, config.workflow);

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
      skillSource: fs.realpathSync(
        skillSource ?? path.join(rootDir, 'skills', 'fe-code-review'),
      ),
      oracle: modeOracle,
      testCommand: 'node --test',
      expectedTestResult: config.expectedTestResult,
    },
    null,
    2,
  )}\n`,
);
