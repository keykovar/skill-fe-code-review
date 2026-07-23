# Skill FE Code Review

[![CI](https://github.com/keykovar/skill-fe-code-review/actions/workflows/ci.yml/badge.svg)](https://github.com/keykovar/skill-fe-code-review/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/keykovar/skill-fe-code-review)](https://github.com/keykovar/skill-fe-code-review/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

English | [简体中文](README.zh-CN.md)

Reusable frontend and hybrid app code review skill for Codex, Claude Code, and Cursor.

The complete workflow lives in one open-standard skill:

```text
skills/fe-code-review/SKILL.md
```

## Review Modes

| Mode | Use it for | Main result |
| --- | --- | --- |
| Quick Review | Daily diffs, small PRs, bug fixes, local refactors | Focused findings and submit recommendation |
| Deep Review | Risky features, cross-module work, release changes, dependency upgrades | Change map, requirement gaps, release risks, and deeper evidence |
| Fix Review | Changes made after a previous review | Finding-by-finding closure plus new-regression detection |

Every mode is read-only by default. Quick and Deep Review compare behavior before and after the change. Findings include severity, trigger, impact, root cause, suggested fix, and verification guidance.

The skill also covers design and simplification, naming and readability, file placement and module boundaries, test gaps, and release risk. React, Vue, TypeScript, JavaScript, and Hybrid/WebView guidance is loaded only when relevant.

## Repository Layout

```text
skills/fe-code-review/       Core Agent Skill
adapters/codex/              Codex install notes
adapters/claude-code/        Claude Code install notes
adapters/cursor/             Cursor install notes and thin rule
docs/                        Compatibility, evaluation, versioning, and roadmap
examples/                    Prompt and output examples
tests/                       Vitest structure and contract checks
```

## Install a Stable Release

The current stable release is `v0.1.0`. Pin the tag instead of installing from `main` when reproducibility matters.

```bash
git clone --depth 1 --branch v0.1.0 \
  https://github.com/keykovar/skill-fe-code-review.git
cd skill-fe-code-review
```

### Codex

User-level install:

```bash
mkdir -p "$HOME/.agents/skills"
cp -R "skills/fe-code-review" "$HOME/.agents/skills/"
```

Repository-level install:

```bash
mkdir -p "/absolute/path/to/project/.agents/skills"
cp -R "skills/fe-code-review" "/absolute/path/to/project/.agents/skills/"
```

### Claude Code

```bash
mkdir -p "$HOME/.claude/skills"
cp -R "skills/fe-code-review" "$HOME/.claude/skills/"
```

### Cursor

```bash
TARGET_REPO="/absolute/path/to/project"
mkdir -p "$TARGET_REPO/.cursor/skills" "$TARGET_REPO/.cursor/rules"
cp -R "skills/fe-code-review" "$TARGET_REPO/.cursor/skills/"
cp "adapters/cursor/rules/fe-code-review.mdc" \
  "$TARGET_REPO/.cursor/rules/fe-code-review.mdc"
```

Open a new task or client window after installation if the running client does not discover the skill immediately. For upgrades, install a new immutable tag into a clean checkout and replace the old installed copy.

## Development Install

Use symlinks only when developing the skill locally so edits apply without repeated copies.

Codex:

```bash
mkdir -p "$HOME/.agents/skills"
ln -s "$(pwd)/skills/fe-code-review" "$HOME/.agents/skills/fe-code-review"
```

Claude Code:

```bash
mkdir -p "$HOME/.claude/skills"
ln -s "$(pwd)/skills/fe-code-review" "$HOME/.claude/skills/fe-code-review"
```

Cursor:

```bash
mkdir -p ".cursor/skills" ".cursor/rules"
ln -s "$(pwd)/skills/fe-code-review" ".cursor/skills/fe-code-review"
cp "adapters/cursor/rules/fe-code-review.mdc" ".cursor/rules/fe-code-review.mdc"
```

## Compatibility

| Client | v0.1.0 evidence | Status |
| --- | --- | --- |
| Codex | Quick smoke test plus manual Quick, Deep, and Fix runs | Runtime verified |
| Cursor 3.12.17 | Project-local skill and Quick smoke test | Runtime verified |
| Claude Code 2.1.206 | Skill layout and adapter validation | Structural pass; runtime not verified |

Claude Code runtime verification is currently marked `Cannot Verify` because the available account subscription expired. This is not reported as a runtime pass. See [Compatibility](docs/compatibility.md) and [v0.1.0 Evaluation Results](docs/evaluation-results/v0.1.0.md) for evidence and limitations.

## Usage

Quick Review:

```text
Use fe-code-review, Quick Review the current uncommitted changes.
```

Deep Review:

```text
Use fe-code-review, Deep Review main...HEAD. Focus on regression risk, test gaps, and release risk.
```

Fix Review:

```text
Use fe-code-review, Fix Review the current changes against the previous review findings. Verify each finding and check for new regressions. Read-only.
```

Naming and structure:

```text
Use fe-code-review to review naming, readability, file placement, and module boundaries in the current diff.
```

More examples are available in [Prompt Examples](examples/prompts.md).

## Local Validation

Validate the skill shape:

```bash
python3 /path/to/skill-creator/scripts/quick_validate.py skills/fe-code-review
```

The validator requires a Python environment with `PyYAML` available.

Run repository checks:

```bash
pnpm install --frozen-lockfile
pnpm test
```

Vitest checks the repository structure, adapters, references, and required review contracts. AI review quality is evaluated with the manual protocol in [Evaluation](docs/evaluation.md), not asserted by deterministic unit tests.

## Project Documents

- [Changelog](CHANGELOG.md)
- [Compatibility](docs/compatibility.md)
- [Evaluation Protocol](docs/evaluation.md)
- [v0.1.0 Evaluation Results](docs/evaluation-results/v0.1.0.md)
- [Versioning and Release Policy](docs/versioning.md)
- [Roadmap](docs/roadmap.md)

## Release Checklist

- Run `pnpm install --frozen-lockfile` and `pnpm test`.
- Run the repository-local and official skill validators.
- Test direct invocation on every client whose runtime is reported as verified.
- Run Quick, Deep, and Fix Review acceptance cases.
- Confirm review runs remain read-only and separate static evidence from runtime validation.
- Update the changelog, compatibility evidence, and evaluation result for the release.
- Follow [Versioning and Release Policy](docs/versioning.md); never move an existing release tag.
