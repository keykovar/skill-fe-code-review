# Ledger Format Deep Projectless Isolation Preparation

2026-10-14 runtime update: the separately authorized Window 03 task completed.
[Its overall result is No-Go for the omitted outer output budget](ledger-format-deep-projectless-runtime.md),
while actual delivery, structure, manual semantics, recorded scope, integrity
and elapsed time pass. The window is consumed. Preparation-time statements
below are retained as history and do not authorize another run.

2026-10-13 correction: **window 03 passes local preparation; execution Not Run.**
Window 02 is **Not Dispatchable**. Its earlier 82-test pass did not check the
actual launch directory, the duplicated bootstrap hash or fresh-checkout test
independence. That result and all original artifacts are retained below as
history, not current dispatch approval.

## Corrected Preparation: Window 03

The earlier launch referred to the current projectless directory even though
the material existed only in the repository's local evaluation directory. The
task API cannot preload files or set a packet-specific cwd before the task
starts. The corrected launch therefore provides the existing absolute packet
workspace and requires that exact `workdir` for each of four native reads.
Creating a projectless task is not assumed to copy or isolate any files.

The builder now updates and verifies both bootstrap/launch hashes and startup
byte accounting. It also pins its own recipe, checks inherited inputs, and
verifies the unchanged parent batches, read order, oracle and candidate
manifest. Relocation requires a new preparation; it cannot silently reuse a
launch tied to another directory. Tests generate all upstream materials in
their own temporary directory, with no dependency on local historical output.

The launch now distinguishes two conditions without naming any expected
finding or fixture answer:

- Read failure or missing/truncated expected batch content stops delivery.
- A complete packet that explicitly declares unavailable source or runtime
  evidence retains that limitation and completes the remaining review/report.
  It must not invent missing code or search outside the packet.

This also corrects the interpretation of the earlier Deep stop: declining to
invent source behavior was appropriate, but treating the declared source gap
as a transport failure and omitting the entire report was not the intended
outcome. The prior run remains No-Go for its outside read, with semantic
acceptance Not Evaluated. Neutral task wording remains a mitigation hypothesis;
no evidence establishes Skill naming as the cause of that outside read.

Local verification passes **100/100 tests in five files**, including 24 corrected
preparation tests. These cover native replay from a caller directory without
materials, duplicated-hash drift even after recomputing the freeze digest,
recipe provenance, missing/extra/modified/symlinked files, protected output
paths, relocation, and unchanged parent snapshots. Four local native reads
reconstruct all nine original files. These are not model-visible receipts.

| Window 03 content | UTF-8 bytes |
| --- | ---: |
| Original nine evidence files | 53,389 |
| Manifest plus three batch payloads | 57,677 |
| Startup including absolute workspace declaration | 2,984 |
| Selected payloads plus startup, counted once | 60,661 |

The new freeze is
`560d154d35dc5863a3be56599257b607bd63c1a6d9a417d4678ee3d704e6a888`.
The candidate manifest and parent Deep freeze remain those listed below.
All 112 protected formal Skill/history files retain their pre-edit hashes.
The recipe/test/document snapshots, old-window diagnosis, both passing test
reports, native receipts and preparation receipt are retained under
`.local-evaluation/ledger-format-deep-isolated-03/`. No previous receipt or
failed result was overwritten during this correction.

The next gate is a separately authorized **single** independent Codex Desktop
task with `gpt-6-astra / xhigh`, after checking the configured provider and this
freeze. The proposed runtime payload is the unchanged nine public synthetic
evidence files plus the corrected launch, with no oracle, historical report or
private business source. Check all actual reads and the unedited report.
Any outside read rejects the run; no automatic retry is authorized. The
900,000 ms post-completion ceiling and semantic gates are unchanged.

**Projectless and prompt wording do not enforce filesystem isolation.** The
task API supplies neither a read allowlist nor an option to disable user-level
Skills. Even a successful pilot would only demonstrate adherence for that one
run. Stronger runtime enforcement, general reliability, cost savings and
candidate promotion remain unproven. Formal/installed v0.6.0 is unchanged.

## Historical Window 02 Preparation (Superseded)

The following was the original preparation assessment; window 03 above
withdraws its dispatch eligibility without rewriting its frozen evidence.

2026-10-13: **Originally recorded Offline Pass; execution Not Run.** A fresh projectless Deep
window is prepared after the previous Deep task read the installed Skill before
the supplied packet. No provider request, model invocation, credential read or
formal Skill change occurred.

## What Changed

The new window keeps the previous FC-D-001 Deep packet and candidate bytes
unchanged. It changes only the task contract:

- execution environment proposal: `projectless`;
- dedicated output directory name: `fe-code-review-deep-isolated-02`;
- first allowed read: `workspace/materials.json`;
- subsequent reads: the three ordered batch files only;
- prompt wording: use the delivered candidate instructions and do not invoke or
  search installed Skill paths, user-level directories, the host repository or
  other task history.

The prompt deliberately avoids naming the installed Skill as an invocation
target. The candidate Skill and references remain inside the frozen batches, so
the review content is unchanged. This is a prompt and task-environment contract;
it is not proof of OS-level read isolation.

## Local Checks

The focused suites pass **82/82 tests in five files**. The added six checks
verify projectless metadata, neutral startup wording, absence of host paths and
installed-Skill triggers, unchanged evidence and read pins, protected output
paths, and independent freeze verification. The existing Deep, Quick, candidate
and bounded-material suites still pass.

The new window has five workspace files, four bounded reads and nine evidence
files. The startup plus selected payload bytes are recalculated for the new
prompt; source and batch bytes remain identical to the prior Deep window.

- Parent Deep freeze: `089980d4291fb0feb135f4b222d776915a04908b2eed4c91870544d58424cae8`.
- Projectless isolation freeze: `725410bcb2e4535b0fdcb7403867ca2033513cc4b8d5537d84cfd959da35abb6`.
- Candidate manifest: `61460297bc2bb429e046ae8bcfe0dc5b762a8171d80a4e5c3dcaa31a2c6e4298`.

The first local preparation attempt is retained as an incomplete diagnostic;
it exposed that changing the prompt after copying a frozen workspace requires
re-pinning the bootstrap and launch bytes. It was not used for the final
window.

## Historical Boundary And Proposed Gate

`projectless` is not an enforced filesystem sandbox. The Codex task creation
interface exposes a projectless target and directory name, but no argument that
restricts reads to an allowlist or disables user-level Skill discovery. The
runtime gate must therefore inspect the first command and reject any outside
read exactly as the previous window did.

This preparation did not authorize task creation. Its proposed use of the
window 02 freeze is now withdrawn; only the corrected window 03 preparation
above is eligible for a new execution decision. No runtime occurred in 02.
