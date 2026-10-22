# File Coverage And Ledger Format Composition

2026-10-15: **Offline Pass; combined runtime Not Evaluated.** The new isolated
candidate composes the existing file-coverage rules with the existing ledger
format correction. It addresses the output-format failure in
[Candidate 03b](large-diff-file-coverage-deep-runtime.md) without changing that
run's No-Go decision, the public parser or formal/installed v0.6.0.

## Diagnosis And Change

The file-coverage candidate had not incorporated the independently tested
[format-only correction](ledger-format-and-bounded-delivery-candidate.md).
Its mode templates still placed explanatory guidance inside the output fence's
Coverage section. This is a concrete instruction/template mismatch with the
strict grammar; it does not establish the model's internal cause of failure.

[The composition builder](../../evaluation/prototypes/build-file-coverage-ledger-skill.mjs)
uses `clarifyLedgerCore` and `clarifyLedgerReference` from the unchanged format
builder. It requires an independent parent manifest hash, verifies parent files
and recipe dependencies, and writes to a fresh destination. Existing outputs,
formal/source-tree destinations and aliases, missing/changed/extra parent files
and symlinked material are rejected. Neither parent builder nor historical
candidate is rewritten.

Only core `SKILL.md` and Quick/Deep references change relative to the original
file-coverage candidate. Coverage permits only ledger items and blank lines;
definitions, introductory explanations and evidence caveats belong in Evidence.
Existing template guidance is moved outside the fenced report, and the slot
requires one final Disposition. File-accounting fields remain in the existing
scope section. No new policy or report section is added.

All ten other candidate files retain their bytes, including Fix, the collector,
its helper, agent metadata and technology/risk references. The thirteen parent
files, twelve formal Skill files and four parent recipes still match their
hashes. The installed symlink still resolves to the formal Skill. This reuses
one established transformation (DRY), limits the change to its demonstrated
formatting purpose (KISS/YAGNI), and preserves the validation responsibilities.

## Local Evidence

The seven scoped suites pass **210/210 tests**, including fourteen new
composition tests. They cover byte preservation, deterministic construction,
parent/destination rejection, rendered Quick/Deep ledger slots, bilingual
missing-target accounting, strict prose rejection, preserved finding metadata
and unchanged Fix output boundaries. Both repository and official Skill shape
validators return `Skill is valid!` using the retained isolated Python/PyYAML
environment; no dependency is installed. `git diff --check` passes.

The first six-suite run passed 110/112. Two tests compared complete JavaScript
RegExp match objects, including their input/index metadata, instead of only the
matched file-summary text. Correcting that assertion yields 112/112 without
changing candidate bytes or parser behavior. The corrected command also named
an absent profile-suite filter; the real `review-output-profile.test.ts` was
then run separately and passed 98/98. Initial and final results are retained;
210 is the union of seven actual suites, not a full-repository regression run.

The unedited Candidate 03b report is retained with SHA-256
`342f305981506147397a411474475d725de75ac1e27ad215aabb00b817aa7a4a` (10,238 bytes).
An evaluator-side accounting map, based on the delivered packet and the report,
passes file-state reconciliation and compact file grammar: two changed paths,
one Reviewed profile and one Cannot Verify session. The unchanged v0.6.0
profile still rejects its line 56 prose and retains eight ledger entries and
zero findings. Moving only that note to Evidence in an in-memory diagnostic
makes both validators pass. No corrected runtime report is saved or accepted;
this identifies a structural cause, not a new model trial or semantic proof.

## Artifact And Limits

Local evidence is retained under `.local-evaluation/file-coverage-ledger-01/`:
the thirteen-file candidate, initial/corrected/profile test results, exact raw
report, saved-report diagnostic and completion receipt. Candidate manifest:

```text
205664708b8c0d0ed19c667312d242ace7e071f914f5df2e0ad7b854ea87e510
```

The parent manifest remains
`e110031cb99085bd250a8d6a0f369c8f66047442f123f5321b63d40f626d94af`.
Core grows by 325 UTF-8 bytes and each selected Quick/Deep reference by 231,
for 556 additional instruction bytes per Quick/Deep invocation over the prior
file-coverage candidate. Fix's unchanged mode still loads the shared core,
adding 325 bytes. These are byte measurements, not token or cost estimates.

This gate freezes a composed Skill bundle only, not a dispatchable evaluation
window. Next prepare a fresh Deep packet/read schedule with this exact bundle,
the unchanged public source/oracle and independent receipt checks. Preserve the
existing stop policy and elapsed ceiling; Candidate must pass before Stable.
That preparation does not itself authorize external execution. No new model
call, source transmission, installation, commit, push or release occurred.
Historical No-Go reports, formal v0.6.0, Claude Not Verified, `runtimeReady=false`
and deferred SSE remain unchanged. Separate format-only passes do not establish
combined model behavior, general accuracy, client isolation or cost acceptance.
