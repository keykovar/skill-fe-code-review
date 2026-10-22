import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyLedgerFormatDeepFindings } from './prepare-ledger-format-deep-findings.mjs';

// Historical dispatch recipes are frozen; this entry only handles LF-D-002.
const recipe = fileURLToPath(import.meta.url);
const repository = fileURLToPath(new URL('../../', import.meta.url));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => Buffer.from(JSON.stringify(value, null, 2) + '\n');
const within = (root, filename) => filename === root || filename.startsWith(root + path.sep);
const overlaps = (left, right) => within(left, right) || within(right, left);
const record = (root, name, bytes) => fs.writeFileSync(path.join(root, name), bytes, { flag: 'wx', mode: 0o600 });

// Only allowlisted, non-secret route fields leave the TOML reader.
const routeReader = `import json, sys, tomllib
try:
    with open(sys.argv[1], 'rb') as source:
        config = tomllib.load(source)
    if config.get('profile'):
        raise ValueError('Active profile is unsupported')
    provider = config['model_provider']
    selected = config['model_providers'][provider]
    print(json.dumps({'provider': provider, 'baseUrl': selected['base_url'], 'wireApi': selected['wire_api'],
        'configuredModel': config.get('model'), 'configuredEffort': config.get('model_reasoning_effort')}))
except Exception:
    sys.exit(1)
`;

function readRegular(filename) {
  const stat = fs.lstatSync(filename);
  if (!stat.isFile() || stat.size > 1024 * 1024) throw new Error('Bounded regular dispatch file required.');
  return fs.readFileSync(filename);
}

function digestMatches(bytes, expected) {
  if (!/^[a-f0-9]{64}$/u.test(expected ?? '') || hash(bytes) !== expected) throw new Error('Independent dispatch digest missing or changed.');
}

function readRoute(spec) {
  const result = spawnSync(spec.python, ['-I', '-c', routeReader, spec.configPath], {
    encoding: 'utf8', timeout: 10000, maxBuffer: 16384,
  });
  if (result.status !== 0 || result.error) throw new Error('Cannot verify selected route; Python 3.11+ and an explicit unprofiled provider config are required.');
  const route = JSON.parse(result.stdout);
  for (const key of ['provider', 'baseUrl', 'wireApi']) {
    if (typeof route[key] !== 'string' || !route[key]) throw new Error('Incomplete selected route.');
  }
  for (const key of ['configuredModel', 'configuredEffort']) {
    if (route[key] !== null && typeof route[key] !== 'string') throw new Error('Invalid configured model metadata.');
  }
  let url;
  try { url = new URL(route.baseUrl); }
  catch { throw new Error('Invalid provider base URL.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error('Expected a credential-free HTTPS provider base URL.');
  if (route.wireApi !== 'responses') throw new Error('Expected the responses wire API.');
  if (!spec.expectedRoute || Object.keys(spec.expectedRoute).sort().join(',') !== 'baseUrl,provider,wireApi' ||
      ['provider', 'baseUrl', 'wireApi'].some(key => route[key] !== spec.expectedRoute[key])) {
    throw new Error('Current selected route differs from the expected provider route.');
  }
  return route;
}

function checkOutput(output, spec) {
  assert.ok(path.isAbsolute(spec.configPath), 'Absolute config path required.');
  const stat = fs.statSync(spec.configPath);
  assert.ok(stat.isFile() && stat.size <= 1024 * 1024, 'Bounded config file required.');
  const canonical = path.join(fs.realpathSync(path.dirname(output)), path.basename(output));
  const repo = fs.realpathSync(repository);
  if (within(repo, canonical) && !within(path.join(repo, '.local-evaluation'), canonical)) {
    throw new Error('Use an external or ignored local-evaluation output directory.');
  }
  const protectedRoots = [spec.materials, spec.candidateBundle, path.join(repo, 'skills'),
    path.dirname(spec.configPath), path.dirname(fs.realpathSync(spec.configPath))].map(root => fs.realpathSync(root));
  if (protectedRoots.some(root => overlaps(root, canonical))) throw new Error('Dispatch output overlaps frozen materials, Skill or configuration.');
  const existing = fs.lstatSync(output, { throwIfNoEntry: false });
  if (existing && !existing.isDirectory()) throw new Error('Regular dispatch directory required.');
  return canonical;
}

function build(spec) {
  const verification = verifyLedgerFormatDeepFindings(spec.materials, spec.freezeSha256, spec.candidateBundle);
  const freeze = JSON.parse(readRegular(path.join(spec.materials, 'control/freeze.json')));
  const plan = JSON.parse(readRegular(path.join(spec.materials, 'control/plan.json')));
  assert.equal(freeze.run.caseId, 'LF-D-002');
  assert.equal(freeze.run.mode, 'deep');
  assert.equal(freeze.run.calls.length, 4);
  assert.equal(freeze.run.evidenceFiles, 9);
  assert.equal(freeze.run.launchPath, 'control/launch.md');
  assert.equal(plan.maxAttempts, 1);
  assert.equal(plan.maxSourceBearingRuns, 1);
  assert.equal(plan.automaticRetry, false);
  const promptBytes = readRegular(path.join(spec.materials, freeze.run.launchPath));
  const prompt = promptBytes.toString('utf8');
  assert.ok(Buffer.from(prompt).equals(promptBytes), 'Dispatch must be exact UTF-8.');
  const request = { prompt, target: { type: 'projectless' }, model: 'gpt-6-astra', thinking: 'xhigh',
    title: 'LF-D-002 format-only Deep Review' };
  return { request, route: readRoute(spec), verification, promptSha256: hash(promptBytes),
    promptBytes: promptBytes.length, totalDeliveredContentBytes: freeze.run.totalDeliveredContentBytes };
}

export function prepareLedgerFormatDeepFindingsDispatch({ output: requestedOutput, materials, freezeSha256,
  candidateBundle, configPath, expectedRoute, python = 'python3' }) {
  const spec = { materials: fs.realpathSync(materials), freezeSha256, candidateBundle: fs.realpathSync(candidateBundle),
    configPath, expectedRoute, python };
  const output = checkOutput(path.resolve(requestedOutput), spec);
  if (fs.lstatSync(output, { throwIfNoEntry: false })) throw new Error('Dispatch output already exists; do not overwrite or reuse.');
  const built = build(spec);
  const requestBytes = json(built.request);
  const preflight = {
    kind: 'offline-ledger-format-deep-findings-dispatch', status: 'Prepared - Unclaimed - Not Run',
    executionAuthorized: false, modelInvocations: 0, sourceTransmitted: false, runtimeReady: false,
    output, resultsDirectory: path.join(output, 'results'), spec, route: built.route,
    recipeSha256: hash(readRegular(recipe)), requestSha256: hash(requestBytes),
    promptSha256: built.promptSha256, promptBytes: built.promptBytes,
    totalDeliveredContentBytes: built.totalDeliveredContentBytes, expectedCalls: 4, evidenceFiles: 9,
    limits: ['Local configuration evidence does not attest the actual Desktop route or upstream model.',
      'Explicit one-task creation authorization is required before claiming and sending the request.',
      'This helper makes no model call and provides no OS isolation or automatic cancellation.',
      'A consumed claim stays consumed even if task creation fails; no automatic retry.'],
  };
  const preflightBytes = json(preflight);
  fs.mkdirSync(output, { mode: 0o700 });
  record(output, 'request.json', requestBytes);
  record(output, 'preflight.json', preflightBytes);
  return { output, preflightSha256: hash(preflightBytes), ...built };
}

export function verifyLedgerFormatDeepFindingsDispatch(output, expectedDigest) {
  assert.ok(fs.lstatSync(output).isDirectory(), 'Regular dispatch directory required.');
  const bytes = readRegular(path.join(output, 'preflight.json'));
  digestMatches(bytes, expectedDigest);
  const preflight = JSON.parse(bytes);
  assert.equal(preflight.kind, 'offline-ledger-format-deep-findings-dispatch');
  assert.equal(preflight.output, checkOutput(path.resolve(output), preflight.spec));
  assert.deepEqual(fs.readdirSync(output).sort(), ['preflight.json', 'request.json'], 'Dispatch already claimed or contains unexpected results.');
  digestMatches(readRegular(recipe), preflight.recipeSha256);
  const built = build(preflight.spec);
  assert.deepEqual(built.route, preflight.route, 'Selected route/configuration changed since preparation.');
  assert.equal(built.promptSha256, preflight.promptSha256);
  const requestBytes = readRegular(path.join(output, 'request.json'));
  digestMatches(requestBytes, preflight.requestSha256);
  assert.ok(requestBytes.equals(json(built.request)), 'Only the exact frozen task request is supported.');
  return { request: built.request, route: built.route, expectedCalls: 4,
    resultsDirectory: preflight.resultsDirectory, totalDeliveredContentBytes: built.totalDeliveredContentBytes };
}

export function claimLedgerFormatDeepFindingsDispatch(output, expectedDigest) {
  const verified = verifyLedgerFormatDeepFindingsDispatch(output, expectedDigest);
  // Reserve before dispatch, retaining the attempt even if creation later fails.
  record(output, 'dispatch-claimed.json', json({ status: 'Claimed - dispatch outcome not recorded',
    preflightSha256: expectedDigest, claimedAt: new Date().toISOString(), modelInvocations: 'Unknown until tool result' }));
  return verified.request;
}
