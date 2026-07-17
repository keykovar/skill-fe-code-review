# Codex Adapter

Codex can load this skill from user or repository skill paths.

## User Install

```bash
mkdir -p "$HOME/.agents/skills"
ln -s "$(pwd)/skills/fe-code-review" "$HOME/.agents/skills/fe-code-review"
```

## Repository Install

```bash
mkdir -p ".agents/skills"
cp -R "skills/fe-code-review" ".agents/skills/fe-code-review"
```

## Test Prompts

```text
Use $fe-code-review to Quick Review the current uncommitted changes.
```

```text
Use $fe-code-review to Deep Review main...HEAD. Focus on regression risk, test gaps, and release risk.
```

```text
Use $fe-code-review to Fix Review the current changes against the previous findings and check for new regressions.
```

## Expected Behavior

- The skill is read-only by default.
- Quick Review is used for normal diffs.
- Deep Review is used for risky, cross-module, release, dependency, or performance-sensitive changes.
- Fix Review verifies previous findings and scans the fix diff for new regressions.
- Quick and Deep Review compare behavior before and after the change.
- Findings include trigger, impact, root cause, suggested fix, and verification.
