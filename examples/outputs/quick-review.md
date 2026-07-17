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

- None.

## Design / Simplify

- [src/features/profile/useProfile.ts:18] The local helper only wraps one call site
  - Current implementation: `normalizeProfileResult` is used once.
  - Suggested direction: Inline it unless another call site appears.
  - Tradeoff: Keeps the failure path easier to read now; extract later if reuse appears.

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
- Official docs / Context7: not used.
- Unverified: runtime error-state rendering.

## Final Recommendation

Fix the failed-request state handling before submit.
```
