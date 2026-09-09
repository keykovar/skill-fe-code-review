# Post-v0.4.0 Grouped Ledger Candidate 16 Evaluation Plan

Status: Candidate 16 applied, committed, pushed, tagged, and released as v0.5.0; post-release installation smoke passed

Date: 2026-09-08

## Purpose

Candidate 15 proved that the evaluator-only workspace-relative path contract prevents the Candidate 14 path construction failure, but its first Quick Review failed the frozen severity oracle. It correctly found both independent defects and passed runtime, path-safety, read-only, integrity, and output-structure gates, then classified the local ignored-timeout contract regression as `Blocking` instead of the only allowed `Risk` severity. Candidate 16 addresses only this severity-finalization drift.

## Evidence And Root-cause Boundary

- The existing Skill already says that a local test failure alone is insufficient for Blocking and that a local contract regression without a demonstrated Blocking outcome is Risk.
- The same public fixture was classified correctly in Candidate 03, 06, 13, and 14. Candidate 15 is the first observed severity drift for this finding.
- Candidate 15 used `Severe Regression` as the Blocking outcome even though its evidence established only an ignored parameter, direct-caller mismatch, and local contract-test failure.
- The observed weakness is therefore not a missing severity taxonomy. It is an underconstrained `Severe Regression` fallback plus the absence of an explicit per-finding Blocking proof pass at the point where severity is finalized.
- Path safety, grouped Coverage, Finding identity, recommendation, source policy, fixture behavior, and runtime isolation are not causal and remain unchanged.

## Bounded Delta

Candidate 16 modifies only the temporary candidate copy of `SKILL.md`:

1. Finding finalization performs a Blocking proof pass before sorting. Every Blocking finding must name one canonical outcome and cite evidence that it occurs or is unavoidable; changed parameters, direct-caller mismatches, local contract regressions, and local test failures remain Risk unless separate evidence proves a canonical Blocking outcome.
2. `Severe Regression` is limited to demonstrated loss of an established critical path or broad supported-environment behavior with impact equivalent to another Blocking outcome. It cannot be used as a synonym for any regression.

The wording is generic and contains no fixture key, expected Finding ID, account/cache example, timeout value, oracle answer, or client-specific exception. The Quick/Deep/Fix templates, visible output schema, recommendation matrix, adapters, runner, auditor, Seatbelt profile, Context7/Playwright policy, and evaluator path-safety Prompt are unchanged.

## Offline Acceptance

- The repository source Skill must remain byte-identical while the temporary candidate copy receives the bounded delta.
- The candidate entrypoint must contain both the Blocking proof pass and constrained `Severe Regression` definition without fixture-specific terms.
- Candidate preparation must make zero model requests, transmit no source, and invoke Cursor only for `--version`.
- Fresh `Q-ID-002/RUN-01` and `D-ID-001/RUN-01` workspaces must match their declared Git status, tree, Prompt, candidate Skill, test-exit, and collector hashes.
- Generated Prompts must retain Candidate 15's workspace-relative and stop-on-first-failure policy without exposing the temporary root.
- All repository tests, both Skill validators, JSON parsing, Node syntax checks, sensitive-value scan, and `git diff --check` must pass.

The offline freeze completed on 2026-09-08. Post-Stage-2 closure kept all `34/34` Vitest files and `196/196` tests passing; Node syntax was `35/35` and current-tree JSON parsing was `170/170`. Both Skill validators passed with isolated PyYAML 6.0.3. Independent second-pass verification matched both Prompt hashes, Git statuses, workspace trees, and candidate Skill trees (`2/2` each). The source Skill remained unchanged, both frozen Prompts excluded the temporary root, the targeted sensitive-identifier scan found zero matches, `git diff --check` passed, and the staging area remained empty.

The [sanitized offline freeze record](../evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-16-offline-freeze.json) contains only normalized controls and hashes. Offline preparation called Cursor only with `--version`, made zero model requests, and transmitted no source.

## Runtime Window

### Stage 0: Cursor Source-free Probe

Use a fresh isolated Cursor HOME and workspace. Require one successful read using a literal workspace-relative path, zero Shell/MCP/write/outside-workspace/retry calls, exact response, and unchanged workspace. A historical probe is not reused as Candidate 16 evidence.

The separately authorized probe passed on 2026-09-08. Cursor Agent CLI `2026.08.11-e8db854` used a fresh isolated HOME and a workspace containing only the public Candidate 16 Skill plus public `probe.txt`. It made exactly one successful Read call with the literal path `probe.txt`, returned exact `PLAN_READ_ONLY_OK`, emitted zero Shell, MCP, additional-tool, retry, replacement, or mode-switch calls, and produced empty stderr. Git status, the complete workspace tree, and the Candidate Skill tree remained unchanged. The [sanitized probe result](../evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-16-probe-result.json) records only hashes, counts, normalized controls, and the evidence boundary; it excludes raw trace content, login URL, account detail, session identifiers, and credential contents.

This proves only the Cursor client isolation, literal relative-path behavior, and read-only precondition for this candidate window. It is not Review-quality evidence and does not authorize any source-bearing request.

### Stage 1: Cursor Quick Review

After a separate authorization, run fresh `Q-ID-002/RUN-01` once. Require `F-001` and `F-002` to remain independent, `F-002` to use the frozen `Risk` severity, valid grouped Coverage, allowed recommendation, workspace-relative file tools, zero failures/retries, and unchanged workspace.

The separately authorized run passed on 2026-09-08. Cursor executed one request against the frozen 31-file public-synthetic workspace and returned two independent sequential findings: `F-001 account-cache-key-collision` as an allowed `Risk`, and `F-002 ignored-timeout-contract` as the required `Risk`. Both Coverage entries used complete `before -> after` transitions with single-ID dispositions and no Merge keys, and the recommendation `修改后提交` is allowed.

Runner and runtime-audit gates also passed: exit `0`, empty stderr, `12` workspace-relative read-only tool calls (`10` Read and `2` Grep), zero Shell/MCP/collector/test/write/outside-workspace/failed/retry calls, and unchanged Git status, workspace tree, and Candidate Skill tree. The [sanitized Stage 1 result](../evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-16-stage-1-result.json) stores only hashes, counts, semantic decisions, and the evidence boundary. The evaluator oracle, raw trace, account details, credentials, request identifiers, and session identifiers are excluded.

### Stage 2: Cursor Deep Review

Only after Stage 1 passes and after separate authorization, run fresh `D-ID-001/RUN-01` once. Require the genuine `Login/Auth Failure` Blocking finding to remain Blocking, proving that the new rule does not indiscriminately downgrade demonstrated critical failures.

The separately authorized Deep run passed on 2026-09-08. Cursor returned exactly one `F-001 stale-profile-token-after-logout` finding as `Blocking`, beginning its Blocking outcome with the required canonical `Login/Auth Failure`. The output used the required `Simplify` design decision, the allowed `修改后可以进入下一步` recommendation, seven valid Coverage entries, and one consistent `stale-profile-token-cache` Merge key across all five entries assigned to `F-001`.

Runner and runtime-audit gates also passed: exit `0`, empty stderr, `13` workspace-relative read-only tool calls (`9` Read, `2` Glob, and `2` Grep), zero Shell/MCP/collector/test/write/outside-workspace/failed/retry calls, and unchanged Git status, workspace tree, and Candidate Skill tree. The [sanitized Stage 2 result](../evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-16-stage-2-result.json) stores only hashes, counts, semantic decisions, and the evidence boundary; it excludes the evaluator oracle, raw trace, account details, credentials, request identifiers, and session identifiers.

Candidate 16 therefore passes the complete prospective Cursor window: the source-free probe, Risk-only Quick severity correction, and genuine Blocking counter-regression gate. The bounded candidate is `Go`; this does not itself authorize modifying the public or installed Skill.

## Local Application

After separate authorization on 2026-09-08, the exact bounded delta was applied only to `skills/fe-code-review/SKILL.md`. The public distributable tree, installed symlink target, and accepted Candidate 16 tree now match at 12 files with SHA-256 `148cf6ebae8c5cba674f5fe0fe9f1399f405287b5057d815867662faa1721480`; all three entrypoints match SHA-256 `9f2af4fca11954225d307e4d53125f5f2dad4a7ef54979754ff6165d433a93fb`.

Post-application validation passed the complete `34/34` Vitest files and `196/196` tests, both Skill validators, `35/35` Node syntax checks, current-tree JSON parsing, the sensitive-identifier scan, and `git diff --check`. The staging area remains empty. No commit, push, tag, release, additional model request, or temporary-data cleanup occurred during application.

## Scoped Pre-commit Review

The scoped review found one evaluation-only Risk and no Candidate 16 Skill-behavior defect. After Candidate 16 application, Candidate 15's preparer copied the current public Skill dynamically, so a new Candidate 15 freeze could carry Candidate 16 tree `148cf6ebae8c5cba674f5fe0fe9f1399f405287b5057d815867662faa1721480` instead of Candidate 15's recorded tree `beca476371288fc96b28fc5f58d619dca81fbf3b336d5125e7fc64979ba16fcb`. The existing test derived its expected tree from the current source and therefore did not reject the historical-identity drift.

The bounded fix reuses the Candidate 16 inverse transform after copying Candidate 15's source and replaces the dynamic tree assertion with the frozen Candidate 15 tree and Prompt hashes. During verification, the Quick Prompt also exposed a macOS path-canonicalization edge: a logical `/var/folders/...` workspace can be returned by the collector as `/private/var/folders/...`, leaving `/private<workspace>` after partial replacement. The shared preparer now normalizes both the logical and real workspace paths before embedding collector evidence.

The affected Candidate 13-16 preparer and record tests pass `6/6`, and the complete suite passes `34/34` files and `196/196` tests. Candidate 16's public, installed, and accepted Skill tree remains unchanged. No external model request or source transmission occurred during the review and fix. The Skill application was later committed as `1b498dd` and its retained evaluation evidence as `26ab753`; both commits were pushed to `origin/main`. The release-candidate metadata was committed as `0b236c4`, pushed, tagged as `v0.5.0`, and published. Temporary-data cleanup remains pending.

## Current-tree Fix Release Gate

The release policy requires Quick, Deep, and Fix acceptance on one primary client. Candidate 13's Fix result used an earlier Skill hash, so it was not carried forward as current-tree evidence even though the Fix template itself was unchanged.

The first separately authorized exact-current-tree Fix request was semantically correct, structurally valid, read-only, and workspace-safe, but its frozen evaluator Prompt both required `.evaluation/previous-findings.md` and generically prohibited `evaluation` reads. That self-contradictory control is retained as `Cannot Score` and is not promoted or discarded.

A fresh replacement workspace corrected only the control-plane read boundary by allowing the explicitly required `.evaluation/previous-findings.md` file. The separately authorized request passed: `F-001` and `F-002` retained Blocking, `F-003` retained Risk, all three were `Resolved`, New Regression was none, and the recommendation was `可以关闭`. The run made 10 Read, 2 Grep, and 1 Glob calls with zero Shell, MCP, failure, retry, write, or outside-workspace calls. Git status, the 31-file workspace tree, and Candidate 16 Skill tree remained unchanged. Sanitized evidence is recorded in [`v0.5.0-current-tree-fix-acceptance-result.json`](../evaluation/runtime-windows/v0.5.0-current-tree-fix-acceptance-result.json).

## Stop Rules

- Candidate 15 remains closed `No-Go`; no Candidate 15 model result is reinterpreted or selected.
- No failed run is retried, replaced, reinterpreted, or switched to another mode within Candidate 16.
- Stop at the first Prompt-integrity, transfer-scope, path-safety, semantic, severity, structural, execution, read-only, isolation, integrity, hash, fixture, or client-contract failure.
- No aggregate score overrides a failed mandatory gate.

## Next Gate

The v0.5.0 release and clean-tag installation smoke are complete. The next work is post-release client coverage or a separately scoped v0.5.1 change; temporary-data cleanup still requires explicit authorization.
