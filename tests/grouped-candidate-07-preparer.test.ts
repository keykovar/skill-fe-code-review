import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';

import { prepareCandidate07 } from '../scripts/prepare-grouped-ledger-candidate-07.mjs';

const temporaryDirectories: string[] = [];

function resolveExecutable(name: string) {
  for (const directory of (process.env.PATH ?? '').split(path.delimiter)) {
    const candidate = path.join(directory, name);
    if (fs.existsSync(candidate)) {
      return fs.realpathSync(candidate);
    }
  }
  throw new Error(`Could not resolve ${name}.`);
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { force: true, recursive: true });
  }
});

describe('Candidate 07 offline preparer', () => {
  test(
    'creates a fresh runtime-only window without changing Candidate 06 semantics',
    () => {
      const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fe-grouped-candidate-07-freeze-'));
      temporaryDirectories.push(root);
      const cursorExecutable = path.join(root, 'fake-cursor.mjs');
      fs.writeFileSync(
        cursorExecutable,
        `#!${process.execPath}\nif (process.argv[2] === '--version') process.stdout.write('fake-cursor-07\\n');\n`,
      );
      fs.chmodSync(cursorExecutable, 0o755);
      const result = prepareCandidate07(
        path.join(root, 'freeze'),
        cursorExecutable,
        resolveExecutable('git'),
      );

      expect(result).toMatchObject({
        candidate: 'post-v0.4.0-grouped-ledger-candidate-07',
        status: 'offline-freeze-complete-source-free-probe-not-authorized',
        runtimeDeltaComparedWithCandidate06: 'byte-identical',
        preparationEngine: {
          candidate: 'post-v0.4.0-grouped-ledger-candidate-06',
        },
        client: { version: 'fake-cursor-07' },
        artifacts: {
          hashes: {
            skill: 'a7145a6d305647c32ed47873b1284575152ff12c7ab61002cea108672dedfae1',
          },
          skillTree: {
            fileCount: 12,
            sha256:
              '49fd77c07ccb214b4fe464b5019888ac496ca59fd52ba3c04cf8390e8627211d',
          },
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
      expect(result.preparedRuns.every(({ preflight }) => preflight !== undefined)).toBe(true);
      expect(fs.existsSync(result.manifestPath)).toBe(true);
    },
    30_000,
  );
});
