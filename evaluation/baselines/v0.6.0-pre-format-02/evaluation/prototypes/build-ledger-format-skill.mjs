import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repository = fileURLToPath(new URL('../../', import.meta.url));
const formal = path.join(repository, 'skills/fe-code-review');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const within = (root, filename) => filename === root || filename.startsWith(root + path.sep);

const ledgerOnly = 'For Quick and Deep Review in either language, the Changed-Condition Coverage section contains only ledger list items and blank lines. Put symbol definitions, introductory explanations and static-evidence caveats in the existing Evidence section, not before or after ledger items. Do not add a Coverage ledger to Fix Review.';
const oldTemplateLine = '- [file:line] 条件：修改前 -> 修改后；结论：[F-001] / Behavior Preserving：行为保持 / Cannot Verify：无法验证；合并依据：<仅重复 ID 时填写同一简短键>';
const newTemplateLine = '- [file:line] 条件: 修改前 -> 修改后; Disposition: <单个最终 Finding ID 或 Behavior Preserving 或 Cannot Verify>';

function replaceOnce(source, before, after) {
  if (!before || source.split(before).length !== 2) throw new Error('Ledger format anchor must occur exactly once.');
  return source.replace(before, after);
}

export function clarifyLedgerCore(source) {
  return replaceOnce(source, '\n\nThe initial `[file:line]` may remain plain', '\n\n' + ledgerOnly + '\n\nThe initial `[file:line]` may remain plain');
}

export function clarifyLedgerReference(source) {
  const start = source.indexOf('\n位置可使用与源文件及行号一致的 Markdown 链接；');
  const end = source.indexOf('\n## ', start);
  if (start < 0 || end <= start) throw new Error('Coverage explanation block is missing.');
  const guidance = source.slice(start, end).trim();
  let changed = replaceOnce(source, source.slice(start, end), '');
  changed = replaceOnce(changed, oldTemplateLine, newTemplateLine);
  return replaceOnce(changed, '## Chinese Output Template\n',
    '以下为格式说明，不属于报告正文。覆盖章节只能包含条目及空行；变量定义、引言和静态证据说明放入既有 Evidence 章节。Disposition 只选一个最终值；重复 ID 的每次出现都按核心规则追加同一个 Merge key，单次 ID 不追加。\n\n' +
    guidance + '\n\n## Chinese Output Template\n');
}

export function buildLedgerFormatSkill(requestedOutput) {
  const requested = path.resolve(requestedOutput);
  const output = path.join(fs.realpathSync(path.dirname(requested)), path.basename(requested));
  if (within(fs.realpathSync(path.join(repository, 'skills')), output)) throw new Error('Output must be outside the formal Skill tree.');
  if (fs.existsSync(output)) throw new Error('Output already exists.');
  const files = new Map();
  const walk = (directory, prefix = '') => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.name.startsWith('.')) continue;
      const relative = prefix + entry.name;
      if (entry.isDirectory()) walk(path.join(directory, entry.name), relative + '/');
      else if (entry.isFile()) files.set(relative, fs.readFileSync(path.join(directory, entry.name)));
      else throw new Error('Skill source is not a regular file: ' + relative);
    }
  };
  walk(formal);
  const sources = [...files].map(([name, bytes]) => ({ path: 'skills/fe-code-review/' + name, sha256: sha256(bytes) }));
  const original = new Map(files);
  files.set('SKILL.md', Buffer.from(clarifyLedgerCore(files.get('SKILL.md').toString('utf8'))));
  for (const mode of ['quick', 'deep']) {
    const name = `references/${mode}-review.md`;
    files.set(name, Buffer.from(clarifyLedgerReference(files.get(name).toString('utf8'))));
  }
  const recipe = 'evaluation/prototypes/build-ledger-format-skill.mjs';
  const manifest = { kind: 'offline-ledger-format-skill-candidate', stableVersion: 'v0.6.0',
    installed: false, runtimeReady: false, modelInvocations: 0, sources,
    recipe: { path: recipe, sha256: sha256(fs.readFileSync(path.join(repository, recipe))) },
    files: [...files].map(([name, bytes]) => ({ path: 'fe-code-review/' + name, bytes: bytes.length, sha256: sha256(bytes), changed: !original.get(name).equals(bytes) })),
    limitations: ['Format-only candidate; no file-coverage behavior is promoted or added.', 'Byte invariants and parser tests do not prove model compliance.'] };
  fs.mkdirSync(output, { mode: 0o700 });
  for (const [name, bytes] of files) {
    const target = path.join(output, 'fe-code-review', name);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, bytes, { flag: 'wx' });
  }
  fs.writeFileSync(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
  return { output, manifest };
}
