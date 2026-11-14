/**
 * ATLAS SOLARIS 18.0 — a deterministic, offline observing-night planner.
 * 24h window from a selected UTC moment. The caller provides topocentric
 * positions from the atlas's own JPL/HYG astronomy engine.
 *
 * Astronomical twilight is -18°, nautical -12°, civil -6° (geometric Sun).
 * No weather, seeing, refraction, terrain, air mass or moonlight photometry.
 */
(function(root){
'use strict';
const DAY=1, MINUTES=1440;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function darkness(sunAltitude){
 if(!Number.isFinite(sunAltitude))return 'unknown';
 if(sunAltitude>=0)return 'day';
 if(sunAltitude> -6)return 'civil';
 if(sunAltitude> -12)return 'nautical';
 if(sunAltitude> -18)return 'astronomical';
 return 'night';
}
function rank(record,target){
 const alt=target?.altitude;
 if(!Number.isFinite(alt)||alt<0)return -Infinity;
 const phase=darkness(record.sunAltitude);
 const darkWeight={night:3,astronomical:2,nautical:1,civil:0,day:-2}[phase]??-2;
 const safeAlt=clamp(alt,0,90);
 // Preference for darkness is intentional: good elevation at noon is not a night target.
 return darkWeight*110+safeAlt-(target.kind==='star'?Math.max(0,target.mag||0)*1.6:0);
}
function plan({startJD,hours=24,stepMinutes=20,sample}){
 if(!Number.isFinite(startJD)||typeof sample!=='function'||
    !(hours>=1&&hours<=48)||!(stepMinutes>=5&&stepMinutes<=60))
  throw new RangeError('Nieprawidłowe parametry planu obserwacji.');
 const n=Math.ceil(hours*60/stepMinutes),records=[];
 const best=new Map(),allTargets=new Map();
 for(let i=0;i<=n;i++){
  const offset=Math.min(i*stepMinutes,hours*60),jd=startJD+offset/MINUTES;
  const value=sample(jd);
  if(!value||!Number.isFinite(value.sunAltitude)||!Array.isArray(value.targets))
   throw new TypeError('Nieprawidłowa efemeryda obserwatorium.');
  const record={jd,offsetMinutes:offset,sunAltitude:value.sunAltitude,
   moonAltitude:value.moonAltitude??null,moonIllumination:value.moonIllumination??null,
   phase:darkness(value.sunAltitude),targetCount:value.targets.length,
   targets:value.targets};
  records.push(record);
  for(const target of value.targets){
   if(!target||typeof target.id!=='string'||!Number.isFinite(target.altitude))continue;
   allTargets.set(target.id,{id:target.id,name:target.name||target.id,
    kind:target.kind||'body',mag:target.mag??null});
   const score=rank(record,target),prev=best.get(target.id);
   if(!prev||score>prev.score){
    best.set(target.id,{
     id:target.id,name:target.name||target.id,kind:target.kind||'body',
     mag:target.mag??null,altitude:target.altitude,azimuth:target.azimuth??null,
     jd,score,phase:record.phase
    });
   }
  }
 }
 const windows=[];let started=null;
 for(let i=0;i<records.length;i++){
  const r=records[i],dark=r.sunAltitude<=-18;
  if(dark&&started===null)started=r.jd;
  if((!dark||i===records.length-1)&&started!==null){
   windows.push({startJD:started,endJD:dark&&i===records.length-1?r.jd:r.jd});
   started=null;
  }
 }
 // "Good observing" means at least nautical darkness and target elevation >=15°.
 const targets=[...allTargets.values()].map(t=>{
  const b=best.get(t.id),suitable=b&&b.altitude>=15&&
   (b.phase==='night'||b.phase==='astronomical');
  const quality=!b||b.altitude<0?'below':suitable?
    (b.phase==='night'&&b.altitude>=30?'very-good':'good'):
    b.altitude>=15?'twilight-or-day':'low';
  return {...t,best:b||null,quality,score:b?.score??-Infinity};
 }).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name,'pl'));
 const minSun=Math.min(...records.map(r=>r.sunAltitude));
 const maxSun=Math.max(...records.map(r=>r.sunAltitude));
 return {startJD,endJD:startJD+hours/24,records,targets,
  windows,hasAstronomicalNight:windows.some(w=>w.endJD>w.startJD),
  minSunAltitude:minSun,maxSunAltitude:maxSun,
  astronomicalDarkHours:windows.reduce((sum,w)=>sum+(w.endJD-w.startJD)*24,0),
  sampleMinutes:stepMinutes,
  limitations:'UTC; Słońce geometryczne; bez pogody, refrakcji i przeszkód terenowych.'};
}
function instantDescription(sunAltitude){
 switch(darkness(sunAltitude)){
  case 'night':return 'Noc astronomiczna';
  case 'astronomical':return 'Zmierzch astronomiczny';
  case 'nautical':return 'Zmierzch żeglarski';
  case 'civil':return 'Zmierzch cywilny';
  case 'day':return 'Dzień';
  default:return 'Brak danych';
 }
}
function nearestNight(recordJD,planModel){
 if(!planModel||!planModel.records?.length)return null;
 const dark=planModel.records.filter(x=>x.phase==='night');
 if(!dark.length)return null;
 return dark.reduce((a,b)=>Math.abs(a.jd-recordJD)<=Math.abs(b.jd-recordJD)?a:b).jd;
}
root.ATLAS_OBSERVATORY18_CORE=Object.freeze({darkness,plan,rank,instantDescription,nearestNight});
if(typeof module!=='undefined'&&module.exports)module.exports=root.ATLAS_OBSERVATORY18_CORE;
})(typeof window!=='undefined'?window:globalThis);
