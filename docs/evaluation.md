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
- One browser-eligible Deep or Fix Review when a safe, already runnable local or isolated environment satisfies the complete evidence gate.
- One run without browser automation or a runnable environment to verify the `Cannot Verify` fallback.

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

Use `Risk` for edge cases, race conditions, state/cache inconsistency, poor error handling, performance degradation, or demonstrated cross-module coupling or drift that creates behavior, regression, or delivery risk.

Use `Improve` for local maintainability cost without demonstrated behavior risk, optional simplification, naming, type expression, or file placement cleanup.

In Quick and Deep Review, `Cannot Verify` records an evidence limit and is not a severity. In Fix Review it is one closure status for a previous finding; in `Design / Simplify` it is the decision used when the selected scope cannot support `Keep`, `Simplify`, `Extract`, or `Redesign`.

Every `Blocking` and `Risk` finding must include:

- Trigger condition.
- Impact.
- Root cause.
- Suggested fix.
- Verification method.

## Recommendation Consistency Expectations

- The conclusion and final recommendation must use the same decision and prerequisites.
- Quick Review cannot use `可以提交` when an unresolved Blocking exists or a Risk or required verification is treated as a pre-submit condition.
- Deep Review applies the equivalent rule to `可以进入下一步`.
- Improve-only findings remain optional and cannot produce `提交前` or `进入下一步前` requirements unless the user declared a stricter quality gate before the review.
- Every Risk must be identified as a gate or as accepted residual risk with a reason.
- Fix Review counts, per-finding statuses, New Regression results, closure recommendation, and final recommendation must agree.

| Fix Review state | Required recommendation |
| --- | --- |
| Every previous finding is `Resolved` and no material New Regression exists | `可以关闭` |
| Any finding is `Partially Resolved` or `Unresolved`, or a material New Regression exists | `修改后再次回审` |
| Closure depends on a `Cannot Verify` result | `暂时无法确认` |

## Behavior Comparison Expectations

Quick and Deep Review must compare the selected baseline with the target code. They should detect removed or weakened behavior, missing branches or fallbacks, changed defaults or ordering, incomplete consumer migration, changed runtime contracts, and unintended side effects.

When the baseline is unavailable, the output must say that before/after behavior could not be verified.

## Documentation Evidence Expectations

Local source, call paths, lockfiles, installed dependency source or types, configuration, and project documentation are the primary evidence. Query official documentation only when a material finding depends on version-sensitive external semantics and local evidence is insufficient.

- Use only documentation channels whose tool contract permits code review.
- Do not use Context7 directly or indirectly during a review because the official Context7 MCP tool contract excludes code review. Delegation, subagents, proxy calls, and reframing the request do not bypass this restriction.
- When no permitted official-documentation channel is available, identify the missing external contract and use `Cannot Verify`; do not infer it from memory.
- Do not send private source, API payloads, internal paths, credentials, user data, or other repository secrets to an external documentation service.

## Minimal Sufficient Design Expectations

Quick and Deep Review must treat minimal design as the smallest justified complexity surface for the current requirements and repository, not the fewest lines of code.

- Report speculative abstractions, layers, configuration, states, branches, fallbacks, parameters, or compatibility paths only when evidence shows that current requirements and runtime contracts do not justify them.
- Recommend extraction only for semantic duplication: the same business rule or contract, the same reason to change, and a meaningful risk of drift. Similar syntax alone is not sufficient.
- Check existing repository capabilities before recommending a new helper, abstraction, or implementation.
- Do not remove defensive or recovery behavior without checking actual producers, consumers, runtime inputs, compatibility requirements, cleanup, observability, and rollback needs.
- Do not recommend a shorter implementation when it weakens correctness, stability, compatibility, or operational safety.
- Use `Keep` when the current implementation is already the minimal sufficient design; do not invent a design issue to fill the section.
- Report an actionable design issue once under its applicable severity section and reference it from `Design / Simplify`; do not duplicate the full finding.

Quick Review should keep this check local to the diff, its immediate owner, and directly affected callers. Deep Review should inspect cross-module ownership and compare the current design with a simpler viable alternative when one exists.

Before release, run paired real-diff cases against this manual oracle:

| Case | Required evidence | Quick decision | Deep decision | Forbidden design outcome | Expected design severity |
| --- | --- | --- | --- | --- | --- |
| Single-scenario factory or registry with no justified boundary or extension | Requirements, direct callers, and runtime selector inputs show only one behavior, and no DI, framework, test-isolation, public-contract, or repository constraint requires the boundary | `Simplify` | `Simplify` | Reporting an issue solely because there is one implementation or caller | `Improve` unless demonstrated behavior risk is higher |
| Single implementation justified by DI, framework contracts, test isolation, or a public contract | The concrete contract or isolation need is readable | `Keep` | `Keep` | `Simplify` based only on single use | No design finding |
| Same business rule duplicated with the same reason to change and drift risk | Both implementations and their consumers are readable | `Extract` when visible in bounded scope; otherwise `Cannot Verify` | `Extract` | `Keep` after drift risk is demonstrated | `Improve` or `Risk` based on demonstrated impact |
| Similar syntax with different business meaning or reasons to change | Requirements, owners, and consumers demonstrate different semantics | `Keep` | `Keep` | `Extract` based on syntax alone | No design finding |
| Existing fallback required by an API or runtime contract | The producer contract and consumer behavior are readable | `Keep` | `Keep` | Removing or simplifying the fallback | No design finding |
| Speculative fallback or case with no producer, contract, recovery, or compatibility need | Baseline, producers, consumers, and runtime inputs are checked | `Simplify` when proven locally; otherwise `Cannot Verify` | `Simplify` | Claiming it is unnecessary without evidence | `Improve` unless demonstrated behavior risk is higher |
| Derived value duplicated in state and synchronized by an effect | Owner and consumers show the value can be computed without changing timing or behavior | `Simplify` | `Simplify` | Removing state when it owns an independent transition | `Improve` or `Risk` based on demonstrated impact |
| Local evidence suggests an ownership or data-flow redesign | The Quick scope exposes a structural risk but has not verified cross-module blast radius | `Cannot Verify` plus a Deep Review recommendation | `Redesign` only when broader evidence confirms structural change | `Redesign` in Quick Review, or `Redesign` in Deep Review without cross-module evidence | `Risk` or `Blocking` based on demonstrated impact |
| Normal implementation with no unjustified complexity | Diff, owner, and relevant contracts support the current design | `Keep` | `Keep` | Any manufactured design finding | No design finding |
| Contract or caller evidence is unavailable | The missing evidence is named explicitly | `Cannot Verify` | `Cannot Verify` after the appropriate Deep scope is exhausted | Definitive `Keep`, `Simplify`, `Extract`, or `Redesign` | No unsupported finding |

For every run, record the repository and revision, comparison baseline, mode, prompt, requirement or contract evidence, actual decision, findings, and unverified areas. A case passes only when the expected design decision is produced, every expected design finding has an allowed severity, and no forbidden design outcome appears. Evaluate this dimension independently: unrelated correctness, test, or release findings neither satisfy nor fail the design oracle unless they contradict its evidence. Checked-in automated model fixtures remain a separate roadmap item; this manual oracle does not make Vitest a model-quality test.

## Conditional Browser Runtime Evidence Expectations

Playwright or an equivalent browser tool is an optional evidence source, not a release or client dependency. Run it only when all of the following are true:

- The claim concerns observable browser behavior such as routing, forms, asynchronous UI state, storage, hydration, focus, scrolling, responsive overflow, or request timing.
- An already runnable local or isolated environment exists and has an explicit entry point.
- Its initial state is controlled and repeatable, or can be reconstructed before each run without production data or a real account.
- The expected observation is explicit and can materially confirm or reject a finding within the selected mode budget.
- Validation does not require installing dependencies, changing configuration or repository files, accessing production, using real user, payment, credential, or other sensitive data, or causing destructive or irreversible side effects.

Mode budgets are:

- Quick Review: skip by default; run at most one critical path when it can materially resolve uncertainty.
- Deep Review: run the primary path and at most one evidence-backed high-risk path.
- Fix Review: reuse the original environment, initial state, reproduction steps, and observable assertions. If any required element is unavailable, use `Cannot Verify`; a different environment may provide supplementary evidence but cannot support `Resolved`. When evidence justifies it, verify one directly affected regression path.

Browser evidence must record the environment and URL type, entry point, browser and viewport, initial state and reconstruction method, expected result, actions, observed result, and redacted console/network summary. It must not expose request bodies, credentials, tokens, private user data, or sensitive response content. If the tool, environment, fixture, or required integration is unavailable, continue the static review and mark the affected runtime claim `Cannot Verify`; absence of browser automation is not itself a finding.

A passing browser check proves only the exercised browser path. It must not be presented as verification of a real WebView, Native bridge, physical device, backend production state, or production release. Those paths require their own environment-specific evidence.

## Fix Review Expectations

Fix Review must use an actual previous review report or finding list. Every previous finding must retain its original severity and receive exactly one status:

- `Resolved：已解决`
- `Partially Resolved：部分解决`
- `Unresolved：未解决`
- `Cannot Verify：无法验证`

New defects introduced by the fix must be reported separately as `New Regression：新增回归`.

If the fix changes architecture or reveals broader risk, finish the current review with the Fix Review template and budget, then recommend a separate Deep Review. Do not switch templates, expand to the Deep Review budget, or combine both modes in one report.

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
- Official documentation verification through a channel whose contract permits code review, or `Cannot Verify` when no such channel is available.
- Browser runtime evidence, including the reason it ran or was skipped and the limits of what it proves.
- Unverified runtime paths.

## Acceptance Criteria

Before publishing a release:

- `pnpm test` passes.
- `quick_validate.py skills/fe-code-review` passes.
- A real Quick Review produces the expected scope and severity structure.
- A real Deep Review produces change map, release risks, test gaps, and evidence.
- A real Fix Review verifies every previous finding and reports any new regression separately.
- Quick and Deep Review identify material before/after behavior differences or explicitly state that the baseline is unavailable.
- Quick Review reports only clear local minimal-design issues, while Deep Review distinguishes semantic duplication from similar syntax and explains simpler alternatives and tradeoffs.
- A no-clear-design-issue case produces `Keep` instead of a manufactured simplification finding.
- Every actionable design issue is severity-classified once and is not duplicated across output sections.
- The required minimal-design cases are recorded and pass their expected decisions, severity bounds, and forbidden-outcome checks.
- Quick, Deep, and Fix runs respect their browser-evidence budgets and preconditions.
- Browser evidence records a reproducible, redacted observation and is not extrapolated to WebView, Native, device, or production behavior.
- A client or environment without browser automation completes the static review and reports affected runtime claims as `Cannot Verify`.
- No review output recommends submit when referenced untracked files are missing from the submit scope.

## Reproducible Fixtures

Checked-in fixtures provide stable Git states, prompts, and semantic oracles for release evaluation. They do not add output sections or change the public review contract.

Prepare an isolated fixture with one of these commands:

```bash
pnpm fixture:prepare quick
pnpm fixture:prepare deep
pnpm fixture:prepare fix
```

Pass `--output /absolute/empty/directory` when the generated repository must use a known location. The script refuses to overwrite a non-empty directory and prints JSON containing the target directory, prompt, expected Git status, semantic oracle, test command, and expected deterministic test result.

- Quick uses the uncommitted URL regression with a referenced untracked config file.
- Fix starts from the recorded problem commit, exposes the previous findings under `.evaluation/previous-findings.md`, and applies the working-tree repair.
- Deep creates a clean `candidate` branch whose profile module caches authentication state outside the shared session owner.

Run the printed prompt in the generated repository, compare the response with the semantic oracle, and confirm that `git status --short` is unchanged after review. Do not compare complete model text or call model clients from deterministic CI. Vitest validates fixture construction, seeded behavior, repair behavior, and overwrite protection; runtime model quality remains a manual, client-scoped evaluation.
