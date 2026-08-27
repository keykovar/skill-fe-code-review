#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateGroupedLedger } from '../../scripts/grouped-ledger-validator.mjs';

const prototypeDir = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.join(prototypeDir, 'grouped-ledger-cases.json');

function arraysEqual(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const results = manifest.cases.map((testCase) => {
  const markdownPath = path.join(prototypeDir, testCase.path);
  const markdown = fs.readFileSync(markdownPath, 'utf8');
  const actualSha256 = crypto.createHash('sha256').update(markdown).digest('hex');
  const hashMatches = actualSha256 === testCase.sha256;
  const report = validateGroupedLedger(markdown, {
    expectedFindingIds: testCase.expectedFindingIds,
  });
  const actualErrorTypes = [...new Set(report.errors.map(({ type }) => type))].sort();
  const expectedErrorTypes = [...testCase.expectedErrorTypes].sort();
  const pass =
    hashMatches &&
    report.valid === testCase.expectedStructuralValid &&
    arraysEqual(actualErrorTypes, expectedErrorTypes) &&
    arraysEqual(report.findingIds, testCase.expectedActualFindingIds);

  return {
    actualErrorTypes,
    actualFindingIds: report.findingIds,
    actualSha256,
    conditionCount: report.conditionCount,
    expectedErrorTypes,
    expectedStructuralValid: testCase.expectedStructuralValid,
    id: testCase.id,
    hashMatches,
    pass,
    semanticOracleExpected: testCase.semanticOracleExpected,
    structuralValid: report.valid,
  };
});

const output = {
  cases: results,
  failed: results.filter(({ pass }) => !pass).length,
  passed: results.filter(({ pass }) => pass).length,
  schemaVersion: 1,
  total: results.length,
  valid: results.every(({ pass }) => pass),
};

process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
process.exitCode = output.valid ? 0 : 1;
