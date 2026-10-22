# Large-diff File Coverage Prototype

2026-10-09: the first evaluator-only inventory/accounting prototype passes its
local gate. Stable remains v0.6.0. No formal Skill, collector, public validator,
client adapter, dependency, or installed capability was changed.

Follow-up: the separate [inventory-only collector candidate](large-diff-inventory-collector-candidate.md)
has now passed its own local gate. The results and limits below retain this
prototype's original scope; they are not a model or formal Skill acceptance.

## Implemented Scope

- [Pure inventory/accounting module](../../evaluation/prototypes/file-coverage.mjs):
  parse supplied Git porcelain v1 NUL records, preserve exact names and rename
  pairs, record change layers, and retain explicit incomplete-inventory reasons.
  It performs no filesystem, Git, network, or client operations.
- [Positive and negative fixtures](../../evaluation/prototypes/file-coverage/cases.json):
  an honest partial review of three public synthetic paths, and an invalid
  one-file report that omits the generated and binary paths while claiming full
  coverage. These are evaluator-side drafts, not a mandatory user JSON format.
- [Tests](../../tests/file-coverage-prototype.test.ts): actual temporary Git
  status output plus authored negative controls. Temporary repositories use
  synthetic local identities with signing/hooks disabled for their baseline;
  they do not commit or modify the product repository.

The independent evaluator must supply the scope key, baseline and enumeration
completion evidence. The reviewer draft cannot change that comparison or
denominator. A complete inventory does not imply completed review.

## Results

| Suite | Passed | Purpose |
| --- | --- | --- |
| File coverage prototype | 36/36 | Inventory identity, gap accounting, false completeness, exact scope and Fix exclusion |
| Existing context collector | 3/3 | Existing all-uncommitted invocation and failure behavior remain unchanged |
| Existing output profile | 98/98 | Existing default/v0.6.0 API and CLI behavior remain unchanged |
| Total | 137/137 | Three selected test files; zero failures or skips |

The first scoped run passed 134/134. Three additional boundary cases for empty
scope, supplied narrow manifests and missing baseline/source mutation brought
the final scoped run to 137/137. No failure, assertion relaxation or model retry
occurred. Node syntax and Git whitespace checks also pass.

```bash
pnpm exec vitest run \
  "tests/file-coverage-prototype.test.ts" \
  "tests/review-context.test.ts" \
  "tests/review-output-profile.test.ts"
```

The saved positive fixture passes. The negative fixture rejects both missing
paths, the wrong known/total counts, and the false full-coverage claim. Further
controls reject duplicate entries, out-of-scope consumers, comparison changes,
incorrect state counts, file types used as states, absent gap reasons,
staged-only completion of a mixed-layer change, and a Fix coverage ledger.

Actual Git output exercises staged/unstaged changes, a staged rename, deletion,
untracked files, spaces, tabs, newline, quote, backslash and Unicode names.
Authored controls cover exact case identity independently of filesystem case
sensitivity, truncated records/rename pairs, invalid UTF-8, duplicate/unsafe
paths, conflicts and ambiguous two-layer renames.

The generated local test report and input-hash receipt are retained under
`.local-evaluation/file-coverage-prototype-01/`; they are not installation inputs.

## Limits And Next Gate

- This is structured evaluator accounting, not Markdown extraction or a public
  output profile. Visible placement, bilingual report rendering, recommendations,
  Origin/Reproduction and model behavior need later candidate checks.
- A Reviewed evidence sentence and declared reviewed layers can be false while
  structurally valid. An explicit test preserves this distinction. Neither a
  valid draft nor a read trace proves semantic completeness or model accuracy.
- An output cut exactly at a record boundary is not detectable from those bytes
  alone. Transport completeness, snapshot identity, baseline availability and
  mutation observations must come from independent evaluator evidence.
- Path checks are lexical. The prototype does not resolve symlinks, enforce an
  OS sandbox, prove actual file accessibility, or establish client isolation.
- This step does not run fixture source or a model, add a collector option,
  measure review tokens/latency, or validate generated/lock/binary/submodule
  behavior merely from a filename. Those file types retain ordinary evidence
  requirements.

Next prepare an isolated collector candidate with the explicit inventory-only
option described in the [design](../large-diff-file-coverage-design.md#minimal-implementation-sequence).
Keep the default invocation/result and formal Skill bytes unchanged. Integrating
that option into review instructions and full-report validation remains a later
gate; do not start external model evaluation just because these unit checks pass.
