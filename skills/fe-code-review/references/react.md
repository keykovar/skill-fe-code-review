# React Review Reference

Load this file only when the reviewed project or diff uses React, React DOM, Next.js, Remix, JSX, TSX, or React hooks.

## Review Focus

- Verify `useEffect` dependencies represent lifecycle inputs, not incidental callback freshness.
- Check stale closures in subscriptions, timers, event listeners, async callbacks, and external SDK callbacks.
- Prefer computed values over derived state when the value can be calculated during render.
- Remove unnecessary state, effects, refs, memoization, and callback wrappers.
- Verify timer, subscription, request, observer, and event listener cleanup.
- Check infinite render loops caused by effects updating their own dependencies.
- Review conditional rendering for empty, loading, error, permission, and retry states.
- Check component responsibility. Split only when it reduces real complexity or matches local patterns.
- Check hook responsibility. Avoid large all-in-one hooks with hidden side effects.
- Verify memoization is justified by measurable cost or stable child props.
- Review React version-specific API usage against installed `react` and `react-dom` versions.

## Common Findings

- Effect dependency suppression hides lifecycle bugs.
- Business logic is moved into shared hooks too early.
- UI state duplicates server/cache state.
- Callback names imply one lifecycle, but code handles another.
- Cleanup is missing for long-lived listeners or async work.
- A one-off helper makes the data flow harder to follow.

## Evidence To Collect

- `package.json` React version.
- Component and hook call sites.
- State owner and state consumers.
- Effect setup and cleanup path.
- Related tests or missing tests.
