# Historical Maintainer Baseline

This directory contains the exact declared input and static-import closure of the pre-v0.6.0 grouped and integration-11/12 builders, plus the fixed v0.5.0 preparer and O-09 request-test inputs. Its manifest pins 157 original files. It is not a distributable Skill or a new behavior result; do not install it or edit its pinned files.

The three public builder entry points re-export these original APIs and forward direct CLI calls here. Relative source reads and hash assertions therefore resolve against the original baseline, not the current Skill. Existing expected output hashes are unchanged. Historical reports, failures and oracle decisions are never rewritten.

The v0.5.0 preparation tests import their original module here explicitly. O-09 tests copy this pinned tree to a disposable fixture root and replace only the extension with the exact earlier request's bytes from `evaluation/tooling-fixtures/o09-frozen-origin-extension.md`. They then use the original assembler, serializer and review runner from that root. No hash or document verification is mocked. Do not generate new requests from the promoted Skill and replace a frozen request hash to make those tests pass. Old top-level entries keep rejecting mismatched inputs; this archive grants no permission to execute a provider request or reopen a consumed window.

The input closure deliberately excludes credentials, local execution windows, dependency environments and unrelated repository files. The original builder source and its pinned tests are historical data; current tests live at the repository root and separately verify the promoted Skill and the retained baseline.

This README and the manifest are preservation metadata, not part of the original pinned input set.
