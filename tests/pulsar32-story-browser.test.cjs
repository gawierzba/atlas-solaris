'use strict';
/* Real Playwright smoke test for the long-form article and iframe on desktop + mobile. */
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const assert=require('node:assert/strict'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'_pulsar_story');
fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.svg':'image/svg+xml','.json':'application/json'};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost'),f=path.resolve(root,'.'+decodeURIComponent(u.pathname.replace(/\/$/,'/index.html')));
 if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return}
 fs.readFile(f,(err,bytes)=>{if(err){res.writeHead(404).end();return}
 res.writeHead(200,{'Content-Type':mime[path.extname(f)]||'application/octet-stream','Cache-Control':'no-store'});res.end(bytes);
 });
});
async function run(){
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 let browser;try{
  browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const host='http://127.0.0.1:'+server.address().port;
  for(const [name,width,height] of [['desktop',1440,900],['phone',390,844]]){
   const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,isMobile:name==='phone',hasTouch:name==='phone'});
   const errors=[],labRequests=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('request',req=>{if(req.url().includes('/laboratoria/pulsar/'))labRequests.push(req.url())});
   const response=await page.goto(host+'/etapy/32/',{waitUntil:'domcontentloaded'});
   assert.equal(response.status(),200);
   await page.locator('#p32HeroTitle').waitFor();
   await page.locator('.p32-cover-art').evaluate(img=>img.decode());
   await page.waitForTimeout(220);
   assert.equal(await page.locator('#stageFrame').getAttribute('src'),null,'Laboratory loaded before article was read');
   assert.equal(labRequests.length,0,'Unexpected background lab requests');
   const hero=await page.locator('.p32-cover').boundingBox();assert.ok(hero?.height>=560,'Hero collapsed: '+JSON.stringify(hero));
   await page.locator('.p32-cover').screenshot({path:path.join(out,'cover-'+name+'.png')});
   // Reading one of the mid-article sections must not start the simulation.
   await page.locator('#jak-dziala').scrollIntoViewIfNeeded();
   await page.waitForTimeout(200);
   assert.equal(await page.locator('#stageFrame').getAttribute('src'),null,'Reading should not run laboratory');
   const dimensions=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,innerWidth,scrollHeight:document.documentElement.scrollHeight,innerHeight,scrollY}));
   assert.ok(dimensions.scrollWidth<=dimensions.innerWidth+4,'Horizontal overflow: '+JSON.stringify(dimensions));
   assert.ok(dimensions.scrollHeight>dimensions.innerHeight*3,'Chapter cannot scroll: '+JSON.stringify(dimensions));
   // Direct experiment CTA (on first cover): should load the actual existing lab.
   await page.locator('#stageLaunch').click();
   await page.waitForFunction(()=>document.querySelector('#stageFrame').getAttribute('src'));
   const frame=page.frameLocator('#stageFrame');
   await frame.locator('#p32Scene').waitFor({state:'visible',timeout:30000});
   await page.waitForFunction(()=>{
    const frame=document.querySelector('#stageFrame');
    return frame?.contentDocument?.getElementById('p32Scene')?.width>0
   },{timeout:30000});
   const period=await frame.locator('#p32PeriodOut').innerText();
   assert.match(period,/ms/,'Scientific laboratory did not mount');
   assert.ok(labRequests.length>=1,'Lab not requested after deliberate launch');
   assert.deepEqual(errors,[],'Browser errors');
   console.log('STORY 32 OK',name,JSON.stringify({dimensions,labRequests:labRequests.length,period,heroHeight:hero.height}));
   await page.close();
  }
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r))}
}
run().catch(e=>{console.error(e.stack||e);process.exitCode=1});
