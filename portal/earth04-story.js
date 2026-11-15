/* ATLAS SOLARIS 04.1 — small, static solar geometry observatory.
   Uses the geometrical hour-angle equation for an ideal spherical Earth,
   point-like Sun and four idealized seasons. No timers, canvas or GPU. */
(() => {
 'use strict';
 const latitude=document.getElementById('e4Latitude');
 const buttons=[...document.querySelectorAll('.e4-season-options button[data-decl]')];
 const altitude=document.getElementById('e4SolarAlt');
 const daylight=document.getElementById('e4DayLength');
 const altitudeNote=document.getElementById('e4SolarAltComment');
 const daylightNote=document.getElementById('e4DayComment');
 const name=document.getElementById('e4SeasonName');
 const strip=document.getElementById('e4DayStrip');
 const geometryNote=document.getElementById('e4GeometryNote');
 if(!latitude||!buttons.length||!altitude||!daylight||!strip)return;
 const radians=degrees=>degrees*Math.PI/180;
 const format=new Intl.NumberFormat('pl-PL',{minimumFractionDigits:1,maximumFractionDigits:1});
 function solarGeometry(latitudeDegrees,declinationDegrees){
  const solarNoonAltitude=90-Math.abs(latitudeDegrees-declinationDegrees);
  const cosH=-Math.tan(radians(latitudeDegrees))*Math.tan(radians(declinationDegrees));
  const daylightHours=cosH>=1?0:cosH<=-1?24:24*Math.acos(cosH)/Math.PI;
  return {solarNoonAltitude,daylightHours};
 }
 function timeLabel(hours){
  const minutes=Math.max(0,Math.min(1440,Math.round(hours*60)));
  const h=Math.floor(minutes/60),m=minutes%60;
  return h+' h '+String(m).padStart(2,'0')+' min';
 }
 let active=buttons.find(button=>button.getAttribute('aria-pressed')==='true')||buttons[0];
 function render(){
  const phi=Number(latitude.value),delta=Number(active.dataset.decl);
  if(!Number.isFinite(phi)||!Number.isFinite(delta)||Math.abs(phi)>90||Math.abs(delta)>23.45)return;
  const data=solarGeometry(phi,delta);
  altitude.textContent=format.format(data.solarNoonAltitude)+'°';
  daylight.textContent=timeLabel(data.daylightHours);
  if(data.daylightHours<=0){
   altitudeNote.textContent='Słońce poniżej horyzontu';
   daylightNote.textContent='Noc polarna — brak geometrycznego wschodu';
  }else if(data.daylightHours>=24){
   altitudeNote.textContent='Słońce nad horyzontem';
   daylightNote.textContent='Dzień polarny — brak geometrycznego zachodu';
  }else{
   altitudeNote.textContent='Słońce '+(data.solarNoonAltitude>0?'nad':'poniżej')+' horyzontem';
   daylightNote.textContent='Od geometrycznego wschodu do zachodu';
  }
  name.textContent=active.dataset.name||'Sezon';
  strip.style.setProperty('--daypct',(data.daylightHours/24*100).toFixed(3)+'%');
  strip.setAttribute('aria-label','Dzień '+timeLabel(data.daylightHours)+', noc '+timeLabel(24-data.daylightHours));
  geometryNote.textContent='Szerokość '+format.format(Math.abs(phi))+'° '+(phi<0?'S':phi>0?'N':'— równik')+', deklinacja '+format.format(delta)+'°. Model bez refrakcji i terenu.';
  for(const button of buttons)button.setAttribute('aria-pressed',String(button===active));
 }
 latitude.addEventListener('change',render);
 for(const button of buttons)button.addEventListener('click',()=>{active=button;render()});
 render();
})();
