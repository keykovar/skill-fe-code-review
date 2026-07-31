# Roadmap

The roadmap is evidence-driven. Items move into a release only when real review runs show that they solve a repeated problem.

## v0.1.x Maintenance

- Correct installation and adapter documentation as clients evolve.
- Expand compatibility evidence without changing the required output contract.
- Tune false positives and ambiguous severity guidance using sanitized examples.
- Keep validators and repository tests aligned with public documentation.

## v0.2.0 Release Candidate

The current candidate includes:

1. Evidence-backed minimal sufficient design decisions for Quick and Deep Review.
2. A documentation-tool contract that prohibits direct or indirect Context7 use during code review.
3. Optional, mode-budgeted browser runtime evidence with reproducibility, safety, redaction, and environment-equivalence gates.
4. Explicit `Cannot Verify` semantics and a strict Fix Review versus Deep Review boundary.
5. Complete Deep and Fix scope ledgers plus stronger bilingual and compatibility contract tests.

## Remaining v0.2.0 Promotion Gates

- Run Cursor Quick and Fix Review against the current candidate or retain `Cannot Verify` and do not claim candidate runtime compatibility.
- Keep Claude Code as `Cannot Verify` while valid runtime credentials are unavailable.
- Record the required paired minimal-design oracle cases from `docs/evaluation.md` before publishing the release.
- Re-run all deterministic checks and final Deep Review after release metadata is complete.
- Replace candidate changelog links and stable install references only when the `v0.2.0` tag is ready to be created and pushed.

## Post-v0.2.0 Candidates

1. Add reproducible Quick, Deep, and Fix evaluation fixtures with explicit expected findings.
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
