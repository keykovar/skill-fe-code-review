#!/usr/bin/env node

export * from '../evaluation/baselines/pre-v0.6.0/scripts/build-origin-occurrence-finalization.mjs';
import { forwardModuleCli } from './forward-module-cli.mjs';

forwardModuleCli(import.meta.url, new URL('../evaluation/baselines/pre-v0.6.0/scripts/build-origin-occurrence-finalization.mjs', import.meta.url));
