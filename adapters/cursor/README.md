# Cursor Adapter

Cursor supports Agent Skills and rules. Install the shared skill and add the thin rule when you want Cursor to route review requests consistently.

## Project Install

```bash
mkdir -p ".cursor/skills" ".cursor/rules"
cp -R "skills/fe-code-review" ".cursor/skills/fe-code-review"
cp "adapters/cursor/rules/fe-code-review.mdc" ".cursor/rules/fe-code-review.mdc"
```

## Test Prompts

```text
Use fe-code-review to review the current diff in read-only mode.
```

```text
Use fe-code-review, Deep Review main...HEAD. Focus on WebView and release risk.
```

```text
Use fe-code-review, Fix Review the current changes against the previous findings and check for new regressions.
```

## Rule Purpose

The Cursor rule is intentionally thin. The complete workflow remains in `skills/fe-code-review/SKILL.md`.
