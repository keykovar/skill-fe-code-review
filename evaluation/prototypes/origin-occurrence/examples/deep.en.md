## Overall Conclusion

Recommendation: Fix before next step
Risk level: Medium

The resume path reuses a prior token; the static call path and synthetic auth contract support a login failure outcome.

## Change Understanding

- Requested scope: cross-module auth-resume change
- Modules: session and profile request
- Change type: authorization-source change
- Impact: resume login and first profile request
- Validation run: static call-path and synthetic auth-contract inspection
- Skipped: real account, WebView, and production monitoring

## Change Map

- Baseline: HEAD
- Before: resume reads the current session token.
- After: resume reads an initialization-time cached token.
- Preserved invariant: requests must carry the current account authorization.
- Missing behavior: token refresh after logout or account switch.
- Entry and call path: `restore -> profileRequest -> auth endpoint`
- Shared-module impact: session-owner read semantics changed.
- Config/dependency impact: none.

## Changed-Condition Coverage

- [src/auth/session.ts:44] resume token source: `getCurrentToken()` -> `capturedToken`; Disposition: [F-001]

## Findings

### Blocking

- [F-001] [src/auth/session.ts:44] Resume uses a stale authorization token
  - Trigger: restore a profile request after logout and account switch.
  - Impact: the server rejects the request and resume login cannot complete.
  - Blocking outcome: Login/Auth Failure - the synthetic auth contract returns 401 for the stale token.
  - Root cause: resume stores an initialization token instead of reading the current owner.
  - Suggested fix: read the current token in the existing session owner and add logout-resume coverage.
  - Verification: run the equivalent auth contract and confirm the stale token is not sent.
  - Origin: New - the baseline reads the current token; this change switches to a cached token.
  - Reproduction: Not Run - the synthetic auth contract was inspected statically only; no synthetic trial or real account flow was executed.

### Risk

No clear issue.

### Improve

No clear issue.

## Requirement Gaps

- No real-account logout/resume or WebView environment was available.

## Design / Simplify

- Decision: Simplify
- Related issue: [F-001] Blocking [src/auth/session.ts:44]
- Required invariant: the current session owner supplies authorization.
- Existing capability: `getCurrentToken()`.
- Unjustified complexity: no new abstraction is needed.
- Simpler alternative: remove the cached token and retain the current owner read.
- Tradeoff: fewer state copies and lower cross-account contamination risk.
- Evidence and limits: the real server was not exercised.

## Naming / Readability

No clear issue.

## File Placement / Module Boundary

No clear issue.

## Test Gaps

- Add logout, account-switch, and resume-order tests.

## Release Risks

- Roll out the auth-resume path gradually and monitor 401/login-resume failures.
- Preserve the current session-owner path for rollback.

## Evidence

- Local source: `src/auth/session.ts:44`
- Call path: `restore -> profileRequest`
- Browser runtime evidence: not run.
- Unverified: real account and production data.

## Final Recommendation

Fix before next step; restore the current token owner and pass the synthetic auth and logout-resume checks.
