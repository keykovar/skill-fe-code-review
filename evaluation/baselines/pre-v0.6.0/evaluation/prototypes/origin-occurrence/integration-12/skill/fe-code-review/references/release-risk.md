# Release Risk Review Reference

Load this file for Deep Review, release branches, large features, cross-module refactors, dependency upgrades, feature flags, rollout plans, or business-critical flows.

## Review Focus

- Confirm the implementation matches the stated requirement and does not change unrelated behavior.
- Map entry points, shared modules, API contracts, data stores, cache layers, and route paths.
- Identify blast radius across modules, themes, platforms, environments, and user states.
- Check feature flags, gates, default states, rollout strategy, and kill switches.
- Verify rollback path and whether data/schema/cache changes are reversible.
- Review observability: logs, analytics, Sentry/error reporting, and success/failure counters.
- Check manual test paths for main flow, empty state, error state, retry, permission, and compatibility.
- Check dependency upgrades for lockfile changes, transitive risk, bundle impact, and build changes.
- Identify migration risks for persisted state, local storage, cache keys, cookies, and DTO changes.

## Release Output Additions

Include:

- Requirement gaps.
- Change map.
- Test gaps split by unit, integration, manual, logs, analytics.
- Release risks split by rollout, rollback, compatibility, monitoring.
- Evidence split by local code, call paths, package/version, official docs, and unverified items.

## Common Findings

- A feature flag exists but does not guard all new behavior.
- Rollback leaves persisted data in an incompatible state.
- Shared utility change silently affects unrelated flows.
- Error reporting covers failures but not degraded success states.
- Manual test paths omit empty/error/loading or platform-specific behavior.

## Evidence To Collect

- Requirement, ticket, PR description, or user-provided release intent.
- Changed entry points, shared modules, routes, API contracts, and config files.
- Feature flags, rollout gates, rollback path, and kill switches.
- Package and lockfile changes for dependency or build risk.
- Existing tests, manual test plan, logs, analytics, and error reporting.
