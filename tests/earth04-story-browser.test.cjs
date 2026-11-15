'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),shots=path.join(root,'_earth04_story');
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
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const origin='http://127.0.0.1:'+server.address().port;
  for(const [device,w,h] of [['desktop',1440,900],['phone',390,844],['small-phone',320,680]]){
   const page=await browser.newPage({viewport:{width:w,height:h},deviceScaleFactor:1,isMobile:device!=='desktop',hasTouch:device!=='desktop'});
   const errors=[],modelRequests=[];
   page.on('pageerror',err=>errors.push(err.message));
   page.on('request',req=>{if(req.url().includes('/atlas.html'))modelRequests.push(req.url())});
   const resp=await page.goto(origin+'/etapy/04/',{waitUntil:'domcontentloaded'});
   assert.equal(resp.status(),200);
   await page.locator('#e4Title').waitFor({state:'visible'});
   await page.locator('.e4-hero-art').evaluate(img=>img.decode());
   await page.waitForTimeout(150);
   assert.equal(await page.locator('#stageFrame').getAttribute('src'),null,'3D cannot load before click');
   assert.equal(modelRequests.length,0,'Simulator fetched during initial load');
   const hero=await page.locator('.e4-hero').boundingBox();
   assert.ok(hero.height>550);
   await page.locator('.e4-hero').screenshot({path:path.join(shots,'hero-'+device+'.png')});
   await page.locator('#earthrise').scrollIntoViewIfNeeded();
   assert.equal(await page.locator('#stageFrame').getAttribute('src'),null,'3D launched during article reading');
   await page.locator('#obserwatorium').scrollIntoViewIfNeeded();
   assert.equal(await page.locator('#e4SolarAlt').textContent(),'59,1°');
   assert.equal(await page.locator('#e4DayLength').textContent(),'16 h 58 min');
   const seasons=page.locator('.e4-season-options button');
   await page.locator('#e4Latitude').selectOption('70');
   await page.locator('button[data-name="Przesilenie czerwcowe"]').click();
   assert.equal(await page.locator('#e4DayLength').textContent(),'24 h 00 min');
   assert.match(await page.locator('#e4DayComment').textContent(),/Dzień polarny/);
   await page.locator('button[data-name="Przesilenie grudniowe"]').click();
   assert.equal(await page.locator('#e4DayLength').textContent(),'0 h 00 min');
   assert.equal(await page.locator('#e4SolarAlt').textContent(),'-3,4°');
   assert.match(await page.locator('#e4DayComment').textContent(),/Noc polarna/);
   await page.locator('#e4Latitude').selectOption('0');
   await seasons.nth(0).click();
   assert.equal(await page.locator('#e4SolarAlt').textContent(),'90,0°');
   assert.equal(await page.locator('#e4DayLength').textContent(),'12 h 00 min');
   await page.locator('#e4Latitude').selectOption('-33.87');
   await page.locator('button[data-name="Przesilenie grudniowe"]').click();
   assert.equal(await page.locator('#e4SolarAlt').textContent(),'79,6°');
   assert.equal(await page.locator('#e4DayLength').textContent(),'14 h 15 min');
   await page.locator('#stageViewport').scrollIntoViewIfNeeded();
   await page.waitForTimeout(300);
   assert.equal(await page.locator('#stageFrame').getAttribute('src'),null,'Simulator auto-loaded after scroll');
   assert.equal(modelRequests.length,0,'3D requests during long story');
   const dims=await page.evaluate(()=>({width:innerWidth,overflow:document.documentElement.scrollWidth-innerWidth,docHeight:document.documentElement.scrollHeight,screen:innerHeight}));
   assert.ok(dims.overflow<=4,'Horizontal overflow '+JSON.stringify(dims));
   assert.ok(dims.docHeight>dims.screen*3,'Story not scrollable');
   assert.deepEqual(errors,[],'Article script errors');
   if(device==='desktop'){
    const pending=page.waitForRequest(r=>r.url().includes('/atlas.html'),{timeout:15000});
    await page.locator('#stageStartLab').click();
    await pending;
    assert.equal(modelRequests.length,1,'Expected one engine request after explicit start');
    const frame=page.frameLocator('#stageFrame');
    await frame.locator('#space').waitFor({state:'attached',timeout:25000});
    assert.equal(await frame.locator('#planetList').count(),1,'Earth laboratory not found');
    assert.match(await page.locator('#stageViewport').getAttribute('class'),/is-started/);
    console.log('EARTH 04 LAB MANUAL START OK '+modelRequests.length);
   }else await page.locator('#stageStartLab').waitFor({state:'visible'});
   console.log('EARTH 04 CHROMIUM OK '+device+' '+JSON.stringify({dims,heroHeight:hero.height,engineRequestsBeforeClick:0}));
   await page.close();
  }
 }finally{if(browser)await browser.close();await new Promise(ok=>server.close(ok))}
}
run().catch(err=>{console.error(err.stack||String(err));process.exitCode=1});
