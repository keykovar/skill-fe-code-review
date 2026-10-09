#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readOriginOccurrencePilotAssembly } from './assemble-origin-occurrence-pilot.mjs';
import { parseOriginOccurrenceResponse, TRANSPORT_WRAPPER } from './origin-occurrence-api.mjs';
import { inspectResponseControls, postBoundedJson, readProbeCredential } from './origin-occurrence-api-probe.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const jsonBytes = (value) => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
const record = (directory, name, bytes) => fs.writeFileSync(path.join(directory, name), bytes, { flag: 'wx', mode: 0o600 });
const baseDraftSha256 = '577fdb82c5a6ec5deadff4355fa7102fa7c7ebe160252d2d3bedb0d09387f92e';
const requestSha256 = '652c5a8fe3c0990699b8c4b9e3dda2bc792e84bd920b9dacc7e65a3a33e8a19f';
const toolPaths = ['scripts/origin-occurrence-api-review.mjs', 'scripts/origin-occurrence-api-probe.mjs',
  'scripts/origin-occurrence-api.mjs', 'scripts/assemble-origin-occurrence-pilot.mjs'];
export const O09_LIMITS = Object.freeze({ requestBytes: 262144, responseBytes: 2097152, headerBytes: 16384,
  wallDeadlineMs: 300000, maxOutputTokens: 16384, requests: 1, retries: 0, credentialBytes: 4096, credentialWaitMs: 60000 });

function boundedFile(filename, limit) {
  const stat = fs.lstatSync(filename);
  if (!stat.isFile() || stat.size > limit) throw new Error('Expected a bounded regular review file.');
  const bytes = fs.readFileSync(filename);
  if (bytes.length > limit) throw new Error('Review file exceeds its byte limit.');
  return bytes;
}

export function o09RequestFromDraft(bytes) {
  if (!Buffer.isBuffer(bytes) || sha256(bytes) !== baseDraftSha256) throw new Error('Only the frozen O-09 draft is supported.');
  const body = JSON.parse(bytes.toString('utf8'));
  delete body.background;
  body.max_output_tokens = O09_LIMITS.maxOutputTokens;
  const request = jsonBytes(body);
  if (sha256(request) !== requestSha256) throw new Error('O-09 request specification changed.');
  return request;
}

function suppliedDocuments(request) {
  if (sha256(request) !== requestSha256) throw new Error('Only the frozen O-09 request is supported.');
  const body = JSON.parse(request.toString('utf8'));
  const prefix = `${TRANSPORT_WRAPPER}\n\n`;
  if (!body.instructions.startsWith(prefix)) throw new Error('Unexpected instruction wrapper.');
  const instructions = JSON.parse(body.instructions.slice(prefix.length)).documents;
  const input = JSON.parse(body.input[0].content[0].text);
  return [...instructions, input.prompt, ...input.documents];
}

function proposal(baseUrl, request) {
  const url = new URL(baseUrl);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash ||
      url.href.replace(/\/$/, '') !== baseUrl.replace(/\/$/, '')) throw new Error('Expected an exact HTTPS base URL.');
  const documents = suppliedDocuments(request).map(({ path: filename, content }) => {
    const bytes = Buffer.from(content);
    return { path: filename, bytes: bytes.length, sha256: sha256(bytes) };
  });
  return { version: 1, status: 'offline-public-synthetic-review-prepared', caseId: 'O-09', mode: 'fix',
    baseUrl, endpoint: `${baseUrl.replace(/\/$/, '')}/responses`,
    executionAuthorized: false, sourceTransferAuthorized: false, runtimeReady: false, modelInvocations: 0,
    sourcePolicy: 'public-synthetic-only', model: 'gpt-6-astra', effort: 'xhigh', limits: O09_LIMITS,
    billing: { priceVerified: false, monetaryCap: null, outputCapEnforcement: 'Unverified', timeoutStopsRemoteBilling: 'Unknown' },
    acceptance: { transport: 'completed-supported-response-with-no-reported-control-conflict',
      missingMetadata: 'Unverified', report: 'separate-full-report-adjudication-required', nextCase: 'not-automatic' },
    baseDraftSha256, request: { path: 'request.json', bytes: request.length, sha256: requestSha256 }, documents,
    toolHashes: toolPaths.map((file) => ({ path: file, sha256: sha256(fs.readFileSync(path.join(rootDir, file))) })),
  };
}

export function prepareO09ApiReview({ assemblyDir, draftFile, baseUrl, windowDir }) {
  const requested = path.resolve(windowDir);
  const destination = path.join(fs.realpathSync(path.dirname(requested)), path.basename(requested));
  if ((destination === rootDir || destination.startsWith(`${rootDir}${path.sep}`)) &&
      !destination.startsWith(`${path.join(rootDir, '.local-evaluation')}${path.sep}`)) {
    throw new Error('Use an external or ignored local-evaluation directory.');
  }
  if (fs.lstatSync(destination, { throwIfNoEntry: false })) throw new Error('Window already exists; refusing to overwrite.');
  const { result: assembly, packets } = readOriginOccurrencePilotAssembly({ assemblyDir, stage: 1 });
  const request = o09RequestFromDraft(boundedFile(draftFile, O09_LIMITS.requestBytes));
  const packet = packets[0];
  if (assembly.packets[0].caseId !== 'O-09' || packet.spec.mode !== 'fix') throw new Error('Unexpected first packet.');
  const expected = new Map(packet.files.map((file) => [file.path, file.bytes]));
  const documents = suppliedDocuments(request);
  if (documents.length !== expected.size || new Set(documents.map((file) => file.path)).size !== expected.size ||
      documents.some((file) => !expected.get(file.path)?.equals(Buffer.from(file.content)))) {
    throw new Error('Request documents differ from the trusted O-09 assembly.');
  }
  const plan = proposal(baseUrl, request);
  fs.mkdirSync(destination, { mode: 0o700 });
  record(destination, 'request.json', request);
  record(destination, 'window.json', jsonBytes(plan));
  return plan;
}

export function verifyO09ApiReview(windowDir, expectedWindowSha256) {
  if (!fs.lstatSync(windowDir).isDirectory() ||
      !isDeepStrictEqual(fs.readdirSync(windowDir).sort(), ['request.json', 'window.json'])) {
    throw new Error('Expected an unused review window with exactly two files.');
  }
  const bytes = boundedFile(path.join(windowDir, 'window.json'), 32768);
  if (!/^[a-f0-9]{64}$/.test(expectedWindowSha256 ?? '') || sha256(bytes) !== expectedWindowSha256) {
    throw new Error('Review window differs from the independently approved hash.');
  }
  const plan = JSON.parse(bytes.toString('utf8'));
  const request = boundedFile(path.join(windowDir, 'request.json'), O09_LIMITS.requestBytes);
  if (!isDeepStrictEqual(plan, proposal(plan.baseUrl, request))) throw new Error('Review plan or current tool hashes differ.');
  return { plan, request };
}

export function assessO09ApiResponse(transport) {
  const { report, ...parsed } = parseOriginOccurrenceResponse(transport);
  const base = { ...parsed, transportAcceptance: 'Not Accepted', reportAcceptance: 'Not Evaluated',
    runtimeReady: false, codexAcceptance: 'Not Evaluated', modelIdentity: 'Unverified', serverSideEnforcement: 'Unverified' };
  if (parsed.status !== 'response-text-extracted') return base;
  const response = JSON.parse(transport.rawResponse.toString('utf8'));
  const controlEvidence = inspectResponseControls(response, { model: 'gpt-6-astra', reasoning: { effort: 'xhigh' },
    tools: [], tool_choice: 'none', stream: false, store: false, truncation: 'disabled', max_output_tokens: O09_LIMITS.maxOutputTokens });
  const evidence = { ...base, controlEvidence };
  const mismatch = Object.keys(controlEvidence).find((key) => controlEvidence[key].status === 'reported-mismatch');
  if (mismatch) return { ...evidence, reason: `control-mismatch:${mismatch}` };
  if (response.previous_response_id != null || response.conversation != null) return { ...evidence, reason: 'unexpected-conversation-state' };
  if (parsed.usage.status === 'reported' && parsed.usage.value.output_tokens > O09_LIMITS.maxOutputTokens) {
    return { ...evidence, reason: 'reported-output-over-budget' };
  }
  return { ...evidence, transportAcceptance: 'Functional Pass', report,
    verificationLimit: 'Report captured only; missing metadata and server-side enforcement unverified. Full report must be adjudicated separately.' };
}

export async function runO09ApiReview({ windowDir, expectedWindowSha256, allowPublicSource = false,
  acknowledgeUnpricedReview = false, credentialInput, requestImpl }) {
  if (allowPublicSource !== true || acknowledgeUnpricedReview !== true) {
    throw new Error('Explicit public-source scope and unpriced-review acknowledgement are required.');
  }
  const { plan, request } = verifyO09ApiReview(windowDir, expectedWindowSha256);
  const attemptDir = path.join(windowDir, 'attempt');
  fs.mkdirSync(attemptDir, { mode: 0o700 });
  let key;
  let dispatchAttempted = false;
  try {
    record(attemptDir, 'claim.json', jsonBytes({ status: 'claimed', timestamp: new Date().toISOString(), caseId: 'O-09',
      windowSha256: expectedWindowSha256, requestSha256, publicSourceScopeAcknowledged: true, unpricedReviewAcknowledged: true }));
    key = await readProbeCredential(credentialInput);
    dispatchAttempted = true;
    const transport = await postBoundedJson({ endpoint: plan.endpoint, body: request, limits: O09_LIMITS, key, requestImpl });
    record(attemptDir, 'response.bin', transport.rawResponse);
    const { report, ...assessment } = assessO09ApiResponse(transport);
    const { rawResponse, ...transportEvidence } = transport;
    if (report !== undefined) record(attemptDir, 'report.md', Buffer.from(report));
    const result = { ...assessment, caseId: 'O-09', requestSha256, transport: transportEvidence, dispatchAttempted,
      publicSourceScopeAcknowledged: true, sourceTransferAuthorized: true,
      ...(report === undefined ? {} : { reportSha256: sha256(Buffer.from(report)) }) };
    record(attemptDir, 'result.json', jsonBytes(result));
    return result;
  } catch {
    const failure = { status: 'attempt-failed', reason: 'credential-or-local-io-failure', caseId: 'O-09', dispatchAttempted,
      runtimeReady: false, reportAcceptance: 'Not Evaluated', transportAcceptance: 'Not Accepted',
      remoteCompletion: dispatchAttempted ? 'Unknown' : 'Not requested', billing: dispatchAttempted ? 'Unverified' : 'Not requested' };
    record(attemptDir, 'failure.json', jsonBytes(failure));
    return failure;
  } finally { key?.fill(0); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const [command, ...args] = process.argv.slice(2);
    let result;
    if (command === 'prepare' && args.length === 8 && args[0] === '--assembly' && args[2] === '--draft' &&
        args[4] === '--base-url' && args[6] === '--window') {
      result = prepareO09ApiReview({ assemblyDir: args[1], draftFile: args[3], baseUrl: args[5], windowDir: args[7] });
    } else if (command === 'verify' && args.length === 4 && args[0] === '--window' && args[2] === '--window-sha256') {
      result = verifyO09ApiReview(args[1], args[3]).plan;
    } else if (command === 'run' && args.length === 6 && args[0] === '--window' && args[2] === '--window-sha256' &&
        args[4] === '--allow-public-source' && args[5] === '--acknowledge-unpriced-review') {
      if (process.stdin.isTTY) throw new Error('Use hidden local input through a pipe.');
      result = await runO09ApiReview({ windowDir: args[1], expectedWindowSha256: args[3],
        allowPublicSource: true, acknowledgeUnpricedReview: true, credentialInput: process.stdin });
    } else throw new Error('Invalid fixed O-09 command or arguments.');
    console.log(JSON.stringify(result, null, 2));
    if (command === 'run' && result.transportAcceptance !== 'Functional Pass') process.exitCode = 2;
  } catch { console.error('O-09 command rejected; check fixed scope, fresh window, hashes and acknowledgements.'); process.exitCode = 2; }
}
