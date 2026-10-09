# Previous Findings

## referenced-untracked-file

- Original severity: Blocking
- Problem: `src/url.ts` imports `src/request-config.ts`, but the config file is not tracked.
- Acceptance: the dependency is tracked in the submit scope or the import is removed.

## removed-slash-normalization

- Original severity: Blocking
- Problem: URL concatenation no longer normalizes the base trailing slash and path leading slash.
- Acceptance: all base/path slash combinations produce one separator slash and the existing test passes.

## ignored-base-url-contract

- Original severity: Risk
- Problem: `buildUrl` keeps the `baseUrl` parameter but silently ignores it.
- Acceptance: the parameter is used according to the existing contract, or the API and every caller are migrated consistently.
