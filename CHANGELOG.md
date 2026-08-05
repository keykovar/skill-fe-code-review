# Changelog

All notable changes to this project are documented in this file.

The project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html). Release policy details are in [docs/versioning.md](docs/versioning.md).

## [Unreleased]

### Added

- Added reproducible Quick, Deep, and Fix evaluation fixtures with semantic oracles, an isolated Git fixture preparer, and deterministic behavior tests that do not call model clients in CI.
- Excluded local `.plugin-eval` artifacts from generated fixtures and release tracking.
- Recorded sanitized post-release v0.2.0 installation smoke evidence for Codex and Cursor.
- Recorded v0.2.1 candidate runtime results, including repeated Codex Quick variance, Deep/Fix acceptance, Cursor Quick acceptance, read-only evidence, and the token-observation boundary.

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

[Unreleased]: https://github.com/keykovar/skill-fe-code-review/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/keykovar/skill-fe-code-review/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/keykovar/skill-fe-code-review/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/keykovar/skill-fe-code-review/releases/tag/v0.1.0
