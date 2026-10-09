#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { validateReviewOutput as validateLegacy } from './legacy/validate-review-output.mjs';
import { validateV060Report } from './review-output-v060.mjs';

export function validateReviewOutput(markdown, mode, options = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options) ||
    Object.keys(options).some((key) => !['profile', 'sourceRoot'].includes(key))) {
    throw new TypeError('Only profile and sourceRoot options are supported.');
  }
  if (options.profile === undefined) {
    if ('sourceRoot' in options) throw new TypeError('sourceRoot requires profile v0.6.0.');
    return validateLegacy(markdown, mode);
  }
  if (options.profile !== 'v0.6.0') throw new TypeError('Only the explicit v0.6.0 profile is supported.');
  return validateV060Report(markdown, mode, options, validateLegacy);
}

function parseArguments(argv) {
  const args = argv[0] === '--' ? argv.slice(1) : argv;
  const options = {};
  let mode, filename;
  const seen = new Set();
  const usage = 'Usage: node scripts/validate-review-output.mjs --mode <quick|deep|fix> [--profile v0.6.0 [--source-root <root>]] <review.md>';
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (['--mode', '--profile', '--source-root'].includes(arg)) {
      const value = args[++index];
      if (!value || value.startsWith('--') || (seen.has(arg) && arg !== '--mode')) throw new Error(usage);
      seen.add(arg);
      if (arg === '--mode') mode = value;
      else options[arg === '--profile' ? 'profile' : 'sourceRoot'] = value;
    } else if (arg.startsWith('--') || filename) throw new Error(usage);
    else filename = arg;
  }
  if (!['quick', 'deep', 'fix'].includes(mode) || !filename) throw new Error(usage);
  if (options.profile !== undefined && options.profile !== 'v0.6.0') throw new Error(usage);
  if ('sourceRoot' in options && options.profile === undefined) throw new Error(usage);
  return { mode, filename, options };
}

function isMain() {
  if (!process.argv[1]) return false;
  if (import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) return true;
  try {
    return import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href;
  } catch {
    // API hosts such as node - need not have a file-backed entry point.
    return false;
  }
}

if (isMain()) {
  try {
    const { mode, filename, options } = parseArguments(process.argv.slice(2));
    const result = validateReviewOutput(fs.readFileSync(path.resolve(filename), 'utf8'), mode, options);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    process.exitCode = result.valid ? 0 : 1;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 2;
  }
}
