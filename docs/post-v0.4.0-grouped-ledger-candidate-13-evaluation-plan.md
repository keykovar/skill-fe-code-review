# Post-v0.4.0 Grouped Ledger Candidate 13 Evaluation Plan

Status: Complete - Go; original candidate applied locally; post-application correction pending focused runtime acceptance

Date: 2026-09-03

## Purpose

Candidate 13 addresses the Candidate 12 Deep output failure: one flat `Changed-Condition Coverage` line described a preserved behavior without a `before -> after` transition. The candidate tightens only the rendering instruction and adds deterministic positive/negative output fixtures.

## Bounded Delta

The temporary Candidate 13 Skill copy adds a mechanical Coverage grammar:

`- [file:line] <condition>: <before> -> <after>; Disposition: <one final disposition>`

Every line must contain one location, one transition arrow, and exactly one `[F-NNN]`, `Behavior Preserving`, or `Cannot Verify` disposition. Repeated Finding IDs also require the same non-empty `Merge key`. The instructions explicitly reject colon-only statuses, missing arrows, disposition on another line, and nested child lines.

At evaluation time, the candidate did not change the grouped validator, review-output validator, Finding severity, Quick/Deep/Fix semantics, runner v5, Seatbelt profile, collector, Context7/Playwright policy, read-only boundary, or source-transfer policy. The public and installed Skill remained unchanged until the separately authorized application described below.

## Offline Fixture Result

At the original candidate freeze, three repository-local fixtures were replayed through the existing `validate-review-output` contract:

- `valid.md`: accepted, `2` Coverage entries.
- `colon-only.invalid.md`: rejected with `coverage-ledger-missing-before-after`.
- `nested.invalid.md`: rejected with missing transition and missing disposition errors.

The historical deterministic replay used `node scripts/replay-review-output-candidate-13.mjs`; no external model request or source transmission occurred.

## Offline Freeze Result

Seven fresh public-synthetic workspaces were prepared under `/private/tmp/post-v0.4.0-grouped-ledger-candidate-13-offline-freeze-01`. All declared fixture exits matched `7/7`; the evaluator-owned collector ran exactly once for `6/6` non-Deep runs and the Deep inventory was frozen locally for `1/1` run. Q-ID-001 and F-ID-001 repeat assertions matched by HEAD, Prompt SHA-256, status SHA-256, and complete workspace tree SHA-256 (`2/2`). A second integrity pass confirmed all workspace trees and Git statuses unchanged after preparation (`7/7`), and all workspaces carry Candidate 13 Skill tree SHA-256 `57cbd739d4c7ad942617d348e1cdd642323840831c3c3ef62e5648c5eb339b23`.

The sanitized [offline freeze record](../evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-13-offline-freeze.json) records the frozen hashes and source boundary. Preparation made zero external model requests and transmitted no source.

## Source-Bearing Stage 1 Result

After explicit authorization, `D-ID-001/RUN-01` was executed first using the frozen 31-file public-synthetic workspace. Cursor Agent CLI `2026.08.11-e8db854` completed with runner exit `0` and empty stderr. The runtime audit passed with no violations: `0` Shell, `0` MCP, no outside-workspace reads, unchanged Git status/tree, and no retry, replacement, or mode switch. The output validator passed in Deep mode with `F-001/F-002`, one Blocking finding, and 6 valid Coverage entries, including the required single-line `before -> after` contract.

The sanitized [Stage 1 result](../evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-13-stage-1-result.json) records the trace/output hashes and token counters without raw trace or credentials. One public-synthetic source-bearing request was made; no private source was transmitted. A local control-directory preflight was corrected before Cursor started and is recorded separately; it was not a model retry.

Stage 1 passed. The remaining six source-bearing runs are not covered by this authorization and must be requested separately in frozen order.

## Source-Bearing Q-ID-001/RUN-01 Result

After separate explicit authorization, the frozen `Q-ID-001/RUN-01` public-synthetic workspace was reviewed exactly once in Quick mode. Runner v5 completed in `115847 ms` with exit `0` and empty stderr. The runtime audit passed with `0` Shell, `0` MCP, `0` collector, `0` test, and `0` outside-workspace reads; Git status and the complete workspace tree remained unchanged.

The output passed the Quick validator and semantic oracle. It emitted three independent Findings with stable sequential IDs: `F-001` Blocking for the referenced untracked file, `F-002` Blocking for removed slash normalization, and `F-003` Risk for the ignored base-URL contract. The Coverage ledger contained three single-line `before -> after` entries with valid localized dispositions, and the recommendation was the allowed `修改后提交`. No Finding merge was required or emitted.

The sanitized [Q-ID-001/RUN-01 result](../evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-13-stage-2-run-01-result.json) records hashes, counts, token usage, and gate outcomes without raw source, trace, credentials, account identity, or request identifiers. Cursor's aggregate `result` included three progress messages before the final answer; the deterministic auditor selected the last `assistant` text, and its SHA-256 matched the extracted review. This was not a retry or replacement.

After separate explicit authorization, the byte-identical `Q-ID-001/RUN-02` also passed. Runner v5 completed in `115129 ms` with exit `0` and empty stderr. Runtime audit again found `0` Shell, `0` MCP, `0` collector, `0` test, and `0` outside-workspace reads, with unchanged Git status and complete workspace tree. The Quick validator accepted four Coverage entries. Two `F-002` entries split the base-tail and path-leading slash conditions and used the same non-empty `Merge key: slash-join`, while the three independently fixable concepts remained separate Findings.

Across the byte-identical pair, Finding recall was `6/6` and concept-to-ID stability was `3/3`: referenced untracked file remained `F-001` Blocking, removed slash normalization remained `F-002` Blocking, and ignored base-URL contract remained `F-003` Risk. Both runs recommended `修改后提交`. The sanitized [Q-ID-001/RUN-02 result](../evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-13-stage-2-run-02-result.json) records the second run and pair comparison without raw source, trace, credentials, account identity, or request identifiers.

The `Q-ID-001` repeat pair passed. `Q-ID-002/RUN-01` remains unexecuted and requires separate explicit authorization. No later Fix or no-finding run is authorized until every preceding frozen run passes.

## Source-Bearing Q-ID-002/RUN-01 Result

After separate explicit authorization, the frozen `Q-ID-002/RUN-01` public-synthetic workspace was reviewed exactly once in Quick mode. Runner v5 completed in `98785 ms` with exit `0` and empty stderr. Runtime audit passed with `0` Shell, `0` MCP, `0` collector, `0` test, and `0` outside-workspace reads; Git status and the complete workspace tree remained unchanged.

The output passed the Quick validator and semantic oracle. It preserved the two independently fixable concepts as `F-001` Blocking for the account cache-key collision and `F-002` Risk for the ignored caller timeout contract. Both Coverage entries contained one location, a complete `before -> after` transition, and one valid disposition. The recommendation was the allowed `修改后提交`.

The sanitized [Q-ID-002/RUN-01 result](../evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-13-stage-2-run-03-result.json) records hashes, counts, token usage, and gate outcomes without raw source, trace, credentials, account identity, or request identifiers. The first local runner invocation rejected a truncated evaluator-supplied expected HEAD before Cursor started; no model request, trace, or source transmission occurred before the corrected frozen value was used. This was not a model retry or replacement.

`Q-ID-002/RUN-01` passed. `F-ID-001/RUN-01` remains unexecuted and requires separate explicit authorization. The repeat Fix run and no-finding control remain unauthorized until every preceding frozen run passes.

## Source-Bearing F-ID-001/RUN-01 Result

After separate explicit authorization, the frozen `F-ID-001/RUN-01` public-synthetic workspace was reviewed exactly once in Fix mode. Runner v5 completed in `106391 ms` with exit `0` and empty stderr. Runtime audit passed with `0` Shell, `0` MCP, `0` collector, `0` test, and `0` outside-workspace reads; Git status and the complete workspace tree remained unchanged.

The output passed the Fix validator and closure oracle. It preserved `F-001/F-002/F-003` with their original `Blocking/Blocking/Risk` severities, marked all three `Resolved`, reported no partial, unresolved, cannot-verify, or New Regression item, and recommended `可以关闭`. The response stayed scoped to the supplied fixes and did not expand into a full Deep Review.

The sanitized [F-ID-001/RUN-01 result](../evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-13-stage-2-run-04-result.json) records hashes, counts, token usage, closure status, and gate outcomes without raw source, trace, credentials, account identity, or request identifiers.

`F-ID-001/RUN-01` passed. The byte-identical `F-ID-001/RUN-02` remains unexecuted and requires separate explicit authorization. The no-finding control remains unauthorized until RUN-02 also passes every gate.

After separate explicit authorization, the byte-identical `F-ID-001/RUN-02` also passed. Runner v5 completed in `133417 ms` with exit `0` and empty stderr. Runtime audit again found `0` Shell, `0` MCP, `0` collector, `0` test, and `0` outside-workspace reads, with unchanged Git status and complete workspace tree. The Fix validator accepted the same three Finding IDs.

Across the byte-identical pair, closure recall was `6/6` and concept-to-ID stability was `3/3`. Both runs preserved the original `Blocking/Blocking/Risk` severities, marked all three Findings `Resolved`, reported no New Regression, and recommended `可以关闭`. Neither run expanded into a full Deep Review. The sanitized [F-ID-001/RUN-02 result](../evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-13-stage-2-run-05-result.json) records the second run and pair comparison without raw source, trace, credentials, account identity, or request identifiers.

The `F-ID-001` repeat pair passed. The final `K-ID-001/RUN-01` no-finding Quick control remains unexecuted and requires separate explicit authorization.

## Source-Bearing K-ID-001/RUN-01 Result

After explicit authorization, the final frozen `K-ID-001/RUN-01` public-synthetic workspace was reviewed exactly once in Quick mode. Runner v5 completed in `59246 ms` with exit `0` and empty stderr. Runtime audit passed with `0` Shell, `0` MCP, `0` collector, `0` test, and `0` outside-workspace reads; Git status and the complete workspace tree remained unchanged.

The output passed the Quick validator and no-finding oracle. It emitted zero Finding IDs, classified all four changed conditions as `Behavior Preserving`, selected Design decision `Keep`, and recommended the only allowed outcome `可以提交`. No false positive or unnecessary refactor was proposed. The sanitized [K-ID-001/RUN-01 result](../evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-13-stage-2-run-06-result.json) records hashes, counts, token usage, and gate outcomes without raw source, trace, credentials, account identity, or request identifiers.

## Final Candidate Decision

Candidate 13 completed all seven frozen source-bearing runs with `7/7` runtime audits, `7/7` output validators, `7/7` semantic or closure oracles, and `7/7` workspace-integrity checks passing. The Q-ID-001 and F-ID-001 byte-identical pairs preserved concept-to-ID stability `3/3` each. The final no-finding control produced zero false positives. Across the window there were `0` runtime retries, replacements, mode switches, Shell calls, MCP calls, collector calls, test calls, outside-workspace reads, or workspace mutations.

Candidate 13 is `Go`. The sanitized [complete result](../evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-13-results.json) records the complete window. This authorizes only the conclusion that the temporary Candidate 13 Skill delta passed the frozen evaluation. Applying it to the public or installed Skill, committing, pushing, tagging, releasing, or deleting temporary evidence remains a separate action.

## Promotion And Application Result

After separate explicit authorization, the exact Candidate 13 Skill was applied to the repository Skill. The installed Agent Skill remained a symbolic link to that repository directory, so both resolved to the same content. Before the later pre-submit review, local validation passed `29/29` Vitest files and `190/190` tests, both default and serial runs, together with Node syntax and `git diff --check`.

The subsequent bounded pre-submit review found one internal contract mismatch: `SKILL.md` required single Finding IDs to have no `Merge key`, while the Quick/Deep examples and deterministic validator accepted one. The local correction now rejects a merge key for a single Finding ID, removes it from the current valid English and Chinese examples, and adds explicit English and Chinese negative fixtures. The original frozen fixtures remain byte-identical for historical hash verification; the corrected fixture replay uses separate files and contains `10/10` deterministic cases. This correction changes the model-facing Skill tree and therefore is not covered by the original Candidate 13 tree hash or its seven source-bearing runtime results.

Post-correction local closure passes the default and single-worker Vitest runs at `29/29` files and `191/191` tests, the focused validator suite at `3/3` files and `40/40` tests, the corrected fixture replay at `10/10`, both Skill validators with isolated PyYAML 6.0.3, affected Node syntax checks, all repository evaluation JSON parsing, the targeted personal-path and sensitive-identifier scan, and `git diff --check`. The repository and installed distributable Skill trees match at 12 files with SHA-256 `beca476371288fc96b28fc5f58d619dca81fbf3b336d5125e7fc64979ba16fcb`; the unchanged `SKILL.md` entrypoint remains SHA-256 `b6124c8866992d5c720a4c9183740b6e19fdacea4beafb76d2da5952f5fc845e`.

The complete result JSON and its hash-addressed original fixtures remain unchanged as the historical decision snapshot for the original Candidate 13 tree hash. No commit, push, tag, release, external model request, source transmission, or temporary-data cleanup is authorized by this application record.

## Candidate Skill Snapshot

The temporary Skill copy is `/private/tmp/post-v0.4.0-grouped-ledger-candidate-13-skill-01`, with 12 files. `SKILL.md` SHA-256 is `b6124c8866992d5c720a4c9183740b6e19fdacea4beafb76d2da5952f5fc845e`; complete Skill tree SHA-256 is `57cbd739d4c7ad942617d348e1cdd642323840831c3c3ef62e5648c5eb339b23`.

## Source-Free Gate

Before any source-bearing request, create a fresh isolated Cursor HOME and a workspace containing only the temporary Candidate 13 Skill plus a public probe file. Require one successful workspace-local read, zero Shell/MCP/write calls, no outside-workspace reads, no retries, and unchanged workspace status/tree. Private source remains forbidden.

## Source-Free Probe Result

The fresh Candidate 13 source-free probe passed on 2026-09-04. Cursor Agent CLI `2026.08.11-e8db854` ran once through runner v5 in Plan mode with client sandbox enabled and the outer Seatbelt profile. The runner exited `0` with `0` stderr bytes. The audit found exactly one successful workspace-local read of `probe.txt`, `0` Shell calls, `0` MCP calls, `0` other tools, exact final response `PLAN_READ_ONLY_OK`, and unchanged Git status/tree hashes. The sanitized [probe result](../evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-13-probe-result.json) records the trace and integrity hashes without credentials or raw state contents.

This is only a source-free read-capability precondition. It does not validate review quality and does not authorize source-bearing execution. No fixture, customer, production, or private project source was transmitted.

## Next Gate

Perform the focused runtime acceptance tracked as [Candidate 14](post-v0.4.0-grouped-ledger-candidate-14-evaluation-plan.md) for distributable Skill tree SHA-256 `beca476371288fc96b28fc5f58d619dca81fbf3b336d5125e7fc64979ba16fcb` before treating it as release-ready. Do not commit, push, tag, release, or clean temporary evidence without separate authorization.
