/**
 * ATLAS SOLARIS 17.3 — analysis of the calculated central shadow trajectory.
 *
 * Input: a sampled path from 17.2's map.centralTrack(), consisting of a
 * chronological array of Earth-surface axis intersections or nulls.
 *
 * Earth is spherical (R=6371 km); distances, speeds and bearings are
 * approximate ground-track values, not speeds of the Moon in space.
 * No time-continuous physical motion is invented across missing samples.
 */
(function(root){
'use strict';
const DEG=Math.PI/180,RAD=180/Math.PI,R_EARTH=6371;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const wrap=l=>((l+180)%360+360)%360-180;
const unit=(lat,lon)=>{
 const a=lat*DEG,b=lon*DEG,c=Math.cos(a);
 return [c*Math.cos(b),c*Math.sin(b),Math.sin(a)];
};
const len=v=>Math.hypot(...v);
const dot=(u,v)=>u[0]*v[0]+u[1]*v[1]+u[2]*v[2];
function arcKm(a,b){
 const p=unit(a.lat,a.lon),q=unit(b.lat,b.lon);
 const cross=Math.hypot(p[1]*q[2]-p[2]*q[1],p[2]*q[0]-p[0]*q[2],p[0]*q[1]-p[1]*q[0]);
 return R_EARTH*Math.atan2(cross,clamp(dot(p,q),-1,1));
}
function bearingDeg(a,b){
 const latA=a.lat*DEG,latB=b.lat*DEG,dl=wrap(b.lon-a.lon)*DEG;
 const y=Math.sin(dl)*Math.cos(latB);
 const x=Math.cos(latA)*Math.sin(latB)-Math.sin(latA)*Math.cos(latB)*Math.cos(dl);
 return (Math.atan2(y,x)*RAD+360)%360;
}
function interpolate(a,b,t){
 const x=unit(a.lat,a.lon),y=unit(b.lat,b.lon);
 const angle=Math.acos(clamp(dot(x,y),-1,1));
 let vec;
 if(angle<1e-8){
  vec=x;
 }else{
  const sn=Math.sin(angle);
  const aa=Math.sin((1-t)*angle)/sn,bb=Math.sin(t*angle)/sn;
  vec=[aa*x[0]+bb*y[0],aa*x[1]+bb*y[1],aa*x[2]+bb*y[2]];
 }
 const m=len(vec);
 return {lat:Math.asin(clamp(vec[2]/m,-1,1))*RAD,
   lon:wrap(Math.atan2(vec[1],vec[0])*RAD),
   kind:t<.5?a.kind:b.kind};
}
function prepare(track){
 if(!track||!Array.isArray(track.center))throw new TypeError('Wymagany tor cienia z centralTrack().');
 const sequence=[],valid=[];
 let distanceKm=0,last=null,group=-1;
 for(const p of track.center){
  if(!p||!Number.isFinite(p.jd)){
   sequence.push(null);last=null;continue;
  }
  if(!Number.isFinite(p.lat)||!Number.isFinite(p.lon)||p.lat< -90||p.lat>90)
    throw new RangeError('Nieprawidłowy punkt toru.');
  const point={lat:p.lat,lon:wrap(p.lon),jd:p.jd,kind:p.kind||'unknown'};
  if(last&&point.jd<=last.jd)throw new RangeError('Tor nie jest uporządkowany chronologicznie.');
  if(last)distanceKm+=arcKm(last,point);
  else group++;
  const entry={...point,distanceKm,group};
  sequence.push(entry);valid.push(entry);
  last=entry;
 }
 return Object.freeze({
  samples:sequence,valid,first:valid[0]||null,last:valid[valid.length-1]||null,
  totalKm:distanceKm,groupCount:group+1
 });
}
function evaluate(model,jd){
 if(!model||!Array.isArray(model.samples)||!Number.isFinite(jd))
  throw new TypeError('Nieprawidłowy tor lub data.');
 if(!model.first)return {status:'none',progress:0,totalKm:0,past:[],future:[],current:null};
 let status=jd<model.first.jd?'before':jd>model.last.jd?'after':'outside';
 let current=null,km=jd<model.first.jd?0:model.totalKm,velocityKmH=null,bearing=null;
 const seq=model.samples,past=[],future=[];
 let prev=null;
 for(const p of seq){
  if(!p){past.push(null);future.push(null);prev=null;continue;}
  if(p.jd<=jd){past.push(p);future.push(null);}
  else {past.push(null);future.push(p);}
  if(prev&&prev.group===p.group&&jd>=prev.jd&&jd<=p.jd){
   const fraction=clamp((jd-prev.jd)/(p.jd-prev.jd),0,1);
   const at=interpolate(prev,p,fraction);
   current={...at,jd,distanceKm:prev.distanceKm+
    (p.distanceKm-prev.distanceKm)*fraction};
   status='crossing';km=current.distanceKm;
   velocityKmH=(p.distanceKm-prev.distanceKm)/((p.jd-prev.jd)*24);
   bearing=bearingDeg(prev,p);
  }
  prev=p;
 }
 if(status==='crossing'){
  // Rebuild past and future with the current location at the split, while
  // retaining explicit nulls to avoid drawing lines through the far side
  // of the globe or across gaps in central-axis intersections.
  let lastPast=-1,firstFuture=-1;
  for(let i=0;i<seq.length;i++){
   if(seq[i]&&seq[i].jd<=jd)lastPast=i;
   if(seq[i]&&seq[i].jd>jd&&firstFuture<0)firstFuture=i;
  }
  if(lastPast>=0&&firstFuture>=0&&seq[lastPast].group===seq[firstFuture].group){
   past[firstFuture]=current;
   future[lastPast]=current;
  }
 }else{
  if(status==='outside'){
   const earlier=model.valid.filter(p=>p.jd<=jd);
   km=earlier.length?earlier[earlier.length-1].distanceKm:0;
  }
 }
 return {status,progress:model.totalKm>0?clamp(100*km/model.totalKm,0,100):
    (jd>=model.last.jd?100:0),
  elapsedMinutes:clamp((jd-model.first.jd)*1440,0,(model.last.jd-model.first.jd)*1440),
  totalMinutes:(model.last.jd-model.first.jd)*1440,
  completedKm:km,remainingKm:Math.max(0,model.totalKm-km),
  totalKm:model.totalKm,velocityKmH,bearingDeg:bearing,current,
  past,future,first:model.first,last:model.last};
}
root.ATLAS_ECLIPSE_SHADOW_MOTION=Object.freeze({prepare,evaluate,arcKm,bearingDeg,interpolate});
if(typeof module!=='undefined'&&module.exports)module.exports=root.ATLAS_ECLIPSE_SHADOW_MOTION;
})(typeof window!=='undefined'?window:globalThis);
