import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeInventoryCollector } from './build-file-coverage-collector.mjs';

const repository = fileURLToPath(new URL('../../', import.meta.url));
const formalRoot = path.join(repository, 'skills/fe-code-review');
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

function replaceOnce(source, before, after) {
  if (source.split(before).length !== 2) throw new Error('Skill source anchor must occur exactly once.');
  return source.replace(before, after);
}

const routing = `For Quick/Deep all-uncommitted reviews, when the authorized Skill collector and Node.js are available, collect the inventory without patches:

\x60\x60\x60bash
node "<skill-directory>/scripts/collect-review-context.mjs" --inventory-only --workspace "$PWD"
\x60\x60\x60

This returns the root, HEAD, CodeGraph presence and NUL-parsed exact paths/layers. It includes no patches, diff-check or reviewer states. Exit 0 means complete enumeration, not completed review; exit 2 returns an incomplete inventory; exit 1 is an execution/argument failure and supplies no usable inventory. Inspect the entire result and retain any incompleteness. Then read the needed baseline and patches once in bounded path groups, for example \x60git --literal-pathspecs diff --no-ext-diff --no-textconv --find-renames -- "<path>"\x60 and the matching \x60--cached\x60 command for staged layers; include both rename paths and relevant untracked source. Run applicable validation separately and record skipped checks.

The collector only supports all-uncommitted scope; --workspace selects the repository, not a path filter. Never use it for staged-only, commit, merge, branch, PR, range, path-scoped or supplied-packet reviews. Use bounded Git commands or the declared packet manifest for those comparisons. If Node or the authorized collector is unavailable, collect the same scope's inventory manually once using NUL-delimited status/name-status with rename identities and all applicable layers; do not parse names by whitespace or infer them from patch headers. The inventory-only all-uncommitted fallback is \x60git --no-optional-locks -c core.fsmonitor=false status --porcelain=v1 -z --untracked-files=all --ignore-submodules=none --renames\x60 together with repository root and HEAD. Reuse the result; retrieve only missing evidence after a concrete failure or inconsistency.

Fix Review keeps the original all-uncommitted collector invocation when applicable:

\x60\x60\x60bash
node "<skill-directory>/scripts/collect-review-context.mjs" --workspace "$PWD"
\x60\x60\x60

That default output already includes status, unstaged stat/patch, staged patch, untracked paths and diff-check. Reuse it without equivalent repeat commands. If unavailable, collect the matching bounded evidence manually. Keep original-feature and fix ranges separate; do not use the all-uncommitted collector for a narrower requested Fix scope.

`;

export function makeFileCoverageCore(source, rules) {
  const start = source.indexOf('When the requested scope is all uncommitted changes,');
  const end = source.indexOf('Establish and report the comparison baseline before reviewing:');
  if (start < 0 || end <= start) throw new Error('Skill scope routing anchors are missing.');
  let candidate = replaceOnce(source, source.slice(start, end), routing);
  candidate = replaceOnce(candidate, '## Conditional Browser Runtime Evidence',
    rules.trim() + '\n\n## Conditional Browser Runtime Evidence');
  return candidate;
}

function modeReference(source, mode) {
  const section = mode === 'quick' ? '审查范围' : '变更理解';
  let candidate = replaceOnce(source, `## ${section}\n\n`,
    `## ${section}\n\n- 文件覆盖：清单 <Complete/Incomplete>；<按核心语法填写总数或已知下界>；Reviewed <n> / Partial <n> / Deferred <n> / Cannot Verify <n>。\n`);
  candidate = replaceOnce(candidate, '## Chinese Output Template',
    'Apply the mandatory File Coverage rules in `SKILL.md`. Put one localized summary and all incomplete-file details inside the existing scope section below (English: ' +
    (mode === 'quick' ? '`Review Scope`' : '`Change Understanding`') +
    '). Use the core grammar; add the inventory-gap line only for Incomplete inventory. Keep the full path/state/evidence map internal and preserve all existing sections, findings and recommendation gates.\n\n## Chinese Output Template');
  return candidate;
}

function readTree(directory, prefix = '') {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    // Hidden local evaluator data is not part of the installable Skill package.
    if (entry.name.startsWith('.')) continue;
    const name = prefix + entry.name;
    if (entry.isDirectory()) files.push(...readTree(path.join(directory, entry.name), name + '/'));
    else if (entry.isFile()) files.push([name, fs.readFileSync(path.join(directory, entry.name))]);
    else throw new Error('Candidate sources must be regular files or directories: ' + name);
  }
  return files;
}

export function buildFileCoverageSkill(requestedOutput) {
  const requested = path.resolve(requestedOutput);
  const output = path.join(fs.realpathSync(path.dirname(requested)), path.basename(requested));
  const relative = path.relative(fs.realpathSync(path.join(repository, 'skills')), output);
  if (relative === '' || (relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative))) {
    throw new Error('Candidate output must be outside the formal Skill tree.');
  }
  const original = new Map(readTree(formalRoot));
  const files = new Map(original);
  const rulesPath = 'evaluation/prototypes/file-coverage/skill-rules.md';
  const helperPath = 'evaluation/prototypes/file-coverage.mjs';
  const rules = fs.readFileSync(path.join(repository, rulesPath));
  const helper = fs.readFileSync(path.join(repository, helperPath));
  files.set('SKILL.md', Buffer.from(makeFileCoverageCore(original.get('SKILL.md').toString('utf8'), rules.toString('utf8'))));
  for (const mode of ['quick', 'deep']) {
    const name = `references/${mode}-review.md`;
    files.set(name, Buffer.from(modeReference(original.get(name).toString('utf8'), mode)));
  }
  const collector = 'scripts/collect-review-context.mjs';
  files.set(collector, Buffer.from(makeInventoryCollector(original.get(collector).toString('utf8'))));
  files.set('scripts/file-coverage.mjs', helper);
  const recipes = [rulesPath, helperPath, 'evaluation/prototypes/build-file-coverage-collector.mjs',
    'evaluation/prototypes/build-file-coverage-skill.mjs'];
  const manifest = {
    kind: 'offline-file-coverage-skill-candidate', stableVersion: 'v0.6.0',
    runtimeReady: false, modelInvocations: 0, installed: false,
    sources: [...original].map(([name, bytes]) => ({ path: 'skills/fe-code-review/' + name, sha256: sha256(bytes) })),
    recipes: recipes.map((name) => ({ path: name, sha256: sha256(fs.readFileSync(path.join(repository, name))) })),
    files: [...files].map(([name, bytes]) => ({ path: 'fe-code-review/' + name,
      bytes: bytes.length, sha256: sha256(bytes), changed: !original.get(name)?.equals(bytes) })),
  };
  // A new destination preserves all previously generated candidates and receipts.
  fs.mkdirSync(output, { mode: 0o700 });
  for (const [name, bytes] of files) {
    const target = path.join(output, 'fe-code-review', name);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, bytes, { flag: 'wx' });
  }
  fs.writeFileSync(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
  return { output, manifest };
}
