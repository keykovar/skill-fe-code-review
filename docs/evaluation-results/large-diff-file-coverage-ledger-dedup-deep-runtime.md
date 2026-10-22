# Deduplicated File Coverage Deep Runtime

2026-10-19: **No-Go for dispatch protocol compliance; report structure and
eight manual semantic checks pass. Stable is withheld.** The authorized task
`Candidate dedup Deep Review FC-D-001`
(`01a15203-a892-7f21-b142-c7f90f2372d2`) completed once using the
[prepared deduplicated candidate](large-diff-file-coverage-ledger-dedup-deep-preparation.md).
The evaluator changed the dispatch procedure, so this is not an accepted
controlled pilot or evidence of a Skill-quality failure.

## Execution And Delivery

The frozen plan requires the exact `control/candidate-dispatch.md` content as
the task prompt. Instead, the evaluator supplied a paraphrase asking the new
task to read that file first. The actual trace therefore contains **20 calls
instead of 19**. The extra first call uses a default login shell, a 12,000-token
shell output budget and no frozen 20,000-token outer output budget. This is a
dispatch-side deviation; the reviewer followed the altered instructions.

The subsequent nineteen calls match the frozen inputs, order, working directory,
both output budgets and exact model-visible bytes. All nine evidence files were
delivered. This suffix passes only as a diagnostic: the unchanged delivery
validator rejects the full twenty-call trace. Removing the extra call from
acceptance would conceal the failure. Report line 120 separately mentions the
dispatch read before counting the nineteen prescribed calls.

Session metadata confirms `custom / gpt-6-astra / xhigh`, with client
`0.162.0-alpha.17.2`. The required provider URL check was not performed before
dispatch, so this record does not claim a verified Joymeet route. No credential
read, source execution or file write appears in the reviewer command trace.
Recorded behavior does not establish enforced filesystem isolation.

| Identity | SHA-256 |
| --- | --- |
| Material freeze | `4503625ca3ad5771e6525ab5f74b061be668137ead8836123ab115f676b0889a` |
| Candidate manifest | `07e4d22fa9c8d6a3bcee161486bc581aac77097245f175c4f7567b6983b59f64` |
| Frozen dispatch prompt | `a31c8227663b84684efc06fdb2f5d9241d867d438bb5db59f0326f2f8d16c986` |
| Actual dispatch prompt | `c5e01a782f5c66b0913c883d32a749b34e0985380ef69d8c7412af4e638c2489` |

The preparation's inherited plan label/date and authorization flags remain an
unchanged preparation snapshot. Actual authorization and execution are recorded
separately; the consumed authorization does not permit a retry or Stable run.

## Report Checks

The unedited report matches both the session final message and completion
receipt. SHA-256:
`fa96095ca871cccfef447403ebdbba1cd5f905e4a70d60d32cf516bdb0a41eb3`
(9,576 UTF-8 bytes, 128 physical lines, no trailing newline).

The unchanged **v0.6.0 parser and file-coverage validator pass**: five
Changed-Condition Coverage entries, zero findings, and
`Complete; 2 paths; Reviewed 1 / Partial 0 / Deferred 0 / Cannot Verify 1`.
These structural results are separate from the following manual checks.

| Manual check | Verified report evidence |
| --- | --- |
| Zero unsupported findings | Lines 10, 61, 65, 69 and 74 retain no finding; missing evidence is not a fabricated defect. |
| Missing target preserved | Lines 17, 34, 45-47, 51 and 114 retain session Cannot Verify and identify baseline-only locations. |
| Visible profile contracts covered | Lines 33-37 and 52-55 cover empty/nonempty token, raw Authorization, path, intended Accept header and async result adoption. |
| File accounting grounded | Lines 16-17 and 23-26 distinguish complete packet inventory, synthetic unstaged layers and unavailable target evidence. |
| Design judgment bounded | Lines 78-87 retain whole-scope Cannot Verify without inventing a need for abstraction. |
| Prerequisites consistent | Lines 6 and 128 repeat the same prerequisite byte for byte; line 110 adds no release-information gate. |
| No invented runtime evidence | Lines 28, 99-102 and 119 preserve Not Run and invent no observation count or numeric probability. |
| Scope remains packet-only | Lines 12, 18, 21, 32 and 114-115 limit completeness to the declared synthetic packet. |

All **8/8 report-semantic checks pass**. The report correctly withholds approval
until the target session source and current-token/logout/account-switch
contracts can be reviewed. These findings about the report do not waive the
failed dispatch gate or establish candidate promotion readiness.

Some initial line references in the generated accounting receipt were
misaligned. The independent adjudication retains that receipt and supplies
correct references; file states, counts and parser outputs remain unchanged.

## Integrity And Measurements

All **59 frozen input/material pins** and candidate file pins remain unchanged.
However, after reviewer completion the evaluator saved `candidate-raw-report.md`
inside the frozen material root. The exact directory verifier therefore fails
for one extra file. This is evaluator-created residue, not a reviewer write.
The file is retained; an identical report is now archived with the evaluation
results outside the material root. No frozen file was edited or removed.

| Recorded measurement | Candidate |
| --- | ---: |
| Task duration | 365,635 ms |
| Frozen Deep ceiling | 900,000 ms |
| Actual / prescribed calls | 20 / 19 |
| Prescribed nineteen command outputs | 71,705 bytes |
| All twenty command outputs | 72,413 bytes |
| Actual initial prompt | 1,086 bytes |
| Actual prompt plus command outputs | 73,499 bytes |
| Cumulative input tokens | 963,838 |
| Cached input tokens, included above | 923,904 |
| Output tokens | 7,052 |
| Reasoning output tokens, included above | 2,448 |
| Input plus output tokens | 970,890 |

The elapsed gate passes; automatic cancellation is not claimed. Content totals
exclude tool wrappers and client context. The preparation's 72,413-byte delivery
estimate is not the actual prompt-plus-output total for this deviating run.
Token figures are cumulative client telemetry, not unique content or billed
cost; cached and reasoning counts are not added twice. No matched comparison,
efficiency improvement or general accuracy claim follows.

The complete raw report, actual/frozen prompts, tool receipts, trace, usage,
accounting, parser results and manual adjudication are archived in
`.local-evaluation/file-coverage-ledger-dedup-01/runtime-01/`. Capture uses the
original session records, not a shortened task-status preview. The full Vitest
suite was not rerun for this archival step; earlier preparation results retain
their historical scope.

Formal v0.6.0 core SHA-256 remains
`dcb65ecf8b4a8497e874326b4fd75e9ccb9854b66c1c2720643bb200276829fe`.
The installed Skill still resolves to the formal repository Skill directory.
The [previous composed pair](large-diff-file-coverage-ledger-deep-runtime.md#pair-decision)
and its No-Go decision are unchanged; `runtimeReady=false` remains in effect.

## Next Gate

Close this consumed window as No-Go and withhold Stable. Next correct the local
dispatch entry: pass the frozen prompt verbatim, verify exact prompt identity
and current provider configuration before creation, and store all result
artifacts outside the frozen material root. Prepare a fresh window and obtain
new single-run authorization before any replacement model task. Do not reuse
this authorization, relax the nineteen-call contract, amend the raw report or
weaken the parser. No formal Skill change, installation, commit, push, tag or
release is part of this closeout.

Follow-up: the [additive dispatch guard and a fresh unclaimed window pass local
checks](large-diff-file-coverage-deep-dispatch-guard.md). This runtime No-Go and
its original artifacts remain unchanged; no replacement has been executed.
