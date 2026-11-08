import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.loadEnvFile(path.join(root, '.env'));
const token = (await readFile(path.join(root, '.cloudflare-tunnel/invitation-key.txt'), 'utf8')).trim();
if (!process.env.RECEIVER_EMAIL || token.length < 24) throw new Error('Configure the receiver and invitation key first.');
const child = spawn(process.execPath, [path.join(root, 'scripts/cloudflare.mjs'), 'secret', 'bulk'], {
  cwd: root, windowsHide: true, stdio: ['pipe', 'inherit', 'inherit'],
});
child.stdin.end(JSON.stringify({ RECEIVER_EMAIL: process.env.RECEIVER_EMAIL, INVITE_TOKEN: token }));
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
