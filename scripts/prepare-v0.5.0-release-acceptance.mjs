#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  copyDistributableSkill,
  prepareGroupedLedgerCandidate,
} from './prepare-grouped-ledger-candidate-13.mjs';

const definition = {
  candidate: 'v0.5.0-current-tree-fix-acceptance',
  preparedDate: '2026-09-08',
  status: 'offline-freeze-complete-source-bearing-not-authorized',
  predecessor: {
    candidate: 'post-v0.4.0-grouped-ledger-candidate-16',
    decision: 'Go',
    reason:
      'Complete the current-tree Fix gate required by the release policy without changing the accepted Skill.',
    retried: false,
    reinterpreted: false,
  },
  promptSafetyProfile: 'workspace-relative-stop-on-failure-fix-previous-findings',
  repeatCaseIds: [],
  runs: [{ caseId: 'F-ID-001', mode: 'fix-identity', runId: 'RUN-01' }],
  sourceFreeProbePassed: true,
};

function usage() {
  return 'Usage: node scripts/prepare-v0.5.0-release-acceptance.mjs --output <directory> --cursor-executable <absolute-file> --git-executable <absolute-file> --skill-source <directory>';
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

export function prepareV050ReleaseAcceptance(
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
  return prepareGroupedLedgerCandidate(
    path.join(outputRoot, 'freeze'),
    requestedCursorExecutable,
    requestedGitExecutable,
    skillSource,
    definition,
  );
}

function main() {
  try {
    const options = parseArguments(process.argv.slice(2));
    process.stdout.write(
      `${JSON.stringify(
        prepareV050ReleaseAcceptance(
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
