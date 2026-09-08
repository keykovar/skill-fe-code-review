import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';

import {
  buildGroupedLedgerCandidate08,
  candidate08Instruction,
} from '../scripts/build-grouped-ledger-candidate-08.mjs';
import { readText } from './test-utils';

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { force: true, recursive: true });
  }
});

describe('Candidate 08 grouped-ledger builder', () => {
  test('adds one bounded child-location constraint without changing mode references or validators', () => {
    const output = fs.mkdtempSync(path.join(os.tmpdir(), 'fe-grouped-candidate-08-build-'));
    temporaryDirectories.push(output);
    const result = buildGroupedLedgerCandidate08(output);
    const skill = fs.readFileSync(path.join(result.skillDir, 'SKILL.md'), 'utf8');

    expect(skill.split(candidate08Instruction)).toHaveLength(2);
    expect(result).toMatchObject({
      hashes: {
        deep: '44d1fb20cfc2f3b9814943d5254e2349387a8b17832eab27b618a2a2a3bedc36',
        fix: '8380289a00f3c2f1a1ea740bc824b1a53813d6839b3957cae3c54c0e27757d33',
        groupedValidator:
          'a0e429e9ea53dc94ff75d8e573b670e1cdcf30012d07ff31210a968515342998',
        quick: '91fe031195f6018ecbf29c48aab5fc26477f9262b40eb7dd4d149b2294c7a9ed',
        reviewOutputValidator:
          '0293481ada8e2c722730f02f2663244d3c446e4d0a46dd9c9bc63ed030e81b8f',
        skill: '7c48a782f0580ce44d754bd2de11ab6195af47cce16752f1b0251971b632cf35',
      },
      skillTree: {
        fileCount: 12,
        sha256: 'd25f55a5e11dd59c2eb8f16f3d4650924e61d1bee05c6b19b6545c83b61ef18f',
      },
      words: { candidate08NetSkillEnglishWords: 18 },
    });
    expect(readText('skills/fe-code-review/SKILL.md')).not.toContain(candidate08Instruction);
  });
});
