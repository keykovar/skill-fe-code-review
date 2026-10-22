import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, test } from 'vitest';
import { buildLedgerFormatSkill } from '../evaluation/prototypes/build-ledger-format-skill.mjs';
import { prepareLedgerFormatDeepFindings } from '../evaluation/prototypes/prepare-ledger-format-deep-findings.mjs';
import { prepareLedgerFormatDeepFindingsDispatch as prepareDispatch,
  verifyLedgerFormatDeepFindingsDispatch as verifyDispatch,
  claimLedgerFormatDeepFindingsDispatch as claimDispatch } from '../evaluation/prototypes/prepare-ledger-format-deep-findings-dispatch.mjs';

const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'fe-lf-d002-dispatch-')));
const sha = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const candidate = buildLedgerFormatSkill(path.join(root, 'candidate'));
const prepared = prepareLedgerFormatDeepFindings({ output: path.join(root, 'materials'), candidateBundle: candidate.output,
  candidateManifestSha256: sha(fs.readFileSync(path.join(candidate.output, 'manifest.json'))) });
const expectedRoute = { provider: 'custom', baseUrl: 'https://provider.example.test', wireApi: 'responses' };
const configRoot = path.join(root, 'config');
fs.mkdirSync(configRoot);
const configPath = path.join(configRoot, 'config.toml');
const config = `model_provider = "custom"
model = "configured-default"
model_reasoning_effort = "high"
unused_secret = "SYNTHETIC_SECRET_MUST_NOT_LEAK"
[model_providers.custom]
base_url = "https://provider.example.test"
wire_api = "responses"
api_key = "SYNTHETIC_SECRET_MUST_NOT_LEAK"
`;
fs.writeFileSync(configPath, config);
const input = { materials: prepared.output, freezeSha256: prepared.freezeSha256,
  candidateBundle: candidate.output, configPath, expectedRoute };
const output = (name: string) => path.join(root, name);
const prepare = (name: string) => prepareDispatch({ ...input, output: output(name) });
const successful = prepare('successful');
afterAll(() => fs.rmSync(root, { recursive: true, force: true }));

describe('LF-D-002 exact one-use dispatch', () => {
  test('preserves the frozen four-call prompt and excludes evaluator answers and configuration', () => {
    const verified = verifyDispatch(successful.output, successful.preflightSha256);
    expect(verified.request).toEqual({
      prompt: fs.readFileSync(path.join(prepared.output, 'control/launch.md'), 'utf8'),
      target: { type: 'projectless' }, model: 'gpt-6-astra', thinking: 'xhigh', title: 'LF-D-002 format-only Deep Review',
    });
    for (const call of prepared.freeze.run.calls) expect(verified.request.prompt).toContain(call.input);
    expect(verified.expectedCalls).toBe(4);
    expect(verified.totalDeliveredContentBytes).toBe(prepared.freeze.run.totalDeliveredContentBytes);
    const request = JSON.stringify(verified.request);
    for (const excluded of ['SYNTHETIC_SECRET_MUST_NOT_LEAK', 'provider.example.test', 'F-001', 'F-002',
      'restore-timeout-parameter', 'authored-report.zh-CN.md', 'control/launch.md']) {
      expect(request).not.toContain(excluded);
    }
    const preflight = JSON.parse(fs.readFileSync(path.join(successful.output, 'preflight.json'), 'utf8'));
    expect(preflight).toMatchObject({ executionAuthorized: false, modelInvocations: 0, sourceTransmitted: false,
      runtimeReady: false, evidenceFiles: 9, expectedCalls: 4 });
    expect(JSON.stringify(preflight)).not.toContain('SYNTHETIC_SECRET_MUST_NOT_LEAK');
    expect(JSON.stringify(successful)).not.toContain('SYNTHETIC_SECRET_MUST_NOT_LEAK');
    expect(verified.resultsDirectory).toBe(path.join(successful.output, 'results'));
    expect(fs.existsSync(verified.resultsDirectory)).toBe(false);
    expect(fs.readFileSync(configPath, 'utf8')).toBe(config);
  });

  test('retains a consumed claim without a successful creation receipt', () => {
    const pending = prepare('one-use');
    expect(claimDispatch(pending.output, pending.preflightSha256)).toEqual(pending.request);
    expect(() => claimDispatch(pending.output, pending.preflightSha256)).toThrow('already claimed');
    expect(() => verifyDispatch(pending.output, pending.preflightSha256)).toThrow('already claimed');
    expect(fs.readdirSync(pending.output).sort()).toEqual(['dispatch-claimed.json', 'preflight.json', 'request.json']);
    expect(sha(fs.readFileSync(path.join(prepared.output, 'control/freeze.json')))).toBe(prepared.freezeSha256);
  });

  test.each([
    ['route', config.replace('provider.example.test', 'different.example.test')],
    ['provider', config.replace('model_provider = "custom"', 'model_provider = "missing"')],
    ['wire', config.replace('"responses"', '"chat"')],
    ['model', config.replace('configured-default', 'changed-default')],
    ['effort', config.replace('"high"', '"low"')],
  ])('rejects %s drift at claim time without consuming an attempt', (kind, changed) => {
    const pending = prepare('drift-' + kind);
    try {
      fs.writeFileSync(configPath, changed);
      expect(() => claimDispatch(pending.output, pending.preflightSha256)).toThrow();
      expect(fs.existsSync(path.join(pending.output, 'dispatch-claimed.json'))).toBe(false);
    } finally { fs.writeFileSync(configPath, config); }
  });

  test.each([
    ['TOML', 'secret = "SYNTHETIC_SECRET_MUST_NOT_LEAK\n'],
    ['profile', 'profile = "other"\n' + config],
    ['missing', config.replace('model_provider = "custom"\n', '')],
    ['credentials', config.replace('https://provider', 'https://secret@provider')],
    ['query', config.replace('provider.example.test"', 'provider.example.test?key=secret"')],
    ['fragment', config.replace('provider.example.test"', 'provider.example.test#secret"')],
    ['invalid-url', config.replace('https://provider.example.test', 'SYNTHETIC_SECRET_MUST_NOT_LEAK')],
    ['http', config.replace('https:', 'http:')],
    ['invalid-model', config.replace('"configured-default"', '42')],
  ])('rejects %s config without leaking TOML or writing output', (kind, changed) => {
    try {
      fs.writeFileSync(configPath, changed);
      let message = '';
      try { prepare('invalid-' + kind); } catch (error) { message = String(error); }
      expect(message).not.toBe('');
      expect(message).not.toContain('SYNTHETIC_SECRET_MUST_NOT_LEAK');
      expect(fs.existsSync(output('invalid-' + kind))).toBe(false);
    } finally { fs.writeFileSync(configPath, config); }
  });

  test('requires an explicit matching route and available TOML reader', () => {
    expect(() => prepareDispatch({ ...input, expectedRoute: undefined, output: output('no-route') })).toThrow('expected provider route');
    expect(() => prepareDispatch({ ...input, expectedRoute: { ...expectedRoute, baseUrl: 'https://wrong.example.test' }, output: output('wrong-route') })).toThrow('expected provider route');
    expect(() => prepareDispatch({ ...input, python: output('missing-python'), output: output('no-python') })).toThrow('Cannot verify');
  });

  test.each(['prompt', 'model', 'target', 'whitespace'])('rejects %s request changes', kind => {
    const pending = prepare('request-' + kind);
    const file = path.join(pending.output, 'request.json');
    const request = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (kind === 'prompt') request.prompt = 'Read control/launch.md first';
    if (kind === 'model') request.model = 'another-model';
    if (kind === 'target') request.target = { type: 'project', projectId: 'host' };
    fs.writeFileSync(file, JSON.stringify(request, null, 2) + (kind === 'whitespace' ? '\n\n' : '\n'));
    expect(() => claimDispatch(pending.output, pending.preflightSha256)).toThrow('digest');
    expect(fs.existsSync(path.join(pending.output, 'dispatch-claimed.json'))).toBe(false);
  });

  test.each(['freeze', 'launch', 'batch', 'oracle', 'candidate', 'extra-report'])('rejects changed %s material', kind => {
    const pending = prepare('material-' + kind);
    const names = { freeze: 'control/freeze.json', launch: 'control/launch.md', batch: 'workspace/batches/03.json',
      oracle: 'control/oracle.json', candidate: '', 'extra-report': 'report.md' };
    const file = kind === 'candidate' ? path.join(candidate.output, 'fe-code-review/SKILL.md')
      : path.join(prepared.output, names[kind as keyof typeof names]);
    const original = kind === 'extra-report' ? null : fs.readFileSync(file);
    try {
      fs.writeFileSync(file, original ? Buffer.concat([original, Buffer.from('\nchanged\n')]) : 'report');
      expect(() => claimDispatch(pending.output, pending.preflightSha256)).toThrow();
      expect(fs.existsSync(path.join(pending.output, 'dispatch-claimed.json'))).toBe(false);
    } finally {
      if (original) fs.writeFileSync(file, original);
      else fs.unlinkSync(file);
    }
  });

  test('rejects protected outputs, aliases and reuse before writing', () => {
    for (const parent of [prepared.output, candidate.output, configRoot, path.join(process.cwd(), 'skills')]) {
      const dest = path.join(parent, 'new-dispatch');
      expect(() => prepareDispatch({ ...input, output: dest })).toThrow();
      expect(fs.existsSync(dest)).toBe(false);
    }
    const alias = output('material-alias');
    fs.symlinkSync(prepared.output, alias);
    expect(() => prepareDispatch({ ...input, output: path.join(alias, 'new-dispatch') })).toThrow('overlaps');
    expect(() => prepare('successful')).toThrow('already exists');
    const dispatchAlias = output('dispatch-alias');
    fs.symlinkSync(successful.output, dispatchAlias);
    expect(() => verifyDispatch(dispatchAlias, successful.preflightSha256)).toThrow('Regular');
  });

  test('rejects missing receipt pins, stale recipe pins, extra results and linked request files', () => {
    expect(() => verifyDispatch(successful.output, undefined)).toThrow('digest');
    expect(() => verifyDispatch(successful.output, '0'.repeat(64))).toThrow('digest');
    const stale = prepare('stale-recipe');
    const file = path.join(stale.output, 'preflight.json');
    const preflight = JSON.parse(fs.readFileSync(file, 'utf8'));
    preflight.recipeSha256 = '0'.repeat(64);
    fs.writeFileSync(file, JSON.stringify(preflight, null, 2) + '\n');
    expect(() => claimDispatch(stale.output, sha(fs.readFileSync(file)))).toThrow('digest');
    const extra = prepare('extra');
    fs.writeFileSync(path.join(extra.output, 'result.md'), 'prior attempt');
    expect(() => verifyDispatch(extra.output, extra.preflightSha256)).toThrow('already claimed');
    const linked = prepare('linked');
    fs.unlinkSync(path.join(linked.output, 'request.json'));
    fs.symlinkSync(path.join(successful.output, 'request.json'), path.join(linked.output, 'request.json'));
    expect(() => verifyDispatch(linked.output, linked.preflightSha256)).toThrow('regular');
  });
});
