import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';

import { prepareCandidate05 } from '../scripts/prepare-grouped-ledger-candidate-05.mjs';

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

describe('Candidate 05 offline preparer', () => {
  test('creates seven fresh runs with frozen Node preflight inputs and no runtime request', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fe-grouped-candidate-05-'));
    temporaryDirectories.push(root);
    const cursorExecutable = path.join(root, 'fake-cursor.mjs');
    fs.writeFileSync(
      cursorExecutable,
      `#!${process.execPath}\nif (process.argv[2] === '--version') process.stdout.write('fake-cursor-05\\n');\n`,
    );
    fs.chmodSync(cursorExecutable, 0o755);
    const outputDir = path.join(root, 'freeze');
    const result = prepareCandidate05(outputDir, cursorExecutable, resolveExecutable('git'));

    expect(result).toMatchObject({
      candidate: 'post-v0.4.0-grouped-ledger-candidate-05',
      status: 'offline-freeze-complete-runtime-not-authorized',
      client: { version: 'fake-cursor-05' },
      generationBoundary: {
        freshOutputDirectory: true,
        runtimeResultsCarriedForward: false,
        runtimeCandidateDeltaComparedWithCandidate04: 'byte-identical',
      },
      preflightContract: {
        adHocShellPreflightAllowed: false,
        shell: false,
        zshPathIndependent: true,
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
        ({ preflight, promptSha256, skillTreeSha256, workspaceTreeSha256 }) =>
          preflight.baseArguments.expectedPromptSha256 === promptSha256 &&
          preflight.preflightArguments.expectedSkillTreeSha256 === skillTreeSha256 &&
          preflight.preflightArguments.expectedWorkspaceTreeSha256 === workspaceTreeSha256,
      ),
    ).toBe(true);
    expect(fs.existsSync(result.manifestPath)).toBe(true);
    expect(JSON.parse(fs.readFileSync(result.manifestPath, 'utf8')).candidate).toBe(
      'post-v0.4.0-grouped-ledger-candidate-05',
    );
  });
});
