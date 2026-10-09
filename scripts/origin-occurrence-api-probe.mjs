#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseOriginOccurrenceResponse } from './origin-occurrence-api.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const jsonBytes = (value) => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
const record = (directory, name, bytes) => fs.writeFileSync(path.join(directory, name), bytes, { flag: 'wx', mode: 0o600 });
const toolPaths = ['scripts/origin-occurrence-api-probe.mjs', 'scripts/origin-occurrence-api.mjs',
  'scripts/assemble-origin-occurrence-pilot.mjs'];
export const PROBE_MARKER = 'FE_API_COMPAT_OK';
export const REPLACEMENT_PROBE_PROFILE = 'background-omitted-v2';
export const PROBE_LIMITS = Object.freeze({ requestBytes: 4096, responseBytes: 262144, headerBytes: 16384,
  wallDeadlineMs: 180000, maxOutputTokens: 4096, requests: 1, retries: 0, credentialBytes: 4096, credentialWaitMs: 60000 });

function isReplacementProfile(profile) {
  if (!['strict-v1', REPLACEMENT_PROBE_PROFILE].includes(profile)) throw new Error('Unknown fixed probe profile.');
  return profile === REPLACEMENT_PROBE_PROFILE;
}

export function sourceFreeProbeBody(profile = 'strict-v1') {
  const replacement = isReplacementProfile(profile);
  const body = {
    model: 'gpt-6-astra', reasoning: { effort: 'xhigh' },
    instructions: 'This is a text-only API compatibility check. Return only the exact marker requested by the user.',
    input: [{ role: 'user', content: [{ type: 'input_text', text: `Return exactly ${PROBE_MARKER}` }] }],
    tools: [], tool_choice: 'none', stream: false, background: false, store: false, truncation: 'disabled',
    max_output_tokens: PROBE_LIMITS.maxOutputTokens,
  };
  if (replacement) delete body.background;
  return jsonBytes(body);
}

function endpointFor(baseUrl) {
  const url = new URL(baseUrl);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash ||
      url.href.replace(/\/$/, '') !== baseUrl.replace(/\/$/, '')) throw new Error('Expected an exact HTTPS base URL.');
  return `${baseUrl.replace(/\/$/, '')}/responses`;
}

function proposal(baseUrl, profile = 'strict-v1') {
  const replacement = isReplacementProfile(profile);
  const body = sourceFreeProbeBody(profile);
  if (body.length > PROBE_LIMITS.requestBytes) throw new Error('Probe body exceeds the request limit.');
  return { version: replacement ? 2 : 1, status: 'offline-source-free-proposal', baseUrl, endpoint: endpointFor(baseUrl),
    ...(replacement ? { profile, acceptancePolicy: 'functional-response-with-unverified-missing-metadata' } : {}),
    routeAdopted: false, executionAuthorized: false, runtimeReady: false, sourceTransferAuthorized: false, modelInvocations: 0,
    sourceScope: 'fixed-public-marker-only', limits: PROBE_LIMITS,
    billing: { priceVerified: false, monetaryCap: null, singleProbeRiskAccepted: false,
      timeoutStopsRemoteBilling: 'Unknown' },
    authentication: 'Bearer via bounded stdin pipe; no config or environment key discovery',
    transport: { method: 'POST', tlsVerification: true, redirects: false, proxyFallback: false, tools: false },
    request: { path: 'request.json', bytes: body.length, sha256: sha256(body) },
    toolHashes: toolPaths.map((file) => ({ path: file, sha256: sha256(fs.readFileSync(path.join(rootDir, file))) })),
  };
}

export function prepareSourceFreeProbe({ baseUrl, windowDir, profile = 'strict-v1' }) {
  const requested = path.resolve(windowDir);
  const destination = path.join(fs.realpathSync(path.dirname(requested)), path.basename(requested));
  const localEvidence = path.join(rootDir, '.local-evaluation');
  if ((destination === rootDir || destination.startsWith(`${rootDir}${path.sep}`)) &&
      !destination.startsWith(`${localEvidence}${path.sep}`)) throw new Error('Use an external or ignored local-evaluation directory.');
  if (fs.lstatSync(destination, { throwIfNoEntry: false })) throw new Error('Window already exists; refusing to overwrite.');
  const plan = proposal(baseUrl, profile);
  fs.mkdirSync(destination, { mode: 0o700 });
  record(destination, 'request.json', sourceFreeProbeBody(profile));
  record(destination, 'window.json', jsonBytes(plan));
  return plan;
}

function readBounded(directory, name, limit) {
  const filename = path.join(directory, name);
  const stat = fs.lstatSync(filename);
  if (!stat.isFile() || stat.size > limit) throw new Error('Expected a bounded regular window file.');
  const bytes = fs.readFileSync(filename);
  if (bytes.length > limit) throw new Error('Window file exceeds its byte limit.');
  return bytes;
}

export function verifySourceFreeProbe(windowDir, expectedWindowSha256) {
  if (!fs.lstatSync(windowDir).isDirectory()) throw new Error('Expected a regular window directory.');
  if (!isDeepStrictEqual(fs.readdirSync(windowDir).sort(), ['request.json', 'window.json'])) {
    throw new Error('Window must be unused and contain only its request and plan.');
  }
  const bytes = readBounded(windowDir, 'window.json', 16384);
  if (!/^[a-f0-9]{64}$/.test(expectedWindowSha256 ?? '') || sha256(bytes) !== expectedWindowSha256) {
    throw new Error('Window hash does not match the independently approved hash.');
  }
  const plan = JSON.parse(bytes.toString('utf8'));
  if (!isDeepStrictEqual(plan, proposal(plan.baseUrl, plan.profile))) throw new Error('Window or tool hashes differ from the current proposal.');
  if (!readBounded(windowDir, 'request.json', PROBE_LIMITS.requestBytes).equals(sourceFreeProbeBody(plan.profile))) {
    throw new Error('Only the fixed source-free request is supported.');
  }
  return plan;
}

export function inspectResponseControls(response, body) {
  const controlEvidence = {};
  // Missing echoes are unknown; explicit contradictions still reject the replacement.
  for (const key of ['model', 'reasoning', 'tools', 'tool_choice', 'stream', 'background', 'store', 'truncation', 'max_output_tokens']) {
    const observed = key === 'reasoning' ? response.reasoning?.effort : response[key];
    const expected = key === 'reasoning' ? body.reasoning.effort : key === 'background' ? false : body[key];
    controlEvidence[key] = observed == null ? { status: 'not-reported' } : {
      status: isDeepStrictEqual(observed, expected) ? 'reported-match' : 'reported-mismatch', value: observed,
    };
  }
  return controlEvidence;
}

function assessReplacementProbe(result, response, body) {
  const controlEvidence = inspectResponseControls(response, body);
  const evidence = { ...result, profile: REPLACEMENT_PROBE_PROFILE, controlEvidence,
    serverSideEnforcement: 'Unverified', modelIdentity: 'Unverified' };
  const mismatch = Object.keys(controlEvidence).find((key) => controlEvidence[key].status === 'reported-mismatch');
  if (mismatch) return { ...evidence, reason: `control-mismatch:${mismatch}` };
  if (response.previous_response_id != null || response.conversation != null) return { ...evidence, reason: 'unexpected-conversation-state' };
  if (result.usage.status === 'reported' && result.usage.value.output_tokens > PROBE_LIMITS.maxOutputTokens) {
    return { ...evidence, reason: 'reported-output-over-budget' };
  }
  return { ...evidence, compatibility: 'Functional Pass',
    verificationLimit: 'Completed marker response only. Missing control echoes or usage stay unverified; no server-side compliance, billing cap or model-identity attestation.' };
}

export function assessSourceFreeProbe(transport, profile = 'strict-v1') {
  const replacement = isReplacementProfile(profile);
  const parsed = parseOriginOccurrenceResponse(transport);
  const { report, ...evidence } = parsed;
  const result = { ...evidence, compatibility: 'Not Accepted', runtimeReady: false,
    sourceTransferAuthorized: false, codexAcceptance: 'Not Evaluated', reportAcceptance: 'Not Evaluated' };
  if (parsed.status !== 'response-text-extracted') return result;
  if (report.trim() !== PROBE_MARKER) return { ...result, reason: 'marker-mismatch' };
  const response = JSON.parse(transport.rawResponse.toString('utf8'));
  const body = JSON.parse(sourceFreeProbeBody(profile).toString('utf8'));
  if (replacement) return assessReplacementProbe(result, response, body);
  for (const key of ['model', 'reasoning', 'tools', 'tool_choice', 'background', 'store', 'truncation', 'max_output_tokens']) {
    if (response[key] === undefined) return { ...result, compatibility: 'Cannot Verify', reason: `missing-control:${key}` };
    const matches = key === 'reasoning' ? response.reasoning?.effort === body.reasoning.effort : isDeepStrictEqual(response[key], body[key]);
    if (!matches) return { ...result, reason: `control-mismatch:${key}` };
  }
  if (response.previous_response_id != null || response.conversation != null) return { ...result, reason: 'unexpected-conversation-state' };
  if (parsed.usage.status !== 'reported') return { ...result, compatibility: 'Cannot Verify', reason: 'usage-unavailable' };
  if (parsed.usage.value.output_tokens > PROBE_LIMITS.maxOutputTokens) return { ...result, reason: 'reported-output-over-budget' };
  return { ...result, compatibility: 'Observable Pass',
    verificationLimit: 'Response shape, marker and provider-reported controls only; no server-side compliance or model-identity attestation.' };
}

function validKey(key) {
  return Buffer.isBuffer(key) && key.length > 0 && key.length <= PROBE_LIMITS.credentialBytes &&
    /^[\x21-\x7e]+$/.test(key.toString('utf8'));
}

export function postSourceFreeProbe({ baseUrl, key, profile = 'strict-v1', requestImpl = https.request }) {
  return postBoundedJson({ endpoint: endpointFor(baseUrl), body: sourceFreeProbeBody(profile),
    limits: PROBE_LIMITS, key, requestImpl });
}

// Both fixed runners verify their frozen body before this shared one-request transport.
export function postBoundedJson({ endpoint, body, limits, key, requestImpl = https.request }) {
  const url = new URL(endpoint);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.href !== endpoint) {
    throw new Error('Expected an exact HTTPS endpoint.');
  }
  if (['requestBytes', 'responseBytes', 'headerBytes', 'wallDeadlineMs'].some((field) =>
    !Number.isSafeInteger(limits?.[field]) || limits[field] <= 0 || limits[field] > 2147483647)) {
    throw new Error('Expected bounded positive transport limits.');
  }
  if (!Buffer.isBuffer(body) || body.length === 0 || body.length > limits.requestBytes) throw new Error('Invalid bounded request body.');
  if (!validKey(key)) throw new Error('Expected a bounded nonempty credential without whitespace.');
  return new Promise((resolve) => {
    const start = performance.now();
    let request;
    let response;
    let settled = false;
    let httpStatus = null;
    const chunks = [];
    let size = 0;
    const finish = (transportError = null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      request?.destroy();
      response?.destroy();
      resolve({ rawResponse: Buffer.concat(chunks), httpStatus, transportError,
        elapsedMs: Math.round(performance.now() - start), retainedBytes: size,
        remoteCompletion: transportError ? 'Unknown' : 'Response received', billing: 'Unverified' });
    };
    const timer = setTimeout(() => finish('wall-deadline'), limits.wallDeadlineMs);
    try {
      request = requestImpl(endpoint, { method: 'POST', agent: false, rejectUnauthorized: true,
        maxHeaderSize: limits.headerBytes,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'Accept-Encoding': 'identity',
          'Content-Length': body.length, Authorization: `Bearer ${key.toString('utf8')}` } }, (incoming) => {
        response = incoming;
        response.on('error', () => finish('response-error'));
        if (settled) { response.destroy(); return; }
        httpStatus = response.statusCode;
        if (httpStatus >= 300 && httpStatus < 400) { finish('redirect-rejected'); return; }
        if (response.headers['content-encoding'] && response.headers['content-encoding'] !== 'identity') {
          finish('unsupported-content-encoding'); return;
        }
        if (!/^application\/json(?:\s*;|$)/i.test(response.headers['content-type'] ?? '')) {
          finish('unsupported-content-type'); return;
        }
        response.on('data', (chunk) => {
          if (settled) return;
          const bytes = Buffer.from(chunk);
          if (size + bytes.length > limits.responseBytes) { finish('response-byte-limit'); return; }
          chunks.push(bytes); size += bytes.length;
        });
        response.on('aborted', () => finish('response-aborted'));
        response.on('end', () => finish(response.complete ? null : 'response-incomplete'));
        response.on('close', () => { if (!settled) finish('response-closed-early'); });
      });
      request.on('error', () => finish('request-error'));
      request.end(body);
    } catch { finish('request-setup-error'); }
  });
}

export function readProbeCredential(input) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    const finish = (error) => {
      clearTimeout(timer);
      input.pause();
      input.off('data', onData); input.off('end', onEnd); input.off('error', onError);
      const key = Buffer.concat(chunks);
      for (const chunk of chunks) chunk.fill(0);
      if (error || !validKey(key)) { key.fill(0); reject(new Error(error ?? 'Invalid credential input.')); }
      else resolve(key);
    };
    const onData = (chunk) => {
      const bytes = Buffer.from(chunk);
      size += bytes.length;
      if (size > PROBE_LIMITS.credentialBytes) { bytes.fill(0); finish('Credential exceeds byte limit.'); }
      else chunks.push(bytes);
    };
    const onEnd = () => finish();
    const onError = () => finish('Credential input failed.');
    const timer = setTimeout(() => finish('Credential input timed out.'), PROBE_LIMITS.credentialWaitMs);
    input.on('data', onData); input.once('end', onEnd); input.once('error', onError);
  });
}

export async function runSourceFreeProbe({ windowDir, expectedWindowSha256, acknowledgeUnpricedProbe = false, credentialInput, requestImpl = https.request }) {
  if (acknowledgeUnpricedProbe !== true) throw new Error('Explicit acceptance of one unpriced probe is required.');
  const plan = verifySourceFreeProbe(windowDir, expectedWindowSha256);
  // Exclusive directory creation consumes this window even if credential input or transport fails.
  const attemptDir = path.join(windowDir, 'attempt');
  fs.mkdirSync(attemptDir, { mode: 0o700 });
  let key;
  let dispatchAttempted = false;
  try {
    record(attemptDir, 'claim.json', jsonBytes({ status: 'claimed', timestamp: new Date().toISOString(),
      ...(plan.profile ? { profile: plan.profile } : {}),
      requestSha256: plan.request.sha256, windowSha256: expectedWindowSha256, singleProbeRiskAcknowledged: true }));
    key = await readProbeCredential(credentialInput);
    dispatchAttempted = true;
    const transport = await postSourceFreeProbe({ baseUrl: plan.baseUrl, key, profile: plan.profile, requestImpl });
    record(attemptDir, 'response.bin', transport.rawResponse);
    const { rawResponse, ...transportEvidence } = transport;
    const result = { ...assessSourceFreeProbe(transport, plan.profile), transport: transportEvidence, dispatchAttempted,
      ...(plan.profile ? { profile: plan.profile } : {}),
      requestSha256: plan.request.sha256 };
    record(attemptDir, 'result.json', jsonBytes(result));
    return result;
  } catch {
    const result = { status: 'attempt-failed', reason: 'credential-or-local-io-failure', dispatchAttempted,
      runtimeReady: false, sourceTransferAuthorized: false, compatibility: 'Not Accepted',
      remoteCompletion: dispatchAttempted ? 'Unknown' : 'Not requested', billing: dispatchAttempted ? 'Unverified' : 'Not requested' };
    record(attemptDir, 'failure.json', jsonBytes(result));
    return result;
  } finally { key?.fill(0); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const [command, ...args] = process.argv.slice(2);
    let result;
    if (command === 'prepare' && (args.length === 4 || args.length === 6) && args[0] === '--base-url' && args[2] === '--window' &&
        (args.length === 4 || args[4] === '--profile')) {
      result = prepareSourceFreeProbe({ baseUrl: args[1], windowDir: args[3], profile: args[5] });
    } else if (command === 'run' && args.length === 5 && args[0] === '--window' && args[2] === '--window-sha256' && args[4] === '--acknowledge-unpriced-probe') {
      if (process.stdin.isTTY) throw new Error('Use a hidden local prompt and stdin pipe, not an echoed terminal input.');
      result = await runSourceFreeProbe({ windowDir: args[1], expectedWindowSha256: args[3], acknowledgeUnpricedProbe: true, credentialInput: process.stdin });
    } else throw new Error('Usage: origin-occurrence-api-probe.mjs prepare --base-url <https-base> --window <new-dir> [--profile background-omitted-v2] | run --window <dir> --window-sha256 <approved-hash> --acknowledge-unpriced-probe');
    console.log(JSON.stringify(result, null, 2));
    if (command === 'run' && !['Observable Pass', 'Functional Pass'].includes(result.compatibility)) process.exitCode = 2;
  } catch { console.error('Probe command rejected; check arguments, fresh window and frozen hashes.'); process.exitCode = 2; }
}
