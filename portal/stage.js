/* ATLAS SOLARIS 27 · stage shell, full-page browser navigation. */
(() => {
'use strict';
// Wspólna nawigacja długich stron i stopka artykułów.
const readerUrl = document.currentScript && document.currentScript.src;
if (readerUrl && !document.querySelector('script[data-atlas-reader-ui]')) {
 const readerScript = document.createElement('script');
 readerScript.setAttribute('data-atlas-reader-ui', '');
 readerScript.src = new URL('reader-ui.js?v=1.2', readerUrl).href;
 document.head.appendChild(readerScript);
}
const data=window.ATLAS_PORTAL_DATA;
if(!data)return;
const kind=document.body.dataset.kind, id=document.body.dataset.route;
const item=kind==='bonus'?data.bonuses[id]:data.stages[id];
if(!item)return;
const root=new URL('../../',location.href);
const iframe=document.getElementById('stageFrame');
const loader=document.getElementById('stageLoading');
const info=document.getElementById('stageInfo');
const toggle=document.getElementById('stageAbout');
const related=document.getElementById('stageRelated');
const error=document.getElementById('stageError');
const close=()=>{info.hidden=true;toggle.setAttribute('aria-expanded','false')};
const open=()=>{info.hidden=false;toggle.setAttribute('aria-expanded','true')};
toggle.addEventListener('click',()=>info.hidden?open():close());
document.getElementById('stageInfoClose').addEventListener('click',close);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!info.hidden){e.preventDefault();close()}});
const links=[];
const orderedStageKeys=Object.keys(data.stages).sort((a,b)=>data.stages[a].number-data.stages[b].number);
if(kind==='stage'){
 const position=orderedStageKeys.indexOf(id);
 if(position>0){const prev=data.stages[orderedStageKeys[position-1]];links.push({path:prev.path,title:'← Poprzedni etap'})}
 if(position>=0 && position<orderedStageKeys.length-1){const next=data.stages[orderedStageKeys[position+1]];links.push({path:next.path,title:'Następny etap →'})}
 for(const extra of Object.values(data.bonuses).filter(x=>x.parent===item.number))links.push({path:extra.path,title:extra.title+' ↗'});
}else{links.push({path:data.stages[String(item.parent).padStart(2,'0')].path,title:'← Etap główny'})}
related.innerHTML=`<nav class="stage-related" aria-label="Powiązane doświadczenia">${links.map(x=>`<a href="${new URL(x.path,root).href}">${x.title}</a>`).join('')}</nav>`;
let settled=false;
function ready(){if(settled)return;settled=true;error.hidden=true;loader.classList.add('is-loaded');setTimeout(()=>{loader.hidden=true},500)}
function fail(message){if(settled)return;settled=true;loader.hidden=true;error.hidden=false;if(message)console.warn('[ATLAS portal]',message)}
// Editorial stages can defer laboratory startup; the most expensive 3D labs
// can additionally require explicit user activation (data-manual='true').
const lazyLab=!!(iframe&&iframe.dataset.lazy==='true');
const manualLab=!!(iframe&&iframe.dataset.manual==='true');
const stageSrc=iframe && iframe.dataset.src
 ? new URL(iframe.dataset.src,location.href).href
 : item.src ? new URL(item.src,root).href : new URL('atlas.html?portal='+encodeURIComponent(item.mode),root).href;
let timeout=null,started=false;
function startLab(){
 if(started||!iframe)return;
 started=true;
 const viewport=document.getElementById('stageViewport');if(viewport)viewport.classList.add('is-started');
 if(!iframe.getAttribute('src'))iframe.src=stageSrc;
 timeout=setTimeout(()=>fail('Laboratorium nie zgłosiło gotowości'),23000);
}
if(lazyLab){
 const launch=document.getElementById('stageLaunch');
 if(launch)launch.addEventListener('click',startLab);
 const target=document.getElementById('stageViewport');
 const stageStartLab=document.getElementById('stageStartLab');if(stageStartLab)stageStartLab.addEventListener('click',startLab);
 if(manualLab){ /* Reader chooses when the graphics processor starts. */ }
 else if('IntersectionObserver' in window && target){
  const observer=new IntersectionObserver(entries=>{
   if(entries.some(e=>e.isIntersecting)){observer.disconnect();startLab()}
  },{rootMargin:'120px 0px'});
  observer.observe(target);
 }else{
  const onScroll=()=>{if(target&&target.getBoundingClientRect().top<innerHeight+120){window.removeEventListener('scroll',onScroll);startLab()}};
  window.addEventListener('scroll',onScroll,{passive:true});onScroll();
 }
}else startLab();
window.addEventListener('message',event=>{
 if(event.source!==iframe.contentWindow)return;
 if(event.origin!==location.origin)return;
 const msg=event.data||{};
 if(!msg||typeof msg.type!=='string'||!msg.type.startsWith('atlas:portal:'))return;
 if(msg.type==='atlas:portal:ready'){clearTimeout(timeout);ready()}
 if(msg.type==='atlas:portal:error'){clearTimeout(timeout);fail(msg.message)}
 if(msg.type==='atlas:portal:closed')location.href=new URL('index.html#etapy',root).href;
 if(msg.type==='atlas:portal:navigate'){
  const target=typeof msg.path==='string'?msg.path:'';
  if(!/^(etapy\/\d\d\/|laboratoria\/[a-z-]+\/)$/u.test(target))return;
  location.href=new URL(target,root).href;
 }
});
iframe.addEventListener('load',()=>{
 // In rare cases the browser loads a pre-cached document before it posts ready.
 setTimeout(()=>{if(!settled){try{iframe.contentWindow.postMessage({type:'atlas:portal:ping'},location.origin)}catch(_){}}},1500);
});
document.getElementById('stageReload').addEventListener('click',()=>{
 clearTimeout(timeout);settled=false;started=true;
 error.hidden=true;loader.hidden=false;loader.classList.remove('is-loaded');
 const viewport=document.getElementById('stageViewport');if(viewport)viewport.classList.add('is-started');
 iframe.src=stageSrc;timeout=setTimeout(()=>fail('Laboratorium nie zgłosiło gotowości'),23000);
});
})();
