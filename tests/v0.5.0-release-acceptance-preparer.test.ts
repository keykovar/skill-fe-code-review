import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';

import { prepareV050ReleaseAcceptance } from '../scripts/prepare-v0.5.0-release-acceptance.mjs';

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

describe('v0.5.0 release acceptance preparer', () => {
  test('creates one current-tree Fix workspace with a self-consistent read boundary', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fe-v050-release-fix-'));
    temporaryDirectories.push(root);
    const fakeCursor = path.join(root, 'fake-cursor.mjs');
    fs.writeFileSync(
      fakeCursor,
      `#!${process.execPath}\nif (process.argv[2] === '--version') process.stdout.write('fake-cursor-v050\\n');\n`,
    );
    fs.chmodSync(fakeCursor, 0o755);

    const result = prepareV050ReleaseAcceptance(
      path.join(root, 'candidate'),
      fakeCursor,
      resolveExecutable('git'),
      path.join(process.cwd(), 'skills', 'fe-code-review'),
    );
    const run = result.preparedRuns[0];
    const prompt = fs.readFileSync(run.promptPath, 'utf8');

    expect(result).toMatchObject({
      candidate: 'v0.5.0-current-tree-fix-acceptance',
      evaluatorContract: {
        promptSafetyProfile: 'workspace-relative-stop-on-failure-fix-previous-findings',
      },
      sourcePolicy: {
        externalModelRequests: 0,
        sourceBearingAuthorized: false,
        sourceFreeProbePassed: true,
        sourceTransmitted: false,
      },
    });
    expect(result.preparedRuns).toHaveLength(1);
    expect(run).toMatchObject({ caseId: 'F-ID-001', mode: 'fix-identity', runId: 'RUN-01' });
    expect(prompt.match(/\.evaluation\/previous-findings\.md/g)).toHaveLength(2);
    expect(prompt).toContain(
      '除当前 Fix Review 明确指定的 .evaluation/previous-findings.md 外的其他 evaluation 内容',
    );
    expect(prompt).not.toContain('oracle、evaluation、examples/outputs');
    expect(prompt).not.toContain(root);
    expect(prompt).not.toContain(run.workspace);
    expect(run.skillTreeSha256).toBe(result.skill.treeSha256);
  }, 20_000);
});
