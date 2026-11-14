/* ATLAS SOLARIS 25.0 — panoramic J2000 sky, two zodiac rings, geocentric planets.
   Works as a non-invasive module alongside the existing ATLAS_MAIN_API.
   Decorative faint background dust is not a star catalogue. */
(function(root){'use strict';
const C=root.ATLAS_ZODIAC25_CORE,doc=root.document,$=id=>doc.getElementById(id);
if(!C||!doc)return;
const DEG=Math.PI/180,TAU=2*Math.PI,clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const DATES={min:Date.UTC(2024,0,1),max:Date.UTC(2040,11,31,23,59,59)};
const STAR_ICONS={sun:'SŁOŃCE',moon:'KSIĘŻYC',mercury:'MERKURY',venus:'WENUS',mars:'MARS',jupiter:'JOWISZ',saturn:'SATURN',uranus:'URAN',neptune:'NEPTUN'};
const PLANET_COLORS={moon:'#dce4f3',mercury:'#b6b8c3',venus:'#f1d6b5',mars:'#e3a58a',jupiter:'#e4d0bc',saturn:'#d8cdb9',uranus:'#8cddf4',neptune:'#8fa8fa'};
const FIG_IDS=new Set(C.CATALOG.map(c=>c.id));
const dateFormat=new Intl.DateTimeFormat('pl-PL',{timeZone:'UTC',day:'numeric',month:'long',year:'numeric'});
const fmt=(v,d=1)=>Number(v).toLocaleString('pl-PL',{minimumFractionDigits:d,maximumFractionDigits:d});
const dlon=(a,b)=>((a-b+540)%360)-180;
const dateISO=d=>d.toISOString().slice(0,10);
const yearStart=y=>Date.UTC(y,0,1);
const yearDays=y=>(yearStart(y+1)-yearStart(y))/86400000;
const validDate=d=>new Date(clamp(d.getTime(),DATES.min,DATES.max));
function namedStars(){const rows=root.ATLAS_STARS||[];return rows.map((r,i)=>{
 const p=C.eclipticFromEq(r[0]/100,r[1]/100);
 return {...p,mag:r[2]/10,name:r[4]||null,index:i};
 });}
function figData(){const figures=root.ATLAS_OBS181_CATALOG?.constellations||[];
 return figures.filter(f=>FIG_IDS.has(f.id)).map(f=>({
  id:f.id,lines:(f.lines||[]).map(line=>line.map(([ra,dec])=>C.eclipticFromEq(ra,dec)))
 }));}
function seededDust(){let seed=250049;const next=()=>((seed=Math.imul(1664525,seed)+1013904223>>>0)/4294967296);
 return Array.from({length:540},()=>({lon:next()*360,lat:next()*150-75,mag:next(),r:next()*.8+.15}));}
function canvasInfo(canvas,limit=1650){const rect=canvas.getBoundingClientRect();if(rect.width<2||rect.height<2)return null;
 const dpr=Math.min(2,root.devicePixelRatio||1),s=Math.min(dpr,limit/rect.width);
 const w=Math.round(rect.width*s),h=Math.round(rect.height*s);
 if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
 const ctx=canvas.getContext('2d');if(!ctx)return null;
 ctx.setTransform(s,0,0,s,0,0);return {ctx,w:rect.width,h:rect.height};
}
function init(){
 const dialog=$('zodiac25Dialog'),sky=$('z25Sky'),wheel=$('z25Wheel');
 if(!dialog||!sky||!wheel||!$('z25Play'))return;
 const stars=namedStars(),figures=figData(),dust=seededDust();
 const state={date:validDate(new Date()),selected:null,center:0,fov:145,autoCenter:true,
  figures:true,playing:false,speed:10,raf:0,lastFrame:0,lastUI:-1,drag:null,skyPts:[],planetCache:[]};
 state.center=C.sunLongitude(state.date);state.selected=C.zone(state.center,state.date.getUTCFullYear()).id;
 let frames=0;
 function jd(){return C.julianDate(state.date);}
 function bodies(){
  try{
   const api=root.ATLAS_MAIN_API,body=api?.positions?.(jd());
   if(!body?.earth)return fallbackSun();
   const earth=body.earth;
   const list=[{id:'sun',v:earth.map(v=>-v)}];
   for(const id of ['moon','mercury','venus','mars','jupiter','saturn','uranus','neptune']){
    if(body[id])list.push({id,v:body[id].map((v,i)=>v-earth[i])});
   }
   return list.map(b=>({id:b.id,...C.eclipticFromVector(b.v)})).filter(p=>p.lon!=null);
  }catch(err){return fallbackSun();}
 }
 function fallbackSun(){return [{id:'sun',lon:C.mod(C.sunLongitude(state.date)-(state.date.getUTCFullYear()-2000)*50.29/3600),lat:0,distanceAU:1}];}
 function updateDate(next,opt={}){
  if(!(next instanceof Date)||!Number.isFinite(next.getTime()))return;
  state.date=validDate(next);
  const lam=C.sunLongitude(state.date),current=C.zone(lam,state.date.getUTCFullYear());
  state.selected=current.id;
  if(state.autoCenter||opt.center)state.center=C.mod(lam-(state.date.getUTCFullYear()-2000)*50.29/3600);
  updateStats();
 }
 function jumpTo(id){
  const date=C.nearMidDate(state.date.getUTCFullYear(),id);
  if(date){state.autoCenter=true;updateDate(date,{center:true});}
 }
 function updateStats(){
  const date=state.date,lam=C.sunLongitude(date),year=date.getUTCFullYear(),sector=C.zone(lam,year),sign=C.sign(lam);
  const coords=C.sunEquatorial(date),next=C.nextIngress(date);
  $('z25Constellation').textContent=sector.name;
  $('z25Sign').textContent=sign.name;
  $('z25SolarLongitude').textContent=fmt(lam,2)+'°';
  $('z25Declination').textContent=(coords.dec>=0?'+':'')+fmt(coords.dec,2)+'°';
  $('z25DatePretty').textContent=dateFormat.format(date)+' · UTC';
  $('z25FactName').textContent=sector.symbol+' '+sector.name+' / '+sector.latin;
  $('z25FactText').textContent=sector.fact;
  $('z25FactLabel').textContent=sector.id==='Oph'?'WYJĄTKOWY TRZYNASTY GWIAZDOZBIÓR':'GWIAZDOZBIÓR NA TRASIE SŁOŃCA';
  $('z25Width').textContent=fmt(sector.width,1)+'° / '+fmt(sector.width/360*365.24,1)+' dni';
  $('z25Next').textContent=next.next.name+' · około '+dateFormat.format(next.date);
  $('z25Date').value=dateISO(date);
  $('z25Day').max=String(yearDays(year)-1);
  $('z25Day').value=String(Math.floor((date.getTime()-yearStart(year))/86400000));
  for(const btn of $('z25ConstellationList').querySelectorAll('button')){
   const active=btn.dataset.constellation===sector.id;
   btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',String(active));
  }
 }
 function drawSky(){
  const ci=canvasInfo(sky,1850);if(!ci)return;const {ctx,w,h}=ci;
  ctx.clearRect(0,0,w,h);ctx.fillStyle='#020917';ctx.fillRect(0,0,w,h);
  const glow=ctx.createRadialGradient(w*.48,h*.5,h*.05,w*.48,h*.5,w*.65);
  glow.addColorStop(0,'#17284a');glow.addColorStop(.45,'#0a1834');glow.addColorStop(1,'#030814');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
  const centerY=h*.55,span=67;
  const X=lon=>w/2+dlon(lon,state.center)/state.fov*w;
  const Y=lat=>centerY-lat/span*h*.47;
  const inView=x=>x>-45&&x<w+45;
  // Background dust: decorative, deliberately subtler than the measured stars.
  for(const d of dust){const x=X(d.lon),y=Y(d.lat);if(!inView(x)||y<0||y>h)continue;
   ctx.fillStyle=`rgba(118,154,208,${(.08+d.mag*.16).toFixed(3)})`;
   ctx.fillRect(x,y,d.r,d.r);
  }
  const current=C.zone(C.sunLongitude(state.date),state.date.getUTCFullYear()),arr=C.sectors(state.date.getUTCFullYear());
  for(const sector of arr){
   const n=Math.max(1,Math.ceil(sector.width/2));
   const mid=C.mod(sector.start+sector.width/2-(state.date.getUTCFullYear()-2000)*50.29/3600);
   const p1=X(C.mod(mid-sector.width/2)),p2=X(C.mod(mid+sector.width/2));
   if(Math.abs(p2-p1)<w*.85){
    if(sector.id===current.id){ctx.fillStyle='rgba(87,168,240,.09)';ctx.fillRect(Math.min(p1,p2),h*.14,Math.abs(p2-p1),h*.74);}
    if(inView((p1+p2)/2)){
     ctx.fillStyle=sector.id===current.id?'rgba(206,235,255,.96)':'rgba(120,149,188,.58)';
     ctx.font=(sector.id===current.id?'600 ':'400 ')+`${Math.max(9,Math.min(12,w/105))}px system-ui`;
     ctx.textAlign='center';ctx.fillText(sector.name.toUpperCase(),(p1+p2)/2,h*.115);
    }
   }
  }
  // Grid lines: ecliptic longitude and ecliptic latitude (not RA / Dec).
  ctx.save();ctx.lineWidth=1;
  for(let lon=0;lon<360;lon+=15){let x=X(lon);if(!inView(x))continue;
   ctx.setLineDash([3,9]);ctx.strokeStyle='rgba(112,156,206,.13)';ctx.beginPath();ctx.moveTo(x,h*.17);ctx.lineTo(x,h*.89);ctx.stroke();
   ctx.fillStyle='rgba(126,176,209,.55)';ctx.font='10px system-ui';ctx.textAlign='center';ctx.fillText(lon+'°',x,h*.945);
  }
  ctx.setLineDash([]);
  for(const lat of [-45,-30,-15,0,15,30,45]){let y=Y(lat);if(y<0||y>h)continue;
   ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.strokeStyle=lat===0?'rgba(113,218,225,.77)':'rgba(90,144,196,.1)';ctx.lineWidth=lat===0?1.7:1;ctx.stroke();
   if(lat===0){ctx.fillStyle='#8be3e4';ctx.textAlign='right';ctx.font='600 10px system-ui';ctx.fillText('EKLIPTYKA · β=0°',w-15,y-9);}
   else{ctx.fillStyle='#507c9d';ctx.textAlign='left';ctx.font='10px system-ui';ctx.fillText((lat>0?'+':'')+lat+'°',9,y-5);}
  }
  // Celestial equator (illustrative curve computed in the ecliptic frame).
  ctx.beginPath();let begun=false;
  for(let p=0;p<=w;p+=4){const lambda=C.mod(state.center+(p-w/2)/w*state.fov);
   const beta=-Math.atan(Math.tan(23.439291111*DEG)*Math.sin(lambda*DEG))/DEG;
   const y=Y(beta);if(!begun){ctx.moveTo(p,y);begun=true;}else ctx.lineTo(p,y);
  }
  ctx.strokeStyle='rgba(192,133,240,.38)';ctx.lineWidth=1;ctx.setLineDash([7,7]);ctx.stroke();ctx.setLineDash([]);
  ctx.restore();
  if(state.figures){
   for(const fig of figures){
    const selected=fig.id===current.id;
    ctx.lineWidth=selected?2.0:1.05;
    ctx.strokeStyle=selected?'rgba(151,216,249,.84)':'rgba(91,141,202,.35)';
    for(const path of fig.lines){let prev=null;ctx.beginPath();
     for(const p of path){const x=X(p.lon),y=Y(p.lat);
      if(prev&&Math.abs(x-prev.x)<w*.53){ctx.moveTo(prev.x,prev.y);ctx.lineTo(x,y);}prev={x,y};
     }ctx.stroke();
    }
   }
  }
  // Bright stars from HYG and figure nodes from Celestial Data.
  for(const s of stars){const x=X(s.lon),y=Y(s.lat);if(!inView(x)||y<10||y>h-10)continue;
   const r=clamp(2.6-s.mag*.32,.5,3.1);ctx.beginPath();ctx.arc(x,y,r,0,TAU);
   ctx.fillStyle=s.mag<1.3?'#e2f3ff':s.mag<3?'rgba(195,222,255,.9)':'rgba(159,191,230,.74)';
   if(s.mag<1.1){ctx.shadowBlur=11;ctx.shadowColor='#90baff';}ctx.fill();ctx.shadowBlur=0;
   if(s.name&&s.mag<1.8&&x>44&&x<w-45){ctx.font='10px system-ui';ctx.fillStyle='#a9c2d7';ctx.textAlign='left';ctx.fillText(s.name,x+6,y-6);}
  }
  // If catalogue lacks a node, render figure-vertex stars as curated data.
  if(state.figures){
   const seen=new Set();for(const fig of figures)for(const path of fig.lines)for(const s of path){
    const key=s.lon.toFixed(2)+':'+s.lat.toFixed(2);if(seen.has(key))continue;seen.add(key);
    const x=X(s.lon),y=Y(s.lat);if(!inView(x)||y<0||y>h)continue;
    ctx.fillStyle='rgba(178,220,247,.68)';ctx.beginPath();ctx.arc(x,y,1.25,0,TAU);ctx.fill();
   }
  }
  const planets=state.planetCache=bodies();
  const sun=planets.find(p=>p.id==='sun');
  const collisions=[];
  for(const p of planets.filter(p=>p.id!=='sun')){
   const x=X(p.lon),cy=Y(p.lat);if(!inView(x)||cy<0||cy>h)continue;
   ctx.beginPath();ctx.arc(x,cy,3.5,0,TAU);ctx.fillStyle=PLANET_COLORS[p.id];ctx.shadowColor=PLANET_COLORS[p.id];ctx.shadowBlur=12;ctx.fill();ctx.shadowBlur=0;
   ctx.strokeStyle='rgba(224,239,255,.65)';ctx.lineWidth=.7;ctx.beginPath();ctx.arc(x,cy,6.5,0,TAU);ctx.stroke();
   const overlap=collisions.filter(n=>Math.abs(n.x-x)<76&&Math.abs(n.y-cy)<28).length;
   collisions.push({x,y:cy});
   const ly=cy-15-overlap*14;
   ctx.fillStyle='#d6e6fa';ctx.font='600 10px system-ui';ctx.textAlign='center';ctx.fillText(STAR_ICONS[p.id],x,clamp(ly,22,h-20));
  }
  if(sun){const x=X(sun.lon),y=Y(sun.lat);
   if(inView(x)){
    const R=49;const lg=ctx.createRadialGradient(x,y,1,x,y,R*2);
    lg.addColorStop(0,'rgba(245,251,255,.85)');lg.addColorStop(.07,'rgba(182,229,255,.85)');lg.addColorStop(.24,'rgba(122,202,252,.35)');lg.addColorStop(1,'rgba(79,146,241,0)');
    ctx.fillStyle=lg;ctx.beginPath();ctx.arc(x,y,R*2,0,TAU);ctx.fill();
    ctx.beginPath();ctx.arc(x,y,15,0,TAU);ctx.fillStyle='#f4f6f4';ctx.shadowColor='#d5eeff';ctx.shadowBlur=29;ctx.fill();ctx.shadowBlur=0;
    ctx.strokeStyle='rgba(206,232,255,.9)';ctx.lineWidth=1.3;ctx.beginPath();ctx.arc(x,y,23,0,TAU);ctx.stroke();
    ctx.fillStyle='#f1faff';ctx.font='700 11px system-ui';ctx.textAlign='center';ctx.fillText('☀ SŁOŃCE',x,y+43);
    ctx.beginPath();ctx.moveTo(x,h*.15);ctx.lineTo(x,y-29);ctx.strokeStyle='rgba(173,221,255,.28)';ctx.setLineDash([3,5]);ctx.stroke();ctx.setLineDash([]);
   }
  }
  ctx.fillStyle='#85b0ce';ctx.font='10px system-ui';ctx.textAlign='left';ctx.fillText('β / SZEROKOŚĆ EKLIPTYCZNA',12,h-14);
 }
 function drawWheel(){
  const ci=canvasInfo(wheel,900);if(!ci)return;const {ctx,w,h}=ci;ctx.clearRect(0,0,w,h);
  const cx=w/2,cy=h/2,r=Math.min(w,h)*.425;
  const mainR=r*.97,innerR=r*.675;
  const L=Date.now()*.00011;
  const bg=ctx.createRadialGradient(cx,cy,r*.14,cx,cy,r*1.05);
  bg.addColorStop(0,'#071329');bg.addColorStop(.64,'#0e1e38');bg.addColorStop(1,'#081126');
  ctx.fillStyle=bg;ctx.beginPath();ctx.arc(cx,cy,r*1.05,0,TAU);ctx.fill();
  const edge=ctx.createRadialGradient(cx,cy,r*.93,cx,cy,r*1.07);
  edge.addColorStop(0,'rgba(97,182,245,0)');edge.addColorStop(.77,'rgba(111,180,236,.12)');edge.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=edge;ctx.beginPath();ctx.arc(cx,cy,r*1.1,0,TAU);ctx.fill();
  function ring(start,width,radius,thick,color){ctx.beginPath();ctx.arc(cx,cy,radius,(start-90)*DEG,(start+width-90)*DEG);
   ctx.strokeStyle=color;ctx.lineWidth=thick;ctx.stroke();}
  const year=state.date.getUTCFullYear(),arr=C.sectors(year),sun=C.sunLongitude(state.date),current=C.zone(sun,year),sign=C.sign(sun);
  for(let i=0;i<72;i++)ring(i*5,.2,r*1.035,7,'#4f789b55');
  for(const c of arr){
   ring(c.start,c.width-.35,mainR,r*.17,c.id===current.id?'#79c8f5':c.id==='Oph'?'#6763a7':'#28496f');
   const a=(c.start+c.width/2-90)*DEG,rm=mainR,px=cx+rm*Math.cos(a),py=cy+rm*Math.sin(a);
   ctx.fillStyle=c.id===current.id?'#081329':'#c0d0ef';ctx.font=`${c.id===current.id?'700':'600'} ${clamp(r*.052,9,13)}px system-ui`;
   ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(c.id,px,py);
  }
  for(let i=0;i<12;i++){
   ring(i*30,29.6,innerR,r*.105,i===sign.index?'#c5baf3':'#393a6b');
   const a=(i*30+15-90)*DEG;ctx.fillStyle=i===sign.index?'#17152f':'#acafdb';
   ctx.font=`${clamp(r*.09,14,23)}px system-ui`;ctx.textBaseline='middle';ctx.textAlign='center';
   const symbols='♈♉♊♋♌♍♎♏♐♑♒♓';ctx.fillText(Array.from(symbols)[i],cx+Math.cos(a)*innerR,cy+Math.sin(a)*innerR);
  }
  // 0° and quarter-turn coordinate markers
  for(const deg of [0,90,180,270]){
   const a=(deg-90)*DEG;ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*r*1.073,cy+Math.sin(a)*r*1.073);
   ctx.lineTo(cx+Math.cos(a)*r*1.105,cy+Math.sin(a)*r*1.105);
   ctx.strokeStyle='#6f96b9';ctx.lineWidth=1.3;ctx.stroke();
  }
  // Atmospheric Earth globe as a visual cue, not a sampled Earth texture.
  const globeR=r*.4;const halo=ctx.createRadialGradient(cx,cy,globeR*.5,cx,cy,globeR*1.35);
  halo.addColorStop(0,'rgba(40,120,185,.25)');halo.addColorStop(1,'rgba(40,120,185,0)');
  ctx.fillStyle=halo;ctx.beginPath();ctx.arc(cx,cy,globeR*1.35,0,TAU);ctx.fill();
  const sea=ctx.createRadialGradient(cx-globeR*.35,cy-globeR*.35,globeR*.1,cx,cy,globeR*1.18);
  sea.addColorStop(0,'#3f819e');sea.addColorStop(.6,'#123d64');sea.addColorStop(1,'#071326');
  ctx.beginPath();ctx.arc(cx,cy,globeR,0,TAU);ctx.fillStyle=sea;ctx.fill();
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,globeR,0,TAU);ctx.clip();
  ctx.strokeStyle='rgba(163,221,241,.19)';ctx.lineWidth=.8;
  for(let j=-3;j<=3;j++){
   let yy=cy+j*globeR/4,rx=globeR*Math.sqrt(Math.max(0,1-(j/4)**2));
   ctx.beginPath();ctx.ellipse(cx,yy,rx,globeR*.07,0,0,TAU);ctx.stroke();
  }
  for(let j=-2;j<=2;j++){ctx.beginPath();ctx.ellipse(cx,cy,globeR*(.4+j*.17),globeR,0,0,TAU);ctx.stroke();}
  ctx.restore();
  ctx.textBaseline='middle';ctx.textAlign='center';ctx.fillStyle='#d9f0ff';ctx.font=`700 ${clamp(r*.107,17,24)}px system-ui`;ctx.fillText('ZIEMIA',cx,cy-3);
  ctx.font=`${clamp(r*.063,10,14)}px system-ui`;ctx.fillStyle='#b6cfe1';ctx.fillText('PUNKT WIDZENIA',cx,cy+19);
  // Sun ray traverses both rings. Apparent longitude defined at equinox of date.
  const a=(sun-90)*DEG,rr=r*1.07;
  ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr);
  ctx.strokeStyle='rgba(239,252,255,.8)';ctx.lineWidth=2;ctx.shadowColor='#6acaff';ctx.shadowBlur=15;ctx.stroke();ctx.shadowBlur=0;
  const px=cx+Math.cos(a)*rr,py=cy+Math.sin(a)*rr;
  const highlight=ctx.createRadialGradient(px,py,1,px,py,21);highlight.addColorStop(0,'#ffffff');highlight.addColorStop(.32,'rgba(176,229,255,.9)');highlight.addColorStop(1,'rgba(84,144,249,0)');
  ctx.fillStyle=highlight;ctx.beginPath();ctx.arc(px,py,21,0,TAU);ctx.fill();
  ctx.beginPath();ctx.arc(px,py,4.5,0,TAU);ctx.fillStyle='#fff';ctx.fill();
 }
 function render(){if(!dialog.open)return;drawSky();drawWheel();}
 function tick(time){
  if(!dialog.open){state.raf=0;return;}
  const dt=state.lastFrame?Math.min(.11,(time-state.lastFrame)/1000):0;
  state.lastFrame=time;
  if(state.playing){
   const next=new Date(state.date.getTime()+dt*state.speed*86400000);
   if(next.getTime()>DATES.max){state.playing=false;setPlayButton();}
   else {updateDate(next);if(!state.autoCenter)state.center=C.mod(state.center+dt*state.speed*.9856);}
  }
  render();state.raf=root.requestAnimationFrame(tick);
 }
 function setPlayButton(){const b=$('z25Play');b.textContent=state.playing?'Ⅱ':'▶';b.setAttribute('aria-label',state.playing?'Wstrzymaj podróż':'Uruchom podróż przez rok');}
 function open(){
  if(!dialog.open){
   const api=root.ATLAS_MAIN_API;
   if(api?.getJD){const d=new Date((api.getJD()-2440587.5)*86400000);
    if(Number.isFinite(d.getTime())&&d>=new Date(DATES.min)&&d<=new Date(DATES.max))updateDate(d,{center:true});}
   try{dialog.showModal();}catch(err){dialog.setAttribute('open','');}
  }
  state.playing=false;setPlayButton();state.lastFrame=0;updateStats();
  if(!state.raf)state.raf=root.requestAnimationFrame(tick);
 }
 function close(){state.playing=false;setPlayButton();if(dialog.open)dialog.close();}
 const list=$('z25ConstellationList');
 for(const c of C.CATALOG){
  const btn=doc.createElement('button');btn.type='button';btn.dataset.constellation=c.id;btn.setAttribute('aria-pressed','false');
  if(c.id==='Oph')btn.classList.add('special');
  const glyph=doc.createElement('span');glyph.textContent=c.symbol;glyph.setAttribute('aria-hidden','true');
  btn.append(glyph,doc.createTextNode(c.name));btn.title='Przenieś Słońce do gwiazdozbioru '+c.name;
  btn.addEventListener('click',()=>{state.playing=false;setPlayButton();jumpTo(c.id);});list.appendChild(btn);
 }
 $('openZodiac25Side')?.addEventListener('click',open);
 $('openZodiac25Top')?.addEventListener('click',open);
 $('z25Close').addEventListener('click',close);
 dialog.addEventListener('click',e=>{if(e.target===dialog)close();});
 dialog.addEventListener('close',()=>{state.playing=false;state.lastFrame=0;setPlayButton();if(state.raf){root.cancelAnimationFrame(state.raf);state.raf=0;}});
 $('z25Play').addEventListener('click',()=>{state.playing=!state.playing;setPlayButton();});
 $('z25Speed').addEventListener('change',e=>{state.speed=clamp(Number(e.target.value)||10,1,30);});
 $('z25Day').addEventListener('input',e=>{state.playing=false;setPlayButton();const yr=state.date.getUTCFullYear();updateDate(new Date(yearStart(yr)+Number(e.target.value)*86400000+12*3600000));});
 $('z25Date').addEventListener('change',e=>{
  const value=e.target.value;if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return;
  const date=new Date(value+'T12:00:00.000Z');if(!Number.isFinite(date.getTime()))return;
  state.playing=false;setPlayButton();updateDate(date);
 });
 $('z25Now').addEventListener('click',()=>{state.playing=false;setPlayButton();state.autoCenter=true;updateDate(new Date(),{center:true});});
 $('z25ToAtlas').addEventListener('click',()=>{
  const api=root.ATLAS_MAIN_API;
  if(api?.setJD){api.setJD(jd());api.setPlaying?.(false);$('z25ToAtlas').textContent='✓ Data ustawiona w Atlasie';
   root.setTimeout(()=>{$('z25ToAtlas').textContent='↗ Przenieś datę do Atlasu';},1800);
  }else $('z25ToAtlas').textContent='Brak silnika głównego';
 });
 $('z25Stars').addEventListener('click',()=>{state.figures=!state.figures;$('z25Stars').setAttribute('aria-pressed',String(state.figures));});
 $('z25Center').addEventListener('click',()=>{state.autoCenter=true;state.center=C.sunLongitude(state.date)-(state.date.getUTCFullYear()-2000)*50.29/3600;});
 let drag=null;
 sky.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={id:e.pointerId,x:e.clientX,center:state.center};
  sky.setPointerCapture?.(e.pointerId);});
 sky.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;
  const dx=e.clientX-drag.x,rect=sky.getBoundingClientRect();if(!rect.width)return;
  if(Math.abs(dx)>2)state.autoCenter=false;
  state.center=C.mod(drag.center-dx/rect.width*state.fov);
 });
 const endDrag=e=>{if(drag?.id===e.pointerId)drag=null;};
 sky.addEventListener('pointerup',endDrag);sky.addEventListener('pointercancel',endDrag);
 sky.addEventListener('wheel',e=>{e.preventDefault();const f=e.deltaY>0?1.13:1/1.13;
  state.fov=clamp(state.fov*f,35,300);},{passive:false});
 sky.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){
  state.autoCenter=false;state.center=C.mod(state.center+(e.key==='ArrowLeft'?-6:6));e.preventDefault();}
  if(e.key==='+'||e.key==='='){state.fov=clamp(state.fov/1.18,35,300);e.preventDefault();}
  if(e.key==='-'){state.fov=clamp(state.fov*1.18,35,300);e.preventDefault();}
 });
 wheel.addEventListener('click',e=>{
  const r=wheel.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2;
  const dist=Math.hypot(x,y),unit=Math.min(r.width,r.height)*.425;
  if(dist<unit*.58||dist>unit*1.11)return;
  const lam=C.mod(Math.atan2(y,x)/DEG+90);
  if(dist>unit*.83){const sector=C.zone(lam,state.date.getUTCFullYear());jumpTo(sector.id);}
  else{const center=Math.floor(lam/30)*30+15;
   const date=C.solarDateAtLongitude(state.date.getUTCFullYear(),center);
   if(date){state.playing=false;setPlayButton();state.autoCenter=true;updateDate(date,{center:true});}
  }
 });
 doc.addEventListener('visibilitychange',()=>{if(doc.hidden&&state.playing){state.playing=false;setPlayButton();}});
 updateStats();
 root.ATLAS_ZODIAC25=Object.freeze({open,close,setDate:date=>updateDate(new Date(date),{center:true}),
  choose:jumpTo,renderNow:render,getState:()=>({date:state.date.toISOString(),playing:state.playing,
   constellation:C.zone(C.sunLongitude(state.date),state.date.getUTCFullYear()).name,
   sign:C.sign(C.sunLongitude(state.date)).name,solarLongitude:C.sunLongitude(state.date),
   planets:state.planetCache.map(p=>({id:p.id,lon:p.lon,lat:p.lat}))})});
}
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',init);else init();
})(typeof window!=='undefined'?window:globalThis);