import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { createInvitationServer, sendEmail, validateReply } from '../scripts/invitation-server.mjs';

const plan = () => ({ id: randomUUID(), answer: 'available', time: '2026年10月17日 周六 下午', activities: ['喝咖啡', '散步聊天'], note: '想去河边' });
async function fixture(t, send = async () => {}) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'green-rose-replies-'));
  const root = path.join(directory, 'dist');
  const receivedDir = path.join(directory, 'private');
  await mkdir(root);
  await writeFile(path.join(root, 'index.html'), '<h1>green rose</h1>');
  await writeFile(path.join(directory, '.env'), 'private email setting');
  await writeFile(path.join(root, 'track.mp3'), '0123456789');
  const { server, token } = createInvitationServer({ root, receivedDir, send });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    await rm(directory, { recursive: true, force: true });
  });
  const post = (body, headers = {}) => fetch(`${base}/api/replies`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify({ token, ...body }) });
  return { post, base, token, receivedDir };
}

test('只接受完整的有效答卷，校验备注、活动互斥与拒绝内容', () => {
  assert.equal(validateReply(plan()).answer, 'available');
  for (const invalid of [{ ...plan(), activities: ['随意注入'] }, { ...plan(), activities: ['你来决定', '喝咖啡'] }, { ...plan(), note: 'a'.repeat(201) }, { ...plan(), time: '' }, { ...plan(), activities: [], note: '' }, { ...plan(), answer: 'unavailable' }]) assert.throws(() => validateReply(invalid));
  assert.equal(validateReply({ ...plan(), answer: 'unavailable', time: '', activities: [], note: '' }).answer, 'unavailable');
});
test('有效提交真实写入电脑私有文件，重复和并发请求只触发一次邮件', async t => {
  let sent = 0;
  const { post, receivedDir } = await fixture(t, async () => { sent++; await new Promise(resolve => setTimeout(resolve, 30)); });
  const reply = plan();
  const responses = await Promise.all([post(reply), post(reply), post(reply)]);
  assert.deepEqual(responses.map(response => response.status), [202, 202, 202]);
  assert.equal(sent, 1);
  assert.equal((await post(reply)).status, 202);
  assert.equal(sent, 1);
  const lines = (await readFile(path.join(receivedDir, 'replies.jsonl'), 'utf8')).trim().split('\n');
  assert.equal(lines.length, 1);
  assert.equal(JSON.parse(lines[0]).note, reply.note);
  assert.equal((await post({ ...reply, note: '修改后' })).status, 409);
});
test('邮件失败不会假报成功，重试复用编号和电脑备份', async t => {
  let calls = 0;
  const { post, receivedDir } = await fixture(t, async () => { if (++calls === 1) throw new Error('activation_required'); });
  const reply = plan();
  const failed = await post(reply);
  assert.equal(failed.status, 503);
  assert.equal((await failed.json()).code, 'activation_required');
  assert.equal((await post(reply)).status, 202);
  assert.equal(calls, 2);
  assert.equal((await readFile(path.join(receivedDir, 'replies.jsonl'), 'utf8')).trim().split('\n').length, 1);
});
test('无邀请密钥、跨站来源、超大答卷和私有文件访问被拒绝', async t => {
  let sent = 0;
  const { post, base } = await fixture(t, async () => { sent++; });
  assert.equal((await post({ ...plan(), token: 'wrong' })).status, 403);
  assert.equal((await post(plan(), { Origin: 'https://other.example' })).status, 403);
  assert.equal((await post({ ...plan(), note: 'a'.repeat(9000) })).status, 413);
  for (const pathname of ['/.env', '/.received/replies.jsonl', '/scripts/invitation-server.mjs', '/%2e%2e%5c.env']) assert.equal((await fetch(base + pathname)).status, 404);
  assert.equal((await fetch(base + '/api/replies')).status, 405);
  assert.equal(sent, 0);
});
test('失败重试也受邮件频率限制；音频支持部分加载', async t => {
  const { post, base } = await fixture(t, async () => { throw new Error('mail_failed'); });
  const reply = plan();
  for (let i = 0; i < 5; i++) assert.equal((await post(reply)).status, 503);
  assert.equal((await post(reply)).status, 429);
  const audio = await fetch(base + '/track.mp3', { headers: { Range: 'bytes=2-5' } });
  assert.equal(audio.status, 206); assert.equal(await audio.text(), '2345');
  assert.equal(audio.headers.get('content-type'), 'audio/mpeg');
});
test('邮件服务只发送指定接收地址、答题字段和编号，验证上游回执', async () => {
  const reply = plan();
  const transport = async (url, request) => {
    assert.equal(url, 'https://formsubmit.co/owner%40example.com');
    const payload = Object.fromEntries(request.body);
    assert.equal(request.redirect, 'manual');
    assert.equal(payload['见面时间'], reply.time);
    assert.equal(payload['一起做的事'], '喝咖啡、散步聊天');
    assert.equal(payload['补充想法'], '想去河边');
    assert.equal(payload['回信编号'], reply.id);
    assert.equal(payload.token, undefined);
    return new Response(null, { status: 302, headers: { Location: payload._next } });
  };
  await sendEmail(reply, 'owner@example.com', 'https://demo.trycloudflare.com/', transport);
  await assert.rejects(sendEmail(reply, 'owner@example.com', 'https://demo.trycloudflare.com/', async () => new Response('Please activate your email')), /activation_required/);
  await assert.rejects(sendEmail(reply, '', 'https://demo.trycloudflare.com/', transport), /mail_unconfigured/);
});

test('错误跳转和普通成功页面不能误报邮件已接受', async () => {
  for (const response of [new Response('Thank you'), new Response(null, {status:302,headers:{Location:'https://other.example/'}}), new Response('Rate limit exceeded', {status:429})]) {
    await assert.rejects(sendEmail(plan(), 'owner@example.com', 'https://rose.example/', async () => response), /mail_failed/);
  }
});
