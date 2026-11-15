'use strict';
const assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),shots=path.join(root,'_solar02_story');
fs.mkdirSync(shots,{recursive:true});
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json','.jpg':'image/jpeg'};
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
   const response=await page.goto(base+'/etapy/02/',{waitUntil:'domcontentloaded'});
   assert.equal(response.status(),200);
   await page.locator('#s2Title').waitFor({state:'visible'});
   await page.locator('.s2-hero-image').evaluate(img=>img.decode());
   await page.waitForTimeout(170);
   assert.equal(await page.locator('#stageFrame').getAttribute('src'),null,'3D should not download at article start');
   assert.equal(labRequests.length,0);
   const hero=await page.locator('.s2-hero').boundingBox();
   assert.ok(hero?.height>550,'Hero missing');
   await page.locator('.s2-hero').screenshot({path:path.join(shots,'hero-'+name+'.png')});
   await page.locator('#zegar').scrollIntoViewIfNeeded();
   await page.locator('#s2YearDisplay').waitFor({state:'visible'});
   const clock=page.locator('#s2Years');
   assert.match(await page.locator('.s2-reading').first().locator('[data-result]').textContent(),/41,52/);
   await clock.fill('1');
   const mercury=await page.locator('.s2-reading').first().locator('[data-result]').textContent();
   const neptune=await page.locator('.s2-reading').last().locator('[data-result]').textContent();
   assert.match(mercury,/4,15/,'Mercury 1 Earth year orbital count');
   assert.match(neptune,/0,01/,'Neptune 1 Earth year orbital count');
   await page.locator('button[data-year="30"]').click();
   assert.equal(await clock.inputValue(),'30');
   assert.equal(await page.locator('button[data-year="30"]').getAttribute('aria-pressed'),'true');
   const earth=await page.locator('.s2-reading').nth(2).locator('[data-result]').textContent();
   assert.match(earth,/30,00/,'Earth must complete thirty sidereal revolutions');
   const angle=await page.locator('.s2-reading').nth(2).locator('.s2-reading-dial').evaluate(el=>el.style.getPropertyValue('--angle'));
   assert.equal(angle,'360.00deg','One full Earth year should fill the orbital dial');
   assert.equal(await page.locator('#stageFrame').getAttribute('src'),null,'Clock widget must not run expensive simulator');
   await page.locator('#stageViewport').scrollIntoViewIfNeeded();
   await page.waitForTimeout(350);
   assert.equal(await page.locator('#stageFrame').getAttribute('src'),null,'3D auto-started while scrolling');
   assert.equal(labRequests.length,0,'3D should remain entirely dormant during reading');
   const dims=await page.evaluate(()=>({viewport:innerWidth,overflow:document.documentElement.scrollWidth-innerWidth,docHeight:document.documentElement.scrollHeight,screenHeight:innerHeight}));
   assert.ok(dims.overflow<=4,'Horizontal overflow: '+JSON.stringify(dims));
   assert.ok(dims.docHeight>dims.screenHeight*3,'Not scrollable');
   assert.deepEqual(errors,[],'JS error in article or micro-calculator');
   if(name==='desktop'){
     const pendingRequest=page.waitForRequest(r=>r.url().includes('/atlas.html'),{timeout:15000});
     await page.locator('#stageStartLab').click();
     await pendingRequest;
     await page.waitForFunction(()=>Boolean(document.querySelector('#stageFrame').getAttribute('src')));
     assert.equal(labRequests.length,1,'Expected one on-demand model download');
     const frame=page.frameLocator('#stageFrame');
     await frame.locator('#speedSelect').waitFor({state:'attached',timeout:25000});
     await frame.locator('#speedSelect').selectOption('365.256');
     assert.equal(await frame.locator('#speedSelect').inputValue(),'365.256');
     assert.equal(await frame.locator('#timeSlider').count(),1);
     assert.match(await page.locator('#stageViewport').getAttribute('class'),/is-started/);
     console.log('SOLAR 02 LAB MANUAL START OK',JSON.stringify({requests:labRequests.length}));
   }else await page.locator('#stageStartLab').waitFor({state:'visible'});
   console.log('SOLAR 02 STORY CHROMIUM OK',name,JSON.stringify({dims,mercury,neptune,earth,heroHeight:hero.height,requestsBeforeClick:0}));
   await page.close();
  }
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve))}
}
run().catch(e=>{console.error(e.stack||String(e));process.exitCode=1});
