/* ATLAS SOLARIS 13.0 — Asysty grawitacyjne
   Two-body unpowered planar hyperbolic flyby / patched conics.
   v∞out = R(±δ)v∞in, δ = 2 asin(1/e), e=1+rp*v∞²/GM.
   Heliocentric osculating velocities Vplanet+v∞; v∞ magnitude conserved.
   Position and velocity along hyperbola from hyperbolic Kepler anomaly.
   Scientific educational model: no 3D B-plane, atmosphere, perturbations or real flyby targeting. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const TAU=2*Math.PI,DEG=Math.PI/180,RAD=180/Math.PI,DAY=86400000,AU=149597870.7,JD0=2440587.5;
const PLANETS={
 mercury:{label:'Merkury',gm:22031.868551,r:2439.7,accent:'#b6b1a8',alt:300},
 venus:{label:'Wenus',gm:324858.592,r:6051.8,accent:'#d9b98b',alt:500},
 earth:{label:'Ziemia',gm:398600.436,r:6371,accent:'#83c9f4',alt:450},
 mars:{label:'Mars',gm:42828.37362,r:3389.5,accent:'#dd8b6b',alt:250},
 jupiter:{label:'Jowisz',gm:126686531.9,r:69911,accent:'#e6c4a0',alt:10000},
 saturn:{label:'Saturn',gm:37931206.23,r:58232,accent:'#e8d5b2',alt:12000},
 uranus:{label:'Uran',gm:5793951.3,r:25362,accent:'#a0d9e1',alt:6000},
 neptune:{label:'Neptun',gm:6835099.97,r:24622,accent:'#6d96fa',alt:6000}
};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const fmt=(x,d=2)=>Number(x).toLocaleString('pl-PL',{minimumFractionDigits:d,maximumFractionDigits:d});
const jdDate=jd=>new Date((jd-JD0)*DAY),jdFromDate=date=>date.getTime()/DAY+JD0;
const parseDay=s=>{const d=new Date(s+'T12:00:00Z');return Number.isFinite(d.getTime())?jdFromDate(d):null;};
const rotation=(v,ang)=>[v[0]*Math.cos(ang)-v[1]*Math.sin(ang),v[0]*Math.sin(ang)+v[1]*Math.cos(ang)];
const norm=v=>Math.hypot(...v),add=(a,b)=>[a[0]+b[0],a[1]+b[1]],scale=(v,k)=>[v[0]*k,v[1]*k];
const subtraction=(a,b)=>[a[0]-b[0],a[1]-b[1]];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1];
const unit=v=>{const n=Math.max(norm(v),1e-20);return scale(v,1/n)};
const deg=ang=>ang*RAD;
const piSign=x=>x>=0?'+':'−';
const state={
 planet:'jupiter',jd:null,vinf:6,altitude:10000,approach:0,side:1,
 progress:0,playing:false,rate:1,priorPlaying:null,
 showVectors:true,showAsymptotes:true,showGrid:true,zoom:1,panX:0,panY:0,
 saved:null,model:null,initialized:false
};
let raf=0,last=0,drag=null,pointers=new Map(),pinch=0;
function velocityAt(id,jd){
 const delta=.045,a=window.ATLAS_MAIN_API.positions(jd-delta)[id],b=window.ATLAS_MAIN_API.positions(jd+delta)[id];
 return [(b[0]-a[0])*AU/(2*delta*86400),(b[1]-a[1])*AU/(2*delta*86400)];
}
function compute(planet,jd,vinf,altitude,approach,side){
 const body=PLANETS[planet];
 if(!body||!Number.isFinite(jd)||!Number.isFinite(vinf)||vinf<=0||!Number.isFinite(altitude)||altitude<0)return null;
 const rp=body.r+altitude,e=1+rp*vinf*vinf/body.gm,a=body.gm/(vinf*vinf);
 const turn=2*Math.asin(clamp(1/e,0,1));
 const inBasis=unit(velocityAt(planet,jd)),planetVelocity=velocityAt(planet,jd),vPlanet=norm(planetVelocity);
 const incomingUnit=rotation(inBasis,approach*DEG),outgoingUnit=rotation(incomingUnit,side*turn);
 const vin=scale(incomingUnit,vinf),vout=scale(outgoingUnit,vinf);
 const heliIn=add(planetVelocity,vin),heliOut=add(planetVelocity,vout);
 const speedIn=norm(heliIn),speedOut=norm(heliOut);
 const energy=(speedOut*speedOut-speedIn*speedIn)/2,deltaSpeed=speedOut-speedIn;
 const alpha=Math.atan2(incomingUnit[1],incomingUnit[0]);
 const rotAngle=alpha-side*(Math.PI/2-turn/2);
 const vp=Math.sqrt(vinf*vinf+2*body.gm/rp);
 const h=rp*vp,p=h*h/body.gm,range=rp*15;
 const Hmax=Math.acosh((range/a+1)/e);
 const timeScale=Math.sqrt(a*a*a/body.gm),tMax=timeScale*(e*Math.sinh(Hmax)-Hmax);
 const model={planet,body,jd,vinf,altitude,approach,side,rp,e,a,h,p,turn,alpha,rotAngle,
  vin,vout,planetVelocity,vPlanet,heliIn,heliOut,speedIn,speedOut,energy,deltaSpeed,
  vp,range,Hmax,tMax,impactParameter:a*Math.sqrt(e*e-1)};
 return model;
}
function anomalyAt(m,progress){
 const elapsed=(2*clamp(progress,0,1)-1)*m.tMax;
 const M=elapsed/Math.sqrt(m.a*m.a*m.a/m.body.gm);
 let H=Math.asinh(M/Math.max(1.01,m.e));
 for(let i=0;i<32;i++){
  const sh=Math.sinh(H),ch=Math.cosh(H),f=m.e*sh-H-M,d=m.e*ch-1;
  const next=H-f/d;
  if(Math.abs(next-H)<1e-13){H=next;break;}H=next;
 }
 return {H,elapsed};
}
function trajectoryPoint(m,H){
 const r=m.a*(m.e*Math.cosh(H)-1);
 const f=2*Math.atan(Math.sqrt((m.e+1)/(m.e-1))*Math.tanh(H/2));
 const pos=rotation([r*Math.cos(f),m.side*r*Math.sin(f)],m.rotAngle);
 const vel=rotation([-(m.body.gm/m.h)*Math.sin(f),m.side*(m.body.gm/m.h)*(m.e+Math.cos(f))],m.rotAngle);
 return {pos,vel,r,f};
}
function vecFromProgress(m,progress){const a=anomalyAt(m,progress);return {...trajectoryPoint(m,a.H),elapsed:a.elapsed,H:a.H};}
function reset({fresh=false}={}){
 state.playing=false;state.progress=0;
 if(fresh)state.saved=null;
 state.model=compute(state.planet,state.jd,state.vinf,state.altitude,state.approach,state.side);
 updateAll();
}
function syncInputs(){
 $('gaPlanet').value=state.planet;$('gaDate').value=jdDate(state.jd).toISOString().slice(0,10);
 $('gaVinf').value=state.vinf;$('gaAltitude').value=state.altitude;
 $('gaApproach').value=state.approach;$('gaSide').value=String(state.side);
 $('gaRate').value=state.rate;$('gaVectors').checked=state.showVectors;
 $('gaAsymptotes').checked=state.showAsymptotes;$('gaGrid').checked=state.showGrid;
}
function readInputs(){
 state.planet=$('gaPlanet').value;state.jd=parseDay($('gaDate').value)??state.jd;
 state.vinf=clamp(Number($('gaVinf').value)||6,1,30);
 state.altitude=clamp(Number($('gaAltitude').value)||0,0,250000);
 state.approach=clamp(Number($('gaApproach').value)||0,-180,180);
 state.side=Number($('gaSide').value)>=0?1:-1;
 state.rate=Math.max(.25,Number($('gaRate').value)||1);
 state.showVectors=$('gaVectors').checked;state.showAsymptotes=$('gaAsymptotes').checked;state.showGrid=$('gaGrid').checked;
}
function setParams(values){
 Object.assign(state,values);
 state.approach=clamp(state.approach,-180,180);
 state.altitude=clamp(state.altitude,0,250000);
 syncInputs();reset();
}
function status(){
 const m=state.model;if(!m)return;
 const p=vecFromProgress(m,state.progress);
 const gain=m.energy>1e-9,loss=m.energy< -1e-9;
 $('gaDeltaSpeed').textContent=piSign(m.deltaSpeed)+fmt(Math.abs(m.deltaSpeed),2)+' km/s';
 $('gaEnergy').textContent=piSign(m.energy)+fmt(Math.abs(m.energy),2)+' km²/s²';
 $('gaDeltaSpeed').className=gain?'ga-positive':loss?'ga-negative':'';
 $('gaEnergy').className=gain?'ga-positive':loss?'ga-negative':'';
 $('gaTurn').textContent=fmt(deg(m.turn),2)+'°';
 $('gaEcc').textContent=fmt(m.e,4);
 $('gaB').textContent=fmt(m.impactParameter,0)+' km';
 $('gaRp').textContent=fmt(m.rp,0)+' km';
 $('gaVplanet').textContent=fmt(m.vPlanet,3)+' km/s';
 $('gaVin').textContent=fmt(m.speedIn,3)+' km/s';
 $('gaVout').textContent=fmt(m.speedOut,3)+' km/s';
 $('gaVperi').textContent=fmt(m.vp,3)+' km/s';
 $('gaVinfBefore').textContent=fmt(m.vinf,3)+' km/s';
 $('gaVinfAfter').textContent=fmt(m.vinf,3)+' km/s';
 $('gaFlyBy').textContent=m.body.label+' · przelot hiperboliczny';
 $('gaWhen').textContent=jdDate(state.jd).toLocaleDateString('pl-PL',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'});
 $('gaAltLabel').textContent=fmt(state.altitude,0)+' km';
 $('gaAngleLabel').textContent=(state.approach>=0?'+':'')+fmt(state.approach,0)+'°';
 $('gaVinfLabel').textContent=fmt(state.vinf,1)+' km/s';
 $('gaProgress').value=Math.round(state.progress*1000);
 const timeH=Math.abs(p.elapsed)/3600;
 const label=(timeH>=24?fmt(timeH/24,2)+' d':fmt(timeH,1)+' h');
 $('gaClock').textContent=(p.elapsed< -1?'− ':p.elapsed>1?'+ ':'')+label+' względem perycentrum';
 $('gaPosition').textContent=state.progress<.499?'ZBLIŻANIE':state.progress>.501?'ODDALANIE':'PERYCENTRUM';
 $('gaPlay').textContent=state.playing?'Ⅱ Pauza':state.progress>=1?'↻ Powtórz':'▶ Odtwórz przelot';
 $('gaStatus').textContent=state.progress>=1?'PRZELOT ZAKOŃCZONY':state.playing?'SONDA W RUCHU':'SYMULACJA ZATRZYMANA';
 $('gaResult').textContent=gain?'SONDA ZYSKUJE ENERGIĘ WZGLĘDEM SŁOŃCA':loss?'SONDA TRACI ENERGIĘ WZGLĘDEM SŁOŃCA':'BRAK ZMIANY ENERGII WZGLĘDEM SŁOŃCA';
 $('gaResult').className=gain?'ga-result-positive':loss?'ga-result-negative':'';
 $('gaComparison').textContent=state.saved?'Zapis A: Δv = '+piSign(state.saved.deltaSpeed)+fmt(Math.abs(state.saved.deltaSpeed),2)+' km/s, δ = '+fmt(deg(state.saved.turn),1)+'°':'Nie zapisano jeszcze porównania';
}
function updateAll(){if(!state.model)return;status();draw();drawVectors();}
function layout(){
 const c=$('gaCanvas'),w=Math.max(270,c.clientWidth||820),h=Math.max(260,c.clientHeight||510);
 const m=state.model;
 return {w,h,cx:w*.51+state.panX,cy:h*.51+state.panY,s:Math.min(w*.41,h*.43)/m.range*state.zoom};
}
function project(point,L){return [L.cx+point[0]*L.s,L.cy-point[1]*L.s]}
function drawPath(ctx,points,col,width=1,dash=[]){
 if(points.length<2)return;
 ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));
 ctx.strokeStyle=col;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([]);
}
function arrow(ctx,a,b,color,w=2,label=''){
 const dx=b[0]-a[0],dy=b[1]-a[1],theta=Math.atan2(dy,dx);
 ctx.strokeStyle=color;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();
 ctx.save();ctx.translate(...b);ctx.rotate(theta);ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-9,-4.4);ctx.lineTo(-9,4.4);ctx.closePath();ctx.fill();ctx.restore();
 if(label){ctx.fillStyle=color;ctx.font='600 10px system-ui';ctx.fillText(label,b[0]+5,b[1]-6);}
}
function draw(){
 const c=$('gaCanvas'),m=state.model;if(!m||!c)return;
 const L=layout(),dpr=Math.min(2,window.devicePixelRatio||1);
 const W=Math.round(L.w*dpr),H=Math.round(L.h*dpr);
 if(c.width!==W||c.height!==H){c.width=W;c.height=H;}
 const ctx=c.getContext('2d');if(!ctx)return;
 ctx.setTransform(dpr,0,0,dpr,0,0);
 const bg=ctx.createRadialGradient(L.cx,L.cy,12,L.cx,L.cy,Math.max(L.w,L.h)*.68);
 bg.addColorStop(0,'#17344a');bg.addColorStop(.5,'#061626');bg.addColorStop(1,'#030a14');
 ctx.fillStyle=bg;ctx.fillRect(0,0,L.w,L.h);
 for(let i=0;i<95;i++){
  const x=(i*121.63+39)%L.w,y=(i*83.31+22)%L.h;
  ctx.fillStyle=i%8?'#9fbacc45':'#d2e4ee8b';ctx.fillRect(x,y,1,1);
 }
 if(state.showGrid){
  const gridR=m.range*[.25,.5,.75,1];
  for(const r of gridR){
   ctx.beginPath();ctx.arc(L.cx,L.cy,r*L.s,0,TAU);ctx.strokeStyle='#94b5ce20';ctx.lineWidth=.8;ctx.stroke();
  }
  const q=project([m.range*.75,0],L);ctx.fillStyle='#7e9cae';ctx.font='10px system-ui';
  ctx.fillText(fmt(m.range*.75/1000,1)+' tys. km',q[0]+4,q[1]-6);
 }
 const orbit=[];
 for(let i=0;i<=320;i++){
  const H=-m.Hmax+2*m.Hmax*i/320;
  orbit.push(project(trajectoryPoint(m,H).pos,L));
 }
 drawPath(ctx,orbit,'#69bccb78',2);
 if(state.showAsymptotes){
  const first=trajectoryPoint(m,-m.Hmax),last=trajectoryPoint(m,m.Hmax);
  const dir1=unit(m.vin),dir2=unit(m.vout);
  const length=m.range*.33;
  const ax=project(add(first.pos,scale(dir1,-length)),L),bx=project(first.pos,L);
  const cx=project(last.pos,L),dx=project(add(last.pos,scale(dir2,length)),L);
  drawPath(ctx,[ax,bx],'#9cd8eb79',1,[5,5]);
  drawPath(ctx,[cx,dx],'#9cd8eb79',1,[5,5]);
 }
 const partial=[];
 const a=anomalyAt(m,state.progress),n=190;
 for(let i=0;i<=n;i++){
  const H=-m.Hmax+(a.H+m.Hmax)*i/n;
  partial.push(project(trajectoryPoint(m,H).pos,L));
 }
 drawPath(ctx,partial,'#96fff3',3.1);
 const peri=project(trajectoryPoint(m,0).pos,L);
 ctx.beginPath();ctx.arc(peri[0],peri[1],9,0,TAU);ctx.strokeStyle='#ffdfaa';ctx.lineWidth=1.3;ctx.setLineDash([3,4]);ctx.stroke();ctx.setLineDash([]);
 ctx.fillStyle='#ffe4b8';ctx.font='10px system-ui';ctx.fillText('PERYCENTRUM',peri[0]+12,peri[1]-12);
 // For tiny physical planets, their displayed size is intentionally enhanced and labelled.
 const pxR=m.body.r*L.s,displayRadius=Math.max(11,pxR),grad=ctx.createRadialGradient(L.cx-displayRadius*.35,L.cy-displayRadius*.4,1,L.cx,L.cy,displayRadius*1.3);
 grad.addColorStop(0,'#fff5e4');grad.addColorStop(.4,m.body.accent);grad.addColorStop(1,'#193247');
 ctx.fillStyle=grad;ctx.beginPath();ctx.arc(L.cx,L.cy,displayRadius,0,TAU);ctx.fill();
 ctx.strokeStyle='#d5ecfa69';ctx.lineWidth=1;ctx.stroke();
 ctx.fillStyle='#d9e9f3';ctx.font='600 12px system-ui';ctx.fillText(m.body.label,L.cx+displayRadius+8,L.cy+5);
 if(pxR<11){ctx.fillStyle='#91a7b8';ctx.font='9px system-ui';ctx.fillText('Tarcza powiększona',L.cx+displayRadius+8,L.cy+20);}
 const ship=trajectoryPoint(m,a.H),pos=project(ship.pos,L);
 ctx.fillStyle='#cffff5';ctx.shadowBlur=19;ctx.shadowColor='#74fff3';ctx.beginPath();ctx.arc(...pos,5.3,0,TAU);ctx.fill();ctx.shadowBlur=0;
 ctx.strokeStyle='#a1fff4';ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(...pos,11,0,TAU);ctx.stroke();
 ctx.font='600 10px system-ui';ctx.fillStyle='#d7fff8';ctx.fillText('SONDA',pos[0]+15,pos[1]-12);
 if(state.showVectors){
  const dir=unit(ship.vel),from=project(ship.pos,L),to=[from[0]+dir[0]*64,from[1]-dir[1]*64];
  arrow(ctx,from,to,'#80eecb',2,'prędkość');
 }
 ctx.fillStyle='#7d9cad';ctx.font='10px system-ui';
 ctx.fillText('WIDOK PLANETOCENTRYCZNY / TOR HIPERBOLICZNY W PŁASZCZYŹNIE PRZELOTU',14,L.h-15);
}
function vectorPanel(){
 const c=$('gaVectorsCanvas'),w=Math.max(230,c.clientWidth||360),h=Math.max(180,c.clientHeight||236),dpr=Math.min(2,window.devicePixelRatio||1);
 if(c.width!==Math.round(w*dpr)||c.height!==Math.round(h*dpr)){c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);}
 const ctx=c.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);
 return {ctx,w,h};
}
function drawVectors(){
 const m=state.model,c=$('gaVectorsCanvas');if(!m||!c)return;
 const {ctx,w,h}=vectorPanel();
 ctx.fillStyle='#071725';ctx.fillRect(0,0,w,h);
 const mid=[w*.50,h*.57],largest=Math.max(12,m.speedIn,m.speedOut,m.vPlanet+m.vinf);
 const scaleVector=Math.min(w*.37,h*.39)/largest;
 const pt=v=>[mid[0]+v[0]*scaleVector,mid[1]-v[1]*scaleVector];
 const origin=mid,V=pt(m.planetVelocity),before=pt(m.heliIn),after=pt(m.heliOut);
 ctx.beginPath();ctx.moveTo(0,mid[1]);ctx.lineTo(w,mid[1]);ctx.moveTo(mid[0],0);ctx.lineTo(mid[0],h);
 ctx.strokeStyle='#5b76902a';ctx.lineWidth=1;ctx.stroke();
 arrow(ctx,origin,V,'#ffcc8b',2.3,'V planety');
 arrow(ctx,V,before,'#7acbf2',2,'v∞ przed');
 arrow(ctx,V,after,'#9bf5ce',2,'v∞ po');
 arrow(ctx,origin,before,'#77bce7',2.1);
 arrow(ctx,origin,after,'#98e7c5',2.1);
 ctx.fillStyle='#aecddd';ctx.font='10px system-ui';
 ctx.fillText('WEKTORY PRĘDKOŚCI WZGLĘDEM SŁOŃCA',9,17);
 ctx.fillStyle='#65859a';ctx.font='9px system-ui';
 ctx.fillText('Skala wspólna dla wektorów · km/s',9,h-12);
}
function updateInputsAndReset(){
 readInputs();
 state.progress=0;state.playing=false;
 state.model=compute(state.planet,state.jd,state.vinf,state.altitude,state.approach,state.side);
 updateAll();
}
function frame(now){
 raf=0;if(!$('assistDialog')?.open)return;
 const dt=last?clamp((now-last)/1000,0,.07):0;last=now;
 if(state.playing){
  state.progress=clamp(state.progress+dt*state.rate/18,0,1);
  if(state.progress>=1)state.playing=false;
  status();
 }
 draw();
 if(state.playing)drawVectors();
 raf=requestAnimationFrame(frame);
}
function show(){
 const dlg=$('assistDialog');if(!dlg||dlg.open)return;
 state.priorPlaying=window.ATLAS_MAIN_API.getPlaying();
 window.ATLAS_MAIN_API.setPlaying(false);
 if(!state.initialized){
  state.initialized=true;
  const jd=window.ATLAS_MAIN_API.getJD();
  state.jd=clamp(jd,jdFromDate(new Date('1800-01-02T12:00:00Z')),jdFromDate(new Date('2050-12-28T12:00:00Z')));
 }
 syncInputs();
 state.model=compute(state.planet,state.jd,state.vinf,state.altitude,state.approach,state.side);
 dlg.showModal();last=0;updateAll();if(!raf)raf=requestAnimationFrame(frame);
}
function close(){state.playing=false;$('assistDialog').close();}
function setPreset(mode){
 const m=state.model||compute(state.planet,state.jd,state.vinf,state.altitude,state.approach,state.side);
 const delta=m.turn*RAD;
 const gain=mode==='boost';
 setParams({side:1,approach:gain?-90-delta/2:90-delta/2});
}
function snapshot(){state.saved={energy:state.model.energy,deltaSpeed:state.model.deltaSpeed,turn:state.model.turn,planet:state.planet,vinf:state.vinf,altitude:state.altitude,approach:state.approach,side:state.side};status();}
function restore(){
 const s=state.saved;if(!s)return;
 setParams({planet:s.planet,vinf:s.vinf,altitude:s.altitude,approach:s.approach,side:s.side});
}
function init(){
 if(!$('assistDialog')||!window.ATLAS_MAIN_API)return;
 for(const [id,planet]of Object.entries(PLANETS)){
  const opt=document.createElement('option');opt.value=id;opt.textContent=planet.label;$('gaPlanet').appendChild(opt);
 }
 $('openAssist').onclick=show;$('openAssistSide').onclick=show;$('gaClose').onclick=close;
 $('assistDialog').addEventListener('close',()=>{
  state.playing=false;last=0;
  if(raf){cancelAnimationFrame(raf);raf=0;}
  if(state.priorPlaying!==null)window.ATLAS_MAIN_API.setPlaying(state.priorPlaying);
  state.priorPlaying=null;
 });
 for(const id of ['gaPlanet','gaDate','gaVinf','gaAltitude','gaApproach','gaSide'])
  $(id).addEventListener(id==='gaVinf'||id==='gaAltitude'||id==='gaApproach'?'input':'change',updateInputsAndReset);
 $('gaRate').onchange=()=>{state.rate=Number($('gaRate').value)||1;};
 for(const [key,name]of [['gaVectors','showVectors'],['gaAsymptotes','showAsymptotes'],['gaGrid','showGrid']])
  $(key).onchange=()=>{state[name]=$(key).checked;updateAll();};
 $('gaProgress').oninput=()=>{state.playing=false;state.progress=clamp(Number($('gaProgress').value)/1000,0,1);updateAll();};
 $('gaPlay').onclick=()=>{if(state.progress>=1)state.progress=0;state.playing=!state.playing;status();};
 $('gaRestart').onclick=()=>reset();
 $('gaBoost').onclick=()=>setPreset('boost');$('gaBrake').onclick=()=>setPreset('brake');
 $('gaSave').onclick=snapshot;$('gaRestore').onclick=restore;
 $('gaResetCamera').onclick=()=>{state.zoom=1;state.panX=0;state.panY=0;updateAll();};
 const canvas=$('gaCanvas');
 canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});drag={x:e.clientX,y:e.clientY,px:state.panX,py:state.panY};if(pointers.size===2){const ps=[...pointers.values()];pinch=Math.hypot(ps[0].x-ps[1].x,ps[0].y-ps[1].y);}});
 canvas.addEventListener('pointermove',e=>{
  if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pointers.size===2){
   const ps=[...pointers.values()],d=Math.hypot(ps[0].x-ps[1].x,ps[0].y-ps[1].y);
   if(pinch>0)state.zoom=clamp(state.zoom*d/pinch,.5,12);
   pinch=d;
  }else if(drag){state.panX=drag.px+e.clientX-drag.x;state.panY=drag.py+e.clientY-drag.y;}
  draw();
 });
 const stop=e=>{pointers.delete(e.pointerId);drag=null;pinch=0;};
 canvas.addEventListener('pointerup',stop);canvas.addEventListener('pointercancel',stop);
 canvas.addEventListener('wheel',e=>{e.preventDefault();state.zoom=clamp(state.zoom*(e.deltaY>0?.91:1.11),.5,12);draw();},{passive:false});
 window.addEventListener('resize',()=>{if($('assistDialog').open)updateAll();});
 window.ATLAS_ASSIST_TEST={PLANETS,compute,velocityAt,anomalyAt,trajectoryPoint,vecFromProgress,rotation,show,state};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
