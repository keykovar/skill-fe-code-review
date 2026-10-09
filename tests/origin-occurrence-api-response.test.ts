import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import { OFFLINE_LIMITS, parseOriginOccurrenceResponse, parseOriginOccurrenceResponseFile } from '../scripts/origin-occurrence-api.mjs';
import { rootDir } from './test-utils';

function response(): any {
  return { id: 'resp_authored_fixture', object: 'response', model: 'provider-reported-model', status: 'completed',
    error: null, incomplete_details: null,
    output: [{ type: 'message', role: 'assistant', status: 'completed',
      content: [{ type: 'output_text', text: 'Authored format fixture, not a scored review.\n' }] }],
    usage: { input_tokens: 100, output_tokens: 50, total_tokens: 150,
      input_tokens_details: { cached_tokens: 20 }, output_tokens_details: { reasoning_tokens: 30 } } };
}
const bytes = (value: any) => Buffer.from(JSON.stringify(value));
const parse = (value: any) => parseOriginOccurrenceResponse({ rawResponse: bytes(value), httpStatus: 200 });
let temporary: string;
beforeEach(() => { temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'origin-api-response-test-')); });
afterEach(() => fs.rmSync(temporary, { recursive: true, force: true }));

describe('Offline Responses parsing', () => {
  test('extracts completed text exactly without asserting review correctness or model identity', () => {
    const input = response();
    input.output[0].content = [{ type: 'output_text', text: '\nFirst line\r\n' }, { type: 'output_text', text: 'Second line\n' }];
    const rawResponse = bytes(input);
    const before = Buffer.from(rawResponse);
    const result = parseOriginOccurrenceResponse({ rawResponse, httpStatus: 200 });
    expect(result).toMatchObject({ status: 'response-text-extracted', reportAcceptance: 'Not Evaluated',
      report: '\nFirst line\r\nSecond line\n', returnedModel: 'provider-reported-model',
      usage: { status: 'reported', value: input.usage } });
    expect(result.responseSha256).toBe(crypto.createHash('sha256').update(before).digest('hex'));
    expect(result.responseBytes).toBe(before.length);
    expect(rawResponse).toEqual(before);
  });

  test('keeps reasoning opaque in the raw response and excludes it from the report', () => {
    const input = response();
    input.output.unshift({ type: 'reasoning', summary: [{ type: 'summary_text', text: 'DO NOT COPY' }], encrypted_content: 'opaque' });
    input.output.push({ type: 'reasoning', status: 'completed' });
    const result = parse(input);
    expect(result.status).toBe('response-text-extracted');
    expect(result.reasoningItems).toBe(2);
    expect(result.report).toBe(input.output[1].content[0].text);
    expect(JSON.stringify(result)).not.toContain('DO NOT COPY');
  });

  test.each([undefined, null])('missing usage %s stays unavailable', (usage) => {
    const input = response();
    input.usage = usage;
    expect(parse(input).usage).toEqual({ status: 'unavailable' });
  });

  test('explicit zero usage remains reported, distinct from missing usage', () => {
    const input = response();
    input.usage = { input_tokens: 0, output_tokens: 0, total_tokens: 0 };
    expect(parse(input).usage).toEqual({ status: 'reported', value: input.usage });
  });

  const invalidCases = [
    ['null envelope', () => null, 'invalid-response-envelope'],
    ['array envelope', () => [], 'invalid-response-envelope'],
    ['wrong object', (r: any) => ({ ...r, object: 'chat.completion' }), 'invalid-response-envelope'],
    ['missing ID', (r: any) => ({ ...r, id: '' }), 'invalid-response-envelope'],
    ['missing model', (r: any) => ({ ...r, model: undefined }), 'invalid-response-envelope'],
    ['error', (r: any) => ({ ...r, error: { message: 'failure' } }), 'response-error'],
    ...['incomplete', 'failed', 'queued', 'in_progress', 'cancelled', undefined].map((status) =>
      [`status ${status}`, (r: any) => ({ ...r, status }), 'response-not-completed']),
    ['truncation details', (r: any) => ({ ...r, incomplete_details: { reason: 'max_output_tokens' } }), 'response-not-completed'],
    ['empty output', (r: any) => ({ ...r, output: [] }), 'empty-or-invalid-output'],
    ['invalid output', (r: any) => ({ ...r, output: 'text' }), 'empty-or-invalid-output'],
    ['output_text shortcut only', (r: any) => ({ ...r, output: undefined, output_text: 'shortcut' }), 'empty-or-invalid-output'],
    ['null output item', (r: any) => ({ ...r, output: [null] }), 'invalid-output-item'],
    ...['function_call', 'custom_tool_call', 'web_search_call', 'file_search_call', 'computer_call', 'mcp_call', 'future_item'].map((type) =>
      [type, (r: any) => ({ ...r, output: [...r.output, { type }] }), 'unsupported-output-item']),
    ['incomplete reasoning', (r: any) => ({ ...r, output: [...r.output, { type: 'reasoning', status: 'in_progress' }] }), 'reasoning-not-completed'],
    ['reasoning only', (r: any) => ({ ...r, output: [{ type: 'reasoning' }] }), 'expected-one-nonempty-report'],
    ['multiple messages', (r: any) => ({ ...r, output: [...r.output, ...r.output] }), 'expected-one-nonempty-report'],
    ['non-assistant role', (r: any) => { r.output[0].role = 'user'; return r; }, 'invalid-assistant-message'],
    ['incomplete message', (r: any) => { r.output[0].status = 'in_progress'; return r; }, 'invalid-assistant-message'],
    ['commentary message', (r: any) => { r.output[0].phase = 'commentary'; return r; }, 'invalid-assistant-message'],
    ['missing content', (r: any) => { delete r.output[0].content; return r; }, 'invalid-assistant-message'],
    ['refusal after text', (r: any) => { r.output[0].content.push({ type: 'refusal', refusal: 'No' }); return r; }, 'refusal'],
    ['unknown content', (r: any) => { r.output[0].content.push({ type: 'image' }); return r; }, 'unsupported-message-content'],
    ['null content', (r: any) => { r.output[0].content.push(null); return r; }, 'unsupported-message-content'],
    ['numeric text', (r: any) => { r.output[0].content[0].text = 42; return r; }, 'unsupported-message-content'],
    ['empty content', (r: any) => { r.output[0].content = []; return r; }, 'expected-one-nonempty-report'],
    ['whitespace text', (r: any) => { r.output[0].content[0].text = ' \n\t'; return r; }, 'expected-one-nonempty-report'],
    ['negative usage', (r: any) => { r.usage.input_tokens = -1; return r; }, 'invalid-usage'],
    ['partial usage', (r: any) => { delete r.usage.total_tokens; return r; }, 'invalid-usage'],
    ['inconsistent usage', (r: any) => { r.usage.total_tokens = 149; return r; }, 'invalid-usage'],
    ['usage string', (r: any) => { r.usage.output_tokens = '50'; return r; }, 'invalid-usage'],
    ['oversized reasoning count', (r: any) => { r.usage.output_tokens_details.reasoning_tokens = 51; return r; }, 'invalid-usage'],
    ['invalid usage details', (r: any) => { r.usage.input_tokens_details = []; return r; }, 'invalid-usage'],
  ] as [string, (r: any) => any, string][];
  test.each(invalidCases)('rejects %s without exporting partial text', (_, mutate, reason) => {
    const result = parse(mutate(response()));
    expect(result).toMatchObject({ status: 'rejected', reason, reportAcceptance: 'Not Evaluated' });
    expect(result).not.toHaveProperty('report');
  });

  test.each([Buffer.alloc(0), Buffer.from('{broken'), Buffer.from([0xff]), Buffer.alloc(OFFLINE_LIMITS.responseBytes + 1, 32)])
    ('rejects malformed or oversized raw response %#', (rawResponse) => {
      expect(parseOriginOccurrenceResponse({ rawResponse, httpStatus: 200 }).status).toBe('rejected');
    });

  test.each([undefined, 0, 199, 301, 429, 500])('rejects missing/unsuccessful HTTP status %s', (httpStatus) => {
    expect(parseOriginOccurrenceResponse({ rawResponse: bytes(response()), httpStatus }).reason).toBe('http-status');
  });

  test('transport failure overrides a superficially complete body without logging error details', () => {
    const result = parseOriginOccurrenceResponse({ rawResponse: bytes(response()), httpStatus: 200,
      transportError: new Error('do not copy transport secrets') });
    expect(result.reason).toBe('transport-error');
    expect(JSON.stringify(result)).not.toContain('secrets');
    expect(result).not.toHaveProperty('report');
  });

  test('file parser preserves raw bytes, never executes content, and refuses overwrite', () => {
    const marker = path.join(temporary, 'must-not-exist');
    const input = response();
    input.output[0].content[0].text = `node -e "require('fs').writeFileSync('${marker}', 'unsafe')"`;
    const rawResponse = Buffer.from(`${JSON.stringify(input, null, 2)}\n`);
    const responseFile = path.join(temporary, 'response.json');
    const outputDir = path.join(temporary, 'parsed');
    fs.writeFileSync(responseFile, rawResponse);
    const result = parseOriginOccurrenceResponseFile({ responseFile, httpStatus: 200, outputDir });
    expect(fs.readFileSync(responseFile)).toEqual(rawResponse);
    expect(fs.readFileSync(path.join(outputDir, 'raw-response.json'))).toEqual(rawResponse);
    expect(fs.readFileSync(path.join(outputDir, 'report.md'), 'utf8')).toBe(result.report);
    expect(fs.existsSync(marker)).toBe(false);
    expect(() => parseOriginOccurrenceResponseFile({ responseFile, httpStatus: 200, outputDir })).toThrow(/already exists/);
  });

  test('rejected response is retained as evidence without a report file', () => {
    const responseFile = path.join(temporary, 'response.json');
    const outputDir = path.join(temporary, 'parsed');
    fs.writeFileSync(responseFile, '{bad json');
    const result = parseOriginOccurrenceResponseFile({ responseFile, httpStatus: 200, outputDir });
    expect(result.status).toBe('rejected');
    expect(fs.readdirSync(outputDir).sort()).toEqual(['parsed.json', 'raw-response.json']);
  });

  test('CLI accepts offline parsing and uses a failure exit for a refused response', () => {
    const input = response();
    input.output[0].content.push({ type: 'refusal', refusal: 'No' });
    const responseFile = path.join(temporary, 'response.json');
    fs.writeFileSync(responseFile, bytes(input));
    const run = spawnSync(process.execPath, [path.join(rootDir, 'scripts/origin-occurrence-api.mjs'), 'parse',
      '--response', responseFile, '--http-status', '200', '--output', path.join(temporary, 'parsed')], { encoding: 'utf8', cwd: temporary });
    expect(run.status).toBe(2);
    expect(JSON.parse(run.stdout).reason).toBe('refusal');
  });
});
