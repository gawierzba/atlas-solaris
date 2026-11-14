/**
 * ATLAS SOLARIS 21.0 — Kerr probe mission / equatorial free-fall navigator.
 *
 * Main viewport: cinematic *coordinate projection* of a worldline calculated
 * by timelike Kerr equations; not a literal embedding of curved 3D space.
 * Ergosurface mesh in BL spherical coordinates is a coordinate illustration.
 * Scientific values: conserved E, Lz, proper τ, BL t, r, phi, ZAMO omega.
 * Star haze, light trails, disk texture and vehicle are illustrative.
 */
(function(root){'use strict';
const $=id=>root.document.getElementById(id);
const core=root.ATLAS_PROBE21_CORE,k=root.ATLAS_KERR201_CORE;
const bh=root.ATLAS_BLACKHOLE20_CORE;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const nfmt=(v,n=2)=>Number.isFinite(v)?new Intl.NumberFormat('pl-PL',{
 minimumFractionDigits:n,maximumFractionDigits:n}).format(v):'—';
const signed=(v,n=2)=>(v>0?'+':v<0?'−':'')+nfmt(Math.abs(v),n);
const formatTime=seconds=>{
 if(!Number.isFinite(seconds))return '—';
 if(seconds<60)return nfmt(seconds,2)+' s';
 if(seconds<3600)return nfmt(seconds/60,2)+' min';
 if(seconds<86400)return nfmt(seconds/3600,2)+' godz.';
 if(seconds<86400*400)return nfmt(seconds/86400,2)+' dni';
 return nfmt(seconds/(86400*365.25),2)+' lat';
};
function presets(){
 const circle=core.circularVelocity(.92,6.5,1);
 return {
  ergo:{spin:.92,r0:1.80,radial:-.12,tangential:-.70,
   name:'Paradoks ergosfery',description:'Start w ergosferze z prędkością azymutalną −0,70 c względem ZAMO. Mimo ruchu pod prąd sonda jest wleczona w kierunku obrotu czarnej dziury.'},
  infall:{spin:.92,r0:5.20,radial:-.25,tangential:-.40,
   name:'Lot przez granicę statyczności',description:'Sonda startuje na zewnątrz ergosfery i po swobodnym locie przecina jej granicę r = 2 r_g. Następnie zbliża się do horyzontu.'},
  orbit:{spin:.92,r0:6.50,radial:0,tangential:circle,
   name:'Orbita stabilna',description:'Prędkość startowa odpowiada kołowej orbicie geodezyjnej Kerra. Sonda nie wymaga silników do podtrzymywania orbity.'},
  reverse:{spin:-.92,r0:3.40,radial:-.38,tangential:-.55,
   name:'Przeciwny spin — manewr Penrose’a?',description:'Przy odwróconym spinie i tych samych znakach prędkości tor wygląda zupełnie inaczej. To swobodny przelot, a nie pełny proces Penrose’a.'}
 };
}
function starfield(){
 const arr=[];let seed=212121;
 const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<260;i++)arr.push({x:rnd(),y:rnd(),size:rnd()*1.7+.25,
  alpha:rnd()*.65+.16,tint:rnd()});
 return arr;
}
function init(){
 const dialog=$('probe21Dialog'),scene=$('probe21Canvas'),plot=$('probe21Plot');
 if(!core||!k||!bh||!dialog||!scene||!plot)return;
 const allPresets=presets(),field=starfield();
 const state={config:allPresets.ergo,preset:'ergo',mass:'sagittarius',
  trail:null,ghost:null,ghostVisible:true,tau:0,playing:false,tempo:1,
  zoom:1,cameraYaw:.36,cameraPitch:.48,drag:null,raf:0,frameTime:0,
  dirty:true,lastPaint:0,previousMainPlaying:false,modeMessage:''};
 function getMass(){return bh.masses[state.mass]?.massSolar||4e6;}
 function makeTrails(){
  try{
   const mod=core.release(state.config);
   const trail=core.integrate(mod,{maxTau:155,step:.04,maxPoints:6500});
   let ghost=null;
   if(state.config.r0>2.08&&Math.abs(state.config.spin)>.001){
    try{
     const alt=core.release({...state.config,spin:0});
     ghost=core.integrate(alt,{maxTau:155,step:.04,maxPoints:6500});
    }catch(error){ghost=null;}
   }
   state.trail=trail;state.ghost=ghost;
   state.tau=0;state.modeMessage='';
   return true;
  }catch(error){
   state.modeMessage=String(error.message||error);
   $('probe21Status').textContent='Warunki startowe są poza dopuszczalnym modelem: '+state.modeMessage;
   return false;
  }
 }
 function pause(){
  state.playing=false;
  $('probe21Play').textContent=state.tau>=state.trail.properElapsed?
   '▶ POWTÓRZ MISJĘ':'▶ WZNÓW LOT';
 }
 function statusFor(p){
  const config=state.config;
  const sameAsSpin=Math.sign(p.angularRate)===Math.sign(config.spin)&&Math.abs(config.spin)>.001;
  const againstLocal=Math.sign(config.tangential)===-Math.sign(config.spin);
  if(p.nearHorizon)return 'Sonda dotarła bardzo blisko horyzontu r₊. Współrzędności Boyera–Lindquista stają się tu osobliwe; kończymy obliczenia przed horyzontem.';
  if(p.insideErgo&&sameAsSpin&&againstLocal)return 'PARADOKS ERGOSFERY: początkowa prędkość lokalna była skierowana wbrew obrotowi, lecz dφ/dt ma znak spinu. Wleczenie czasoprzestrzeni wymusza ruch azymutalny względem dalekiego obserwatora.';
  if(p.insideErgo)return 'SONDA W ERGOSFERZE: żadna cząstka o masie nie może pozostawać statyczna względem dalekiego obserwatora. Wyświetlana trajektoria jest swobodną geodezyjną.';
  if(state.preset==='orbit')return 'Orbita kołowa Kerra: równowaga jest uzyskana przez geometrię i dobraną prędkość startową, bez ciągłego ciągu silników.';
  return 'Sonda zbliża się do obszaru silnego wleczenia czasoprzestrzeni. Trasa liczona jest z zachowanych E oraz Lz, bez dodatkowych manewrów.';
 }
 function live(){
  if(!state.trail)return null;
  return core.interpolate(state.trail,state.tau);
 }
 function progress(){
  const total=state.trail?.properElapsed||1;
  return clamp(state.tau/total,0,1);
 }
 function setInputs(){
  $('probe21Spin').value=String(Math.round(state.config.spin*100));
  const minimal=Math.ceil((k.horizons(state.config.spin).outer+.055)*20)*5;
  $('probe21StartR').min=String(minimal);
  $('probe21StartR').value=String(Math.round(state.config.r0*100/5)*5);
  $('probe21Radial').value=String(Math.round(state.config.radial*100));
  $('probe21Tangential').value=String(Math.round(state.config.tangential*100));
  $('probe21SpinText').textContent=signed(state.config.spin,2);
  $('probe21StartRText').textContent=nfmt(state.config.r0,2)+' r_g';
  $('probe21RadialText').textContent=signed(state.config.radial,2)+' c';
  $('probe21TangentialText').textContent=signed(state.config.tangential,2)+' c';
  $('probe21HorizonInfo').textContent='r₊ = '+nfmt(k.horizons(state.config.spin).outer,2)+' r_g';
 }
 function clearAndRecompute(){
  state.playing=false;state.tau=0;
  $('probe21Play').textContent='▶ ROZPOCZNIJ MISJĘ';
  setInputs();makeTrails();
  state.dirty=true;paint();
 }
 function choosePreset(key){
  const p=allPresets[key];
  if(!p)return;
  state.preset=key;state.config={spin:p.spin,r0:p.r0,radial:p.radial,tangential:p.tangential};
  $('probe21Preset').value=key;
  $('probe21Scenario').textContent=p.description;
  clearAndRecompute();
 }
 function updateSlider(which){
  const cfg={...state.config};
  if(which==='spin')cfg.spin=Number($('probe21Spin').value)/100;
  if(which==='r0')cfg.r0=Number($('probe21StartR').value)/100;
  if(which==='radial')cfg.radial=Number($('probe21Radial').value)/100;
  if(which==='tangential')cfg.tangential=Number($('probe21Tangential').value)/100;
  const minR=k.horizons(cfg.spin).outer+.06;
  cfg.r0=Math.max(cfg.r0,Math.ceil(minR*20)/20);
  const speed=Math.hypot(cfg.radial,cfg.tangential);
  if(speed>.975){
   const other=which==='radial'?'tangential':'radial';
   const allowed=Math.sqrt(.975*.975-cfg[other]*cfg[other]);
   cfg[which]=Math.sign(cfg[which])*Math.min(Math.abs(cfg[which]),allowed);
  }
  state.config=cfg;state.preset='custom';$('probe21Preset').value='custom';
  $('probe21Scenario').textContent='Własne warunki startowe. Prędkości to pomiary lokalnego obserwatora ZAMO; po starcie silniki sondy są wyłączone.';
  clearAndRecompute();
 }
 function resize(c,ratio=1.65){
  const rect=c.getBoundingClientRect();
  if(!rect.width||!rect.height)return false;
  const dpr=Math.min(ratio,root.devicePixelRatio||1);
  const w=Math.max(250,Math.min(1600,Math.round(rect.width*dpr)));
  const h=Math.max(150,Math.min(1024,Math.round(rect.height*dpr)));
  if(c.width!==w||c.height!==h){c.width=w;c.height=h;}
  return true;
 }
 function sceneDraw(time){
  if(!resize(scene))return;
  const ctx=scene.getContext('2d'),W=scene.width,H=scene.height;
  const ratio=W/1200;
  const cfg=state.config,p=live(),traj=state.trail;
  if(!traj||!p)return;
  const bg=ctx.createRadialGradient(W*.58,H*.4,0,W*.52,H*.5,Math.max(W,H)*.8);
  bg.addColorStop(0,'#132a47');bg.addColorStop(.55,'#0b1931');bg.addColorStop(1,'#020914');
  ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  ctx.save();
  for(const st of field){
   ctx.globalAlpha=st.alpha;
   ctx.fillStyle=st.tint<.23?'#93b9f2':st.tint<.8?'#e3f3fb':'#ffd8ba';
   const x=st.x*W,y=st.y*H;
   if(st.size<1){ctx.fillRect(x,y,1.1,1.1);}
   else{ctx.beginPath();ctx.arc(x,y,st.size*Math.max(.7,ratio),0,7);ctx.fill();}
  }ctx.restore();
  const ext=clamp(Math.max(4.0,cfg.r0*1.22,
   Math.min(17,Math.max(...traj.points.filter((_,i)=>i%40===0).map(q=>q.r)))),4,22);
  const unit=Math.min(W/(ext*2.8),H/(ext*1.87))*state.zoom;
  const centerX=W*.49,centerY=H*.53,tilt=Math.sin(state.cameraPitch),
   cosine=Math.cos(state.cameraPitch),yaw=state.cameraYaw;
  function toScreen(x,y,z=0){
   const X=x*Math.cos(yaw)-y*Math.sin(yaw);
   const Y=x*Math.sin(yaw)+y*Math.cos(yaw);
   return [centerX+unit*X,centerY+unit*(Y*tilt-z*cosine)];
  }
  // Equatorial Boyer–Lindquist coordinate circles / not proper distances.
  ctx.save();ctx.lineWidth=Math.max(.7,ratio);ctx.strokeStyle='rgba(95,175,214,.12)';
  for(let r=1;r<=ext;r+=(ext>10?2:1)){
   ctx.beginPath();
   for(let j=0;j<=120;j++){
    const a=j*2*Math.PI/120,[x,y]=toScreen(r*Math.cos(a),r*Math.sin(a));
    if(j===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
   }ctx.stroke();
  }
  for(let j=0;j<12;j++){
   const a=j*Math.PI/6;
   const [x,y]=toScreen(ext*Math.cos(a),ext*Math.sin(a));
   ctx.beginPath();ctx.moveTo(centerX,centerY);ctx.lineTo(x,y);ctx.stroke();
  }ctx.restore();
  // Cinematic illustration: hot accretion band far beyond the ergosphere.
  ctx.save();
  for(let band=0;band<4;band++){
   const rr=k.isco(cfg.spin,1)+1.4+band*.5;
   if(rr>ext*1.4)continue;
   ctx.lineWidth=Math.max(1.3,unit*.11);
   ctx.strokeStyle='rgba(240,'+Math.round(140+band*18)+',110,'+
    (.11-band*.02)+')';
   ctx.beginPath();
   for(let j=0;j<=144;j++){
    const angle=j*2*Math.PI/144;
    const [x,y]=toScreen(rr*Math.cos(angle),rr*Math.sin(angle));
    if(j===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
   }ctx.stroke();
  }ctx.restore();
  function drawPath(points,until,color,width,dashed){
   if(!points.length)return;
   ctx.save();ctx.beginPath();ctx.lineCap='round';ctx.lineJoin='round';
   ctx.strokeStyle=color;ctx.lineWidth=width;
   if(dashed)ctx.setLineDash([5*ratio,7*ratio]);
   const step=points.length>1300?Math.ceil(points.length/1400):1;
   for(let i=0;i<=until;i+=step){
    const q=points[i],[x,y]=toScreen(q.x,q.y);
    if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
   }
   if(until>0){
    const q=points[until],[x,y]=toScreen(q.x,q.y);
    ctx.lineTo(x,y);
   }
   ctx.stroke();ctx.restore();
  }
  if(state.ghostVisible&&state.ghost&&state.ghost.points.length){
   drawPath(state.ghost.points,state.ghost.points.length-1,'rgba(181,152,255,.23)',1.6*ratio,true);
   const current=core.interpolate(state.ghost,Math.min(p.tau,state.ghost.properElapsed));
   const n=state.ghost.points.findIndex(q=>q.tau>=current.tau);
   drawPath(state.ghost.points,Math.max(0,n<0?state.ghost.points.length-1:n),
    'rgba(186,151,255,.67)',2.2*ratio,true);
  }
  const currentIdx=traj.points.findIndex(q=>q.tau>=p.tau);
  const count=currentIdx<0?traj.points.length-1:currentIdx;
  drawPath(traj.points,traj.points.length-1,'rgba(76,209,219,.14)',1.3*ratio,false);
  drawPath(traj.points,count,'rgba(111,241,241,.88)',Math.max(2,2.3*ratio),false);
  // Ergosphere coordinate mesh: true static limit rE(theta), but scenic projection.
  const rp=traj.release.horizon;
  ctx.save();ctx.lineWidth=Math.max(.8,1.25*ratio);
  for(let lat=0;lat<6;lat++){
   const theta=(lat+.5)*Math.PI/6,rr=k.ergosurface(cfg.spin,theta);
   ctx.strokeStyle='rgba(94,230,218,'+(.23+lat*.04)+')';
   ctx.beginPath();
   for(let j=0;j<=120;j++){
    const phi=j*2*Math.PI/120;
    const [x,y]=toScreen(rr*Math.sin(theta)*Math.cos(phi),
      rr*Math.sin(theta)*Math.sin(phi),rr*Math.cos(theta));
    if(j===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
   }ctx.stroke();
  }
  for(let mer=0;mer<14;mer++){
   const phi=mer*Math.PI/7;
   ctx.strokeStyle='rgba(72,210,225,.2)';
   ctx.beginPath();
   for(let j=0;j<=80;j++){
    const theta=j*Math.PI/80,rr=k.ergosurface(cfg.spin,theta);
    const [x,y]=toScreen(rr*Math.sin(theta)*Math.cos(phi),
      rr*Math.sin(theta)*Math.sin(phi),rr*Math.cos(theta));
    if(j===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
   }ctx.stroke();
  }
  ctx.restore();
  const sphereRadius=Math.max(7,rp*unit);
  const ring=ctx.createRadialGradient(centerX,centerY,sphereRadius*.7,
    centerX,centerY,sphereRadius*1.45);
  ring.addColorStop(0,'rgba(247,156,125,.0)');
  ring.addColorStop(.53,'rgba(245,143,125,.28)');
  ring.addColorStop(.7,'rgba(107,194,242,.12)');
  ring.addColorStop(1,'rgba(107,194,242,0)');
  ctx.fillStyle=ring;ctx.beginPath();
  ctx.arc(centerX,centerY,sphereRadius*1.45,0,Math.PI*2);ctx.fill();
  const hole=ctx.createRadialGradient(centerX-sphereRadius*.28,
   centerY-sphereRadius*.3,1,centerX,centerY,sphereRadius);
  hole.addColorStop(0,'#03050e');hole.addColorStop(.7,'#00030a');
  hole.addColorStop(1,'#0a1120');
  ctx.fillStyle=hole;ctx.beginPath();ctx.arc(centerX,centerY,sphereRadius,0,7);ctx.fill();
  ctx.strokeStyle='rgba(245,170,149,.83)';ctx.lineWidth=Math.max(1,2*ratio);
  ctx.beginPath();ctx.arc(centerX,centerY,sphereRadius,0,7);ctx.stroke();
  // Current probe: coordinate position and a purely representational vehicle icon.
  const [sx,sy]=toScreen(p.x,p.y,.16);
  ctx.save();
  ctx.fillStyle='rgba(116,243,246,.17)';ctx.beginPath();ctx.arc(sx,sy,15*ratio,0,7);ctx.fill();
  ctx.strokeStyle='#8cf8e9';ctx.lineWidth=Math.max(1,1.7*ratio);
  ctx.beginPath();ctx.arc(sx,sy,8*ratio,0,7);ctx.stroke();
  ctx.translate(sx,sy);ctx.rotate(p.phi+yaw);
  ctx.shadowBlur=21*ratio;ctx.shadowColor='#8dfff0';
  ctx.fillStyle='#ecffff';ctx.beginPath();
  ctx.moveTo(12*ratio,0);ctx.lineTo(-9*ratio,-5*ratio);
  ctx.lineTo(-5*ratio,0);ctx.lineTo(-9*ratio,5*ratio);ctx.closePath();ctx.fill();
  ctx.shadowBlur=0;ctx.restore();
  ctx.save();ctx.fillStyle='#b8f7ef';ctx.font=Math.round(11*Math.max(.85,ratio))+'px system-ui';
  ctx.fillText('◈ SONDA',sx+13*ratio,sy-14*ratio);
  ctx.fillStyle='#7caac5';ctx.font=Math.round(10*Math.max(.7,ratio))+'px system-ui';
  ctx.fillText('r = '+nfmt(p.r,2)+' r_g',sx+13*ratio,sy+2*ratio);
  ctx.restore();
  // Curved arrow indicates local frame dragging omega, not material fluid flow.
  const angle=time*.00025*Math.sign(cfg.spin||1);
  const rr=(rp+1.2)*unit;
  ctx.save();ctx.strokeStyle='rgba(124,225,226,.8)';
  ctx.lineWidth=1.6*ratio;
  ctx.beginPath();ctx.ellipse(centerX,centerY,rr,rr*tilt,yaw,
    angle,angle+Math.sign(cfg.spin||1)*.65,Math.sign(cfg.spin||1)<0);ctx.stroke();
  ctx.restore();
  ctx.fillStyle='rgba(152,202,216,.86)';
  ctx.textAlign='left';ctx.font=Math.round(11*Math.max(.8,ratio))+'px system-ui';
  ctx.fillText('ERGOSFERA · rₑ(θ)',15*ratio,H*.35);
  ctx.fillStyle='rgba(244,178,172,.85)';
  ctx.fillText('HORYZONT r₊',15*ratio,H*.39);
  ctx.fillStyle='rgba(162,136,240,.75)';
  if(state.ghost&&state.ghostVisible)ctx.fillText('— — KERR a*=0 (POCZĄTEK TEN SAM)',15*ratio,H*.44);
  if(cfg.spin!==0){
   ctx.textAlign='right';ctx.fillStyle='rgba(165,236,216,.85)';
   ctx.fillText('WLECZENIE ZAMO '+(cfg.spin>0?'↻':'↺'),W-17*ratio,H*.37);
  }
 }
 function plotDraw(){
  if(!resize(plot,1.35))return;
  const ctx=plot.getContext('2d'),W=plot.width,H=plot.height;
  ctx.fillStyle='#061329';ctx.fillRect(0,0,W,H);
  const points=state.trail?.points||[];if(!points.length)return;
  const marginL=50,marginR=53,top=18,bottom=35,
   availW=W-marginL-marginR,availH=H-top-bottom;
  const maxR=Math.max(3,Math.ceil(state.config.r0+1));
  let minPhi=0,maxPhi=0;
  for(const q of points){minPhi=Math.min(minPhi,q.phi*180/Math.PI);maxPhi=Math.max(maxPhi,q.phi*180/Math.PI);}
  if(maxPhi-minPhi<30){minPhi-=15;maxPhi+=15;}
  const T=state.trail.properElapsed||1;
  const xOf=q=>marginL+q.tau/T*availW;
  const yR=q=>top+availH*(1-q.r/maxR);
  const yPhi=q=>top+availH*(1-(q.phi*180/Math.PI-minPhi)/(maxPhi-minPhi));
  ctx.strokeStyle='rgba(95,135,169,.24)';ctx.lineWidth=1;
  ctx.font='10px system-ui';ctx.textAlign='right';ctx.fillStyle='#86a4be';
  for(let i=0;i<=4;i++){
   const y=top+i*availH/4;
   ctx.beginPath();ctx.moveTo(marginL,y);ctx.lineTo(W-marginR,y);ctx.stroke();
   ctx.fillText(nfmt(maxR*(1-i/4),1),marginL-9,y+4);
  }
  ctx.textAlign='left';ctx.fillStyle='#bb96d7';
  for(let i=0;i<=4;i++){
   const y=top+i*availH/4;
   ctx.fillText(nfmt(maxPhi-(maxPhi-minPhi)*i/4,0)+'°',W-marginR+8,y+4);
  }
  const yErgo=top+availH*(1-2/maxR);
  ctx.save();ctx.setLineDash([5,5]);ctx.strokeStyle='rgba(248,158,119,.62)';
  ctx.beginPath();ctx.moveTo(marginL,yErgo);ctx.lineTo(W-marginR,yErgo);ctx.stroke();ctx.restore();
  function curve(col,fn){
   ctx.strokeStyle=col;ctx.lineWidth=2.4;ctx.beginPath();
   const step=Math.ceil(points.length/950);
   for(let i=0;i<points.length;i+=step){
    const q=points[i],x=xOf(q),y=fn(q);
    if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
   }
   const last=points[points.length-1];ctx.lineTo(xOf(last),fn(last));ctx.stroke();
  }
  curve('#94f4e9',yR);curve('#e2b0ff',yPhi);
  const now=live(),x=xOf(now);
  ctx.strokeStyle='#d8efff';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x,H-bottom);ctx.stroke();
  for(const [y,c] of [[yR(now),'#94f4e9'],[yPhi(now),'#e2b0ff']]){
   ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,4.2,0,7);ctx.fill();
  }
  ctx.fillStyle='#83a6bb';ctx.font='11px system-ui';ctx.textAlign='center';
  ctx.fillText('Czas własny na statku τ / jednostki t_g',W*.5,H-9);
  ctx.textAlign='left';ctx.fillText('0',marginL,H-bottom+16);
  ctx.textAlign='right';ctx.fillText(nfmt(T,2),W-marginR,H-bottom+16);
 }
 function updateStats(){
  const p=live(),tr=state.trail,rel=tr?.release;
  if(!p||!tr)return;
  const rp=k.horizons(state.config.spin).outer;
  const met=k.metric(state.config.spin,Math.max(rp+.015,p.r),Math.PI/2);
  const factor=getMass();
  $('probe21Radius').textContent=nfmt(p.r,3)+' r_g';
  $('probe21Tau').textContent=formatTime(core.physicalTime(factor,p.tau,bh.TG_S));
  $('probe21FarTime').textContent=formatTime(core.physicalTime(factor,p.t,bh.TG_S));
  $('probe21Azimuth').textContent=signed(p.phi*180/Math.PI,1)+'°';
  $('probe21Phase').textContent=p.nearHorizon?'OSTRZEŻENIE / HORYZONT':
    p.insideErgo?'ERGOSFERA / WLECZENIE':
    state.playing?'MISJA / LOT SWOBODNY':'MISJA / POZYCJA WYBRANA';
  $('probe21ErgoAlert').hidden=!p.insideErgo;
  $('probe21FlightLabel').textContent='E = '+signed(rel.E,3)+' · Lz = '+signed(rel.L,3);
  $('probe21Progress').value=String(Math.round(progress()*1000));
  $('probe21ProgressLabel').textContent=nfmt(progress()*100,1)+'%';
  $('probe21Horizon').textContent=nfmt(rp,3)+' r_g';
  $('probe21Energy').textContent=signed(rel.E,5);
  $('probe21Momentum').textContent=signed(rel.L,5)+' M';
  $('probe21Omega').textContent=signed(met.omega,5)+' / t_g';
  $('probe21Angular').textContent=signed(p.angularRate,5)+' / t_g';
  $('probe21Constraint').textContent=tr.maxConstraintError.toExponential(2);
  $('probe21PlotMessage').textContent='r₊='+nfmt(rp,3)+' r_g · rₑ=2 r_g · τ='+nfmt(p.tau,2);
  $('probe21Status').textContent=state.modeMessage||statusFor(p);
  $('probe21Ghost').disabled=!state.ghost;
 }
 function paint(time=performance.now()){
  if(!dialog.open)return;
  updateStats();sceneDraw(time);plotDraw();state.dirty=false;
 }
 function schedule(){
  if(!dialog.open)return;
  state.dirty=true;
  if(!state.raf){state.frameTime=0;state.raf=requestAnimationFrame(tick);}
 }
 function tick(time){
  if(!dialog.open){state.raf=0;return;}
  const dt=state.frameTime?Math.min(.10,Math.max(0,(time-state.frameTime)/1000)):0;
  state.frameTime=time;
  if(state.playing){
   const total=state.trail.properElapsed;
   state.tau=Math.min(total,state.tau+dt*state.tempo);
   if(state.tau>=total){
    state.playing=false;$('probe21Play').textContent='▶ POWTÓRZ MISJĘ';
    state.modeMessage=state.trail.reason==='horizon'?
     'Misja zakończyła się tuż nad horyzontem. Czas t w współrzędnych Boyera–Lindquista dąży do nieskończoności przy horyzoncie; nie pokazujemy fikcyjnego przejścia przez horyzont.':
     state.trail.reason==='escaped'?'Sonda uciekła poza badany obszar.':'Zakończono zaprogramowany zakres czasu własnego.';
   }
  }
  if(time-state.lastPaint>32||state.dirty){
   state.lastPaint=time;paint(time);
  }
  if(state.playing||state.dirty){state.raf=requestAnimationFrame(tick);}
  else state.raf=0;
 }
 function start(){
  if(dialog.open)return;
  const api=root.ATLAS_MAIN_API;state.previousMainPlaying=!!api?.getPlaying?.();
  api?.setPlaying?.(false);
  dialog.showModal();
  if(!state.trail)makeTrails();
  paint();schedule();
 }
 function close(){
  if(!dialog.open)return;
  dialog.close();state.playing=false;
  if(state.raf){cancelAnimationFrame(state.raf);state.raf=0;}
  root.ATLAS_MAIN_API?.setPlaying?.(state.previousMainPlaying);
 }
 function play(){
  if(state.playing){pause();return;}
  if(state.tau>=state.trail.properElapsed)state.tau=0;
  state.modeMessage='';state.playing=true;
  $('probe21Play').textContent='Ⅱ PAUZA';
  schedule();
 }
 function bind(){
  $('openProbe21Side').addEventListener('click',start);
  $('openProbe21Top').addEventListener('click',start);
  $('probe21Close').addEventListener('click',close);
  dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  dialog.addEventListener('click',e=>{if(e.target===dialog)close();});
  $('probe21Preset').addEventListener('change',e=>{
   if(e.target.value==='custom')return;
   choosePreset(e.target.value);
  });
  for(const [id,key] of [['probe21Spin','spin'],['probe21StartR','r0'],
   ['probe21Radial','radial'],['probe21Tangential','tangential']]){
   $(id).addEventListener('input',()=>updateSlider(key));
  }
  $('probe21Play').addEventListener('click',play);
  $('probe21Reset').addEventListener('click',clearAndRecompute);
  $('probe21Progress').addEventListener('input',e=>{
   pause();state.modeMessage='';
   state.tau=Number(e.target.value)/1000*state.trail.properElapsed;paint();
  });
  $('probe21Tempo').addEventListener('change',e=>{state.tempo=Number(e.target.value);});
  $('probe21Mass').addEventListener('change',e=>{state.mass=e.target.value;paint();});
  $('probe21Ghost').addEventListener('change',e=>{state.ghostVisible=e.target.checked;paint();});
  scene.addEventListener('pointerdown',e=>{
   scene.setPointerCapture?.(e.pointerId);
   state.drag={x:e.clientX,y:e.clientY};
  });
  scene.addEventListener('pointermove',e=>{
   if(!state.drag)return;
   const dx=e.clientX-state.drag.x,dy=e.clientY-state.drag.y;
   state.drag.x=e.clientX;state.drag.y=e.clientY;
   state.cameraYaw+=dx*.006;
   state.cameraPitch=clamp(state.cameraPitch+dy*.004,.13,1.40);
   paint();
  });
  scene.addEventListener('pointerup',()=>{state.drag=null;});
  scene.addEventListener('pointercancel',()=>{state.drag=null;});
  scene.addEventListener('wheel',e=>{
   e.preventDefault();state.zoom=clamp(state.zoom*Math.exp(-Math.sign(e.deltaY)*.09),.45,2.5);paint();
  },{passive:false});
  scene.addEventListener('keydown',e=>{
   if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
   e.preventDefault();
   if(e.key==='ArrowLeft')state.cameraYaw-=.12;
   if(e.key==='ArrowRight')state.cameraYaw+=.12;
   if(e.key==='ArrowUp')state.cameraPitch=clamp(state.cameraPitch+.08,.13,1.4);
   if(e.key==='ArrowDown')state.cameraPitch=clamp(state.cameraPitch-.08,.13,1.4);
   paint();
  });
  root.document.addEventListener('visibilitychange',()=>{
   if(root.document.hidden&&state.playing)pause();
  });
  root.addEventListener('resize',paint);
  choosePreset('ergo');
  root.ATLAS_PROBE21=Object.freeze({
   open:start,close,
   selectPreset:choosePreset,
   getState:()=>({spin:state.config.spin,preset:state.preset,tau:state.tau,
    playing:state.playing,reason:state.trail?.reason,hasGhost:!!state.ghost,
    mass:state.mass,config:{...state.config},progress:progress(),
    current:live()})
  });
 }
 bind();
}
if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',init);
else init();
})(window);
