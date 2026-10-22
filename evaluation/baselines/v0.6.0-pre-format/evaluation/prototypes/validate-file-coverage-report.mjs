import { validateReviewOutput } from '../../scripts/validate-review-output.mjs';
import { validateFileCoverage } from './file-coverage.mjs';

const states = ['Reviewed', 'Partial', 'Deferred', 'Cannot Verify'];
const count = '(0|[1-9][0-9]*)';
const totals = `Reviewed ${count} / Partial ${count} / Deferred ${count} / Cannot Verify ${count}`;
const quoted = '("(?:[^"\\\\\\r\\n]|\\\\[^\\r\\n])*")';
const grammar = {
  en: {
    summary: new RegExp(`^- File coverage: inventory (Complete|Incomplete); (?:${count} changed paths|at least ${count} known changed paths); ${totals}\\.$`, 'u'),
    detail: new RegExp(`^- File gap: (Partial|Deferred|Cannot Verify); path ${quoted}; reason (.*)$`, 'u'),
    gap: /^- Inventory gap: (.*)$/u,
    scope: { quick: 'Review Scope', deep: 'Change Understanding' },
  },
  'zh-CN': {
    summary: new RegExp(`^- 文件覆盖：清单 (Complete|Incomplete)；(?:${count} 个变更路径|至少 ${count} 个已知变更路径)；${totals}。$`, 'u'),
    detail: new RegExp(`^- 文件缺口：(Partial|Deferred|Cannot Verify)；路径 ${quoted}；原因 (.*)$`, 'u'),
    gap: /^- 清单缺口：(.*)$/u,
    scope: { quick: '审查范围', deep: '变更理解' },
  },
};
const meaningful = (text) => !!text?.trim() && !/^(?:\.{2,}|…+|TODO|TBD|N\/A|none|待补充)$/iu.test(text.trim());
const marker = /^(?:[-*+]\s+|#{1,6}\s+)?(?:File[ -]?coverage|File gap|Inventory gap|文件覆盖|文件缺口|清单缺口)(?=$|\s|[:：])/iu;

function visibleLines(markdown) {
  let fence = null;
  let section = '';
  let level = 0;
  return markdown.replace(/\r\n?/gu, '\n').split('\n').flatMap((line, index) => {
    const delimiter = line.match(/^\s*(`{3,}|~{3,})/u)?.[1];
    if (delimiter) {
      if (!fence) fence = delimiter;
      else if (delimiter[0] === fence[0] && delimiter.length >= fence.length) fence = null;
      return [];
    }
    if (fence) return [];
    const heading = line.match(/^(#{1,6})\s+(.+?)\s*$/u);
    if (heading) { level = heading[1].length; section = heading[2]; }
    return [{ text: line, line: index + 1, section, level }];
  });
}

// inventory/accounting are independently frozen evaluator inputs, not reviewer JSON output.
export function validateFileCoverageReport(markdown, mode, options = {}) {
  const { inventory, accounting, sourceRoot, language } = options;
  if (!grammar[language]) throw new TypeError('Explicit language en or zh-CN is required.');
  const base = validateReviewOutput(markdown, mode, { profile: 'v0.6.0', sourceRoot });
  const errors = [];
  const fail = (code, line) => errors.push(line === undefined ? { code } : { code, line });
  const lines = visibleLines(markdown);
  const fields = lines.filter((item) => marker.test(item.text.trim()));
  let accountingResult = null;
  let summary = null;
  const details = [];
  const gaps = [];
  if (mode === 'fix') {
    if (fields.length || inventory !== undefined || accounting !== undefined) fail('fix-coverage-forbidden');
  } else {
    accountingResult = validateFileCoverage(inventory, accounting);
    if (!accountingResult.valid) errors.push(...accountingResult.errors);
    if (accounting?.mode !== mode) fail('accounting-mode-mismatch');
    const syntax = grammar[language];
    if (lines.filter((item) => item.level === 2 && item.text === '## ' + syntax.scope[mode]).length !== 1) {
      fail('coverage-scope-heading-count');
    }
    for (const item of fields) {
      if (item.section !== syntax.scope[mode] || item.level !== 2 || item.text.startsWith('#')) {
        fail('coverage-field-outside-scope', item.line);
      }
      const sums = item.text.match(syntax.summary);
      const detail = item.text.match(syntax.detail);
      const gap = item.text.match(syntax.gap);
      if (sums) {
        if (summary) fail('duplicate-coverage-summary', item.line);
        const completeForm = sums[2] !== undefined;
        const numbers = [sums[2] ?? sums[3], ...sums.slice(4)].map(Number);
        if (numbers.some((number) => !Number.isSafeInteger(number))) fail('unsafe-coverage-count', item.line);
        if ((sums[1] === 'Complete') !== completeForm) fail('coverage-count-form-mismatch', item.line);
        summary = { inventory: sums[1], knownFiles: numbers[0], totalFiles: completeForm ? numbers[0] : null,
          counts: Object.fromEntries(states.map((state, index) => [state, numbers[index + 1]])) };
      } else if (detail) {
        try {
          const name = JSON.parse(detail[2]);
          if (typeof name !== 'string' || !name.isWellFormed()) throw new Error('Invalid path');
          if (!meaningful(detail[3])) fail('missing-file-gap-reason', item.line);
          details.push({ path: name, state: detail[1], reason: detail[3], line: item.line });
        } catch { fail('invalid-file-gap-path', item.line); }
      } else if (gap) {
        if (!meaningful(gap[1])) fail('missing-inventory-gap-reason', item.line);
        gaps.push({ reason: gap[1], line: item.line });
      } else fail('invalid-coverage-field-grammar', item.line);
    }
    if (!summary) fail('missing-coverage-summary');
    if (accountingResult.valid) {
      if (summary && (summary.inventory !== accounting.summary.inventory ||
        summary.knownFiles !== accounting.summary.knownFiles || summary.totalFiles !== accounting.summary.totalFiles ||
        states.some((state) => summary.counts[state] !== accounting.summary.counts[state]))) fail('coverage-summary-mismatch');
      const expected = new Map(accounting.entries.filter((entry) => entry.state !== 'Reviewed').map((entry) => [entry.path, entry.state]));
      const seen = new Set();
      for (const detail of details) {
        if (seen.has(detail.path)) fail('duplicate-file-gap', detail.line);
        seen.add(detail.path);
        if (!expected.has(detail.path)) fail('unexpected-file-gap', detail.line);
        else if (expected.get(detail.path) !== detail.state) fail('file-gap-state-mismatch', detail.line);
      }
      for (const name of expected.keys()) if (!seen.has(name)) errors.push({ code: 'missing-file-gap', path: name });
      if (gaps.length !== (inventory.complete ? 0 : 1)) fail('inventory-gap-count');
    }
  }
  const valid = base.valid && errors.length === 0;
  return {
    profile: 'file-coverage-candidate', mode, language, valid, structurallyValid: valid,
    base, accounting: accountingResult, coverage: { summary, details, inventoryGaps: gaps, errors },
    semanticStatus: 'Not Evaluated', reportAcceptance: 'Not Evaluated',
    limitations: [
      'Checks the v0.6.0 report plus file counts, gap membership, language and placement against independent inventory/accounting; it does not read source or execute tools.',
      'Accounting evidence, gap explanations, requested-scope prose, source identity, completeness and recommendation meaning require independent adjudication; structural validity is not semantic acceptance.',
      'Reviewed claims and read traces do not prove every changed contract was examined. Packet counts do not establish repository completeness.',
    ],
  };
}
