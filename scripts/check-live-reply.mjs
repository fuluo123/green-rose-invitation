import { readFile } from 'node:fs/promises';
const token = (await readFile(new URL('../.cloudflare-tunnel/invitation-key.txt', import.meta.url), 'utf8')).trim();
const response = await fetch('https://rose.shushu.dpdns.org/api/replies', {
  method:'POST', headers:{'Content-Type':'application/json', Origin:'https://rose.shushu.dpdns.org'},
  body:JSON.stringify({token,id:'07d7f921-7dde-44c4-9df8-4ac581511591',answer:'available',time:'【部署测试】请忽略这个时间',activities:['喝咖啡'],note:'【部署测试】这是 Codex 验证 Cloudflare 云端邮件通道的测试，不是她本人填写的答复。'}),
  signal:AbortSignal.timeout(30000),
});
console.log(response.status, await response.text());
