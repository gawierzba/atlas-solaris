'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),shots=path.join(root,'_solar03_story');
fs.mkdirSync(shots,{recursive:true});
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png'};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://127.0.0.1'),file=path.resolve(root,'.'+decodeURIComponent(u.pathname.replace(/\/$/,'/index.html')));
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
 fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return}
 res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);
 });
});
async function run(){
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const base='http://127.0.0.1:'+server.address().port;
  for(const [device,width,height] of [['desktop',1440,900],['phone',390,844],['small-phone',320,680]]){
   const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,isMobile:device!=='desktop',hasTouch:device!=='desktop'});
   const errors=[],labRequests=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('request',req=>{if(req.url().includes('/atlas.html'))labRequests.push(req.url())});
   const response=await page.goto(base+'/etapy/03/',{waitUntil:'domcontentloaded'});
   assert.equal(response.status(),200);
   await page.locator('#s3Title').waitFor({state:'visible'});
   await page.locator('.s3-hero-art').evaluate(img=>img.decode());
   await page.waitForTimeout(175);
   assert.equal(await page.locator('#stageFrame').getAttribute('src'),null,'Forbidden eager WebGL laboratory');
   assert.equal(labRequests.length,0,'No atlas.html before user click');
   await page.locator('.s3-hero').screenshot({path:path.join(shots,'hero-'+device+'.png')});
   const earth=await page.locator('#s3EarthDot').boundingBox(),moon=await page.locator('#s3MoonDot').boundingBox();
   const ratio=(moon.y+moon.height/2-earth.y-earth.height/2)/earth.height;
   const diameterRatio=moon.width/earth.width;
   assert.ok(Math.abs(ratio-384400/12742)<.02,'Earth/Moon distance ratio wrong: '+ratio);
   assert.ok(Math.abs(diameterRatio-3474.8/12742)<.005,'Moon diameter wrong: '+diameterRatio);
   await page.locator('#s3MoonDot').scrollIntoViewIfNeeded();
   assert.equal(await page.locator('#stageFrame').getAttribute('src'),null,'The long scientific scroll triggered 3D');
   await page.locator('#kalkulator').scrollIntoViewIfNeeded();
   await page.locator('button[data-size-mm="1"]').click();
   assert.equal(await page.locator('#s3MoonDistance').textContent(),'3,02 cm');
   assert.equal(await page.locator('#s3SunDistance').textContent(),'11,74 m');
   await page.locator('button[data-size-mm="100"]').click();
   assert.equal(await page.locator('#s3NeptuneDistance').textContent(),'35,32 km');
   await page.locator('button[data-size-mm="10"]').click();
   assert.equal(await page.locator('#s3MoonSize').textContent(),'2,73 mm');
   assert.equal(await page.locator('#s3MoonDistance').textContent(),'30,17 cm');
   assert.equal(await page.locator('#s3SunSize').textContent(),'1,09 m');
   assert.equal(await page.locator('#s3JupiterDistance').textContent(),'610,58 m');
   assert.equal(await page.locator('button[data-size-mm="10"]').getAttribute('aria-pressed'),'true');
   await page.locator('#stageViewport').scrollIntoViewIfNeeded();
   await page.waitForTimeout(280);
   assert.equal(await page.locator('#stageFrame').getAttribute('src'),null,'Manual-only lab started by reaching viewport');
   assert.equal(labRequests.length,0);
   const dims=await page.evaluate(()=>({viewport:innerWidth,overflow:document.documentElement.scrollWidth-innerWidth,fullHeight:document.documentElement.scrollHeight,screenHeight:innerHeight}));
   assert.ok(dims.overflow<=4,'Horizontal page overflow: '+JSON.stringify(dims));
   assert.ok(dims.fullHeight>dims.screenHeight*5,'The deliberate spatial chapter is not scrollable');
   assert.deepEqual(errors,[],'Unhandled page errors');
   if(device==='desktop'){
    const pending=page.waitForRequest(req=>req.url().includes('/atlas.html'),{timeout:15000});
    await page.locator('#stageStartLab').click();
    await pending;
    await page.waitForFunction(()=>Boolean(document.querySelector('#stageFrame').getAttribute('src')));
    assert.equal(labRequests.length,1,'Expected one engine request after click');
    const lab=page.frameLocator('#stageFrame');
    await lab.locator('#trueScaleToggle').waitFor({state:'attached',timeout:25000});
    assert.equal(await lab.locator('.nav-planet[data-target="solar"]').count(),1);
    assert.match(await page.locator('#stageViewport').getAttribute('class'),/is-started/);
    console.log('STAGE 03 ENGINE MANUAL START OK',labRequests.length);
   }else await page.locator('#stageStartLab').waitFor({state:'visible'});
   console.log('STAGE 03 SCIENTIFIC SCROLL OK',device,JSON.stringify({dims,ratio:+ratio.toFixed(4),diameterRatio:+diameterRatio.toFixed(4),priorEngineRequests:0}));
   await page.close();
  }
 }finally{if(browser)await browser.close();await new Promise(ok=>server.close(ok))}
}
run().catch(e=>{console.error(e.stack||String(e));process.exitCode=1});
