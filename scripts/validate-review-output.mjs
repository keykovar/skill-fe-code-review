#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { inspectStrictCoverage } from './validate-review-output-strict.mjs';

const supportedModes = new Set(['quick', 'deep', 'fix']);
const coverageHeadings = new Set([
  'Changed-Condition Coverage',
  'Changed-Condition Coverage：变更条件覆盖',
  '变更条件覆盖',
]);
const fixVerificationHeadings = new Set([
  'Issue Verification',
  'Issue Verification：问题验证',
  '问题验证',
]);
const supportedBlockingOutcomeNames = [
  'Runtime Error',
  'White Screen',
  'Infinite Loop',
  'Broken Main Flow',
  'Payment Failure',
  'Login/Auth Failure',
  'Data Corruption',
  'Build Failure',
  'Serious Compatibility Issue',
  'Severe Regression',
  'Referenced Untracked File',
];

function usage() {
  return 'Usage: node scripts/validate-review-output.mjs --mode <quick|deep|fix> <review.md>';
}

function parseArguments(argv) {
  const normalized = argv[0] === '--' ? argv.slice(1) : argv;
  let mode;
  let reviewPath;

  for (let index = 0; index < normalized.length; index += 1) {
    const argument = normalized[index];

    if (argument === '--mode') {
      mode = normalized[index + 1];
      index += 1;
      continue;
    }

    if (argument.startsWith('--') || reviewPath) {
      throw new Error(usage());
    }

    reviewPath = path.resolve(argument);
  }

  if (!mode || !supportedModes.has(mode) || !reviewPath) {
    throw new Error(usage());
  }

  return { mode, reviewPath };
}

function headingAt(line, index) {
  const match = line.match(/^(#{2,6})\s+(.+?)\s*$/u);
  if (!match) {
    return null;
  }

  return {
    index,
    level: match[1].length,
    text: match[2].replace(/\s+#+$/u, '').trim(),
  };
}

function severityFromHeading(text) {
  const match = text.match(/^(Blocking|Risk|Improve)(?:\b|：|:)/iu);
  return match?.[1].toLowerCase() ?? null;
}

function inspectFindings(lines, errors) {
  const findings = [];
  let currentFinding = null;
  let currentSeverity = null;

  const finishCurrent = () => {
    if (currentFinding) {
      findings.push(currentFinding);
      currentFinding = null;
    }
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const heading = headingAt(line, index);

    if (heading) {
      finishCurrent();
      currentSeverity = severityFromHeading(heading.text);
      continue;
    }

    const findingMatch = currentSeverity
      ? line.match(/^\s*-\s+\[(F-\d{3})\]\s+\[[^\]]+\](?:\([^\r\n)]+\))?\s+.+$/u)
      : null;
    const findingPrefix = currentSeverity
      ? line.match(/^\s*-\s+\[(F-\d{3})\]\s+/u)
      : null;

    if (findingMatch) {
      finishCurrent();
      currentFinding = {
        blockingOutcome: null,
        id: findingMatch[1],
        line: index + 1,
        severity: currentSeverity,
      };
      continue;
    }

    if (findingPrefix) {
      errors.push({
        findingId: findingPrefix[1],
        line: index + 1,
        type: 'finding-location-invalid',
      });
    }

    if (currentFinding) {
      const outcomeMatch = line.match(
        /^\s*-\s*(?:Blocking outcome|阻断结果)\s*[:：]\s*(.*?)\s*$/iu,
      );
      if (outcomeMatch) {
        currentFinding.blockingOutcome = outcomeMatch[1];
      }
    }
  }

  finishCurrent();
  return findings;
}

function inspectCoverageLedger(lines, headings, findingIds, errors) {
  const coverageSections = headings.filter(({ text }) => coverageHeadings.has(text));

  if (coverageSections.length !== 1) {
    errors.push({
      actual: coverageSections.length,
      expected: 1,
      type: 'coverage-ledger-section-count',
    });
    return 0;
  }

  const section = coverageSections[0];
  if (section.level !== 2) {
    errors.push({ line: section.index + 1, type: 'coverage-ledger-not-top-level' });
  }

  const nextTopLevel = headings.find(
    ({ index, level }) => index > section.index && level <= section.level,
  );
  const sectionLines = lines.slice(section.index + 1, nextTopLevel?.index ?? lines.length);
  const entries = sectionLines
    .map((line, offset) => ({ line, lineNumber: section.index + offset + 2 }))
    .filter(({ line }) => /^\s*-\s+\S/u.test(line));

  if (entries.length === 0) {
    errors.push({ line: section.index + 1, type: 'coverage-ledger-empty' });
  }

  const findingReferences = new Map();

  for (const entry of entries) {
    if (!/(?:->|→)/u.test(entry.line)) {
      errors.push({ line: entry.lineNumber, type: 'coverage-ledger-missing-before-after' });
    }

    const disposition = entry.line.match(
      /(?:Disposition|结论)\s*[:：]\s*(.+?)(?=\s*[;；]\s*(?:Merge key|合并依据)\s*[:：]|$)/iu,
    )?.[1];
    if (!disposition) {
      errors.push({ line: entry.lineNumber, type: 'coverage-ledger-missing-disposition' });
      continue;
    }

    const referencedIds = [...disposition.matchAll(/\[(F-\d{3})\]/gu)].map((match) => match[1]);
    const behaviorPreserving = /Behavior Preserving|行为保持/iu.test(disposition);
    const cannotVerify = /Cannot Verify|无法验证/iu.test(disposition);
    const dispositionCount = referencedIds.length + Number(behaviorPreserving) + Number(cannotVerify);

    if (dispositionCount !== 1) {
      errors.push({ line: entry.lineNumber, type: 'coverage-ledger-invalid-disposition' });
      continue;
    }

    if (referencedIds.length === 1 && !findingIds.has(referencedIds[0])) {
      errors.push({
        findingId: referencedIds[0],
        line: entry.lineNumber,
        type: 'coverage-ledger-unknown-finding-id',
      });
    }

    if (referencedIds.length === 1) {
      const mergeKey = entry.line.match(
        /(?:Merge key|合并依据)\s*[:：]\s*(\S(?:.*\S)?)\s*$/iu,
      )?.[1];
      const references = findingReferences.get(referencedIds[0]) ?? [];
      references.push({ line: entry.lineNumber, mergeKey: mergeKey ?? null });
      findingReferences.set(referencedIds[0], references);
    }
  }

  for (const [findingId, references] of findingReferences) {
    if (references.length === 1 && references[0].mergeKey !== null) {
      errors.push({
        findingId,
        line: references[0].line,
        type: 'coverage-ledger-single-finding-id-merge-key-unexpected',
      });
      continue;
    }

    if (references.length < 2) {
      continue;
    }

    if (references.some(({ mergeKey }) => mergeKey === null)) {
      errors.push({
        findingId,
        lines: references.map(({ line }) => line),
        type: 'coverage-ledger-repeated-finding-id-merge-key-missing',
      });
      continue;
    }

    const mergeKeys = [...new Set(references.map(({ mergeKey }) => mergeKey))];
    if (mergeKeys.length !== 1) {
      errors.push({
        findingId,
        lines: references.map(({ line }) => line),
        mergeKeys,
        type: 'coverage-ledger-repeated-finding-id-merge-key-mismatch',
      });
    }
  }

  return entries.length;
}

function inspectFixVerification(lines, headings, errors) {
  const verificationSections = headings.filter(({ text }) =>
    fixVerificationHeadings.has(text),
  );

  if (verificationSections.length !== 1) {
    errors.push({
      actual: verificationSections.length,
      expected: 1,
      type: 'fix-verification-section-count',
    });
    return [];
  }

  const section = verificationSections[0];
  if (section.level !== 2) {
    errors.push({ line: section.index + 1, type: 'fix-verification-not-top-level' });
  }

  const nextTopLevel = headings.find(
    ({ index, level }) => index > section.index && level <= section.level,
  );
  const sectionEnd = nextTopLevel?.index ?? lines.length;
  const findings = [];

  for (let index = section.index + 1; index < sectionEnd; index += 1) {
    const match = lines[index].match(/^\s*-\s+\[(F-\d{3})\]\s+.+$/u);
    if (match) {
      findings.push({ id: match[1], index, line: index + 1 });
    }
  }

  if (findings.length === 0) {
    errors.push({ line: section.index + 1, type: 'fix-verification-empty' });
    return [];
  }

  const findingIds = findings.map(({ id }) => id);
  if (new Set(findingIds).size !== findingIds.length) {
    errors.push({ type: 'fix-finding-id-duplicate' });
  }

  for (let index = 0; index < findings.length; index += 1) {
    const finding = findings[index];
    const blockEnd = findings[index + 1]?.index ?? sectionEnd;
    const statuses = lines
      .slice(finding.index + 1, blockEnd)
      .map((line) =>
        line.match(
          /^\s*-\s*(?:Current status|当前状态)\s*[:：]\s*(Resolved|Partially Resolved|Unresolved|Cannot Verify)(?:\b|：|:)/iu,
        )?.[1],
      )
      .filter(Boolean);

    if (statuses.length !== 1) {
      errors.push({
        actual: statuses.length,
        expected: 1,
        findingId: finding.id,
        line: finding.line,
        type: 'fix-finding-status-count',
      });
    }
  }

  return findingIds;
}

export function validateReviewOutput(markdown, mode) {
  if (!supportedModes.has(mode)) {
    throw new Error(`Unsupported review mode: ${mode}`);
  }

  const lines = markdown.replace(/\r\n?/gu, '\n').split('\n');
  const headings = lines
    .map((line, index) => headingAt(line, index))
    .filter((heading) => heading !== null);
  const coverageSections = headings.filter(({ text }) => coverageHeadings.has(text));
  const errors = [];

  if (mode === 'fix') {
    if (coverageSections.length > 0) {
      errors.push({
        actual: coverageSections.length,
        expected: 0,
        type: 'fix-review-coverage-ledger-forbidden',
      });
    }

    const findingIds = inspectFixVerification(lines, headings, errors);

    return {
      blockingFindingCount: 0,
      coverageLedgerEntries: 0,
      errors,
      findingIds,
      mode,
      valid: errors.length === 0,
    };
  }

  const findings = inspectFindings(lines, errors);
  const findingIds = findings.map(({ id }) => id);
  const findingIdSet = new Set(findingIds);

  if (findingIdSet.size !== findingIds.length) {
    errors.push({ type: 'finding-id-duplicate' });
  }

  const expectedFindingIds = findingIds.map((_, index) => `F-${String(index + 1).padStart(3, '0')}`);
  if (findingIds.some((id, index) => id !== expectedFindingIds[index])) {
    errors.push({ actual: findingIds, expected: expectedFindingIds, type: 'finding-id-order' });
  }

  for (const finding of findings.filter(({ severity }) => severity === 'blocking')) {
    if (!finding.blockingOutcome) {
      errors.push({
        findingId: finding.id,
        line: finding.line,
        type: 'blocking-outcome-missing',
      });
      continue;
    }

    if (
      !supportedBlockingOutcomeNames.some(
        (name) =>
          finding.blockingOutcome === name || finding.blockingOutcome.startsWith(`${name} - `),
      )
    ) {
      errors.push({
        findingId: finding.id,
        line: finding.line,
        type: 'blocking-outcome-unsupported',
      });
    }
  }

  const coverageLedgerEntries = inspectCoverageLedger(
    lines,
    headings,
    findingIdSet,
    errors,
  );
  for (const error of inspectStrictCoverage(markdown)) {
    if (!errors.some((current) => current.type === error.type && current.line === error.line)) {
      errors.push(error);
    }
  }

  return {
    blockingFindingCount: findings.filter(({ severity }) => severity === 'blocking').length,
    coverageLedgerEntries,
    errors,
    findingIds,
    mode,
    valid: errors.length === 0,
  };
}

function main() {
  try {
    const { mode, reviewPath } = parseArguments(process.argv.slice(2));
    const report = validateReviewOutput(fs.readFileSync(reviewPath, 'utf8'), mode);
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    process.exitCode = report.valid ? 0 : 1;
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main();
}
