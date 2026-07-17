# Evaluation

Use this checklist before publishing or changing `fe-code-review`.

## Scope

Evaluate the skill with real repository diffs, not only synthetic examples.

Minimum local checks:

- One Quick Review on current uncommitted changes.
- One Quick Review with an untracked file referenced by tracked changes.
- One Deep Review on a branch range such as `main...HEAD`.
- One Fix Review with a previous finding list and a later fix diff.
- One no-clear-issue diff to confirm the skill can say no issue directly.

## Expected Behavior

The review must stay read-only unless the user explicitly asks for fixes.

The output must show:

- Requested review scope.
- Modified files.
- Staged files.
- Unstaged files.
- Untracked files.
- Validation commands that ran.
- Validation commands or runtime checks that were skipped.
- The comparison baseline and material before/after behavior differences.

The review must not:

- Modify files.
- Run formatters.
- Commit or push.
- Change branches.
- Install dependencies.
- Present static inspection as runtime verification.

## Severity Expectations

Use `Blocking` for issues that can break clean checkout, CI, build, runtime, main flow, payment, auth, data integrity, or severe compatibility.

Use `Blocking` when tracked or staged code imports, references, or requires an untracked file that is not included in the submit scope.

Use `Risk` for edge cases, race conditions, state/cache inconsistency, poor error handling, performance degradation, or cross-module coupling.

Use `Improve` for optional simplification, naming, type expression, or file placement cleanup.

Every `Blocking` and `Risk` finding must include:

- Trigger condition.
- Impact.
- Root cause.
- Suggested fix.
- Verification method.

## Behavior Comparison Expectations

Quick and Deep Review must compare the selected baseline with the target code. They should detect removed or weakened behavior, missing branches or fallbacks, changed defaults or ordering, incomplete consumer migration, changed runtime contracts, and unintended side effects.

When the baseline is unavailable, the output must say that before/after behavior could not be verified.

## Fix Review Expectations

Fix Review must use an actual previous review report or finding list. Every previous finding must retain its original severity and receive exactly one status:

- `Resolved：已解决`
- `Partially Resolved：部分解决`
- `Unresolved：未解决`
- `Cannot Verify：无法验证`

New defects introduced by the fix must be reported separately as `New Regression：新增回归`.

## Language Expectations

For Chinese prompts, the output should use Chinese section headings from `SKILL.md`, including:

- `总体结论`
- `审查范围`
- `Blocking：必须修改`
- `Risk：建议修改`
- `Improve：可优化`
- `Design / Simplify：设计与简化`
- `Naming / Readability：命名与可读性`
- `File Placement / Module Boundary：文件存放与模块边界`
- `Test Gaps：测试缺口`
- `Evidence：证据`
- `最终建议`

Fix Review should additionally use `回审结论`, `回审范围`, `Issue Verification：问题验证`, `New Regression：新增回归`, and `Behavior Delta：行为差异`.

Mixed English severity labels are acceptable when they preserve stable review meaning.

## Evidence Expectations

The review should separate evidence from assumptions:

- Local code evidence.
- Call paths or CodeGraph evidence when available.
- Package/version evidence when relevant.
- Official docs or Context7 evidence only when framework/library behavior matters.
- Unverified runtime paths.

## Acceptance Criteria

Before publishing a release:

- `pnpm test` passes.
- `quick_validate.py skills/fe-code-review` passes.
- A real Quick Review produces the expected scope and severity structure.
- A real Deep Review produces change map, release risks, test gaps, and evidence.
- A real Fix Review verifies every previous finding and reports any new regression separately.
- Quick and Deep Review identify material before/after behavior differences or explicitly state that the baseline is unavailable.
- No review output recommends submit when referenced untracked files are missing from the submit scope.
