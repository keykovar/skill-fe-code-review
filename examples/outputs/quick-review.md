# Quick Review Output Example

```md
## Overall Conclusion

Submit recommendation: submit after changes

The main risk is a missing empty-state guard in the updated async path.

## Review Scope

- Requested scope: current uncommitted changes
- Comparison baseline: `HEAD` versus the working tree
- Modified: `src/features/profile/useProfile.ts`
- Staged: none
- Unstaged: `src/features/profile/useProfile.ts`
- Untracked: none
- Validation: static review only in this example

## Blocking

- None.

## Risk

- [src/features/profile/useProfile.ts:42] Profile data is treated as always present after request failure
  - Trigger: The request rejects or returns an empty payload.
  - Impact: The profile page can render stale data or throw when reading nested fields.
  - Root cause: The new path updates loading state but does not reset the data owner.
  - Suggested fix: Reset profile state in the failure branch or render from an explicit result state.
  - Verification: Add a failed-request case and manually test the error state.

## Improve

- [src/features/profile/useProfile.ts:18] A factory and strategy registry select a single profile-result handler
  - Trigger: Every current caller and runtime input selects the only registered `default` strategy.
  - Impact: The registry, factory, and interface add indirection and additional change points without supporting a current variant.
  - Root cause: The change introduced an extension mechanism before a second behavior or contract exists.
  - Suggested fix: Call the existing result normalizer directly and introduce a strategy boundary only when a real second variant requires it.

## Design / Simplify

- Decision: Simplify
- Related finding: Improve, `src/features/profile/useProfile.ts:18`
- Minimal sufficient direction: Call the existing normalizer directly; defer the strategy boundary until a real second variant exists.
- Behavior / invariant to preserve: Keep the same success and failure result normalization.
- Evidence / unverified: The diff, owner, direct callers, runtime selector inputs, requirements, and tests expose only one strategy and no DI, framework, or test-isolation constraint; no repository-wide abstraction audit was performed in Quick Review.

## Naming / Readability

- No clear issue.

## File Placement / Module Boundary

- No clear issue.

## Test Gaps

- Add request failure and empty payload coverage.

## Evidence

- Before/after behavior: the previous failure path retained profile data; the new path also leaves it owned after failure.
- Local code: changed request state transitions and consumers.
- Call paths: profile request -> failure branch -> profile render.
- Package/version: not version-specific.
- Official documentation verification: not needed; the finding is supported by local code and is not version-specific.
- Browser runtime evidence: not run; Quick Review used its default static-only path because no runnable environment was supplied.
- Unverified: runtime error-state rendering (`Cannot Verify`).

## Final Recommendation

Fix the failed-request state handling before submit.
```
