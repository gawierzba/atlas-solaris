/**
 * ATLAS SOLARIS 22.0 — the moving ship's camera, driven by exact 21.0 orbit.
 * GPU: Kerr null geodesics launched from ship position; directions Lorentz-
 * transformed from comoving optics to a ZAMO local tetrad.
 * UI: cinematic sensor + honest physics telemetry + navigation radar.
 */
(function(root){'use strict';
const $=id=>root.document.getElementById(id);
const C=root.ATLAS_COCKPIT22_CORE;
const G=root.ATLAS_COCKPIT22_RENDERER;
const P=root.ATLAS_PROBE21_CORE;
const K=root.ATLAS_KERR201_CORE;
const BH=root.ATLAS_BLACKHOLE20_CORE;
const catalog=root.ATLAS_INTERSTELLAR19_DATA;
const PI=Math.PI;
const fmt=(n,d=2)=>Number.isFinite(n)?new Intl.NumberFormat('pl-PL',
 {minimumFractionDigits:d,maximumFractionDigits:d}).format(n):'—';
const signed=(n,d=2)=>(n<0?'−':n>0?'+':'')+fmt(Math.abs(n),d);
function duration(x){
 if(!Number.isFinite(x))return '—';
 if(x<60)return fmt(x,2)+' s';
 if(x<3600)return fmt(x/60,2)+' min';
 if(x<86400)return fmt(x/3600,2)+' godz.';
 if(x<86400*365)return fmt(x/86400,2)+' dni';
 return fmt(x/(86400*365.25),2)+' lat';
}
function pictureCatalog(){
 const c=root.document.createElement('canvas');c.width=2048;c.height=1024;
 const ctx=c.getContext('2d');
 ctx.fillStyle='#030613';ctx.fillRect(0,0,c.width,c.height);
 for(const st of catalog?.stars||[]){
  const [x,y,z,mag,bv]=st;
  if(!Number.isFinite(mag)||mag>7.2)continue;
  const d=Math.hypot(x,y,z);if(!d)continue;
  const px=((Math.atan2(y,x)/(2*PI)+.5)%1+1)%1*c.width;
  const py=(.5-Math.asin(z/d)/PI)*c.height;
  const radius=Math.max(.56,Math.min(3.5,2.7-.30*mag));
  ctx.globalAlpha=Math.max(.22,Math.min(1,1.05-mag*.12));
  ctx.fillStyle=bv<0?'#aec8ff':bv<.55?'#e5edff':bv<1.1?'#fff4e8':'#ffc4ad';
  ctx.beginPath();ctx.arc(px,py,radius,0,2*PI);ctx.fill();
  if(mag<.8){ctx.globalAlpha=.09;ctx.beginPath();ctx.arc(px,py,radius*4,0,2*PI);ctx.fill();}
 }
 ctx.globalAlpha=1;return c;
}
function configs(){
 return {
  infall:{name:'Zbliżanie do horyzontu',desc:'Swobodny spadek z r = 5,2 r_g przez ergosferę. Widok kamery jest przeliczany na każdym punkcie toru.',cfg:{spin:.92,r0:5.2,radial:-.25,tangential:-.40}},
  ergo:{name:'Wewnątrz ergosfery',desc:'Start z r = 1,8 r_g; lokalny ruch przeciwny obrotowi, ale duże wleczenie czasoprzestrzeni.',cfg:{spin:.92,r0:1.8,radial:-.12,tangential:-.70}},
  orbit:{name:'Stabilna orbita',desc:'Lot na kołowej geodezyjnej r = 6,5 r_g. Kamera obraca się razem ze zmieniającym się azymutem sondy.',cfg:{spin:.92,r0:6.5,radial:0,tangential:P.circularVelocity(.92,6.5,1)}},
  reverse:{name:'Odwrócony spin',desc:'Swobodny lot przy a* = −0,92. Trajektoria jest asymetryczna względem scenariusza o dodatnim spinie.',cfg:{spin:-.92,r0:3.4,radial:-.38,tangential:-.55}}
 };
}
function init(){
 const dialog=$('cockpit22Dialog'),scene=$('cockpit22Canvas'),radar=$('cockpit22Radar');
 if(!C||!G||!P||!K||!BH||!dialog||!scene||!radar)return;
 const routes=configs();
 const state={
  preset:'infall',config:routes.infall.cfg,trajectory:null,
  mass:'sagittarius',tau:0,playing:false,tempo:1,
  aim:'hole',yaw:0,pitch:0,fov:68,relativity:true,shift:true,disk:true,
  quality:root.innerWidth<720?.26:.40,
  gpu:null,gpuError:'',image:null,raf:0,lastTick:0,lastGpu:0,lastRadar:0,
  dirty:true,drag:null,previousMainPlaying:false,notice:'',startTime:0
 };
 function massSolar(){return BH.masses[state.mass]?.massSolar||4e6;}
 function current(){return P.interpolate(state.trajectory,state.tau);}
 function local(){return C.localVelocity(state.trajectory.release,current());}
 function aimAngles(v){
  if(state.aim==='hole')return {yaw:0,pitch:0};
  if(state.aim==='sky')return {yaw:PI,pitch:0};
  if(state.aim==='side')return {yaw:PI/2,pitch:0};
  if(state.aim==='motion')return {yaw:C.yawAlongVelocity(v.v),pitch:0};
  return {yaw:state.yaw,pitch:state.pitch};
 }
 function basis(v){
  const a=aimAngles(v);return C.cameraBasis(a.yaw,a.pitch);
 }
 function cameraLabel(){
  const labels={hole:'KU CZARNEJ DZIURZE',sky:'OD CZARNEJ DZIURY',
   motion:'ZGODNIE Z PRĘDKOŚCIĄ SONDY',side:'WZDŁUŻ +φ',manual:'SWOBODNA KAMERA'};
  return labels[state.aim]||labels.manual;
 }
 function updateAim(){
  for(const [name,id] of [['hole','cockpit22LookHole'],
   ['motion','cockpit22LookMotion'],['sky','cockpit22LookSky'],
   ['side','cockpit22LookSide']]){
   $(id).setAttribute('aria-pressed',String(state.aim===name));
  }
  $('cockpit22Heading').textContent='KIERUNEK: '+cameraLabel();
 }
 function setupConfig(config,key,label){
  try{
   const release=P.release(config),trajectory=P.integrate(release,{
    maxTau:155,step:.038,maxPoints:6700
   });
   state.config={...config};state.preset=key;state.trajectory=trajectory;
   state.playing=false;state.tau=0;state.notice='';
   $('cockpit22Play').textContent='▶ ROZPOCZNIJ LOT';
   $('cockpit22Preset').value=key;
   $('cockpit22Destination').textContent=label||routes[key]?.name||'Warunki misji 21.0';
   $('cockpit22RouteDetails').textContent=routes[key]?.desc||
    'Przeniesiono warunki początkowe z misji 21.0; po starcie sonda nie używa napędu.';
   state.dirty=true;
   return true;
  }catch(error){
   $('cockpit22Status').textContent='Nie udało się obliczyć toru: '+error.message;
   return false;
  }
 }
 function stop(){
  state.playing=false;
  $('cockpit22Play').textContent=state.tau>=state.trajectory.properElapsed?
   '▶ POWTÓRZ LOT':'▶ WZNÓW LOT';
 }
 function play(){
  if(state.playing){stop();return;}
  if(state.tau>=state.trajectory.properElapsed)state.tau=0;
  state.playing=true;state.notice='';
  $('cockpit22Play').textContent='Ⅱ PAUZA';
  schedule();
 }
 function progress(){
  return C.clamp(state.tau/Math.max(.001,state.trajectory?.properElapsed||1),0,1);
 }
 function setView(which){
  state.aim=which;updateAim();schedule();
 }
 function diagnostics(){
  const p=current(),v=local(),cam=basis(v);
  let diagnostic=null;
  try{diagnostic=C.diagnostic(state.trajectory.release,p,cam,state.relativity);}
  catch(error){diagnostic=null;}
  return {p,v,cam,diagnostic};
 }
 function ensureGpu(){
  if(state.gpu||state.gpuError)return;
  try{state.image=pictureCatalog();state.gpu=G.create(scene,state.image);}
  catch(error){
   state.gpuError=String(error.message||error);
   $('cockpit22Fallback').hidden=false;
   $('cockpit22Fallback').textContent='WebGL2 niedostępne: '+state.gpuError+
    '. Możesz jednak korzystać z radaru i wszystkich obliczeń fizycznych.';
   $('cockpit22LiveQuality').textContent='TRYB BEZ WEBGL2';
   console.error('ATLAS COCKPIT 22',error);
  }
 }
 function renderGpu(d){
  if(!state.gpu)return;
  try{
   const {p,v,cam}=d;
   const inner=Math.max(8,state.trajectory.release.r0+.20);
   state.gpu.render({spin:state.config.spin,distance:p.r,phi:p.phi,
    velocity:v.v,basis:cam,fov:state.fov,
    inner,disk:state.disk,relativity:state.relativity,
    shiftBrightness:state.shift,diskDoppler:true,
    quality:state.quality,time:performance.now()/1000,brightness:1.10});
  }catch(error){
   state.gpuError=String(error.message||error);
   $('cockpit22Fallback').hidden=false;
   $('cockpit22Fallback').textContent='Błąd renderowania WebGL2: '+state.gpuError+
    '. Nadal działają przyrządy fizyczne.';
   state.gpu?.dispose?.();state.gpu=null;
  }
 }
 function updateTelemetry(d){
  const {p,v,diagnostic}=d,progressFraction=progress();
  const realFactor=P.physicalTime(massSolar(),1,BH.TG_S);
  const m=state.trajectory.release;
  const ratio=v.lapse/v.gamma;
  $('cockpit22Radius').textContent=fmt(p.r,3)+' r_g';
  $('cockpit22Beta').textContent=fmt(v.speed,3)+' c';
  $('cockpit22TauClock').textContent=duration(p.tau*realFactor);
  $('cockpit22FarClock').textContent=duration(p.t*realFactor);
  $('cockpit22Doppler').textContent=fmt(diagnostic?.doppler,3)+'×';
  $('cockpit22ClockRate').textContent=fmt(60*ratio,2)+' min';
  $('cockpit22ClockRatio').textContent=fmt(ratio,4);
  $('cockpit22Gamma').textContent=fmt(v.gamma,4);
  $('cockpit22Lapse').textContent=fmt(v.lapse,4);
  $('cockpit22Omega').textContent=signed(v.omega,5)+' / t_g';
  $('cockpit22Lambda').textContent=signed(diagnostic?.photon.lambda??NaN,3);
  $('cockpit22Eta').textContent=signed(diagnostic?.photon.eta??NaN,3);
  $('cockpit22Progress').value=String(Math.round(progressFraction*1000));
  $('cockpit22ProgressText').textContent=fmt(progressFraction*100,1)+'%';
  $('cockpit22Phase').textContent=p.nearHorizon?'GRANICA HORYZONTU':
   p.insideErgo?'ERGOSFERA / RUCH ZAMO':
   state.playing?'LOT / CZAS WŁASNY τ':'MISJA / POZYCJA WYBRANA';
  $('cockpit22ErgoAlert').hidden=!p.insideErgo;
  $('cockpit22LiveQuality').textContent=state.gpuError?'TRYB BEZ GPU':
   'KERR / RK4 / '+Math.round(state.quality*100)+'%';
  if(state.notice){$('cockpit22Status').textContent=state.notice;}
  else if(state.playing){
   $('cockpit22Status').textContent='Sonda porusza się po geodezyjnej Kerra. Oglądasz niebo z jej układu. '+
    'Dla testu wyłącz aberrację i zaobserwuj zmianę kierunków gwiazd oraz dysku.';
  }else if(p.nearHorizon){
   $('cockpit22Status').textContent='Bardzo blisko horyzontu. Symulacja kończy się przed r₊, '+
    'ponieważ czas współrzędnościowy Boyera–Lindquista staje się tam osobliwy.';
  }else if(p.insideErgo){
   $('cockpit22Status').textContent='Sonda w ergosferze. Obserwator ZAMO nadal jest fizyczny '+
    'poza horyzontem, choć nie może stać nieruchomo względem odległej nieskończoności.';
  }else{
   $('cockpit22Status').textContent='Włącz odtwarzanie i obserwuj zmianę perspektywy. '+
    'Czynnik Dopplera dotyczy LOCALNEJ różnicy częstotliwości między sondą a ZAMO.';
  }
  $('cockpit22OpticNote').textContent=state.relativity?
   'Doppler D w osi kamery = '+fmt(diagnostic?.doppler,3)+
    '. To lokalny stosunek ν_sondy / ν_ZAMO. Wpływ grawitacji i emisji dysku liczony jest odrębnie; jasność ∝ D³ to uproszczenie.':
   'TRYB KONTROLNY: kamera używa kierunków ZAMO zamiast rzeczywistej aberracji obserwatora w ruchu. Nie jest to obserwacja fizyczna sondy.';
 }
 function resizeRadar(){
  const rect=radar.getBoundingClientRect();
  if(!rect.width||!rect.height)return;
  const q=Math.min(1.5,root.devicePixelRatio||1);
  const w=Math.max(250,Math.round(rect.width*q));
  const h=Math.max(140,Math.round(rect.height*q));
  if(radar.width!==w||radar.height!==h){radar.width=w;radar.height=h;}
 }
 function renderRadar(p){
  resizeRadar();
  const ctx=radar.getContext('2d'),W=radar.width,H=radar.height;
  ctx.fillStyle='#060e22';ctx.fillRect(0,0,W,H);
  const trajectory=state.trajectory,points=trajectory.points;
  const range=C.clamp(Math.max(state.config.r0*1.22,
   Math.max(...points.filter((_,i)=>i%75===0).map(q=>q.r))),4.4,28);
  const scale=Math.min(W,H)/(range*2.25),cx=W*.51,cy=H*.5;
  const transform=q=>[cx+scale*q.x,cy-scale*q.y];
  ctx.strokeStyle='#21415b';ctx.lineWidth=1;
  for(let rad=2;rad<=range;rad+=2){
   ctx.beginPath();ctx.arc(cx,cy,rad*scale,0,2*PI);ctx.stroke();
  }
  for(const [r,col,dashed] of [
   [2,'#eeb089',[4,5]],[trajectory.release.horizon,'#a4aaf9',[]]
  ]){
   ctx.save();ctx.strokeStyle=col;ctx.lineWidth=1.4;ctx.setLineDash(dashed);
   ctx.beginPath();ctx.arc(cx,cy,r*scale,0,2*PI);ctx.stroke();ctx.restore();
  }
  ctx.fillStyle='#01050c';ctx.beginPath();ctx.arc(cx,cy,trajectory.release.horizon*scale,0,7);ctx.fill();
  ctx.strokeStyle='rgba(107,226,222,.22)';ctx.lineWidth=1.1;
  ctx.beginPath();for(let i=0;i<points.length;i+=Math.max(1,Math.floor(points.length/1250))){
   const [x,y]=transform(points[i]);if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
  }ctx.stroke();
  ctx.strokeStyle='#93eff1';ctx.lineWidth=2.3;
  ctx.beginPath();const maxIdx=points.findIndex(q=>q.tau>=p.tau);
  const end=maxIdx<0?points.length-1:maxIdx;
  const step=Math.max(1,Math.floor(end/950));
  for(let i=0;i<=end;i+=step){
   const [x,y]=transform(points[i]);if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
  }
  const [hx,hy]=transform(p);ctx.lineTo(hx,hy);ctx.stroke();
  ctx.fillStyle='#bdfff5';ctx.beginPath();ctx.arc(hx,hy,5,0,7);ctx.fill();
  const vh=Math.atan2(p.y,p.x);
  ctx.strokeStyle='#b4feee';ctx.lineWidth=1.4;ctx.beginPath();
  ctx.moveTo(hx,hy);ctx.lineTo(hx+Math.cos(vh)*18,hy-Math.sin(vh)*18);ctx.stroke();
  ctx.font='11px system-ui';ctx.fillStyle='#91b3c9';ctx.textAlign='left';
  ctx.fillText('WIDOK Z GÓRY · r / r_g',10,19);
  ctx.fillText('kierunek φ = '+signed(p.phi*180/PI,1)+'°',10,H-12);
  ctx.textAlign='right';
  ctx.fillText('a* = '+signed(state.config.spin,2),W-12,19);
 }
 function paint(image=true){
  if(!dialog.open||!state.trajectory)return;
  const d=diagnostics();
  updateTelemetry(d);
  renderRadar(d.p);
  if(image)renderGpu(d);
  state.dirty=false;
 }
 function tick(now){
  if(!dialog.open){state.raf=0;return;}
  const dt=state.lastTick?Math.min(.10,Math.max(0,(now-state.lastTick)/1000)):0;
  state.lastTick=now;
  if(state.playing){
   state.tau=Math.min(state.trajectory.properElapsed,state.tau+dt*state.tempo);
   if(state.tau>=state.trajectory.properElapsed){
    stop();
    state.notice=state.trajectory.reason==='horizon'?
     'Misja zakończona tuż nad horyzontem. Dalsze śledzenie promieni z tej kamery nie byłoby wiarygodne w bieżących współrzędnych.':
     state.trajectory.reason==='escaped'?'Sonda opuściła obszar symulacji.':
     'Osiągnięto zadany zakres czasu własnego. Zmień kierunek kamery, aby obejrzeć nowe niebo.';
   }
  }
  const gpuInterval=state.quality<=.3?210:state.quality>=.58?240:165;
  if(state.dirty||state.playing){
   if(now-state.lastGpu>=gpuInterval||state.dirty){
    state.lastGpu=now;paint(true);
   }else if(now-state.lastRadar>65){
    state.lastRadar=now;
    const d=diagnostics();updateTelemetry(d);renderRadar(d.p);
   }
  }
  if(state.playing||state.dirty)state.raf=requestAnimationFrame(tick);
  else state.raf=0;
 }
 function schedule(){
  if(!dialog.open)return;
  state.dirty=true;
  if(!state.raf){state.lastTick=0;state.raf=requestAnimationFrame(tick);}
 }
 function open(){
  if(dialog.open)return;
  const api=root.ATLAS_MAIN_API;state.previousMainPlaying=!!api?.getPlaying?.();
  api?.setPlaying?.(false);
  dialog.showModal();ensureGpu();
  if(!state.trajectory)setupConfig(routes.infall.cfg,'infall',routes.infall.name);
  updateAim();paint();schedule();
 }
 function close(){
  if(!dialog.open)return;
  dialog.close();stop();
  if(state.raf)cancelAnimationFrame(state.raf);
  state.raf=0;
  root.ATLAS_MAIN_API?.setPlaying?.(state.previousMainPlaying);
 }
 function fromProbe21(){
  const src=root.ATLAS_PROBE21?.getState?.();
  root.ATLAS_PROBE21?.close?.();
  if(src?.config){
   const candidate=routes[src.preset];
   const matching=candidate&&Math.abs(candidate.cfg.r0-src.config.r0)<.001&&
    Math.abs(candidate.cfg.spin-src.config.spin)<.001&&
    Math.abs(candidate.cfg.radial-src.config.radial)<.001&&
    Math.abs(candidate.cfg.tangential-src.config.tangential)<.002;
   const key=matching?src.preset:'custom';
   setupConfig(src.config,key,matching?candidate.name:'Kontynuacja misji 21.0');
   state.tau=C.clamp(src.tau||0,0,state.trajectory.properElapsed);
   if(src.mass&&BH.masses[src.mass]){
    state.mass=src.mass;$('cockpit22Mass').value=src.mass;
   }
  }
  open();
 }
 function initControls(){
  $('openCockpit22Top').addEventListener('click',open);
  $('openCockpit22Side').addEventListener('click',open);
  $('probe21CockpitLaunch').addEventListener('click',fromProbe21);
  $('cockpit22Close').addEventListener('click',close);
  dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  dialog.addEventListener('click',e=>{if(e.target===dialog)close();});
  $('cockpit22Preset').addEventListener('change',e=>{
   const item=routes[e.target.value];
   if(item){setupConfig(item.cfg,e.target.value,item.name);schedule();}
  });
  for(const [id,look] of [['cockpit22LookHole','hole'],
   ['cockpit22LookMotion','motion'],['cockpit22LookSky','sky'],
   ['cockpit22LookSide','side']]){
   $(id).addEventListener('click',()=>setView(look));
  }
  $('cockpit22Fov').addEventListener('input',e=>{
   state.fov=Number(e.target.value);
   $('cockpit22FovValue').textContent=fmt(state.fov,0)+'°';schedule();
  });
  $('cockpit22Relativity').addEventListener('change',e=>{
   state.relativity=e.target.checked;
   $('cockpit22Shift').disabled=!state.relativity;schedule();
  });
  $('cockpit22Shift').addEventListener('change',e=>{
   state.shift=e.target.checked;schedule();
  });
  $('cockpit22Disk').addEventListener('change',e=>{
   state.disk=e.target.checked;schedule();
  });
  $('cockpit22Play').addEventListener('click',play);
  $('cockpit22Reset').addEventListener('click',()=>{
   stop();state.tau=0;state.notice='';
   $('cockpit22Play').textContent='▶ ROZPOCZNIJ LOT';schedule();
  });
  $('cockpit22Progress').addEventListener('input',e=>{
   stop();state.tau=Number(e.target.value)/1000*state.trajectory.properElapsed;
   state.notice='';schedule();
  });
  $('cockpit22Tempo').addEventListener('change',e=>{state.tempo=Number(e.target.value);});
  $('cockpit22Quality').value=String(state.quality);
  $('cockpit22Quality').addEventListener('change',e=>{
   state.quality=Number(e.target.value);schedule();
  });
  $('cockpit22Mass').addEventListener('change',e=>{
   state.mass=e.target.value;schedule();
  });
  scene.addEventListener('pointerdown',e=>{
   scene.setPointerCapture?.(e.pointerId);
   const v=local();
   const angles=aimAngles(v);
   state.yaw=angles.yaw;state.pitch=angles.pitch;
   state.drag={x:e.clientX,y:e.clientY};
  });
  scene.addEventListener('pointermove',e=>{
   if(!state.drag)return;
   const dx=e.clientX-state.drag.x,dy=e.clientY-state.drag.y;
   state.drag.x=e.clientX;state.drag.y=e.clientY;
   state.aim='manual';state.yaw+=dx*.0048;
   state.pitch=C.clamp(state.pitch+dy*.0036,-1.48,1.48);
   updateAim();schedule();
  });
  scene.addEventListener('pointerup',()=>{state.drag=null;});
  scene.addEventListener('pointercancel',()=>{state.drag=null;});
  scene.addEventListener('wheel',e=>{
   e.preventDefault();
   state.fov=C.clamp(state.fov+Math.sign(e.deltaY)*4,32,100);
   $('cockpit22Fov').value=String(state.fov);
   $('cockpit22FovValue').textContent=fmt(state.fov,0)+'°';
   schedule();
  },{passive:false});
  scene.addEventListener('keydown',e=>{
   if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
   e.preventDefault();
   const angles=aimAngles(local());
   state.yaw=state.aim==='manual'?state.yaw:angles.yaw;
   state.pitch=state.aim==='manual'?state.pitch:angles.pitch;
   state.aim='manual';
   if(e.key==='ArrowLeft')state.yaw-=.09;
   if(e.key==='ArrowRight')state.yaw+=.09;
   if(e.key==='ArrowUp')state.pitch=C.clamp(state.pitch+.075,-1.48,1.48);
   if(e.key==='ArrowDown')state.pitch=C.clamp(state.pitch-.075,-1.48,1.48);
   updateAim();schedule();
  });
  root.document.addEventListener('visibilitychange',()=>{
   if(root.document.hidden&&state.playing)stop();
  });
  root.addEventListener('resize',schedule);
  setupConfig(routes.infall.cfg,'infall',routes.infall.name);
  updateAim();
  root.ATLAS_COCKPIT22=Object.freeze({
   open,close,fromProbe21,selectPreset(key){
    const item=routes[key];if(!item)return false;
    return setupConfig(item.cfg,key,item.name);
   },
   setTau(t){state.tau=C.clamp(t,0,state.trajectory.properElapsed);schedule();},
   renderNow:()=>{if(dialog.open)paint(true);},
   getState:()=>({preset:state.preset,spin:state.config.spin,
    tau:state.tau,playing:state.playing,aim:state.aim,relativity:state.relativity,
    webglAvailable:!!state.gpu,error:state.gpuError,
    current:current(),velocity:local().v,reason:state.trajectory.reason})
  });
 }
 initControls();
}
if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',init);
else init();
})(window);
