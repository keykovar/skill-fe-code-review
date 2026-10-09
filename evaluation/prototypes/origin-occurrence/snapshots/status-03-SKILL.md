---
name: fe-code-review-origin-candidate
description: Candidate-only extension for fe-code-review that records evidence-backed problem origin and reproduction observations; not installed or release-ready.
---

# Frontend Code Review Origin Candidate

This is an evaluator-only v0.6.0 candidate. Use it only with the selected Quick, Deep, or Fix Review mode and the existing `fe-code-review` Skill. It does not authorize source transfer, external model calls, writes, browser automation, configuration reads, commits, or releases.

## Output Extension

Keep the stable mode template, finding IDs, severity, read-only boundary, recommendation matrix, changed-condition coverage grammar, and Fix closure statuses unchanged. Add exactly two nested fields to every reported Finding or Fix Issue Verification item, one Origin and one Reproduction:

```md
- 问题来源 / Origin：New / Amplified / Retained / Unknown - evidence relative to the declared comparison baseline.
- 复现观测 / Reproduction：Observed / Not Run / Cannot Verify / Not Applicable - evidence and limits.
```

Use the same state in English or Chinese labels, with substantive evidence after it. Do not add fields to coverage-ledger lines or no-finding sections. A field parser passing is not semantic validation.

## Origin

Compare against the frozen requested baseline. Use `New` only when the defect is absent in that baseline and introduced by the change; `Amplified` when an existing defect gains concrete reachable exposure; `Retained` when the same material defect remains in the affected scope; and `Unknown` when the baseline or causal comparison is unavailable. Changed line age, relocation, a new test, or a newly observed error is not enough to claim New.

For Fix Review, preserve the previous Finding's original origin relative to the original review baseline. Evaluate New Regression origin relative to the fix baseline, allowing only New or Amplified. Do not fabricate IDs or origin history for legacy prose reports. Missing original attribution means Unknown; assess closure separately against the supplied acceptance criteria, not against the certainty of that attribution.

## Reproduction

Use `Observed` only with one valid `n/N` count per explicitly labeled observation group, where `0 <= n <= N`, `N > 0`, both are safe integers, the unit and environment are stated, and every trial is completed. Exclude setup failures and interrupted attempts from the denominator and report them as limitations. `Not Run`, `Cannot Verify`, and `Not Applicable` must not include counts.

Keep Reproduction on one nested bullet and one line. A single group may use `State - evidence`. Multiple groups must use `[unique-label] State - evidence | [other-label] State - evidence`: put a distinct evidence-backed label in brackets, repeat the state in every group, and separate groups with literal ` | `. Do not use prose headings or semicolons as group separators, or place multiple counts under one shared state.

Choose one of these format templates. Replace labels, count placeholders and evidence descriptions with supported data; the templates are not observations:

```text
  - Reproduction: Observed - n/N failures; environment, revision, completed-trial unit and evidence record.
  - Reproduction: [group-a] Observed - a/A failures; group-specific environment, revision, unit and record. | [group-b] Observed - b/B failures; group-specific environment, revision, unit and record.
  - Reproduction: [group-a] Observed - a/A failures; group-specific environment, revision, unit and record. | [group-b] Cannot Verify - required equivalent environment is unavailable; identify the missing evidence.
```

Use `Not Run` when no usable execution observation exists, `Cannot Verify` when required runtime evidence cannot be completed or matched, and `Not Applicable` for maintenance-only issues with no meaningful trial count. Keep pre-fix observations and post-fix verification separate. Do not run extra checks just to fill a count; existing authorization and mode budgets remain controlling. A zero-failure sample alone does not establish closure.

Never call a sample ratio a production probability. Keep revisions, browsers, inputs, reset state, and concurrency schedules in separate groups. A restrictive but evidenced trigger remains reportable even when its sample count is low or zero; contradictory evidence must narrow or withdraw the causal claim.

## Final Check

For Fix Review, fill all five conclusion tallies with non-negative integers: Resolved, Partially Resolved, Unresolved, Cannot Verify, and New Regression. Use `0` for an empty category; IDs or words such as `none` do not replace a count. Derive the four closure totals from the previous findings and count new regressions separately, then reconcile them with the final recommendation.

Before responding, verify field count, state, evidence, count grammar, group delimiters, baseline wording, Fix status consistency, existing output contract, and the distinction between structural parsing and semantic adjudication. Name missing evidence using the relevant field's state above; do not automatically turn Unknown origin or Not Run reproduction into a Cannot Verify closure. Do not invent a trial or expand the selected review mode.

Finish at the final recommendation. Remove accidental trailing fragments unrelated to the report while preserving legitimate evidence, identifiers, code and bilingual labels. This is a check of the drafted response, not permission to run tools or add another review pass.
