import { describe, expect, test } from 'vitest';

import { readText } from './test-utils';

describe('Candidate 16 records', () => {
  test('records complete runtime acceptance and exact local application', () => {
    const record = JSON.parse(
      readText(
        'evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-16-offline-freeze.json',
      ),
    ) as {
      candidateSkill: Record<string, boolean | number | string>;
      application: Record<string, boolean | number | string | string[]>;
      offlineValidation: Record<string, boolean | number | string>;
      runs: Array<{ caseId: string; skillTreeSha256: string }>;
      sourcePolicy: Record<string, boolean | number | string>;
      sourceSkill: Record<string, boolean | number | string>;
      status: string;
    };
    const plan = readText(
      'docs/post-v0.4.0-grouped-ledger-candidate-16-evaluation-plan.md',
    );
    const packageJson = JSON.parse(readText('package.json')) as {
      scripts: Record<string, string>;
    };

    expect(record).toMatchObject({
      status: 'candidate-applied-locally-pre-commit-review-passed-not-committed',
      sourceSkill: {
        modified: true,
        matchesCandidate: true,
        baselineTreeSha256: 'beca476371288fc96b28fc5f58d619dca81fbf3b336d5125e7fc64979ba16fcb',
        appliedTreeSha256: '148cf6ebae8c5cba674f5fe0fe9f1399f405287b5057d815867662faa1721480',
      },
      candidateSkill: {
        changedFromCandidate15: true,
        fixtureSpecificTermsPresent: false,
        treeSha256: '148cf6ebae8c5cba674f5fe0fe9f1399f405287b5057d815867662faa1721480',
      },
      sourcePolicy: {
        externalModelRequests: 3,
        sourceFreeProbeAuthorized: true,
        sourceFreeProbePassed: true,
        sourceFreeExternalRequestsExecuted: 1,
        sourceBearingRequestsAuthorized: 2,
        sourceBearingRunsExecuted: 2,
        sourceTransmitted: true,
      },
      application: {
        authorized: true,
        applied: true,
        changedFiles: ['skills/fe-code-review/SKILL.md'],
        publicSkillTreeSha256: '148cf6ebae8c5cba674f5fe0fe9f1399f405287b5057d815867662faa1721480',
        installedSkillTreeSha256: '148cf6ebae8c5cba674f5fe0fe9f1399f405287b5057d815867662faa1721480',
        entrypointSha256: '9f2af4fca11954225d307e4d53125f5f2dad4a7ef54979754ff6165d433a93fb',
        installedViaSymlink: true,
        preCommitReview: {
          status: 'pass-after-bounded-evaluation-tooling-fix',
          findingId: 'F-001',
          severity: 'Risk',
          skillBehaviorChanged: false,
          candidate15HistoricalTreeRestored: true,
          workspacePathCanonicalization: 'logical-and-real-paths',
          targetedVitest: '6/6 files and 6/6 tests',
          fullVitest: '34/34 files and 196/196 tests',
        },
        commitCreated: false,
        pushExecuted: false,
        temporaryDataCleaned: false,
      },
    });
    const probe = JSON.parse(
      readText(
        'evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-16-probe-result.json',
      ),
    ) as {
      audit: { valid: boolean; violations: unknown[] };
      authorization: Record<string, boolean | number>;
      decision: Record<string, string>;
      probe: Record<string, boolean | number | string>;
      transferPolicy: Record<string, boolean | number | string>;
    };
    expect(record.runs.map(({ caseId }) => caseId)).toEqual(['Q-ID-002', 'D-ID-001']);
    expect(record.runs.every(({ skillTreeSha256 }) =>
      skillTreeSha256 === record.candidateSkill.treeSha256)).toBe(true);
    expect(record.offlineValidation).toMatchObject({
      vitest: '34/34 files and 196/196 tests',
      jsonDocuments: '170/170',
      nodeSyntax: '35/35',
      repositorySkillValidator: 'pass with isolated PyYAML 6.0.3',
      officialSkillValidator: 'pass with isolated PyYAML 6.0.3',
      sourceSkillUnchanged: true,
      genericSeverityDeltaPresent: true,
      fixtureSpecificTermsPresent: false,
      sourceFreeProbeAudit: 'pass',
      sourceFreeProbeReadToolCalls: '1/1 started/completed',
      sourceFreeProbeRelativePath: 'probe.txt',
      sourceFreeProbeShellCalls: 0,
      sourceFreeProbeMcpCalls: 0,
      sourceFreeProbeOutsideWorkspaceReads: 0,
      sourceFreeProbeRetries: 0,
      sourceFreeProbeWorkspaceMutation: false,
      stage1RuntimeAudit: 'pass',
      stage1OutputValidator: 'pass',
      stage1SemanticOracle: 'pass',
      stage1WorkspaceMutation: false,
      stage2RuntimeAudit: 'pass',
      stage2OutputValidator: 'pass',
      stage2SemanticOracle: 'pass',
      stage2BlockingOutcome: 'Login/Auth Failure',
      stage2WorkspaceMutation: false,
      postApplicationCandidateTreeMatched: true,
      postApplicationInstalledTreeMatched: true,
      postApplicationEntrypointMatched: true,
      sensitiveIdentifierMatches: 0,
      gitDiffCheck: 'pass',
      stagingArea: 'empty',
    });
    expect(plan).toContain('Candidate 15 remains closed `No-Go`');
    expect(plan).toContain('The wording is generic');
    expect(plan).toContain('A historical probe is not reused as Candidate 16 evidence');
    expect(plan).toContain('probe passed on 2026-09-08');
    expect(plan).toContain('not Review-quality evidence');
    expect(plan).toContain('separately authorized run passed on 2026-09-08');
    expect(plan).toContain('F-002 ignored-timeout-contract` as the required `Risk`');
    expect(plan).toContain('separately authorized Deep run passed on 2026-09-08');
    expect(plan).toContain('canonical `Login/Auth Failure`');
    expect(plan).toContain('bounded candidate is `Go`');
    expect(plan).toContain('exact bounded delta was applied');
    expect(plan).toContain('one evaluation-only Risk');
    expect(plan).toContain('normalizes both the logical and real workspace paths');
    expect(plan).toContain('staging area remains empty');
    expect(probe).toMatchObject({
      authorization: {
        sourceFreeProbeAuthorized: true,
        sourceFreeExternalRequestsExecuted: 1,
        sourceBearingAuthorized: false,
      },
      probe: {
        finalAssistantResponseExact: true,
        readToolCallsStarted: 1,
        readToolCallsCompleted: 1,
        readPath: 'probe.txt',
        shellCalls: 0,
        mcpCalls: 0,
        workspaceMutationObserved: false,
        retryExecuted: false,
        replacementExecuted: false,
        modeSwitchExecuted: false,
      },
      audit: {
        valid: true,
        violations: [],
      },
      transferPolicy: {
        externalModelRequests: 1,
        sourceTransmitted: false,
        privateSourceTransmitted: false,
        credentialContentsReadOrRecordedByEvaluator: false,
      },
      decision: {
        sourceFreeProbe: 'Pass',
        sourceBearing: 'Not authorized',
      },
    });
    const stage1 = JSON.parse(
      readText(
        'evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-16-stage-1-result.json',
      ),
    ) as {
      decision: Record<string, string>;
      outputValidator: Record<string, boolean | number | string | unknown[]>;
      pathSafety: Record<string, boolean | number | string>;
      run: { findingSeverities: string[] };
      semanticOracle: Record<string, boolean | unknown[]>;
      transferPolicy: Record<string, boolean | number | string>;
    };
    expect(stage1).toMatchObject({
      run: {
        findingSeverities: ['Risk', 'Risk'],
      },
      pathSafety: {
        valid: true,
        workspaceRelativeReadPaths: '10/10',
        workspaceRelativeGrepPaths: '2/2',
        forbiddenPathForms: 0,
        outsideWorkspaceReads: 0,
        failedToolCalls: 0,
        toolCallsAfterFailure: 0,
      },
      outputValidator: {
        valid: true,
        coverageLedgerEntries: 2,
      },
      semanticOracle: {
        valid: true,
        accountCacheKeyCollisionSeverityAllowed: true,
        ignoredTimeoutContractSeverityValid: true,
        errors: [],
      },
      transferPolicy: {
        externalModelRequests: 1,
        sourceTransmitted: true,
        privateSourceTransmitted: false,
        oracleTransmitted: false,
      },
      decision: {
        run: 'Pass',
        candidate: 'Continue',
      },
    });
    const stage2 = JSON.parse(
      readText(
        'evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-16-stage-2-result.json',
      ),
    ) as {
      decision: Record<string, string>;
      outputValidator: Record<string, boolean | number | string | unknown[]>;
      pathSafety: Record<string, boolean | number | string>;
      run: Record<string, boolean | number | string | string[]>;
      semanticOracle: Record<string, boolean | string | unknown[] | Record<string, unknown>>;
      transferPolicy: Record<string, boolean | number | string>;
    };
    expect(stage2).toMatchObject({
      run: {
        findingIds: ['F-001'],
        findingSeverities: ['Blocking'],
        blockingOutcomes: ['Login/Auth Failure'],
        designDecision: 'Simplify',
        recommendation: '修改后可以进入下一步',
      },
      pathSafety: {
        valid: true,
        workspaceRelativeReadPaths: '9/9',
        workspaceRelativeGlobPatterns: '2/2',
        workspaceRelativeGrepPaths: '2/2',
        forbiddenPathForms: 0,
        outsideWorkspaceReads: 0,
        failedToolCalls: 0,
        toolCallsAfterFailure: 0,
      },
      outputValidator: {
        valid: true,
        blockingFindingCount: 1,
        coverageLedgerEntries: 7,
      },
      semanticOracle: {
        valid: true,
        severityContractValid: true,
        blockingOutcomeValid: true,
        blockingOutcome: 'Login/Auth Failure',
        designDecisionValid: true,
        repeatedFindingMergeKeyConsistent: true,
        errors: [],
      },
      transferPolicy: {
        externalModelRequests: 1,
        sourceTransmitted: true,
        privateSourceTransmitted: false,
        oracleTransmitted: false,
      },
      decision: {
        run: 'Pass',
        candidate: 'Go',
      },
    });
    expect(packageJson.scripts['evaluation:prepare-grouped-candidate-16']).toBe(
      'node scripts/prepare-grouped-ledger-candidate-16.mjs',
    );
  });
});
