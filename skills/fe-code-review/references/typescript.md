# TypeScript Review Reference

Load this file for TypeScript projects, `.ts`/`.tsx` diffs, changed type declarations, API DTOs, or runtime data contract changes.

## Review Focus

- Check `any`, `unknown`, unsafe casts, non-null assertions, and broad generic constraints.
- Verify optional and nullable values match runtime data.
- Check API DTO types against actual consumers and backend contracts when visible.
- Prefer discriminated unions when state variants have different required fields.
- Avoid duplicated types that can drift.
- Avoid type aliases that hide important runtime requirements.
- Check type-safe code that is still runtime-unsafe because validation is missing.
- Verify public utility types are named for domain meaning, not implementation detail.
- Check overloads and generics for unnecessary complexity.

## Common Findings

- Type assertion bypasses a real runtime branch.
- Optional field is treated as required after an async boundary.
- API type and normalized UI model are mixed.
- Shared type is too broad for a specific business flow.
- Type complexity increases without preventing a real bug.

## Evidence To Collect

- `tsconfig.json` strictness settings.
- Type definition and runtime construction site.
- API response handling and normalization.
- Callers that rely on optional fields.
- Tests that cover malformed or missing data.
