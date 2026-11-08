import {chromium,webkit,expect} from '@playwright/test';
import {createInvitationServer} from './invitation-server.mjs';
const {server,token}=createInvitationServer({send:async()=>{}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
try {for(const engine of [chromium,webkit]){
 const browser=await engine.launch();
 try {const page=await browser.newPage();let calls=0;
 await page.addInitScript(()=>{Object.defineProperty(AbortSignal,'timeout',{value:undefined,configurable:true});});
 await page.route('**/api/replies',async route=>{const data=route.request().postDataJSON();await route.fulfill({json:{status:'prepared',id:data.id,mail:{endpoint:'https://formsubmit.co/ajax/'+'a'.repeat(32),fields:{note:data.note}}}});});
 await page.route('https://formsubmit.co/ajax/**',async route=>{calls++;await route.fulfill({json:{success:calls>1?'true':'false',message:'temporary failure'}});});
 await page.goto(`http://127.0.0.1:${server.address().port}/?invite=${token}`);
 await page.getByRole('button',{name:'有空呀'}).click();await page.getByRole('radio').first().check();await page.getByRole('button',{name:'去挑好玩的'}).click();await page.getByRole('checkbox',{name:'喝咖啡'}).check();await page.getByRole('button',{name:'生成周末计划'}).click();
 await expect(page.locator('.reply-status')).toContainText('这次没送出去');await page.getByRole('button',{name:'再试一次'}).click();await expect(page.locator('.reply-status')).toContainText('回信已送出');
 console.log(engine.name(),'legacy AbortSignal + provider failure/retry passed');
 }finally{await browser.close();}
}}finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
