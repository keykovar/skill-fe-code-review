import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterEach, describe, expect, test } from 'vitest';

import { buildGroupedLedgerCandidate } from '../scripts/build-grouped-ledger-candidate.mjs';
import {
  buildGroupedLedgerCandidate06,
  candidate06Instruction,
} from '../scripts/build-grouped-ledger-candidate-06.mjs';

const temporaryDirectories: string[] = [];

function sha256(value: string | Buffer) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function listFiles(directory: string, relative = ''): string[] {
  return fs
    .readdirSync(path.join(directory, relative), { withFileTypes: true })
    .flatMap((entry) => {
      const child = path.join(relative, entry.name);
      return entry.isDirectory() ? listFiles(directory, child) : [child];
    })
    .sort();
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { force: true, recursive: true });
  }
});

describe('Candidate 06 grouped-ledger builder', () => {
  test('adds the exact core instruction once within the 30-word budget', () => {
    const output = fs.mkdtempSync(path.join(os.tmpdir(), 'fe-grouped-candidate-06-'));
    temporaryDirectories.push(output);
    const candidate = buildGroupedLedgerCandidate06(output);
    const skill = fs.readFileSync(path.join(candidate.skillDir, 'SKILL.md'), 'utf8');

    expect(skill.split(candidate06Instruction)).toHaveLength(2);
    expect(candidate.wordDelta).toEqual({ deep: 0, fix: 0, quick: 0, skill: 25 });
    expect(candidate.wordDelta.skill).toBeLessThanOrEqual(30);
    expect(candidate.hashes.skill).toBe(sha256(skill));
    expect(candidate.hashes.skill).toBe(
      'a7145a6d305647c32ed47873b1284575152ff12c7ab61002cea108672dedfae1',
    );
    expect(candidate.skillTree).toEqual({
      fileCount: 12,
      sha256: '49fd77c07ccb214b4fe464b5019888ac496ca59fd52ba3c04cf8390e8627211d',
    });
  });

  test('keeps every reference, adapter, and validator byte-identical to Candidate 05', () => {
    const candidate05Output = fs.mkdtempSync(
      path.join(os.tmpdir(), 'fe-grouped-candidate-05-baseline-'),
    );
    const candidate06Output = fs.mkdtempSync(path.join(os.tmpdir(), 'fe-grouped-candidate-06-'));
    temporaryDirectories.push(candidate05Output, candidate06Output);
    const candidate05 = buildGroupedLedgerCandidate(candidate05Output);
    const candidate06 = buildGroupedLedgerCandidate06(candidate06Output);
    const files = listFiles(candidate05.skillDir);

    expect(listFiles(candidate06.skillDir)).toEqual(files);
    expect(
      files.filter(
        (file) =>
          sha256(fs.readFileSync(path.join(candidate05.skillDir, file))) !==
          sha256(fs.readFileSync(path.join(candidate06.skillDir, file))),
      ),
    ).toEqual(['SKILL.md']);
    expect(candidate06.hashes).toMatchObject({
      deep: candidate05.hashes.deep,
      fix: candidate05.hashes.fix,
      groupedValidator: candidate05.hashes.groupedValidator,
      quick: candidate05.hashes.quick,
      reviewOutputValidator: candidate05.hashes.reviewOutputValidator,
    });
  });

  test('does not relax grouped validation for bold group or Finding prefixes', async () => {
    const output = fs.mkdtempSync(path.join(os.tmpdir(), 'fe-grouped-candidate-06-'));
    temporaryDirectories.push(output);
    const candidate = buildGroupedLedgerCandidate06(output);
    const validatorPath = path.join(candidate.validatorDir, 'validate-review-output.mjs');
    const { validateReviewOutput } = await import(
      `${pathToFileURL(validatorPath).href}?test=${Date.now()}`
    );
    const boldGroup = `## Changed-Condition Coverage

- **[F-001]**
  - [src/url.ts:3] base: used -> ignored

## Risk

- [F-001] [src/url.ts:3] URL contract regressed
`;
    const boldFinding = `## Changed-Condition Coverage

- [F-001]
  - [src/url.ts:3] base: used -> ignored

## Risk

- **[F-001] [src/url.ts:3] URL contract regressed**
`;

    expect(validateReviewOutput(boldGroup, 'quick')).toMatchObject({ valid: false });
    expect(validateReviewOutput(boldGroup, 'quick').errors).toContainEqual(
      expect.objectContaining({ type: 'group-header-invalid' }),
    );
    expect(validateReviewOutput(boldFinding, 'quick')).toMatchObject({ valid: false });
  });
});
