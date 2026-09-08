import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';

import { prepareCandidate08 } from '../scripts/prepare-grouped-ledger-candidate-08.mjs';

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

describe('Candidate 08 offline preparer', () => {
  test(
    'freezes seven plan-mode runs with evaluator-owned test evidence and no model request',
    () => {
      const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fe-grouped-candidate-08-freeze-'));
      temporaryDirectories.push(root);
      const cursorExecutable = path.join(root, 'fake-cursor.mjs');
      fs.writeFileSync(
        cursorExecutable,
        `#!${process.execPath}\nif (process.argv[2] === '--version') process.stdout.write('fake-cursor-08\\n');\n`,
      );
      fs.chmodSync(cursorExecutable, 0o755);
      const result = prepareCandidate08(
        path.join(root, 'freeze'),
        cursorExecutable,
        resolveExecutable('git'),
      );

      expect(result).toMatchObject({
        candidate: 'post-v0.4.0-grouped-ledger-candidate-08',
        status: 'offline-freeze-complete-source-free-probe-not-authorized',
        artifacts: {
          hashes: {
            skill: '7c48a782f0580ce44d754bd2de11ab6195af47cce16752f1b0251971b632cf35',
          },
          skillTree: {
            sha256: 'd25f55a5e11dd59c2eb8f16f3d4650924e61d1bee05c6b19b6545c83b61ef18f',
          },
        },
        clientContract: {
          argumentsBeforePrompt: [
            '--print', '--output-format', 'stream-json', '--mode', 'plan', '--sandbox',
            'enabled', '--trust', '--workspace', '<workspace>',
          ],
        },
        sourcePolicy: {
          externalModelRequests: 0,
          sourceBearingAuthorized: false,
          sourceFreeProbeAuthorized: false,
          sourceTransmitted: false,
        },
      });
      expect(result.preparedRuns).toHaveLength(7);
      expect(result.repeatAssertions).toHaveLength(2);
      expect(
        result.preparedRuns.every(
          ({ expectedCursorTestCalls, promptPath, testEvidenceSource }) =>
            expectedCursorTestCalls === 0 &&
            testEvidenceSource === 'offline evaluator before workspace freeze' &&
            fs.readFileSync(promptPath, 'utf8').includes('不得在 Cursor 中再次执行任何测试命令') &&
            !fs.readFileSync(promptPath, 'utf8').includes('允许且应执行一次声明的确定性测试'),
        ),
      ).toBe(true);
    },
  );
});
