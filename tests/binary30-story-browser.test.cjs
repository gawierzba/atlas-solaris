'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),shots=path.join(root,'_binary30_story');
fs.mkdirSync(shots,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://127.0.0.1'),file=path.resolve(root,'.'+decodeURIComponent(u.pathname.replace(/\/$/,'/index.html')));
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
 fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return}
 res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);
 });
});
async function main(){
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const base='http://127.0.0.1:'+server.address().port;
  for(const [name,width,height] of [['desktop',1440,900],['phone',390,844],['small-phone',320,680]]){
   const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,isMobile:name!=='desktop',hasTouch:name!=='desktop'});
   const errors=[],labRequests=[];
   page.on('pageerror',error=>errors.push(error.message));
   page.on('request',request=>{if(request.url().includes('/laboratoria/gwiazdy-podwojne/'))labRequests.push(request.url())});
   const response=await page.goto(base+'/etapy/30/',{waitUntil:'domcontentloaded'});
   assert.equal(response.status(),200);
   await page.locator('#b30Title').waitFor({state:'visible'});
   await page.locator('.b30-hero-image').evaluate(img=>img.decode());
   await page.waitForTimeout(230);
   assert.equal(await page.locator('#stageFrame').getAttribute('src'),null,'Simulation eagerly loaded on article page');
   assert.equal(labRequests.length,0,'Unexpected laboratory request during initial article');
   const hero=await page.locator('.b30-hero').boundingBox();
   assert.ok(hero?.height>560,'Hero missing or collapsed');
   await page.locator('.b30-hero').screenshot({path:path.join(shots,'hero-'+name+'.png')});
   await page.locator('#taniec').scrollIntoViewIfNeeded();
   await page.waitForTimeout(200);
   assert.equal(await page.locator('#stageFrame').getAttribute('src'),null,'Simulator must remain idle while reading');
   const dims=await page.evaluate(()=>({width:innerWidth,overflow:document.documentElement.scrollWidth-innerWidth,total:document.documentElement.scrollHeight,viewport:innerHeight}));
   assert.ok(dims.overflow<=4,'Horizontal article overflow: '+JSON.stringify(dims));
   assert.ok(dims.total>dims.viewport*3,'Article too short or not scrollable: '+JSON.stringify(dims));
   await page.locator('#stageLaunch').click();
   await page.waitForFunction(()=>document.querySelector('#stageFrame')?.getAttribute('src')!==null);
   const frame=page.frameLocator('#stageFrame');
   await frame.locator('#b30Scene').waitFor({state:'visible',timeout:30000});
   await page.waitForFunction(()=>document.querySelector('#stageFrame')?.contentDocument?.getElementById('b30Scene')?.width>0);
   const period=await frame.locator('#b30Period').textContent();
   const state=await frame.locator('#b30Condition').textContent();
   assert.ok(period?.trim(),'No orbital period calculated');
   assert.ok(state?.trim(),'No Roche status calculated');
   await frame.locator('#b30Fill').fill('0.85');
   const fill=await frame.locator('#b30FillVal').textContent();
   assert.match(fill,/85/,'Roche filling slider failed');
   assert.equal(labRequests.length,1,'Laboratory should load only once');
   assert.deepEqual(errors,[],'JavaScript exceptions');
   console.log('BINARY 30 STORY BROWSER OK',name,JSON.stringify({dims,period,state,fill,labRequests:labRequests.length,heroHeight:hero.height}));
   await page.close();
  }
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve))}
}
main().catch(error=>{console.error(error.stack||String(error));process.exitCode=1});
