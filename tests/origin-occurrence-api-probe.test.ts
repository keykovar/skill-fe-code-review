import crypto from 'node:crypto';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import https from 'node:https';
import os from 'node:os';
import path from 'node:path';
import { PassThrough, Readable } from 'node:stream';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { assessSourceFreeProbe, postSourceFreeProbe, prepareSourceFreeProbe, PROBE_LIMITS, PROBE_MARKER,
  readProbeCredential, runSourceFreeProbe, sourceFreeProbeBody, verifySourceFreeProbe } from '../scripts/origin-occurrence-api-probe.mjs';

const baseUrl = 'https://probe.invalid';
const keyText = 'dummy-public-test-key';
const hash = (bytes: Buffer) => crypto.createHash('sha256').update(bytes).digest('hex');
let temporary: string;
let windowDir: string;
beforeEach(() => {
  temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'origin-api-probe-test-'));
  windowDir = path.join(temporary, 'window');
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); fs.rmSync(temporary, { recursive: true, force: true }); });

function completedResponse() {
  const request = JSON.parse(sourceFreeProbeBody().toString('utf8'));
  const { instructions, input, stream, ...echo } = request;
  return { ...echo, id: 'resp_synthetic', object: 'response', status: 'completed', error: null, incomplete_details: null,
    previous_response_id: null, output: [{ type: 'message', role: 'assistant', status: 'completed',
      content: [{ type: 'output_text', text: PROBE_MARKER }] }],
    usage: { input_tokens: 50, output_tokens: 20, total_tokens: 70 } };
}

function transport(value: any) {
  return { rawResponse: Buffer.from(JSON.stringify(value)), httpStatus: 200, transportError: null };
}

function windowHash() { return hash(fs.readFileSync(path.join(windowDir, 'window.json'))); }
function preparedRun(overrides: Record<string, any> = {}) {
  return runSourceFreeProbe({ windowDir, expectedWindowSha256: windowHash(), acknowledgeUnpricedProbe: true,
    credentialInput: Readable.from([keyText]), ...overrides });
}

function fakeRequest(run: (request: any, incoming: any, deliver: () => void) => void) {
  const request: any = new EventEmitter();
  request.destroy = vi.fn();
  const incoming: any = new EventEmitter();
  incoming.statusCode = 200;
  incoming.headers = { 'content-type': 'application/json' };
  incoming.complete = true;
  incoming.destroy = vi.fn();
  const requestImpl = vi.fn((_url, _options, callback) => {
    request.end = vi.fn(() => queueMicrotask(() => run(request, incoming, () => callback(incoming))));
    return request;
  });
  return { requestImpl, request, incoming };
}

function successfulRequest() {
  return fakeRequest((_request, incoming, deliver) => {
    deliver();
    const bytes = Buffer.from(JSON.stringify(completedResponse()));
    incoming.emit('data', bytes.subarray(0, 37)); incoming.emit('data', bytes.subarray(37)); incoming.emit('end');
  });
}

describe('Fixed source-free proposal', () => {
  test('prepares an inspectable offline body without credentials, source, discovery or network', () => {
    const network = vi.spyOn(https, 'request').mockImplementation(() => { throw new Error('Unexpected network'); });
    const plan = prepareSourceFreeProbe({ baseUrl, windowDir });
    expect(plan).toMatchObject({ endpoint: `${baseUrl}/responses`, runtimeReady: false, routeAdopted: false,
      executionAuthorized: false, sourceTransferAuthorized: false, modelInvocations: 0,
      billing: { monetaryCap: null, priceVerified: false, singleProbeRiskAccepted: false } });
    expect(plan.limits).toEqual(PROBE_LIMITS);
    expect(verifySourceFreeProbe(windowDir, windowHash())).toEqual(plan);
    expect(network).not.toHaveBeenCalled();
    const bytes = fs.readFileSync(path.join(windowDir, 'request.json'));
    expect(plan.request.sha256).toBe(hash(bytes));
    expect(plan.request.bytes).toBe(bytes.length);
    expect(bytes.length).toBeLessThan(PROBE_LIMITS.requestBytes);
    const body = JSON.parse(bytes.toString('utf8'));
    expect(body).toMatchObject({ model: 'gpt-6-astra', reasoning: { effort: 'xhigh' }, tools: [], tool_choice: 'none',
      stream: false, background: false, store: false, truncation: 'disabled', max_output_tokens: 4096 });
    expect(body.input).toEqual([{ role: 'user', content: [{ type: 'input_text', text: `Return exactly ${PROBE_MARKER}` }] }]);
    for (const forbidden of ['SKILL.md', 'profile.mjs', 'previous_response_id', 'conversation', 'api_key', 'Authorization', 'O-09']) {
      expect(bytes.toString('utf8')).not.toContain(forbidden);
    }
    expect(fs.readdirSync(windowDir).sort()).toEqual(['request.json', 'window.json']);
    expect(() => prepareSourceFreeProbe({ baseUrl, windowDir })).toThrow(/already exists/);
  });

  test.each(['http://probe.invalid', 'https://user:secret@probe.invalid', 'https://probe.invalid/?query=1',
    'https://probe.invalid/#fragment', 'https://probe.invalid/../other', ' https://probe.invalid'])('rejects ambiguous base %s', (url) => {
    expect(() => prepareSourceFreeProbe({ baseUrl: url, windowDir })).toThrow();
    expect(fs.existsSync(windowDir)).toBe(false);
  });

  test('preserves a supplied base path and never guesses /v1', () => {
    expect(prepareSourceFreeProbe({ baseUrl: `${baseUrl}/custom/`, windowDir }).endpoint).toBe(`${baseUrl}/custom/responses`);
  });

  test.each(['endpoint', 'tools', 'body', 'symlink', 'extra-file'])('rejects modified %s before credential input', async (kind) => {
    prepareSourceFreeProbe({ baseUrl, windowDir });
    const expectedWindowSha256 = windowHash();
    const planFile = path.join(windowDir, 'window.json');
    if (kind === 'endpoint' || kind === 'tools') {
      const plan = JSON.parse(fs.readFileSync(planFile, 'utf8'));
      if (kind === 'endpoint') { plan.baseUrl = 'https://other.invalid'; plan.endpoint = 'https://other.invalid/responses'; }
      else plan.toolHashes[0].sha256 = '0'.repeat(64);
      fs.writeFileSync(planFile, JSON.stringify(plan));
    } else if (kind === 'body') fs.writeFileSync(path.join(windowDir, 'request.json'), '{}');
    else if (kind === 'symlink') {
      const target = path.join(temporary, 'plan-copy.json'); fs.renameSync(planFile, target); fs.symlinkSync(target, planFile);
    } else fs.writeFileSync(path.join(windowDir, 'answer.md'), 'not allowed');
    const credentialInput = new PassThrough();
    const readSpy = vi.spyOn(credentialInput, 'on');
    await expect(preparedRun({ expectedWindowSha256, credentialInput })).rejects.toThrow();
    expect(readSpy).not.toHaveBeenCalled();
    expect(fs.existsSync(path.join(windowDir, 'attempt'))).toBe(false);
  });

  test('requires a separate expected hash and cost acknowledgement', async () => {
    prepareSourceFreeProbe({ baseUrl, windowDir });
    expect(() => verifySourceFreeProbe(windowDir, undefined)).toThrow(/approved hash/);
    await expect(preparedRun({ acknowledgeUnpricedProbe: false })).rejects.toThrow(/unpriced probe/);
    expect(fs.existsSync(path.join(windowDir, 'attempt'))).toBe(false);
  });

  test.each(['limits', 'tool-hash', 'source-body'])('rejects self-consistent %s edits even with a fresh digest', (kind) => {
    prepareSourceFreeProbe({ baseUrl, windowDir });
    const filename = path.join(windowDir, 'window.json');
    const plan = JSON.parse(fs.readFileSync(filename, 'utf8'));
    if (kind === 'limits') plan.limits.maxOutputTokens = 99999;
    if (kind === 'tool-hash') plan.toolHashes[0].sha256 = '0'.repeat(64);
    if (kind === 'source-body') {
      const changed = Buffer.from('{"input":"private source"}');
      fs.writeFileSync(path.join(windowDir, 'request.json'), changed);
      plan.request = { path: 'request.json', bytes: changed.length, sha256: hash(changed) };
    }
    fs.writeFileSync(filename, JSON.stringify(plan));
    expect(() => verifySourceFreeProbe(windowDir, windowHash())).toThrow(/current proposal/);
  });
});

describe('Observable compatibility, not review acceptance', () => {
  test('requires the marker and echoed controls without promoting runtime or review status', () => {
    const result = assessSourceFreeProbe(transport(completedResponse()));
    expect(result).toMatchObject({ compatibility: 'Observable Pass', runtimeReady: false,
      sourceTransferAuthorized: false, codexAcceptance: 'Not Evaluated', reportAcceptance: 'Not Evaluated' });
    expect(result).not.toHaveProperty('report');
  });

  test.each(['model', 'reasoning', 'tools', 'tool_choice', 'background', 'store', 'truncation', 'max_output_tokens'])
    ('missing %s is not accepted', (field) => {
      const response: any = completedResponse(); delete response[field];
      expect(assessSourceFreeProbe(transport(response)).compatibility).not.toBe('Observable Pass');
    });

  test.each([
    ['model', 'different-model'], ['reasoning', { effort: 'low' }], ['tools', [{ type: 'web_search' }]],
    ['tool_choice', 'auto'], ['background', true], ['store', true], ['truncation', 'auto'], ['max_output_tokens', 9999],
    ['previous_response_id', 'prior'], ['conversation', { id: 'old' }],
  ])('rejects incompatible %s', (field, value) => {
    const response: any = completedResponse(); response[field as string] = value;
    expect(assessSourceFreeProbe(transport(response)).compatibility).toBe('Not Accepted');
  });

  test.each(['wrong-marker', 'no-usage', 'over-budget', 'tool-call', 'truncated'])('does not accept %s', (kind) => {
    const response: any = completedResponse();
    if (kind === 'wrong-marker') response.output[0].content[0].text = 'other';
    if (kind === 'no-usage') delete response.usage;
    if (kind === 'over-budget') response.usage = { input_tokens: 50, output_tokens: 4097, total_tokens: 4147 };
    if (kind === 'tool-call') response.output.push({ type: 'function_call', name: 'read' });
    if (kind === 'truncated') response.status = 'incomplete';
    expect(assessSourceFreeProbe(transport(response)).compatibility).not.toBe('Observable Pass');
  });
});

describe('Single POST transport using synthetic events only', () => {
  test('posts exactly the fixed bytes, verifies TLS, closes resources and keeps secrets out of evidence', async () => {
    const fake = successfulRequest();
    const key = Buffer.from(keyText);
    const result: any = await postSourceFreeProbe({ baseUrl, key, requestImpl: fake.requestImpl });
    expect(fake.requestImpl).toHaveBeenCalledTimes(1);
    const [url, options] = fake.requestImpl.mock.calls[0];
    expect(url).toBe(`${baseUrl}/responses`);
    expect(options).toMatchObject({ method: 'POST', agent: false, rejectUnauthorized: true, maxHeaderSize: 16384,
      headers: { Authorization: `Bearer ${keyText}`, 'Accept-Encoding': 'identity', 'Content-Length': sourceFreeProbeBody().length } });
    expect(fake.request.end).toHaveBeenCalledExactlyOnceWith(sourceFreeProbeBody());
    expect(fake.request.destroy).toHaveBeenCalledOnce();
    expect(fake.incoming.destroy).toHaveBeenCalledOnce();
    expect(result.transportError).toBeNull();
    expect(JSON.parse(result.rawResponse.toString())).toEqual(completedResponse());
    expect(JSON.stringify(result)).not.toContain(keyText);
    expect(assessSourceFreeProbe(result).compatibility).toBe('Observable Pass');
  });

  test.each([
    ['redirect', 'redirect-rejected'], ['html', 'unsupported-content-type'], ['compression', 'unsupported-content-encoding'],
    ['oversize', 'response-byte-limit'], ['aborted', 'response-aborted'], ['incomplete', 'response-incomplete'],
    ['early-close', 'response-closed-early'], ['response-error', 'response-error'], ['request-error', 'request-error'],
  ])('stops on %s with no retry', async (kind, reason) => {
    const fake = fakeRequest((request, incoming, deliver) => {
      if (kind === 'request-error') { request.emit('error', new Error(keyText)); return; }
      if (kind === 'redirect') { incoming.statusCode = 307; incoming.headers.location = 'https://other.invalid'; }
      if (kind === 'html') incoming.headers['content-type'] = 'text/html';
      if (kind === 'compression') incoming.headers['content-encoding'] = 'gzip';
      deliver();
      if (kind === 'oversize') incoming.emit('data', Buffer.alloc(PROBE_LIMITS.responseBytes + 1));
      if (kind === 'aborted') incoming.emit('aborted');
      if (kind === 'incomplete') { incoming.complete = false; incoming.emit('end'); }
      if (kind === 'early-close') incoming.emit('close');
      if (kind === 'response-error') incoming.emit('error', new Error(keyText));
    });
    const result: any = await postSourceFreeProbe({ baseUrl, key: Buffer.from(keyText), requestImpl: fake.requestImpl });
    expect(result.transportError).toBe(reason);
    expect(result.remoteCompletion).toBe('Unknown');
    expect(result.rawResponse.length).toBeLessThanOrEqual(PROBE_LIMITS.responseBytes);
    expect(fake.requestImpl).toHaveBeenCalledOnce();
    expect(fake.request.destroy).toHaveBeenCalledOnce();
    expect(JSON.stringify(result)).not.toContain(keyText);
  });

  test('total wall deadline covers a silent connection and late callbacks cannot reopen it', async () => {
    vi.useFakeTimers();
    const request: any = new EventEmitter(); request.end = vi.fn(); request.destroy = vi.fn();
    let callback: any;
    const requestImpl = vi.fn((_url, _options, incoming) => { callback = incoming; return request; });
    const pending = postSourceFreeProbe({ baseUrl, key: Buffer.from(keyText), requestImpl });
    await vi.advanceTimersByTimeAsync(PROBE_LIMITS.wallDeadlineMs);
    const result: any = await pending;
    expect(result.transportError).toBe('wall-deadline');
    expect(request.destroy).toHaveBeenCalledOnce();
    const late: any = new EventEmitter(); late.destroy = vi.fn();
    callback(late);
    expect(late.destroy).toHaveBeenCalledOnce();
    expect(requestImpl).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  test('TLS/setup failure is sanitized without retry', async () => {
    const requestImpl = vi.fn(() => { throw new Error(keyText); });
    const result: any = await postSourceFreeProbe({ baseUrl, key: Buffer.from(keyText), requestImpl });
    expect(result.transportError).toBe('request-setup-error');
    expect(requestImpl).toHaveBeenCalledOnce();
    expect(JSON.stringify(result)).not.toContain(keyText);
  });
});

describe('Credential pipe and once-only attempt', () => {
  test.each(['', `${keyText}\n`, `${keyText}\r\n`, 'white space', 'x'.repeat(4097)])('rejects invalid credential %# without dispatch', async (key) => {
    prepareSourceFreeProbe({ baseUrl, windowDir });
    const requestImpl = vi.fn();
    const result = await preparedRun({ credentialInput: Readable.from([key]), requestImpl });
    expect(result).toMatchObject({ status: 'attempt-failed', dispatchAttempted: false });
    expect(requestImpl).not.toHaveBeenCalled();
    await expect(preparedRun({ requestImpl })).rejects.toThrow(/unused/);
  });

  test('credential input is bounded in time without sending a request', async () => {
    vi.useFakeTimers();
    const input = new PassThrough();
    const rejection = expect(readProbeCredential(input)).rejects.toThrow(/timed out/);
    await vi.advanceTimersByTimeAsync(PROBE_LIMITS.credentialWaitMs);
    await rejection;
    expect(input.isPaused()).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  test('a failed credential pipe is sanitized and consumes the window without a request', async () => {
    prepareSourceFreeProbe({ baseUrl, windowDir });
    const input = new PassThrough();
    const requestImpl = vi.fn();
    const pending = preparedRun({ credentialInput: input, requestImpl });
    input.destroy(new Error(keyText));
    const result = await pending;
    expect(result).toMatchObject({ dispatchAttempted: false, compatibility: 'Not Accepted' });
    expect(requestImpl).not.toHaveBeenCalled();
    expect(JSON.stringify(result)).not.toContain(keyText);
    expect(fs.existsSync(path.join(windowDir, 'attempt/failure.json'))).toBe(true);
  });

  test('records a complete dummy attempt once and rejects re-entry before reading another key', async () => {
    prepareSourceFreeProbe({ baseUrl, windowDir });
    const expectedWindowSha256 = windowHash();
    const fake = successfulRequest();
    const result = await preparedRun({ requestImpl: fake.requestImpl });
    expect(result).toMatchObject({ compatibility: 'Observable Pass', dispatchAttempted: true, runtimeReady: false });
    const attemptDir = path.join(windowDir, 'attempt');
    expect(fs.readdirSync(attemptDir).sort()).toEqual(['claim.json', 'response.bin', 'result.json']);
    for (const filename of fs.readdirSync(attemptDir)) expect(fs.readFileSync(path.join(attemptDir, filename), 'utf8')).not.toContain(keyText);
    expect(JSON.parse(fs.readFileSync(path.join(attemptDir, 'claim.json'), 'utf8')).windowSha256).toBe(expectedWindowSha256);
    expect(fs.readFileSync(path.join(attemptDir, 'response.bin'))).toEqual(transport(completedResponse()).rawResponse);
    const credentialInput = new PassThrough(); const spy = vi.spyOn(credentialInput, 'on');
    await expect(preparedRun({ credentialInput, requestImpl: fake.requestImpl })).rejects.toThrow(/unused/);
    expect(spy).not.toHaveBeenCalled(); expect(fake.requestImpl).toHaveBeenCalledOnce();
  });
});
