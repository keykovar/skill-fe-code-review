# Previous Issue

Authored synthetic prior finding. This records the issue before the repair; it does not state the current review result.

- [F-001] [before/profile.mjs:2] Profile URL contains repeated separators
  - Original severity: Risk
  - Trigger: call `profileUrl('https://api.example.test/')` using the before snapshot.
  - Impact: the profile request URL differs from the required canonical path; the consumer does not normalize the returned string.
  - Root cause: `joinUrl` inserts a separator without removing the existing boundary separators.
  - Suggested repair: restore separator handling in the existing URL function without adding another owner.
  - Acceptance criteria: the profile consumer preserves its origin and route with one boundary separator; see `context.md` for the repair check scope.
  - Origin: New - relative to `original/profile.mjs` -> `before/profile.mjs`, the reviewed change removed the previous separator normalization.
