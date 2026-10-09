import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const [scenario, captureFile, ...args] = process.argv.slice(2);
const prompt = fs.readFileSync(0);
const finalFile = args[args.indexOf('--output-last-message') + 1];
const capture = { args, promptBase64: prompt.toString('base64'), env: process.env, cwd: process.cwd() };
if (scenario === 'canary-child') {
  const child = spawnSync(process.execPath, ['-e', 'process.stdout.write(JSON.stringify(process.env))'], {
    env: process.env, shell: false, encoding: 'utf8',
  });
  capture.childEnvironment = JSON.parse(child.stdout);
}
fs.writeFileSync(captureFile, JSON.stringify(capture), { flag: 'wx' });

if (scenario === 'timeout') {
  setInterval(() => {}, 1000);
} else {
  const events = [
    { type: 'thread.started', thread_id: 'offline-fake-thread' },
    { type: 'turn.started' },
  ];
  if (scenario === 'write') fs.writeFileSync('unauthorized.txt', 'offline mutation');
  if (scenario === 'git-write') fs.writeFileSync('.git/HEAD', 'offline mutation');
  if (scenario === 'empty-directory-write') fs.mkdirSync('unauthorized-empty');
  if (scenario === 'stderr') process.stderr.write('WARNING: isolation fallback\n');
  if (scenario === 'tool-call') events.push({ type: 'item.completed', item: {
    id: 'tool-1', type: 'command_execution', command: 'pwd', exit_code: 0,
  } });
  if (scenario === 'unknown-event') events.push({ type: 'unrecognized.capability', enabled: true });
  const message = { type: 'item.completed', item: {
    id: 'message-1', type: 'agent_message', text: 'CLIENT_ISOLATION_OK',
  } };
  events.push(message);
  if (scenario === 'duplicate-final') events.push({ ...message, item: { ...message.item, id: 'message-2' } });
  if (scenario !== 'incomplete') events.push(scenario === 'failed-turn'
    ? { type: 'turn.failed', error: { message: 'offline failure' } }
    : { type: 'turn.completed', usage: { input_tokens: 1, cached_input_tokens: 0, output_tokens: 1 } });
  if (scenario === 'final-directory') fs.mkdirSync(finalFile);
  else if (scenario === 'final-symlink') fs.symlinkSync(captureFile, finalFile);
  else if (scenario !== 'missing-final') fs.writeFileSync(finalFile,
    scenario === 'mismatch' ? 'Different response\n' : 'CLIENT_ISOLATION_OK\n', { flag: 'wx' });
  process.stdout.write(scenario === 'malformed' ? '{invalid-json}\n'
    : scenario === 'output-limit' ? 'x'.repeat(2 * 1024 * 1024)
      : `${events.map((event) => JSON.stringify(event)).join('\n')}\n`);
  if (scenario === 'nonzero') process.exitCode = 9;
}
