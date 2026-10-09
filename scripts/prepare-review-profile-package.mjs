#!/usr/bin/env node

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const base = 'evaluation/prototypes/origin-occurrence';
const candidate = `${base}/integration-12`;
const selection = `${base}/integration-11-example-corrections-01/manifest.json`;
const sha = (value) => createHash('sha256').update(value).digest('hex');
const frozen = {
  [`${candidate}/manifest.json`]: 'be21a588adf3a846387b850dac0c9ea2a0ee12171f857b0096e0aa9c023094cc',
  [selection]: '253bd115cdeed5f6dfb7374d889bc14bed67500c0fac0423b4c49dac5a7c4712',
  'scripts/legacy/validate-review-output.mjs': '1c6c8dea35bed929c74c437737cf3d0229568c0f07f144ab5a82735ea65972ae',
  'scripts/legacy/validate-review-output-strict.mjs': '74b3260a928eaa9a54648f59b128344088b17613a22d9b1770e6d2f29bb49b0c',
};
const safePath = (value) => typeof value === 'string' && !value.includes('\\') && !value.includes('\0') &&
  value.split('/').every((part) => part && part !== '.' && part !== '..');

const readme = `# FE Code Review Preview Package

Local v0.6.0 profile preview, not an installed or published release. Stable release remains v0.5.0.
The twelve Skill files are byte-identical to the accepted integration-12 candidate.
Client/package runtime acceptance is still pending; runtimeReady=false.

## Contents

- skills/fe-code-review: Markdown Skill, selected references and existing context collector.
- scripts/validate-review-output.mjs: one public API/CLI with the old default and explicit v0.6.0 profile.
- scripts/legacy: unchanged v0.5.0 validator and strict helper for default compatibility.
- examples/outputs: six selected bilingual authored reports; not runtime evidence or expected model answers.

## Local Validator

Run from this package directory with Node.js. Only built-in modules are required.

    node scripts/validate-review-output.mjs --mode quick --profile v0.6.0 --source-root /review examples/outputs/quick.en.md

For the API, import validateReviewOutput from ./scripts/validate-review-output.mjs.
Use validateReviewOutput(markdown, mode) for the unchanged old result, or pass
{ profile: 'v0.6.0', sourceRoot: '/review' } as the third argument. The illustrative
examples use /review; real linked reports require an independently supplied canonical
absolute POSIX source root. Plain locations require no source root. Unsupported options fail.
CLI exit codes: 0 valid structure/fields, 1 invalid report, 2 invocation/read error.

## Evidence Limits

Profile checks cover structure and Origin/Reproduction grammar. They do not establish
defect truth, severity, observation provenance, closure, summary tallies or recommendation
meaning. Complete review acceptance remains separate. Reports are never rewritten;
raw legacy results and explicit observation groups remain available. Link checks are lexical
and never inspect the source filesystem. Oracle/group adjudication is evaluator-only.

Ordinary Skill use does not require Node, Vitest or PyYAML. Those are maintainer tools;
the optional context collector uses Node. This package does not install dependencies,
modify client configuration, invoke a model, or validate Codex/Cursor/Claude runtime behavior.
`;

export function prepareReviewProfilePackage(outputDirectory) {
  const output = path.resolve(outputDirectory);
  assert.equal(fs.existsSync(output), false, 'Output must be a new directory.');
  const inputs = [];
  const files = new Map();
  const read = (filename, expected = frozen[filename]) => {
    assert.ok(safePath(filename), `Invalid input path: ${filename}`);
    const value = fs.readFileSync(path.join(root, filename));
    const hash = sha(value);
    if (expected) assert.equal(hash, expected, `Frozen input changed: ${filename}`);
    inputs.push({ path: filename, sha256: hash, bytes: value.length });
    return value;
  };
  const add = (filename, value) => {
    assert.ok(safePath(filename) && !files.has(filename), `Invalid or duplicate output: ${filename}`);
    files.set(filename, Buffer.from(value));
  };
  const manifest = JSON.parse(read(`${candidate}/manifest.json`));
  assert.equal(manifest.revision, 'integration-12');
  assert.equal(manifest.outputs.length, 12);
  for (const pin of manifest.outputs) {
    assert.ok(pin.path.startsWith('skill/fe-code-review/'));
    const filename = pin.path.replace(/^skill\//u, 'skills/');
    add(filename, read(filename, pin.sha256));
  }
  const examples = JSON.parse(read(selection)).examples;
  assert.deepEqual(examples.map((item) => item.name).sort(),
    ['quick', 'deep', 'fix'].flatMap((mode) => [`${mode}.en.md`, `${mode}.zh-CN.md`]).sort());
  for (const example of examples) {
    const filename = `examples/outputs/${example.name}`;
    add(filename, read(filename, example.sha256));
  }
  for (const filename of ['validate-review-output.mjs', 'validate-review-output-strict.mjs']) {
    add(`scripts/legacy/${filename}`, read(`scripts/legacy/${filename}`));
  }
  add('scripts/validate-review-output.mjs', read('scripts/validate-review-output.mjs'));
  add('scripts/review-output-v060.mjs', read('scripts/review-output-v060.mjs'));
  add('LICENSE', read('LICENSE'));
  add('README.md', readme);
  add('package.json', JSON.stringify({ name: 'skill-fe-code-review-preview', private: true, type: 'module',
    scripts: { 'evaluation:review-output': 'node scripts/validate-review-output.mjs' } }, null, 2) + '\n');
  read('scripts/prepare-review-profile-package.mjs');
  const result = {
    schemaVersion: 1, profile: 'v0.6.0', candidateRevision: 'integration-12',
    status: 'local-preview-only', stableRelease: 'v0.5.0', runtimeReady: false,
    modelInvocations: 0, installed: false, published: false,
    inputs, outputs: [...files].map(([filename, value]) => ({ path: filename, sha256: sha(value), bytes: value.length })),
    transformations: ['Copy formal runtime files directly; all accepted Skill/example bytes and legacy validator bytes are preserved.'],
    limitations: ['Package material identity and local validator checks are not client/runtime or release acceptance.'],
  };
  // Collect and check every input before creating a fresh output; never overwrite an existing package.
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.mkdirSync(output);
  for (const [filename, value] of files) {
    const target = path.join(output, filename);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, value, { flag: 'wx' });
  }
  fs.writeFileSync(path.join(output, 'manifest.json'), JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
  return result;
}

export function verifyReviewProfilePackage(directory) {
  const output = path.resolve(directory);
  const manifest = JSON.parse(fs.readFileSync(path.join(output, 'manifest.json'), 'utf8'));
  assert.equal(manifest.profile, 'v0.6.0');
  assert.equal(manifest.runtimeReady, false);
  const actual = [];
  const walk = (relative = '') => {
    for (const entry of fs.readdirSync(path.join(output, relative), { withFileTypes: true })) {
      const filename = relative ? `${relative}/${entry.name}` : entry.name;
      assert.equal(entry.isSymbolicLink(), false, `Symlink not supported: ${filename}`);
      if (entry.isDirectory()) walk(filename);
      else { assert.ok(entry.isFile()); actual.push(filename); }
    }
  };
  walk();
  const expected = manifest.outputs.map((pin) => pin.path);
  assert.equal(new Set(expected).size, expected.length);
  assert.deepEqual(actual.sort(), [...expected, 'manifest.json'].sort());
  for (const pin of manifest.outputs) {
    assert.ok(safePath(pin.path));
    const value = fs.readFileSync(path.join(output, pin.path));
    assert.equal(value.length, pin.bytes, `Changed size: ${pin.path}`);
    assert.equal(sha(value), pin.sha256, `Changed content: ${pin.path}`);
  }
  return { status: 'Pass', files: expected.length, skillFiles: expected.filter((p) => p.startsWith('skills/')).length,
    manifestSha256: sha(fs.readFileSync(path.join(output, 'manifest.json'))), runtimeReady: false,
    limitation: 'Integrity relative to this manifest only; compare its hash with the trusted preparation record.' };
}

function isMain() {
  if (!process.argv[1]) return false;
  if (import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) return true;
  try {
    return import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href;
  } catch {
    // API hosts such as node - need not have a file-backed entry point.
    return false;
  }
}

if (isMain()) {
  try {
    const [flag, directory, ...extra] = process.argv.slice(2);
    if (!['--output', '--verify'].includes(flag) || !directory || extra.length) {
      throw new Error('Usage: node scripts/prepare-review-profile-package.mjs <--output new-directory | --verify directory>');
    }
    if (flag === '--output') prepareReviewProfilePackage(directory);
    process.stdout.write(`${JSON.stringify(verifyReviewProfilePackage(directory), null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
