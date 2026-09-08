const coverageHeadings = new Set([
  'Changed-Condition Coverage',
  'Changed-Condition Coverage：变更条件覆盖',
  '变更条件覆盖',
]);
const coverageDispositionPattern =
  /^(?:\[F-\d{3}\]|Behavior Preserving(?:\s*[:：]\s*行为保持)?|行为保持|Cannot Verify(?:\s*[:：]\s*无法验证)?|无法验证)$/iu;
const coverageEntryPattern =
  /^-\s+\[[^\]\r\n]+:\d+\]\s+(.+?)\s*[;；]\s*(?:Disposition|结论)\s*[:：]\s*(.+?)(?:\s*[;；]\s*(?:Merge key|合并依据)\s*[:：]\s*\S(?:.*\S)?)?\s*$/iu;
const coverageTransitionPattern =
  /^\S(?:.*\S)?\s*[:：]\s*\S(?:.*\S)?\s*(?:->|→)\s*\S(?:.*\S)?$/u;

function headingAt(line, index) {
  const match = line.match(/^(#{2,6})\s+(.+?)\s*$/u);
  return match
    ? {
        index,
        level: match[1].length,
        text: match[2].replace(/\s+#+$/u, '').trim(),
      }
    : null;
}

export function inspectStrictCoverage(markdown) {
  const lines = markdown.split(/\r?\n/u);
  const headings = lines.map(headingAt).filter(Boolean);
  const sections = headings.filter(({ text }) => coverageHeadings.has(text));
  if (sections.length !== 1) {
    return [];
  }

  const section = sections[0];
  const nextTopLevel = headings.find(
    ({ index, level }) => index > section.index && level <= section.level,
  );
  const sectionLines = lines
    .slice(section.index + 1, nextTopLevel?.index ?? lines.length)
    .map((line, offset) => ({ line, lineNumber: section.index + offset + 2 }))
    .filter(({ line }) => line.trim().length > 0);
  const errors = [];

  for (const entry of sectionLines) {
    if (!/^\s*-\s+\S/u.test(entry.line)) {
      errors.push({ line: entry.lineNumber, type: 'coverage-ledger-unexpected-content' });
      continue;
    }

    const arrowCount = [...entry.line.matchAll(/(?:->|→)/gu)].length;
    if (arrowCount > 1) {
      errors.push({
        actual: arrowCount,
        expected: 1,
        line: entry.lineNumber,
        type: 'coverage-ledger-invalid-before-after-count',
      });
    }

    const shape = entry.line.match(coverageEntryPattern);
    if (!shape || arrowCount !== 1 || !coverageTransitionPattern.test(shape[1])) {
      errors.push({ line: entry.lineNumber, type: 'coverage-ledger-invalid-entry-shape' });
    }
    if (shape && !coverageDispositionPattern.test(shape[2].trim())) {
      errors.push({ line: entry.lineNumber, type: 'coverage-ledger-invalid-disposition' });
    }
  }

  return errors;
}
