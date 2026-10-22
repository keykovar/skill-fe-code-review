# File Coverage Ledger Offline Overhead

2026-10-16: **Offline diagnosis complete; no new candidate is frozen and no
model run is authorized.** This note separates the composed Candidate's
incremental format correction from the larger File Coverage feature, then
records the smallest follow-up worth testing.

## What The Pair Measured

The completed pair used the same public packet, client version, provider route,
model, reasoning effort and nineteen-read schedule. Candidate used the composed
File Coverage plus ledger-format Skill; Stable used formal/installed `v0.6.0`.
Stable's report failed the unchanged parser at line 64, so this is a diagnostic
pair rather than an accepted efficiency comparison.

| Delivered evidence | Candidate | Stable | Difference |
| --- | ---: | ---: | ---: |
| `skill/SKILL.md` | 43,162 bytes | 36,355 bytes | +6,807 |
| `deep-review.md` | 11,013 bytes | 10,235 bytes | +778 |
| `materials.json` | 2,931 bytes | 2,929 bytes | +2 |
| Startup file | 9,258 bytes | 9,199 bytes | +59 |
| Dispatch prompt | 707 bytes | 704 bytes | +3 |
| Total delivered content | 73,314 bytes | 65,665 bytes | +7,649 (+11.65%) |

The +6,807-byte core difference is primarily the File Coverage behavior: the
inventory collector contract and the Quick/Deep file-accounting rules. It must
not be described as the cost of the small ledger-format correction.

Relative to the earlier isolated File Coverage candidate, the composition
correction changes only three selected files:

| Incremental composition change | Net bytes |
| --- | ---: |
| Core `SKILL.md` | +325 |
| Quick reference | +231 |
| Deep reference | +231 |

The Deep run therefore adds 556 instruction bytes over that earlier File
Coverage candidate (core plus Deep reference). The selected reference change is
net of a shorter template line and a repeated explanation/example block.

## Token And Time Observations

| Client telemetry | Candidate | Stable | Candidate minus Stable |
| --- | ---: | ---: | ---: |
| Input tokens | 971,246 | 947,904 | +23,342 |
| Cached input tokens | 935,040 | 913,024 | +22,016 |
| Uncached input tokens | 36,206 | 34,880 | +1,326 |
| Output tokens | 6,399 | 6,757 | -358 |
| Reasoning output tokens | 1,612 | 1,959 | -347 |
| Input plus output tokens | 977,645 | 954,661 | +22,984 (+2.41%) |
| Duration | 464,726 ms | 372,165 ms | +92,561 ms (+24.87%) |
| Tool calls | 19 | 19 | 0 |

The numbers are client telemetry, not billed cost. The input delta includes
cache accounting and the output delta moves in the opposite direction. A single
sequential pair cannot attribute the 92,561 ms difference to the Skill, prove a
token conversion from bytes, or establish a monetary change. Candidate's report
passed its gates; Stable's report did not, so neither run is a matched pair of
accepted reviews.

## Smallest Follow-up Hypothesis

Keep the File Coverage rules in core `SKILL.md`. They are shared normative
rules for Quick and Deep and must remain available whenever either mode is
loaded. Keep the concise mode-specific instruction and the shorter
`Disposition` template in each mode reference.

Remove only the repeated format explanation and four legal/illegal examples that
the composition correction added to each Quick/Deep reference. The measured
blocks are 792 bytes in Quick and 921 bytes in Deep. This would make the
proposed follow-up roughly:

- Deep: 921 fewer delivered evidence bytes for the selected reference, before
  the small manifest/hash change.
- Quick: 792 fewer delivered evidence bytes when Quick is selected.
- Fix: unchanged; no File Coverage fields or Changed-Condition ledger are added.
- Core: unchanged; the strict one-line Coverage grammar and read-only rules stay
  in place.

This is a testable deduplication hypothesis, not permission to edit the formal
Skill or weaken the parser. Stable's failure despite already having the core
grammar means the extra examples have no demonstrated causal value. Removing
them may still affect model behavior, so the next candidate must be evaluated
from a fresh freeze.

## Required Offline Gates For The Next Candidate

1. Generate a fresh isolated bundle from the accepted File Coverage candidate;
   preserve all non-target bytes, Fix behavior, collector boundaries, core
   grammar, bilingual summary grammar and historical failure pins.
2. Assert the exact target diff: only Quick/Deep reference blocks change; the
   removed block is absent, the concise template remains, and core is byte
   identical to the composed Candidate.
3. Run the focused Skill-shape, file-accounting, report-format, read-schedule
   and negative-delivery suites. A parser pass alone is insufficient.
4. Rebuild a new Deep pair with the same public packet and nineteen-call
   schedule. Record delivered bytes and reported input/cached/output/reasoning
   tokens separately; do not convert bytes to tokens.
5. Require Candidate first. Only after an accepted Candidate result may a new
   separately authorized Stable comparison run. Keep the 1.0 token, elapsed and
   tool-call ceilings unchanged; do not relax them after seeing results.

No external task, installation, formal Skill replacement, commit, push, tag or
release follows from this diagnosis. Formal/installed `v0.6.0`, the historical
03b No-Go and the completed pair remain unchanged.
