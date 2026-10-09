# JavaScript Review Reference

Load this file for JavaScript projects, `.js`/`.jsx` diffs, runtime-shape-heavy code, or code with weak compile-time constraints.

## Review Focus

- Check null and undefined guards.
- Verify runtime type checks before accessing nested data.
- Check object shape assumptions across API, storage, cache, and route boundaries.
- Review default values and fallback behavior.
- Check function parameters for required shape and valid ranges.
- Verify array, map, set, and object iteration handles empty data.
- Check async error handling and rejection paths.
- Review implicit coercion, truthy/falsy logic, and number/string conversions.
- Ensure naming makes expected runtime shape clear.

## Common Findings

- API response shape is assumed without validation or fallback.
- `||` fallback breaks valid falsy values.
- Empty arrays or missing objects produce runtime errors.
- Storage values are parsed without guarding invalid JSON.
- A function accepts broad inputs but only works for one shape.

## Evidence To Collect

- Data source and all consumers.
- Boundary where data enters from API, storage, route, or native bridge.
- Existing runtime validation helpers.
- Error, empty, and fallback behavior.
