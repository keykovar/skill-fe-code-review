import { describe, expect, test } from 'vitest';

import { readText } from './test-utils';

describe('Candidate 15 records', () => {
  test('records the path-safe Stage 1 severity failure without continuing', () => {
    const record = JSON.parse(
      readText(
        'evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-15-offline-freeze.json',
      ),
    ) as {
      candidate: string;
      evaluatorPrompt: { profile: string; retryAllowed: boolean };
      offlineValidation: Record<string, string | number>;
      runs: Array<{ caseId: string; promptSha256: string; skillTreeSha256: string }>;
      skill: { changedFromCandidate14: boolean; treeSha256: string };
      sourcePolicy: {
        externalModelRequests: number;
        sourceBearingRunsExecuted: number;
        sourceFreeExternalRequestsExecuted: number;
        sourceFreeProbePassed: boolean;
        sourceFreeProbeAuthorized: boolean;
        sourceTransmitted: boolean;
      };
      status: string;
    };
    const result = JSON.parse(
      readText(
        'evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-15-stage-1-result.json',
      ),
    ) as {
      decision: { candidate: string };
      pathSafety: Record<string, boolean | number | string>;
      run: { findingSeverities: string[] };
      semanticOracle: { severityContractValid: boolean; valid: boolean };
      status: string;
      transferPolicy: { externalModelRequests: number; privateSourceTransmitted: boolean };
    };
    const plan = readText(
      'docs/post-v0.4.0-grouped-ledger-candidate-15-evaluation-plan.md',
    );
    const packageJson = JSON.parse(readText('package.json')) as {
      scripts: Record<string, string>;
    };

    expect(record).toMatchObject({
      candidate: 'post-v0.4.0-grouped-ledger-candidate-15',
      status: 'no-go-stage-1-severity-oracle-failure',
      skill: {
        changedFromCandidate14: false,
        treeSha256: 'beca476371288fc96b28fc5f58d619dca81fbf3b336d5125e7fc64979ba16fcb',
      },
      evaluatorPrompt: {
        profile: 'workspace-relative-stop-on-failure',
        retryAllowed: false,
      },
      sourcePolicy: {
        externalModelRequests: 1,
        sourceFreeProbeAuthorized: true,
        sourceFreeProbePassed: true,
        sourceFreeExternalRequestsExecuted: 1,
        sourceBearingRunsExecuted: 1,
        sourceTransmitted: true,
      },
    });
    expect(record.runs.map(({ caseId }) => caseId)).toEqual(['Q-ID-002', 'D-ID-001']);
    expect(record.runs.every(({ promptSha256, skillTreeSha256 }) =>
      promptSha256.length === 64 && skillTreeSha256 === record.skill.treeSha256)).toBe(true);
    expect(record.offlineValidation).toMatchObject({
      vitest: '32/32 files and 194/194 tests',
      jsonDocuments: '99/99',
      nodeSyntax: '34/34',
      repositorySkillValidator: 'pass with isolated PyYAML 6.0.3',
      officialSkillValidator: 'pass with isolated PyYAML 6.0.3',
      declaredTestExitsMatched: '2/2',
      promptPolicyMatched: '2/2',
      promptTemporaryRootAbsent: '2/2',
      secondPassPromptHashMatched: '2/2',
      secondPassGitStatusMatched: '2/2',
      secondPassWorkspaceTreeMatched: '2/2',
      secondPassSkillTreeMatched: '2/2',
      sourceFreeProbeAudit: 'pass',
      sourceFreeProbeReadToolCalls: '1/1 started/completed',
      sourceFreeProbeRelativePath: 'probe.txt',
      sourceFreeProbeShellCalls: 0,
      sourceFreeProbeMcpCalls: 0,
      sourceFreeProbeOutsideWorkspaceReads: 0,
      sourceFreeProbeRetries: 0,
      sourceFreeProbeWorkspaceMutation: false,
      sensitiveIdentifierMatches: 0,
      gitDiffCheck: 'pass',
      stagingArea: 'empty',
    });
    expect(result).toMatchObject({
      status: 'no-go-q-id-002-run-01-severity-oracle-failure',
      run: {
        findingSeverities: ['Blocking', 'Blocking'],
      },
      pathSafety: {
        valid: true,
        workspaceRelativeReadPaths: '9/9',
        forbiddenPathForms: 0,
        outsideWorkspaceReads: 0,
        failedToolCalls: 0,
        toolCallsAfterFailure: 0,
      },
      semanticOracle: {
        valid: false,
        severityContractValid: false,
      },
      transferPolicy: {
        externalModelRequests: 1,
        privateSourceTransmitted: false,
      },
      decision: {
        candidate: 'No-Go',
      },
    });
    expect(plan).toContain('Candidate 14 remains `No-Go`');
    expect(plan).toContain('workspace-relative-stop-on-failure');
    expect(plan).toContain('literal relative path `probe.txt`');
    expect(plan).toContain('probe passed on 2026-09-07');
    expect(plan).toContain('zero model requests and transmitted no source');
    expect(plan).toContain('All 13 file-tool calls used workspace-relative paths or patterns');
    expect(plan).toContain('The semantic oracle failed');
    expect(plan).toContain('Candidate 15 is closed `No-Go` at Stage 1');
    expect(packageJson.scripts['evaluation:prepare-grouped-candidate-15']).toBe(
      'node scripts/prepare-grouped-ledger-candidate-15.mjs',
    );
  });
});
