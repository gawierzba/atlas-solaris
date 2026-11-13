/* ATLAS SOLARIS 12.0 — Laboratorium Grawitacji
   Circular Restricted Three-Body Problem (CR3BP), planar, synodic normalized frame.
   Equations: ẍ = 2ẏ + Ωx; ÿ = -2ẋ + Ωy,
   Ω = (x²+y²)/2 + (1-μ)/r1 + μ/r2.
   C = 2Ω - vx² - vy² (Jacobi constant).
   Not a full ephemeris/N-body model and not an actual 3D halo orbit. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const TWO_PI=2*Math.PI, SQ3=Math.sqrt(3), RUT=0.0385208965045514;
const SYSTEMS={
 earthmoon:{
  name:'Ziemia — Księżyc',a:'Ziemia',b:'Księżyc',
  mu:7.34767309e22/(5.97219e24+7.34767309e22),
  separation:384400,period:27.321661,
  aRadius:6371,bRadius:1737.4,colorA:'#78b9ed',colorB:'#c6d2d8'
 },
 sunearth:{
  name:'Słońce — Ziemia',a:'Słońce',b:'Ziemia',
  mu:5.97219e24/(1.98847e30+5.97219e24),
  separation:149597870.7,period:365.2568983,
  aRadius:696340,bRadius:6371,colorA:'#ffc77c',colorB:'#79bcf7'
 }
};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const fmt=(n,d=2)=>Number(n).toLocaleString('pl-PL',{minimumFractionDigits:d,maximumFractionDigits:d});
const U={system:'earthmoon',point:'L4',offset:.5,kick:0,speed:1,playing:false,priorPlaying:null,
 view:'rotating',showZones:true,showVectors:true,showLabels:true,place:false,
 zoom:1,panX:0,panY:0,t:0,start:null,craft:null,C0:null,trail:[],reference:null,
 collision:null,energyMax:0,canvasQuality:1};
let raf=0,last=0,pointers=new Map(),drag=null,pinch=0,drawCounter=0,zoneCache=null,needsZones=true;
const config=()=>SYSTEMS[U.system];
function points(mu){
 const a=-mu,b=1-mu;
 const force=x=>{
  const d1=x-a,d2=x-b;
  return x-(1-mu)*d1/Math.pow(Math.abs(d1),3)-mu*d2/Math.pow(Math.abs(d2),3);
 };
 function root(lo,hi){
  let fl=force(lo);
  for(let i=0;i<85;i++){
   const mid=(lo+hi)/2,fm=force(mid);
   if(Math.sign(fl)===Math.sign(fm)){lo=mid;fl=fm;}else hi=mid;
  }
  return (lo+hi)/2;
 }
 return {
  L1:[root(a+1e-7,b-1e-7),0],
  L2:[root(b+1e-7,4),0],
  L3:[root(-4,a-1e-7),0],
  L4:[.5-mu,SQ3/2],
  L5:[.5-mu,-SQ3/2]
 };
}
function potential(s,mu){
 const x=s[0],y=s[1],dx1=x+mu,dx2=x-1+mu;
 const r1=Math.hypot(dx1,y),r2=Math.hypot(dx2,y);
 return .5*(x*x+y*y)+(1-mu)/r1+mu/r2;
}
function forceVectors(s,mu){
 const [x,y,vx,vy]=s,dx1=x+mu,dx2=x-1+mu;
 const r1=Math.max(1e-12,Math.hypot(dx1,y)),r2=Math.max(1e-12,Math.hypot(dx2,y));
 const g1=-(1-mu)/(r1*r1*r1),g2=-mu/(r2*r2*r2);
 return {
  a:[g1*dx1,g1*y],b:[g2*dx2,g2*y],
  centrifugal:[x,y],coriolis:[2*vy,-2*vx]
 };
}
function derivative(s,mu){
 const f=forceVectors(s,mu);
 return [s[2],s[3],f.a[0]+f.b[0]+f.centrifugal[0]+f.coriolis[0],f.a[1]+f.b[1]+f.centrifugal[1]+f.coriolis[1]];
}
function jacobi(s,mu){return 2*potential(s,mu)-s[2]*s[2]-s[3]*s[3];}
function rk4(s,dt,mu){
 const k1=derivative(s,mu),shift=(k,c)=>s.map((v,i)=>v+c*k[i]);
 const k2=derivative(shift(k1,dt/2),mu);
 const k3=derivative(shift(k2,dt/2),mu);
 const k4=derivative(shift(k3,dt),mu);
 return s.map((v,i)=>v+dt/6*(k1[i]+2*k2[i]+2*k3[i]+k4[i]));
}
function physical(s){
 const c=config(),distanceUnit=c.separation,velocityUnit=c.separation*TWO_PI/(c.period*86400)*1000;
 return {distanceUnit,velocityUnit,accUnit:velocityUnit*TWO_PI/(c.period*86400)};
}
function initial(){
 if(U.point==='custom'&&U.start)return U.start.slice();
 const p=points(config().mu)[U.point]||points(config().mu).L4;
 const frac=U.offset/100,velocity=U.kick/physical().velocityUnit;
 return [p[0]+frac,p[1],0,velocity];
}
function reset({preserveReference=true}={}){
 U.playing=false;U.collision=null;U.t=0;U.energyMax=0;
 if(!preserveReference)U.reference=null;
 U.start=initial();U.craft=U.start.slice();
 U.C0=jacobi(U.craft,config().mu);
 U.trail=[{t:0,x:U.craft[0],y:U.craft[1]}];
 needsZones=true;sync();draw();
}
function updateInput(){
 U.system=$('gravSystem').value;
 U.point=$('gravPoint').value;
 U.offset=Number($('gravOffset').value)||0;
 U.kick=Number($('gravKick').value)||0;
 U.speed=Number($('gravSpeed').value)||1;
 U.view=$('gravView').value;
 U.showZones=$('gravZones').checked;
 U.showVectors=$('gravVectors').checked;
 U.showLabels=$('gravLabels').checked;
 U.place=$('gravPlace').checked;
}
function sync(){
 const c=config(),p=points(c.mu),s=U.craft||initial(),J=jacobi(s,c.mu),f=forceVectors(s,c.mu),P=physical();
 const aDist=Math.hypot(s[0]+c.mu,s[1])*c.separation;
 const bDist=Math.hypot(s[0]-1+c.mu,s[1])*c.separation;
 const speed=Math.hypot(s[2],s[3])*P.velocityUnit;
 $('gravClock').textContent=fmt(U.t*c.period/TWO_PI,2)+' dób';
 $('gravJacobi').textContent=fmt(J,8);
 $('gravDrift').textContent=fmt(Math.abs(J-U.C0)/Math.max(1,Math.abs(U.C0))*100,5)+'%';
 $('gravDrift').className=Math.abs(J-U.C0)/Math.max(1,Math.abs(U.C0))>1e-5?'grav-warn':'';
 $('gravBodyADist').textContent=aDist>=1e6?fmt(aDist/1e6,2)+' mln km':fmt(aDist,0)+' km';
 $('gravBodyBDist').textContent=bDist>=1e6?fmt(bDist/1e6,2)+' mln km':fmt(bDist,0)+' km';
 $('gravRotSpeed').textContent=fmt(speed,2)+' m/s';
 $('gravAccA').textContent=fmt(Math.hypot(...f.a)*P.accUnit,6)+' m/s²';
 $('gravAccB').textContent=fmt(Math.hypot(...f.b)*P.accUnit,6)+' m/s²';
 $('gravLNote').textContent=U.point==='custom'?'Sonda ustawiona ręcznie na mapie.':U.point+' — '+(U.point==='L4'||U.point==='L5'?'punkt trójkątny; liniowo stabilny w modelu idealnym.':'punkt współliniowy; niestabilny wobec małych zaburzeń.');
 $('gravSystemTitle').textContent=c.name;
 $('gravMu').textContent='μ = '+c.mu.toExponential(7).replace('.',',');
 $('gravPeriod').textContent=fmt(c.period,3)+' d';
 $('gravSep').textContent=fmt(c.separation,0)+' km';
 $('gravStatus').textContent=U.collision?U.collision:U.playing?'SYMULACJA TRWA':'CZAS ZATRZYMANY';
 $('gravStatus').className=U.collision?'grav-danger':'';
 $('gravPlay').textContent=U.playing?'Ⅱ Pauza':'▶ Odtwórz';
 $('gravOffsetLabel').textContent=fmt(U.offset,2)+'% odległości';
 $('gravKickLabel').textContent=fmt(U.kick,0)+' m/s';
 $('gravTrailCount').textContent=U.trail.length.toLocaleString('pl-PL')+' punktów';
 $('gravCompare').disabled=U.trail.length<2;
 $('gravViewNote').textContent=U.view==='rotating'?'Układ obracający się razem z ciałami: punkty Lagrange’a są nieruchome.':'Układ inercjalny: obydwa główne ciała obracają się wokół barycentrum.';
 const epsilon=Math.abs(J-U.C0);
 U.energyMax=Math.max(U.energyMax,epsilon);
 $('gravEnergyMax').textContent=U.energyMax.toExponential(2);
 if(!U.playing) $('gravLive').textContent=U.collision?'Zderzenie / koniec obliczeń':'Gotowy do eksperymentu';
}
function updateControls(){
 $('gravSystem').value=U.system;
 $('gravPoint').value=U.point;
 $('gravOffset').value=String(U.offset);
 $('gravKick').value=String(U.kick);
 $('gravSpeed').value=String(U.speed);
 $('gravView').value=U.view;
 $('gravZones').checked=U.showZones;
 $('gravVectors').checked=U.showVectors;
 $('gravLabels').checked=U.showLabels;
 $('gravPlace').checked=U.place;
}
function collision(s){
 const c=config(),r1=Math.hypot(s[0]+c.mu,s[1])*c.separation,r2=Math.hypot(s[0]-1+c.mu,s[1])*c.separation;
 if(r1<=c.aRadius)return 'KONIEC: zderzenie z obiektem '+c.a;
 if(r2<=c.bRadius)return 'KONIEC: zderzenie z obiektem '+c.b;
 if(!s.every(Number.isFinite)||Math.max(Math.abs(s[0]),Math.abs(s[1]))>80)return 'KONIEC: ucieczka poza zakres symulacji';
 return null;
}
function advance(dt){
 if(!U.craft||U.collision)return;
 const mu=config().mu,near=Math.min(Math.hypot(U.craft[0]+mu,U.craft[1]),Math.hypot(U.craft[0]-1+mu,U.craft[1]));
 const step=Math.max(.00025,Math.min(.008,.12*Math.pow(near,1.45)));
 const capped=Math.min(dt,step*220);
 let left=capped,steps=0;
 while(left>1e-10&&steps<240){
  const h=Math.min(step,left),next=rk4(U.craft,h,mu);
  U.craft=next;U.t+=h;left-=h;steps++;
  const lastPoint=U.trail[U.trail.length-1];
  if(U.t-lastPoint.t>.0045||left<=1e-10){
   U.trail.push({t:U.t,x:next[0],y:next[1]});
   if(U.trail.length>5500)U.trail.shift();
  }
  U.collision=collision(next);
  if(U.collision){U.playing=false;break;}
 }
}
function frame(now){
 raf=0;const d=$('gravityDialog');if(!d?.open)return;
 const dt=last?clamp((now-last)/1000,0,.08):0;last=now;
 if(U.playing){
  advance(dt*U.speed*TWO_PI/config().period);
  if(++drawCounter%4===0)sync();
 }
 draw();
 raf=requestAnimationFrame(frame);
}
function viewPoint(x,y,t){
 if(U.view==='rotating')return [x,y];
 const a=t,c=Math.cos(a),s=Math.sin(a);
 return [x*c-y*s,x*s+y*c];
}
function layout(){
 const canvas=$('gravCanvas'),w=Math.max(280,canvas.clientWidth||780),h=Math.max(280,canvas.clientHeight||520);
 const scale=Math.min(w/3.6,h/3.0)*U.zoom;
 return {w,h,scale,cx:w*.51+U.panX,cy:h*.53+U.panY};
}
function screen(x,y,t,L){
 const p=viewPoint(x,y,t);return [L.cx+p[0]*L.scale,L.cy-p[1]*L.scale];
}
function unscreen(x,y,L){
 const rot=[(x-L.cx)/L.scale,-(y-L.cy)/L.scale];
 if(U.view==='rotating')return rot;
 const a=-U.t,c=Math.cos(a),s=Math.sin(a);
 return [rot[0]*c-rot[1]*s,rot[0]*s+rot[1]*c];
}
function shadePotential(L){
 if(!U.showZones||U.view!=='rotating')return null;
 const key=[config().mu,U.C0,L.w,L.h,L.scale,L.cx,L.cy].map(v=>Number(v).toPrecision(7)).join('/');
 if(!needsZones&&zoneCache?.key===key)return zoneCache.canvas;
 const c=document.createElement('canvas'),resolution=5;
 c.width=Math.max(1,Math.ceil(L.w/resolution));c.height=Math.max(1,Math.ceil(L.h/resolution));
 const ctx=c.getContext('2d');if(!ctx)return null;
 const pixels=ctx.createImageData(c.width,c.height),mu=config().mu;
 for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){
  const xx=((x+.5)*resolution-L.cx)/L.scale,yy=(L.cy-(y+.5)*resolution)/L.scale;
  const omega=potential([xx,yy],mu),blocked=2*omega < U.C0;
  const v=clamp(Math.abs(2*omega-U.C0),0,2);
  const i=(y*c.width+x)*4;
  pixels.data[i]=blocked?148:34;
  pixels.data[i+1]=blocked?69:138;
  pixels.data[i+2]=blocked?97:169;
  pixels.data[i+3]=blocked?40+v*12:8+v*8;
 }
 ctx.putImageData(pixels,0,0);
 zoneCache={key,canvas:c};needsZones=false;return c;
}
function background(ctx,L){
 const bg=ctx.createRadialGradient(L.cx,L.cy,30,L.cx,L.cy,Math.max(L.w,L.h)*.82);
 bg.addColorStop(0,'#102740');bg.addColorStop(.45,'#071728');bg.addColorStop(1,'#030a16');
 ctx.fillStyle=bg;ctx.fillRect(0,0,L.w,L.h);
 for(let i=0;i<160;i++){
  const x=(i*157.821+27.7)%L.w,y=(i*73.381+18.6)%L.h;
  ctx.fillStyle=i%8===0?'#b2cbda80':'#92b8d14a';
  ctx.beginPath();ctx.arc(x,y,i%13===0?1.2:.6,0,TWO_PI);ctx.fill();
 }
 if(U.showZones&&U.view==='rotating'){
  const shaded=shadePotential(L);if(shaded){ctx.imageSmoothingEnabled=true;ctx.drawImage(shaded,0,0,L.w,L.h);}
 }
}
function line(ctx,pts,stroke,width=1.3,dash=[]){
 if(pts.length<2)return;
 ctx.beginPath();pts.forEach((pt,i)=>{if(!i)ctx.moveTo(pt[0],pt[1]);else ctx.lineTo(pt[0],pt[1]);});
 ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([]);
}
function circle(ctx,x,y,r,fill,glow=0){
 ctx.save();ctx.fillStyle=fill;ctx.shadowColor=fill;ctx.shadowBlur=glow;
 ctx.beginPath();ctx.arc(x,y,r,0,TWO_PI);ctx.fill();ctx.restore();
}
function orbit(ctx,L,center,r,stroke){
 const pts=[];
 for(let i=0;i<=160;i++){
  const t=TWO_PI*i/160,pt=screen(center[0]+r*Math.cos(t),center[1]+r*Math.sin(t),U.view==='rotating'?0:U.t,L);
  pts.push(pt);
 }
 line(ctx,pts,stroke,1,[3,5]);
}
function vectors(ctx,L){
 const s=U.craft,mu=config().mu,v=forceVectors(s,mu);
 const at=screen(s[0],s[1],U.t,L);
 const defs=[['a','#62adf1'],['b','#d5e8f5'],['centrifugal','#dda7ec'],['coriolis','#73d9bc']];
 const max=Math.max(...defs.map(([k])=>Math.hypot(...v[k])));
 for(const [key,col]of defs){
  const f=v[key],len=Math.hypot(...f);if(len<1e-13)continue;
  const arrowLen=clamp(9+50*Math.sqrt(len/Math.max(.00001,max)),9,65);
  const a=U.view==='inertial'?U.t:0,co=Math.cos(a),si=Math.sin(a);
  const dx=(f[0]*co-f[1]*si)/len,dy=(f[0]*si+f[1]*co)/len;
  const bx=at[0]+dx*arrowLen,by=at[1]-dy*arrowLen,ang=Math.atan2(by-at[1],bx-at[0]);
  ctx.beginPath();ctx.moveTo(...at);ctx.lineTo(bx,by);
  ctx.strokeStyle=col;ctx.lineWidth=2;ctx.stroke();
  ctx.save();ctx.translate(bx,by);ctx.rotate(ang);ctx.fillStyle=col;
  ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-9,-4);ctx.lineTo(-9,4);ctx.closePath();ctx.fill();ctx.restore();
 }
}
function draw(){
 if(!U.craft)return;
 const canvas=$('gravCanvas'),L=layout(),dpr=Math.min(2,window.devicePixelRatio||1);
 const W=Math.round(L.w*dpr),H=Math.round(L.h*dpr);
 if(canvas.width!==W||canvas.height!==H){canvas.width=W;canvas.height=H;}
 const ctx=canvas.getContext('2d');if(!ctx)return;
 ctx.setTransform(dpr,0,0,dpr,0,0);background(ctx,L);
 const c=config(),pts=points(c.mu),a=[-c.mu,0],b=[1-c.mu,0];
 const zero=screen(0,0,0,L);
 circle(ctx,zero[0],zero[1],2.3,'#5f8eac');
 const axes=[screen(-8,0,0,L),screen(8,0,0,L),screen(0,-8,0,L),screen(0,8,0,L)];
 line(ctx,[axes[0],axes[1]],'#47678435',1);line(ctx,[axes[2],axes[3]],'#47678435',1);
 if(U.view==='inertial'){
  orbit(ctx,L,[0,0],c.mu,'#6c9ec448');orbit(ctx,L,[0,0],1-c.mu,'#6c9ec448');
 }
 if(U.reference?.length>1){
  const trace=U.reference.map(p=>screen(p.x,p.y,p.t,L));
  line(ctx,trace,'#e4a7ea82',1.4,[5,6]);
 }
 if(U.trail.length>1)line(ctx,U.trail.map(p=>screen(p.x,p.y,p.t,L)),'#7ae6c7',2.2);
 for(const [name,p]of Object.entries(pts)){
  const point=screen(p[0],p[1],U.t,L);
  const selected=U.point===name;
  ctx.strokeStyle=selected?'#a0fff2':'#7ba9c4bb';ctx.lineWidth=selected?1.7:1;
  ctx.beginPath();ctx.arc(point[0],point[1],selected?11:7,0,TWO_PI);ctx.stroke();
  circle(ctx,point[0],point[1],selected?3.8:2.6,selected?'#91ffea':'#acc1db');
  if(U.showLabels){
   ctx.fillStyle=selected?'#b5fff2':'#a8c8d9';ctx.font='700 11px system-ui';
   ctx.fillText(name,point[0]+13,point[1]-10);
  }
 }
 for(const [p,name,color,size] of [[a,c.a,c.colorA,15],[b,c.b,c.colorB,U.system==='earthmoon'?9:6]]){
  const q=screen(p[0],p[1],U.t,L);
  const r=size;
  const glow=ctx.createRadialGradient(q[0]-r*.3,q[1]-r*.3,r*.1,q[0],q[1],r*1.8);
  glow.addColorStop(0,'#fffdf6');glow.addColorStop(.23,color);glow.addColorStop(1,'#21334b22');
  ctx.fillStyle=glow;ctx.beginPath();ctx.arc(q[0],q[1],r*1.8,0,TWO_PI);ctx.fill();
  if(U.showLabels){ctx.fillStyle='#dceaf6';ctx.font='650 12px system-ui';ctx.fillText(name,q[0]+r+4,q[1]+18);}
 }
 if(U.showVectors)vectors(ctx,L);
 const p=screen(U.craft[0],U.craft[1],U.t,L);
 circle(ctx,p[0],p[1],5.2,'#c8fff4',14);
 ctx.strokeStyle='#cbfff4aa';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(p[0],p[1],11,0,TWO_PI);ctx.stroke();
 if(U.showLabels){ctx.font='700 11px system-ui';ctx.fillStyle='#e0fff9';ctx.fillText('SONDA',p[0]+15,p[1]-13);}
 ctx.font='10px system-ui';ctx.fillStyle='#8cb0c5';ctx.fillText('MODEL CR3BP · SKALA W PŁASZCZYŹNIE ORBIT · NIE JEST TO WIDOK PERSPEKTYWICZNY',15,L.h-14);
}
function show(){
 const dlg=$('gravityDialog');if(!dlg||dlg.open)return;
 U.priorPlaying=window.ATLAS_MAIN_API?.getPlaying?.()??false;
 window.ATLAS_MAIN_API?.setPlaying?.(false);
 dlg.showModal();last=0;if(!raf)raf=requestAnimationFrame(frame);
 sync();draw();
}
function close(){
 U.playing=false;$('gravityDialog').close();
}
function preset(name){
 if(!points(config().mu)[name])return;
 U.point=name;
 $('gravPoint').value=name;
 reset();
}
function saveReference(){
 U.reference=U.trail.map(p=>({...p}));
 $('gravReference').textContent='ŚLAD A ZAPISANY · '+U.reference.length.toLocaleString('pl-PL')+' punktów';
 draw();
}
function clearReference(){U.reference=null;$('gravReference').textContent='Brak zapisanego śladu';draw();}
function handlePointer(){
 const canvas=$('gravCanvas');let down=null;
 canvas.addEventListener('pointerdown',e=>{
  canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  down={x:e.clientX,y:e.clientY,px:U.panX,py:U.panY,moved:false};
  if(pointers.size===2){const a=[...pointers.values()];pinch=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);}
 });
 canvas.addEventListener('pointermove',e=>{
  if(!pointers.has(e.pointerId))return;
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(!down)return;
  if(Math.hypot(e.clientX-down.x,e.clientY-down.y)>7)down.moved=true;
  if(pointers.size>=2){
   const a=[...pointers.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);
   if(pinch>1)U.zoom=clamp(U.zoom*d/pinch,.45,8);
   pinch=d;needsZones=true;
  }else if(down.moved){
   U.panX=down.px+e.clientX-down.x;
   U.panY=down.py+e.clientY-down.y;needsZones=true;
  }
  draw();
 });
 const stop=e=>{
  if(down&&!down.moved&&pointers.size===1&&e.type==='pointerup'){
   const r=canvas.getBoundingClientRect(),L=layout();
   const x=(e.clientX-r.left)*L.w/r.width,y=(e.clientY-r.top)*L.h/r.height;
   const pts=points(config().mu);
   const match=Object.entries(pts).find(([k,p])=>Math.hypot(...screen(p[0],p[1],U.t,L).map((v,i)=>v-[x,y][i]))<17);
   if(match)preset(match[0]);
   else if(U.place){
    const v=unscreen(x,y,L);
    if(Number.isFinite(v[0])&&Number.isFinite(v[1])&&Math.hypot(v[0],v[1])<8){
     U.point='custom';U.start=[v[0],v[1],0,0];$('gravPoint').value='custom';reset();
    }
   }
  }
  pointers.delete(e.pointerId);down=null;pinch=0;
 };
 canvas.addEventListener('pointerup',stop);canvas.addEventListener('pointercancel',stop);
 canvas.addEventListener('wheel',e=>{e.preventDefault();U.zoom=clamp(U.zoom*(e.deltaY>0?.9:1.1),.45,8);needsZones=true;draw();},{passive:false});
 canvas.addEventListener('keydown',e=>{
  if(e.key==='+'||e.key==='=')U.zoom=clamp(U.zoom*1.15,.45,8);
  else if(e.key==='-')U.zoom=clamp(U.zoom/1.15,.45,8);
  else if(e.key==='ArrowLeft')U.panX+=25;
  else if(e.key==='ArrowRight')U.panX-=25;
  else if(e.key==='ArrowUp')U.panY+=25;
  else if(e.key==='ArrowDown')U.panY-=25;
  else return;
  e.preventDefault();needsZones=true;draw();
 });
}
function init(){
 if(!$('gravityDialog'))return;
 for(const id of ['earthmoon','sunearth']){
  const op=document.createElement('option');op.value=id;op.textContent=SYSTEMS[id].name;$('gravSystem').appendChild(op);
 }
 for(const id of ['L1','L2','L3','L4','L5','custom']){
  const op=document.createElement('option');op.value=id;op.textContent=id==='custom'?'Ręcznie wybrany punkt':id;$('gravPoint').appendChild(op);
 }
 updateControls();reset();
 $('openGravity').onclick=show;$('openGravitySide').onclick=show;$('gravClose').onclick=close;
 $('gravityDialog').addEventListener('close',()=>{
  U.playing=false;last=0;
  if(raf){cancelAnimationFrame(raf);raf=0;}
  if(U.priorPlaying!==null)window.ATLAS_MAIN_API?.setPlaying?.(U.priorPlaying);
  U.priorPlaying=null;
 });
 $('gravSystem').onchange=()=>{
  updateInput();U.point='L4';U.start=null;U.zoom=1;U.panX=0;U.panY=0;U.reference=null;
  $('gravPoint').value='L4';$('gravReference').textContent='Brak zapisanego śladu';reset({preserveReference:false});
 };
 $('gravPoint').onchange=()=>{
  const next=$('gravPoint').value;
  if(next==='custom'&&!U.start){$('gravPoint').value=U.point;return;}
  updateInput();reset();
 };
 for(const id of ['gravOffset','gravKick'])$(id).oninput=()=>{updateInput();reset();};
 $('gravSpeed').onchange=()=>{U.speed=Number($('gravSpeed').value)||1;sync();};
 $('gravView').onchange=()=>{U.view=$('gravView').value;needsZones=true;sync();draw();};
 $('gravZones').onchange=()=>{U.showZones=$('gravZones').checked;needsZones=true;draw();};
 $('gravVectors').onchange=()=>{U.showVectors=$('gravVectors').checked;draw();};
 $('gravLabels').onchange=()=>{U.showLabels=$('gravLabels').checked;draw();};
 $('gravPlace').onchange=()=>{U.place=$('gravPlace').checked;};
 $('gravPlay').onclick=()=>{if(U.collision)reset();U.playing=!U.playing;sync();};
 $('gravRestart').onclick=()=>reset();
 $('gravCompare').onclick=saveReference;
 $('gravClearCompare').onclick=clearReference;
 $('gravCenter').onclick=()=>{U.zoom=1;U.panX=0;U.panY=0;needsZones=true;draw();};
 for(const name of ['L1','L2','L3','L4','L5'])$('gravPick'+name).onclick=()=>preset(name);
 handlePointer();
 window.addEventListener('resize',()=>{if($('gravityDialog').open){needsZones=true;draw();}});
 window.ATLAS_GRAVITY_TEST={points,derivative,potential,jacobi,rk4,advance,collision,physical,initial,reset,U,SYSTEMS};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
