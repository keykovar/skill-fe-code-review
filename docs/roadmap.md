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

## Post-v0.2.0 Candidates

1. Implemented and runtime-accepted for the next patch, unreleased: checked-in Quick, Deep, and Fix evaluation fixtures with explicit semantic oracles and deterministic behavior checks.
2. Add stable finding IDs so Fix Review can map previous findings without relying only on prose.
3. Add a large-diff coverage ledger that records reviewed, deferred, generated, and unverified files.
4. Clarify precedence among repository instructions, client rules, mode references, and user-requested scope.
5. Add sanitized cross-client output snapshots only where they improve regression diagnosis.

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
