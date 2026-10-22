import path from 'node:path';

// Maintained v0.6.0 rules consolidated from the accepted integration-12 profile.
// Historical candidate modules remain frozen and are not invoked by this implementation.
const originStates = ['New', 'Amplified', 'Retained', 'Unknown'];
const reproductionStates = ['Observed', 'Not Run', 'Cannot Verify', 'Not Applicable'];
const translatedStates = { New: '本次引入', Amplified: '本次放大', Retained: '历史遗留', Unknown: '无法确定',
  Observed: '已观测', 'Not Run': '未执行', 'Cannot Verify': '无法验证', 'Not Applicable': '不适用' };
const metadataLine = /^\s+-\s*(Origin|问题来源(?:\s*\/\s*Origin)?|Reproduction|复现观测(?:\s*\/\s*Reproduction)?)\s*[:：]\s*(.*?)\s*$/u;

function findingBlocks(markdown, mode, errors) {
  const blocks = [];
  let section = '';
  let severity = null;
  let current = null;
  let fence = null;
  for (const [index, line] of markdown.replace(/\r\n?/gu, '\n').split('\n').entries()) {
    const delimiter = line.match(/^\s*(`{3,}|~{3,})/u)?.[1];
    if (delimiter) {
      if (!fence) fence = delimiter;
      else if (delimiter[0] === fence[0] && delimiter.length >= fence.length) fence = null;
      continue;
    }
    if (fence) continue;
    const heading = line.match(/^(#{2,6})\s+(.+?)\s*$/u);
    if (heading) {
      current = null;
      if (heading[1].length === 2) section = heading[2];
      severity = heading[2].match(/^(Blocking|Risk|Improve)(?:\b|：|:)/u)?.[1] ?? null;
      continue;
    }
    const previous = mode === 'fix' && /^(Issue Verification(?:：问题验证)?|问题验证)$/u.test(section);
    const regression = mode === 'fix' && /^(New Regression(?:：新增回归)?|新增回归)$/u.test(section);
    const eligible = mode === 'fix' ? previous || (regression && severity) : severity;
    const header = eligible && line.match(/^-\s+(.+)$/u);
    if (header) {
      const id = header[1].match(/^\[(F-\d{3})\]\s+/u)?.[1] ?? null;
      const numbered = /^\[F-\d{3}\]\s+\[[^\]]+\](?:\([^\r\n)]+\))?\s+.+$/u.test(header[1]);
      if (!numbered && !previous) {
        errors.push({ line: index + 1, type: 'candidate-finding-header-invalid' });
        current = null;
        continue;
      }
      current = { id, line: index + 1, title: header[1], severity,
        kind: previous ? 'previous' : regression ? 'regression' : 'finding', fields: [] };
      blocks.push(current);
      continue;
    }
    const field = line.match(metadataLine);
    if (field) {
      if (!current) errors.push({ line: index + 1, type: 'candidate-metadata-outside-finding' });
      else current.fields.push({ key: /^(?:Origin|问题来源)(?:$|\s*\/)/u.test(field[1]) ? 'origin' : 'reproduction',
        value: field[2], line: index + 1 });
    }
  }
  return blocks;
}

function stateAndEvidence(value, states) {
  // Parse explicit states and evidence without inferring the meaning of the prose.
  const match = value.match(new RegExp(`^(${states.join('|')})(?=$|[\\s:：;；-])`, 'u'));
  if (!match) return null;
  const withoutSeparator = (text) => text.trim().replace(/^(?:[:：;；]\s*|-\s+)/u, '').trim();
  let evidence = withoutSeparator(value.slice(match[0].length));
  const translation = evidence.match(new RegExp(`^${translatedStates[match[1]]}(?=$|[\\s:：;；-])`, 'u'));
  if (translation) evidence = withoutSeparator(evidence.slice(translation[0].length));
  if (!evidence || /^(?:\.{2,}|…+|待补充|TODO|TBD|N\/A|none)$/iu.test(evidence)) return null;
  return { state: match[1], evidence };
}

function parseReproduction(value, finding, errors) {
  const groups = [];
  for (const fragment of value.split(/\s+\|\s+/u)) {
    const group = fragment.match(/^\[([^\]]+)\]\s*(.+)$/u);
    const context = group?.[1].trim() ?? null;
    const parsed = stateAndEvidence(group?.[2] ?? fragment, reproductionStates);
    if (!parsed) {
      errors.push({ line: finding.line, type: 'candidate-reproduction-state-or-evidence-missing' });
      continue;
    }
    const normalized = parsed.evidence.normalize('NFKC').replace(/−/gu, '-');
    const counts = [...normalized.matchAll(/(?<![A-Za-z0-9_.+-])([+-]?\s*\d+(?:\.\d+)?)\s*\/\s*([+-]?\s*\d+(?:\.\d+)?)(?![A-Za-z0-9_.])/gu)];
    if (parsed.state !== 'Observed') {
      if (counts.length) errors.push({ line: finding.line, type: 'candidate-count-without-observation' });
      groups.push({ context, ...parsed, count: null });
      continue;
    }
    if (counts.length !== 1) {
      errors.push({ line: finding.line, type: 'candidate-observation-count-required' });
      continue;
    }
    const [failures, trials] = counts[0].slice(1).map(Number);
    if (!Number.isSafeInteger(failures) || !Number.isSafeInteger(trials) || failures < 0 || trials <= 0 || failures > trials ||
      !counts[0].slice(1).every((part) => /^\d+$/u.test(part.trim()))) {
      errors.push({ line: finding.line, type: 'candidate-observation-count-invalid' });
      continue;
    }
    const explanation = normalized.replace(counts[0][0], '').replace(/[\s:;,.()\[\]-]/gu, '');
    if (!explanation) errors.push({ line: finding.line, type: 'candidate-observation-context-missing' });
    groups.push({ context, ...parsed, count: { failures, trials } });
  }
  if (groups.length > 1 && (groups.some((group) => !group.context) ||
    new Set(groups.map((group) => group.context)).size !== groups.length)) {
    errors.push({ line: finding.line, type: 'candidate-observation-groups-ambiguous' });
  }
  return groups;
}


function inspectMetadata(markdown, mode) {
  const errors = [];
  const blocks = findingBlocks(markdown, mode, errors);
  const findings = [];
  for (const block of blocks) {
    const values = {};
    for (const key of ['origin', 'reproduction']) {
      const fields = block.fields.filter((field) => field.key === key);
      if (fields.length !== 1) {
        errors.push({ line: block.line, type: `candidate-${key}-field-count`, actual: fields.length });
      } else values[key] = fields[0].value;
    }
    const origin = values.origin === undefined ? null : stateAndEvidence(values.origin, originStates);
    if (values.origin !== undefined && !origin) errors.push({ line: block.line, type: 'candidate-origin-state-or-evidence-missing' });
    if (block.kind === 'regression' && origin && !['New', 'Amplified'].includes(origin.state)) {
      errors.push({ line: block.line, type: 'candidate-regression-origin-unsupported' });
    }
    for (const value of Object.values(values)) {
      if (/(?:\d+(?:\.\d+)?\s*%|百分之\s*[\d一二三四五六七八九十百零])/u.test(value.normalize('NFKC'))) {
        errors.push({ line: block.line, type: 'candidate-percentage-literal-unsupported' });
      }
    }
    const reproduction = values.reproduction === undefined ? [] : parseReproduction(values.reproduction, block, errors);
    findings.push({ id: block.id, line: block.line, kind: block.kind, severity: block.severity, origin, reproduction });
  }
  return { findings, errors };
}

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


const marker = /^(?:-[ \t]+)?(无明确问题。|No clear issue\.)[ \t]*$/u;
const severityHeading = /^(Blocking(?:：必须修改)?|Risk(?:：建议修改)?|Improve(?:：可优化)?)$/u;
const findingsHeading = /^(Findings(?:：问题列表)?|问题列表)$/u;
const regressionHeading = /^(New Regression(?:：新增回归)?|新增回归)$/u;

function emptySectionView(markdown, mode) {
  const lines = markdown.replace(/\r\n?/gu, '\n').split('\n');
  const projected = [...lines];
  const mappings = [];
  const errors = [];
  let topHeading = '';
  let section = null;
  let fence = null;

  const finish = () => {
    if (!section?.markers.length) return;
    if (!section.eligible) {
      errors.push({ line: section.start + 1, type: 'empty-marker-section-unsupported' });
    } else if (section.content.length !== 1 || section.markers.length !== 1) {
      errors.push({ line: section.start + 1, type: 'empty-marker-mixed-or-duplicate-content' });
    } else {
      const index = section.markers[0];
      if (lines[index].startsWith('-')) {
        projected[index] = lines[index].match(marker)[1];
        mappings.push({ line: index + 1, original: lines[index], normalized: projected[index] });
      }
    }
  };

  for (const [index, line] of lines.entries()) {
    const delimiter = line.match(/^\s*(`{3,}|~{3,})/u)?.[1];
    if (delimiter || fence) {
      // Fenced text is never a marker; it still makes an otherwise empty section non-empty.
      if (section && line.trim()) section.content.push(index);
      if (delimiter) {
        if (!fence) fence = delimiter;
        else if (delimiter[0] === fence[0] && delimiter.length >= fence.length) fence = null;
      }
      continue;
    }
    const heading = line.match(/^(#{1,6})\s+(.+?)\s*$/u);
    if (heading) {
      const level = heading[1].length;
      const title = heading[2].replace(/\s+#+$/u, '');
      if (section && level <= section.level) { finish(); section = null; }
      if (level <= 2) topHeading = level === 2 ? title : '';
      if (section) {
        section.content.push(index);
      } else if (severityHeading.test(title)) {
        const eligible = mode === 'quick' ? level === 2 : level === 3 &&
          (mode === 'deep' ? findingsHeading : regressionHeading).test(topHeading);
        section = { start: index, level, eligible, markers: [], content: [] };
      }
      continue;
    }
    if (section && line.trim()) {
      section.content.push(index);
      if (marker.test(line)) section.markers.push(index);
    }
  }
  finish();
  return { markdown: projected.join('\n'), mappings, errors };
}


const verificationHeading = /^## (?:Issue Verification(?:：问题验证)?|问题验证)$/u;
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


function inspectFixStructure(markdown, findings, structure, validateReviewOutput) {
  const previous = findings.filter((finding) => finding.kind === 'previous');
  const legacy = previous.filter((finding) => !finding.id);
  if (!legacy.length) {
    const normalized = markdown.split('\n').map(normalizeStatusEmphasis).join('\n');
    const selected = normalized === markdown ? structure : validateReviewOutput(normalized, 'fix');
    return { errors: selected.errors, validation: selected,
      legacy: { status: 'Not Applicable', errors: [], validation: null },
      emphasis: { status: normalized === markdown ? 'Not Applied' : selected.valid ? 'Pass' : 'Fail' } };
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

  const suppliedIds = findings.map((finding) => finding.id).filter(Boolean);
  if (new Set(suppliedIds).size !== suppliedIds.length) errors.push({ type: 'legacy-finding-id-duplicate' });
  const highestPreviousId = Math.max(0, ...previous.map((finding) => Number(finding.id?.slice(2) ?? 0)));
  const regressions = findings.filter((finding) => finding.kind === 'regression');
  for (const [index, finding] of regressions.entries()) {
    if (finding.id !== `F-${String(highestPreviousId + index + 1).padStart(3, '0')}`) {
      errors.push({ type: 'legacy-regression-id-order', line: finding.line });
    }
  }

  // Only ID/status errors can be reconciled; unrelated raw failures remain fatal even after projection.
  const rawErrors = structure.errors.filter((error) =>
    !['fix-verification-empty', 'fix-finding-status-count'].includes(error.type));
  errors.push(...rawErrors);
  const validation = validateReviewOutput(projected.map(normalizeStatusEmphasis).join('\n'), 'fix');
  errors.push(...validation.errors.filter((error) => !(error.type === 'fix-verification-empty' && previous.length === legacy.length && sections.length === 1)));
  return { errors, validation,
    legacy: { status: errors.length ? 'Fail' : 'Pass', errors, validation },
    emphasis: { status: 'Included In Legacy Check' } };
}

export function validateV060Report(markdown, mode, options, validateLegacy) {
  const { sourceRoot } = options;
  if (sourceRoot !== undefined && (typeof sourceRoot !== 'string' || !sourceRoot.startsWith('/') || !canonicalPath(sourceRoot))) {
    throw new TypeError('Coverage links require a canonical absolute POSIX source root.');
  }
  const raw = validateLegacy(markdown, mode);
  const empty = emptySectionView(markdown, mode);
  const coverage = normalizeCoverage(empty.markdown, mode, sourceRoot);
  const metadata = inspectMetadata(coverage.markdown, mode);
  const structure = validateLegacy(coverage.markdown, mode);
  const fix = mode === 'fix' ? inspectFixStructure(coverage.markdown, metadata.findings, structure, validateLegacy) : null;
  const errors = [...(fix?.errors ?? structure.errors), ...metadata.errors, ...coverage.errors, ...empty.errors];
  const valid = errors.length === 0;
  return {
    profile: 'v0.6.0', mode, valid, structurallyValid: valid, metadataValid: metadata.errors.length === 0,
    raw, structure: fix?.validation ?? structure, findings: metadata.findings, errors,
    compatibility: {
      coverage: { status: mode === 'fix' ? 'Not Applicable' : coverage.errors.length ? 'Fail' :
        !coverage.mappings.length ? 'Not Applied' : valid ? 'Pass' : 'Fail', mappings: coverage.mappings, errors: coverage.errors },
      legacy: fix?.legacy ?? { status: 'Not Applicable', errors: [], validation: null },
      emphasis: fix?.emphasis ?? { status: 'Not Applicable' },
      emptySections: { status: empty.errors.length ? 'Fail' : empty.mappings.length ? 'Applied' : 'Not Applied',
        mappings: empty.mappings, errors: empty.errors },
    },
    semanticStatus: 'Not Evaluated', reportAcceptance: 'Not Evaluated',
    limitations: [
      'Checks structure and Origin/Reproduction field grammar only; it does not verify source truth, attribution, severity, observation provenance, closure, summary tallies or recommendation meaning.',
      'Counts are completed failures/trials, not production probability. Explicit observation groups are preserved, never pooled.',
      'Coverage locations are compared lexically using the supplied POSIX root; no files, symlinks, network or credentials are read.',
      'The raw legacy result and report remain unchanged. Presentation views preserve original line numbers.',
    ],
  };
}
