#!/usr/bin/env node

export * from './validate-review-output.mjs';
import { forwardModuleCli } from './forward-module-cli.mjs';

forwardModuleCli(import.meta.url, new URL('./validate-review-output.mjs', import.meta.url));
