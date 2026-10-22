# v0.6.0 Pre-Format Historical Baseline

This directory preserves 65 original files (472,427 bytes): the twelve v0.6.0
Skill files, twelve historical suites, their test helper, and the explicit
recipe, fixture, example and validator dependency closure. The manifest pins
their exact bytes. Do not edit these inputs or install this directory as a Skill.
This is separate from the older `pre-v0.6.0` baseline.

The root Vitest configuration runs these twelve suites in the
`v0.6.0-pre-format` project and excludes their original copies from `current`.
The archived suites remain unchanged, including the LF-D-002 test bytes used
as frozen recipe input. A setup file changes cwd only inside the forked worker
and restores it after the suite. Relative imports and source reads therefore
resolve to this baseline. No aliases, transform fallbacks or relaxed hashes
are used. The `current` project still checks the live Skill and output profile.

Run all checks with `pnpm test`, or select only historical suites with
`pnpm test --project v0.6.0-pre-format`. `pnpm test --project current` explicitly
selects current checks and is not a full regression run. Test-name filters work
for both projects. Keep the original top-level prototypes as historical source;
use the archived modules for reproducible v0.6.0 recipe calls after adoption.

`scripts/pre-format-baseline.mjs` verifies the fixed manifest digest, complete
file inventory and every content hash before test dispatch. It rejects drift
instead of regenerating the baseline. The original builder must still reproduce
candidate manifest `61460297bc2bb429e046ae8bcfe0dc5b762a8171d80a4e5c3dcaa31a2c6e4298`.

This closure contains only repository inputs. It excludes credentials, local
runtime sessions, installed dependencies and external client evidence. Synthetic
configuration strings in tests are not real credentials. Offline test passes
do not constitute model/runtime acceptance or reopen consumed dispatch windows.
This README and the manifest are preservation metadata, not original inputs.
