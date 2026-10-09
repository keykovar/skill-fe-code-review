import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { prepareCodexAcceptanceWorkspaces, runPreparationCommand, verifyCodexFixtureTests }
  from '../evaluation/baselines/pre-v0.6.0/scripts/prepare-codex-acceptance-workspaces.mjs';
import { readText, rootDir } from './test-utils';

vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>();
  return { ...actual, spawnSync: vi.fn(actual.spawnSync) };
});

const planPath = 'evaluation/runtime-windows/v0.5.0-codex-runtime-acceptance-plan.json';
const plan = JSON.parse(readText(planPath));
const record = JSON.parse(readText('evaluation/runtime-windows/v0.5.0-codex-offline-workspaces-result.json'));

describe('Codex workspace preparation evidence', () => {
  test('does not prepare Git repositories without the scoped authorization', () => {
    expect(() => prepareCodexAcceptanceWorkspaces({ authorized: false, gitExecutable: '/usr/bin/git' }))
      .toThrow('Explicit authorization');
    const result = spawnSync(process.execPath,
      [path.join(rootDir, 'scripts/prepare-codex-acceptance-workspaces.mjs')], { encoding: 'utf8', shell: false });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('--authorize-synthetic-git-commits');
  });

  test('matches the frozen plan without treating preparation as a model run', () => {
    expect(record.planSha256).toBe(crypto.createHash('sha256').update(readText(planPath)).digest('hex'));
    expect(record.skillTreeSha256).toBe(plan.baseline.skillTreeSha256);
    expect(record.authorization).toEqual({ workspacePreparation: true, syntheticGitCommits: true,
      sourceFreeProbe: false, sourceBearing: false, mainRepositoryCommit: false });
    expect(record.sourcePolicy).toEqual({ visibility: 'public-synthetic-only', externalModelInvocations: 0,
      sourceTransmitted: false, privateSourceTransmitted: false, credentialContentsReadOrRecorded: false });
    expect(record.runtimeFreezeComplete).toBe(false);
    expect(record.codexV050Status).toBe('Cannot Verify');
  });

  test('records exactly seven cases and ten scoped synthetic commits', () => {
    expect(record.runs).toHaveLength(7);
    for (const [index, run] of record.runs.entries()) {
      const planned = plan.runs[index];
      expect(run).toMatchObject({ sequence: planned.sequence, caseId: planned.caseId, runId: planned.runId,
        mode: planned.mode, expectedTestExitCode: planned.expectedTestExitCode,
        actualTestExitCode: planned.expectedTestExitCode, runtimeResult: 'Not Run' });
      expect(run.syntheticCommitCount).toBe(['fix', 'deep'].includes(run.mode) ? 2 : 1);
      expect(run.head).toMatch(/^[a-f0-9]{40}$/u);
      expect(run.contentTreeSha256).toMatch(/^[a-f0-9]{64}$/u);
      const oracle = JSON.parse(readText(planned.oracle)).modes[planned.fixtureMode];
      expect(run.promptSha256).toBe(crypto.createHash('sha256')
        .update(`${oracle.prompt}\n\n${plan.promptPolicy.commonSuffix}`).digest('hex'));
    }
    expect(record.runs.reduce((total: number, run: { syntheticCommitCount: number }) =>
      total + run.syntheticCommitCount, 0)).toBe(10);
    expect(record.syntheticCommitCount).toBe(10);
  });

  test('preserves repeat inputs and distinguishes per-workspace Git integrity from cross-directory stat bytes', () => {
    for (const caseId of plan.acceptance.repeatCaseIds) {
      const pair = record.runs.filter((run: { caseId: string }) => run.caseId === caseId);
      expect(pair).toHaveLength(2);
      for (const key of ['head', 'contentTreeSha256', 'promptSha256', 'actualTestExitCode']) {
        expect(pair[0][key]).toBe(pair[1][key]);
      }
    }
    expect(record.verification).toMatchObject({ preparedWorkspaces: '7/7', expectedTestResults: '7/7',
      unchangedCompleteWorkspaceAndGitState: '7/7', exactSkillCopies: '14/14', workspaceFileAllowlist: '7/7',
      repeatInputPairs: '2/2', rawGitIndexStatBytesComparedAcrossDirectories: false,
      modelContextCollectorsExecuted: 0, sourceFreeProbesExecuted: 0, sourceBearingReviewsExecuted: 0 });
  });

  test('keeps the copied previous report as a Fix-only input and authentication unconfigured', () => {
    expect(record.isolation).toEqual({ cleanPreparationEnvironment: true, personalGitConfigLoaded: false,
      gitHooksEnabled: false, gitSigningEnabled: false, credentialVariablesInherited: false,
      remoteConfigured: false, oraclesAndPromptsOutsideWorkspaces: true,
      fixOnlyPreviousReportException: '.evaluation/previous-findings.md', runtimeClientConfigurationCreated: false });
    expect(record.nextGate).toContain('without-secret-values');
    expect(record.localManifestSha256).toMatch(/^[a-f0-9]{64}$/u);
    expect(record.localManifestPathWithinDirectory).toBe('control/manifest.json');
  });
});

describe('Codex preparation test-result and failure evidence gates', () => {
  const temporaryRoots: string[] = [];
  afterEach(() => {
    vi.mocked(spawnSync).mockReset();
    vi.restoreAllMocks();
    for (const directory of temporaryRoots.splice(0)) fs.rmSync(directory, { recursive: true, force: true });
  });

  function fixture(fixtureMode = 'quick-identity') {
    const directory = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'codex-preparation-test-')));
    temporaryRoots.push(directory);
    const workspace = path.join(directory, 'workspace');
    const evidence = path.join(directory, 'evidence');
    const definition = plan.runs.find((run: { fixtureMode: string }) => run.fixtureMode === fixtureMode);
    const source = path.join(rootDir, path.dirname(definition.oracle));
    fs.cpSync(path.join(source, 'baseline'), workspace, { recursive: true });
    fs.cpSync(path.join(source, 'problem'), workspace, { recursive: true });
    if (definition.mode === 'fix') fs.cpSync(path.join(source, 'fixed'), workspace, { recursive: true });
    fs.mkdirSync(evidence);
    const beforeGit = { head: 'synthetic-state-only', status: 'unchanged' };
    return { node: process.execPath, workspace, evidence, definition,
      env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' }, beforeGit, gitState: () => beforeGit };
  }

  const readEvidence = (options: { evidence: string }, filename: string) =>
    JSON.parse(fs.readFileSync(path.join(options.evidence, filename), 'utf8'));

  test.each(['quick-independent', 'deep-identity', 'quick-identity', 'fix-identity', 'quick-keep'])(
    'verifies exact named test outcomes for %s without creating Git repositories', (mode) => {
      const options = fixture(mode);
      const result = verifyCodexFixtureTests(options);
      expect(result.test.status).toBe(options.definition.expectedTestExitCode);
      expect(result.testSummary.failed).toBe(mode === 'quick-independent' ? 2 : options.definition.expectedTestExitCode);
      expect(readEvidence(options, 'after.json')).toEqual(readEvidence(options, 'before.json'));
      expect(fs.existsSync(path.join(options.workspace, '.git'))).toBe(false);
      expect(readEvidence(options, 'tests.result.json').status).toBe(result.test.status);
    },
  );

  test.each([
    ['syntax error', 'export const broken = ;'],
    ['missing module', "import './missing-module.mjs';"],
  ])('rejects exit-one %s and still captures after state', (_label, source) => {
    const options = fixture();
    fs.writeFileSync(path.join(options.workspace, 'src/url.ts'), source);
    expect(() => verifyCodexFixtureTests(options)).toThrow(/deterministic test/u);
    expect(readEvidence(options, 'tests.result.json').status).toBe(1);
    expect(readEvidence(options, 'after.json')).toEqual(readEvidence(options, 'before.json'));
  });

  test('rejects a non-assertion failure with the expected test name', () => {
    const options = fixture();
    fs.writeFileSync(path.join(options.workspace, 'tests/url.test.mjs'),
      "import test from 'node:test'; test('normalizes the base and path separator', () => { throw new Error('not an assertion'); });");
    expect(() => verifyCodexFixtureTests(options)).toThrow(/deterministic test/u);
    expect(readEvidence(options, 'tests.result.json').status).toBe(1);
  });

  test.each(['skip', 'todo'])('rejects a %s even when the process exits zero', (modifier) => {
    const options = fixture('fix-identity');
    fs.writeFileSync(path.join(options.workspace, 'tests/url.test.mjs'),
      `import test from 'node:test'; test.${modifier}('normalizes the base and path separator', () => {});`);
    expect(() => verifyCodexFixtureTests(options)).toThrow(/deterministic test/u);
    expect(readEvidence(options, 'tests.result.json').status).toBe(0);
  });

  test('rejects an additional passing test', () => {
    const options = fixture('fix-identity');
    fs.appendFileSync(path.join(options.workspace, 'tests/url.test.mjs'), "\ntest('unexpected extra test', () => {});\n");
    expect(() => verifyCodexFixtureTests(options)).toThrow(/deterministic test/u);
  });

  test('rejects a missing test despite a zero exit', () => {
    const options = fixture('fix-identity');
    fs.writeFileSync(path.join(options.workspace, 'tests/url.test.mjs'), '');
    expect(() => verifyCodexFixtureTests(options)).toThrow(/deterministic test/u);
    expect(readEvidence(options, 'tests.result.json').status).toBe(0);
  });

  test.each(['not-json', '{"type":"test:summary"', '{}\n'])('rejects malformed test events: %s', (stdout) => {
    const options = fixture('fix-identity');
    vi.mocked(spawnSync).mockReturnValueOnce({ pid: 0, output: [], stdout, stderr: '', status: 0, signal: null });
    expect(() => verifyCodexFixtureTests(options)).toThrow(/deterministic test/u);
    expect(readEvidence(options, 'after.json')).toEqual(readEvidence(options, 'before.json'));
  });

  test('captures after state before rejecting an unexpected test exit', () => {
    const options = fixture('fix-identity');
    fs.writeFileSync(path.join(options.workspace, 'src/url.ts'), "export const buildUrl = () => 'wrong';");
    expect(() => verifyCodexFixtureTests(options)).toThrow(/deterministic test/u);
    expect(readEvidence(options, 'tests.result.json').status).toBe(1);
    expect(readEvidence(options, 'after.json')).toEqual(readEvidence(options, 'before.json'));
  });

  test('preserves raw command output and status on an unexpected exit', () => {
    const options = fixture();
    let failure: unknown;
    try {
      runPreparationCommand(process.execPath, ['--eval',
        "process.stdout.write('RAW_STDOUT'); process.stderr.write('RAW_STDERR'); process.exit(2)"],
      options.workspace, options.env);
    } catch (error) { failure = error; }
    expect(failure).toMatchObject({ commandResult: { stdout: 'RAW_STDOUT', stderr: 'RAW_STDERR', status: 2, signal: null } });
  });

  test('persists preparation command failures in failure.json without running Git or the preparer', () => {
    const options = fixture();
    const outputRoot = path.join(path.dirname(options.workspace), 'mock-preparation');
    fs.mkdirSync(outputRoot);
    vi.spyOn(fs, 'mkdtempSync').mockReturnValueOnce(outputRoot);
    vi.mocked(spawnSync)
      .mockReturnValueOnce({ pid: 0, output: [], stdout: 'git version mock', stderr: '', status: 0, signal: null })
      .mockReturnValueOnce({ pid: 0, output: [], stdout: 'RAW_PREPARATION', stderr: 'PREPARATION_FAILED', status: 2, signal: null });
    expect(() => prepareCodexAcceptanceWorkspaces({ authorized: true, gitExecutable: process.execPath }))
      .toThrow('Preparation stopped');
    const failure = JSON.parse(fs.readFileSync(path.join(outputRoot, 'control/failure.json'), 'utf8'));
    expect(failure).toMatchObject({ status: 'preparation-stopped', runs: [], syntheticCommitCount: 0,
      failedCommand: { stdout: 'RAW_PREPARATION', stderr: 'PREPARATION_FAILED', status: 2 } });
    expect(vi.mocked(spawnSync)).toHaveBeenCalledTimes(2);
    const evidence = path.join(outputRoot, 'control/q-id-002-run-01');
    expect(fs.readFileSync(path.join(evidence, 'preparation.stdout.txt'), 'utf8')).toBe('RAW_PREPARATION');
    expect(fs.readFileSync(path.join(evidence, 'preparation.stderr.txt'), 'utf8')).toBe('PREPARATION_FAILED');
  });

  test.each(['ETIMEDOUT', 'ENOENT', 'ENOBUFS'])('retains %s command failure and after snapshots', (code) => {
    const options = fixture();
    vi.mocked(spawnSync).mockReturnValueOnce({ pid: 0, output: [], stdout: 'PARTIAL_STDOUT', stderr: 'PARTIAL_STDERR',
      status: null, signal: code === 'ENOENT' ? null : 'SIGTERM', error: Object.assign(new Error(code), { code }) });
    expect(() => verifyCodexFixtureTests(options)).toThrow('Local command failed');
    expect(fs.readFileSync(path.join(options.evidence, 'tests.stdout.txt'), 'utf8')).toBe('PARTIAL_STDOUT');
    expect(fs.readFileSync(path.join(options.evidence, 'tests.stderr.txt'), 'utf8')).toBe('PARTIAL_STDERR');
    expect(readEvidence(options, 'tests.result.json').error.code).toBe(code);
    expect(readEvidence(options, 'after.json')).toEqual(readEvidence(options, 'before.json'));
  });

  test('records a failed Git snapshot without losing the filesystem snapshot or original command failure', () => {
    const options = fixture();
    vi.mocked(spawnSync).mockReturnValueOnce({ pid: 0, output: [], stdout: 'PARTIAL', stderr: '',
      status: null, signal: null, error: Object.assign(new Error('missing executable'), { code: 'ENOENT' }) });
    options.gitState = () => { throw new Error('Git snapshot unavailable'); };
    expect(() => verifyCodexFixtureTests(options)).toThrow('Local command failed');
    const after = readEvidence(options, 'after.json');
    expect(after.errors.git.message).toBe('Git snapshot unavailable');
    expect(after.tree).toEqual(readEvidence(options, 'before.json').tree);
    expect(readEvidence(options, 'tests.result.json').error.code).toBe('ENOENT');
  });

  test('rejects a failed after snapshot even when all tests passed', () => {
    const options = fixture('fix-identity');
    options.gitState = () => { throw new Error('Git snapshot unavailable'); };
    expect(() => verifyCodexFixtureTests(options)).toThrow('After-test snapshot incomplete');
    expect(readEvidence(options, 'tests.result.json').status).toBe(0);
    expect(readEvidence(options, 'after.json').errors.git.message).toBe('Git snapshot unavailable');
  });

  test('retains and rejects workspace mutation without repairing it', () => {
    const options = fixture('fix-identity');
    fs.appendFileSync(path.join(options.workspace, 'tests/url.test.mjs'),
      "\nimport fs from 'node:fs'; fs.writeFileSync('unexpected-write.txt', 'mutation');\n");
    expect(() => verifyCodexFixtureTests(options)).toThrow('Deterministic test changed the workspace');
    expect(readEvidence(options, 'tests.result.json').status).toBe(0);
    expect(readEvidence(options, 'after.json').tree.sha256).not.toBe(readEvidence(options, 'before.json').tree.sha256);
    expect(fs.readFileSync(path.join(options.workspace, 'unexpected-write.txt'), 'utf8')).toBe('mutation');
  });
});
