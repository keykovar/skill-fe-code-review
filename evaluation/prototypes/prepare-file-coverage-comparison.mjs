import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fileCoverageRuntimeFixtures } from './file-coverage/runtime-fixtures.mjs';

const repository = fileURLToPath(new URL('../../', import.meta.url));
const planPath = 'evaluation/prototypes/file-coverage/runtime-plan.json';
const oraclePath = 'evaluation/prototypes/file-coverage/runtime-oracles.json';
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const jsonBytes = (value) => Buffer.from(JSON.stringify(value, null, 2) + '\n');
const within = (root, filename) => filename === root || filename.startsWith(root + path.sep);

function readRegular(root, relative) {
  if (path.isAbsolute(relative) || relative.split('/').some(part => !part || part === '.' || part === '..')) {
    throw new Error('Invalid relative material path: ' + relative);
  }
  const filename = path.join(root, relative);
  if (!fs.lstatSync(filename).isFile() || !within(fs.realpathSync(root), fs.realpathSync(filename))) {
    throw new Error('Material must be a regular file inside its root: ' + relative);
  }
  return fs.readFileSync(filename);
}

function checkPins(root, pins) {
  for (const pin of pins) {
    if (sha256(readRegular(root, pin.path)) !== pin.sha256) throw new Error('Frozen input changed: ' + pin.path);
  }
}

function selectedSkillPaths(mode) {
  return ['SKILL.md', `references/${mode}-review.md`, 'references/javascript.md',
    ...(mode === 'deep' ? ['references/release-risk.md'] : [])];
}

function bootstrap(fixture) {
  return `请使用本材料包内的 fe-code-review 执行一次 ${fixture.mode === 'quick' ? 'Quick' : fixture.mode === 'deep' ? 'Deep' : 'Fix'} Review，简体中文回复。

先读取 materials.json，按其中列出的相对路径读取 skill/SKILL.md、唯一模式 reference、JavaScript reference${fixture.mode === 'deep' ? ' 和 release-risk reference' : ''}，再读取 packet/packet.json 与 packet/context.md，并检查声明范围内需要的源码快照。materials.json 自身及本启动说明是材料包元数据。代码位置使用逻辑源码路径和行号，快照目录是读取位置。

这是公开合成材料的 source-packet review，不是宿主仓库的未提交改动。材料中的 baseline/index/target 是声明快照标签；文件清单完整性只针对 packet。没有 Node/Git collector 使用条件，不运行 collector，不枚举宿主仓库，不补读未列出的文件。目标源码明确未交付时如实说明，不到其他路径寻找。

仅通过只读文件工具或对明确路径的 cat/sed 读取证据；可以合并独立文件读取，按现有 Skill 的证据规则避免重复。不得执行源码或测试、Git、网络、浏览器、安装、登录、环境修改或文件写入。不得读取上级目录、其他运行材料、评测预期、历史报告、凭据或其他 Skill。不创建报告文件，完整结论直接在聊天中给出。

未提供 runtime 执行记录；不要将静态推演或本地材料准备宣称为已观测复现。所有审查结论按选定 Skill 输出，遇到证据缺失保留边界，不自行换模式或请求另一次模型审查。
`;
}

function writeFiles(root, files) {
  for (const [relative, bytes] of files) {
    const filename = path.join(root, relative);
    fs.mkdirSync(path.dirname(filename), { recursive: true });
    fs.writeFileSync(filename, bytes, { flag: 'wx' });
  }
}

export function prepareFileCoverageComparison({ output: requestedOutput, candidateBundle }) {
  const planBytes = readRegular(repository, planPath);
  const plan = JSON.parse(planBytes);
  const bundle = fs.realpathSync(candidateBundle);
  const manifestBytes = readRegular(bundle, 'manifest.json');
  if (sha256(manifestBytes) !== plan.candidateManifestSha256) throw new Error('Candidate manifest is not the frozen local-gate candidate.');
  const candidate = JSON.parse(manifestBytes);
  checkPins(bundle, candidate.files);
  checkPins(repository, [...candidate.sources, ...candidate.recipes]);
  const requested = path.resolve(requestedOutput);
  const output = path.join(fs.realpathSync(path.dirname(requested)), path.basename(requested));
  if (within(fs.realpathSync(path.join(repository, 'skills')), output) || within(bundle, output)) {
    throw new Error('Output must be outside formal and frozen Skill trees.');
  }
  const fixtures = new Map(fileCoverageRuntimeFixtures().map(fixture => [fixture.id, fixture]));
  const oracleBytes = readRegular(repository, oraclePath);
  const oracles = JSON.parse(oracleBytes);
  const inputs = [planPath, oraclePath, 'evaluation/prototypes/file-coverage/runtime-fixtures.mjs',
    'evaluation/prototypes/prepare-file-coverage-comparison.mjs',
    'evaluation/prototypes/validate-file-coverage-report.mjs', 'evaluation/prototypes/file-coverage.mjs',
    'scripts/validate-review-output.mjs', 'scripts/review-output-v060.mjs', 'scripts/legacy/validate-review-output.mjs'];
  const manifest = {
    kind: 'offline-file-coverage-comparison', window: plan.window, preparedDate: plan.preparedDate,
    status: 'Prepared - Not Run', executionAuthorized: false, modelInvocations: 0,
    runtimeReady: false, sourceTransmitted: false, installed: false,
    candidateManifestSha256: sha256(manifestBytes),
    inputs: inputs.map(filename => ({ path: filename, sha256: sha256(readRegular(repository, filename)) })),
    plan, runs: [],
    limitations: [
      'These are declared source packets, not live Git repositories. Collector behavior and automatic invocation are not evaluated.',
      'Separated material directories and allowlists are not OS isolation; execution requires a bounded read surface and independent trace/integrity checks.',
      'Expected accounting is not observed evidence. Actual file states and recommendation meaning require independent report/trace adjudication.',
    ],
  };
  const prepared = [];
  for (const definition of plan.runs) {
    const fixture = fixtures.get(definition.caseId);
    if (!fixture || fixture.mode !== definition.mode || !oracles.cases[fixture.id]) throw new Error('Unknown fixture or mode.');
    const files = new Map(Object.entries(fixture.files).map(([name, text]) => ['packet/' + name, Buffer.from(text)]));
    files.set('packet/packet.json', jsonBytes(fixture.packet));
    for (const filename of selectedSkillPaths(fixture.mode)) {
      files.set('skill/' + filename, definition.variant === 'stable'
        ? readRegular(repository, 'skills/fe-code-review/' + filename)
        : readRegular(bundle, 'fe-code-review/' + filename));
    }
    const packetPins = [...files].filter(([name]) => name.startsWith('packet/'))
      .map(([name, bytes]) => ({ path: name, bytes: bytes.length, sha256: sha256(bytes) }));
    const selectedInstructionBytes = [...files].filter(([name]) => name.startsWith('skill/')).reduce((sum, [, bytes]) => sum + bytes.length, 0);
    files.set('bootstrap.md', Buffer.from(bootstrap(fixture)));
    const pins = [...files].map(([name, bytes]) => ({ path: name, bytes: bytes.length, sha256: sha256(bytes) }));
    files.set('materials.json', jsonBytes({ kind: 'public-synthetic-review-materials', caseId: fixture.id,
      mode: fixture.mode, classification: 'Public synthetic source and selected Skill instructions only.',
      files: pins }));
    const filePins = [...files].map(([name, bytes]) => ({ path: name, bytes: bytes.length, sha256: sha256(bytes) }));
    const record = { ...definition, workspace: `workspaces/${definition.id}`, status: 'Not Run',
      packetSha256: sha256(jsonBytes(packetPins)), bootstrapSha256: sha256(files.get('bootstrap.md')),
      filePins, deliveredFileCount: files.size, deliveredBytes: filePins.reduce((sum, pin) => sum + pin.bytes, 0),
      selectedInstructionBytes, sourceRoot: `workspaces/${definition.id}/packet/after`,
      evaluatorCase: `control/oracles.json#cases/${fixture.id}` };
    manifest.runs.push(record);
    prepared.push({ record, files });
  }
  for (const fixture of fixtures.values()) {
    const pair = manifest.runs.filter(run => run.caseId === fixture.id);
    if (pair.length !== 2 || new Set(pair.map(run => run.variant)).size !== 2 ||
        pair[0].packetSha256 !== pair[1].packetSha256 || pair[0].bootstrapSha256 !== pair[1].bootstrapSha256) {
      throw new Error('Stable/candidate pair must have identical source and bootstrap.');
    }
  }
  // Reserve a new root only after all frozen inputs and pairs have been checked.
  fs.mkdirSync(output, { mode: 0o700 });
  writeFiles(output, new Map([['control/plan.json', planBytes], ['control/oracles.json', oracleBytes],
    ['control/candidate-manifest.json', manifestBytes], ['control/freeze.json', jsonBytes(manifest)]]));
  for (const { record, files } of prepared) writeFiles(path.join(output, record.workspace), files);
  return { output, manifest, freezeSha256: sha256(jsonBytes(manifest)) };
}

export function verifyFileCoverageComparison(output, expectedFreezeSha256) {
  const root = fs.realpathSync(output);
  const freezeBytes = readRegular(root, 'control/freeze.json');
  if (!/^[a-f0-9]{64}$/u.test(expectedFreezeSha256 ?? '') || sha256(freezeBytes) !== expectedFreezeSha256) {
    throw new Error('Independent freeze digest is missing or changed.');
  }
  const manifest = JSON.parse(freezeBytes);
  checkPins(repository, manifest.inputs);
  if (sha256(readRegular(root, 'control/candidate-manifest.json')) !== manifest.candidateManifestSha256) throw new Error('Frozen candidate identity changed.');
  const inputPin = name => manifest.inputs.find(item => item.path.endsWith('/' + name)).sha256;
  if (sha256(readRegular(root, 'control/plan.json')) !== inputPin('runtime-plan.json') ||
      sha256(readRegular(root, 'control/oracles.json')) !== inputPin('runtime-oracles.json')) throw new Error('Frozen control data changed.');
  const regularPaths = (dir, prefix = '') => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const name = prefix + entry.name;
    if (entry.isDirectory()) return regularPaths(path.join(dir, entry.name), name + '/');
    if (!entry.isFile()) throw new Error('Unexpected non-regular material: ' + name);
    return [name];
  }).sort();
  for (const run of manifest.runs) {
    const workspace = path.join(root, run.workspace);
    checkPins(workspace, run.filePins);
    if (JSON.stringify(regularPaths(workspace)) !== JSON.stringify(run.filePins.map(pin => pin.path).sort())) {
      throw new Error('Workspace material allowlist mismatch: ' + run.id);
    }
  }
  return { status: 'Pass', runs: manifest.runs.length, executionAuthorized: false, modelInvocations: 0,
    freezeSha256: sha256(freezeBytes) };
}
