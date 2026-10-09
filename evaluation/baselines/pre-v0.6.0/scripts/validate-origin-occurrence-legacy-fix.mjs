import { validateOriginOccurrenceCandidate } from './validate-origin-occurrence-candidate.mjs';
import { validateReviewOutput } from './validate-review-output.mjs';

const verificationHeading = /^## (?:Issue Verification(?:：问题验证)?|问题验证)$/u;
const oldLegacyErrors = new Set([
  'candidate-legacy-fix-shape-invalid', 'candidate-legacy-id-unexpected', 'candidate-legacy-status-count',
]);
const statusLine = /^[ \t]+-[ \t]*(?:Current status|当前状态)\s*[:：]\s*(.*?)\s*$/iu;
const statusValue = /^(Resolved|Partially Resolved|Unresolved|Cannot Verify)(?=$|[\s:：])/iu;

function normalizeStatusEmphasis(line) {
  return line.replace(
    /^([ \t]*-[ \t]*(?:Current status|当前状态)[ \t]*[:：][ \t]*)\*\*((?:Resolved|Partially Resolved|Unresolved|Cannot Verify)(?:[:：](?:已解决|部分解决|未解决|无法验证))?)\*\*(?=[ \t]*(?:$|[:：]))/iu,
    '$1$2',
  );
}

function outsideFences(lines) {
  let fence = null;
  return lines.map((line) => {
    const delimiter = line.match(/^\s*(`{3,}|~{3,})/u)?.[1];
    if (delimiter) {
      if (!fence) fence = delimiter;
      else if (delimiter[0] === fence[0] && delimiter.length >= fence.length) fence = null;
      return '';
    }
    return fence ? '' : line;
  });
}

// Explicit evaluator revision; the pinned original API and all non-legacy results stay unchanged.
export function validateOriginOccurrenceLegacyFix(markdown, mode) {
  const raw = validateOriginOccurrenceCandidate(markdown, mode);
  const previous = raw.findings.filter((finding) => finding.kind === 'previous');
  const legacy = previous.filter((finding) => !finding.id);
  const base = { profile: 'legacy-fix-10', raw };
  if (mode !== 'fix' || !legacy.length) {
    return { ...base, candidate: raw, compatibility: { status: 'Not Applicable', errors: [], validation: null } };
  }

  const lines = markdown.replace(/\r\n?/gu, '\n').split('\n');
  const visible = outsideFences(lines);
  const sections = visible.flatMap((line, index) => verificationHeading.test(line) ? [index] : []);
  const errors = [];
  const projected = [...lines];
  const sectionStart = sections[0] ?? -1;
  const nextSection = visible.findIndex((line, index) => index > sectionStart && /^#{1,2}\s/u.test(line));
  const sectionEnd = nextSection < 0 ? lines.length : nextSection;
  if (sections.length !== 1) errors.push({ type: 'legacy-verification-section-count', actual: sections.length, expected: 1 });

  const ownedStatusLines = new Set();
  for (const finding of previous) {
    const start = finding.line - 1;
    const next = visible.findIndex((line, index) => index > start && /^(?:#{1,6}\s|-\s+\S)/u.test(line));
    const end = next < 0 ? lines.length : next;
    if (start <= sectionStart || start >= sectionEnd || end > sectionEnd) {
      errors.push({ type: 'legacy-item-outside-verification', line: finding.line });
    }
    if (!finding.id && /^-\s+\[F-/u.test(visible[start])) {
      errors.push({ type: 'legacy-malformed-finding-id', line: finding.line });
    }
    const statuses = [];
    for (let i = start + 1; i < end; i += 1) {
      const match = normalizeStatusEmphasis(visible[i]).match(statusLine);
      if (!match) continue;
      statuses.push({ line: i + 1, value: match[1] });
      ownedStatusLines.add(i);
    }
    if (statuses.length !== 1) {
      errors.push({ type: 'legacy-item-status-count', line: finding.line, actual: statuses.length, expected: 1 });
    }
    for (const status of statuses) {
      if (!statusValue.test(status.value)) errors.push({ type: 'legacy-status-invalid', line: status.line });
    }
    // Remove only independently checked legacy items from a validation-only shadow; invent no IDs.
    if (!finding.id) for (let i = start; i < end; i += 1) projected[i] = '';
  }
  for (const [index, line] of visible.entries()) {
    if (statusLine.test(line) && !ownedStatusLines.has(index)) {
      errors.push({ type: 'legacy-status-outside-item', line: index + 1 });
    }
  }

  const suppliedIds = raw.findings.map((finding) => finding.id).filter(Boolean);
  if (new Set(suppliedIds).size !== suppliedIds.length) errors.push({ type: 'legacy-finding-id-duplicate' });
  const highestPreviousId = Math.max(0, ...previous.map((finding) => Number(finding.id?.slice(2) ?? 0)));
  const regressions = raw.findings.filter((finding) => finding.kind === 'regression');
  for (const [index, finding] of regressions.entries()) {
    if (finding.id !== `F-${String(highestPreviousId + index + 1).padStart(3, '0')}`) {
      errors.push({ type: 'legacy-regression-id-order', line: finding.line });
    }
  }

  // Only ID/status errors can be reconciled; unrelated raw failures remain fatal even after projection.
  const rawErrors = raw.baseValidation.report.errors.filter((error) =>
    !['fix-verification-empty', 'fix-finding-status-count'].includes(error.type));
  errors.push(...rawErrors);
  const validation = validateReviewOutput(projected.map(normalizeStatusEmphasis).join('\n'), 'fix');
  errors.push(...validation.errors.filter((error) => !(error.type === 'fix-verification-empty' && previous.length === legacy.length && sections.length === 1)));
  const metadataErrors = raw.errors.filter((error) => !oldLegacyErrors.has(error.type));
  const structurallyValid = !errors.length && !metadataErrors.length;
  const candidate = {
    ...raw, metadataValid: !metadataErrors.length, structurallyValid, errors: metadataErrors,
    baseValidation: { status: raw.baseValidation.report.valid ? 'Pass' : 'Fail', report: raw.baseValidation.report },
    legacyCompatibility: structurallyValid ? 'Pass' : 'Fail',
    limitations: [...raw.limitations,
      'Explicit legacy-fix-10 checks item-owned statuses and preserves unrelated raw failures. Its in-memory projection adds no IDs and does not rewrite the report. Severity, supplied-history identity, closure and recommendation meaning still require evidence assessment.'],
  };
  return { ...base, candidate, compatibility: { status: structurallyValid ? 'Pass' : 'Fail', errors, validation } };
}
