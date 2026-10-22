# Deduplicated File Coverage Ledger Deep Preparation

2026-10-16: **Offline Pass; Candidate and Stable Not Run.** A fresh Candidate-first
Deep delivery window was rebuilt from the reference-deduplication candidate. The
formal and installed `v0.6.0` Skill were not changed, no provider task was created,
and no source or model request was made.

2026-10-19 follow-up: the separately authorized
[Candidate runtime window is closed as No-Go](large-diff-file-coverage-ledger-dedup-deep-runtime.md)
for an evaluator dispatch deviation (20 actual calls instead of the frozen 19).
Report structure and eight manual semantic checks pass, but Stable is withheld.
The sections below preserve the original offline preparation snapshot; their
`Not Run` statements describe 2026-10-16, not the later execution result.

## Frozen Inputs

The candidate bundle is the isolated reference-deduplication child of the
composed File Coverage plus ledger-format candidate:

- Parent manifest SHA-256: `205664708b8c0d0ed19c667312d242ace7e071f914f5df2e0ad7b854ea87e510`
- Candidate manifest SHA-256: `07e4d22fa9c8d6a3bcee161486bc581aac77097245f175c4f7567b6983b59f64`
- Candidate bundle: `.local-evaluation/file-coverage-ledger-dedup-01/candidate/`
- Dispatchable window: `/private/tmp/fe-file-coverage-ledger-dedup-deep-01-20261016`
- Freeze SHA-256: `4503625ca3ad5771e6525ab5f74b061be668137ead8836123ab115f676b0889a`

The only candidate Skill changes remain the removal of repeated format guidance
from Quick (`-792` bytes) and Deep (`-921` bytes). Core File Coverage rules,
strict Coverage grammar, Fix boundaries, collector, validators, metadata,
JavaScript/release-risk references and the formal/installed Skill remain pinned.
The public `FC-D-001` packet and evaluator-only oracle are unchanged. Stable uses
the formal `v0.6.0` bytes and is held behind Candidate acceptance.

## Delivery Contract

Each arm contains eleven workspace files: nine evidence files, `materials.json`
and `bootstrap.md`. The nine evidence files are the selected core/mode
instructions, JavaScript and release-risk references, packet metadata/context and
three source snapshots. No oracle, plan, history, answer, report, credential or
other Skill is delivered.

Each arm has eighteen ordered material reads plus one startup read, for nineteen
calls total. The manifest is read first; every evidence file is reconstructed from
contiguous UTF-8 ranges capped at 6,000 bytes. Every generated `functions.exec`
template retains `max_output_tokens: 20000`, `login: false`, the frozen working
directory and the no-retry/stop-on-failure rule. Startup and dispatch are frozen
separately for Candidate and Stable.

| Local measurement | Candidate | Stable |
| --- | ---: | ---: |
| Evidence files | 9 | 9 |
| Material reads | 18 | 18 |
| Total calls including startup | 19 | 19 |
| Largest material read, bytes | 5,993 | 5,996 |
| Original evidence bytes | 59,497 | 52,833 |
| Startup bytes | 9,277 | 9,218 |
| Dispatch bytes | 708 | 705 |
| Total delivered content bytes | 72,413 | 65,685 |

Totals count actual material receipts, startup and dispatch once each. Tool and
client overhead is unknown. Equal reads and byte bounds do not establish equal
tokens, latency, cost or model quality.

## Offline Checks

Five related Vitest suites pass **74/74**. The checks cover the parent and child
manifest pins, candidate-type-specific transformation, exact nine-file evidence
allowlists, unchanged packet and Stable bytes, contiguous reconstruction, both
20,000-token budgets, startup/dispatch accounting, digest and protected-path
checks, and missing/extra/reordered/truncated/failed/budget/cwd/tool-code drift
rejection.

The actual dispatchable directory passes **38/38** native read calls: both arms
reconstruct all nine evidence files and `verifyFileCoverageLedgerDeepDelivery`
returns `Pass`. The independent preparation receipt is retained at
`.local-evaluation/file-coverage-ledger-dedup-01/deep-preparation-receipt.json`;
the native replay result is at
`.local-evaluation/file-coverage-ledger-dedup-01/deep-offline-validation.json`.

These checks establish local material integrity and delivery preparation only.
They do not prove model-visible delivery, semantic review quality, client
filesystem isolation, token/latency/cost improvement or promotion readiness.
Both runs remain `Not Run`, with `modelInvocations: 0` and
`sourceTransmitted: false`.

## Next Gate

Obtain explicit authorization for one independent Codex Desktop Candidate task
using the currently configured `gpt-6-astra / xhigh` route. Immediately before
dispatch, recheck the provider, both frozen SHA-256 values, the 19-call schedule
and the selected Candidate dispatch file. Send only the frozen public synthetic
Candidate materials and startup metadata. Assess the unedited report, actual
tool inputs/outputs, file accounting, evidence boundaries, read-only behavior and
elapsed time. Do not dispatch Stable, retry automatically, weaken the parser or
promote the candidate from this offline result.
