# Versioning and Release Policy

This repository uses Semantic Versioning for the skill contract, adapters, and public documentation. The package is not published to npm; `package.json` supplies repository metadata and the release version.

## Version Meaning

### Patch

Use a patch release for backward-compatible fixes and clarifications, such as:

- Correcting an adapter or install command.
- Clarifying evidence, severity, or validation wording without changing required output.
- Fixing validators, tests, examples, or documentation.
- Narrowing false-positive behavior while preserving the public review contract.

### Minor

Use a minor release for backward-compatible capability changes, such as:

- Adding a review mode or framework reference.
- Adding a required output section or finding field.
- Adding a supported client adapter.
- Materially extending review scope, behavior comparison, or release-risk analysis.

### Major

Use a major release for breaking changes, such as:

- Removing or renaming a public review mode.
- Removing or renaming required sections, severities, or Fix Review statuses.
- Weakening read-only defaults or changing submit recommendation semantics.
- Changing install paths without a compatible migration path.

Before `1.0.0`, minor releases may still evolve the contract. Breaking behavior must nevertheless be documented explicitly.

## Release Rules

- Release tags are immutable. Never move or reuse a published tag.
- The `package.json` version, changelog entry, Git tag, and GitHub Release must match.
- Stable installation documentation must pin an immutable tag.
- Compatibility claims must state whether evidence is structural or runtime.
- A client without executable credentials must be marked `Cannot Verify`, not passed.
- Model-based evaluation results must record scope and limitations; Vitest must not be presented as proof of AI review quality.

## Release Procedure

1. Choose the version from the contract change, not from the number of changed files.
2. For a release candidate, update `package.json`, the candidate changelog entry, compatibility evidence, and evaluation results while keeping stable install references pinned to the current immutable tag.
3. Run `pnpm install --frozen-lockfile` and `pnpm test`.
4. Run both the repository-local validator and the official skill validator.
5. Execute applicable smoke cases on every client claimed as runtime verified, and run the complete Quick, Deep, and Fix acceptance protocol on at least one primary client.
6. For the final release commit, add the release date, change candidate comparison links to the immutable tag, and update stable install references to the new version.
7. Review the final diff and commit only after explicit confirmation.
8. Create an annotated tag, push the commit and tag, then publish the GitHub Release as separately confirmed actions.

## Current Version

- Stable: `v0.2.2`
- Previous stable: `v0.2.1`
- v0.2.2 status: fresh-tag deterministic validation and Codex/Cursor Quick runtime checks passed; candidate Cursor Deep/Fix evidence passed; Claude Code remains `Cannot Verify`
