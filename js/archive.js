/* ATLAS SOLARIS 14.0 — Archiwum Misji Kosmicznych
   Voyager 1, Voyager 2, Cassini: NASA/JPL Horizons ecliptic J2000 sampled vectors.
   Built-in data: js/mission-tracks.js, original source documented there.
   Interpolation is piecewise linear, NOT new Horizons values. Dates are approx civil UTC
   rendered from JD TDB, which differs by tens of seconds.
   Finite-difference speed is SEGMENT AVERAGE, not instantaneous.
   Cassini after 2004: 10-day samples insufficient for detailed Saturn revolutions. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const source=window.ATLAS_MISSION_TRACKS, api=()=>window.ATLAS_MAIN_API;
if(!source?.data)return;
const AU=149597870.7,DAY=86400000,JD0=2440587.5,TAU=2*Math.PI;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const norm=p=>Math.hypot(...p),lerp=(a,b,t)=>a.map((x,i)=>x+(b[i]-x)*t);
const fmt=(n,d=1)=>Number(n).toLocaleString('pl-PL',{minimumFractionDigits:d,maximumFractionDigits:d});
const dateJD=date=>date.getTime()/DAY+JD0;
const jdDate=jd=>new Date((jd-JD0)*DAY);
const stamp=jd=>jdDate(jd).toLocaleDateString('pl-PL',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'});
const dateInput=jd=>jdDate(jd).toISOString().slice(0,10);
const eDate=iso=>dateJD(new Date(iso+'T12:00:00Z'));
const rad=r=>r*Math.PI/180;
const BODIES={
 mercury:{label:'Merkury',a:.387,period:88,color:'#b7b1a7'},
 venus:{label:'Wenus',a:.723,period:225,color:'#e2bd87'},
 earth:{label:'Ziemia',a:1.0,period:365,color:'#79c3f7'},
 mars:{label:'Mars',a:1.52,period:687,color:'#e79171'},
 jupiter:{label:'Jowisz',a:5.20,period:4333,color:'#dcc6ad'},
 saturn:{label:'Saturn',a:9.58,period:10759,color:'#e9d5a5'},
 uranus:{label:'Uran',a:19.2,period:30688,color:'#95d8df'},
 neptune:{label:'Neptun',a:30.1,period:60182,color:'#75a1f3'}
};
const EVENTS={
 voyager1:[
  {date:'1977-09-05',name:'Start Voyagera 1',body:'earth',detail:'Start rakietą Titan IIIE/Centaur z Cape Canaveral. Choć wystartował drugi, dotarł do Jowisza szybciej niż Voyager 2.'},
  {date:'1979-03-05',name:'Jowisz',body:'jupiter',detail:'Najbliższy przelot przy Jowiszu; historyczne obrazy księżyców i odkrycie aktywnego wulkanizmu na Io.'},
  {date:'1980-11-12',name:'Saturn',body:'saturn',detail:'Historyczny przelot przez układ Saturna, w tym badania Tytana; sonda skierowana daleko ponad płaszczyznę ekliptyki.'},
  {date:'1990-02-14',name:'Pale Blue Dot',detail:'Z dużej odległości Voyager 1 wykonał rodzinny portret planet, w tym słynne zdjęcie Ziemi jako małej kropki.'},
  {date:'2012-08-25',name:'Przestrzeń międzygwiazdowa',detail:'NASA wyznaczyła tę datę jako przekroczenie heliopauzy przez Voyagera 1; nie oznacza to opuszczenia całego Układu Słonecznego.'}
 ],
 voyager2:[
  {date:'1977-08-20',name:'Start Voyagera 2',body:'earth',detail:'Pierwszy z dwóch Voyagerów wystartował z Cape Canaveral w podróż do planet olbrzymów.'},
  {date:'1979-07-09',name:'Jowisz',body:'jupiter',detail:'Przelot przy Jowiszu i jego księżycach; parametry dalszego lotu przygotowywały asystę do Saturna.'},
  {date:'1981-08-26',name:'Saturn',body:'saturn',detail:'Według tabeli NSSDC najbliższe podejście 26 sierpnia UTC; grawitacja Saturna skierowała sondę ku Uranowi.'},
  {date:'1986-01-24',name:'Uran',body:'uranus',detail:'Pierwsza i dotąd jedyna bliska wizyta sondy przy Uranie; odkrycia księżyców, pierścieni i nachylenia pola magnetycznego.'},
  {date:'1989-08-25',name:'Neptun',body:'neptune',detail:'Pierwszy i jedyny bliski przelot sondy przy Neptunie, z obserwacją Trytona i atmosfery planety.'},
  {date:'2018-11-05',name:'Przestrzeń międzygwiazdowa',detail:'Przekroczenie heliopauzy przez Voyagera 2, ustalone na podstawie pomiarów otaczającej plazmy.'}
 ],
 cassini:[
  {date:'1997-10-15',name:'Start Cassini–Huygens',body:'earth',detail:'Start wspólnej misji NASA, ESA i ASI do układu Saturna.'},
  {date:'1998-04-26',name:'Wenus — pierwsza asysta',body:'venus',detail:'Pierwsze z czterech planetarnych zbliżeń grawitacyjnych na drodze do Saturna.'},
  {date:'1999-06-24',name:'Wenus — druga asysta',body:'venus',detail:'Drugi przelot przy Wenus, zmieniający wektor prędkości sondy.'},
  {date:'1999-08-18',name:'Ziemia — asysta',body:'earth',detail:'Cassini przeleciała ponownie w pobliżu Ziemi, zyskując energię do dalszej podróży.'},
  {date:'2000-12-30',name:'Jowisz — asysta',body:'jupiter',detail:'Ostatnia planetarna asysta grawitacyjna przed podróżą do Saturna.'},
  {date:'2004-07-01',name:'Wejście na orbitę Saturna',body:'saturn',detail:'Wykonano manewr wejścia na orbitę Saturna. Późniejsze próbki archiwum są co 10 dni i nie rekonstruują pojedynczych orbit dokładnie.'},
  {date:'2005-01-14',name:'Huygens na Tytanie',body:'saturn',detail:'Lądownik Huygens osiągnął powierzchnię Tytana. Na mapie widać pozycję orbitera Cassini, nie Huygensa.'},
  {date:'2017-09-15',name:'Wielki Finał',body:'saturn',detail:'Kontrolowane wejście Cassini w atmosferę Saturna, kończące 20-letnią misję.'}
 ]
};
const META={
 voyager1:{name:'Voyager 1',tagline:'Jowisz · Saturn · ku gwiazdom',color:'#7ad8ed',intro:'Szybsza z dwóch sond Voyagerów. Po badaniach Jowisza i Saturna opuściła płaszczyznę orbit planet i jako pierwsza dotarła do przestrzeni międzygwiazdowej.',missionUrl:'https://science.nasa.gov/mission/voyager/voyager-1/',opening:'1980-11-12'},
 voyager2:{name:'Voyager 2',tagline:'Wielka Podróż · cztery planety olbrzymy',color:'#a8f3cf',intro:'Jedyna sonda, która odwiedziła z bliska Jowisza, Saturna, Urana i Neptuna. Seria asyst grawitacyjnych ukształtowała jej wielką podróż.',missionUrl:'https://science.nasa.gov/mission/voyager/voyager-2/',opening:'1989-08-25'},
 cassini:{name:'Cassini–Huygens',tagline:'Wenus · Ziemia · Jowisz · Saturn',color:'#edca99',intro:'Misja NASA/ESA/ASI do Saturna: po czterech planetarnych asystach Cassini weszła na orbitę planety, badając pierścienie i księżyce aż do Wielkiego Finału.',missionUrl:'https://science.nasa.gov/mission/cassini/',opening:'2004-07-01'}
};
const S={id:'voyager2',jd:0,playing:false,rate:50,priorPlaying:null,yaw:-.36,pitch:.78,zoom:1,panX:0,panY:0,focus:'sun',target:null,showPlanets:true,showOrbitRings:true,showOther:false,labels:true,showFuture:true,trailFull:true,firstOpen:true,loaded:false};
let raf=0,lastFrame=0,pointers=new Map(),drag=null,pinchDist=0,drawFrame=0;
const mission=()=>source.data[S.id],meta=()=>META[S.id],samples=()=>mission().samples;
const startJD=()=>mission().jdStart,stopJD=()=>mission().jdStop;
function sampleAt(points,jd){
 if(!points?.length)return null;
 if(jd<=points[0][0])return {p:points[0].slice(1),i:0,t:0,clamped:jd<points[0][0]};
 if(jd>=points[points.length-1][0])return {p:points.at(-1).slice(1),i:points.length-2,t:1,clamped:jd>points.at(-1)[0]};
 let low=0,hi=points.length-1;
 while(hi-low>1){const mid=(hi+low)>>1;if(points[mid][0]>jd)hi=mid;else low=mid;}
 const t=(jd-points[low][0])/(points[hi][0]-points[low][0]);
 return {p:lerp(points[low].slice(1),points[hi].slice(1),t),i:low,t,clamped:false};
}
function speedFromSegment(rows,at){
 const i=clamp(at.i,0,rows.length-2),a=rows[i],b=rows[i+1],dt=(b[0]-a[0])*86400;
 return norm([b[1]-a[1],b[2]-a[2],b[3]-a[3]])*AU/dt;
}
function distanceTraveled(rows,jd){
 let length=0;
 for(let i=1;i<rows.length;i++){
  const a=rows[i-1],b=rows[i];
  const t=jd>=b[0]?1:jd<=a[0]?0:(jd-a[0])/(b[0]-a[0]);
  if(t<=0)break;
  const segment=norm([b[1]-a[1],b[2]-a[2],b[3]-a[3]]);
  length+=segment*t;
  if(t<1)break;
 }
 return length;
}
function setTime(jd){
 S.jd=clamp(jd,startJD(),stopJD());sync();draw();
}
function missionChange(id,opening=true){
 if(!source.data[id])return;
 S.id=id;S.playing=false;S.focus='sun';S.zoom=1;S.panX=0;S.panY=0;
 S.target=null;
 const desired=opening?eDate(META[id].opening):startJD();
 S.jd=clamp(desired,startJD(),stopJD());
 $('arcFocus').value=S.focus;
 document.querySelectorAll('[data-arc-mission]').forEach(b=>b.classList.toggle('active',b.dataset.arcMission===id));
 buildEvents();
 sync();draw();
}
function selectedEvent(){
 const ev=EVENTS[S.id];let nearest=null;
 for(const item of ev)if(eDate(item.date)<=S.jd+.51)nearest=item;else break;
 return nearest;
}
function planetPosition(body,jd){
 if(!body)return null;
 return api().positions(jd)[body];
}
function drawEventMarkers(ctx,L){
 const events=EVENTS[S.id];
 for(const ev of events){
  const jd=eDate(ev.date);
  if(jd<startJD()||jd>stopJD())continue;
  const p=sampleAt(samples(),jd)?.p;if(!p)continue;
  const at=project(p,L),x=at[0],y=at[1];
  if(x<-22||x>L.w+22||y<-22||y>L.h+22)continue;
  const active=Math.abs(jd-S.jd)<20;
  ctx.beginPath();ctx.arc(x,y,active?5:3,0,TAU);
  ctx.fillStyle=active?'#ffffff':'#b8e8e6ba';ctx.fill();
  if(S.labels&&active){ctx.font='700 10px system-ui';ctx.fillStyle='#f4ffff';ctx.fillText(ev.name,x+9,y-10);}
 }
}
function buildEvents(){
 const box=$('arcEvents');box.textContent='';
 EVENTS[S.id].forEach((ev,i)=>{
  const btn=document.createElement('button');btn.type='button';btn.dataset.arcEvent=String(i);
  const tag=document.createElement('time');tag.textContent=ev.date;
  const name=document.createElement('span');name.textContent=ev.name;
  btn.append(tag,name);
  btn.onclick=()=>jumpEvent(i);
  box.appendChild(btn);
 });
}
function jumpEvent(idx){
 const ev=EVENTS[S.id][idx];if(!ev)return;
 S.playing=false;S.target=ev.body||null;
 S.focus=S.target?'target':'ship';S.zoom=1;S.panX=0;S.panY=0;
 $('arcFocus').value=S.focus;
 setTime(eDate(ev.date));
}
function pickEvent(step){
 const events=EVENTS[S.id],jd=S.jd;
 const found=step>0?events.findIndex(e=>eDate(e.date)>jd+1.5):
  [...events].reverse().findIndex(e=>eDate(e.date)<jd-1.5);
 const index=step>0?found:found<0?-1:events.length-1-found;
 if(index>=0)jumpEvent(index);
}
function focusPoint(pos){
 if(S.focus==='sun')return [0,0,0];
 if(S.focus==='ship')return pos;
 if(S.focus==='target'){
  const key=S.target;
  if(key&&BODIES[key])return planetPosition(key,S.jd);
 }
 return [0,0,0];
}
function rangeFor(pos){
 const sunDist=norm(pos);
 if(S.focus==='ship')return sunDist<3?1.5:sunDist<12?3.5:sunDist<40?6.5:12;
 if(S.focus==='target'){
  const b=S.target;
  return b==='venus'||b==='earth'?1.8:b==='jupiter'?4.8:b==='saturn'?4:b==='uranus'||b==='neptune'?4.5:3.5;
 }
 return Math.max(2.4,sunDist*1.16, !S.showPlanets?0:Math.min(31,sunDist<10?10:sunDist<32?32:10));
}
function layout(){
 const c=$('arcCanvas'),w=Math.max(260,c.clientWidth||880),h=Math.max(260,c.clientHeight||510);
 const pos=sampleAt(samples(),S.jd).p;
 const center=focusPoint(pos),range=rangeFor(pos);
 return {w,h,cx:w*.49+S.panX,cy:h*.52+S.panY,center,range,scale:Math.min(w*.45,h*.45)/range*S.zoom};
}
function project(p,L){
 const dx=p[0]-L.center[0],dy=p[1]-L.center[1],dz=p[2]-L.center[2];
 const co=Math.cos(S.yaw),si=Math.sin(S.yaw);
 const x=dx*co-dy*si,y=dx*si+dy*co;
 const yp=y*Math.cos(S.pitch)+dz*Math.sin(S.pitch);
 return [L.cx+x*L.scale,L.cy-yp*L.scale];
}
function drawPath(ctx,points,color,width,dash=[]){
 if(points.length<2)return;
 ctx.beginPath();
 let begun=false;
 for(const p of points){const x=p[0],y=p[1];if(!Number.isFinite(x+y))continue;if(!begun){ctx.moveTo(x,y);begun=true;}else ctx.lineTo(x,y);}
 ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([]);
}
function drawOrbitRings(ctx,L){
 const vals=Object.entries(BODIES);
 for(const [key,b] of vals){
  if(b.a>L.range*3&&S.focus==='sun')continue;
  const pts=[];
  for(let i=0;i<=100;i++){const a=i/100*TAU;pts.push(project([b.a*Math.cos(a),b.a*Math.sin(a),0],L));}
  drawPath(ctx,pts,key==='earth'?'#6383a35f':'#55728c35',1,key==='neptune'?[3,6]:[]);
 }
}
function bodyDisk(ctx,point,r,color){
 const g=ctx.createRadialGradient(point[0]-r*.25,point[1]-r*.3,.1,point[0],point[1],r*1.8);
 g.addColorStop(0,'#fdf9ee');g.addColorStop(.27,color);g.addColorStop(1,'#16344700');
 ctx.fillStyle=g;ctx.beginPath();ctx.arc(...point,r*1.8,0,TAU);ctx.fill();
}
function paint(){
 const canvas=$('arcCanvas');if(!canvas||!mission())return;
 const L=layout(),dpr=Math.min(2,window.devicePixelRatio||1),ctx=canvas.getContext('2d');if(!ctx)return;
 if(canvas.width!==Math.round(L.w*dpr)||canvas.height!==Math.round(L.h*dpr)){canvas.width=Math.round(L.w*dpr);canvas.height=Math.round(L.h*dpr);}
 ctx.setTransform(dpr,0,0,dpr,0,0);
 const bg=ctx.createRadialGradient(L.cx,L.cy,12,L.cx,L.cy,Math.max(L.w,L.h)*.9);
 bg.addColorStop(0,'#122a42');bg.addColorStop(.56,'#061321');bg.addColorStop(1,'#020813');
 ctx.fillStyle=bg;ctx.fillRect(0,0,L.w,L.h);
 for(let i=0;i<150;i++){
  const x=(i*103.773+47.1)%L.w,y=(i*89.137+22.9)%L.h;
  ctx.fillStyle=i%9?'#a2bad444':'#c4ddf088';ctx.beginPath();ctx.arc(x,y,i%17===0?1.25:.7,0,TAU);ctx.fill();
 }
 if(S.showOrbitRings)drawOrbitRings(ctx,L);
 const sun=project([0,0,0],L);
 if(sun[0]>-150&&sun[0]<L.w+150&&sun[1]>-150&&sun[1]<L.h+150){
  const g=ctx.createRadialGradient(...sun,2,...sun,39);
  g.addColorStop(0,'#fff8db');g.addColorStop(.16,'#ffdd97');g.addColorStop(.48,'#d6985450');g.addColorStop(1,'#efac4400');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(...sun,39,0,TAU);ctx.fill();
  ctx.fillStyle='#ffe29d';ctx.beginPath();ctx.arc(...sun,5,0,TAU);ctx.fill();
  if(S.labels){ctx.fillStyle='#d2be97';ctx.font='11px system-ui';ctx.fillText('Słońce',sun[0]+12,sun[1]-7);}
 }
 if(S.showPlanets){
  const positions=api().positions(S.jd);
  for(const [id,b] of Object.entries(BODIES)){
   const p=positions[id],pt=project(p,L);
   if(pt[0]<-30||pt[0]>L.w+30||pt[1]<-30||pt[1]>L.h+30)continue;
   bodyDisk(ctx,pt,id==='jupiter'?5.5:id==='saturn'?5:3.8,b.color);
   if(S.labels){ctx.fillStyle='#bed4e2';ctx.font='10px system-ui';ctx.fillText(b.label,pt[0]+7,pt[1]-6);}
  }
 }
 if(S.showOther){
  for(const [id,other] of Object.entries(source.data)){
   if(id===S.id)continue;
   const pts=other.samples.filter((v,i)=>i%2===0||i===other.samples.length-1).map(v=>project(v.slice(1),L));
   drawPath(ctx,pts,META[id].color+'40',1.2,[2,5]);
  }
 }
 const rows=samples(),last=sampleAt(rows,S.jd),current=last.p;
 if(S.trailFull){
  const future=rows.slice(last.i).map(row=>project(row.slice(1),L));
  future.unshift(project(current,L));
  drawPath(ctx,future,meta().color+'3c',1.2,[4,7]);
 }
 const past=rows.slice(0,last.i+1).map(row=>project(row.slice(1),L));
 past.push(project(current,L));drawPath(ctx,past,meta().color,2.4);
 drawEventMarkers(ctx,L);
 const ship=project(current,L);
 ctx.fillStyle='#f9ffff';ctx.shadowBlur=22;ctx.shadowColor=meta().color;
 ctx.beginPath();ctx.arc(...ship,5.5,0,TAU);ctx.fill();ctx.shadowBlur=0;
 ctx.strokeStyle=meta().color;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(...ship,13,0,TAU);ctx.stroke();
 ctx.fillStyle='#e7ffff';ctx.font='700 11px system-ui';ctx.fillText(meta().name,ship[0]+15,ship[1]-13);
 ctx.fillStyle='#7895aa';ctx.font='10px system-ui';ctx.fillText('SŁOŃCE W CENTRUM · EKLIPTYKA J2000 · DANE JPL HORIZONS (PRÓBKI + INTERPOLACJA)',13,L.h-15);
}
function draw(){if($('archiveDialog')?.open)paint();}
function sync(){
 const m=mission(),at=sampleAt(m.samples,S.jd),p=at.p,range=m.jdStop-m.jdStart;
 const t=(S.jd-m.jdStart)/range;
 $('arcDate').textContent=stamp(S.jd);$('arcPercent').textContent=fmt(t*100,1)+'% podróży';
 $('arcSlider').value=String(Math.round(t*1000));
 $('arcMin').textContent=stamp(m.jdStart);
 $('arcMax').textContent=stamp(m.jdStop);
 $('arcTitle').textContent=meta().name;$('arcSubtitle').textContent=meta().tagline;
 $('arcIntro').textContent=meta().intro;
 $('arcSource').textContent='HORIZONS · '+m.samples.length.toLocaleString('pl-PL')+' próbek · '+m.stepNote;
 const speed=speedFromSegment(m.samples,at);
 const elapsed=(S.jd-m.jdStart)/365.25;
 const sunDist=norm(p),distancePath=distanceTraveled(m.samples,S.jd);
 const z=p[2],travelSignal=sunDist*8.317;
 const pairs=[['arcDist',fmt(sunDist,3)+' AU'],['arcDistKm',fmt(sunDist*AU/1e9,3)+' mld km'],
 ['arcSpeed',fmt(speed,2)+' km/s'],['arcZ',fmt(z,3)+' AU'],
 ['arcTravel',fmt(distancePath,2)+' AU'],['arcElapsed',fmt(elapsed,2)+' lat'],
 ['arcLight',travelSignal<60?fmt(travelSignal,1)+' min':fmt(travelSignal/60,2)+' h'],
 ['arcCoverage',fmt(m.samples.length,0)+' próbek']];
 for(const [id,value]of pairs)$(id).textContent=value;
 $('arcPlay').textContent=S.playing?'Ⅱ Pauza':'▶ Odtwórz podróż';
 $('arcFocus').value=S.focus;
 $('arcMissionSource').href=meta().missionUrl;
 const event=selectedEvent();
 $('arcEventHeading').textContent=event?.name||'Początek podróży';
 $('arcEventDescription').textContent=event?.detail||'Rozpoczęcie archiwalnego odtwarzania misji.';
 document.querySelectorAll('[data-arc-event]').forEach((b,i)=>{
  const ev=EVENTS[S.id][i];b.classList.toggle('active',event===ev);
 });
 $('arcNote').textContent=S.id==='cassini'&&S.jd>=eDate('2004-07-01')?
  'Uwaga: orbita Cassini po 2004 r. jest próbkowana co 10 dni. Linia pomiędzy próbkami NIE pokazuje wszystkich obiegów i manewrów przy Saturnie.':
  'Pozycje pośrednie powstają przez interpolację liniową między historycznymi próbkami Horizons. Przeloty blisko planet mają ograniczoną rozdzielczość.';
 $('arcStatus').textContent=S.playing?'ODTWARZANIE':S.jd>=m.jdStop?'KONIEC ARCHIWUM':'PAUZA';
}
function setMission(id){missionChange(id,true);}
function setupButtons(){
 const nav=$('arcMissionNav');nav.textContent='';
 for(const [id,m]of Object.entries(META)){
  const button=document.createElement('button');button.type='button';button.dataset.arcMission=id;
  const badge=document.createElement('span');badge.className='arc-ship-mark';badge.style.background=m.color;
  const name=document.createElement('strong');name.textContent=m.name;
  const sub=document.createElement('small');sub.textContent=m.tagline;
  button.append(badge,name,sub);button.onclick=()=>setMission(id);nav.appendChild(button);
 }
}
function downloadCSV(){
 const d=mission(),text=[
  '# NASA/JPL Horizons vectors, heliocentric ecliptic J2000, Julian dates in TDB',
  '# Numeric archive mirrored by giancarloerra/Astro.Observer-Orrery; rounded to 10 decimals in AU',
  '# 3D sample rows (not linearly interpolated frames); speed can only be estimated between samples.',
  'JD_TDB;X_AU;Y_AU;Z_AU',
  ...d.samples.map(p=>p.join(';'))].join('\r\n');
 const blob=new Blob(['\uFEFF'+text],{type:'text/csv;charset=utf-8'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='ATLAS_SOLARIS_14_'+S.id+'_HORIZONS.csv';
 document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
function frame(now){
 raf=0;if(!$('archiveDialog')?.open)return;
 const dt=lastFrame?clamp((now-lastFrame)/1000,0,.09):0;lastFrame=now;
 if(S.playing){
  const desired=S.jd+dt*S.rate;
  S.jd=clamp(desired,startJD(),stopJD());
  if(S.jd>=stopJD())S.playing=false;
  sync();
 }
 paint();
 raf=requestAnimationFrame(frame);
}
function show(){
 const dlg=$('archiveDialog');if(dlg.open)return;
 S.priorPlaying=api().getPlaying();api().setPlaying(false);
 dlg.showModal();lastFrame=0;sync();
 if(!raf)raf=requestAnimationFrame(frame);
}
function close(){S.playing=false;$('archiveDialog').close();}
function setupCanvas(){
 const c=$('arcCanvas');
 c.addEventListener('wheel',e=>{e.preventDefault();S.zoom=clamp(S.zoom*(e.deltaY>0?.88:1.12),.2,60);paint();},{passive:false});
 c.addEventListener('pointerdown',e=>{
  c.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  drag={x:e.clientX,y:e.clientY,yaw:S.yaw,pitch:S.pitch};
  if(pointers.size===2){const a=[...pointers.values()];pinchDist=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);}
 });
 c.addEventListener('pointermove',e=>{
  if(!pointers.has(e.pointerId))return;
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pointers.size===2){const a=[...pointers.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);if(pinchDist>0)S.zoom=clamp(S.zoom*d/pinchDist,.2,60);pinchDist=d;}
  else if(drag){S.yaw=drag.yaw+(e.clientX-drag.x)*.008;S.pitch=clamp(drag.pitch+(e.clientY-drag.y)*.006,-1.56,1.56);}
  paint();
 });
 const stop=e=>{pointers.delete(e.pointerId);drag=null;pinchDist=0;};
 c.addEventListener('pointerup',stop);c.addEventListener('pointercancel',stop);
 c.addEventListener('keydown',e=>{
  if(e.key==='+'||e.key==='=')S.zoom=clamp(S.zoom*1.15,.2,60);
  else if(e.key==='-')S.zoom=clamp(S.zoom/1.15,.2,60);
  else if(e.key==='ArrowLeft')S.yaw-=.1;
  else if(e.key==='ArrowRight')S.yaw+=.1;
  else if(e.key==='ArrowUp')S.pitch=clamp(S.pitch+.1,-1.56,1.56);
  else if(e.key==='ArrowDown')S.pitch=clamp(S.pitch-.1,-1.56,1.56);
  else return;
  e.preventDefault();paint();
 });
}
function init(){
 if(!$('archiveDialog')||!api())return;
 setupButtons();
 missionChange('voyager2',true);
 $('openArchive').onclick=show;$('openArchiveSide').onclick=show;$('arcClose').onclick=close;
 $('archiveDialog').addEventListener('close',()=>{S.playing=false;if(raf){cancelAnimationFrame(raf);raf=0;}lastFrame=0;api().setPlaying(S.priorPlaying);S.priorPlaying=null;});
 $('arcSlider').oninput=()=>{S.playing=false;const t=clamp(Number($('arcSlider').value)/1000,0,1);setTime(startJD()+t*(stopJD()-startJD()));};
 $('arcPlay').onclick=()=>{if(S.jd>=stopJD())S.jd=startJD();S.playing=!S.playing;sync();};
 $('arcReset').onclick=()=>{S.playing=false;setTime(startJD());};
 $('arcPrev').onclick=()=>pickEvent(-1);$('arcNext').onclick=()=>pickEvent(1);
 $('arcSpeed').onchange=()=>{S.rate=Number($('arcSpeed').value)||50;};
 $('arcFocus').onchange=()=>{S.focus=$('arcFocus').value;S.zoom=1;if(S.focus==='target'&&!S.target)S.target='neptune';draw();};
 $('arcResetCamera').onclick=()=>{S.yaw=-.36;S.pitch=.78;S.zoom=1;S.panX=0;S.panY=0;S.focus='sun';S.target=null;$('arcFocus').value='sun';draw();};
 $('arcPlanets').onchange=()=>{S.showPlanets=$('arcPlanets').checked;draw();};
 $('arcRings').onchange=()=>{S.showOrbitRings=$('arcRings').checked;draw();};
 $('arcOthers').onchange=()=>{S.showOther=$('arcOthers').checked;draw();};
 $('arcLabels').onchange=()=>{S.labels=$('arcLabels').checked;draw();};
 $('arcFuture').onchange=()=>{S.trailFull=$('arcFuture').checked;draw();};
 $('arcCSV').onclick=downloadCSV;
 setupCanvas();window.addEventListener('resize',()=>draw());
 window.ATLAS_ARCHIVE_TEST={source,META,EVENTS,S,missionChange,sampleAt,speedFromSegment,distanceTraveled,mission,project,layout,jumpEvent,show};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
