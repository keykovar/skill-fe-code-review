---
name: fe-code-review
description: Review frontend or hybrid app code changes. Use when the user asks to review a current diff, uncommitted or staged changes, a commit, branch range, PR, risky feature, release change, naming, file placement, simplification, regression risk, frontend-specific risk, or fixes made after a previous review. Default to read-only review. Use Quick Review for normal changes, Deep Review for large or risky changes, and Fix Review to verify previous findings and detect regressions introduced by their fixes. Detect React, Vue, TypeScript, JavaScript, and Hybrid/WebView projects and load only the relevant references.
---

# FE Code Review

## Default Rules

- Match the user's language. If the user writes Chinese, respond in Simplified Chinese.
- Translate section headings, status labels, and recommendations to the user's language. Keep stable English labels when useful, for example `Blocking：必须修改`.
- For Chinese requests, use the Chinese template for the selected mode. Do not use English-only section headings such as `Overall Conclusion`, `Review Scope`, `Test Gaps`, or `Final Recommendation`.
- Default to read-only review.
- Do not modify files, format files, commit, push, reset, install packages, change branches, or run destructive commands unless the user explicitly asks.
- A request to review, evaluate review quality, or output a review report authorizes chat output only. Do not create or update report, plan, todo, Markdown, or source files unless the user explicitly asks for that file artifact or for code changes. Client modes named Agent, Build, Write, or similar do not override this boundary.
- Base findings on actual code, diffs, call paths, data flow, package versions, and runtime contracts.
- Do not infer semantics from names alone.
- Do not present static inspection as runtime verification.
- Do not report vague issues. Explain the trigger condition, impact, root cause, suggested fix, and verification method.
- If no clear issue is found, say so directly and list residual risks or unverified areas.

## Scope Discovery

Inspect the requested scope. If the user does not specify one, review all uncommitted changes:

```bash
git status --short
git diff --stat
git diff --find-renames
git diff --cached --find-renames
git ls-files --others --exclude-standard
```

Establish and report the comparison baseline before reviewing:

- Uncommitted changes: `HEAD` versus the working tree, including staged, unstaged, and relevant untracked files.
- Staged changes: `HEAD` versus the index.
- Commit: its parent versus the commit.
- Branch or PR: merge base versus target head, unless the user specifies another range.
- Merge commit: first parent versus the merge commit, unless the user specifies another parent or baseline.

If package or config files changed, inspect dependency and build impact. Always summarize the requested scope, comparison baseline, modified files, staged files, unstaged files, untracked files, and validation commands that ran or were skipped.

For Fix Review, also identify the previous review report or findings and the fix diff. Keep the original feature range separate from the later fix range.

If `.codegraph/` exists at the repository root and CodeGraph is available, use it before broad grep/find to understand symbols, call paths, and blast radius.

Use evidence in this order:

1. Repository source, diffs, call paths, tests, configuration, lockfiles, and project documentation.
2. Installed dependency types and source for the resolved local version.
3. Official documentation through a channel whose tool contract permits code review, only when version-sensitive framework or library behavior still cannot be established locally.

The current official Context7 MCP tool contract excludes code review. Do not use Context7 while performing this skill, directly or indirectly. This includes asking a subagent, delegate, proxy, wrapper, or another tool or session to call it on the review's behalf. Do not bypass the restriction by reframing, decomposing, sanitizing, or relabeling review work as a documentation question. If a conclusion depends on external semantics and no permitted, authoritative source is available, mark it `Cannot Verify` and identify the missing evidence.

When using any external documentation service, send only the public library, version, API, or sanitized behavior question needed for verification. Never send private source code, diffs, repository paths, internal API data, credentials, tokens, user data, or proprietary identifiers.

## Conditional Browser Runtime Evidence

Use Playwright or another available browser automation tool only when all of these conditions hold:

- The changed behavior is browser-observable and runtime evidence can materially confirm or refute a finding, such as routing, forms, async UI state, storage or cookie behavior, hydration, focus, scrolling, responsive overflow, or request ordering.
- A concrete entry point exists, such as a local route, URL, interaction, or test harness, and the expected observable result is explicit from the requirement, baseline behavior, or an existing test contract.
- A suitable local or isolated test environment is already runnable without installing dependencies, changing project configuration, or writing generated artifacts into the repository.
- The initial state is controlled and repeatable, or can be reconstructed before each run without relying on production data or a real account.
- The path is isolated and can be exercised without production access, real payments, real user data, destructive actions, or irreversible external side effects.

Keep browser verification read-only with respect to the repository, production systems, and real accounts. Isolated local browser state may change when required by the scenario, but reset it when practical and do not treat that state change as product data verification.

Record the environment and URL type, entry point, browser and viewport, initial state and how it is reproduced, expected result, actions, observed result, and relevant console or network summary. Mask credentials, tokens, personal data, request bodies, and sensitive response content. If runtime evidence is required but the gate is not satisfied, use `Cannot Verify` and state the unavailable environment, state, expectation, or capability.

Browser automation proves only the exercised path in the recorded environment. A passing browser check does not prove behavior in every browser or viewport and does not replace real WebView, Native bridge, device, backend, deployment, monitoring, or production verification.

## Mode Selection

- Use Quick Review by default for daily changes, small PRs, bug fixes, and local refactors.
- Use Deep Review for payment, auth, routing/navigation, WebView bridge, RTC/audio/video, SSR/hydration, i18n, global state/store, cache/persistence, build/deploy config, dependency upgrades, shared modules, performance-sensitive code, release branches, cross-module behavior, or large refactors.
- Use Fix Review when the user asks to re-review fixes, verify previous findings, check whether review comments were resolved, or detect regressions introduced by the fixes.

Load exactly one mode reference before reviewing:

- Quick Review: `references/quick-review.md`
- Deep Review: `references/deep-review.md`
- Fix Review: `references/fix-review.md`

For Fix Review, use the previous findings from the current conversation when available. Otherwise require the user to provide the prior review report, issue list, or a readable path to it. Do not invent previous findings or claim that an issue is resolved without a usable baseline.

## Technology Detection

Inspect project files and load only matching references:

- React: load `references/react.md` for React, React DOM, Next.js, Remix, JSX/TSX, or hooks.
- Vue: load `references/vue.md` for Vue, Nuxt, Pinia, `.vue` files, or Composition API.
- TypeScript: load `references/typescript.md` for TypeScript projects or changed TypeScript contracts.
- JavaScript: load `references/javascript.md` for JavaScript projects or runtime-shape-heavy code.
- Hybrid/WebView: load `references/hybrid-webview.md` for bridges, native contracts, WebView, app shell, storage, keyboard, safe area, audio, or video.
- Release risk: load `references/release-risk.md` for Deep Review, release branches, feature flags, rollout, monitoring, rollback, or high-risk flows.

## Before/After Behavior Analysis

Perform this analysis in every mode. Compare behavior, not only changed lines:

1. Identify the behavior before the change and the intended behavior after it.
2. Detect removed, weakened, or unintentionally preserved behavior.
3. Check missing branches, guards, fallbacks, cleanup, cancellation, retries, and error handling.
4. Check changed conditions, defaults, ordering, return values, state transitions, and side effects.
5. Trace affected callers, consumers, events, API contracts, storage, cache, and runtime data shapes.
6. Confirm behavior outside the requested change remains invariant where required.
7. Inspect deleted or moved code and relevant untracked files; do not review only added lines.

Report material behavior differences as Blocking or Risk findings. In Quick Review, keep the output compact and record the baseline and relevant behavior delta under scope, findings, or evidence. In Deep Review, record before, after, preserved constraints, and missing or removed behavior in the change map. In Fix Review, compare both the original issue behavior and the fix behavior, then run a focused regression scan around affected call paths.

If the baseline cannot be read, state that before/after behavior could not be verified. Do not present a current-code-only inspection as a completed comparison.

## Review Priorities

Review in this order:

1. Correctness and real bugs.
2. Online or production risk.
3. Regression risk and behavior loss.
4. Test gaps.
5. Code design and simplification.
6. Naming and readability.
7. File placement and module boundaries.
8. Style only when it hides risk or harms maintainability.

Only report design, naming, readability, and file placement issues when they create real maintenance cost, confusion, coupling, or future bug risk.

## Minimal Sufficient Design

Evaluate Quick and Deep Review changes for the smallest justified complexity surface that satisfies current requirements, preserves behavior and invariants, and fits existing repository patterns. Minimal does not mean the fewest lines of code.

- Flag speculative abstractions, extension points, layers, configuration, states, branches, fallbacks, parameters, or compatibility paths only when no requirement, caller, runtime contract, recovery need, observability need, or test evidence justifies them.
- Treat duplication as an extraction candidate only when it represents the same business rule or contract, has the same reason to change, and creates meaningful drift risk. Do not extract solely because code looks similar.
- Prefer an existing repository capability when it provides the required semantics without increasing coupling or obscuring data flow.
- Check actual producers, consumers, baseline behavior, and runtime inputs before calling a case, fallback, state, or defensive path unnecessary.
- Do not recommend simplification that weakens correctness, cleanup, compatibility, recovery, observability, or rollback safety.
- Do not claim global optimality. Judge only the inspected scope. Use `Keep` when the current design is justified, `Simplify` when the current ownership and architecture can remain while local complexity is removed, `Extract` for a proven shared rule that needs one owner, `Redesign` in Deep Review when the ownership or data-flow boundary requires structural change, and `Cannot Verify` when evidence is insufficient or the selected mode is too narrow to support the decision.
- In Quick Review, inspect the diff, its immediate owner, and directly affected callers. Report only clear, local, evidence-backed unnecessary complexity; do not perform a repository-wide abstraction audit solely for this section. If that bounded scope cannot establish whether complexity is justified, use `Cannot Verify` and state the missing evidence.
- In Deep Review, inspect affected callers and consumers, existing repository capabilities, abstraction ownership, and runtime contracts. Compare the current design with a simpler viable alternative when one exists, and explain the correctness, stability, coupling, and maintenance tradeoff.

Report each actionable design issue once in the applicable `Blocking`, `Risk`, or `Improve` finding section. Every `Simplify`, `Extract`, or `Redesign` decision must cite at least one such finding. In `Design / Simplify`, add only the decision context, required invariants, and tradeoffs; do not duplicate the full finding.

Design severity follows demonstrated impact. Local maintainability cost without demonstrated behavior risk is `Improve`; use `Risk` or `Blocking` only when evidence shows corresponding behavior, regression, or delivery risk.

## Finding Requirements

Every Quick or Deep finding must include:

- Severity: Blocking, Risk, or Improve.
- File path and line number when possible.
- Trigger condition.
- Impact.
- Root cause or reasoning.
- Suggested fix.
- Verification method for Blocking and Risk findings.
- Confidence when evidence is incomplete.

For Quick and Deep Review, `Cannot Verify` is an evidence disposition, not a severity, and missing evidence alone does not create a finding. Record an evidence-only gap under scope, `Test Gaps`, or `Evidence`. If static evidence supports an actionable finding, keep its demonstrated Blocking, Risk, or Improve severity and mark only the unverified runtime or external-semantics portion `Cannot Verify`. This does not change `Cannot Verify` as a `Design / Simplify` decision or as a Fix Review closure status.

If multiple fixes are possible, recommend one and explain the tradeoff briefly.

Treat untracked files as submit-blocking when they are imported, referenced, or required by tracked or staged changes. Do not recommend `can submit` until the referenced untracked file is included in the submit scope or the reference is removed, because clean checkout, CI, or another developer's environment can fail.

## Recommendation Consistency

Choose the recommendation after findings and required verification limits are known. Treat the conclusion and final recommendation as one decision contract:

- Quick Review: use `可以提交` only when no unresolved Blocking finding exists and no Risk finding or required verification is treated as a pre-submit condition. Any Blocking finding requires at least `修改后提交`; use `不建议提交` when bounded fixes are insufficient, the approach is unsafe, or critical evidence is unavailable. An Improve-only review remains `可以提交` unless the user declared a stricter quality gate before the review; describe those improvements as optional and explicitly non-blocking, never as work that should or must happen before submission.
- Deep Review: apply the same rule with `可以进入下一步`, `修改后可以进入下一步`, and `暂不建议进入下一步`. An Improve-only review does not block the next step unless the user declared a stricter gate.
- If a Risk finding exists, state whether it is a pre-submit or pre-next-step condition. If it is accepted instead, state the residual risk and why proceeding is still justified.
- The final recommendation must restate the same decision and the same prerequisites as the conclusion. Do not introduce a new `before submit`, `before merge`, or `before next step` condition only in the final section. If the final evidence requires a stricter decision, update the conclusion to match.
- Fix Review: use `可以关闭` only when every previous finding is Resolved and no material New Regression exists; use `修改后再次回审` when any finding is Partially Resolved or Unresolved, or a material new regression exists; use `暂时无法确认` when closure depends on a Cannot Verify result.

## Fix Review Rules

Evaluate every previous finding with exactly one status:

- `Resolved：已解决`
- `Partially Resolved：部分解决`
- `Unresolved：未解决`
- `Cannot Verify：无法验证`

For each previous finding, preserve its original severity and explain the current evidence, remaining risk, and verification result. Report newly introduced defects separately as `New Regression：新增回归`, using Blocking, Risk, or Improve severity.

Do not re-audit the whole feature by default. Inspect the fix diff and the affected callers, consumers, contracts, tests, and runtime paths needed to verify closure and detect regressions. Keep the Fix Review template and focused verification budget. If the fix changes architecture or reveals broader risk, inspect only the affected architecture needed to verify the previous findings and detect fix regressions; do not silently switch to or blend in Deep Review. Recommend a separate Deep Review with an explicit scope, and run it only as a separately selected mode.

Use `Recommendation Consistency` as the single authority for the closure recommendation. Do not add, weaken, or redefine closure criteria in Fix Review rules.

## Severity Rules

Use Blocking when an issue may cause a runtime error, white screen, infinite loop, broken main flow, payment failure, login/auth failure, data corruption, build failure, serious compatibility issue, or severe regression.

Also use Blocking when a changed tracked file imports or references an untracked file that is not included in the submit scope.

Use Risk when an issue may cause edge-case bugs, race conditions, state inconsistency, cache inconsistency, poor error handling, performance degradation, or demonstrated cross-module coupling or drift that creates behavior, regression, or delivery risk.

Use Improve for local maintainability cost without demonstrated behavior risk, readability, minor duplication, local simplification, better naming, better type expression, better folder placement, or non-blocking cleanup.
