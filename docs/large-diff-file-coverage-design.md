# Large-diff File Coverage Design

## Status

2026-10-09: design, the evaluator-only inventory/accounting prototype, isolated
inventory-only collector and Quick/Deep Skill/report candidates are complete locally. The first
[prototype passed 137/137 checks](evaluation-results/large-diff-file-coverage-prototype.md);
the [collector candidate passes 155/155](evaluation-results/large-diff-inventory-collector-candidate.md).
The [Skill/report candidate passes 226 related tests](evaluation-results/large-diff-file-coverage-skill-candidate.md)
and both Skill shape validators, with failures retained. Actual model behavior
and end-to-end cost remain unverified.
Published stable remains v0.6.0. No installed Skill, collector, public output
validator, example, dependency, or client behavior changes in this step. No
release version or runtime evaluation window is assigned.

2026-10-12: [offline runtime-comparison materials are prepared](evaluation-results/large-diff-file-coverage-runtime-preparation.md)
for three public-synthetic Quick/Deep/Fix pairs. Independent answers and cost
gates are frozen outside reviewer packets; 72 relevant checks pass. All model
runs remain Not Run. This is packet behavior preparation, not a live collector
or large-volume performance result. The candidate and installed Skill are unchanged.

The [roadmap](roadmap.md#current-next-steps) already lists large-diff file
coverage as deferred behavior work. This design makes that item actionable.
The gap below is established by inspecting the current contract; it is not
evidence that a measured real review omitted a file or that this proposal
improves model accuracy.

## Existing Contract And Gap

The [Skill](../skills/fe-code-review/SKILL.md) freezes the requested inventory,
compares the baseline and change, and accounts for changed conditions. The
Quick and Deep `Changed-Condition Coverage` sections describe behavior, not
which changed files received enough examination. A report can enumerate the
changed paths without making its unreviewed files explicit.

The [collector](../skills/fe-code-review/scripts/collect-review-context.mjs)
supports all-uncommitted scope only. It prints staged and unstaged patches
alongside line-based Git inventory, with a 50 MiB per-command buffer. A command
failure rejects the result, but successful collection does not establish that
the client received an untruncated result or that the model reviewed it.

Keep file accounting separate from behavior accounting and from runtime test
coverage. Reading a file, finding a defect, and completing its relevant review
are different claims.

## Scope And Mode Boundaries

- Quick and Deep receive one compact file-coverage summary inside their existing
  scope section. No new top-level section, severity, or mandatory JSON report.
- Keep the full path-to-status map internally. Expand visible details for every
  incomplete item; show the full map only on request or when needed to explain
  review batches. The first candidate validator covers the default compact form.
  Do not repeat findings or changed-condition entries there.
- Do not choose a universal file/line threshold for a "large" change. Split
  reads when the available output/context cannot carry the needed material or
  when independent affected owners make separate groups useful. Small complete
  changes keep the one-line summary.
- Fix keeps its current template, focused diff/caller budget, closure statuses,
  and prohibition on a Coverage ledger. Record missing evidence in its existing
  scope/evidence fields. Do not audit unrelated files to fill this new summary.
- Preserve read-only operation, automatic invocation, language selection,
  Finding IDs, Origin, Reproduction, severity proof, and recommendation rules.
  Do not move essential rules into an optionally loaded reference.
- Reviewer output stays in chat. This feature does not authorize writing a
  report, running source/tests, installing dependencies, or sending source.

## Inventory And Counting

Freeze the requested comparison first, then obtain one complete inventory for
that comparison. Reuse it throughout the review. A complete inventory means
complete file enumeration, not complete source or behavior verification.

| Case | Counting rule |
| --- | --- |
| Changed tracked path | One entry for the path in the target tree |
| Staged and unstaged changes to the same path | One file entry with both layers retained; completing only one layer is insufficient |
| Rename | One entry with both old and new names; deletion plus an unrelated addition must not be merged just because content resembles it |
| Deletion | One entry under its old path; inspect the removed contract and affected references where applicable |
| Untracked path | Include when it belongs to the selected all-uncommitted scope; reading it does not make it part of a commit |
| Explicit staged/commit/range/PR/path scope | Count only that scope; never use the all-uncommitted collector as a shortcut |
| Supporting unchanged caller or test | Record as evidence, outside the changed-file denominator |
| Supplied source packet | Count against its declared manifest and baseline; do not claim a complete repository inventory |

Use exact repository-relative names. Machine inventory uses NUL-delimited Git
records, not whitespace, lines, or diff-header guessing. Preserve case and
rename pairs. Rendering may escape an unusual name, but must not change its
identity or follow a path/symlink outside the authorized source boundary.

An ambiguous rename across index/worktree layers, missing comparison, failed
enumeration, truncated inventory, or observed source mutation makes inventory
`Incomplete` until resolved. Report known entries as a lower bound, never as
the total, and never claim full coverage. Do not re-inventory merely to increase
confidence; reconcile only a concrete inconsistency. The evaluator performs
independent before/after integrity checks outside the reviewing model.

## File States

Every known entry has exactly one final state. Source, test, configuration,
generated, binary, lockfile, and submodule are descriptive types, not states.

| State | Meaning and evidence |
| --- | --- |
| Reviewed | All applicable change layers and relevant changed contracts were examined, with enough direct-context evidence for this mode. It does not mean defect-free or runtime-tested. |
| Partial | Some relevant changes were examined; identify the remaining hunk, layer, or contract. A successful read alone is insufficient. |
| Deferred | Relevant review was deliberately left for a later bounded step; give the reason and remaining scope. Budget exhaustion is visible here, not silently omitted. |
| Cannot Verify | Required file/baseline/tool evidence is unavailable or unsupported; identify the missing evidence and how it affects the conclusion. |

If multiple gaps exist, retain all reasons and use this precedence:
`Cannot Verify` for a required evidence absence, otherwise `Partial` for a
started review, otherwise `Deferred`. States do not determine finding severity.

Generated files, lockfiles, binaries, deletions, and submodule changes are never
automatically Reviewed or discarded. Examine the applicable producer, version,
build/consumer contract, semantic diff, or visual evidence as justified. If that
does not establish the relevant change, use an incomplete state. Merely calling
something generated is not evidence that its impact is covered.

With a complete inventory, require:

`total = Reviewed + Partial + Deferred + Cannot Verify`

Generated/binary counts, if useful, are overlapping descriptive counts and are
not added to this equation. Do not print percentages as review confidence.

## Output And Decisions

English illustration inside the existing Quick `Review Scope` or Deep change
understanding section; Chinese requests use localized field labels and may
retain these stable English states:

```md
- File coverage: inventory Complete; 6 changed paths; Reviewed 3 / Partial 1 / Deferred 1 / Cannot Verify 1.
- File gap: Partial; path "src/session.ts"; reason Staged change examined; unstaged fallback not yet examined.
- File gap: Deferred; path "src/settings.ts"; reason Second owner deferred; state transitions remain unreviewed.
- File gap: Cannot Verify; path "assets/status.png"; reason Binary change enumerated; required visual comparison unavailable.
```

When all applicable files are complete, only the summary is needed. When the
inventory itself is incomplete, say `inventory Incomplete; at least N known
changed paths` and explain the enumeration gap; do not invent a total.

The isolated candidate now defines exact bilingual physical-line grammar in
[its mandatory core fragment](../evaluation/prototypes/file-coverage/skill-rules.md).
Chinese uses `文件覆盖`, `文件缺口` and `清单缺口`, retaining stable English states.
Details use JSON-quoted exact paths, preserving unusual names on one line.
The evaluator-only wrapper requires independently frozen inventory and accounting
inputs; it does not infer Reviewed evidence from omitted details or require the
user-facing report to include a JSON ledger. Structural passes leave semantic
acceptance unassessed.

Use the existing recommendation matrix. Missing coverage is an evidence gap,
not a fabricated Blocking/Risk finding. An omitted critical auth, payment, or
shared contract prevents an unconditional whole-scope approval. A noncritical
gap does not automatically block submission: explain its consequence and any
accepted residual risk. Put identical required prerequisites in the conclusion
and final recommendation. Never silently narrow the user's requested scope to
the files that happened to be read. An optional runtime check marked Not Run
does not by itself make an otherwise reviewed file incomplete. Fix closure
remains issue-specific.

## Minimal Implementation Sequence

1. Build an evaluator-only inventory/accounting prototype with public synthetic
   inputs and a concise positive/negative output pair. Confirm this design's
   distinctions before editing the installed Skill.
2. In an isolated candidate, add an explicit inventory-only option to the
   existing all-uncommitted collector. Preserve the old invocation and result.
   The new option returns compact structured paths/layers and baseline metadata,
   without patches or reviewer-assigned states. Retrieve required patches once,
   by bounded path groups, from the same selected comparison. Keep manual
   scoped Git/packet fallback for other scopes and unavailable Node.js.
3. Add the core accounting invariant and compact Quick/Deep scope fields in the
   same candidate. Reuse current mode files; do not create client-specific
   prompt forks, a second collector, a persistent ledger service, or a new mode.
4. Validate a separate candidate profile without changing legacy/default or
   v0.6.0 validation. Validate scope membership, duplicates, counts, incomplete
   reasons and output placement. Structure and read traces cannot establish
   semantic review completeness; retain independent fixture adjudication.
5. After local gates pass, prepare a bounded runtime comparison. New external
   model calls require an explicit execution decision for the concrete inputs.
   Promotion, version selection and release preparation follow accepted evidence.

Instruction-conflict handling is a separate roadmap item. Do not combine it
with this candidate or redesign the isolation/SSE tooling for this feature.

## Acceptance Cases And Measures

| Case | Required result |
| --- | --- |
| Small complete change | Compact summary; no invented issue, mandatory test, or unnecessary per-file expansion |
| Mixed large change | Every requested path accounted for; unread auth/shared change stays visible and cannot support whole-scope approval |
| Same path in both index/worktree | One file count, both change layers examined; partial review cannot count as complete |
| Rename, deletion, unusual names | Exact path identity, correct count, preserved consumers; no outside-boundary reads |
| Generated/lock/binary/submodule changes | Type never substitutes for state; supported evidence or explicit gap |
| Partial inventory or patch delivery | No false full-coverage claim; missing material is identified without blindly repeating the full diff |
| Narrow scope and supplied packet | No unrelated enumeration; packet completeness is not repository completeness |
| Missing baseline or mid-review mutation | Explicit evidence gap; no false Origin or snapshot-completeness claim |
| No-finding and Improve-only cases | Existing decision/severity/Origin/Reproduction rules preserved; no new unconditional submission gate |
| Fix regression control | Existing IDs/closure/scope preserved; no file or changed-condition Coverage ledger |

Deterministic gates require exact set/count reconciliation for complete
inventories, no duplicate/lost paths, explicit rejection of false completeness,
legacy collector/profile compatibility, and unchanged read-only scope. Test
Git parsing against actual synthetic Git output, not only hand-authored strings.
Reuse and extend meaningful collector/profile tests when implementation starts;
do not add wording-only tests for this design document.

Compare stable and candidate with identical scope/materials and client/model
settings. Use Quick, Deep and Fix controls, including incomplete and no-finding
cases. Report required-finding recall, unsupported findings, severity,
recommendation, output consistency, Fix closure and tool/scope violations. Any
observed regression in these gates stops promotion; a small passing sample is
not proof of general accuracy or a guarantee against all regressions.

Measure input/output tokens when reported, elapsed time, read/command count,
duplicate reads and report length. Missing token telemetry stays unknown.
Freeze the measured baseline and candidate cost budget before runtime trials;
do not claim an arbitrary speedup or hide added summary cost. Proceed only with
evidence that added accounting has useful coverage value without an unacceptable
total-cost increase. Retain failures; do not rerun a failed case to select a pass.

The first implementation gate is local prototype and fixture validation.
No client login, provider request, code execution under review, or full historical
runtime-suite replay is needed to finish that gate.
