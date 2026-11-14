/* ATLAS SOLARIS 32.0 — canvas 3D projection, simulated radiotelescope and sonification. */
(function(){
'use strict';
const core=window.AtlasPulsar32;
const byId=id=>document.getElementById(id);
if(!core||!byId('p32Scene'))return;
const TAU=2*Math.PI,RAD=Math.PI/180,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const fmt=(x,d=1)=>Number(x).toLocaleString('pl-PL',{minimumFractionDigits:d,maximumFractionDigits:d});
const preset={
 crab:{alpha:38,zeta:43,rho:11,period:.033,tempo:1,noise:.075},
 vela:{alpha:49,zeta:53,rho:10,period:.089,tempo:1.1,noise:.06},
 milli:{alpha:61,zeta:65,rho:8,period:.005,tempo:1.5,noise:.11},
 silent:{alpha:19,zeta:116,rho:7,period:.45,tempo:1,noise:.065}
};
const sliders={alpha:byId('p32Alpha'),zeta:byId('p32Zeta'),rho:byId('p32Rho'),period:byId('p32Period'),tempo:byId('p32Tempo'),noise:byId('p32Noise')};
const scene=byId('p32Scene'),profile=byId('p32Profile'),scope=byId('p32Scope');
const state={...preset.crab,phase:0,playing:true,sound:false,camYaw:-.72,camPitch:.34,activePreset:'crab'};
let trace=null,last=0,lastDraw=0,previousGain=0,audio=null,lastAudio=0,drag=null;
let renderQuality='auto';
document.querySelectorAll('[data-p32quality]').forEach(button=>button.addEventListener('click',()=>{
 renderQuality=button.dataset.p32quality;
 document.querySelectorAll('[data-p32quality]').forEach(x=>x.setAttribute('aria-pressed',String(x===button)));
 drawScene();
}));
const stars=[];
let seed=32731;const rnd=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296};
for(let i=0;i<210;i++)stars.push({x:rnd(),y:rnd(),r:.3+rnd()*.95,a:.12+rnd()*.5});
const v=(x,y,z)=>({x,y,z}),add=(a,b)=>v(a.x+b.x,a.y+b.y,a.z+b.z),mul=(a,k)=>v(a.x*k,a.y*k,a.z*k);
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const cross=(a,b)=>v(a.y*b.z-a.z*b.y,a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x);
const unit=a=>{const l=Math.hypot(a.x,a.y,a.z)||1;return mul(a,1/l)};
function beam(){const a=state.alpha*RAD,p=TAU*state.phase;return v(Math.sin(a)*Math.cos(p),Math.cos(a),Math.sin(a)*Math.sin(p))}
function observer(){const z=state.zeta*RAD;return v(Math.sin(z),Math.cos(z),0)}
function orientation(){
 const y=state.camYaw,p=state.camPitch;
 const right=v(Math.cos(y),0,-Math.sin(y));
 const up=v(-Math.sin(p)*Math.sin(y),Math.cos(p),-Math.sin(p)*Math.cos(y));
 const front=v(Math.cos(p)*Math.sin(y),Math.sin(p),Math.cos(p)*Math.cos(y));
 return {right,up,front};
}
function sizeCanvas(c){
 const r=c.getBoundingClientRect(),w=Math.max(1,r.width),h=Math.max(1,r.height),dpr=Math.min(2,window.devicePixelRatio||1);
 const pxw=Math.round(w*dpr),pxh=Math.round(h*dpr);
 if(c.width!==pxw||c.height!==pxh){c.width=pxw;c.height=pxh}
 const ctx=c.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);
 return {ctx,w,h};
}
function drawLine(ctx,pts,color,width=1,dash=null){
 if(pts.length<2)return;
 ctx.save();ctx.strokeStyle=color;ctx.lineWidth=width;
 if(dash)ctx.setLineDash(dash);
 ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);
 for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i].x,pts[i].y);
 ctx.stroke();ctx.restore();
}
function drawSceneLegacy(){
 const {ctx,w,h}=sizeCanvas(scene);
 ctx.clearRect(0,0,w,h);
 const cx=w*.5,cy=h*.49,S=Math.min(w,h)*.275,{right,up,front}=orientation();
 function point(p){const depth=dot(p,front),k=6/(6-depth);return{x:cx+dot(p,right)*S*k,y:cy-dot(p,up)*S*k,z:depth,k}}
 const m=beam(),obs=observer(),active=core.pulseAtPhase(TAU*state.phase,state).gain;
 const haze=ctx.createRadialGradient(cx,cy,0,cx,cy,S*2.5);
 haze.addColorStop(0,'rgba(76,94,176,.19)');haze.addColorStop(.5,'rgba(36,80,126,.095)');haze.addColorStop(1,'rgba(6,12,29,0)');
 ctx.fillStyle=haze;ctx.fillRect(0,0,w,h);
 for(const star of stars){ctx.globalAlpha=star.a;ctx.fillStyle='#dcefff';ctx.beginPath();ctx.arc(star.x*w,star.y*h,star.r,0,TAU);ctx.fill()}ctx.globalAlpha=1;
 // Equatorial ring, seen in perspective.
 const eq=[];for(let i=0;i<=120;i++){const t=TAU*i/120;eq.push(point(v(.79*Math.cos(t),0,.79*Math.sin(t))))}
 drawLine(ctx,eq,'rgba(248,178,128,.30)',1,[4,6]);
 // Magnetic dipole: schematic field lines with r = L sin²(theta).
 const e1=unit(cross(Math.abs(m.z)>.96?v(0,1,0):v(0,0,1),m)),e2=unit(cross(m,e1));
 for(const theta0 of [.32,.44,.57]){
  for(let az=0;az<8;az++){
   const a=TAU*az/8,pts=[];
   for(let j=0;j<=62;j++){
    const theta=theta0+(Math.PI-2*theta0)*j/62;
    const r=Math.min(2.12,.43*Math.pow(Math.sin(theta)/Math.sin(theta0),2));
    const p=add(mul(m,r*Math.cos(theta)),add(mul(e1,r*Math.sin(theta)*Math.cos(a)),mul(e2,r*Math.sin(theta)*Math.sin(a))));
    pts.push(point(p));
   }
   drawLine(ctx,pts,az%2?'rgba(157,149,255,.24)':'rgba(133,211,243,.18)',.8);
  }
 }
 // Rotational axis.
 const rot1=point(v(0,-2.45,0)),rot2=point(v(0,2.45,0));
 drawLine(ctx,[rot1,rot2],'rgba(255,184,136,.70)',1.8,[8,6]);
 const drawCone=(dir,brightness)=>{
  const a=state.rho*RAD,base=.46,dist=2.32,cap=clamp(Math.tan(a)*dist,.12,1.52);
  const u=unit(cross(Math.abs(dir.y)>.96?v(0,0,1):v(0,1,0),dir)),q=unit(cross(dir,u));
  const apex=point(mul(dir,base)),tip=point(mul(dir,dist));
  const count=30,pts=[];
  for(let i=0;i<=count;i++){
   const th=i*TAU/count,p=add(mul(dir,dist),add(mul(u,cap*Math.cos(th)),mul(q,cap*Math.sin(th))));
   pts.push(point(p));
  }
  ctx.save();
  ctx.globalAlpha=brightness;
  for(let i=0;i<count;i++){
   ctx.beginPath();ctx.moveTo(apex.x,apex.y);ctx.lineTo(pts[i].x,pts[i].y);ctx.lineTo(pts[i+1].x,pts[i+1].y);ctx.closePath();
   ctx.fillStyle='rgba(97,238,236,.028)';ctx.fill();
  }
  for(let i=0;i<count;i+=3)drawLine(ctx,[apex,pts[i]],'rgba(115,254,239,.44)',1.15);
  drawLine(ctx,pts,'rgba(137,249,245,.70)',1.6);
  drawLine(ctx,[apex,tip],'rgba(186,234,255,.62)',1.5,[6,5]);
  ctx.restore();
 };
 const cones=[{d:m,b:1},{d:mul(m,-1),b:.55}].sort((a,b)=>dot(a.d,front)-dot(b.d,front));
 for(const c of cones.filter(x=>dot(x.d,front)<0))drawCone(c.d,c.b);
 // Magnetic axis crosses the star.
 drawLine(ctx,[point(mul(m,-2.34)),point(mul(m,2.34))],'rgba(184,166,255,.64)',1.5,[5,5]);
 // Spherical neutron star, drawn as a shaded disc with edge glow.
 const center=point(v(0,0,0)),radius=S*.43;
 ctx.save();ctx.shadowBlur=35;ctx.shadowColor='rgba(116,244,250,.72)';
 const shell=ctx.createRadialGradient(cx-radius*.32,cy-radius*.38,radius*.05,cx,cy,radius*1.15);
 shell.addColorStop(0,'#f6ffff');shell.addColorStop(.16,'#b8eefa');shell.addColorStop(.37,'#77bde7');shell.addColorStop(.68,'#525eb3');shell.addColorStop(.92,'#1f295e');shell.addColorStop(1,'#0d1c35');
 ctx.fillStyle=shell;ctx.beginPath();ctx.arc(center.x,center.y,radius,0,TAU);ctx.fill();ctx.shadowBlur=0;
 ctx.strokeStyle='rgba(215,254,255,.65)';ctx.lineWidth=1.2;ctx.stroke();ctx.restore();
 // Atmosphere rings / a schematic hot spot, not true stellar surface.
 const spot=point(mul(m,.431));
 if(spot.z>-0.03){
  ctx.beginPath();ctx.arc(spot.x,spot.y,clamp(7*spot.k,4,13),0,TAU);
  ctx.fillStyle='rgba(228,255,255,.92)';ctx.shadowColor='#a4ffff';ctx.shadowBlur=22;ctx.fill();ctx.shadowBlur=0;
 }
 for(const c of cones.filter(x=>dot(x.d,front)>=0))drawCone(c.d,c.b);
 // Sight line from star to the radiotelescope.
 const ob=point(mul(obs,2.84));
 drawLine(ctx,[center,ob],'rgba(240,250,255,.9)',1.7,[4,5]);
 ctx.beginPath();ctx.arc(ob.x,ob.y,6,0,TAU);
 ctx.fillStyle=active>.45?'#a6fff0':'#eff7ff';ctx.shadowColor='#a3eeff';ctx.shadowBlur=17;ctx.fill();ctx.shadowBlur=0;
 ctx.font='700 11px system-ui';ctx.fillStyle='#c5e7fa';ctx.textAlign='center';
 ctx.fillText('OBS',clamp(ob.x,26,w-26),clamp(ob.y-15,64,h-46));
 const upper=point(v(0,2.55,0));
 ctx.font='800 10px system-ui';ctx.fillStyle='#ffbb91';
 ctx.fillText('ROT',clamp(upper.x,28,w-28),clamp(upper.y-10,60,h-42));
}
function drawScene(){
 const {ctx,w,h}=sizeCanvas(scene);
 if(window.AtlasPulsar32Cinema){
  window.AtlasPulsar32Cinema.draw(ctx,w,h,state,core,renderQuality);
 }else{
  drawSceneLegacy();
 }
}
function drawGraph(canvas,scopeMode){
 const {ctx,w,h}=sizeCanvas(canvas),pad={l:34,r:12,t:15,b:25},pw=w-pad.l-pad.r,ph=h-pad.t-pad.b;
 ctx.clearRect(0,0,w,h);ctx.fillStyle='#071325';ctx.fillRect(0,0,w,h);
 ctx.strokeStyle='#31445d';ctx.lineWidth=.6;ctx.font='10px system-ui';ctx.textAlign='right';ctx.fillStyle='#829cb6';
 for(let j=0;j<=4;j++){
  const y=pad.t+ph*j/4;ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(w-pad.r,y);ctx.stroke();
  ctx.fillText(fmt(1-j/4,2),pad.l-6,y+3);
 }
 for(let i=0;i<=8;i++){const x=pad.l+pw*i/8;ctx.beginPath();ctx.moveTo(x,pad.t);ctx.lineTo(x,pad.t+ph);ctx.stroke()}
 const n=scopeMode?trace.samples.length:500;
 const current=state.phase%1;
 ctx.beginPath();
 for(let i=0;i<n;i++){
  const val=scopeMode?trace.samples[i]:core.pulseAtPhase(TAU*i/(n-1),state).gain;
  const x=pad.l+pw*i/(n-1),y=pad.t+ph*(1-clamp(val,0,1.08)/1.08);
  if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
 }
 ctx.lineWidth=scopeMode?1.2:2.2;ctx.strokeStyle=scopeMode?'#a8dfec':'#81f5e9';ctx.shadowBlur=scopeMode?0:9;ctx.shadowColor='#79faff';ctx.stroke();ctx.shadowBlur=0;
 const phaseX=pad.l+pw*(scopeMode?(state.phase*9%1):current);
 ctx.beginPath();ctx.moveTo(phaseX,pad.t);ctx.lineTo(phaseX,h-pad.b);
 ctx.strokeStyle='rgba(255,182,136,.9)';ctx.lineWidth=1.2;ctx.setLineDash([4,4]);ctx.stroke();ctx.setLineDash([]);
 ctx.fillStyle='#9db7cf';ctx.textAlign='left';ctx.font='10px system-ui';
 ctx.fillText(scopeMode?'0 ms':'0',pad.l,h-8);
 ctx.textAlign='right';
 ctx.fillText(scopeMode?fmt(trace.duration*1000,trace.duration<.1?1:0)+' ms':'1 cykl',w-pad.r,h-8);
 if(!scopeMode){
  const y=pad.t+ph*(1-core.pulseAtPhase(TAU*current,state).gain/1.08);
  ctx.beginPath();ctx.arc(phaseX,y,4,0,TAU);ctx.fillStyle='#ffcf9d';ctx.fill();
 }
}
function periodString(p){return p<1?fmt(p*1000,p<.01?2:1)+' ms':fmt(p,3)+' s'}
function readSliders(){
 state.alpha=+sliders.alpha.value;state.zeta=+sliders.zeta.value;state.rho=+sliders.rho.value;
 state.period=Math.pow(10,+sliders.period.value);state.tempo=+sliders.tempo.value;state.noise=+sliders.noise.value;
}
function updateLabels(){
 byId('p32AlphaVal').textContent=state.alpha+'°';
 byId('p32ZetaVal').textContent=state.zeta+'°';
 byId('p32RhoVal').textContent=state.rho+'°';
 byId('p32PeriodVal').textContent=periodString(state.period);
 byId('p32TempoVal').textContent=fmt(state.tempo,2)+'×';
 byId('p32NoiseVal').textContent=Math.round(state.noise*100)+'%';
 byId('p32PeriodOut').textContent=periodString(state.period);
 byId('p32Hz').textContent=fmt(1/state.period,state.period<.01?1:2)+' Hz';
 const vis=core.visibility(state);
 byId('p32Reception').textContent=vis.visible?'ODBIERA':'CISZA';
 byId('p32Reception').style.color=vis.visible?'#a0fff2':'#e7b5ca';
 byId('p32Peak').textContent='szczyt: '+Math.round(vis.peak*100)+'%';
 byId('p32Angle').textContent=Math.min(Math.abs(state.alpha-state.zeta),Math.abs(180-state.alpha-state.zeta)).toFixed(1)+'°';
 const poles=[0,Math.PI].map(a=>core.pulseAtPhase(a,state));
 const maxima=[];
 // Detect separated maxima for both poles (shape from full model).
 let peaks=0,wasHigh=false;
 for(let i=0;i<720;i++){const val=core.pulseAtPhase(TAU*i/720,state).gain;const high=val>.15;if(high&&!wasHigh)peaks++;wasHigh=high;}
 byId('p32Count').textContent=vis.visible?String(Math.min(peaks,2)):'0';
 byId('p32State').textContent=core.pulseAtPhase(TAU*state.phase,state).gain>.45?'Wiązka trafia w obserwatora':'Wiązka poza linią widzenia';
 byId('p32SignalNote').textContent=vis.visible?'WYKRYWALNY PROFIL':'DOMINUJE SZUM';
 byId('p32ScopeScale').textContent='CZAS / '+fmt(trace.duration*1000,trace.duration<.1?1:0)+' ms';
}
function newTrace(){
 trace=core.makeTrace(state,9,1800,32026);
 updateLabels();
 drawGraph(profile,false);drawGraph(scope,true);drawScene();
}
function clearMeasurement(){byId('p32Result').textContent='Zmieniono parametry. Wykonaj nowy pomiar okresu.'}
function usePreset(key){
 const p=preset[key];if(!p)return;
 Object.assign(state,p,{phase:0,activePreset:key});
 for(const name of Object.keys(sliders))sliders[name].value=name==='period'?Math.log10(state.period):state[name];
 document.querySelectorAll('[data-p32preset]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.p32preset===key)));
 clearMeasurement();newTrace();
}
document.querySelectorAll('[data-p32preset]').forEach(b=>b.addEventListener('click',()=>usePreset(b.dataset.p32preset)));
for(const s of Object.values(sliders))s.addEventListener('input',()=>{
 readSliders();state.activePreset=null;
 document.querySelectorAll('[data-p32preset]').forEach(b=>b.setAttribute('aria-pressed','false'));
 clearMeasurement();newTrace();
});
byId('p32Play').addEventListener('click',()=>{
 state.playing=!state.playing;
 byId('p32Play').textContent=state.playing?'Ⅱ PAUZA':'▶ WZNÓW';
 byId('p32Play').setAttribute('aria-pressed',String(state.playing));
});
byId('p32Reset').addEventListener('click',()=>{
 state.camYaw=-.72;state.camPitch=.34;
 usePreset('crab');byId('p32Result').textContent='Przywrócono ustawienia szybkiego pulsara. Wykonaj pomiar.';
});
byId('p32Camera').addEventListener('click',()=>{state.camYaw=-.72;state.camPitch=.34;drawScene()});
byId('p32Measure').addEventListener('click',()=>{
 const vis=core.visibility(state),box=byId('p32Result');
 if(!vis.visible||trace.peak<Math.max(.15,state.noise*.9)){
  box.textContent='Brak wiarygodnych impulsów. Zmień kąt obserwacji ζ albo nachylenie osi α — antena może nie przecinać wiązki.';
  return;
 }
 const n=trace.samples.length;
 const found=core.estimatePeriod(trace.samples,trace.dt,Math.floor(n/22),Math.ceil(n/5));
 if(!found){box.textContent='Nie udało się wykryć stabilnej okresowości. Zmniejsz szum lub popraw ustawienie anteny.';return}
 const relative=Math.abs(found.period/state.period-1)*100;
 const conf=Math.round(found.confidence*100);
 const weak=found.confidence<.37||relative>18;
 box.innerHTML='<b>Zmierzony okres: '+periodString(found.period)+'</b> · odchylenie: '+fmt(relative,1)+'% · korelacja: '+conf+'%. '+(weak?'Odczyt jest niepewny; sprawdź szum i możliwe harmoniczne.':'Powtarzalne impulsy wskazują okres wirowania.');
});
byId('p32Sound').addEventListener('click',async()=>{
 if(!state.sound){
  const Audio=window.AudioContext||window.webkitAudioContext;
  if(!Audio){byId('p32Sound').textContent='DŹWIĘK NIEDOSTĘPNY';return}
  try{audio=audio||new Audio();await audio.resume();state.sound=true}
  catch(e){byId('p32Sound').textContent='DŹWIĘK ZABLOKOWANY';return}
 }else state.sound=false;
 byId('p32Sound').setAttribute('aria-pressed',String(state.sound));
 byId('p32Sound').textContent=state.sound?'♪ WYŁĄCZ DŹWIĘK':'♪ WŁĄCZ DŹWIĘK';
});
function beep(strength){
 if(!audio||audio.state!=='running'||!state.sound)return;
 const at=audio.currentTime;
 if(at-lastAudio<.085)return;lastAudio=at;
 try{
  const o=audio.createOscillator(),g=audio.createGain(),filter=audio.createBiquadFilter();
  o.type='sine';o.frequency.setValueAtTime(650+strength*380,at);o.frequency.exponentialRampToValueAtTime(250,at+.055);
  filter.type='lowpass';filter.frequency.value=1700;
  g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(.045*strength,at+.006);
  g.gain.exponentialRampToValueAtTime(.0001,at+.075);
  o.connect(filter);filter.connect(g);g.connect(audio.destination);o.start(at);o.stop(at+.08);
 }catch(e){}
}
scene.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,yaw:state.camYaw,pitch:state.camPitch};scene.setPointerCapture(e.pointerId)});
scene.addEventListener('pointermove',e=>{
 if(!drag)return;
 const rect=scene.getBoundingClientRect();
 state.camYaw=drag.yaw+(e.clientX-drag.x)/Math.max(240,rect.width)*3.3;
 state.camPitch=clamp(drag.pitch-(e.clientY-drag.y)/Math.max(240,rect.height)*2.3,-1.43,1.43);
 if(!state.playing)drawScene();
});
const endDrag=()=>{drag=null};scene.addEventListener('pointerup',endDrag);scene.addEventListener('pointercancel',endDrag);scene.addEventListener('lostpointercapture',endDrag);
window.addEventListener('resize',()=>{drawScene();drawGraph(profile,false);drawGraph(scope,true)});
document.addEventListener('visibilitychange',()=>{last=0;if(document.hidden&&audio&&audio.state==='running')audio.suspend().catch(()=>{})});
function loop(now){
 const dt=last?Math.min(.09,(now-last)/1000):0;last=now;
 if(state.playing&&!document.hidden){
  state.phase=(state.phase+dt*.24*state.tempo)%1;
  const signal=core.pulseAtPhase(TAU*state.phase,state).gain;
  if(signal>.46&&previousGain<=.46)beep(signal);
  previousGain=signal;
 }
 if(now-lastDraw>33&&!document.hidden){
  drawScene();drawGraph(profile,false);drawGraph(scope,true);
  const status=byId('p32State'),peak=core.pulseAtPhase(TAU*state.phase,state).gain;
  status.textContent=peak>.45?'Wiązka trafia w obserwatora':'Wiązka poza linią widzenia';
  lastDraw=now;
 }
 requestAnimationFrame(loop);
}
function reportReady(){try{if(window.parent!==window)window.parent.postMessage({type:'atlas:portal:ready'},location.origin)}catch(_e){}}
window.addEventListener('message',e=>{if(e.origin===location.origin&&e.data?.type==='atlas:portal:ping')reportReady()});
usePreset('crab');requestAnimationFrame(loop);reportReady();
})();
