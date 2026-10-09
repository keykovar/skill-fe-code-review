#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { validateOriginOccurrenceLegacyFix } from './validate-origin-occurrence-legacy-fix.mjs';

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

function normalizeCoverage(markdown, mode, sourceRoot) {
  const mappings = [];
  const errors = [];
  if (mode === 'fix') return { markdown, mappings, errors };
  let inCoverage = false;
  let fence = null;
  const normalized = markdown.replace(/\r\n?/gu, '\n').split('\n').map((line, index) => {
    const delimiter = line.match(/^\s*(`{3,}|~{3,})/u)?.[1];
    if (delimiter) {
      if (!fence) fence = delimiter;
      else if (delimiter[0] === fence[0] && delimiter.length >= fence.length) fence = null;
      return line;
    }
    if (fence) return line;
    const heading = line.match(/^(#{1,2})\s+(.+?)\s*$/u);
    if (heading) {
      inCoverage = heading[1].length === 2 && coverageHeadings.has(heading[2].replace(/\s+#+$/u, ''));
      return line;
    }
    if (!inCoverage || !/^-\s+\[[^\]]+\]\(/u.test(line)) return line;
    if (sourceRoot === undefined) {
      throw new TypeError('Linked Coverage requires an independently supplied canonical absolute POSIX source root.');
    }
    const link = line.match(/^(-[ \t]+\[([^\]\r\n]+)\])\((<[^<>\r\n]+>|[^()\s]+)\)([ \t]+.*)$/u);
    const targetText = link?.[3].startsWith('<') ? link[3].slice(1, -1) : link?.[3];
    const label = link && location(link[2], sourceRoot);
    const target = targetText && location(targetText, sourceRoot);
    if (!label || !target || label.filename !== target.filename || label.line !== target.line) {
      errors.push({ line: index + 1, type: 'coverage-link-location-mismatch-or-unsupported' });
      return line;
    }
    mappings.push({ line: index + 1, label: link[2], target: targetText });
    return link[1] + link[4];
  }).join('\n');
  return { markdown: normalized, mappings, errors };
}

// Historical wrappers remain frozen. This explicit profile checks structure without a synthetic oracle.
export function validateOriginOccurrenceIntegrated(markdown, mode, options = {}) {
  if (!['quick', 'deep', 'fix'].includes(mode)) throw new TypeError('Mode must be quick, deep or fix.');
  if (!options || typeof options !== 'object' || Array.isArray(options) ||
    Object.keys(options).some((key) => key !== 'sourceRoot')) throw new TypeError('Only sourceRoot is supported.');
  const { sourceRoot } = options;
  if (sourceRoot !== undefined && (typeof sourceRoot !== 'string' || !sourceRoot.startsWith('/') || !canonicalPath(sourceRoot))) {
    throw new TypeError('Coverage links require a canonical absolute POSIX source root.');
  }
  const original = validateOriginOccurrenceLegacyFix(markdown, mode);
  const coverage = normalizeCoverage(markdown, mode, sourceRoot);
  const selected = coverage.mappings.length
    ? validateOriginOccurrenceLegacyFix(coverage.markdown, mode)
    : original;
  const candidate = {
    ...selected.candidate,
    structurallyValid: selected.candidate.structurallyValid && !coverage.errors.length,
    errors: [...selected.candidate.errors, ...coverage.errors],
  };
  return {
    profile: 'integration-11', raw: original.raw, candidate,
    compatibility: {
      coverage: {
        status: mode === 'fix' ? 'Not Applicable' : coverage.errors.length ? 'Fail' :
          !coverage.mappings.length ? 'Not Applied' : candidate.structurallyValid ? 'Pass' : 'Fail',
        mappings: coverage.mappings, errors: coverage.errors,
      },
      legacy: selected.compatibility,
    },
    reportAcceptance: 'Not Evaluated',
    limitation: 'Structure and field grammar only. Local links are compared lexically, without file access or symlink resolution. Attribution, observation provenance, severity, tallies, closure and recommendations require separate evidence assessment. Raw results and reports remain unchanged.',
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const args = process.argv.slice(2);
    const [profileFlag, profile, modeFlag, mode, ...rest] = args;
    const linked = rest[0] === '--source-root';
    const filename = rest[linked ? 2 : 0];
    if (profileFlag !== '--profile' || profile !== 'integration-11' || modeFlag !== '--mode' ||
      rest.length !== (linked ? 3 : 1) || !filename || filename.startsWith('--')) {
      throw new Error('Usage: node scripts/validate-origin-occurrence-integrated.mjs --profile integration-11 --mode <quick|deep|fix> [--source-root <root>] <review.md>');
    }
    const result = validateOriginOccurrenceIntegrated(fs.readFileSync(path.resolve(filename), 'utf8'), mode,
      linked ? { sourceRoot: rest[1] } : {});
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    process.exitCode = result.candidate.structurallyValid ? 0 : 1;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 2;
  }
}
