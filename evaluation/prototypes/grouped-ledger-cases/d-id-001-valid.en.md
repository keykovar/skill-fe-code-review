## Changed-Condition Coverage

- [F-001]
  - Merge basis: one indivisible repair restores the shared session owner
  - [src/session.ts:9] cache owner: shared session -> component local
  - [src/session.ts:12] authentication state: shared session -> duplicated cache
- Cannot Verify
  - [src/runtime.ts:8] production session source: existing owner -> unknown deployed owner

## Findings
