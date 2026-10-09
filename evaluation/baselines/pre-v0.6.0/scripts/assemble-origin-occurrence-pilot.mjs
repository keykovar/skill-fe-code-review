#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const prototype = 'evaluation/prototypes/origin-occurrence';
const commonInputs = ['context.md', 'previous-findings.md', 'before/profile.mjs', 'current/profile.mjs'];
const stages = {
  1: { firstOrder: 1, packets: [
    { caseId: 'O-09', name: 'review-a', mode: 'fix', inputs: [...commonInputs, 'original/profile.mjs', 'observations.json'] },
    { caseId: 'O-11', name: 'review-b', mode: 'fix', inputs: commonInputs },
  ] },
  2: { firstOrder: 3, packets: [
    { caseId: 'O-10', name: 'review-c', mode: 'fix', inputs: commonInputs },
    { caseId: 'O-08', name: 'review-d', mode: 'quick',
      inputs: ['context.md', 'before/responses.mjs', 'current/responses.mjs', 'observations.json'] },
    { caseId: 'O-05', name: 'review-e', mode: 'deep',
      inputs: ['context.md', 'before/session.mjs', 'current/session.mjs', 'flow.mjs'] },
    { caseId: 'O-13', name: 'review-f', mode: 'quick',
      inputs: ['context.md', 'before/profile.mjs', 'current/profile.mjs', 'current/format.mjs'] },
  ] },
};
const promptPath = (mode) => mode === 'fix'
  ? `${prototype}/pilot-stage-1/fix-review-prompt.md`
  : `${prototype}/pilot-stage-2/change-review-prompt.md`;
const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');

function loadInstructions(repository, mode) {
  const sources = [
    ['skills/fe-code-review/SKILL.md', 'instructions/fe-code-review/SKILL.md'],
    [`skills/fe-code-review/references/${mode}-review.md`, `instructions/fe-code-review/references/${mode}-review.md`],
    ['skills/fe-code-review/references/javascript.md', 'instructions/fe-code-review/references/javascript.md'],
  ];
  if (mode === 'deep') sources.push([
    'skills/fe-code-review/references/release-risk.md', 'instructions/fe-code-review/references/release-risk.md',
  ]);
  sources.push([`${prototype}/fe-code-review-origin-candidate/SKILL.md`, 'instructions/fe-code-review-origin-candidate/SKILL.md']);
  return sources.map(([source, target]) => ({ path: target, source, bytes: readRegular(repository, source) }));
}

function renderPrompt(template, spec, instructions) {
  const replacements = { INPUT_FILES: spec.inputs.map((file) => `- \`${file}\``).join('\n') };
  if (spec.mode !== 'fix') {
    replacements.MODE = spec.mode === 'quick' ? 'Quick' : 'Deep';
    replacements.INSTRUCTION_FILES = instructions.map((item, index) => `${index + 1}. \`${item.path}\``).join('\n');
  }
  let prompt = template;
  for (const [key, value] of Object.entries(replacements)) {
    const marker = `{{${key}}}`;
    if (template.split(marker).length !== 2) throw new Error(`Prompt must contain exactly one ${key} placeholder.`);
    prompt = prompt.replace(marker, value);
  }
  if (prompt.includes('{{') || prompt.includes('}}')) throw new Error('Unexpected Prompt placeholder.');
  return prompt;
}

function readRegular(root, relative, maxBytes = Infinity) {
  let cursor = root;
  const parts = relative.split('/');
  for (const [index, part] of parts.entries()) {
    if (!part || part === '.' || part === '..') throw new Error(`Invalid input path: ${relative}`);
    cursor = path.join(cursor, part);
    const stat = fs.lstatSync(cursor);
    if (stat.isSymbolicLink() || (index === parts.length - 1 ? !stat.isFile() : !stat.isDirectory())) {
      throw new Error(`Expected regular input: ${relative}`);
    }
    if (index === parts.length - 1 && stat.size > maxBytes) throw new Error(`Input exceeds byte limit: ${relative}`);
  }
  const bytes = fs.readFileSync(cursor);
  if (bytes.length > maxBytes) throw new Error(`Input exceeds byte limit: ${relative}`);
  return bytes;
}

function inventory(directory, prefix = '') {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relative = `${prefix}${entry.name}`;
    if (entry.isDirectory()) return inventory(path.join(directory, entry.name), `${relative}/`);
    if (!entry.isFile()) throw new Error(`Expected regular input: ${relative}`);
    return [relative];
  }).sort();
}

function assertSameFiles(actual, expected) {
  if (JSON.stringify([...actual].sort()) !== JSON.stringify([...expected].sort())) {
    throw new Error('Input file inventory mismatch.');
  }
}

function prepareAssembly(repositoryRoot, stage) {
  if (stage !== 1 && stage !== 2) throw new Error('Stage must be 1 or 2.');
  const pilot = `${prototype}/pilot-stage-${stage}`;
  const { firstOrder, packets: stageSpecs } = stages[stage];
  const packetSpecs = stageSpecs.map((spec) => ({ ...spec, inputs: [...spec.inputs] }));
  const repository = fs.realpathSync(repositoryRoot);

  const manifestBytes = readRegular(repository, `${pilot}/manifest.json`);
  const manifest = JSON.parse(manifestBytes.toString('utf8'));
  if (manifest.version !== 1 || manifest.runtimeReady !== false || manifest.sourceTransferAuthorized !== false ||
      manifest.modelInvocations !== 0 || manifest.sourcePolicy !== 'public-synthetic-only' ||
      manifest.packets?.length !== packetSpecs.length) {
    throw new Error('Unexpected offline input manifest.');
  }
  const modes = [...new Set(packetSpecs.map((spec) => spec.mode))];
  const instructionsByMode = new Map(modes.map((mode) => [mode, loadInstructions(repository, mode)]));
  const instructions = [...new Map([...instructionsByMode.values()].flat().map((item) => [item.path, item])).values()];
  const templates = new Map([...new Set(modes.map(promptPath))].map((source) => [source, readRegular(repository, source)]));

  // Validate and load all allowlisted bytes before creating any output.
  const packets = packetSpecs.map((spec, index) => {
    const packet = manifest.packets[index];
    const sourceDirectory = `${pilot}/inputs/${spec.name}`;
    if (packet.order !== index + firstOrder || packet.caseId !== spec.caseId || packet.mode !== spec.mode ||
        packet.directory !== `inputs/${spec.name}` || !Array.isArray(packet.files)) {
      throw new Error('Unexpected packet order or scope.');
    }
    assertSameFiles(packet.files.map((file) => file.path), spec.inputs);
    const inputs = spec.inputs.map((filename) => {
      const bytes = readRegular(repository, `${sourceDirectory}/${filename}`);
      if (sha256(bytes) !== packet.files.find((file) => file.path === filename).sha256) {
        throw new Error(`Input hash mismatch: ${spec.name}/${filename}`);
      }
      return { path: filename, bytes };
    });
    assertSameFiles(inventory(path.join(repository, sourceDirectory)), spec.inputs);
    const selectedInstructions = instructionsByMode.get(spec.mode);
    const prompt = renderPrompt(templates.get(promptPath(spec.mode)).toString('utf8'), spec, selectedInstructions);
    return { spec, selectedInstructions, files: [...selectedInstructions, ...inputs, { path: 'PROMPT.md', bytes: Buffer.from(prompt) }] };
  });

  const templateRecords = [...templates].map(([source, bytes]) => ({ path: source, sha256: sha256(bytes) }));
  const result = {
    version: 1,
    status: 'offline-instructions-assembled',
    runtimeReady: false,
    sourceTransferAuthorized: false,
    modelInvocations: 0,
    clientIsolation: 'Not Evaluated',
    reportAcceptance: 'Not Evaluated',
    sourcePolicy: 'public-synthetic-only',
    inputManifestSha256: sha256(manifestBytes),
    ...(stage === 1 ? { promptTemplate: templateRecords[0] } : { stage, promptTemplates: templateRecords }),
    assembler: { path: 'scripts/assemble-origin-occurrence-pilot.mjs',
      sha256: sha256(readRegular(repository, 'scripts/assemble-origin-occurrence-pilot.mjs')) },
    instructions: instructions.map(({ path: target, source, bytes }) => ({ path: target, source, sha256: sha256(bytes) })),
    packets: packets.map(({ spec, files, selectedInstructions }, index) => ({
      order: index + firstOrder, caseId: spec.caseId, directory: `packets/${spec.name}`, mode: spec.mode,
      ...(stage === 2 ? { promptTemplate: promptPath(spec.mode) } : {}),
      prompt: 'PROMPT.md', instructionLoadOrder: selectedInstructions.map((item) => item.path), inputReadOrder: spec.inputs,
      files: files.map(({ path: filename, bytes }) => ({ path: filename, bytes: bytes.length, sha256: sha256(bytes) }))
        .sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0),
    })),
  };
  return { result, packets };
}

export function readOriginOccurrencePilotAssembly({ assemblyDir, repositoryRoot = rootDir, stage = 1 }) {
  const directory = path.resolve(assemblyDir);
  if (!fs.lstatSync(directory).isDirectory()) throw new Error('Expected regular assembly directory.');
  const { result, packets } = prepareAssembly(repositoryRoot, stage);
  const assemblyBytes = readRegular(directory, 'assembly.json', 65536);
  if (!isDeepStrictEqual(JSON.parse(assemblyBytes.toString('utf8')), result)) {
    throw new Error('Assembly metadata differs from the trusted current specification; rebuild the assembly.');
  }
  assertSameFiles(inventory(directory), ['assembly.json', ...result.packets.flatMap((packet) =>
    packet.files.map((file) => `${packet.directory}/${file.path}`))]);
  for (const packet of packets) {
    for (const file of packet.files) {
      const bytes = readRegular(directory, `packets/${packet.spec.name}/${file.path}`, file.bytes.length);
      if (!bytes.equals(file.bytes)) throw new Error(`Assembly bytes differ: ${packet.spec.name}/${file.path}`);
    }
  }
  return { result, packets, assemblyBytes };
}

export function assembleOriginOccurrencePilot({ outputDir, repositoryRoot = rootDir, stage = 1 }) {
  if (!outputDir) throw new Error('A new output directory is required.');
  const repository = fs.realpathSync(repositoryRoot);
  const requested = path.resolve(outputDir);
  const destination = path.join(fs.realpathSync(path.dirname(requested)), path.basename(requested));
  if (destination === repository || destination.startsWith(`${repository}${path.sep}`)) {
    throw new Error('Output must be outside the repository.');
  }
  if (fs.existsSync(destination) || fs.lstatSync(destination, { throwIfNoEntry: false })) {
    throw new Error('Output already exists; refusing to overwrite.');
  }
  const { result, packets } = prepareAssembly(repositoryRoot, stage);
  fs.mkdirSync(destination);
  for (const { spec, files } of packets) {
    for (const { path: filename, bytes } of files) {
      const target = path.join(destination, 'packets', spec.name, filename);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, bytes, { flag: 'wx' });
    }
  }
  fs.writeFileSync(path.join(destination, 'assembly.json'), `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' });
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const args = process.argv.slice(2);
    let stage = 1;
    if (args.length === 4 && args[0] === '--stage' && ['1', '2'].includes(args[1])) {
      stage = Number(args[1]);
      args.splice(0, 2);
    }
    if (args.length !== 2 || args[0] !== '--output') {
      throw new Error('Usage: node assemble-origin-occurrence-pilot.mjs [--stage <1|2>] --output <new-directory>');
    }
    const result = assembleOriginOccurrencePilot({ outputDir: args[1], stage });
    console.log(JSON.stringify({ outputDirectory: path.resolve(args[1]), ...result }, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
}
