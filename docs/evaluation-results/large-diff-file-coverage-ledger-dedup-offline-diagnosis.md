# Dedup Deep Offline Diagnosis

2026-10-19: **Offline diagnosis complete; no new runtime window is ready.**
The [closed Stable run](large-diff-file-coverage-ledger-dedup-stable-runtime.md)
remains No-Go and the Candidate remains individually accepted. This step
replays retained data locally and assesses an existing delivery option. It
does not change the formal/installed Skill, raw reports, parser or thresholds.

## Format Failure

The unchanged v0.6.0 validator reproduces exactly one Stable error:
`coverage-ledger-unexpected-content` at line 53. The paragraph correctly
qualifies baseline session locations and caller-only behavior, but is placed
inside the strict Coverage list.

The formal Deep reference presents competing output cues. Its prose requires
literal `Disposition` ledger rows, while the fenced Chinese output template
uses a different placeholder and includes location guidance plus legal/illegal
examples between Coverage and Findings. The core also requires line-level
grammar but does not explicitly route introductory caveats out of that section.
This is a demonstrable template inconsistency; it does not prove the model's
internal reason for placing this particular paragraph there.

Four checks on the actual reports isolate the parser behavior:

| Local control | Result |
| --- | --- |
| Original Stable report | Fails at line 53 |
| Same paragraph moved to Evidence in memory | Pass; same seven Coverage rows and zero findings |
| Paragraph reinserted into Coverage in memory | Fails again |
| Original Candidate report | Pass |

No altered report was saved or accepted as model output. These checks locate
the failure, not a semantic fix or a new model pass. The existing
[format-only candidate](ledger-format-and-bounded-delivery-candidate.md) already
addresses this inconsistency by keeping only ledger items in the output slot,
moving guidance outside the template, and routing caveats to Evidence. Reuse
that correction instead of adding another layer of rules. Its earlier
[single Deep pilot](ledger-format-deep-read-call-runtime.md) remains bounded
historical evidence, not a current matched efficiency result.

## Cost Accounting

Both original sessions contain **20 token-usage samples and 19 read calls**.
Summing each sample's last usage exactly reproduces the recorded cumulative
totals. The first model input already contains about 36,900 tokens before the
nine evidence files have been read, including host context and dispatch.
Repeated model inputs, not a single million-token document, contribute to the
reported totals. These records cannot attribute exact costs to individual host
instructions, estimate billing or explain the elapsed-time difference.

| Measured component | Candidate | Stable | Difference |
| --- | ---: | ---: | ---: |
| Input tokens | 977,960 | 958,396 | +19,564 |
| Cached input, included above | 941,568 | 923,392 | +18,176 |
| Input minus cached input | 36,392 | 35,004 | +1,388 |
| Output tokens | 6,544 | 5,644 | +900 |
| Reasoning output, included above | 2,099 | 1,110 | +989 |
| Output minus reasoning output | 4,445 | 4,534 | -89 |
| Input plus output | 984,504 | 964,040 | +20,464 |
| Task duration | 280,309 ms | 207,238 ms | +73,071 ms |

Cached input accounts for 96.28% and 96.35% of the respective input totals.
It is not free by assumption and must remain in the frozen total-token gate.
The additional output is not a longer visible answer: non-reasoning output
is slightly smaller. No cache/reasoning component is counted twice, and no
component is excluded to turn the failed gate into a pass.

The delivered-byte difference is separately measurable:

| Delivery component | Candidate | Stable | Difference |
| --- | ---: | ---: | ---: |
| Core Skill | 43,162 | 36,355 | +6,807 |
| Deep reference | 10,092 | 10,235 | -143 |
| Other seven evidence files | 6,243 | 6,243 | 0 |
| Evidence subtotal | 59,497 | 52,833 | +6,664 |
| Launch, manifest and prompt | 12,916 | 12,852 | +64 |
| Full delivered content | 72,413 | 65,685 | +6,728 |

The core increase largely represents the additional file-accounting/collector
contract; it is not the cost of the small format clarification. Removing more
important core rules or making them optional would violate the user's retained
requirements. The earlier reference deduplication has already made the selected
Deep reference smaller than Stable. Further blind compression is not justified
by this evidence.

## Existing Batch Packer Preview

The unchanged `bounded-review-materials.mjs` was applied in memory to all nine
independently pinned files in their declared order. An additional format-only
preview uses the existing clarification functions on the frozen Stable files;
it is not a new saved Skill candidate. All other files remain byte-identical.

| Evidence-only preview | Original bytes | Encoded bytes | Batches | Largest batch |
| --- | ---: | ---: | ---: | ---: |
| Formal Stable | 52,833 | 54,977 | 3 | 19,847 |
| Existing format-only correction | 53,389 | 55,537 | 3 | 19,795 |
| File Coverage dedup Candidate | 59,497 | 61,774 | 4 | 19,964 |

All batches remain under the existing 20,000-byte encoded limit. For each arm,
one exact reconstruction and five rejection controls pass: missing, extra,
reordered, truncated and equal-length-tampered outputs. Total: **18/18 packing
controls**, in addition to the four report controls. This is local
reconstruction, not model delivery or source execution.

If startup is included in the dispatch and one manifest read is retained,
these previews imply four total read calls for Stable/format-only and five for
File Coverage. If startup is another read, the counts become five and six.
The new manifest, startup and prompt have not been prepared, so neither count
is a frozen executable schedule, and the evidence-only byte totals exclude
those components.

**Directly switching the current File Coverage pair to this packer is not ready
for runtime:** its anticipated call ratio would be 5/4 or 6/5, exceeding the
unchanged 1.0 gate. Do not add pointless Stable reads, increase the batch limit
solely to pass, or weaken the threshold. A historical four-call run cannot be
compared with this nineteen-call run to claim token or latency savings.

## Decision And Next Step

Follow-up: the [existing format-only candidate now passes current offline
closeout](ledger-format-current-closeout.md), with exact historical byte parity,
191/191 related tests and both shape validators. Its remaining targeted gap is
Deep rendering with actual findings and repeated IDs; the next preparation is
an offline fixture for that case, not another run of the accepted evidence-gap
case.

The diagnosis selected an **offline closeout of the existing format-only
correction**, kept separate from File Coverage. That follow-up verifies its
exact current bytes against accepted evidence, reusable local tests and
remaining coverage gaps. Keep the core rules present, Fix scope unchanged, Chinese output
consistent and the parser strict. Its batch preview has the same call count as
Stable, but token/elapsed acceptance is still unproven. Do not create another
copy or run the same accepted evidence-gap case merely to accumulate passes.

File Coverage remains experimental. The current two-file packet tests honest
handling of a missing target; it does not exercise the intended large-diff
inventory benefit. Before any later cost proposal, select a representative
large-diff case that can exercise the existing inventory collector without
omitting review evidence, then freeze a fair complete-delivery comparison.
An experimental format-only control must be named as such, never relabeled as
formal Stable or substituted to bypass the original acceptance gates.

This diagnosis does not authorize runtime work, promotion or Git delivery.
There is no new model task, dependency installation, source transmission or
candidate freeze. Formal/installed v0.6.0, historical failures and
`runtimeReady=false` remain unchanged.

## Evidence Integrity

The local script and detailed receipt are retained at
`.local-evaluation/file-coverage-ledger-dedup-01/offline-diagnosis-02/` as
`diagnose.mjs` and `diagnosis.json`. All 59 material/input pins and 51 retained
report/session/helper/formal-file hashes match before and after diagnosis.
The full test suite was not rerun because no production Skill, validator,
packer or public implementation changed.

Two evaluator-only setup failures are retained in the receipt: a relative
workspace initially resolved against the repository, and the file-pin inventory
initially counted bootstrap/manifest as evidence. The script now resolves
against the frozen material root and derives the nine evidence paths from the
read schedule while accounting for startup metadata separately. Neither failed
attempt wrote a result, executed source or called a model.
