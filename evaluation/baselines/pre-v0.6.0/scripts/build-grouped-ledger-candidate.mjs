#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { restoreCandidate16SkillContent } from './prepare-grouped-ledger-candidate-16.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const expectedHashes = {
  deep: '44d1fb20cfc2f3b9814943d5254e2349387a8b17832eab27b618a2a2a3bedc36',
  fix: '8380289a00f3c2f1a1ea740bc824b1a53813d6839b3957cae3c54c0e27757d33',
  groupedValidator: 'a0e429e9ea53dc94ff75d8e573b670e1cdcf30012d07ff31210a968515342998',
  quick: '91fe031195f6018ecbf29c48aab5fc26477f9262b40eb7dd4d149b2294c7a9ed',
  reviewOutputValidator: '0293481ada8e2c722730f02f2663244d3c446e4d0a46dd9c9bc63ed030e81b8f',
  skill: 'a8b81157abe92c944143a28386ffd9f86c25711ee7ab40d17e2ea0b6a514cb7e',
};

const skillBefore =
  'Backfill final IDs into the visible ledger and cross-section references. Group ledger entries by final ID: repeated IDs require the same non-empty `Merge key` / `合并依据` on every entry; single IDs require none. Reconcile every actionable statement outside severity sections: reference a final ID or remove it.';
const skillAfter =
  'Backfill final IDs into visible ledger groups and cross-section references. Render each final ID once as a group containing its changed conditions. A multi-condition Finding group requires one non-empty `Merge basis` / `合并依据` stating the indivisible repair or acceptance result; omit it for single-condition and non-Finding groups. Reconcile every actionable statement outside severity sections: reference a final ID or remove it.';
const renderingBefore =
  'Apply the `Finding Requirements` finalization sequence before rendering. Keep discovery keys and acceptance sentences internal; expose the ledger only after final IDs are backfilled. Render each independently assessable changed condition, return-value contract, or observable behavior in its own `before -> after` entry, ending in one final Finding ID, `Behavior Preserving`, or `Cannot Verify`. Never summarize independent changes. Complete the repeated-ID ledger check in `SKILL.md` before responding.';
const renderingAfter =
  'Apply the `Finding Requirements` finalization sequence before rendering. Keep discovery keys and acceptance sentences internal; expose the ledger only after final IDs are backfilled. Render one group per final Finding ID, `Behavior Preserving`, or `Cannot Verify`, then place every independently assessable changed condition, return-value contract, or observable behavior under its group as a separate `before -> after` entry. Never summarize independent changes. Apply the group-owned merge-basis rule in `SKILL.md` before responding.';
const chineseBefore =
  '- [file:line] 条件：修改前 -> 修改后；结论：[F-001] / Behavior Preserving：行为保持 / Cannot Verify：无法验证；合并依据：<仅重复 ID 时填写同一简短键>';
const chineseAfter = `- [F-001]
  - 合并依据：<仅多个条件确属同一原子修复时填写一次；单条件省略>
  - [file:line] 条件：修改前 -> 修改后
- Behavior Preserving：行为保持
  - [file:line] 条件：修改前 -> 修改后
- Cannot Verify：无法验证
  - [file:line] 条件：修改前 -> 修改后`;
const evidenceBefore = ' Under `Evidence`, distinguish';
const evidenceAfter =
  ' Under `Changed-Condition Coverage`, render each disposition once as a group; use one `Merge basis` only for a multi-condition Finding group and keep every child as a located `before -> after` entry. Under `Evidence`, distinguish';
const candidate13Core =
  'Render every Changed-Condition Coverage entry as exactly one physical Markdown list item with this exact shape: `- [file:line] <condition>: <before> -> <after>; Disposition: <one final disposition>`. Keep the location, condition, `before -> after`, and final `Disposition` on that same line. The disposition must be exactly one `[F-NNN]`, `Behavior Preserving`, or `Cannot Verify`; repeated Finding IDs also end with the same non-empty `Merge key`. Do not use a colon-only status such as `condition: unchanged` or `condition: old, new`, and do not split a coverage entry into nested bullets or child lines. Before sending the final response, inspect every physical Coverage line for one location, one transition arrow, and one valid disposition; rewrite any failing line before responding.';
const candidate13Rendering =
  'Apply the `Finding Requirements` finalization sequence before rendering. Keep discovery keys and acceptance sentences internal; expose the ledger only after final IDs are backfilled. Render every independently assessable changed condition, return-value contract, or observable behavior as exactly `- [file:line] <condition>: <before> -> <after>; Disposition: <one final disposition>` on one physical line. Use exactly one `[F-NNN]`, `Behavior Preserving`, or `Cannot Verify`; repeated Finding IDs also require the same non-empty `Merge key` on every occurrence. Never emit a colon-only status, omit either side of the arrow, put disposition on another line, use nested bullets, or summarize independent changes. Before responding, inspect each physical Coverage line and rewrite any line that fails this grammar. Complete the repeated-ID ledger check in `SKILL.md` before responding.';
const candidate13QuickExamples = `合法示例：\`- [src/session.ts:9] token source: getSession() -> cachedToken; Disposition: [F-001]\`
非法示例：\`- [src/session.ts:9] token source: cachedToken; Disposition: Behavior Preserving\`（缺少 \`before -> after\`）
非法示例：\`- [src/session.ts:9] token source: getSession() -> cachedToken; Disposition: [F-001]; Merge key: stale-session-owner\`（单次 ID 不填写 \`Merge key\`）

`;
const candidate13DeepExamples = `合法示例：\`- [src/session.ts:9] token source: getSession() -> cachedToken; Disposition: [F-001]\`
合法示例（无法确认）：\`- [src/runtime.ts:8] deployed owner: frozen source -> unavailable; Disposition: Cannot Verify\`
非法示例：\`- [src/session.ts:9] token source: cachedToken; Disposition: Behavior Preserving\`（缺少 \`before -> after\`）
非法示例：\`- [src/session.ts:9] token source: getSession() -> cachedToken; Disposition: [F-001]; Merge key: stale-session-owner\`（单次 ID 不填写 \`Merge key\`）

`;

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function countEnglishWords(value) {
  return value.match(/[A-Za-z]+(?:[-'][A-Za-z]+)*/gu)?.length ?? 0;
}

function replaceExactlyOnce(value, before, after, label) {
  const occurrences = value.split(before).length - 1;
  if (occurrences !== 1) {
    throw new Error(`${label} expected exactly one source match; received ${occurrences}.`);
  }
  return value.replace(before, after);
}

function applyModeReplacements(value, label) {
  return replaceExactlyOnce(
    replaceExactlyOnce(
      replaceExactlyOnce(value, renderingBefore, renderingAfter, `${label} rendering`),
      chineseBefore,
      chineseAfter,
      `${label} Chinese template`,
    ),
    evidenceBefore,
    evidenceAfter,
    `${label} English template`,
  );
}

export function restoreV040SkillSnapshot({ skill, quick, deep }) {
  return {
    skill: replaceExactlyOnce(
      restoreCandidate16SkillContent(skill),
      `\n${candidate13Core}\n`,
      '',
      'Candidate 13 core instruction',
    ),
    quick: replaceExactlyOnce(
      replaceExactlyOnce(
        quick,
        candidate13Rendering,
        renderingBefore,
        'Candidate 13 Quick rendering',
      ),
      candidate13QuickExamples,
      '',
      'Candidate 13 Quick examples',
    ),
    deep: replaceExactlyOnce(
      replaceExactlyOnce(
        deep,
        candidate13Rendering,
        renderingBefore,
        'Candidate 13 Deep rendering',
      ),
      candidate13DeepExamples,
      '',
      'Candidate 13 Deep examples',
    ),
  };
}

function restoreStableSkillInput(skillDir) {
  const skillPath = path.join(skillDir, 'SKILL.md');
  const quickPath = path.join(skillDir, 'references', 'quick-review.md');
  const deepPath = path.join(skillDir, 'references', 'deep-review.md');
  const restored = restoreV040SkillSnapshot({
    skill: fs.readFileSync(skillPath, 'utf8'),
    quick: fs.readFileSync(quickPath, 'utf8'),
    deep: fs.readFileSync(deepPath, 'utf8'),
  });

  fs.writeFileSync(skillPath, restored.skill);
  fs.writeFileSync(quickPath, restored.quick);
  fs.writeFileSync(deepPath, restored.deep);
}

function buildReviewOutputValidator(value) {
  const withoutStrictCoverage = replaceExactlyOnce(
    replaceExactlyOnce(
      value,
      "import { inspectStrictCoverage } from './validate-review-output-strict.mjs';\n\n",
      '',
      'review-output strict validator import',
    ),
    `  for (const error of inspectStrictCoverage(markdown)) {
    if (!errors.some((current) => current.type === error.type && current.line === error.line)) {
      errors.push(error);
    }
  }
`,
    '',
    'review-output strict validator call',
  );
  const withImport = replaceExactlyOnce(
    withoutStrictCoverage,
    "import { pathToFileURL } from 'node:url';\n",
    "import { pathToFileURL } from 'node:url';\n\nimport { validateGroupedLedger } from './grouped-ledger-validator.mjs';\n",
    'review-output validator import',
  );
  const functionStart = withImport.indexOf('function inspectCoverageLedger(');
  const functionEnd = withImport.indexOf('\nfunction inspectFixVerification(', functionStart);
  if (functionStart === -1 || functionEnd === -1) {
    throw new Error('Could not locate the stable coverage-ledger parser boundary.');
  }
  const groupedFunction = `function inspectCoverageLedger(markdown, findingIds, errors) {
  const grouped = validateGroupedLedger(markdown, { expectedFindingIds: findingIds });
  const preservedErrorNames = new Map([
    ['condition-transition-missing', 'coverage-ledger-missing-before-after'],
    ['coverage-section-count', 'coverage-ledger-section-count'],
    ['coverage-section-empty', 'coverage-ledger-empty'],
    ['coverage-section-not-top-level', 'coverage-ledger-not-top-level'],
  ]);

  errors.push(
    ...grouped.errors.map((error) => ({
      ...error,
      type: preservedErrorNames.get(error.type) ?? error.type,
    })),
  );

  return grouped.conditionCount;
}`;
  const withGroupedParser =
    withImport.slice(0, functionStart) + groupedFunction + '\n' + withImport.slice(functionEnd);
  const withoutFindingSet = replaceExactlyOnce(
    withGroupedParser,
    `  const findingIds = findings.map(({ id }) => id);
  const findingIdSet = new Set(findingIds);

  if (findingIdSet.size !== findingIds.length) {`,
    `  const findingIds = findings.map(({ id }) => id);
  if (new Set(findingIds).size !== findingIds.length) {`,
    'review-output validator Finding-ID set',
  );
  const stableCall = `  const coverageLedgerEntries = inspectCoverageLedger(
    lines,
    headings,
    findingIdSet,
    errors,
  );`;
  const groupedCall =
    '  const coverageLedgerEntries = inspectCoverageLedger(markdown, findingIds, errors);';

  return replaceExactlyOnce(
    withoutFindingSet,
    stableCall,
    groupedCall,
    'review-output validator call',
  );
}

function requireEmptyDirectory(outputDir) {
  if (fs.existsSync(outputDir) && fs.readdirSync(outputDir).length > 0) {
    throw new Error(`Output directory must be empty: ${outputDir}`);
  }
  fs.mkdirSync(outputDir, { recursive: true });
}

function writeChecked(filePath, value, expectedHash, label) {
  const actualHash = sha256(value);
  if (actualHash !== expectedHash) {
    throw new Error(`${label} SHA-256 mismatch: expected ${expectedHash}, received ${actualHash}.`);
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value);
  return actualHash;
}

export function buildGroupedLedgerCandidate(requestedOutput) {
  const outputDir = path.resolve(requestedOutput);
  requireEmptyDirectory(outputDir);

  const stableSkillDir = path.join(rootDir, 'skills', 'fe-code-review');
  const skillDir = path.join(outputDir, 'skill', 'fe-code-review');
  fs.cpSync(stableSkillDir, skillDir, {
    filter: (source) => path.basename(source) !== '.plugin-eval',
    recursive: true,
  });
  restoreStableSkillInput(skillDir);

  const skillPath = path.join(skillDir, 'SKILL.md');
  const quickPath = path.join(skillDir, 'references', 'quick-review.md');
  const deepPath = path.join(skillDir, 'references', 'deep-review.md');
  const fixPath = path.join(skillDir, 'references', 'fix-review.md');
  const skill = replaceExactlyOnce(
    fs.readFileSync(skillPath, 'utf8'),
    skillBefore,
    skillAfter,
    'SKILL.md finalization',
  );
  const quick = applyModeReplacements(fs.readFileSync(quickPath, 'utf8'), 'Quick');
  const deep = applyModeReplacements(fs.readFileSync(deepPath, 'utf8'), 'Deep');
  const fix = fs.readFileSync(fixPath, 'utf8');

  const validatorDir = path.join(outputDir, 'validators');
  const groupedValidator = fs.readFileSync(
    path.join(rootDir, 'scripts', 'grouped-ledger-validator.mjs'),
    'utf8',
  );
  const reviewOutputValidator = buildReviewOutputValidator(
    fs.readFileSync(path.join(rootDir, 'scripts', 'validate-review-output.mjs'), 'utf8'),
  );

  const hashes = {
    deep: writeChecked(deepPath, deep, expectedHashes.deep, 'Deep reference'),
    fix: writeChecked(fixPath, fix, expectedHashes.fix, 'Fix reference'),
    groupedValidator: writeChecked(
      path.join(validatorDir, 'grouped-ledger-validator.mjs'),
      groupedValidator,
      expectedHashes.groupedValidator,
      'grouped-ledger validator',
    ),
    quick: writeChecked(quickPath, quick, expectedHashes.quick, 'Quick reference'),
    reviewOutputValidator: writeChecked(
      path.join(validatorDir, 'validate-review-output.mjs'),
      reviewOutputValidator,
      expectedHashes.reviewOutputValidator,
      'review-output validator',
    ),
    skill: writeChecked(skillPath, skill, expectedHashes.skill, 'SKILL.md'),
  };

  return {
    hashes,
    outputDir,
    skillDir,
    validatorDir,
    words: {
      deep: countEnglishWords(deep),
      fix: countEnglishWords(fix),
      quick: countEnglishWords(quick),
      skill: countEnglishWords(skill),
    },
  };
}

function main() {
  const normalized = process.argv[2] === '--' ? process.argv.slice(3) : process.argv.slice(2);
  if (normalized.length !== 2 || normalized[0] !== '--output' || !normalized[1]) {
    process.stderr.write(
      'Usage: node scripts/build-grouped-ledger-candidate.mjs --output <directory>\n',
    );
    process.exitCode = 1;
    return;
  }

  try {
    process.stdout.write(`${JSON.stringify(buildGroupedLedgerCandidate(normalized[1]), null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main();
}
