#!/usr/bin/env python3
"""Validate a skill folder using the same basic rules as Codex skill-creator."""

from __future__ import annotations

import re
import sys
from pathlib import Path

import yaml


NAME_RE = re.compile(r"^[a-z0-9-]+$")


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: scripts/quick_validate.py <path/to/skill-folder>", file=sys.stderr)
        return 2

    skill_dir = Path(sys.argv[1])
    skill_md = skill_dir / "SKILL.md"

    if not skill_md.is_file():
        print(f"Missing SKILL.md: {skill_md}", file=sys.stderr)
        return 1

    text = skill_md.read_text(encoding="utf-8")
    match = re.match(r"^---\n([\s\S]*?)\n---", text)
    if not match:
        print("SKILL.md is missing YAML frontmatter", file=sys.stderr)
        return 1

    frontmatter = yaml.safe_load(match.group(1)) or {}
    name = frontmatter.get("name")
    description = frontmatter.get("description")

    if not isinstance(name, str) or not name:
        print("frontmatter.name is required", file=sys.stderr)
        return 1

    if not NAME_RE.match(name):
        print("frontmatter.name must use lowercase letters, digits, and hyphens", file=sys.stderr)
        return 1

    if skill_dir.name != name:
        print(f"skill folder name must match frontmatter.name: {skill_dir.name} != {name}", file=sys.stderr)
        return 1

    if not isinstance(description, str) or len(description.strip()) < 40:
        print("frontmatter.description must be descriptive", file=sys.stderr)
        return 1

    print("Skill is valid!")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
