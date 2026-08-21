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

The current stable release is `v0.3.0`. Pin the tag instead of installing from `main` when reproducibility matters.

```bash
git clone --depth 1 --branch v0.3.0 \
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

### Stable v0.3.0

| Client | v0.3.0 evidence | Status |
| --- | --- | --- |
| Codex CLI 0.146.0 | Exact-candidate Quick, three-dataset Deep, and prospective Fix `3 / 3` acceptance pass; the fresh-tag Quick smoke retained a `2 / 3` semantic failure | Runtime verified |
| Cursor | Structural and adapter contracts pass; fresh-tag plan/ask runs failed isolation, tool, output, or semantic gates | `Cannot Verify` |
| Claude Code | Structural and adapter contracts pass; runtime credentials unavailable | `Cannot Verify` |

Cursor and Claude Code v0.3.0 runtime verification remain `Cannot Verify`; neither is reported as a runtime pass. The Codex status comes from the exact-candidate acceptance window, not the incomplete post-release Quick run. See [Compatibility](docs/compatibility.md), [v0.3.0 Evaluation Results](docs/evaluation-results/v0.3.0.md), and [v0.3.0 Post-release Smoke Results](docs/evaluation-results/v0.3.0-post-release.md) for evidence and limitations. Historical v0.2.2 evidence remains available in [v0.2.2 Evaluation Results](docs/evaluation-results/v0.2.2.md) and [v0.2.2 Post-release Smoke Results](docs/evaluation-results/v0.2.2-post-release.md).

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

## Review Output

The result is a decision-oriented review report, not only a list of comments.

> [!NOTE]
> The minimal-sufficient-design rules, stricter documentation-tool contract, conditional browser evidence, clarified `Cannot Verify` semantics, Fix/Deep mode boundary, and recommendation-consistency contract below are part of stable `v0.2.0`. The `v0.1.1` tag remains available for the previous contract.

| Mode | Required result |
| --- | --- |
| Quick Review | Overall conclusion, exact review scope, prioritized findings, engineering-quality checks, test gaps, evidence, and final recommendation |
| Deep Review | Quick Review coverage plus change understanding, change map, requirement gaps, cross-module impact, and release risks |
| Fix Review | Review conclusion, previous-finding status, new regressions, behavior delta, remaining test gaps, and closure recommendation |

Every Quick and Deep Review report should provide:

- A submit or next-step recommendation. Chinese Quick Review uses `可以提交`, `修改后提交`, or `不建议提交`; Deep Review uses the equivalent next-step wording.
- The comparison baseline and requested scope, including modified, staged, unstaged, and untracked files.
- Findings grouped as `Blocking`, `Risk`, and `Improve`.
- For each material finding: file and line, trigger condition, impact, root cause, suggested fix, and verification method.
- Separate checks for minimal sufficient design and simplification, naming and readability, and file placement and module boundaries.
- Test gaps, local evidence, commands that actually ran, skipped validation, and runtime paths that remain unverified.
- A final recommendation that reflects unresolved blockers and verification limits.

The conclusion and final recommendation are one decision contract. `Can submit` / `can proceed` requires no unresolved Blocking finding and no Risk or required verification treated as a gate. A Blocking finding requires at least `submit after changes`; a Risk must be identified either as a gate or as explicitly accepted residual risk. Improve-only findings are optional and do not block submission or the next step unless the user declared a stricter quality gate before the review. The final section must not introduce a new pre-submit or pre-next-step condition.

Minimal sufficient design means using only the complexity justified by current requirements, runtime contracts, and repository patterns; it does not mean the fewest lines of code. The review checks for overdesign, semantic duplication and drift risk, missed reuse, redundant state or process, and unjustified cases or fallbacks. It does not recommend mechanical DRY extraction when code only looks similar, or simplification that weakens correctness, compatibility, recovery, observability, or rollback safety.

Severity has stable meaning:

- `Blocking`: can break clean checkout, CI, build, runtime, a critical flow, or data integrity. Referenced untracked files are submit-blocking.
- `Risk`: can cause edge-case failures, races, state inconsistency, weak error handling, performance regressions, or unsafe coupling.
- `Improve`: optional maintainability, naming, type-expression, or placement improvement.

In Quick and Deep Review, `Cannot Verify` is an evidence state, not a severity. In Fix Review it is a closure status for a previous finding; in `Design / Simplify` it is a design decision used when the selected scope lacks enough evidence. Do not use it as a substitute for `Blocking`, `Risk`, or `Improve`.

Fix Review preserves the original severity and assigns exactly one status to every previous finding: `Resolved`, `Partially Resolved`, `Unresolved`, or `Cannot Verify`. New defects introduced by the fix are reported separately as `New Regression`.

If a fix changes architecture or exposes broader risk, complete it with the Fix Review template and budget, then recommend a separate Deep Review. Do not merge the two modes into one report.

### Documentation and Browser Evidence

Repository source, call paths, lockfiles, installed dependency source or types, configuration, and project documentation remain the primary evidence. When a finding depends on version-sensitive framework or library semantics and local evidence is insufficient, the review may query official documentation through a channel whose tool contract permits code review. The official Context7 MCP tool contract excludes code review, so Context7 must not be used directly or indirectly during a review, including through delegation, a subagent, a proxy, or a reframed request intended to bypass that restriction. If no permitted documentation channel is available, report the external claim as `Cannot Verify` instead of guessing. Never send private source, API payloads, internal paths, credentials, or user data to an external documentation service.

Playwright or an equivalent browser tool is optional runtime evidence, not a dependency of the skill. Use it only when the finding concerns observable browser behavior and every gate is satisfied: an already runnable local or isolated environment; an explicit entry point; a controlled and repeatable initial state, or one that can be reconstructed before each run without production data or a real account; an explicit expected observation; and no dependency installation, configuration changes, repository writes, production access, real sensitive data, or destructive or irreversible side effects. The mode budget is:

- Quick Review: skip by default; run at most one critical path when it can materially resolve uncertainty.
- Deep Review: run the primary path and at most one evidence-backed high-risk path.
- Fix Review: reuse the original environment, initial state, reproduction steps, and observable assertions. If any required element is unavailable, use `Cannot Verify`; evidence from a different environment may be reported separately but cannot support `Resolved`. Verify one directly affected regression path only when evidence justifies it.

Record the environment and URL type, entry point, browser and viewport, initial state and how it is reconstructed, expected result, actions, observed result, and redacted console/network summary under `Browser runtime evidence`. If the client lacks browser automation or the environment is unavailable, continue the static review and mark the affected runtime claim `Cannot Verify`. A browser pass does not prove behavior in a real WebView, Native bridge, device, or production environment. See [Compatibility](docs/compatibility.md) for client fallbacks.

Full output examples:

- [Quick Review, Simplified Chinese](examples/outputs/quick-review.zh-CN.md)
- [Deep Review](examples/outputs/deep-review.md)
- [Fix Review, Simplified Chinese](examples/outputs/fix-review.zh-CN.md)

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
- [v0.3.0 Real-project Evaluation Plan](docs/v0.3.0-real-project-evaluation-plan.md)
- [v0.3.0 Evaluation Results](docs/evaluation-results/v0.3.0.md)
- [v0.3.0 Post-release Smoke Results](docs/evaluation-results/v0.3.0-post-release.md)
- [Real-project Evaluation Record Template](docs/real-project-evaluation-record-template.md)
- [v0.2.0 Evaluation Results](docs/evaluation-results/v0.2.0.md)
- [v0.2.0 Post-release Smoke Results](docs/evaluation-results/v0.2.0-post-release.md)
- [v0.2.1 Evaluation Results](docs/evaluation-results/v0.2.1.md)
- [v0.2.2 Evaluation Results](docs/evaluation-results/v0.2.2.md)
- [v0.2.2 Post-release Smoke Results](docs/evaluation-results/v0.2.2-post-release.md)
- [v0.1.1 Evaluation Results](docs/evaluation-results/v0.1.1.md)
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
