import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';

import { hashCursorEvaluationTreeV5 } from '../scripts/run-cursor-evaluation-v5.mjs';
import { prepareCandidate15 } from '../scripts/prepare-grouped-ledger-candidate-15.mjs';

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

describe('Candidate 15 offline preparer', () => {
  test('freezes path-safe Quick and Deep prompts without changing the distributable Skill', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fe-grouped-candidate-15-freeze-'));
    temporaryDirectories.push(root);
    const fakeCursor = path.join(root, 'fake-cursor.mjs');
    fs.writeFileSync(
      fakeCursor,
      `#!${process.execPath}\nif (process.argv[2] === '--version') process.stdout.write('fake-cursor-15\\n');\n`,
    );
    fs.chmodSync(fakeCursor, 0o755);
    const skillSource = path.join(process.cwd(), 'skills', 'fe-code-review');
    const originalSkillTree = hashCursorEvaluationTreeV5(skillSource);
    const result = prepareCandidate15(
      path.join(root, 'candidate'),
      fakeCursor,
      resolveExecutable('git'),
      skillSource,
    );

    expect(result).toMatchObject({
      candidate: 'post-v0.4.0-grouped-ledger-candidate-15',
      preparedDate: '2026-09-07',
      status: 'offline-freeze-complete-source-free-probe-pending-source-bearing-not-authorized',
      predecessor: {
        candidate: 'post-v0.4.0-grouped-ledger-candidate-14',
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
    expect(result.repeatAssertions).toEqual([]);
    expect(result.skill).toMatchObject({
      fileCount: 12,
      treeSha256: 'beca476371288fc96b28fc5f58d619dca81fbf3b336d5125e7fc64979ba16fcb',
    });
    expect(result.preparedRuns.map(({ promptSha256 }) => promptSha256)).toEqual([
      'dd72904d2cb9fbf5ad6dc79977fbbdd369d4507231601be3232f63442a07ca93',
      '91fbad0e741080e1c9e81363895bf2fcb791cbc7a62f8687013723be554b52e0',
    ]);
    expect(hashCursorEvaluationTreeV5(skillSource)).toEqual(originalSkillTree);

    for (const run of result.preparedRuns) {
      const prompt = fs.readFileSync(run.promptPath, 'utf8');
      expect(prompt).toContain('相对于当前 workspace 根目录的路径');
      expect(prompt).toContain('例如 `tests/contracts.test.mjs`');
      expect(prompt).toContain('不得在文件工具参数中填写、拼接、复制、猜测或修正绝对 workspace 路径');
      expect(prompt).toContain('立即停止所有后续工具调用');
      expect(prompt).toContain('不得使用修正路径、替代路径、绝对路径、其他工具或重复调用进行重试');
      expect(prompt).not.toContain(root);
      expect(prompt).not.toContain(run.workspace);
    }
  }, 20_000);
});
