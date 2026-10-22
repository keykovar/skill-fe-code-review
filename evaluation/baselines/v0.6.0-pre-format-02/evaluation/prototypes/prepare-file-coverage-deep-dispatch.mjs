import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyFileCoverageLedgerDeep } from './prepare-file-coverage-ledger-deep.mjs';

const recipe = fileURLToPath(import.meta.url);
const repository = fileURLToPath(new URL('../../', import.meta.url));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => Buffer.from(JSON.stringify(value, null, 2) + '\n');
const within = (root, filename) => filename === root || filename.startsWith(root + path.sep);
const overlaps = (left, right) => within(left, right) || within(right, left);
const record = (root, name, bytes) => fs.writeFileSync(path.join(root, name), bytes, { flag: 'wx', mode: 0o600 });

// Parse TOML in the standard library; only non-secret route fields leave the process.
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

function readRoute(configPath, python, expected) {
  if (!path.isAbsolute(configPath)) throw new Error('Absolute config path required.');
  const configStat = fs.statSync(configPath);
  if (!configStat.isFile() || configStat.size > 1024 * 1024) throw new Error('Bounded config file required.');
  const result = spawnSync(python, ['-I', '-c', routeReader, configPath], {
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
  if (!expected || Object.keys(expected).sort().join(',') !== 'baseUrl,provider,wireApi' ||
      ['provider', 'baseUrl', 'wireApi'].some(key => route[key] !== expected[key])) {
    throw new Error('Current selected route differs from the expected provider route.');
  }
  return route;
}

function checkOutput(output, spec) {
  const canonical = path.join(fs.realpathSync(path.dirname(output)), path.basename(output));
  const localEvidence = path.join(fs.realpathSync(repository), '.local-evaluation');
  if (within(fs.realpathSync(repository), canonical) && !within(localEvidence, canonical)) {
    throw new Error('Use an external or ignored local-evaluation output directory.');
  }
  const protectedRoots = [spec.materials, spec.options.previousMaterials, spec.options.candidateBundle,
    path.join(repository, 'skills'), path.dirname(spec.configPath)].map(root => fs.realpathSync(root));
  if (protectedRoots.some(root => overlaps(root, canonical))) throw new Error('Dispatch output overlaps frozen materials, Skill or configuration.');
  if (fs.existsSync(output) && !fs.lstatSync(output).isDirectory()) throw new Error('Regular dispatch directory required.');
  return canonical;
}

function build(spec) {
  const verification = verifyFileCoverageLedgerDeep(spec.materials, spec.freezeSha256, spec.options);
  const freeze = JSON.parse(readRegular(path.join(spec.materials, 'control/freeze.json')));
  const run = freeze.runs.find(item => item.variant === 'candidate');
  assert.equal(run.caseId, 'FC-D-001');
  assert.equal(run.mode, 'deep');
  assert.equal(run.calls.length, 19);
  assert.equal(run.filePins.length, 11);
  const promptBytes = readRegular(path.join(spec.materials, run.dispatchPath));
  const prompt = promptBytes.toString('utf8');
  assert.ok(Buffer.from(prompt).equals(promptBytes), 'Dispatch must be exact UTF-8.');
  const route = readRoute(spec.configPath, spec.python, spec.expectedRoute);
  const request = {
    prompt, target: { type: 'projectless' }, model: 'gpt-6-astra', thinking: 'xhigh',
    title: 'Candidate dedup Deep Review FC-D-001',
  };
  return { request, route, verification, promptSha256: hash(promptBytes), promptBytes: promptBytes.length };
}

export function prepareFileCoverageDeepDispatch({ output: requestedOutput, materials, freezeSha256, options,
  configPath, expectedRoute, python = 'python3' }) {
  const spec = { materials: fs.realpathSync(materials), freezeSha256, options, configPath, expectedRoute, python };
  const output = checkOutput(path.resolve(requestedOutput), spec);
  if (fs.lstatSync(output, { throwIfNoEntry: false })) throw new Error('Dispatch output already exists; do not overwrite or reuse.');
  const built = build(spec);
  const requestBytes = json(built.request);
  const manifest = {
    kind: 'offline-file-coverage-deep-dispatch', status: 'Prepared - Not Run',
    executionAuthorized: false, modelInvocations: 0, sourceTransmitted: false,
    runtimeReady: false, output, resultsDirectory: path.join(output, 'results'), spec,
    route: built.route, recipeSha256: hash(readRegular(recipe)),
    requestSha256: hash(requestBytes), promptSha256: built.promptSha256, promptBytes: built.promptBytes,
    expectedCalls: 19, evidenceFiles: 9,
    limits: ['This is local configuration evidence, not attestation of the Desktop route or upstream model.',
      'Explicit creation authorization is required before claiming and sending the returned request.',
      'No model dispatch is performed here. Prompt/OS isolation and automatic cancellation are not provided.'],
  };
  const manifestBytes = json(manifest);
  fs.mkdirSync(output, { mode: 0o700 });
  record(output, 'request.json', requestBytes);
  record(output, 'preflight.json', manifestBytes);
  return { output, preflightSha256: hash(manifestBytes), ...built };
}

export function verifyFileCoverageDeepDispatch(output, expectedDigest) {
  if (!fs.lstatSync(output).isDirectory()) throw new Error('Regular dispatch directory required.');
  const manifestBytes = readRegular(path.join(output, 'preflight.json'));
  digestMatches(manifestBytes, expectedDigest);
  const manifest = JSON.parse(manifestBytes);
  assert.equal(manifest.kind, 'offline-file-coverage-deep-dispatch');
  assert.equal(manifest.output, checkOutput(path.resolve(output), manifest.spec));
  assert.deepEqual(fs.readdirSync(output).sort(), ['preflight.json', 'request.json'], 'Dispatch already claimed or contains unexpected results.');
  digestMatches(readRegular(recipe), manifest.recipeSha256);
  const built = build(manifest.spec);
  assert.deepEqual(built.route, manifest.route, 'Selected route/configuration changed since preparation.');
  assert.equal(built.promptSha256, manifest.promptSha256);
  const requestBytes = readRegular(path.join(output, 'request.json'));
  digestMatches(requestBytes, manifest.requestSha256);
  assert.ok(requestBytes.equals(json(built.request)), 'Only the exact frozen task request is supported.');
  return { request: built.request, route: built.route, expectedCalls: 19, resultsDirectory: manifest.resultsDirectory };
}

export function claimFileCoverageDeepDispatch(output, expectedDigest) {
  const verified = verifyFileCoverageDeepDispatch(output, expectedDigest);
  // Reserve before dispatch; even a failed create call must retain the consumed attempt.
  record(output, 'dispatch-claimed.json', json({ status: 'Claimed - dispatch outcome not recorded',
    preflightSha256: expectedDigest, claimedAt: new Date().toISOString(), modelInvocations: 'Unknown until tool result' }));
  return verified.request;
}
