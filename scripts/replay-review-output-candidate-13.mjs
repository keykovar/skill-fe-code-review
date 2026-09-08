#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { validateReviewOutput } from './validate-review-output.mjs';

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const fixturesDir = path.join(rootDir, 'evaluation', 'prototypes', 'review-output-candidate-13');

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function runFixture(fileName, expectedValid, expectedErrors = []) {
  const filePath = path.join(fixturesDir, fileName);
  const report = validateReviewOutput(fs.readFileSync(filePath, 'utf8'), 'deep');
  if (report.valid !== expectedValid) {
    throw new Error(`${fileName}: expected valid=${expectedValid}, received ${report.valid}`);
  }
  for (const type of expectedErrors) {
    if (!report.errors.some((error) => error.type === type)) {
      throw new Error(`${fileName}: missing expected error ${type}`);
    }
  }
  return {
    file: path.relative(rootDir, filePath),
    sha256: sha256(filePath),
    valid: report.valid,
    coverageLedgerEntries: report.coverageLedgerEntries,
    errors: report.errors,
  };
}

export function replayCandidate13Fixtures() {
  const cases = [
    runFixture('corrected.valid.md', true),
    runFixture('localized.corrected.valid.md', true),
    runFixture('single-id-merge-key.invalid.md', false, [
      'coverage-ledger-single-finding-id-merge-key-unexpected',
    ]),
    runFixture('localized-single-id-merge-key.invalid.md', false, [
      'coverage-ledger-single-finding-id-merge-key-unexpected',
    ]),
    runFixture('colon-only.invalid.md', false, ['coverage-ledger-missing-before-after']),
    runFixture('nested.invalid.md', false, [
      'coverage-ledger-missing-before-after',
      'coverage-ledger-missing-disposition',
    ]),
    runFixture('missing-location.invalid.md', false, ['coverage-ledger-invalid-entry-shape']),
    runFixture('multiple-arrows.invalid.md', false, [
      'coverage-ledger-invalid-before-after-count',
    ]),
    runFixture('nested-valid-shape.invalid.md', false, [
      'coverage-ledger-invalid-entry-shape',
    ]),
    runFixture('continuation.invalid.md', false, ['coverage-ledger-unexpected-content']),
  ];
  return {
    candidate: 'post-v0.4.0-grouped-ledger-candidate-13',
    fixtureCount: cases.length,
    passed: cases.length,
    failed: 0,
    valid: true,
    cases,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    process.stdout.write(`${JSON.stringify(replayCandidate13Fixtures(), null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
