## Review Conclusion

Recommendation: Review again after changes

- Resolved: 1
- Partially Resolved: 0
- Unresolved: 0
- Cannot Verify: 0
- New Regression: 1

## Review Scope

- Requested scope: re-review the fix for F-001
- Original review baseline: HEAD
- Fix scope: session token owner
- F-001 closure criteria: restore the current-token source and pass the supplied synthetic auth contract; real-account acceptance is outside this fixture.
- Validation run: static call path and synthetic auth contract
- Skipped: real account and WebView

## Issue Verification

- [F-001] [src/auth/session.ts:44] Resume stale token
  - Original severity: Blocking
  - Current status: Resolved
  - Before fix: resume read the cached token.
  - After fix: resume reads the current token.
  - Current evidence: synthetic auth contract returns 200.
  - Remaining risk: real-account equivalence is unverified and outside the supplied fixture closure criteria.
  - Verification result: static check and synthetic contract pass.
  - Origin: New - the original baseline read the current token; the fix baseline introduced a cached token.
  - Reproduction: [pre-fix] Observed - 1/1 synthetic resume scenario failed; evidence is the fix-baseline contract. | [post-fix] Observed - 0/1 equivalent scenario failed; evidence is the current contract.

## New Regression

### Blocking

No clear issue.

### Risk

- [F-002] [src/auth/session.ts:51] Fix expands exposure to the existing token cache
  - Trigger: the second profile request after an account switch.
  - Impact: two session owners can produce inconsistent authorization.
  - Root cause: the fix routes a new caller through the existing shared cache instead of the current session owner.
  - Suggested fix: remove the parallel cache and reuse the current owner.
  - Verification: exercise two requests across an account switch.
  - Origin: Amplified - the fix baseline already had cache collision; the fix adds another caller and expands reachable accounts.
  - Reproduction: Not Run - account-switch execution was not run; static evidence supports exposure change only.

### Improve

No clear issue.

## Behavior Delta

- Expected repair: restore the current token.
- Actual change: F-001 is repaired, but a new caller expands exposure to the existing shared cache.
- Required invariant: each account must use its current authorization owner; the new caller violates it.
- Unexpected change: new regression F-002.

## Test Gaps

- Add account-switch and two-request regression coverage.

## Evidence

- Previous issue: F-001
- Fix diff: `src/auth/session.ts:44-51`
- Unverified: real account and WebView.

## Final Recommendation

Review again after changes; address F-002 and preserve F-001's verified synthetic contract. Real-account acceptance remains a separate, unverified scope.
