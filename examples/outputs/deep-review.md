# Deep Review Output Example

```md
## Overall Conclusion

Merge/submit recommendation: proceed after changes
Risk level: medium

Main reasons:

1. The feature touches shared route state and WebView bridge callbacks.
2. Rollback is simple, but callback cleanup needs verification.
3. Test coverage does not include app background/foreground return.

## Change Understanding

- Requested scope: review the complete `main...HEAD` branch change before merge.
- Modules: routing, bridge, shared hooks
- Change type: feature plus shared hook refactor
- Impact scope: chat return and profile route refresh
- User paths: open chat, background app, return to profile
- Modified: `src/shared/bridge/useAppResume.ts`, its route consumers, and targeted tests.
- Staged: none; this is a branch-range review.
- Unstaged: none.
- Untracked: none.
- Executed validation: targeted hook tests and one isolated local Chromium path.
- Skipped validation: real iOS/Android WebView and Native bridge execution; those environments were unavailable.

## Change Map

- Comparison baseline: `main...HEAD`
- Before behavior: route refresh was owned by each page and native resume callbacks were local.
- After behavior: a shared hook coordinates route refresh and native resume callbacks.
- Preserved invariants: leaving the page must stop future refreshes for that route.
- Missing or removed behavior: unmount cleanup is not preserved for one callback path.
- Entry points and core call paths: chat return -> shared route refresh -> app resume callback.
- Shared module impact: all consumers of the shared resume hook.
- Config or dependency impact: none.

## Findings

### Blocking

- None.

### Risk

- [src/shared/bridge/useAppResume.ts:63] Resume callback can run after page unmount
  - Trigger: User leaves the page before native resume callback fires.
  - Impact: State can update after unmount or refresh the wrong route.
  - Root cause: Callback registration is cleaned up on route change but not on component unmount.
  - Suggested fix: Tie registration cleanup to the owning effect and guard late callbacks with the current route/session id.
  - Verification: Add a test or manual case for background app, navigate away, then resume.

### Improve

- No clear issue.

## Requirement Gaps

- The expected behavior after navigating away before resume is not documented.

## Design / Simplify

- Decision: Keep
- Related finding: Risk, `src/shared/bridge/useAppResume.ts:63`
- Required behavior and invariants: One active route/session owns the resume callback; cleanup must prevent late callbacks.
- Existing capability reuse: The existing route hook and bridge lifecycle remain the correct owners, but the current implementation still needs the missing cleanup and late-callback guard.
- Overdesign / redundant flow: No extra layer, state owner, or speculative compatibility path was introduced.
- Semantic duplication and drift risk: No duplicated business rule was found.
- Unnecessary cases / fallbacks / states: No case can be removed without weakening lifecycle recovery.
- Simpler viable alternative: No simpler ownership boundary was found; this does not waive the missing cleanup required by the Risk finding.
- Stability tradeoff: Keep the current ownership design, but add the cleanup and guard before merge; fewer lifecycle checks would weaken correctness.
- Evidence and unverified assumptions: Callers and bridge callbacks were inspected; device runtime behavior remains unverified.

## Naming / Readability

- No clear issue.

## File Placement / Module Boundary

- No clear issue.

## Test Gaps

- Unit: late callback guard.
- Manual: iOS WKWebView background/foreground route return.
- Logs / analytics: confirm resume event success and ignored late callback counts.

## Release Risks

- Rollout: gate behind existing route refresh flag if available.
- Rollback: revert hook wiring; no persisted data migration.
- Compatibility: test iOS WKWebView and Android WebView.
- Monitoring: watch bridge callback errors and route refresh failures.

## Evidence

- Local code: route hook and bridge callback registration.
- Call paths: chat return -> route refresh -> app resume callback.
- Package/version: not version-specific.
- Official documentation verification: not needed; the finding is supported by repository lifecycle ownership and call paths.
- Browser runtime evidence: isolated local test server; entry point was the local chat route; Chromium at `390x844`. A controlled mocked resume callback recreated the initial route-owned state before the run. Expected result: navigating away must prevent that callback from refreshing the old route. Observed result: after navigating away and invoking the callback, the shared refresh still ran; console recorded one late refresh and network recorded no related request. The fixture was reset after the run; no production system, real account, sensitive content, destructive action, or Native bridge was involved.
- Unverified: native callback timing on older app versions (`Cannot Verify`); browser evidence cannot prove real WebView, Native bridge, device, or production behavior.

## Final Recommendation

Add callback cleanup and late-callback verification before merge.
```
