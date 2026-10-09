import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import { assembleOriginOccurrencePilot } from '../scripts/assemble-origin-occurrence-pilot.mjs';
import { readText, rootDir } from './test-utils';

const prototype = 'evaluation/prototypes/origin-occurrence';
const pilot = `${prototype}/pilot-stage-2`;
const script = 'scripts/assemble-origin-occurrence-pilot.mjs';
const fixTemplate = `${prototype}/pilot-stage-1/fix-review-prompt.md`;
const changeTemplate = `${pilot}/change-review-prompt.md`;
const inputManifest = JSON.parse(readText(`${pilot}/manifest.json`));
const instructionSources = [
  'skills/fe-code-review/SKILL.md',
  'skills/fe-code-review/references/fix-review.md',
  'skills/fe-code-review/references/quick-review.md',
  'skills/fe-code-review/references/deep-review.md',
  'skills/fe-code-review/references/javascript.md',
  'skills/fe-code-review/references/release-risk.md',
  `${prototype}/fe-code-review-origin-candidate/SKILL.md`,
];
const sources = [...instructionSources, script, `${pilot}/manifest.json`, fixTemplate, changeTemplate,
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
  temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'origin-stage-2-assembly-test-'));
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

describe('Origin/reproduction Stage 2 offline assembly', () => {
  test('records ordered mixed modes and exact hashes without enabling model execution', () => {
    const before = sources.map((source) => sha256(fs.readFileSync(path.join(rootDir, source))));
    const result = assembleOriginOccurrencePilot({ outputDir, stage: 2 });
    expect(result).toMatchObject({ version: 1, stage: 2, status: 'offline-instructions-assembled',
      runtimeReady: false, sourceTransferAuthorized: false, modelInvocations: 0,
      clientIsolation: 'Not Evaluated', reportAcceptance: 'Not Evaluated' });
    expect(result.packets.map((packet: any) => [packet.order, packet.caseId, packet.mode, packet.files.length]))
      .toEqual([[3, 'O-10', 'fix', 9], [4, 'O-08', 'quick', 9], [5, 'O-05', 'deep', 10], [6, 'O-13', 'quick', 9]]);
    expect(result.instructions.map((item: any) => item.source).sort()).toEqual(instructionSources.slice().sort());
    expect(result.promptTemplates.map((item: any) => item.path)).toEqual([fixTemplate, changeTemplate]);
    for (const template of result.promptTemplates) {
      expect(template.sha256).toBe(sha256(fs.readFileSync(path.join(rootDir, template.path))));
    }
    expect(result.inputManifestSha256).toBe(sha256(fs.readFileSync(path.join(rootDir, pilot, 'manifest.json'))));
    expect(result.assembler.sha256).toBe(sha256(fs.readFileSync(path.join(rootDir, script))));
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
    expect(sources.map((source) => sha256(fs.readFileSync(path.join(rootDir, source))))).toEqual(before);
  });

  test.each([0, 1, 2, 3])('packet %i includes exactly its mode, applicable references and raw input', (index) => {
    const result = assembleOriginOccurrencePilot({ outputDir, stage: 2 });
    const packet = result.packets[index];
    const directory = path.join(outputDir, packet.directory);
    const prompt = fs.readFileSync(path.join(directory, 'PROMPT.md'), 'utf8');
    const expectedInstructions = [
      'instructions/fe-code-review/SKILL.md',
      `instructions/fe-code-review/references/${packet.mode}-review.md`,
      'instructions/fe-code-review/references/javascript.md',
      ...(packet.mode === 'deep' ? ['instructions/fe-code-review/references/release-risk.md'] : []),
      'instructions/fe-code-review-origin-candidate/SKILL.md',
    ];
    expect(packet.instructionLoadOrder).toEqual(expectedInstructions);
    expect([...prompt.matchAll(/^\d+\. `([^`]+)`$/gmu)].map((match) => match[1])).toEqual(expectedInstructions);
    expect([...prompt.matchAll(/^- `([^`]+)`$/gmu)].map((match) => match[1])).toEqual(packet.inputReadOrder);
    expect(packet.inputReadOrder.slice().sort()).toEqual(inputManifest.packets[index].files.map((file: any) => file.path).sort());
    for (const target of expectedInstructions) {
      const instruction = result.instructions.find((item: any) => item.path === target);
      const bytes = fs.readFileSync(path.join(directory, target));
      expect(bytes.equals(fs.readFileSync(path.join(rootDir, instruction.source)))).toBe(true);
      expect(sha256(bytes)).toBe(instruction.sha256);
    }
    for (const file of inputManifest.packets[index].files) {
      expect(fs.readFileSync(path.join(directory, file.path)).equals(
        fs.readFileSync(path.join(rootDir, pilot, inputManifest.packets[index].directory, file.path)))).toBe(true);
    }
    expect(inventory(directory)).toEqual([...expectedInstructions, ...packet.inputReadOrder, 'PROMPT.md'].sort());
    expect(prompt).not.toMatch(/\{\{|\}\}|O-\d{2}|Amplified|Resolved|Unknown|Not Run|can-close|1\/2|401|gamma/u);
    for (const file of packet.files) {
      expect(file.path).not.toMatch(/manifest|assembly\.json|cases\.json|oracles|tests/u);
      expect(fs.readFileSync(path.join(directory, file.path), 'utf8'))
        .not.toMatch(/O-\d{2}|cases\.json|oracles?\.json|source-cases|\.\.\/|\/Users\/|\/private\//u);
    }
    expect(fs.existsSync(path.join(directory, 'previous-findings.md'))).toBe(packet.mode === 'fix');
    expect(fs.existsSync(path.join(directory, 'observations.json'))).toBe(index === 1);
    expect(prompt).toContain('不运行 Git 命令或 context collector');
    expect(prompt).toContain('不执行源码或测试');
    expect(prompt).toContain('只将最终报告输出到对话中');
    expect(prompt).toContain('生产复现概率');
    if (packet.mode === 'fix') {
      expect(packet.promptTemplate).toBe(fixTemplate);
      expect(prompt).toContain('不扩大为 Quick / Deep Review');
      expect(prompt).toContain('以 `previous-findings.md` 作为上次问题清单');
    } else {
      expect(packet.promptTemplate).toBe(changeTemplate);
      expect(prompt).toContain(`本次模式：${packet.mode === 'quick' ? 'Quick' : 'Deep'} Review。`);
      expect(prompt).not.toContain('previous-findings.md');
      expect(prompt).toContain('不要改为 Fix Review');
    }
  });

  test('reuses the original Fix Prompt and preserves repeat determinism without overwriting', () => {
    const result = assembleOriginOccurrencePilot({ outputDir, stage: 2 });
    const first = result.packets[0];
    const expectedPrompt = readText(fixTemplate).replace('{{INPUT_FILES}}',
      first.inputReadOrder.map((file: string) => `- \`${file}\``).join('\n'));
    expect(fs.readFileSync(path.join(outputDir, first.directory, 'PROMPT.md'), 'utf8')).toBe(expectedPrompt);
    expect(assembleOriginOccurrencePilot({ outputDir: path.join(temporary, 'repeat'), stage: 2 })).toEqual(result);
    expect(() => assembleOriginOccurrencePilot({ outputDir, stage: 2 })).toThrow('already exists');
    expect(JSON.parse(fs.readFileSync(path.join(outputDir, 'assembly.json'), 'utf8'))).toEqual(result);
  });

  test.each(['order', 'mode', 'extra-file', 'hash-drift', 'missing-dependency', 'missing-release-reference',
    'symlink-source', 'symlink-reference', 'missing-marker', 'duplicate-marker', 'unknown-marker'])
    ('rejects %s in a later packet before creating any output', (mutation) => {
      const repositoryRoot = sourceCopy();
      const current = path.join(repositoryRoot, pilot, 'inputs/review-e/current/session.mjs');
      const template = path.join(repositoryRoot, changeTemplate);
      const reference = path.join(repositoryRoot, 'skills/fe-code-review/references/release-risk.md');
      if (mutation === 'order' || mutation === 'mode') {
        const manifest = structuredClone(inputManifest);
        if (mutation === 'order') manifest.packets.reverse();
        else manifest.packets[2].mode = 'quick';
        fs.writeFileSync(path.join(repositoryRoot, pilot, 'manifest.json'), JSON.stringify(manifest));
      }
      if (mutation === 'extra-file') fs.writeFileSync(path.join(repositoryRoot, pilot, 'inputs/review-e/answer.md'), 'unexpected');
      if (mutation === 'hash-drift') fs.appendFileSync(current, '\n');
      if (mutation === 'missing-dependency') fs.renameSync(path.join(repositoryRoot, pilot, 'inputs/review-f/current/format.mjs'), path.join(temporary, 'moved.mjs'));
      if (mutation === 'missing-release-reference') fs.renameSync(reference, path.join(temporary, 'missing.md'));
      if (mutation === 'symlink-source' || mutation === 'symlink-reference') {
        const file = mutation === 'symlink-source' ? current : reference;
        const moved = path.join(temporary, 'original');
        fs.renameSync(file, moved);
        fs.symlinkSync(moved, file);
      }
      if (mutation === 'missing-marker') fs.writeFileSync(template, readText(changeTemplate).replace('{{INSTRUCTION_FILES}}', ''));
      if (mutation === 'duplicate-marker') fs.appendFileSync(template, '\n{{MODE}}\n');
      if (mutation === 'unknown-marker') fs.appendFileSync(template, '\n{{ANSWER}}\n');
      expect(() => assembleOriginOccurrencePilot({ outputDir, repositoryRoot, stage: 2 })).toThrow();
      expect(fs.existsSync(outputDir)).toBe(false);
    });

  test.each([0, 3, '2', null])('rejects unsupported API stage %j without writing', (stage) => {
    expect(() => assembleOriginOccurrencePilot({ outputDir, stage })).toThrow('Stage must be 1 or 2');
    expect(fs.existsSync(outputDir)).toBe(false);
  });

  test('CLI selects Stage 2 from a different cwd and rejects runtime or ambiguous stage flags', () => {
    const result = spawnSync(process.execPath, [path.join(rootDir, script), '--stage', '2', '--output', outputDir],
      { cwd: temporary, encoding: 'utf8', timeout: 10000 });
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({ outputDirectory: outputDir, stage: 2, modelInvocations: 0 });
    const rejectedOutput = path.join(temporary, 'rejected');
    for (const args of [
      ['--stage', '3', '--output', rejectedOutput],
      ['--stage', '2', '--run'],
      ['--stage', '2', '--stage', '1', '--output', rejectedOutput],
    ]) {
      const invalid = spawnSync(process.execPath, [path.join(rootDir, script), ...args],
        { cwd: temporary, encoding: 'utf8', timeout: 10000 });
      expect(invalid.status).toBe(2);
      expect(invalid.stdout).toBe('');
      expect(invalid.stderr).toContain('Usage:');
    }
    expect(fs.existsSync(rejectedOutput)).toBe(false);
  });
});
