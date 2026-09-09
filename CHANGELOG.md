# Changelog

All notable changes to this project are documented in this file.

The project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html). Release policy details are in [docs/versioning.md](docs/versioning.md).

## [Unreleased]

### Added

- Recorded fresh-tag v0.4.0 post-release validation: Codex Quick passed all semantic, output, collector, trace, and integrity gates; Cursor Ask-mode Quick passed the complete semantic and output oracle but retained collector-denial and outside-workspace trace failures without retry or mode replacement.
- Retained post-v0.4.0 ledger-tally Candidate 01 as `No-Go` after its frozen Cursor Quick run passed execution and integrity gates but recalled only `2 / 3` required Findings and never exercised the repeated-ID target.
- Froze Candidate 02 as a Prompt-only ledger-completeness experiment with a 60-word Skill budget, unchanged mode references, a two-run Quick stop gate, and no orchestrator, retry, replacement, private-source transfer, or external runtime authorization.
- Implemented Candidate 02 within the frozen boundary at `28 / 60` net Skill words and passed `111 / 111` tests, both Skill validators, Node syntax, JSON parsing, and diff checks without starting a runtime request; restored the stable Skill after the later `No-Go` decision.
- Prepared and integrity-froze all seven Candidate 02 public synthetic workspaces with matching expected tests, Agent/Cursor Skill copies, adapters, Git states, and repeat pairs before any isolated Cursor login or runtime request.
- Corrected the isolated Cursor login contract to use file-backed credential storage after the macOS default keychain failed under the temporary HOME; no probe, model review, or source transfer occurred in the failed login attempt.
- Passed Candidate 02's isolated Cursor source-free probe with exact sentinel output, zero tools, MCP, retries, endpoint signals, or stderr, valid trace auditing, and unchanged frozen workspaces.
- Retained Candidate 02 as `No-Go` after the first Stage 1 Quick run passed the complete `3 / 3` semantic oracle and all execution, isolation, read-only, and integrity gates but omitted the shared merge key from one of two `F-003` ledger entries; stopped RUN-02 and Stage 2 without retry or replacement.
- Selected an offline Finding-grouped ledger design that owns one merge basis per Finding group, rejects automatic semantic repair, and requires parser and validator proof before another candidate can be frozen; the stable Skill remains unchanged.
- Added an evaluator-only grouped-ledger parser prototype with `14 / 14` targeted tests and an explicit semantic-boundary case; it is not connected to the stable validator or installed Skill and authorizes no runtime candidate.
- Added seven hashed saved-output cases and a zero-model replay runner, then documented exact grouped-ledger prompt replacements, prospective hashes, word budgets, validator migration, staging, and rollback boundaries without freezing a candidate.
- Implemented Post-v0.4.0 Grouped Ledger Candidate 03 with one group-owned merge basis per multi-condition Finding, promoted the deterministic parser into evaluator tooling, rejected legacy flat ledgers, and preserved Fix and all safety boundaries; runtime freezing and external model requests remain pending.
- Runtime-froze Candidate 03 after all seven fresh public synthetic workspaces and the isolated Cursor source-free probe passed integrity, client-isolation, zero-tool, and zero-source-transfer gates; Stage 1 source-bearing review remains separately authorized.
- Retained Candidate 03 as `No-Go` after shell interpolation corrupted the first source-bearing Prompt and injected out-of-scope main-worktree status, tracked diff, and test output into Cursor; stopped the remaining runs without retry, restored the public Skill and validator to stable v0.4.0, and kept the grouped implementation as evaluator-only evidence.
- Offline-froze Candidate 04 as a new grouped-ledger window with the Candidate 03 runtime delta unchanged, a hash-checked `shell: false` literal-argv Cursor runner, mode-correct Deep versus Quick/Fix collector contracts, seven reproducible public synthetic workspaces, and passing full static gates; its source-free probe passed, but the first authorized Stage 1 attempt stopped before Cursor started because evaluator preflight used zsh's special `path` array and replaced `PATH`. No model request or source transfer occurred, and Candidate 04 is retained `No-Go` without retry or replacement.
- Offline-froze Candidate 05 with the grouped-ledger runtime delta unchanged and a versioned Node preflight runner that uses absolute executables and atomically checks runner, Prompt, client, Git, workspace, Skill, and output boundaries before literal-argv execution. Its source-free probe and local trace replay passed, but the first authorized public-synthetic Deep run stopped `No-Go` before promotion scoring because Cursor could not honor the frozen auto-review mode and fell back to `Allowlist`. The unscored output also failed the grouped-ledger structural validator; no run was retried or replaced, no private source was transmitted, and all frozen workspaces remained unchanged.
- Design-froze Candidate 06 as one bounded core rendering instruction plus an evaluator-only Cursor contract change from unavailable auto-review to explicit read-only `ask` mode. Quick/Deep/Fix references, validator behavior, visible output fields, semantic rules, and the stable public Skill remain unchanged; implementation and every external request require separate authorization.

### Fixed

- Required retained grouped-ledger evaluator children to use concrete `[file:line]` locations, added a deterministic rejection case for arbitrary bracket labels, and kept the stricter parser disconnected from the stable public review-output validator.
- Reconciled Candidate 01/02/03 probe, plan, replay, prototype, rollback, and separately authorized temporary-artifact cleanup evidence, and corrected the Candidate 02 source-free probe documentation link.

## [0.4.0] - 2026-08-25

### Added

- Recorded fresh-tag v0.3.0 post-release validation and retained the incomplete Codex Quick semantic result plus all Cursor isolation, mode, output, and trace failures without promoting any run to a post-release runtime pass.
- Added a frozen v0.4.0 evaluation plan, deterministic candidate fixtures, and a minimal Skill contract for independent Findings and chain-stable Finding IDs.
- Recorded the complete seven-run v0.4.0 candidate window as `No-Go`, retaining Quick recall/identity failures, the severity mismatch, and both Fix auditor false positives without retry or favorable-sample selection.
- Completed the fresh seven-run Candidate 02 window at `4 / 7`: independent-finding recall improved to `8 / 9`, while one omitted Finding, unstable Quick ID ordering, and the retained timeout severity failure kept v0.4.0 at `No-Go`; all execution, read-only, collector, MCP, and workspace-integrity gates passed without retry.
- Completed the frozen Candidate 03 source-bearing window at `2 / 7` without retry: one merged Quick Finding, four structural output-contract failures, and one provider stream failure keep v0.4.0 at `No-Go`, while all read-only, MCP, oracle-access, and workspace-integrity gates passed.
- Corrected the evaluator-only review-output validator to recognize standard Markdown links around documented file locations, then replayed six preserved Candidate 03 outputs with zero model calls; false unknown-ID errors were removed without changing the `2 / 7` decision.
- Implemented and evaluated the frozen Candidate 04 contract for canonical Finding locations, stable Blocking outcome category prefixes, and measurable merge evidence when multiple ledger conditions share one Finding. Static, source-free isolation, execution, severity, Fix, no-finding, read-only, and workspace-integrity gates passed, but the seven-run public-synthetic window completed at `6 / 7`: one unchanged Quick repeat merged independently verifiable contracts and rendered non-sequential IDs. Candidate 04 remains `No-Go` with zero retries or replacement samples.
- Completed Candidate 05's two-stage seven-run public-synthetic window at `4 / 7` with zero retries or replacement samples. Independent-finding recall, Finding-ID coverage, severity, unchanged-repeat identity, and Fix closure all passed, but two ledger-structure failures and one post-collector equivalent Git reread keep v0.4.0 at `No-Go`; all workspaces remained read-only and no private source was transmitted.
- Froze Candidate 06 as three sentence replacements only: independently assessable ledger entries, merge keys on every repeated-ID entry, and collector patches as the authoritative all-uncommitted Fix diff. No external request or source transmission is authorized by the design freeze.
- Implemented Candidate 06 exactly within the frozen instruction budget: `SKILL.md` stayed unchanged, Quick/Deep grew by 14 net English words, and Fix grew by 25; static and runtime acceptance remain separate gates.
- Prepared seven fresh Candidate 06 public-synthetic workspaces with deterministic local fixture commit time, exact Skill copies, expected test exits, and byte-identical Quick/Fix repeat pairs; no external request or source transmission occurred.
- Passed Candidate 06's source-free Joymeet isolation probe with exact `CLIENT_ISOLATION_OK`, zero tools, MCP, retry, plugin, marketplace, or undisclosed endpoint signals, and unchanged frozen workspaces; the pass authorizes no source-bearing run.
- Completed Candidate 06 Stage 1 at `3 / 4` and stopped before Stage 2 after the Deep output omitted required repeated-ID merge keys and selected an unsupported recommendation; retained all passing Fix, severity, collector, read-only, and isolation evidence without retry.
- Completed Candidate 07 at `6 / 7`: centralized repeated-ID finalization and bounded-fix Deep recommendations passed, while one unchanged Quick repeat still merged two independently repairable contracts.
- Completed Candidate 08 at `7 / 7` after a focused tooling-only replay. All seven original model runs passed semantic and structural gates; the raw `6 / 7` auditor result remains recorded, and the saved Fix trace passed after correcting its deterministic `rg` pattern false positive with zero model calls, network requests, source transmission, retries, or workspace changes.
- Retained Candidates 09 and 10 as source-free `No-Go` evidence after the nested Seatbelt capability probe failed and the replacement probe command was rejected; neither candidate transmitted source or started a source-bearing review.
- Retained Candidates 11 and 12 as `No-Go` after their first frozen source-bearing Deep runs failed the grouped-ledger output contract; the remaining runs were cancelled by the stop rule without retry or replacement.
- Completed Candidate 13 at `7 / 7` across Deep, Quick, Fix, and no-finding public-synthetic runs with all semantic, output, isolation, read-only, and workspace-integrity gates passing, then applied the exact candidate locally after separate authorization.
- Added a post-application contract correction that rejects `Merge key` for a single Finding ID and aligns the validator, English and Chinese examples, and `10 / 10` deterministic fixtures. This changes the evaluated Skill tree hash, so the original Candidate 13 runtime result remains historical evidence rather than acceptance for the corrected tree.
- Offline-froze Candidate 14 as the bounded runtime acceptance window for the corrected tree: one public-synthetic Quick single-ID case and one Deep repeated-ID case matched their declared local tests and independent status/tree/Skill integrity checks. Preparation made zero model requests and transmitted no source. The separately authorized Cursor source-free probe passed, but Stage 1 stopped `No-Go`: the Quick output and semantic oracle passed, while Cursor attempted one misspelled outside-workspace read, received `File not found`, and retried the corrected path. The Deep and Codex smoke runs were cancelled without retry, replacement, reinterpretation, or mode switch.
- Retained Candidate 15 as `No-Go` after its relative-path source-free probe and path-safe Quick run passed, but the Quick result escalated the Risk-only ignored-timeout contract to Blocking; no Deep run followed.
- Completed Candidate 16 with a fresh source-free probe plus one public-synthetic Quick and one Deep run. The Quick run kept the ignored-timeout contract at Risk, while the Deep counter-regression retained a demonstrated `Login/Auth Failure` as Blocking; all output, isolation, read-only, path-safety, and workspace-integrity gates passed without retry or replacement.
- Completed the exact-current-tree Fix release gate after retaining one semantically correct but unscored run whose evaluator Prompt contradicted its required previous-Finding read. A fresh replacement workspace used a self-consistent, single-file exception and passed closure, output, trace, path-safety, read-only, and integrity gates without private-source transfer.

### Changed

- Applied Candidate 16's per-finding Blocking proof pass and constrained `Severe Regression` to demonstrated critical-path or broad supported-environment loss, preventing local parameter, caller, contract, or test regressions from being promoted to Blocking without a canonical Blocking outcome.

### Fixed

- Added a reproducible Fix release-acceptance preparer whose read boundary permits only the explicitly required `.evaluation/previous-findings.md` file instead of combining that requirement with a generic `evaluation` prohibition.
- Preserved Candidate 15's frozen Skill identity after Candidate 16 application and normalized both logical and real macOS workspace paths before embedding Quick collector evidence, preventing historical-candidate relabeling and `/var` versus `/private/var` Prompt drift.
- Stopped the trace auditor from treating HTTP(S) URL literals inside read-only `node -e` assertions as shell filesystem paths while preserving direct, aliased, and post-eval outside-workspace read detection; replayed the unchanged Fix traces without new model calls.
- Stopped the trace auditor from treating relative import text inside a confirmed `rg` search pattern as filesystem access while continuing to reject external `rg` path operands, `rg --files` paths, pattern files, and non-`rg` shell reads.
- Rejected empty or ambiguous Fix Review evaluator outputs by requiring one Issue Verification section, at least one prior Finding ID, and exactly one supported closure status per prior Finding.
- Prepared a second v0.4.0 candidate that finalizes the Finding ledger before numbering, splits independently verifiable issues, and requires evidence of a Blocking outcome before escalating a local contract regression; no Candidate 01 runtime result was carried forward, and the new source-free isolation precondition passed before any source-bearing run.
- Removed user-specific absolute paths from the pending public evaluation evidence while preserving client versions, repository-relative runner identity, and isolation-boundary meaning.

## [0.3.0] - 2026-08-20

### Added

- Recorded fresh-tag v0.2.2 post-release smoke evidence for Codex and Cursor.
- Added Codex CLI command/MCP trace auditing and frozen Git-status comparison for detecting client-generated evaluation artifacts.
- Hardened trace auditing with fail-closed Git and MCP authorization, MCP path inspection, and quoted-output redirect detection.
- Published the sanitized v0.3.0 exact-candidate evaluation window, including Quick/Fix efficiency evidence, a synthetic Quick `Keep` pass, and the retained stable-release `No-Go` decision.
- Recorded a current-hash real-project Deep repeat pair under the hardened fail-closed trace auditor while retaining `No-Go` until Quick, Fix, and remaining dataset gates are complete.
- Recorded a current-hash real-project Quick no-finding pass with exact one-time collector adoption, zero findings, `Keep`, and a submit recommendation; retained `No-Go` pending Quick repeat, Fix, and remaining Deep coverage.
- Recorded an unchanged repeat of the current-hash Quick no-finding case with stable semantics, severity, design, recommendation, output contract, collector adoption, and read-only behavior; current-candidate Quick acceptance is complete.
- Recorded the first current-hash Fix run: closure quality and read-only safety passed, while mandatory collector adoption and focused execution discipline failed; retained the result and `No-Go` pending an unchanged repeat and second Fix chain.
- Recorded the exact unchanged current-hash Fix repeat: semantic and safety behavior remained stable and collector adoption recovered, but equivalent Git evidence was still reread; stopped unchanged reruns and retained `No-Go` pending remediation analysis and the second Fix chain.
- Added a dependency-free, read-only review-context collector that combines Git scope, diff, integrity, and CodeGraph evidence in one invocation.
- Added an opt-in trace-audit gate for complete-uncommitted Quick/Fix evaluations that requires exactly one context-collector call and rejects equivalent Git inventory rereads without changing the Skill candidate content.
- Recorded a second distinct current-hash Fix chain with correct closure, severity, zero New Regression, one-time collector use, zero equivalent rereads, and unchanged workspace integrity; retained `No-Go` because the client made an undisclosed plugin-catalog startup request.
- Added a Codex external-evaluation isolation preflight that requires both plugin feature flags to be disabled and a source-free probe to show no undisclosed startup endpoint before private source is transmitted.
- Recorded a second distinct exact-candidate Deep dataset on a public React/JavaScript package-entry change: required Blocking recall, `Simplify`, browser evidence, output contract, read-only integrity, Playwright artifact isolation, and corrected client network isolation all passed; retained `No-Go` pending the third distinct Deep dataset and unresolved historical Fix execution/isolation gates.
- Completed the frozen v0.3.0 prospective Fix replacement window at `3 / 3`, including an unchanged repeat with stable closure, severity, New Regression, recommendation, collector, read-only, integrity, and client-isolation behavior; the exact candidate is now `Go` for release while historical failures remain recorded.

### Fixed

- Updated stable install and compatibility documentation to v0.2.2 after release.
- Documented the exact fixture `--output` invocation without an extra pnpm argument separator.

## [0.2.2] - 2026-08-06

### Added

- Added a deterministic Cursor Agent `stream-json` trace auditor that rejects direct oracle reads, direct path requests outside the generated fixture workspace, and explicit or common write attempts before model output is scored.

### Changed

- Tightened runtime evaluation guidance so client mode, trace integrity, unchanged Git state, semantic scoring, and deterministic behavior are independent acceptance gates.
- Clarified that deleting a later competing owner to restore an established repository owner is `Simplify`, while `Redesign` requires introducing, moving, or materially reshaping an ownership or data-flow boundary.

## [0.2.1] - 2026-08-05

### Added

- Added reproducible Quick, Deep, and Fix evaluation fixtures with semantic oracles, an isolated Git fixture preparer, and deterministic behavior tests that do not call model clients in CI.
- Recorded sanitized post-release v0.2.0 installation smoke evidence for Codex and Cursor.
- Recorded v0.2.1 pre-release runtime results, including repeated Codex Quick variance, Deep/Fix acceptance, Cursor Quick acceptance, read-only evidence, and the token-observation boundary.

### Changed

- Excluded local `.plugin-eval` artifacts from generated fixtures and release tracking.

## [0.2.0] - 2026-07-31

### Changed

- Formalized minimal sufficient design checks for overdesign, semantic duplication, existing capability reuse, redundant state or process, and unjustified cases or fallbacks while preventing mechanical DRY and unsafe simplification.
- Aligned official-documentation evidence with tool contracts: Context7 is prohibited directly and indirectly during code review, and unsupported external semantics are reported as `Cannot Verify`.
- Added optional, mode-budgeted browser runtime evidence with explicit entry, reproducible-state, expected-observation, side-effect, redaction, and environment-equivalence gates.
- Clarified `Cannot Verify` semantics and kept architecture-changing fixes within the Fix Review template and budget while recommending a separate Deep Review.
- Expanded Deep and Fix Review scope ledgers and added stronger bilingual, compatibility, and output-contract regression tests.
- Clarified that review and evaluation requests authorize chat output only, including in Cursor Agent or Build mode.
- Aligned conclusion and final-recommendation wording with severity gates so Improve-only findings remain explicitly non-blocking.

## [0.1.1] - 2026-07-23

### Added

- Stable, tag-pinned installation instructions for Codex, Claude Code, and Cursor.
- Simplified Chinese README.
- Public review-output contract, severity semantics, and direct output-example links in both READMEs.
- Compatibility evidence levels and v0.1.1 delta evaluation results.
- Versioning policy, roadmap, and GitHub issue forms.

## [0.1.0] - 2026-07-23

### Added

- Quick, Deep, and Fix Review workflows.
- Read-only safety boundaries and submit-scope checks.
- Before/after behavior comparison and new-regression detection.
- React, Vue, TypeScript, JavaScript, Hybrid/WebView, and release-risk references.
- Codex, Claude Code, and Cursor adapters.
- Chinese output templates and example outputs.
- Vitest contract tests, skill validation, and GitHub Actions CI.

[Unreleased]: https://github.com/keykovar/skill-fe-code-review/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/keykovar/skill-fe-code-review/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/keykovar/skill-fe-code-review/compare/v0.2.2...v0.3.0
[0.2.2]: https://github.com/keykovar/skill-fe-code-review/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/keykovar/skill-fe-code-review/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/keykovar/skill-fe-code-review/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/keykovar/skill-fe-code-review/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/keykovar/skill-fe-code-review/releases/tag/v0.1.0
