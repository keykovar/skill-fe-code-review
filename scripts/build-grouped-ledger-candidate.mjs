#!/usr/bin/env node

export * from '../evaluation/baselines/pre-v0.6.0/scripts/build-grouped-ledger-candidate.mjs';
import { forwardModuleCli } from './forward-module-cli.mjs';

forwardModuleCli(import.meta.url, new URL('../evaluation/baselines/pre-v0.6.0/scripts/build-grouped-ledger-candidate.mjs', import.meta.url));
