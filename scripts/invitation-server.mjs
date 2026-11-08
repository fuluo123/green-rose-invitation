import { validateReply, sendEmail } from "../server/reply-core.mjs";
import http from 'node:http';
import { createReadStream } from 'node:fs';
import { appendFile, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.txt': 'text/plain; charset=utf-8' };

export { validateReply, sendEmail };

function json(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  response.end(JSON.stringify(body));
}
function authorized(value, token) {
  if (typeof value !== 'string') return false;
  const supplied = Buffer.from(value);
  const expected = Buffer.from(token);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
function readBody(request) {
  return new Promise((resolve, reject) => {
    const parts = [];
    let size = 0;
    request.on('data', chunk => {
      size += chunk.length;
      if (size <= 8192) parts.push(chunk);
      if (size > 65536) request.destroy();
    });
    request.on('end', () => size > 8192 ? reject(new Error('too_large')) : resolve(Buffer.concat(parts).toString('utf8')));
    request.on('error', reject);
  });
}

export function createInvitationServer({ root = path.join(projectRoot, 'dist'), recipient = process.env.RECEIVER_EMAIL, token = randomBytes(24).toString('base64url'), receivedDir = path.join(projectRoot, '.received'), send = sendEmail } = {}) {
  root = path.resolve(root);
  const receipts = new Map();
  const attempts = [];
  const server = http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, 'http://localhost');
      if (url.pathname === '/api/replies') {
        if (request.method !== 'POST') { json(response, 405, { code: 'method_not_allowed' }); return; }
        if (!/^application\/json(?:;|$)/i.test(request.headers['content-type'] ?? '')) { json(response, 415, { code: 'invalid_content_type' }); return; }
        if (Number(request.headers['content-length']) > 8192) { json(response, 413, { code: 'too_large' }); request.resume(); return; }
        let input;
        try { input = JSON.parse(await readBody(request)); }
        catch (error) { json(response, error.message === 'too_large' ? 413 : 400, { code: 'invalid_reply' }); return; }
        if (!authorized(input?.token, token)) { json(response, 403, { code: 'invalid_invitation' }); return; }
        if (request.headers.origin) {
          let sameOrigin = false;
          try { sameOrigin = new URL(request.headers.origin).host === request.headers.host; } catch {}
          if (!sameOrigin) { json(response, 403, { code: 'invalid_origin' }); return; }
        }
        let reply;
        try { reply = validateReply(input); } catch { json(response, 400, { code: 'invalid_reply' }); return; }
        const fingerprint = JSON.stringify(reply);
        const previous = receipts.get(reply.id);
        if (previous && previous.fingerprint !== fingerprint) { json(response, 409, { code: 'conflicting_reply' }); return; }
        const now = Date.now();
        while (attempts.length && now - attempts[0] > 60000) attempts.shift();
        let entry = previous;
        if (!entry) {
          if (receipts.size >= 1000) { json(response, 429, { code: 'try_later' }); return; }
          entry = { fingerprint, accepted: false, promise: null, backup: null };
          receipts.set(reply.id, entry);
          entry.backup = (async () => {
            await mkdir(receivedDir, { recursive: true });
            await appendFile(path.join(receivedDir, 'replies.jsonl'), `${JSON.stringify({ receivedAt: new Date().toISOString(), ...reply })}\n`, { mode: 0o600 });
          })();
        }
        try { await entry.backup; } catch { receipts.delete(reply.id); json(response, 503, { code: 'storage_failed' }); return; }
        if (!entry.accepted) {
          if (!entry.promise) {
            if (attempts.length >= 5) { json(response, 429, { code: 'try_later' }); return; }
            attempts.push(now);
            const host = request.headers.host ?? 'localhost';
            const siteUrl = `${host.endsWith('.trycloudflare.com') ? 'https' : 'http'}://${host}/`;
            entry.promise = Promise.resolve().then(() => send(reply, recipient, siteUrl)).then(() => { entry.accepted = true; }).finally(() => { entry.promise = null; });
          }
          try { await entry.promise; }
          catch (error) { json(response, 503, { code: ['activation_required', 'mail_unconfigured'].includes(error.message) ? error.message : 'mail_failed' }); return; }
        }
        json(response, 202, { status: 'accepted', id: reply.id }); return;
      }
      if (!['GET', 'HEAD'].includes(request.method)) { json(response, 405, { code: 'method_not_allowed' }); return; }
      const decoded = decodeURIComponent(url.pathname);
      if (decoded.includes('\\') || decoded.split('/').some(segment => segment.startsWith('.'))) { json(response, 404, { code: 'not_found' }); return; }
      const file = path.resolve(root, `.${decoded === '/' ? '/index.html' : decoded}`);
      if (!file.startsWith(root + path.sep)) { json(response, 404, { code: 'not_found' }); return; }
      let info;
      try { info = await stat(file); } catch { json(response, 404, { code: 'not_found' }); return; }
      if (!info.isFile()) { json(response, 404, { code: 'not_found' }); return; }
      const headers = { 'Content-Type': types[path.extname(file)] ?? 'application/octet-stream', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin', 'Accept-Ranges': 'bytes', 'Cache-Control': file.endsWith('.html') ? 'no-cache' : 'public, max-age=3600' };
      let start = 0;
      let end = info.size - 1;
      let status = 200;
      if (request.headers.range) {
        const range = /^bytes=(\d+)-(\d*)$/.exec(request.headers.range);
        if (!range || Number(range[1]) >= info.size || (range[2] && Number(range[2]) < Number(range[1]))) {
          response.writeHead(416, { 'Content-Range': `bytes */${info.size}` }); response.end(); return;
        }
        start = Number(range[1]); end = range[2] ? Math.min(Number(range[2]), end) : end;
        status = 206; headers['Content-Range'] = `bytes ${start}-${end}/${info.size}`;
      }
      response.writeHead(status, { ...headers, 'Content-Length': end - start + 1 });
      if (request.method === 'HEAD') response.end();
      else createReadStream(file, { start, end }).on('error', () => response.destroy()).pipe(response);
    } catch { if (!response.headersSent) json(response, 500, { code: 'server_error' }); else response.destroy(); }
  });
  server.requestTimeout = 30000;
  return { server, token };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { process.loadEnvFile(path.join(projectRoot, '.env')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const port = Number(process.env.INVITATION_PORT || 4174);
  const { server, token } = createInvitationServer({ token: process.env.INVITE_TOKEN });
  await mkdir(path.join(projectRoot, '.cloudflare-tunnel'), { recursive: true });
  await import('node:fs/promises').then(fs => fs.writeFile(path.join(projectRoot, '.cloudflare-tunnel', 'invitation-key.txt'), token, { mode: 0o600 }));
  server.listen(port, '127.0.0.1', () => console.log(`Invitation server ready at http://127.0.0.1:${port}/ (production files only)`));
}
