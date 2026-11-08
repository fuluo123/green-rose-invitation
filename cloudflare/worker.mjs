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
