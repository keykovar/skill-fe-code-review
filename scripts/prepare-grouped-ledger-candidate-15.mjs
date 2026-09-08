#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { prepareGroupedLedgerCandidate } from './prepare-grouped-ledger-candidate-13.mjs';
import { copyDistributableSkill } from './prepare-grouped-ledger-candidate-14.mjs';
import { restoreCandidate16SkillDelta } from './prepare-grouped-ledger-candidate-16.mjs';

const candidate15Definition = {
  candidate: 'post-v0.4.0-grouped-ledger-candidate-15',
  preparedDate: '2026-09-07',
  status: 'offline-freeze-complete-source-free-probe-pending-source-bearing-not-authorized',
  predecessor: {
    candidate: 'post-v0.4.0-grouped-ledger-candidate-14',
    decision: 'No-Go',
    reason: 'Candidate 14 passed semantic and output gates but attempted one misspelled absolute path outside the workspace and retried after the read failed. Candidate 15 changes only the evaluator Prompt path and failure-stop contract.',
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

function usage() {
  return 'Usage: node scripts/prepare-grouped-ledger-candidate-15.mjs --output <directory> --cursor-executable <absolute-file> --git-executable <absolute-file> --skill-source <directory>';
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

export function prepareCandidate15(
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
  restoreCandidate16SkillDelta(skillSource);
  return prepareGroupedLedgerCandidate(
    path.join(outputRoot, 'freeze'),
    requestedCursorExecutable,
    requestedGitExecutable,
    skillSource,
    candidate15Definition,
  );
}

function main() {
  try {
    const options = parseArguments(process.argv.slice(2));
    process.stdout.write(
      `${JSON.stringify(
        prepareCandidate15(
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
