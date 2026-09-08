import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';

import { prepareCandidate14 } from '../scripts/prepare-grouped-ledger-candidate-14.mjs';

const temporaryDirectories: string[] = [];

function resolveExecutable(name: string) {
  for (const directory of (process.env.PATH ?? '').split(path.delimiter)) {
    const candidate = path.join(directory, name);
    if (fs.existsSync(candidate)) return fs.realpathSync(candidate);
  }
  throw new Error(`Could not resolve ${name}.`);
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { force: true, recursive: true });
  }
});

describe('Candidate 14 offline preparer', () => {
  test('freezes only the bounded Quick and Deep correction cases without a model request', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fe-grouped-candidate-14-freeze-'));
    temporaryDirectories.push(root);
    const fakeCursor = path.join(root, 'fake-cursor.mjs');
    fs.writeFileSync(
      fakeCursor,
      `#!${process.execPath}\nif (process.argv[2] === '--version') process.stdout.write('fake-cursor-14\\n');\n`,
    );
    fs.chmodSync(fakeCursor, 0o755);

    const result = prepareCandidate14(
      path.join(root, 'candidate'),
      fakeCursor,
      resolveExecutable('git'),
      path.join(process.cwd(), 'skills', 'fe-code-review'),
    );

    expect(result).toMatchObject({
      candidate: 'post-v0.4.0-grouped-ledger-candidate-14',
      preparedDate: '2026-09-04',
      status: 'offline-freeze-complete-source-free-probe-pending-source-bearing-not-authorized',
      predecessor: {
        candidate: 'post-v0.4.0-grouped-ledger-candidate-13',
        decision: 'Go',
      },
      sourcePolicy: {
        externalModelRequests: 0,
        sourceBearingAuthorized: false,
        sourceFreeProbePassed: false,
        sourceTransmitted: false,
      },
    });
    expect(result.preparedRuns.map(({ caseId, mode }) => ({ caseId, mode }))).toEqual([
      { caseId: 'Q-ID-002', mode: 'quick-independent' },
      { caseId: 'D-ID-001', mode: 'deep-identity' },
    ]);
    for (const run of result.preparedRuns) {
      const prompt = fs.readFileSync(run.promptPath, 'utf8');
      expect(prompt).not.toContain('相对于当前 workspace 根目录的路径');
      expect(prompt).not.toContain('立即停止所有后续工具调用');
    }
    expect(result.preparedRuns.find(({ mode }) => mode === 'deep-identity')?.promptSha256).toBe(
      'a8669d56338d7f754626b199f1a0663c03c3ad3875f05e9f1f0c126e7e0003d2',
    );
    expect(result.repeatAssertions).toEqual([]);
    expect(result.preparedRuns.every(({ collectorExpectedByCursor, testCommand }) =>
      collectorExpectedByCursor === 0 && testCommand === 'node --test')).toBe(true);
    expect(result.preparedRuns.find(({ mode }) => mode === 'quick-independent')?.collectorCallsExecuted).toBe(1);
    expect(result.preparedRuns.find(({ mode }) => mode === 'deep-identity')?.collectorCallsExecuted).toBe(0);
    expect(result.preparedRuns.every(({ skillTreeSha256 }) =>
      skillTreeSha256 === result.skill.treeSha256)).toBe(true);
    expect(result.skill.fileCount).toBe(12);
    expect(fs.existsSync(result.manifestPath)).toBe(true);
  }, 20_000);
});
