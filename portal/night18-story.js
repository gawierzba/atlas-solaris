/* ATLAS SOLARIS XVIII — night observer laboratory.
   Celestial-sphere geometry, approximate GMST, equatorial to alt-az,
   approximate solar coordinates. Explicit device timezone, no networking.
   Canvas 2D, progressive enhancements, no WebGL and no geolocation. */
(function(){
'use strict';
var D2R=Math.PI/180,R2D=180/Math.PI,OBLIQUITY=23.439;
function norm(x){return ((x%360)+360)%360;}
function norm180(x){return ((x+180)%360+360)%360-180;}
function jd(when){var ms=when instanceof Date?when.getTime():Number(when);return Number.isFinite(ms)?ms/86400000+2440587.5:NaN;}
function gmstDegrees(when){
 var J=jd(when),T=(J-2451545)/36525;
 return norm(280.46061837+360.98564736629*(J-2451545)+.000387933*T*T-T*T*T/38710000);
}
function localSiderealDegrees(when,longitudeDeg){return norm(gmstDegrees(when)+longitudeDeg);}
function position(when,latitudeDeg,longitudeDeg,rightAscensionDeg,declinationDeg){
 if(!Number.isFinite(latitudeDeg)||Math.abs(latitudeDeg)>90||!Number.isFinite(longitudeDeg)||!Number.isFinite(rightAscensionDeg)||!Number.isFinite(declinationDeg)||Math.abs(declinationDeg)>90)return null;
 var LST=localSiderealDegrees(when,longitudeDeg),H=norm180(LST-rightAscensionDeg)*D2R;
 var phi=latitudeDeg*D2R,dec=declinationDeg*D2R;
 var up=Math.sin(phi)*Math.sin(dec)+Math.cos(phi)*Math.cos(dec)*Math.cos(H);
 var alt=Math.asin(Math.max(-1,Math.min(1,up)))*R2D;
 var east=-Math.cos(dec)*Math.sin(H);
 var north=Math.sin(dec)*Math.cos(phi)-Math.cos(dec)*Math.cos(H)*Math.sin(phi);
 var az=norm(Math.atan2(east,north)*R2D);
 return {altitudeDeg:alt,azimuthDeg:az,hourAngleDeg:norm180(H*R2D),lstDeg:LST};
}
function sunEquatorial(when){
 var n=jd(when)-2451545,L=norm(280.46+.9856474*n),g=norm(357.528+.9856003*n)*D2R;
 var lambda=(L+1.915*Math.sin(g)+.020*Math.sin(2*g))*D2R;
 var eps=(OBLIQUITY-.0000004*n)*D2R;
 var ra=norm(Math.atan2(Math.cos(eps)*Math.sin(lambda),Math.cos(lambda))*R2D);
 var dec=Math.asin(Math.sin(eps)*Math.sin(lambda))*R2D;
 return {raDeg:ra,decDeg:dec};
}
function sunAltitudeDegrees(when,lat,lon){var s=sunEquatorial(when),p=position(when,lat,lon,s.raDeg,s.decDeg);return p?p.altitudeDeg:NaN;}
function darkness(sunAlt){
 if(sunAlt<=-18)return 'Noc astronomiczna';
 if(sunAlt<=-12)return 'Zmierzch astronomiczny';
 if(sunAlt<=-6)return 'Zmierzch żeglarski';
 if(sunAlt<=0)return 'Zmierzch cywilny';
 return 'Słońce nad horyzontem';
}
var targets={
 m31:{name:'Andromeda / M31',ra:10.6847,dec:41.269,magnitude:3.44},
 m45:{name:'Plejady / M45',ra:56.75,dec:24.117,magnitude:1.6},
 m42:{name:'Mgławica Oriona / M42',ra:83.8221,dec:-5.3911,magnitude:4},
 m13:{name:'Gromada Herkulesa / M13',ra:250.4218,dec:36.4613,magnitude:5.8},
 polaris:{name:'Gwiazda Polarna',ra:37.9546,dec:89.2641,magnitude:1.98},
 vega:{name:'Wega',ra:279.2347,dec:38.7837,magnitude:.03},
 sirius:{name:'Syriusz',ra:101.2872,dec:-16.7161,magnitude:-1.46},
 carina:{name:'Kosmiczne Klify / NGC 3324',ra:159.3,dec:-58.62,magnitude:9.0}
};
var places={gdansk:[54.35,18.65],warsaw:[52.23,21.01],krakow:[50.06,19.94],cape:[-33.93,18.42],sydney:[-33.87,151.21],equator:[0,0]};
window.ATLAS_NO18_PHYSICS={julianDay:jd,gmstDegrees:gmstDegrees,localSiderealDegrees:localSiderealDegrees,
 position:position,sunEquatorial:sunEquatorial,sunAltitudeDegrees:sunAltitudeDegrees,
 darkness:darkness,targets:targets,places:places};
function init(){
 var canvas=document.getElementById('no18Canvas'),ctx=canvas&&canvas.getContext&&canvas.getContext('2d');
 if(!ctx)return;
 var o=document.getElementById('no18Object'),place=document.getElementById('no18Place'),
 latInput=document.getElementById('no18Lat'),lonInput=document.getElementById('no18Lon'),
 dateInput=document.getElementById('no18Date'),timeInput=document.getElementById('no18Time'),
 motion=document.getElementById('no18Motion'),now=document.getElementById('no18Now'),reset=document.getElementById('no18Reset');
 if(!o||!place||!latInput||!lonInput||!dateInput||!timeInput)return;
 var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 var running=!reduce,visible=false,frame=0,last=0,phase=0,cache=null;
 var stars=[];
 function pseudo(i){var x=Math.sin(i*113.125+49.32)*43758.5453;return x-Math.floor(x);}
 for(var j=0;j<190;j++)stars.push({x:pseudo(j+1),y:pseudo(j+287),r:.24+pseudo(j+482)*1.5,a:.16+pseudo(j+750)*.63});
 function put(id,text){var el=document.getElementById(id);if(el)el.textContent=text;}
 function fmt(x,d){return Number(x).toLocaleString('pl-PL',{minimumFractionDigits:d,maximumFractionDigits:d});}
 function parseWhen(){
  var ds=dateInput.value,ts=timeInput.value;
  if(!/^\d{4}-\d\d-\d\d$/.test(ds)||!/^\d\d:\d\d$/.test(ts))return null;
  var parts=ds.split('-').map(Number),t=ts.split(':').map(Number);
  var d=new Date(parts[0],parts[1]-1,parts[2],t[0],t[1],0,0);
  return Number.isFinite(d.getTime())?d:null;
 }
 function params(){
  var t=parseWhen(),lat=Number(latInput.value),lon=Number(lonInput.value),tar=targets[o.value];
  if(!t||!tar)return null;
  var p=position(t,lat,lon,tar.ra,tar.dec),sun=sunAltitudeDegrees(t,lat,lon);
  return {when:t,lat:lat,lon:lon,target:tar,p:p,sunAlt:sun,objectId:o.value};
 }
 function azCardinal(deg){
  var d=['N','NE','E','SE','S','SW','W','NW'];return d[Math.round(norm(deg)/45)%8];
 }
 function axisDegrees(deg,type){
  if(deg===0)return '0,00°';
  return fmt(Math.abs(deg),2)+'° '+(deg>0?(type==='lat'?'N':'E'):(type==='lat'?'S':'W'));
 }
 function refresh(){
  var x=params();if(!x)return;
  put('no18LatOut',axisDegrees(x.lat,'lat'));put('no18LonOut',axisDegrees(x.lon,'lon'));
  put('no18Altitude',fmt(x.p.altitudeDeg,1)+'°');
  put('no18Azimuth',fmt(x.p.azimuthDeg,1)+'° '+azCardinal(x.p.azimuthDeg));
  put('no18Sun',fmt(x.sunAlt,1)+'°');
  var hour=x.p.lstDeg/15;put('no18Lst',fmt(hour,2)+' h');
  var warn=document.getElementById('no18Feedback');if(warn){
   var height=x.p.altitudeDeg,good=height>30? 'Obiekt jest wysoko nad horyzontem.':height>15?'Obiekt jest ponad horyzontem, ale umiarkowanie nisko.':height>0?'Obiekt znajduje się nisko nad horyzontem.':'Obiekt znajduje się pod matematycznym horyzontem.';
   var night=darkness(x.sunAlt),dark=x.sunAlt<=-18;
   warn.classList.toggle('is-below',height<=0);
   warn.textContent=x.target.name+': '+good+' '+night+'. '+(height>0&&dark?'Geometrycznie jest to dobra pora na próbę obserwacji — jeśli pozwolą warunki, jasność obiektu i pogoda.':'Sprawdź inną godzinę, datę albo lokalizację, pamiętając o przeszkodach, jasności obiektu i pogodzie.');
  }
  cache=null;draw();
 }
 function updateCoord(){
  if(place.value!=='custom')place.value='custom';
  refresh();
 }
 function selectPlace(){
  var p=places[place.value];
  if(p){latInput.value=String(p[0]);lonInput.value=String(p[1]);}
  refresh();
 }
 function setNow(){
  var d=new Date(),pad=n=>String(n).padStart(2,'0');
  dateInput.value=d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
  timeInput.value=pad(d.getHours())+':'+pad(d.getMinutes());refresh();
 }
 function resetAll(){
  o.value='m31';place.value='gdansk';latInput.value='54.35';lonInput.value='18.65';dateInput.value='2026-11-22';timeInput.value='20:00';phase=0;refresh();
 }
 function circle(x,y,r,fill){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();}
 function line(x1,y1,x2,y2,color,width){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
 function getSeries(x){
  var rows=[],time=x.when.getTime(),six=6*3600000;
  for(var i=0;i<=144;i++){
   var z=new Date(time-six+i*(12*3600000/144));
   var p=position(z,x.lat,x.lon,x.target.ra,x.target.dec);
   rows.push({object:p.altitudeDeg,sun:sunAltitudeDegrees(z,x.lat,x.lon),date:z.getTime()});
  }
  return rows;
 }
 function draw(){
  var w=canvas.clientWidth||760,h=canvas.clientHeight||680;if(w<20||h<20)return;
  var dpr=Math.min(1.7,window.devicePixelRatio||1);if(w*dpr>1650)dpr=1650/w;
  var cw=Math.max(1,Math.round(w*dpr)),ch=Math.max(1,Math.round(h*dpr));
  if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw;canvas.height=ch;}
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  var bg=ctx.createRadialGradient(w*.57,h*.22,0,w*.5,h*.49,Math.max(w,h)*.78);
  bg.addColorStop(0,'#173b44');bg.addColorStop(.6,'#0c2636');bg.addColorStop(1,'#060e1c');
  ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
  stars.forEach(function(s){circle(s.x*w,s.y*h,s.r,'rgba(220,246,243,'+s.a+')');});
  var x=params();if(!x)return;
  var compact=w<520;
  var topHeight=h*.53,cx=w*.5,cy=topHeight*.50,r=Math.min(w*.32,topHeight*.38);
  ctx.textAlign='center';ctx.font='700 10px Arial,sans-serif';ctx.fillStyle='#add7d1';
  ctx.fillText('WYBRANE OBIEKTY / RZUT NA NIEBOSKŁON',cx,Math.max(62,cy-r-28));
  for(var elevation=0;elevation<=60;elevation+=30){
   var rad=r*(90-elevation)/90;
   ctx.strokeStyle=elevation===0?'rgba(157,233,215,.68)':'rgba(112,172,173,.24)';
   ctx.lineWidth=elevation===0?1.5:1;ctx.beginPath();ctx.arc(cx,cy,rad,0,2*Math.PI);ctx.stroke();
  }
  var dirs=[['N',0],['E',90],['S',180],['W',270]];
  dirs.forEach(function(item){var a=item[1]*D2R;
   ctx.fillStyle='#bedfd9';ctx.font='700 11px Arial,sans-serif';
   ctx.fillText(item[0],cx+Math.sin(a)*(r+20),cy-Math.cos(a)*(r+20)+4);
  });
  line(cx-r,cy,cx+r,cy,'rgba(139,193,197,.20)',1);
  line(cx,cy-r,cx,cy+r,'rgba(139,193,197,.20)',1);
  var points=[];
  Object.keys(targets).forEach(function(id){
   var t=targets[id],p=position(x.when,x.lat,x.lon,t.ra,t.dec);
   if(p.altitudeDeg<0)return;
   var theta=p.azimuthDeg*D2R,distance=(90-p.altitudeDeg)/90*r;
   points.push({id:id,x:cx+Math.sin(theta)*distance,y:cy-Math.cos(theta)*distance,p:p});
  });
  points.forEach(function(pt){
   if(pt.id===x.objectId)return;
   circle(pt.x,pt.y,2.4,'rgba(235,244,225,.72)');
  });
  var selected=points.find(function(pt){return pt.id===x.objectId;});
  if(selected){
   var g=ctx.createRadialGradient(selected.x,selected.y,0,selected.x,selected.y,27);
   g.addColorStop(0,'rgba(199,254,234,.36)');g.addColorStop(1,'rgba(167,237,220,0)');
   circle(selected.x,selected.y,27,g);
   circle(selected.x,selected.y,6.6,'#f2ebd7');
   ctx.strokeStyle='#c5f9eb';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(selected.x,selected.y,11,0,Math.PI*2);ctx.stroke();
  }
  ctx.font='10px Arial,sans-serif';ctx.fillStyle='#d2e8dd';ctx.textAlign='center';
  ctx.fillText(selected?'CEL: '+x.target.name:'CEL JEST PONIŻEJ HORYZONTU',w*.5,topHeight-18);
  var left=compact?42:58,right=w-(compact?18:28),top=topHeight+37,bottom=h-73;
  var graphH=bottom-top;
  ctx.fillStyle='rgba(6,23,35,.62)';ctx.fillRect(left-25,top-25,right-left+35,graphH+39);
  ctx.font='700 10px Arial,sans-serif';ctx.fillStyle='#b4d9d5';ctx.textAlign='left';
  ctx.fillText('WYSOKOŚĆ W CIĄGU 12 GODZIN',left-17,top-8);
  var minAlt=-35,maxAlt=90;
  function yPos(a){return top+graphH*(maxAlt-a)/(maxAlt-minAlt);}
  for(var tick=-30;tick<=90;tick+=30){
   var yy=yPos(tick);line(left,yy,right,yy,tick===0?'rgba(216,243,229,.71)':'rgba(111,157,168,.30)',tick===0?1.4:.8);
   ctx.font='10px Arial,sans-serif';ctx.fillStyle='#91b9bd';ctx.textAlign='right';
   ctx.fillText(tick+'°',left-8,yy+3);
  }
  for(var step=0;step<=4;step++){
   var xx=left+(right-left)*step/4;ctx.fillStyle='#9cbec5';ctx.textAlign='center';ctx.font='10px Arial,sans-serif';
   ctx.fillText((step*3-6)+'h',xx,bottom+22);
  }
  if(!cache||cache.time!==x.when.getTime()||cache.obj!==x.objectId||cache.lat!==x.lat||cache.lon!==x.lon){
   cache={time:x.when.getTime(),obj:x.objectId,lat:x.lat,lon:x.lon,rows:getSeries(x)};
  }
  var rows=cache.rows;
  ctx.save();ctx.beginPath();ctx.rect(left,top,right-left,graphH);ctx.clip();
  for(var i=0;i<=144;i++){
   var shadow=rows[i].sun<-18;
   if(shadow){ctx.fillStyle='rgba(118,214,196,.07)';ctx.fillRect(left+(right-left)*(i/144),top,(right-left)/144+1,graphH);}
  }
  function trace(key,color,width){
   ctx.beginPath();rows.forEach(function(z,i){
    var xx=left+(right-left)*i/144,yy=yPos(z[key]);
    if(i===0)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy);
   });ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();
  }
  trace('sun','rgba(242,192,157,.67)',1.7);
  trace('object','#bff4e8',2.9);
  var markerT=(phase%1),at=Math.min(144,Math.max(0,Math.round(markerT*144)));
  var lineX=left+(right-left)*markerT;
  ctx.setLineDash([4,6]);line(lineX,top,lineX,bottom,'rgba(223,248,228,.42)',1);ctx.setLineDash([]);
  circle(lineX,yPos(rows[at].object),4.8,'#f6f3d7');
  ctx.restore();
  ctx.font='10px Arial,sans-serif';ctx.textAlign='center';ctx.fillStyle='#b8d2cb';
  ctx.fillText('MIĘTOWA: OBIEKT  ·  MORELOWA: SŁOŃCE  ·  ZACIENIENIE: NOC ASTRONOMICZNA',w*.5,h-33);
 }
 function stop(){if(frame&&window.cancelAnimationFrame)window.cancelAnimationFrame(frame);frame=0;last=0;}
 function schedule(){if(frame||!running||!visible||document.hidden||!window.requestAnimationFrame)return;frame=window.requestAnimationFrame(tick);}
 function tick(t){frame=0;if(!running||!visible||document.hidden)return;if(t-last>=48){phase+=last?Math.min(.025,(t-last)/1000)/14:.003;last=t;draw();}schedule();}
 function updateMotion(){if(motion){motion.textContent=running?'Ⅱ Zatrzymaj ruch':'▶ Uruchom ruch';motion.setAttribute('aria-pressed',String(!running));}if(running)schedule();else stop();}
 o.addEventListener('change',refresh);place.addEventListener('change',selectPlace);
 latInput.addEventListener('input',updateCoord);lonInput.addEventListener('input',updateCoord);
 dateInput.addEventListener('change',refresh);timeInput.addEventListener('change',refresh);
 if(now)now.addEventListener('click',setNow);
 if(reset)reset.addEventListener('click',resetAll);
 if(motion)motion.addEventListener('click',function(){running=!running;updateMotion();draw();});
 window.addEventListener('resize',draw);
 document.addEventListener('visibilitychange',function(){if(document.hidden)stop();else{draw();schedule();}});
 window.addEventListener('pagehide',stop);
 if(window.IntersectionObserver){
  var observer=new IntersectionObserver(function(items){visible=!!(items[0]&&items[0].isIntersecting);if(visible){draw();schedule();}else stop();},{threshold:.03});
  observer.observe(document.getElementById('no18LabFrame')||canvas);
 }else{visible=true;schedule();}
 var tz=document.getElementById('no18Timezone');
 if(tz&&window.Intl&&Intl.DateTimeFormat){try{
  var zone=Intl.DateTimeFormat().resolvedOptions().timeZone;
  if(zone)tz.textContent='Czas lokalny urządzenia: '+zone+'. Zmiana miejscowości nie zmienia strefy czasu. Przy innych strefach przelicz godzinę ręcznie.';
 }catch(e){}}
 refresh();updateMotion();draw();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
