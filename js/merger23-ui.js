/**
 * ATLAS SOLARIS 23.0 — gravitational-wave merger observatory.
 * Physics in merger23-core.js. Canvas scene and outward rings are illustrative,
 * not a computed 3D spacetime embedding nor optical flashes.
 * Waveform is computed from the circular quadrupole approximation and a
 * phenomenological Kerr ringdown. No externally recorded audio is used.
 */
(function(root){'use strict';
const $=id=>root.document.getElementById(id),F=root.ATLAS_MERGER23_CORE;
const TAU=2*Math.PI,PI=Math.PI;
const fmt=(x,d=2)=>Number.isFinite(x)?new Intl.NumberFormat('pl-PL',{
 maximumFractionDigits:d,minimumFractionDigits:d}).format(x):'—';
const signed=(v,d=2)=>(v<0?'−':v>0?'+':'')+fmt(Math.abs(v),d);
function sci(v){return Number.isFinite(v)?v.toExponential(2).replace('.',',').replace('e-',' × 10⁻').replace('e+',' × 10⁺'):'—';}
function compact(x){
 if(x>=1e9)return fmt(x/1e9,2)+' mld';
 if(x>=1e6)return fmt(x/1e6,2)+' mln';
 if(x>=1e3)return fmt(x/1e3,1)+' tys.';
 return fmt(x,1);
}
function sec(x){
 if(x>=86400)return fmt(x/86400,2)+' dni';
 if(x>=3600)return fmt(x/3600,2)+' godz.';
 if(x>=60)return fmt(x/60,2)+' min';
 if(x>=1)return fmt(x,2)+' s';
 if(x>=.001)return fmt(x*1e3,2)+' ms';
 return fmt(x*1e6,1)+' μs';
}
function field(){
 let seed=230914;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const stars=Array.from({length:270},()=>({
  x:random(),y:random(),size:.4+random()*1.7,bright:.15+random()*.65,
  blink:random()*TAU,color:random()
 }));
 const motes=Array.from({length:150},()=>({
  angle:random()*TAU,radius:random()*.5+.42,speed:.15+random()*.7,
  alpha:random()*.25+.07,color:random()
 }));
 return {stars,motes};
}
function init(){
 const dialog=$('merger23Dialog'),scene=$('merger23Canvas'),chart=$('merger23Waveform');
 if(!F||!dialog||!scene||!chart)return;
 const fieldData=field();
 const state={preset:'gw150914',model:null,waveform:null,
  progress:0,playing:false,tempo:1,visualSeconds:17,
  viewYaw:.15,viewTilt:.58,drag:null,ripples:true,traces:true,
  sound:false,ctxAudio:null,osc:null,gain:null,lastTime:0,raf:0,
  lastPaint:0,previousMainPlaying:false,dirty:true,status:'',quality:1};
 const sliderKeys=['merger23Mass1','merger23Mass2','merger23Distance','merger23Tilt'];
 function resize(canvas,maxPixel=1450){
  const rect=canvas.getBoundingClientRect();
  if(!rect.width||!rect.height)return false;
  const dpr=Math.min(1.5,root.devicePixelRatio||1);
  const width=Math.max(270,Math.min(maxPixel,Math.round(rect.width*dpr)));
  const height=Math.max(160,Math.min(900,Math.round(rect.height*dpr)));
  if(canvas.width!==width||canvas.height!==height){
   canvas.width=width;canvas.height=height;
  }
  return true;
 }
 function soundStop(){
  try{
   if(state.gain)state.gain.gain.setTargetAtTime(0,state.ctxAudio.currentTime,.035);
  }catch(e){}
 }
 function soundUpdate(sample){
  if(!state.ctxAudio||!state.osc||!state.gain)return;
  try{
   const when=state.ctxAudio.currentTime;
   const physical=sample.stage==='ringdown'?state.model.ringHz:sample.freq;
   const scaled=Math.max(100,Math.min(1300,physical*3.3));
   state.osc.frequency.setTargetAtTime(scaled,when,.075);
   let rel=sample.amplitude/(state.model.waveScale/state.model.rMerge);
   rel=Math.min(1,Math.max(0,rel));
   state.gain.gain.setTargetAtTime(state.playing&&state.sound?
    (.008+.023*Math.pow(rel,.7)):0,when,.025);
  }catch(e){}
 }
 function enableSound(){
  const Audio=root.AudioContext||root.webkitAudioContext;
  if(!Audio){$('merger23Sound').checked=false;state.sound=false;
   state.status='Ta przeglądarka nie obsługuje syntetycznej sonifikacji.';return;}
  if(!state.ctxAudio){
   state.ctxAudio=new Audio();
   state.gain=state.ctxAudio.createGain();
   state.osc=state.ctxAudio.createOscillator();
   state.osc.type='sine';
   state.gain.gain.value=0;
   state.osc.connect(state.gain);state.gain.connect(state.ctxAudio.destination);
   state.osc.start();
  }
  state.ctxAudio.resume?.().catch?.(()=>{});
 }
 function build(pre){
  try{
   let data=F.PRESETS[pre]||F.PRESETS.gw150914;
   const model=F.model(data,{inclination:Number($('merger23Tilt').value)});
   state.model=model;state.preset=pre;state.waveform=F.waveform(model,1350);
   state.progress=0;state.playing=false;state.status='';
   $('merger23Play').textContent='▶ URUCHOM ZDERZENIE';
   for(const [id,property] of [['merger23Mass1','m1'],['merger23Mass2','m2']]){
    const el=$(id);
    el.max=String(data.m1>500?2000000:160);
    el.min=String(data.m1>500?50000:5);
    el.step=data.m1>500?'1000':'0.1';
    el.value=String(data[property]);
   }
   $('merger23Distance').value=String(data.distance);
   $('merger23Tilt').value='35';
   $('merger23Preset').value=pre;
   $('merger23PresetInfo').textContent=data.info;
   state.model=F.model(data,{inclination:35});
   state.waveform=F.waveform(state.model,1350);
   updateLabels();soundStop();paint();return true;
  }catch(error){
   $('merger23Status').textContent='Błąd konfiguracji: '+String(error.message||error);
   return false;
  }
 }
 function custom(){
  const m1=Number($('merger23Mass1').value),m2=Number($('merger23Mass2').value);
  const total=m1+m2,dist=Number($('merger23Distance').value);
  const tilt=Number($('merger23Tilt').value);
  const data={m1,m2,mf:total*.953,af:.68,
   distance:dist,lowerHz:32*65.3/total,observed:false,
   title:'Własne czarne dziury · eksperyment',
   info:'Eksperyment modelowy. Przyjęto umownie utratę 4,7% masy i spin końcowy 0,68; wartości nie pochodzą z obserwacji LIGO.'};
  try{
   state.model=F.model(data,{inclination:tilt});
   state.waveform=F.waveform(state.model,1350);
   state.preset='custom';state.progress=0;state.playing=false;state.status='';
   $('merger23Preset').value='custom';
   $('merger23PresetInfo').textContent=data.info;
   $('merger23Play').textContent='▶ URUCHOM ZDERZENIE';
   updateLabels();soundStop();paint();return true;
  }catch(error){
   $('merger23Status').textContent='Niepoprawne parametry modelu: '+String(error.message||error);
   return false;
  }
 }
 function updateLabels(){
  const m=state.model;if(!m)return;
  $('merger23Mass1Text').textContent=compact(m.m1)+' M☉';
  $('merger23Mass2Text').textContent=compact(m.m2)+' M☉';
  $('merger23DistanceText').textContent=fmt(m.distance,0)+' Mpc';
  $('merger23TiltText').textContent=fmt(m.orient*180/PI,0)+'°';
  $('merger23ChirpMass').textContent=compact(m.chirp)+' M☉';
  $('merger23Eta').textContent=fmt(m.eta,5);
  $('merger23Duration').textContent=sec(m.seconds);
  $('merger23EnergyJ').textContent=m.energyJ.toExponential(3).replace('.',',')+' J';
  $('merger23RingFreq').textContent=m.ringHz>=1?fmt(m.ringHz,1)+' Hz':
   fmt(m.ringHz*1000,2)+' mHz';
  $('merger23DampTime').textContent=sec(m.ringTau);
  $('merger23MassBalance').textContent=compact(m.m1)+' + '+compact(m.m2)+
    ' → '+compact(m.mf)+' M☉';
  $('merger23Before').textContent=compact(m.total)+' M☉';
  $('merger23After').textContent=compact(m.mf)+' M☉';
  $('merger23Lost').textContent=compact(m.energySolar)+' M☉ c²';
  $('merger23EnergyBar').style.width=Math.max(2,(m.energySolar/m.total)*100)+'%';
  $('merger23ChartUnits').textContent=m.observed?'GW150914: masy z LIGO · fala modelowa':'SCENARIUSZ MODELOWY · nie rzeczywiste zdarzenie';
  $('merger23EnergyExplanation').textContent=m.observed?
   'Szacunkowa energia około 3 M☉c² odpowiada rzeczywistym parametrom źródła GW150914. Pokazana spirala i fala h₊ to uproszczony model kwadrupolowy, a finał to przybliżenie drgań połączonej czarnej dziury.':
   'Wartości masy końcowej i energii w tej konfiguracji są założeniami modelowymi. Nie są wynikami obserwacji.';
 }
 function current(){return F.sampleAtProgress(state.model,state.progress);}
 function info(){
  const m=state.model,x=current(),p=state.progress;
  $('merger23Phase').textContent=x.stage==='inspiral'?
   'INSPIRAL / GRAWITACYJNA SPIRALA':p<.86?'MERGER / POŁĄCZENIE':'RINGDOWN / WYGASZANIE';
  $('merger23SceneLabel').textContent=x.stage==='inspiral'?
   'DWA HORYZONTY / ŚLAD SPIRALI':'JEDEN HORYZONT / OSCYLACJE QNM';
  $('merger23Frequency').textContent=x.freq>=1?fmt(x.freq,1)+' Hz':
   fmt(x.freq*1000,2)+' mHz';
  $('merger23Separation').textContent=x.stage==='inspiral'?
   fmt(x.distanceKm,0)+' km':'— · połączone';
  $('merger23Strain').textContent=x.amplitude.toExponential(2);
  $('merger23Countdown').textContent=x.stage==='inspiral'?sec(-x.t):
   '+'+sec(x.t);
  $('merger23ModelStage').textContent=x.stage==='inspiral'?
   'kwadrupol / LO':'Kerr / model QNM';
  $('merger23Progress').value=String(Math.round(p*1000));
  $('merger23ProgressText').textContent=fmt(p*100,1)+'%';
  $('merger23CollisionLabel').hidden=!(p>=.792&&p<.85);
  $('merger23Flash').style.opacity=String(p>.795&&p<.845?
   Math.min(.72,Math.sin((p-.795)/.05*PI)*.72):0);
  if(state.status){$('merger23Status').textContent=state.status;}
  else if(x.stage==='inspiral'){$('merger23Status').textContent=
   'Spirala kwadrupolowa: orbitowanie przyspiesza, rozdzielenie maleje, a częstość i amplituda fal rosną. Wykres h₊ jest liczony w rzeczywistych jednostkach odkształcenia.';}
  else {$('merger23Status').textContent=
   'Połączenie: pełna nieliniowa faza nie jest rozwiązana. Pokazujemy przybliżony wygaszający się mod Kerr l=m=2, n=0. Wizualny błysk nie oznacza emisji światła.';}
 }
 function drawSpace(frame){
  if(!resize(scene,1540))return;
  const ctx=scene.getContext('2d'),W=scene.width,H=scene.height;
  if(!ctx)return;
  const m=state.model,p=state.progress,t=current();
  const cx=W*.5,cy=H*.52,scale=Math.min(W/25,H/16.3);
  const tilt=state.viewTilt,yaw=state.viewYaw;
  const proj=(x,y,z=0)=>{
   const xx=x*Math.cos(yaw)-y*Math.sin(yaw);
   const yy=x*Math.sin(yaw)+y*Math.cos(yaw);
   return [cx+xx*scale,cy+yy*scale*Math.sin(tilt)-z*scale*Math.cos(tilt)];
  };
  const bg=ctx.createRadialGradient(cx,cy,0,cx,cy,Math.max(W,H)*.78);
  bg.addColorStop(0,'#111d3a');bg.addColorStop(.48,'#0b112c');bg.addColorStop(1,'#020510');
  ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  const brightness=t.stage==='ringdown'?Math.exp(-t.t/m.ringTau):Math.pow((m.rStart/t.r),1.4);
  const pulse=p>=.8?Math.exp(-(p-.8)*17):Math.pow(p/.8,3);
  const twinkle=frame*.00023;
  ctx.save();
  for(const star of fieldData.stars){
   const x=star.x*W,y=star.y*H;
   const dist=Math.hypot(x-cx,y-cy);
   const angle=Math.atan2(y-cy,x-cx),rip=Math.sin(dist*.008-twinkle*2+2*angle);
   const move=state.ripples?3.3*pulse*rip:0;
   ctx.globalAlpha=star.bright*(.85+.15*Math.sin(twinkle*7+star.blink));
   ctx.fillStyle=star.color<.18?'#9ebcff':star.color<.8?'#f8f9ff':'#ffd6b7';
   ctx.beginPath();ctx.arc(x+Math.cos(angle)*move,
    y+Math.sin(angle)*move,star.size*Math.min(1.2,W/800+.4),0,TAU);ctx.fill();
  }ctx.restore();
  // Coordinate-based orbital plane mesh. Deformation is conceptual art.
  const gridMax=12;
  ctx.save();ctx.lineWidth=Math.max(.55,W/1600);
  for(let ring=2;ring<=gridMax;ring+=1){
   const alpha=.07+((ring%3)===0?.045:0);
   ctx.strokeStyle='rgba(112,179,237,'+alpha+')';
   ctx.beginPath();
   for(let j=0;j<=164;j++){
    const a=j/164*TAU;
    const radial=ring+(state.ripples?
      .08*pulse*Math.cos(2*a-2*t.phase)*(1-Math.min(.6,ring/25)):0);
    const [xx,yy]=proj(radial*Math.cos(a),radial*Math.sin(a));
    if(j===0)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy);
   }ctx.stroke();
  }
  for(let ray=0;ray<22;ray++){
   const a=ray/22*TAU;
   ctx.beginPath();for(let k=0;k<=65;k++){
    const r=k/65*gridMax;
    const [xx,yy]=proj(r*Math.cos(a),r*Math.sin(a));
    if(k===0)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy);
   }ctx.stroke();
  }
  ctx.restore();
  // Quadrupolar inspired outward fronts; *not* actual visible ripples.
  if(state.ripples){
   ctx.save();
   for(let k=0;k<6;k++){
    const wavePhase=(p*7.5-k*.20)%1;
    const radius=2.3+Math.max(0,wavePhase)*19;
    const intensity=(.12+.35*pulse)*Math.max(0,1-wavePhase)*(.55+.45*Math.cos(k));
    ctx.lineWidth=Math.max(1,scale*.02);
    ctx.strokeStyle='rgba('+(k%2?'116,211,251':'225,155,228')+','+
      Math.max(0,Math.min(.60,intensity))+')';
    ctx.beginPath();
    for(let j=0;j<=184;j++){
     const a=j/184*TAU;
     const warped=radius*(1+.09*Math.cos(2*(a-t.phase))*pulse);
     const [xx,yy]=proj(warped*Math.cos(a),warped*Math.sin(a),0);
     if(j===0)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy);
    }
    ctx.stroke();
   }
   ctx.restore();
  }
  // Fade all previous orbital segments, then highlight the current trail.
  if(state.traces&&t.stage==='inspiral'){
   const samples=240,first=Math.max(0,p-.42);
   for(let which=1;which<=2;which++){
    ctx.beginPath();
    for(let i=0;i<=samples;i++){
     const f=first+(p-first)*i/samples,trace=F.sampleAtProgress(m,f);
     const q=which===1?trace.positions?.one:trace.positions?.two;
     if(!q)continue;
     const [xx,yy]=proj(q.x,q.y,.12);
     if(i===0)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy);
    }
    ctx.shadowColor=which===1?'#9fe4ff':'#ffabd5';
    ctx.shadowBlur=12;ctx.strokeStyle=which===1?'#98dcf8':'#e59cd3';
    ctx.lineWidth=1.8;ctx.globalAlpha=.68;ctx.stroke();
   }ctx.shadowBlur=0;ctx.globalAlpha=1;
  }
  // Photon ring is a stylized image-plane halo, not a ray-traced lens.
  function blackHole(x,y,r,colA,colB){
   const pixel=Math.max(10,r*scale);
   const ring=ctx.createRadialGradient(x,y,pixel*.33,x,y,pixel*2.7);
   ring.addColorStop(0,'rgba(7,9,24,.0)');
   ring.addColorStop(.30,'rgba(2,4,13,.0)');
   ring.addColorStop(.42,colA);ring.addColorStop(.58,colB);ring.addColorStop(1,'rgba(8,15,38,0)');
   ctx.fillStyle=ring;ctx.beginPath();ctx.arc(x,y,pixel*2.7,0,TAU);ctx.fill();
   const shadow=ctx.createRadialGradient(x-pixel*.28,y-pixel*.27,pixel*.05,x,y,pixel);
   shadow.addColorStop(0,'#060713');shadow.addColorStop(.65,'#01020a');shadow.addColorStop(1,'#0a0c1a');
   ctx.fillStyle=shadow;ctx.beginPath();ctx.arc(x,y,pixel,0,TAU);ctx.fill();
   ctx.strokeStyle='rgba(236,202,244,.65)';ctx.lineWidth=Math.max(1,pixel*.038);
   ctx.beginPath();ctx.arc(x,y,pixel*1.05,0,TAU);ctx.stroke();
  }
  if(t.stage==='inspiral'){
   const two=t.positions;
   const onePos=proj(two.one.x,two.one.y,.2),
    twoPos=proj(two.two.x,two.two.y,-.2);
   blackHole(...onePos,1.5*m.m1/m.total,
    'rgba(91,173,242,.29)','rgba(111,192,245,.02)');
   blackHole(...twoPos,1.5*m.m2/m.total,
    'rgba(233,135,213,.32)','rgba(251,178,224,.02)');
   // Luminous test-mass debris purely illustrative around both holes.
   ctx.save();
   for(const mote of fieldData.motes){
    const ang=mote.angle+t.phase*(mote.speed*.36),radius=(t.r+2)*mote.radius;
    const [x,y]=proj(radius*Math.cos(ang),radius*Math.sin(ang),
      (mote.color-.5)*.25);
    ctx.globalAlpha=mote.alpha*(.4+.6*p);
    ctx.fillStyle=mote.color>.4?'#f4b3ca':'#b3daff';
    ctx.fillRect(x,y,1.1+Math.min(1.1,W/1200),1.1+Math.min(1.1,W/1200));
   }ctx.restore();
  }else{
   const f=(p-.8)/.2,ringPulse=Math.exp(-7*f);
   blackHole(cx,cy,1.5*m.mf/m.total,
    'rgba(239,169,224,.43)','rgba(154,203,255,.03)');
   const rad=(2.4+11*f)*scale;
   const flash=ctx.createRadialGradient(cx,cy,1,cx,cy,rad*1.5);
   flash.addColorStop(0,'rgba(237,233,255,'+Math.min(.34,ringPulse*.32)+')');
   flash.addColorStop(.35,'rgba(206,141,238,'+Math.min(.26,ringPulse*.26)+')');
   flash.addColorStop(1,'rgba(193,140,238,0)');
   ctx.fillStyle=flash;ctx.beginPath();ctx.arc(cx,cy,rad*1.5,0,TAU);ctx.fill();
  }
  const vx=Math.min(W*.28,250);
  ctx.font=Math.max(11,Math.round(W/92))+'px system-ui';
  ctx.textAlign='left';
  ctx.fillStyle='rgba(169,202,238,.85)';
  ctx.fillText(t.stage==='inspiral'?'SPIRALA KWADRUPOLOWA':'DRGANIA KOŃCOWE KERRA',18,H*.38);
  ctx.fillStyle='rgba(164,170,202,.60)';
  ctx.font=Math.max(9,Math.round(W/125))+'px system-ui';
  ctx.fillText('WIZUALIZACJA / NIE EMISJA ŚWIATŁA',18,H*.42);
 }
 function drawWaveform(){
  if(!resize(chart,1320))return;
  const ctx=chart.getContext('2d'),W=chart.width,H=chart.height;
  if(!ctx||!state.waveform)return;
  ctx.fillStyle='#071026';ctx.fillRect(0,0,W,H);
  const m=state.model,samples=state.waveform,left=47,right=W-20,top=20,
   bottom=H-32,mid=(top+bottom)/2,width=right-left,half=(bottom-top)/2;
  const maxAmplitude=m.waveScale/m.rMerge*Math.max(.8,m.plusAngle)*1.16;
  const sx=t=>left+(t+m.seconds)/(m.seconds+m.ringDuration)*width;
  const sy=value=>mid-value/maxAmplitude*half;
  ctx.lineWidth=1;
  for(let i=0;i<=4;i++){
   const y=top+i*(bottom-top)/4;
   ctx.strokeStyle='rgba(112,153,186,.19)';
   ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(right,y);ctx.stroke();
  }
  for(let i=0;i<=6;i++){
   const x=left+i*width/6;
   ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x,bottom);
   ctx.strokeStyle='rgba(103,138,168,.12)';ctx.stroke();
  }
  const mergeX=sx(0);
  ctx.strokeStyle='rgba(249,192,145,.86)';ctx.lineWidth=1.4;
  ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(mergeX,top);ctx.lineTo(mergeX,bottom);ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle='#f4b896';ctx.font='11px system-ui';ctx.textAlign='right';
  ctx.fillText('POŁĄCZENIE',Math.min(W-10,mergeX-6),top+12);
  ctx.beginPath();ctx.strokeStyle='#a9e7fd';ctx.lineWidth=1.5;
  samples.forEach((p,i)=>{
   const x=sx(p.t),y=sy(p.hp);
   if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
  });
  ctx.stroke();
  for(const sign of [-1,1]){
   ctx.beginPath();ctx.strokeStyle='rgba(236,178,216,.48)';ctx.lineWidth=1;
   samples.forEach((p,i)=>{
    const x=sx(p.t),y=sy(sign*p.amplitude*m.plusAngle);
    if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
   });ctx.stroke();
  }
  const current=F.sampleAtProgress(m,state.progress),markerX=sx(current.t);
  ctx.strokeStyle='#faf4ff';ctx.lineWidth=1.1;
  ctx.beginPath();ctx.moveTo(markerX,top);ctx.lineTo(markerX,bottom);ctx.stroke();
  ctx.fillStyle='#e2fdff';ctx.beginPath();ctx.arc(markerX,sy(current.hp),3.5,0,TAU);ctx.fill();
  ctx.fillStyle='#9baece';ctx.font='11px system-ui';ctx.textAlign='left';
  ctx.fillText('h₊',8,mid+5);
  ctx.font='10px system-ui';
  ctx.fillText('+'+maxAmplitude.toExponential(1),left+6,top+12);
  ctx.fillText('−'+maxAmplitude.toExponential(1),left+6,bottom-6);
  ctx.fillText('0',left,bottom+17);
  ctx.fillText('−'+sec(m.seconds),left,top+10);
  ctx.textAlign='center';ctx.fillText('CZAS / SEKUNDY ŹRÓDŁA',W*.5,H-8);
  ctx.fillText('0 s',mergeX,bottom+16);
  ctx.textAlign='right';ctx.fillText('+'+sec(m.ringDuration),right,H-9);
 }
 function paint(now=performance.now()){
  if(!dialog.open||!state.model)return;
  info();drawSpace(now);drawWaveform();state.dirty=false;
 }
 function tick(now){
  if(!dialog.open){state.raf=0;return;}
  const dt=state.lastTime?Math.min(.10,Math.max(0,(now-state.lastTime)/1000)):0;
  state.lastTime=now;
  if(state.playing){
   state.progress=Math.min(1,state.progress+dt*state.tempo/state.visualSeconds);
   if(state.progress>=1){
    state.playing=false;state.status='Koniec pokazu. Wygasły drgania końcowej czarnej dziury. Uruchom ponownie, aby obejrzeć spiralę.';
    $('merger23Play').textContent='▶ OBEJRZYJ PONOWNIE';
    soundStop();
   }
  }
  if(state.dirty||state.playing||now-state.lastPaint>900){
   if(now-state.lastPaint>32||state.dirty){
    state.lastPaint=now;paint(now);
    if(state.playing&&state.sound)soundUpdate(current());
   }
  }
  if(state.playing||state.dirty)state.raf=requestAnimationFrame(tick);
  else state.raf=0;
 }
 function schedule(){
  if(!dialog.open)return;
  state.dirty=true;
  if(!state.raf){state.lastTime=0;state.raf=requestAnimationFrame(tick);}
 }
 function open(){
  if(dialog.open)return;
  const api=root.ATLAS_MAIN_API;
  state.previousMainPlaying=!!api?.getPlaying?.();
  api?.setPlaying?.(false);
  dialog.showModal();
  if(!state.model)build('gw150914');
  paint();schedule();
 }
 function pause(){
  state.playing=false;
  $('merger23Play').textContent=state.progress>=1?'▶ OBEJRZYJ PONOWNIE':'▶ WZNÓW';
  soundStop();
 }
 function play(){
  if(state.playing){pause();return;}
  if(state.progress>=1)state.progress=0;
  state.status='';state.playing=true;
  $('merger23Play').textContent='Ⅱ PAUZA';
  if(state.sound)enableSound();
  schedule();
 }
 function close(){
  if(!dialog.open)return;
  dialog.close();pause();
  if(state.raf)cancelAnimationFrame(state.raf);
  state.raf=0;soundStop();
  root.ATLAS_MAIN_API?.setPlaying?.(state.previousMainPlaying);
 }
 function bind(){
  $('openMerger23Side').addEventListener('click',open);
  $('openMerger23Top').addEventListener('click',open);
  $('merger23Close').addEventListener('click',close);
  dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  dialog.addEventListener('click',e=>{if(e.target===dialog)close();});
  $('merger23Preset').addEventListener('change',e=>{
   if(e.target.value==='custom'){custom();return;}
   build(e.target.value);schedule();
  });
  for(const id of sliderKeys){
   $(id).addEventListener('input',()=>{
    if(id==='merger23Tilt'&&state.preset!=='custom'){
     const pre=F.PRESETS[state.preset];
     state.model=F.model(pre,{inclination:Number($(id).value)});
     state.waveform=F.waveform(state.model,1350);
     state.playing=false;state.progress=0;
     $('merger23Play').textContent='▶ URUCHOM ZDERZENIE';
     updateLabels();schedule();
    }else{custom();schedule();}
   });
  }
  $('merger23Play').addEventListener('click',play);
  $('merger23Replay').addEventListener('click',()=>{
   pause();state.progress=0;state.status='';
   $('merger23Play').textContent='▶ URUCHOM ZDERZENIE';schedule();
  });
  $('merger23Progress').addEventListener('input',e=>{
   pause();state.progress=Number(e.target.value)/1000;state.status='';schedule();
  });
  $('merger23Tempo').addEventListener('change',e=>{
   state.tempo=Number(e.target.value);
  });
  $('merger23Ripples').addEventListener('change',e=>{
   state.ripples=e.target.checked;schedule();
  });
  $('merger23Traces').addEventListener('change',e=>{
   state.traces=e.target.checked;schedule();
  });
  $('merger23Sound').addEventListener('change',e=>{
   state.sound=e.target.checked;
   if(state.sound)enableSound();else soundStop();
   schedule();
  });
  scene.addEventListener('pointerdown',e=>{
   scene.setPointerCapture?.(e.pointerId);
   state.drag={x:e.clientX,y:e.clientY};
  });
  scene.addEventListener('pointermove',e=>{
   if(!state.drag)return;
   const dx=e.clientX-state.drag.x,dy=e.clientY-state.drag.y;
   state.drag.x=e.clientX;state.drag.y=e.clientY;
   state.viewYaw+=dx*.0045;
   state.viewTilt=F.clamp(state.viewTilt+dy*.003,.20,1.35);
   schedule();
  });
  scene.addEventListener('pointerup',()=>{state.drag=null;});
  scene.addEventListener('pointercancel',()=>{state.drag=null;});
  root.addEventListener('resize',schedule);
  root.document.addEventListener('visibilitychange',()=>{
   if(root.document.hidden&&state.playing)pause();
  });
  root.ATLAS_MERGER23=Object.freeze({
   open,close,selectPreset(key){if(!F.PRESETS[key])return false;return build(key);},
   setProgress(p){state.progress=F.clamp(p,0,1);schedule();},
   renderNow:()=>{if(dialog.open)paint();},
   getState:()=>({preset:state.preset,progress:state.progress,
    playing:state.playing,sound:state.sound,stage:current().stage,
    model:state.model,title:state.model?.title})
  });
  build('gw150914');
 }
 bind();
}
if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',init);
else init();
})(window);
