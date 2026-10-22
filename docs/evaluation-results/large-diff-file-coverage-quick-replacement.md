# File Coverage Quick Replacement Preparation

Preparation snapshot, 2026-10-12: **Offline Preparation Pass; both new model runs were Not Run.**
Twenty-one new tests and seventy-two existing preparation/report controls pass,
**93/93** in three files. The [previous No-Go result](large-diff-file-coverage-quick-runtime.md),
its report, oracle, input hashes and source traces remain unchanged.

2026-10-13: the subsequently authorized stable run has complete delivery but
fails output grammar and the elapsed ceiling; candidate was withheld. See the
[runtime result](large-diff-file-coverage-quick-replacement-runtime.md). Decisions
below retain the historical preparation state.

This replaces an invalid comparison window, not the formal v0.6.0 Skill. It
corrects the evaluator's finding-count expectation and provides bounded reads
with exact receipt checks. The previously observed ledger-format failure is
still unresolved; neither the parser nor reviewer report was relaxed or edited.

## Oracle Correction

The new evaluator-only oracle expects two distinct acceptance conditions at
`src/url.mjs:2`: a missing boundary slash and a duplicate boundary slash. Both
remain Risk / New / Not Run and originate in the unstaged direct-concatenation
change. A common repair can restore the existing helper's normalization without
merging independently repairable findings. Finding identity follows acceptance
conditions; the oracle does not prescribe which tied location gets F-001 or F-002.

The new tests execute the authored public helper snapshots and unchanged direct
consumer, plus two evaluator-only partial repairs. For each row below, the same
result is checked with and without a query string:

| Boundary slashes | Baseline | Current problem | Missing-slash repair only | Duplicate-slash repair only |
| --- | --- | --- | --- | --- |
| Neither side | Correct | Wrong | Correct | Wrong |
| Both sides | Correct | Wrong | Wrong | Correct |
| Origin only | Correct | Correct | Correct | Correct |
| Route only | Correct | Correct | Correct | Correct |

The partial repairs preserve the unaffected combinations and query bytes. This
supports the existing Skill rule requiring independent findings. The original
one-finding oracle is retained in window 01; the corrected oracle exists only
in the new control directory. Test functions, results, expected findings and
old reports are not included in either reviewer packet. A later reviewer must
still report Reproduction `Not Run`, because execution evidence is not delivered
to it and its own source execution remains forbidden.

## Bounded Delivery

[The new preparation helper](../../evaluation/prototypes/prepare-file-coverage-quick-replacement.mjs)
first verifies the historical freeze using the unchanged original verifier.
It copies the selected Quick pair into a fresh output root, preserving every
source, context and Skill byte. Only delivery metadata and the shared bootstrap
change. Expected answers remain separate.

Each evidence file in `materials.json` has complete, contiguous `readRanges`.
The schedule reads core, Quick and JavaScript rules before packet metadata and
source. Every returned range is at most 6,000 UTF-8 bytes. The instruction asks
for one range per tool response, no parallel aggregation, and both inner and
outer output budgets of at least 10,000 tokens. Any failed, missing or truncated
response stops the attempt without an automatic reread or follow-up.

The helper equalizes each corresponding file's read count by splitting existing
contiguous ranges; it adds no duplicate content. Thus both runs have twenty-four
planned responses, including the initial material manifest. Their common
bootstrap is delivered in the startup prompt, not reread from disk.

Each evaluator-side read receipt records its ID, path, line interval, exact byte
length and SHA-256. `verifyBoundedReadDelivery` rejects missing, extra, reordered,
wrapped, truncated or changed output. It must receive text extracted from the
actual model-visible trace. A full native command result or a synthetic replay
cannot prove complete model delivery. Local validation checks both complete
reconstruction and rejection when core line 169 is removed.

The byte bound provides headroom; it is not a token estimator or a guarantee
about a client's output caps. More bounded responses can increase context
repetition and latency. Equal planned read counts only remove a deterministic
pair imbalance; actual tokens, tool calls and elapsed time still need measurement.
No cost improvement is claimed, and the failed old run is not a valid cost baseline.

## Output Contract

The existing validator continues to reject prose inside the strict
Changed-Condition Coverage ledger. A new negative test inserts a standalone
explanation into an otherwise valid official example and confirms the same
`coverage-ledger-unexpected-content` error. The untouched example still passes.

No output hint, suggested finding, report correction or formatting exception is
added to the reviewer bootstrap. A future run must satisfy the unchanged Skill
contract unaided; the prior rendering failure is not considered repaired by
this preparation. Further behavioral changes, if needed, require their own
candidate design instead of a post-result parser relaxation.

## Frozen Window

Local materials are under
`.local-evaluation/file-coverage-comparison-02/materials/`.

| Run | Files | Scheduled reads | Material bytes | Actual startup bytes |
| --- | ---: | ---: | ---: | ---: |
| 01-quick-stable | 17 | 24 | 56,909 | 2,659 |
| 02-quick-candidate | 17 | 24 | 63,932 | 2,662 |

Material totals include the standalone bootstrap. Actual startup includes that
same bootstrap plus the absolute material-root binding; do not count it twice.
The three-byte startup difference is the stable/candidate directory-name length.
Metadata ranges differ where Skill length differs. Source bytes and shared
bootstrap bytes are identical within the pair; Skill bytes match their respective
frozen parents. No new Skill or release-risk/Fix reference is introduced.

- Previous freeze: `5571c59430c2854f73d7c15be5676fdc5717f4706926db2f14d6aeacb4b7853d`.
- New freeze: `8fedb919fb869624ce0927bf5e71989d03512b2e4c8de75d59fbd1b99e9d76b5`.
- Shared bootstrap: `bb79466c8490705f4f3fc737c57534f12a309a019f5ab9f5f50094039d3c47b2`.
- Stable launch prompt: `64f416922d8a5c6e7345ec025c6cb81cfeda3922f0fe5762b78aed0b7c81bea8`.
- Candidate launch prompt: `effe1e240963059f614d5ede7c311c45ce679ece0d00c08a62140454b232af7e`.

The preparation receipt and exact two launch prompts are beside the material
directory. They propose fresh independent Codex Desktop tasks with
`gpt-6-astra / xhigh`, stable first. Joymeet `https://t.kxmeet.com` is the intended
provider; current route settings still need verification before an authorized
dispatch. No credential or provider request was used for preparation.

The original cost ceilings, read-only boundary, one-attempt limit and stop rules
remain. Each run has a 600-second ceiling; candidate/stable reported tokens,
elapsed time and tool-call ratios must each be at most 1.0. Missing telemetry
holds cost acceptance. A failed stable result blocks candidate dispatch. This
window contains only the Quick pair, with no Deep/Fix progression or retry.

## Validation And Decision

[The new tests](../../tests/file-coverage-quick-replacement.test.ts) cover:

- Independent repairs, untouched combinations and query preservation.
- Historical freeze preservation, exact parent payloads and oracle exclusion.
- Contiguous bounded UTF-8 reads, unchanged EOF, equal paired read counts and
  rejection of the previously missing core line.
- Missing/duplicate/ordered/truncated receipt controls, changed source/control
  data, symlinks, extra files, unsafe output paths and independent freeze digests.
- The unchanged strict output grammar and unchanged cost/stop rules.

Initial tests pass 21/21; the final scoped suite passes 93/93. A separate native
`sed` replay verifies all twenty-four ranges in each packet against their exact
hashes, including EOF handling; maximum outputs are 5,994 and 5,988 bytes. This
replay is stored in `native-read-replay.json` and is not a reviewer trace. Local
generated packets verify independently against both old and new digests. This is offline
tooling evidence, not model acceptance, semantic accuracy, OS isolation,
automatic invocation or token/latency savings. Formal/installed v0.6.0 and the
file-coverage candidate are unchanged; no dependency installation or Git
delivery occurred.

Next execution would create two new tasks and send only their frozen public
materials. It needs a new explicit execution decision because the original
window is closed and its stop policy forbids automatic replacement. Before
dispatch, recheck the route, exact prompts, material hashes and authorization;
then accept the complete stable report/trace before dispatching candidate.
