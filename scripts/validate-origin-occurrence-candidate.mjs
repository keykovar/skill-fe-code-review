#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { validateReviewOutput } from './validate-review-output.mjs';

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
  // The prototype accepts one explicit state followed by prose; it does not infer prose semantics.
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

function validateLegacyFixStructure(markdown, blocks, errors) {
  if (!blocks.length || blocks.some((block) => block.kind !== 'previous')) {
    errors.push({ type: 'candidate-legacy-fix-shape-invalid' });
    return false;
  }
  const ids = blocks.map((block) => block.id).filter(Boolean);
  if (ids.length) {
    errors.push({ type: 'candidate-legacy-id-unexpected' });
    return false;
  }
  const statuses = markdown.match(/^\s*-\s*(?:Current status|当前状态)\s*[:：]\s*(Resolved|Partially Resolved|Unresolved|Cannot Verify)(?:\b|：|:)/gimu) ?? [];
  if (statuses.length !== blocks.length) {
    errors.push({ actual: statuses.length, expected: blocks.length, type: 'candidate-legacy-status-count' });
    return false;
  }
  return true;
}

export function validateOriginOccurrenceCandidate(markdown, mode) {
  const stable = validateReviewOutput(markdown, mode);
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
  const legacyFix = mode === 'fix' && blocks.some((block) => block.kind === 'previous' && !block.id);
  const legacyStructureValid = legacyFix && validateLegacyFixStructure(markdown, blocks, errors);
  // Keep the frozen stable parser and raw result; normalize only candidate Fix status emphasis in memory.
  const normalized = mode === 'fix' && !legacyFix ? markdown.replace(
    /^([ \t]*-[ \t]*(?:Current status|当前状态)[ \t]*[:：][ \t]*)\*\*((?:Resolved|Partially Resolved|Unresolved|Cannot Verify)(?:[:：](?:已解决|部分解决|未解决|无法验证))?)\*\*(?=[ \t]*(?:$|[:：]))/gimu,
    '$1$2',
  ) : markdown;
  const emphasisReport = normalized === markdown ? null : validateReviewOutput(normalized, mode);
  return {
    candidate: 'v0.6.0-origin-occurrence-prototype', mode,
    metadataValid: errors.length === 0,
    structurallyValid: ((emphasisReport ?? stable).valid || legacyStructureValid) && errors.length === 0,
    semanticStatus: 'Not Evaluated',
    baseValidation: { status: legacyStructureValid ? 'Pass (candidate-legacy)' : stable.valid ? 'Pass' : 'Fail', report: stable },
    legacyCompatibility: legacyFix ? (legacyStructureValid ? 'Pass' : 'Fail') : 'Not Applicable',
    emphasisCompatibility: { status: emphasisReport ? (emphasisReport.valid ? 'Pass' : 'Fail') : 'Not Applicable',
      report: emphasisReport },
    findings, errors,
    limitations: [
      'Field presence and count grammar do not establish truthful attribution, reachability, observation provenance, severity, or closure.',
      'Percentage literals in these two prototype fields require rewriting as counts or non-numeric limits, even when negated.',
      ...(emphasisReport ? ['Candidate-only Fix status emphasis is normalized in memory for structural checking; the raw stable result is retained. Neither check accepts summary counts, closure meaning or final-output quality.'] : []),
      ...(legacyFix ? ['The unchanged stable validator requires numbered Fix IDs; candidate-only legacy validation checks the prose shape without fabricating IDs. Stable-validator errors remain visible in baseValidation.report.'] : []),
    ],
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const [flag, mode, filename, ...extra] = process.argv.slice(2);
    if (flag !== '--mode' || !filename || extra.length) {
      throw new Error('Usage: node scripts/validate-origin-occurrence-candidate.mjs --mode <quick|deep|fix> <review.md>');
    }
    const result = validateOriginOccurrenceCandidate(fs.readFileSync(path.resolve(filename), 'utf8'), mode);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    process.exitCode = result.structurallyValid ? 0 : 1;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 2;
  }
}
