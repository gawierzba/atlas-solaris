/* ATLAS SOLARIS 10.0 — Centrum Misji
   Transfer Hohmanna: model kołowy, współpłaszczyznowy, dwuciałowy.
   Pozycje planet: wspólny silnik JPL Atlasu (API v8+).
   Nie jest to solver Lamberta, pełna dynamika lotu ani okna startowe NASA. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const AU=149597870.7, MU=132712440018, DAY=86400, TAU=2*Math.PI, YR=365.2568983;
const worlds={
 mercury:{name:'Merkury',r:.387098,color:'#b2b3bd'},
 venus:{name:'Wenus',r:.723332,color:'#e6bd8e'},
 earth:{name:'Ziemia',r:1,color:'#6cbef4'},
 mars:{name:'Mars',r:1.523679,color:'#e68a68'},
 jupiter:{name:'Jowisz',r:5.2044,color:'#dcb69d'},
 saturn:{name:'Saturn',r:9.5826,color:'#d9c79a'}
};
const routes=[['earth','mars'],['earth','venus'],['earth','jupiter'],['earth','saturn'],['mars','earth']];
const bound=(v,a,b)=>Math.min(b,Math.max(a,v));
const mod=a=>(a%TAU+TAU)%TAU;
const wrap=a=>mod(a+Math.PI)-Math.PI;
const rad=d=>d*Math.PI/180;
const fmt=(n,d=1)=>Number(n).toLocaleString('pl-PL',{minimumFractionDigits:d,maximumFractionDigits:d});
const jdDate=jd=>new Date((jd-2440587.5)*86400000);
const dateJD=date=>date.getTime()/86400000+2440587.5;
const dateLabel=jd=>jdDate(jd).toLocaleDateString('pl-PL',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'});
const inputDay=jd=>jdDate(jd).toISOString().slice(0,10);
const dayFromInput=text=>{const d=new Date(text+'T12:00:00Z');return Number.isFinite(d.getTime())?dateJD(d):null;};
const norm2=p=>Math.hypot(p[0],p[1]);
const angle=p=>Math.atan2(p[1],p[0]);
const api=()=>window.ATLAS_MAIN_API;
const state={from:'earth',to:'mars',launch:dateJD(new Date()),elapsed:0,speed:7,playing:false,priorPlay:false,firstOpen:true,zoom:1,spin:-.27,panX:0,panY:0,plan:null,win:null};
let raf=0,last=0,drag=null,pointers=new Map(),pinch=0;
function calc(from,to){
 const r1=worlds[from].r,r2=worlds[to].r,a=(r1+r2)/2,e=Math.abs(r2-r1)/(r1+r2);
 const seconds=Math.PI*Math.sqrt(Math.pow(a*AU,3)/MU),days=seconds/DAY;
 const n2=TAU/(YR*Math.pow(r2,1.5));
 const needed=mod(Math.PI-n2*days);
 const vc1=Math.sqrt(MU/(r1*AU)),vc2=Math.sqrt(MU/(r2*AU));
 const vt1=Math.sqrt(MU*(2/(r1*AU)-1/(a*AU))),vt2=Math.sqrt(MU*(2/(r2*AU)-1/(a*AU)));
 const dv1=Math.abs(vt1-vc1),dv2=Math.abs(vt2-vc2),b=a*Math.sqrt(1-e*e);
 const halfLength=Math.PI*(3*(a+b)-Math.sqrt((3*a+b)*(a+3*b)))*AU/2;
 return {r1,r2,a,e,days,needed,dv1,dv2,total:dv1+dv2,halfLength};
}
function phase(jd,plan){
 const p=api().positions(jd);
 return wrap(angle(p[state.to])-angle(p[state.from])-plan.needed);
}
function nextWindow(jd,plan){
 const end=Math.min(dateJD(new Date('2050-12-30T00:00:00Z')),jd+2200);
 let prevJD=jd,prev=phase(jd,plan),best={jd,error:Math.abs(prev)};
 for(let x=jd+2;x<=end;x+=2){
  const cur=phase(x,plan),a=Math.abs(cur);
  if(a<best.error)best={jd:x,error:a};
  if(prev*cur<=0&&Math.abs(prev-cur)<1){
   let left=prevJD,right=x,fl=prev;
   for(let k=0;k<25;k++){const mid=(left+right)/2,fm=phase(mid,plan);if(fl*fm<=0)right=mid;else{left=mid;fl=fm;}}
   return {jd:(left+right)/2,error:0};
  }
  prev=cur;prevJD=x;
 }
 return best;
}
function orbitXY(u,p,theta){
 const mean=(p.r2>p.r1?0:Math.PI)+Math.PI*u;
 let E=mean;
 for(let i=0;i<14;i++){const de=(E-p.e*Math.sin(E)-mean)/(1-p.e*Math.cos(E));E-=de;if(Math.abs(de)<1e-12)break;}
 const f=Math.atan2(Math.sqrt(1-p.e*p.e)*Math.sin(E),Math.cos(E)-p.e);
 const nu=p.r2>p.r1?mod(f):mod(f-Math.PI);
 const r=p.a*(1-p.e*Math.cos(E));
 return [r*Math.cos(theta+nu),r*Math.sin(theta+nu),0];
}
function rebuild(){
 if(state.from===state.to){state.to=state.from==='mars'?'earth':'mars';$('mcTarget').value=state.to;}
 state.plan=calc(state.from,state.to);
 state.elapsed=0;state.playing=false;
 state.win=nextWindow(state.launch,state.plan);
 update();
}
function setLaunch(jd){
 const max=dateJD(new Date('2050-12-31T00:00:00Z')),min=dateJD(new Date('1800-01-01T00:00:00Z'));
 state.launch=bound(jd,min,max);
 $('mcDate').value=inputDay(state.launch);
 rebuild();
}
function choose(from,to){
 state.from=from;state.to=to;
 $('mcOrigin').value=from;$('mcTarget').value=to;
 document.querySelectorAll('[data-mc-route]').forEach(b=>b.classList.toggle('active',b.dataset.mcRoute===from+'-'+to));
 rebuild();
}
function syncUI(){
 const p=state.plan;if(!p)return;
 const err=Math.abs(phase(state.launch,p))*180/Math.PI;
 $('mcLaunch').textContent=dateLabel(state.launch);
 $('mcArrival').textContent=dateLabel(state.launch+p.days);
 $('mcDuration').textContent=fmt(p.days,0)+' dni';
 $('mcDV').textContent=fmt(p.total,2)+' km/s';
 $('mcDVDetail').textContent='odlot '+fmt(p.dv1,2)+' · hamowanie '+fmt(p.dv2,2)+' km/s';
 $('mcPhase').textContent=fmt(mod(p.needed)*180/Math.PI,1)+'°';
 $('mcError').textContent=fmt(err,1)+'°';
 $('mcError').className=err<3?'mc-good':err<12?'mc-warn':'mc-bad';
 $('mcWindow').textContent=state.win?dateLabel(state.win.jd):'Poza zakresem modelu';
 $('mcDistance').textContent=fmt(p.halfLength/1e6,0)+' mln km';
 $('mcRouteTitle').textContent=worlds[state.from].name+' → '+worlds[state.to].name;
 $('mcWindowInfo').textContent=err<3?'Dobra zgodność fazy w modelu kołowym.':err<12?'Faza zbliżona, ale nieoptymalna.':'Niedopasowanie fazy: wybierz najbliższe okno startowe.';
 $('mcProgress').max=Math.round(p.days*10);$('mcProgress').value=Math.round(state.elapsed*10);
 $('mcProgressDate').textContent=dateLabel(state.launch+state.elapsed);
 $('mcProgressPercent').textContent=fmt(100*state.elapsed/p.days,0)+'% lotu';
 $('mcPlay').textContent=state.playing?'Ⅱ Pauza':'▶ Odtwórz lot';
 $('mcDate').value=inputDay(state.launch);
}
function update(){syncUI();draw();}
function toScreen(x,y,w,h,s){
 const a=Math.atan2(y,x)+state.spin,r=Math.hypot(x,y);
 return [w*.49+state.panX+Math.cos(a)*r*s,h*.53+state.panY-Math.sin(a)*r*s*.8];
}
function draw(){
 const canvas=$('mcCanvas');if(!canvas||!state.plan)return;
 const w=Math.max(240,canvas.clientWidth),h=Math.max(280,canvas.clientHeight),dpr=Math.min(2,window.devicePixelRatio||1);
 const W=Math.round(w*dpr),H=Math.round(h*dpr);
 if(canvas.width!==W||canvas.height!==H){canvas.width=W;canvas.height=H;}
 const ctx=canvas.getContext('2d');if(!ctx)return;ctx.setTransform(dpr,0,0,dpr,0,0);
 const bg=ctx.createRadialGradient(w*.5,h*.54,20,w*.5,h*.5,Math.max(w,h)*.74);
 bg.addColorStop(0,'#12263c');bg.addColorStop(.5,'#071321');bg.addColorStop(1,'#030812');
 ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
 for(let i=0;i<155;i++){
  const sx=((i*97.71+29.3)%101)/101*w,sy=((i*47.37+13.1)%103)/103*h;
  ctx.fillStyle=i%9===0?'#b8d9ed88':'#95b3ce44';
  ctx.beginPath();ctx.arc(sx,sy,i%13===0?1.2:.65,0,TAU);ctx.fill();
 }
 const p=state.plan, rmax=Math.max(p.r1,p.r2),scale=Math.min(w*.41,h*.43)/(rmax*1.17)*state.zoom;
 const project=(x,y)=>toScreen(x,y,w,h,scale);
 const world=api().positions(state.launch+state.elapsed),depart=api().positions(state.launch);
 const theta=angle(depart[state.from]);
 const sun=project(0,0);
 ctx.save();ctx.lineWidth=1;
 for(const [key,v] of Object.entries(worlds)){
  const r=v.r;if(r>rmax*1.6)continue;
  ctx.beginPath();
  for(let i=0;i<=160;i++){const a=i/160*TAU,q=project(r*Math.cos(a),r*Math.sin(a));if(i)ctx.lineTo(q[0],q[1]);else ctx.moveTo(q[0],q[1]);}
  ctx.strokeStyle=(key===state.from||key===state.to)?'#4e789e70':'#44627d28';ctx.setLineDash(key===state.from||key===state.to?[]:[3,7]);ctx.stroke();
 }
 ctx.setLineDash([]);
 const full=[],done=[],segments=220;
 for(let i=0;i<=segments;i++){
  const xy=orbitXY(i/segments,p,theta),pt=project(xy[0],xy[1]);full.push(pt);
  if(i/segments<=state.elapsed/p.days)done.push(pt);
 }
 const pathDraw=(points,color,width)=>{ctx.beginPath();points.forEach((pt,i)=>i?ctx.lineTo(pt[0],pt[1]):ctx.moveTo(pt[0],pt[1]));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();};
 pathDraw(full,'#38c7e599',2.1);if(done.length>1)pathDraw(done,'#9bf5ec',3.8);
 const targetAtArrival=api().positions(state.launch+p.days)[state.to],future=project(targetAtArrival[0],targetAtArrival[1]);
 ctx.beginPath();ctx.arc(future[0],future[1],11,0,TAU);ctx.strokeStyle='#e4f5ff77';ctx.lineWidth=1.2;ctx.setLineDash([3,4]);ctx.stroke();ctx.setLineDash([]);
 ctx.fillStyle='#c0dceb';ctx.font='10px system-ui';ctx.fillText('CEL W CHWILI PRZYLOTU',future[0]+13,future[1]-12);
 const gl=ctx.createRadialGradient(sun[0],sun[1],4,sun[0],sun[1],42);gl.addColorStop(0,'#fff7ca');gl.addColorStop(.2,'#ffd68b');gl.addColorStop(.54,'#f8a34d55');gl.addColorStop(1,'#eb9e4600');
 ctx.fillStyle=gl;ctx.beginPath();ctx.arc(sun[0],sun[1],42,0,TAU);ctx.fill();
 ctx.fillStyle='#ffdc95';ctx.beginPath();ctx.arc(sun[0],sun[1],Math.max(4,6*state.zoom**.3),0,TAU);ctx.fill();
 ctx.font='600 12px system-ui';
 for(const key of Object.keys(worlds)){
  const v=worlds[key],pos=world[key],q=project(pos[0],pos[1]);
  if(q[0]<-50||q[0]>w+50||q[1]<-50||q[1]>h+50)continue;
  const major=key===state.from||key===state.to,rr=major?6.5:3.5;
  ctx.beginPath();ctx.arc(q[0],q[1],rr,0,TAU);ctx.fillStyle=v.color;ctx.shadowColor=v.color;ctx.shadowBlur=major?12:3;ctx.fill();ctx.shadowBlur=0;
  ctx.fillStyle=major?'#e8f3fc':'#89a4b7';ctx.fillText(v.name,q[0]+rr+5,q[1]-rr-4);
 }
 const u=bound(state.elapsed/p.days,0,1),ship=orbitXY(u,p,theta),near=orbitXY(bound(u+.003,0,1),p,theta);
 const a=project(ship[0],ship[1]),b=project(near[0],near[1]);
 let spin=Math.atan2(b[1]-a[1],b[0]-a[0]);if(u>=.999)spin=Math.atan2(a[1]-h*.53,a[0]-w*.49);
 ctx.save();ctx.translate(a[0],a[1]);ctx.rotate(spin);ctx.fillStyle='#bbfff6';ctx.shadowColor='#45dcca';ctx.shadowBlur=17;
 ctx.beginPath();ctx.moveTo(11,0);ctx.lineTo(-8,-5.2);ctx.lineTo(-3,0);ctx.lineTo(-8,5.2);ctx.closePath();ctx.fill();ctx.restore();
 ctx.fillStyle='#caedee';ctx.font='600 11px system-ui';ctx.fillText('SONDA',a[0]+12,a[1]-14);
 ctx.restore();
 // Scale bar is approximate because orbital views are flattened in Y.
 ctx.fillStyle='#88a9c2';ctx.font='10px system-ui';ctx.fillText('ORBITY · AU  |  WIDOK Z GÓRY, SPŁASZCZENIE PERSPEKTYWICZNE',15,h-17);
 $('mcCanvasTime').textContent=dateLabel(state.launch+state.elapsed);
}
function frame(t){
 raf=0;
 const dlg=$('missionDialog');if(!dlg||!dlg.open)return;
 const dt=last?Math.min(.1,(t-last)/1000):0;last=t;
 if(state.playing){
  state.elapsed=bound(state.elapsed+dt*state.speed,0,state.plan.days);
  if(state.elapsed>=state.plan.days)state.playing=false;
  syncUI();
 }
 draw();raf=requestAnimationFrame(frame);
}
function show(){
 const dlg=$('missionDialog');if(dlg.open)return;
 state.priorPlay=api().getPlaying();api().setPlaying(false);
 if(state.firstOpen){
  state.firstOpen=false;
  state.launch=bound(api().getJD(),dateJD(new Date('1800-01-01T00:00:00Z')),dateJD(new Date('2050-12-29T00:00:00Z')));
  const p=calc(state.from,state.to),win=nextWindow(state.launch,p);
  if(win&&win.error<rad(2))state.launch=win.jd;
 }
 $('mcDate').value=inputDay(state.launch);
 rebuild();
 dlg.showModal();last=0;if(!raf)raf=requestAnimationFrame(frame);
}
function close(){state.playing=false;$('missionDialog').close();}
function setup(){
 if(!$('missionDialog')||!api())return;
 for(const [id,obj] of Object.entries(worlds)){
  for(const selectId of ['mcOrigin','mcTarget']){const o=document.createElement('option');o.value=id;o.textContent=obj.name;$(selectId).append(o);}
 }
 $('mcOrigin').value=state.from;$('mcTarget').value=state.to;
 const shortcuts=$('mcShortcuts');
 for(const [a,b] of routes){
  const btn=document.createElement('button');btn.type='button';btn.dataset.mcRoute=a+'-'+b;
  btn.textContent=worlds[a].name+' → '+worlds[b].name;
  btn.onclick=()=>choose(a,b);shortcuts.append(btn);
 }
 $('openMissions').onclick=show;$('openMissionsSide').onclick=show;
 $('mcClose').onclick=close;
 $('missionDialog').addEventListener('close',()=>{state.playing=false;if(raf){cancelAnimationFrame(raf);raf=0;}api().setPlaying(state.priorPlay);});
 $('mcOrigin').onchange=()=>choose($('mcOrigin').value,state.to);
 $('mcTarget').onchange=()=>choose(state.from,$('mcTarget').value);
 $('mcDate').onchange=()=>{const jd=dayFromInput($('mcDate').value);if(jd!==null)setLaunch(jd);};
 $('mcAtlasDate').onclick=()=>{setLaunch(api().getJD());};
 $('mcFind').onclick=()=>{const result=nextWindow(state.launch,state.plan);if(result&&result.error<rad(3))setLaunch(result.jd);else $('mcWindowInfo').textContent='Nie znaleziono pełnego okna przed rokiem 2050.';};
 $('mcFindNext').onclick=()=>{const result=nextWindow(state.launch+8,state.plan);if(result&&result.error<rad(3))setLaunch(result.jd);else $('mcWindowInfo').textContent='Nie znaleziono kolejnego okna przed rokiem 2050.';};
 $('mcPlay').onclick=()=>{if(state.elapsed>=state.plan.days)state.elapsed=0;state.playing=!state.playing;syncUI();};
 $('mcRestart').onclick=()=>{state.elapsed=0;state.playing=false;update();};
 $('mcSpeed').onchange=()=>{state.speed=Number($('mcSpeed').value)||7;};
 $('mcProgress').oninput=()=>{state.playing=false;state.elapsed=bound(Number($('mcProgress').value)/10,0,state.plan.days);update();};
 $('mcToAtlas').onclick=()=>{const jd=state.launch+state.elapsed;close();api().setJD(jd);};
 $('mcCopy').onclick=async()=>{
  const p=state.plan,text='ATLAS SOLARIS 10.0 — MISJA\n'+worlds[state.from].name+' → '+worlds[state.to].name+
  '\nStart (UTC): '+dateLabel(state.launch)+'\nPrzylot (UTC): '+dateLabel(state.launch+p.days)+
  '\nCzas transferu: '+fmt(p.days,1)+' dni\nŁączne Δv (heliocentryczne): '+fmt(p.total,2)+' km/s'+
  '\nOdchylenie fazy: '+fmt(Math.abs(phase(state.launch,p))*180/Math.PI,1)+'°'+
  '\nModel: idealny transfer Hohmanna, bez poprawek na ekscentryczność, nachylenie i start z powierzchni.';
  try{await navigator.clipboard.writeText(text);$('mcCopy').textContent='✓ Skopiowano';}
  catch(e){$('mcCopy').textContent='Kopiowanie niedostępne';}
  setTimeout(()=>$('mcCopy').textContent='⧉ Kopiuj plan',2500);
 };
 const c=$('mcCanvas');c.addEventListener('wheel',e=>{e.preventDefault();state.zoom=bound(state.zoom*(e.deltaY>0?.9:1.1),.55,6);draw();},{passive:false});
 c.addEventListener('pointerdown',e=>{c.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});drag={x:e.clientX,y:e.clientY,px:state.panX,py:state.panY};if(pointers.size===2){const a=[...pointers.values()];pinch=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);}});
 c.addEventListener('pointermove',e=>{
  if(!pointers.has(e.pointerId))return;
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pointers.size===2){const a=[...pointers.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);if(pinch>0)state.zoom=bound(state.zoom*d/pinch,.55,6);pinch=d;}
  else if(drag){state.panX=drag.px+e.clientX-drag.x;state.panY=drag.py+e.clientY-drag.y;}
  draw();
 });
 const stop=e=>{pointers.delete(e.pointerId);drag=null;pinch=0;};
 c.addEventListener('pointerup',stop);c.addEventListener('pointercancel',stop);
 $('mcResetCamera').onclick=()=>{state.zoom=1;state.panX=0;state.panY=0;state.spin=-.27;draw();};
 window.addEventListener('resize',()=>{if($('missionDialog').open)draw();});
 choose('earth','mars');
 window.ATLAS_MISSIONS_TEST={calc,phase,nextWindow,orbitXY,state,show};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
})();
