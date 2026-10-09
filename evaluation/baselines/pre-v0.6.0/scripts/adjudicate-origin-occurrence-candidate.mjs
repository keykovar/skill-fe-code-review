#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { validateOriginOccurrenceCandidate } from './validate-origin-occurrence-candidate.mjs';

const casesPath = new URL('../evaluation/prototypes/origin-occurrence/cases.json', import.meta.url);
const examplesPath = new URL('../evaluation/prototypes/origin-occurrence/examples/oracles.json', import.meta.url);

function equalJson(actual, expected) {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

function validateOracle(oracle) {
  if (!oracle || !Array.isArray(oracle.origins) || !Array.isArray(oracle.states) ||
    oracle.origins.length !== oracle.states.length ||
    !oracle.origins.every((origin) => ['New', 'Amplified', 'Retained', 'Unknown'].includes(origin)) ||
    !oracle.states.every((groups) => Array.isArray(groups) && groups.length > 0 &&
      groups.every((state) => ['Observed', 'Not Run', 'Cannot Verify', 'Not Applicable'].includes(state)))) {
    throw new TypeError('Invalid origin/occurrence oracle: explicit, matching origins and states arrays are required; mutation instructions are not a report oracle.');
  }
  const counts = oracle.counts === undefined ? [] : oracle.counts;
  const observedGroups = oracle.states.flat().filter((state) => state === 'Observed').length;
  if (!Array.isArray(counts) || counts.length !== observedGroups ||
    !counts.every((count) => Array.isArray(count) && count.length === 2 && count.every(Number.isSafeInteger) &&
      count[0] >= 0 && count[1] > 0 && count[0] <= count[1])) {
    throw new TypeError('Invalid origin/occurrence oracle: each Observed group requires one valid integer count pair, and other states must not have counts.');
  }
}

export function adjudicateOriginOccurrenceCandidate(candidate, oracle) {
  validateOracle(oracle);
  const expectedOrigins = oracle.origins;
  const expectedStates = oracle.states;
  const expectedCounts = oracle.counts ?? [];
  const actualOrigins = candidate.findings.map((finding) => finding.origin?.state ?? null);
  const actualStates = candidate.findings.map((finding) => finding.reproduction.map((group) => group.state));
  const actualCounts = candidate.findings.flatMap((finding) => finding.reproduction
    .filter((group) => group.count)
    .map((group) => [group.count.failures, group.count.trials]));
  const checks = {
    findingCount: candidate.findings.length === expectedOrigins.length,
    originStates: equalJson(actualOrigins, expectedOrigins),
    reproductionStates: equalJson(actualStates, expectedStates),
    observationCounts: equalJson(actualCounts, expectedCounts),
    candidateStructure: candidate.structurallyValid,
  };
  const semanticPass = Object.values(checks).every(Boolean);
  return {
    status: semanticPass ? 'Pass' : 'Fail',
    semanticStatus: semanticPass ? 'Pass' : 'Fail',
    evaluatedScope: 'origin-reproduction-fields-only',
    reportAcceptance: 'Not Evaluated',
    checks,
    actual: { findingCount: candidate.findings.length, originStates: actualOrigins,
      reproductionStates: actualStates, observationCounts: actualCounts },
    expected: { findingCount: expectedOrigins.length, originStates: expectedOrigins,
      reproductionStates: expectedStates, observationCounts: expectedCounts },
    limitation: 'This compares origin/reproduction fields with authored synthetic oracle data, not the full report. Summary tallies, closure, severity, recommendations, causal explanations, and observation provenance are not adjudicated. It is not model accuracy or production probability.',
  };
}

export function evaluateOriginOccurrenceReport(markdown, mode, oracle) {
  const candidate = validateOriginOccurrenceCandidate(markdown, mode);
  return { candidate, adjudication: adjudicateOriginOccurrenceCandidate(candidate, oracle) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const [modeFlag, mode, selectorFlag, selector, filename, ...extra] = process.argv.slice(2);
    if (modeFlag !== '--mode' || !['quick', 'deep', 'fix'].includes(mode) || !['--case', '--example'].includes(selectorFlag) || !selector || !filename || extra.length) {
      throw new Error('Usage: node scripts/adjudicate-origin-occurrence-candidate.mjs --mode <quick|deep|fix> (--case <O-ID>|--example <filename>) <review.md>');
    }
    let caseId = null;
    let oracle;
    if (selectorFlag === '--case') {
      const matrix = JSON.parse(fs.readFileSync(casesPath, 'utf8'));
      const definition = matrix.cases.find((item) => item.id === selector);
      if (!definition) throw new Error(`Unknown origin/occurrence case: ${selector}`);
      if (definition.mode !== mode) throw new Error(`Case ${selector} requires mode ${definition.mode}`);
      caseId = definition.id;
      oracle = definition.oracle;
    } else {
      const examples = JSON.parse(fs.readFileSync(examplesPath, 'utf8')).examples;
      if (!Object.hasOwn(examples, selector)) throw new Error(`Unknown origin/occurrence example: ${selector}`);
      const definition = examples[selector];
      if (definition.mode !== mode) throw new Error(`Example ${selector} requires mode ${definition.mode}`);
      caseId = definition.caseId;
      oracle = definition.oracle;
    }
    const result = evaluateOriginOccurrenceReport(fs.readFileSync(path.resolve(filename), 'utf8'), mode, oracle);
    process.stdout.write(`${JSON.stringify({ caseId, ...result }, null, 2)}\n`);
    process.exitCode = result.adjudication.status === 'Pass' ? 0 : 1;
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 2;
  }
}
