/**
 * ATLAS SOLARIS 17.1 — calendar search from the physical eclipse engine.
 * A search checks each new/full Moon, rather than blindly inspecting every
 * hour of the year. Times are approximate, not NASA contact predictions.
 * Dependency injection makes this module testable without DOM or network.
 */
(function(root){
'use strict';
const JD_UNIX=2440587.5,DAY_MS=86400000;
const toJD=date=>date.getTime()/DAY_MS+JD_UNIX;
const fromJD=jd=>new Date((jd-JD_UNIX)*DAY_MS).toISOString();
const validYear=y=>Number.isInteger(y)&&y>=2024&&y<=2040;
const tick=()=>new Promise(resolve=>{
 if(typeof requestAnimationFrame==='function')requestAnimationFrame(resolve);
 else setTimeout(resolve,0);
});
const subtypeOrder={penumbral:1,partial:2,annular:3,total:4,hybrid:5};
/** Maximize the depth of penumbral penetration without computing local visibility. */
function refinePeak(engine,type,around,minutes=30){
 let a=around-minutes/1440,b=around+minutes/1440;
 const score=jd=>engine.at(jd,{includeNode:false}).shadow[type].penetrationKm.penumbra;
 for(let i=0;i<35;i++){
  const x=a+(b-a)*.3819660112501051,y=a+(b-a)*.6180339887498949;
  if(score(x)<score(y))a=x;else b=y;
 }
 return (a+b)*.5;
}
function createFinder(engine){
 if(!engine||typeof engine.findAlignments!=='function'||typeof engine.scanEclipses!=='function')throw new TypeError('Wymagany silnik ATLAS SOLARIS 17.');
 /**
  * month 0 means whole year; type 'all', 'solar' or 'lunar'.
  * onProgress receives {done,total,found}, isCancelled aborts work.
  */
 async function search({year,month=0,type='all',onProgress=()=>{},isCancelled=()=>false}){
  year=Number(year);month=Number(month);
  if(!validYear(year)||!Number.isInteger(month)||month<0||month>12||!['all','solar','lunar'].includes(type))
   throw new RangeError('Kalendarz dostępny dla lat 2024–2040.');
  const start=new Date(Date.UTC(year,month?month-1:0,1));
  const end=new Date(Date.UTC(year,month||12,1));
  const jdStart=toJD(start),jdEnd=toJD(end);
  const periods=[];
  for(let d=new Date(start);d<end;d.setUTCMonth(d.getUTCMonth()+1)){
   const next=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,1));
   periods.push({start:toJD(d)-2,end:toJD(next)+2});
  }
  const unique=new Map(),events=[];
  for(let i=0;i<periods.length;i++){
   if(isCancelled())return null;
   const {start:a,end:b}=periods[i];
   const syzygies=engine.findAlignments(a,b,.5).filter(x=>x.category==='syzygy');
   for(const s of syzygies){
    if(isCancelled())return null;
    if(type!=='all'&&(s.kind==='new'?'solar':'lunar')!==type)continue;
    const id=s.kind+'-'+Math.round(s.julianDate*48);
    if(unique.has(id))continue;
    unique.set(id,true);
    // Wide safety cut: for eclipses the Moon must be relatively near the ecliptic.
    const alignment=engine.at(s.julianDate,{includeNode:false}).alignment;
    if(Math.abs(alignment.lunarEclipticLatitudeDeg)>2.75)continue;
    const found=engine.scanEclipses(s.julianDate-1.25,s.julianDate+1.25,.25);
    for(const item of found){
     if(item.type!==(s.kind==='new'?'solar':'lunar'))continue;
     const peakJD=refinePeak(engine,item.type,item.approximatePeakJD,16);
     if(peakJD<jdStart||peakJD>=jdEnd)continue;
     const peak=engine.at(peakJD);
     // Sampled peak may be partial while another moment has the deepest kind.
     const subtypes=new Set([item.subtype,peak.subtype]);
     const subtype=item.type==='solar'&&subtypes.has('annular')&&subtypes.has('total')?'hybrid':
       [...subtypes].sort((a,b)=>(subtypeOrder[b]||0)-(subtypeOrder[a]||0))[0];
     const id=item.type+'-'+fromJD(peakJD).slice(0,10);
     if(events.some(e=>Math.abs(e.approximatePeakJD-peakJD)<.5&&e.type===item.type))continue;
     events.push({id,type:item.type,subtype,approximatePeakJD:peakJD,
      approximatePeakUTC:fromJD(peakJD),sampleFirstUTC:item.startUTC,sampleLastUTC:item.endUTC,
      lunarLatitudeDeg:peak.alignment.lunarEclipticLatitudeDeg,
      node:peak.alignment.nearestNode,
      moonDistanceKm:peak.bodies.distancesKm.earthMoon});
    }
   }
   events.sort((a,b)=>a.approximatePeakJD-b.approximatePeakJD);
   onProgress({done:i+1,total:periods.length,found:events.length});
   await tick();
  }
  return {year,month,type,events,source:'geometric-model',
   limitations:'Czasy orientacyjne, klasyfikacja globalna. Zjawiska brzegowe mogą odbiegać od NASA.'};
 }
 return Object.freeze({search});
}
root.AtlasSolarisCalendarSearch=Object.freeze({createFinder,refinePeak});
if(typeof module!=='undefined'&&module.exports)module.exports=root.AtlasSolarisCalendarSearch;
})(typeof window!=='undefined'?window:globalThis);
