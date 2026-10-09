import path from 'node:path';
import { describe, expect, test } from 'vitest';

import * as beforeD from '../evaluation/prototypes/origin-occurrence/pilot-stage-2/inputs/review-d/before/responses.mjs';
import * as currentD from '../evaluation/prototypes/origin-occurrence/pilot-stage-2/inputs/review-d/current/responses.mjs';
import * as beforeE from '../evaluation/prototypes/origin-occurrence/pilot-stage-2/inputs/review-e/before/session.mjs';
import * as currentE from '../evaluation/prototypes/origin-occurrence/pilot-stage-2/inputs/review-e/current/session.mjs';
import { openAccount } from '../evaluation/prototypes/origin-occurrence/pilot-stage-2/inputs/review-e/flow.mjs';
import * as beforeF from '../evaluation/prototypes/origin-occurrence/pilot-stage-2/inputs/review-f/before/profile.mjs';
import * as currentF from '../evaluation/prototypes/origin-occurrence/pilot-stage-2/inputs/review-f/current/profile.mjs';
import { profileLabel as formatLabel } from '../evaluation/prototypes/origin-occurrence/pilot-stage-2/inputs/review-f/current/format.mjs';
import * as source from '../evaluation/prototypes/origin-occurrence/source-cases.mjs';
import { readText } from './test-utils';

const base = 'evaluation/prototypes/origin-occurrence/pilot-stage-2';
const manifest = JSON.parse(readText(`${base}/manifest.json`));
const matrix = JSON.parse(readText('evaluation/prototypes/origin-occurrence/cases.json'));
const caseById = (id: string) => matrix.cases.find((item: { id: string }) => item.id === id);
const packetText = (directory: string, file: string) => readText(`${base}/${directory}/${file}`);
const observation = JSON.parse(packetText('inputs/review-d', 'observations.json'));

describe('Stage 2 remaining input boundaries', () => {
  test.each(manifest.packets.slice(1))('$caseId provides only its source contract and allowed records', (packet) => {
    const context = packetText(packet.directory, 'context.md');
    const mode = packet.mode === 'quick' ? 'Quick' : 'Deep';
    expect(context).toContain(`read-only ${mode} Review in Simplified Chinese`);
    expect(context).toContain('No Git checkout is supplied.');
    expect(context).toContain('original comparison baseline');
    expect(packet.files.some((file: { path: string }) => file.path === 'observations.json')).toBe(packet.caseId === 'O-08');
    if (packet.caseId !== 'O-08') expect(context).toContain('No execution records are supplied.');
    for (const file of packet.files) {
      const text = packetText(packet.directory, file.path);
      expect(text).not.toMatch(/O-\d{2}|F-\d{3}|cases\.json|oracles?\.json|source-cases|\.\.\/|\/Users\/|\/private\/|Origin:|Amplified|Retained|Unknown|Not Run|Resolved|New Regression|fix-before|can-submit|modelInvocations|1\/2|Blocking|Simplify|\bKeep\b/u);
      if (file.path.endsWith('.mjs')) {
        expect(text).not.toMatch(/\bimport\s*\(|\brequire\s*\(|\bfetch\s*\(|node:/u);
        const dependencies = [...text.matchAll(/\bfrom\s+['"]([^'"]+)['"]/gu)].map((match) => match[1]);
        const expected = packet.caseId === 'O-13' && file.path === 'current/profile.mjs' ? ['./format.mjs'] : [];
        expect(dependencies).toEqual(expected);
        for (const dependency of dependencies) {
          const resolved = path.posix.join(path.posix.dirname(file.path), dependency);
          expect(packet.files.some((entry: { path: string }) => entry.path === resolved)).toBe(true);
        }
      }
    }
  });
});

describe('O-08 response order and supplied observations', () => {
  test.each([[2, 1], [1, 2]])('preserves source behavior for response order %j', (...order) => {
    expect(beforeD.applyResponses(order)).toBe(source.applyResponsesWithGuard(order));
    expect(currentD.applyResponses(order)).toBe(source.applyResponses(order));
    expect(beforeD.applyResponses(order)).toBe(2);
    expect(currentD.applyResponses(order)).toBe(order.at(-1));
  });

  test('each raw record matches its original observation group without adding an aggregate answer', () => {
    const group = matrix.observationGroups[caseById('O-08').input.observations];
    expect(observation.environment).toBe(group.environment);
    expect(observation.unit).toBe(group.unit);
    expect(observation.failureDefinition).toBe(group.failure);
    expect(new Set(observation.records.map((record: any) => record.trial)).size).toBe(group.trials.length);
    expect(observation.records.map((record: any) => record.completed
      ? { completed: true, order: record.args[0], outcome: record.outcome }
      : { completed: false, reason: record.reason })).toEqual(group.trials);
    expect(observation).not.toHaveProperty('counts');
    expect(observation).not.toHaveProperty('origin');
  });

  test('replays completed trials only, excluding setup failure from both numerator and denominator', () => {
    let failures = 0;
    let completed = 0;
    let invalid = 0;
    for (const record of observation.records) {
      expect(record.snapshot).toBe('current/responses.mjs');
      if (!record.completed) {
        expect(record.reason).toBe('initial state unavailable');
        for (const field of ['function', 'args', 'actual', 'outcome']) expect(record).not.toHaveProperty(field);
        invalid += 1;
        continue;
      }
      expect(record.function).toBe('applyResponses');
      const actual = currentD.applyResponses(...record.args);
      expect(actual).toBe(record.actual);
      const failed = actual < 2;
      expect(record.outcome).toBe(failed ? 'failure' : 'success');
      failures += Number(failed);
      completed += 1;
    }
    expect([failures, completed, invalid]).toEqual([1, 2, 1]);
    const oracle = caseById('O-08').oracle;
    expect([[failures, completed]]).toEqual(oracle.counts);
    expect(invalid).toBe(oracle.invalidAttempts);
    expect(oracle).toMatchObject({ origins: ['New'], states: [['Observed']], recommendation: 'fix-before-submit' });
  });
});

describe('O-05 session authentication and its restrictive trigger', () => {
  test('direct caller reproduces the matrix baseline, changed resume and ordinary entry control', () => {
    const input = caseById('O-05').input;
    expect(openAccount(beforeE.createSession, { resume: true })).toBe(source.authenticationFlow(input.baseline));
    expect(openAccount(currentE.createSession, { resume: true })).toBe(source.authenticationFlow(input.current));
    expect(openAccount(currentE.createSession, { resume: false })).toBe(source.authenticationFlow(input.control));
    expect(openAccount(beforeE.createSession, { resume: true })).toBe(200);
    expect(openAccount(currentE.createSession, { resume: true })).toBe(401);
    expect(openAccount(currentE.createSession, { resume: false })).toBe(200);
  });

  test.each([
    { label: 'before', module: beforeE, cached: false },
    { label: 'current', module: currentE, cached: true },
  ])('$label identifies the token sent for account-switch and resume combinations', ({ module, cached }) => {
    for (const switched of [false, true]) {
      for (const resume of [false, true]) {
        let activeToken = 'previous-account-token';
        const sent: string[] = [];
        const client = module.createSession(() => activeToken, (token: string) => {
          sent.push(token);
          return token === activeToken ? 200 : 401;
        });
        if (switched) activeToken = 'current-account-token';
        const fails = switched && resume && cached;
        expect(client.enter({ resume })).toBe(fails ? 401 : 200);
        expect(sent).toEqual([fails ? 'previous-account-token' : activeToken]);
      }
    }
  });

  test('a fresh current session after the switch succeeds, isolating session lifetime as a precondition', () => {
    const currentToken = 'current-account-token';
    const session = currentE.createSession(() => currentToken, (token: string) => token === currentToken ? 200 : 401);
    expect(session.enter({ resume: true })).toBe(200);
    expect(caseById('O-05').oracle).toEqual({ origins: ['New'], states: [['Not Run']],
      recommendation: 'fix-before-next-step', blockingOutcome: 'Login/Auth Failure' });
  });
});

describe('O-13 formatting relocation', () => {
  test.each([' Ada ', '', '   ', 'A', '\tGrace Hopper\n'])('preserves formatting and direct caller behavior for %j', (value) => {
    expect(beforeF.profileLabel(value)).toBe(source.profileLabel(value));
    expect(currentF.profileLabel(value)).toBe(source.relocatedLabel(value));
    expect(currentF.profileTitle({ name: value })).toBe(beforeF.profileTitle({ name: value }));
    expect(currentF.profileTitle({ name: value })).toBe(formatLabel(value));
  });

  test('preserves public exports and the same imported formatting owner', () => {
    expect(Object.keys(beforeF).sort()).toEqual(['profileLabel', 'profileTitle']);
    expect(Object.keys(currentF).sort()).toEqual(Object.keys(beforeF).sort());
    expect(currentF.profileLabel).toBe(formatLabel);
    const definition = caseById('O-13');
    for (const value of definition.input.values) {
      expect(currentF.profileTitle({ name: value })).toBe(source.relocatedLabel(value));
    }
    expect(definition.oracle).toEqual({ origins: [], states: [], design: 'Keep', recommendation: 'can-submit' });
    expect(definition.findings).toEqual([]);
  });
});
