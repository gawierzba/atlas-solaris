/* ATLAS SOLARIS 06 — geometric observer's sky compass.
   Lightweight DOM/SVG only: no timers, WebGL, canvas, network or animation.
   Coordinates: approximately ICRS/J2000 declinations. Hour angle is relative
   to upper transit, NOT civil/local time; no date or sidereal time is inferred.
   Azimuth convention: North=0°, East=90°, South=180°, West=270°. */
(() => {
 'use strict';
 const STARS=Object.freeze({
  polaris:{name:'Polarna',dec:89.2641},
  vega:{name:'Wega',dec:38.7837},
  sirius:{name:'Syriusz',dec:-16.7161},
  canopus:{name:'Kanopus',dec:-52.6957}
 });
 const latitude=document.getElementById('s6Latitude'),select=document.getElementById('s6Star'),hour=document.getElementById('s6Hour');
 const hourOut=document.getElementById('s6HourOut'),altOutput=document.getElementById('s6Altitude'),azOutput=document.getElementById('s6Azimuth');
 const status=document.getElementById('s6Status'),dot=document.getElementById('s6StarDot'),halo=document.getElementById('s6StarHalo');
 const track=document.getElementById('s6Track'),group=document.getElementById('s6StarGroup'),map=document.getElementById('s6SkyMap');
 const presets=[...document.querySelectorAll('.s6-shortcuts button[data-preset]')];
 if(!latitude||!select||!hour||!altOutput||!azOutput||!dot||!track)return;
 const pi=Math.PI,rad=angle=>angle*pi/180,deg=angle=>angle*180/pi;
 const clamp=x=>Math.max(-1,Math.min(1,x));
 const fmt=new Intl.NumberFormat('pl-PL',{minimumFractionDigits:1,maximumFractionDigits:1});
 function horizontal(lat,dec,angleHours){
  const phi=rad(lat),delta=rad(dec),H=rad(angleHours*15);
  const east=-Math.cos(delta)*Math.sin(H);
  const north=Math.sin(delta)*Math.cos(phi)-Math.cos(delta)*Math.cos(H)*Math.sin(phi);
  const up=Math.sin(delta)*Math.sin(phi)+Math.cos(delta)*Math.cos(phi)*Math.cos(H);
  const altitude=deg(Math.asin(clamp(up)));
  const azimuth=Math.hypot(east,north)<1e-9?null:(deg(Math.atan2(east,north))+360)%360;
  return {altitude,azimuth};
 }
 function project(coord){
  if(coord.azimuth===null)return{x:300,y:246};
  const rho=(90-coord.altitude)*2;
  return{x:300+rho*Math.sin(rad(coord.azimuth)),y:246-rho*Math.cos(rad(coord.azimuth))};
 }
 function orbitTrack(lat,dec){
  let d='',active=false;
  for(let k=0;k<=288;k++){
   const H=-12+k/12;
   const c=horizontal(lat,dec,H);
   if(c.altitude<0){active=false;continue}
   const p=project(c);
   d+=(active?' L':'M')+p.x.toFixed(2)+' '+p.y.toFixed(2);
   active=true;
  }
  return d;
 }
 function nameOfHorizon(lat){
  if(lat>0)return 'północnym';if(lat<0)return 'południowym';
  return 'lokalnym';
 }
 function update(){
  const phi=Number(latitude.value),star=STARS[select.value],H=Number(hour.value);
  if(!star||!Number.isFinite(phi)||!Number.isFinite(H))return;
  const current=horizontal(phi,star.dec,H);
  const upper=horizontal(phi,star.dec,0).altitude;
  const lower=horizontal(phi,star.dec,12).altitude;
  hourOut.textContent=(H>0?'+':'')+String(H).replace('.',',')+' h';
  altOutput.textContent=fmt.format(current.altitude)+'°';
  azOutput.textContent=current.azimuth===null?'—':fmt.format(current.azimuth)+'°';
  const visible=current.altitude>=0;
  group.style.display=visible?'':'none';
  if(visible){
   const p=project(current);
   dot.setAttribute('cx',p.x.toFixed(2));dot.setAttribute('cy',p.y.toFixed(2));
   halo.setAttribute('cx',p.x.toFixed(2));halo.setAttribute('cy',p.y.toFixed(2));
  }
  track.setAttribute('d',orbitTrack(phi,star.dec));
  const header=status.querySelector('strong'),paragraph=status.querySelector('p');
  let summary,body;
  if(upper<-.000001){
   summary='NIGDY NIE WSCHODZI';
   body=star.name+' przy tej szerokości geograficznej pozostaje poniżej idealnego horyzontu przez całą dobę gwiazdową.';
  }else if(lower>.000001){
   summary='GWIAZDA OKOŁOBIEGUNOWA';
   body=star.name+' przy tej szerokości geograficznej nie schodzi poniżej idealnego horyzontu. Najniższa wysokość: '+fmt.format(lower)+'°.';
  }else{
   summary=visible?'OBECNIE NAD HORYZONTEM':'OBECNIE POD HORYZONTEM';
   body=star.name+' w tym miejscu wschodzi i zachodzi geometrycznie. Najwyższa wysokość: '+fmt.format(upper)+'°.';
  }
  header.textContent=summary;
  paragraph.textContent=body;
  status.dataset.visible=String(visible);
  if(map)map.setAttribute('aria-label',star.name+' na szerokości '+fmt.format(Math.abs(phi))+'° '+(phi>=0?'N':'S')+', kąt godzinny '+H+' h. Wysokość '+fmt.format(current.altitude)+'°, azymut '+(current.azimuth===null?'nieokreślony':fmt.format(current.azimuth)+'°')+'. '+(visible?'Nad horyzontem.':'Pod horyzontem.'));
 }
 latitude.addEventListener('change',update);
 select.addEventListener('change',update);
 hour.addEventListener('input',update,{passive:true});
 for(const button of presets)button.addEventListener('click',()=>{
  if(button.dataset.preset==='south'){latitude.value='-33.87';select.value='polaris'}
  else{latitude.value='54.35';select.value=button.dataset.preset}
  hour.value='0';update();
 });
 update();
})();
