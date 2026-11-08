import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { ReplyMailbox } from '../cloudflare/worker.mjs';
const reply = { id: 'e1d5bf9a-0ef1-4056-86b0-dfa62f5d21a0', answer: 'available', time: '周六下午', activities: ['喝咖啡'], note: '慢慢聊' };
const token = 'private-invitation-key-for-tests';
test('云端音乐按字节范围返回原曲片段，支持尾部、越界和 If-Range', async () => {
  const bytes = Uint8Array.from({ length: 4096 }, (_, i) => i % 256);
  const env = { ASSETS: { fetch: async () => new Response(bytes, { headers: {
    'Content-Type': 'audio/mpeg', 'Content-Length': String(bytes.length), ETag: '"original"',
  } }) } };
  const get = (range, extra = {}) => worker.fetch(new Request('https://rose.example/assets/rising-road-hash.mp3', {
    headers: { ...(range ? { Range: range } : {}), ...extra },
  }), env);
  const first = await get('bytes=0-1023');
  assert.equal(first.status, 206);
  assert.equal(first.headers.get('content-range'), 'bytes 0-1023/4096');
  assert.equal(first.headers.get('content-length'), '1024');
  assert.deepEqual(new Uint8Array(await first.arrayBuffer()), bytes.slice(0, 1024));
  const tail = await get('bytes=-16');
  assert.equal(tail.headers.get('content-range'), 'bytes 4080-4095/4096');
  assert.deepEqual(new Uint8Array(await tail.arrayBuffer()), bytes.slice(-16));
  assert.equal((await get('bytes=4096-')).status, 416);
  assert.equal((await get('bytes=99-2')).status, 416);
  const full = await get('bytes=0-15', { 'If-Range': '"older"' });
  assert.equal(full.status, 200);
  assert.deepEqual(new Uint8Array(await full.arrayBuffer()), bytes);
});
test('浏览器邮件模式先私密备份，准备回执不会假报已发送或暴露邮箱', async t => {
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('must not send from worker'); });
  const state = { storage: storage() };
  const mailbox = new ReplyMailbox(state, { RECEIVER_EMAIL: 'receiver@example.com', FORMSUBMIT_ID: 'a'.repeat(32) });
  const response = await mailbox.fetch(makeRequest(reply));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.status, 'prepared');
  assert.equal(body.mail.fields['回信编号'], reply.id);
  assert.equal(JSON.stringify(body).includes('receiver@example.com'), false);
  assert.equal((await state.storage.get(`reply:${reply.id}`)).accepted, false);
});
const makeRequest = body => new Request('https://rose.example/api/replies', { method:'POST', headers: { 'Content-Type':'application/json', Origin:'https://rose.example' }, body:JSON.stringify(body) });
function storage() {
  const values = new Map();
  return { async get(key) { return structuredClone(values.get(key)); }, async put(key, value) { values.set(key, structuredClone(value)); }, async transaction(callback) { return callback(this); }, values };
}
test('云端接口拒绝无密钥、跨站及非法数据，不暴露回信或邮箱', async () => {
  const env = { INVITE_TOKEN:token, RECEIVER_EMAIL:'receiver@example.com', ASSETS:{ fetch: async () => new Response('asset') }, REPLIES: { get() { throw new Error('must not forward'); } } };
  assert.equal((await worker.fetch(makeRequest(reply),env)).status,403);
  const wrongOrigin = makeRequest({ ...reply, token }); wrongOrigin.headers.set('Origin','https://evil.example');
  assert.equal((await worker.fetch(wrongOrigin,env)).status,403);
  assert.equal((await worker.fetch(makeRequest({ ...reply, token, note:'x'.repeat(201) }),env)).status,400);
  assert.equal((await worker.fetch(makeRequest({ ...reply, token, note:'x'.repeat(9000) }),env)).status,413);
  assert.equal((await worker.fetch(new Request('https://rose.example/api/replies'),env)).status,405);
  assert.equal((await worker.fetch(new Request('https://rose.example/api/private'),env)).status,404);
  assert.equal(await (await worker.fetch(new Request('https://rose.example/'),env)).text(),'asset');
});
test('云端并发请求只发送一次，休眠后仍识别已提交回信', async t => {
  let sent = 0;
  t.mock.method(globalThis,'fetch',async (url, request) => { sent++; return new Response(null,{status:302,headers:{Location:request.body.get('_next')}}); });
  const state = { storage:storage() };
  const env = { RECEIVER_EMAIL:'receiver@example.com' };
  let mailbox = new ReplyMailbox(state,env);
  const results = await Promise.all([mailbox.fetch(makeRequest(reply)),mailbox.fetch(makeRequest(reply))]);
  assert.deepEqual(results.map(value=>value.status),[202,202]); assert.equal(sent,1);
  mailbox = new ReplyMailbox(state,env);
  assert.equal((await mailbox.fetch(makeRequest(reply))).status,202); assert.equal(sent,1);
  assert.equal((await mailbox.fetch(makeRequest({...reply,note:'different'}))).status,409);
  const saved = await state.storage.get(`reply:${reply.id}`);
  assert.deepEqual(saved.reply,reply); assert.equal(saved.accepted,true);
  assert.equal(JSON.stringify(saved).includes(token),false);
});
test('邮件失败保留私密回信，可重试，并持续限制发送频率', async t => {
  let fail = true;
  t.mock.method(globalThis,'fetch',async (url, request) => fail ? new Response('mail failed',{status:503}) : new Response(null,{status:302,headers:{Location:request.body.get('_next')}}));
  const state = { storage:storage() };
  const mailbox = new ReplyMailbox(state,{ RECEIVER_EMAIL:'receiver@example.com' });
  assert.equal((await mailbox.fetch(makeRequest(reply))).status,503);
  assert.equal((await state.storage.get(`reply:${reply.id}`)).accepted,false);
  fail = false;
  assert.equal((await mailbox.fetch(makeRequest(reply))).status,202);
  assert.equal(await state.storage.get('count'),1);
  fail = true;
  const another = {...reply,id:'e1d5bf9a-0ef1-4056-86b0-dfa62f5d21a1'};
  for(let i=0;i<3;i++) assert.equal((await mailbox.fetch(makeRequest(another))).status,503);
  assert.equal((await mailbox.fetch(makeRequest(another))).status,429);
  assert.equal(await state.storage.get('count'),2);
});
