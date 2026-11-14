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
 for(const [width,height] of [[1440,800],[1024,768],[390,844],[320,650]]){
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
