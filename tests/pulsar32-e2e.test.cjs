'use strict';
/* Actual end-to-end visual regression with Playwright Chromium.
 * Serves the REAL site, tests its stage iframe, captures console failures,
 * pixel samples and screenshots. No mocking of the rendering code. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),artifacts=path.join(root,'_pulsar_e2e');
fs.mkdirSync(artifacts,{recursive:true});
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png'};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://127.0.0.1'),target=path.resolve(root,'.'+decodeURIComponent(u.pathname.replace(/\/$/,'/index.html')));
 if(!target.startsWith(root+path.sep)){res.writeHead(403).end();return}
 fs.readFile(target,(err,buf)=>{if(err){res.writeHead(404).end(target);return}
  res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store'});res.end(buf);
 });
});
const getCanvas=async(locator)=>locator.evaluate(canvas=>{
 const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
 if(!w||!h)return {empty:true};
 const d=ctx.getImageData(0,0,w,h).data;
 let hash=2166136261,pixels=0;
 const jump=Math.max(4,Math.floor(d.length/50000/4)*4);
 for(let i=0;i<d.length;i+=jump){hash=Math.imul(hash^d[i],16777619)>>>0;hash=Math.imul(hash^d[i+1],16777619)>>>0;hash=Math.imul(hash^d[i+2],16777619)>>>0;if(d[i]+d[i+1]+d[i+2]>40)pixels++}
 return {hash,pixels,w,h};
});
async function main(){
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser; const errors=[];
 try{
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1380,height:900},deviceScaleFactor:1});
  page.on('pageerror',error=>{console.error('PAGE ERROR',error.stack);errors.push(error.message)});
  page.on('console',m=>{if(m.type()==='error'||m.type()==='warning')console.log('PAGE CONSOLE',m.type(),m.text())});
  const base='http://127.0.0.1:'+server.address().port;
  await page.goto(base+'/etapy/32/',{waitUntil:'domcontentloaded'});
  const frame=page.frameLocator('#stageFrame'),play=frame.locator('#p32Play');
  await play.waitFor({state:'visible',timeout:25000});
  await frame.locator('#p32Scene').waitFor({state:'visible'});
  await page.waitForTimeout(650);
  await play.click();
  assert.match(await play.textContent(),/WZNÓW/,'Pause failed: the stage may be inert');
  const canvas=frame.locator('#p32Scene'),results={};
  for(const key of ['eco','auto','cinema']){
    await frame.locator('[data-p32quality="'+key+'"]').click();
    await page.waitForTimeout(350);
    results[key]={
      status:await frame.locator('#p32QualityStatus').textContent(),
      badge:await frame.locator('#p32VisualMode').textContent(),
      aria:await frame.locator('[data-p32quality="'+key+'"]').getAttribute('aria-pressed'),
      ...await getCanvas(canvas)
    };
    await frame.locator('.p32-scene').screenshot({path:path.join(artifacts,key+'.png')});
  }
  console.log('VISIBLE MODES',JSON.stringify(results,null,2));
  assert.equal(results.eco.aria,'true');
  assert.equal(results.cinema.aria,'true');
  assert.match(results.cinema.status,/FILMOWA/);
  assert.notEqual(results.eco.hash,results.cinema.hash,'Modes are identical on actual canvas: '+JSON.stringify(results));
  assert.ok(!results.cinema.badge.includes('AWARYJNY'),'Cinema renderer silently crashed');
  assert.deepEqual(errors,[],'Errors while loading stage iframe');
  console.log('PULSAR 32 E2E VERIFIED: Real canvas changes between modes');
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r))}
}
main().catch(e=>{console.error(e.stack||String(e));process.exitCode=1});
