#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

function usage() {
  return 'Usage: node scripts/finalize-grouped-ledger-candidate-12.mjs --manifest <file> --offline-freeze <file> --plan <file>';
}

function parseArguments(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 2) {
    const name = argv[index];
    const value = argv[index + 1];
    if (!['--manifest', '--offline-freeze', '--plan'].includes(name) || !value || Object.hasOwn(options, name)) {
      throw new Error(usage());
    }
    options[name] = value;
  }
  if (Object.keys(options).length !== 3) throw new Error(usage());
  return options;
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function runRecord(run) {
  return {
    caseId: run.caseId,
    mode: run.mode,
    runId: run.runId,
    branch: run.branch,
    head: run.head,
    statusSha256: run.statusSha256,
    workspaceTreeSha256: run.workspaceTreeSha256,
    promptSha256: run.promptSha256,
    testCommand: run.testCommand,
    testExitCode: run.testExitCode,
    testStdoutSha256: run.testStdoutSha256,
    testStderrSha256: run.testStderrSha256,
    expectedTestExitCode: run.expectedTestExitCode,
    collectorCallsExecuted: run.collectorCallsExecuted,
    collectorExpectedByCursor: run.collectorExpectedByCursor,
  };
}

function repeatAssertion(runs, caseId) {
  const pair = runs.filter((run) => run.caseId === caseId);
  if (pair.length !== 2) throw new Error(`${caseId} repeat pair is incomplete.`);
  const keys = ['head', 'promptSha256', 'statusSha256', 'workspaceTreeSha256'];
  for (const key of keys) {
    if (pair[0][key] !== pair[1][key]) throw new Error(`${caseId} repeat pair differs at ${key}.`);
  }
  return {
    caseId,
    runs: pair.map(({ runId }) => runId),
    head: pair[0].head,
    promptSha256: pair[0].promptSha256,
    statusSha256: pair[0].statusSha256,
    workspaceTreeSha256: pair[0].workspaceTreeSha256,
  };
}

export function finalizeCandidate12({ manifestPath, offlineFreezePath, planPath }) {
  const manifest = readJson(manifestPath);
  if (manifest.candidate !== 'post-v0.4.0-grouped-ledger-candidate-12') {
    throw new Error('Manifest candidate must be Candidate 12.');
  }
  if (!Array.isArray(manifest.preparedRuns) || manifest.preparedRuns.length !== 7) {
    throw new Error('Candidate 12 must contain exactly seven prepared runs.');
  }
  const runs = manifest.preparedRuns.map(runRecord);
  const offlineFreeze = {
    schemaVersion: 1,
    candidate: manifest.candidate,
    preparedDate: manifest.preparedDate,
    status: 'offline-freeze-complete-source-free-probe-pending-source-bearing-not-authorized',
    sourcePolicy: {
      externalModelRequests: 0,
      sourceBearingAuthorized: false,
      sourceFreeProbePassed: false,
      sourceTransmitted: false,
      visibility: 'public-synthetic-only',
    },
    evaluatorContract: manifest.evaluatorContract,
    skill: manifest.skill,
    runner: {
      sha256: manifest.runner.sha256,
      argumentsBeforePrompt: manifest.runner.argumentsBeforePrompt,
    },
    seatbeltProfile: { sha256: manifest.seatbeltProfile.sha256 },
    runs,
    repeatAssertions: [repeatAssertion(runs, 'Q-ID-001'), repeatAssertion(runs, 'F-ID-001')],
    externalModelRequests: 0,
    sourceTransmitted: false,
    sourceBearingAuthorized: false,
  };
  writeJson(offlineFreezePath, offlineFreeze);

  const plan = readJson(planPath);
  plan.status = 'offline-freeze-complete-source-free-probe-pending';
  plan.offlineFreeze = {
    status: 'complete',
    manifest: path.relative(path.dirname(planPath), manifestPath),
    manifestSha256: sha256(fs.readFileSync(manifestPath)),
    result: path.relative(path.dirname(planPath), offlineFreezePath),
    resultSha256: sha256(JSON.stringify(offlineFreeze, null, 2) + '\n'),
    workspaces: `${runs.length}/7`,
    nonDeepEvaluatorCollectors: `${runs.filter(({ mode }) => mode !== 'deep-identity').length}/6`,
    deepEvaluatorInventories: `${runs.filter(({ mode }) => mode === 'deep-identity').length}/1`,
    repeatAssertions: '2/2',
    cursorShellCallsExpected: 0,
    cursorMcpCallsExpected: 0,
    cursorCollectorCallsExpected: 0,
    cursorTestCallsExpected: 0,
    externalModelRequests: 0,
    sourceTransmitted: false,
    sourceBearingAuthorized: false,
  };
  plan.preparedRuns = runs;
  plan.repeatAssertions = offlineFreeze.repeatAssertions;
  plan.sourcePolicy = offlineFreeze.sourcePolicy;
  writeJson(planPath, plan);
  return {
    candidate: manifest.candidate,
    manifestSha256: sha256(fs.readFileSync(manifestPath)),
    offlineFreezeSha256: sha256(fs.readFileSync(offlineFreezePath)),
    planSha256: sha256(fs.readFileSync(planPath)),
    preparedRuns: runs.length,
  };
}

function main() {
  try {
    const options = parseArguments(process.argv.slice(2));
    process.stdout.write(`${JSON.stringify(finalizeCandidate12({
      manifestPath: path.resolve(options['--manifest']),
      offlineFreezePath: path.resolve(options['--offline-freeze']),
      planPath: path.resolve(options['--plan']),
    }), null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main();
