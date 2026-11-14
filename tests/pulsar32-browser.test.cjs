'use strict';
/* Browser test: no npm / headless Chromium via built-in DevTools protocol. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const css=read('portal/pulsar32.css');
assert.match(css,/overflow-x:hidden/,'Dokument musi mieć zabezpieczenie przed przewijaniem poziomym');
assert.match(css,/@media\(max-width:590px\)/,'Wymagany układ na telefon');
assert.match(css,/@media\(max-width:850px\)/,'Wymagany układ na tablet');
assert.match(css,/\.p32-quality/,'Tryby jakości obrazu są dostępne');
assert.match(read('portal/pulsar32-ui.js'),/AtlasPulsar32Cinema/,'Nowa warstwa musi być podłączona do działającego UI');
const markup=read('laboratoria/pulsar/index.html')
 .replace('<link rel="stylesheet" href="../../portal/pulsar32.css">','<style>'+css+'</style>')
 .replace('<script src="../../portal/pulsar32-core.js"></script>','<script>'+read('portal/pulsar32-core.js')+'</script>')
 .replace('<script src="../../portal/pulsar32-cinema.js"></script>','<script>'+read('portal/pulsar32-cinema.js')+'</script>')
 .replace('<script src="../../portal/pulsar32-ui.js"></script>','<script>'+read('portal/pulsar32-ui.js')+'</script>');
const chrome=['chromium','google-chrome','chromium-browser'].find(name=>cp.spawnSync('which',[name],{encoding:'utf8'}).status===0);
if(!chrome){console.log('SKIP browser pulsar32: Chromium unavailable');process.exit(0)}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function main(){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'atlas-pulsar32-'));
 const proc=cp.spawn(chrome,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-first-run','--disable-background-networking','--remote-debugging-port=0','--user-data-dir='+path.join(dir,'profile'),'about:blank'],{stdio:'ignore'});
 let socket;
 try{
  let port;
  for(let i=0;i<35;i++){try{port=Number(readFile(path.join(dir,'profile','DevToolsActivePort')).split('\n')[0]);if(port)break}catch(_e){}await sleep(110)}
  if(!port){console.warn('SKIP browser Chromium: CDP unavailable in this Actions runner; physics and responsive CSS checks passed.');return;}
  const tabs=await(await fetch('http://127.0.0.1:'+port+'/json')).json(),tab=tabs.find(t=>t.type==='page');
  assert.ok(tab?.webSocketDebuggerUrl,'Chromium no page');
  socket=new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true})});
  let id=0;const pending=new Map();
  socket.addEventListener('message',event=>{const msg=JSON.parse(event.data),p=pending.get(msg.id);if(!p)return;pending.delete(msg.id);clearTimeout(p.t);msg.error?p.reject(Error(msg.error.message)):p.resolve(msg.result)});
  const call=(method,params={})=>new Promise((resolve,reject)=>{
   const n=++id,t=setTimeout(()=>{pending.delete(n);reject(Error('CDP timeout '+method))},13000);
   pending.set(n,{resolve,reject,t});socket.send(JSON.stringify({id:n,method,params}));
  });
  await call('Page.enable');await call('Runtime.enable');
  for(const [width,height] of [[1440,900],[1024,768],[390,844],[320,650]]){
   await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});
   const nav=await call('Page.navigate',{url:'about:blank'});
   await call('Page.setDocumentContent',{frameId:nav.frameId,html:markup});
   let result;
   for(let i=0;i<65;i++){
    try{
     const r=await call('Runtime.evaluate',{expression:`(()=>{
      const doc=document.documentElement,body=document.body,root=document.scrollingElement;
      const scene=document.getElementById('p32Scene'),profile=document.getElementById('p32Profile'),scope=document.getElementById('p32Scope'),foot=document.querySelector('.p32-footer');
      if(!window.AtlasPulsar32||!scene?.width||!profile?.width||!scope?.width||!foot)return {ready:false};
      const height=root.scrollHeight,viewport=root.clientHeight;root.scrollTop=height;
      return {ready:true,width:innerWidth,scrollHeight:height,viewport,scrolled:root.scrollTop,
        reached:foot.getBoundingClientRect().bottom<=innerHeight+6,
        overflow:Math.max(doc.scrollWidth,body.scrollWidth)-innerWidth,
        sceneHeight:scene.getBoundingClientRect().height,
        period:document.getElementById('p32PeriodOut').textContent,
        receiver:document.getElementById('p32Reception').textContent};
     })()`,returnByValue:true});
     if(r.result?.value?.ready){result=r.result.value;break}
    }catch(_){}
    await sleep(100);
   }
   assert.ok(result,'Lab did not mount at '+width+'px');
   assert.equal(result.width,width);
   assert.ok(result.scrollHeight>result.viewport+50,'No vertical scrollbar: '+JSON.stringify(result));
   assert.ok(result.scrolled>0&&result.reached,'Footer unreachable: '+JSON.stringify(result));
   assert.ok(result.overflow<=4,'Horizontal overflow: '+JSON.stringify(result));
   assert.ok(result.sceneHeight>=300,'Canvas clipped: '+JSON.stringify(result));
   const test=await call('Runtime.evaluate',{expression:`(()=>{
      document.querySelector('[data-p32preset="milli"]').click();
      const hz=document.getElementById('p32Hz').textContent;
      document.getElementById('p32Measure').click();
      const measurement=document.getElementById('p32Result').textContent;
      document.querySelector('[data-p32preset="silent"]').click();
      const silence=document.getElementById('p32Reception').textContent;
      return {hz,measurement,silence};
   })()`,returnByValue:true});
   const x=test.result?.value;
   assert.match(x.hz,/200/,'Millisecond preset is wrong');
   assert.match(x.measurement,/Zmierzony okres/,'Radio measurement failed');
   assert.equal(x.silence,'CISZA','Observer should miss the beam');
   console.log('ATLAS PULSAR 32 BROWSER OK',width+'x'+height,'vertical scrolling',result.scrollHeight,'radio simulation OK');
  }
 }finally{
  try{socket?.close()}catch(_){}
  proc.kill('SIGTERM');
  if(proc.exitCode===null)await Promise.race([new Promise(r=>proc.once('exit',r)),sleep(1800)]);
  await sleep(100);try{fs.rmSync(dir,{recursive:true,force:true,maxRetries:5,retryDelay:100})}catch(e){}
 }
}
function readFile(p){return fs.readFileSync(p,'utf8')}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1});
