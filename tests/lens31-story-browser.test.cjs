'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const assert=require('node:assert/strict'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'_lens31_story');
fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.svg':'image/svg+xml','.json':'application/json'};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://127.0.0.1'),f=path.resolve(root,'.'+decodeURIComponent(u.pathname.replace(/\/$/,'/index.html')));
 if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return}
 fs.readFile(f,(err,data)=>{if(err){res.writeHead(404).end();return}
 res.writeHead(200,{'Content-Type':mime[path.extname(f)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);
 });
});
async function main(){
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  for(const [name,w,h] of [['desktop',1440,900],['phone',390,844],['small-phone',320,680]]){
   const page=await browser.newPage({viewport:{width:w,height:h},deviceScaleFactor:1,isMobile:name!=='desktop',hasTouch:name!=='desktop'});
   const labRequests=[],errors=[];
   page.on('request',r=>{if(r.url().includes('/laboratoria/soczewkowanie-grawitacyjne/'))labRequests.push(r.url())});
   page.on('pageerror',e=>errors.push(e.message));
   const base='http://127.0.0.1:'+server.address().port;
   const response=await page.goto(base+'/etapy/31/',{waitUntil:'domcontentloaded'});
   assert.equal(response.status(),200);
   await page.locator('#l31Title').waitFor({state:'visible'});
   await page.locator('.l31-cover').evaluate(async img=>{await img.decode()});
   await page.waitForTimeout(220);
   assert.equal(await page.locator('#stageFrame').getAttribute('src'),null,'Lab loaded before article');
   assert.equal(labRequests.length,0,'Lab unexpectedly requested before experiment');
   await page.locator('.l31-hero').screenshot({path:path.join(out,'lens31-'+name+'.png')});
   await page.locator('#fizyka').scrollIntoViewIfNeeded();
   await page.waitForTimeout(180);
   assert.equal(await page.locator('#stageFrame').getAttribute('src'),null,'Reading physics ran lab too early');
   const geom=await page.evaluate(()=>({w:innerWidth,overflow:document.documentElement.scrollWidth-innerWidth,height:document.documentElement.scrollHeight,viewport:innerHeight}));
   assert.ok(geom.overflow<=4,'Horizontal overflow '+JSON.stringify(geom));
   assert.ok(geom.height>geom.viewport*3,'Not enough scrollable article: '+JSON.stringify(geom));
   await page.locator('#stageLaunch').click();
   await page.waitForFunction(()=>document.querySelector('#stageFrame').getAttribute('src')!==null);
   const frame=page.frameLocator('#stageFrame');
   await frame.locator('#l31Canvas').waitFor({state:'visible',timeout:30000});
   await page.waitForFunction(()=>document.querySelector('#stageFrame')?.contentDocument?.getElementById('l31Canvas')?.width>0);
   const first=await frame.locator('#l31Status').textContent();
   await frame.locator('[data-l31preset="arcs"]').click();
   const second=await frame.locator('#l31Status').textContent();
   assert.ok(first&&second,'Lens UI does not respond');
   assert.ok(labRequests.length>=1,'Lab was not requested');
   assert.deepEqual(errors,[],'Browser scripting errors');
   console.log('LENS 31 STORY BROWSER OK',name,JSON.stringify({geom,first,second,labRequests:labRequests.length}));
   await page.close();
  }
 }finally{if(browser)await browser.close();await new Promise(ok=>server.close(ok))}
}
main().catch(e=>{console.error(e.stack||String(e));process.exitCode=1});
