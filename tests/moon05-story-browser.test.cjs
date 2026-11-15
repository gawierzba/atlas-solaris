'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),shots=path.join(root,'_moon05_story');
fs.mkdirSync(shots,{recursive:true});
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json'};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://127.0.0.1'),file=path.resolve(root,'.'+decodeURIComponent(u.pathname.replace(/\/$/,'/index.html')));
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
 fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return}
 res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);
 });
});
function litArea(d){
 const points=[...d.matchAll(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)].map(m=>[Number(m[1]),Number(m[2])]);
 assert.ok(points.length>160,'Lunar phase silhouette has too few points');
 let area=0;
 for(let i=0;i<points.length;i++){
  const a=points[i],b=points[(i+1)%points.length];
  area+=a[0]*b[1]-b[0]*a[1];
 }
 return Math.abs(area/2);
}
async function main(){
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const base='http://127.0.0.1:'+server.address().port;
  for(const [device,w,h] of [['desktop',1440,900],['phone',390,844],['small-phone',320,680]]){
   const page=await browser.newPage({viewport:{width:w,height:h},deviceScaleFactor:1,isMobile:device!=='desktop',hasTouch:device!=='desktop'});
   const errors=[],atlasRequests=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('request',r=>{if(r.url().includes('/atlas.html'))atlasRequests.push(r.url())});
   const response=await page.goto(base+'/etapy/05/',{waitUntil:'domcontentloaded'});
   assert.equal(response.status(),200);
   await page.locator('#m5Title').waitFor({state:'visible'});
   await page.locator('.m5-hero-art').evaluate(img=>img.decode());
   await page.waitForTimeout(150);
   assert.equal(await page.locator('#stageFrame').getAttribute('src'),null,'3D launched with initial article');
   assert.equal(atlasRequests.length,0,'Heavy engine loaded on open');
   const hero=await page.locator('.m5-hero').boundingBox();
   assert.ok(hero.height>580,'Hero collapsed');
   await page.locator('.m5-hero').screenshot({path:path.join(shots,'hero-'+device+'.png')});
   await page.locator('#druga-strona').scrollIntoViewIfNeeded();
   assert.equal(await page.locator('#stageFrame').getAttribute('src'),null,'Photo section launched 3D');
   const slider=page.locator('#m5PhaseRange');
   await slider.scrollIntoViewIfNeeded();
   const tests=[
    {value:'0',label:/Nów/,lit:'0,0%',day:'0,00 dnia',area:0,mx:343,my:177,markX:330,markY:177},
    {value:'25',label:/Pierwsza kwadra/,lit:'50,0%',day:'7,38 dnia',area:.5,mx:222,my:56,markX:222,markY:69},
    {value:'50',label:/Pełnia/,lit:'100,0%',day:'14,77 dnia',area:1,mx:101,my:177,markX:114,markY:177},
    {value:'75',label:/Ostatnia kwadra/,lit:'50,0%',day:'22,15 dnia',area:.5,mx:222,my:298,markX:222,markY:285},
    {value:'100',label:/Nów/,lit:'0,0%',day:'29,53 dnia',area:0,mx:343,my:177,markX:330,markY:177}
   ];
   for(const t of tests){
    await slider.fill(t.value);
    assert.match(await page.locator('#m5PhaseLabel').textContent(),t.label);
    assert.equal(await page.locator('#m5Illumination').textContent(),t.lit);
    assert.equal(await page.locator('#m5Elapsed').textContent(),t.day);
    const attributes=await page.evaluate(()=>({
     d:document.getElementById('m5LitShape').getAttribute('d'),
     mx:Number(document.getElementById('m5MoonOrbitBody').getAttribute('cx')),
     my:Number(document.getElementById('m5MoonOrbitBody').getAttribute('cy')),
     nx:Number(document.getElementById('m5MoonFaceMarker').getAttribute('cx')),
     ny:Number(document.getElementById('m5MoonFaceMarker').getAttribute('cy'))
    }));
    const normalized=litArea(attributes.d)/(Math.PI*84*84);
    assert.ok(Math.abs(normalized-t.area)<.008,'Moon phase silhouette mismatch '+JSON.stringify({t,normalized}));
    for(const [key,expected] of [['mx',t.mx],['my',t.my],['nx',t.markX],['ny',t.markY]]){
     assert.ok(Math.abs(attributes[key]-expected)<.03,'Moon always must face Earth '+key+' '+JSON.stringify(attributes));
    }
    assert.equal(await page.locator('#stageFrame').getAttribute('src'),null,'Interactive phases must not launch 3D');
   }
   await page.locator('button[data-phase="25"]').click();
   assert.equal(await slider.inputValue(),'25');
   assert.equal(await page.locator('button[data-phase="25"]').getAttribute('aria-pressed'),'true');
   await page.locator('.m5-phase-widget').screenshot({path:path.join(shots,'phases-'+device+'.png')});
   await page.locator('#stageViewport').scrollIntoViewIfNeeded();
   await page.waitForTimeout(280);
   assert.equal(await page.locator('#stageFrame').getAttribute('src'),null,'Scrolling to experiment started costly 3D');
   assert.equal(atlasRequests.length,0,'No 3D requests before user click');
   const dims=await page.evaluate(()=>({width:innerWidth,overflow:document.documentElement.scrollWidth-innerWidth,scrollHeight:document.documentElement.scrollHeight,viewport:innerHeight}));
   assert.ok(dims.overflow<=4,'Horizontal overflow: '+JSON.stringify(dims));
   assert.ok(dims.scrollHeight>dims.viewport*3,'Story cannot scroll');
   assert.deepEqual(errors,[],'Unexpected JavaScript errors in lightweight article');
   if(device==='desktop'){
    const requested=page.waitForRequest(r=>r.url().includes('/atlas.html'),{timeout:15000});
    await page.locator('#stageStartLab').click();
    await requested;
    assert.equal(atlasRequests.length,1,'Exactly one engine request after click');
    const frame=page.frameLocator('#stageFrame');
    await frame.locator('#space').waitFor({state:'attached',timeout:25000});
    assert.equal(await frame.locator('#planetList').count(),1);
    assert.match(await page.locator('#stageViewport').getAttribute('class'),/is-started/);
    console.log('MOON 05 MANUAL 3D OK',atlasRequests.length);
   }else await page.locator('#stageStartLab').waitFor({state:'visible'});
   console.log('MOON 05 EDITORIAL CHROMIUM OK',device,JSON.stringify({dims,heroHeight:hero.height,phaseTests:tests.length,preClickAtlasRequests:0}));
   await page.close();
  }
 }finally{if(browser)await browser.close();await new Promise(done=>server.close(done))}
}
main().catch(e=>{console.error(e.stack||String(e));process.exitCode=1});
