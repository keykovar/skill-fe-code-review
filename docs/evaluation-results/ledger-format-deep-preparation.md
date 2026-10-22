# Ledger Format Deep Preparation

2026-10-13: **Offline Pass; execution Not Run.** One FC-D-001 Deep pilot is
frozen for the unchanged [format-only candidate](ledger-format-and-bounded-delivery-candidate.md).
The [accepted Quick pilot](ledger-format-quick-runtime.md), historical failures
and formal/installed v0.6.0 remain unchanged. Preparation creates no Desktop
task, reads no credentials and makes no provider request.

## Scope And Purpose

The proposed run uses one fresh independent Codex Desktop task with
`gpt-6-astra / xhigh`, through the user's current configured provider after
checking its route at dispatch. One Deep run and one attempt are permitted;
there is no retry, follow-up, replacement, mode switch or report correction.
Execution still requires explicit authorization to create this new task.

The existing public synthetic FC-D-001 packet declares two changed paths:

- `src/auth/session.mjs`: baseline supplied, target implementation unavailable.
  This is a changed file with missing evidence, not a deletion.
- `src/profile.mjs`: complete before/after snapshots, adding a JSON Accept
  header while retaining empty-token handling and Authorization bytes.

The stated contract requires the current account token, an empty token after
logout and a new token after account switch. The supplied caller cannot prove
the unavailable session implementation satisfies that contract. No runtime
observations are provided; the review must not execute source or tests.

This case checks the Deep template, explicit evidence limits and aligned
conclusion/prerequisites. It does **not** exercise repeated finding IDs in Deep;
the two independent findings were exercised in Quick. Neither run establishes
general accuracy, all-mode compatibility or the separate file-coverage feature.

## Frozen Delivery

Nine evidence files are delivered: core Skill, Deep, JavaScript and release-risk
references; packet declaration and context; three source snapshots. Skill bytes
come from the unchanged twelve-file format candidate. Packet/source bytes come
from the original frozen FC-D-001 stable workspace. No target session source is
invented or copied from elsewhere.

The workspace contains five files: `materials.json`, three ordered JSON batches
and `bootstrap.md`. The startup message includes the bootstrap. The reviewer
reads only the manifest and three batches, using four separate `/bin/cat`
returns in order, with shell and outer output budgets of at least 20,000 tokens.
The startup differs from Quick only in the mode and selected reference names.
Expected answers, evaluator controls and historical reports stay outside the
reviewer payload. Intentional source unavailability is declared by the packet;
missing or truncated transport content instead fails delivery.

| Frozen content | UTF-8 bytes |
| --- | ---: |
| Original nine evidence files | 53,389 |
| Three batches including JSON overhead | 55,537 |
| Material manifest | 2,140 |
| Startup including absolute workspace declaration | 2,209 |
| Selected tool payloads plus startup | 59,886 |

These are content bytes, excluding tool/client envelopes and model output, not
token or billing estimates. Startup is counted once. Each selected read stays
below 20,000 bytes; this alone does not prove complete client delivery.

## Acceptance And Stops

The evaluator-only oracle retains all original semantic fields, excluding only
`candidateFileCoverage` and `stableComparison`. It requires zero unsupported
findings, explicit missing session evidence, source-backed profile analysis,
`Cannot Verify` for the overall design judgment, and a consistent
`暂不建议进入下一步` recommendation. Approval requires obtaining the target session
implementation and comparing logout, account-switch and current-token behavior.
Missing source is an evidence gap, not a demonstrated defect.

The unchanged v0.6.0 parser checks report structure and Coverage grammar.
Separate semantic assessment checks the source reasoning, absence of invented
defects/observations, evidence limits and recommendation consistency. Parser
success, read traces and local tests do not establish those semantic outcomes.

Incomplete, altered, reordered or extra returns fail delivery. Material drift,
out-of-scope tools/writes and provider/model mismatch stop the run. Preserve the
unedited report and trace. No source execution, tests, Git, collector, network,
browser, login, installation or file writes are allowed in the reviewer task.

The original Deep limit remains **900,000 ms**, from task dispatch to the complete
final response. This is a post-completion acceptance check; automatic cancellation
is unavailable and is not claimed. An overrun is No-Go. Record available elapsed,
token/cache and output telemetry with provenance; absent data stays Unknown.
There is no accepted matched control, cost-saving claim or promotion permission.

## Local Verification And Identity

All **76 tests in four suites pass**, including 25 Deep preparation checks.
Tests cover exact reconstruction and reference selection, intentional source
absence, semantic-oracle preservation, answer separation, payload accounting,
elapsed/stop rules, independent hashes, protected destinations, and rejection
of receipt, material, candidate and historical-input drift.

Four native reads reconstruct all nine evidence files. Seventeen historical
failure-artifact pins, eight accepted Quick runtime pins and nine Quick result
pins match. The twelve formal Skill source pins and installed symlink match.
Both previous candidate shape checks are reused by unchanged byte identity;
no dependency was installed. Actual model delivery/report acceptance remain
Not Evaluated.

Local artifacts are under `.local-evaluation/ledger-format-deep-01/`:
`materials/control/` holds the plan, oracle, freeze and exact launch;
`materials/workspace/` holds reviewer content. Test results, native receipts
and preparation receipts are outside the frozen tree.

- Window freeze SHA-256: `089980d4291fb0feb135f4b222d776915a04908b2eed4c91870544d58424cae8`.
- Candidate manifest SHA-256: `61460297bc2bb429e046ae8bcfe0dc5b762a8171d80a4e5c3dcaa31a2c6e4298`.
- Exact launch SHA-256: `8911df3338a5c9b16f22937e6f03b2f731c59101d4321cb9d70865cde9091f82`.

Next obtain authorization for this single independent Deep task, check the live
route and frozen inputs, then assess its original report and actual read returns.
Passing this bounded case would not authorize candidate promotion, installation,
further model runs or publication.

## Runtime Result: No-Go

The authorized task was created as
`01a1341b-e5ba-77d3-9a30-c8a43c9696c8` with the configured Joymeet route and
`gpt-6-astra / xhigh`. The task made five read-only command calls. Four calls
read the frozen manifest and batches; those four model-visible payloads exactly
reconstructed all nine files. The first call read the installed formal
`/Users/keykovar/.agents/skills/fe-code-review/SKILL.md` from outside the
allowlist, and it did so before the packet. This violates the frozen read
boundary, so the whole run is rejected even though packet delivery itself
passed. No retry or follow-up was made.

The task then stopped after identifying the intentionally missing
`src/auth/session.mjs` target snapshot and correctly declined to invent its
logout/account-switch behavior. Its 521-byte response is an incomplete stop
message, not a Deep report; the unchanged v0.6.0 validator therefore reports a
missing Coverage ledger. The semantic review result is **Not Evaluated**. The
case does not show a candidate defect or a model-accuracy rate.

Clarification from the subsequent preparation audit: refusing to invent missing
source behavior does not justify treating a packet-declared evidence gap as a
transport failure. The intended report retains that gap while reviewing the
available material. The original launch's broad "content missing" stop rule
was ambiguous; the [corrected local preparation](ledger-format-deep-projectless-isolation.md#corrected-preparation-window-03)
separates these conditions without changing the frozen source or oracle.

Recorded dispatch-to-final-response elapsed time was **837,678 ms**, within the
900,000 ms post-completion ceiling. This does not turn the run into a pass and
does not prove automatic cancellation. Usage was recorded as 284,697 input,
200,960 cached input, 1,954 output and 286,651 total tokens; no cost comparison
is accepted.

Runtime artifacts are preserved under `.local-evaluation/ledger-format-deep-01/result/`:
`raw-session.jsonl`, `report.md`, `read-trace.json`, visible receipts, delivery
inspection, output assessment, post-integrity, execution result and completion.
The window is consumed. Do not retry this unchanged window. A future attempt
needs a new window and an explicit decision on its read-boundary mitigation.
The projectless proposal does not implement a filesystem allowlist; it can only
test adherence to a prompt contract. Stronger runtime enforcement remains open.
