import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// Compatibility entries forward CLI execution while API imports stay side-effect free.
export function forwardModuleCli(callerUrl, targetUrl) {
  const entry = process.argv[1];
  if (!entry) return;
  let main = callerUrl === pathToFileURL(path.resolve(entry)).href;
  if (!main) {
    try { main = callerUrl === pathToFileURL(fs.realpathSync(entry)).href; }
    catch { return; }
  }
  if (!main) return;
  const result = spawnSync(process.execPath, [fileURLToPath(targetUrl), ...process.argv.slice(2)], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.signal) process.kill(process.pid, result.signal);
  else process.exitCode = result.status ?? 1;
}
