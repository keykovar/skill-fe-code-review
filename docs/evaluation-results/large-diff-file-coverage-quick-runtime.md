# File Coverage Quick Runtime

2026-10-12: **No-Go for this comparison window.** The single stable Quick run
completed, but its unedited report fails the existing output grammar and one
core instruction line was not delivered completely to the model. The frozen
one-finding oracle also conflicts with the stable Skill's atomicity rule.
Candidate Quick remains **Not Run** because the authorized sequence requires
an accepted stable result first. No retry, correction or later-mode run occurred.

## Authorized Run

The user authorized the stable/candidate FC-Q-001 Quick pair, in that order,
through the current Joymeet configuration using `gpt-6-astra / xhigh`. Each run
was limited to its own seventeen frozen files and startup instructions. This
authorization did not include Deep, Fix, replacement attempts or report repair.

The stable task is `FC-Q-001 stable Quick Review`, thread
`01a12f72-ef5a-7202-af79-6b4df3f5b8bb`. Local preflight records `custom` / Joymeet,
`https://t.kxmeet.com`, Responses. The session records provider `custom`, model
`gpt-6-astra` and effort `xhigh`. These establish the selected configuration,
not independent proof of the remote model, routing, retention or billing.

## Acceptance

| Gate | Result | Evidence |
| --- | --- | --- |
| Completion / deadline | Pass | One completed turn, 200,684 ms; Quick ceiling 600,000 ms. |
| Frozen material integrity | Pass | All six packet/control/input checks still match the original freeze. |
| Recorded tool boundary | Pass | Four orchestration calls contain seventeen successful `cat`/`sed` commands, all within the allowlist. |
| Source delivery | Pass | Ten source/support files match exactly; each was read once. Packet metadata and both references also match. |
| Complete core delivery | Fail | Initial aggregate tool output was truncated; later reads leave core line 169 partially missing. |
| Existing v0.6.0 grammar | Fail | Unedited report line 20: `coverage-ledger-unexpected-content`. |
| Origin / Reproduction fields | Pass | Both findings are Risk / New / Not Run; no invented observation or probability. |
| Frozen finding count | Conflict | Oracle expects one; current core requires independently repairable conditions to be split. |
| Design / recommendation | Pass for observed content | Simplify; conclusion and ending both require repair and the same slash/query verification. |
| Candidate quality / paired cost | Not Evaluated | Candidate was not dispatched. |

The parser retains `semanticStatus: Not Evaluated` and
`reportAcceptance: Not Evaluated`; its field checks do not supply semantic
acceptance. The evaluator's overall decision is **Not Accepted** for this run.
No new file-summary syntax is required of the stable report.

### Report Format

The report inserts this standalone explanation immediately inside the strict
Changed-Condition Coverage section:

> 以下 `B` 表示 `https://example.test`，`P` 表示 `profile`；结果均为静态推演。

The unchanged validator rejects that paragraph at line 20. It otherwise parses
thirteen ledger entries and two finding IDs. Preserve the report verbatim; do
not delete the paragraph to convert this attempt into a pass. This is one
observed stable-version rendering failure, not evidence of a candidate regression.

### Core Delivery

The first call batched core, Quick and JavaScript instructions. The native core
command returned the full file, but the outer tool response exceeded its output
budget and elided part of the core. Subsequent reads covered lines 210-350 and
170-209. Exact comparison of the model-visible text still lacks the complete
line 169, a Deep-specific design rule.

That line is not an active Quick requirement, so its absence does not establish
the cause of the formatting failure. It nevertheless fails the frozen
complete-core delivery gate. Full native command output cannot substitute for
the text actually delivered to the model. The supplemental instruction reads
addressed truncation; there were zero duplicate source reads.

### Oracle Conflict

The [frozen oracle](../../evaluation/prototypes/file-coverage/runtime-oracles.json)
requires one `url-boundary-regression` finding. However,
[core Finding Requirements](../../skills/fe-code-review/SKILL.md) explicitly
require testing independent repair counterfactuals and splitting if either
condition can be repaired while the other still fails. A shared function, patch
or broad contract is explicitly insufficient merge evidence.

The report identifies two supported conditions at `src/url.mjs:2`:

- Neither input has a boundary slash: direct concatenation omits the separator.
- Both inputs have a boundary slash: direct concatenation retains two separators.

Adding a separator only when both inputs lack one leaves the duplicate case
broken. Removing a separator only when both inputs have one leaves the missing
case broken. Both retain the already-correct one-slash cases and query text.
These are evaluator counterfactuals, not executed repairs or runtime observations.
The report explicitly explains this independence. Its two findings therefore
do not establish hallucination or duplicate reporting under the current rule.
The evaluator's one-finding expectation needs correction in a future version;
the frozen oracle and this attempt remain unchanged. This diagnosis does not
retroactively pass the current window or excuse its other failures.

### File Treatment

Independent reading of the report and source trace supports the following
bounded observations, without turning them into overall acceptance:

| Logical path | Observed treatment |
| --- | --- |
| `src/url.mjs` | All three snapshots; staged parameter rename preserves behavior, unstaged concatenation breaks two of four combinations; query preservation covered. |
| `src/name.mjs` -> `src/label.mjs` | Identical implementation, declared string inputs and synchronized entry mapping; three name fallback branches covered. |
| `src/generated-path.mjs` | Producer and consumer read; legal path change linked to the helper's duplicate-slash condition, without a separate generated-file defect. |
| Deleted `src/legacy-debug.mjs` | Removed body inspected; declared absence of consumers and side effects distinguished from missing delivery. |

This is packet-level static evidence. It does not establish live Git inventory,
automatic discovery, browser behavior or complete real-repository coverage.

## Measurements

| Measurement | Stable run |
| --- | ---: |
| Elapsed | 200,684 ms |
| Report UTF-8 bytes | 7,814 |
| Frozen packet bytes, including standalone bootstrap | 54,424 |
| Actual startup bytes | 1,772 |
| Orchestration calls / command executions | 4 / 17 |
| File read operations / distinct files read | 18 / 16 |
| Duplicate source reads | 0 |
| Reported cumulative input tokens | 225,503 |
| Cached input tokens, included in input | 193,664 |
| Reported output tokens | 5,089 |
| Reasoning tokens, included in output | 2,003 |
| Reported total input plus output | 230,592 |

The standalone 1,500-byte bootstrap is delivered inside the 1,772-byte actual
startup, not read again as a file. Thus the seventeen-file packet has sixteen
distinct filesystem reads plus the embedded bootstrap. File bytes are not token
measurements. Cumulative input includes repeated/cached session context; it is
not unique source size, Skill-only overhead or an invoice. Do not add reasoning
tokens to output again. No candidate ratio or monetary saving can be calculated.

## Retained Evidence And Next Step

Ignored local evidence is in
`.local-evaluation/file-coverage-comparison-01/stage-1-dispatch/`:
the authorization, exact launch prompts, created-thread receipt and
`01-quick-stable-result/` with the raw session, unedited report, read trace,
delivery checks, parser output, completion, integrity receipt and hashes.

- Freeze SHA-256: `5571c59430c2854f73d7c15be5676fdc5717f4706926db2f14d6aeacb4b7853d`.
- Report SHA-256: `c29f071606247c991ef3a27c35be6a2b4a94c3d2c2999136f1a4b1c2a6963dab`.
- Raw session SHA-256: `1c48b6b5303694157c6b294d4be3afa151ab76587642f98f697186c6f9f4e47c`.

The preparation manifest's zero-invocation/unauthorized fields remain historical
preparation state; the appended authorization and execution receipt record this
one actual run. Local capture parsing initially needed an array-type correction
and exact EOF handling for a `sed` range; both observer failures occurred before
artifact creation and caused no reviewer retry.

Next work is offline: correct the evaluator's atomicity expectation and cover
both counterfactuals; prepare bounded instruction delivery that can verify every
required byte; investigate ledger prose handling without weakening the frozen
output contract. Any replacement comparison needs separately frozen inputs and
its own execution decision. Do not reuse this failed baseline to dispatch the
pending candidate. Formal/installed v0.6.0, candidate bytes, original reports and
oracles remain unchanged. No commit, push, installation or release occurred.

The subsequent [offline replacement preparation](large-diff-file-coverage-quick-replacement.md)
corrects the new window's oracle and verifies bounded read receipts. This failed
attempt remains unchanged and is not an accepted control for the new pair.
