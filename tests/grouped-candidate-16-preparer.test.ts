import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';

import { hashCursorEvaluationTreeV5 } from '../scripts/run-cursor-evaluation-v5.mjs';
import { prepareCandidate16 } from '../scripts/prepare-grouped-ledger-candidate-16.mjs';

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

describe('Candidate 16 offline preparer', () => {
  test('tightens generic Blocking proof without changing the source Skill', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fe-grouped-candidate-16-freeze-'));
    temporaryDirectories.push(root);
    const fakeCursor = path.join(root, 'fake-cursor.mjs');
    fs.writeFileSync(
      fakeCursor,
      `#!${process.execPath}\nif (process.argv[2] === '--version') process.stdout.write('fake-cursor-16\\n');\n`,
    );
    fs.chmodSync(fakeCursor, 0o755);
    const skillSource = path.join(process.cwd(), 'skills', 'fe-code-review');
    const sourceEntrypoint = fs.readFileSync(path.join(skillSource, 'SKILL.md'), 'utf8');
    const sourceTree = hashCursorEvaluationTreeV5(skillSource);

    const result = prepareCandidate16(
      path.join(root, 'candidate'),
      fakeCursor,
      resolveExecutable('git'),
      skillSource,
    );
    const candidateEntrypoint = fs.readFileSync(
      path.join(root, 'candidate', 'candidate-skill', 'SKILL.md'),
      'utf8',
    );

    expect(result).toMatchObject({
      candidate: 'post-v0.4.0-grouped-ledger-candidate-16',
      preparedDate: '2026-09-08',
      predecessor: {
        candidate: 'post-v0.4.0-grouped-ledger-candidate-15',
        decision: 'No-Go',
      },
      evaluatorContract: {
        promptSafetyProfile: 'workspace-relative-stop-on-failure',
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
    expect(candidateEntrypoint).toContain('perform a Blocking proof pass before sorting');
    expect(candidateEntrypoint).toContain(
      '`Severe Regression` means a demonstrated loss of an established critical path',
    );
    expect(candidateEntrypoint).toContain(
      'classify the finding as Risk unless separate evidence demonstrates a canonical Blocking outcome',
    );
    expect(candidateEntrypoint).not.toContain('ignored-timeout-contract');
    expect(candidateEntrypoint).not.toContain('Q-ID-002');
    expect(fs.readFileSync(path.join(skillSource, 'SKILL.md'), 'utf8')).toBe(sourceEntrypoint);
    expect(hashCursorEvaluationTreeV5(skillSource)).toEqual(sourceTree);
    expect(result.preparedRuns.every(({ skillTreeSha256 }) =>
      skillTreeSha256 === result.skill.treeSha256)).toBe(true);
    for (const run of result.preparedRuns) {
      const prompt = fs.readFileSync(run.promptPath, 'utf8');
      expect(prompt).toContain('相对于当前 workspace 根目录的路径');
      expect(prompt).toContain('立即停止所有后续工具调用');
      expect(prompt).not.toContain(root);
      expect(prompt).not.toContain(run.workspace);
    }
  }, 20_000);
});
