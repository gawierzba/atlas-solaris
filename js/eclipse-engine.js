/**
 * ATLAS SOLARIS 17.0 — eclipse geometry, independent of graphics scale.
 * Positions are heliocentric J2000 ecliptic vectors in AU.
 * No local contact times or atmospheric enlargement are inferred here.
 */
(function(root){
'use strict';
const AU=149597870.7,RAD=180/Math.PI;
const len=v=>Math.hypot(...v);
const sub=(a,b)=>a.map((x,i)=>x-b[i]);
const mul=(a,k)=>a.map(x=>x*k);
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const unit=v=>mul(v,1/len(v));
const bound=(x,a,b)=>Math.max(a,Math.min(b,x));
const wrap=a=>((a%360)+360)%360;
const signed=a=>wrap(a+180)-180;
const stamp=jd=>new Date((jd-2440587.5)*86400000).toISOString();
/** Intersection of finite cone segment with a spherical surface. */
function coneHitsSphere(offset,radius,xCenter,xMin,xMax,r0,slope){
 const lo=Math.max(0,xMin,xCenter-radius),hi=Math.min(xMax,xCenter+radius);
 if(lo>hi)return {hit:false,clearanceKm:-Infinity};
 const x=bound(xCenter+radius*slope/Math.sqrt(1+slope*slope),lo,hi);
 const cap=Math.sqrt(Math.max(0,radius*radius-(x-xCenter)**2));
 const clearanceKm=cap+r0+slope*x-offset;
 return {hit:clearanceKm>=-1e-8,clearanceKm};
}
function shadowAt(source,blocker,blockerRadius,sourceRadius,target,targetRadius){
 const dist=len(sub(blocker,source));
 if(!(dist>sourceRadius+blockerRadius))throw new Error('Nieprawidłowa geometria.');
 const axis=unit(sub(blocker,source)),d=sub(target,blocker);
 const x=dot(d,axis),offset=Math.sqrt(Math.max(0,dot(d,d)-x*x));
 const penSlope=(sourceRadius+blockerRadius)/dist,umbSlope=(sourceRadius-blockerRadius)/dist;
 const apex=blockerRadius/umbSlope;
 const p=coneHitsSphere(offset,targetRadius,x,0,Infinity,blockerRadius,penSlope);
 const u=coneHitsSphere(offset,targetRadius,x,0,apex,blockerRadius,-umbSlope);
 const a=coneHitsSphere(offset,targetRadius,x,apex,Infinity,-blockerRadius,umbSlope);
 return {direction:axis,sourceBlockerDistanceKm:dist,blockerTargetDistanceKm:len(d),
  axisDistanceKm:offset,axisPositionKm:x,coneApexDistanceKm:apex,
  penumbraRadiusAtTargetKm:x>0?blockerRadius+penSlope*x:null,
  umbraSignedRadiusAtTargetKm:x>0?blockerRadius-umbSlope*x:null,
  hitsPenumbra:p.hit,hitsUmbra:u.hit,hitsAntumbra:a.hit,
  penetrationKm:{penumbra:p.clearanceKm,umbra:u.clearanceKm,antumbra:a.clearanceKm}};
}
function createEngine({getPositions,auKm=AU,radiiKm={sun:696340,earth:6371,moon:1737.4},lunarShadowScale=1.02}){
 if(typeof getPositions!=='function')throw new TypeError('getPositions(jd) jest wymagane.');
 if(!(Number.isFinite(lunarShadowScale)&&lunarShadowScale>=1&&lunarShadowScale<=1.05))throw new RangeError('Nieprawidłowa korekta ziemskiego cienia.');
 function vectors(jd){
  const p=getPositions(jd);
  if(!Number.isFinite(jd)||!p||!['sun','earth','moon'].every(k=>Array.isArray(p[k])&&p[k].length===3&&p[k].every(Number.isFinite)))throw new Error('Nieprawidłowe pozycje ciał.');
  const km=Object.fromEntries(['sun','earth','moon'].map(k=>[k,mul(p[k],auKm)]));
  const m=sub(p.moon,p.earth),s=sub(p.sun,p.earth);
  const ml=Math.atan2(m[1],m[0])*RAD,sl=Math.atan2(s[1],s[0])*RAD;
  return {p,km,latitude:Math.atan2(m[2],Math.hypot(m[0],m[1]))*RAD,
   difference:wrap(ml-sl),elongation:Math.acos(bound(dot(unit(m),unit(s)),-1,1))*RAD,
   moonDistance:len(m)*auKm,sunDistance:len(s)*auKm};
 }
 function bisect(fn,a,b){
  let fa=fn(a),fb=fn(b);
  if(!Number.isFinite(fa)||!Number.isFinite(fb)||fa*fb>0)return null;
  for(let i=0;i<48&&b-a>1/86400;i++){
   const mid=(a+b)/2,f=fn(mid);
   if(fa*f<=0){b=mid;fb=f;}else{a=mid;fa=f;}
  }
  return (a+b)/2;
 }
 function nearestNode(jd){
  let best=null,last=jd-8,fl=vectors(last).latitude;
  for(let t=last+.5;t<=jd+8.0001;t+=.5){
   const ft=vectors(t).latitude;
   if(fl*ft<=0){
    const crossing=bisect(j=>vectors(j).latitude,last,t);
    if(crossing!==null&&(!best||Math.abs(crossing-jd)<Math.abs(best.julianDate-jd)))
     best={julianDate:crossing,utc:stamp(crossing),kind:fl<ft?'ascending':'descending',daysFromCrossing:jd-crossing};
   }
   last=t;fl=ft;
  }
  return best;
 }
 function at(jd,options={}){
  const v=vectors(jd),p=v.km;
  const solar=shadowAt(p.sun,p.moon,radiiKm.moon,radiiKm.sun,p.earth,radiiKm.earth);
  // Conventional approximate 2% enlargement of Earth's eclipse shadow
  // to account for the atmosphere. Essential for grazing penumbral events.
  const lunar=shadowAt(p.sun,p.earth,radiiKm.earth*lunarShadowScale,radiiKm.sun,p.moon,radiiKm.moon);
  lunar.atmosphericShadowScale=lunarShadowScale;
  let type='none',subtype='none';
  if(solar.hitsPenumbra){
   type='solar';subtype=solar.hitsUmbra&&solar.hitsAntumbra?'hybrid':solar.hitsUmbra?'total':solar.hitsAntumbra?'annular':'partial';
  }else if(lunar.hitsPenumbra){
   type='lunar';if(lunar.hitsUmbra){
    subtype=lunar.umbraSignedRadiusAtTargetKm!==null&&lunar.axisDistanceKm+radiiKm.moon<=lunar.umbraSignedRadiusAtTargetKm?'total':'partial';
   }else subtype='penumbral';
  }
  const no=Math.abs(signed(v.difference)),fo=Math.abs(signed(v.difference-180));
  return {julianDate:jd,utc:stamp(jd),type,subtype,isEclipse:type!=='none',
   bodies:{positionsAU:v.p,positionsKm:v.km,radiiKm:{...radiiKm},distancesKm:{earthMoon:v.moonDistance,earthSun:v.sunDistance}},
   alignment:{elongationDeg:v.elongation,lunarEclipticLatitudeDeg:v.latitude,
    moonSunLongitudeDifferenceDeg:v.difference,nearestSyzygy:no<fo?'new':'full',
    syzygyOffsetDeg:Math.min(no,fo),nearSyzygy:Math.min(no,fo)<=3,
    nearNode:Math.abs(v.latitude)<=2,
    nearestNode:options.includeNode===false?null:nearestNode(jd)},
   shadow:{solar,lunar},
   warnings:['Ziemski cień przy zaćmieniu Księżyca zwiększony umownie o '+Math.round((lunarShadowScale-1)*100)+'%; dokładne kontakty i widoczność sprawdź w NASA.']};
 }
 function findAlignments(start,end,step=.5){
  if(!(end>start&&end-start<=370&&step>0&&step<=1))throw new RangeError('Nieprawidłowy zakres.');
  const res=[];let a=start,last=vectors(a);
  while(a<end){
   const b=Math.min(end,a+step),v=vectors(b);
   for(const [kind,target] of [['new',0],['full',180]]){
    const x=signed(last.difference-target),y=signed(v.difference-target);
    if(x*y<=0&&Math.abs(x-y)<90){
     const jd=bisect(j=>signed(vectors(j).difference-target),a,b);
     if(jd!==null)res.push({category:'syzygy',kind,julianDate:jd,utc:stamp(jd)});
    }
   }
   if(last.latitude*v.latitude<=0){
    const jd=bisect(j=>vectors(j).latitude,a,b);
    if(jd!==null)res.push({category:'node',kind:last.latitude<v.latitude?'ascending':'descending',julianDate:jd,utc:stamp(jd)});
   }
   a=b;last=v;
  }
  return res.sort((x,y)=>x.julianDate-y.julianDate);
 }
 function scanEclipses(start,end,stepHours=1){
  if(!(end>start&&end-start<=370&&stepHours>0&&stepHours<=2))throw new RangeError('Nieprawidłowy zakres.');
  const res=[],step=stepHours/24;let current=null,t=start;
  while(t<=end+1e-8){
   const a=at(Math.min(end,t),{includeNode:false});
   if(a.isEclipse){
    if(!current)current={type:a.type,startJD:a.julianDate,peak:a,subtypes:new Set()};
    current.subtypes.add(a.subtype);
    if(a.shadow[a.type].penetrationKm.penumbra>current.peak.shadow[current.type].penetrationKm.penumbra)current.peak=a;
   }else if(current){
    res.push({type:current.type,subtype:current.type==='solar'?
      ['hybrid','total','annular','partial'].find(x=>current.subtypes.has(x)):
      ['total','partial','penumbral'].find(x=>current.subtypes.has(x)),
      startJD:current.startJD,startUTC:stamp(current.startJD),
      endJD:Math.min(t,end),endUTC:stamp(Math.min(t,end)),
      approximatePeakJD:current.peak.julianDate,approximatePeakUTC:current.peak.utc});
    current=null;
   }
   if(t===end)break;
   t=Math.min(end,t+step);
  }
  if(current)res.push({type:current.type,subtype:current.peak.subtype,startJD:current.startJD,startUTC:stamp(current.startJD),endJD:end,endUTC:stamp(end),approximatePeakJD:current.peak.julianDate,approximatePeakUTC:current.peak.utc,clipped:true});
  return res;
 }
 return Object.freeze({at,nearestNode,findAlignments,scanEclipses});
}
root.AtlasSolarisEclipse=Object.freeze({createEngine,shadowAt,coneHitsSphere});
if(typeof module!=='undefined'&&module.exports)module.exports=root.AtlasSolarisEclipse;
})(typeof window!=='undefined'?window:globalThis);
