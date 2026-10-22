# Ledger Format And Bounded Delivery Candidate

2026-10-13: **Offline Pass; runtime Not Evaluated.** A format-only Skill
candidate and a bounded material packer address the two demonstrated concerns
in the [failed Quick replacement](large-diff-file-coverage-quick-replacement-runtime.md).
The formal/installed v0.6.0 Skill, public validator, original file-coverage
candidate and both failed runtime windows remain unchanged. No new model call,
installation, dependency change or Git delivery occurred.

## Isolated Changes

`evaluation/prototypes/build-ledger-format-skill.mjs` creates a fresh twelve-file
Skill copy. Only three files change:

- Core adds an explicit Quick/Deep rule: Coverage contains ledger items and
  blank lines only; definitions and static-evidence caveats belong in Evidence.
- Quick and Deep move their existing format guidance and examples outside the
  fenced output template, preserving the original explanation text.
- Both template slots use the existing parser's literal `Disposition` grammar
  and one final value. Repeated-ID merge keys retain the existing core rule.

The other nine files, including Fix, metadata, collector and framework
references, are byte-identical. No file-accounting feature is added. This keeps
the format hypothesis separate from the pending file-coverage feature. The
existing validator still rejects Coverage prose in both languages; it is not
changed to accommodate the historical output.

`evaluation/prototypes/bounded-review-materials.mjs` packages explicit text
inputs in ordered JSON batches, capped at 20,000 encoded UTF-8 bytes including
escaping and metadata. Each segment retains its original path, physical line
range and exact contents. The verifier checks batch identity, reconstructs each
file and compares its frozen byte count and SHA-256. It requires independently
trusted pins and the actual received outputs when used for a future runtime
assessment. The packer does not read credentials, launch a client or send data.

## Local Evidence

All **214 tests in six suites pass**, including 30 new candidate/transport tests
and the relevant public-profile, bilingual-example, file-coverage and historical
replacement preparation contracts. Tests cover unchanged rules, template slots,
strict prose rejection, original-file reconstruction, missing/extra/reordered
responses, truncation, equal-length tampering and invalid inputs. Both the
repository and official Skill shape validators return `Skill is valid!`.

The rehearsal uses the frozen FC-Q-001 packet's fifteen evidence files: core,
Quick and JavaScript instructions, packet metadata/context and ten source/support
files. Source bytes match the previous freeze. Expected answers and historical
reports are excluded from both payloads. Native `/bin/cat` replay reconstructs
every file exactly for both packages:

| Local measurement | Stable reference | Format candidate |
| --- | ---: | ---: |
| Evidence files | 15 | 15 |
| Original content bytes | 50,164 | 50,720 |
| Encoded batch bytes | 53,035 | 53,595 |
| JSON transport overhead bytes | 2,871 | 2,875 |
| Evidence batch reads | 3 | 3 |
| Largest encoded batch bytes | 19,767 | 19,950 |
| Reconstructed files matching pins | 15/15 | 15/15 |

The historical run used 23 evidence reads plus one material-manifest read, for
24 total. The new **evidence-only** schedule is three reads; a future manifest
read and startup must be counted separately. No new startup/dispatch contract
has been frozen. The historical startup requires the old range schedule and is
therefore kept as historical evidence, not reused as a new execution prompt.
`stable-reference` means an offline input reference, not an accepted runtime
baseline.

Both historical material freezes still verify, and all seventeen pinned runtime
artifacts across the two failed windows still match. The original file-coverage
candidate pins and all twelve formal Skill sources match. The installed symlink
still targets the formal v0.6.0 Skill. Historical No-Go reports are not edited.

## Retained Failures And Artifacts

The first targeted test run passed 28/30. Two English-example tests omitted the
independently required `/review` source root for Markdown links. Supplying it
fixed the test setup without changing the parser or examples. The initial and
final Vitest JSON results are both retained.

The first shape attempt used Homebrew Python without PyYAML and failed before
validation. Both validators then passed using the existing Python 3.11.15 /
PyYAML 6.0.3 environment at `~/.local/share/uv/tools/specify-cli/bin/python`.
No package was installed. The first rehearsal counted sixteen manifest entries
as evidence, including a startup-only entry, and stopped on its assertion.
Selecting all fifteen entries with declared read ranges corrected that local
classification; no source file was removed or changed.

Local evidence is retained in `.local-evaluation/ledger-format-01/`: the
candidate, both batch sets and manifests, preparation receipt, shape result,
classification failure and both test results. Candidate manifest SHA-256:
`61460297bc2bb429e046ae8bcfe0dc5b762a8171d80a4e5c3dcaa31a2c6e4298`.

## Limits And Next Gate

Byte-exact local reconstruction is not model-visible delivery, semantic
completeness or client isolation proof. JSON adds transport bytes and may affect
model interpretation; fewer planned reads do not establish token, elapsed-time
or total-cost savings. A 20,000-byte limit is not a client token-limit guarantee.
The unchanged parser accepting authored fixtures does not show that a model will
follow the clarified template. Quick/Deep behavior remains unverified for this
candidate; Fix remains unchanged.

Next freeze a fresh, bounded format-only Quick evaluation with matching delivery
for any compared arms, complete actual-output receipts, unchanged semantic and
read-only gates, and explicit stop conditions. Keep the failed windows closed.
Any later file-coverage integration must be identified and assessed separately.
The old 600,000 ms acceptance ceiling must not be relaxed to turn the prior
failure into a pass. Automatic cancellation has not been implemented or
verified; future execution must distinguish a supported cancellation mechanism
from a post-completion elapsed gate. External dispatch, candidate installation
and release are not authorized or performed by this offline preparation.
