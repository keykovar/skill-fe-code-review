#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const prototype = 'evaluation/prototypes/origin-occurrence';
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const read = (filename) => fs.readFileSync(path.join(root, filename), 'utf8');

function replaceOnce(text, before, after) {
  if (text.split(before).length !== 2) throw new Error(`Expected exactly one integration anchor: ${before.slice(0, 80)}`);
  return text.replace(before, after);
}

function filesUnder(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith('.')) return [];
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) return filesUnder(filename).map((child) => `${entry.name}/${child}`);
    if (!entry.isFile()) throw new Error(`Unsupported candidate input: ${filename}`);
    return [entry.name];
  }).sort();
}

function sharedRules() {
  let extension = read(`${prototype}/fe-code-review-origin-candidate/SKILL.md`).split('## Output Extension\n')[1];
  extension = extension.replace('Keep the stable mode template,', 'Keep the selected mode template,')
    .replace(' A field parser passing is not semantic validation.', '')
    .replace("the stable core's `Severity Rules`", '`Severity Rules`')
    .replace('using the stable rules', 'using the severity rules')
    .replace(/^## /gmu, '### ');
  return `## Origin And Reproduction\n\n${extension}`;
}

function coverageRule() {
  const paragraphs = read(`${prototype}/coverage-links-09.md`).split('\n\n');
  return paragraphs[2].replace('When explicitly selected, this profile overrides only the stable requirement for a plain Coverage location. ', '')
    .replace('supplied source-packet root', 'independently established review source root')
    .replaceAll('this candidate subset', 'this supported subset')
    + '\n\n' + paragraphs[3].replace('declared source root', 'independently established source root')
    + '\n\nEstablish the review source root from the requested workspace or supplied source packet, never from a generated report link. A matching link is presentation only, not source evidence. Use a plain location if the root is unavailable; do not read extra files just to render a link. Fix Review still has no Coverage ledger.\n\n';
}

const fields = '  - 问题来源 / Origin：New / Amplified / Retained / Unknown - <相对声明基线的证据>\n' +
  '  - 复现观测 / Reproduction：Observed / Not Run / Cannot Verify / Not Applicable - <观测证据与限制>\n';

function modeTemplate(original, mode) {
  let text = original.replace(/^(- \[F-\d{3}\] \[[^\n]+\] [^\n]+\n)/gmu, `$1${fields}`);
  const expected = mode === 'fix' ? 4 : 3;
  if (text.split(fields).length - 1 !== expected) throw new Error(`Unexpected ${mode} template item count.`);
  if (mode !== 'fix') {
    text = replaceOnce(text, 'on one physical line. Use exactly one',
      'on one physical line. The initial location may also be a matching local Markdown link under the Coverage location rules in `SKILL.md`; the rest of the grammar is unchanged. Use exactly one');
    text = replaceOnce(text, '\n合法示例：',
      '\n位置可使用与源文件及行号一致的 Markdown 链接；适用条件见 `SKILL.md`。\n\n合法示例：');
  } else {
    for (const label of ['已解决', '部分解决', '未解决', '无法验证', '新增回归']) {
      text = replaceOnce(text, `- ${label}：\n`, `- ${label}：<非负整数，空类别填 0>\n`);
    }
  }
  return text + '\nApply the shared `Origin And Reproduction` rules in `SKILL.md` to every finding, including Improve and Fix New Regression entries. In English use nested `Origin` and `Reproduction` fields with the same states and evidence. Do not add these fields to empty finding sections or Coverage entries.\n';
}

function exampleReport(original, mode, chinese) {
  let text = original;
  if (chinese) {
    text = text.replaceAll('  - 问题来源：', '  - 问题来源 / Origin：').replaceAll('  - 复现观测：', '  - 复现观测 / Reproduction：');
    text = text.replace(/^### (Blocking|Risk|Improve)$/gmu, (_, severity) =>
      `### ${severity}：${{ Blocking: '必须修改', Risk: '建议修改', Improve: '可优化' }[severity]}`);
  }
  const validationAnchor = chinese ? '- 已执行验证：' : '- Validation run:';
  const modified = mode === 'quick' ? 'src/url.ts' : 'src/auth/session.ts';
  const inventory = chinese
    ? `${mode === 'quick' ? '' : `- 已修改：\`${modified}\`（合成示例）\n`}- 已暂存：示例未提供 Git index 状态。\n- 未暂存：示例未区分工作树状态。\n- 未跟踪：示例未提供文件清单。\n`
    : `${mode === 'quick' ? '' : `- Modified: \`${modified}\` (synthetic example)\n`}- Staged: no Git index state supplied in this example.\n- Unstaged: working-tree state not distinguished in this example.\n- Untracked: no inventory supplied in this example.\n`;
  text = replaceOnce(text, validationAnchor, inventory + validationAnchor);
  const evidenceHeading = chinese ? '## Evidence：证据\n' : '## Evidence\n';
  text = replaceOnce(text, evidenceHeading, evidenceHeading + (chinese
    ? '\n- 示例性质：人工编写的格式示例，内容与观测计数不构成实际运行或验收证据。\n- package/version：未提供。\n- 官方文档核验：未使用外部文档服务。\n'
    : '\n- Example status: authored format illustration; its content and counts are not execution or acceptance evidence.\n- Package/version: not supplied.\n- Official documentation verification: no external documentation service used.\n'));
  if (mode === 'fix') {
    text = replaceOnce(text, validationAnchor, (chinese
      ? '- 原始变更范围：认证恢复由当前 token 改为缓存 token。\n- 比较基线：修复前缓存 token 快照与当前修复快照；与上次审查基线分别对照。\n- 涉及文件与调用链：`src/auth/session.ts`，restore -> profileRequest。\n'
      : '- Original change scope: auth resume switches from current to cached token.\n- Comparison baseline: pre-fix cached-token snapshot versus repaired snapshot, separate from the original review baseline.\n- Files and call path: `src/auth/session.ts`, restore -> profileRequest.\n') + validationAnchor);
    text = text.replace('evidence is the fix-baseline contract.', 'authored local synthetic runner, pre-fix revision, reset account and token; unit: completed resume scenario; record: pre-fix contract.')
      .replace('evidence is the current contract.', 'same authored runner and input/reset, repaired revision; unit: completed resume scenario; record: repaired contract.')
      .replace('证据为修复基线 contract。', '人工示例本地合成 runner，修复前快照，重置账号与 token；计数单位为完成的恢复场景，记录为修复前 contract。')
      .replace('证据为当前 contract。', '相同示例 runner 与输入/重置状态，修复后快照；计数单位为完成的恢复场景，记录为修复后 contract。');
    text = replaceOnce(text, evidenceHeading, evidenceHeading + (chinese ? '\n- 浏览器运行证据：未执行。\n' : '\n- Browser runtime evidence: not run.\n'));
  }
  if (mode === 'deep') {
    text = replaceOnce(text, validationAnchor, (chinese ? '- 用户路径：登出、切换账号、恢复 profile 请求。\n' : '- User path: logout, account switch, resume profile request.\n') + validationAnchor);
    text = replaceOnce(text, chinese ? '- 更简单可行方案：' : '- Simpler alternative:', (chinese
      ? '- 语义重复与漂移风险：F-001 的缓存副本偏离现有授权 owner。\n- 不必要的 case / fallback / state / parameter：F-001 的初始化 token 副本。\n'
      : '- Semantic duplication and drift: the F-001 cached copy diverges from the authorization owner.\n- Unjustified case / fallback / state / parameter: the F-001 initialization token copy.\n') + (chinese ? '- 更简单可行方案：' : '- Simpler alternative:'));
  }
  // Bilingual Quick/Deep examples exercise both allowed location presentations.
  if (mode !== 'fix' && !chinese) {
    text = text.replace(/^(## Changed-Condition Coverage\n\n- )\[([^\]]+)\]/mu, '$1[$2](/review/$2)');
  }
  return text;
}

export function buildOriginOccurrenceIntegrated(outputDirectory) {
  const output = path.resolve(outputDirectory);
  if (fs.existsSync(output)) throw new Error('Candidate output must be a new directory; existing artifacts are never overwritten.');
  const legacy = JSON.parse(read(`${prototype}/legacy-fix-10.json`));
  const coverage = JSON.parse(read(`${prototype}/coverage-links-09.json`));
  const inputs = new Map();
  for (const pin of [...legacy.frozenFiles, ...coverage.frozenFiles]) {
    if (sha256(read(pin.path)) !== pin.sha256) throw new Error(`Frozen input changed: ${pin.path}`);
    inputs.set(pin.path, { path: pin.path, sha256: pin.sha256 });
  }
  const outputs = new Map();
  const deltas = [];
  for (const filename of filesUnder(path.join(root, 'skills/fe-code-review'))) {
    const source = `skills/fe-code-review/${filename}`;
    const original = read(source);
    let value = original;
    if (filename === 'SKILL.md') {
      value = replaceOnce(value, 'with this exact shape:', 'with this shape (plain location shown; the linked variant is specified below):');
      value = replaceOnce(value, '\nEvery Quick or Deep finding must include:', `\n${coverageRule()}Every Quick or Deep finding must include:`);
      value = replaceOnce(value, '\n## Recommendation Consistency\n', `\n${sharedRules()}\n## Recommendation Consistency\n`);
    } else {
      const mode = filename.match(/^references\/(quick|deep|fix)-review\.md$/u)?.[1];
      if (mode) value = modeTemplate(value, mode);
    }
    inputs.set(source, { path: source, sha256: sha256(original) });
    const target = `skill/fe-code-review/${filename}`;
    outputs.set(target, value);
    deltas.push({ path: target, before: Buffer.byteLength(original), after: Buffer.byteLength(value), delta: Buffer.byteLength(value) - Buffer.byteLength(original) });
  }
  const definitions = JSON.parse(read(`${prototype}/examples/oracles.json`));
  for (const [name, definition] of Object.entries(definitions.examples)) {
    const source = `${prototype}/examples/${name}`;
    const original = read(source);
    const value = exampleReport(original, definition.mode, name.includes('zh-CN'));
    inputs.set(source, { path: source, sha256: sha256(original) });
    outputs.set(`examples/${name}`, value);
    deltas.push({ path: `examples/${name}`, before: Buffer.byteLength(original), after: Buffer.byteLength(value), delta: Buffer.byteLength(value) - Buffer.byteLength(original) });
  }
  outputs.set('examples/oracles.json', read(`${prototype}/examples/oracles.json`));
  for (const source of [
    `${prototype}/examples/oracles.json`, 'scripts/validate-origin-occurrence-legacy-fix.mjs',
    'scripts/validate-origin-occurrence-integrated.mjs', 'scripts/adjudicate-origin-occurrence-integrated.mjs',
    'scripts/build-origin-occurrence-integrated.mjs',
  ]) inputs.set(source, { path: source, sha256: sha256(read(source)) });
  const manifest = {
    revision: 'integration-11', status: 'offline-candidate-only', runtimeReady: false, modelInvocations: 0,
    skillDirectory: 'skill/fe-code-review', sourceRootForExamples: '/review',
    entry: { module: 'scripts/validate-origin-occurrence-integrated.mjs', export: 'validateOriginOccurrenceIntegrated' },
    evaluator: { module: 'scripts/adjudicate-origin-occurrence-integrated.mjs', export: 'evaluateIntegratedOriginOccurrenceReport' },
    inputs: [...inputs.values()].sort((a, b) => a.path.localeCompare(b.path)),
    outputs: [...outputs].map(([filename, value]) => ({ path: filename, sha256: sha256(value), bytes: Buffer.byteLength(value) })),
    deltas,
    ruleInventory: {
      preserved: ['Default Rules', 'Scope Discovery', 'Conditional Browser Runtime Evidence', 'Mode Selection', 'Technology Detection', 'Quick/Fix Evidence Discipline',
        'Before/After Behavior Analysis', 'Review Priorities', 'Minimal Sufficient Design', 'Finding Requirements',
        'Recommendation Consistency', 'Fix Review Rules', 'Severity Rules'],
      integratedInCore: ['Origin', 'Reproduction', 'Final Check', 'Coverage local-link subset and independent source root'],
      templateItemsWithFields: { quick: 3, deep: 3, fix: 4 },
      unchangedFiles: deltas.filter((item) => item.delta === 0).map((item) => item.path),
    },
    limitations: ['Authored examples are not model evidence.', 'Byte deltas are not token or runtime savings.',
      'Format/field checks do not establish causal truth, severity, closure, or complete report quality.',
      'Stable and installed Skill, public CLI, historical reports/oracles and package version remain unchanged.'],
  };
  fs.mkdirSync(output, { recursive: true });
  for (const [filename, value] of outputs) {
    const target = path.join(output, filename);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, value, { flag: 'wx' });
  }
  fs.writeFileSync(path.join(output, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' });
  return manifest;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const [flag, output, ...extra] = process.argv.slice(2);
    if (flag !== '--output' || !output || extra.length) throw new Error('Usage: node scripts/build-origin-occurrence-integrated.mjs --output <new-directory>');
    const result = buildOriginOccurrenceIntegrated(output);
    process.stdout.write(`${JSON.stringify({ revision: result.revision, outputs: result.outputs.length, deltas: result.deltas }, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
