import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { clarifyLedgerCore, clarifyLedgerReference } from './build-ledger-format-skill.mjs';

const repository = fileURLToPath(new URL('../../', import.meta.url));
const recipe = 'evaluation/prototypes/build-file-coverage-ledger-skill.mjs';
const formatRecipe = 'evaluation/prototypes/build-ledger-format-skill.mjs';
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

export function buildFileCoverageLedgerSkill({ sourceBundle, sourceManifestSha256, output: requestedOutput }) {
  const source = fs.realpathSync(sourceBundle);
  const requested = path.resolve(requestedOutput);
  const output = path.join(fs.realpathSync(path.dirname(requested)), path.basename(requested));
  if (within(fs.realpathSync(path.join(repository, 'skills')), output) ||
      within(source, output) || within(output, source)) {
    throw new Error('Output overlaps formal or frozen candidate trees.');
  }
  if (fs.existsSync(output)) throw new Error('Output already exists.');
  const parentBytes = readRegular(source, 'manifest.json');
  if (!/^[a-f0-9]{64}$/u.test(sourceManifestSha256 ?? '') || sha256(parentBytes) !== sourceManifestSha256) {
    throw new Error('Independent parent manifest digest is missing or changed.');
  }
  const parent = JSON.parse(parentBytes);
  if (parent.kind !== 'offline-file-coverage-skill-candidate' || parent.stableVersion !== 'v0.6.0') {
    throw new Error('Expected the original file-coverage candidate.');
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

  // Compose the existing format correction without rebuilding or editing either frozen parent.
  const original = new Map(files);
  const core = 'fe-code-review/SKILL.md';
  files.set(core, Buffer.from(clarifyLedgerCore(files.get(core).toString('utf8'))));
  for (const mode of ['quick', 'deep']) {
    const name = `fe-code-review/references/${mode}-review.md`;
    files.set(name, Buffer.from(clarifyLedgerReference(files.get(name).toString('utf8'))));
  }
  const manifest = {
    kind: 'offline-file-coverage-ledger-skill-candidate', stableVersion: 'v0.6.0',
    installed: false, runtimeReady: false, modelInvocations: 0,
    parentManifestSha256: sourceManifestSha256,
    sources: parent.sources,
    recipes: [...parent.recipes, ...[formatRecipe, recipe].map(name => ({ path: name, sha256: sha256(readRegular(repository, name)) }))],
    files: [...files].map(([name, bytes]) => ({ path: name, bytes: bytes.length, sha256: sha256(bytes),
      changedFromParent: !original.get(name).equals(bytes) })),
    limitations: [
      'Composition of file coverage and the existing format correction; combined runtime behavior is Not Evaluated.',
      'Local parser/template checks do not establish semantic accuracy, client compliance or total-cost acceptance.',
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
