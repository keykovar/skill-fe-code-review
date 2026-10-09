import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import { assembleOriginOccurrencePilot } from '../scripts/assemble-origin-occurrence-pilot.mjs';
import { OFFLINE_LIMITS, prepareOriginOccurrenceApi, TRANSPORT_WRAPPER } from '../scripts/origin-occurrence-api.mjs';
import { rootDir } from './test-utils';

const sha256 = (bytes: Buffer) => crypto.createHash('sha256').update(bytes).digest('hex');
const script = path.join(rootDir, 'scripts/origin-occurrence-api.mjs');
let temporary: string;
let assemblyDir: string;
let outputDir: string;

beforeEach(() => {
  temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'origin-api-request-test-'));
  assemblyDir = path.join(temporary, 'assembly');
  outputDir = path.join(temporary, 'requests');
});
afterEach(() => fs.rmSync(temporary, { recursive: true, force: true }));

function prepare(stage = 1) {
  return prepareOriginOccurrenceApi({ assemblyDir, outputDir, stage });
}

function body(filename: string) {
  return JSON.parse(fs.readFileSync(path.join(outputDir, filename), 'utf8'));
}

function inputDocuments(request: any) {
  return JSON.parse(request.input[0].content[0].text);
}

function writeManifest(manifest: any) {
  fs.writeFileSync(path.join(assemblyDir, 'assembly.json'), `${JSON.stringify(manifest, null, 2)}\n`);
}

describe('Offline text-only request drafts', () => {
  test.each([1, 2])('stage %i preserves every document byte, order and original Prompt', (stage) => {
    const assembly = assembleOriginOccurrencePilot({ outputDir: assemblyDir, stage });
    const result = prepare(stage);
    expect(result).toMatchObject({ stage, status: 'offline-request-drafts-prepared', runtimeReady: false,
      sourceTransferAuthorized: false, modelInvocations: 0, reportAcceptance: 'Not Evaluated', transportFreeze: 'Pending' });
    expect(result.offlineLimits).toEqual(OFFLINE_LIMITS);
    expect(result.assemblySha256).toBe(sha256(fs.readFileSync(path.join(assemblyDir, 'assembly.json'))));
    expect(result.packets.map((p: any) => p.caseId)).toEqual(stage === 1 ? ['O-09', 'O-11'] : ['O-10', 'O-08', 'O-05', 'O-13']);
    expect(JSON.parse(fs.readFileSync(path.join(outputDir, 'requests.json'), 'utf8'))).toEqual(result);
    expect(fs.readdirSync(outputDir).sort()).toEqual(['requests', 'requests.json']);
    expect(fs.readdirSync(path.join(outputDir, 'requests')).sort()).toEqual(result.packets.map((p: any) => path.basename(p.path)).sort());
    for (const [index, packet] of result.packets.entries()) {
      const bytes = fs.readFileSync(path.join(outputDir, packet.path));
      expect(bytes.length).toBe(packet.bytes);
      expect(sha256(bytes)).toBe(packet.sha256);
      const request = body(packet.path);
      expect(Object.keys(request).sort()).toEqual(['model', 'reasoning', 'instructions', 'input', 'tools', 'tool_choice',
        'stream', 'background', 'store', 'truncation'].sort());
      expect(request).toMatchObject({ model: 'gpt-6-astra', reasoning: { effort: 'xhigh' }, tools: [], tool_choice: 'none',
        stream: false, background: false, store: false, truncation: 'disabled' });
      expect(request.input).toHaveLength(1);
      expect(request.input[0].role).toBe('user');
      expect(request.input[0].content).toHaveLength(1);
      expect(request.input[0].content[0].type).toBe('input_text');
      expect(request.instructions.startsWith(`${TRANSPORT_WRAPPER}\n\n`)).toBe(true);
      const instructions = JSON.parse(request.instructions.slice(TRANSPORT_WRAPPER.length + 2)).documents;
      const inputs = inputDocuments(request);
      expect(Object.keys(inputs).sort()).toEqual(['documents', 'prompt']);
      expect(instructions.map((d: any) => d.path)).toEqual(assembly.packets[index].instructionLoadOrder);
      expect(inputs.documents.map((d: any) => d.path)).toEqual(assembly.packets[index].inputReadOrder);
      expect(inputs.prompt.path).toBe('PROMPT.md');
      const documents = [...instructions, inputs.prompt, ...inputs.documents];
      expect(documents.map((d: any) => d.path).sort()).toEqual(assembly.packets[index].files.map((f: any) => f.path).sort());
      for (const document of documents) {
        expect(Object.keys(document).sort()).toEqual(['content', 'path']);
        const original = fs.readFileSync(path.join(assemblyDir, assembly.packets[index].directory, document.path));
        expect(Buffer.from(document.content).equals(original)).toBe(true);
      }
      const references = instructions.map((d: any) => d.path).filter((p: string) => /references\/(quick|deep|fix)-review\.md$/.test(p));
      expect(references).toEqual([`instructions/fe-code-review/references/${packet.mode}-review.md`]);
      expect(instructions.some((d: any) => d.path.endsWith('/release-risk.md'))).toBe(packet.mode === 'deep');
      expect(instructions.at(-1).path).toBe('instructions/fe-code-review-origin-candidate/SKILL.md');
      for (const forbidden of ['"caseId"', '"assemblySha256"', 'cases.json', 'source-cases.mjs', 'assembly.json',
        'requests.json', 'expected-report', temporary, rootDir]) expect(bytes.toString()).not.toContain(forbidden);
    }
  });

  test('O-11 remains independent of O-09 history, original source and observations', () => {
    assembleOriginOccurrencePilot({ outputDir: assemblyDir });
    const result = prepare();
    const a = inputDocuments(body(result.packets[0].path));
    const b = inputDocuments(body(result.packets[1].path));
    expect(a.documents.map((d: any) => d.path)).toContain('original/profile.mjs');
    expect(a.documents.map((d: any) => d.path)).toContain('observations.json');
    expect(b.documents.map((d: any) => d.path)).toEqual(['context.md', 'previous-findings.md', 'before/profile.mjs', 'current/profile.mjs']);
    expect(b.documents.find((d: any) => d.path === 'previous-findings.md').content)
      .not.toEqual(a.documents.find((d: any) => d.path === 'previous-findings.md').content);
    expect(body(result.packets[1].path)).not.toHaveProperty('previous_response_id');
  });

  test('serialization is deterministic and does not overwrite artifacts', () => {
    assembleOriginOccurrencePilot({ outputDir: assemblyDir });
    const first = prepare();
    const secondDir = path.join(temporary, 'second');
    const second = prepareOriginOccurrenceApi({ assemblyDir, outputDir: secondDir });
    expect(second).toEqual(first);
    for (const packet of first.packets) expect(fs.readFileSync(path.join(secondDir, packet.path)))
      .toEqual(fs.readFileSync(path.join(outputDir, packet.path)));
    expect(() => prepare()).toThrow(/already exists/);
  });

  test('editing a returned manifest cannot change the next assembly specification', () => {
    const first = assembleOriginOccurrencePilot({ outputDir: assemblyDir });
    const originalOrder = [...first.packets[0].inputReadOrder];
    first.packets[0].inputReadOrder.reverse();
    const second = assembleOriginOccurrencePilot({ outputDir: path.join(temporary, 'second-assembly') });
    expect(second.packets[0].inputReadOrder).toEqual(originalOrder);
  });

  const metadataMutations = [
    ['order', (m: any) => { m.packets[0].order = 2; }],
    ['mode', (m: any) => { m.packets[0].mode = 'deep'; }],
    ['packet order', (m: any) => { m.packets.reverse(); }],
    ['instruction order', (m: any) => { m.packets[0].instructionLoadOrder.reverse(); }],
    ['input order', (m: any) => { m.packets[0].inputReadOrder.reverse(); }],
    ['parent path', (m: any) => { m.packets[0].files[0].path = '../answer.md'; }],
    ['absolute path', (m: any) => { m.packets[0].directory = temporary; }],
    ['extra metadata', (m: any) => { m.oracle = 'answer'; }],
    ['authorization', (m: any) => { m.sourceTransferAuthorized = true; }],
  ] as const;
  test.each(metadataMutations)('rejects changed %s before creating output', (_, mutate) => {
    const manifest = assembleOriginOccurrencePilot({ outputDir: assemblyDir });
    mutate(manifest);
    writeManifest(manifest);
    expect(() => prepare()).toThrow(/trusted current specification/);
    expect(fs.existsSync(outputDir)).toBe(false);
  });

  test.each(['PROMPT.md', 'context.md', 'instructions/fe-code-review/SKILL.md'])('rejects self-consistent content/hash tampering: %s', (file) => {
    const manifest = assembleOriginOccurrencePilot({ outputDir: assemblyDir });
    const content = Buffer.from('Tampered but internally consistent.\n');
    fs.writeFileSync(path.join(assemblyDir, 'packets/review-a', file), content);
    Object.assign(manifest.packets[0].files.find((f: any) => f.path === file), { sha256: sha256(content), bytes: content.length });
    for (const instruction of manifest.instructions) if (instruction.path === file) instruction.sha256 = sha256(content);
    writeManifest(manifest);
    expect(() => prepare()).toThrow(/trusted current specification/);
    expect(fs.existsSync(outputDir)).toBe(false);
  });

  test('rejects same-size byte changes with an untouched manifest', () => {
    assembleOriginOccurrencePilot({ outputDir: assemblyDir });
    const file = path.join(assemblyDir, 'packets/review-a/context.md');
    const bytes = fs.readFileSync(file);
    bytes[0] ^= 1;
    fs.writeFileSync(file, bytes);
    expect(() => prepare()).toThrow(/Assembly bytes differ/);
    expect(fs.existsSync(outputDir)).toBe(false);
  });

  test.each(['answer.md', 'packets/review-a/answer.md'])('rejects extra evaluator material at %s', (file) => {
    assembleOriginOccurrencePilot({ outputDir: assemblyDir });
    fs.writeFileSync(path.join(assemblyDir, file), 'answer');
    expect(() => prepare()).toThrow(/inventory mismatch/);
    expect(fs.existsSync(outputDir)).toBe(false);
  });

  test.each(['assembly.json', 'packets/review-a/context.md', 'packets/review-a/instructions'])('rejects symlinked %s', (relative) => {
    assembleOriginOccurrencePilot({ outputDir: assemblyDir });
    const original = path.join(assemblyDir, relative);
    const moved = path.join(temporary, 'symlink-target');
    fs.renameSync(original, moved);
    fs.symlinkSync(moved, original);
    expect(() => prepare()).toThrow(/regular input/);
    expect(fs.existsSync(outputDir)).toBe(false);
  });

  test('rejects a symlinked assembly root', () => {
    assembleOriginOccurrencePilot({ outputDir: assemblyDir });
    const alias = path.join(temporary, 'alias');
    fs.symlinkSync(assemblyDir, alias);
    expect(() => prepareOriginOccurrenceApi({ assemblyDir: alias, outputDir })).toThrow(/regular assembly directory/);
  });

  test.each(['repository', 'assembly'])('rejects output inside %s', (target) => {
    assembleOriginOccurrencePilot({ outputDir: assemblyDir });
    expect(() => prepareOriginOccurrenceApi({ assemblyDir, outputDir: path.join(target === 'repository' ? rootDir : assemblyDir, 'new-api-draft') }))
      .toThrow(/outside/);
  });

  test.each(['invalid-utf8', 'oversized'])('rejects %s instruction source even when assembly is otherwise trusted', (kind) => {
    const manifest = assembleOriginOccurrencePilot({ outputDir: assemblyDir });
    const repositoryRoot = path.join(temporary, 'source');
    const pilot = 'evaluation/prototypes/origin-occurrence/pilot-stage-1';
    const raw = JSON.parse(fs.readFileSync(path.join(rootDir, pilot, 'manifest.json'), 'utf8'));
    const sources = ['scripts/assemble-origin-occurrence-pilot.mjs', `${pilot}/manifest.json`, manifest.promptTemplate.path,
      ...manifest.instructions.map((item: any) => item.source),
      ...raw.packets.flatMap((p: any) => p.files.map((f: any) => `${pilot}/${p.directory}/${f.path}`))];
    for (const file of sources) {
      const destination = path.join(repositoryRoot, file);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.copyFileSync(path.join(rootDir, file), destination);
    }
    fs.writeFileSync(path.join(repositoryRoot, 'skills/fe-code-review/SKILL.md'),
      kind === 'invalid-utf8' ? Buffer.from([0xff]) : Buffer.alloc(OFFLINE_LIMITS.requestBytes, 65));
    const modified = path.join(temporary, 'modified-assembly');
    assembleOriginOccurrencePilot({ outputDir: modified, repositoryRoot });
    expect(() => prepareOriginOccurrenceApi({ assemblyDir: modified, outputDir, repositoryRoot }))
      .toThrow(kind === 'invalid-utf8' ? /UTF-8/ : /byte limit/);
    expect(fs.existsSync(outputDir)).toBe(false);
  });

  test('CLI prepares from an unrelated cwd and refuses execution/config flags', () => {
    assembleOriginOccurrencePilot({ outputDir: assemblyDir });
    const args = [script, 'prepare', '--assembly', assemblyDir, '--output', outputDir];
    const run = spawnSync(process.execPath, args, { cwd: temporary, encoding: 'utf8' });
    expect(run.status, run.stderr).toBe(0);
    expect(JSON.parse(run.stdout).modelInvocations).toBe(0);
    for (const flag of ['--run', '--endpoint', '--api-key']) {
      const rejected = spawnSync(process.execPath, [...args, flag, 'unavailable'], { cwd: temporary, encoding: 'utf8' });
      expect(rejected.status).toBe(2);
      expect(rejected.stderr).toContain('Usage:');
    }
  });
});
