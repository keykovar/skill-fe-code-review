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

- Modules: routing, bridge, shared hooks
- Change type: feature plus shared hook refactor
- Impact scope: chat return and profile route refresh
- User paths: open chat, background app, return to profile

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

- No clear issue.

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
- Official docs / Context7: not used.
- Unverified: native callback timing on older app versions.

## Final Recommendation

Add callback cleanup and late-callback verification before merge.
```
