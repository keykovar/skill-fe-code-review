import path from 'node:path';

import { adjudicateOriginOccurrenceCandidate, evaluateOriginOccurrenceReport } from './adjudicate-origin-occurrence-candidate.mjs';

const coverageHeadings = new Set([
  'Changed-Condition Coverage', 'Changed-Condition Coverage：变更条件覆盖', '变更条件覆盖',
]);

function canonicalPath(value) {
  return value.length > 0 && value.trim() === value && !/[\\:#?%<>\[\]()\u0000-\u001f\u007f]/u.test(value) &&
    value.split('/').slice(value.startsWith('/') ? 1 : 0).every((part) => part && part !== '.' && part !== '..');
}

function location(value, sourceRoot) {
  const match = value.match(/^(.+):([1-9]\d*)$/u);
  if (!match || !Number.isSafeInteger(Number(match[2])) || !canonicalPath(match[1])) return null;
  const filename = path.posix.resolve(sourceRoot, match[1]);
  return filename.startsWith(`${sourceRoot}/`) ? { filename, line: Number(match[2]) } : null;
}

// Opt-in candidate profile. Only the Coverage location presentation is changed in memory.
export function evaluateLinkedOriginOccurrenceReport(markdown, mode, oracle, sourceRoot) {
  const raw = evaluateOriginOccurrenceReport(markdown, mode, oracle);
  const mappings = [];
  const errors = [];
  const base = {
    profile: 'coverage-links-09', raw, reportAcceptance: 'Not Evaluated',
    limitation: 'Candidate format/field compatibility only. Paths are compared lexically; files, symlinks, source evidence, severity, closure and complete report quality are not verified. The raw report/default result is retained.',
  };
  if (mode === 'fix') {
    return { ...base, compatibility: { status: 'Not Applicable', mappings, errors, validation: null }, adjudication: raw.adjudication };
  }
  if (typeof sourceRoot !== 'string' || !sourceRoot.startsWith('/') || !canonicalPath(sourceRoot)) {
    throw new TypeError('Coverage link profile requires an explicit canonical absolute POSIX source root.');
  }

  let inCoverage = false;
  let fence = null;
  const normalized = markdown.split('\n').map((original, index) => {
    const ending = original.endsWith('\r') ? '\r' : '';
    const line = ending ? original.slice(0, -1) : original;
    const delimiter = line.match(/^\s*(`{3,}|~{3,})/u)?.[1];
    if (delimiter) {
      if (!fence) fence = delimiter;
      else if (delimiter[0] === fence[0] && delimiter.length >= fence.length) fence = null;
      return original;
    }
    if (fence) return original;
    const heading = line.match(/^(#{1,2})\s+(.+?)\s*$/u);
    if (heading) {
      inCoverage = heading[1].length === 2 && coverageHeadings.has(heading[2].replace(/\s+#+$/u, ''));
      return original;
    }
    if (!inCoverage) return original;
    const link = line.match(/^(-[ \t]+\[([^\]\r\n]+)\])\((<[^<>\r\n]+>|[^()\s]+)\)([ \t]+.*)$/u);
    if (!link) return original;
    const targetText = link[3].startsWith('<') ? link[3].slice(1, -1) : link[3];
    const label = location(link[2], sourceRoot);
    const target = location(targetText, sourceRoot);
    if (!label || !target || label.filename !== target.filename || label.line !== target.line) {
      errors.push({ line: index + 1, type: 'coverage-link-location-mismatch-or-unsupported' });
      return original;
    }
    mappings.push({ line: index + 1, label: link[2], target: targetText });
    return link[1] + link[4] + ending;
  }).join('\n');

  const validation = mappings.length ? evaluateOriginOccurrenceReport(normalized, mode, oracle) : null;
  const candidate = (validation ?? raw).candidate;
  const adjudication = errors.length
    ? adjudicateOriginOccurrenceCandidate({ ...candidate, structurallyValid: false }, oracle)
    : (validation ?? raw).adjudication;
  return {
    ...base,
    compatibility: {
      status: errors.length ? 'Fail' : !mappings.length ? 'Not Applied' : candidate.structurallyValid ? 'Pass' : 'Fail',
      mappings, errors, validation,
    },
    adjudication,
  };
}
