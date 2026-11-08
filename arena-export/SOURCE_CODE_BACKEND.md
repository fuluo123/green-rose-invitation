# 源码摘录：原始路径保留

这是阅读辅助。完整项目、二进制资源、测试和其他脚本见同目录 ZIP；若内容不一致，以原始文件为准。

## `cloudflare/worker.mjs`

````text
import { validateReply, sendEmail, emailFields } from '../server/reply-core.mjs';

const receipt = (status, body) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
function validToken(value, expected) {
  if (typeof value !== 'string' || typeof expected !== 'string' || !expected || value.length !== expected.length) return false;
  let difference = 0;
  for (let i = 0; i < value.length; i++) difference |= value.charCodeAt(i) ^ expected.charCodeAt(i);
  return difference === 0;
}
async function readJson(request) {
  if (!request.body) throw new Error('invalid_reply');
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 8192) { await reader.cancel(); throw new Error('too_large'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder().decode(bytes));
}

async function musicAsset(request, assets) {
  const headers = new Headers(request.headers);
  headers.delete('range');
  headers.delete('if-range');
  const asset = await assets.fetch(new Request(request, { headers }));
  if (asset.status !== 200) return asset;
  const responseHeaders = new Headers(asset.headers);
  responseHeaders.set('Accept-Ranges', 'bytes');
  const range = request.headers.get('range');
  const ifRange = request.headers.get('if-range');
  const unchanged = !ifRange || ifRange === asset.headers.get('etag') || ifRange === asset.headers.get('last-modified');
  const match = range?.match(/^bytes=(\d*)-(\d*)$/);
  if (request.method !== 'GET' || !match || !unchanged) return new Response(asset.body, { headers: responseHeaders });
  // The static asset binding currently returns the whole MP3 for Range. The
  // original is under 4 MB; slice its bytes without transcoding the music.
  const bytes = new Uint8Array(await asset.arrayBuffer());
  const length = bytes.length;
  const start = match[1] ? Number(match[1]) : Math.max(0, length - Number(match[2]));
  const end = match[1] && match[2] ? Math.min(Number(match[2]), length - 1) : length - 1;
  if ((!match[1] && !Number(match[2])) || !Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= length || start > end) {
    return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${length}`, 'Accept-Ranges': 'bytes' } });
  }
  responseHeaders.set('Content-Range', `bytes ${start}-${end}/${length}`);
  responseHeaders.set('Content-Length', String(end - start + 1));
  return new Response(bytes.subarray(start, end + 1), { status: 206, headers: responseHeaders });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (/^\/assets\/rising-road-[\w-]+\.mp3$/.test(url.pathname) && (request.method === 'GET' || request.method === 'HEAD')) return musicAsset(request, env.ASSETS);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    if (url.pathname !== '/api/replies') return receipt(404, { code: 'not_found' });
    if (request.method !== 'POST') return receipt(405, { code: 'method_not_allowed' });
    if (!env.INVITE_TOKEN || !env.RECEIVER_EMAIL) return receipt(503, { code: 'mail_unconfigured' });
    if (!request.headers.get('content-type')?.startsWith('application/json')) return receipt(415, { code: 'invalid_type' });
    const origin = request.headers.get('origin');
    if (origin && origin !== url.origin) return receipt(403, { code: 'invalid_origin' });
    let body;
    try { body = await readJson(request); }
    catch (error) { return receipt(error.message === 'too_large' ? 413 : 400, { code: 'invalid_reply' }); }
    if (!validToken(body?.token, env.INVITE_TOKEN)) return receipt(403, { code: 'invalid_invitation' });
    let reply;
    try { reply = validateReply(body); }
    catch { return receipt(400, { code: 'invalid_reply' }); }
    // Only this worker can access the mailbox. No public read endpoint exists.
    const mailbox = env.REPLIES.get(env.REPLIES.idFromName('green-rose'));
    try {
      return await mailbox.fetch(new Request(`${url.origin}/receive`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(reply),
      }));
    } catch (error) {
      console.error('mailbox_unavailable', error.name, error.message);
      return receipt(503, { code: 'mailbox_unavailable' });
    }
  },
};

export class ReplyMailbox {
  constructor(state, env) {
    this.storage = state.storage;
    this.env = env;
    this.queue = Promise.resolve();
  }
  fetch(request) {
    // Serialize mail attempts across simultaneous browser retries.
    const result = this.queue.then(() => this.receive(request));
    this.queue = result.catch(() => {});
    return result.catch(error => {
      console.error('reply_storage_failed', error.name, error.message);
      return receipt(503, { code: 'storage_failed' });
    });
  }
  async receive(request) {
    const reply = validateReply(await request.json());
    const key = `reply:${reply.id}`;
    const fingerprint = JSON.stringify(reply);
    let saved = await this.storage.get(key);
    if (saved && saved.fingerprint !== fingerprint) return receipt(409, { code: 'conflicting_reply' });
    if (saved?.accepted) return receipt(202, { status: 'accepted', id: reply.id });
    const now = Date.now();
    const attempts = (await this.storage.get('attempts') || []).filter(time => now - time < 60000);
    if (attempts.length >= 5) return receipt(429, { code: 'try_later' });
    if (!saved) {
      const count = await this.storage.get('count') || 0;
      if (count >= 1000) return receipt(429, { code: 'try_later' });
      saved = { fingerprint, reply, receivedAt: new Date().toISOString(), accepted: false };
      await this.storage.transaction(async transaction => {
        await transaction.put(key, saved);
        await transaction.put('count', count + 1);
      });
    }
    await this.storage.put('attempts', [...attempts, now]);
    if (/^[a-f0-9]{32}$/.test(this.env.FORMSUBMIT_ID ?? '')) {
      // This receipt confirms the private backup only. The browser must obtain
      // a separate provider acceptance before showing that mail was sent.
      return receipt(200, { status: 'prepared', id: reply.id,
        mail: { endpoint: `https://formsubmit.co/ajax/${this.env.FORMSUBMIT_ID}`, fields: emailFields(reply) } });
    }
    try { await sendEmail(reply, this.env.RECEIVER_EMAIL, `${new URL(request.url).origin}/`); }
    catch (error) {
      console.warn('mail_service_failed', error.name, error.message);
      return receipt(503, { code: error.message === 'activation_required' ? 'activation_required' : 'mail_failed' });
    }
    await this.storage.put(key, { ...saved, accepted: true });
    return receipt(202, { status: 'accepted', id: reply.id });
  }
}

````

## `server/reply-core.mjs`

````text
const labels = ['一起吃饭', '喝咖啡', '看电影', '散步聊天', '逛公园', '看展', '去书店', '你来决定'];

export function validateReply(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('invalid_reply');
  const { id, answer, time, activities, note } = input;
  if (typeof id !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(id)) throw new Error('invalid_reply');
  if (!['available', 'unavailable'].includes(answer) || typeof time !== 'string' || time.length > 100 || typeof note !== 'string' || note.length > 200) throw new Error('invalid_reply');
  if (!Array.isArray(activities) || activities.length > 8 || new Set(activities).size !== activities.length || activities.some(item => !labels.includes(item))) throw new Error('invalid_reply');
  if (activities.includes('你来决定') && activities.length > 1) throw new Error('invalid_reply');
  if (answer === 'available' && (!time.trim() || (!activities.length && !note.trim()))) throw new Error('invalid_reply');
  if (answer === 'unavailable' && (time || activities.length || note)) throw new Error('invalid_reply');
  return { id, answer, time: time.trim(), activities: [...activities], note: note.trim() };
}

export function emailFields(reply) {
  return {
    _subject: '绿玫瑰 · 周末邀请有回信了', _template: 'table', _captcha: 'false',
    '她的回复': reply.answer === 'available' ? '有空呀' : '这周不方便',
    '见面时间': reply.time || '等待下次见面',
    '一起做的事': reply.activities.join('、') || (reply.answer === 'available' ? reply.note : '暂未选择'),
    '补充想法': reply.activities.length ? reply.note || '没有补充' : '没有补充',
    '提交时间': new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false }),
    '回信编号': reply.id,
  };
}

export async function sendEmail(reply, recipient, siteUrl, fetcher = fetch) {
  if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) throw new Error('mail_unconfigured');
  const fields = emailFields(reply);
  // Only the provider's exact success redirect counts as an accepted email.
  const next = new URL('/', siteUrl);
  next.searchParams.set('mailReceipt', reply.id);
  fields._next = next.href;
  const response = await fetcher(`https://formsubmit.co/${encodeURIComponent(recipient)}`, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Referer: siteUrl },
    body: new URLSearchParams(fields), redirect: 'manual', signal: AbortSignal.timeout(20000),
  });
  if ([302, 303].includes(response.status) && response.headers.get('location') === next.href) return;
  const message = (await response.text()).slice(0, 12000);
  if (/activate your|confirm.*email|verify.*email/i.test(message)) throw new Error('activation_required');
  throw new Error('mail_failed');
}


````

## `scripts/invitation-server.mjs`

````text
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

````
