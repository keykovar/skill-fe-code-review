import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

import * as original from '../evaluation/prototypes/origin-occurrence/pilot-stage-1/inputs/review-a/original/profile.mjs';
import * as beforeA from '../evaluation/prototypes/origin-occurrence/pilot-stage-1/inputs/review-a/before/profile.mjs';
import * as currentA from '../evaluation/prototypes/origin-occurrence/pilot-stage-1/inputs/review-a/current/profile.mjs';
import * as beforeB from '../evaluation/prototypes/origin-occurrence/pilot-stage-1/inputs/review-b/before/profile.mjs';
import * as currentB from '../evaluation/prototypes/origin-occurrence/pilot-stage-1/inputs/review-b/current/profile.mjs';
import { brokenUrl, normalizedUrl } from '../evaluation/prototypes/origin-occurrence/source-cases.mjs';
import { readText, rootDir } from './test-utils';

const base = 'evaluation/prototypes/origin-occurrence/pilot-stage-1';
const manifest = JSON.parse(readText(`${base}/manifest.json`));
const cases = JSON.parse(readText('evaluation/prototypes/origin-occurrence/cases.json')).cases;
const packets = manifest.packets as Array<{
  order: number; caseId: string; directory: string; mode: string; oracleReference: string;
  files: Array<{ path: string; sha256: string }>;
}>;
const packetText = (directory: string, file: string) => readText(`${base}/${directory}/${file}`);

function inventory(directory: string, prefix = ''): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relative = `${prefix}${entry.name}`;
    if (entry.isDirectory()) return inventory(path.join(directory, entry.name), `${relative}/`);
    expect(entry.isSymbolicLink()).toBe(false);
    expect(entry.isFile()).toBe(true);
    return [relative];
  }).sort();
}

describe('Origin/reproduction Stage 1 input packets', () => {
  test('prepares only two local Fix inputs, not a runtime or transfer authorization', () => {
    expect(manifest).toMatchObject({ version: 1, status: 'offline-inputs-prepared', runtimeReady: false,
      sourceTransferAuthorized: false, modelInvocations: 0, sourcePolicy: 'public-synthetic-only' });
    expect(packets.map(({ order, caseId, directory, mode }) => ({ order, caseId, directory, mode }))).toEqual([
      { order: 1, caseId: 'O-09', directory: 'inputs/review-a', mode: 'fix' },
      { order: 2, caseId: 'O-11', directory: 'inputs/review-b', mode: 'fix' },
    ]);
    expect(fs.readdirSync(path.join(rootDir, base, 'inputs')).sort()).toEqual(['review-a', 'review-b']);
    for (const packet of packets) {
      expect(cases.find((item: any) => item.id === packet.caseId)?.mode).toBe(packet.mode);
      expect(packet.oracleReference).toBe(`../cases.json#${packet.caseId}`);
    }
  });

  test.each(packets)('$caseId has an exact regular-file inventory with matching hashes', (packet) => {
    const directory = path.join(rootDir, base, packet.directory);
    const common = ['before/profile.mjs', 'context.md', 'current/profile.mjs', 'previous-findings.md'];
    const expected = packet.caseId === 'O-09' ? [...common, 'observations.json', 'original/profile.mjs'].sort() : common.sort();
    expect(packet.files.map((file) => file.path).sort()).toEqual(expected);
    expect(inventory(directory)).toEqual(expected);
    for (const file of packet.files) {
      expect(file.sha256).toMatch(/^[a-f0-9]{64}$/u);
      expect(crypto.createHash('sha256').update(fs.readFileSync(path.join(directory, file.path))).digest('hex')).toBe(file.sha256);
    }
  });

  test.each(packets)('$caseId retains a usable prior Risk finding without a current answer', (packet) => {
    const previous = packetText(packet.directory, 'previous-findings.md');
    expect(previous).toContain('[F-001] [before/profile.mjs:2]');
    expect(previous).toContain('Original severity: Risk');
    expect(previous).toContain('Acceptance criteria:');
    expect(previous).not.toMatch(/Current status|Resolved|Unresolved|can-close|New Regression/u);
    const source = packetText(packet.directory, 'before/profile.mjs').split('\n');
    expect(source[1]).toBe('  return `${base}/${route}`;');
  });

  test('O-09 preserves historical attribution while O-11 withholds it and the original source', () => {
    expect(packetText('inputs/review-a', 'previous-findings.md')).toContain('Origin: New');
    expect(packetText('inputs/review-b', 'previous-findings.md')).not.toMatch(/Origin:|New|Retained|Amplified|Unknown/u);
    expect(fs.existsSync(path.join(rootDir, base, 'inputs/review-b/original'))).toBe(false);
    expect(fs.existsSync(path.join(rootDir, base, 'inputs/review-b/observations.json'))).toBe(false);
    expect(packetText('inputs/review-b', 'context.md')).toContain('No execution records are supplied.');
  });

  test('both packets have byte-identical repair snapshots without becoming identical inputs', () => {
    for (const file of ['before/profile.mjs', 'current/profile.mjs']) {
      expect(packetText('inputs/review-a', file)).toBe(packetText('inputs/review-b', file));
    }
    expect(packetText('inputs/review-a', 'context.md')).not.toBe(packetText('inputs/review-b', 'context.md'));
    expect(packetText('inputs/review-a', 'previous-findings.md')).not.toBe(packetText('inputs/review-b', 'previous-findings.md'));
  });

  test.each([
    { label: 'original', module: original, owner: normalizedUrl },
    { label: 'A before', module: beforeA, owner: brokenUrl },
    { label: 'A current', module: currentA, owner: normalizedUrl },
    { label: 'B before', module: beforeB, owner: brokenUrl },
    { label: 'B current', module: currentB, owner: normalizedUrl },
  ])('$label preserves the matrix source behavior under neutral names', ({ module, owner }) => {
    for (const origin of ['https://api.example.test', 'https://api.example.test/', 'https://api.example.test//']) {
      for (const route of ['profile', '/profile', '//profile']) {
        expect(module.joinUrl(origin, route)).toBe(owner(origin, route));
      }
      expect(module.profileUrl(origin)).toBe(owner(origin, '/profile'));
    }
  });

  test('the before snapshot fails the original trigger and current snapshots satisfy the declared contract', () => {
    for (const id of ['O-09', 'O-11']) {
      const input = cases.find((item: any) => item.id === id).input;
      expect(beforeA.profileUrl(input.args[0])).not.toBe(input.expected);
      expect(currentA.profileUrl(input.args[0])).toBe(input.expected);
      expect(currentB.profileUrl('https://api.example.test')).toBe(input.expected);
      expect(original.profileUrl(input.args[0])).toBe(input.expected);
    }
  });

  test('O-09 raw records replay independently and retain separate pre/post denominators', () => {
    const observation = JSON.parse(packetText('inputs/review-a', 'observations.json'));
    const definition = cases.find((item: any) => item.id === 'O-09');
    expect(observation.unit).toBe('one completed profileUrl call using the named snapshot');
    expect(observation.environment).toBe('local Node synthetic URL call');
    expect(observation.records).toHaveLength(2);
    const modules = [beforeA, currentA];
    const counts = observation.records.map((record: any, index: number) => {
      expect(record.snapshot).toBe(index === 0 ? 'before/profile.mjs' : 'current/profile.mjs');
      expect(record.completed).toBe(true);
      expect(record.function).toBe('profileUrl');
      expect(record.args).toEqual([definition.input.args[0]]);
      const actual = modules[index].profileUrl(...record.args);
      expect(actual).toBe(record.actual);
      expect(actual).toBe(definition.input.observations[index].actual);
      const failure = actual !== definition.input.expected;
      expect(record.outcome).toBe(failure ? 'failure' : 'success');
      return [Number(failure), 1];
    });
    expect(counts).toEqual(definition.oracle.counts);
  });

  test.each(packets)('$caseId contains no evaluator answer or out-of-packet file reference', (packet) => {
    for (const file of packet.files) {
      const text = packetText(packet.directory, file.path);
      expect(text).not.toMatch(/O-\d{2}|cases\.json|oracles?\.json|source-cases|\.\.\/|\/Users\/|\/private\/|Resolved|Unknown|Not Run|can-close|modelInvocations/u);
      if (file.path.endsWith('.mjs')) expect(text).not.toMatch(/\bimport\b|\brequire\s*\(|fetch\s*\(|node:/u);
    }
  });
});
