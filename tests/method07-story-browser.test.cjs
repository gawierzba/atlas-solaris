'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),shots=path.join(root,'_method07_story');fs.mkdirSync(shots,{recursive:true});
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json','.jpg':'image/jpeg','.png':'image/png'};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://127.0.0.1'),file=path.resolve(root,'.'+decodeURIComponent(u.pathname.replace(/\/$/,'/index.html')));
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
 fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return}
 res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data)});
});
const norm=t=>t.replace(/\s+/g,' ').trim();
async function run(){
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const base='http://127.0.0.1:'+server.address().port;
  for(const [device,w,h] of [['desktop',1440,900],['phone',390,844],['small-phone',320,680]]){
   const page=await browser.newPage({viewport:{width:w,height:h},deviceScaleFactor:1,isMobile:device!=='desktop',hasTouch:device!=='desktop'});
   const errors=[],atlasRequests=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('request',r=>{if(r.url().includes('/atlas.html'))atlasRequests.push(r.url())});
   const resp=await page.goto(base+'/etapy/07/',{waitUntil:'domcontentloaded'});
   assert.equal(resp.status(),200);
   await page.locator('#m7Title').waitFor({state:'visible'});
   await page.locator('.m7-hero-art').evaluate(img=>img.decode());
   await page.waitForTimeout(150);
   assert.equal(await page.locator('#stageFrame').getAttribute('src'),null,'3D loaded before reader click');
   assert.equal(atlasRequests.length,0,'No engine request on article start');
   const hero=await page.locator('.m7-hero').boundingBox();
   assert.ok(hero.height>600);
   await page.locator('.m7-hero').screenshot({path:path.join(shots,'hero-'+device+'.png')});
   await page.locator('#neptun').scrollIntoViewIfNeeded();
   assert.equal(await page.locator('#stageFrame').getAttribute('src'),null,'Reading a historical chapter must not load engine');
   await page.locator('#m7Eccentricity').scrollIntoViewIfNeeded();
   assert.equal(await page.locator('#m7EccValue').textContent(),'0,2056');
   assert.equal(await page.locator('#m7Peri').textContent(),'0,7944 a');
   assert.equal(await page.locator('#m7Apo').textContent(),'1,2056 a');
   assert.equal(await page.locator('#m7Ratio').textContent(),'1,52×');
   const ecc=page.locator('#m7Eccentricity');
   await page.locator('button[data-e="0"]').click();
   assert.equal(await page.locator('#m7OrbitEllipse').getAttribute('cx'),'325.000');
   assert.equal(await page.locator('#m7OrbitEllipse').getAttribute('ry'),'162.000');
   assert.equal(await page.locator('#m7Ratio').textContent(),'1,00×');
   await page.locator('button[data-e=".5"]').count().then(x=>assert.equal(x,0)); // the hypothetical preset is exactly .50
   await page.locator('button[data-e=".50"]').click();
   assert.equal(await page.locator('#m7Ratio').textContent(),'3,00×');
   assert.equal(await page.locator('#m7Peri').textContent(),'0,5000 a');
   assert.equal(await page.locator('#m7Apo').textContent(),'1,5000 a');
   assert.equal(await page.locator('#m7OrbitEllipse').getAttribute('cx'),'406.000');
   const rY=Number(await page.locator('#m7OrbitEllipse').getAttribute('ry'));
   assert.ok(Math.abs(rY-140.296)<.003);
   await page.locator('button[data-e=".0167"]').click();
   assert.equal(await page.locator('#m7Ratio').textContent(),'1,03×');
   assert.equal(await page.locator('#m7Peri').textContent(),'0,9833 a');
   await ecc.fill('.0934');
   assert.equal(await page.locator('#m7Apo').textContent(),'1,0934 a');
   assert.equal(await page.locator('button[data-e=".0934"]').getAttribute('aria-pressed'),'true');
   assert.equal(await page.locator('#stageFrame').getAttribute('src'),null,'Orbit widget should not launch 3D');
   await page.locator('#m7Distance').scrollIntoViewIfNeeded();
   assert.equal(norm(await page.locator('#m7DistanceKm').textContent()),'149 597 870,7 km');
   assert.equal(await page.locator('#m7LightTime').textContent(),'8 min 19 s');
   assert.equal(await page.locator('#m7LightSeconds').textContent(),'499,00 sekundy');
   await page.locator('button[data-km="384400"]').click();
   assert.equal(norm(await page.locator('#m7DistanceKm').textContent()),'384 400,0 km');
   assert.equal(await page.locator('#m7LightTime').textContent(),'1,28 s');
   await page.locator('button[data-au="5"]').click();
   assert.equal(await page.locator('#m7LightTime').textContent(),'41 min 35 s');
   await page.locator('button[data-au="30"]').click();
   assert.equal(await page.locator('#m7LightTime').textContent(),'4 h 09 min 30 s');
   const dist=page.locator('#m7Distance');
   await dist.fill('100');
   assert.match(await page.locator('#m7DistanceAu').textContent(),/35,00000 au/);
   assert.equal(await page.locator('#stageFrame').getAttribute('src'),null,'Light time widget should not start GPU');
   await page.locator('button[data-km="149597870.7"]').click();
   await page.locator('.m7-orbit-widget').screenshot({path:path.join(shots,'kepler-'+device+'.png')});
   await page.locator('#stageViewport').scrollIntoViewIfNeeded();
   await page.waitForTimeout(300);
   assert.equal(await page.locator('#stageFrame').getAttribute('src'),null,'Scrolled into documentation but loaded heavy 3D');
   assert.equal(atlasRequests.length,0);
   const dims=await page.evaluate(()=>({width:innerWidth,overflow:document.documentElement.scrollWidth-innerWidth,docHeight:document.documentElement.scrollHeight,viewport:innerHeight}));
   assert.ok(dims.overflow<=4,'Horizontal overflow: '+JSON.stringify(dims));
   assert.ok(dims.docHeight>dims.viewport*4,'Long-form article cannot scroll');
   assert.deepEqual(errors,[],'Unhandled errors from light-weight story');
   if(device==='desktop'){
    const requested=page.waitForRequest(r=>r.url().includes('/atlas.html?portal=method'),{timeout:15000});
    await page.locator('#stageStartLab').click();
    await requested;
    assert.equal(atlasRequests.length,1,'Expected one 3D engine request after explicit click');
    const frame=page.frameLocator('#stageFrame');
    await frame.locator('#methodDialog').waitFor({state:'visible',timeout:25000});
    assert.match(await frame.locator('#methodDialog').textContent(),/ATLAS SOLARIS 7\.0 — metoda i ograniczenia/);
    assert.match(await page.locator('#stageViewport').getAttribute('class'),/is-started/);
    console.log('METHOD 07 ORIGINAL DOCUMENTATION OPENS OK',atlasRequests.length);
   }else await page.locator('#stageStartLab').waitFor({state:'visible'});
   console.log('METHOD 07 CHROMIUM OK',device,JSON.stringify({dims,heroHeight:hero.height,orbitExamples:4,lightExamples:5,requestsBeforeClick:0}));
   await page.close();
  }
 }finally{if(browser)await browser.close();await new Promise(ok=>server.close(ok))}
}
run().catch(err=>{console.error(err.stack||String(err));process.exitCode=1});
