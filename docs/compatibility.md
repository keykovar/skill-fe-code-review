# Compatibility

Stable evidence verified: 2026-08-06
Stable evidence baseline: [`v0.2.2`](https://github.com/keykovar/skill-fe-code-review/releases/tag/v0.2.2)

## Evidence Levels

- `Runtime verified`: the client loaded the installed skill and completed a review against an inspected diff.
- `Structural verified`: install paths, required files, frontmatter, and adapter contracts passed deterministic validation.
- `Cannot Verify`: required runtime evidence was unavailable or non-equivalent. This is an evidence state, not a severity, and is not equivalent to a pass or a failure.

## Historical v0.1.1 Evidence

| Client | Version | Install surface | Structural evidence | Runtime evidence | Status |
| --- | --- | --- | --- | --- | --- |
| Codex | Current local desktop build; version not captured | User or repository skill path | Skill validator and repository tests pass | v0.1.0 Quick Review smoke and manual Quick, Deep, and Fix runs; carried to v0.1.1 because the core Skill tree is identical | Runtime verified |
| Cursor | 3.12.17 | Project `.cursor/skills` plus thin `.cursor/rules` adapter | Adapter and repository tests pass | v0.1.0 Quick Review detected both seeded issues, produced localized sections, and made no edits; carried to v0.1.1 because the core Skill tree is identical | Runtime verified |
| Claude Code | 2.1.206 | User or project `.claude/skills` | Adapter and repository tests pass; project-local skill copy validated | Not executed because the available account subscription expired | Cannot Verify |

## v0.1.1 Delta

v0.1.1 changes repository documentation, governance files, and deterministic contract tests. It does not change `skills/fe-code-review` or any client adapter.

The Git tree ID for `skills/fe-code-review` is `a66e26e60e27f643f35b402c6660038c7070e759` in both v0.1.0 and the v0.1.1 release candidate. Existing Codex and Cursor runtime evidence therefore remains applicable. No new model-based runtime pass is claimed for v0.1.1.

## Interpretation

The core skill uses a shared `SKILL.md`; client adapters contain only installation or routing details. A structural pass confirms that the repository ships the expected files, but it cannot prove that a client account, selected model, or future client version will execute the workflow identically.

Runtime output can vary by model and client version. Re-run the smoke protocol after:

- Changing required output sections, severity rules, or read-only boundaries.
- Changing an adapter or documented install path.
- Upgrading a client across a major version.
- Publishing a new minor or major release.

## Stable v0.2.2 Evidence

v0.2.2 adds Cursor trace-integrity evaluation and clarifies one minimal-sufficient-design classification. It does not add a review mode, output section, Finding field, or install path.

| Client | Structural evidence | Runtime evidence | Status |
| --- | --- | --- | --- |
| Codex CLI 0.146.0 | Fresh public-tag clone, `51/51` repository tests, and both Skill validators pass | Post-release Quick review found all three seeded issues with accepted severity and recommendation; Git status and relevant file hashes remained unchanged | Runtime verified |
| Cursor Agent CLI 2026.08.04-aaa8809 | Adapter and repository contract tests pass | Candidate Deep/Fix and post-release Quick reviews satisfied their semantic oracles; the post-release Quick trace contained 119 events and 15 tool calls with no auditor violation, and file hashes remained unchanged | Runtime verified |
| Claude Code | Adapter and repository contract tests pass | Not executed because valid runtime credentials are unavailable | Cannot Verify |

See [v0.2.2 Evaluation Results](evaluation-results/v0.2.2.md) and [v0.2.2 Post-release Smoke Results](evaluation-results/v0.2.2-post-release.md) for the exact fixture, trace, oracle, and evidence boundaries.

## Historical v0.2.1 Evidence

v0.2.1 adds evaluation infrastructure and does not change the shared Skill tree or client adapters.

| Client | Structural evidence | Runtime evidence | Status |
| --- | --- | --- | --- |
| Codex CLI 0.146.0 | `47/47` repository tests and both Skill validators pass | Quick, Deep, and Fix fixture reviews completed without writes; the repeated Quick run satisfied the complete oracle | Runtime verified |
| Cursor Agent CLI 2026.07.23-e383d2b | Adapter and repository contract tests pass | Quick fixture review satisfied the complete oracle without writes; Deep and Fix were not rerun | Runtime verified |
| Claude Code | Adapter and repository contract tests pass | Not executed because valid runtime credentials are unavailable | Cannot Verify |

See [v0.2.1 Evaluation Results](evaluation-results/v0.2.1.md) for the exact fixture, oracle, variance, token, and evidence boundaries.

## Stable v0.2.0 Evidence

v0.2.0 changes the core Skill contract. Stable v0.1.1 runtime results remain historical evidence for that release, but they do not verify v0.2.0.

| Client | Structural evidence | Runtime evidence | Status |
| --- | --- | --- | --- |
| Codex | `41/41` repository tests and both Skill validators pass | v0.2.0 Quick, Deep, and Fix Review smoke runs plus a post-hardening Improve-only Quick rerun completed without file writes | Runtime verified |
| Cursor | Adapter and repository contract tests pass | Earlier Cursor Desktop 3.13.25 runs plus a post-hardening Cursor CLI 2026.01.23 Improve-only Quick rerun completed without fixture writes; the rerun returned `可以提交`, one `Improve` / `Simplify`, and an explicitly non-blocking final recommendation | Runtime verified |
| Claude Code | Adapter and repository contract tests pass | Not executed because valid runtime credentials are unavailable | Cannot Verify |

The shared core contract defines the following fallback for Codex, Claude Code, and Cursor:

- When a compatible Playwright or browser capability is callable, the review may collect evidence within the selected mode budget only in an already runnable local or isolated environment with an explicit entry point, a controlled and repeatable initial state or one reconstructible before each run without production data or a real account, and an explicit expected observation.
- The run must require no dependency installation, configuration changes, repository writes, production access, real sensitive data, or destructive or irreversible side effects.
- When the capability or runnable environment is unavailable, the client continues with source, call-path, package, and permitted official-documentation evidence, then marks affected runtime claims `Cannot Verify`.
- Fix Review must reuse the original environment, state, steps, and observable assertions. Non-equivalent evidence may be recorded but cannot support `Resolved`; architecture-changing fixes retain the Fix template and budget and should recommend a separate Deep Review.
- Browser automation is optional. Its absence does not make the core review structurally incompatible and must not suppress static findings.
- A browser pass cannot be carried forward as evidence for a real WebView, Native bridge, physical device, or production environment.

## Known Limitations

- Claude Code v0.2.2 runtime behavior is not claimed because valid credentials are unavailable.
- Codex v0.2.2 post-release runtime evidence covers the Quick fixture; current Deep and Fix classification evidence comes from Cursor.
- The repeated Codex Quick run passed the complete oracle, but the first run's classification variance remains recorded rather than discarded.
- Codex loaded user-level Memory and plugin context, so its reported token values are not a Skill-only cost benchmark and the run is not a clean fixture-isolation benchmark.
- Cursor trace auditing detects explicit tool and shell requests; it is not an operating-system sandbox, so before/after Git state and relevant file hashes remain required evidence.
- The repeatable fixtures validate seeded-finding recall, classification, recommendation consistency, and read-only behavior, not production framework behavior, general model precision or recall, or performance.
- Local code remains primary for repository-specific behavior. Official documentation may be queried only through a channel whose tool contract permits code review; the Context7 MCP tool contract excludes code review, so the skill does not use Context7 directly or indirectly through delegation, subagents, proxies, or request reframing.
- No v0.2.2 result claims browser runtime evidence; the release fixtures have no browser-observable product path.
- The paired minimal-design oracle is a manual synthetic-fixture dataset. It verifies the recorded decisions and forbidden outcomes, not model quality in every repository.

See [v0.2.2 Evaluation Results](evaluation-results/v0.2.2.md) and [v0.2.2 Post-release Smoke Results](evaluation-results/v0.2.2-post-release.md) for current release evidence, [v0.2.1 Evaluation Results](evaluation-results/v0.2.1.md) for the previous stable release, and [v0.1.0 Evaluation Results](evaluation-results/v0.1.0.md) for the original runtime cases and metrics.
