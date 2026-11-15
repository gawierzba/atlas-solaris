'use strict';
const assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),shots=path.join(root,'_solar01_story');
fs.mkdirSync(shots,{recursive:true});
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json','.png':'image/png','.jpg':'image/jpeg'};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://127.0.0.1'),file=path.resolve(root,'.'+decodeURIComponent(u.pathname.replace(/\/$/,'/index.html')));
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
 fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return}
 res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);
 });
});
async function run(){
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const base='http://127.0.0.1:'+server.address().port;
  for(const [name,w,h] of [['desktop',1440,900],['phone',390,844],['small-phone',320,680]]){
   const page=await browser.newPage({viewport:{width:w,height:h},deviceScaleFactor:1,isMobile:name!=='desktop',hasTouch:name!=='desktop'});
   const errors=[],labRequests=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('request',r=>{if(r.url().includes('/atlas.html'))labRequests.push(r.url())});
   const response=await page.goto(base+'/etapy/01/',{waitUntil:'domcontentloaded'});
   assert.equal(response.status(),200);
   await page.locator('#s1Title').waitFor({state:'visible'});
   await page.locator('.s1-hero-art').evaluate(img=>img.decode());
   await page.waitForTimeout(250);
   assert.equal(await page.locator('#stageFrame').getAttribute('src'),null,'3D loaded before article');
   assert.equal(labRequests.length,0,'Unexpected heavy model request');
   const hero=await page.locator('.s1-hero').boundingBox();
   assert.ok(hero.height>570);
   await page.locator('.s1-hero').screenshot({path:path.join(shots,'hero-'+name+'.png')});
   await page.locator('#grawitacja').scrollIntoViewIfNeeded();
   await page.waitForTimeout(250);
   assert.equal(await page.locator('#stageFrame').getAttribute('src'),null,'3D loaded in middle of article');
   await page.locator('#stageViewport').scrollIntoViewIfNeeded();
   await page.waitForTimeout(420);
   assert.equal(await page.locator('#stageFrame').getAttribute('src'),null,'Manual-only lab started by scrolling');
   const dims=await page.evaluate(()=>({w:innerWidth,overflow:document.documentElement.scrollWidth-innerWidth,height:document.documentElement.scrollHeight,viewport:innerHeight}));
   assert.ok(dims.overflow<=4,'Horizontal overflow: '+JSON.stringify(dims));
   assert.ok(dims.height>dims.viewport*3,'Article not scrollable');
   assert.equal(labRequests.length,0,'No 3D engine should download during passive reading');
   assert.deepEqual(errors,[],'Article script errors');
   if(name==='desktop'){
     await page.locator('#stageStartLab').click();
     await page.waitForFunction(()=>Boolean(document.querySelector('#stageFrame').getAttribute('src')),{timeout:10000});
     assert.equal(labRequests.length,1,'Expected exactly one 3D engine request after click');
     const frame=page.frameLocator('#stageFrame');
     await frame.locator('#speedSelect').waitFor({state:'attached',timeout:25000});
     assert.equal(await frame.locator('#timeSlider').count(),1,'Scientific model controls not present');
     assert.match(await page.locator('#stageViewport').getAttribute('class'),/is-started/);
     console.log('SOLAR 01 LAB OPT-IN OK',JSON.stringify({engine:labRequests.length}));
   }else{
     await page.locator('#stageStartLab').waitFor({state:'visible'});
   }
   console.log('SOLAR 01 STORY BROWSER OK',name,JSON.stringify({dims,requestsBeforeClick:0,heroHeight:hero.height}));
   await page.close();
  }
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve))}
}
run().catch(e=>{console.error(e.stack||String(e));process.exitCode=1});
