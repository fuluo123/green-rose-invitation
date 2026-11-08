import { readFile } from 'node:fs/promises';
const configuration = await readFile(new URL('../.cloudflare-tunnel/config/.wrangler/config/default.toml',import.meta.url),'utf8');
const bearer = configuration.match(/oauth_token\s*=\s*"([^"]+)"/)?.[1];
if(!bearer) throw new Error('Official Wrangler login required.');
const now=Date.now();
const response=await fetch('https://api.cloudflare.com/client/v4/accounts/afbfd4dfd2cefd8b385dbd0f4060fb40/workers/observability/telemetry/query',{
  method:'POST',headers:{Authorization:`Bearer ${bearer}`,'Content-Type':'application/json'},
  body:JSON.stringify({queryId:'rose-errors',timeframe:{from:now-3600000,to:now},view:'events',limit:10,
    parameters:{datasets:['green-rose-invitation'],filters:[],filterCombination:'and'}}),signal:AbortSignal.timeout(20000),
});
const result=await response.json();
console.log(JSON.stringify({status:response.status,result}));
