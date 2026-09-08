import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';

import { prepareCandidate13 } from '../scripts/prepare-grouped-ledger-candidate-13.mjs';

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

describe('Candidate 13 offline preparer', () => {
  test('freezes seven fresh evaluator-owned workspaces without a model request', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fe-grouped-candidate-13-freeze-'));
    temporaryDirectories.push(root);
    const fakeCursor = path.join(root, 'fake-cursor.mjs');
    fs.writeFileSync(
      fakeCursor,
      `#!${process.execPath}\nif (process.argv[2] === '--version') process.stdout.write('fake-cursor-13\\n');\n`,
    );
    fs.chmodSync(fakeCursor, 0o755);
    const skillSource = path.join(root, 'skill');
    fs.cpSync(path.join(process.cwd(), 'skills', 'fe-code-review'), skillSource, {
      filter: (source) => path.basename(source) !== '.plugin-eval',
      recursive: true,
    });

    const result = prepareCandidate13(
      path.join(root, 'freeze'),
      fakeCursor,
      resolveExecutable('git'),
      skillSource,
    );

    expect(result).toMatchObject({
      candidate: 'post-v0.4.0-grouped-ledger-candidate-13',
      preparedDate: '2026-09-04',
      status: 'offline-freeze-complete-source-free-probe-passed-source-bearing-not-authorized',
      predecessor: {
        candidate: 'post-v0.4.0-grouped-ledger-candidate-12',
        decision: 'No-Go',
      },
      sourcePolicy: {
        externalModelRequests: 0,
        sourceBearingAuthorized: false,
        sourceFreeProbePassed: true,
        sourceTransmitted: false,
      },
    });
    expect(result.preparedRuns).toHaveLength(7);
    expect(result.repeatAssertions).toHaveLength(2);
    expect(result.preparedRuns.every(({ collectorExpectedByCursor, testCommand }) =>
      collectorExpectedByCursor === 0 && testCommand === 'node --test')).toBe(true);
    expect(result.preparedRuns.filter(({ mode }) => mode === 'deep-identity')[0].collectorCallsExecuted).toBe(0);
    expect(result.preparedRuns.filter(({ mode }) => mode !== 'deep-identity').every(({ collectorCallsExecuted }) =>
      collectorCallsExecuted === 1)).toBe(true);
    expect(fs.existsSync(result.manifestPath)).toBe(true);
  }, 20_000);
});
