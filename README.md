# Skill FE Code Review

Reusable frontend and hybrid app code review skill for Codex, Claude Code, and Cursor.

The core workflow lives in one open-standard skill:

```text
skills/fe-code-review/SKILL.md
```

The skill supports:

- Quick Review for daily diffs, small PRs, bug fixes, and local refactors.
- Deep Review for risky features, cross-module work, release branches, dependency upgrades, and business-critical flows.
- Fix Review for verifying previous findings and detecting regressions introduced by their fixes.
- Before/after behavior comparison for changed logic, removed branches, missing fallbacks, and incomplete migrations.
- Conditional references for React, Vue, TypeScript, JavaScript, Hybrid/WebView, and release risk.
- Read-only review by default.
- Findings with severity, trigger, impact, root cause, suggested fix, and verification.
- Design/simplification, naming/readability, file placement, and module boundary review.

## Repository Layout

```text
skills/fe-code-review/       Core Agent Skill
adapters/codex/              Codex install notes
adapters/claude-code/        Claude Code install notes
adapters/cursor/             Cursor install notes and thin rule
examples/                    Prompt and output examples
tests/                       Vitest structure checks
```

## Install Locally

Use symlinks while developing so changes apply without copying files.

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

## Release Checklist

- Run `pnpm install --frozen-lockfile`.
- Run `pnpm test`.
- Run the skill validator.
- Test direct invocation in Codex, Claude Code, or Cursor.
- Test at least one Quick Review on a real diff.
- Test at least one Deep Review on a branch range.
- Test at least one Fix Review with a previous finding list and a fix diff.
- Confirm the skill stays read-only unless explicitly asked to modify code.
