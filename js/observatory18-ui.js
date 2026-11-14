/**
 * ATLAS SOLARIS 18.0 — interactive observing planner and schematic eyepiece.
 * Uses the pre-existing surfacePoint/horizon/J2000 HYG data in app.js.
 */
(function(root){
'use strict';
const $=id=>document.getElementById(id);
const core=root.ATLAS_OBSERVATORY18_CORE;
const DAY=1,DEG=Math.PI/180,RAD=180/Math.PI;
const JD_MIN=Date.UTC(1800,0,1)/86400000+2440587.5;
const JD_MAX=Date.UTC(2050,11,30)/86400000+2440587.5;
const jdToDate=jd=>new Date((jd-2440587.5)*86400000);
const fmt=jd=>jdToDate(jd).toISOString().slice(11,16)+' UTC';
const fmtUTC=jd=>jdToDate(jd).toISOString().slice(0,16).replace('T',' ')+' UTC';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const label={
 moon:'Księżyc',mercury:'Merkury',venus:'Wenus',mars:'Mars',
 jupiter:'Jowisz',saturn:'Saturn',uranus:'Uran',neptune:'Neptun',earth:'Ziemia'
};
const palette={moon:'#d4e5f4',mercury:'#c4c1b9',venus:'#f2ddab',
 mars:'#ee9072',jupiter:'#e1b595',saturn:'#e4d2aa',uranus:'#97dfe1',
 neptune:'#658bd5',earth:'#77adfa',sun:'#ffdba6'};
const cities={
 gdansk:[54.352,18.646],warszawa:[52.23,21.012],krakow:[50.061,19.936],
 londyn:[51.507,-.128],luksor:[25.687,32.639],sydney:[-33.869,151.209]
};
function norm(v){return (v||'').toLocaleLowerCase('pl-PL').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').trim();}
function init(){
 const api=root.ATLAS_MAIN_API;
 if(!core||!api||!$('obs18Board'))return;
 const dialog=$('observatoryDialog'),chart=$('obs18Timeline'),scope=$('obs18Scope'),field=$('obs18Time');
 $('openObservatory18Side')?.addEventListener('click',()=>api.openObservatory());
 const state={anchorJD:null,plan:null,planKey:'',selected:'moon',lastContext:null,
  latest:null,lastDraw:-Infinity,opened:false,filter:'',busy:false,playing:false};
 const pos=()=>api.getObservatoryContext();
 const toNumber=(v,dp=1)=>Number.isFinite(v)?v.toFixed(dp).replace('.',','):'—';
 const mm=n=>Number.isFinite(n)?Math.round(n).toLocaleString('pl-PL'):'—';
 const bodyInfo=t=>t.kind==='star'?'Gwiazda katalogu HYG':'Układ Słoneczny';
 function setClock(jd){
  if(document.activeElement!==field)field.value=jdToDate(jd).toISOString().slice(0,16);
 }
 function setTime(jd,restart=false){
  const safe=clamp(jd,JD_MIN,JD_MAX);
  if(restart||!Number.isFinite(state.anchorJD)||state.anchorJD<JD_MIN||state.anchorJD>JD_MAX)
   state.anchorJD=safe;
  api.setObservatoryTime(safe);
  setClock(safe);
 }
 function keyOf(site){
  return [site.world,site.lat.toFixed(3),site.lon.toFixed(3),
    Number(state.anchorJD).toFixed(5)].join('/');
 }
 function sample(jd,site,full=false){
  return api.observatorySnapshot(jd,site.world,site.lat,site.lon,full);
 }
 function ensurePlan(site){
  if(!Number.isFinite(state.anchorJD))state.anchorJD=api.getJD();
  const key=keyOf(site);
  if(key===state.planKey&&state.plan)return false;
  state.planKey=key;
  state.plan=core.plan({
   startJD:state.anchorJD,hours:24,stepMinutes:20,
   sample:jd=>sample(jd,site)
  });
  return true;
 }
 function currentTarget(snapshot){
  return snapshot.targets.find(x=>x.id===state.selected)||
   snapshot.stars.find(x=>x.id===state.selected)||
   snapshot.bodies.find(x=>x.id===state.selected)||null;
 }
 function renderSummary(site,snapshot){
  const a=snapshot.sunAltitude;
  $('obs18SunAlt').textContent=toNumber(a)+'°';
  $('obs18MoonAlt').textContent=snapshot.moonAltitude===null?'Nie dotyczy':toNumber(snapshot.moonAltitude)+'°';
  $('obs18MoonPhase').textContent=site.world==='earth'?
   Math.round(snapshot.moonIllumination*100)+'%':'Z perspektywy Ziemi';
  $('obs18DarkBadge').textContent=(site.world==='earth'?
   core.instantDescription(a):(a<0?'SŁOŃCE POD HORYZONTEM':'SŁOŃCE NAD HORYZONTEM')).toLocaleUpperCase('pl-PL');
  $('obs18DarkBadge').dataset.mode=site.world==='earth'?core.darkness(a):(a<0?'night':'day');
  const dark=state.plan.astronomicalDarkHours,night=state.plan.hasAstronomicalNight;
  let detail;
  if(site.world!=='earth'){
   detail='Pokazujemy 24 godziny ziemskie w czasie UTC. Progi ziemskiego zmierzchu i oceny warunków są tu umowne: inna planeta może mieć inną atmosferę, a Księżyc nie ma jej praktycznie wcale.';
  }else if(!night){
   detail='W tym 24-godzinnym oknie nie występuje pełna noc astronomiczna (Słońce nie schodzi poniżej −18°). Obiekty można nadal rozpatrywać o zmierzchu.';
  }else{
   detail='Łącznie '+toNumber(dark,1)+' h nocy astronomicznej w oknie. Zmierzch zależy od wysokości środka Słońca; nie uwzględniono zachmurzenia ani zanieczyszczenia światłem.';
  }
  $('obs18NightSummary').textContent=detail;
 }
 function renderTargets(){
  const container=$('obs18Targets'),term=norm($('obs18Search').value);
  const all=state.plan?.targets||[];
  const found=all.filter(v=>!term||norm(v.name).includes(term)||norm(v.id).includes(term));
  const shown=found.slice(0,term?60:18);
  container.replaceChildren();
  if(!shown.length){container.textContent='Nie znaleziono obiektu w katalogu HYG / Układu Słonecznego.';return;}
  for(const item of shown){
   const b=document.createElement('button');b.type='button';
   b.className='obs18-target'+(state.selected===item.id?' active':'');
   b.setAttribute('aria-pressed',state.selected===item.id?'true':'false');
   const first=document.createElement('span');first.className='obs18-target-name';
   const name=document.createElement('b');name.textContent=item.name;
   const kind=document.createElement('small');kind.textContent=bodyInfo(item);
   first.append(name,kind);
   const right=document.createElement('span');right.className='obs18-target-time';
   const best=item.best;
   const at=document.createElement('b');at.textContent=best&&best.altitude>0?toNumber(best.altitude)+'° · '+fmt(best.jd):'Pod horyzontem';
   const score=document.createElement('small');
   const quality={ 'very-good':'Noc · wysoko',good:'Noc / zmierzch astronomiczny',
    'twilight-or-day':'Najlepiej w jasnym niebie',low:'Nisko',below:'Niewidoczny'};
   score.textContent=quality[item.quality]||item.quality;
   if(item.quality==='very-good'||item.quality==='good')score.className='obs18-quality-best';
   right.append(at,score);b.append(first,right);
   b.onclick=()=>{state.selected=item.id;renderTargets();drawChart();drawScope();};
   container.append(b);
  }
  if(!term&&all.length>shown.length){
   const extra=document.createElement('div');extra.className='obs18-list-more';
   extra.textContent='Więcej obiektów znajdziesz przez pole wyszukiwania.';container.append(extra);
  }
 }
 function chartProject(r,w,h){
  const start=state.plan.startJD,end=state.plan.endJD,dt=end-start;
  const L=37,R=w-13,T=12,B=h-27;
  return {x:L+(r.jd-start)/dt*(R-L),sunY:T+(90-r.sunAltitude)/120*(B-T),
   toY:alt=>T+(90-clamp(alt,-30,90))/120*(B-T),L,R,T,B};
 }
 function drawChart(){
  if(!state.plan)return;
  const cvs=chart,ctx=cvs.getContext('2d'),W=cvs.width,H=cvs.height;
  ctx.clearRect(0,0,W,H);
  const x0=chartProject(state.plan.records[0],W,H),left=x0.L,right=x0.R,top=x0.T,bottom=x0.B;
  ctx.fillStyle='#071a2a';ctx.fillRect(0,0,W,H);
  const rows=state.plan.records;
  for(let i=1;i<rows.length;i++){
   const a=chartProject(rows[i-1],W,H),b=chartProject(rows[i],W,H);
   const phase=rows[i-1].phase;
   ctx.fillStyle={day:'#385064',civil:'#34536a',nautical:'#203d5d',
    astronomical:'#122945',night:'#08162d'}[phase]||'#132a43';
   ctx.fillRect(a.x,top,Math.max(1,b.x-a.x),bottom-top);
  }
  ctx.font='11px system-ui';ctx.textAlign='right';ctx.lineWidth=.8;
  for(const alt of [-30,0,30,60,90]){
   const y=x0.toY(alt);ctx.strokeStyle=alt===0?'#d8dfe15c':'#abc3e226';
   ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(right,y);ctx.stroke();
   ctx.fillStyle='#7a9aac';ctx.fillText(alt+'°',left-5,y+3);
  }
  ctx.textAlign='center';
  for(let h=0;h<=24;h+=4){
   const x=left+(right-left)*h/24;
   ctx.fillStyle='#95bbc9';ctx.fillText(fmt(state.plan.startJD+h/24).slice(0,5),x,H-11);
  }
  function line(vals,color,width){
   ctx.beginPath();let active=false;
   for(let i=0;i<vals.length;i++){
    if(!Number.isFinite(vals[i])){active=false;continue;}
    const x=chartProject(rows[i],W,H).x,y=x0.toY(vals[i]);
    if(!active)ctx.moveTo(x,y);else ctx.lineTo(x,y);active=true;
   }
   ctx.lineWidth=width;ctx.strokeStyle=color;ctx.stroke();
  }
  line(rows.map(r=>r.sunAltitude),'#f4c789',2);
  line(rows.map(r=>r.moonAltitude),'#a7bed6',1.5);
  line(rows.map(r=>r.targets.find(t=>t.id===state.selected)?.altitude),'#76f2d1',2.9);
  const activeJD=api.getJD();
  if(activeJD>=state.plan.startJD&&activeJD<=state.plan.endJD){
   const x=left+(activeJD-state.plan.startJD)/(state.plan.endJD-state.plan.startJD)*(right-left);
   ctx.strokeStyle='#f1f4f7';ctx.lineWidth=1.3;
   ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x,bottom);ctx.stroke();
   ctx.fillStyle='#f1f4f7';ctx.beginPath();ctx.arc(x,top+3,3.4,0,7);ctx.fill();
  }
  ctx.fillStyle='#a7c3d3';ctx.font='10px system-ui';ctx.textAlign='left';
  ctx.fillText('Słońce',W-157,15);ctx.fillStyle='#f4c789';ctx.fillRect(W-168,8,7,7);
  ctx.fillStyle='#a7c3d3';ctx.fillText('Księżyc',W-90,15);ctx.fillStyle='#a7bed6';ctx.fillRect(W-100,8,7,7);
  ctx.fillStyle='#76f2d1';ctx.fillRect(W-20,8,7,7);
 }
 function angleTarget(t){
  const alt=t.altitude*DEG,az=t.azimuth*DEG,cos=Math.cos(alt);
  return [cos*Math.sin(az),cos*Math.cos(az),Math.sin(alt)];
 }
 function drawScope(){
  const site=pos(),now=api.getJD(),snapshot=sample(now,site,true);
  const selected=currentTarget(snapshot),ctx=scope.getContext('2d'),W=scope.width,H=scope.height,cx=W/2,cy=H/2;
  const radius=Math.min(H*.46,W*.36);
  const fov=Number($('obs18Fov').value)||1,pxPerDeg=radius*2/fov;
  ctx.clearRect(0,0,W,H);ctx.fillStyle='#06111e';ctx.fillRect(0,0,W,H);
  ctx.beginPath();ctx.arc(cx,cy,radius,0,7);
  ctx.fillStyle='#081522';ctx.fill();
  ctx.strokeStyle='#3a6575';ctx.lineWidth=2.3;ctx.stroke();
  if(!selected){
   $('obs18ScopeName').textContent='Wybierz obiekt';
   $('obs18ScopeNote').textContent='Nie znaleziono celu w lokalnej efemerydzie.';return;
  }
  $('obs18ScopeName').textContent=selected.name;
  $('obs18ScopeAlt').textContent='Wysokość '+toNumber(selected.altitude)+'°';
  $('obs18ScopeAz').textContent='Azymut '+toNumber(selected.azimuth)+'°';
  $('obs18ScopeSize').textContent=selected.kind==='star'?'Gwiazda punktowa':
   (selected.angularRadius ? 'Średnica '+toNumber(selected.angularRadius*2*RAD*3600,1)+'″':'Średnica —');
  const view=angleTarget(selected),az=selected.azimuth*DEG,alt=selected.altitude*DEG;
  const right=[Math.cos(az),-Math.sin(az),0];
  const up=[-Math.sin(alt)*Math.sin(az),-Math.sin(alt)*Math.cos(az),Math.cos(alt)];
  function project(item){
   const v=angleTarget(item),forward=dot(view,v);
   if(forward<=0)return null;
   const dx=Math.atan2(dot(v,right),forward)*RAD;
   const dy=Math.atan2(dot(v,up),forward)*RAD;
   const x=cx+dx*pxPerDeg,y=cy-dy*pxPerDeg;
   if((x-cx)**2+(y-cy)**2>radius**2)return null;
   return {x,y};
  }
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,radius-1,0,7);ctx.clip();
  ctx.strokeStyle='#41636e61';ctx.lineWidth=.7;
  ctx.beginPath();ctx.moveTo(cx-radius,cy);ctx.lineTo(cx+radius,cy);
  ctx.moveTo(cx,cy-radius);ctx.lineTo(cx,cy+radius);ctx.stroke();
  for(const st of snapshot.stars){
   if(st.id===selected.id||st.mag>3.5)continue;
   const p=project(st);if(!p)continue;
   const opacity=clamp(.95-.10*st.mag,.35,.95);
   ctx.fillStyle=st.bv<.35?'rgba(182,214,252,'+opacity+')':
    st.bv>1.2?'rgba(255,194,149,'+opacity+')':
    'rgba(240,239,229,'+opacity+')';
   ctx.beginPath();ctx.arc(p.x,p.y,clamp(2.8-st.mag*.33,.7,2.5),0,7);ctx.fill();
  }
  for(const body of snapshot.bodies){
   if(body.id==='sun')continue;
   const p=project(body);if(!p)continue;
   const radiusPx=clamp(body.angularRadius*RAD*pxPerDeg,.9,radius*3);
   if(radiusPx<.9)continue;
   ctx.fillStyle=palette[body.id]||'#c3d7e2';
   ctx.shadowBlur=body.id===selected.id?14:4;
   ctx.shadowColor=ctx.fillStyle;
   ctx.beginPath();ctx.arc(p.x,p.y,radiusPx,0,Math.PI*2);ctx.fill();
   ctx.shadowBlur=0;
   if(body.id==='saturn'&&radiusPx>4){
    ctx.strokeStyle='#e2c69d';ctx.lineWidth=clamp(radiusPx*.3,1,6);
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(-.25);
    ctx.beginPath();ctx.ellipse(0,0,radiusPx*2.1,radiusPx*.65,0,0,Math.PI*2);ctx.stroke();ctx.restore();
   }
  }
  if(selected.kind==='star'){
   const p=project(selected);
   if(p){
    ctx.fillStyle='#f9f4e7';ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=12;
    ctx.beginPath();ctx.arc(p.x,p.y,3.1,0,7);ctx.fill();ctx.shadowBlur=0;
   }
  }
  ctx.restore();
  ctx.fillStyle='#cbe1eb';ctx.font='12px system-ui';ctx.textAlign='center';
  ctx.fillText('POLE '+toNumber(fov,1)+'° · '+(selected.kind==='star'?'J2000 HYG':'POZYCJA GEOMETRYCZNA'),cx,H-17);
  ctx.fillStyle='#93b5c8';ctx.font='11px system-ui';
  ctx.fillText(fmtUTC(now),cx,19);
  const warning=selected.altitude<=0?'Obiekt znajduje się pod geometrycznym horyzontem. Zaznaczona tarcza to pozycja obliczona, nie widok rzeczywisty.':
    'Poglądowy okular: pozycje i rozmiary kątowe, bez optyki, seeingu, atmosfery i szczegółowych tekstur.';
  const sun=snapshot.bodies.find(b=>b.id==='sun');
  const sunAngle=sun?Math.acos(clamp(dot(view,angleTarget(sun)),-1,1))*RAD:180;
  const solarWarning=sunAngle<=fov/2+1?
   ' UWAGA: Słońce jest blisko pola widzenia! Nigdy nie kieruj teleskopu ani lornetki ku Słońcu bez certyfikowanego filtra.':'';

  $('obs18ScopeNote').textContent=warning+solarWarning+
   (selected.id==='saturn'?' Pierścienie Saturna są tu wyłącznie schematycznym symbolem.':'')+
   (snapshot.sunAltitude>0?' Trwa dzień; słabe gwiazdy nie będą widoczne gołym okiem.':'');
  $('obs18Point').disabled=selected.altitude<=0;
  const targetPlan=state.plan?.targets.find(p=>p.id===state.selected);
  $('obs18Best').disabled=!targetPlan?.best||targetPlan.best.altitude<=0;
 }
 let frameId=0,lastAnimationAt=0,lastCanvasAt=0,accumulatedSeconds=0;
 function pause(message='Animacja zatrzymana'){
  state.playing=false;
  if(frameId){cancelAnimationFrame(frameId);frameId=0;}
  lastAnimationAt=0;accumulatedSeconds=0;
  $('obs18Play').textContent='▶ Odtwórz noc';
  $('obs18Playback').textContent=message;
 }
 function frame(now){
  if(!state.playing||!dialog.open){pause();return;}
  if(!lastAnimationAt)lastAnimationAt=now;
  const dt=Math.max(0,Math.min(.25,(now-lastAnimationAt)/1000));
  lastAnimationAt=now;
  accumulatedSeconds+=dt*(Number($('obs18Speed').value)||1800);
  if(now-lastCanvasAt>=140){
   const start=state.plan?.startJD??api.getJD();
   const end=state.plan?.endJD??api.getJD();
   const next=Math.min(end,Math.max(start,api.getJD()+accumulatedSeconds/86400));
   accumulatedSeconds=0;lastCanvasAt=now;
   if(next>=end-1/8640000){
    setTime(end);pause('Zakończono 24 godziny symulacji.');return;
   }
   setTime(next);
   $('obs18Playback').textContent='Odtwarzanie · '+fmt(next);
  }
  frameId=requestAnimationFrame(frame);
 }
 function play(){
  if(!dialog.open||!state.plan)return;
  if(state.playing){pause();return;}
  const jd=api.getJD();
  if(jd<state.plan.startJD||jd>=state.plan.endJD)setTime(state.plan.startJD);
  state.playing=true;lastAnimationAt=0;lastCanvasAt=0;accumulatedSeconds=0;
  field.blur();
  $('obs18Play').textContent='Ⅱ Pauza';
  $('obs18Playback').textContent='Odtwarzanie · '+fmt(api.getJD());
  frameId=requestAnimationFrame(frame);
 }
 function onSkyDraw(){
  if(!dialog.open||state.busy)return;
  state.busy=true;
  try{
   const site=pos(),changed=ensurePlan(site);
   state.lastContext=site;
   const snap=sample(api.getJD(),site);
   state.latest=snap;
   if(!currentTarget(snap)){
    state.selected=snap.targets.find(t=>t.altitude>0)?.id||snap.targets[0]?.id||'';
    state.planKey='';
   }
   setClock(api.getJD());
   if(changed||state.selected==='')renderTargets();
   renderSummary(site,snap);
   drawChart();
   drawScope();
  }catch(error){
   console.error('ATLAS SOLARIS 18.0:',error);
   $('obs18NightSummary').textContent='Nie udało się przygotować planu obserwacji: '+String(error.message||error);
  }finally{state.busy=false;}
 }
 field.addEventListener('change',()=>{
  pause();
  const value=field.value;
  const date=new Date(value.endsWith('Z')?value:value+'Z');
  if(!Number.isFinite(date.getTime())||date.getUTCFullYear()<1800||date.getUTCFullYear()>2050){
   $('obs18NightSummary').textContent='Podaj prawidłowy moment UTC z zakresu modelu JPL 1800–2050.';
   return;
  }
  state.anchorJD=date.getTime()/86400000+2440587.5;
  setTime(state.anchorJD);
 });
 $('obs18Now').onclick=()=>{pause();state.anchorJD=Date.now()/86400000+2440587.5;setTime(state.anchorJD);};
 $('obs18Prev').onclick=()=>{pause();state.anchorJD=(state.anchorJD??api.getJD())-DAY;setTime(state.anchorJD);};
 $('obs18Next').onclick=()=>{pause();state.anchorJD=(state.anchorJD??api.getJD())+DAY;setTime(state.anchorJD);};
 $('obs18DarkJump').onclick=()=>{
  pause();
  const rows=state.plan?.records||[];
  if(!rows.length)return;
  const best=rows.reduce((a,b)=>b.sunAltitude<a.sunAltitude?b:a);
  setTime(best.jd);
 };
 $('obs18Play').onclick=play;
 $('obs18Preset').onchange=e=>{
  pause();
  const pair=cities[e.target.value];if(!pair)return;
  $('obsWorld').value='earth';
  $('obsLatitude').value=pair[0].toFixed(3);
  $('obsLongitude').value=pair[1].toFixed(3);
  api.redrawObservatory();
 };
 for(const id of ['obsLatitude','obsLongitude','obsWorld'])$(id).addEventListener('change',()=>{
  pause();
  const site=pos();const val=Object.entries(cities).find(([,p])=>
   site.world==='earth'&&Math.abs(p[0]-site.lat)<.01&&Math.abs(p[1]-site.lon)<.01);
  $('obs18Preset').value=val?val[0]:'manual';
 });
 $('obs18Search').oninput=()=>renderTargets();
 $('obs18Fov').onchange=drawScope;
 $('obs18Point').onclick=()=>{
  if(state.selected)api.pointObservatory(state.selected);
 };
 $('obs18Best').onclick=()=>{
  pause();
  const best=state.plan?.targets.find(t=>t.id===state.selected)?.best;
  if(best&&Number.isFinite(best.jd))setTime(best.jd);
 };
 chart.addEventListener('pointerdown',e=>{
  pause();
  if(!state.plan)return;
  const r=chart.getBoundingClientRect(),fraction=(e.clientX-r.left)/r.width;
  const L=37/chart.width,R=1-13/chart.width;
  const p=clamp((fraction-L)/(R-L),0,1);
  setTime(state.plan.startJD+p*(state.plan.endJD-state.plan.startJD));
 });
 chart.addEventListener('keydown',e=>{
  if(state.plan&&['ArrowLeft','ArrowRight'].includes(e.key))pause();
  if(!state.plan||!['ArrowLeft','ArrowRight'].includes(e.key))return;
  e.preventDefault();const delta=e.key==='ArrowRight'?20/1440:-20/1440;
  setTime(clamp(api.getJD()+delta,state.plan.startJD,state.plan.endJD));
 });
 dialog.addEventListener('close',()=>{state.opened=false;pause();});
 root.ATLAS_OBSERVATORY18=Object.freeze({onSkyDraw,refresh:()=>{state.planKey='';onSkyDraw();}});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
})(window);
