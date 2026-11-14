'use strict';
/* Real Chromium smoke: read article before loading simulator, test 3 viewports,
 * scrollability, sliders, scientific result and iframe content scrolling. */
const assert=require('node:assert/strict');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),shots=path.join(root,'_star29_story');
fs.mkdirSync(shots,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.svg':'image/svg+xml','.json':'application/json','.jpg':'image/jpeg'};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://127.0.0.1'),file=path.resolve(root,'.'+decodeURIComponent(u.pathname.replace(/\/$/,'/index.html')));
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
 fs.readFile(file,(err,buf)=>{if(err){res.writeHead(404).end();return}
 res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(buf);
 });
});
async function main(){
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const base='http://127.0.0.1:'+server.address().port;
  for(const [name,w,h] of [['desktop',1440,900],['phone',390,844],['small-phone',320,680]]){
   const page=await browser.newPage({viewport:{width:w,height:h},deviceScaleFactor:1,isMobile:name!=='desktop',hasTouch:name!=='desktop'});
   const errs=[],labRequests=[];
   page.on('pageerror',e=>errs.push(e.message));
   page.on('request',req=>{if(req.url().includes('/laboratoria/ewolucja-gwiazdy/'))labRequests.push(req.url())});
   const response=await page.goto(base+'/etapy/29/',{waitUntil:'domcontentloaded'});
   assert.equal(response.status(),200);
   await page.locator('#s29Title').waitFor({state:'visible'});
   await page.locator('.s29-cover-art').evaluate(img=>img.decode());
   await page.waitForTimeout(220);
   assert.equal(await page.locator('#stageFrame').getAttribute('src'),null,'Sim must not load at article start');
   assert.equal(labRequests.length,0,'Lab request before article read');
   await page.locator('.s29-cover').screenshot({path:path.join(shots,'cover-'+name+'.png')});
   await page.locator('#zycie').scrollIntoViewIfNeeded();
   await page.waitForTimeout(180);
   assert.equal(await page.locator('#stageFrame').getAttribute('src'),null,'Simulation loaded halfway through article');
   const dimensions=await page.evaluate(()=>({width:innerWidth,overflow:document.documentElement.scrollWidth-innerWidth,height:document.documentElement.scrollHeight,viewport:innerHeight}));
   assert.ok(dimensions.overflow<=4,'Horizontal overflow '+JSON.stringify(dimensions));
   assert.ok(dimensions.height>dimensions.viewport*3,'Long-form article does not scroll');
   await page.locator('#stageLaunch').click();
   await page.waitForFunction(()=>!!document.querySelector('#stageFrame')?.getAttribute('src'),{timeout:30000});
   const frame=page.frameLocator('#stageFrame');
   await frame.locator('#s29StarCanvas').waitFor({state:'visible',timeout:30000});
   await page.waitForFunction(()=>document.querySelector('#stageFrame')?.contentDocument?.getElementById('s29StarCanvas')?.width>0);
   const initial=await frame.locator('#kpiRemnant').textContent();
   assert.match(initial,/biały karzeł/i);
   await frame.locator('#massRange').fill('12');
   const result=await frame.locator('#kpiRemnant').textContent();
   assert.match(result,/neutronow/i,'12 solar masses must select neutron star in this simplified model');
   const kpi=await frame.locator('#kpiLife').textContent();
   assert.ok(kpi?.trim(),'Life estimate unavailable');
   await frame.locator('#lifeRange').fill('900');
   const stageName=await frame.locator('#phaseName').textContent();
   assert.ok(stageName?.trim(),'Timeline did not update');
   const scrolling=await frame.locator('body').evaluate(el=>({scrollHeight:el.scrollHeight,clientHeight:el.clientHeight,docScroll:document.documentElement.scrollHeight,docClient:document.documentElement.clientHeight}));
   assert.ok(Math.max(scrolling.scrollHeight-scrolling.clientHeight,scrolling.docScroll-scrolling.docClient)>100,'Lab not vertically scrollable: '+JSON.stringify(scrolling));
   assert.equal(labRequests.length,1,'Laboratory loaded more than once');
   assert.deepEqual(errs,[],'JavaScript errors');
   console.log('STAR 29 STORY BROWSER OK',name,JSON.stringify({dimensions,initial,result,kpi,stageName,scrolling,labRequests:labRequests.length}));
   await page.close();
  }
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve))}
}
main().catch(e=>{console.error(e.stack||String(e));process.exitCode=1});
