/* ATLAS SOLARIS 27 · stage shell, full-page browser navigation. */
(() => {
'use strict';
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
if(kind==='stage'){
 const n=Number(id);if(n>1)links.push({path:data.stages[String(n-1).padStart(2,'0')].path,title:'← Poprzedni etap'});
 if(n<26)links.push({path:data.stages[String(n+1).padStart(2,'0')].path,title:'Następny etap →'});
 for(const extra of Object.values(data.bonuses).filter(x=>x.parent===n))links.push({path:extra.path,title:extra.title+' ↗'});
}else{links.push({path:data.stages[String(item.parent).padStart(2,'0')].path,title:'← Etap główny'})}
related.innerHTML=`<nav class="stage-related" aria-label="Powiązane doświadczenia">${links.map(x=>`<a href="${new URL(x.path,root).href}">${x.title}</a>`).join('')}</nav>`;
let settled=false;
function ready(){if(settled)return;settled=true;error.hidden=true;loader.classList.add('is-loaded');setTimeout(()=>{loader.hidden=true},500)}
function fail(message){if(settled)return;settled=true;loader.hidden=true;error.hidden=false;if(message)console.warn('[ATLAS portal]',message)}
const timeout=setTimeout(()=>fail('Laboratorium nie zgłosiło gotowości'),23000);
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
document.getElementById('stageReload').addEventListener('click',()=>{settled=false;error.hidden=true;loader.hidden=false;loader.classList.remove('is-loaded');iframe.src=new URL('atlas.html?portal='+encodeURIComponent(item.mode),root).href});
})();
