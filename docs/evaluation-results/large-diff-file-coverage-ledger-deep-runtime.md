# Composed File Coverage Deep Runtime

2026-10-15: **Candidate Pass for one bounded FC-D-001 Deep pilot; Stable No-Go
for strict format; pair No-Go for promotion.** The Candidate Codex Desktop task
`01a13e97-88fa-7792-89e4-4c2acdbfddba` used the exact
[frozen composed candidate](large-diff-file-coverage-ledger-deep-preparation.md).
This accepts the individual report and delivery gates, not promotion, general
accuracy or a cost improvement.

## Execution And Delivery

Preflight confirmed the configured Joymeet route `https://t.kxmeet.com`,
`responses` wire API and `gpt-6-astra / xhigh`. Session metadata confirms
`custom`, the requested model and effort. These are configuration and client
records, not attestation of the provider's upstream implementation. No credential
file was read. Only the frozen Candidate dispatch was supplied to the new
projectless task; evaluator controls and expected results were not included.

The material freeze remains
`fc0bf883977664e4a674816aebc04af6f6d78cf52a2017afe53c5c68f734c9b7`;
the candidate bundle remains
`205664708b8c0d0ed19c667312d242ace7e071f914f5df2e0ad7b854ea87e510`.
The preparation's authorization fields retain their historical values; the new
authorization and actual run are recorded separately.

All **19/19 actual reads pass**: one startup plus eighteen ordered material
reads. The entire recorded tool trace contains exactly those nineteen outer
calls and nineteen successful command executions. Both 20,000-token budgets,
commands and working directories match the frozen templates. Each model-visible
return equals its command output and frozen bytes; all nine evidence files are
reconstructed. No extra tool call, reread, source execution, test, Git, network,
browser, credential read, write or retry appears in the reviewer trace.
Projectless execution and prompt restrictions still do not enforce filesystem
isolation. Post-run freeze verification passes.

## Report Acceptance

The raw report is preserved without correction. Its SHA-256 is
`c6ff4c5235d7f1e0cfef80af3265b8d0f69c08b2fff6c74b93e6a74e5c7960e4`
(9,988 UTF-8 bytes, 127 lines). The final message and task-completion report
match exactly; the shortened task-status preview is not used for validation.

The unchanged **v0.6.0 parser passes**, with eight Changed-Condition Coverage
entries and zero findings. The Coverage section contains only entries and blank
lines; explanatory evidence stays outside it. The separate file-coverage
validator passes against accounting derived from the report, source and trace:
`Complete; 2 paths; Reviewed 1 / Partial 0 / Deferred 0 / Cannot Verify 1`.

Eight manual semantic checks pass, separately from parser acceptance:

| Check | Report evidence |
| --- | --- |
| Zero unsupported findings | Lines 15, 55-67 retain no finding; missing evidence is not a defect. |
| Missing target preserved | Lines 20, 39, 46-48, 115 mark session Cannot Verify and identify baseline-only locations. |
| Visible profile contracts covered | Lines 49-53 cover empty/nonempty token, Authorization, path, intended Accept header and result/error propagation. |
| File accounting grounded | Lines 19-30 distinguish complete packet inventory from unavailable session target and synthetic unstaged layers. |
| Design judgment bounded | Lines 77-86 retain Cannot Verify for the whole scope and avoid unnecessary profile abstraction. |
| Prerequisites consistent | Lines 8-9 and 126-127 repeat identical target-delivery and token/logout/account-switch prerequisites. |
| No invented runtime evidence | Lines 31, 98-101, 119-120 retain Not Run; no numeric probability or observed count is invented. |
| Scope remains packet-only | Lines 21, 35, 41 and 114 do not claim host-repository completeness. |

The report correctly recommends `暂不建议进入下一步` for the reviewed synthetic
change because its session target is missing. That review recommendation is
consistent with a passing evaluator result: this case requires the reviewer to
retain the evidence gap and refuse unconditional approval.

## Measurements And Limits

| Recorded measurement | Candidate |
| --- | ---: |
| Task duration | 464,726 ms |
| Frozen Deep ceiling | 900,000 ms |
| Tool/read calls | 19 / 19 |
| Delivered content | 73,314 bytes |
| Reported cumulative input tokens | 971,246 |
| Cached input tokens, included in input | 935,040 |
| Reported output tokens | 6,399 |
| Reasoning output tokens, included in output | 1,612 |
| Reported input plus output tokens | 977,645 |

The task-duration gate passes; automatic deadline cancellation is not claimed.
Token figures are cumulative client telemetry across the turn, not unique source
tokens or billed cost. Cached and reasoning counts must not be added again.
At Candidate completion the Stable result was not yet available. The subsequent
Stable assessment and observed pair ratios are recorded below; verified billing
and general efficiency claims remain unavailable. One successful sample does
not establish general accuracy, other modes, other clients or repeated finding
behavior.

Local raw report, dispatch receipt, all actual call/return receipts, tool trace,
usage, independent accounting, parser results and manual adjudication are in
`.local-evaluation/file-coverage-ledger-deep-01/`. The earlier 03b No-Go freeze
and raw report remain unchanged. Formal/installed v0.6.0 retains its core digest
and installed symlink target; `runtimeReady=false` remains unchanged.

## Stable Result

The user separately authorized one Stable task after the completed Candidate.
Task `01a13f1b-a30e-7333-bceb-66bfcf280c47` used the exact frozen Stable dispatch,
formal v0.6.0 instructions and the same five public packet/source files. Both
runs record client `0.162.0-alpha.17.2`, `custom` provider, Joymeet route and
`gpt-6-astra / xhigh`. No Candidate report or evaluator oracle was supplied to
Stable, and no follow-up or retry occurred.

All 19 actual reads pass the same exact command, budget, order, status and
model-visible byte checks. The complete recorded trace has no extra call or
write. Post-run material verification, all nine Candidate evidence pins, formal
Skill and installed symlink checks pass. Stable completed in **372,165 ms**,
within the 900,000 ms ceiling.

The raw Stable report is **No-Go** under the unchanged v0.6.0 parser. Line 64
adds explanatory prose inside Changed-Condition Coverage, producing exactly one
`coverage-ledger-unexpected-content` error before seven otherwise recognized
entries. The raw report is not edited or scored through a corrected view. Its
SHA-256 is
`89da25afc5cde4167a1a2291912b7984b50ada7c07617f004964e404b9d1085d`
(10,176 UTF-8 bytes, 148 lines).

The separately recorded eight manual semantic checks pass: no invented finding,
missing target retained, visible profile contracts covered, both file evidence
boundaries stated, bounded design judgment, identical prerequisites, Not Run
runtime evidence and packet-only scope. The prerequisite at report line 8 is
repeated exactly at line 148. Candidate-only file-summary grammar is not imposed
on Stable. These semantic checks do not waive the structural failure or create
an accepted control. Overall risk wording also varies (Candidate high, Stable
medium); both tie it to unavailable evidence rather than a proven defect. The
frozen oracle does not require a particular overall label, and this pair does
not establish deterministic label consistency.

## Pair Decision

| Recorded measurement | Candidate | Stable | Candidate / Stable |
| --- | ---: | ---: | ---: |
| Full report acceptance | Pass | No-Go: format | Not accepted |
| Manual semantic checks | 8/8 | 8/8 | Descriptive only |
| Duration, ms | 464,726 | 372,165 | 1.248710 |
| Tool/read calls | 19 / 19 | 19 / 19 | 1.000000 |
| Delivered content, bytes | 73,314 | 65,665 | 1.116485 |
| Cumulative input tokens | 971,246 | 947,904 | Not a separate gate |
| Cached input, included above | 935,040 | 913,024 | Not a separate gate |
| Output tokens | 6,399 | 6,757 | Not a separate gate |
| Reasoning output, included above | 1,612 | 1,959 | Not a separate gate |
| Input plus output tokens | 977,645 | 954,661 | 1.024076 |
| Raw report bytes | 9,988 | 10,176 | Not a separate gate |

The frozen pair ceilings are 1.0 for total reported input-plus-output tokens,
duration and tool calls. The observed Candidate totals are **22,984 tokens
(2.41%) higher** and **92,561 ms (24.87%) longer**; call count is equal. Therefore
the recorded token and elapsed ratios do not pass the unchanged ceilings.
Stable's format failure independently prevents acceptance of this comparison.
The window is **No-Go for promotion**, while the original Candidate single-run
Pass remains intact.

These are raw observations from one sequential pair, not proof that the Skill
caused the timing difference or that a billed price increased by that amount.
Both use the same reported usage fields; cached input and reasoning output are
not double-counted. Provider upstream identity, billing and run-to-run variance
are not controlled. With no accepted Stable report, this is not an efficiency
comparison between two passing reviews and not evidence of general quality
improvement. Do not loosen ceilings or rerun to select a cheaper result.

Stable raw output, actual receipts/trace, usage, capture results and semantic
adjudication are saved separately beside the unchanged Candidate artifacts.
`pair-comparison-result.json` records the computed ratios and failed gates;
the historical preflight and preparation receipts retain their original state.

## Next Gate

This two-run window is closed. Next inspect incremental instruction and delivery
overhead offline, using the retained traces and existing format-only evidence.
Preserve important rules in core, strict grammar, read-only limits, semantic
accuracy, Fix scope and historical failures; do not infer that shorter text is
safe or that byte savings prove token savings. A future candidate needs a
concrete local change, unchanged-rule tests and a new freeze before any separate
runtime decision. No additional task, report correction, parser change,
candidate promotion, installation, commit, push, tag or release follows from
this result. Formal/installed v0.6.0 and `runtimeReady=false` remain unchanged.
