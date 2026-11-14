/**
 * ATLAS SOLARIS 18.1 — telescope object classifications and night search.
 * All times in Julian Day UTC approximation. Sampling resolution is explicit.
 * Moon penalty is heuristic, not a sky-brightness or weather prediction.
 */
(function(root){
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const typeNames={
 s:'galaktyka spiralna',e:'galaktyka eliptyczna',s0:'galaktyka soczewkowata',
 sd:'galaktyka karłowata',i:'galaktyka nieregularna',g:'galaktyka',
 oc:'gromada otwarta',gc:'gromada kulista',bn:'mgławica jasna',
 en:'mgławica emisyjna',rn:'mgławica refleksyjna',dn:'mgławica ciemna',
 pn:'mgławica planetarna',snr:'pozostałość po supernowej',
 sfr:'obszar gwiazdotwórczy',unknown:'obiekt głębokiego nieba'
};
function normalize(value){
 return String(value||'').toLocaleLowerCase('pl-PL')
  .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .replace(/ł/g,'l').replace(/\s+/g,' ').trim();
}
function matching(target,query){
 const term=normalize(query);
 if(!term)return true;
 return normalize([target.id,target.name,target.ngc,target.other,target.type].join(' ')).includes(term);
}
function moonPenalty(illumination,alt){
 if(!Number.isFinite(illumination)||!Number.isFinite(alt))return 0;
 return alt>0 ? clamp(illumination,0,1)*30 : 0;
}
function scoreSample({sunAltitude,targetAltitude,moonAltitude,moonIllumination}){
 if(!Number.isFinite(sunAltitude)||!Number.isFinite(targetAltitude))return null;
 if(sunAltitude > -18||targetAltitude < 20)return null;
 const penalty=moonPenalty(moonIllumination,moonAltitude);
 // High elevation improves geometry; a bright Moon above horizon hurts
 // deep-sky observation. This remains a simple educational preference.
 const score=targetAltitude-penalty;
 return {score,moonPenalty:penalty};
}
function scanNight({startJD,sample,stepHours=1}){
 if(!Number.isFinite(startJD)||typeof sample!=='function'||stepHours<.25||stepHours>3||24%stepHours!==0)
  throw new RangeError('Nieprawidłowe parametry nocy.');
 let best=null,darkSamples=0,above20=0;
 for(let hour=0;hour<=24;hour+=stepHours){
  const jd=startJD+hour/24,at=sample(jd);
  if(!at||!Number.isFinite(at.sunAltitude)||!Number.isFinite(at.targetAltitude))
   throw new TypeError('Brak kompletnej pozycji nieba.');
  if(at.sunAltitude<=-18)darkSamples++;
  if(at.targetAltitude>=20)above20++;
  const score=scoreSample(at);
  if(score&&(!best||score.score>best.score)){
   best={jd,altitude:at.targetAltitude,moonAltitude:at.moonAltitude,
    moonIllumination:at.moonIllumination,score:score.score,penalty:score.moonPenalty,
    sunAltitude:at.sunAltitude};
  }
 }
 return {startJD,best,hasAstronomicalNight:darkSamples>0,
  darkSamples,above20,samplingHours:stepHours};
}
function rankNights(nights){
 if(!Array.isArray(nights))throw new TypeError('Wymagana tabela nocy.');
 return [...nights].filter(n=>n&&n.best).sort((a,b)=>
  b.best.score-a.best.score || a.best.jd-b.best.jd);
}
function approximateSizeArcmin(dim){
 if(typeof dim!=='string'||!dim)return null;
 const a=/^(\d+(?:\.\d+)?)/.exec(dim);
 return a?Number(a[1]):null;
}
root.ATLAS_OBS181_CORE=Object.freeze({
 normalize,matching,moonPenalty,scoreSample,scanNight,rankNights,
 approximateSizeArcmin,typeNames
});
if(typeof module!=='undefined'&&module.exports)module.exports=root.ATLAS_OBS181_CORE;
})(typeof window!=='undefined'?window:globalThis);
