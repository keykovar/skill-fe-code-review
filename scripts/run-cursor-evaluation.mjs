import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

function parseArguments(argv) {
  const normalized = argv[0] === '--' ? argv.slice(1) : argv;
  const options = {};

  for (let index = 0; index < normalized.length; index += 2) {
    const name = normalized[index];
    const value = normalized[index + 1];
    if (!name?.startsWith('--') || value === undefined) {
      throw new Error(`Expected --name value pairs; received ${name ?? '<end>'}.`);
    }
    if (Object.hasOwn(options, name)) {
      throw new Error(`Duplicate option: ${name}`);
    }
    options[name] = value;
  }

  const required = [
    '--executable',
    '--expected-prompt-sha256',
    '--home',
    '--prompt-file',
    '--stderr-output',
    '--trace-output',
    '--workspace',
  ];
  for (const name of required) {
    if (!options[name]) {
      throw new Error(`Missing required option: ${name}`);
    }
  }

  const unknown = Object.keys(options).filter((name) => !required.includes(name));
  if (unknown.length > 0) {
    throw new Error(`Unknown option: ${unknown[0]}`);
  }

  return options;
}

function requireAbsolutePath(value, name) {
  if (!path.isAbsolute(value)) {
    throw new Error(`${name} must be an absolute path.`);
  }
  return path.resolve(value);
}

function isInside(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..');
}

function requireExistingDirectory(value, name) {
  const resolved = requireAbsolutePath(value, name);
  if (!fs.statSync(resolved).isDirectory()) {
    throw new Error(`${name} must be a directory.`);
  }
  return fs.realpathSync(resolved);
}

function requireExistingFile(value, name) {
  const resolved = requireAbsolutePath(value, name);
  if (!fs.statSync(resolved).isFile()) {
    throw new Error(`${name} must be a file.`);
  }
  return fs.realpathSync(resolved);
}

function requireFreshOutput(value, name, workspace) {
  const resolved = requireAbsolutePath(value, name);
  if (fs.existsSync(resolved)) {
    throw new Error(`${name} must not already exist.`);
  }
  const parent = fs.realpathSync(path.dirname(resolved));
  const output = path.join(parent, path.basename(resolved));
  if (isInside(workspace, output)) {
    throw new Error(`${name} must stay outside the reviewed workspace.`);
  }
  return output;
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function runCursorEvaluation(argv, environment = process.env) {
  const options = parseArguments(argv);
  const executable = requireExistingFile(options['--executable'], '--executable');
  const workspace = requireExistingDirectory(options['--workspace'], '--workspace');
  const home = requireExistingDirectory(options['--home'], '--home');
  const promptFile = requireExistingFile(options['--prompt-file'], '--prompt-file');

  if (isInside(workspace, promptFile)) {
    throw new Error('--prompt-file must stay outside the reviewed workspace.');
  }
  if (isInside(workspace, home)) {
    throw new Error('--home must stay outside the reviewed workspace.');
  }

  const traceOutput = requireFreshOutput(options['--trace-output'], '--trace-output', workspace);
  const stderrOutput = requireFreshOutput(
    options['--stderr-output'],
    '--stderr-output',
    workspace,
  );
  if (traceOutput === stderrOutput) {
    throw new Error('--trace-output and --stderr-output must be different files.');
  }

  const prompt = fs.readFileSync(promptFile, 'utf8');
  if (prompt.length === 0) {
    throw new Error('--prompt-file must not be empty.');
  }

  const expectedPromptSha256 = options['--expected-prompt-sha256'];
  if (!/^[a-f0-9]{64}$/u.test(expectedPromptSha256)) {
    throw new Error('--expected-prompt-sha256 must be a lowercase SHA-256 value.');
  }
  const promptSha256 = sha256(prompt);
  if (promptSha256 !== expectedPromptSha256) {
    throw new Error(
      `Prompt SHA-256 mismatch: expected ${expectedPromptSha256}, received ${promptSha256}.`,
    );
  }

  const clientArguments = [
    '--print',
    '--output-format',
    'stream-json',
    '--auto-review',
    '--sandbox',
    'enabled',
    '--trust',
    '--workspace',
    workspace,
    prompt,
  ];
  const result = spawnSync(executable, clientArguments, {
    cwd: workspace,
    encoding: 'utf8',
    env: {
      ...environment,
      AGENT_CLI_CREDENTIAL_STORE: 'file',
      HOME: home,
    },
    maxBuffer: 64 * 1024 * 1024,
    shell: false,
    timeout: 15 * 60 * 1000,
  });

  fs.writeFileSync(traceOutput, result.stdout ?? '', { flag: 'wx' });
  fs.writeFileSync(stderrOutput, result.stderr ?? '', { flag: 'wx' });

  if (result.error) {
    throw result.error;
  }

  return {
    clientArgumentsBeforePrompt: clientArguments.slice(0, -1),
    exitCode: result.status,
    promptCharacters: prompt.length,
    promptSha256,
    signal: result.signal,
    stderrBytes: Buffer.byteLength(result.stderr ?? ''),
    stderrOutput,
    traceBytes: Buffer.byteLength(result.stdout ?? ''),
    traceOutput,
    timeoutSeconds: 15 * 60,
  };
}

function main() {
  try {
    const summary = runCursorEvaluation(process.argv.slice(2));
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
    process.exitCode = summary.exitCode ?? 1;
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main();
}
