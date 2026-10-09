# Review Context

Perform a read-only Quick Review in Simplified Chinese of the supplied profile formatting relocation. These are public synthetic source snapshots, not a real project or a transcript of an earlier model run.

## Scope And Baselines

- Change under review: `before/profile.mjs` -> `current/profile.mjs` and `current/format.mjs`.
- `before/profile.mjs` is the original comparison baseline for this change. The current snapshot supplies its complete local import dependency.
- No execution records are supplied. Inspect the source only; do not execute it or infer that fixture preparation tests were run by the reviewer.
- No Git checkout is supplied. Staged, unstaged and untracked status are not applicable. Do not inspect the parent repository or run a Git inventory/context collector.

Inspect only these files and the separately supplied review instructions. Do not write files, browse, access a real endpoint or inspect neighboring packets. Return the review in chat only.

## Contract

The intended change moves profile label formatting to `format.mjs` while preserving the existing public exports from `profile.mjs`. `profileLabel(value)` accepts a string, removes boundary whitespace and returns `Anonymous` when the remaining string is empty. `profileTitle(profile)` receives an object whose `name` is a string and uses that same label rule. No other input types are supported by this contract.

The profile entry module and its shown direct caller must continue using a single formatting owner. Inspect the relocation, public exports, dependency and caller behavior within these snapshots. No browser, server, real account or production-frequency measurement is needed for this scope.
