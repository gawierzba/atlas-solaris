/* ATLAS SOLARIS 26.0 — interactive long-term sky time machine.
 * Pole/equinox geometry from time26-core (Vondrák 2011, ERFA adaptation).
 * Stars: existing HYG/Yale/Hipparcos J2000 catalogue, no proper motion.
 * Constellation boundaries: 25.1 J2000 IAU zodiac polygons; Earth drawing illustrative.
 */
(function(root){'use strict';
const doc=root.document,$=id=>doc.getElementById(id),PI=Math.PI,R=PI/180,TWOPI=2*PI;
const MAPMAX=55,STAR_LIMIT=5.5;
const CLR=['#9ccbe1','#9a9fe7','#ab9cd9','#c0a8d8','#90c3d3','#79d3d5','#a6bcf5','#af9adb','#b9aee9','#83c7e7','#b6d4ec','#94b8cd','#a5b9e9'];
const fmt=(n,d=1)=>Number(n).toLocaleString('pl-PL',{minimumFractionDigits:d,maximumFractionDigits:d});
const labelYear=y=>y<=0?`${1-Math.round(y)} p.n.e.`:`${Math.round(y)} n.e.`;
function init(){
 const F=root.ATLAS_TIME26_CORE,Z=root.ATLAS_ZODIAC251_CORE,A=root.ATLAS_ZODIAC25_CORE,D=root.ATLAS_INTERSTELLAR19_DATA;
 const dialog=$('time26Dialog'),map=$('time26PoleCanvas'),earth=$('time26EarthCanvas'),zodiac=$('time26ZodiacCanvas');
 if(!F||!Z||!A||!dialog||!map||!earth||!zodiac)return;
 const sites=F.POLE_STARS;
 const starRows=(D?.stars||[]).map((r,i)=>{const dist=Math.hypot(r[0],r[1],r[2]);return {id:i,pos:dist>0?[r[0]/dist,r[1]/dist,r[2]/dist]:null,mag:r[3],bv:r[4],name:r[5]||'',distance:dist};})
  .filter(s=>s.pos&&Number.isFinite(s.mag)&&s.mag<=STAR_LIMIT&&F.angle(s.pos,F.J2000_ECL)<MAPMAX+6);
 // In preview/local fallbacks, use the labelled J2000 pole-star reference points.
 const mapStars=starRows.length?starRows:sites.map((s,i)=>({id:i,pos:s.v,mag:s.mag,bv:.1,name:s.name,distance:1}));
 const trail=F.markers(140),state={year:2026,playing:false,speed:450,rotation:0,zoom:1,raf:0,last:0,dirty:true,drag:null,hitYears:[],mainPlaying:false};
 const once={};
 const zodiacMap=A.CATALOG.reduce((m,c,i)=>{m[c.id]={...c,color:CLR[i]};return m;},{});
 const ECL_EPS=Math.asin(F.J2000_Y[2]);
 const eclToEq=lon=>{const l=lon*R;return [Math.cos(l),Math.sin(l)*Math.cos(ECL_EPS),Math.sin(l)*Math.sin(ECL_EPS)];};
 const intervals=(()=>{
  let arr=[],prev=null;for(let i=0;i<=1440;i++){const lon=i*.25;const direction=eclToEq(lon),eq=F.vecDir(direction),id=Z.constellationAt(eq.ra,eq.dec);if(i===0||id!==prev){arr.push({start:lon,id});prev=id;}}
  arr[arr.length-1].end=360;
  for(let i=0;i<arr.length-1;i++)arr[i].end=arr[i+1].start;
  return arr;
 })();
 function syncInputs(){
  $('time26Year').value=String(Math.round(state.year));$('time26Slider').value=String(Math.round(state.year/10)*10);
  for(const b of doc.querySelectorAll('[data-time26-year]'))b.setAttribute('aria-pressed',String(Number(b.dataset.time26Year)===Math.round(state.year)));
 }
 function setYear(year){
  if(!Number.isFinite(year))return;
  state.year=F.clamp(year,-12000,16000);state.dirty=true;syncInputs();readout();
 }
 function readout(){
  const p=F.precession(state.year),near=F.nearestPoleStars(state.year,4);
  const zone=Z.constellationAt(p.equinoxDir.ra,p.equinoxDir.dec),meta=zodiacMap[zone];
  const longitude=F.eclipticLongitudeJ2000(p.equinox);
  const polaris=F.POLE_STARS[0],angle=F.angle(p.pole,polaris.v);
  $('time26BigYear').textContent=labelYear(state.year);
  $('time26YearEra').textContent=state.year<0?'PRZED NASZĄ ERĄ':Math.abs(state.year-2026)<10?'NASZA EPOKA':'ODLEGŁA EPOKA';
  $('time26PoleStar').textContent=near[0].name;
  $('time26PoleSep').textContent=fmt(near[0].separation,2)+'° od bieguna · wśród wybranych kandydatów';
  $('time26EquinoxZone').textContent=meta?meta.name:'Poza pasem 13 konstelacji';
  $('time26EquinoxLon').textContent=fmt(longitude,2)+'° długości J2000';
  $('time26Obliquity').textContent=fmt(p.obliquity,3)+'°';
  $('time26PoleCoords').textContent=fmt(p.northPole.ra,2)+'° / '+fmt(p.northPole.dec,2)+'°';
  $('time26EquinoxCoords').textContent=fmt(p.equinoxDir.ra,2)+'° / '+fmt(p.equinoxDir.dec,2)+'°';
  $('time26PolarisAngle').textContent=fmt(angle,2)+'°';
  $('time26StarRank').replaceChildren();
  near.forEach((s,i)=>{const box=doc.createElement('div');box.className='time26-star';
   const a=doc.createElement('b');a.textContent=(i+1)+'. '+s.name;
   const b=doc.createElement('strong');b.textContent=fmt(s.separation,2)+'°';
   const c=doc.createElement('span');c.textContent=s.latin+' · V '+fmt(s.mag,1);
   box.append(a,b,c);$('time26StarRank').appendChild(box);
  });
  return p;
 }
 function resize(c,limit=1300){const r=c.getBoundingClientRect();if(!(r.width>50&&r.height>50))return null;
  const dpr=Math.min(root.devicePixelRatio||1,1.65);const w=Math.min(limit,Math.round(r.width*dpr)),h=Math.min(950,Math.round(r.height*dpr));
  if(c.width!==w||c.height!==h){c.width=w;c.height=h;}
  return {ctx:c.getContext('2d'),w,h,ratio:dpr};
 }
 const clamp=F.clamp;
 function poleCoords(v,cx,cy,radius){
  const dotz=clamp(F.dot(v,F.J2000_ECL),-1,1),theta=Math.acos(dotz);
  const x=F.dot(v,F.J2000_X),y=F.dot(v,F.J2000_Y),az=Math.atan2(y,x)+state.rotation;
  const r=theta/R/(MAPMAX/state.zoom)*radius;
  return {x:cx+Math.cos(az)*r,y:cy-Math.sin(az)*r,r,theta:theta/R};
 }
 const bgSeeds=Array.from({length:90},(_,i)=>{let a=(i*92821+139)%991,x=(a/991),y=((i*7229+61)%997)/997;return {x,y,r:.4+(i%4)*.14};});
 function baseFill(ctx,w,h,type){
  const g=ctx.createRadialGradient(w*.48,h*.48,3,w*.48,h*.48,Math.max(w,h)*.71);
  g.addColorStop(0,type==='pole'?'#12283e':'#0d2742');g.addColorStop(.5,'#09172c');g.addColorStop(1,'#030916');
  ctx.fillStyle=g;ctx.fillRect(0,0,w,h);ctx.fillStyle='#b4d8fb';
  for(const p of bgSeeds){ctx.globalAlpha=.08+(p.r-.4)*.21;ctx.beginPath();ctx.arc(p.x*w,p.y*h,p.r,0,TWOPI);ctx.fill();}ctx.globalAlpha=1;
 }
 function plotPole(time){
  const sized=resize(map);if(!sized)return;const {ctx,w,h}=sized;const cx=w*.5,cy=h*.54,radius=Math.min(w*.46,h*.43);
  baseFill(ctx,w,h,'pole');ctx.save();ctx.beginPath();ctx.arc(cx,cy,radius,0,TWOPI);ctx.clip();
  for(let deg=10;deg<=50;deg+=10){const rr=deg/(MAPMAX/state.zoom)*radius;
   ctx.strokeStyle='rgba(110,166,207,.18)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(cx,cy,rr,0,TWOPI);ctx.stroke();
   ctx.fillStyle='#6a9cbc';ctx.font=Math.max(9,Math.round(w/75))+'px system-ui';ctx.fillText(deg+'°',cx+8,cy-rr-5);
  }
  // Ecliptic pole, the center of the J2000 azimuthal projection.
  ctx.strokeStyle='rgba(84,184,216,.15)';ctx.beginPath();ctx.moveTo(cx-radius,cy);ctx.lineTo(cx+radius,cy);ctx.moveTo(cx,cy-radius);ctx.lineTo(cx,cy+radius);ctx.stroke();
  for(const s of mapStars){const pt=poleCoords(s.pos,cx,cy,radius);if(pt.r>radius+4)continue;
   const size=Math.max(.7,Math.min(3.4,3.3-s.mag*.36))*(w/650);ctx.fillStyle=s.bv>1.25?'#f6c5b7':s.bv<0?'#aec9ff':'#f1f2ff';
   ctx.globalAlpha=clamp(1-s.mag*.105,.2,.87);ctx.beginPath();ctx.arc(pt.x,pt.y,Math.max(.7,size),0,TWOPI);ctx.fill();
  }ctx.globalAlpha=1;
  // Exact long-term pole trajectory projected on a fixed J2000 ecliptic reference.
  ctx.save();ctx.strokeStyle='rgba(82,218,247,.84)';ctx.lineWidth=Math.max(1.3,w/470);ctx.shadowBlur=12;ctx.shadowColor='#5acffc';
  ctx.beginPath();trail.forEach((p,i)=>{const pt=poleCoords(p.pole,cx,cy,radius);if(i===0)ctx.moveTo(pt.x,pt.y);else ctx.lineTo(pt.x,pt.y);});ctx.stroke();ctx.restore();
  // Time markers are clickable, so centuries can be chosen directly on the ring.
  state.hitYears=[];
  for(let y=-12000;y<=16000;y+=2000){const pt=poleCoords(F.precession(y).pole,cx,cy,radius);state.hitYears.push({year:y,x:pt.x,y:pt.y});
   ctx.fillStyle='#7fd7ec';ctx.beginPath();ctx.arc(pt.x,pt.y,3.4,0,TWOPI);ctx.fill();
  }
  // Named stars are clear reference anchors; stellar proper motions are intentionally omitted.
  for(const s of sites){const pt=poleCoords(s.v,cx,cy,radius);if(pt.r>radius-5)continue;
   if(w<480&&!['Polarna','Tubana','Wega','Errai'].includes(s.name))continue;
   ctx.strokeStyle='rgba(191,229,250,.65)';ctx.lineWidth=.7;ctx.beginPath();ctx.arc(pt.x,pt.y,3.8,0,TWOPI);ctx.stroke();
   ctx.fillStyle='#e1eaff';ctx.font=`${Math.max(10,Math.round(w/53))}px system-ui`;
   const dx=pt.x<cx?9:-9;ctx.textAlign=pt.x<cx?'left':'right';ctx.fillText(s.name,pt.x+dx,pt.y-8);
  }
  const current=F.precession(state.year),pt=poleCoords(current.pole,cx,cy,radius);
  ctx.save();ctx.shadowBlur=24;ctx.shadowColor='#bcf5ff';ctx.fillStyle='#efffff';ctx.beginPath();ctx.arc(pt.x,pt.y,Math.max(5,w/105),0,TWOPI);ctx.fill();
  ctx.shadowBlur=0;ctx.strokeStyle='#b4f4fe';ctx.lineWidth=1.3;ctx.beginPath();ctx.arc(pt.x,pt.y,Math.max(11,w/56)+Math.sin(time/380)*2.3,0,TWOPI);ctx.stroke();
  ctx.textAlign='left';ctx.fillStyle='#dffaff';ctx.font=`bold ${Math.max(12,Math.round(w/37))}px system-ui`;
  if(w>480){const pad=pt.x+16>w*.74?-135:15;ctx.fillText('BIEGUN · '+Math.round(state.year),pt.x+pad,pt.y+25);}ctx.restore();
  ctx.fillStyle='#88d9ef';ctx.beginPath();ctx.arc(cx,cy,3,0,TWOPI);ctx.fill();ctx.restore();
  // Center is the fixed J2000 ecliptic north pole, marked by the blue dot.
 }
 const basisWorld=v=>[F.dot(v,F.J2000_X),F.dot(v,F.J2000_Y),F.dot(v,F.J2000_ECL)];
 const ortho=v=>{const x=v[0],y=v[1],z=v[2],ry=-.50,rx=.32;
  const xx=x*Math.cos(ry)+z*Math.sin(ry),zz=-x*Math.sin(ry)+z*Math.cos(ry);
  return [xx,y*Math.cos(rx)-zz*Math.sin(rx),y*Math.sin(rx)+zz*Math.cos(rx)];};
 function plotEarth(time){
  const sized=resize(earth);if(!sized)return;const {ctx,w,h}=sized;const cx=w*.5,cy=h*.56,rr=Math.min(w*.31,h*.30),scale=rr*1.8;
  baseFill(ctx,w,h,'earth');
  const pr=(v,s=1)=>{const q=ortho(basisWorld(v));return {x:cx+q[0]*scale*s,y:cy-q[1]*scale*s,z:q[2]};};
  // Whole cone envelope: actual numerical precession path, not constant-angle fake circle.
  ctx.save();ctx.strokeStyle='rgba(85,196,219,.34)';ctx.lineWidth=1.4;ctx.setLineDash([4,7]);
  ctx.beginPath();trail.forEach((v,i)=>{const p=pr(v.pole);if(i)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);});ctx.stroke();ctx.setLineDash([]);
  // Earth-sphere glow.
  const glow=ctx.createRadialGradient(cx,cy,rr*.7,cx,cy,rr*1.62);glow.addColorStop(0,'#398db433');glow.addColorStop(1,'#398db400');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(cx,cy,rr*1.62,0,TWOPI);ctx.fill();
  const globe=ctx.createRadialGradient(cx-rr*.45,cy-rr*.48,rr*.03,cx+rr*.23,cy+rr*.23,rr*1.2);
  globe.addColorStop(0,'#7fcee2');globe.addColorStop(.30,'#28749f');globe.addColorStop(.68,'#13466d');globe.addColorStop(1,'#091426');
  ctx.fillStyle=globe;ctx.beginPath();ctx.arc(cx,cy,rr,0,TWOPI);ctx.fill();ctx.strokeStyle='#8bd6f2aa';ctx.lineWidth=1;ctx.stroke();
  // Surface graticule is illustrative; equator and axis orientation are calculated.
  const p=F.precession(state.year),axis=p.pole;
  let east=F.unit(F.cross(axis,[0,1,0]));if(!east)east=[1,0,0];const north=F.unit(F.cross(axis,east));
  const phase=time*.00015;
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,rr-.9,0,TWOPI);ctx.clip();
  const drawLine=(samples,color,width)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();let begun=false;
   for(const v of samples){const q=pr(v,rr/scale);if(!begun){ctx.moveTo(q.x,q.y);begun=true;}else ctx.lineTo(q.x,q.y);}ctx.stroke();};
  for(let lat=-60;lat<=60;lat+=30){const l=lat*R,samples=[];for(let j=0;j<=120;j++){const a=j/120*TWOPI+phase;
    const v=F.add(F.scale(axis,Math.sin(l)),F.add(F.scale(east,Math.cos(l)*Math.cos(a)),F.scale(north,Math.cos(l)*Math.sin(a))));samples.push(v);}
   drawLine(samples,'rgba(165,221,246,.20)',.8);
  }
  for(let j=0;j<12;j++){const a=j/12*TWOPI+phase,samples=[];for(let k=-90;k<=90;k+=4){const l=k*R;
   samples.push(F.add(F.scale(axis,Math.sin(l)),F.add(F.scale(east,Math.cos(l)*Math.cos(a)),F.scale(north,Math.cos(l)*Math.sin(a)))));
   }drawLine(samples,'rgba(166,216,246,.17)',.8);
  }ctx.restore();
  // Full theoretical directions from Vondrák 2011: true pole and ecliptic pole.
  const ecl=p.ecliptic,pole=axis;
  const eclFront=pr(ecl,1.12),eclBack=pr(F.scale(ecl,-1),1.12),axisFront=pr(pole,1.42),axisBack=pr(F.scale(pole,-1),1.2);
  ctx.save();ctx.setLineDash([4,7]);ctx.strokeStyle='#bde6e999';ctx.lineWidth=1.3;
  ctx.beginPath();ctx.moveTo(eclBack.x,eclBack.y);ctx.lineTo(eclFront.x,eclFront.y);ctx.stroke();ctx.setLineDash([]);
  ctx.strokeStyle='#c5eeff';ctx.lineWidth=2.7;ctx.shadowBlur=8;ctx.shadowColor='#6bcbfa';
  ctx.beginPath();ctx.moveTo(axisBack.x,axisBack.y);ctx.lineTo(axisFront.x,axisFront.y);ctx.stroke();ctx.restore();
  ctx.fillStyle='#dffaff';ctx.beginPath();ctx.arc(axisFront.x,axisFront.y,4.4,0,TWOPI);ctx.fill();
  ctx.font=`bold ${Math.max(10,Math.round(w/45))}px system-ui`;
  ctx.textAlign='center';ctx.fillStyle='#d7f7ff';ctx.fillText('OŚ ZIEMI',clamp(axisFront.x,56,w-56),clamp(axisFront.y-14,40,h-30));
  ctx.font=`${Math.max(10,Math.round(w/51))}px system-ui`;
  ctx.fillStyle='#80e2ee';ctx.fillText('BIEGUN EKLIPTYKI',clamp(eclFront.x,76,w-76),clamp(eclFront.y-17,35,h-30));
  ctx.fillStyle='#accada';ctx.fillText('ε = '+fmt(p.obliquity,2)+'°',cx,cy+rr+20);
  ctx.fillStyle='#8bb4cd';ctx.fillText('SCHEMAT — SKALA ILUSTRACYJNA',cx,h*.94);
 }
 function plotZodiac(){const size=resize(zodiac,1500);if(!size)return;const {ctx,w,h}=size;ctx.clearRect(0,0,w,h);
  const x0=20,y0=h*.39,width=w-40,barH=h*.22;
  // The background uses static J2000 zodiac regions, which are unevenly sized.
  for(const [i,b] of intervals.entries()){
   const x=x0+b.start/360*width,cw=(b.end-b.start)/360*width;const c=zodiacMap[b.id];
   ctx.fillStyle=c?.color||'#384d69';ctx.globalAlpha=.45;ctx.fillRect(x,y0,cw+.4,barH);ctx.globalAlpha=1;
   if(cw>30){ctx.textAlign='center';ctx.fillStyle='#e8f6ff';ctx.font=`${Math.max(9,Math.round(w/108))}px system-ui`;ctx.fillText(c?.symbol||'',x+cw/2,y0+barH*.68);}
  }
  ctx.strokeStyle='#a2c5df66';ctx.strokeRect(x0,y0,width,barH);
  for(let d=0;d<=360;d+=30){const x=x0+d/360*width;ctx.strokeStyle='#add1f833';ctx.beginPath();ctx.moveTo(x,y0-6);ctx.lineTo(x,y0+barH+9);ctx.stroke();
   ctx.fillStyle='#78a4c1';ctx.font=`${Math.max(9,Math.round(w/115))}px system-ui`;ctx.textAlign='center';ctx.fillText(d+'°',x,y0+barH+22);
  }
  const lon=F.eclipticLongitudeJ2000(F.precession(state.year).equinox),x=x0+lon/360*width;
  ctx.strokeStyle='#eafcff';ctx.lineWidth=2.5;ctx.shadowColor='#7ff5f6';ctx.shadowBlur=13;
  ctx.beginPath();ctx.moveTo(x,y0-12);ctx.lineTo(x,y0+barH+5);ctx.stroke();ctx.shadowBlur=0;
  ctx.fillStyle='#ecfcff';ctx.beginPath();ctx.moveTo(x,y0-16);ctx.lineTo(x-6,y0-29);ctx.lineTo(x+6,y0-29);ctx.closePath();ctx.fill();
  ctx.fillStyle='#c4f4f7';ctx.font=`bold ${Math.max(10,Math.round(w/105))}px system-ui`;ctx.textAlign=lon>300?'right':'left';
  ctx.fillText('RÓWNONOC '+fmt(lon,1)+'°',clamp(x+(lon>300?-9:9),x0+15,w-15),y0-36);
 }
 function draw(time){if(!dialog.open)return;plotPole(time);plotEarth(time);plotZodiac();state.dirty=false;}
 function frame(t){if(!dialog.open){state.raf=0;return;}
  const dt=state.last?Math.min(.12,(t-state.last)/1000):0;state.last=t;
  if(state.playing){let next=state.year+state.speed*dt;if(next>16000)next=-12000;
   setYear(next);}
  if(state.dirty||state.playing||t%90<18)draw(t);
  state.raf=root.requestAnimationFrame(frame);
 }
 function start(){if(state.raf)return;state.last=0;state.raf=root.requestAnimationFrame(frame);}
 function stop(){state.playing=false;$('time26Play').textContent='▶ PODRÓŻ PRZEZ EPOKI';state.dirty=true;}
 function open(){
  if(dialog.open)return;
  const prevMain=root.ATLAS_MAIN_API?.getPlaying?.();state.mainPlaying=!!prevMain;root.ATLAS_MAIN_API?.setPlaying?.(false);
  for(const id of ['zodiac25Dialog','z251Dialog']){const d=$(id);if(d?.open)d.close();}
  if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
  state.dirty=true;syncInputs();readout();start();
 }
 function close(){if(dialog.open)dialog.close();}
 function cleanup(){stop();if(state.raf){root.cancelAnimationFrame(state.raf);state.raf=0;}if(state.mainPlaying)root.ATLAS_MAIN_API?.setPlaying?.(true);state.mainPlaying=false;}
 for(const id of ['openTime26Side','openTime26Top','z251ToTime26','z25ToTime26'])$(id)?.addEventListener('click',open);
 $('time26Close').addEventListener('click',close);
 dialog.addEventListener('click',e=>{if(e.target===dialog)close();});dialog.addEventListener('close',cleanup);
 $('time26Year').addEventListener('change',e=>{stop();const y=Number(e.target.value);if(Number.isFinite(y))setYear(y);});
 $('time26Slider').addEventListener('input',e=>{stop();setYear(Number(e.target.value));});
 $('time26Reset').addEventListener('click',()=>{stop();setYear(2026);});
 for(const btn of doc.querySelectorAll('[data-time26-year]'))btn.addEventListener('click',()=>{stop();setYear(Number(btn.dataset.time26Year));});
 $('time26Play').addEventListener('click',()=>{state.playing=!state.playing;
  $('time26Play').textContent=state.playing?'Ⅱ PAUZA':'▶ PODRÓŻ PRZEZ EPOKI';start();});
 $('time26Speed').addEventListener('change',e=>{state.speed=Number(e.target.value)||450;});
 $('time26ToZodiac').addEventListener('click',()=>{close();root.ATLAS_ZODIAC25?.open?.();});
 $('time26ToLiving').addEventListener('click',()=>{close();root.ATLAS_ZODIAC251?.open?.();});
 let down=null;
 map.addEventListener('pointerdown',e=>{down={id:e.pointerId,x:e.clientX,y:e.clientY,rot:state.rotation};map.setPointerCapture(e.pointerId);});
 map.addEventListener('pointermove',e=>{if(!down||e.pointerId!==down.id)return;
  state.rotation=down.rot+(e.clientX-down.x)*.009;state.dirty=true;});
 map.addEventListener('pointerup',e=>{if(!down||down.id!==e.pointerId)return;
  if(Math.hypot(e.clientX-down.x,e.clientY-down.y)<8){const rect=map.getBoundingClientRect(),x=(e.clientX-rect.left)*map.width/rect.width,y=(e.clientY-rect.top)*map.height/rect.height;
   let nearest=null;for(const o of state.hitYears){const d=Math.hypot(x-o.x,y-o.y);if(!nearest||d<nearest.d)nearest={d,year:o.year};}
   if(nearest&&nearest.d<18){stop();setYear(nearest.year);}
  }down=null;});
 map.addEventListener('pointercancel',()=>{down=null;});
 map.addEventListener('wheel',e=>{e.preventDefault();state.zoom=clamp(state.zoom*(e.deltaY>0?.90:1.1),.75,1.9);state.dirty=true;},{passive:false});
 zodiac.addEventListener('click',e=>{const rect=zodiac.getBoundingClientRect(),x=(e.clientX-rect.left)/rect.width;
  // The strip is a directional reference, not an independent date-to-longitude solver.
  if(x>=0&&x<=1){state.dirty=true;}
 });
 root.addEventListener('resize',()=>{state.dirty=true;});
 doc.addEventListener('visibilitychange',()=>{if(doc.hidden&&state.playing)stop();});
 readout();syncInputs();
 root.ATLAS_TIME26=Object.freeze({open,close,setYear,getState:()=>({year:state.year,playing:state.playing,zoom:state.zoom,
  pole:F.precession(state.year).northPole,nearest:F.nearestPoleStars(state.year,1)[0].name})});
}
if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',init);else init();
})(window);