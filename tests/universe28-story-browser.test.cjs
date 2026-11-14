'use strict';
/* Chromium real-world smoke for 28: desktop, phone 390 and compact 320.
 * Reader must not load the 27-decade canvas until reaching the lab. */
const assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),shots=path.join(root,'_universe28_story');
fs.mkdirSync(shots,{recursive:true});
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json'};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://127.0.0.1'),file=path.resolve(root,'.'+decodeURIComponent(u.pathname.replace(/\/$/,'/index.html')));
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
 fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return}
 res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);
 });
});
async function main(){
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const base='http://127.0.0.1:'+server.address().port;
  for(const [name,w,h] of [['desktop',1440,900],['phone',390,844],['small-phone',320,680]]){
   const page=await browser.newPage({viewport:{width:w,height:h},deviceScaleFactor:1,isMobile:name!=='desktop',hasTouch:name!=='desktop'});
   const errors=[],labRequests=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('request',r=>{if(r.url().includes('/laboratoria/granice-wszechswiata/'))labRequests.push(r.url())});
   const resp=await page.goto(base+'/etapy/28/',{waitUntil:'domcontentloaded'});
   assert.equal(resp.status(),200);
   await page.locator('#u28StoryTitle').waitFor({state:'visible'});
   await page.locator('.u28-cover-art').evaluate(img=>img.decode());
   await page.waitForTimeout(220);
   assert.equal(await page.locator('#stageFrame').getAttribute('src'),null,'Reader caused eager simulation startup');
   assert.equal(labRequests.length,0,'Unnecessary laboratory request before reading');
   const box=await page.locator('.u28-cover').boundingBox();
   assert.ok(box?.height>550,'Hero collapsed');
   await page.locator('.u28-cover').screenshot({path:path.join(shots,'cover-'+name+'.png')});
   await page.locator('#przystanki').scrollIntoViewIfNeeded();
   await page.waitForTimeout(180);
   assert.equal(await page.locator('#stageFrame').getAttribute('src'),null,'Reading article started canvas too early');
   const dims=await page.evaluate(()=>({w:innerWidth,overflow:document.documentElement.scrollWidth-innerWidth,height:document.documentElement.scrollHeight,viewport:innerHeight}));
   assert.ok(dims.overflow<=4,'Horizontal overflow '+JSON.stringify(dims));
   assert.ok(dims.height>dims.viewport*3,'Article lacks scroll');
   await page.locator('#stageLaunch').click();
   await page.waitForFunction(()=>Boolean(document.querySelector('#stageFrame')?.getAttribute('src')));
   const frame=page.frameLocator('#stageFrame');
   await frame.locator('#u28Canvas').waitFor({state:'visible',timeout:30000});
   await page.waitForFunction(()=>document.querySelector('#stageFrame')?.contentDocument?.getElementById('u28Canvas')?.width>0);
   assert.match(await frame.locator('#u28TargetName').textContent(),/Powierzchnia Ziemi/);
   await frame.locator('.u28-chip[data-idx="8"]').click();
   assert.match(await frame.locator('#u28TargetName').textContent(),/Proxima/);
   await frame.locator('.u28-chip[data-idx="14"]').click();
   assert.match(await frame.locator('#u28TargetName').textContent(),/Promień obserwowalnego Wszechświata/);
   await frame.locator('#u28Play').click();
   assert.match(await frame.locator('#u28Play').textContent(),/Zatrzymaj|Autopilot/);
   await frame.locator('#u28Play').click();
   const graph=await frame.locator('body').evaluate(el=>({scrollHeight:el.scrollHeight,clientHeight:el.clientHeight,documentHeight:document.documentElement.scrollHeight,documentClient:document.documentElement.clientHeight}));
   assert.ok(Math.max(graph.scrollHeight-graph.clientHeight,graph.documentHeight-graph.documentClient)>100,'Embedded lab cannot scroll: '+JSON.stringify(graph));
   assert.equal(labRequests.length,1,'Lab should load exactly once');
   assert.deepEqual(errors,[],'Uncaught JavaScript errors');
   console.log('UNIVERSE 28 STORY BROWSER OK',name,JSON.stringify({dims,graph,labRequests:labRequests.length,heroHeight:box.height}));
   await page.close();
  }
 }finally{if(browser)await browser.close();await new Promise(ok=>server.close(ok))}
}
main().catch(e=>{console.error(e.stack||String(e));process.exitCode=1});
