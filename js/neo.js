/* ATLAS SOLARIS 16.0 — Asteroidy, komety i bliskie spotkania z Ziemią
   Static NASA/JPL CAD snapshots refreshed server-side by GitHub Actions.
   Browser makes NO requests to NASA APIs (CORS/fair-use policy).
   3D trajectory: Sun-only two-body osculating Kepler ellipse, IAU76/80 J2000 ecliptic.
   NOT an accurate Earth encounter prediction; official close-approach distances
   are taken exclusively from the JPL CAD snapshot (including 3-sigma bounds).
   Educational local time/distance curve: straight-line constant-speed geometry,
   never called an ephemeris or probabilistic collision forecast. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const AU=149597870.7,LD=384400,RE=6371,JD1970=2440587.5,DEG=Math.PI/180,TAU=2*Math.PI;
const c=(x,lo,hi)=>Math.min(hi,Math.max(lo,x)),fmt=(n,d=2)=>Number(n).toLocaleString('pl-PL',{minimumFractionDigits:d,maximumFractionDigits:d});
const dateFromJD=jd=>new Date((jd-JD1970)*86400000);
const dateLabel=jd=>dateFromJD(jd).toLocaleDateString('pl-PL',{year:'numeric',month:'short',day:'numeric',timeZone:'UTC'});
const timeLabel=jd=>dateFromJD(jd).toLocaleString('pl-PL',{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'UTC'})+' (TDB≈UTC)';
const isComet=des=>/^(?:\d+P(?:\/|$)|[CPD]\/)/i.test(String(des).trim());
const SEC=86400;
const fallback={schema:1,mode:'documentation-example',generatedAt:null,
 source:'https://ssd-api.jpl.nasa.gov/doc/cad.html',
 notice:'Przykład oficjalnej dokumentacji JPL CAD v1.5, NIE aktualna prognoza.',
 rows:[{des:'99942',orbit_id:'206',jd:2462240.407091595,cd:'2029-Apr-13 21:46',dist:.000254099098170977,
 dist_min:.000254085852623379,dist_max:.000254112343772133,v_rel:7.42249308586014,
 v_inf:5.84135545611464,t_sigma_f:'< 00:01',h:19.7,diameter:.34,diameter_sigma:.04,fullname:'99942 Apophis (2004 MN4)'}]};
const defaults={schema:1,mode:'offline-reference',objects:{
 '99942':{des:'99942',name:'99942 Apophis',kind:'asteroid',epoch:2461200.5,equinox:'J2000',a:.922359,e:.191149,
 i:3.3410,om:203.8936,w:126.6796,ma:175.33040,moid:.000108,period:323.5553,soln_date:'2026-07-30',
 source:'https://neo.ssa.esa.int/search-for-asteroids?des=99942+Apophis&tab=orbprop'}
}};
const S={snapshot:fallback,orbitDB:defaults,selected:null,orbit:null,jd:2462240.407091595,
 playing:false,clockScale:60,offsetHours:0,priorPlaying:null,
 yaw:-.35,pitch:.64,zoom:1,showEarth:true,showOrbit:true,showLabels:true,
 type:'all',maxLD:30,search:'',ready:false,view:'solar',notice:'',manualDes:'99942'};
let raf=0,lastFrame=0,pointers=new Map(),drag=null,pinch=0;
function finite(n){const q=Number(n);return Number.isFinite(q)?q:null;}
function normalizeSnapshot(raw){
 if(!raw||raw.schema!==1||!['jpl-cad-snapshot','documentation-example'].includes(raw.mode)||!Array.isArray(raw.rows))throw Error('Nieznany format archiwum CAD.');
 const rows=raw.rows.slice(0,500).map(row=>{
  const r={...row};
  for(const k of ['jd','dist','dist_min','dist_max','v_rel','v_inf','h','diameter','diameter_sigma'])r[k]=r[k]===null||r[k]===undefined?null:finite(r[k]);
  r.des=String(r.des||'').trim().slice(0,45);
  r.fullname=String(r.fullname||r.des).trim().slice(0,140);
  return r;
 }).filter(r=>r.des&&Number.isFinite(r.jd)&&Number.isFinite(r.v_rel)&&r.v_rel>0&&r.dist>0&&r.dist_min>=0&&r.dist_max>=r.dist&&r.dist>=r.dist_min);
 rows.sort((a,b)=>a.jd-b.jd);
 if(!rows.length)throw Error('Brak poprawnych rekordów zbliżeń.');
 return {...raw,rows};
}
function normalizeOrbits(raw){
 const out={};
 for(const [des,item]of Object.entries(raw?.objects||{})){
  const keys=['epoch','a','e','i','om','w','ma'],v={...item};
  keys.forEach(k=>v[k]=finite(item[k]));
  if(keys.every(k=>v[k]!==null)&&v.a>0&&v.a<100&&v.e>=0&&v.e<1&&Math.abs(v.i)<=180){
   out[des]=v;
   out[String(v.des||des)]=v;
  }
 }
 return out;
}
async function loadSnapshot(){
 const fetchFile=async(path)=>{
  const res=await fetch(path,{cache:'no-store'});
  if(!res.ok)throw Error('HTTP '+res.status);
  return res.json();
 };
 let snapshot=fallback,orbits=defaults,closeOK=false,orbitOK=false;
 try{snapshot=normalizeSnapshot(await fetchFile('data/neo-close-approaches.json'));closeOK=true;}
 catch(e){S.notice='Nie udało się odczytać lokalnego archiwum zbliżeń: '+e.message+'. Pokazuję dokumentowany przykład Apophisa.';}
 try{orbits=await fetchFile('data/neo-orbits.json');orbitOK=true;}
 catch(e){S.notice+=(S.notice?' ':'')+'Brak pliku orbit; użyto orbitalnego przykładu Apophisa.';}
 S.snapshot=snapshot;S.orbitDB=orbits;S.orbitIndex=normalizeOrbits(orbits);
 S.ready=true;
 $('neoSourceState').textContent=snapshot.mode==='jpl-cad-snapshot'?'NASA/JPL · ZAPISANY ZESTAW':'PRZYKŁAD Z DOKUMENTACJI JPL · 2023';
 $('neoSourceDate').textContent=snapshot.generatedAt?new Date(snapshot.generatedAt).toLocaleString('pl-PL',{timeZone:'UTC'})+' UTC':'Brak bieżącej daty aktualizacji (przykład dokumentacyjny)';
 $('neoSourceCount').textContent=snapshot.rows.length+' rekordów'+(Number.isFinite(snapshot.total)?' / '+snapshot.total+' dopasowań':'');
 $('neoApiState').textContent=snapshot.mode==='jpl-cad-snapshot'
  ?'Odczyt zapisanej migawki NASA/JPL. Dane zmieniają się dopiero po udanej aktualizacji GitHub Actions.'
  :'Wstępny zestaw z przykładów dokumentacji JPL CAD v1.5. To nie jest lista dzisiejszych zbliżeń. Aby pobrać nowszą migawkę, uruchom workflow aktualizacji w repozytorium.';
 $('neoDataWarning').textContent=S.notice;
 refreshList();
 const start=snapshot.rows.find(x=>x.des==='99942')||snapshot.rows[0];
 selectEncounter(start);
 updateSavedOrbits();
 $('neoRefreshNote').textContent=closeOK&&orbitOK?'Pliki lokalne zostały odczytane.':S.notice;
}
function orbitalPosition(el,jd){
 if(!el||!(el.a>0)||!(el.e>=0&&el.e<1))return null;
 const a=el.a,e=el.e;
 const n=TAU/(365.2568983*Math.pow(a,1.5));
 let M=(el.ma*DEG+n*(jd-el.epoch))%TAU;
 if(M<0)M+=TAU;
 let E=M;
 for(let j=0;j<25;j++){
  const d=(E-e*Math.sin(E)-M)/(1-e*Math.cos(E));E-=d;
  if(Math.abs(d)<1e-13)break;
 }
 const x=a*(Math.cos(E)-e),y=a*Math.sqrt(1-e*e)*Math.sin(E);
 const O=el.om*DEG,i=el.i*DEG,w=el.w*DEG;
 const C=Math.cos,SN=Math.sin;
 return [
  x*(C(O)*C(w)-SN(O)*SN(w)*C(i))+y*(-C(O)*SN(w)-SN(O)*C(w)*C(i)),
  x*(SN(O)*C(w)+C(O)*SN(w)*C(i))+y*(-SN(O)*SN(w)+C(O)*C(w)*C(i)),
  x*(SN(w)*SN(i))+y*(C(w)*SN(i))
 ];
}
function pathPoints(el,count=220){
 if(!el)return [];
 const period=365.2568983*Math.pow(el.a,1.5);
 return Array.from({length:count+1},(_,i)=>orbitalPosition(el,el.epoch+period*i/count));
}
function sourceLabel(){
 const snap=S.snapshot;
 return snap.mode==='jpl-cad-snapshot'?'Migawka JPL / '+(snap.generatedAt?new Date(snap.generatedAt).toISOString().slice(0,10):'brak daty'):'Przykład z dokumentacji JPL CAD (nieaktualny zestaw)';
}
function setTimeOffset(h){
 S.offsetHours=c(h,-72,72);S.jd=S.selected.jd+S.offsetHours/24;
 sync();draw();
}
function selectEncounter(row){
 if(!row)return;
 S.playing=false;S.selected=row;S.manualDes=row.des;S.orbit=S.orbitIndex?.[row.des]||null;
 S.offsetHours=0;S.jd=row.jd;S.zoom=1;S.view='solar';
 $('neoView').value='solar';
 $('neoSelectedName').textContent=row.fullname;
 $('neoSelectedTime').textContent=timeLabel(row.jd);
 $('neoNoteProvenance').textContent='Dane tabelaryczne: '+sourceLabel()+'.';
 $('neoSourceLink').href='https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr='+encodeURIComponent(row.des);
 $('neoSelectedKind').textContent=isComet(row.des)?'KOMETA':'PLANETOID / ASTEROIDA';
 $('neoOrbitalState').textContent=S.orbit
  ?'Oskulacyjna elipsa dwuciałowa z elementów '+(S.orbit.soln_date||'określonej epoki')+'. Nie wyznacza rzeczywistej odległości podczas bliskiego przelotu.'
  :'Brak lokalnych elementów orbity tego ciała. Diagram Słońce–Ziemia nie pokazuje jego trajektorii. GitHub Actions może dołączyć orbitę przy następnej aktualizacji.';
 markSelected();sync();draw();
}
function pickOrbit(des){
 const item=S.orbitIndex?.[des];
 if(!item){$('neoOrbitalState').textContent='Brak lokalnych elementów '+des+'. Wybierz Apophis lub Bennu albo zaktualizuj orbity w GitHub Actions.';return;}
 S.orbit=item;S.manualDes=des;
 S.jd=c(S.jd,2451545,2469807);
 $('neoSelectedName').textContent=item.name;
 $('neoSelectedKind').textContent=item.kind==='comet'?'KOMETA':'ASTEROIDA';
 $('neoOrbitalState').textContent='Widok orbity: '+item.name+'; elementy z '+(item.soln_date||'archiwum JPL')+'. Jest to przybliżenie dwuciałowe, nie zweryfikowany bliski przelot.';
 draw();
}
function updateSavedOrbits(){
 const box=$('neoOrbitPresets');box.textContent='';
 const items=S.orbitIndex||{};
 const unique=new Set();
 for(const key of ['99942','101955','67P','1P',...Object.keys(items)]){
  const o=items[key];
  if(!o||unique.has(o.des))continue;unique.add(o.des);
  if(unique.size>20)break;
  const button=document.createElement('button');button.textContent=o.name||o.des;
  button.className='neo-mini';button.onclick=()=>pickOrbit(key);box.appendChild(button);
 }
}
function filteredRows(){
 const text=S.search.toLocaleLowerCase('pl-PL').trim();
 return S.snapshot.rows.filter(row=>{
  if(S.type==='comets'&&!isComet(row.des))return false;
  if(S.type==='asteroids'&&isComet(row.des))return false;
  if(row.dist*AU/LD>S.maxLD)return false;
  return !text||(row.fullname+' '+row.des).toLocaleLowerCase('pl-PL').includes(text);
 });
}
function refreshList(){
 const rows=filteredRows();const box=$('neoEvents');box.textContent='';
 $('neoFilterCount').textContent=rows.length+' z '+S.snapshot.rows.length+' zbliżeń';
 if(!rows.length){
  const p=document.createElement('p');p.className='neo-empty';p.textContent='Brak wyników dla tych filtrów i zapisanej migawki. Zmień zakres odległości lub wybierz inne dane.';box.appendChild(p);return;
 }
 rows.slice(0,100).forEach((r)=>{
  const el=document.createElement('button');el.className='neo-event';
  const title=document.createElement('strong');title.textContent=r.fullname;
  const date=document.createElement('time');date.textContent=dateLabel(r.jd);
  const info=document.createElement('small');info.textContent=fmt(r.dist*AU/LD,2)+' LD · '+fmt(r.v_rel,2)+' km/s';
  el.append(title,date,info);el.onclick=()=>selectEncounter(r);el.dataset.neoDes=r.des;box.appendChild(el);
 });
 markSelected();
}
function markSelected(){
 document.querySelectorAll('[data-neo-des]').forEach(el=>el.classList.toggle('active',el.dataset.neoDes===S.selected?.des));
}
function normalizeValue(n,d=2,suffix=''){return Number.isFinite(n)?fmt(n,d)+suffix:'brak danych';}
function sync(){
 const r=S.selected;if(!r)return;
 const dist=r.dist*AU,dMin=r.dist_min*AU,dMax=r.dist_max*AU;
 const values={
  neoNominal:fmt(dist,0)+' km',neoLD:fmt(dist/LD,3)+' LD',
  neoMin:fmt(dMin,0)+' km',neoMax:fmt(dMax,0)+' km',
  neoVrel:fmt(r.v_rel,3)+' km/s',neoVinf:normalizeValue(r.v_inf,3,' km/s'),
  neoTimeUnc:r.t_sigma_f||'brak',neoDiameter:r.diameter!==null?fmt(r.diameter*1000,0)+' m':'brak pewnego pomiaru',
  neoH:normalizeValue(r.h,2,' mag'),
  neoUncWidth:fmt(dMax-dMin,2)+' km',neoAlt:fmt(dist-RE,0)+' km',
  neoOrbitMoid:S.orbit&&S.orbit.moid!==null?normalizeValue(Number(S.orbit.moid),6,' AU'):'brak danych',
  neoOrbitEpoch:S.orbit?dateLabel(S.orbit.epoch):'brak danych',
  neoTimeLabel:timeLabel(S.jd),
  neoOffsetLabel:(S.offsetHours>0?'+':'')+fmt(S.offsetHours,1)+' h',
  neoMotionLabel:S.playing?'ODTWARZANIE':'PAUZA'
 };
 for(const [key,value]of Object.entries(values))$(key).textContent=value;
 $('neoOffset').value=String(S.offsetHours);
 $('neoPlay').textContent=S.playing?'Ⅱ Pauza':'▶ Odtwórz przelot';
 $('neoProximityNote').textContent='Dane z JPL: najbliższa odległość względem ŚRODKA Ziemi wynosi '+fmt(dist,0)+' km. 3σ przedział dystansu: '+fmt(dMin,0)+'–'+fmt(dMax,0)+' km. Tego nie przeliczamy z poglądowej orbity.';
 const v=r.v_rel*3600*Math.abs(S.offsetHours),approx=Math.hypot(dist,v);
 $('neoModelDist').textContent=fmt(approx,0)+' km';
 $('neoModelCaution').textContent='MODEL POGLĄDOWY w stałej prędkości '+fmt(r.v_rel,2)+' km/s (r = √[d₀² + (v·t)²]), nie pozycja z Horizons. Ustawienie 0 h oznacza faktyczny moment minimum według zapisanej tabeli JPL.';
}
function drawArrow(ctx,x1,y1,x2,y2,color){
 ctx.strokeStyle=color;ctx.lineWidth=2;
 ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
 const a=Math.atan2(y2-y1,x2-x1);
 ctx.fillStyle=color;ctx.beginPath();
 ctx.moveTo(x2,y2);ctx.lineTo(x2-7*Math.cos(a-.45),y2-7*Math.sin(a-.45));ctx.lineTo(x2-7*Math.cos(a+.45),y2-7*Math.sin(a+.45));ctx.closePath();ctx.fill();
}
function sizes(canvas,wHint=750,hHint=420){
 const w=Math.max(260,canvas.clientWidth||wHint),h=Math.max(190,canvas.clientHeight||hHint),dpi=Math.min(2,window.devicePixelRatio||1);
 if(canvas.width!==Math.round(w*dpi)||canvas.height!==Math.round(h*dpi)){
  canvas.width=Math.round(w*dpi);canvas.height=Math.round(h*dpi);
 }
 const ctx=canvas.getContext('2d');if(!ctx)return null;
 ctx.setTransform(dpi,0,0,dpi,0,0);return {ctx,w,h};
}
function layout(){
 const canvas=$('neoOrbitCanvas'),w=Math.max(260,canvas.clientWidth||820),h=Math.max(200,canvas.clientHeight||420);
 const a=S.orbit?.a||1;
 const range=Math.max(1.35,a*(1+S.orbit?.e||1.5)*1.12,1.5);
 return {w,h,scale:Math.min(w*.43,h*.42)/range*S.zoom,cx:w*.49,cy:h*.53};
}
function project(v,l){
 const yaw=S.yaw,pitch=S.pitch;
 const xx=v[0]*Math.cos(yaw)-v[1]*Math.sin(yaw);
 const yy=v[0]*Math.sin(yaw)+v[1]*Math.cos(yaw);
 const zz=yy*Math.cos(pitch)+v[2]*Math.sin(pitch);
 return [l.cx+xx*l.scale,l.cy-zz*l.scale];
}
function path(ctx,pts,color,width=1.5,dash=[]){
 if(pts.length<2)return;
 ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));
 ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([]);
}
function drawOrbit(){
 const canvas=$('neoOrbitCanvas');if(!canvas||!S.selected)return;
 const d=sizes(canvas,820,420);if(!d)return;const {ctx,w,h}=d,l=layout();
 const bg=ctx.createRadialGradient(l.cx,l.cy,10,l.cx,l.cy,Math.max(w,h));
 bg.addColorStop(0,'#10273e');bg.addColorStop(.6,'#061728');bg.addColorStop(1,'#020914');
 ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
 for(let j=0;j<110;j++){const x=(j*111.771+37)%w,y=(j*91.89+27)%h;ctx.fillStyle=j%8?'#accce23d':'#d2eef4a0';ctx.fillRect(x,y,1,1);}
 // Reference Earth orbit is a circle, not an ephemeris; Earth marker comes from approximate JPL positions.
 const earthOrbit=Array.from({length:180},(_,i)=>project([Math.cos(i/179*TAU),Math.sin(i/179*TAU),0],l));
 path(ctx,earthOrbit,'#3f8fb47e',1.3);
 const sun=project([0,0,0],l),gradient=ctx.createRadialGradient(...sun,1,...sun,26);
 gradient.addColorStop(0,'#fff5cb');gradient.addColorStop(.26,'#f6c77e');gradient.addColorStop(1,'#e7a76000');
 ctx.fillStyle=gradient;ctx.beginPath();ctx.arc(...sun,26,0,TAU);ctx.fill();
 ctx.fillStyle='#ffe1a4';ctx.beginPath();ctx.arc(...sun,5,0,TAU);ctx.fill();
 if(S.showLabels){ctx.fillStyle='#d6c5a5';ctx.font='11px system-ui';ctx.fillText('Słońce',sun[0]+11,sun[1]-9);}
 if(S.orbit&&S.showOrbit){
  const bodyPath=pathPoints(S.orbit,240).filter(Boolean).map(v=>project(v,l));
  path(ctx,bodyPath,S.orbit.kind==='comet'?'#ad97eb':'#74d1c6',2.15);
 }
 let earth=null;
 try{earth=window.ATLAS_MAIN_API.positions(S.jd).earth;}catch(_){}
 if(earth&&S.showEarth){
  const e=project(earth,l);
  ctx.fillStyle='#83c8f3';ctx.shadowColor='#83c8f3';ctx.shadowBlur=9;ctx.beginPath();ctx.arc(...e,5,0,TAU);ctx.fill();ctx.shadowBlur=0;
  if(S.showLabels){ctx.fillStyle='#c1e4f5';ctx.font='11px system-ui';ctx.fillText('Ziemia',e[0]+8,e[1]-8);}
 }
 const v=S.orbit?orbitalPosition(S.orbit,S.jd):null;
 if(v){
  const p=project(v,l);ctx.fillStyle='#f7fbef';ctx.shadowColor='#a0ffe9';ctx.shadowBlur=15;
  ctx.beginPath();ctx.arc(...p,5,0,TAU);ctx.fill();ctx.shadowBlur=0;
  ctx.strokeStyle='#b3f5e4';ctx.lineWidth=1.3;ctx.beginPath();ctx.arc(...p,11,0,TAU);ctx.stroke();
  if(S.showLabels){ctx.fillStyle='#cdf7e8';ctx.font='11px system-ui';ctx.fillText(S.orbit.name,p[0]+12,p[1]-11);}
 }else{
  ctx.fillStyle='#d5eaf8';ctx.font='13px system-ui';ctx.textAlign='center';
  ctx.fillText('Brak orbitalnych elementów tego obiektu w lokalnym archiwum.',w/2,h*.24);
  ctx.textAlign='left';
 }
 ctx.fillStyle='#85a7bb';ctx.font='10px system-ui';
 ctx.fillText('HELiOCENTRYCZNY MODEL DWUCIAŁOWY · NIE LICZY DOKŁADNEGO ZBLIŻENIA',11,h-13);
}
function drawClose(){
 const canvas=$('neoCloseCanvas');if(!canvas||!S.selected)return;
 const o=sizes(canvas,600,220);if(!o)return;const {ctx,w,h}=o;
 const r=S.selected,r0=r.dist*AU,v=r.v_rel,span=24,baseline=1;
 ctx.fillStyle='#091a2d';ctx.fillRect(0,0,w,h);
 const pl=56,pr=16,pt=22,pb=36,fw=w-pl-pr,fh=h-pt-pb;
 const max=Math.hypot(r0,24*3600*v)*1.1;
 const x=t=>pl+(t+24)/48*fw,y=km=>pt+fh-(km/max)*fh;
 ctx.strokeStyle='#4e708955';ctx.strokeRect(pl,pt,fw,fh);
 ctx.fillStyle='#96b7c6';ctx.font='10px system-ui';ctx.textAlign='center';
 for(let i=0;i<=4;i++){
  const t=-24+i*12,xx=x(t);ctx.fillText(String(t)+' h',xx,h-14);
  ctx.beginPath();ctx.moveTo(xx,pt);ctx.lineTo(xx,pt+fh);ctx.strokeStyle='#7497a51c';ctx.stroke();
 }
 ctx.textAlign='right';
 for(let i=0;i<=3;i++){
  const km=max*i/3,yy=y(km);ctx.fillStyle='#9bb9c8';ctx.fillText(fmt(km/1000,0)+' tys.',pl-6,yy+3);
  ctx.beginPath();ctx.moveTo(pl,yy);ctx.lineTo(pl+fw,yy);ctx.strokeStyle='#7497a51c';ctx.stroke();
 }
 ctx.beginPath();
 for(let i=0;i<=240;i++){
  const t=-24+i/240*48,km=Math.hypot(r0,v*t*3600),xx=x(t),yy=y(km);
  i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);
 }
 ctx.strokeStyle='#80e0d3';ctx.lineWidth=2.7;ctx.stroke();
 const xx=x(c(S.offsetHours,-24,24)),yy=y(Math.hypot(r0,v*c(S.offsetHours,-24,24)*3600));
 ctx.strokeStyle='#ffffff87';ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(xx,pt);ctx.lineTo(xx,pt+fh);ctx.stroke();ctx.setLineDash([]);
 ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(xx,yy,4,0,TAU);ctx.fill();
 const a=y(r.dist_min*AU),b=y(r.dist_max*AU);
 ctx.strokeStyle='#f3bc95';ctx.lineWidth=2;
 ctx.beginPath();ctx.moveTo(x(0),a);ctx.lineTo(x(0),b);ctx.stroke();
 ctx.fillStyle='#bfe8df';ctx.textAlign='left';ctx.font='700 10px system-ui';ctx.fillText('MODEL GEOMETRYCZNY PRZELOTU, NIE EFEMERYDA',pl+6,pt+14);
}
function draw(){if(!$('neoDialog')?.open)return;drawOrbit();drawClose();}
function playFrame(now){
 raf=0;if(!$('neoDialog')?.open)return;
 const dt=lastFrame?c((now-lastFrame)/1000,0,.085):0;lastFrame=now;
 if(S.playing){
  S.offsetHours=c(S.offsetHours+dt*S.clockScale,-72,72);
  if(S.offsetHours>=72)S.playing=false;
  S.jd=S.selected.jd+S.offsetHours/24;
  sync();
 }
 draw();
 raf=requestAnimationFrame(playFrame);
}
function show(){
 const dlg=$('neoDialog');if(!dlg||dlg.open)return;
 S.priorPlaying=window.ATLAS_MAIN_API?.getPlaying?.()??null;
 window.ATLAS_MAIN_API?.setPlaying?.(false);dlg.showModal();lastFrame=0;
 if(!S.ready)loadSnapshot().catch(e=>{$('neoDataWarning').textContent=String(e);});
 else{sync();draw();}
 if(!raf)raf=requestAnimationFrame(playFrame);
}
function close(){S.playing=false;$('neoDialog').close();}
function downloadCSV(){
 const rows=S.snapshot.rows;const keys=['des','jd','cd','dist','dist_min','dist_max','v_rel','v_inf','t_sigma_f','h','diameter','diameter_sigma','fullname'];
 const lines=['# ATLAS SOLARIS 16: '+sourceLabel(),'# 3-sigma distance bounds, NOT collision probability',keys.join(';'),
  ...rows.map(row=>keys.map(k=>String(row[k]??'').replaceAll(';',',')).join(';'))].join('\r\n');
 const blob=new Blob(['\uFEFF'+lines],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='ATLAS_SOLARIS_16_zblizenia_JPL.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1800);
}
function init(){
 if(!$('neoDialog'))return;
 $('openNeo').onclick=show;$('openNeoSide').onclick=show;$('neoClose').onclick=close;
 $('neoDialog').addEventListener('close',()=>{
  S.playing=false;if(raf){cancelAnimationFrame(raf);raf=0;}lastFrame=0;
  if(S.priorPlaying!==null)window.ATLAS_MAIN_API?.setPlaying?.(S.priorPlaying);
  S.priorPlaying=null;
 });
 $('neoSearch').oninput=()=>{S.search=$('neoSearch').value;refreshList();};
 $('neoType').onchange=()=>{S.type=$('neoType').value;refreshList();};
 $('neoDistanceFilter').onchange=()=>{S.maxLD=Number($('neoDistanceFilter').value)||30;refreshList();};
 $('neoOffset').oninput=()=>{S.playing=false;setTimeOffset(Number($('neoOffset').value));};
 $('neoPlay').onclick=()=>{if(S.offsetHours>=72)setTimeOffset(-72);S.playing=!S.playing;sync();};
 $('neoReset').onclick=()=>{S.playing=false;setTimeOffset(0);};
 $('neoClockSpeed').onchange=()=>{S.clockScale=Number($('neoClockSpeed').value)||60;};
 $('neoShowEarth').onchange=()=>{S.showEarth=$('neoShowEarth').checked;draw();};
 $('neoShowOrbit').onchange=()=>{S.showOrbit=$('neoShowOrbit').checked;draw();};
 $('neoShowLabels').onchange=()=>{S.showLabels=$('neoShowLabels').checked;draw();};
 $('neoCenter').onclick=()=>{S.yaw=-.35;S.pitch=.64;S.zoom=1;draw();};
 $('neoCsv').onclick=downloadCSV;
 for(const [button,des]of [['neoApophis','99942'],['neoBennu','101955'],['neo67P','67P'],['neoHalley','1P']]){
  $(button).onclick=()=>pickOrbit(des);
 }
 const cv=$('neoOrbitCanvas');
 cv.addEventListener('wheel',e=>{e.preventDefault();S.zoom=c(S.zoom*(e.deltaY>0?.88:1.12),.3,15);draw();},{passive:false});
 cv.addEventListener('pointerdown',e=>{
  cv.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  drag={x:e.clientX,y:e.clientY,yaw:S.yaw,pitch:S.pitch};
  if(pointers.size===2){const v=[...pointers.values()];pinch=Math.hypot(v[0].x-v[1].x,v[0].y-v[1].y);}
 });
 cv.addEventListener('pointermove',e=>{
  if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pointers.size>=2){const v=[...pointers.values()],q=Math.hypot(v[0].x-v[1].x,v[0].y-v[1].y);if(pinch>0)S.zoom=c(S.zoom*q/pinch,.3,15);pinch=q;}
  else if(drag){S.yaw=drag.yaw+(e.clientX-drag.x)*.008;S.pitch=c(drag.pitch+(e.clientY-drag.y)*.006,-1.56,1.56);}
  draw();
 });
 const stop=e=>{pointers.delete(e.pointerId);drag=null;pinch=0;};
 cv.addEventListener('pointerup',stop);cv.addEventListener('pointercancel',stop);
 window.addEventListener('resize',draw);
 window.ATLAS_NEO_TEST={S,normalizeSnapshot,normalizeOrbits,orbitalPosition,pathPoints,filteredRows,selectEncounter,setTimeOffset,loadSnapshot,show,fallback,defaults,isComet};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();