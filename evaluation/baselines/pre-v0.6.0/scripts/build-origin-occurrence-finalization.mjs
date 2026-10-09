#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const base = 'evaluation/prototypes/origin-occurrence';
const parent = `${base}/integration-11`;
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const read = (filename) => fs.readFileSync(path.join(root, filename), 'utf8');

function replaceOnce(text, before, after) {
  if (text.split(before).length !== 2) throw new Error(`Expected one finalization anchor: ${before.slice(0, 70)}`);
  return text.replace(before, after);
}

export function buildOriginOccurrenceFinalization(outputDirectory) {
  const output = path.resolve(outputDirectory);
  if (fs.existsSync(output)) throw new Error('Candidate output must be a new directory.');
  const inputs = [];
  const pinned = (filename, expected) => {
    const value = read(filename);
    const hash = sha256(value);
    if (expected && hash !== expected) throw new Error(`Frozen input changed: ${filename}`);
    inputs.push({ path: filename, sha256: hash });
    return value;
  };
  const manifest = JSON.parse(pinned(`${parent}/manifest.json`));
  for (const pin of manifest.inputs) pinned(pin.path, pin.sha256);
  const outputs = [];
  for (const pin of manifest.outputs) {
    const original = pinned(`${parent}/${pin.path}`, pin.sha256);
    if (!pin.path.startsWith('skill/')) continue;
    let text = original;
    if (pin.path.endsWith('/SKILL.md')) {
      text = replaceOnce(text, '7. Trace affected callers, consumers, events, API contracts, storage, cache, and runtime data shapes.',
        '7. Trace affected callers, consumers, events, API contracts, storage, cache, and runtime data shapes. For interacting conditions in the affected path, establish the supported combinations from the visible contract, then compare each combination\'s before/after observable outcome and direct caller return or state propagation, including outcomes that should remain unchanged. Group combinations only when the same evidence proves the same outcome for every named member; a data-source comparison or future test plan is not an outcome comparison. Mark unavailable evidence explicitly. Stay within the selected mode: no unrelated condition cross-product, extra runtime execution, fixed Coverage row count, or Coverage ledger in Fix Review.');
      text = replaceOnce(text, 'Render Quick/Deep Finding headers as',
        'An empty severity section contains only `无明确问题。` or `No clear issue.`, either plain text or one top-level Markdown bullet. Do not combine that marker with a finding, metadata, another marker or explanatory content. This marker cannot replace a previous finding in Fix Issue Verification.\n\nRender Quick/Deep Finding headers as');
      text = replaceOnce(text,
        '- The final recommendation must restate the same decision and the same prerequisites as the conclusion. Do not introduce a new `before submit`, `before merge`, or `before next step` condition only in the final section. If the final evidence requires a stricter decision, update the conclusion to match.',
        '- Before writing the conclusion, form one internal decision record: the selected recommendation and the exact required repair/verification prerequisites, each tied to its finding or evidence gap. Render that same prerequisite set explicitly in both the conclusion and final recommendation (or state that there is none). Keep optional follow-ups outside that set. Before sending, compare the two rendered sets in both directions; a matching decision label or the phrase "same prerequisites" is not enough. If either section adds, drops or changes a condition, reconcile both against the evidence. Do not add a new gate merely to fill the template or treat every Not Run item as mandatory.');
    } else if (pin.path.endsWith('/references/deep-review.md')) {
      text = replaceOnce(text, 'Complete the repeated-ID ledger check in `SKILL.md` before responding.',
        'Complete the repeated-ID ledger check in `SKILL.md` before responding. Use the shared supported-combination check to put explicit before/after outcomes, including preserved outcomes and caller propagation, in Change Map or Coverage. Reference them across sections rather than repeating the same analysis; planned tests do not establish those comparisons.');
      text = replaceOnce(text, '风险等级：低 / 中 / 高\n', '风险等级：低 / 中 / 高\n进入下一步的前置条件：<同一组必要修复与验证条件；没有则写无；最终建议须逐项一致>\n');
      text = replaceOnce(text, 'The change map must include the baseline, before behavior, after behavior, preserved invariants, and missing or removed behavior.',
        'The change map must include the baseline, before behavior, after behavior, preserved invariants, and missing or removed behavior. State the same explicit next-step prerequisites in Overall Conclusion and Final Recommendation; use none when no prerequisite exists.');
    }
    outputs.push({ path: pin.path, text, sha256: sha256(text), bytes: Buffer.byteLength(text),
      beforeSha256: pin.sha256, byteDelta: Buffer.byteLength(text) - Buffer.byteLength(original) });
  }
  const examples = JSON.parse(pinned(`${base}/integration-11-example-corrections-01/manifest.json`));
  for (const example of examples.examples) pinned(example.path, example.sha256);
  for (const filename of [`${base}/integration-12-finalization-cases.md`, 'scripts/build-origin-occurrence-finalization.mjs',
    'scripts/validate-origin-occurrence-empty-sections.mjs', 'tests/origin-occurrence-finalization.test.ts']) pinned(filename);
  const result = {
    revision: 'integration-12', parent: `${parent}/manifest.json`, status: 'offline-candidate-only',
    runtimeReady: false, modelInvocations: 0, skillDirectory: 'skill/fe-code-review',
    entry: { module: 'scripts/validate-origin-occurrence-empty-sections.mjs', export: 'validateOriginOccurrenceEmptySections' },
    exampleSelection: `${base}/integration-11-example-corrections-01/manifest.json`,
    inputs, outputs: outputs.map(({ text, ...pin }) => pin),
    changes: ['Strict standalone empty-severity markers', 'Supported affected combinations and caller outcomes',
      'One explicit repair/verification prerequisite set in conclusion and ending'],
    limitations: ['Offline checks and authored examples are not model behavior evidence.',
      'The integration-11 O-05 report remains No-Go for two independent semantic failures.',
      'Public-profile promotion must consolidate candidate implementations; historical entries stay frozen.',
      'Stable/installed Skill, public CLI, package version, original reports and oracles are unchanged.'],
  };
  fs.mkdirSync(output, { recursive: true });
  for (const item of outputs) {
    const target = path.join(output, item.path);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, item.text, { flag: 'wx' });
  }
  fs.writeFileSync(path.join(output, 'manifest.json'), `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' });
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const [flag, output, ...extra] = process.argv.slice(2);
    if (flag !== '--output' || !output || extra.length) throw new Error('Usage: node scripts/build-origin-occurrence-finalization.mjs --output <new-directory>');
    const result = buildOriginOccurrenceFinalization(output);
    process.stdout.write(`${JSON.stringify({ revision: result.revision, outputs: result.outputs.length,
      changes: result.outputs.filter((pin) => pin.byteDelta).map(({ path, byteDelta }) => ({ path, byteDelta })) }, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
