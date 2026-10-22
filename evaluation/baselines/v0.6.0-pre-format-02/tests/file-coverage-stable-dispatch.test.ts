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
import { prepareFileCoverageDeepDispatch as prepareLegacy } from '../evaluation/prototypes/prepare-file-coverage-deep-dispatch.mjs';
import { prepareFileCoverageDeepDispatch, verifyFileCoverageDeepDispatch, claimFileCoverageDeepDispatch } from '../evaluation/prototypes/prepare-file-coverage-deep-dispatch-v2.mjs';
import { rootDir } from './test-utils';

const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'fe-stable-dispatch-')));
const sha = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const json = (value: unknown) => JSON.stringify(value, null, 2) + '\n';
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
[model_providers.custom]
base_url = "https://provider.example.test"
wire_api = "responses"
api_key = "SYNTHETIC_SECRET"
`;
fs.writeFileSync(configPath, config);
const input = { materials: prepared.output, freezeSha256: prepared.freezeSha256, options, configPath, expectedRoute };
const output = (name: string) => path.join(root, name);

// Simulated prior acceptance tests the gate only; it is never runtime evidence.
function acceptance(name: string, mutate: (adjudication: any, completion: any) => void = () => {}) {
  const directory = output('acceptance-' + name);
  fs.mkdirSync(directory);
  const report = 'TEST_ONLY_CANDIDATE_REPORT_NEVER_DELIVER\n';
  const reportSha = sha(Buffer.from(report));
  const adjudication = {
    candidateStatus: 'Pass - single bounded Candidate Deep pilot', caseId: 'FC-D-001', threadId: 'test-only-thread',
    rawReportSha256: reportSha,
    integrity: { freezeSha256: prepared.freezeSha256, candidateManifestSha256: candidate.manifestSha256 },
    manualAssessment: { status: 'Pass', passed: 8, total: 8, checks: Array.from({ length: 8 }, (_, id) => ({ id, status: 'Pass' })) },
    route: { configuredProvider: expectedRoute.provider, configuredBaseUrl: expectedRoute.baseUrl, wireApi: 'responses',
      sessionModel: 'gpt-6-astra', sessionEffort: 'xhigh', clientVersion: 'test-client' },
  };
  const completion = {
    threadId: 'test-only-thread', delivery: { status: 'Pass', actualCalls: 19 },
    report: { structure: 'Pass', sha256: reportSha },
    integrity: { status: 'Pass', verification: { freezeSha256: prepared.freezeSha256 } },
    elapsed: { status: 'Pass' },
    route: { requestedRouteMatch: true, contexts: [{ model: 'gpt-6-astra', effort: 'xhigh' }], clientVersion: 'test-client' },
  };
  mutate(adjudication, completion);
  fs.writeFileSync(path.join(directory, 'candidate-raw-report.md'), report);
  fs.writeFileSync(path.join(directory, 'candidate-adjudication.json'), json(adjudication));
  fs.writeFileSync(path.join(directory, 'candidate-completion-receipt.json'), json(completion));
  return { directory, adjudicationSha256: sha(Buffer.from(json(adjudication))), completionSha256: sha(Buffer.from(json(completion))) };
}
const accepted = acceptance('valid');
const prepare = (name: string, candidateAcceptance = accepted) => prepareFileCoverageDeepDispatch({
  ...input, variant: 'stable', candidateAcceptance, output: output(name),
});
afterAll(() => fs.rmSync(root, { recursive: true, force: true }));

describe('Stable Deep dispatch and accepted Candidate prerequisite', () => {
  test('preserves the pinned legacy helper and exact Candidate task arguments', () => {
    expect(sha(fs.readFileSync(path.join(rootDir, 'evaluation/prototypes/prepare-file-coverage-deep-dispatch.mjs')))).toBe('83f56a4d97966dd001031707c4bb43d08dda467274aeb219af5a9875ee789aaa');
    const old = prepareLegacy({ ...input, output: output('legacy-candidate') });
    const next = prepareFileCoverageDeepDispatch({ ...input, output: output('v2-candidate') });
    expect(next.request).toEqual(old.request);
    expect(verifyFileCoverageDeepDispatch(next.output, next.preflightSha256).request).toEqual(old.request);
  });

  test('sends only the exact Stable prompt and keeps accepted answers and route metadata outside the request', () => {
    const pending = prepare('stable');
    const verified = verifyFileCoverageDeepDispatch(pending.output, pending.preflightSha256);
    const stable = prepared.manifest.runs.find(run => run.variant === 'stable')!;
    expect(verified.request).toEqual({ prompt: fs.readFileSync(path.join(prepared.output, stable.dispatchPath), 'utf8'),
      target: { type: 'projectless' }, model: 'gpt-6-astra', thinking: 'xhigh', title: 'Stable Deep Review FC-D-001' });
    expect(verified.request.prompt).toContain(stable.calls[0].input);
    expect(verified.request.prompt).not.toMatch(/candidate-launch\.md|control\/stable-dispatch\.md|TEST_ONLY_CANDIDATE|SYNTHETIC_SECRET|acceptance-/u);
    expect(verified.acceptedCandidate?.reportSha256).toBe(sha(fs.readFileSync(path.join(accepted.directory, 'candidate-raw-report.md'))));
    expect(JSON.parse(fs.readFileSync(path.join(pending.output, 'preflight.json'), 'utf8'))).toMatchObject({
      executionAuthorized: false, modelInvocations: 0, sourceTransmitted: false, runtimeReady: false, evidenceFiles: 9, expectedCalls: 19,
    });
    expect(fs.existsSync(path.join(pending.output, 'dispatch-claimed.json'))).toBe(false);
    expect(fs.existsSync(verified.resultsDirectory)).toBe(false);
  });

  test('requires an independently pinned accepted Candidate and rejects unknown variants', () => {
    expect(() => prepareFileCoverageDeepDispatch({ ...input, variant: 'stable', output: output('no-acceptance') })).toThrow('Candidate acceptance');
    expect(() => prepare('wrong-adjudication-pin', { ...accepted, adjudicationSha256: '0'.repeat(64) })).toThrow('digest');
    expect(() => prepare('wrong-completion-pin', { ...accepted, completionSha256: undefined })).toThrow('digest');
    expect(() => prepareFileCoverageDeepDispatch({ ...input, variant: 'other', output: output('unknown') })).toThrow('variant');
  });

  const invalidAcceptances: [string, (a: any, c: any) => void][] = [
    ['No-Go', a => { a.candidateStatus = 'No-Go'; }],
    ['wrong-case', a => { a.caseId = 'OTHER'; }],
    ['wrong-freeze', a => { a.integrity.freezeSha256 = '0'.repeat(64); }],
    ['wrong-candidate', a => { a.integrity.candidateManifestSha256 = '0'.repeat(64); }],
    ['thread-mismatch', (_, c) => { c.threadId = 'other-thread'; }],
    ['manual-missing', a => { a.manualAssessment.passed = 7; }],
    ['manual-fail', a => { a.manualAssessment.checks[0].status = 'Fail'; }],
    ['delivery-fail', (_, c) => { c.delivery.status = 'Fail'; }],
    ['extra-call', (_, c) => { c.delivery.actualCalls = 20; }],
    ['parser-fail', (_, c) => { c.report.structure = 'Fail'; }],
    ['integrity-fail', (_, c) => { c.integrity.status = 'Fail'; }],
    ['elapsed-fail', (_, c) => { c.elapsed.status = 'Fail'; }],
    ['route-fail', (_, c) => { c.route.requestedRouteMatch = false; }],
    ['other-provider', a => { a.route.configuredProvider = 'other'; }],
    ['other-url', a => { a.route.configuredBaseUrl = 'https://other.example.test'; }],
    ['other-model', a => { a.route.sessionModel = 'other-model'; }],
    ['other-effort', a => { a.route.sessionEffort = 'low'; }],
    ['context-mismatch', (_, c) => { c.route.contexts[0].model = 'other-model'; }],
    ['client-mismatch', (_, c) => { c.route.clientVersion = 'different-client'; }],
    ['report-mismatch', a => { a.rawReportSha256 = '0'.repeat(64); }],
  ];
  test.each(invalidAcceptances)('rejects %s even when the supplied receipt hashes match', (name, mutate) => {
    const evidence = acceptance(name, mutate);
    expect(() => prepare('rejected-' + name, evidence)).toThrow();
    expect(fs.existsSync(output('rejected-' + name))).toBe(false);
  });

  test.each(['candidate-adjudication.json', 'candidate-completion-receipt.json', 'candidate-raw-report.md'])('rechecks %s immediately before claim', name => {
    const evidence = acceptance('drift-' + name);
    const pending = prepare('drift-' + name, evidence);
    fs.appendFileSync(path.join(evidence.directory, name), '\n');
    expect(() => claimFileCoverageDeepDispatch(pending.output, pending.preflightSha256)).toThrow('digest');
    expect(fs.existsSync(path.join(pending.output, 'dispatch-claimed.json'))).toBe(false);
  });

  test.each(['prompt', 'material', 'route'])('rechecks %s and does not claim rejected work', kind => {
    const pending = prepare('change-' + kind);
    const run = prepared.manifest.runs.find(run => run.variant === 'stable')!;
    const filename = kind === 'prompt' ? path.join(pending.output, 'request.json')
      : kind === 'material' ? path.join(prepared.output, run.dispatchPath) : configPath;
    const original = fs.readFileSync(filename);
    try {
      const text = original.toString('utf8');
      fs.writeFileSync(filename, kind === 'prompt' ? text.replace('stable-launch', 'candidate-launch')
        : kind === 'material' ? text + '\n' : text.replace('provider.example.test', 'other.example.test'));
      expect(() => claimFileCoverageDeepDispatch(pending.output, pending.preflightSha256)).toThrow();
      expect(fs.existsSync(path.join(pending.output, 'dispatch-claimed.json'))).toBe(false);
    } finally { fs.writeFileSync(filename, original); }
  });

  test('protects accepted Candidate results from output overlap and symlink aliases', () => {
    expect(() => prepareFileCoverageDeepDispatch({ ...input, variant: 'stable', candidateAcceptance: accepted,
      output: path.join(accepted.directory, 'new-dispatch') })).toThrow('overlaps');
    const alias = output('acceptance-alias');
    fs.symlinkSync(accepted.directory, alias);
    expect(() => prepareFileCoverageDeepDispatch({ ...input, variant: 'stable', candidateAcceptance: accepted,
      output: path.join(alias, 'new-dispatch') })).toThrow('overlaps');
    expect(fs.existsSync(path.join(accepted.directory, 'new-dispatch'))).toBe(false);
  });

  test('claims the exact Stable request once with separate output and no model call', () => {
    const pending = prepare('claim-once');
    expect(claimFileCoverageDeepDispatch(pending.output, pending.preflightSha256)).toEqual(pending.request);
    expect(() => claimFileCoverageDeepDispatch(pending.output, pending.preflightSha256)).toThrow('already claimed');
    expect(() => prepare('claim-once')).toThrow('already exists');
    expect(sha(fs.readFileSync(path.join(prepared.output, 'control/freeze.json')))).toBe(prepared.freezeSha256);
  });
});
