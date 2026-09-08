#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  copyDistributableSkill,
  prepareGroupedLedgerCandidate,
} from './prepare-grouped-ledger-candidate-13.mjs';

const candidate16Definition = {
  candidate: 'post-v0.4.0-grouped-ledger-candidate-16',
  preparedDate: '2026-09-08',
  status: 'offline-freeze-complete-source-free-probe-pending-source-bearing-not-authorized',
  predecessor: {
    candidate: 'post-v0.4.0-grouped-ledger-candidate-15',
    decision: 'No-Go',
    reason: 'Candidate 15 passed path-safety, read-only, output, and integrity gates but escalated the Risk-only ignored-timeout-contract finding to Blocking. Candidate 16 changes only central severity finalization and the Severe Regression definition.',
    retried: false,
    reinterpreted: false,
  },
  promptSafetyProfile: 'workspace-relative-stop-on-failure',
  repeatCaseIds: [],
  runs: [
    { caseId: 'Q-ID-002', mode: 'quick-independent', runId: 'RUN-01' },
    { caseId: 'D-ID-001', mode: 'deep-identity', runId: 'RUN-01' },
  ],
  sourceFreeProbePassed: false,
};

const originalFinalizationRule =
  '3. Finalize severity, then sort by severity (`Blocking`, `Risk`, `Improve`) and first changed source location.';
const candidateFinalizationRule =
  '3. Finalize severity, then perform a Blocking proof pass before sorting: for every Blocking finding, name one canonical outcome from `Severity Rules` and cite evidence that the outcome occurs or is unavoidable. If the evidence establishes only a changed parameter, direct-caller mismatch, local contract regression, or local test failure, classify the finding as Risk unless separate evidence demonstrates a canonical Blocking outcome. Then sort by severity (`Blocking`, `Risk`, `Improve`) and first changed source location.';
const originalSeverityRule =
  'Use Blocking only when evidence supports one canonical outcome: `Runtime Error`, `White Screen`, `Infinite Loop`, `Broken Main Flow`, `Payment Failure`, `Login/Auth Failure`, `Data Corruption`, `Build Failure`, `Serious Compatibility Issue`, or `Severe Regression`.';
const candidateSeverityRule = `${originalSeverityRule}\n\n\`Severe Regression\` means a demonstrated loss of an established critical path or broad supported-environment behavior whose impact is equivalent to another Blocking outcome. It is not a synonym for any regression and cannot be established solely by a changed parameter, direct-caller mismatch, local contract regression, or failing local test.`;

function usage() {
  return 'Usage: node scripts/prepare-grouped-ledger-candidate-16.mjs --output <directory> --cursor-executable <absolute-file> --git-executable <absolute-file> --skill-source <directory>';
}

function parseArguments(argv) {
  const normalized = argv[0] === '--' ? argv.slice(1) : argv;
  const required = ['--cursor-executable', '--git-executable', '--output', '--skill-source'];
  const options = {};
  for (let index = 0; index < normalized.length; index += 2) {
    const name = normalized[index];
    const value = normalized[index + 1];
    if (!required.includes(name) || !value || Object.hasOwn(options, name)) {
      throw new Error(usage());
    }
    options[name] = value;
  }
  if (required.some((name) => !options[name]) || normalized.length !== required.length * 2) {
    throw new Error(usage());
  }
  return options;
}

function replaceOrVerify(content, original, candidate, label) {
  const originalCount = content.split(original).length - 1;
  const candidateCount = content.split(candidate).length - 1;
  if (candidateCount === 1) {
    return content;
  }
  if (originalCount === 1 && candidateCount === 0) {
    return content.replace(original, candidate);
  }
  throw new Error(`Candidate 16 ${label} contract is ambiguous.`);
}

function restoreOrVerify(content, original, candidate, label) {
  const originalCount = content.split(original).length - 1;
  const candidateCount = content.split(candidate).length - 1;
  if (candidateCount === 1) {
    return content.replace(candidate, original);
  }
  if (originalCount === 1) {
    return content;
  }
  throw new Error(`Candidate 16 ${label} restore contract is ambiguous.`);
}

export function restoreCandidate16SkillContent(content) {
  let restored = restoreOrVerify(
    content,
    originalFinalizationRule,
    candidateFinalizationRule,
    'finalization',
  );
  restored = restoreOrVerify(
    restored,
    originalSeverityRule,
    candidateSeverityRule,
    'severity',
  );
  return restored;
}

export function restoreCandidate16SkillDelta(skillRoot) {
  const skillPath = path.join(skillRoot, 'SKILL.md');
  const content = fs.readFileSync(skillPath, 'utf8');
  fs.writeFileSync(skillPath, restoreCandidate16SkillContent(content));
}

export function applyCandidate16SkillDelta(skillRoot) {
  const skillPath = path.join(skillRoot, 'SKILL.md');
  let content = fs.readFileSync(skillPath, 'utf8');
  content = replaceOrVerify(
    content,
    originalFinalizationRule,
    candidateFinalizationRule,
    'finalization',
  );
  content = replaceOrVerify(
    content,
    originalSeverityRule,
    candidateSeverityRule,
    'severity',
  );
  fs.writeFileSync(skillPath, content);
}

export function prepareCandidate16(
  requestedOutput,
  requestedCursorExecutable,
  requestedGitExecutable,
  requestedSkillSource,
) {
  const outputRoot = path.resolve(requestedOutput);
  if (fs.existsSync(outputRoot) && fs.readdirSync(outputRoot).length > 0) {
    throw new Error(`Output directory must be empty: ${outputRoot}`);
  }
  fs.mkdirSync(outputRoot, { recursive: true });
  const skillSource = path.join(outputRoot, 'candidate-skill');
  copyDistributableSkill(requestedSkillSource, skillSource);
  applyCandidate16SkillDelta(skillSource);
  return prepareGroupedLedgerCandidate(
    path.join(outputRoot, 'freeze'),
    requestedCursorExecutable,
    requestedGitExecutable,
    skillSource,
    candidate16Definition,
  );
}

function main() {
  try {
    const options = parseArguments(process.argv.slice(2));
    process.stdout.write(
      `${JSON.stringify(
        prepareCandidate16(
          options['--output'],
          options['--cursor-executable'],
          options['--git-executable'],
          options['--skill-source'],
        ),
        null,
        2,
      )}\n`,
    );
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main();
