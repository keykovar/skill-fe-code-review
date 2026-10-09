import crypto from 'node:crypto';
import { describe, expect, test } from 'vitest';

import { evaluateOriginOccurrenceReport } from '../scripts/adjudicate-origin-occurrence-candidate.mjs';
import { evaluateGroupedOriginOccurrenceReport } from '../scripts/adjudicate-origin-occurrence-groups.mjs';
import { applyResponses } from '../evaluation/prototypes/origin-occurrence/source-cases.mjs';
import { readText } from './test-utils';

const matrix = JSON.parse(readText('evaluation/prototypes/origin-occurrence/cases.json'));
const revision = JSON.parse(readText('evaluation/prototypes/origin-occurrence/grouping-04.json'));
const originalCase = (id: string) => matrix.cases.find((item: { id: string }) => item.id === id);
const assignment = [{ 'order-2-1': ['reverse'], 'order-1-2': ['forward'] }];

// Authored field-parser reports, not model output or full-report acceptance fixtures.
function report(reproduction: string) {
  return `## Overall Conclusion
Fix before submit.
## Review Scope
Public synthetic response snapshots only; no reviewer execution.
## Changed-Condition Coverage
- [current/responses.mjs:3] response handling: maximum revision -> last revision; Disposition: [F-001]
## Blocking
No clear issue.
## Risk
- [F-001] [current/responses.mjs:3] Older response replaces the newer revision
  - Trigger: responses complete in reverse revision order.
  - Impact: displayed revision returns to 1 instead of retaining 2.
  - Root cause: unconditional assignment removes the maximum-revision guard.
  - Suggested fix: restore Math.max in the existing owner.
  - Verification: check both supplied response orders after repair.
  - Origin: New - the comparison baseline kept the maximum revision.
  - Reproduction: ${reproduction}
## Improve
No clear issue.
## Design / Simplify
Simplify [F-001]: restore the existing guard.
## Naming / Readability
No clear issue.
## File Placement / Module Boundary
No clear issue.
## Test Gaps
No repaired-snapshot observations supplied.
## Evidence
Supplied local Node observations; setup failures are not completed trials. Not production probability.
## Final Recommendation
Fix before submit.
`;
}

function fields(id: string) {
  const definition = revision.cases[id];
  return definition.groups.map((group: { key: string; order: number[]; trialIndexes: number[] }, index: number) => {
    const [failures, trials] = definition.oracle.counts[index];
    const label = group.key === 'order-2-1' ? 'reverse' : 'forward';
    return `[${label}] Observed - ${failures}/${trials} completed trials failed; supplied ${definition.sourceObservationGroup} records ${group.trialIndexes.join(', ')}, local Node, unguarded-current, initial revision 0, order ${JSON.stringify(group.order)}.`;
  });
}

describe('grouping-04 separate observation contract', () => {
  test('pins the unchanged matrix and frozen status-03 instructions, with only two oracle overrides', () => {
    const hash = (text: string) => crypto.createHash('sha256').update(text).digest('hex');
    expect(hash(readText('evaluation/prototypes/origin-occurrence/cases.json'))).toBe(revision.baseMatrixSha256);
    expect(hash(readText('evaluation/prototypes/origin-occurrence/snapshots/status-03-SKILL.md')))
      .toBe(revision.candidateSkillSha256);
    expect(Object.keys(revision.cases)).toEqual(['O-06', 'O-08']);
    expect(revision.modelInvocations).toBe(0);
  });

  test.each(['O-06', 'O-08'])('%s corrected groups partition the completed raw trials and agree with source replay', (id) => {
    const definition = revision.cases[id];
    const observations = matrix.observationGroups[definition.sourceObservationGroup];
    expect(originalCase(id).input.observations).toBe(definition.sourceObservationGroup);
    const completedIndexes: number[] = [];
    const invalidIndexes: number[] = [];
    observations.trials.forEach((trial: any, index: number) => (trial.completed ? completedIndexes : invalidIndexes).push(index));
    const covered = definition.groups.flatMap((group: any) => group.trialIndexes);
    expect([...covered].sort()).toEqual(completedIndexes);
    expect(new Set(covered).size).toBe(covered.length);
    expect(definition.invalidTrialIndexes).toEqual(invalidIndexes);
    const counts = definition.groups.map((group: any) => {
      const outcomes = group.trialIndexes.map((index: number) => {
        const trial = observations.trials[index];
        expect(trial.completed).toBe(true);
        expect(trial.order).toEqual(group.order);
        const failed = applyResponses(trial.order) !== 2;
        expect(trial.outcome).toBe(failed ? 'failure' : 'success');
        return failed;
      });
      return [outcomes.filter(Boolean).length, outcomes.length];
    });
    expect(counts).toEqual(definition.oracle.counts);
    expect(definition.oracle.groupKeys).toEqual([definition.groups.map((group: any) => group.key)]);
    expect(definition.oracle.origins).toEqual(originalCase(id).oracle.origins);
    expect(definition.oracle.recommendation).toBe(originalCase(id).oracle.recommendation);
    if (id === 'O-08') expect(definition.oracle.invalidAttempts).toBe(invalidIndexes.length);
  });

  test.each(['O-06', 'O-08'])('%s split report keeps the old field failure and passes only the explicit new oracle', (id) => {
    const markdown = report(fields(id).join(' | '));
    const oldResult = evaluateOriginOccurrenceReport(markdown, 'quick', originalCase(id).oracle);
    expect(oldResult.candidate.structurallyValid).toBe(true);
    expect(oldResult.adjudication.status).toBe('Fail');
    const current = evaluateGroupedOriginOccurrenceReport(markdown, 'quick', revision.cases[id].oracle, assignment);
    expect(current.groupAlignment).toBe('Applied');
    expect(current.adjudication.status).toBe('Pass');
    expect(current.adjudication.reportAcceptance).toBe('Not Evaluated');
    expect(current.candidate.semanticStatus).toBe('Not Evaluated');
  });

  test.each(['O-06', 'O-08'])('%s rejects pooled counts even when the aggregate arithmetic is correct', (id) => {
    const pooled = originalCase(id).findings[0].reproduction;
    expect(evaluateOriginOccurrenceReport(report(pooled), 'quick', originalCase(id).oracle).adjudication.status).toBe('Pass');
    const current = evaluateGroupedOriginOccurrenceReport(report(pooled), 'quick', revision.cases[id].oracle, assignment);
    expect(current.candidate.structurallyValid).toBe(true);
    expect(current.groupAlignment).toBe('Not Applied');
    expect(current.adjudication.status).toBe('Fail');
  });

  test('combines separately reported identical O-06 trials only with explicit evidence mapping', () => {
    const parts = fields('O-06');
    const split = `${parts[0].replace('2/2', '1/1').replace('records 0, 2', 'record 0')} | ${parts[1]} | ${parts[0].replace('[reverse]', '[reverse-again]').replace('2/2', '1/1').replace('records 0, 2', 'record 2')}`;
    const mapping = [{ 'order-2-1': ['reverse', 'reverse-again'], 'order-1-2': ['forward'] }];
    const result = evaluateGroupedOriginOccurrenceReport(report(split), 'quick', revision.cases['O-06'].oracle, mapping);
    expect(result.positionalAdjudication.status).toBe('Fail');
    expect(result.adjudication.status).toBe('Pass');
    expect(result.adjudication.actual.observationCounts).toEqual([[2, 2], [0, 1]]);
    expect(result.candidate.findings[0].reproduction).toHaveLength(3);
    expect(() => evaluateGroupedOriginOccurrenceReport(report(split), 'quick', revision.cases['O-06'].oracle, assignment)).toThrow(TypeError);
  });

  test('keeps O-07 zero failures and O-09 pre/post oracles unchanged', () => {
    const zero = originalCase('O-07');
    expect(evaluateOriginOccurrenceReport(report(zero.findings[0].reproduction), 'quick', zero.oracle).adjudication.status).toBe('Pass');
    const fix = readText('evaluation/prototypes/origin-occurrence/examples/fix.en.md');
    const examples = JSON.parse(readText('evaluation/prototypes/origin-occurrence/examples/oracles.json'));
    expect(evaluateOriginOccurrenceReport(fix, 'fix', examples.examples['fix.en.md'].oracle).adjudication.status).toBe('Pass');
    expect(originalCase('O-09').oracle.counts).toEqual([[1, 1], [0, 1]]);
  });
});

describe('explicit evaluator group alignment', () => {
  test.each(['O-06', 'O-08'])('%s accepts changed labels and output order only through an explicit mapping', (id) => {
    const parts = fields(id).reverse().map((part) => part.replace('[reverse]', '[older-last]').replace('[forward]', '[newer-last]'));
    const input = report(parts.join(' | '));
    const mapping = [{ 'order-2-1': ['older-last'], 'order-1-2': ['newer-last'] }];
    const oracle = structuredClone(revision.cases[id].oracle);
    const before = JSON.stringify({ input, oracle, mapping });
    const result = evaluateGroupedOriginOccurrenceReport(input, 'quick', oracle, mapping);
    expect(result.positionalAdjudication.status).toBe('Fail');
    expect(result.adjudication.status).toBe('Pass');
    expect(result.candidate.findings[0].reproduction.map((group: any) => group.context)).toEqual(['newer-last', 'older-last']);
    expect(JSON.stringify({ input, oracle, mapping })).toBe(before);
  });

  test('rejects counts swapped across groups rather than sorting or summing equal ratios', () => {
    const parts = fields('O-08');
    const input = report([parts[0].replace('1/1', '0/1'), parts[1].replace('0/1', '1/1')].join(' | '));
    const result = evaluateGroupedOriginOccurrenceReport(input, 'quick', revision.cases['O-08'].oracle, assignment);
    expect(result.candidate.structurallyValid).toBe(true);
    expect(result.adjudication.checks.observationCounts).toBe(false);
  });

  test.each([
    ['setup failure counted as success', (parts: string[]) => [parts[0].replace('1/1', '1/2'), parts[1]].join(' | ')],
    ['setup failure counted as failure', (parts: string[]) => [parts[0].replace('1/1', '2/2'), parts[1]].join(' | ')],
    ['zero-failure group omitted', (parts: string[]) => parts[0]],
    ['completed record duplicated', (parts: string[]) => [parts[0], parts[1].replace('0/1', '0/2')].join(' | ')],
    ['duplicate group labels', (parts: string[]) => parts.join(' | ').replace('[forward]', '[reverse]')],
    ['fabricated percentage', (parts: string[]) => parts.join(' | ') + ' production probability 50%'],
  ])('rejects %s', (_, mutate) => {
    const result = evaluateGroupedOriginOccurrenceReport(report(mutate(fields('O-08'))), 'quick', revision.cases['O-08'].oracle, assignment);
    expect(result.adjudication.status).toBe('Fail');
  });

  test.each([
    undefined,
    [],
    [{}],
    [{ 'order-2-1': ['reverse'] }],
    [{ 'order-2-1': ['reverse'], 'order-1-2': ['reverse'] }],
    [{ 'order-2-1': ['reverse'], 'order-1-2': ['missing'] }],
    [{ 'order-2-1': ['reverse'], 'order-1-2': ['forward'], extra: ['forward'] }],
    [{ 'order-2-1': [1], 'order-1-2': ['forward'] }],
    [{ 'order-2-1': 'reverse', 'order-1-2': ['forward'] }],
    [{ 'order-2-1': [], 'order-1-2': ['reverse', 'forward'] }],
  ].map((mapping) => ({ mapping })))('refuses missing or invalid mapping $mapping instead of guessing', ({ mapping }) => {
    expect(() => evaluateGroupedOriginOccurrenceReport(report(fields('O-08').join(' | ')), 'quick', revision.cases['O-08'].oracle, mapping))
      .toThrow(TypeError);
  });

  test.each([undefined, [], [['same', 'same']], [['one']], [['', 'two']]].map((groupKeys) => ({ groupKeys })))('rejects malformed oracle keys $groupKeys', ({ groupKeys }) => {
    const oracle = { ...revision.cases['O-08'].oracle, groupKeys };
    expect(() => evaluateGroupedOriginOccurrenceReport(report(fields('O-08').join(' | ')), 'quick', oracle, assignment))
      .toThrow(TypeError);
  });

  test.each(revision.groupingContract.separateBy)('keeps different %s groups distinct under the declared evidence mapping', (axis) => {
    const oracle = { origins: ['New'], states: [['Observed', 'Observed']], counts: [[1, 1], [0, 1]], groupKeys: [['before', 'after']] };
    const parts = [`[a] Observed - 1/1 supplied Node scenario failed with ${axis}=A.`, `[b] Observed - 0/1 supplied Node scenario failed with ${axis}=B.`];
    const mapping = [{ before: ['a'], after: ['b'] }];
    expect(evaluateGroupedOriginOccurrenceReport(report(parts.join(' | ')), 'quick', oracle, mapping).adjudication.status).toBe('Pass');
    expect(evaluateGroupedOriginOccurrenceReport(report('Observed - 1/2 supplied scenarios failed across both contexts.'), 'quick', oracle, mapping)
      .adjudication.status).toBe('Fail');
  });

  test('does not fold a missing observation into an Observed group', () => {
    const oracle = { origins: ['New'], states: [['Observed']], counts: [[1, 1]], groupKeys: [['scenario']] };
    const input = report('[a] Observed - 1/1 supplied Node scenario failed. | [b] Cannot Verify - the equivalent environment is unavailable.');
    expect(() => evaluateGroupedOriginOccurrenceReport(input, 'quick', oracle, [{ scenario: ['a', 'b'] }]))
      .toThrow(/Only Observed/u);
  });

  test('rejects overflow while combining individually valid counts', () => {
    const oracle = { origins: ['New'], states: [['Observed']], counts: [[1, 1]], groupKeys: [['scenario']] };
    const input = report(`[a] Observed - 0/${Number.MAX_SAFE_INTEGER} supplied Node trials failed. | [b] Observed - 1/1 supplied Node trial failed.`);
    expect(() => evaluateGroupedOriginOccurrenceReport(input, 'quick', oracle, [{ scenario: ['a', 'b'] }]))
      .toThrow(/safe integers/u);
  });

  test('preserves mixed observation states and unnamed single-group syntax without adding counts', () => {
    const mixed = { origins: ['New'], states: [['Observed', 'Cannot Verify']], counts: [[1, 1]], groupKeys: [['before', 'after']] };
    const input = report('[pre] Observed - 1/1 supplied Node scenario failed. | [post] Cannot Verify - the equivalent environment is unavailable.');
    expect(evaluateGroupedOriginOccurrenceReport(input, 'quick', mixed, [{ before: ['pre'], after: ['post'] }])
      .adjudication.status).toBe('Pass');
    const single = { origins: ['New'], states: [['Observed']], counts: [[0, 3]], groupKeys: [['normal']] };
    expect(evaluateGroupedOriginOccurrenceReport(report(originalCase('O-07').findings[0].reproduction), 'quick', single, [{ normal: [null] }])
      .adjudication.status).toBe('Pass');
  });

  test('does not claim provenance verification when an evaluator supplies a wrong mapping', () => {
    const parts = fields('O-08');
    const wrongCounts = report([parts[0].replace('1/1', '0/1'), parts[1].replace('0/1', '1/1')].join(' | '));
    const wrongMapping = [{ 'order-2-1': ['forward'], 'order-1-2': ['reverse'] }];
    const result = evaluateGroupedOriginOccurrenceReport(wrongCounts, 'quick', revision.cases['O-08'].oracle, wrongMapping);
    expect(result.adjudication.status).toBe('Pass');
    expect(result.adjudication.reportAcceptance).toBe('Not Evaluated');
    expect(result.limitation).toContain('not evidence meaning');
  });
});
