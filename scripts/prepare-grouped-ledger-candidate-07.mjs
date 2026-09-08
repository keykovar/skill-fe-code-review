#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { prepareCandidate06 } from './prepare-grouped-ledger-candidate-06.mjs';

function usage() {
  return 'Usage: node scripts/prepare-grouped-ledger-candidate-07.mjs --output <directory> --cursor-executable <absolute-file> --git-executable <absolute-file>';
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

export function prepareCandidate07(
  requestedOutput,
  requestedCursorExecutable,
  requestedGitExecutable,
) {
  const candidate06Preparation = prepareCandidate06(
    requestedOutput,
    requestedCursorExecutable,
    requestedGitExecutable,
  );
  const manifest = {
    schemaVersion: 1,
    candidate: 'post-v0.4.0-grouped-ledger-candidate-07',
    preparedDate: '2026-08-28',
    status: 'offline-freeze-complete-source-free-probe-not-authorized',
    predecessor: {
      candidate: 'post-v0.4.0-grouped-ledger-candidate-06',
      decision: 'No-Go',
      reason: 'The single authorized isolated login exited before the source-free probe.',
      retried: false,
      reinterpreted: false,
    },
    runtimeDeltaComparedWithCandidate06: 'byte-identical',
    preparationEngine: {
      candidate: candidate06Preparation.candidate,
      manifestSha256: candidate06Preparation.manifestSha256,
    },
    outputDir: candidate06Preparation.outputDir,
    artifacts: candidate06Preparation.artifacts,
    client: candidate06Preparation.client,
    runner: candidate06Preparation.runner,
    clientContract: candidate06Preparation.clientContract,
    preflightContract: candidate06Preparation.preflightContract,
    promptContract: candidate06Preparation.promptContract,
    generationBoundary: {
      ...candidate06Preparation.generationBoundary,
      source: 'Candidate 06 immutable preparation engine with seven fresh Candidate 07 workspaces',
    },
    fixedGitDate: candidate06Preparation.fixedGitDate,
    preparedRuns: candidate06Preparation.preparedRuns,
    repeatAssertions: candidate06Preparation.repeatAssertions,
    sourcePolicy: candidate06Preparation.sourcePolicy,
  };
  const manifestPath = path.join(
    candidate06Preparation.outputDir,
    'control',
    'candidate-07-freeze-manifest.json',
  );
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' });
  return { ...manifest, manifestPath, manifestSha256: sha256(fs.readFileSync(manifestPath)) };
}

function main() {
  try {
    const options = parseArguments(process.argv.slice(2));
    const result = prepareCandidate07(
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
