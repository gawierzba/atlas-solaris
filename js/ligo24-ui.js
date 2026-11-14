/**
 * ATLAS SOLARIS 24.0 — LIGO laboratory, real optical scales and 2-site blind search.
 * All strain is SYNTHETIC: quadrupole+QNM from stage 23 in independent white noise.
 * The drawing uses schematically magnified mirrors and visible-color infrared laser.
 * The detector significance rule is pedagogical, not the official LIGO search.
 */
(function(root){'use strict';
const $=id=>root.document.getElementById(id),F=root.ATLAS_LIGO24_CORE;
const PI=Math.PI,TAU=2*PI;
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const fmt=(v,p=2)=>Number.isFinite(v)?new Intl.NumberFormat('pl-PL',{
 minimumFractionDigits:p,maximumFractionDigits:p}).format(v):'—';
const sci=(v,p=2)=>Number.isFinite(v)?v.toExponential(p).replace('.',','):'—';
function particles(){
 let seed=241024;const rng=()=>{
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  return seed/4294967296;
 };
 return Array.from({length:140},()=>({x:rng(),y:rng(),a:.08+rng()*.37,r:.2+rng()*1.4}));
}
function init(){
 const dialog=$('ligo24Dialog'),scene=$('ligo24Canvas'),dataPlot=$('ligo24DataPlot'),snrPlot=$('ligo24SNRPlot');
 if(!F||!root.ATLAS_MERGER23_CORE||!dialog||!scene||!dataPlot||!snrPlot)return;
 const stars=particles();
 const state={scenario:'discovery',dataset:null,analysis:null,revealed:false,
  seed:240914,site:'L1',playing:false,time:0,frameTime:0,raf:0,tempo:1,
  custom:false,hasWave:true,dirty:true,previousMainPlaying:false,
  note:'',eventFlag:true};
 function resize(canvas,pxLimit=1500){
  const b=canvas.getBoundingClientRect();
  if(!(b.width>0&&b.height>0))return false;
  const dpr=Math.min(1.5,root.devicePixelRatio||1);
  const w=Math.max(260,Math.min(pxLimit,Math.round(b.width*dpr)));
  const h=Math.max(140,Math.min(860,Math.round(b.height*dpr)));
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
  return true;
 }
 function configForControls(){
  return {scenario:state.scenario==='custom'?'discovery':state.scenario,
   m1:Number($('ligo24M1').value),m2:Number($('ligo24M2').value),
   distance:Number($('ligo24Distance').value),
   noiseLevel:Number($('ligo24Noise').value)/100,
   event:state.eventFlag,seed:state.seed};
 }
 function setLabels(){
  const d=state.dataset,model=d.model;
  $('ligo24DistanceValue').textContent=fmt(model.distance,0)+' Mpc';
  $('ligo24NoiseValue').textContent=fmt(d.noiseLevel,2)+'×';
  $('ligo24M1Value').textContent=fmt(model.m1,1)+' M☉';
  $('ligo24M2Value').textContent=fmt(model.m2,1)+' M☉';
  $('ligo24RoundTrip').textContent=fmt(F.opticalResponse(0).roundTripMicroseconds,2)+' µs';
  $('ligo24Sigma').textContent=sci(d.noiseSigma,2)+' / próbkę';
  $('ligo24ChirpMass').textContent=fmt(model.chirp,2)+' M☉';
  $('ligo24Observatory').textContent=state.site==='L1'?
   'L1 / LIVINGSTON, LUIZJANA':'H1 / HANFORD, WASZYNGTON';
  $('ligo24SceneStatus').textContent='LASER 1064 nm · FAZA / JEDEN OBIEG';
 }
 function make(pre,override){
  try{
   if(pre&&F.SCENARIOS[pre]&&!override){
    const p=F.SCENARIOS[pre];
    state.scenario=pre;state.custom=false;state.eventFlag=p.event;
    $('ligo24M1').value=p.m1;$('ligo24M2').value=p.m2;
    $('ligo24Distance').value=p.distance;
    $('ligo24Noise').value=Math.round(p.noiseLevel*100);
    $('ligo24Preset').value=pre;
    $('ligo24Scenario').textContent=p.description;
   }else{
    state.scenario='custom';state.custom=true;
    $('ligo24Preset').value='custom';
    $('ligo24Scenario').textContent=
      'Własny układ mas i odległość. Fala jest syntetyczna, a masa końcowa przyjęta orientacyjnie. '+
      (state.eventFlag?'W danych ukryto injekcję.':'Aktywna próba bez sygnału.');
   }
   const ds=F.generate(configForControls());
   state.dataset=ds;state.analysis=null;state.revealed=false;
   state.playing=false;state.time=0;state.note='';
   $('ligo24Play').textContent='▶ Odtwórz pomiar';
   $('ligo24Detect').disabled=false;
   $('ligo24Reveal').textContent='◎ Pokaż injekcję';
   $('ligo24FilterHint').textContent='Kliknij „Szukaj sygnału”, aby obliczyć korelację';
   $('ligo24Verdict').dataset.detected='';
   $('ligo24Verdict').textContent='Dane gotowe. Wykrycie jest nieznane do czasu uruchomienia filtru dopasowanego.';
   for(const id of ['ligo24SNRL','ligo24SNRH','ligo24SNRNet','ligo24Delay'])
    $(id).textContent='—';
   setLabels();paint();return true;
  }catch(e){
   $('ligo24Verdict').textContent='Błąd modelu: '+String(e.message||e);
   return false;
  }
 }
 function chosenStrain(){
  if(!state.dataset)return 0;
  return F.signalAt(state.dataset,state.time,state.site);
 }
 function updateTelemetry(){
  const d=state.dataset;
  if(!d)return;
  const read=F.opticalResponse(chosenStrain());
  $('ligo24Strain').textContent=sci(read.strain);
  $('ligo24DX').textContent=sci(read.deltaX)+' m';
  $('ligo24DY').textContent=sci(read.deltaY)+' m';
  $('ligo24DL').textContent=sci(read.differential)+' m';
  $('ligo24Phase').textContent=sci(read.phase)+' rad';
  $('ligo24DarkPort').textContent=sci(read.darkPort);
  $('ligo24SceneClock').textContent='t = '+fmt(state.time,3)+' s';
  $('ligo24Timeline').value=String(Math.round(state.time*1000));
  $('ligo24TimelineValue').textContent=fmt(state.time,3)+' s';
  $('ligo24PlotInfo').textContent='SYNTETYCZNE białe szumy · 4096 Hz · 1,50 s';
  if(state.analysis&&state.analysis.best){
   const b=state.analysis.best;
   $('ligo24SNRL').textContent=fmt(b.snrL1,2);
   $('ligo24SNRH').textContent=fmt(b.snrH1,2);
   $('ligo24SNRNet').textContent=fmt(b.networkSNR,2);
   $('ligo24Delay').textContent=fmt(b.delayMs,2)+' ms';
  }
 }
 function line(ctx,x1,y1,x2,y2,color,width=2){
  ctx.strokeStyle=color;ctx.lineWidth=width;
  ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
 }
 function text(ctx,s,x,y,color='#a9d0c4',size=13,align='left'){
  ctx.fillStyle=color;ctx.font=size+'px system-ui';ctx.textAlign=align;
  ctx.fillText(s,x,y);
 }
 function rect(ctx,x,y,w,h,fill,stroke){
  ctx.fillStyle=fill;ctx.fillRect(x,y,w,h);
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.5;ctx.strokeRect(x,y,w,h);}
 }
 function circle(ctx,x,y,r,fill){
  ctx.fillStyle=fill;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();
 }
 function drawScene(now){
  if(!resize(scene,1460))return;
  const ctx=scene.getContext('2d');if(!ctx)return;
  const W=scene.width,H=scene.height;
  ctx.save();ctx.setTransform(W/1000,0,0,H/640,0,0);
  const bg=ctx.createRadialGradient(490,310,0,490,310,720);
  bg.addColorStop(0,'#112429');bg.addColorStop(.6,'#0a171c');bg.addColorStop(1,'#030a11');
  ctx.fillStyle=bg;ctx.fillRect(0,0,1000,640);
  for(const s of stars){ctx.globalAlpha=s.a;
   circle(ctx,s.x*1000,s.y*640,s.r,'#b7f5ed');}
  ctx.globalAlpha=1;
  const read=F.opticalResponse(chosenStrain());
  const motion=clamp(read.strain/1.5e-21,-1,1)*14;
  const x0=365,y0=405,laserY=405,laserX=100;
  const mx=834+motion,my=101-motion;
  const simSec=state.time;
  // Quadrupolar GW wavefronts in artistic illustration, behind the device.
  const ripple=Math.min(1,Math.abs(read.strain)/1.3e-21);
  for(let i=0;i<6;i++){
   const rad=80+(i+(simSec*.6)%1)*120;
   ctx.strokeStyle='rgba(145,231,187,'+(0.035+.09*ripple*(1-i/7))+')';
   ctx.lineWidth=2;ctx.beginPath();
   ctx.ellipse(460,320,rad*1.1,rad*.55,Math.PI/6,0,TAU);ctx.stroke();
  }
  // Arm housings. 4 km geometry, visually shortened and not to scale.
  ctx.save();ctx.shadowBlur=18;ctx.shadowColor='#427a79';
  rect(ctx,x0-34,y0-39,mx-x0+62,78,'rgba(37,67,70,.62)','#547c7c');
  rect(ctx,x0-34,my-30,78,y0-my+65,'rgba(37,67,70,.62)','#547c7c');
  ctx.restore();
  // Dark vacuum pipes and calibration marks.
  rect(ctx,x0+25,y0-24,mx-x0-30,48,'#0a2023','#335d60');
  rect(ctx,x0-22,my+26,44,y0-my-38,'#0a2023','#335d60');
  for(let u=1;u<=7;u++){
   const x=x0+(mx-x0)*u/8,y=y0-(y0-my)*u/8;
   line(ctx,x,y0-33,x,y0-25,'#547a74',1);
   line(ctx,x0-31,y,x0-23,y,'#547a74',1);
  }
  // The input laser appears visible (actual 1064nm infrared is invisible).
  rect(ctx,57,363,105,84,'#263d3c','#a8bc98');
  rect(ctx,64,371,91,68,'#1b2f31','#537870');
  circle(ctx,143,405,8,'#ecffba');
  text(ctx,'LASER',107,391,'#dffbbb',16,'center');
  text(ctx,'1064 nm / IR',107,424,'#b7cec3',11,'center');
  // Optical beams: yellow-green outbound, bluish-purple retroreflection.
  ctx.save();ctx.shadowBlur=17;ctx.shadowColor='#bdff96';
  line(ctx,160,405,x0,405,'rgba(219,255,145,.92)',5);
  line(ctx,x0,405,mx-10,405,'rgba(213,255,131,.92)',4.4);
  line(ctx,x0,405,x0,my+14,'rgba(196,254,137,.92)',4.4);
  ctx.shadowBlur=13;ctx.shadowColor='#babaff';
  line(ctx,mx-12,415,x0+1,415,'rgba(182,186,255,.68)',2.2);
  line(ctx,x0+11,my+14,x0+11,414,'rgba(182,186,255,.68)',2.2);
  ctx.restore();
  // Animated laser pulse packets: slow representation of optical travel.
  let p=(now*.00054)%2;
  const outbound=p<1?p:2-p;
  const packetX=x0+(mx-x0-15)*outbound;
  const packetY=y0-(y0-my-19)*outbound;
  ctx.save();ctx.shadowBlur=25;ctx.shadowColor='#eaff9c';
  circle(ctx,packetX,y0,7,'#e7ffc7');circle(ctx,x0,packetY,7,'#deffaf');
  ctx.restore();
  // End test masses, suspended mirrors.
  ctx.save();ctx.shadowBlur=17;ctx.shadowColor='#9fdbbf';
  rect(ctx,mx-13,367,28,76,'#cee1db','#8ff9bd');
  rect(ctx,mx-24,362,8,86,'#425958','#b8e5d4');
  rect(ctx,323,my-16,83,26,'#d4e5dc','#90ebb6');
  rect(ctx,318,my-27,94,7,'#4d6865','#9adab3');
  ctx.restore();
  // Suspensions and optical splitter.
  line(ctx,mx,335,mx,362,'#88a6a1',2);
  line(ctx,x0,52,x0,my-24,'#88a6a1',2);
  ctx.save();ctx.translate(x0,y0);ctx.rotate(Math.PI/4);
  rect(ctx,-17,-17,34,34,'#e6faf1','#afd1c1');
  ctx.restore();
  circle(ctx,x0,y0,8,'#d7ffb2');
  // Photodetector: ideal Michelson dark-port signal (far too small to see raw).
  line(ctx,x0,425,x0,538,'rgba(187,241,191,.74)',4);
  rect(ctx,297,537,135,69,'#263d39','#739f8a');
  rect(ctx,307,547,115,49,'#122622','#517c6a');
  text(ctx,'FOTODIODA',366,565,'#d5edcb',13,'center');
  text(ctx,'DARK PORT',366,586,'#95c1b1',10,'center');
  const indicator=clamp(Math.sqrt(read.darkPort)/(1.6e-10),0,.95);
  rect(ctx,438,543,5,52,'#334844');
  rect(ctx,438,594-51*indicator,5,51*indicator,'#dfffaa');
  // Dimension labels.
  text(ctx,'RAMIĘ X · 4 km',605,346,'#bdeac7',16,'center');
  ctx.save();ctx.translate(288,259);ctx.rotate(-Math.PI/2);
  text(ctx,'RAMIĘ Y · 4 km',0,0,'#bdeac7',16,'center');ctx.restore();
  text(ctx,'ZWIERCIADŁO / TEST MASS',mx-4,468,'#aac6be',11,'center');
  text(ctx,'ZWIERCIADŁO',420,my-9,'#aac6be',11);
  text(ctx,'ROZDZIELACZ WIĄZKI',486,430,'#a5bbb4',11);
  // Physical values in the right column of schematic.
  rect(ctx,688,479,283,107,'rgba(14,35,34,.89)','#587d70');
  text(ctx,'FIZYCZNA RÓŻNICA RAMION ΔL',705,505,'#96bfb0',11);
  text(ctx,sci(read.differential,3)+' m',705,541,'#e0ffc4',19);
  text(ctx,'Δφ = '+sci(read.phase,2)+' rad',705,566,'#b3dbcb',12);
  text(ctx,state.site==='L1'?'LIVINGSTON / L1':'HANFORD / H1',16,53,'#a6ddbe',12);
  ctx.restore();
 }
 function plotBase(canvas,width=1100,height=280){
  if(!resize(canvas,1450))return null;
  const ctx=canvas.getContext('2d');
  if(!ctx)return null;
  ctx.save();ctx.setTransform(canvas.width/width,0,0,canvas.height/height,0,0);
  ctx.fillStyle='#06151a';ctx.fillRect(0,0,width,height);
  return {ctx,width,height,left:58,right:width-14,top:27,bottom:height-34};
 }
 function axes(ctx,L,R,T,B,min,max,units){
  ctx.strokeStyle='rgba(116,162,148,.20)';ctx.lineWidth=1;ctx.font='11px system-ui';
  for(let j=0;j<=6;j++){
   const x=L+(R-L)*j/6;
   ctx.beginPath();ctx.moveTo(x,T);ctx.lineTo(x,B);ctx.stroke();
   text(ctx,fmt(j*F.DURATION/6,2)+'s',x,B+18,'#86aaa4',10,'center');
  }
  for(let j=0;j<=4;j++){
   const y=T+(B-T)*j/4;
   ctx.beginPath();ctx.moveTo(L,y);ctx.lineTo(R,y);ctx.stroke();
  }
  text(ctx,units,L+2,T-9,'#9bbcb1',10);
 }
 function seriesEnvelope(ctx,data,sigma,L,R,yCenter,half,color){
  const height=half,scale=Math.max(sigma,1e-24);
  const width=Math.ceil(R-L);
  ctx.strokeStyle=color;ctx.lineWidth=1.15;ctx.beginPath();
  for(let col=0;col<width;col++){
   const first=Math.floor(col*data.length/width);
   const last=Math.min(data.length,Math.max(first+1,Math.ceil((col+1)*data.length/width)));
   let hi=-Infinity,lo=Infinity;
   for(let j=first;j<last;j++){if(data[j]>hi)hi=data[j];if(data[j]<lo)lo=data[j];}
   const yhi=yCenter-clamp(hi/scale,-1,1)*height;
   const ylo=yCenter-clamp(lo/scale,-1,1)*height;
   ctx.moveTo(L+col,yhi);ctx.lineTo(L+col,ylo);
  }
  ctx.stroke();
 }
 function cleanCurve(ctx,arr,L,R,mid,ampl,half,color){
  ctx.strokeStyle=color;ctx.lineWidth=1.8;ctx.beginPath();
  const len=arr.length;
  for(let i=0;i<len;i+=Math.max(1,Math.round(len/1450))){
   const x=L+i/(len-1)*(R-L);
   const y=mid-clamp(arr[i]/ampl,-1,1)*half;
   if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
  }ctx.stroke();
 }
 function drawStrain(){
  const o=plotBase(dataPlot,1120,300);if(!o)return;
  const {ctx,left:L,right:R,top:T,bottom:B}=o,d=state.dataset;
  const c1=87,c2=212,half=52;
  axes(ctx,L,R,T,B,0,1,'ODKSZTAŁCENIE h / SYNTETYCZNY strain');
  line(ctx,L,c1,R,c1,'rgba(112,192,153,.33)',1);
  line(ctx,L,c2,R,c2,'rgba(150,127,215,.33)',1);
  const scale=Math.max(d.noiseSigma*4.2,d.model.waveScale/d.model.rMerge*1.8);
  seriesEnvelope(ctx,d.l1,scale,L,R,c1,half,'rgba(192,250,135,.91)');
  seriesEnvelope(ctx,d.h1,scale,L,R,c2,half,'rgba(195,173,253,.88)');
  if(state.revealed){
   cleanCurve(ctx,d.cleanL1,L,R,c1,scale,half,'#ffd3a7');
   cleanCurve(ctx,d.cleanH1,L,R,c2,scale,half,'#f6b797');
   const x=L+(R-L)*d.expectedTimeL1/d.duration;
   line(ctx,x,T,x,B,'#ffc99b',1.4);
   text(ctx,'INJEKCJA',x-5,T+13,'#ffd4a8',10,'right');
  }
  const mark=L+(R-L)*state.time/d.duration;
  line(ctx,mark,T,mark,B,'rgba(234,249,226,.89)',1.3);
  text(ctx,'L1',L+8,c1-38,'#deffb7',12);
  text(ctx,'H1',L+8,c2-38,'#e3caff',12);
  text(ctx,'±'+sci(scale,1),R-8,T+13,'#8dada5',10,'right');
  text(ctx,'CZAS OD POCZĄTKU OKNA POMIARU / s',L+8,B+31,'#8db7ac',10);
  ctx.restore();
 }
 function drawSNR(){
  const o=plotBase(snrPlot,1120,265);if(!o)return;
  const {ctx,left:L,right:R,top:T,bottom:B}=o,analysis=state.analysis;
  const d=state.dataset;
  axes(ctx,L,R,T,B,0,1,'SKORYGOWANA KORELACJA / SNR · biały szum');
  if(!analysis){
   text(ctx,'POMIAR GOTOWY · FILTR JESZCZE NIEURUCHOMIONY',
    550,114,'#b8d3bc',16,'center');
   text(ctx,'Dwa szablony, dwie serie szumu — poszukaj jednoczesnych pików.',
    550,142,'#87a89d',12,'center');
   ctx.restore();return;
  }
  const maxS=Math.max(10,Math.ceil(analysis.best.networkSNR*1.15/5)*5);
  const z=v=>B-Math.max(0,v)/maxS*(B-T);
  const threshold=z(5);
  ctx.save();ctx.setLineDash([5,6]);line(ctx,L,threshold,R,threshold,'#dbaa83',1.2);ctx.restore();
  text(ctx,'ρ=5',R-5,threshold-6,'#e9b98c',10,'right');
  function curve(arr,color){
   ctx.strokeStyle=color;ctx.lineWidth=1.4;ctx.beginPath();
   const times=analysis.times;
   for(let i=0;i<arr.length;i++){
    const x=L+(times[i]/d.duration)*(R-L),y=z(arr[i]);
    if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
   }ctx.stroke();
  }
  curve(analysis.rhoL1,'#c5f899');
  curve(analysis.rhoH1,'#bcaafd');
  const best=analysis.best;
  if(Number.isFinite(best.timeL1)){
   for(const [time,color] of [[best.timeL1,'#d6ffae'],[best.timeH1,'#d4b9ff']]){
    const x=L+(time/d.duration)*(R-L);
    ctx.strokeStyle=color;ctx.lineWidth=1.5;ctx.beginPath();
    ctx.moveTo(x,T);ctx.lineTo(x,B);ctx.stroke();
   }
  }
  if(state.revealed){
   const x=L+(d.expectedTimeL1/d.duration)*(R-L);
   ctx.save();ctx.strokeStyle='#ffd0ab';ctx.setLineDash([3,5]);
   ctx.beginPath();ctx.moveTo(x,T);ctx.lineTo(x,B);ctx.stroke();ctx.restore();
  }
  text(ctx,'ρ / 0',L+3,B-6,'#8daea6',10);
  text(ctx,'ρ / '+fmt(maxS,0),L+3,T+13,'#8daea6',10);
  ctx.restore();
 }
 function detect(){
  try{
   state.analysis=F.matches(state.dataset);
   const b=state.analysis.best;
   state.note=b.found?
    'ZGODNE WYKRYCIE W MODELU: dwa detektory pokazują dopasowane sygnały w odstępie '+
     fmt(Math.abs(b.delayMs),2)+' ms. SNR sieci = '+fmt(b.networkSNR,2)+'. '+
     'To wykrycie syntetycznej injekcji; nie wynik prawdziwej analizy LIGO.':
    'BRAK POTWIERDZONEGO WYKRYCIA: próg modelu nie został osiągnięty. '+
     'Może to oznaczać szum bez sygnału lub falę za słabą, by ją wykryć.';
   $('ligo24Verdict').textContent=state.note;
   $('ligo24Verdict').dataset.detected=String(b.found);
   $('ligo24FilterHint').textContent='Filtr dopasowany / dwie niezależne korelacje';
   $('ligo24FilterTitle').textContent=b.found?
    'Znaleziono spójny sygnał w obu interferometrach':'Wynik filtru — sprawdź wartość szczytów';
   updateTelemetry();drawSNR();
   return b;
  }catch(e){
   $('ligo24Verdict').textContent='Błąd obliczeń: '+String(e.message||e);
   return null;
  }
 }
 function paint(now=performance.now()){
  if(!dialog.open||!state.dataset)return;
  updateTelemetry();drawScene(now);drawStrain();drawSNR();state.dirty=false;
 }
 function tick(now){
  if(!dialog.open){state.raf=0;return;}
  const dt=state.frameTime?Math.min(.10,Math.max(0,(now-state.frameTime)/1000)):0;
  state.frameTime=now;
  if(state.playing){
   state.time=Math.min(F.DURATION,state.time+dt*state.tempo*(F.DURATION/13));
   if(state.time>=F.DURATION){state.playing=false;
    $('ligo24Play').textContent='▶ Odtwórz ponownie';}
  }
  if(state.playing||state.dirty)paint(now);
  if(state.playing||state.dirty){state.raf=requestAnimationFrame(tick);}
  else state.raf=0;
 }
 function schedule(){
  if(!dialog.open)return;state.dirty=true;
  if(!state.raf){state.frameTime=0;state.raf=requestAnimationFrame(tick);}
 }
 function stop(){
  state.playing=false;
  $('ligo24Play').textContent=state.time>=F.DURATION?
   '▶ Odtwórz ponownie':'▶ Wznów pomiar';
 }
 function play(){
  if(state.playing){stop();return;}
  if(state.time>=F.DURATION)state.time=0;
  state.playing=true;$('ligo24Play').textContent='Ⅱ Pauza';
  schedule();
 }
 function open(){
  if(dialog.open)return;
  const api=root.ATLAS_MAIN_API;
  state.previousMainPlaying=!!api?.getPlaying?.();
  api?.setPlaying?.(false);
  dialog.showModal();
  if(!state.dataset)make('discovery');
  paint();schedule();
 }
 function close(){
  if(!dialog.open)return;
  dialog.close();stop();
  if(state.raf)cancelAnimationFrame(state.raf);state.raf=0;
  root.ATLAS_MAIN_API?.setPlaying?.(state.previousMainPlaying);
 }
 function reveal(){
  state.revealed=!state.revealed;
  $('ligo24Reveal').textContent=state.revealed?'◎ Ukryj injekcję':'◎ Pokaż injekcję';
  $('ligo24BlindNote').textContent=state.revealed?
   (state.dataset.event?
    'W tych syntetycznych danych fala rzeczywiście została wstrzyknięta. Początek sygnału i jego czas dotarcia oznaczono na wykresie. '+
    'Jeśli filtr nie znalazł fali, mamy przykład fałszywie ujemnego wyniku.':
    'Próba kontrolna: sygnał nie został wstrzyknięty. Piki filtru są przypadkowymi dopasowaniami szumu.') :
   'Miejsce syntetycznego zdarzenia jest ukryte. Wykonaj poszukiwanie, zanim obejrzysz prawdziwą injekcję. '+
   'Próg jest regułą dydaktyczną, nie realną istotnością LIGO.';
  schedule();
 }
 function fromMerger23(){
  const prev=root.ATLAS_MERGER23?.getState?.();
  root.ATLAS_MERGER23?.close?.();
  if(prev?.model&&prev.model.m1>=10&&prev.model.m1<=80&&
     prev.model.m2>=10&&prev.model.m2<=80&&
     prev.model.distance>=100&&prev.model.distance<=2000){
   $('ligo24M1').value=String(prev.model.m1);
   $('ligo24M2').value=String(prev.model.m2);
   $('ligo24Distance').value=String(Math.round(prev.model.distance/10)*10);
   $('ligo24Noise').value='100';state.eventFlag=true;
   make('custom',true);
  }else{
   make('discovery');
   $('ligo24Scenario').textContent=
    'Symulator 24.0 działa w paśmie interferometrów naziemnych. '+
    'Supermasywne czarne dziury z poprzedniego eksperymentu emitują falę o zbyt małej częstotliwości. Wybrano GW150914.';
  }
  open();
 }
 function initControls(){
  $('openLigo24Side').addEventListener('click',open);
  $('openLigo24Top').addEventListener('click',open);
  $('merger23ToLigo24').addEventListener('click',fromMerger23);
  $('ligo24Close').addEventListener('click',close);
  dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  dialog.addEventListener('click',e=>{if(e.target===dialog)close();});
  $('ligo24Preset').addEventListener('change',e=>{
   if(e.target.value==='custom')return;
   make(e.target.value);schedule();
  });
  for(const id of ['ligo24Distance','ligo24Noise','ligo24M1','ligo24M2']){
   $(id).addEventListener('input',()=>{
    make('custom',true);schedule();
   });
  }
  $('ligo24Site').addEventListener('change',e=>{
   state.site=e.target.value;setLabels();schedule();
  });
  $('ligo24Play').addEventListener('click',play);
  $('ligo24Replay').addEventListener('click',()=>{
   stop();state.time=0;$('ligo24Play').textContent='▶ Odtwórz pomiar';schedule();
  });
  $('ligo24Timeline').addEventListener('input',e=>{
   stop();state.time=clamp(Number(e.target.value)/1000,0,F.DURATION);schedule();
  });
  $('ligo24Detect').addEventListener('click',detect);
  $('ligo24Reveal').addEventListener('click',reveal);
  $('ligo24NewNoise').addEventListener('click',()=>{
   state.seed+=104729;
   if(F.SCENARIOS[state.scenario])make(state.scenario,true);
   else make('custom',true);
   $('ligo24Scenario').textContent='Wygenerowano nowe niezależne szumy w obu detektorach. Czas injekcji jest ukryty.';
   schedule();
  });
  root.addEventListener('resize',schedule);
  root.document.addEventListener('visibilitychange',()=>{
   if(root.document.hidden&&state.playing)stop();
  });
  make('discovery');
  root.ATLAS_LIGO24=Object.freeze({
   open,close,fromMerger23,detect,reveal,
   chooseScenario(key){
    if(!F.SCENARIOS[key])return false;
    return make(key);
   },
   setTime(t){state.time=clamp(t,0,F.DURATION);schedule();},
   renderNow:()=>{if(dialog.open)paint();},
   getState:()=>({scenario:state.scenario,site:state.site,time:state.time,
    playing:state.playing,found:state.analysis?.best.found??null,
    networkSNR:state.analysis?.best.networkSNR??null,
    revealed:state.revealed,event:state.dataset?.event,
    delayMs:state.analysis?.best.delayMs??null,
    noiseSigma:state.dataset?.noiseSigma,
    model:state.dataset?.model})
  });
 }
 initControls();
}
if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',init);
else init();
})(window);
