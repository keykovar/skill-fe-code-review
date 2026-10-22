# File Coverage Ledger Reference Dedup Preparation

2026-10-16: **Offline Pass; model not run.** A fresh isolated candidate removes
only the repeated format explanation and legal/illegal examples from the Quick
and Deep references. The core File Coverage rules and strict Coverage grammar
remain unchanged.

## Candidate Identity

The parent is the composed File Coverage plus ledger-format candidate with
manifest SHA-256
`205664708b8c0d0ed19c667312d242ace7e071f914f5df2e0ad7b854ea87e510`.
The new isolated candidate manifest is
`07e4d22fa9c8d6a3bcee161486bc581aac77097245f175c4f7567b6983b59f64`.
It is stored at
`.local-evaluation/file-coverage-ledger-dedup-01/candidate/` and is not
installed.

The exact changed file set is:

- `fe-code-review/references/quick-review.md`: 9,022 bytes in the parent are
  reduced by 792 bytes to 8,230 bytes.
- `fe-code-review/references/deep-review.md`: 11,013 bytes in the parent are
  reduced by 921 bytes to 10,092 bytes.

The core `SKILL.md` remains byte-identical to
the composed parent. Fix, collector, metadata, JavaScript/release-risk
references, source pins and recipes remain unchanged except for the new builder
manifest's provenance.

## Offline Checks

The focused suites pass **17/17 tests in 2 files**:

- The existing composition suite remains 14/14.
- The new deduplication suite passes 3/3.

The checks cover exact changed-file allowlists, parent and dependency hashes,
deterministic output, overwrite/formal-destination/wrong-parent rejection,
absence of the duplicate block, preservation of the concise `Disposition`
template and File Coverage summary, unchanged core and Fix behavior, and
provenance. No parser or formal Skill behavior was changed.

The machine-readable result is retained in
`.local-evaluation/file-coverage-ledger-dedup-01/offline-validation.json`.

The first test run exposed an incorrect assumption that Quick and Deep blocks
had equal byte lengths. The implementation was correct; the test was corrected
to the measured values 792 and 921, and the complete focused suite then passed.
That diagnostic remains part of the local work history and is not a model
result.

## Decision And Next Gate

This candidate is **prepared but Not Run**. The deduplication is a plausible
minimal-efficiency change, not evidence that fewer examples improve model
compliance. The previous Stable format failure and Candidate semantic pass are
preserved; no report was corrected and no parser rule was weakened.

Before any provider task, build a new Candidate-first Deep delivery window from
this exact manifest. Recompute the material manifest, ordered reads, startup
and dispatch hashes instead of reusing the previous window. Require the same
19-read exact trace, strict v0.6.0 parser, file accounting, evidence-boundary,
read-only and semantic gates. Stable may be considered only after this
Candidate is accepted, with the previous 1.0 token, elapsed and tool-call
ceilings unchanged.

Formal/installed `v0.6.0`, `runtimeReady=false`, the previous pair, historical
No-Go reports and Git state remain unchanged. No external task, source
transmission, installation, commit, push, tag or release occurred.
