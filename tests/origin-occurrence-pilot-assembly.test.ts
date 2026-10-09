import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import { assembleOriginOccurrencePilot } from '../scripts/assemble-origin-occurrence-pilot.mjs';
import { readText, rootDir } from './test-utils';

const pilot = 'evaluation/prototypes/origin-occurrence/pilot-stage-1';
const script = 'scripts/assemble-origin-occurrence-pilot.mjs';
const instructionSources = [
  'skills/fe-code-review/SKILL.md',
  'skills/fe-code-review/references/fix-review.md',
  'skills/fe-code-review/references/javascript.md',
  'evaluation/prototypes/origin-occurrence/fe-code-review-origin-candidate/SKILL.md',
];
const inputManifest = JSON.parse(readText(`${pilot}/manifest.json`));
const sources = [...instructionSources, script, `${pilot}/manifest.json`, `${pilot}/fix-review-prompt.md`,
  ...inputManifest.packets.flatMap((packet: any) => packet.files.map((file: any) => `${pilot}/${packet.directory}/${file.path}`))];
const sha256 = (bytes: Buffer) => crypto.createHash('sha256').update(bytes).digest('hex');

function inventory(directory: string, prefix = ''): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relative = `${prefix}${entry.name}`;
    if (entry.isDirectory()) return inventory(path.join(directory, entry.name), `${relative}/`);
    expect(entry.isFile()).toBe(true);
    return [relative];
  }).sort();
}

let temporary: string;
let outputDir: string;

beforeEach(() => {
  temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'origin-pilot-assembly-test-'));
  outputDir = path.join(temporary, 'assembled');
});
afterEach(() => fs.rmSync(temporary, { recursive: true, force: true }));

function sourceCopy() {
  const repositoryRoot = path.join(temporary, 'source');
  for (const relative of sources) {
    const filename = path.join(repositoryRoot, relative);
    fs.mkdirSync(path.dirname(filename), { recursive: true });
    fs.copyFileSync(path.join(rootDir, relative), filename);
  }
  return repositoryRoot;
}

describe('Origin/reproduction offline instruction assembly', () => {
  test('records exact bytes and separate evaluator metadata without authorizing execution', () => {
    const before = sources.map((source) => sha256(fs.readFileSync(path.join(rootDir, source))));
    const result = assembleOriginOccurrencePilot({ outputDir });
    expect(result).toMatchObject({ version: 1, status: 'offline-instructions-assembled', runtimeReady: false,
      sourceTransferAuthorized: false, modelInvocations: 0, clientIsolation: 'Not Evaluated', reportAcceptance: 'Not Evaluated' });
    expect(result.packets.map((packet: any) => [packet.order, packet.caseId, packet.mode, packet.files.length]))
      .toEqual([[1, 'O-09', 'fix', 11], [2, 'O-11', 'fix', 9]]);
    expect(JSON.parse(fs.readFileSync(path.join(outputDir, 'assembly.json'), 'utf8'))).toEqual(result);
    expect(inventory(outputDir)).toEqual(['assembly.json', ...result.packets.flatMap((packet: any) =>
      packet.files.map((file: any) => `${packet.directory}/${file.path}`))].sort());
    for (const packet of result.packets) {
      for (const file of packet.files) {
        const bytes = fs.readFileSync(path.join(outputDir, packet.directory, file.path));
        expect(bytes.length).toBe(file.bytes);
        expect(sha256(bytes)).toBe(file.sha256);
      }
    }
    expect(result.inputManifestSha256).toBe(sha256(fs.readFileSync(path.join(rootDir, pilot, 'manifest.json'))));
    expect(result.promptTemplate.sha256).toBe(sha256(fs.readFileSync(path.join(rootDir, result.promptTemplate.path))));
    expect(result.assembler.sha256).toBe(sha256(fs.readFileSync(path.join(rootDir, script))));
    expect(sources.map((source) => sha256(fs.readFileSync(path.join(rootDir, source))))).toEqual(before);
  });

  test.each([0, 1])('packet %i uses unchanged instructions, resolvable paths and no grading inputs', (index) => {
    const result = assembleOriginOccurrencePilot({ outputDir });
    expect(result.instructions.map((item: any) => item.source)).toEqual(instructionSources);
    const packet = result.packets[index];
    const directory = path.join(outputDir, packet.directory);
    const prompt = fs.readFileSync(path.join(directory, 'PROMPT.md'), 'utf8');
    const instructionPaths = [...prompt.matchAll(/^\d+\. `([^`]+)`$/gmu)].map((match) => match[1]);
    expect(instructionPaths).toEqual(packet.instructionLoadOrder);
    expect(instructionPaths).toEqual(result.instructions.map((item: any) => item.path));
    expect([...prompt.matchAll(/^- `([^`]+)`$/gmu)].map((match) => match[1])).toEqual(packet.inputReadOrder);
    expect(packet.inputReadOrder.slice().sort()).toEqual(inputManifest.packets[index].files.map((file: any) => file.path).sort());
    for (const instruction of result.instructions) {
      const copied = fs.readFileSync(path.join(directory, instruction.path));
      expect(copied.equals(fs.readFileSync(path.join(rootDir, instruction.source)))).toBe(true);
      expect(sha256(copied)).toBe(instruction.sha256);
    }
    for (const file of inputManifest.packets[index].files) {
      expect(fs.readFileSync(path.join(directory, file.path)).equals(
        fs.readFileSync(path.join(rootDir, pilot, inputManifest.packets[index].directory, file.path)))).toBe(true);
    }
    expect(prompt).not.toMatch(/\{\{|O-\d{2}|Resolved|Unknown|Not Run|can-close|1\/1|0\/1/u);
    for (const file of packet.files) {
      expect(file.path).not.toMatch(/manifest|assembly\.json|cases\.json|oracles|tests|quick-review|deep-review/u);
      expect(fs.readFileSync(path.join(directory, file.path), 'utf8'))
        .not.toMatch(/O-\d{2}|cases\.json|oracles?\.json|source-cases|\.\.\/|\/Users\/|\/private\//u);
    }
    expect(fs.existsSync(path.join(directory, 'original/profile.mjs'))).toBe(index === 0);
    expect(fs.existsSync(path.join(directory, 'observations.json'))).toBe(index === 0);
    expect(prompt).toContain('不运行 Git 命令或 context collector');
    expect(prompt).toContain('不执行源码或测试');
    expect(prompt).toContain('只将最终报告输出到对话中');
  });

  test('repeated assembly is deterministic without touching an existing packet', () => {
    const first = assembleOriginOccurrencePilot({ outputDir });
    expect(assembleOriginOccurrencePilot({ outputDir: path.join(temporary, 'second') })).toEqual(first);
    expect(() => assembleOriginOccurrencePilot({ outputDir })).toThrow('already exists');
    expect(JSON.parse(fs.readFileSync(path.join(outputDir, 'assembly.json'), 'utf8'))).toEqual(first);
  });

  test.each(['extra-file', 'hash-drift', 'symlink', 'order', 'missing-marker', 'duplicate-marker'])
    ('rejects %s before writing output', (mutation) => {
      const repositoryRoot = sourceCopy();
      const beforePath = path.join(repositoryRoot, pilot, 'inputs/review-b/before/profile.mjs');
      const templatePath = path.join(repositoryRoot, pilot, 'fix-review-prompt.md');
      if (mutation === 'extra-file') fs.writeFileSync(path.join(repositoryRoot, pilot, 'inputs/review-b/answer.md'), 'unexpected');
      if (mutation === 'hash-drift') fs.appendFileSync(beforePath, '\n');
      if (mutation === 'symlink') {
        fs.renameSync(beforePath, `${beforePath}.original`);
        fs.symlinkSync(`${beforePath}.original`, beforePath);
      }
      if (mutation === 'order') {
        const manifest = structuredClone(inputManifest);
        manifest.packets.reverse();
        fs.writeFileSync(path.join(repositoryRoot, pilot, 'manifest.json'), JSON.stringify(manifest));
      }
      if (mutation === 'missing-marker') fs.writeFileSync(templatePath, 'No input placeholder.');
      if (mutation === 'duplicate-marker') fs.appendFileSync(templatePath, '\n{{INPUT_FILES}}\n');
      expect(() => assembleOriginOccurrencePilot({ outputDir, repositoryRoot })).toThrow();
      expect(fs.existsSync(outputDir)).toBe(false);
    });

  test('rejects a symlinked input directory', () => {
    const repositoryRoot = sourceCopy();
    const beforeDir = path.join(repositoryRoot, pilot, 'inputs/review-b/before');
    fs.renameSync(beforeDir, `${beforeDir}-original`);
    fs.symlinkSync(`${beforeDir}-original`, beforeDir);
    expect(() => assembleOriginOccurrencePilot({ outputDir, repositoryRoot })).toThrow('regular input');
    expect(fs.existsSync(outputDir)).toBe(false);
  });

  test('rejects repository output even through a symlinked parent', () => {
    const repositoryRoot = sourceCopy();
    const alias = path.join(temporary, 'alias');
    fs.symlinkSync(repositoryRoot, alias);
    expect(() => assembleOriginOccurrencePilot({ outputDir: path.join(alias, 'output'), repositoryRoot }))
      .toThrow('outside the repository');
    expect(fs.existsSync(path.join(repositoryRoot, 'output'))).toBe(false);
  });

  test('CLI works from a different working directory and rejects invocation options', () => {
    const result = spawnSync(process.execPath, [path.join(rootDir, script), '--output', outputDir],
      { cwd: temporary, encoding: 'utf8', timeout: 10000 });
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({ outputDirectory: outputDir, modelInvocations: 0 });
    const invalid = spawnSync(process.execPath, [path.join(rootDir, script), '--run'],
      { cwd: temporary, encoding: 'utf8', timeout: 10000 });
    expect(invalid.status).toBe(2);
    expect(invalid.stdout).toBe('');
    expect(invalid.stderr).toContain('Usage:');
  });
});
