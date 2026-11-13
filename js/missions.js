/* ATLAS SOLARIS 10.1 — precyzyjne spotkanie sondy z planetą.
   Czas transferu: orientacyjny Hohmann. Tor: 3D Lambert, prograde, zero-revolution,
   następnie propagacja Keplera z użyciem zmiennych uniwersalnych i mu Słońca.
   Położenia planet: model JPL Atlasu. Bez perturbacji N-ciał i asyst grawitacyjnych. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const AU=149597870.7, MU=132712440018, DAY=86400, TAU=2*Math.PI, YR=365.2568983;
const MU_AUDAY=MU*DAY*DAY/(AU*AU*AU), AUDAY_KMS=AU/DAY;
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
const norm3=p=>Math.hypot(p[0],p[1],p[2]);
const dot3=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const diff3=(a,b)=>a.map((v,i)=>v-b[i]);
const add3=(a,b)=>a.map((v,i)=>v+b[i]);
const mul3=(a,k)=>a.map(v=>v*k);
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
/** Stumpff functions C(z), S(z); Taylor approximation near zero avoids cancellation. */
function stumpff(z){
 if(Math.abs(z)<.0001){const z2=z*z,z3=z2*z;return {C:.5-z/24+z2/720-z3/40320,S:1/6-z/120+z2/5040-z3/362880};}
 if(z>0){const v=Math.sqrt(z);return {C:(1-Math.cos(v))/z,S:(v-Math.sin(v))/(v*v*v)};}
 const v=Math.sqrt(-z);return {C:(Math.cosh(v)-1)/(-z),S:(Math.sinh(v)-v)/(v*v*v)};
}
/** Sun-centred two-body propagation in AU, AU/day. */
function propagate(r0,v0,days){
 if(days<=0)return r0.slice();
 const r=norm3(r0),vr=dot3(r0,v0)/r,alpha=2/r-dot3(v0,v0)/MU_AUDAY,sq=Math.sqrt(MU_AUDAY);
 const F=x=>{
  const z=alpha*x*x,{C,S}=stumpff(z);
  return r*x + r*vr/sq*x*x*C + (1-alpha*r)*x*x*x*S -sq*days;
 };
 let lo=0,hi=Math.max(.01,sq*days/Math.max(.25,r));
 for(let j=0;j<55&&F(hi)<0;j++)hi*=2;
 if(!Number.isFinite(F(hi))||F(hi)<0)return null;
 for(let i=0;i<54;i++){const mid=(lo+hi)/2;if(F(mid)>0)hi=mid;else lo=mid;}
 const chi=(lo+hi)/2,z=alpha*chi*chi,{C,S}=stumpff(z);
 const f=1-chi*chi/r*C,g=days-chi*chi*chi*S/sq;
 return add3(mul3(r0,f),mul3(v0,g));
}
/** Universal-variable Lambert solver, 0-revolution, prograde about the ecliptic pole.
    Coordinates in AU; velocities in AU/day. */
function solveLambert(r0,r1,days){
 const R0=norm3(r0),R1=norm3(r1),cos=bound(dot3(r0,r1)/(R0*R1),-1,1);
 const crossZ=r0[0]*r1[1]-r0[1]*r1[0];
 const A=(crossZ>=0?1:-1)*Math.sqrt(R0*R1*(1+cos));
 if(!Number.isFinite(A)||Math.abs(A)<1e-7)return null;
 const arrival=z=>{
  const {C,S}=stumpff(z);
  if(C<=0||!Number.isFinite(C))return null;
  const y=R0+R1+A*(z*S-1)/Math.sqrt(C);
  if(y<=0||!Number.isFinite(y))return null;
  const x=Math.sqrt(y/C),seconds=(x*x*x*S+A*Math.sqrt(y))/Math.sqrt(MU_AUDAY);
  return Number.isFinite(seconds)?{time:seconds,y}:null;
 };
 let prev=null,lo=0,hi=0,found=false;
 for(let i=0;i<=720;i++){
  const z=-140 + i*(140+4*Math.PI*Math.PI-1e-4)/720,r=arrival(z);
  if(!r)continue;
  if(prev&&(prev.r.time-days)*(r.time-days)<=0){
   lo=prev.z;hi=z;found=true;break;
  }
  prev={z,r};
 }
 if(!found)return null;
 for(let i=0;i<65;i++){
  const z=(lo+hi)/2,r=arrival(z);
  if(!r)return null;
  if(r.time>days)hi=z;else lo=z;
 }
 const r=arrival((lo+hi)/2),y=r?.y;
 if(!Number.isFinite(y))return null;
 const f=1-y/R0,g=A*Math.sqrt(y/MU_AUDAY),gdot=1-y/R1;
 if(!Number.isFinite(g)||Math.abs(g)<1e-8)return null;
 const v0=mul3(diff3(r1,mul3(r0,f)),1/g);
 const v1=mul3(diff3(mul3(r1,gdot),r0),1/g);
 const check=propagate(r0,v0,days);
 if(!check||norm3(diff3(check,r1))>5e-5)return null;
 return {v0,v1};
}
function planetVelocity(jd,id){
 const delta=.015,a=api().positions(jd-delta)[id],b=api().positions(jd+delta)[id];
 return mul3(diff3(b,a),1/(2*delta));
}
/** Rare near-collinear solver degeneracy: explicitly labelled kinematic interpolation. */
function fallbackPoint(start,end,va,vb,t,days){
 const u=bound(t/days,0,1),u2=u*u,u3=u2*u;
 return start.map((x,i)=>(2*u3-3*u2+1)*x+(-2*u3+3*u2)*end[i]+
  (u3-2*u2+u)*days*va[i]+(u3-u2)*days*vb[i]);
}
function buildTransfer(launch,from,to,plan){
 const start=api().positions(launch)[from].slice(),end=api().positions(launch+plan.days)[to].slice();
 const departureSpeed=planetVelocity(launch,from),arrivalSpeed=planetVelocity(launch+plan.days,to);
 const solved=solveLambert(start,end,plan.days);
 const at=t=>{
  if(t<=0)return start.slice();
  if(t>=plan.days)return end.slice(); // terminal state exactly equals planet position
  const result=solved?propagate(start,solved.v0,t):null;
  return result||fallbackPoint(start,end,departureSpeed,arrivalSpeed,t,plan.days);
 };
 const path=[];
 let distance=0,last=at(0);
 for(let i=0;i<=240;i++){
  const next=at(plan.days*i/240);
  if(i)distance+=norm3(diff3(next,last))*AU;
  path.push(next);last=next;
 }
 const dv1=solved?norm3(diff3(solved.v0,departureSpeed))*AUDAY_KMS:null;
 const dv2=solved?norm3(diff3(solved.v1,arrivalSpeed))*AUDAY_KMS:null;
 return {start,end,path,distance,dv1,dv2,total:solved?dv1+dv2:null,solved:!!solved,at};
}
function targetDistance(t){
 const p=state.plan;if(!p?.transfer)return null;
 if(t>=p.days)return 0;
 const ship=p.transfer.at(t),planet=api().positions(state.launch+t)[state.to];
 return norm3(diff3(ship,planet))*AU;
}
function distanceLabel(km){
 if(km<.5)return '0 km';
 if(km<1e3)return fmt(km,0)+' km';
 if(km<1e6)return fmt(km/1000,1)+' tys. km';
 return fmt(km/1e6,2)+' mln km';
}
function rebuild(){
 if(state.from===state.to){state.to=state.from==='mars'?'earth':'mars';$('mcTarget').value=state.to;}
 state.plan=calc(state.from,state.to);
 state.plan.transfer=buildTransfer(state.launch,state.from,state.to,state.plan);
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
 $('mcDV').textContent=p.transfer.solved?fmt(p.transfer.total,2)+' km/s':'—';
 $('mcDVDetail').textContent=p.transfer.solved?'odlot '+fmt(p.transfer.dv1,2)+' · spotkanie '+fmt(p.transfer.dv2,2)+' km/s':'tor interpolowany (brak Δv)';
 $('mcPhase').textContent=fmt(mod(p.needed)*180/Math.PI,1)+'°';
 $('mcError').textContent=fmt(err,1)+'°';
 $('mcError').className=err<3?'mc-good':err<12?'mc-warn':'mc-bad';
 $('mcWindow').textContent=state.win?dateLabel(state.win.jd):'Poza zakresem modelu';
 $('mcDistance').textContent=fmt(p.transfer.distance/1e6,0)+' mln km';
 $('mcRouteTitle').textContent=worlds[state.from].name+' → '+worlds[state.to].name;
 $('mcWindowInfo').textContent=!p.transfer.solved?'Geometria szczególna: tor interpolowany; nie jest orbitą Keplera.':err<3?'Dobra faza. Trajektoria Lamberta wyznacza dokładne spotkanie.':err<12?'Faza bliska optymalnej; tor wyliczono dla spotkania.':'Nieoptymalna faza: spotkanie wymaga większej zmiany prędkości. Wybierz okno startowe.';
 $('mcProgress').max=Math.round(p.days*10);$('mcProgress').value=Math.round(state.elapsed*10);
 $('mcProgressDate').textContent=dateLabel(state.launch+state.elapsed);
 $('mcProgressPercent').textContent=fmt(100*state.elapsed/p.days,0)+'% lotu';
 const arrival=state.elapsed>=p.days;
 $('mcTargetDistance').textContent=distanceLabel(targetDistance(state.elapsed));
 $('mcArrivalStatus').textContent=arrival?'✓ CEL OSIĄGNIĘTY':state.playing?'SONDA W LOCIE':'OCZEKIWANIE / PAUZA';
 $('mcArrivalStatus').classList.toggle('mc-arrived',arrival);
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
 const world=api().positions(state.launch+state.elapsed);
 const sun=project(0,0);
 ctx.save();ctx.lineWidth=1;
 for(const [key,v] of Object.entries(worlds)){
  const r=v.r;if(r>rmax*1.6)continue;
  ctx.beginPath();
  for(let i=0;i<=160;i++){const a=i/160*TAU,q=project(r*Math.cos(a),r*Math.sin(a));if(i)ctx.lineTo(q[0],q[1]);else ctx.moveTo(q[0],q[1]);}
  ctx.strokeStyle=(key===state.from||key===state.to)?'#4e789e70':'#44627d28';ctx.setLineDash(key===state.from||key===state.to?[]:[3,7]);ctx.stroke();
 }
 ctx.setLineDash([]);
 const full=p.transfer.path.map(v=>project(v[0],v[1]));
 const done=full.slice(0,Math.max(1,Math.floor((full.length-1)*state.elapsed/p.days)+1));
 done.push(project(...p.transfer.at(state.elapsed).slice(0,2)));
 const pathDraw=(points,color,width)=>{ctx.beginPath();points.forEach((pt,i)=>i?ctx.lineTo(pt[0],pt[1]):ctx.moveTo(pt[0],pt[1]));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();};
 pathDraw(full,'#38c7e599',2.1);if(done.length>1)pathDraw(done,'#9bf5ec',3.8);
 const targetAtArrival=p.transfer.end,future=project(targetAtArrival[0],targetAtArrival[1]);
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
 const ship=p.transfer.at(state.elapsed),near=p.transfer.at(Math.min(p.days,state.elapsed+p.days*.003));
 const a=project(ship[0],ship[1]),b=project(near[0],near[1]);
 let spin=Math.atan2(b[1]-a[1],b[0]-a[0]);if(u>=.999)spin=Math.atan2(a[1]-h*.53,a[0]-w*.49);
 ctx.save();ctx.translate(a[0],a[1]);ctx.rotate(spin);ctx.fillStyle='#bbfff6';ctx.shadowColor='#45dcca';ctx.shadowBlur=17;
 ctx.beginPath();ctx.moveTo(11,0);ctx.lineTo(-8,-5.2);ctx.lineTo(-3,0);ctx.lineTo(-8,5.2);ctx.closePath();ctx.fill();ctx.restore();
 ctx.fillStyle='#caedee';ctx.font='600 11px system-ui';ctx.fillText(state.elapsed>=p.days?'CEL OSIĄGNIĘTY':'SONDA',a[0]+12,a[1]-14);
 if(state.elapsed>=p.days){
  ctx.beginPath();ctx.arc(a[0],a[1],17,0,TAU);ctx.strokeStyle='#8bffe2';ctx.lineWidth=2;ctx.stroke();
 }
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
  '\nCzas transferu: '+fmt(p.days,1)+' dni\nΔv spotkania (heliocentryczne): '+(p.transfer.solved?fmt(p.transfer.total,2)+' km/s':'nieustalone')+
  '\nOdchylenie fazy: '+fmt(Math.abs(phase(state.launch,p))*180/Math.PI,1)+'°'+
  '\nModel: orientacyjny czas Hohmanna, 3D Lambert Słońce-sonda, bez perturbacji planet, startu z powierzchni i manewrów asyst.';
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
 window.ATLAS_MISSIONS_TEST={calc,phase,nextWindow,stumpff,solveLambert,propagate,buildTransfer,targetDistance,state,show};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
})();
