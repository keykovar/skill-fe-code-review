import { adjudicateOriginOccurrenceCandidate, evaluateOriginOccurrenceReport } from './adjudicate-origin-occurrence-candidate.mjs';

// Assignments are evaluator declarations after evidence inspection, never guesses from ratios or label wording.
export function evaluateGroupedOriginOccurrenceReport(markdown, mode, oracle, assignments) {
  const positional = evaluateOriginOccurrenceReport(markdown, mode, oracle);
  const keys = oracle.groupKeys;
  if (!Array.isArray(keys) || keys.length !== oracle.states.length || keys.some((groups, index) =>
    !Array.isArray(groups) || groups.length !== oracle.states[index].length ||
    groups.some((key) => typeof key !== 'string' || !key.trim()) || new Set(groups).size !== groups.length)) {
    throw new TypeError('Grouped oracle requires one distinct, non-empty key per expected group in each finding.');
  }
  const common = {
    candidate: positional.candidate,
    positionalAdjudication: positional.adjudication,
    evaluatedScope: 'origin-reproduction-fields-with-declared-group-mapping-only',
    limitation: 'Assignments must be verified against source records by the evaluator. This function checks complete, non-overlapping group coverage and field values, not evidence meaning, observation provenance, severity, closure or full-report acceptance.',
  };
  if (!positional.candidate.structurallyValid || positional.candidate.findings.length !== keys.length ||
    positional.candidate.findings.some((finding, index) => finding.reproduction.length < keys[index].length)) {
    return { ...common, groupAlignment: 'Not Applied', adjudication: positional.adjudication };
  }
  if (!Array.isArray(assignments) || assignments.length !== keys.length) {
    throw new TypeError('An explicit evaluator group assignment is required for every finding.');
  }
  const findings = positional.candidate.findings.map((finding, index) => {
    const mapping = assignments[index];
    if (!mapping || typeof mapping !== 'object' || Array.isArray(mapping) ||
      Object.keys(mapping).length !== keys[index].length || keys[index].some((key) => !Object.hasOwn(mapping, key))) {
      throw new TypeError('Group assignments must name exactly the expected keys for their finding.');
    }
    const partitions = keys[index].map((key) => mapping[key]);
    if (partitions.some((labels) => !Array.isArray(labels) || labels.length === 0)) {
      throw new TypeError('Each expected group requires a non-empty list of report contexts.');
    }
    const labels = partitions.flat();
    if (labels.length !== finding.reproduction.length ||
      labels.some((label) => label !== null && (typeof label !== 'string' || !label.trim())) ||
      new Set(labels).size !== labels.length) {
      throw new TypeError('Each report context must be assigned exactly once.');
    }
    const reproduction = partitions.map((contexts) => {
      const groups = contexts.map((label) => {
        const matches = finding.reproduction.filter((group) => group.context === label);
        if (matches.length !== 1) throw new TypeError('An assigned context must identify exactly one reported group.');
        return matches[0];
      });
      if (groups.length === 1) return groups[0];
      if (groups.some((group) => group.state !== 'Observed' || !group.count)) {
        throw new TypeError('Only Observed subgroups with evidence of the same conditions may be combined.');
      }
      const count = groups.reduce((total, group) => ({
        failures: total.failures + group.count.failures,
        trials: total.trials + group.count.trials,
      }), { failures: 0, trials: 0 });
      if (!Number.isSafeInteger(count.failures) || !Number.isSafeInteger(count.trials)) {
        throw new TypeError('Combined observation counts must remain safe integers.');
      }
      return { ...groups[0], count };
    });
    return { ...finding, reproduction };
  });
  return {
    ...common,
    groupAlignment: 'Applied',
    adjudication: adjudicateOriginOccurrenceCandidate({ ...positional.candidate, findings }, oracle),
  };
}
