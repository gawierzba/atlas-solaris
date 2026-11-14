/**
 * Etap 29 — regresja układu: suwak przewijania, dostęp do wykresu HR,
 * czytelność układu na laptopie, tablecie i telefonie.
 * Chromium uruchamiane bez npm; pliki CSS/JS pochodzą z repozytorium.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const css=read('portal/star29.css'),js=read('portal/star29.js');
const source=read('laboratoria/ewolucja-gwiazdy/index.html');
assert.ok(css.includes('overflow-y:scroll'),'Brak pionowego przewijania dokumentu etapu 29');
assert.ok(!css.includes('body{overflow:hidden}'),'Regresja: body nie może blokować przewijania');
assert.match(css,/position:static;display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
assert.match(source,/id="hrCanvas"/);
assert.match(source,/id="lifeRange"/);
const chrome=['chromium','google-chrome','chromium-browser'].find(x=>cp.spawnSync('which',[x],{encoding:'utf8'}).status===0);
if(!chrome){console.log('SKIP: Chromium niedostępne; podstawowe reguły CSS i elementy DOM są sprawdzone');process.exit(0);}
const verify=`
(function(){
 const stamp=()=>{
  try{
   const doc=document.documentElement, root=document.scrollingElement;
   const canvas=document.getElementById('s29StarCanvas');
   const scene=document.querySelector('.s29-visual-panel');
   const strip=document.querySelector('.s29-stage-strip');
   const last=document.querySelector('.s29-footer');
   const hr=document.getElementById('hrCanvas');
   const controls=document.getElementById('lifeRange');
   const pw=window.innerWidth,ph=window.innerHeight;
   const total=root.scrollHeight, firstTop=root.scrollTop;
   const stripRect=strip.getBoundingClientRect(),sceneRect=scene.getBoundingClientRect();
   const chipCount=strip.children.length;
   root.scrollTop=root.scrollHeight;
   const atBottom=root.scrollTop+root.clientHeight >= root.scrollHeight-3;
   const footerReachable=last.getBoundingClientRect().bottom<=ph+6;
   const htmlWidth=doc.scrollWidth;
   const bodyWidth=document.body.scrollWidth;
   const style=getComputedStyle(document.body);
   const report={
    width:pw,height:ph,total,visible:root.clientHeight,
    scrollPossible:total>root.clientHeight+20,
    canReachBottom:atBottom&&footerReachable,
    noHorizontalOverflow:Math.max(htmlWidth,bodyWidth)<=pw+5,
    controlsExist:!!controls&&!!hr&&hr.height>0&&canvas.height>0,
    stageChips:chipCount,
    stripContained:stripRect.bottom<=sceneRect.bottom+5,
    bodyOverflow:style.overflowY,
    scrollMoved:root.scrollTop>firstTop
   };
   document.body.setAttribute('data-star29-layout',encodeURIComponent(JSON.stringify(report)));
  }catch(e){
   document.body.setAttribute('data-star29-layout',encodeURIComponent(JSON.stringify({error:String(e)})));
  }
 };
 if(document.readyState==='complete')requestAnimationFrame(()=>requestAnimationFrame(stamp));
 else window.addEventListener('load',()=>requestAnimationFrame(()=>requestAnimationFrame(stamp)),{once:true});
})();
`;
const html=source
 .replace('<link rel="stylesheet" href="../../portal/star29.css">','<style>'+css+'</style>')
 .replace('<script src="../../portal/star29.js"></script>','<script>'+js+'</script>')
 .replace('</body>','<script>'+verify+'</script></body>');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'atlas-star29-layout-'));
const filepath=path.join(dir,'index.html');fs.writeFileSync(filepath,html);
const uri='file://'+filepath;
try{
 for(const [width,height] of [[1440,800],[1024,768]]){
  const result=cp.spawnSync(chrome,[
    '--headless=new','--disable-gpu','--no-sandbox','--disable-dev-shm-usage','--hide-scrollbars=false',
    '--disable-background-networking','--disable-features=Translate',
    '--window-size='+width+','+height,'--virtual-time-budget=1800','--dump-dom',uri
  ],{encoding:'utf8',timeout:25000,maxBuffer:4*1024*1024});
  assert.equal(result.status,0,'Chromium błąd dla '+width+'x'+height+': '+(result.stderr||'').slice(-550));
  const match=(result.stdout||'').match(/data-star29-layout="([^"]+)"/);
  assert.ok(match,'Chromium nie przekazał wyników DOM '+width+'x'+height);
  const r=JSON.parse(decodeURIComponent(match[1]));
  if(r.error)throw Error(r.error);
  assert.ok(r.scrollPossible,'Brak możliwości pionowego przewijania '+width+'x'+height+': '+JSON.stringify(r));
  assert.ok(r.canReachBottom,'Stopka i wykres HR są ucięte przy '+width+'x'+height+': '+JSON.stringify(r));
  assert.ok(r.noHorizontalOverflow,'Strona wymaga przewijania poziomego '+width+'x'+height+': '+JSON.stringify(r));
  assert.ok(r.controlsExist,'Brakuje interaktywnych elementów '+width+'x'+height+': '+JSON.stringify(r));
  assert.ok(r.stripContained,'Kafelki etapów nie mieszczą się w panelu '+width+'x'+height+': '+JSON.stringify(r));
  assert.ok(r.stageChips>=3,'Brak kafelków faz gwiazdy '+width+'x'+height+': '+JSON.stringify(r));
  console.log('ATLAS 29 UI OK',width+'x'+height,'viewport='+r.width+'x'+r.height,'document='+r.total,'chips='+r.stageChips);
 }
}finally{fs.rmSync(dir,{recursive:true,force:true})}


/* Chromium wymusza minimalne okno 500px w trybie --window-size.
   Dla rzeczywistych 390/320 CSS px używamy protokołu Chrome DevTools. */
async function testMobileViewports(){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'atlas-star29-cdp-'));
 const page=path.join(dir,'index.html');
 fs.writeFileSync(page,html);
 const proc=cp.spawn(chrome,[
  '--headless=new','--disable-gpu','--no-sandbox','--disable-dev-shm-usage',
  '--disable-background-networking','--no-first-run','--remote-debugging-port=0',
  '--user-data-dir='+path.join(dir,'profile'),'about:blank'
 ],{stdio:'ignore'});
 const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 let socket;
 try{
  let port=0;
  for(let i=0;i<55;i++){
   try{
    port=Number(fs.readFileSync(path.join(dir,'profile/DevToolsActivePort'),'utf8').split('\n')[0]);
    if(port>0)break;
   }catch(_){}
   await sleep(130);
  }
  assert.ok(port,'Chromium nie uruchomił portu diagnostycznego DevTools');
  const pages=await (await fetch('http://127.0.0.1:'+port+'/json')).json();
  const tab=pages.find(x=>x.type==='page');
  assert.ok(tab?.webSocketDebuggerUrl,'Brak karty Chromium do testów mobilnych');
  socket=new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{
   socket.addEventListener('open',resolve,{once:true});
   socket.addEventListener('error',reject,{once:true});
  });
  let sequence=0;
  const pending=new Map();
  socket.addEventListener('message',e=>{
   const msg=JSON.parse(e.data);
   if(!pending.has(msg.id))return;
   const item=pending.get(msg.id);pending.delete(msg.id);
   msg.error?item.reject(new Error(msg.error.message)):item.resolve(msg.result);
  });
  const call=(method,params={})=>new Promise((resolve,reject)=>{
   const id=++sequence;
   pending.set(id,{resolve,reject});
   socket.send(JSON.stringify({id,method,params}));
  });
  await call('Page.enable');
  await call('Runtime.enable');
  const script=`(()=>{
   const root=document.scrollingElement,doc=document.documentElement;
   const last=document.querySelector('.s29-footer'),scene=document.querySelector('.s29-visual-panel');
   const strip=document.getElementById('stageStrip');
   if(!last||!scene||!strip)return{ready:false};
   if(!document.getElementById('massRange')||!document.getElementById('hrCanvas')||strip.children.length<3)return{ready:false};
   const total=root.scrollHeight,view=root.clientHeight;
   const stripBottom=strip.getBoundingClientRect().bottom,sceneBottom=scene.getBoundingClientRect().bottom;
   root.scrollTop=total;
   return{
    ready:true,width:innerWidth,height:innerHeight,total,view,chipCount:strip.children.length,
    scrollable:total>view+20,
    bottomReached:root.scrollTop+view>=total-3&&last.getBoundingClientRect().bottom<=innerHeight+5,
    noHorizontalOverflow:Math.max(doc.scrollWidth,document.body.scrollWidth)<=innerWidth+5,
    stripContained:stripBottom<=sceneBottom+5
   };
  })()`;
  for(const [width,height] of [[390,844],[320,650]]){
   await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});
   await call('Page.navigate',{url:'file://'+page});
   let result;
   for(let i=0;i<45;i++){
    const response=await call('Runtime.evaluate',{expression:script,returnByValue:true});
    if(response.result?.value?.ready){result=response.result.value;break}
    await sleep(130);
   }
   assert.ok(result,'Nie udało się wczytać mobilnego laboratorium: '+width+'px');
   assert.equal(result.width,width,'Nie udało się wymusić prawdziwej szerokości mobile viewport');
   assert.ok(result.scrollable,'Brak przewijania na telefonie: '+JSON.stringify(result));
   assert.ok(result.bottomReached,'Nie można dotrzeć do stopki na telefonie: '+JSON.stringify(result));
   assert.ok(result.noHorizontalOverflow,'Poziomy wyciek układu na telefonie: '+JSON.stringify(result));
   assert.ok(result.stripContained,'Kafelki faz wychodzą poza panel: '+JSON.stringify(result));
   console.log('ATLAS 29 MOBILE OK',width+'x'+height,'document='+result.total,'chips='+result.chipCount);
  }
 }finally{
  try{socket?.close()}catch(_){}
  proc.kill('SIGTERM');
  await new Promise(resolve=>proc.once('exit',resolve));
  fs.rmSync(dir,{recursive:true,force:true,maxRetries:8,retryDelay:100});
 }
}
testMobileViewports().catch(e=>{console.error(e.stack||e);process.exitCode=1});
