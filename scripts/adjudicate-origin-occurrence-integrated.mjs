import { adjudicateOriginOccurrenceCandidate } from './adjudicate-origin-occurrence-candidate.mjs';
import { validateOriginOccurrenceIntegrated } from './validate-origin-occurrence-integrated.mjs';

// Unlike the frozen grouping-04 wrapper, align the already validated candidate; never reparse via the old entry.
function alignGroups(candidate, oracle, assignments) {
  const keys = oracle.groupKeys;
  if (!Array.isArray(keys) || keys.length !== oracle.states.length || keys.some((groups, index) =>
    !Array.isArray(groups) || groups.length !== oracle.states[index].length ||
    groups.some((key) => typeof key !== 'string' || !key.trim()) || new Set(groups).size !== groups.length)) {
    throw new TypeError('Grouped oracle requires one distinct, non-empty key per expected group in each finding.');
  }
  if (!candidate.structurallyValid || candidate.findings.length !== keys.length ||
    candidate.findings.some((finding, index) => finding.reproduction.length < keys[index].length)) return null;
  if (!Array.isArray(assignments) || assignments.length !== keys.length) {
    throw new TypeError('An explicit evaluator group assignment is required for every finding.');
  }
  const findings = candidate.findings.map((finding, index) => {
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
      new Set(labels).size !== labels.length) throw new TypeError('Each report context must be assigned exactly once.');
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
        failures: total.failures + group.count.failures, trials: total.trials + group.count.trials,
      }), { failures: 0, trials: 0 });
      if (!Number.isSafeInteger(count.failures) || !Number.isSafeInteger(count.trials)) {
        throw new TypeError('Combined observation counts must remain safe integers.');
      }
      return { ...groups[0], count };
    });
    return { ...finding, reproduction };
  });
  return { ...candidate, findings };
}

export function evaluateIntegratedOriginOccurrenceReport(markdown, mode, oracle, options = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options) ||
    Object.keys(options).some((key) => !['sourceRoot', 'assignments'].includes(key))) {
    throw new TypeError('Only sourceRoot and explicit evaluator assignments are supported.');
  }
  const validation = validateOriginOccurrenceIntegrated(markdown, mode, { sourceRoot: options.sourceRoot });
  const positionalAdjudication = adjudicateOriginOccurrenceCandidate(validation.candidate, oracle);
  let aligned = null;
  if (oracle.groupKeys !== undefined) aligned = alignGroups(validation.candidate, oracle, options.assignments);
  else if (options.assignments !== undefined) throw new TypeError('Group assignments require an explicit grouped oracle.');
  return {
    ...validation, positionalAdjudication,
    groupAlignment: oracle.groupKeys === undefined ? 'Not Applicable' : aligned ? 'Applied' : 'Not Applied',
    adjudication: aligned ? adjudicateOriginOccurrenceCandidate(aligned, oracle) : positionalAdjudication,
    evidenceLimitation: 'Group assignments are evaluator declarations after inspection of source records; no group is guessed from labels or ratios. This is field-only adjudication, not complete report acceptance.',
  };
}
