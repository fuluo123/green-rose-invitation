import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.loadEnvFile(path.join(root, '.env'));
const recipient = process.env.RECEIVER_EMAIL;
if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) throw new Error('Configure RECEIVER_EMAIL in the private .env file first.');
const log = await readFile(path.join(root, '.cloudflare-tunnel', 'quick.log'), 'utf8');
const siteUrl = log.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/)?.[0];
if (!siteUrl) throw new Error('Start the public tunnel first.');
const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(recipient)}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json', Referer: `${siteUrl}/` },
  body: JSON.stringify({ _subject: '绿玫瑰 · 邮件接收通道测试', _template: 'table', _captcha: 'false',
    '说明': '这是你要求启用的绿玫瑰网页邮件通道测试，不是她的答题结果。首次使用请点击 FormSubmit 的 Activate Form 确认邮件。',
    '测试项目': '周末时间、活动和备注的邮件接收',
  }), signal: AbortSignal.timeout(25000),
});
let receipt;
try { receipt = await response.json(); } catch { throw new Error(`Mail service returned non-JSON HTTP ${response.status}`); }
console.log(JSON.stringify({ httpStatus: response.status, accepted: [true, 'true'].includes(receipt.success), message: String(receipt.message ?? '').slice(0, 200) }));
if (!response.ok || ![true, 'true'].includes(receipt.success)) process.exitCode = 1;
