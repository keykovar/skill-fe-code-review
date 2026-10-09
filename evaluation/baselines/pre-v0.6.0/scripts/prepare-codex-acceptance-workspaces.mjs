#!/usr/bin/env node

import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { snapshotCodexCheckTree } from './run-codex-offline-check.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planFile = path.join(rootDir, 'evaluation/runtime-windows/v0.5.0-codex-runtime-acceptance-plan.json');
const reporterFile = path.join(rootDir, 'scripts/codex-fixture-test-reporter.mjs');
const fixedGitDate = '2026-09-09T00:00:00Z';
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const writeJson = (filename, value) => fs.writeFileSync(filename, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' });

export function runPreparationCommand(executable, args, cwd, env, expectedExit = 0, evidenceBase = null) {
  const processResult = spawnSync(executable, args, {
    cwd, env, encoding: 'utf8', shell: false, timeout: 60000, maxBuffer: 16 * 1024 * 1024,
  });
  const result = { executable, args, cwd, stdout: processResult.stdout ?? '', stderr: processResult.stderr ?? '',
    status: processResult.status, signal: processResult.signal,
    error: processResult.error ? { name: processResult.error.name, message: processResult.error.message,
      code: processResult.error.code ?? null } : null };
  if (evidenceBase) {
    try {
      fs.writeFileSync(`${evidenceBase}.stdout.txt`, result.stdout, { flag: 'wx' });
      fs.writeFileSync(`${evidenceBase}.stderr.txt`, result.stderr, { flag: 'wx' });
      const { stdout, stderr, ...metadata } = result;
      writeJson(`${evidenceBase}.result.json`, { ...metadata,
        stdoutSha256: sha256(stdout), stderrSha256: sha256(stderr) });
    } catch (error) {
      throw Object.assign(error, { commandResult: result });
    }
  }
  if (result.error || result.signal || (expectedExit !== null && result.status !== expectedExit)) {
    throw Object.assign(new Error(`Local command failed: ${args[0]}\n${result.stderr || result.error?.message || ''}`),
      { commandResult: result });
  }
  return result;
}

function regularFiles(directory) {
  return snapshotCodexCheckTree(directory).entries.filter((entry) => entry.type === 'file')
    .map((entry) => entry.path).sort();
}

function contentTree(directory, files) {
  const hash = crypto.createHash('sha256');
  for (const filename of [...files].sort()) {
    hash.update(filename).update('\0').update(fs.readFileSync(path.join(directory, filename))).update('\0');
  }
  return { fileCount: files.length, sha256: hash.digest('hex') };
}

const urlTest = ['normalizes the base and path separator'];
const fixtureTestContracts = {
  'quick-independent': { file: 'tests/contracts.test.mjs', failed: 2,
    names: ['keeps profile cache entries isolated by account', 'preserves the timeout selected by the caller'] },
  'deep-identity': { file: 'tests/session.test.mjs', failed: 1, names: ['clears authorization after logout'] },
  'quick-identity': { file: 'tests/url.test.mjs', failed: 1, names: urlTest },
  'fix-identity': { file: 'tests/url.test.mjs', failed: 0, names: urlTest },
  'quick-keep': { file: 'tests/label.test.mjs', failed: 0,
    names: ['prefers and trims the display name', 'falls back to the username', 'uses the anonymous label when both names are absent'] },
};

function validateFixtureTestResult(result, definition, workspace) {
  const contract = fixtureTestContracts[definition.fixtureMode];
  const fail = () => { throw new Error(`${definition.fixtureMode}: unexpected deterministic test result.`); };
  if (!contract || result.status !== definition.expectedTestExitCode ||
    result.status !== (contract.failed ? 1 : 0)) fail();
  let events;
  try { events = result.stdout.trim().split('\n').map((line) => JSON.parse(line)); } catch { fail(); }
  if (events.some((event) => !event || typeof event.type !== 'string' || !event.data)) fail();
  const completed = events.filter((event) => ['test:pass', 'test:fail'].includes(event.type));
  const summaries = events.filter((event) => event.type === 'test:summary' && !event.data.file);
  if (completed.length !== contract.names.length || summaries.length !== 1 || events.at(-1) !== summaries[0]) fail();
  for (const [index, event] of completed.entries()) {
    const { data, type } = event;
    if (data.name !== contract.names[index] || data.file !== path.join(workspace, contract.file) ||
      data.nesting !== 0 || data.details?.type !== 'test' || data.skip || data.todo ||
      type !== (contract.failed ? 'test:fail' : 'test:pass')) fail();
    if (type === 'test:fail' && (data.details.error?.failureType !== 'testCodeFailure' ||
      data.details.error?.cause?.code !== 'ERR_ASSERTION')) fail();
  }
  const expectedCounts = { tests: contract.names.length, failed: contract.failed,
    passed: contract.names.length - contract.failed, cancelled: 0, skipped: 0, todo: 0, topLevel: contract.names.length, suites: 0 };
  const summary = summaries[0].data;
  if (summary.success !== (contract.failed === 0) ||
    Object.entries(expectedCounts).some(([key, value]) => summary.counts?.[key] !== value)) fail();
  return expectedCounts;
}

export function verifyCodexFixtureTests({ node, workspace, evidence, env, definition, beforeGit, gitState }) {
  const before = snapshotCodexCheckTree(workspace);
  writeJson(path.join(evidence, 'before.json'), { git: beforeGit, tree: before });
  let test;
  let commandError;
  const after = { git: null, tree: null };
  const errors = {};
  try {
    test = runPreparationCommand(node, ['--test', `--test-reporter=${reporterFile}`], workspace, env, null,
      path.join(evidence, 'tests'));
  } catch (error) {
    commandError = error;
  } finally {
    // Capture each surface independently, including when test execution could not complete.
    for (const [key, capture] of [['git', gitState], ['tree', () => snapshotCodexCheckTree(workspace)]]) {
      try { after[key] = capture(); } catch (error) {
        errors[key] = { message: error.message, commandResult: error.commandResult ?? null };
      }
    }
    writeJson(path.join(evidence, 'after.json'), { ...after, ...(Object.keys(errors).length ? { errors } : {}) });
  }
  if (commandError) throw commandError;
  if (Object.keys(errors).length) throw new Error('After-test snapshot incomplete; see after.json.');
  const testSummary = validateFixtureTestResult(test, definition, workspace);
  if (before.sha256 !== after.tree.sha256 || JSON.stringify(beforeGit) !== JSON.stringify(after.git)) {
    throw new Error('Deterministic test changed the workspace.');
  }
  return { test, testSummary, before };
}

export function prepareCodexAcceptanceWorkspaces({ authorized, gitExecutable }) {
  if (authorized !== true) throw new Error('Explicit authorization for seven workspaces and synthetic Git commits is required.');
  if (!path.isAbsolute(gitExecutable)) throw new Error('Git executable must be absolute.');
  const git = fs.realpathSync(gitExecutable);
  fs.accessSync(git, fs.constants.X_OK);
  const node = fs.realpathSync(process.execPath);
  const planBytes = fs.readFileSync(planFile);
  const plan = JSON.parse(planBytes);
  for (const [filename, expected] of Object.entries({ ...plan.baseline.toolingHashes, ...plan.baseline.oracleHashes })) {
    if (sha256(fs.readFileSync(path.join(rootDir, filename))) !== expected) throw new Error(`Frozen input changed: ${filename}`);
  }
  const skillSource = path.join(rootDir, plan.baseline.skillPath);
  const skillFiles = regularFiles(skillSource).filter((filename) => !filename.split('/').includes('.plugin-eval'));
  const skillTree = contentTree(skillSource, skillFiles);
  if (skillTree.sha256 !== plan.baseline.skillTreeSha256 || skillTree.fileCount !== plan.baseline.skillFileCount) {
    throw new Error('Released Skill tree mismatch.');
  }
  if (plan.runs.length !== 7) throw new Error('Expected the frozen seven-run matrix.');

  const outputRoot = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'fe-review-v050-codex-workspaces-')));
  const control = path.join(outputRoot, 'control');
  const workspaces = path.join(outputRoot, 'workspaces');
  const home = path.join(outputRoot, 'preparation-home');
  const temp = path.join(outputRoot, 'temp');
  const empty = path.join(control, 'empty-git-template-and-hooks');
  for (const directory of [control, workspaces, home, temp, empty]) fs.mkdirSync(directory);
  const env = {
    HOME: home, TMPDIR: temp, LANG: 'C', LC_ALL: 'C', TZ: 'UTC',
    PATH: [path.dirname(git), path.dirname(node), '/usr/bin', '/bin'].join(path.delimiter),
    GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: path.join(control, 'absent-git-config'),
    GIT_OPTIONAL_LOCKS: '0', GIT_TERMINAL_PROMPT: '0',
    GIT_AUTHOR_DATE: fixedGitDate, GIT_COMMITTER_DATE: fixedGitDate,
    GIT_CONFIG_COUNT: '4', GIT_CONFIG_KEY_0: 'core.hooksPath', GIT_CONFIG_VALUE_0: empty,
    GIT_CONFIG_KEY_1: 'commit.gpgSign', GIT_CONFIG_VALUE_1: 'false',
    GIT_CONFIG_KEY_2: 'init.templateDir', GIT_CONFIG_VALUE_2: empty,
    GIT_CONFIG_KEY_3: 'core.autocrlf', GIT_CONFIG_VALUE_3: 'false',
  };
  const gitValue = (workspace, args) => runPreparationCommand(git, args, workspace, env).stdout.trimEnd();
  const manifest = {
    schemaVersion: 1, window: plan.window, preparedDate: '2026-09-09',
    status: 'preparing-offline-workspaces', outputRoot,
    authorization: { workspacePreparation: true, syntheticGitCommits: true, sourceFreeProbe: false, sourceBearing: false },
    sourcePolicy: { visibility: 'public-synthetic-only', externalModelInvocations: 0,
      sourceTransmitted: false, privateSourceTransmitted: false, credentialContentsReadOrRecorded: false },
    planSha256: sha256(planBytes), skillTree, fixedGitDate,
    preparation: { nodeVersion: process.version, nodeSha256: sha256(fs.readFileSync(node)),
      gitVersion: null, gitSha256: sha256(fs.readFileSync(git)),
      scriptSha256: sha256(fs.readFileSync(fileURLToPath(import.meta.url))),
      snapshotHelperSha256: sha256(fs.readFileSync(path.join(rootDir, 'scripts/run-codex-offline-check.mjs'))),
      testReporterSha256: sha256(fs.readFileSync(reporterFile)),
      cleanEnvironment: true, personalGitConfigLoaded: false, hooksEnabled: false, signingEnabled: false,
      modelContextCollectorsExecuted: 0 },
    runs: [], repeatAssertions: [], syntheticCommitCount: 0,
    clientStatus: 'Cannot Verify', runtimeFreezeComplete: false,
  };
  writeJson(path.join(control, 'authorization-and-inputs.json'), manifest);

  try {
    manifest.preparation.gitVersion = gitValue(control, ['--version']);
    for (const definition of plan.runs) {
      const slug = `${definition.caseId}-${definition.runId}`.toLowerCase();
      const workspace = path.join(workspaces, slug);
      const evidence = path.join(control, slug);
      fs.mkdirSync(evidence);
      const preparation = runPreparationCommand(node, [path.join(rootDir, 'scripts/prepare-evaluation-fixture.mjs'),
        definition.fixtureMode, '--output', workspace, '--skill-source', skillSource], rootDir, env, 0,
      path.join(evidence, 'preparation'));
      fs.writeFileSync(path.join(evidence, 'preparation.stdout.json'), preparation.stdout, { flag: 'wx' });
      JSON.parse(preparation.stdout);
      const oracle = JSON.parse(fs.readFileSync(path.join(rootDir, definition.oracle), 'utf8')).modes[definition.fixtureMode];
      const caseDir = path.join(rootDir, path.dirname(definition.oracle));
      const allowed = new Set([...regularFiles(path.join(caseDir, 'baseline')), ...regularFiles(path.join(caseDir, 'problem'))]);
      if (definition.mode === 'fix') regularFiles(path.join(caseDir, 'fixed')).forEach((filename) => allowed.add(filename));
      for (const client of ['.agents', '.cursor']) for (const filename of skillFiles) allowed.add(`${client}/skills/fe-code-review/${filename}`);
      allowed.add('.cursor/rules/fe-code-review.mdc');
      if (definition.mode === 'fix') allowed.add('.evaluation/previous-findings.md');
      const sourceFiles = regularFiles(workspace).filter((filename) => !filename.startsWith('.git/'));
      if (JSON.stringify(sourceFiles) !== JSON.stringify([...allowed].sort())) throw new Error(`${slug}: file allowlist mismatch.`);
      for (const client of ['.agents', '.cursor']) {
        const copy = path.join(workspace, client, 'skills/fe-code-review');
        if (contentTree(copy, regularFiles(copy)).sha256 !== skillTree.sha256) throw new Error(`${slug}: Skill copy mismatch.`);
      }
      if (definition.mode === 'fix' && sha256(fs.readFileSync(path.join(workspace, '.evaluation/previous-findings.md'))) !==
        plan.baseline.oracleHashes['evaluation/fixtures/url-regression/previous-findings.identity.md']) throw new Error('Previous findings mismatch.');
      const prompt = `${oracle.prompt}\n\n${plan.promptPolicy.commonSuffix}`;
      fs.writeFileSync(path.join(evidence, 'prompt.txt'), prompt, { flag: 'wx' });
      const gitState = () => ({
        head: gitValue(workspace, ['rev-parse', 'HEAD']), branch: gitValue(workspace, ['branch', '--show-current']),
        status: gitValue(workspace, ['status', '--short', '--untracked-files=all']),
        refs: gitValue(workspace, ['show-ref', '--head']),
        indexEntries: gitValue(workspace, ['ls-files', '--stage']),
        objects: gitValue(workspace, ['cat-file', '--batch-all-objects', '--batch-check=%(objectname) %(objecttype) %(objectsize)']),
        remotes: gitValue(workspace, ['remote', '-v']),
      });
      const beforeGit = gitState();
      if (JSON.stringify(beforeGit.status ? beforeGit.status.split('\n') : []) !== JSON.stringify(oracle.expectedStatus) ||
        beforeGit.branch !== (oracle.expectedBranch ?? 'main') || beforeGit.remotes !== '') throw new Error(`${slug}: Git baseline mismatch.`);
      const { test, testSummary, before } = verifyCodexFixtureTests({ node, workspace, evidence, env, definition, beforeGit, gitState });
      const commitCount = Number(gitValue(workspace, ['rev-list', '--all', '--count']));
      const expectedCommits = ['deep', 'fix'].includes(definition.mode) ? 2 : 1;
      if (commitCount !== expectedCommits) throw new Error(`${slug}: unexpected synthetic commit count.`);
      const record = {
        ...definition, workspace, evidence, head: beforeGit.head, branch: beforeGit.branch,
        status: oracle.expectedStatus, statusSha256: sha256(beforeGit.status),
        contentTree: contentTree(workspace, sourceFiles), completeTreeSha256: before.sha256,
        gitStateSha256: sha256(JSON.stringify(beforeGit)), skillTreeSha256: skillTree.sha256,
        promptSha256: sha256(prompt), promptCharacters: prompt.length,
        allowedFiles: [...allowed].sort(), syntheticCommitCount: commitCount,
        actualTestExitCode: test.status, testStdoutSha256: sha256(test.stdout), testStderrSha256: sha256(test.stderr),
        testSummary,
        deterministicTestMutatedWorkspace: false, oraclePresentInWorkspace: false,
        externalModelInvocations: 0, runtimeResult: 'Not Run',
      };
      writeJson(path.join(evidence, 'freeze.json'), record);
      manifest.runs.push(record);
      manifest.syntheticCommitCount += commitCount;
      process.stderr.write(`Prepared ${definition.sequence}/7 ${slug}: expected test exit ${test.status}, unchanged workspace.\n`);
    }
    for (const caseId of plan.acceptance.repeatCaseIds) {
      const pair = manifest.runs.filter((record) => record.caseId === caseId);
      const comparable = (record) => ({ head: record.head, status: record.status, contentTree: record.contentTree,
        promptSha256: record.promptSha256, skillTreeSha256: record.skillTreeSha256, testExit: record.actualTestExitCode });
      if (pair.length !== 2 || JSON.stringify(comparable(pair[0])) !== JSON.stringify(comparable(pair[1]))) throw new Error(`${caseId}: repeat inputs differ.`);
      manifest.repeatAssertions.push({ caseId, pass: true, compared: Object.keys(comparable(pair[0])),
        gitIndexStatBytesComparedAcrossDirectories: false });
    }
    manifest.status = 'offline-workspaces-prepared-runtime-client-pending';
    writeJson(path.join(control, 'manifest.json'), manifest);
    return manifest;
  } catch (error) {
    manifest.status = 'preparation-stopped';
    writeJson(path.join(control, 'failure.json'), { ...manifest, error: error.message,
      failedCommand: error.commandResult ?? null });
    throw new Error(`Preparation stopped; retained evidence: ${control}\n${error.message}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const [authorization, option, gitExecutable, ...extra] = process.argv.slice(2);
    if (authorization !== '--authorize-synthetic-git-commits' || option !== '--git-executable' || extra.length || !gitExecutable) {
      throw new Error('Usage: node scripts/prepare-codex-acceptance-workspaces.mjs --authorize-synthetic-git-commits --git-executable <absolute-file>');
    }
    const manifest = prepareCodexAcceptanceWorkspaces({ authorized: true, gitExecutable });
    process.stdout.write(`${JSON.stringify({ status: manifest.status, outputRoot: manifest.outputRoot,
      runs: manifest.runs.length, syntheticCommitCount: manifest.syntheticCommitCount, repeats: manifest.repeatAssertions,
      externalModelInvocations: 0 }, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
