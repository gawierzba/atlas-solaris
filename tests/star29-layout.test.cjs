/**
 * Etap 29 — rzeczywisty test renderowania w Chromium (CDP), bez npm.
 * Weryfikuje: pionowy suwak, brak poziomego przewijania,
 * dostępność stopki i wykresu HR, czytelność kart faz.
 * Emulation.setDeviceMetricsOverride wymusza realne 320 i 390 px:
 * sam parametr --window-size Chromium ma minimum około 500 px.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const css=read('portal/star29.css');
const script=read('portal/star29.js');
const html=read('laboratoria/ewolucja-gwiazdy/index.html')
 .replace('<link rel="stylesheet" href="../../portal/star29.css">','<style>'+css+'</style>')
 .replace('<script src="../../portal/star29.js"></script>','<script>'+script+'</script>');
assert.match(css,/overflow-y:scroll/);
assert.ok(!css.includes('body{overflow:hidden}'),'body nie może blokować przewijania');
assert.match(css,/position:static;display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
assert.ok(html.includes('id="hrCanvas"')&&html.includes('id="lifeRange"'));
const chrome=['chromium','google-chrome','chromium-browser'].find(name=>cp.spawnSync('which',[name],{encoding:'utf8'}).status===0);
if(!chrome){console.log('SKIP: Chromium niedostępne — sprawdzono wyłącznie CSS i HTML.');process.exit(0)}
const sleep=t=>new Promise(r=>setTimeout(r,t));
const probe=`(() => {
  const root=document.scrollingElement,doc=document.documentElement;
  const last=document.querySelector('.s29-footer');
  const scene=document.querySelector('.s29-visual-panel');
  const strip=document.getElementById('stageStrip');
  const hr=document.getElementById('hrCanvas');
  const canvas=document.getElementById('s29StarCanvas');
  if(!last||!scene||!strip||!hr||!canvas||strip.children.length<3||!canvas.width||!hr.width)
   return {ready:false};
  const total=root.scrollHeight,view=root.clientHeight;
  const stripRect=strip.getBoundingClientRect(),sceneRect=scene.getBoundingClientRect();
  const before=root.scrollTop;
  root.scrollTop=total;
  return{
   ready:true,width:innerWidth,height:innerHeight,total,view,
   scrollable:total>view+20,
   bottomReached:root.scrollTop+view>=total-4&&last.getBoundingClientRect().bottom<=innerHeight+6,
   scrollMoved:root.scrollTop>before,
   noHorizontalOverflow:Math.max(doc.scrollWidth,document.body.scrollWidth)<=innerWidth+4,
   chips:strip.children.length,
   stripContained:stripRect.bottom<=sceneRect.bottom+5,
   canvasVisible:canvas.getBoundingClientRect().height>=300,
   htmlOverflow:getComputedStyle(doc).overflowY
  };
})()`;
async function run(){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'atlas-star29-headless-'));
 const proc=cp.spawn(chrome,[
  '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
  '--disable-background-networking','--no-first-run','--remote-debugging-port=0',
  '--user-data-dir='+path.join(dir,'profile'),'about:blank'
 ],{stdio:'ignore'});
 let socket;
 try{
  let port=0;
  for(let i=0;i<60;i++){
   try{port=Number(fs.readFileSync(path.join(dir,'profile','DevToolsActivePort'),'utf8').split('\n')[0]);if(port>0)break}catch(_){}
   await sleep(120);
  }
  assert.ok(port,'Nie udało się uruchomić portu Chromium DevTools');
  const tabs=await (await fetch('http://127.0.0.1:'+port+'/json')).json();
  const tab=tabs.find(t=>t.type==='page');
  assert.ok(tab?.webSocketDebuggerUrl,'Brak karty Chromium');
  socket=new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true})});
  const pending=new Map();let counter=0;
  socket.addEventListener('message',e=>{
   const response=JSON.parse(e.data),item=pending.get(response.id);
   if(!item)return;
   pending.delete(response.id);clearTimeout(item.timer);
   response.error?item.reject(new Error(response.error.message)):item.resolve(response.result);
  });
  const call=(method,params={})=>new Promise((resolve,reject)=>{
   const id=++counter;
   const timer=setTimeout(()=>{pending.delete(id);reject(new Error('CDP timeout '+method))},10000);
   pending.set(id,{resolve,reject,timer});
   socket.send(JSON.stringify({id,method,params}));
  });
  await call('Page.enable');await call('Runtime.enable');
  for(const [width,height] of [[1440,800],[1024,768],[390,844],[320,650]]){
   await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<=500});
   const nav=await call('Page.navigate',{url:'about:blank'});
   assert.ok(nav.frameId,'Nowa karta nie ma frameId');
   // Wstrzyknięcie całości HTML nie wymaga serwera ani internetowego dostępu
   // i działa również w środowiskach blokujących CDP file://.
   await call('Page.setDocumentContent',{frameId:nav.frameId,html});
   let result;
   for(let tries=0;tries<55;tries++){
    try{
     const value=await call('Runtime.evaluate',{expression:probe,returnByValue:true});
     if(value.result?.value?.ready){result=value.result.value;break}
    }catch(_){}
    await sleep(120);
   }
   assert.ok(result,'Nie można odczytać wymiarów układu '+width+'x'+height);
   assert.equal(result.width,width,'Chrome nie wymusił podanej szerokości viewportu');
   assert.ok(result.scrollable&&result.scrollMoved,'Brak pionowego przewijania '+JSON.stringify(result));
   assert.ok(result.bottomReached,'Nie można dotrzeć do stopki '+JSON.stringify(result));
   assert.ok(result.noHorizontalOverflow,'Poziomy overflow '+JSON.stringify(result));
   assert.ok(result.stripContained,'Kafelki faz poza panelem '+JSON.stringify(result));
   assert.ok(result.canvasVisible,'Animacja jest zbyt mała '+JSON.stringify(result));
   assert.ok(result.chips>=3,'Brak kart faz '+JSON.stringify(result));
   assert.equal(result.htmlOverflow,'scroll','Brak suwaka dokumentu');
   console.log('ATLAS 29 VIEWPORT OK',width+'x'+height,'scrollHeight='+result.total,'chips='+result.chips);
  }
 }finally{
  try{socket?.close()}catch(_){}
  proc.kill('SIGTERM');
  if(proc.exitCode===null)await Promise.race([new Promise(resolve=>proc.once('exit',resolve)),sleep(2500)]);
  await sleep(170);
  try{fs.rmSync(dir,{recursive:true,force:true,maxRetries:10,retryDelay:100})}
  catch(e){console.warn('Chromium cleanup:',e.message)}
 }
}
run().catch(e=>{console.error(e.stack||String(e));process.exitCode=1});
