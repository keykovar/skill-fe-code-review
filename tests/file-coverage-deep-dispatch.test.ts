import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, test } from 'vitest';
import { buildFileCoverageSkill } from '../evaluation/prototypes/build-file-coverage-skill.mjs';
import { buildFileCoverageLedgerSkill } from '../evaluation/prototypes/build-file-coverage-ledger-skill.mjs';
import { buildFileCoverageLedgerDedup } from '../evaluation/prototypes/build-file-coverage-ledger-dedup.mjs';
import { prepareFileCoverageComparison } from '../evaluation/prototypes/prepare-file-coverage-comparison.mjs';
import { prepareFileCoverageLedgerDeep } from '../evaluation/prototypes/prepare-file-coverage-ledger-deep.mjs';
import { prepareFileCoverageDeepDispatch, verifyFileCoverageDeepDispatch, claimFileCoverageDeepDispatch } from '../evaluation/prototypes/prepare-file-coverage-deep-dispatch.mjs';
import { rootDir } from './test-utils';

const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'fe-deep-dispatch-')));
const sha = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const parentCandidate = buildFileCoverageSkill(path.join(root, 'parent-candidate'));
const parent = prepareFileCoverageComparison({ output: path.join(root, 'parent-materials'), candidateBundle: parentCandidate.output });
const composed = buildFileCoverageLedgerSkill({ sourceBundle: parentCandidate.output,
  sourceManifestSha256: sha(fs.readFileSync(path.join(parentCandidate.output, 'manifest.json'))), output: path.join(root, 'composed') });
const candidate = buildFileCoverageLedgerDedup({ sourceBundle: composed.output,
  sourceManifestSha256: composed.manifestSha256, output: path.join(root, 'candidate') });
const options = { previousMaterials: parent.output, previousFreezeSha256: parent.freezeSha256,
  candidateBundle: candidate.output, candidateManifestSha256: candidate.manifestSha256,
  candidateKind: 'offline-file-coverage-ledger-dedup-candidate', candidateParentManifestSha256: composed.manifestSha256 };
const prepared = prepareFileCoverageLedgerDeep({ ...options, output: path.join(root, 'materials') });
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
const input = { materials: prepared.output, freezeSha256: prepared.freezeSha256, options, configPath, expectedRoute };
const output = (name: string) => path.join(root, name);
const prepare = (name: string) => prepareFileCoverageDeepDispatch({ ...input, output: output(name) });
const successful = prepare('successful');
afterAll(() => fs.rmSync(root, { recursive: true, force: true }));

describe('frozen Candidate Deep dispatch guard', () => {
  test('returns the exact prompt as create_thread arguments, not a path-read paraphrase', () => {
    const verified = verifyFileCoverageDeepDispatch(successful.output, successful.preflightSha256);
    const run = prepared.manifest.runs[0];
    expect(verified.request).toEqual({
      prompt: fs.readFileSync(path.join(prepared.output, run.dispatchPath), 'utf8'),
      target: { type: 'projectless' }, model: 'gpt-6-astra', thinking: 'xhigh', title: 'Candidate dedup Deep Review FC-D-001',
    });
    expect(verified.request.prompt).toContain(run.calls[0].input);
    expect(verified.request.prompt).not.toContain('candidate-dispatch.md');
    expect(verified.expectedCalls).toBe(19);
    const manifest = JSON.parse(fs.readFileSync(path.join(successful.output, 'preflight.json'), 'utf8'));
    expect(manifest).toMatchObject({ executionAuthorized: false, modelInvocations: 0, sourceTransmitted: false, runtimeReady: false, evidenceFiles: 9 });
    expect(verified.resultsDirectory).toBe(path.join(successful.output, 'results'));
    expect(fs.existsSync(verified.resultsDirectory)).toBe(false);
    expect(JSON.stringify(successful)).not.toContain('SYNTHETIC_SECRET_MUST_NOT_LEAK');
    expect(fs.readFileSync(path.join(successful.output, 'preflight.json'), 'utf8')).not.toContain('SYNTHETIC_SECRET_MUST_NOT_LEAK');
    expect(fs.readFileSync(configPath, 'utf8')).toBe(config);
  });

  test('claims only once without creating a model task or touching materials', () => {
    const pending = prepare('one-use');
    expect(claimFileCoverageDeepDispatch(pending.output, pending.preflightSha256)).toEqual(pending.request);
    expect(() => claimFileCoverageDeepDispatch(pending.output, pending.preflightSha256)).toThrow('already claimed');
    expect(() => verifyFileCoverageDeepDispatch(pending.output, pending.preflightSha256)).toThrow('already claimed');
    expect(fs.readdirSync(pending.output).sort()).toEqual(['dispatch-claimed.json', 'preflight.json', 'request.json']);
    expect(sha(fs.readFileSync(path.join(prepared.output, 'control/freeze.json')))).toBe(prepared.freezeSha256);
  });

  test.each(['baseUrl', 'provider', 'wireApi', 'default-model'] as const)('rechecks %s configuration at claim time and leaves failed attempts unclaimed', kind => {
    const pending = prepare('route-' + kind);
    const changed = kind === 'baseUrl' ? config.replace('provider.example.test', 'different.example.test')
      : kind === 'provider' ? config.replace('model_provider = "custom"', 'model_provider = "missing"')
        : kind === 'wireApi' ? config.replace('"responses"', '"chat"') : config.replace('configured-default', 'changed-default');
    try {
      fs.writeFileSync(configPath, changed);
      expect(() => claimFileCoverageDeepDispatch(pending.output, pending.preflightSha256)).toThrow();
      expect(fs.existsSync(path.join(pending.output, 'dispatch-claimed.json'))).toBe(false);
    } finally { fs.writeFileSync(configPath, config); }
  });

  test.each(['bad-toml', 'profile', 'missing-provider', 'credentials-in-url', 'query-in-url', 'invalid-url', 'http'] as const)('rejects %s configuration without creating output or leaking TOML', kind => {
    const changed = kind === 'bad-toml' ? 'secret = "SYNTHETIC_SECRET_MUST_NOT_LEAK\n'
      : kind === 'profile' ? 'profile = "other"\n' + config
        : kind === 'missing-provider' ? config.replace('model_provider = "custom"\n', '')
          : kind === 'credentials-in-url' ? config.replace('https://provider', 'https://secret@provider')
            : kind === 'query-in-url' ? config.replace('provider.example.test"', 'provider.example.test?key=secret"')
              : kind === 'invalid-url' ? config.replace('https://provider.example.test', 'SYNTHETIC_SECRET_MUST_NOT_LEAK')
                : config.replace('https:', 'http:');
    try {
      fs.writeFileSync(configPath, changed);
      expect(() => prepare('bad-config-' + kind)).toThrow();
      try { prepare('bad-config-' + kind); } catch (error) { expect(String(error)).not.toContain('SYNTHETIC_SECRET_MUST_NOT_LEAK'); }
      expect(fs.existsSync(output('bad-config-' + kind))).toBe(false);
    } finally { fs.writeFileSync(configPath, config); }
  });

  test('requires the expected route and a working standard-library TOML reader', () => {
    expect(() => prepareFileCoverageDeepDispatch({ ...input, expectedRoute: undefined, output: output('no-route') })).toThrow('expected provider route');
    expect(() => prepareFileCoverageDeepDispatch({ ...input, expectedRoute: { ...expectedRoute, baseUrl: 'https://wrong.example.test' }, output: output('wrong-route') })).toThrow('expected provider route');
    expect(() => prepareFileCoverageDeepDispatch({ ...input, python: output('no-python'), output: output('bad-python') })).toThrow('Cannot verify');
  });

  test.each(['paraphrase', 'whitespace', 'model', 'target'] as const)('rejects %s request mutation before claiming', kind => {
    const pending = prepare('request-' + kind);
    const requestFile = path.join(pending.output, 'request.json');
    const request = JSON.parse(fs.readFileSync(requestFile, 'utf8'));
    if (kind === 'paraphrase') request.prompt = 'Read control/candidate-dispatch.md first.';
    if (kind === 'whitespace') request.prompt += '\n';
    if (kind === 'model') request.model = 'another-model';
    if (kind === 'target') request.target = { type: 'project', projectId: 'host-repository' };
    fs.writeFileSync(requestFile, JSON.stringify(request, null, 2) + '\n');
    expect(() => claimFileCoverageDeepDispatch(pending.output, pending.preflightSha256)).toThrow('digest');
    expect(fs.existsSync(path.join(pending.output, 'dispatch-claimed.json'))).toBe(false);
  });

  test.each(['source', 'extra-report', 'dispatch'] as const)('rejects %s material changes at claim time', kind => {
    const pending = prepare('material-' + kind);
    const run = prepared.manifest.runs[0];
    const filename = path.join(prepared.output, kind === 'source' ? run.workspace + '/packet/after/src/profile.mjs'
      : kind === 'dispatch' ? run.dispatchPath : 'candidate-raw-report.md');
    const original = kind === 'extra-report' ? null : fs.readFileSync(filename);
    try {
      fs.writeFileSync(filename, original ? Buffer.concat([original, Buffer.from('\nchanged\n')]) : 'report');
      expect(() => claimFileCoverageDeepDispatch(pending.output, pending.preflightSha256)).toThrow();
      expect(fs.existsSync(path.join(pending.output, 'dispatch-claimed.json'))).toBe(false);
    } finally {
      if (original) fs.writeFileSync(filename, original);
      else fs.unlinkSync(filename);
    }
  });

  test('rejects frozen, historical, candidate, formal and config output locations including symlink aliases', () => {
    for (const parentPath of [prepared.output, parent.output, candidate.output, path.join(rootDir, 'skills'), configRoot]) {
      expect(() => prepareFileCoverageDeepDispatch({ ...input, output: path.join(parentPath, 'new-dispatch') })).toThrow();
      expect(fs.existsSync(path.join(parentPath, 'new-dispatch'))).toBe(false);
    }
    const alias = output('materials-alias');
    fs.symlinkSync(prepared.output, alias);
    expect(() => prepareFileCoverageDeepDispatch({ ...input, output: path.join(alias, 'new-dispatch') })).toThrow('overlaps');
    expect(() => prepare('successful')).toThrow('already exists');
  });

  test('rejects missing/changed receipt digests, extra artifacts and symlinked requests', () => {
    expect(() => verifyFileCoverageDeepDispatch(successful.output, undefined)).toThrow('digest');
    expect(() => verifyFileCoverageDeepDispatch(successful.output, '0'.repeat(64))).toThrow('digest');
    const pending = prepare('tamper');
    fs.writeFileSync(path.join(pending.output, 'result.md'), 'prior attempt');
    expect(() => verifyFileCoverageDeepDispatch(pending.output, pending.preflightSha256)).toThrow('already claimed');
    const linked = prepare('linked-request');
    fs.unlinkSync(path.join(linked.output, 'request.json'));
    fs.symlinkSync(path.join(successful.output, 'request.json'), path.join(linked.output, 'request.json'));
    expect(() => verifyFileCoverageDeepDispatch(linked.output, linked.preflightSha256)).toThrow('regular');
  });
});
