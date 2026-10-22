import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repository = fileURLToPath(new URL('../../', import.meta.url));
const recipe = 'evaluation/prototypes/build-file-coverage-ledger-dedup.mjs';
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const within = (root, filename) => filename === root || filename.startsWith(root + path.sep);

function readRegular(root, relative) {
  if (path.isAbsolute(relative) || relative.split('/').some(part => !part || part === '.' || part === '..')) {
    throw new Error('Invalid candidate path.');
  }
  let filename = root;
  for (const part of relative.split('/')) {
    filename = path.join(filename, part);
    if (fs.lstatSync(filename).isSymbolicLink()) throw new Error('Candidate symlinks are not allowed.');
  }
  if (!fs.lstatSync(filename).isFile()) throw new Error('Candidate input must be a regular file.');
  return fs.readFileSync(filename);
}

function regularPaths(root, prefix = '') {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap(entry => {
    const name = prefix + entry.name;
    if (entry.isDirectory()) return regularPaths(path.join(root, entry.name), name + '/');
    if (!entry.isFile()) throw new Error('Candidate input must contain only regular files and directories.');
    return [name];
  }).sort();
}

function removeDuplicateGuidance(source) {
  const startMarker = '\n以下为格式说明，不属于报告正文。';
  const endMarker = '\n## Chinese Output Template\n';
  if (source.split(startMarker).length !== 2) throw new Error('Duplicate format guidance must occur exactly once.');
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  if (end <= start || !source.slice(start, end).includes('合法示例') || !source.slice(start, end).includes('非法示例')) {
    throw new Error('Duplicate format guidance block is incomplete.');
  }
  return source.slice(0, start) + source.slice(end + 1);
}

export function buildFileCoverageLedgerDedup({ sourceBundle, sourceManifestSha256, output: requestedOutput }) {
  const source = fs.realpathSync(sourceBundle);
  const requested = path.resolve(requestedOutput);
  const output = path.join(fs.realpathSync(path.dirname(requested)), path.basename(requested));
  const formal = fs.realpathSync(path.join(repository, 'skills'));
  if (within(formal, output) || within(source, output) || within(output, source)) {
    throw new Error('Output overlaps formal or frozen candidate trees.');
  }
  if (fs.existsSync(output)) throw new Error('Output already exists.');
  const parentBytes = readRegular(source, 'manifest.json');
  if (!/^[a-f0-9]{64}$/u.test(sourceManifestSha256 ?? '') || sha256(parentBytes) !== sourceManifestSha256) {
    throw new Error('Independent parent manifest digest is missing or changed.');
  }
  const parent = JSON.parse(parentBytes);
  if (parent.kind !== 'offline-file-coverage-ledger-skill-candidate' || parent.stableVersion !== 'v0.6.0') {
    throw new Error('Expected the composed file-coverage ledger candidate.');
  }
  const expectedPaths = ['manifest.json', ...parent.files.map(pin => pin.path)].sort();
  if (JSON.stringify(regularPaths(source)) !== JSON.stringify(expectedPaths) ||
      parent.files.some(pin => !pin.path.startsWith('fe-code-review/'))) {
    throw new Error('Parent file allowlist changed.');
  }
  const files = new Map(parent.files.map(pin => {
    const bytes = readRegular(source, pin.path);
    if (bytes.length !== pin.bytes || sha256(bytes) !== pin.sha256) throw new Error('Parent file changed: ' + pin.path);
    return [pin.path, bytes];
  }));
  for (const pin of [...parent.sources, ...parent.recipes]) {
    if (sha256(readRegular(repository, pin.path)) !== pin.sha256) throw new Error('Parent dependency changed: ' + pin.path);
  }

  const original = new Map(files);
  for (const mode of ['quick', 'deep']) {
    const name = `fe-code-review/references/${mode}-review.md`;
    files.set(name, Buffer.from(removeDuplicateGuidance(files.get(name).toString('utf8'))));
  }
  const manifest = {
    kind: 'offline-file-coverage-ledger-dedup-candidate', stableVersion: 'v0.6.0',
    installed: false, runtimeReady: false, modelInvocations: 0,
    parentManifestSha256: sourceManifestSha256,
    sources: parent.sources,
    recipes: [...parent.recipes, { path: recipe, sha256: sha256(fs.readFileSync(path.join(repository, recipe))) }],
    files: [...files].map(([name, bytes]) => ({ path: name, bytes: bytes.length, sha256: sha256(bytes),
      changedFromParent: !original.get(name).equals(bytes) })),
    removedDuplicateGuidanceBytes: Object.fromEntries(['quick', 'deep'].map(mode => [mode, original.get(`fe-code-review/references/${mode}-review.md`).length - files.get(`fe-code-review/references/${mode}-review.md`).length])),
    limitations: [
      'Offline deduplication candidate; combined runtime behavior is Not Evaluated.',
      'Removing repeated examples does not prove model compliance, semantic accuracy, client isolation or cost improvement.',
    ],
  };
  const manifestBytes = Buffer.from(JSON.stringify(manifest, null, 2) + '\n');
  fs.mkdirSync(output, { mode: 0o700 });
  for (const [name, bytes] of [...files, ['manifest.json', manifestBytes]]) {
    const target = path.join(output, name);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, bytes, { flag: 'wx' });
  }
  return { output, manifest, manifestSha256: sha256(manifestBytes) };
}
