# Claude Code Adapter

Claude Code supports skills with `SKILL.md`. Install the shared skill directly.

## User Install

```bash
mkdir -p "$HOME/.claude/skills"
ln -s "$(pwd)/skills/fe-code-review" "$HOME/.claude/skills/fe-code-review"
```

## Project Install

```bash
mkdir -p ".claude/skills"
cp -R "skills/fe-code-review" ".claude/skills/fe-code-review"
```

## Optional Project Memory

If your repository already has `AGENTS.md`, use `CLAUDE.md.example` as a starting point so Claude Code can import the same project instructions without duplicating them.

## Test Prompts

```text
/fe-code-review Quick Review current uncommitted changes.
```

```text
/fe-code-review Deep Review main...HEAD. Focus on release risk.
```

```text
/fe-code-review Fix Review current changes against the previous findings. Check for new regressions.
```
