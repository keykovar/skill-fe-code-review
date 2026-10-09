import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

import * as before from '../evaluation/prototypes/origin-occurrence/pilot-stage-2/inputs/review-c/before/profile.mjs';
import * as current from '../evaluation/prototypes/origin-occurrence/pilot-stage-2/inputs/review-c/current/profile.mjs';
import { brokenUrl, normalizedUrl, previousAccounts, expandedAccounts } from '../evaluation/prototypes/origin-occurrence/source-cases.mjs';
import { readText, rootDir } from './test-utils';

const base = 'evaluation/prototypes/origin-occurrence/pilot-stage-2';
const manifest = JSON.parse(readText(`${base}/manifest.json`));
const packet = manifest.packets[0];
const packetText = (file: string) => readText(`${base}/inputs/review-c/${file}`);
const definition = JSON.parse(readText('evaluation/prototypes/origin-occurrence/cases.json'))
  .cases.find((item: { id: string }) => item.id === 'O-10');
const snapshots = [{ label: 'before', module: before }, { label: 'current', module: current }];

function inventory(directory: string, prefix = ''): string[] {
  expect(fs.lstatSync(directory).isSymbolicLink()).toBe(false);
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relative = `${prefix}${entry.name}`;
    expect(entry.isSymbolicLink()).toBe(false);
    if (entry.isDirectory()) return inventory(path.join(directory, entry.name), `${relative}/`);
    expect(entry.isFile()).toBe(true);
    return [relative];
  }).sort();
}

function capture(module: typeof before) {
  const urls: string[] = [];
  const client = module.createProfileClient((url: string) => {
    urls.push(url);
    // The stub records URL construction; it does not model real server routing.
    return { account: new URL(url).pathname.split('/').at(-1) };
  });
  return { client, urls };
}

describe('Origin/reproduction Stage 2 input packets and O-10 caller', () => {
  test('retains Stage 2 order and modes without enabling a runtime or transfer', () => {
    expect(manifest).toMatchObject({ version: 1, status: 'offline-inputs-prepared',
      runtimeReady: false, sourceTransferAuthorized: false, modelInvocations: 0,
      sourcePolicy: 'public-synthetic-only' });
    expect(manifest.packets.map(({ order, caseId, mode, directory }: any) => ({ order, caseId, mode, directory }))).toEqual([
      { order: 3, caseId: 'O-10', mode: 'fix', directory: 'inputs/review-c' },
      { order: 4, caseId: 'O-08', mode: 'quick', directory: 'inputs/review-d' },
      { order: 5, caseId: 'O-05', mode: 'deep', directory: 'inputs/review-e' },
      { order: 6, caseId: 'O-13', mode: 'quick', directory: 'inputs/review-f' },
    ]);
    expect(fs.readdirSync(path.join(rootDir, base, 'inputs')).sort()).toEqual(['review-c', 'review-d', 'review-e', 'review-f']);
  });

  test.each(manifest.packets)('$caseId has the exact regular-file inventory and hashes', (packet) => {
    const inventories: Record<string, string[]> = {
      'O-10': ['before/profile.mjs', 'context.md', 'current/profile.mjs', 'previous-findings.md'],
      'O-08': ['before/responses.mjs', 'context.md', 'current/responses.mjs', 'observations.json'],
      'O-05': ['before/session.mjs', 'context.md', 'current/session.mjs', 'flow.mjs'],
      'O-13': ['before/profile.mjs', 'context.md', 'current/format.mjs', 'current/profile.mjs'],
    };
    const expected = inventories[packet.caseId];
    const packetRoot = path.join(rootDir, base, packet.directory);
    expect(packet.oracleReference).toBe(`../cases.json#${packet.caseId}`);
    expect(packet.files.map((file: { path: string }) => file.path).sort()).toEqual(expected);
    expect(inventory(packetRoot)).toEqual(expected);
    for (const file of packet.files) {
      expect(file.sha256).toMatch(/^[a-f0-9]{64}$/u);
      expect(crypto.createHash('sha256').update(fs.readFileSync(path.join(packetRoot, file.path)))
        .digest('hex')).toBe(file.sha256);
    }
  });

  test('retains the prior URL Risk and its usable line anchor without supplying original attribution', () => {
    const previous = packetText('previous-findings.md');
    expect(previous).toContain('[F-001] [before/profile.mjs:2]');
    expect(previous).toContain('Original severity: Risk');
    expect(previous).toContain("loadProfile('gamma')");
    expect(previous).toContain('Acceptance criteria:');
    expect(previous).not.toMatch(/Origin:|Current status|Resolved|Unresolved|New Regression/u);
    expect(packetText('before/profile.mjs').split('\n')[1]).toBe('  return `${base}/${route}`;');
    expect(packetText('context.md')).toContain('No execution records are supplied.');
    expect(packetText('context.md')).toContain('The original reviewed change and its earlier baseline are unavailable.');
  });

  test.each([
    { label: 'before', module: before, owner: brokenUrl },
    { label: 'current', module: current, owner: normalizedUrl },
  ])('$label preserves the matrix URL behavior across boundary separators', ({ module, owner }) => {
    for (const origin of ['https://api.example.test', 'https://api.example.test/', 'https://api.example.test//']) {
      for (const route of ['profiles/gamma', '/profiles/gamma', '//profiles/gamma']) {
        expect(module.joinUrl(origin, route)).toBe(owner(origin, route));
      }
    }
  });

  test('the direct fresh-gamma consumer repairs F-001 URL construction', () => {
    const prior = capture(before);
    const repaired = capture(current);
    prior.client.loadProfile('gamma');
    repaired.client.loadProfile('gamma');
    expect(prior.urls).toEqual(['https://api.example.test//profiles/gamma']);
    expect(repaired.urls).toEqual(['https://api.example.test/profiles/gamma']);
  });

  test.each(snapshots)('$label already shares the wrong profile across alpha and beta', ({ module }) => {
    const run = capture(module);
    const profiles = previousAccounts.map((account: string) => run.client.loadProfile(account));
    expect(previousAccounts).toEqual(['alpha', 'beta']);
    expect(profiles.map((profile: { account: string }) => profile.account)).toEqual(['alpha', 'alpha']);
    expect(profiles[1]).toBe(profiles[0]);
    expect(run.urls).toEqual(['https://api.example.test/profiles/alpha']);
  });

  test.each(['alpha', 'beta'])('repair exposes gamma to a profile cached for %s', (account) => {
    const prior = capture(before);
    const repaired = capture(current);
    const priorProfile = prior.client.loadProfile(account);
    const currentProfile = repaired.client.loadProfile(account);
    const priorGamma = prior.client.loadProfile('gamma');
    const currentGamma = repaired.client.loadProfile('gamma');
    expect(priorGamma).toEqual({ account: 'gamma' });
    expect(priorGamma).not.toBe(priorProfile);
    expect(currentGamma).toBe(currentProfile);
    expect(currentGamma).toEqual({ account });
    expect(prior.urls).toEqual([
      `https://api.example.test/profiles/${account}`,
      'https://api.example.test//profiles/gamma',
    ]);
    expect(repaired.urls).toEqual([`https://api.example.test/profiles/${account}`]);
  });

  test('gamma now also populates the same cache when it is the first account', () => {
    const prior = capture(before);
    const repaired = capture(current);
    prior.client.loadProfile('gamma');
    const gamma = repaired.client.loadProfile('gamma');
    expect(prior.client.loadProfile('alpha')).toEqual({ account: 'alpha' });
    expect(repaired.client.loadProfile('alpha')).toBe(gamma);
    expect(gamma).toEqual({ account: 'gamma' });
    expect(prior.urls).toHaveLength(2);
    expect(repaired.urls).toEqual(['https://api.example.test/profiles/gamma']);
  });

  test.each(snapshots)('$label gives each fresh client its requested account', ({ module }) => {
    expect(expandedAccounts).toEqual([...previousAccounts, 'gamma']);
    for (const account of expandedAccounts) {
      const run = capture(module);
      expect(run.client.loadProfile(account)).toEqual({ account });
      expect(run.urls).toHaveLength(1);
    }
  });

  test('keeps the original case oracle separate from evaluator-side execution', () => {
    expect(definition.mode).toBe(packet.mode);
    expect(definition.input).toEqual({ previous: { id: 'F-001', severity: 'Risk' },
      problemBaseline: 'brokenUrl', fixed: 'normalizedUrl', cacheBaseline: 'previousAccounts',
      cacheCurrent: 'expandedAccounts', owner: 'sharedCacheKey' });
    expect(definition.oracle).toEqual({ origins: ['Unknown', 'Amplified'],
      states: [['Not Run'], ['Not Run']], closure: 'Resolved', recommendation: 'review-again' });
  });

  test('supplies no observations, current answer or out-of-packet dependency', () => {
    for (const file of packet.files) {
      const text = packetText(file.path);
      expect(text).not.toMatch(/O-\d{2}|F-002|cases\.json|oracles?\.json|source-cases|observations\.json|\.\.\/|\/Users\/|\/private\/|Origin:|Amplified|Retained|Unknown|Not Run|Resolved|review-again|modelInvocations/u);
      if (file.path.endsWith('.mjs')) expect(text).not.toMatch(/\bimport\b|\brequire\s*\(|fetch\s*\(|node:/u);
    }
  });
});
