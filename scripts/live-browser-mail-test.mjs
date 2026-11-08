import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const token=(await readFile('.cloudflare-tunnel/invitation-key.txt','utf8')).trim();
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:390,height:844}});
page.on('response', async r=>{if(r.url().includes('/api/replies'))console.log('backup',r.status());if(r.url().includes('formsubmit.co/ajax/'))console.log('mail',r.status(),await r.text());});
try {
 await page.goto('https://rose.shushu.dpdns.org/?invite='+token);
 await page.getByRole('button',{name:'有空呀'}).click();
 await page.getByRole('radio').first().check();
 await page.getByRole('button',{name:'去挑好玩的'}).click();
 await page.getByRole('checkbox',{name:'散步聊天'}).check();
 await page.locator('textarea').fill('【浏览器部署测试】请忽略，这是验证网页直接发送邮件，不是她的答复。');
 await page.getByRole('button',{name:'生成周末计划'}).click();
 await page.getByText('回信已送出，期待周末见。').waitFor({timeout:40000});
 await page.screenshot({path:'artifacts/cloudflare-live-mail-success.png',fullPage:true});
 console.log('Live browser full flow: mail accepted.');
} finally {await browser.close();}
