/**
 * ATLAS SOLARIS 18.1 — constellation figures and Messier deep-sky planner.
 * Figure lines are conventional, not official IAU constellation borders.
 * Coordinates are static J2000; drawing follows the atlas's existing horizon.
 */
(function(root){
'use strict';
const $=id=>document.getElementById(id);
const JD_TO_DATE=jd=>new Date((jd-2440587.5)*86400000);
const fmt=jd=>JD_TO_DATE(jd).toISOString().slice(0,16).replace('T',' ')+' UTC';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function init(){
 const catalog=root.ATLAS_OBS181_CATALOG,core=root.ATLAS_OBS181_CORE,
  api=root.ATLAS_MAIN_API,dlg=$('observatoryDialog');
 if(!catalog||!core||!api||!dlg||!$('obs181Scan'))return;
 let category='all',last=null,queryToken=0,viewKey='';
 const figList=catalog.constellations,objects=catalog.messier;
 const see=id=>$(id)?.checked??false;
 function isCurrent(token){return token===queryToken&&dlg.open;}
 function categories(){
  for(const b of document.querySelectorAll('[data-obs181]')){
   const chosen=b.dataset.obs181===category;
   b.classList.toggle('active',chosen);
   b.setAttribute('aria-pressed',chosen?'true':'false');
   b.onclick=()=>{
    category=b.dataset.obs181;
    categories();
    root.ATLAS_OBSERVATORY18?.refreshTargets?.();
   };
  }
 }
 function centPoint(path){
  if(!path?.length)return null;
  // Mean sky direction, not an arithmetic average of RAs across 0°.
  let x=0,y=0,z=0;
  for(const [ra,dec] of path){
   const a=ra*Math.PI/180,d=dec*Math.PI/180,c=Math.cos(d);
   x+=c*Math.cos(a);y+=c*Math.sin(a);z+=Math.sin(d);
  }
  const r=Math.hypot(x,y,z);if(!r)return null;
  return {ra:(Math.atan2(y,x)*180/Math.PI+360)%360,
   dec:Math.asin(z/r)*180/Math.PI};
 }
 function drawSkyOverlay({ctx,projectJ2000,obsPolar,cx,cy,R}){
  const locations=[];
  const project=(ra,dec)=>{
   const hp=projectJ2000(ra,dec);
   if(hp.altitude<0)return null;
   const q=obsPolar(hp.altitude,hp.azimuth,R,cx,cy);
   return {...q,altitude:hp.altitude};
  };
  if(see('obs181Figures')){
   ctx.save();ctx.lineWidth=1.15;ctx.strokeStyle='rgba(92,181,206,.62)';
   for(const figure of figList){
    for(const line of figure.lines){
     let last=null;ctx.beginPath();
     for(const [ra,dec] of line){
      const q=project(ra,dec);
      if(!q){last=null;continue;}
      if(last&&Math.hypot(q.x-last.x,q.y-last.y)<R*.85){
       ctx.moveTo(last.x,last.y);ctx.lineTo(q.x,q.y);
      }
      last=q;
     }
     ctx.stroke();
    }
   }
   ctx.restore();
  }
  if(see('obs181Names')){
   ctx.save();ctx.font='10px system-ui';ctx.textAlign='center';
   ctx.fillStyle='rgba(158,212,227,.80)';
   for(const figure of figList){
    if((figure.rank||3)>2)continue; // less label clutter on small sky map
    const c=centPoint(figure.lines.flat());
    if(!c)continue;
    const q=project(c.ra,c.dec);
    if(q?.altitude>12){
     ctx.fillText(figure.name,q.x,q.y);
    }
   }
   ctx.restore();
  }
  if(see('obs181MessierMap')){
   ctx.save();
   for(const obj of objects){
    // Show each Messier object above the horizon; fainter entries use smaller markers.
    const q=project(obj.ra,obj.dec);
    if(!q)continue;
    locations.push({id:obj.id,x:q.x,y:q.y});
    const r=obj.mag!==null&&obj.mag<5?3.5:2;
    ctx.strokeStyle='rgba(110,236,204,.85)';ctx.lineWidth=.9;
    ctx.beginPath();ctx.arc(q.x,q.y,r,0,Math.PI*2);ctx.stroke();
    if(['M31','M42','M45','M13','M57','M44'].includes(obj.id)){
     ctx.font='10px system-ui';ctx.fillStyle='#adf0de';
     ctx.textAlign='left';ctx.fillText(obj.id,q.x+5,q.y-5);
    }
   }
   ctx.restore();
  }
  return locations;
 }
 function clearNights(info){
  ++queryToken;
  $('obs181Nights').replaceChildren();
  $('obs181ScanStatus').textContent=info;
  $('obs181Scan').disabled=false;
 }
 function showDetails(item){
  if(!item){$('obs181ObjectName').textContent='Wybierz obiekt';
   $('obs181ObjectData').textContent='Brak celu.';return;}
  $('obs181ObjectName').textContent=(item.kind==='dso'?item.id+' · ':'')+item.name;
  const data=$('obs181ObjectData');
  if(item.kind==='dso'){
   const ra=item.ra/15,h=Math.floor(ra),m=Math.floor((ra-h)*60);
   data.textContent=[core.typeNames[item.type]||'Obiekt głębokiego nieba',
    item.ngc||'', 'RA '+String(h).padStart(2,'0')+'h '+String(m).padStart(2,'0')+'m',
    'Dec '+item.dec.toFixed(2)+'°',
    item.mag===null?'Jasność nieznana':'Jasność '+item.mag.toFixed(1)+' mag',
    item.dim?'Wymiary '+item.dim+'′':''].filter(Boolean).join(' · ');
  }else if(item.kind==='star'){
   data.textContent='Gwiazda HYG · J2000 · '+(item.mag?.toFixed(1)??'—')+
    ' mag · RA '+(item.ra/15).toFixed(2)+' h · Dec '+item.dec.toFixed(2)+'°';
  }else data.textContent='Obiekt Układu Słonecznego · pozycja topocentryczna';
 }
 function onPlannerDraw({site,snapshot,plan,selected,selectTarget,setTime}){
  if(!dlg.open)return;
  last={site,snapshot,plan,selected,selectTarget,setTime};
  const target=snapshot.targets.find(t=>t.id===selected);
  showDetails(target);
  const k=[site.world,site.lat.toFixed(3),site.lon.toFixed(3),selected].join(':');
  if(viewKey!==k){viewKey=k;clearNights(site.world==='earth'?
   'Wybierz „Znajdź pięć najlepszych nocy”, aby zbadać kolejne 30 dni.':
   'Wyszukiwanie najlepszej nocy jest dostępne dla obserwatorów na Ziemi.');}
  $('obs181Scan').disabled=site.world!=='earth';
 }
 function renderNights(nights){
  const target=$('obs181Nights');target.replaceChildren();
  if(!nights.length){
   $('obs181ScanStatus').textContent='W nadchodzących 30 dniach nie znaleziono chwili, gdy obiekt znajduje się powyżej 20°, a Słońce poniżej −18°. Możesz wybrać późniejszy miesiąc lub inną lokalizację.';
   return;
  }
  $('obs181ScanStatus').textContent='Znaleziono '+nights.length+
   ' nocy z warunkami geometrycznymi; pokazuję pięć najwyżej ocenionych.';
  for(const night of nights.slice(0,5)){
   const btn=document.createElement('button');btn.className='obs181-night-row';btn.type='button';
   const main=document.createElement('span');main.className='obs181-night-main';
   const strong=document.createElement('strong');strong.textContent=fmt(night.best.jd);
   const small=document.createElement('small');small.textContent='Wysokość '+night.best.altitude.toFixed(1)+'° · Słońce '+night.best.sunAltitude.toFixed(1)+'°';
   main.append(strong,small);
   const moon=document.createElement('span');moon.className='obs181-night-moon';
   moon.textContent='☾ '+Math.round((night.best.moonIllumination||0)*100)+'%'+
    (night.best.moonAltitude>0?' · nad horyzontem':' · pod horyzontem');
   btn.append(main,moon);
   btn.onclick=()=>{
    if(!last)return;
    last.setTime(night.best.jd,true);
   };
   target.append(btn);
  }
 }
 async function scan(){
  if(!last||last.site.world!=='earth'||!last.selected)return;
  const {site,selected}=last;
  const token=++queryToken;
  const startNoon=Math.floor(api.getJD()+site.lon/360)-site.lon/360;
  const results=[];
  $('obs181Nights').replaceChildren();
  $('obs181Scan').disabled=true;
  $('obs181ScanStatus').textContent='Obliczanie 30 nocy — 0/30…';
  for(let i=0;i<30;i++){
   if(!isCurrent(token))return;
   try{
    const night=core.scanNight({
     startJD:startNoon+i,stepHours:1,
     sample:jd=>api.observatoryTargetSnapshot(jd,site.lat,site.lon,selected)
    });
    results.push(night);
   }catch(err){
    console.error('ATLAS SOLARIS 18.1 night scan',err);
    $('obs181ScanStatus').textContent='Nie udało się obliczyć nocy: '+String(err.message||err);
    $('obs181Scan').disabled=false;return;
   }
   if(i%2===0||i===29){
    $('obs181ScanStatus').textContent='Obliczanie 30 nocy — '+(i+1)+'/30…';
    await new Promise(resolve=>requestAnimationFrame(resolve));
   }
  }
  if(!isCurrent(token))return;
  $('obs181Scan').disabled=false;
  renderNights(core.rankNights(results));
 }
 $('obs181Scan').addEventListener('click',scan);
 for(const id of ['obs181Figures','obs181Names','obs181MessierMap']){
  $(id).addEventListener('change',()=>api.redrawObservatory());
 }
 dlg.addEventListener('close',()=>{
  ++queryToken;
  $('obs181Scan').disabled=false;
  viewKey='';
 });
 categories();
 root.ATLAS_OBS181=Object.freeze({
  drawSkyOverlay,onPlannerDraw,category:()=>category
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
})(window);
