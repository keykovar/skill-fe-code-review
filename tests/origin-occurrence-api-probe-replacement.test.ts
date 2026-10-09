import crypto from 'node:crypto';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import https from 'node:https';
import os from 'node:os';
import path from 'node:path';
import { PassThrough, Readable } from 'node:stream';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { assessSourceFreeProbe, prepareSourceFreeProbe, PROBE_MARKER, REPLACEMENT_PROBE_PROFILE,
  runSourceFreeProbe, sourceFreeProbeBody, verifySourceFreeProbe } from '../scripts/origin-occurrence-api-probe.mjs';

const profile = REPLACEMENT_PROBE_PROFILE;
const baseUrl = 'https://probe.invalid';
const hash = (bytes: Buffer) => crypto.createHash('sha256').update(bytes).digest('hex');
let temporary: string;
let windowDir: string;
beforeEach(() => {
  temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'origin-api-replacement-test-'));
  windowDir = path.join(temporary, 'window');
});
afterEach(() => { vi.restoreAllMocks(); fs.rmSync(temporary, { recursive: true, force: true }); });

function minimalResponse(): any {
  return { id: 'resp_public_dummy', object: 'response', model: 'gpt-6-astra', status: 'completed',
    output: [{ type: 'message', role: 'assistant', status: 'completed',
      content: [{ type: 'output_text', text: PROBE_MARKER }] }] };
}

function assess(response: any) {
  return assessSourceFreeProbe({ rawResponse: Buffer.from(JSON.stringify(response)), httpStatus: 200 }, profile);
}

function planHash() { return hash(fs.readFileSync(path.join(windowDir, 'window.json'))); }

test('preserves the exact legacy request and removes only background in the replacement', () => {
  expect(hash(sourceFreeProbeBody())).toBe('c6ce94780c21bd26db7ca15ca1ceb181d826c07b17eddb88618a5c23814aaa3d');
  const original = JSON.parse(sourceFreeProbeBody().toString());
  const replacement = JSON.parse(sourceFreeProbeBody(profile).toString());
  const { background, ...retained } = original;
  expect(background).toBe(false);
  expect(replacement).toEqual(retained);
  expect(replacement).not.toHaveProperty('background');
});

test('prepares a distinct fixed offline contract with no network or readiness promotion', () => {
  const network = vi.spyOn(https, 'request').mockImplementation(() => { throw new Error('Unexpected network'); });
  const plan = prepareSourceFreeProbe({ baseUrl, windowDir, profile });
  expect(plan).toMatchObject({ version: 2, profile, acceptancePolicy: 'functional-response-with-unverified-missing-metadata',
    executionAuthorized: false, runtimeReady: false, sourceTransferAuthorized: false, modelInvocations: 0,
    limits: { maxOutputTokens: 4096, wallDeadlineMs: 180000, requests: 1, retries: 0 } });
  expect(verifySourceFreeProbe(windowDir, planHash())).toEqual(plan);
  expect(network).not.toHaveBeenCalled();
  expect(fs.readdirSync(windowDir).sort()).toEqual(['request.json', 'window.json']);
});

test('rejects an unknown profile before creating a window', () => {
  expect(() => prepareSourceFreeProbe({ baseUrl, windowDir, profile: 'arbitrary-body' })).toThrow(/profile/);
  expect(fs.existsSync(windowDir)).toBe(false);
});

test.each(['body', 'policy', 'profile'])('rejects self-consistent replacement %s tampering', (kind) => {
  prepareSourceFreeProbe({ baseUrl, windowDir, profile });
  const filename = path.join(windowDir, 'window.json');
  const plan = JSON.parse(fs.readFileSync(filename, 'utf8'));
  if (kind === 'body') {
    const bytes = sourceFreeProbeBody();
    fs.writeFileSync(path.join(windowDir, 'request.json'), bytes);
    plan.request.bytes = bytes.length; plan.request.sha256 = hash(bytes);
  }
  if (kind === 'policy') plan.acceptancePolicy = 'accept-any-response';
  if (kind === 'profile') delete plan.profile;
  fs.writeFileSync(filename, JSON.stringify(plan));
  expect(() => verifySourceFreeProbe(windowDir, planHash())).toThrow(/current proposal/);
});

test('missing echoes and usage remain unverified, while the legacy policy still fails', () => {
  const response = minimalResponse();
  const result = assess(response);
  expect(result).toMatchObject({ compatibility: 'Functional Pass', runtimeReady: false, sourceTransferAuthorized: false,
    reportAcceptance: 'Not Evaluated', codexAcceptance: 'Not Evaluated', serverSideEnforcement: 'Unverified',
    modelIdentity: 'Unverified', usage: { status: 'unavailable' },
    controlEvidence: { background: { status: 'not-reported' }, max_output_tokens: { status: 'not-reported' },
      model: { status: 'reported-match', value: 'gpt-6-astra' } } });
  expect(result).not.toHaveProperty('report');
  expect(assessSourceFreeProbe({ rawResponse: Buffer.from(JSON.stringify(response)), httpStatus: 200 }).compatibility)
    .toBe('Cannot Verify');
});

test('retains reported usage and control evidence without claiming enforcement', () => {
  const response = { ...minimalResponse(), reasoning: { effort: 'xhigh' }, background: false,
    max_output_tokens: 4096, usage: { input_tokens: 10, output_tokens: 20, total_tokens: 30,
      output_tokens_details: { reasoning_tokens: 18 } } };
  expect(assess(response)).toMatchObject({ compatibility: 'Functional Pass', serverSideEnforcement: 'Unverified',
    usage: { status: 'reported', value: response.usage },
    controlEvidence: { background: { status: 'reported-match' }, reasoning: { status: 'reported-match' } } });
});

test.each([
  ['model', 'another-model'], ['reasoning', { effort: 'low' }], ['background', true], ['stream', true],
  ['tools', [{ type: 'web_search' }]], ['tool_choice', 'auto'], ['store', true], ['truncation', 'auto'],
  ['max_output_tokens', 8192], ['previous_response_id', 'prior'], ['conversation', { id: 'prior' }],
])('explicit conflicting %s is not accepted', (field, value) => {
  const response = minimalResponse(); response[field as string] = value;
  expect(assess(response).compatibility).toBe('Not Accepted');
});

test.each(['wrong-marker', 'incomplete', 'tool-call', 'refusal', 'over-budget', 'invalid-usage'])
  ('replacement still rejects %s', (kind) => {
    const response = minimalResponse();
    if (kind === 'wrong-marker') response.output[0].content[0].text = 'something else';
    if (kind === 'incomplete') response.status = 'incomplete';
    if (kind === 'tool-call') response.output.push({ type: 'function_call', name: 'read' });
    if (kind === 'refusal') response.output[0].content = [{ type: 'refusal', refusal: 'denied' }];
    if (kind === 'over-budget') response.usage = { input_tokens: 1, output_tokens: 4097, total_tokens: 4098 };
    if (kind === 'invalid-usage') response.usage = { input_tokens: 1, output_tokens: 2, total_tokens: 0 };
    expect(assess(response).compatibility).toBe('Not Accepted');
  });

test.each([200, 400])('one synthetic HTTP %i attempt sends frozen replacement bytes and forbids re-entry', async (httpStatus) => {
  prepareSourceFreeProbe({ baseUrl, windowDir, profile });
  const expectedWindowSha256 = planHash();
  const request: any = new EventEmitter(); request.destroy = vi.fn();
  const incoming: any = new EventEmitter(); incoming.destroy = vi.fn();
  incoming.statusCode = httpStatus; incoming.headers = { 'content-type': 'application/json' }; incoming.complete = true;
  const requestImpl = vi.fn((_url, _options, callback) => {
    request.end = vi.fn(() => queueMicrotask(() => {
      callback(incoming);
      incoming.emit('data', Buffer.from(JSON.stringify(httpStatus === 200 ? minimalResponse() :
        { error: { message: 'Unsupported parameter: truncation', type: 'invalid_request_error' } })));
      incoming.emit('end');
    }));
    return request;
  });
  const result = await runSourceFreeProbe({ windowDir, expectedWindowSha256, acknowledgeUnpricedProbe: true,
    credentialInput: Readable.from(['dummy-public-key']), requestImpl });
  expect(result).toMatchObject({ profile, compatibility: httpStatus === 200 ? 'Functional Pass' : 'Not Accepted',
    dispatchAttempted: true, runtimeReady: false, sourceTransferAuthorized: false });
  expect(request.end).toHaveBeenCalledExactlyOnceWith(fs.readFileSync(path.join(windowDir, 'request.json')));
  expect(requestImpl.mock.calls[0][1].headers['Content-Length']).toBe(sourceFreeProbeBody(profile).length);
  expect(requestImpl).toHaveBeenCalledOnce();
  expect(request.destroy).toHaveBeenCalledOnce(); expect(incoming.destroy).toHaveBeenCalledOnce();
  expect(JSON.parse(fs.readFileSync(path.join(windowDir, 'attempt/claim.json'), 'utf8')).profile).toBe(profile);
  const input = new PassThrough(); const read = vi.spyOn(input, 'on');
  await expect(runSourceFreeProbe({ windowDir, expectedWindowSha256, acknowledgeUnpricedProbe: true,
    credentialInput: input, requestImpl })).rejects.toThrow(/unused/);
  expect(read).not.toHaveBeenCalled(); expect(requestImpl).toHaveBeenCalledOnce();
});
