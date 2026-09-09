# Roadmap

The roadmap is evidence-driven. Items move into a release only when real review runs show that they solve a repeated problem.

## Current Next Steps

Stable release: `v0.5.0`. The earlier candidate sections below retain their chronological decisions and historical pending gates; they are not the current task queue. Frozen Prompts, hashes, results, and `No-Go` decisions must not be rewritten as later successes.

1. Local maintenance implemented and Vitest checks passed: public examples match the existing output validator, direct execution of its internal strict module is rejected, positive/negative example tests exercise the real CLI/API, and installation-evidence wording is corrected. Both Skill shape validators passed using PyYAML 6.0.3 installed offline into a temporary target from a cached wheel whose SHA-256 matches official PyPI metadata; the distributable Skill is unchanged. This is a possible v0.5.1 maintenance scope, not a version bump or a Skill behavior change.
2. Completed on 2026-09-09: independent Node dependency installation passed in a new local `v0.5.0` tag clone with a fresh HOME/cache/store, `45` downloaded and `0` reused packages, `36/36` Vitest files, `198/198` tests, and both Skill validators passing. The earlier blocked installation and dependency-reuse check remain historical evidence; PyYAML was reused, and neither a new GitHub download nor client runtime behavior was verified. See [Independent Node Dependency Installation](evaluation-results/v0.5.0-candidate.md#independent-node-dependency-installation).
3. Pending separate authorization: obtain current-release Codex source-free and Quick/Deep/Fix/no-finding evidence. Cursor retains its scoped accepted evidence; Claude Code remains `Cannot Verify` until valid credentials and applicable runtime results exist.
4. Proposed v0.6.0 scope, not implemented: make problem origin and occurrence characteristics explicit. Distinguish new, amplified, retained, and unknown origins using baseline evidence; report trigger conditions and observed reproduction counts without inventing production probabilities. Preserve Quick/Deep/Fix scope, severity, read-only, and localized-output contracts.
5. Deferred behavior work: large-diff file coverage, instruction-conflict handling, additional real-project regression cases, and evidence-backed efficiency work. Quality and safety gates take precedence over token or elapsed-time reductions.

Temporary-data cleanup for the earlier authorized Candidate 15/16 and v0.5.0 directory set is complete. The new independent-installation workspace and temporary PyYAML validation target are retained for separately authorized cleanup. The public npm downloads above completed under their bounded authorization; external model requests, source transfers, further dependency installation, commits, pushes, tags, and releases remain outside this local maintenance step.

## Historical v0.1.x Maintenance

- Correct installation and adapter documentation as clients evolve.
- Expand compatibility evidence without changing the required output contract.
- Tune false positives and ambiguous severity guidance using sanitized examples.
- Keep validators and repository tests aligned with public documentation.

## v0.2.0

The release includes:

1. Evidence-backed minimal sufficient design decisions for Quick and Deep Review.
2. A documentation-tool contract that prohibits direct or indirect Context7 use during code review.
3. Optional, mode-budgeted browser runtime evidence with reproducibility, safety, redaction, and environment-equivalence gates.
4. Explicit `Cannot Verify` semantics and a strict Fix Review versus Deep Review boundary.
5. Complete Deep and Fix scope ledgers plus stronger bilingual and compatibility contract tests.

## Completed v0.2.0 Promotion Evidence

- Pre-hardening Cursor Quick and Fix Review evidence is retained for design and read-only behavior; a post-hardening Cursor CLI Improve-only Quick rerun returned `可以提交`, one `Improve` / `Simplify`, an explicitly non-blocking final recommendation, and no fixture writes.
- All 10 paired minimal-design cases produced the required Quick and Deep decisions, allowed severities, and no forbidden design outcome.
- A Cursor Agent-mode negative run exposed an unauthorized report write; the shared Skill and Cursor rule now require chat-only review output, and post-fix Quick, Deep, and Fix runs made no file writes.
- Offline lockfile installation, `41/41` Vitest tests, both Skill validators, and `git diff --check` passed. The post-hardening final Deep Review passed against the committed candidate with no findings.

## v0.2.0 Release Boundaries

- Keep Claude Code as `Cannot Verify` while valid runtime credentials are unavailable.

## v0.2.1

The release includes checked-in Quick, Deep, and Fix evaluation fixtures with explicit semantic oracles, isolated Git preparation, deterministic behavior checks, and sanitized runtime evidence.

## Completed v0.2.1 Promotion Evidence

- Codex Quick, Deep, and Fix fixture reviews completed without file writes; a repeated Quick run satisfied the complete oracle after the first run merged one expected Risk into other sections.
- Cursor Agent CLI completed the Quick fixture with the complete oracle and no file writes; Deep and Fix were not rerun and are not claimed.
- `47/47` Vitest tests, both Skill validators, all three fixture preparation commands, `git diff --check`, and the targeted sensitive-data scan passed.
- The tracked core Skill tree and client adapters remain unchanged from v0.2.0.

## v0.2.1 Release Boundaries

- Claude Code remains `Cannot Verify` while valid runtime credentials are unavailable.
- Codex token observations are not a Skill-only benchmark because user-level Memory and plugin context were loaded.

## Post-v0.2.2 Candidates

1. Add stable finding IDs so Fix Review can map previous findings without relying only on prose.
2. Add a large-diff coverage ledger that records reviewed, deferred, generated, and unverified files.
3. Clarify precedence among repository instructions, client rules, mode references, and user-requested scope.
4. Add sanitized cross-client output snapshots only where they improve regression diagnosis.

## Completed v0.4.0: Independent Findings And Stable IDs

The first post-v0.3.0 behavior candidate addresses a repeated Quick Review failure where an actionable contract risk was recognized but appeared only under `Design / Simplify` instead of an independent severity-classified Finding. The candidate combines a narrow independent-Finding clarification with sequential IDs that remain stable through one Initial Review to Fix Review chain.

The [v0.4.0 Independent Finding and Stable ID Evaluation Plan](v0.4.0-finding-identity-evaluation-plan.md) was frozen before any Skill change. Candidate 01-07 remain retained `No-Go` evidence. Candidate 08 passed all semantic, structural, Finding-ID, severity, Fix closure, recommendation, collector, read-only, client-isolation, and workspace-integrity gates. Its original result remains recorded as raw `6 / 7`: one Fix trace contained two false outside-workspace violations from relative import text inside an `rg` pattern. A focused tooling correction preserved rejection of actual external `rg` paths and replayed only that saved trace with zero model calls, network requests, source transmission, retries, or workspace changes. Candidate 08 is therefore the selected `Go 7 / 7` v0.4.0 release; tag creation and GitHub Release publication remain separate authorized operations. See [v0.4.0 Candidate Results](evaluation-results/v0.4.0-candidate.md).

## Post-v0.4.0 Ledger Completeness Candidate

The first post-release ledger-tally candidate is retained as `No-Go`: its single frozen public-synthetic Cursor run passed execution, isolation, and integrity gates but recalled only `2 / 3` required Findings and never exercised its repeated-ID target. See [Candidate 01 Results](evaluation-results/post-v0.4.0-ledger-tally-candidate-01.md).

Candidate 02 is retained as `No-Go`. Its narrow Prompt-only implementation added `28 / 60` English words to `SKILL.md`, preserved every mode reference and public contract, and passed all static, fixture-integrity, and source-free isolation gates. The first Stage 1 Quick run then found all `3 / 3` required issues with correct IDs, severities, `Simplify`, and `修改后提交`, but still omitted the shared merge key from one of two visible `F-003` ledger entries. The frozen stop rule ended the window immediately: RUN-02 and Stage 2 were not executed, retried, or replaced. The candidate runtime instructions were removed and the installed symlink again resolves to stable v0.4.0. A validator-orchestrated repair loop remains deferred because deterministic validation cannot identify omitted semantic defects without an oracle. See [Candidate 02 Results](evaluation-results/post-v0.4.0-ledger-completeness-candidate-02.md).

Offline diagnosis selected a Finding-grouped ledger: one Finding-owned merge basis with nested changed conditions, rather than duplicating the same key on every flat entry. The independent parser prototype passed `14 / 14` targeted tests, and seven saved synthetic outputs replayed `7 / 7`, including a structurally valid merge that remains a semantic-oracle failure. Candidate 03 implemented the exact frozen prompt and validator migration at core `+14` and Quick/Deep combined `+76` English words while leaving Fix and the safety boundaries unchanged. Seven fresh public synthetic workspaces and the isolated Cursor source-free probe passed, but the first source-bearing command expanded the Prompt in the main shell and transmitted out-of-scope main-worktree status, tracked diff, and test output. Candidate 03 is retained `No-Go` without retry; the public Skill and validator are restored to stable v0.4.0 while the candidate artifacts remain offline evidence. See [Ledger Reconciliation Design](post-v0.4.0-ledger-reconciliation-design.md) and [Migration Brief](post-v0.4.0-grouped-ledger-migration-brief.md).

Candidate 04 is a new window rather than a Candidate 03 retry. It preserves the exact grouped-ledger runtime candidate, uses evaluator-side literal Prompt transport through a fixed `shell: false` argv launcher, and corrects the evaluator-only evidence contract so Deep uses zero collectors while Quick/Fix use one supported `--workspace` call. The exact candidate plus seven public synthetic workspaces and seven Prompt files passed offline expected tests `7 / 7` and repeat identity `2 / 2`; the separately authorized source-free Cursor probe then returned exact `CLIENT_ISOLATION_OK`. The first authorized Stage 1 attempt stopped before Cursor started because an evaluator preflight used zsh's special lowercase `path` array and replaced `PATH`, causing the next Git command to fail. No model request or source transfer occurred, all workspace hashes remained unchanged, and Candidate 04 is retained `No-Go` without retry or replacement. See [Candidate 04 Evaluation Plan](post-v0.4.0-grouped-ledger-candidate-04-evaluation-plan.md).

Candidate 05 preserved Candidate 04's runtime candidate and evaluation matrix but replaced ad hoc shell preflight with a versioned Node runner that atomically verifies absolute executables, runner and Prompt hashes, client version, Git state, workspace tree, Skill tree, and output isolation before literal-argv execution. PATH-clobber and fail-before-client tests passed, seven new public synthetic workspaces matched expected tests `7 / 7`, and the separately authorized source-free probe passed. The first authorized public-synthetic Deep run then stopped `No-Go` before promotion scoring because Cursor reported that auto-review was unavailable and fell back to `Allowlist`, which did not match the frozen client contract. The unscored output also failed the grouped-ledger structural validator. Candidate 05 is closed without retry or replacement; no private source was transmitted, every frozen workspace remained unchanged, and the public Skill remains stable v0.4.0. See [Candidate 05 Evaluation Plan](post-v0.4.0-grouped-ledger-candidate-05-evaluation-plan.md).

Candidate 06 was implemented within its frozen instruction budget and passed its source-free probe, but stopped `No-Go` after the Stage 1 Deep result omitted repeated-ID merge keys and selected an unsupported recommendation. Candidate 07 improved finalization and recommendation behavior but remained `No-Go` at `6 / 7` after one unchanged Quick repeat merged independently repairable contracts. Candidate 08 passed a focused tooling replay at `7 / 7`, but its separate source-free Plan-mode capability window did not satisfy the required output and read-only contracts. Candidates 09 and 10 also stopped at their source-free capability gates without transmitting source. See the corresponding Candidate 06-10 evaluation plans in this directory.

Candidate 11 replaced shell access with a workspace-local Read-tool contract and stopped `No-Go` after its first Deep run omitted required before/after and disposition fields. Candidate 12 tightened that grammar but its first Deep run still emitted a preserved condition without a complete transition, so the remaining runs were cancelled. Candidate 13 then completed all seven frozen public-synthetic Deep, Quick, Fix, and no-finding runs at `7 / 7` and was applied locally after separate authorization. The original result remains the runtime acceptance record for its exact frozen hash. See [Candidate 13 Evaluation Plan](post-v0.4.0-grouped-ledger-candidate-13-evaluation-plan.md).

A pre-submit review subsequently found that the model-facing examples and validator allowed a `Merge key` on a single Finding ID even though the core contract prohibited it. The bounded local correction aligns the validator and English/Chinese fixtures, but changes the distributable Skill tree hash. Local deterministic validation passes at `30/30` Vitest files and `192/192` tests in both default and single-worker runs, `10/10` corrected fixtures, `7/7` grouped-ledger replay cases, and both Skill validators. A focused runtime acceptance decision is still required before tree SHA-256 `beca476371288fc96b28fc5f58d619dca81fbf3b336d5125e7fc64979ba16fcb` can enter release preparation; the original Candidate 13 `7 / 7` result must not be reinterpreted as acceptance for the corrected tree.

Candidate 14 froze that focused acceptance as two fresh public-synthetic runs: Quick verifies that single Finding IDs omit merge keys, and Deep verifies that repeated Finding IDs retain one consistent non-empty key. Both offline test results and second-pass workspace integrity checks matched `2 / 2`; the separately authorized Cursor source-free probe also passed. Stage 1 then stopped `No-Go`: the Quick output and semantic oracle passed, including the corrected single-ID merge-key rule, but Cursor attempted one misspelled outside-workspace read, received `File not found`, and retried the corrected path. The Deep and Codex smoke runs were cancelled without retry, replacement, reinterpretation, or mode switch. See [Candidate 14 Evaluation Plan](post-v0.4.0-grouped-ledger-candidate-14-evaluation-plan.md).

Candidate 15 replaced evaluator file-tool paths with a workspace-relative, stop-on-first-failure contract. Its fresh source-free probe and Quick execution passed path-safety, isolation, read-only, integrity, and output gates, but the Quick result escalated the Risk-only ignored-timeout contract to Blocking. Candidate 15 remains `No-Go`, and its Deep run was cancelled without retry or replacement. See [Candidate 15 Evaluation Plan](post-v0.4.0-grouped-ledger-candidate-15-evaluation-plan.md).

Candidate 16 added one central Blocking proof pass and constrained `Severe Regression` without changing mode templates or visible output fields. A fresh source-free probe, public-synthetic Quick severity check, and Deep Blocking counter-regression all passed: the ignored-timeout contract remained Risk, while the demonstrated stale-token path remained Blocking with canonical `Login/Auth Failure`. The exact 12-file candidate tree `148cf6ebae8c5cba674f5fe0fe9f1399f405287b5057d815867662faa1721480` was applied locally after separate authorization and is the current public and installed distributable tree. Commit, push, release, and temporary-data cleanup remain separate gates. See [Candidate 16 Evaluation Plan](post-v0.4.0-grouped-ledger-candidate-16-evaluation-plan.md).

The scoped pre-commit review found one evaluation-only Risk: rerunning Candidate 15 against the current public source could relabel Candidate 16's Skill tree as Candidate 15, while macOS `/var` test workspaces could canonicalize to `/private/var` and drift the embedded Quick collector evidence. The bounded fix restores Candidate 15's frozen tree before preparation and normalizes both logical and real workspace paths. Candidate 16's Skill tree and runtime acceptance remain unchanged; the complete `34/34` files and `196/196` tests pass after the fix.

## Completed v0.5.0: Grouped Finding Evidence

The Candidate 16 application and its evaluation evidence are committed, pushed, tagged, and published as v0.5.0. The first exact-current-tree Fix release request produced correct closure and remained read-only, but its frozen evaluator Prompt simultaneously required `.evaluation/previous-findings.md` and prohibited `evaluation` reads, so it is retained as `Cannot Score` rather than promoted. A fresh replacement workspace used a self-consistent single-file exception and passed: all three previous Findings retained their severities and became `Resolved`, New Regression was none, the recommendation was `可以关闭`, all tools were workspace-relative and read-only, and Git plus complete workspace hashes remained unchanged.

The current 12-file distributable tree `148cf6ebae8c5cba674f5fe0fe9f1399f405287b5057d815867662faa1721480` now has exact-current-tree Cursor source-free, Quick, Deep, and Fix acceptance. Stable installation is pinned to v0.5.0. Codex and Claude Code remain `Cannot Verify` for v0.5.0 unless separately authorized current-tree runtime evidence is completed. The earlier clean-tag deterministic checks reused local dependencies; independent Node dependency installation passed later in a new local tag clone, with the tag's tests and both Skill validators passing. No client status changed. See [v0.5.0 Candidate Results](evaluation-results/v0.5.0-candidate.md).

## v0.3.0 Real-project Evaluation Baseline

Before accepting any post-v0.2.2 behavior candidate, run the documented real-project matrix across React, Vue, TypeScript, JavaScript, Hybrid/WebView, no-clear-issue, and actual Fix Review chains. Measure required-finding recall, finding precision, severity accuracy, recommendation consistency, output-contract compliance, read-only safety, scope/oracle access, and Fix Review closure without changing the current Skill contract.

Use the [v0.3.0 Real-project Evaluation Plan](v0.3.0-real-project-evaluation-plan.md) and [Real-project Evaluation Record Template](real-project-evaluation-record-template.md). A candidate enters v0.3.0 only when repeated failures justify it and every affected case is rerun. Token reduction or plugin-eval cost alone is not sufficient evidence for a Skill change.

The completed historical matrix and acceptance windows are documented in [v0.3.0 Evaluation Results](evaluation-results/v0.3.0.md). The v0.3.0 release passes current-hash Quick acceptance and the three-dataset Deep quality, safety, runtime-evidence, client-isolation, and repeat gates. The first prospective Fix replacement window produced two complete Passes, then stopped before its third source-bearing run because the independently authorized source-free probe returned `OK` instead of the frozen exact response `OK.`. No source was sent for that attempt and the result is not relaxed or retried. The independently frozen Plan 02 window then completed at `3 / 3`: F-001 replacement RUN-04 and the distinct F-004 RUN-01/RUN-02 pair passed every quality, closure, output, execution, collector, read-only, integrity, repeat, and client-isolation gate. Historical failures remain recorded and unchanged.

The previous-candidate Quick/Fix efficiency follow-up is complete. The Fix collector run reduced command executions by `46.0%` and lowered uncached input while preserving its recorded quality and safety gates, but missed the elapsed target. Current-hash Quick, Deep, and prospective Fix acceptance are complete. Do not rerun frozen cases to select a favorable sample; retain every execution failure and preserve the quality, closure, localized-output, client-isolation, collector, and read-only gates through release preparation.

## Completed v0.3.0 Post-release Evidence

- A fresh public-tag clone resolved to the published commit and passed lockfile installation, `80/80` Vitest tests, both Skill validators, Node syntax checks, and deterministic Quick fixture preparation.
- The Codex Quick smoke passed its collector, trace, MCP, read-only, integrity, output, and recommendation gates but emitted only `2 / 3` expected findings independently; it is retained as a post-release failure rather than replacing the exact-candidate acceptance evidence.
- The first Cursor run satisfied the `3 / 3` semantic oracle but read an identical user-level Skill outside the fixture, so workspace isolation failed.
- A fixed-version Cursor source-free probe with an isolated home returned exact `CLIENT_ISOLATION_OK` with zero tools and zero MCP.
- The isolated Cursor plan run satisfied `3 / 3` semantically but routed the review through `createPlan`, violating the chat-only and write-tool contract.
- The isolated Cursor ask run returned a complete chat review but satisfied only `2 / 3` findings and failed equivalent-Git-read and outside-workspace transcript gates.
- Every source-bearing fixture retained its frozen Git status and file hashes. No failed run was retried in place, discarded, or promoted to a runtime pass.

## v0.3.0 Post-release Boundaries

- Codex remains runtime verified from the exact-candidate Quick, Deep, and Fix acceptance window; the post-release Quick failure remains separate evidence.
- Cursor remains `Cannot Verify` because no v0.3.0 post-release run passed every semantic, output, isolation, collector, and read-only gate.
- Claude Code remains `Cannot Verify` while valid runtime credentials are unavailable.
- The synthetic Quick fixture does not verify browser, WebView, Native, backend, deployment, monitoring, or production behavior.

## Completed v0.2.2 Promotion Evidence

- Reject runtime evidence when a client directly requests semantic oracles, checked-in expected outputs, or paths outside the generated fixture workspace.
- Audit Cursor Agent `stream-json` traces for scope escape and explicit or common write attempts before semantic scoring, then retain before/after Git and file-hash checks as the write-safety authority.
- Fresh Cursor Agent-mode traces passed the integrity gate for Deep and Fix. Fix passed its semantic oracle; the pre-clarification Deep run reproduced `Redesign` instead of the expected `Simplify`.
- Clarify that removing a later competing owner to restore an established repository owner is `Simplify`; reserve `Redesign` for introducing, moving, or materially reshaping a boundary.
- The post-clarification Cursor Deep rerun produced `Simplify`, the expected Blocking finding, a non-permissive recommendation, a valid trace, and no fixture writes. The preceding `socket hang up` attempt produced no result and is excluded.
- Do not count Ask-mode output that cannot inspect the selected Git baseline or deterministic test.
- A fresh public-tag clone passed `51/51` tests and both Skill validators; Codex and Cursor Quick reviews each satisfied all three seeded findings without changing Git state or relevant file hashes.
- The post-release Cursor Quick trace passed with 119 events, 15 tool calls, and no auditor violation.

## v0.2.2 Release Boundaries

- Claude Code remains `Cannot Verify` while valid runtime credentials are unavailable.
- Codex automatically loaded user-level Memory and plugin context, so its post-release run is behavior evidence rather than a fixture-isolation or Skill-only token benchmark.
- Trace auditing is not an operating-system sandbox; Git status and relevant file hashes remain the write-safety authority.
- The release fixtures expose no browser-observable path, so Playwright was not applicable.

## Future Promotion Gates

- Every accepted capability has at least one real use case and one failure case.
- `pnpm test` and both skill validators pass.
- Quick, Deep, and Fix acceptance cases pass in the primary client.
- Every client claimed as runtime verified runs the applicable current-release fixtures.
- Claude Code is either runtime verified with valid credentials or remains explicitly marked `Cannot Verify`.
- Read-only behavior, submit-scope handling, localized headings, and static/runtime evidence boundaries remain intact.
- Changelog and migration notes explain every public contract change.

## Deferred Until Demand Exists

- Automatic code edits, formatting, commits, pushes, or dependency installation.
- A mandatory JSON output schema.
- A hosted review service or GitHub bot.
- Model-specific prompt forks that duplicate the shared skill.

These items add operational or maintenance cost and are not justified by current usage evidence.
