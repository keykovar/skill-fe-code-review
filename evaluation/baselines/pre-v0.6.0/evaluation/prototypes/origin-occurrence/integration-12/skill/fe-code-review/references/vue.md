# Vue Review Reference

Load this file only when the reviewed project or diff uses Vue, Nuxt, Pinia, `.vue` files, or Composition API.

## Review Focus

- Verify `ref`, `reactive`, `computed`, `watch`, and `watchEffect` are used for the right ownership model.
- Check watcher source stability and cleanup behavior.
- Avoid watchers for values that should be computed.
- Check Pinia/store mutations for consistency, ownership, and hidden global side effects.
- Verify router navigation side effects, guards, redirects, and query synchronization.
- Check `v-if`, `v-show`, `key`, and list rendering behavior.
- Review component props and emits contracts.
- Check template nullability and optional values.
- Verify lifecycle cleanup for timers, listeners, subscriptions, requests, and observers.
- Review deep mutation and reactivity unwrapping risks.

## Common Findings

- `watchEffect` hides dependencies and re-runs more often than intended.
- Store state is mutated outside the intended owner.
- Route sync code causes duplicate navigation or loops.
- Missing `key` causes stale component state.
- `reactive` object replacement breaks consumers.

## Evidence To Collect

- Vue, Nuxt, Pinia, and router versions from `package.json`.
- Store owner and mutation call sites.
- Watcher sources and cleanup.
- Route entry points and navigation guards.
- Related component props/emits usage.
