/**
 * ATLAS SOLARIS 20.1 — Kerr interactive extension of Black Hole 20.0.
 * A genuine Kerr shader replaces Schwarzschild rays only when a* ≠ 0
 * and general relativity is enabled. The a*=0 baseline is unchanged.
 */
(function(root){'use strict';
const $=id=>root.document.getElementById(id);
const core=root.ATLAS_KERR201_CORE;
const gpu=root.ATLAS_KERR201_RENDERER;
const schwarz=root.ATLAS_BLACKHOLE20_CORE;
const DEG=Math.PI/180;
const fmt=(n,p=2)=>Number.isFinite(n)?
 new Intl.NumberFormat('pl-PL',{maximumFractionDigits:p,minimumFractionDigits:p}).format(n):'—';
function duration(s){
 if(!Number.isFinite(s))return 'brak obrotu';
 if(s>=86400)return fmt(s/86400,1)+' dni';
 if(s>=3600)return fmt(s/3600,1)+' godz.';
 if(s>=60)return fmt(s/60,1)+' min';
 return fmt(s,2)+' s';
}
function init(){
 if(!core||!gpu||!schwarz||!$('bh201Spin')||!$('bh20Dialog'))return;
 let spin=Number($('bh201Spin').value)/100,renderer=null;
 let renderFailure='',chosen=null,rayCache=null,lastCacheKey='';
 const formatKm=km=>km>1e9?fmt(km/1e9,2)+' mld km':
  km>1e6?fmt(km/1e6,2)+' mln km':fmt(km,0)+' km';
 function active(){return Math.abs(spin)>.001&&$('bh20Lensing').checked;}
 function stateMass(){return schwarz.masses[$('bh20Preset').value]||schwarz.masses.sagittarius;}
 function notify(){
  root.ATLAS_BLACKHOLE20?.refresh?.();
 }
 function spinUI(){
  $('bh201SpinText').textContent='a* = '+(spin>0?'+':spin<0?'−':'')+fmt(Math.abs(spin),2);
  $('bh201SpinNote').textContent=spin>0?'Wleczenie w stronę +φ':
   spin<0?'Wleczenie w stronę −φ':'Brak obrotu i ergosfery';
  $('bh201KerrBadge').textContent=spin===0?'SCHWARZSCHILD':'KERR / ZAMO';
  for(const b of root.document.querySelectorAll('[data-bh201-spin]')){
   const selected=Number(b.dataset.bh201Spin)/100===spin;
   b.setAttribute('aria-pressed',String(selected));
  }
 }
 function change(next){
  if(renderFailure){
   spin=0;$('bh201Spin').value='0';spinUI();
   $('bh20Status').textContent='Tryb Kerra niedostępny na tym urządzeniu: '+
    renderFailure+'. Pozostaje model Schwarzschilda.';
   return;
  }
  spin=core.clamp(Number(next),-.98,.98);
  $('bh201Spin').value=String(Math.round(spin*100));
  chosen=null;rayCache=null;lastCacheKey='';
  spinUI();notify();
 }
 function render(canvas,texture,o){
  if(!active())return false;
  if(renderFailure)return false;
  try{
   if(!renderer)renderer=gpu.create(canvas,texture);
   return renderer.render({...o,spin,inner:core.isco(spin,1),
    quality:Math.max(.26,(o.quality??.65)*.72)});
  }catch(error){
   renderFailure=String(error.message||error);
   console.error('ATLAS KERR 20.1 WebGL2',error);
   spin=0;$('bh201Spin').value='0';spinUI();
   $('bh201KerrBadge').textContent='KERR / BRAK GPU';
   $('bh201ScienceNote').textContent='Na tym urządzeniu shader Kerra jest niedostępny: '+
    renderFailure+'. Bezpiecznie działa dotychczasowy renderer Schwarzschilda.';
   $('bh20Status').textContent='Shader Kerra nie uruchomił się: '+renderFailure+
    '. Automatycznie przywrócono obraz Schwarzschilda 20.0.';
   return false;
  }
 }
 function updateStats(state,mass){
  const theta=state.inclination*DEG,r=state.distance;
  const h=core.horizons(spin),rs=schwarz.RG_KM*mass.massSolar;
  const ergo=core.ergosurface(spin,Math.PI/2);
  const pro=core.isco(spin,1),retro=core.isco(spin,-1);
  const met=core.metric(spin,r,theta);
  const p=core.frameDraggingPeriod(spin,r,theta,mass.massSolar,schwarz.TG_S);
  $('bh201Horizon').textContent=fmt(h.outer,3)+' r_g';
  $('bh201Ergosphere').textContent=fmt(ergo,3)+' r_g';
  $('bh201IscoPro').textContent=fmt(pro,3)+' r_g';
  $('bh201IscoRetro').textContent=fmt(retro,3)+' r_g';
  $('bh201Omega').textContent=(spin<0?'−':spin>0?'+':'')+
   Math.abs(met.omega).toExponential(2).replace('.',',')+' / t_g';
  $('bh201Period').textContent=duration(p);
  $('bh201ScienceNote').textContent=spin===0?
   'Spin 0: dokładny powrót do obrazu Schwarzschilda 20.0. Ergosfera pokrywa się z horyzontem; oba ISCO = 6 r_g.':
   'Ergosfera leży między horyzontem a powierzchnią granicy statyczności. Wewnątrz niej żaden obserwator nie może pozostać nieruchomy względem dalekiej nieskończoności. Wykres to przekrój współrzędnych Boyera–Lindquista, nie mapa odległości własnych.';
  if(Math.abs(spin)>.001){
   $('bh20Horizon').textContent=formatKm(h.outer*rs);
   $('bh20Photon').textContent=fmt(core.photonOrbit(spin,1),2)+' / '+
    fmt(core.photonOrbit(spin,-1),2)+' r_g';
   $('bh20TimeRatio').textContent=fmt(met.lapse*100,2)+'% · ZAMO';
   $('bh20OrbitPeriod').textContent=duration(core.orbitPeriodSeconds(
    spin,pro,mass.massSolar,1,schwarz.TG_S));
   $('bh20ShadowAngle').textContent='asymetryczny';
   $('bh20ClockExplain').textContent=fmt(60*core.zamoClock(spin,state.clockR,theta),2)+' min / 60 min';
   $('bh20Critical').textContent='Kerr: graniczny parametr fotonu zależy od kierunku, nie ma jednego b = 3√3 r_g.';
   $('bh20RenderMode').textContent=state.lensing?
    (renderFailure?'AWARIA SHADERA KERRA': 'WEBGL2 · KERR / CARTER / ZAMO'):
    'MODEL PŁASKI · BEZ SOCZEWKOWANIA';
   $('bh20Field').textContent='Kerr · rozdzielone równania Cartera (Mino), RK4';
   $('bh20RayLegend').hidden=state.lensing;
   $('bh201RayTitle').textContent=state.lensing?
    'Kerr: fotony współ- i przeciwbieżne':'Porównanie: promienie proste Schwarzschilda';
   if(state.lensing){
    $('bh20Status').textContent=chosen?
     'Twój foton: '+chosen.label:
     'Wleczenie czasoprzestrzeni: promienie po przeciwnych stronach mają inne trajektorie. Przesuń spin z +0,90 do −0,90 i zobacz odwrócenie asymetrii.';
   }
  }else{
   $('bh20RayLegend').hidden=false;
   $('bh201RayTitle').textContent='Schwarzschild: fotony i sfera fotonowa';
  }
  drawGeometry();
  if(renderFailure){
   $('bh201KerrBadge').textContent='KERR / BRAK GPU';
   $('bh201ScienceNote').textContent='WebGL2 Kerr niedostępny: '+renderFailure+
    '. Przełączono na zgodny model Schwarzschilda.';
  }
 }
 function drawGeometry(){
  const cvs=$('bh201Geometry'),ctx=cvs.getContext('2d');
  if(!ctx)return;
  const W=cvs.width,H=cvs.height;
  ctx.fillStyle='#070f1f';ctx.fillRect(0,0,W,H);
  const h=core.horizons(spin).outer;
  const cx=W*.225,cy=H*.50,scale=Math.min(H*.25,W*.15)/2.1;
  ctx.save();ctx.translate(cx,cy);
  ctx.strokeStyle='#406981';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(-W*.17,0);ctx.lineTo(W*.17,0);
  ctx.moveTo(0,-H*.37);ctx.lineTo(0,H*.37);ctx.stroke();
  // Coordinates (x,y)=(r sinθ,r cosθ) only; not proper spatial distances.
  ctx.beginPath();
  for(let i=0;i<=180;i++){
   const theta=i/180*Math.PI*2;
   const r=core.ergosurface(spin,theta);
   const x=Math.sin(theta)*r*scale,y=Math.cos(theta)*r*scale;
   if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
  }
  ctx.closePath();ctx.fillStyle='rgba(87,211,206,.2)';ctx.fill();
  ctx.strokeStyle='#71e1d5';ctx.lineWidth=2.4;ctx.stroke();
  ctx.beginPath();ctx.arc(0,0,h*scale,0,Math.PI*2);
  ctx.fillStyle='#01050d';ctx.fill();ctx.strokeStyle='#f3a2bd';ctx.lineWidth=1.7;ctx.stroke();
  ctx.restore();
  ctx.font='12px system-ui';ctx.textAlign='center';
  ctx.fillStyle='#b0d8e9';ctx.fillText('PRZEKRÓJ POLARNY',cx,H-16);
  ctx.textAlign='left';ctx.fillStyle='#75e7d7';ctx.fillText('ergosfera',cx-42,27);
  ctx.fillStyle='#efb1c0';ctx.fillText('horyzont',cx-42,42);
  const x0=W*.50,x1=W*.96,y0=H*.48,unit=(x1-x0)/10;
  ctx.fillStyle='#b9d4e7';ctx.font='12px system-ui';
  ctx.fillText('PROMIENIE NA RÓWNIKU',x0,25);
  ctx.lineWidth=2;ctx.strokeStyle='#6682a2';
  ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y0);ctx.stroke();
  for(let x=0;x<=10;x+=2){
   const xx=x0+x*unit;ctx.strokeStyle='#385b70';
   ctx.beginPath();ctx.moveTo(xx,y0-5);ctx.lineTo(xx,y0+5);ctx.stroke();
   ctx.fillStyle='#7e9db5';ctx.font='10px system-ui';ctx.fillText(x+'',xx-3,y0+19);
  }
  for(const [radius,colour,label,offset] of [
   [h,'#f1a4b7','r₊',-29],
   [2,'#80ebd4','rₑ',-62],
   [core.isco(spin,1),'#f3cd8d','ISCO +φ',37],
   [core.isco(spin,-1),'#a9a7f4','ISCO −φ',64]]){
    const xx=x0+unit*radius;
    ctx.strokeStyle=colour;ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(xx,y0-7);ctx.lineTo(xx,y0+7);ctx.stroke();
    ctx.fillStyle=colour;ctx.font='11px system-ui';ctx.textAlign='center';
    ctx.fillText(label,xx,y0+offset);
  }
  ctx.fillStyle='#91a9be';ctx.font='9px system-ui';ctx.textAlign='center';
  ctx.fillText('r/r_g (nie odległość własna)',(x0+x1)/2,H-12);
 }
 let cache=null;
 function kerrRays(){
  const key=spin.toFixed(3)+(chosen?.lambda??'');
  if(cache?.key===key)return cache.rays;
  const phiDirections=[-.28,-.22,-.17,.17,.22,.28];
  const rays=phiDirections.map(t=>{
   const ray=core.trace(spin,32,Math.PI/2,-Math.sqrt(1-t*t),0,t,{steps:850});
   return {ray,color:t<0?'#f5aa7f':'#89f1dc',weight:Math.abs(t)===.17?2.5:1.6};
  });
  if(chosen)rays.push({ray:chosen.ray,color:'#fff3ca',weight:2.5});
  cache={key,rays};return rays;
 }
 function drawRays(canvas,state){
  if(!active())return false;
  const ctx=canvas.getContext('2d'),W=canvas.width,H=canvas.height;
  ctx.fillStyle='#071324';ctx.fillRect(0,0,W,H);
  const cx=W*.46,cy=H*.51,scale=Math.min(W/78,H/51);
  const at=(x,y)=>[cx+x*scale,cy-y*scale];
  ctx.strokeStyle='#284057';ctx.lineWidth=.7;
  for(let q=-40;q<=40;q+=10){
   let [x]=at(q,0);ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();
   let [,y]=at(0,q);ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();
  }
  const rp=core.horizons(spin).outer;
  ctx.beginPath();ctx.arc(cx,cy,2*scale,0,7);
  ctx.strokeStyle='#8fe9d8';ctx.setLineDash([4,5]);ctx.lineWidth=1.4;ctx.stroke();ctx.setLineDash([]);
  ctx.beginPath();ctx.arc(cx,cy,rp*scale,0,7);
  ctx.fillStyle='#02050b';ctx.fill();ctx.strokeStyle='#f39bad';ctx.lineWidth=2;ctx.stroke();
  const frac=Math.min(1,Math.max(0,state.rayProgress));
  ctx.save();ctx.beginPath();ctx.rect(0,0,W,H);ctx.clip();
  for(const item of kerrRays()){
   const path=item.ray.path;
   if(path.length<2)continue;
   const end=Math.min(path.length,Math.max(2,Math.round(path.length*frac)));
   ctx.beginPath();ctx.strokeStyle=item.color;ctx.lineWidth=item.weight;
   for(let i=0;i<end;i++){
    const [r,theta,phi]=path[i];
    const [x,y]=at(r*Math.sin(theta)*Math.cos(phi),
                    r*Math.sin(theta)*Math.sin(phi));
    if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
   }
   ctx.stroke();
  }
  ctx.restore();
  ctx.textAlign='left';ctx.font='11px system-ui';ctx.fillStyle='#f6b78b';
  ctx.fillText('◀ przeciwbieżne (−φ)',12,18);
  ctx.fillStyle='#86eed8';ctx.fillText('▶ współbieżne (+φ)',12,34);
  ctx.textAlign='right';ctx.fillStyle='#93b2ca';
  ctx.fillText('Rzut na równik · promienie z r = 32 r_g · Kerr',W-10,H-10);
  return true;
 }
 function inspect(event,canvas,state){
  if(!active())return false;
  const rect=canvas.getBoundingClientRect();
  const cx=(event.clientX-rect.left-rect.width*.5)/rect.height;
  const cy=(rect.height*.5-(event.clientY-rect.top))/rect.height;
  const tangent=2*Math.tan(state.fov*DEG*.5);
  const sx=cx*tangent,sy=cy*tangent,ang=state.roll*DEG;
  const xx=Math.cos(ang)*sx-Math.sin(ang)*sy;
  const yy=Math.sin(ang)*sx+Math.cos(ang)*sy;
  const norm=Math.hypot(1,xx,yy),n=[-1/norm,-yy/norm,xx/norm];
  try{
   const ray=core.trace(spin,state.distance,state.inclination*DEG,...n,{steps:1050});
   const p=ray.constants;
   const label='λ=Lz/E = '+fmt(p.lambda,3)+
    ' r_g, η=Q/E² = '+fmt(p.eta,3)+
    ' r_g². Wynik: '+(ray.status==='captured'?'wchodzi pod horyzont':
     ray.status==='escaped'?'ucieka do tła':'wielokrotnie okrąża obszar fotonowy')+
    '. Najmniejszy promień '+fmt(ray.minimumRadius??state.distance,2)+' r_g.';
   chosen={ray,lambda:p.lambda,label};cache=null;
   $('bh20Status').textContent='FOTON KERRA / '+label;
   drawRays($('bh20Rays'),state);
  }catch(error){
   $('bh20Status').textContent='Nie udało się prześledzić wybranego promienia: '+error.message;
  }
  return true;
 }
 function bind(){
  $('bh201Spin').addEventListener('input',e=>change(Number(e.target.value)/100));
  for(const btn of root.document.querySelectorAll('[data-bh201-spin]'))
   btn.addEventListener('click',()=>change(Number(btn.dataset.bh201Spin)/100));
  const dialog=$('bh20Dialog');
  dialog.addEventListener('close',()=>{chosen=null;cache=null;});
  spinUI();drawGeometry();
  root.ATLAS_KERR201=Object.freeze({
   active,render,updateStats,drawRays,inspect,
   getSpin:()=>spin,setSpin:change,
   getState:()=>({spin,renderReady:!!renderer,renderFailure,chosen:chosen?.label||null})
  });
 }
 bind();
}
if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',init);
else init();
})(window);
