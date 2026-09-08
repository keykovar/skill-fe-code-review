## Overall Conclusion

Proceed after changes.

## Changed-Condition Coverage

- [src/session.ts:9] token source: getSession() -> cachedToken; Disposition: [F-001]; Merge key: stale-session-owner

## Risk

- [F-001] [src/session.ts:9] Profile authorization uses stale session token
  - Trigger: logout after caching the token
  - Impact: the next request sends stale authorization
  - Root cause: the module cache outlives the session
  - Suggested fix: read from the authoritative session owner
  - Verification: cover logout and token rotation
