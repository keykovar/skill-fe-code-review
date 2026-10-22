import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyBoundedReviewMaterials } from './bounded-review-materials.mjs';
import { verifyBoundedReadDelivery } from './prepare-file-coverage-quick-replacement.mjs';
import { verifyLedgerFormatDeep } from './prepare-ledger-format-deep.mjs';

const repository = fileURLToPath(new URL('../../', import.meta.url));
const recipe = 'evaluation/prototypes/prepare-ledger-format-deep-isolated.mjs';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => Buffer.from(JSON.stringify(value, null, 2) + '\n');
const within = (root, filename) => filename === root || filename.startsWith(root + path.sep);

function read(root, relative) {
  if (typeof relative !== 'string' || /[\\\x00-\x1f\x7f]/u.test(relative) || relative.split('/').some(part => !part || part === '.' || part === '..')) throw new Error('Invalid material path.');
  const filename = path.join(root, relative);
  if (!fs.lstatSync(filename).isFile() || !within(fs.realpathSync(root), fs.realpathSync(filename))) throw new Error('Material must be a regular in-root file.');
  return fs.readFileSync(filename);
}

function paths(root, prefix = '') {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap(entry => {
    const name = prefix + entry.name;
    if (entry.isDirectory()) return paths(path.join(root, entry.name), name + '/');
    if (!entry.isFile()) throw new Error('Non-regular material: ' + name);
    return [name];
  }).sort();
}

const checkPins = (root, expected) => expected.forEach(pin => {
  const bytes = read(root, pin.path);
  if ((pin.bytes !== undefined && bytes.length !== pin.bytes) || hash(bytes) !== pin.sha256) throw new Error('Material changed: ' + pin.path);
});
const pins = (root, names) => names.map(name => {
  const bytes = read(root, name);
  return { path: name, bytes: bytes.length, sha256: hash(bytes) };
});

function replaceOnce(text, before, after) {
  if (text.split(before).length !== 2) throw new Error('Expected one frozen startup anchor.');
  return text.replace(before, after);
}

function isolatedBootstrap(parentMaterials) {
  let prompt = read(parentMaterials, 'workspace/bootstrap.md').toString('utf8');
  for (const [before, after] of [
    ['请使用本材料包内的 fe-code-review 执行一次 Deep Review，简体中文回复。', '请仅使用材料包内交付的候选指令执行一次 Deep Review，使用简体中文回复。'],
    ['这是公开合成 source-packet review。', '这是公开合成 source-packet review。不要调用、加载或搜索任何本地已安装 Skill、用户级目录、宿主仓库或其他上下文；材料包中的 skill/SKILL.md 和 reference 文本就是本次唯一评审指令。不要使用任何本地 Skill 自动触发能力。'],
    ['按原文中的 Skill 指令执行', '按材料包中交付的候选指令执行'],
    ['遵守所选 Skill', '遵守材料包中的候选指令'],
    ['任何工具失败、内容缺失或截断都立即停止，说明交付不完整，不自行重读、补读或给出通过结论。', '任何越界读取、读取失败，或 manifest 列出的批次/segments 缺失、截断，都立即停止并说明交付失败，不自行重读、补读或给出通过结论。若材料包完整，但 packet 明确声明某份业务源码或运行证据未提供，这属于审查证据缺口，不属于交付失败；按候选指令记录限制，完成其余可审查内容和报告，不寻找缺失文件，不编造实现或给出超出证据的通过结论。']
  ]) prompt = replaceOnce(prompt, before, after);
  return prompt;
}

function isolationContract(workspace) {
  return { workingDirectory: workspace, firstAllowedRead: 'materials.json', allowedReads: ['materials.json', 'batches/01.json', 'batches/02.json', 'batches/03.json'], forbiddenReads: ['installed Skill paths', 'user-level directories', 'host repository outside the explicit packet workspace', 'other task or history paths'], enforcement: 'Prompt contract only; projectless does not enforce a filesystem allowlist.' };
}

function launchText(workspace, bootstrap) {
  return `本次唯一读取工作目录：${JSON.stringify(workspace)}\n任务默认目录不承载材料。每次 /bin/cat 的 workdir 必须显式设为上述绝对路径；只读取下文列出的相对路径。\n\n${bootstrap}`;
}

export function prepareLedgerFormatDeepIsolated({ output: requestedOutput, deepMaterials, deepFreezeSha256, windowId = '01', ...context }) {
  if (!/^[0-9]+$/u.test(windowId)) throw new Error('Invalid window ID.');
  verifyLedgerFormatDeep(deepMaterials, deepFreezeSha256, context);
  const requested = path.resolve(requestedOutput);
  const output = path.join(fs.realpathSync(path.dirname(requested)), path.basename(requested));
  const protectedRoots = [path.join(repository, 'skills'), deepMaterials, context.quickMaterials, context.candidateBundle, context.previousMaterials, context.originalMaterials].map(root => fs.realpathSync(root));
  if (protectedRoots.some(root => within(root, output) || within(output, root))) throw new Error('Output overlaps formal, candidate or historical materials.');
  if (fs.existsSync(output)) throw new Error('Output already exists.');
  fs.cpSync(deepMaterials, output, { recursive: true, errorOnExist: true, force: false });
  const planPath = path.join(output, 'control/plan.json');
  const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
  const workspacePath = path.join(output, 'workspace');
  const isolatedPlan = { ...plan,
    window: `ledger-format-deep-isolated-${windowId}`,
    status: 'Offline prepared; execution not authorized',
    clientProposal: { ...plan.clientProposal, executionEnvironment: 'projectless', directoryName: `fe-code-review-deep-isolated-${windowId}` },
    scope: 'One projectless packet Deep isolation pilot; no local Skill invocation, paired-cost, live collector or file-coverage acceptance.',
    isolationContract: isolationContract(workspacePath),
    selectionReason: 'Use an explicit packet working directory in a fresh projectless task after the prior window read the installed Skill outside the allowlist. Neutral wording is a mitigation hypothesis, not a proven cause or filesystem isolation. Actual reads and semantic acceptance remain to be evaluated.',
    promotion: 'Not authorized; passing one isolated Deep pilot would not establish OS isolation, general reliability, installation or release.'
  };
  const bootstrap = isolatedBootstrap(deepMaterials);
  const launch = Buffer.from(launchText(workspacePath, bootstrap));
  fs.writeFileSync(planPath, json(isolatedPlan));
  fs.writeFileSync(path.join(workspacePath, 'bootstrap.md'), bootstrap);
  fs.writeFileSync(path.join(output, 'control/launch.md'), launch);
  const freezePath = path.join(output, 'control/freeze.json');
  const freeze = JSON.parse(fs.readFileSync(freezePath, 'utf8'));
  freeze.kind = 'offline-ledger-format-deep-projectless-isolation';
  freeze.parentDeepFreezeSha256 = deepFreezeSha256;
  freeze.inputs = [...freeze.inputs, ...pins(repository, [recipe])];
  freeze.isolation = isolatedPlan.isolationContract;
  freeze.controls = pins(output, freeze.controls.map(pin => pin.path));
  freeze.run = { ...freeze.run, id: `${windowId}-deep-format-projectless`, filePins: pins(output, freeze.run.filePins.map(pin => path.join(freeze.run.workspace, pin.path))).map(pin => ({ ...pin, path: pin.path.slice(freeze.run.workspace.length + 1) })), bootstrapSha256: hash(Buffer.from(bootstrap)), launchPath: 'control/launch.md', launchSha256: hash(launch), startupBytes: launch.length, totalTransferredContentBytes: freeze.run.toolPayloadBytes + launch.length };
  fs.writeFileSync(freezePath, json(freeze));
  return { output, manifest: freeze, freezeSha256: hash(json(freeze)) };
}

export function verifyLedgerFormatDeepIsolated(output, expectedDigest, { deepMaterials, ...context }) {
  const freezeBytes = read(output, 'control/freeze.json');
  if (!/^[a-f0-9]{64}$/u.test(expectedDigest ?? '') || hash(freezeBytes) !== expectedDigest) throw new Error('Independent isolation freeze digest missing or changed.');
  const freeze = JSON.parse(freezeBytes);
  if (freeze.kind !== 'offline-ledger-format-deep-projectless-isolation' || freeze.parentDeepFreezeSha256 === undefined) throw new Error('Isolation identity missing.');
  verifyLedgerFormatDeep(deepMaterials, freeze.parentDeepFreezeSha256, context);
  const parent = JSON.parse(read(deepMaterials, 'control/freeze.json'));
  const expectedInputs = [...parent.inputs, ...pins(repository, [recipe])];
  if (JSON.stringify(freeze.inputs) !== JSON.stringify(expectedInputs)) throw new Error('Preparation recipe inputs changed or missing.');
  checkPins(repository, freeze.inputs);
  const plan = JSON.parse(read(output, 'control/plan.json'));
  if (plan.clientProposal?.executionEnvironment !== 'projectless') throw new Error('Projectless isolation contract missing.');
  if (!/^fe-code-review-deep-isolated-[0-9]+$/u.test(plan.clientProposal?.directoryName ?? '')) throw new Error('Dedicated projectless directory missing.');
  if (freeze.run.workspace !== 'workspace') throw new Error('Unexpected packet directory.');
  const workspace = path.join(fs.realpathSync(output), freeze.run.workspace);
  const expectedIsolation = JSON.stringify(isolationContract(workspace));
  if (JSON.stringify(plan.isolationContract) !== expectedIsolation || JSON.stringify(freeze.isolation) !== expectedIsolation) throw new Error('Explicit packet working directory or read contract changed.');
  const bootstrap = read(workspace, 'bootstrap.md');
  const prompt = read(output, 'control/launch.md').toString('utf8');
  if (bootstrap.toString('utf8') !== isolatedBootstrap(deepMaterials) || prompt !== launchText(workspace, bootstrap)) throw new Error('Launch or evidence-gap contract changed.');
  if (freeze.run.bootstrapSha256 !== hash(bootstrap) || freeze.run.launchSha256 !== hash(Buffer.from(prompt))) throw new Error('Startup hash mismatch.');
  if (freeze.run.launchPath !== 'control/launch.md' || freeze.run.startupBytes !== Buffer.byteLength(prompt) || freeze.run.totalTransferredContentBytes !== freeze.run.toolPayloadBytes + freeze.run.startupBytes) throw new Error('Startup byte accounting mismatch.');
  checkPins(output, freeze.controls);
  checkPins(workspace, freeze.run.filePins);
  const evidencePins = run => run.filePins.filter(pin => pin.path !== 'bootstrap.md');
  if (JSON.stringify(evidencePins(freeze.run)) !== JSON.stringify(evidencePins(parent.run)) || JSON.stringify(freeze.run.reads) !== JSON.stringify(parent.run.reads)) throw new Error('Parent evidence or bounded reads changed.');
  for (const field of ['originalContentBytes', 'toolPayloadBytes', 'caseId', 'mode']) if (freeze.run[field] !== parent.run[field]) throw new Error('Parent run identity or byte accounting changed.');
  for (const name of ['control/oracle.json', 'control/candidate-manifest.json']) if (!read(output, name).equals(read(deepMaterials, name))) throw new Error('Parent control changed: ' + name);
  const expectedPaths = ['control/freeze.json', ...freeze.controls.map(pin => pin.path), ...freeze.run.filePins.map(pin => freeze.run.workspace + '/' + pin.path)].sort();
  if (JSON.stringify(paths(output)) !== JSON.stringify(expectedPaths)) throw new Error('Isolation window allowlist mismatch.');
  const receipts = freeze.run.reads.map(pin => ({ id: pin.id, output: read(workspace, pin.path).toString('utf8') }));
  verifyBoundedReadDelivery(freeze.run.reads, receipts);
  const material = JSON.parse(read(workspace, 'materials.json'));
  verifyBoundedReviewMaterials(material, receipts.slice(1).map(item => item.output));
  return { status: 'Offline Pass', environment: 'projectless', workingDirectory: workspace, files: freeze.run.filePins.length, reads: freeze.run.reads.length, modelInvocations: 0, runtimeDelivery: 'Not Evaluated', reportAcceptance: 'Not Evaluated', executionAuthorized: false, freezeSha256: expectedDigest };
}
