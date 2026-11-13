/**
 * ATLAS SOLARIS 17.2 — geographic eclipse display on the original Earth globe.
 * Light/penumbra are computed from a topocentric angular-overlap model.
 * The local inset is an explanatory spatial zoom, not a geodetic eclipse map.
 */
(function(root){
'use strict';
const $=id=>document.getElementById(id),DEG=Math.PI/180,RAD=180/Math.PI;
const pl=new Intl.DateTimeFormat('pl-PL',{timeZone:'UTC',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const wrap=lon=>((lon+180)%360+360)%360-180;
const label={none:'Brak zakrycia',partial:'Częściowe',total:'Całkowite',annular:'Obrączkowe'};
const time=jd=>new Date((jd-2440587.5)*86400000);
function start(){
 const api=root.ATLAS_MAIN_API,geo=root.ATLAS_ECLIPSE_GEO_MAP,dlg=$('globeDialog');
 if(!api||!geo||!dlg||!$('e17mCanvas'))return;
 const map=geo.createMap({getPositions:api.positions,getEarthAxes:api.earthAxes});
 const state={
   contours:null,contourJD:-Infinity,contourReal:0,
   center:null,centerJD:-Infinity,centerReal:0,
   track:null,trackKey:'',
   detailKey:'',detailReal:0, detailMap:null,
   lastObserverKey:'',lastContactsKey:''
 };
 $('openEclipseMap17Side')?.addEventListener('click',()=>{
  if(dlg.open)return;
  $('openGlobe')?.click();
 });
 const canvas=$('e17mCanvas'),inset=document.createElement('canvas');
 inset.width=200;inset.height=116;
 const imgCtx=inset.getContext('2d',{willReadFrequently:true});
 let mapBox=null;
 const yes=id=>$(id)?.checked??false;
 function refresh(){state.detailKey='';state.centerJD=-Infinity;state.contourJD=-Infinity;api.redrawGlobe();}
 function projectPath(ctx,project,series,stroke,width=1.5,dashed=false){
  ctx.save();ctx.beginPath();
  let p0=null;
  for(const p of series){
   if(!p){p0=null;continue;}
   const px=project(p.lat,p.lon);
   if(px&&p0&&Math.hypot(px.x-p0.x,px.y-p0.y)<90){
    ctx.moveTo(p0.x,p0.y);ctx.lineTo(px.x,px.y);
   }
   p0=px;
  }
  ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.setLineDash(dashed?[5,6]:[]);ctx.stroke();ctx.restore();
 }
 function projectSegments(ctx,project,segments,color,width=1){
  ctx.save();ctx.beginPath();
  for(const [a,b] of segments){
   const aa=project(a.lat,a.lon),bb=project(b.lat,b.lon);
   if(!aa||!bb||Math.hypot(bb.x-aa.x,bb.y-aa.y)>75)continue;
   ctx.moveTo(aa.x,aa.y);ctx.lineTo(bb.x,bb.y);
  }
  ctx.lineWidth=width;ctx.strokeStyle=color;ctx.stroke();ctx.restore();
 }
 function drawRing(ctx,project,points,color,width=1.8){
  if(!points||points.length<3)return;
  const ordered=points.concat([points[0]]);
  projectPath(ctx,project,ordered,color,width);
 }
 function getGlobalContours(jd){
  const now=performance.now();
  if(!state.contours||((Math.abs(jd-state.contourJD)>1/1440)&&(now-state.contourReal>550))){
   state.contours=map.contours(jd,{stepDeg:3,levels:[.001,.5]});
   state.contourJD=jd;state.contourReal=now;
  }
  return state.contours;
 }
 function getCentral(jd){
  const now=performance.now();
  if(state.centerJD===-Infinity||((Math.abs(jd-state.centerJD)>1/1440)&&(now-state.centerReal>400))){
   state.center=map.centralBoundary(jd,160);
   state.centerJD=jd;state.centerReal=now;
  }
  return state.center;
 }
 function getTrack(event){
  const key=event.id+'@'+event.date;
  if(!state.track||state.trackKey!==key){
   const peak=Date.parse(event.date)/86400000+2440587.5;
   state.track=map.centralTrack(peak,{minutes:180,stepMinutes:3});
   state.trackKey=key;
  }
  return state.track;
 }
 function viewCenter(jd,observer){
  const mode=$('e17mFocus').value;
  if(mode==='observer')return {lat:observer.lat,lon:observer.lon,source:'obserwator'};
  const a=map.axisPoint(jd);
  if(a)return {...a,source:'oś cienia'};
  const snapshot=map.moment(jd);
  const m=snapshot.moon,s=snapshot.sun;
  const v=[m[0]-s[0],m[1]-s[1],m[2]-s[2]],n=Math.hypot(...v);
  const u=v.map(x=>x/n),d=u.reduce((r,x,i)=>r+x*m[i],0),offset=m.map((x,i)=>x-u[i]*d);
  const len=Math.hypot(...offset);
  if(len>1e-3)return {lat:Math.asin(clamp(offset[2]/len,-1,1))*RAD,
    lon:wrap(Math.atan2(offset[1],offset[0])*RAD),source:'okolice brzegu cienia'};
  return {lat:Math.asin(clamp(s[2]/Math.hypot(...s),-1,1))*RAD,
    lon:wrap(Math.atan2(s[1],s[0])*RAD),source:'strona dzienna'};
 }
 function drawDetail(jd,observer,texture,evt,force=false){
  const z=Number($('e17mZoom').value)||12;
  const focal=viewCenter(jd,observer);
  const w=canvas.clientWidth||350,h=canvas.clientHeight||220;
  const latWidth=z,lonWidth=Math.min(359,z*(w/h)/Math.max(.25,Math.cos(focal.lat*DEG)));
  const key=[evt.id,Math.round(jd*1440),z,$('e17mFocus').value,
    Math.round(focal.lat*100)/100,Math.round(focal.lon*100)/100].join('/');
  const now=performance.now();
  if(!force&&state.detailKey===key)return;
  if(!force&&state.detailKey&&now-state.detailReal<500)return;
  state.detailKey=key;state.detailReal=now;
  const ww=inset.width,hh=inset.height,snap=map.moment(jd);
  const image=imgCtx.createImageData(ww,hh),out=image.data;
  for(let y=0;y<hh;y++){
   const lat=clamp(focal.lat+(0.5-(y+.5)/hh)*latWidth,-90,90);
   for(let x=0;x<ww;x++){
    const lon=wrap(focal.lon+((x+.5)/ww-.5)*lonWidth);
    const p=map.atGeo(snap,lat,lon),idx=(y*ww+x)*4;
    let rr=24,gg=62,bb=85;
    if(texture&&texture.rgba){
     const tx=clamp(Math.floor((lon/360+.5)*texture.w),0,texture.w-1);
     const ty=clamp(Math.floor((.5-lat/180)*texture.h),0,texture.h-1);
     const k=(ty*texture.w+tx)*4;
     rr=texture.rgba[k];gg=texture.rgba[k+1];bb=texture.rgba[k+2];
    }
    const sun=p.altitudeDeg>0?1:.26;
    let shade=p.coverageFraction;
    let f=.53*sun*(1-.86*shade);
    out[idx]=clamp(rr*f+12+10*shade,0,255);
    out[idx+1]=clamp(gg*f+24+35*shade,0,255);
    out[idx+2]=clamp(bb*f+34+46*shade,0,255);
    if(p.central){out[idx]=25;out[idx+1]=82;out[idx+2]=93;}
    out[idx+3]=255;
   }
  }
  imgCtx.putImageData(image,0,0);
  const dpr=Math.min(2,devicePixelRatio||1),W=canvas.clientWidth||350,H=canvas.clientHeight||220;
  canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);
  const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.imageSmoothingEnabled=true;ctx.drawImage(inset,0,0,W,H);
  // The inset is a local lon-lat map, with a longitude scaling corrected at center latitude.
  const project=(lat,lon)=>{
   const dx=wrap(lon-focal.lon);
   const x=W*(.5+dx/lonWidth),y=H*(.5-(lat-focal.lat)/latWidth);
   if(x < -50||x>W+50||y< -50||y>H+50)return null;
   return {x,y};
  };
  ctx.strokeStyle='rgba(197,227,236,.20)';ctx.lineWidth=.75;
  const span=Math.max(1,Math.ceil(z/4));
  for(let lat=Math.ceil((focal.lat-z/2)/span)*span;lat<=focal.lat+z/2;lat+=span){
   const y=H*(.5-(lat-focal.lat)/latWidth);
   ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();
  }
  const central=map.centralBoundary(jd,144);
  if(central)drawRing(ctx,project,central.points,'rgba(100,240,213,.98)',2);
  if(yes('e17mShowPath')){
   const path=getTrack(evt);
   projectPath(ctx,project,path.center,'rgba(233,243,247,.7)',1.4,true);
  }
  const axis=map.axisPoint(jd);
  if(axis){
   const p=project(axis.lat,axis.lon);
   if(p){ctx.strokeStyle='#e9fdff';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(p.x-7,p.y);ctx.lineTo(p.x+7,p.y);ctx.moveTo(p.x,p.y-7);ctx.lineTo(p.x,p.y+7);ctx.stroke();}
  }
  const observerPixel=project(observer.lat,observer.lon);
  if(observerPixel){
   ctx.fillStyle='#75e9e3';ctx.beginPath();ctx.arc(observerPixel.x,observerPixel.y,4.3,0,7);ctx.fill();
   ctx.strokeStyle='#05262e';ctx.lineWidth=1.5;ctx.stroke();
  }
  ctx.fillStyle='rgba(4,15,28,.76)';ctx.fillRect(0,H-28,W,28);
  ctx.fillStyle='#cae9f3';ctx.font='11px system-ui';ctx.textAlign='left';
  ctx.fillText(focal.lat.toFixed(2)+'° / '+focal.lon.toFixed(2)+'° · '+z+'° szer. kadru',10,H-10);
  mapBox={focal,latWidth,lonWidth,w:W,h:H,jd};
  $('e17mDetailLabel').textContent='Środek: '+focal.source+' · zakres '+z+'°';
 }
 function readObserver(jd,obs,solar){
  if(!solar){
   $('e17mLocalStatus').textContent='Zaćmienie Księżyca — nie tworzy pasa cienia na Ziemi';
   $('e17mMapSummary').textContent='Dla zaćmienia Księżyca użyj istniejącego widoku widoczności na globie.';
   $('e17mCanvas').classList.add('e17m-not-solar');
   return;
  }
  $('e17mCanvas').classList.remove('e17m-not-solar');
  const v=map.local(jd,obs.lat,obs.lon);
  $('e17mLocalStatus').textContent=label[v.visibleKind]+' · '+(v.coverageFraction*100).toFixed(2)+'% zakrycia Słońca';
  $('e17mMapSummary').textContent=
   v.altitudeDeg>0?'Słońce '+v.altitudeDeg.toFixed(1)+'° nad horyzontem. '+(v.central?'Obserwator leży w wąskim pasie centralnym.':'Obserwator poza pasem centralnym.'):'Słońce pod geometrycznym horyzontem — zaćmienie nie jest teraz widoczne.';
  const key=[obs.lat.toFixed(2),obs.lon.toFixed(2),eventKey(),Math.round(jd*24*60)].join('/');
  if(state.lastObserverKey!==key){
   state.lastObserverKey=key;
   if(state.lastContactsKey!==''){
    $('e17mContactsOutput').textContent='Zmieniłeś miejsce lub czas. Oblicz ponownie kontakty dla tego punktu.';
    state.lastContactsKey='';
   }
  }
 }
 function eventKey(){
  const id=$('globeEvent')?.value||'';
  return id;
 }
 function drawGlobeFrame({ctx,jd,solar,project,texture,observer,event,trackEnabled}){
  if(!dlg.open)return;
  readObserver(jd,observer,solar);
  $('e17mContactButton').disabled=!solar;
  if(!solar){
   const C=canvas.getContext('2d');canvas.width=canvas.clientWidth||350;canvas.height=canvas.clientHeight||220;
   C.fillStyle='#0b2035';C.fillRect(0,0,canvas.width,canvas.height);
   C.fillStyle='#b6d5e3';C.font='12px system-ui';C.textAlign='center';
   C.fillText('Zaćmienie Księżyca — mapa stref Słońca jest ukryta',canvas.width/2,canvas.height/2);
   return;
  }
  if(trackEnabled&&yes('e17mShowPath')){
   const track=getTrack(event);
   projectPath(ctx,project,track.left,'rgba(98,221,217,.7)',1.35);
   projectPath(ctx,project,track.right,'rgba(98,221,217,.7)',1.35);
   projectPath(ctx,project,track.center,'rgba(233,246,255,.8)',1.45,true);
  }
  if(yes('e17mShowPartial')||yes('e17mShowHalf')){
   const groups=getGlobalContours(jd);
   if(yes('e17mShowPartial'))projectSegments(ctx,project,groups['0.001']||[],'rgba(113,185,243,.82)',1.1);
   if(yes('e17mShowHalf'))projectSegments(ctx,project,groups['0.5']||[],'rgba(145,224,235,.84)',1.25);
  }
  if(yes('e17mShowCentral')){
   const center=getCentral(jd);
   if(center)drawRing(ctx,project,center.points,'rgba(112,249,214,.99)',2.3);
  }
  drawDetail(jd,observer,texture,event);
 }
 function fmtContact(jd){return pl.format(time(jd))+' UTC';}
 function drawContacts(result,coords){
  const target=$('e17mContactsOutput');target.replaceChildren();
  if(result.kind==='none'){
   target.textContent='Nie wykryto lokalnego geometrycznego zakrycia tarczy Słońca w oknie ±5 godzin wokół wybranego zdarzenia.';
   return;
  }
  const p=document.createElement('p');p.className='e17m-contact-summary';
  p.textContent='Maksimum: '+fmtContact(result.maximum.jd)+' · '+label[result.kind]+' · '+(result.maximum.coverageFraction*100).toFixed(2)+'% · wysokość Słońca '+result.maximum.sunAltitudeDeg.toFixed(1)+'°';
  target.append(p);
  if(!result.maximum.visible){
   const w=document.createElement('p');w.className='e17m-warning';w.textContent='W chwili maksimum Słońce jest pod horyzontem w tym miejscu.';target.append(w);
  }
  const dl=document.createElement('dl');dl.className='e17m-contact-list';
  for(const c of result.contacts){
   const dt=document.createElement('dt');dt.textContent=c.label;
   const dd=document.createElement('dd');dd.textContent=fmtContact(c.jd)+(c.sunAboveHorizon?'':' · pod horyzontem');
   dl.append(dt,dd);
  }
  target.append(dl);
  if(result.contacts.length<2){
   const w=document.createElement('p');w.className='e17m-warning';
   w.textContent='Niepełna sekwencja kontaktów w zadanym oknie czasowym.';target.append(w);
  }
  const foot=document.createElement('p');foot.className='e17m-contacts-foot';
  foot.textContent='C1/C4 — początek/koniec częściowego zakrycia, C2/C3 — granice fazy centralnej. Wyniki poglądowe, bez profilu brzegu Księżyca i refrakcji.';target.append(foot);
 }
 $('e17mContactButton').addEventListener('click',()=>{
  const jd=api.getJD(),e=$('globeEvent').value;
  const observer={lat:Number($('globeLat').value),lon:Number($('globeLon').value)};
  if(!Number.isFinite(observer.lat)||!Number.isFinite(observer.lon))return;
  // Use the actual selected eclipse's stored maximum, never reconstruct it
  // from a clamped UI slider or an arbitrary frame.
  const reference=api.getSelectedEclipse();
  const peakJD=Date.parse(reference.date)/86400000+2440587.5;
  const result=map.contacts(peakJD,observer.lat,observer.lon);
  state.lastContactsKey=eventKey();
  drawContacts(result,observer);
 });
 for(const id of ['e17mShowPartial','e17mShowHalf','e17mShowCentral','e17mShowPath','e17mZoom','e17mFocus']){
  $(id).addEventListener('change',refresh);
 }
 canvas.addEventListener('pointerdown',e=>{
  if(!mapBox||!dlg.open||!$('e17mCanvas')||$('e17mCanvas').classList.contains('e17m-not-solar'))return;
  const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;
  if(x<0||x>1||y<0||y>1)return;
  const lat=clamp(mapBox.focal.lat+(0.5-y)*mapBox.latWidth,-90,90);
  const lon=wrap(mapBox.focal.lon+(x-.5)*mapBox.lonWidth);
  api.setGlobeObserver(lat,lon);
 });
 root.ATLAS_ECLIPSE_MAP17_2=Object.freeze({drawGlobeFrame,model:map});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);
else start();
})(window);
