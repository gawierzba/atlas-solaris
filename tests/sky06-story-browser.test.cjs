'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),shots=path.join(root,'_sky06_story');fs.mkdirSync(shots,{recursive:true});
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json'};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://127.0.0.1'),file=path.resolve(root,'.'+decodeURIComponent(u.pathname.replace(/\/$/,'/index.html')));
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
 fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return}
 res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data)});
});
async function main(){
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const base='http://127.0.0.1:'+server.address().port;
  for(const [device,w,h] of [['desktop',1440,900],['phone',390,844],['small-phone',320,680]]){
   const page=await browser.newPage({viewport:{width:w,height:h},deviceScaleFactor:1,isMobile:device!=='desktop',hasTouch:device!=='desktop'});
   const errors=[],atlasRequests=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/atlas.html'))atlasRequests.push(r.url())});
   const response=await page.goto(base+'/etapy/06/',{waitUntil:'domcontentloaded'});assert.equal(response.status(),200);
   await page.locator('#s6Title').waitFor({state:'visible'});
   await page.locator('.s6-hero-art').evaluate(img=>img.decode());
   await page.waitForTimeout(160);
   assert.equal(await page.locator('#stageFrame').getAttribute('src'),null,'Heavy 3D ran on page load');
   assert.equal(atlasRequests.length,0,'No 3D engine request should happen without click');
   const hero=await page.locator('.s6-hero').boundingBox();assert.ok(hero.height>570);
   await page.locator('.s6-hero').screenshot({path:path.join(shots,'hero-'+device+'.png')});
   await page.locator('#slady-gwiazd').scrollIntoViewIfNeeded();
   assert.equal(await page.locator('#stageFrame').getAttribute('src'),null,'Photo section must not launch engine');
   await page.locator('#kompas-nieba').scrollIntoViewIfNeeded();
   assert.equal(await page.locator('#s6Altitude').textContent(),'74,4°');
   assert.equal(await page.locator('#s6Azimuth').textContent(),'180,0°');
   assert.match(await page.locator('#s6Status strong').textContent(),/OKOŁOBIEGUNOWA/);
   const hour=page.locator('#s6Hour');
   await hour.fill('12');
   assert.equal(await page.locator('#s6Altitude').textContent(),'3,1°');
   assert.match(await page.locator('#s6Status strong').textContent(),/OKOŁOBIEGUNOWA/);
   assert.equal(await page.locator('#s6HourOut').textContent(),'+12 h');
   await page.locator('button[data-preset="sirius"]').click();
   assert.equal(await page.locator('#s6Altitude').textContent(),'18,9°');
   assert.match(await page.locator('#s6Status strong').textContent(),/NAD HORYZONTEM/);
   await page.locator('button[data-preset="canopus"]').click();
   assert.equal(await page.locator('#s6Altitude').textContent(),'-17,0°');
   assert.match(await page.locator('#s6Status strong').textContent(),/NIGDY NIE WSCHODZI/);
   assert.equal(await page.locator('#s6StarGroup').evaluate(el=>getComputedStyle(el).display),'none');
   await page.locator('button[data-preset="south"]').click();
   assert.equal(await page.locator('#s6Altitude').textContent(),'-33,1°');
   assert.match(await page.locator('#s6Status strong').textContent(),/NIGDY NIE WSCHODZI/);
   await page.locator('#s6Star').selectOption('canopus');
   assert.equal(await page.locator('#s6Altitude').textContent(),'71,2°');
   assert.equal(await page.locator('#s6Azimuth').textContent(),'180,0°');
   assert.equal(await page.locator('#s6StarGroup').evaluate(el=>getComputedStyle(el).display),'inline');
   await page.locator('#s6Latitude').selectOption('0');
   await page.locator('#s6Star').selectOption('sirius');
   await hour.fill('-6');
   assert.equal(await page.locator('#s6Altitude').textContent(),'0,0°');
   assert.equal(await page.locator('#s6Azimuth').textContent(),'90,0°');
   await hour.fill('6');
   assert.equal(await page.locator('#s6Azimuth').textContent(),'270,0°');
   assert.equal(await page.locator('#stageFrame').getAttribute('src'),null,'Interactive compass must not start 3D');
   await page.locator('#s6Latitude').selectOption('54.35');
   await page.locator('#s6Star').selectOption('vega');await hour.fill('0');
   await page.locator('.s6-sky-tool').screenshot({path:path.join(shots,'compass-'+device+'.png')});
   await page.locator('#stageViewport').scrollIntoViewIfNeeded();await page.waitForTimeout(250);
   assert.equal(await page.locator('#stageFrame').getAttribute('src'),null,'3D must not auto-start on scroll');
   assert.equal(atlasRequests.length,0);
   const dims=await page.evaluate(()=>({width:innerWidth,overflow:document.documentElement.scrollWidth-innerWidth,height:document.documentElement.scrollHeight,windowHeight:innerHeight}));
   assert.ok(dims.overflow<=4,'Horizontal overflow: '+JSON.stringify(dims));
   assert.ok(dims.height>dims.windowHeight*4,'Long-form article should scroll');
   assert.deepEqual(errors,[],'Unexpected page JavaScript errors');
   if(device==='desktop'){
    const pending=page.waitForRequest(r=>r.url().includes('/atlas.html'),{timeout:15000});
    await page.locator('#stageStartLab').click();await pending;
    assert.equal(atlasRequests.length,1,'One real request after manual launch');
    const frame=page.frameLocator('#stageFrame');
    await frame.locator('#surfaceMode').waitFor({state:'attached',timeout:25000});
    assert.equal(await frame.locator('#latitude').count(),1);
    assert.equal(await frame.locator('#sunAlt').count(),1);
    assert.match(await page.locator('#stageViewport').getAttribute('class'),/is-started/);
    console.log('SKY 06 MANUAL 3D LAUNCH OK',atlasRequests.length);
   }else await page.locator('#stageStartLab').waitFor({state:'visible'});
   console.log('SKY 06 BROWSER OK',device,JSON.stringify({dims,heroHeight:hero.height,checked:"Vega/Sirius/Canopus/Polaris",preClickEngineRequests:0}));
   await page.close();
  }
 }finally{if(browser)await browser.close();await new Promise(ok=>server.close(ok))}
}
main().catch(e=>{console.error(e.stack||String(e));process.exitCode=1});
