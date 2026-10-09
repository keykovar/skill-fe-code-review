import crypto from 'node:crypto';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import https from 'node:https';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { PassThrough, Readable } from 'node:stream';
import { afterAll, afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';
import { postBoundedJson } from '../scripts/origin-occurrence-api-probe.mjs';
import { assessO09ApiResponse, O09_LIMITS } from '../evaluation/baselines/pre-v0.6.0/scripts/origin-occurrence-api-review.mjs';
import { historicalRootDir, readText } from './test-utils';

const baseUrl = 'https://review.invalid';
const keyText = 'public-dummy-key';
const hash = (bytes: Buffer) => crypto.createHash('sha256').update(bytes).digest('hex');
let suiteDir: string;
let temporary: string;
let windowDir: string;
let assemblyDir: string;
let draftFile: string;
let reviewApi: typeof import('../scripts/origin-occurrence-api-review.mjs');
beforeAll(async () => {
  suiteDir = fs.mkdtempSync(path.join(os.tmpdir(), 'origin-review-inputs-'));
  const fixtureRoot = path.join(suiteDir, 'frozen-source');
  const baseline = JSON.parse(readText('evaluation/baselines/pre-v0.6.0/manifest.json'));
  for (const pin of baseline.files) {
    const bytes = fs.readFileSync(path.join(historicalRootDir, pin.path));
    expect(hash(bytes)).toBe(pin.sha256);
    const filename = path.join(fixtureRoot, pin.path);
    fs.mkdirSync(path.dirname(filename), { recursive: true });
    fs.writeFileSync(filename, bytes, { flag: 'wx' });
  }
  // The one-shot request predates later extension edits; retain its original bytes.
  const extension = Buffer.from(readText('evaluation/tooling-fixtures/o09-frozen-origin-extension.md'));
  expect(hash(extension)).toBe('e348c205a6a02d3402ef4a14db3067745b4db341b5e544631a52f0734ebb6790');
  fs.writeFileSync(path.join(fixtureRoot, 'evaluation/prototypes/origin-occurrence/fe-code-review-origin-candidate/SKILL.md'), extension);
  const load = (filename: string) => import(pathToFileURL(path.join(fixtureRoot, 'scripts', filename)).href);
  const { assembleOriginOccurrencePilot } = await load('assemble-origin-occurrence-pilot.mjs');
  const { prepareOriginOccurrenceApi } = await load('origin-occurrence-api.mjs');
  reviewApi = await load('origin-occurrence-api-review.mjs');
  assemblyDir = path.join(suiteDir, 'assembly');
  const outputDir = path.join(suiteDir, 'api');
  assembleOriginOccurrencePilot({ outputDir: assemblyDir });
  prepareOriginOccurrenceApi({ assemblyDir, outputDir });
  draftFile = path.join(outputDir, 'requests/review-a.json');
});
beforeEach(() => {
  temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'origin-review-window-'));
  windowDir = path.join(temporary, 'window');
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); fs.rmSync(temporary, { recursive: true, force: true }); });
afterAll(() => fs.rmSync(suiteDir, { recursive: true, force: true }));

function prepare() { return reviewApi.prepareO09ApiReview({ assemblyDir, draftFile, baseUrl, windowDir }); }
function windowHash() { return hash(fs.readFileSync(path.join(windowDir, 'window.json'))); }
function run(overrides: Record<string, any> = {}) {
  return reviewApi.runO09ApiReview({ windowDir, expectedWindowSha256: windowHash(), allowPublicSource: true,
    acknowledgeUnpricedReview: true, credentialInput: Readable.from([keyText]), ...overrides });
}
function response(): any {
  return { id: 'resp_public_dummy', object: 'response', model: 'gpt-6-astra', status: 'completed',
    max_output_tokens: null, usage: { input_tokens: 100, output_tokens: 20, total_tokens: 120 },
    output: [{ type: 'message', role: 'assistant', status: 'completed',
      content: [{ type: 'output_text', text: 'PUBLIC_SYNTHETIC_REPORT\n' }] }] };
}
function transport(value: any) { return { rawResponse: Buffer.from(JSON.stringify(value)), httpStatus: 200 }; }
function fakeRequest({ status = 200, value = response(), silent = false, oversize = false } = {}) {
  const request: any = new EventEmitter(); request.destroy = vi.fn();
  const incoming: any = new EventEmitter(); incoming.destroy = vi.fn();
  incoming.statusCode = status; incoming.headers = { 'content-type': 'application/json' }; incoming.complete = true;
  const requestImpl = vi.fn((_url, _options, callback) => {
    request.end = vi.fn(() => {
      if (silent) return;
      queueMicrotask(() => {
        callback(incoming);
        incoming.emit('data', oversize ? Buffer.alloc(O09_LIMITS.responseBytes + 1) : Buffer.from(JSON.stringify(value)));
        incoming.emit('end');
      });
    });
    return request;
  });
  return { request, incoming, requestImpl };
}

test('freezes only the 11 O-09 documents, preserving all decoded bytes and excluding sibling/evaluator data', () => {
  const network = vi.spyOn(https, 'request').mockImplementation(() => { throw new Error('Unexpected network'); });
  const plan = prepare();
  const verified = reviewApi.verifyO09ApiReview(windowDir, windowHash());
  expect(verified.plan).toEqual(plan);
  expect(plan).toMatchObject({ caseId: 'O-09', mode: 'fix', executionAuthorized: false, sourceTransferAuthorized: false,
    runtimeReady: false, modelInvocations: 0, billing: { monetaryCap: null, outputCapEnforcement: 'Unverified' } });
  expect(plan.documents.map((file: any) => file.path)).toEqual([
    'instructions/fe-code-review/SKILL.md', 'instructions/fe-code-review/references/fix-review.md',
    'instructions/fe-code-review/references/javascript.md', 'instructions/fe-code-review-origin-candidate/SKILL.md',
    'PROMPT.md', 'context.md', 'previous-findings.md', 'before/profile.mjs', 'current/profile.mjs',
    'original/profile.mjs', 'observations.json',
  ]);
  const base = JSON.parse(fs.readFileSync(draftFile, 'utf8'));
  const { background, ...retained } = base;
  expect(JSON.parse(verified.request.toString())).toEqual({ ...retained, max_output_tokens: 16384 });
  expect(background).toBe(false);
  expect(verified.request).toHaveLength(48305);
  expect(network).not.toHaveBeenCalled();
  expect(fs.readdirSync(windowDir).sort()).toEqual(['request.json', 'window.json']);
  expect(() => prepare()).toThrow(/already exists/);
});

test('refuses the O-11 draft and does not create a runnable window', () => {
  expect(() => reviewApi.prepareO09ApiReview({ assemblyDir, draftFile: path.join(suiteDir, 'api/requests/review-b.json'),
    baseUrl, windowDir })).toThrow(/frozen O-09/);
  expect(fs.existsSync(windowDir)).toBe(false);
});

test.each(['https://user:secret@review.invalid', 'http://review.invalid', 'https://review.invalid/?key=1'])
  ('rejects endpoint input %s before preparation', (invalid) => {
    expect(() => reviewApi.prepareO09ApiReview({ assemblyDir, draftFile, baseUrl: invalid, windowDir })).toThrow();
    expect(fs.existsSync(windowDir)).toBe(false);
  });

test.each(['source', 'limits', 'tool-hash', 'document-list', 'extra-file', 'symlink', 'endpoint'])
  ('rejects %s tampering before credential input', async (kind) => {
    prepare();
    const originalHash = windowHash();
    const filename = path.join(windowDir, 'window.json');
    const plan = JSON.parse(fs.readFileSync(filename, 'utf8'));
    if (kind === 'source') {
      const body = JSON.parse(fs.readFileSync(path.join(windowDir, 'request.json'), 'utf8'));
      body.instructions += '\nUnapproved extra document.';
      const bytes = Buffer.from(JSON.stringify(body));
      fs.writeFileSync(path.join(windowDir, 'request.json'), bytes);
      plan.request.sha256 = hash(bytes); plan.request.bytes = bytes.length;
    }
    if (kind === 'limits') plan.limits.maxOutputTokens = 99999;
    if (kind === 'tool-hash') plan.toolHashes[0].sha256 = '0'.repeat(64);
    if (kind === 'document-list') plan.documents.pop();
    if (kind === 'endpoint') { plan.baseUrl = 'https://other.invalid'; plan.endpoint = 'https://other.invalid/responses'; }
    fs.writeFileSync(filename, JSON.stringify(plan));
    if (kind === 'extra-file') fs.writeFileSync(path.join(windowDir, 'oracle.json'), '{}');
    if (kind === 'symlink') {
      const target = path.join(temporary, 'plan-copy.json'); fs.renameSync(filename, target); fs.symlinkSync(target, filename);
    }
    const input = new PassThrough(); const read = vi.spyOn(input, 'on');
    await expect(run({ expectedWindowSha256: kind === 'endpoint' ? originalHash : windowHash(), credentialInput: input,
      requestImpl: vi.fn() })).rejects.toThrow();
    expect(read).not.toHaveBeenCalled(); expect(fs.existsSync(path.join(windowDir, 'attempt'))).toBe(false);
  });

test.each([[false, false], [true, false], [false, true]])('requires both scope acknowledgements (%s, %s)', async (source, charge) => {
  prepare();
  const input = new PassThrough(); const read = vi.spyOn(input, 'on');
  await expect(run({ allowPublicSource: source, acknowledgeUnpricedReview: charge, credentialInput: input })).rejects.toThrow(/acknowledgement/);
  expect(read).not.toHaveBeenCalled(); expect(fs.existsSync(path.join(windowDir, 'attempt'))).toBe(false);
});

test('captures exact report bytes without accepting report quality or inventing missing metadata', () => {
  const raw = response(); delete raw.usage;
  expect(assessO09ApiResponse(transport(raw))).toMatchObject({ report: 'PUBLIC_SYNTHETIC_REPORT\n',
    transportAcceptance: 'Functional Pass', reportAcceptance: 'Not Evaluated', codexAcceptance: 'Not Evaluated',
    runtimeReady: false, usage: { status: 'unavailable' }, serverSideEnforcement: 'Unverified',
    controlEvidence: { max_output_tokens: { status: 'not-reported' } } });
});

test.each(['tool', 'refusal', 'incomplete', 'model', 'control', 'over-budget', 'conversation', 'invalid-usage'])
  ('retains rejection without exposing a report for %s', (kind) => {
    const raw = response();
    if (kind === 'tool') raw.output.push({ type: 'function_call', name: 'read' });
    if (kind === 'refusal') raw.output[0].content = [{ type: 'refusal', refusal: 'denied' }];
    if (kind === 'incomplete') raw.status = 'incomplete';
    if (kind === 'model') raw.model = 'different-model';
    if (kind === 'control') raw.background = true;
    if (kind === 'conversation') raw.previous_response_id = 'prior';
    if (kind === 'over-budget') raw.usage = { input_tokens: 1, output_tokens: 16385, total_tokens: 16386 };
    if (kind === 'invalid-usage') raw.usage.total_tokens = -1;
    const result = assessO09ApiResponse(transport(raw));
    expect(result.transportAcceptance).toBe('Not Accepted');
    expect(result).not.toHaveProperty('report');
  });

test.each([200, 400])('sends the fixed source request once for HTTP %i and retains raw evidence', async (status) => {
  prepare(); const expectedWindowSha256 = windowHash();
  const fake = fakeRequest({ status, value: status === 200 ? response() : { error: { message: 'Unsupported parameter' } } });
  const result = await run({ requestImpl: fake.requestImpl });
  expect(result).toMatchObject({ transportAcceptance: status === 200 ? 'Functional Pass' : 'Not Accepted',
    reportAcceptance: 'Not Evaluated', runtimeReady: false, dispatchAttempted: true });
  expect(fake.requestImpl).toHaveBeenCalledOnce();
  const [endpoint, options] = fake.requestImpl.mock.calls[0];
  expect(endpoint).toBe(`${baseUrl}/responses`);
  expect(options).toMatchObject({ rejectUnauthorized: true, agent: false, maxHeaderSize: 16384,
    headers: { 'Content-Length': 48305, Authorization: `Bearer ${keyText}` } });
  expect(fake.request.end).toHaveBeenCalledExactlyOnceWith(fs.readFileSync(path.join(windowDir, 'request.json')));
  expect(fs.existsSync(path.join(windowDir, 'attempt/report.md'))).toBe(status === 200);
  if (status === 200) expect(fs.readFileSync(path.join(windowDir, 'attempt/report.md'), 'utf8')).toBe('PUBLIC_SYNTHETIC_REPORT\n');
  expect(JSON.stringify(result)).not.toContain(keyText);
  const input = new PassThrough(); const read = vi.spyOn(input, 'on');
  await expect(run({ expectedWindowSha256, credentialInput: input, requestImpl: fake.requestImpl })).rejects.toThrow(/unused/);
  expect(read).not.toHaveBeenCalled(); expect(fake.requestImpl).toHaveBeenCalledOnce();
});

test('a bad credential consumes the source window without dispatch', async () => {
  prepare(); const requestImpl = vi.fn();
  expect(await run({ credentialInput: Readable.from(['invalid key']), requestImpl }))
    .toMatchObject({ status: 'attempt-failed', dispatchAttempted: false });
  expect(requestImpl).not.toHaveBeenCalled();
  await expect(run({ requestImpl })).rejects.toThrow(/unused/);
});

test.each(['deadline', 'response-size'])('applies the review-specific %s bound without retry', async (kind) => {
  if (kind === 'deadline') vi.useFakeTimers();
  const fake = fakeRequest({ silent: kind === 'deadline', oversize: kind === 'response-size' });
  const pending = postBoundedJson({ endpoint: `${baseUrl}/responses`, body: Buffer.from('{}'), limits: O09_LIMITS,
    key: Buffer.from(keyText), requestImpl: fake.requestImpl });
  if (kind === 'deadline') await vi.advanceTimersByTimeAsync(300000);
  const result = await pending;
  expect(result.transportError).toBe(kind === 'deadline' ? 'wall-deadline' : 'response-byte-limit');
  expect(fake.requestImpl).toHaveBeenCalledOnce(); expect(fake.request.destroy).toHaveBeenCalledOnce();
  expect(result.retainedBytes).toBe(0);
});

test.each(['body', 'limit', 'endpoint'])('shared transport rejects invalid %s without opening a socket', (kind) => {
  const requestImpl = vi.fn();
  expect(() => postBoundedJson({ endpoint: kind === 'endpoint' ? 'http://review.invalid/responses' : `${baseUrl}/responses`,
    body: kind === 'body' ? Buffer.alloc(O09_LIMITS.requestBytes + 1) : Buffer.from('{}'),
    limits: kind === 'limit' ? { ...O09_LIMITS, wallDeadlineMs: 0 } : O09_LIMITS,
    key: Buffer.from(keyText), requestImpl })).toThrow();
  expect(requestImpl).not.toHaveBeenCalled();
});
