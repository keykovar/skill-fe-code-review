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

Use Context7 or another official documentation lookup only when framework or library behavior matters and local code is insufficient, such as version-specific APIs, lifecycle semantics, router behavior, build behavior, dependency upgrades, or migrations.

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

If multiple fixes are possible, recommend one and explain the tradeoff briefly.

Treat untracked files as submit-blocking when they are imported, referenced, or required by tracked or staged changes. Do not recommend `can submit` until the referenced untracked file is included in the submit scope or the reference is removed, because clean checkout, CI, or another developer's environment can fail.

## Fix Review Rules

Evaluate every previous finding with exactly one status:

- `Resolved：已解决`
- `Partially Resolved：部分解决`
- `Unresolved：未解决`
- `Cannot Verify：无法验证`

For each previous finding, preserve its original severity and explain the current evidence, remaining risk, and verification result. Report newly introduced defects separately as `New Regression：新增回归`, using Blocking, Risk, or Improve severity.

Do not re-audit the whole feature by default. Inspect the fix diff and the affected callers, consumers, contracts, tests, and runtime paths needed to verify closure and detect regressions. Expand to Deep Review only when the fix changes the architecture or reveals broader risk.

Recommend closure only when all Blocking findings are Resolved, no material new regression exists, and required verification has passed or its limits are explicit.

## Severity Rules

Use Blocking when an issue may cause a runtime error, white screen, infinite loop, broken main flow, payment failure, login/auth failure, data corruption, build failure, serious compatibility issue, or severe regression.

Also use Blocking when a changed tracked file imports or references an untracked file that is not included in the submit scope.

Use Risk when an issue may cause edge-case bugs, race conditions, state inconsistency, cache inconsistency, poor error handling, performance degradation, cross-module coupling, or maintenance difficulty.

Use Improve for readability, minor duplication, local simplification, better naming, better type expression, better folder placement, or non-blocking cleanup.
