/**
 * ATLAS SOLARIS 19.0 — interactive 3D interstellar navigator.
 * No Three.js or remote APIs. Canvas2D projection of stellar catalogue
 * coordinates plus physically derived 3D parallax, clocks and aberration.
 * Brightness/glow and cinematic departure are illustrative.
 */
(function(root){
'use strict';
const $=id=>document.getElementById(id);
const R=Math.PI/180,DEG=180/Math.PI;
function init(){
 const data=root.ATLAS_INTERSTELLAR19_DATA,core=root.ATLAS_INTERSTELLAR19_CORE;
 const dlg=$('inter19Dialog'),canvas=$('inter19Canvas'),comparison=$('inter19Compare');
 if(!data||!core||!dlg||!canvas||!comparison)return;
 const rows=data.stars, stars=rows.map((r,i)=>({
  id:i,p:[r[0],r[1],r[2]],d:Math.hypot(r[0],r[1],r[2]),
  mag:r[3],bv:r[4],name:r[5]||'',hip:r[6],source:r[7]
 }));
 const starsByName=new Map(stars.filter(s=>s.name).map(s=>[s.name,s]));
 const orionNames=['Betelgeuse','Bellatrix','Alnitak','Alnilam','Mintaka','Saiph','Rigel'];
 const orion=orionNames.map(n=>starsByName.get(n)).filter(Boolean);
 const orionLinks=[
  ['Betelgeuse','Bellatrix'],['Betelgeuse','Alnitak'],['Bellatrix','Mintaka'],
  ['Alnitak','Alnilam'],['Alnilam','Mintaka'],
  ['Alnitak','Saiph'],['Mintaka','Rigel'],['Saiph','Rigel']
 ];
 const state={
  target:stars.find(s=>s.name==='Proxima Centauri')||stars[data.suggestedTargets[0]],
  progress:0,beta:.8,relativity:false,playing:false,introSeconds:0,
  yaw:0,pitch:0,view:'target',fov:97,patterns:'ori',last:0,drawAt:0,
  raf:0,drag:null,hits:[],priorPlaying:false,current:null
 };
 const nfmt=(v,dec=2)=>new Intl.NumberFormat('pl-PL',{maximumFractionDigits:dec,minimumFractionDigits:dec}).format(v);
 const years=y=>y<1?nfmt(y,3)+' roku':y<100?nfmt(y,2)+' lat':nfmt(y,0)+' lat';
 function flight(){return core.route(state.target.p,state.beta,state.progress)}
 function dColor(bv){
  if(bv<0)return '#a7c8ff';if(bv<.30)return '#d0e4ff';
  if(bv<.70)return '#eff3fb';if(bv<1.05)return '#fbebcf';
  if(bv<1.45)return '#f1c4a9';return '#ff9b8a';
 }
 function withGradient(ctx,w,h){
  ctx.fillStyle='#040a19';ctx.fillRect(0,0,w,h);
  const bg=ctx.createRadialGradient(w*.62,h*.25,1,w*.5,h*.5,Math.max(w,h)*.78);
  bg.addColorStop(0,'rgba(24,48,85,.42)');
  bg.addColorStop(.45,'rgba(15,24,61,.25)');bg.addColorStop(1,'rgba(4,8,21,0)');
  ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
 }
 function selectStar(star){
  if(!star||star.d<=0)return;
  state.target=star;state.progress=0;state.playing=false;
  state.introSeconds=0;state.view='target';
  setCameraTo(core.unit(star.p));
  $('inter19Destination').value=String(star.id);
  $('inter19Play').textContent='▶ ROZPOCZNIJ LOT';
  $('inter19Status').textContent='Gotowość. Wybrano: '+star.name+' · '+nfmt(star.d,2)+' lat świetlnych od Słońca.';
  updateUI();render();
 }
 function setCameraTo(dir){
  if(!dir)return;
  const p=core.directionAngles(dir);state.yaw=p.yaw;state.pitch=p.pitch;
 }
 function orionDirection(observer){
  const sum=[0,0,0];
  for(const st of orion){
   const n=core.unit(core.sub(st.p,observer));
   if(!n)continue;
   for(let k=0;k<3;k++)sum[k]+=n[k];
  }
  return core.unit(sum);
 }
 function look(mode){
  state.view=mode;
  const f=flight();
  if(mode==='target')setCameraTo(core.sub(state.target.p,f.position));
  else if(mode==='orion')setCameraTo(orionDirection(f.position));
  else if(mode==='sun')setCameraTo(core.mul(core.norm(f.position)>1e-7?f.position:f.direction,-1));
  render();
 }
 function updateAutoCamera(f){
  if(state.view==='target'){
   const ray=core.sub(state.target.p,f.position);
   if(core.norm(ray)>1e-7)setCameraTo(ray);
  }
  else if(state.view==='orion')setCameraTo(orionDirection(f.position));
  else if(state.view==='sun')setCameraTo(core.mul(core.norm(f.position)>1e-7?f.position:f.direction,-1));
 }
 function resize(canvasElement){
  const rect=canvasElement.getBoundingClientRect();
  if(!rect.width||!rect.height)return false;
  const pixelRatio=Math.min(root.devicePixelRatio||1,1.65);
  const w=Math.min(2000,Math.max(200,Math.round(rect.width*pixelRatio)));
  const h=Math.min(1100,Math.max(140,Math.round(rect.height*pixelRatio)));
  if(canvasElement.width!==w||canvasElement.height!==h){
   canvasElement.width=w;canvasElement.height=h;
  }
  return true;
 }
 function pathDirection(st,observer,f){
  const sight=core.sub(st.p,observer);
  const norm=core.unit(sight);
  if(!norm)return null;
  return state.relativity?core.aberrate(norm,f.direction,state.beta).direction:norm;
 }
 function projectStar(st,observer,f,axes,W,H){
  const dir=pathDirection(st,observer,f);
  if(!dir)return null;
  return core.project(dir,axes,W,H,state.fov);
 }
 function drawConstellationLines(ctx,observer,f,axes,W,H){
  if(state.patterns==='none')return;
  const choose=state.patterns==='all'?Object.keys(data.figures):[{
   ori:'Ori',uma:'UMa',cas:'Cas',cyg:'Cyg'
  }[state.patterns]].filter(Boolean);
  const memo=new Map();
  function xy(i){
   if(!memo.has(i)){
    const st=stars[i];
    memo.set(i,st?projectStar(st,observer,f,axes,W,H):null);
   }
   return memo.get(i);
  }
  ctx.save();ctx.lineWidth=Math.max(.7,W/1000);
  ctx.strokeStyle=state.patterns==='all'?'rgba(94,149,189,.18)':'rgba(100,215,237,.52)';
  for(const key of choose){
   const figure=data.figures[key];if(!figure)continue;
   for(const chain of figure.paths){
    ctx.beginPath();let prev=null;
    for(const idx of chain){
     if(idx<0){prev=null;continue;}
     const q=xy(idx);
     if(q&&prev&&Math.hypot(q.x-prev.x,q.y-prev.y)<Math.min(W,H)*1.1){
      ctx.moveTo(prev.x,prev.y);ctx.lineTo(q.x,q.y);
     }
     prev=q;
    }
    ctx.stroke();
   }
  }
  ctx.restore();
 }
 function paintStar(ctx,x,y,mag,bv,important,scale){
  const color=dColor(bv);
  const base=Number.isFinite(mag)?Math.max(.58,Math.min(4,2.5-mag*.29)):1.2;
  const r=Math.max(.65,base*scale);
  ctx.fillStyle=color;
  ctx.globalAlpha=Number.isFinite(mag)?Math.max(.23,Math.min(1,1.1-mag*.12)):.48;
  if(r<1.2){ctx.fillRect(x,y,Math.max(1,r),Math.max(1,r));}
  else{
   ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
  }
  if(important&&r>=2){
   ctx.globalAlpha=.12;
   ctx.beginPath();ctx.arc(x,y,r*3.8,0,Math.PI*2);ctx.fill();
   ctx.globalAlpha=.40;
   ctx.beginPath();ctx.arc(x,y,r*1.8,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;
 }
 function drawSun(ctx,observer,f,axes,W,H,scale){
  const d=core.norm(observer);
  if(d<=.015)return;
  const dir=core.mul(observer,-1/d);
  const n=state.relativity?core.aberrate(dir,f.direction,state.beta).direction:dir;
  const pr=core.project(n,axes,W,H,state.fov);
  if(!pr||pr.x<-20||pr.x>W+20||pr.y<-20||pr.y>H+20)return;
  const mag=core.sunMagnitude(d);
  paintStar(ctx,pr.x,pr.y,mag,.62,true,scale);
  ctx.fillStyle='#b8eef4';ctx.font=Math.round(12*scale)+'px system-ui';
  ctx.fillText('☉ Słońce',pr.x+10*scale,pr.y-12*scale);
 }
 function drawTarget(ctx,observer,f,axes,W,H,scale,time){
  const st=state.target,q=projectStar(st,observer,f,axes,W,H);
  if(!q||q.x<0||q.x>W||q.y<0||q.y>H)return;
  const pulse=2.4*Math.sin(time/380);
  const rad=(17+pulse)*scale;
  ctx.save();
  ctx.strokeStyle='#8cf8ed';ctx.lineWidth=1.8*scale;
  ctx.beginPath();ctx.arc(q.x,q.y,rad,0,2*Math.PI);ctx.stroke();
  ctx.globalAlpha=.8;ctx.setLineDash([3*scale,7*scale]);
  ctx.beginPath();ctx.arc(q.x,q.y,rad*1.5,0,2*Math.PI);ctx.stroke();
  ctx.setLineDash([]);ctx.globalAlpha=1;
  ctx.font='700 '+Math.round(14*scale)+'px system-ui';
  ctx.textAlign=q.x>W-240*scale?'right':'left';
  ctx.fillStyle='#c2fff3';
  ctx.fillText(st.name,q.x+(q.x>W-240*scale?-22:22)*scale,q.y-24*scale);
  ctx.restore();
 }
 function drawNavReticle(ctx,W,H,scale){
  const cx=W/2,cy=H/2;
  ctx.save();ctx.strokeStyle='rgba(125,194,220,.32)';ctx.lineWidth=1.1*scale;
  ctx.beginPath();ctx.arc(cx,cy,17*scale,0,Math.PI*2);ctx.stroke();
  for(let a=0;a<4;a++){
   const angle=a*Math.PI/2;
   const x=Math.cos(angle),y=Math.sin(angle);
   ctx.beginPath();ctx.moveTo(cx+x*25*scale,cy+y*25*scale);
   ctx.lineTo(cx+x*34*scale,cy+y*34*scale);ctx.stroke();
  }
  ctx.restore();
 }
 function drawFlightBackground(ctx,W,H,time,progress){
  withGradient(ctx,W,H);
  const cx=W*.5,cy=H*.5,scale=Math.max(1,W/1000);
  // Fine blue motion trails are explicitly cinematic, not plotted stars.
  if(state.playing&&progress>0&&progress<1&&state.introSeconds<=0){
   ctx.save();ctx.strokeStyle='rgba(84,178,242,.095)';
   ctx.lineWidth=1.2*scale;
   for(let j=0;j<38;j++){
    const angle=j*2.3999632297;
    const rad=((j*43.13+time*.035)%Math.min(W,H))*.52;
    const x=cx+Math.cos(angle)*rad,y=cy+Math.sin(angle)*rad;
    ctx.beginPath();ctx.moveTo(x,y);
    ctx.lineTo(x+Math.cos(angle)*(14+state.beta*22)*scale,
      y+Math.sin(angle)*(14+state.beta*22)*scale);ctx.stroke();
   }ctx.restore();
  }
 }
 function drawLaunch(ctx,W,H,time){
  withGradient(ctx,W,H);
  const t=1-state.introSeconds/4.2,cx=W*.50,cy=H*.51;
  const scale=Math.min(W,H)/570;
  const zoom=1+t*2.8;
  const planets=[
   ['Ziemia',1,'#69bbfc'],['Mars',1.52,'#f2a293'],['Jowisz',5.20,'#d3bdd9'],
   ['Saturn',9.58,'#bfb1e4'],['Uran',19.2,'#9bd6ef'],['Neptun',30.1,'#729cdd']
  ];
  ctx.save();ctx.translate(cx,cy);ctx.rotate(-.28);
  for(let i=planets.length-1;i>=0;i--){
   const [name,au,col]=planets[i],r=(42+69*Math.log10(au+1))*scale*zoom;
   ctx.strokeStyle='rgba(106,174,223,.37)';
   ctx.setLineDash([4*scale,8*scale]);ctx.lineWidth=1*scale;
   ctx.beginPath();ctx.ellipse(0,0,r,r*.56,0,0,Math.PI*2);ctx.stroke();
   ctx.setLineDash([]);
   const ang=i*1.42+time*.00015,xx=r*Math.cos(ang),yy=r*.56*Math.sin(ang);
   if(Math.abs(xx)<W*.60&&Math.abs(yy)<H*.60){
    ctx.fillStyle=col;ctx.beginPath();ctx.arc(xx,yy,Math.max(2.5,3.6*scale),0,7);ctx.fill();
    if(i<4){ctx.textAlign='left';ctx.font=Math.round(13*scale)+'px system-ui';
      ctx.fillStyle='#a8cadd';ctx.fillText(name,xx+8*scale,yy-8*scale);}
   }
  }
  ctx.shadowBlur=27*scale;ctx.shadowColor='#abcbff';
  ctx.fillStyle='#e4f9ff';ctx.beginPath();ctx.arc(0,0,Math.max(4,8*scale),0,7);ctx.fill();
  ctx.shadowBlur=0;ctx.restore();
  ctx.textAlign='center';ctx.font='700 '+Math.round(20*scale)+'px system-ui';
  ctx.fillStyle='#c7f4f7';ctx.fillText('OPUSZCZAMY UKŁAD SŁONECZNY',cx,H*.16);
  ctx.font=Math.round(12*scale)+'px system-ui';
  ctx.fillStyle='#82b9d2';ctx.fillText('Schematyczny prolog · skala orbit logarytmiczna · za chwilę prawdziwa przestrzeń 3D',cx,H*.21);
  ctx.fillStyle='#b5d5f0';ctx.font=Math.round(14*scale)+'px system-ui';
  ctx.fillText('PRZEJŚCIE W SKALĘ LAT ŚWIETLNYCH',cx,H*.84);
 }
 function drawScene(time){
  if(!resize(canvas))return;
  const W=canvas.width,H=canvas.height,ctx=canvas.getContext('2d');
  const scale=Math.max(.75,Math.min(1.8,W/1200));
  if(state.introSeconds>0){drawLaunch(ctx,W,H,time);return;}
  const f=flight(),observer=f.position;
  updateAutoCamera(f);
  const axes=core.skyAxes(state.yaw,state.pitch);
  drawFlightBackground(ctx,W,H,time,f.progress);
  drawConstellationLines(ctx,observer,f,axes,W,H);
  let hits=[];
  for(const st of stars){
   const isTarget=st.id===state.target.id;
   const dist=core.norm(core.sub(st.p,observer));
   if(dist<1e-5)continue;
   const mag=core.apparentMagnitude(st.mag,st.d,dist);
   if(mag!==null&&mag>7.8&&!isTarget)continue;
   if(mag===null&&!isTarget&&st.source!==1)continue;
   const pr=projectStar(st,observer,f,axes,W,H);
   if(!pr||pr.x<-12||pr.x>W+12||pr.y<-12||pr.y>H+12)continue;
   // Unknown V magnitudes are represented as faint positional markers only.
   paintStar(ctx,pr.x,pr.y,mag,st.bv,isTarget||(mag!==null&&mag<1.7),scale);
   if(st.name&&(mag===null||mag<3.1||isTarget)){
    hits.push({st,x:pr.x,y:pr.y,m:mag??9});
   }
  }
  drawSun(ctx,observer,f,axes,W,H,scale);
  hits.sort((a,b)=>a.m-b.m);
  ctx.save();ctx.textAlign='left';ctx.font=Math.round(11*scale)+'px system-ui';
  ctx.fillStyle='rgba(201,232,246,.82)';
  const labels=[];
  for(const a of hits){
   if(a.st.id===state.target.id)continue;
   if(labels.length>=17)break;
   if(labels.some(q=>Math.hypot(q.x-a.x,q.y-a.y)<50*scale))continue;
   ctx.fillText(a.st.name,a.x+5*scale,a.y-7*scale);labels.push(a);
  }
  ctx.restore();
  drawTarget(ctx,observer,f,axes,W,H,scale,time);
  drawNavReticle(ctx,W,H,scale);
  state.hits=hits;
  if(f.progress===0){
   ctx.save();ctx.textAlign='center';ctx.font=Math.round(12*scale)+'px system-ui';
   ctx.fillStyle='rgba(142,194,222,.88)';
   ctx.fillText('PUNKT STARTU: SŁOŃCE · WSPÓŁRZĘDNE J2000',W/2,H-56*scale);
   ctx.restore();
  }
 }
 function drawCompare(){
  if(!resize(comparison))return;
  const W=comparison.width,H=comparison.height,ctx=comparison.getContext('2d');
  ctx.fillStyle='#070f21';ctx.fillRect(0,0,W,H);
  const f=flight();
  const scale=Math.max(.65,Math.min(1.5,W/900));
  const pts1=Object.fromEntries(orion.map(s=>[s.name,s]));
  function panel(observer,left,label){
   const w=W/2,gap=Math.min(30*scale,w*.1);
   const avg=orionDirection(observer);
   const angles=core.directionAngles(avg||[1,0,0]),axes=core.skyAxes(angles.yaw,angles.pitch);
   const dots=new Map();
   for(const st of orion){
    const ray=core.sub(st.p,observer);
    const unit=core.unit(ray);if(!unit)continue;
    const q=core.project(unit,axes,w,H,49);
    if(!q||q.x<-10||q.x>w+10||q.y<0||q.y>H)continue;
    dots.set(st.name,{x:q.x+left,y:q.y});
   }
   ctx.save();ctx.beginPath();ctx.rect(left,0,w,H);ctx.clip();
   ctx.fillStyle='#7c9ab8';ctx.font='700 '+Math.round(12*scale)+'px system-ui';
   ctx.fillText(label,left+gap,22*scale);
   ctx.strokeStyle='rgba(112,195,235,.62)';ctx.lineWidth=1.8*scale;
   for(const [a,b] of orionLinks){
    const p=dots.get(a),q=dots.get(b);
    if(!p||!q)continue;
    ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();
   }
   for(const [name,p] of dots){
    ctx.fillStyle=name==='Betelgeuse'?'#ffab98':'#c4e3fc';
    ctx.beginPath();ctx.arc(p.x,p.y,3.0*scale,0,Math.PI*2);ctx.fill();
    ctx.font=Math.round(10*scale)+'px system-ui';ctx.fillStyle='#b0d9ea';
    const short=name==='Betelgeuse'?'Betelgeuse':name;
    ctx.fillText(short,p.x+5*scale,p.y-7*scale);
   }
   ctx.restore();
  }
  panel([0,0,0],0,'Z PERSPEKTYWY SŁOŃCA');
  ctx.strokeStyle='#42627d';ctx.beginPath();ctx.moveTo(W/2,3);ctx.lineTo(W/2,H-3);ctx.stroke();
  panel(f.position,W/2,'Z AKTUALNEJ POZYCJI STATKU');
  const a=starsByName.get('Alnitak'),b=starsByName.get('Mintaka');
  if(a&&b){
   const ang=(o)=>core.angularSeparation(core.sub(a.p,o),core.sub(b.p,o));
   $('inter19OrionInfo').textContent='Rozstaw Pasa Oriona: '+nfmt(ang([0,0,0]),2)+'° → '+nfmt(ang(f.position),2)+'°';
  }
 }
 function updateUI(){
  const f=flight(),t=state.target;
  state.current=f;
  $('inter19BetaText').textContent=nfmt(state.beta,2)+' c';
  $('inter19GammaText').textContent='γ = '+nfmt(f.gamma,3);
  $('inter19TargetName').textContent=t.name||('HIP '+t.hip);
  $('inter19TargetDist').textContent=nfmt(t.d,2)+' lat świetlnych od Słońca'+
   (t.source===2?' · odległość szacunkowa':'');
  $('inter19Progress').value=String(Math.round(f.progress*1000));
  $('inter19ProgressText').textContent=nfmt(f.progress*100,1)+'%';
  $('inter19Dist').textContent=nfmt(f.travelledLy,3)+' ly';
  $('inter19Remaining').textContent=nfmt(f.remainingLy,3)+' ly';
  $('inter19EarthTime').textContent=years(f.earthYears);
  $('inter19ShipTime').textContent=years(f.shipYears);
  $('inter19Signal').textContent=years(f.signalLagYears);
  $('inter19Duration').textContent=years(f.fullShipYears)+' / '+nfmt(f.distanceLy,1)+' ly';
  const dr=core.aberrate(f.direction,f.direction,state.beta);
  $('inter19Doppler').textContent='×'+nfmt(dr.doppler,2);
  $('inter19HeadingTxt').textContent='Kurs: '+t.name+' · '+nfmt(t.d,2)+' ly · J2000';
  $('inter19Phase').textContent=state.introSeconds>0?
   'START: SKALA AU / SEKWENCJA ILUSTRACYJNA':
   f.progress===0?'POZYCJA POCZĄTKOWA / SŁOŃCE':
   f.progress>=1?'CEL OSIĄGNIĘTY / PRZELOT ZAKOŃCZONY':
   'TRWA LOT / '+nfmt(f.progress*100,1)+'% TRASY';
 }
 function render(){
  if(!dlg.open)return;
  updateUI();drawScene(performance.now());drawCompare();
 }
 function frame(now){
  if(!dlg.open){state.raf=0;return;}
  const dt=state.last?Math.min(.12,Math.max(0,(now-state.last)/1000)):0;
  state.last=now;
  if(state.playing){
   if(state.introSeconds>0)state.introSeconds=Math.max(0,state.introSeconds-dt);
   else{
    state.progress=Math.min(1,state.progress+dt/52);
    if(state.progress>=1){
     state.progress=1;state.playing=false;
     $('inter19Play').textContent='▶ POWTÓRZ LOT';
     $('inter19Status').textContent='Dotarliśmy do '+state.target.name+
      '. Teraz obróć kamerę i porównaj Orion z jego ziemskim wyglądem.';
    }
   }
  }
  if(now-state.drawAt>=32){state.drawAt=now;render();}
  state.raf=requestAnimationFrame(frame);
 }
 function pause(){
  state.playing=false;state.introSeconds=0;
  $('inter19Play').textContent=state.progress>=1?'▶ POWTÓRZ LOT':'▶ WZNÓW LOT';
 }
 function begin(){
  if(state.playing){pause();$('inter19Status').textContent='Lot zatrzymany. Możesz obejrzeć gwiazdy z tego miejsca.';return;}
  if(state.progress>=1){state.progress=0;state.view='target';look('target');}
  if(state.progress===0)state.introSeconds=4.2;
  state.playing=true;
  $('inter19Play').textContent='Ⅱ PAUZA';
  $('inter19Status').textContent='Podróż do '+state.target.name+'. Poruszaj myszą lub palcem, aby rozglądać się po nowym niebie.';
 }
 function start(){
  if(dlg.open)return;
  const api=root.ATLAS_MAIN_API;
  state.priorPlaying=!!api?.getPlaying?.();
  api?.setPlaying?.(false);
  dlg.showModal();
  if(state.raf)cancelAnimationFrame(state.raf);
  state.last=0;state.drawAt=0;state.raf=requestAnimationFrame(frame);
  setCameraTo(core.sub(state.target.p,flight().position));resize(canvas);resize(comparison);
  render();
 }
 function stop(){
  if(!dlg.open)return;
  pause();dlg.close();
  if(state.raf)cancelAnimationFrame(state.raf);
  state.raf=0;
  root.ATLAS_MAIN_API?.setPlaying?.(state.priorPlaying);
 }
 function bootstrap(){
  const options=$('inter19Destination');
  options.replaceChildren();
  for(const i of data.suggestedTargets){
   const st=stars[i];
   if(!st||!st.name)continue;
   const opt=document.createElement('option');
   opt.value=String(st.id);
   opt.textContent=st.name+' · '+nfmt(st.d,2)+' ly';
   options.append(opt);
  }
  options.value=String(state.target.id);
  state.beta=Number($('inter19Beta').value)/100;
  setCameraTo(state.target.p);
  $('openInterstellar19Side').addEventListener('click',start);
  $('openInterstellar19Top').addEventListener('click',start);
  $('inter19Close').addEventListener('click',stop);
  options.addEventListener('change',()=>selectStar(stars[Number(options.value)]));
  $('inter19Beta').addEventListener('input',e=>{
   state.beta=Number(e.target.value)/100;
   render();
  });
  $('inter19Relativity').addEventListener('change',e=>{
   state.relativity=e.target.checked;render();
  });
  $('inter19Patterns').addEventListener('change',e=>{
   state.patterns=e.target.value;render();
  });
  $('inter19Play').addEventListener('click',begin);
  $('inter19Reset').addEventListener('click',()=>{
   pause();state.progress=0;state.view='target';look('target');
   $('inter19Status').textContent='Sonda wróciła do położenia Słońca. Gotowość do nowego lotu.';
  });
  $('inter19Progress').addEventListener('input',e=>{
   pause();state.progress=Number(e.target.value)/1000;
   render();
  });
  $('inter19LookTarget').addEventListener('click',()=>look('target'));
  $('inter19LookOrion').addEventListener('click',()=>look('orion'));
  $('inter19LookSun').addEventListener('click',()=>look('sun'));
  canvas.addEventListener('pointerdown',e=>{
   canvas.setPointerCapture(e.pointerId);
   state.drag={x:e.clientX,y:e.clientY,mx:e.clientX,my:e.clientY,total:0};
  });
  canvas.addEventListener('pointermove',e=>{
   const d=state.drag;if(!d)return;
   const dx=e.clientX-d.x,dy=e.clientY-d.y;
   d.total+=Math.abs(dx)+Math.abs(dy);
   d.x=e.clientX;d.y=e.clientY;
   if(d.total>2){
    state.view='manual';
    state.yaw-=dx*.0045;
    state.pitch=core.clamp(state.pitch+dy*.0045,-Math.PI/2+.03,Math.PI/2-.03);
    render();
   }
  });
  canvas.addEventListener('pointerup',e=>{
   const d=state.drag;state.drag=null;
   if(!d||d.total>9)return;
   const rect=canvas.getBoundingClientRect();
   const x=(e.clientX-rect.left)*canvas.width/rect.width;
   const y=(e.clientY-rect.top)*canvas.height/rect.height;
   let found=null,dist=22*(canvas.width/rect.width);
   for(const hit of state.hits){
    const v=Math.hypot(hit.x-x,hit.y-y);
    if(v<dist){found=hit.st;dist=v;}
   }
   if(found)selectStar(found);
  });
  canvas.addEventListener('pointercancel',()=>{state.drag=null;});
  canvas.addEventListener('wheel',e=>{
   e.preventDefault();state.fov=core.clamp(state.fov+Math.sign(e.deltaY)*6,30,140);render();
  },{passive:false});
  canvas.addEventListener('keydown',e=>{
   if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){
    e.preventDefault();state.view='manual';
    if(e.key==='ArrowLeft')state.yaw+=.07;
    if(e.key==='ArrowRight')state.yaw-=.07;
    if(e.key==='ArrowUp')state.pitch=Math.min(1.53,state.pitch+.06);
    if(e.key==='ArrowDown')state.pitch=Math.max(-1.53,state.pitch-.06);
    render();
   }
  });
  dlg.addEventListener('cancel',e=>{e.preventDefault();stop();});
  dlg.addEventListener('click',e=>{if(e.target===dlg)stop();});
  root.document.addEventListener('visibilitychange',()=>{if(root.document.hidden&&state.playing)pause();});
  root.addEventListener('resize',()=>{if(dlg.open)render();});
  root.ATLAS_INTERSTELLAR19=Object.freeze({open:start,close:stop,
   selectDestination:name=>{const s=starsByName.get(name);if(s)selectStar(s);return !!s;},
   getState:()=>({destination:state.target.name,progress:state.progress,beta:state.beta,playing:state.playing})});
 }
 bootstrap();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
})(window);
