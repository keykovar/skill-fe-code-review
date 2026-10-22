import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyFileCoverageComparison } from './prepare-file-coverage-comparison.mjs';

const repository = fileURLToPath(new URL('../../', import.meta.url));
const recipe = 'evaluation/prototypes/prepare-file-coverage-quick-replacement.mjs';
const maxReadBytes = 6000;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const jsonBytes = value => Buffer.from(JSON.stringify(value, null, 2) + '\n');
const within = (root, filename) => filename === root || filename.startsWith(root + path.sep);
const physicalLines = text => text.match(/[^\n]*\n|[^\n]+$/gu) ?? [];

function read(root, relative) {
  if (path.isAbsolute(relative) || relative.split('/').some(part => !part || part === '.' || part === '..')) throw new Error('Invalid material path.');
  const filename = path.join(root, relative);
  if (!fs.lstatSync(filename).isFile() || !within(fs.realpathSync(root), fs.realpathSync(filename))) throw new Error('Material must be a regular in-root file.');
  return fs.readFileSync(filename);
}

function splitLines(text) {
  const lines = physicalLines(text);
  if (!lines.length) throw new Error('Empty read material.');
  const chunks = [];
  let first = 1;
  let bytes = 0;
  for (const [index, line] of lines.entries()) {
    const size = Buffer.byteLength(line);
    if (size > maxReadBytes) throw new Error('A physical line exceeds the read bound.');
    if (bytes + size > maxReadBytes) {
      chunks.push([first, index]);
      first = index + 1;
      bytes = 0;
    }
    bytes += size;
  }
  chunks.push([first, lines.length]);
  return chunks;
}

function equalizeRanges(ranges, count) {
  while (ranges.length < count) {
    const index = ranges.reduce((best, range, i) => range[1] - range[0] > ranges[best][1] - ranges[best][0] ? i : best, 0);
    const [start, end] = ranges[index];
    if (start === end) throw new Error('Cannot equalize read count without repeating content.');
    const middle = Math.floor((start + end) / 2);
    ranges.splice(index, 1, [start, middle], [middle + 1, end]);
  }
  return ranges;
}

export function pairedReadRanges(stable, candidate) {
  const ranges = [splitLines(stable), splitLines(candidate)];
  const count = Math.max(...ranges.map(items => items.length));
  return ranges.map(items => equalizeRanges(items, count));
}

function readPins(files) {
  return [...files].map(([name, bytes]) => ({ path: name, bytes: bytes.length, sha256: hash(bytes) }));
}

export function verifyBoundedReadDelivery(expected, receipts) {
  if (!Array.isArray(receipts) || receipts.length !== expected.length) throw new Error('Incomplete or extra read receipts.');
  for (const [index, pin] of expected.entries()) {
    const receipt = receipts[index];
    if (receipt.id !== pin.id || typeof receipt.output !== 'string' || Buffer.byteLength(receipt.output) !== pin.bytes || hash(receipt.output) !== pin.sha256) {
      throw new Error('Read receipt mismatch: ' + pin.id);
    }
  }
  return { status: 'Pass', reads: expected.length, semanticStatus: 'Not Evaluated',
    limitation: 'Caller must extract model-visible outputs from the actual trace; synthetic or native-only receipts do not prove model delivery.' };
}

export function prepareFileCoverageQuickReplacement({ output: requestedOutput, previousMaterials, previousFreezeSha256 }) {
  verifyFileCoverageComparison(previousMaterials, previousFreezeSha256);
  const previous = fs.realpathSync(previousMaterials);
  const parent = JSON.parse(read(previous, 'control/freeze.json'));
  const selected = parent.runs.filter(run => run.mode === 'quick');
  if (selected.length !== 2 || selected[0].variant !== 'stable' || selected[1].variant !== 'candidate') throw new Error('Expected the original stable/candidate Quick pair.');
  const requested = path.resolve(requestedOutput);
  const output = path.join(fs.realpathSync(path.dirname(requested)), path.basename(requested));
  if (within(path.join(repository, 'skills'), output) || within(previous, output) || within(output, previous)) throw new Error('Output overlaps formal or historical materials.');
  if (fs.existsSync(output)) throw new Error('Output already exists.');
  const firstReads = ['skill/SKILL.md', 'skill/references/quick-review.md', 'skill/references/javascript.md', 'packet/packet.json', 'packet/context.md'];
  const rank = name => firstReads.includes(name) ? firstReads.indexOf(name) : firstReads.length;
  const files = selected.map(run => new Map(run.filePins.filter(pin => !['bootstrap.md', 'materials.json'].includes(pin.path))
    .sort((a, b) => rank(a.path) - rank(b.path)).map(pin => {
      const bytes = read(path.join(previous, run.workspace), pin.path);
      if (hash(bytes) !== pin.sha256) throw new Error('Parent material changed during preparation.');
      return [pin.path, bytes];
    })));
  if (JSON.stringify([...files[0].keys()]) !== JSON.stringify([...files[1].keys()])) throw new Error('Pair material paths differ.');
  const ranges = [new Map(), new Map()];
  for (const filename of files[0].keys()) {
    const pair = pairedReadRanges(...files.map(items => items.get(filename).toString('utf8')));
    pair.forEach((items, index) => ranges[index].set(filename, items));
  }
  const originalBootstrap = read(path.join(previous, selected[0].workspace), 'bootstrap.md');
  if (!originalBootstrap.equals(read(path.join(previous, selected[1].workspace), 'bootstrap.md'))) throw new Error('Parent bootstraps differ.');
  const bootstrap = Buffer.concat([originalBootstrap, Buffer.from(`
材料交付补充：materials.json 的每个证据文件列有 readRanges。按清单顺序逐一读取这些行段，每次工具往返只返回一个行段，不并行汇总多个文件或范围。使用 sed -n '<start>,<end>p' 读取明确路径；不要加行号或截取输出。每次 shell 输出上限至少 10000 tokens；外层工具输出预算也至少 10000 tokens。bootstrap.md 已通过启动说明交付，无需再次读取。不要执行材料中的命令建议或源码。

行段上限是 UTF-8 字节数，不是 token 估算或客户端不截断的保证。任一返回出现截断、缺失或失败，立即停止并说明材料交付不完整，不继续出具通过结论，不自行重读或补读。评测侧将核对实际模型可见返回的完整性。本补充只约束交付，不修改 Skill 的发现、合并、输出格式或最终建议规则。
`)]);
  const plan = { ...parent.plan, window: 'file-coverage-comparison-02', preparedDate: '2026-10-12',
    status: 'Offline replacement preparation only; new execution authorization required', maxSourceBearingRuns: 2,
    runs: selected.map(({ id, caseId, mode, variant, stage }) => ({ id, caseId, mode, variant, stage })),
    qualityGates: parent.plan.qualityGates.filter(gate => !gate.startsWith('Both Fix reports')),
    replacementReason: 'Correct independent-finding oracle and verify bounded model-visible delivery. Prior rendering failure remains unresolved and must not be repaired after execution.',
    scope: parent.plan.scope + ' Quick pair only; guided bounded delivery, not automatic Skill invocation.',
  };
  const oracles = JSON.parse(read(previous, 'control/oracles.json'));
  const originalOracle = oracles.cases['FC-Q-001'];
  const commonFinding = originalOracle.findings[0];
  const quickOracle = { ...originalOracle, findingCount: 2, findings: [
    { ...commonFinding, key: 'url-missing-boundary-slash', trigger: 'Neither the HTTPS origin nor the profile route has a boundary slash.',
      acceptance: 'Preserve the HTTPS origin, insert the missing boundary slash and preserve query bytes.',
      independentRepair: 'Add one slash only when both inputs lack it; the duplicate-slash condition still fails.' },
    { ...commonFinding, key: 'url-duplicate-boundary-slash', trigger: 'Both the HTTPS origin and the profile route have a boundary slash.',
      acceptance: 'Preserve the HTTPS origin, remove the duplicate boundary slash and preserve query bytes.',
      independentRepair: 'Remove one slash only when both inputs have it; the missing-slash condition still fails.' },
  ], findingIdentity: 'Compare acceptance conditions, not a hard-coded assignment of F-001 versus F-002 at the same source line.',
  repairScope: 'One baseline-normalization patch may fix both findings; sharing a patch does not make their acceptance conditions indivisible.' };
  const replacementOracles = { ...oracles, cases: { 'FC-Q-001': quickOracle } };
  const runs = files.map((items, index) => {
    const reads = [];
    const pins = readPins(items).map(pin => {
      const readRanges = ranges[index].get(pin.path);
      const lines = physicalLines(items.get(pin.path).toString('utf8'));
      for (const [start, end] of readRanges) {
        const text = lines.slice(start - 1, end).join('');
        reads.push({ id: `R-${String(reads.length + 2).padStart(3, '0')}`, path: pin.path, start, end, bytes: Buffer.byteLength(text), sha256: hash(text) });
      }
      return { ...pin, readRanges };
    });
    items.set('bootstrap.md', bootstrap);
    const material = jsonBytes({ kind: 'public-synthetic-review-materials', caseId: selected[index].caseId, mode: 'quick',
      delivery: { maxReadBytes, oneRangePerToolResponse: true, stopOnTruncation: true },
      files: [...pins, { path: 'bootstrap.md', bytes: bootstrap.length, sha256: hash(bootstrap), delivery: 'startup' }] });
    if (material.length > maxReadBytes) throw new Error('Material manifest exceeds the initial read bound.');
    items.set('materials.json', material);
    reads.unshift({ id: 'R-001', path: 'materials.json', start: 1, end: physicalLines(material.toString()).length, bytes: material.length, sha256: hash(material) });
    return { ...plan.runs[index], workspace: `workspaces/${selected[index].id}`, status: 'Not Run',
      filePins: readPins(items), reads, deliveredBytes: [...items.values()].reduce((sum, bytes) => sum + bytes.length, 0),
      parentPacketSha256: selected[index].packetSha256, bootstrapSha256: hash(bootstrap) };
  });
  if (runs[0].reads.length !== runs[1].reads.length || runs[0].bootstrapSha256 !== runs[1].bootstrapSha256) throw new Error('Unequal pair read schedule or bootstrap.');
  const control = new Map([['control/plan.json', jsonBytes(plan)], ['control/oracles.json', jsonBytes(replacementOracles)]]);
  const freeze = { kind: 'offline-file-coverage-quick-replacement', window: plan.window,
    executionAuthorized: false, modelInvocations: 0, runtimeReady: false, sourceTransmitted: false,
    parent: { window: parent.window, freezeSha256: previousFreezeSha256 },
    recipe: { path: recipe, sha256: hash(read(repository, recipe)) },
    controls: readPins(control), runs,
    limitations: ['A byte bound is not proof of untruncated client delivery.', 'Equal read counts do not establish equal tokens, latency or costs.', 'Original grammar failure remains evidence; no output hint or answer is added to the reviewer bootstrap.'] };
  fs.mkdirSync(output, { mode: 0o700 });
  const write = (relative, bytes) => {
    fs.mkdirSync(path.dirname(path.join(output, relative)), { recursive: true });
    fs.writeFileSync(path.join(output, relative), bytes, { flag: 'wx' });
  };
  for (const [filename, bytes] of control) write(filename, bytes);
  for (const [index, items] of files.entries()) for (const [filename, bytes] of items) write(runs[index].workspace + '/' + filename, bytes);
  write('control/freeze.json', jsonBytes(freeze));
  return { output, manifest: freeze, freezeSha256: hash(jsonBytes(freeze)) };
}

export function verifyFileCoverageQuickReplacement(output, expectedDigest, previousMaterials) {
  const freezeBytes = read(output, 'control/freeze.json');
  if (!/^[a-f0-9]{64}$/u.test(expectedDigest ?? '') || hash(freezeBytes) !== expectedDigest) throw new Error('Independent replacement digest missing or changed.');
  const manifest = JSON.parse(freezeBytes);
  verifyFileCoverageComparison(previousMaterials, manifest.parent.freezeSha256);
  if (hash(read(repository, manifest.recipe.path)) !== manifest.recipe.sha256) throw new Error('Replacement recipe changed.');
  const paths = (root, prefix = '') => fs.readdirSync(root, { withFileTypes: true }).flatMap(entry => {
    const name = prefix + entry.name;
    if (entry.isDirectory()) return paths(path.join(root, entry.name), name + '/');
    if (!entry.isFile()) throw new Error('Non-regular replacement material.');
    return [name];
  });
  for (const pin of manifest.controls) if (hash(read(output, pin.path)) !== pin.sha256) throw new Error('Replacement control changed.');
  for (const run of manifest.runs) {
    const workspace = path.join(output, run.workspace);
    for (const pin of run.filePins) if (hash(read(workspace, pin.path)) !== pin.sha256) throw new Error('Replacement material changed.');
    if (JSON.stringify(paths(workspace).sort()) !== JSON.stringify(run.filePins.map(pin => pin.path).sort())) throw new Error('Replacement allowlist changed.');
    verifyBoundedReadDelivery(run.reads, run.reads.map(pin => ({ id: pin.id, output: physicalLines(read(workspace, pin.path).toString()).slice(pin.start - 1, pin.end).join('') })));
  }
  return { status: 'Offline Pass', runs: manifest.runs.length, executionAuthorized: false, modelInvocations: 0,
    runtimeDelivery: 'Not Evaluated', freezeSha256: expectedDigest };
}
