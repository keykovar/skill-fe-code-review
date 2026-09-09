import { describe, expect, test } from 'vitest';

import { readText } from './test-utils';

describe('v0.5.0 release acceptance records', () => {
  test('retains the invalid control and promotes only the replacement Fix result', () => {
    const result = JSON.parse(
      readText('evaluation/runtime-windows/v0.5.0-current-tree-fix-acceptance-result.json'),
    ) as Record<string, any>;
    const resultsDocument = readText('docs/evaluation-results/v0.5.0-candidate.md');
    const packageJson = JSON.parse(readText('package.json')) as {
      scripts: Record<string, string>;
    };

    expect(result).toMatchObject({
      status: 'pass-after-retained-unscored-control-conflict',
      skill: {
        treeSha256: '148cf6ebae8c5cba674f5fe0fe9f1399f405287b5057d815867662faa1721480',
        fileCount: 12,
      },
      attempt01: {
        decision: 'Cannot Score',
        semanticOracle: 'pass-but-not-promoted',
        workspaceUnchanged: true,
      },
      attempt02: {
        decision: 'Pass',
        prompt: {
          previousFindingsException: '.evaluation/previous-findings.md only',
        },
        run: {
          toolCalls: 13,
          shellCalls: 0,
          mcpCalls: 0,
          failedToolCalls: 0,
          outsideWorkspaceReads: 0,
          workspaceMutationObserved: false,
        },
        runtimeAudit: {
          valid: true,
          violations: [],
          workspaceStatusUnchanged: true,
        },
        outputValidator: {
          mode: 'fix',
          valid: true,
          findingIds: ['F-001', 'F-002', 'F-003'],
        },
        semanticOracle: {
          valid: true,
          newRegression: 'none',
          recommendation: '可以关闭',
          fullDeepReviewExpansionObserved: false,
          errors: [],
        },
      },
      transferPolicy: {
        externalModelRequests: 2,
        scoredSourceBearingRequests: 1,
        unscoredSourceBearingRequests: 1,
        privateSourceTransmitted: false,
        oracleTransmitted: false,
      },
      decision: {
        currentTreeFixGate: 'Pass',
        releaseCandidate: 'Continue',
      },
    });
    expect(result.attempt02.semanticOracle.findingStatuses).toEqual({
      'F-001': { originalSeverity: 'Blocking', status: 'Resolved' },
      'F-002': { originalSeverity: 'Blocking', status: 'Resolved' },
      'F-003': { originalSeverity: 'Risk', status: 'Resolved' },
    });
    expect(resultsDocument).toContain('Status: published stable release');
    expect(resultsDocument).toContain('retained as `Cannot Score`');
    expect(resultsDocument).toContain('Exact-current-tree source-free, Quick, Deep, and Fix gates pass');
    expect(packageJson.scripts['evaluation:prepare-v0.5.0-release-acceptance']).toBe(
      'node scripts/prepare-v0.5.0-release-acceptance.mjs',
    );
  });
});
