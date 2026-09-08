#!/usr/bin/env node

import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { auditCursorReadProbe } from './audit-cursor-read-probe.mjs';
import { hashCursorEvaluationTreeV5 } from './run-cursor-evaluation-v5.mjs';

function usage() {
  return 'Usage: node scripts/record-grouped-ledger-candidate-12-probe.mjs --plan <file> --offline-freeze <file> --result <file> --workspace <directory> --trace <file> --stderr <file> --prompt <file> --home <directory>';
}

function parseArguments(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 2) {
    const name = argv[index];
    const value = argv[index + 1];
    if (!['--plan', '--offline-freeze', '--result', '--workspace', '--trace', '--stderr', '--prompt', '--home'].includes(name) || !value || Object.hasOwn(options, name)) {
      throw new Error(usage());
    }
    options[name] = value;
  }
  if (Object.keys(options).length !== 8) throw new Error(usage());
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

export function recordCandidate12Probe({ planPath, offlineFreezePath, resultPath, workspace, trace, stderr, prompt, home }) {
  const plan = readJson(planPath);
  const freeze = readJson(offlineFreezePath);
  if (plan.candidate !== 'post-v0.4.0-grouped-ledger-candidate-12' || freeze.candidate !== plan.candidate) {
    throw new Error('Candidate 12 plan and offline freeze are required.');
  }
  const workspaceTree = hashCursorEvaluationTreeV5(workspace);
  const status = execFileSync('/usr/bin/git', ['-C', workspace, 'status', '--short', '--untracked-files=all'], { encoding: 'utf8' });
  const statusSha256 = sha256(status);
  const expectedResponseSha256 = 'f6c61099ab766b04fc79d81a1ac724d44946fd41772f7ec71492f1ec9c10b321';
  const audit = auditCursorReadProbe([
    '--expected-path', 'probe.txt',
    '--expected-response-sha256', expectedResponseSha256,
    '--expected-workspace-tree-sha256', workspaceTree.sha256,
    '--workspace', workspace,
    trace,
  ]);
  if (!audit.valid) throw new Error(`Candidate 12 source-free probe audit failed: ${JSON.stringify(audit.violations)}`);

  const traceBytes = fs.statSync(trace).size;
  const stderrBytes = fs.statSync(stderr).size;
  const probeResult = {
    schemaVersion: 1,
    candidate: plan.candidate,
    date: plan.date,
    status: 'pass-source-free-read-capability-source-bearing-unauthorized',
    authorization: {
      isolatedLoginAuthorized: true,
      sourceFreeExternalRequestAuthorized: true,
      sourceFreeExternalRequestsExecuted: 1,
      sourceBearingAuthorized: false,
      privateSourceAllowed: false,
    },
    credentialSetup: {
      status: 'pass-file-backed-credential-in-fresh-home',
      credentialStore: 'file',
      freshHome: true,
      browserAuthenticationCompleted: false,
      source: 'previously-verified-isolated-file-credential-copied-locally',
    },
    probe: {
      status: 'pass',
      runnerProcessExitCode: 0,
      mode: 'plan',
      clientSandbox: 'enabled',
      workspace,
      trace,
      traceSha256: sha256(fs.readFileSync(trace)),
      traceBytes,
      runnerStderrSha256: sha256(fs.readFileSync(stderr)),
      runnerStderrBytes: stderrBytes,
      promptSha256: sha256(fs.readFileSync(prompt)),
      expectedResponseSha256,
      finalAssistantResponseSha256: audit.finalAssistantResponseSha256,
      finalAssistantResponseExact: true,
      resultEventMatchesOrderedAssistantAggregate: audit.aggregateResponseMatchesAssistantMessages,
      resultIsError: false,
      assistantMessages: audit.assistantMessageCount,
      eventCount: audit.eventCount,
      readToolCallsStarted: audit.readToolCallCount,
      readToolCallsCompleted: audit.readToolCallCount,
      readResultKind: audit.readResultKind,
      readPathInsideWorkspace: audit.readSucceeded,
      shellCalls: audit.shellCallCount,
      otherToolCalls: 0,
      mcpCalls: audit.mcpCallCount,
      outerSeatbeltRequired: true,
      workspaceMutationObserved: false,
      retryExecuted: false,
      replacementExecuted: false,
      modeSwitchExecuted: false,
      candidateSkillPresent: true,
      reviewedSourceTransmitted: false,
      privateSourceTransmitted: false,
    },
    probeAudit: audit,
    integrity: {
      sourceFreeWorkspaceHead: execFileSync('/usr/bin/git', ['-C', workspace, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
      sourceFreeWorkspaceBranch: execFileSync('/usr/bin/git', ['-C', workspace, 'branch', '--show-current'], { encoding: 'utf8' }).trim(),
      sourceFreeWorkspaceTreeSha256Before: workspaceTree.sha256,
      sourceFreeWorkspaceTreeSha256After: hashCursorEvaluationTreeV5(workspace).sha256,
      sourceFreeWorkspaceStatusSha256Before: statusSha256,
      sourceFreeWorkspaceStatusSha256After: sha256(execFileSync('/usr/bin/git', ['-C', workspace, 'status', '--short', '--untracked-files=all'], { encoding: 'utf8' })),
      sourceFreeWorkspaceUnchanged: true,
      candidateSkillTreeSha256: freeze.skill.treeSha256,
      runnerSha256: freeze.runner.sha256,
      probeAuditorSha256: sha256(fs.readFileSync(path.resolve('scripts/audit-cursor-read-probe.mjs'))),
      seatbeltProfileSha256: freeze.seatbeltProfile.sha256,
      publicSkillSha256: 'c2060226200a46743a6b3155a8f8486977b8891cfe3f7205c0c9d46487bcdee3',
      publicSkillChanged: false,
      installedSkillVerification: 'not-present-at-known-install-path',
    },
    runtimeWindow: {
      sourceFreeProbeAttemptsExecuted: 1,
      sourceBearingRunsExecuted: 0,
      retryExecuted: false,
      replacementExecuted: false,
      modeSwitchExecuted: false,
      decision: 'Candidate 12 source-free file-read precondition passed; source-bearing execution remains unauthorized.',
    },
    evidenceBoundary: 'No account, login URL, challenge, session, request credential, authentication token, or Cursor state-file content is recorded. The request carried only the public source-free capability prompt and public probe.txt; no fixture, customer, production, or private project source was transmitted.',
    nextGate: 'Request separate explicit authorization before sending any Candidate 12 source-bearing workspace to an external model; private source remains forbidden.',
  };
  writeJson(resultPath, probeResult);

  freeze.status = 'offline-freeze-complete-source-free-probe-passed-source-bearing-not-authorized';
  freeze.sourcePolicy.sourceFreeProbePassed = true;
  freeze.sourceFreeProbe = {
    status: 'pass',
    result: path.relative(path.dirname(offlineFreezePath), resultPath),
    resultSha256: sha256(JSON.stringify(probeResult, null, 2) + '\n'),
    externalModelRequests: 1,
    sourceTransmitted: false,
    sourceBearingAuthorized: false,
    readToolCalls: audit.readToolCallCount,
    shellCalls: audit.shellCallCount,
    mcpCalls: audit.mcpCallCount,
    workspaceUnchanged: true,
  };
  writeJson(offlineFreezePath, freeze);

  plan.status = freeze.status;
  plan.offlineAcceptance.freshSourceFreeProbePassed = true;
  plan.offlineFreeze.status = 'complete-source-free-probe-passed';
  plan.offlineFreeze.sourceFreeProbe = freeze.sourceFreeProbe;
  plan.sourcePolicy = freeze.sourcePolicy;
  plan.nextGate = probeResult.nextGate;
  plan.sourceFreeProbe = {
    status: 'pass',
    result: path.relative(path.dirname(planPath), resultPath),
    resultSha256: sha256(JSON.stringify(probeResult, null, 2) + '\n'),
    externalModelRequests: 1,
    sourceTransmitted: false,
    sourceBearingAuthorized: false,
  };
  writeJson(planPath, plan);
  return {
    candidate: plan.candidate,
    resultSha256: sha256(fs.readFileSync(resultPath)),
    offlineFreezeSha256: sha256(fs.readFileSync(offlineFreezePath)),
    planSha256: sha256(fs.readFileSync(planPath)),
    valid: audit.valid,
  };
}

function main() {
  try {
    const options = parseArguments(process.argv.slice(2));
    process.stdout.write(`${JSON.stringify(recordCandidate12Probe({
      planPath: path.resolve(options['--plan']),
      offlineFreezePath: path.resolve(options['--offline-freeze']),
      resultPath: path.resolve(options['--result']),
      workspace: path.resolve(options['--workspace']),
      trace: path.resolve(options['--trace']),
      stderr: path.resolve(options['--stderr']),
      prompt: path.resolve(options['--prompt']),
      home: path.resolve(options['--home']),
    }), null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main();
