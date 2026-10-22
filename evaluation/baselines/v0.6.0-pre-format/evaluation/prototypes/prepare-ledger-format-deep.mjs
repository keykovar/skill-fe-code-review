import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildBoundedReviewMaterials, verifyBoundedReviewMaterials } from './bounded-review-materials.mjs';
import { verifyBoundedReadDelivery } from './prepare-file-coverage-quick-replacement.mjs';
import { verifyLedgerFormatQuick } from './prepare-ledger-format-quick.mjs';

const repository = fileURLToPath(new URL('../../', import.meta.url));
const recipe = 'evaluation/prototypes/prepare-ledger-format-deep.mjs';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => Buffer.from(JSON.stringify(value, null, 2) + '\n');
const within = (root, filename) => filename === root || filename.startsWith(root + path.sep);
const pins = files => [...files].map(([name, bytes]) => ({ path: name, bytes: bytes.length, sha256: hash(bytes) }));

// Keep historical Quick recipes frozen; only the new Deep window is written.
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

function checkPins(root, expected) {
  for (const pin of expected) {
    const bytes = read(root, pin.path);
    if (hash(bytes) !== pin.sha256 || (pin.bytes !== undefined && bytes.length !== pin.bytes)) throw new Error('Material changed: ' + pin.path);
  }
}

function replaceOnce(text, before, after) {
  if (text.split(before).length !== 2) throw new Error('Expected one frozen startup anchor.');
  return text.replace(before, after);
}

export function prepareLedgerFormatDeep({ output: requestedOutput, quickMaterials, quickFreezeSha256, ...context }) {
  verifyLedgerFormatQuick(quickMaterials, quickFreezeSha256, context);
  const requested = path.resolve(requestedOutput);
  const output = path.join(fs.realpathSync(path.dirname(requested)), path.basename(requested));
  const protectedRoots = [path.join(repository, 'skills'), quickMaterials, context.candidateBundle, context.previousMaterials, context.originalMaterials].map(root => fs.realpathSync(root));
  if (protectedRoots.some(root => within(root, output) || within(output, root))) throw new Error('Output overlaps formal, candidate or historical materials.');
  if (fs.existsSync(output)) throw new Error('Output already exists.');
  const parent = JSON.parse(read(context.originalMaterials, 'control/freeze.json'));
  const sourceRun = parent.runs.find(run => run.mode === 'deep' && run.variant === 'stable' && run.caseId === 'FC-D-001');
  if (!sourceRun) throw new Error('Frozen FC-D-001 source packet is absent.');
  const first = ['skill/SKILL.md', 'skill/references/deep-review.md', 'skill/references/javascript.md', 'skill/references/release-risk.md', 'packet/packet.json', 'packet/context.md'];
  const rank = name => first.includes(name) ? first.indexOf(name) : first.length;
  const selected = sourceRun.filePins.filter(pin => !['materials.json', 'bootstrap.md'].includes(pin.path)).sort((a, b) => rank(a.path) - rank(b.path));
  if (selected.length !== 9) throw new Error('Expected nine original Deep evidence files.');
  const materials = buildBoundedReviewMaterials(selected.map(pin => ({ path: pin.path,
    text: read(pin.path.startsWith('skill/') ? context.candidateBundle : path.join(context.originalMaterials, sourceRun.workspace),
      pin.path.startsWith('skill/') ? 'fe-code-review/' + pin.path.slice(6) : pin.path).toString('utf8') })));
  if (materials.batches.length !== 3) throw new Error('Frozen Deep pilot requires exactly three evidence batches.');
  let bootstrap = read(quickMaterials, 'workspace/bootstrap.md').toString('utf8');
  bootstrap = replaceOnce(bootstrap, '执行一次 Quick Review', '执行一次 Deep Review');
  bootstrap = replaceOnce(bootstrap, '唯一 Quick reference 和 JavaScript reference', '唯一 Deep reference、JavaScript reference 和 release-risk reference');
  const materialManifest = { kind: 'public-synthetic-batched-review', caseId: 'FC-D-001', mode: 'deep',
    files: materials.files, batches: materials.batches.map(({ text, ...pin }) => pin),
    delivery: { maxBatchBytes: materials.maxPayloadBytes, oneBatchPerToolResponse: true, stopOnTruncation: true } };
  const workspaceFiles = new Map([['materials.json', json(materialManifest)],
    ...materials.batches.map(batch => [batch.path, Buffer.from(batch.text)]), ['bootstrap.md', Buffer.from(bootstrap)]]);
  if (workspaceFiles.get('materials.json').length > materials.maxPayloadBytes) throw new Error('Manifest exceeds delivery bound.');
  const reads = pins(new Map([...workspaceFiles].filter(([name]) => name !== 'bootstrap.md'))).map((pin, index) => ({ id: `R-${String(index + 1).padStart(3, '0')}`, ...pin }));
  const quickPlan = JSON.parse(read(quickMaterials, 'control/plan.json'));
  const originalOracle = JSON.parse(read(context.originalMaterials, 'control/oracles.json'));
  const { candidateFileCoverage, stableComparison, ...caseOracle } = originalOracle.cases['FC-D-001'];
  const oracle = { ...originalOracle, cases: { 'FC-D-001': caseOracle },
    excludedParentFields: ['candidateFileCoverage', 'stableComparison'],
    exclusionReason: 'Format-only Deep pilot; critical evidence and source-contract checks remain, without file-summary syntax.' };
  const plan = { ...quickPlan, window: 'ledger-format-deep-01', caseId: 'FC-D-001', mode: 'deep',
    scope: 'One explicit packet Deep acceptance pilot for the unchanged format candidate; no paired-cost, live collector or file-coverage acceptance.',
    selectionReason: 'Exercise Deep template, Cannot Verify coverage, no invented findings and aligned prerequisites when critical target source is unavailable. Repeated finding IDs were exercised by Quick and are not exercised here.',
    elapsed: { ...quickPlan.elapsed, acceptanceCeilingMs: parent.plan.costBudget.hardElapsedSecondsPerRun.deep * 1000 },
    promotion: 'Not authorized; passing one Deep pilot does not establish general reliability, all clients, file coverage, installation or release.' };
  const candidateBytes = read(quickMaterials, 'control/candidate-manifest.json');
  const launch = Buffer.from(`本次唯一工作目录：${path.join(output, 'workspace')}\n\n${bootstrap}`);
  const controls = new Map([['control/plan.json', json(plan)], ['control/oracle.json', json(oracle)],
    ['control/candidate-manifest.json', candidateBytes], ['control/launch.md', launch]]);
  const dependencies = [recipe, 'evaluation/prototypes/bounded-review-materials.mjs', 'evaluation/prototypes/prepare-ledger-format-quick.mjs'];
  const freeze = { kind: 'offline-ledger-format-deep', executionAuthorized: false, sourceTransmitted: false, modelInvocations: 0, runtimeReady: false,
    quickFreezeSha256, candidateManifestSha256: hash(candidateBytes), sourceRunId: sourceRun.id,
    inputs: dependencies.map(name => ({ path: name, sha256: hash(read(repository, name)) })),
    controls: pins(controls), run: { id: '01-deep-format', caseId: 'FC-D-001', mode: 'deep', status: 'Not Run',
      workspace: 'workspace', filePins: pins(workspaceFiles), reads, bootstrapSha256: hash(Buffer.from(bootstrap)),
      sourceRoot: 'workspace', launchPath: 'control/launch.md', launchSha256: hash(launch),
      originalContentBytes: materials.files.reduce((sum, pin) => sum + pin.bytes, 0),
      toolPayloadBytes: reads.reduce((sum, pin) => sum + pin.bytes, 0), startupBytes: launch.length,
      totalTransferredContentBytes: reads.reduce((sum, pin) => sum + pin.bytes, 0) + launch.length } };
  fs.mkdirSync(output, { mode: 0o700 });
  const write = (relative, bytes) => {
    fs.mkdirSync(path.dirname(path.join(output, relative)), { recursive: true });
    fs.writeFileSync(path.join(output, relative), bytes, { flag: 'wx' });
  };
  for (const [name, bytes] of controls) write(name, bytes);
  for (const [name, bytes] of workspaceFiles) write('workspace/' + name, bytes);
  write('control/freeze.json', json(freeze));
  return { output, manifest: freeze, freezeSha256: hash(json(freeze)) };
}

export function verifyLedgerFormatDeep(output, expectedDigest, { quickMaterials, ...context }) {
  const bytes = read(output, 'control/freeze.json');
  if (!/^[a-f0-9]{64}$/u.test(expectedDigest ?? '') || hash(bytes) !== expectedDigest) throw new Error('Independent freeze digest missing or changed.');
  const freeze = JSON.parse(bytes);
  verifyLedgerFormatQuick(quickMaterials, freeze.quickFreezeSha256, context);
  checkPins(repository, freeze.inputs);
  checkPins(output, freeze.controls);
  if (!read(output, 'control/candidate-manifest.json').equals(read(quickMaterials, 'control/candidate-manifest.json'))) throw new Error('Candidate identity differs from Quick.');
  const workspace = path.join(output, freeze.run.workspace);
  checkPins(workspace, freeze.run.filePins);
  const expectedPaths = ['control/freeze.json', ...freeze.controls.map(pin => pin.path), ...freeze.run.filePins.map(pin => freeze.run.workspace + '/' + pin.path)].sort();
  if (JSON.stringify(paths(output)) !== JSON.stringify(expectedPaths)) throw new Error('Window allowlist mismatch.');
  verifyBoundedReadDelivery(freeze.run.reads, freeze.run.reads.map(pin => ({ id: pin.id, output: read(workspace, pin.path).toString('utf8') })));
  const material = JSON.parse(read(workspace, 'materials.json'));
  verifyBoundedReviewMaterials(material, material.batches.map(pin => read(workspace, pin.path).toString('utf8')));
  return { status: 'Offline Pass', files: freeze.run.filePins.length, reads: freeze.run.reads.length,
    modelInvocations: 0, runtimeDelivery: 'Not Evaluated', reportAcceptance: 'Not Evaluated', executionAuthorized: false, freezeSha256: expectedDigest };
}
