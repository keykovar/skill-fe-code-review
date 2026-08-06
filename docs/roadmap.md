# Roadmap

The roadmap is evidence-driven. Items move into a release only when real review runs show that they solve a repeated problem.

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

## v0.3.0 Real-project Evaluation Baseline

Before accepting any post-v0.2.2 behavior candidate, run the documented real-project matrix across React, Vue, TypeScript, JavaScript, Hybrid/WebView, no-clear-issue, and actual Fix Review chains. Measure required-finding recall, finding precision, severity accuracy, recommendation consistency, output-contract compliance, read-only safety, scope/oracle access, and Fix Review closure without changing the current Skill contract.

Use the [v0.3.0 Real-project Evaluation Plan](v0.3.0-real-project-evaluation-plan.md) and [Real-project Evaluation Record Template](real-project-evaluation-record-template.md). A candidate enters v0.3.0 only when repeated failures justify it and every affected case is rerun. Token reduction or plugin-eval cost alone is not sufficient evidence for a Skill change.

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
