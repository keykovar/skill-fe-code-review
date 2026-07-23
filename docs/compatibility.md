# Compatibility

Last verified: 2026-07-23
Release under test: [`v0.1.0`](https://github.com/keykovar/skill-fe-code-review/releases/tag/v0.1.0)

## Evidence Levels

- `Runtime verified`: the client loaded the installed skill and completed a review against an inspected diff.
- `Structural verified`: install paths, required files, frontmatter, and adapter contracts passed deterministic validation.
- `Cannot Verify`: runtime execution was unavailable. This is not equivalent to a pass or a failure.

## Matrix

| Client | Version | Install surface | Structural evidence | Runtime evidence | Status |
| --- | --- | --- | --- | --- | --- |
| Codex | Current local desktop build; version not captured | User or repository skill path | Skill validator and repository tests pass | Quick Review passed on the v0.1.0 smoke fixture; Quick, Deep, and Fix were also exercised in manual pre-release runs | Runtime verified |
| Cursor | 3.12.17 | Project `.cursor/skills` plus thin `.cursor/rules` adapter | Adapter and repository tests pass | Quick Review loaded `SKILL.md`, detected both seeded issues, produced localized sections, and made no edits | Runtime verified |
| Claude Code | 2.1.206 | User or project `.claude/skills` | Adapter and repository tests pass; project-local skill copy validated | Not executed because the available account subscription expired | Cannot Verify |

## Interpretation

The core skill uses a shared `SKILL.md`; client adapters contain only installation or routing details. A structural pass confirms that the repository ships the expected files, but it cannot prove that a client account, selected model, or future client version will execute the workflow identically.

Runtime output can vary by model and client version. Re-run the smoke protocol after:

- Changing required output sections, severity rules, or read-only boundaries.
- Changing an adapter or documented install path.
- Upgrading a client across a major version.
- Publishing a new minor or major release.

## Known Limitations

- Claude Code runtime behavior is not claimed for this verification date.
- Cursor was runtime-tested with Quick Review only; Deep and Fix Review remain structurally compatible but were not executed in Cursor for v0.1.0.
- The repeatable v0.1.0 fixture validates finding recall and read-only behavior, not production framework behavior, model quality in every repository, or performance.
- Official documentation or Context7 should be used only when a finding depends on version-sensitive framework or library behavior. Local code evidence remains primary for repository-specific behavior.

See [v0.1.0 Evaluation Results](evaluation-results/v0.1.0.md) for the executed cases and metrics.
