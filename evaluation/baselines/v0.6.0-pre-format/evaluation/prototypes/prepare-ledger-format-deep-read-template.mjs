import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareLedgerFormatDeepIsolated, verifyLedgerFormatDeepIsolated } from './prepare-ledger-format-deep-isolated.mjs';

const repository = fileURLToPath(new URL('../../', import.meta.url));
const recipe = 'evaluation/prototypes/prepare-ledger-format-deep-read-template.mjs';
const readPaths = ['materials.json', 'batches/01.json', 'batches/02.json', 'batches/03.json'];
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => Buffer.from(JSON.stringify(value, null, 2) + '\n');
const within = (root, filename) => filename === root || filename.startsWith(root + path.sep);
const pin = (name, bytes) => ({ path: name, bytes: bytes.length, sha256: sha(bytes) });

function read(root, name) {
  const filename = path.join(root, name);
  if (!fs.lstatSync(filename).isFile()) throw new Error('Expected a regular file: ' + name);
  return fs.readFileSync(filename);
}

export function buildDeepReadCalls(workspace) {
  if (typeof workspace !== 'string' || !path.isAbsolute(workspace) || /[\x00-\x1f\x7f]/u.test(workspace) || path.normalize(workspace) !== workspace) throw new Error('Expected a canonical absolute packet workspace.');
  return readPaths.map((name, index) => ({
    id: `R-${String(index + 1).padStart(3, '0')}`, path: name, tool: 'functions.exec',
    input: '// @exec: {"max_output_tokens":20000}\n' +
      `const result = await tools.exec_command(${JSON.stringify({ cmd: `/bin/cat "${name}"`, workdir: workspace, login: false, yield_time_ms: 10000, max_output_tokens: 20000 })});\n` +
      'text(result.output);\n'
  }));
}

function launchWithCalls(launch, calls) {
  return launch + '\n\n## 本次四次读取的完整调用模板\n\n' +
    '按顺序分别调用 functions.exec，每次完整使用对应代码块。首行 @exec 配置外层工具输出预算，exec_command 的 max_output_tokens 配置 shell 输出预算；两个位置都必须保留 20000，不能只设置其中一个。不要合并四次调用，不增加其他工具代码。若当前工具不支持此调用形式，停止并说明能力限制，不改用未验证的调用。\n\n' +
    calls.map(call => `${call.id}：${call.path}\n\n\`\`\`javascript\n${call.input}\`\`\``).join('\n\n') + '\n';
}

function dispatchFiles(materials, baseFreeze) {
  const calls = buildDeepReadCalls(path.join(materials, 'workspace'));
  if (JSON.stringify(baseFreeze.run.reads.map(item => item.path)) !== JSON.stringify(readPaths)) throw new Error('Unexpected parent read sequence.');
  return new Map([
    ['read-calls.json', json(calls)],
    ['launch.md', Buffer.from(launchWithCalls(read(materials, 'control/launch.md').toString('utf8'), calls))]
  ]);
}

function dispatchFreeze(baseDigest, baseFreeze, files) {
  const startupBytes = files.get('launch.md').length;
  return {
    kind: 'offline-deep-explicit-read-call-template', baseMaterials: 'materials', baseFreezeSha256: baseDigest,
    inputs: [pin(recipe, read(repository, recipe))], files: [...files].map(([name, bytes]) => pin(name, bytes)),
    dispatch: {
      launchPath: 'launch.md', launchSha256: sha(files.get('launch.md')), tool: 'functions.exec',
      reads: 4, outerOutputBudgetTokens: 20000, shellOutputBudgetTokens: 20000,
      originalContentBytes: baseFreeze.run.originalContentBytes, toolPayloadBytes: baseFreeze.run.toolPayloadBytes,
      startupBytes, totalTransferredContentBytes: baseFreeze.run.toolPayloadBytes + startupBytes,
      accounting: 'Dispatch launch replaces the base startup; read-call templates are included once in this launch. read-calls.json is evaluator-only and is not an additional reviewer read.'
    },
    executionAuthorized: false, modelInvocations: 0, sourceTransmitted: false, runtimeReady: false,
    limitation: 'Explicit call templates are prompt guidance, not enforced client budgets or filesystem isolation. Actual runtime calls and returned bytes still require verification.'
  };
}

export function prepareLedgerFormatDeepReadTemplate({ output: requestedOutput, ...options }) {
  const requested = path.resolve(requestedOutput);
  const output = path.join(fs.realpathSync(path.dirname(requested)), path.basename(requested));
  const protectedRoots = [path.join(repository, 'skills'), options.deepMaterials, options.quickMaterials, options.candidateBundle, options.previousMaterials, options.originalMaterials].map(root => fs.realpathSync(root));
  if (protectedRoots.some(root => within(root, output) || within(output, root))) throw new Error('Output overlaps formal or historical materials.');
  if (fs.existsSync(output)) throw new Error('Output already exists.');
  fs.mkdirSync(output, { mode: 0o700 });
  // Preserve the pinned preparation recipe and its verifier byte-for-byte.
  const base = prepareLedgerFormatDeepIsolated({ ...options, output: path.join(output, 'materials') });
  const files = dispatchFiles(base.output, base.manifest);
  const freeze = dispatchFreeze(base.freezeSha256, base.manifest, files);
  for (const [name, bytes] of files) fs.writeFileSync(path.join(output, name), bytes, { flag: 'wx' });
  fs.writeFileSync(path.join(output, 'freeze.json'), json(freeze), { flag: 'wx' });
  return { output, manifest: freeze, freezeSha256: sha(json(freeze)) };
}

export function verifyLedgerFormatDeepReadTemplate(output, expectedDigest, context) {
  if (!fs.lstatSync(output).isDirectory()) throw new Error('Expected a regular dispatch directory.');
  const freezeBytes = read(output, 'freeze.json');
  if (!/^[a-f0-9]{64}$/u.test(expectedDigest ?? '') || sha(freezeBytes) !== expectedDigest) throw new Error('Independent dispatch freeze digest missing or changed.');
  const freeze = JSON.parse(freezeBytes);
  const materialPath = path.join(fs.realpathSync(output), 'materials');
  if (!fs.lstatSync(materialPath).isDirectory()) throw new Error('Expected a regular material directory.');
  const baseResult = verifyLedgerFormatDeepIsolated(materialPath, freeze.baseFreezeSha256, context);
  const baseFreeze = JSON.parse(read(materialPath, 'control/freeze.json'));
  const expectedFiles = dispatchFiles(materialPath, baseFreeze);
  const expectedFreeze = dispatchFreeze(freeze.baseFreezeSha256, baseFreeze, expectedFiles);
  if (JSON.stringify(freeze) !== JSON.stringify(expectedFreeze)) throw new Error('Dispatch recipe, budgets or accounting changed.');
  if (JSON.stringify(fs.readdirSync(output).sort()) !== JSON.stringify(['freeze.json', 'launch.md', 'materials', 'read-calls.json'])) throw new Error('Unexpected dispatch file inventory.');
  for (const [name, bytes] of expectedFiles) if (!read(output, name).equals(bytes)) throw new Error('Dispatch template changed: ' + name);
  return { status: 'Offline Pass', files: baseResult.files, reads: baseResult.reads, outerOutputBudgetTokens: 20000, shellOutputBudgetTokens: 20000, freezeSha256: expectedDigest, modelInvocations: 0, executionAuthorized: false, runtimeDelivery: 'Not Evaluated', reportAcceptance: 'Not Evaluated' };
}
