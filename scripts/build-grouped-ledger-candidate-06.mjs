#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { buildGroupedLedgerCandidate } from './build-grouped-ledger-candidate.mjs';

export const candidate06Instruction =
  'Render these prefixes literally, without bold, italics, or code wrappers: ledger groups start `- [F-NNN]`, `- Behavior Preserving`, or `- Cannot Verify`; Finding rows start `- [F-NNN] [file:line]`.';
const expectedCandidate06 = {
  skill: 'a7145a6d305647c32ed47873b1284575152ff12c7ab61002cea108672dedfae1',
  skillTree: '49fd77c07ccb214b4fe464b5019888ac496ca59fd52ba3c04cf8390e8627211d',
};

const insertionPoint =
  '6. Scan rendered Finding headers in body order. If they are not exactly `F-001` through `F-NNN`, renumber every header and reference before responding. Emit no placeholder ID; Fix Review preserves supplied IDs.\n\nRender Quick/Deep Finding headers';

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function countEnglishWords(value) {
  return value.match(/[A-Za-z]+(?:[-'][A-Za-z]+)*/gu)?.length ?? 0;
}

function listFiles(directory, relative = '') {
  const files = [];
  for (const entry of fs.readdirSync(path.join(directory, relative), { withFileTypes: true })) {
    const child = path.join(relative, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(directory, child));
    } else if (entry.isFile()) {
      files.push(child);
    } else {
      throw new Error(`Unsupported filesystem entry in candidate tree: ${child}`);
    }
  }
  return files.sort();
}

function hashTree(directory) {
  const hash = crypto.createHash('sha256');
  const files = listFiles(directory);
  for (const file of files) {
    hash.update(file.split(path.sep).join('/'));
    hash.update('\0');
    hash.update(fs.readFileSync(path.join(directory, file)));
    hash.update('\0');
  }
  return { fileCount: files.length, sha256: hash.digest('hex') };
}

export function buildGroupedLedgerCandidate06(requestedOutput) {
  const candidate = buildGroupedLedgerCandidate(requestedOutput);
  const skillPath = path.join(candidate.skillDir, 'SKILL.md');
  const skillBefore = fs.readFileSync(skillPath, 'utf8');
  const occurrences = skillBefore.split(insertionPoint).length - 1;
  if (occurrences !== 1) {
    throw new Error(`Candidate 06 insertion point expected exactly once; received ${occurrences}.`);
  }

  const skillAfter = skillBefore.replace(
    insertionPoint,
    insertionPoint.replace(
      '\n\nRender Quick/Deep Finding headers',
      `\n\n${candidate06Instruction}\n\nRender Quick/Deep Finding headers`,
    ),
  );
  const baselineSkillWords = countEnglishWords(skillBefore);
  const skillWords = countEnglishWords(skillAfter);
  const netEnglishWords = skillWords - baselineSkillWords;
  if (netEnglishWords > 30) {
    throw new Error(`Candidate 06 SKILL.md word budget exceeded: ${netEnglishWords}/30.`);
  }
  fs.writeFileSync(skillPath, skillAfter);

  const hashes = {
    ...candidate.hashes,
    skill: sha256(skillAfter),
  };
  const skillTree = hashTree(candidate.skillDir);
  if (hashes.skill !== expectedCandidate06.skill) {
    throw new Error(
      `Candidate 06 SKILL.md SHA-256 mismatch: expected ${expectedCandidate06.skill}, received ${hashes.skill}.`,
    );
  }
  if (skillTree.sha256 !== expectedCandidate06.skillTree) {
    throw new Error(
      `Candidate 06 Skill tree SHA-256 mismatch: expected ${expectedCandidate06.skillTree}, received ${skillTree.sha256}.`,
    );
  }

  return {
    ...candidate,
    baselineHashes: candidate.hashes,
    hashes,
    instruction: candidate06Instruction,
    skillTree,
    wordDelta: {
      deep: 0,
      fix: 0,
      quick: 0,
      skill: netEnglishWords,
    },
    words: {
      ...candidate.words,
      skill: skillWords,
    },
  };
}

function main() {
  const normalized = process.argv[2] === '--' ? process.argv.slice(3) : process.argv.slice(2);
  if (normalized.length !== 2 || normalized[0] !== '--output' || !normalized[1]) {
    process.stderr.write(
      'Usage: node scripts/build-grouped-ledger-candidate-06.mjs --output <directory>\n',
    );
    process.exitCode = 1;
    return;
  }

  try {
    process.stdout.write(
      `${JSON.stringify(buildGroupedLedgerCandidate06(normalized[1]), null, 2)}\n`,
    );
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main();
}
