/**
 * ATLAS SOLARIS 20.0 — interactive black hole laboratory.
 * Uses exact Schwarzschild null-geodesic equation in WebGL2 and CPU diagram;
 * an explicitly illustrative, opaque, optically thin-sample accretion disk.
 */
(function(root){
'use strict';
const $=id=>root.document.getElementById(id);
const core=root.ATLAS_BLACKHOLE20_CORE;
const rendererEngine=root.ATLAS_BLACKHOLE20_RENDERER;
const skyData=root.ATLAS_INTERSTELLAR19_DATA;
const DEG=Math.PI/180;
const format=(v,d=1)=>Number.isFinite(v)?new Intl.NumberFormat('pl-PL',
 {minimumFractionDigits:d,maximumFractionDigits:d}).format(v):'—';
function formatLength(km){
 if(km>=1e9)return format(km/1e9,2)+' mld km';
 if(km>=1e6)return format(km/1e6,2)+' mln km';
 if(km>=1e4)return format(km,0)+' km';
 return format(km,2)+' km';
}
function formatPeriod(sec){
 if(sec>=86400)return format(sec/86400,2)+' dni';
 if(sec>=3600)return format(sec/3600,2)+' godz.';
 if(sec>=60)return format(sec/60,2)+' min';
 return format(sec,3)+' s';
}
function colorBV(v){
 if(v<0)return 'rgb(158,189,253)';
 if(v<.35)return 'rgb(190,219,255)';
 if(v<.9)return 'rgb(245,247,252)';
 if(v<1.4)return 'rgb(255,209,174)';
 return 'rgb(255,151,129)';
}
function skyCanvas(){
 const c=root.document.createElement('canvas');
 c.width=2048;c.height=1024;
 const ctx=c.getContext('2d');
 ctx.fillStyle='#030510';ctx.fillRect(0,0,c.width,c.height);
 if(!skyData?.stars?.length)return c;
 // Stars are real directions in J2000 equatorial coordinates. They are a
 // reference sky texture, NOT the actual galactic background near Sgr A*/M87*.
 const stars=skyData.stars.filter(r=>Number.isFinite(r[3])&&r[3]<7.5)
  .sort((a,b)=>b[3]-a[3]);
 for(const s of stars){
  const [x,y,z,mag,bv]=s;
  const distance=Math.hypot(x,y,z);
  if(distance<=0)continue;
  const u=((Math.atan2(y,x)/(2*Math.PI)+.5)%1+1)%1;
  const v=.5-Math.asin(z/distance)/Math.PI;
  const px=u*c.width,py=v*c.height;
  const alpha=Math.max(.25,Math.min(.95,1-.13*(mag+1)));
  const radius=Math.max(.65,Math.min(3.3,2.5-mag*.24));
  ctx.globalAlpha=alpha;ctx.fillStyle=colorBV(bv);
  ctx.beginPath();ctx.arc(px,py,radius,0,Math.PI*2);ctx.fill();
  if(mag<1.5){
   ctx.globalAlpha=.11;ctx.beginPath();ctx.arc(px,py,radius*4,0,Math.PI*2);ctx.fill();
  }
 }
 ctx.globalAlpha=1;
 return c;
}
function init(){
 const dialog=$('bh20Dialog'),canvas=$('bh20Canvas'),raysCanvas=$('bh20Rays');
 if(!core||!rendererEngine||!dialog||!canvas||!raysCanvas)return;
 const state={preset:'sagittarius',distance:32,inclination:64,fov:50,roll:0,
  clockR:2.6,quality:root.innerWidth<650?.45:.65,lensing:true,disk:true,doppler:true,
  time:0,animate:false,rayAnimate:false,rayProgress:1,inspected:null,
  previousPlaying:false,webgl:null,webglError:'',raf:0,lastTick:0,
  lastRender:0,drag:null,dirty:true,opening:false};
 let cachedTraces=null;
 function getMass(){return core.masses[state.preset];}
 function drawOptions(){return {
  distance:state.distance,inclination:state.inclination,
  fov:state.fov,roll:state.roll,
  lensing:state.lensing,disk:state.disk,doppler:state.doppler,
  brightness:1.18,time:state.time,quality:state.quality
 };}
 function updateStats(){
  const mass=getMass(),p=core.snapshotAtCamera(state.distance,mass.massSolar,mass.id);
  const clock=core.lapse(state.clockR);
  $('bh20Mass').textContent=format(mass.massSolar,0)+' M☉';
  $('bh20MassLocation').textContent=mass.region;
  $('bh20MassSolar').textContent=format(mass.massSolar,0)+' M☉';
  $('bh20Horizon').textContent=formatLength(p.rsKm);
  $('bh20Photon').textContent=formatLength(p.photonSphereKm);
  $('bh20Observer').textContent=format(state.distance/2,2)+' r_s';
  $('bh20TimeRatio').textContent=format(p.staticClockRatio*100,2)+'%';
  $('bh20DistanceValue').textContent=format(state.distance,0)+' r_g';
  $('bh20InclineValue').textContent=format(state.inclination,0)+'°';
  $('bh20FovValue').textContent=format(state.fov,0)+'°';
  $('bh20ClockRValue').textContent=format(state.clockR,2)+' r_g';
  $('bh20OrbitPeriod').textContent=formatPeriod(p.iscoPeriodSeconds);
  $('bh20ShadowAngle').textContent=format(p.shadowAngularRadiusDeg,2)+'°';
  $('bh20ClockExplain').textContent=format(60*clock,1)+' min / 60 min';
  const tide=core.tideAcceleration(state.clockR,mass.massSolar,2);
  $('bh20Tide').textContent='Różnica przyspieszenia pływowego / 2 m: '+tide.toExponential(2).replace('.',',')+' m/s²';
  $('bh20Critical').textContent='Krytyczny b = 3√3 r_g ≈ '+format(core.PHOTON_B,3)+' r_g';
  $('bh20ViewInfo').textContent='r = '+format(state.distance,0)+' r_g · i = '+
   format(state.inclination,0)+'° · obrót kamery '+format(state.roll,0)+'°';
  $('bh20RenderMode').textContent=state.webglError?'WEBGL2 NIEDOSTĘPNY':state.lensing?
   'WEBGL2 · GEODEZYJNE OTW':'WEBGL2 · PROMIENIE PROSTE (KONTROLA)';
  $('bh20Field').textContent=state.lensing?
   'u″ + u = 3Mu² · r_s = 2M':'u″ + u = 0 · model płaski, porównawczy';
  $('bh20Compare').textContent=state.lensing?
   '◈ Porównaj bez ugięcia':'◈ Przywróć ugięcie OTW';
  if(!state.inspected){
   $('bh20Status').textContent=state.lensing?
    'Ugięcie światła jest liczone ze Schwarzschilda. Dotknij obrazu, aby zbadać promień przechodzący przez wybrany piksel.':
    'TRYB PORÓWNAWCZY: sztucznie wyłączono krzywiznę torów światła. Obraz nie jest fizycznym modelem rzeczywistej czarnej dziury.';
  }
 }
 function fallback(error){
  state.webglError=error?.message||String(error);
  $('bh20Fallback').hidden=false;
  $('bh20Fallback').textContent='WebGL2 niedostępny: '+state.webglError+
    '. Naukowy wykres promieni i obliczenia zegarów nadal działają.';
  $('bh20RenderMode').textContent='WEBGL2 NIEDOSTĘPNY';
  state.animate=false;$('bh20Animate').disabled=true;
 }
 function ensureWebGL(){
  if(state.webgl||state.webglError)return;
  try{state.webgl=rendererEngine.create(canvas,skyCanvas());}
  catch(error){console.error('ATLAS BLACK HOLE 20 WebGL2',error);fallback(error);}
 }
 function drawScene(){
  if(!dialog.open)return;
  if(state.webgl){
   try{state.webgl.render(drawOptions());}
   catch(error){console.error('ATLAS BLACK HOLE 20 render',error);fallback(error);}
  }
 }
 function photonTraces(){
  if(cachedTraces&&cachedTraces.flat===!state.lensing&&
   cachedTraces.impact===state.inspected)return cachedTraces;
  const flat=!state.lensing;
  const specs=[
   {impact:4.7,color:'#ff9975',name:'Pochłonięty'},
   {impact:5.7,color:'#8fe3f2',name:'Ugięty'},
   {impact:8.0,color:'#bbb3f7',name:'Odległy'}
  ];
  if(Number.isFinite(state.inspected))specs.push({
   impact:Math.max(.15,state.inspected),color:'#f9f9eb',name:'Twój promień'
  });
  const rays=specs.map(o=>({...o,ray:core.trace(o.impact,{
   r0:120,maxSteps:2300,stepRadians:.012,rExit:115,flat})}));
  cachedTraces={flat,impact:state.inspected,rays};
  return cachedTraces;
 }
 function drawRays(){
  const c=raysCanvas,ctx=c.getContext('2d'),W=c.width,H=c.height;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#080f21';ctx.fillRect(0,0,W,H);
  const cx=W*.48,cy=H*.55,scale=Math.min(W/58,H/34);
  function at(x,y){return [cx+x*scale,cy-y*scale];}
  ctx.save();ctx.strokeStyle='#3c5c8037';ctx.lineWidth=.7;
  for(let v=-28;v<=28;v+=4){
   const [x]=at(v,0);
   ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();
  }
  for(let v=-16;v<=16;v+=4){
   const [,y]=at(0,v);
   ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();
  }
  ctx.restore();
  for(const [radius,color,dashes] of [[32,'#ad6e7040',[2,6]],
   [6,'#cb97a957',[5,5]],[3,'#89d5fa8c',[2,6]]]){
   ctx.save();ctx.setLineDash(dashes);ctx.strokeStyle=color;ctx.lineWidth=1.2;
   ctx.beginPath();ctx.arc(cx,cy,radius*scale,0,Math.PI*2);ctx.stroke();ctx.restore();
  }
  ctx.beginPath();ctx.arc(cx,cy,2*scale,0,2*Math.PI);
  ctx.fillStyle='#00030b';ctx.fill();
  ctx.strokeStyle='#a0a5c8';ctx.lineWidth=1;ctx.stroke();
  ctx.fillStyle='#8da9c4';ctx.font='11px system-ui';ctx.textAlign='left';
  ctx.fillText('HORYZONT / 2 r_g',cx+2*scale+7,cy+3);
  ctx.fillText('SFERA FOTONOWA / 3 r_g',cx+3*scale+8,cy-3*scale-4);
  const clip=Math.max(0,Math.min(1,state.rayProgress));
  const traces=photonTraces().rays;
  ctx.save();ctx.beginPath();ctx.rect(0,0,W,H);ctx.clip();
  for(const t of traces){
   const path=t.ray.path;
   const end=Math.max(2,Math.min(path.length,Math.round(path.length*clip)));
   ctx.strokeStyle=t.color;ctx.lineWidth=t.impact===state.inspected?2.8:1.8;
   ctx.beginPath();
   for(let i=0;i<end;i++){
    const [x,y]=at(...path[i]);
    if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
   }
   ctx.stroke();
   if(clip<1&&end>0){
    const [x,y]=at(...path[end-1]);
    ctx.fillStyle=t.color;ctx.beginPath();ctx.arc(x,y,3.8,0,Math.PI*2);ctx.fill();
   }
  }
  ctx.restore();
  ctx.fillStyle='#6f93af';ctx.font='10px system-ui';
  ctx.textAlign='right';ctx.fillText('Współrzędne: r_g = GM/c² (jednostki modelu)',W-12,H-9);
 }
 function update(){
  updateStats();drawRays();drawScene();
  state.dirty=false;
 }
 function tick(ts){
  if(!dialog.open){state.raf=0;return;}
  const dt=state.lastTick?Math.max(0,Math.min(.13,(ts-state.lastTick)/1000)):0;
  state.lastTick=ts;
  if(state.animate)state.time+=dt;
  if(state.rayAnimate){
   state.rayProgress+=dt/7;
   if(state.rayProgress>=1){
    state.rayProgress=1;state.rayAnimate=false;
    $('bh20RayPlay').textContent='▶ Animuj promienie';
   }
   drawRays();
  }
  if(state.dirty||state.animate){
   // Ray-traced WebGL2 is expensive; ~10 fps is sufficient for the disk.
   if(ts-state.lastRender>90||state.dirty){
    state.lastRender=ts;updateStats();drawScene();state.dirty=false;
   }
  }
  if(state.animate||state.rayAnimate||state.dirty){
   state.raf=requestAnimationFrame(tick);
  }else state.raf=0;
 }
 function schedule(){
  if(!dialog.open)return;
  state.dirty=true;
  if(!state.raf){state.lastTick=0;state.raf=requestAnimationFrame(tick);}
 }
 function open(){
  if(dialog.open)return;
  const api=root.ATLAS_MAIN_API;
  state.previousPlaying=!!api?.getPlaying?.();
  api?.setPlaying?.(false);
  dialog.showModal();state.dirty=true;
  ensureWebGL();
  update();schedule();
 }
 function close(){
  if(!dialog.open)return;
  dialog.close();state.animate=false;state.rayAnimate=false;
  $('bh20Animate').textContent='▶ Uruchom dysk';
  $('bh20RayPlay').textContent='▶ Animuj promienie';
  if(state.raf){cancelAnimationFrame(state.raf);state.raf=0;}
  root.ATLAS_MAIN_API?.setPlaying?.(state.previousPlaying);
 }
 function setPreset(){
  state.preset=$('bh20Preset').value;state.inspected=null;
  updateStats();drawRays();schedule();
 }
 function adjust(id,key,scale=1){
  $(id).addEventListener('input',()=>{
   state[key]=Number($(id).value)*scale;
   if(key==='clockR'){updateStats();drawRays();}
   else schedule();
  });
 }
 function toggle(id,key){
  $(id).addEventListener('change',()=>{
   state[key]=$(id).checked;
   if(key==='lensing'){cachedTraces=null;drawRays();}
   schedule();
  });
 }
 function bind(){
  $('openBlackHole20Side').addEventListener('click',open);
  $('openBlackHole20Top').addEventListener('click',open);
  $('bh20Close').addEventListener('click',close);
  dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  dialog.addEventListener('click',e=>{if(e.target===dialog)close();});
  $('bh20Preset').addEventListener('change',setPreset);
  $('bh20Quality').value=String(state.quality);
  adjust('bh20Distance','distance');
  adjust('bh20Incline','inclination');
  adjust('bh20Fov','fov');
  adjust('bh20ClockR','clockR',.01);
  toggle('bh20Lensing','lensing');
  toggle('bh20Disk','disk');
  toggle('bh20Doppler','doppler');
  $('bh20Quality').addEventListener('change',()=>{state.quality=Number($('bh20Quality').value);schedule();});
  $('bh20Compare').addEventListener('click',()=>{
   state.lensing=!state.lensing;
   $('bh20Lensing').checked=state.lensing;
   state.inspected=null;cachedTraces=null;
   drawRays();schedule();
  });
  $('bh20Animate').addEventListener('click',()=>{
   if(state.webglError)return;
   state.animate=!state.animate;
   $('bh20Animate').textContent=state.animate?'Ⅱ Zatrzymaj dysk':'▶ Uruchom dysk';
   schedule();
  });
  $('bh20RayPlay').addEventListener('click',()=>{
   if(state.rayAnimate){
    state.rayAnimate=false;state.rayProgress=1;
    $('bh20RayPlay').textContent='▶ Animuj promienie';
   }else{
    state.rayProgress=0;state.rayAnimate=true;
    $('bh20RayPlay').textContent='Ⅱ Pauza promieni';
   }
   drawRays();schedule();
  });
  canvas.addEventListener('pointerdown',e=>{
   canvas.setPointerCapture?.(e.pointerId);
   state.drag={x:e.clientX,y:e.clientY,moved:0};
  });
  canvas.addEventListener('pointermove',e=>{
   if(!state.drag)return;
   const dx=e.clientX-state.drag.x,dy=e.clientY-state.drag.y;
   state.drag.moved+=Math.abs(dx)+Math.abs(dy);
   state.drag.x=e.clientX;state.drag.y=e.clientY;
   if(state.drag.moved>5){
    state.roll=(state.roll+dx*.45+3600)%360;
    state.inclination=core.clamp(state.inclination+dy*.22,8,84);
    $('bh20Incline').value=String(Math.round(state.inclination));
    schedule();
   }
  });
  canvas.addEventListener('pointerup',e=>{
   const drag=state.drag;state.drag=null;
   if(!drag||drag.moved>9)return;
   const rect=canvas.getBoundingClientRect();
   const xx=(e.clientX-rect.left-rect.width/2)/rect.height;
   const yy=(rect.height/2-(e.clientY-rect.top))/rect.height;
   const scale=2*Math.tan(state.fov*DEG/2);
   const sx=xx*scale,sy=yy*scale;
   const length=Math.hypot(sx,sy),sinA=length/Math.sqrt(1+length*length);
   const b=state.distance*sinA/(state.lensing?core.lapse(state.distance):1);
   if(!Number.isFinite(b)||b<=0)return;
   state.inspected=b;cachedTraces=null;state.rayProgress=1;
   const result=core.trace(b,{r0:120,maxSteps:2300,stepRadians:.012,rExit:115,flat:!state.lensing});
   $('bh20Status').textContent='Wybrany promień: b = '+format(b,3)+
    ' r_g; wynik: '+(result.status==='captured'?'pochłonięcie przez horyzont':
    result.status==='escaped'?'promień ucieka w przestrzeń':'pobliże niestabilnej orbity')+
    ', najmniejszy promień '+format(result.minimumRadius,2)+' r_g. Wykres pokazuje jego tor.';
   drawRays();
  });
  canvas.addEventListener('pointercancel',()=>{state.drag=null;});
  canvas.addEventListener('wheel',e=>{
   if(!dialog.open)return;
   e.preventDefault();
   state.distance=core.clamp(Math.round(state.distance+Math.sign(e.deltaY)*2),9,90);
   $('bh20Distance').value=String(state.distance);schedule();
  },{passive:false});
  root.addEventListener('resize',schedule);
  root.document.addEventListener('visibilitychange',()=>{
   if(root.document.hidden&&state.animate){
    state.animate=false;
    $('bh20Animate').textContent='▶ Uruchom dysk';
   }
  });
  updateStats();drawRays();
  root.ATLAS_BLACKHOLE20=Object.freeze({
   open,close,getState:()=>({
    preset:state.preset,distance:state.distance,inclination:state.inclination,
    lensing:state.lensing,animate:state.animate,
    webglAvailable:!!state.webgl,webglError:state.webglError
   })
  });
 }
 bind();
}
if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',init);
else init();
})(window);
