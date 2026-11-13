/**
 * ATLAS SOLARIS 17.3 — animated ground-track replay for solar eclipses.
 * Reuses the 17.2 orthographic Earth globe and its numerical central track.
 */
(function(root){
'use strict';
const $=id=>document.getElementById(id);
const motion=root.ATLAS_ECLIPSE_SHADOW_MOTION;
const earth=()=>root.ATLAS_ECLIPSE_MAP17_2?.model;
const api=()=>root.ATLAS_MAIN_API;
const time=jd=>new Date((jd-2440587.5)*86400000).toISOString().slice(11,19)+' UTC';
const km=n=>Math.round(n).toLocaleString('pl-PL')+' km';
const speed=n=>Math.round(n).toLocaleString('pl-PL')+' km/h';
const compass=d=>['N','NE','E','SE','S','SW','W','NW'][Math.round(d/45)%8];
const DEG=Math.PI/180;
function init(){
 if(!motion||!$('globeDialog')||!$('e17sStart'))return;
 const dlg=$('globeDialog'),slider=$('e17sSlider');
 let stored=null,key='',sceneIsSolar=true,locked=false,lastRecalc=0;
 const els=['e17sStart','e17sPause','e17sSlider'];
 const set=(id,value)=>{const e=$(id);if(e)e.textContent=value;};
 const enabled=yes=>{for(const id of els)$(id).disabled=!yes;};
 const shown=id=>$(id)?.checked??true;
 function getPrepared(event,track){
  if(!track||!event||event.kind!=='solar')return null;
  const tag=event.id+'@'+event.date;
  if(key!==tag||!stored){
   key=tag;stored=motion.prepare(track);
   if(!stored.first||!stored.last){enabled(false);}
   else{
    enabled(true);
    set('e17sStartUTC',time(stored.first.jd));
    set('e17sEndUTC',time(stored.last.jd));
   }
  }
  return stored;
 }
 function line(ctx,project,array,color,width,dashed=false,glow=0){
  ctx.save();ctx.beginPath();
  let previous=null;
  for(const point of array){
   if(!point){previous=null;continue;}
   const current=project(point.lat,point.lon);
   if(previous&&current&&Math.hypot(previous.x-current.x,previous.y-current.y)<110){
    ctx.moveTo(previous.x,previous.y);ctx.lineTo(current.x,current.y);
   }
   previous=current;
  }
  ctx.strokeStyle=color;ctx.lineWidth=width;
  if(dashed)ctx.setLineDash([4,6]);
  if(glow){ctx.shadowColor=color;ctx.shadowBlur=glow;}
  ctx.stroke();ctx.restore();
 }
 function drawMarker(ctx,project,pt,bearing){
  const p=project(pt.lat,pt.lon);
  if(!p)return;
  const pulse=1.3+Math.sin(performance.now()*.007)*.7;
  ctx.save();
  ctx.strokeStyle='rgba(119,255,226,.55)';ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(p.x,p.y,10+pulse*2.2,0,Math.PI*2);ctx.stroke();
  ctx.shadowBlur=14;ctx.shadowColor='#63ffe3';ctx.fillStyle='#d7fff8';
  ctx.beginPath();ctx.arc(p.x,p.y,4.2,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  if(Number.isFinite(bearing)){
   // Project a direction that is locally tangent to the spherical Earth.
   const lat=Math.max(-89.5,Math.min(89.5,pt.lat+Math.cos(bearing*DEG)*1.2));
   const lon=pt.lon+Math.sin(bearing*DEG)*1.2/Math.max(.1,Math.cos(pt.lat*DEG));
   const ahead=project(lat,lon);
   if(ahead){
    const dx=ahead.x-p.x,dy=ahead.y-p.y,n=Math.hypot(dx,dy);
    if(n>.5){
     const ux=dx/n,uy=dy/n,cx=p.x+ux*24,cy=p.y+uy*24;
     ctx.fillStyle='#93ffe8';ctx.beginPath();
     ctx.moveTo(cx+ux*7,cy+uy*7);
     ctx.lineTo(cx-ux*5-uy*4,cy-uy*5+ux*4);
     ctx.lineTo(cx-ux*5+uy*4,cy-uy*5-ux*4);
     ctx.closePath();ctx.fill();
    }
   }
  }
  ctx.restore();
 }
 function resetForLunar(){
  if(!sceneIsSolar)return;
  sceneIsSolar=false;
  enabled(false);
  set('e17sStatus','Zaćmienie Księżyca — brak wędrówki cienia po powierzchni Ziemi.');
  set('e17sCurrentSpeed','—');set('e17sProgress','—');
  set('e17sTravel','—');set('e17sLocation','—');
  set('e17sStartUTC','—');set('e17sEndUTC','—');
 }
 function drawFrame({ctx,jd,solar,project,track,event,showTrack=true}){
  if(!solar){resetForLunar();return;}
  sceneIsSolar=true;
  const prepared=getPrepared(event,track);
  if(!prepared||!prepared.first){enabled(false);set('e17sStatus','To zaćmienie nie ma centralnego pasa cienia na Ziemi.');return;}
  const now=motion.evaluate(prepared,jd);
  if(showTrack){
   if(shown('e17sShowAhead'))line(ctx,project,now.future,'rgba(174,196,220,.66)',1.6,true);
   if(shown('e17sShowPast'))line(ctx,project,now.past,'rgba(116,247,218,.96)',2.5,false,5);
  }
  const exact=earth()?.axisPoint(jd)||null;
  if(exact){
   drawMarker(ctx,project,exact,now.bearingDeg);
   set('e17sLocation',exact.lat.toFixed(2)+'° / '+exact.lon.toFixed(2)+'°');
  }else{
   set('e17sLocation','Oś cienia poza Ziemią');
  }
  const msg=now.status==='before'?'Cień jeszcze nie wszedł w pas centralny.':
    now.status==='after'?'Przelot pasa centralnego zakończony.':
    now.status==='crossing'?'Cień przemieszcza się po powierzchni Ziemi.':
    'Oś cienia chwilowo nie przecina Ziemi.';
  set('e17sStatus',msg);
  set('e17sCurrentSpeed',Number.isFinite(now.velocityKmH)?speed(now.velocityKmH):'—');
  set('e17sTravel',km(now.completedKm)+' / '+km(now.totalKm));
  set('e17sProgress',now.progress.toFixed(1)+'%');
  if(document.activeElement!==slider){
   const span=prepared.last.jd-prepared.first.jd;
   const portion=span>0?(jd-prepared.first.jd)/span:0;
   slider.value=String(Math.round(1000*Math.max(0,Math.min(1,portion))));
  }
  if(api()?.getGlobePlaying()&&jd>=prepared.last.jd+1/1440&&!locked){
   locked=true;
   api().setGlobePlayback(false);
   locked=false;
  }
 }
 slider.addEventListener('input',()=>{
  if(!stored?.first)return;
  const f=Number(slider.value)/1000;
  const jd=stored.first.jd+(stored.last.jd-stored.first.jd)*f;
  api().setJD(jd);api().setGlobePlayback(false);
 });
 $('e17sStart').addEventListener('click',()=>{
  if(!stored?.first)return;
  api().startShadowFlight(stored.first.jd-1/1440,300);
 });
 $('e17sPause').addEventListener('click',()=>{
  const a=api();
  if(!stored?.first)return;
  const playing=a.getGlobePlaying();
  if(playing){a.setGlobePlayback(false);return;}
  const jd=a.getJD();
  if(jd>=stored.last.jd||jd<stored.first.jd-1/24)
   a.startShadowFlight(stored.first.jd-1/1440,300);
  else a.setGlobePlayback(true);
 });
 for(const id of ['e17sShowAhead','e17sShowPast']){
  $(id).addEventListener('change',()=>api().redrawGlobe());
 }
 dlg.addEventListener('close',()=>{locked=false;});
 root.ATLAS_ECLIPSE_SHADOW_FLIGHT=Object.freeze({drawFrame});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
})(window);
