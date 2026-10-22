# Deduplicated Deep Stable Runtime

2026-10-19: **Stable No-Go; matched comparison not accepted.** The one
explicitly authorized Stable FC-D-001 Deep task completed with exact delivery,
eight passing manual semantic checks and unchanged materials. Its unedited
report fails the unchanged v0.6.0 parser because a prose paragraph appears
inside Changed-Condition Coverage. The
[accepted Candidate pilot](large-diff-file-coverage-ledger-dedup-deep-replacement-runtime.md)
remains accepted individually; it is not promoted. This window is consumed,
with no automatic retry or threshold change.

## Dispatch And Delivery

The [prepared v2 dispatcher](large-diff-file-coverage-ledger-dedup-stable-preparation.md)
rechecked the selected route, same-window Candidate acceptance and material
freeze, then claimed the one-use receipt. Its exact returned request was passed
directly to `create_thread`, creating task
`01a153b0-55f8-7f02-95a1-9f0354c973d5`. Candidate reports, oracle and history were
not added to the Stable prompt or delivered allowlist.

The actual session records provider `custom`, model `gpt-6-astra`, effort
`xhigh` and client `0.163.0-alpha.10.2`, matching Candidate. The selected local
configuration records `https://t.kxmeet.com` with `responses`; the configured
default `gpt-6.1-sol` was explicitly overridden for the task. These records do
not attest the provider's upstream model implementation or billing.

All **19/19 actual calls, command executions and model-visible returns** match
the frozen schedule, command, cwd, order, both 20,000-token budgets and complete
returned bytes. No extra recorded read, retry, source execution or write
occurs. This is observed compliance, not enforced filesystem isolation.

| Identity | SHA-256 |
| --- | --- |
| Material freeze | `4ca35a745d5a81dcc72c3cf39b8d0a3aae2dd64840218ae59ea947452790d684` |
| Stable preflight | `851e539a3e3e8522c1b8a037b5c17392cc6e0226dd66113c3b3243f2ae04cdbb` |
| Frozen and actual prompt | `d4d717ae7e083690a5b0cc19db2a896b219f97f5685a582ee34c8ba9e6ad2078` |
| Unedited Stable report | `a4d4bbc3e43c4179a7131ac9e2df768411dfff7c59132aaf9118942d2b04482d` |

## Report Acceptance

The full report was extracted from the original session JSONL and matches both
the final assistant message and task-completion record. The shortened task
preview was not used for validation. It contains 9,105 UTF-8 bytes, 133 physical
lines and no trailing newline, with seven Coverage entries and zero findings.

The unchanged **v0.6.0 parser rejects line 53** as
`coverage-ledger-unexpected-content`. The paragraph explains that session line
numbers refer to baseline source and that Behavior Preserving applies only to
the caller contract. Its meaning is supported, but its placement violates the
strict list-only grammar. The raw report is retained without correction; the
parser is not relaxed. Candidate-only File Coverage grammar is not imposed on
Stable.

| Manual check | Verified report evidence |
| --- | --- |
| Zero unsupported findings | Lines 13-15 and 67/71/75 do not invent a defect for intended Accept behavior or missing target source. |
| Missing target preserved | Lines 35-37, 46-56, 79 and 125 retain session Cannot Verify and conditional caller behavior. |
| Visible profile contracts covered | Lines 34-40 and 57-61 cover call-time reads, empty-token no-request, raw Authorization, path, Accept and unchanged result propagation. |
| File accounting grounded | Lines 19-27, 55-61, 119 and 125 distinguish the two synthetic changed paths, reviewed profile and unavailable session target. |
| Design judgment bounded | Lines 84-93 preserve whole-scope Cannot Verify and avoid speculative state or abstraction for profile. |
| Prerequisites consistent | Lines 8-9 and 132-133 repeat the same source-comparison and controlled-verification requirements exactly. |
| No invented runtime evidence | Lines 29, 42, 105-108 and 123 distinguish static inference, future checks and Reproduction: Not Run. |
| Scope remains packet-only | Lines 19, 25-27, 33, 119-126 avoid live Git, host-repository or complete-runtime claims. |

All **8/8 manual checks pass**, without overriding structural rejection.
Stable's controlled-verification prerequisite is broader than Candidate's
static wording; it is tied to the unavailable authentication chain and does
not state a particular runtime test is mandatory or already executed. This
wording difference is retained, not normalized away. The medium overall risk
label describes the critical evidence gap, not a confirmed defect. The
recommendation remains `暂不建议进入下一步`.

## Pair Decision

| Recorded measurement | Candidate | Stable | Candidate / Stable |
| --- | ---: | ---: | ---: |
| Task duration | 280,309 ms | 207,238 ms | 1.352595 |
| Tool calls | 19 | 19 | 1.000000 |
| Delivered prompt plus output content | 72,413 bytes | 65,685 bytes | Descriptive only |
| Input tokens | 977,960 | 958,396 | Descriptive only |
| Cached input, included above | 941,568 | 923,392 | Descriptive only |
| Output tokens | 6,544 | 5,644 | Descriptive only |
| Reasoning output, included above | 2,099 | 1,110 | Descriptive only |
| Input plus output tokens | 984,504 | 964,040 | 1.021227 |
| Report bytes | 8,939 | 9,105 | Descriptive only |

Both durations are below the frozen individual Deep ceiling of 900,000 ms;
automatic cancellation is not claimed. Recorded route/client/model/effort and
material window match, but **there is no accepted matched pair** because
Stable quality failed. The diagnostic token and elapsed ratios also exceed
the frozen 1.0 ceilings: +2.12% tokens and +35.26% elapsed time for Candidate.
These observations do not establish a causal efficiency regression, general
performance conclusion or billed-cost difference. Cached input and reasoning
output are already included and are not added twice.

## Integrity And Evidence

All 59 material/input pins, 22 retained history/Candidate/formal pins, the v2
dispatcher hash and exact material directory inventory pass. Formal core
SHA-256 remains
`dcb65ecf8b4a8497e874326b4fd75e9ccb9854b66c1c2720643bb200276829fe`.
The installed Skill still resolves to the formal repository directory.

Raw creation receipt, actual/frozen prompts, full tool trace, nineteen read
receipts, report, parser result, usage/completion record, manual adjudication
and pair decision are stored outside frozen materials in
`.local-evaluation/file-coverage-ledger-dedup-01/stable-dispatch-02/results/`.
`capture.mjs` extracts and validates actual session evidence; `compare.mjs`
checks pinned Candidate receipts and calculates the retained ratios. The
preparation receipt and Candidate evidence remain unchanged. The prior 80-test
pass is reused; no full test suite was rerun for this evidence-only closeout.

## Next Gate

Follow-up: [the offline diagnosis is complete](large-diff-file-coverage-ledger-dedup-offline-diagnosis.md).
It reproduces the format failure, reconciles twenty usage samples per arm and
checks three in-memory batch previews. Direct File Coverage batching would add
a call relative to Stable, so it is not ready for a new runtime comparison.
Prioritize the existing format-only correction's offline closeout; keep File
Coverage experimental and this window closed.

The diagnosis separates the repeated strict-format issue in Stable from the
candidate's additional coverage/content cost, reusing accepted local
prototypes and retained traces. Do not rerun unchanged materials, weaken the
parser or choose a more favorable sample.
Any later model execution requires its own concrete freeze and applicable
authorization. Formal/installed v0.6.0, historical No-Go records,
`runtimeReady=false` and release state remain unchanged. No promotion,
installation, commit, push, tag or release occurs in this closeout.
