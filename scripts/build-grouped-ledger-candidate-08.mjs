#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  buildGroupedLedgerCandidate06,
  candidate06Instruction,
} from './build-grouped-ledger-candidate-06.mjs';

export const candidate08Instruction =
  'Ledger child locations must be exactly `[file:line]` with one line number; ranges and locationless labels are invalid.';
const expectedCandidate08 = {
  skill: '7c48a782f0580ce44d754bd2de11ab6195af47cce16752f1b0251971b632cf35',
  skillTree: 'd25f55a5e11dd59c2eb8f16f3d4650924e61d1bee05c6b19b6545c83b61ef18f',
};

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

export function buildGroupedLedgerCandidate08(requestedOutput) {
  const candidate = buildGroupedLedgerCandidate06(requestedOutput);
  const skillPath = path.join(candidate.skillDir, 'SKILL.md');
  const skillBefore = fs.readFileSync(skillPath, 'utf8');
  const insertion = `${candidate06Instruction}\n`;
  const occurrences = skillBefore.split(insertion).length - 1;
  if (occurrences !== 1) {
    throw new Error(`Candidate 08 insertion point expected exactly once; received ${occurrences}.`);
  }

  const skillAfter = skillBefore.replace(
    insertion,
    `${insertion}\n${candidate08Instruction}\n`,
  );
  const netEnglishWords = countEnglishWords(skillAfter) - countEnglishWords(skillBefore);
  if (netEnglishWords > 20) {
    throw new Error(`Candidate 08 SKILL.md word budget exceeded: ${netEnglishWords}/20.`);
  }
  fs.writeFileSync(skillPath, skillAfter);

  const skillSha256 = sha256(skillAfter);
  const skillTree = hashTree(candidate.skillDir);
  if (skillSha256 !== expectedCandidate08.skill) {
    throw new Error(
      `Candidate 08 SKILL.md SHA-256 mismatch: expected ${expectedCandidate08.skill}, received ${skillSha256}.`,
    );
  }
  if (skillTree.sha256 !== expectedCandidate08.skillTree) {
    throw new Error(
      `Candidate 08 Skill tree SHA-256 mismatch: expected ${expectedCandidate08.skillTree}, received ${skillTree.sha256}.`,
    );
  }

  return {
    ...candidate,
    hashes: {
      ...candidate.hashes,
      skill: skillSha256,
    },
    candidate08Instruction,
    skillTree,
    words: {
      ...candidate.words,
      candidate08NetSkillEnglishWords: netEnglishWords,
      skill: countEnglishWords(skillAfter),
    },
  };
}

function main() {
  const normalized = process.argv[2] === '--' ? process.argv.slice(3) : process.argv.slice(2);
  if (normalized.length !== 2 || normalized[0] !== '--output' || !normalized[1]) {
    process.stderr.write(
      'Usage: node scripts/build-grouped-ledger-candidate-08.mjs --output <directory>\n',
    );
    process.exitCode = 1;
    return;
  }

  try {
    process.stdout.write(
      `${JSON.stringify(buildGroupedLedgerCandidate08(normalized[1]), null, 2)}\n`,
    );
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main();
}
