// Every push (and every deliberate non-push) lands in logs/pushes.jsonl.
import fs from 'node:fs';
import path from 'node:path';
import { PATHS } from './config.js';
import { ensureDir } from './util.js';

export function logPush(record) {
  const entry = { at: new Date().toISOString(), ...record };
  ensureDir(PATHS.logs);
  fs.appendFileSync(path.join(PATHS.logs, 'pushes.jsonl'), `${JSON.stringify(entry)}\n`, 'utf8');
  return entry;
}

export function line(...parts) {
  process.stdout.write(`[${new Date().toISOString()}] ${parts.join(' ')}\n`);
}

export function warn(...parts) {
  process.stderr.write(`[${new Date().toISOString()}] WARN ${parts.join(' ')}\n`);
}
