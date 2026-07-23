# Roadmap

The roadmap is evidence-driven. Items move into a release only when real review runs show that they solve a repeated problem.

## v0.1.x Maintenance

- Correct installation and adapter documentation as clients evolve.
- Expand compatibility evidence without changing the required output contract.
- Tune false positives and ambiguous severity guidance using sanitized examples.
- Keep validators and repository tests aligned with public documentation.

## v0.2.0 Candidates

1. Add reproducible Quick, Deep, and Fix evaluation fixtures with explicit expected findings.
2. Add stable finding IDs so Fix Review can map previous findings without relying only on prose.
3. Add a large-diff coverage ledger that records reviewed, deferred, generated, and unverified files.
4. Clarify precedence among repository instructions, client rules, mode references, and user-requested scope.
5. Add sanitized cross-client output snapshots only where they improve regression diagnosis.

## v0.2.0 Promotion Gates

- Every accepted capability has at least one real use case and one failure case.
- `pnpm test` and both skill validators pass.
- Quick, Deep, and Fix acceptance cases pass in Codex.
- Cursor runs at least Quick and Fix Review against repeatable fixtures.
- Claude Code is either runtime verified with valid credentials or remains explicitly marked `Cannot Verify`.
- Read-only behavior, submit-scope handling, localized headings, and static/runtime evidence boundaries remain intact.
- Changelog and migration notes explain every public contract change.

## Deferred Until Demand Exists

- Automatic code edits, formatting, commits, pushes, or dependency installation.
- A mandatory JSON output schema.
- A hosted review service or GitHub bot.
- Model-specific prompt forks that duplicate the shared skill.

These items add operational or maintenance cost and are not justified by current usage evidence.
