/**
 * ATLAS SOLARIS 17.2 — geographical solar-eclipse footprint.
 * Geocentric heliocentric position vectors [x,y,z] in AU (J2000 ecliptic).
 * Earth axes are the axes already used by ATLAS SOLARIS; geographic sphere
 * radius 6371 km, Sun 696340 km, Moon 1737.4 km. No atmosphere/topography.
 *
 * Local eclipse status is calculated from topocentric angular disk overlap.
 * This is an educational geometric map, not authoritative Besselian limits.
 */
(function(root){
'use strict';
const AU=149597870.7, DEG=Math.PI/180,RAD=180/Math.PI;
const R={earth:6371,moon:1737.4,sun:696340};
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const mul=(a,s)=>[a[0]*s,a[1]*s,a[2]*s];
const length=a=>Math.hypot(...a);
const unit=a=>mul(a,1/Math.max(1e-30,length(a)));
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const clamp=(a,l,h)=>Math.max(l,Math.min(h,a));
const wrap=l=>((l+180)%360+360)%360-180;
const normLatLon=n=>({lat:Math.asin(clamp(n[2],-1,1))*RAD,lon:wrap(Math.atan2(n[1],n[0])*RAD)});
const geoVector=(lat,lon)=>{const a=lat*DEG,b=lon*DEG,c=Math.cos(a);return [c*Math.cos(b),c*Math.sin(b),Math.sin(a)]};
const iso=jd=>new Date((jd-2440587.5)*86400000).toISOString();
function overlap(Rs,Rm,d){
 if(d>=Rs+Rm)return 0;
 if(d<=Math.abs(Rs-Rm))return Math.PI*Math.min(Rs,Rm)**2;
 const x=clamp((d*d+Rs*Rs-Rm*Rm)/(2*d*Rs),-1,1);
 const y=clamp((d*d+Rm*Rm-Rs*Rs)/(2*d*Rm),-1,1);
 return Rs*Rs*Math.acos(x)+Rm*Rm*Math.acos(y)-
   .5*Math.sqrt(Math.max(0,(-d+Rs+Rm)*(d+Rs-Rm)*(d-Rs+Rm)*(d+Rs+Rm)));
}
function createMap({getPositions,getEarthAxes}){
 if(typeof getPositions!=='function'||typeof getEarthAxes!=='function')
  throw new TypeError('Map requires getPositions(jd) and getEarthAxes(jd).');
 function moment(jd){
  const p=getPositions(jd),a=getEarthAxes(jd);
  if(!p||!a||!['x','y','z'].every(k=>Array.isArray(a[k])&&a[k].length===3))
   throw new TypeError('Nieprawidłowe współrzędne lub orientacja Ziemi.');
  const toFixed=v=>[dot(v,a.x),dot(v,a.y),dot(v,a.z)];
  return {jd, sun:toFixed(mul(sub(p.sun,p.earth),AU)),
    moon:toFixed(mul(sub(p.moon,p.earth),AU)),
    sunMoon:mul(sub(p.moon,p.sun),AU)};
 }
 function atVector(g,n){
  const observer=mul(n,R.earth);
  const S=sub(g.sun,observer),M=sub(g.moon,observer);
  const dS=length(S),dM=length(M);
  const sv=mul(S,1/dS),mv=mul(M,1/dM);
  const sunAltitudeDeg=Math.asin(clamp(dot(sv,n),-1,1))*RAD;
  const rSun=Math.atan2(R.sun,dS),rMoon=Math.atan2(R.moon,dM);
  const separation=Math.atan2(length(cross(sv,mv)),clamp(dot(sv,mv),-1,1));
  const moonFront=dM<dS;
  const fraction=moonFront?overlap(rSun,rMoon,separation)/(Math.PI*rSun*rSun):0;
  const geometric=moonFront&&separation<rSun+rMoon;
  const central=geometric&&separation<=Math.abs(rSun-rMoon);
  const kind=geometric?(central?(rMoon>=rSun?'total':'annular'):'partial'):'none';
  const visible=sunAltitudeDeg>0&&geometric;
  return {kind,visible,central:visible&&central,
   visibleKind:visible?kind:'none',coverageFraction:visible?clamp(fraction,0,1):0,
   geometricCoverageFraction:clamp(fraction,0,1),
   altitudeDeg:sunAltitudeDeg,separationRad:separation,
   sunAngularRadiusRad:rSun,moonAngularRadiusRad:rMoon,
   outerGapRad:separation-(rSun+rMoon),innerGapRad:separation-Math.abs(rSun-rMoon),
   moonFront};
 }
 function local(jd,lat,lon){
  if(!Number.isFinite(jd)||!Number.isFinite(lat)||!Number.isFinite(lon)||lat < -90||lat>90)
   throw new RangeError('Nieprawidłowa data lub współrzędne.');
  return {...atVector(moment(jd),geoVector(lat,lon)),lat,lon:wrap(lon),jd};
 }
 /** Nearest (solar-facing) intersection of the Sun-Moon axis with Earth. */
 function axisPoint(jd,g=moment(jd)){
  // all vectors in Earth-fixed kilometers
  const m=g.moon,ray=unit(sub(g.moon,g.sun)),b=dot(m,ray);
  const q=b*b-dot(m,m)+R.earth*R.earth;
  if(q<0)return null;
  const t=-b-Math.sqrt(Math.max(0,q));
  if(t<0)return null;
  const v=mul(add(m,mul(ray,t)),1/R.earth);
  const p=normLatLon(v),at=atVector(g,v);
  if(!at.visible)return null;
  return {...p,n:v,jd,kind:at.visibleKind,coverageFraction:at.coverageFraction};
 }
 function radialBoundary(g,center,direction,maxAngle=.22){
  const baseline=atVector(g,center);
  if(!baseline.central)return null;
  const dir=unit(sub(direction,mul(center,dot(direction,center))));
  const yes=rho=>atVector(g,add(mul(center,Math.cos(rho)),mul(dir,Math.sin(rho)))).central;
  let lo=0,hi=maxAngle;
  if(yes(hi))return null; // unusably large footprint (not an eclipse central band)
  for(let i=0;i<24;i++){const m=(lo+hi)/2;if(yes(m))lo=m;else hi=m;}
  return normLatLon(add(mul(center,Math.cos((lo+hi)/2)),mul(dir,Math.sin((lo+hi)/2))));
 }
 function centralBoundary(jd,angles=144){
  const g=moment(jd),point=axisPoint(jd,g);
  if(!point)return null;
  const n=point.n,lat=point.lat*DEG,lon=point.lon*DEG;
  const east=[-Math.sin(lon),Math.cos(lon),0],
   north=[-Math.sin(lat)*Math.cos(lon),-Math.sin(lat)*Math.sin(lon),Math.cos(lat)];
  const points=[];
  for(let i=0;i<angles;i++){
   const a=i*2*Math.PI/angles,dir=add(mul(east,Math.cos(a)),mul(north,Math.sin(a)));
   const p=radialBoundary(g,n,dir);
   if(p)points.push(p);
  }
  return {axis:point,points,kind:point.kind};
 }
 function centralTrack(peakJD,{minutes=180,stepMinutes=3}={}){
  if(!(minutes>0&&minutes<=360&&stepMinutes>=1&&stepMinutes<=15))throw new RangeError('Nieprawidłowy zakres toru.');
  const center=[],left=[],right=[];
  for(let t=-minutes;t<=minutes+1e-8;t+=stepMinutes){
   const jd=peakJD+t/1440,g=moment(jd),pt=axisPoint(jd,g);
   if(!pt){center.push(null);left.push(null);right.push(null);continue;}
   const prev=axisPoint(jd-1/1440),next=axisPoint(jd+1/1440);
   let tangent=prev&&next?sub(next.n,prev.n):null;
   if(!tangent||length(tangent)<1e-6){
    const v=geoVector(pt.lat,pt.lon);
    tangent=cross([0,0,1],v);
   }
   tangent=unit(sub(tangent,mul(pt.n,dot(tangent,pt.n))));
   const transverse=unit(cross(pt.n,tangent));
   const l=radialBoundary(g,pt.n,transverse),r=radialBoundary(g,pt.n,mul(transverse,-1));
   center.push({...pt,timeUTC:iso(jd)});
   left.push(l?{...l,kind:pt.kind}:null);
   right.push(r?{...r,kind:pt.kind}:null);
  }
  return {center,left,right};
 }
 /** Marching squares on a geographic grid; returns disjoint 2-point isoline segments. */
 function contours(jd,{stepDeg=3,levels=[.001,.5]}={}){
  if(!(stepDeg>=1&&stepDeg<=10&&180%stepDeg===0&&360%stepDeg===0))throw new RangeError('Grid step must divide 180 and 360.');
  const g=moment(jd),cols=360/stepDeg,rows=180/stepDeg;
  const grid=Array.from({length:rows+1},()=>new Float32Array(cols+1));
  for(let i=0;i<=rows;i++){
   const lat=-90+i*stepDeg;
   for(let j=0;j<=cols;j++)grid[i][j]=atVector(g,geoVector(lat,-180+j*stepDeg)).coverageFraction;
  }
  const result={};
  for(const level of levels){
   const segments=[];
   for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){
    const lat=-90+i*stepDeg,lon=-180+j*stepDeg;
    const corners=[
     {lat,lon,v:grid[i][j]},
     {lat,lon:lon+stepDeg,v:grid[i][j+1]},
     {lat:lat+stepDeg,lon:lon+stepDeg,v:grid[i+1][j+1]},
     {lat:lat+stepDeg,lon,v:grid[i+1][j]}
    ];
    const points=[];
    for(let e=0;e<4;e++){
     const a=corners[e],b=corners[(e+1)%4];
     if((a.v>=level)!==(b.v>=level)){
      const w=(level-a.v)/(b.v-a.v);
      points.push({lat:a.lat+(b.lat-a.lat)*w,lon:a.lon+(b.lon-a.lon)*w});
     }
    }
    for(let e=0;e+1<points.length;e+=2)segments.push([points[e],points[e+1]]);
   }
   result[String(level)]=segments;
  }
  return result;
 }
 function contacts(peakJD,lat,lon,{windowHours=5,stepMinutes=.25}={}){
  if(!(windowHours>=1&&windowHours<=8&&stepMinutes>=.25&&stepMinutes<=5))throw new RangeError('Invalid scan range.');
  const out=peakJD-windowHours/24,end=peakJD+windowHours/24,step=stepMinutes/1440;
  const outer=[],inner=[],samples=[];
  const val=(jd)=>local(jd,lat,lon);
  let prev=val(out);
  const findZero=(f,a,b)=>{
   let fa=f(a);
   for(let k=0;k<40&&b-a>1/864000;k++){
    const m=(a+b)*.5,fm=f(m);
    if((fa<=0)===(fm<=0)){a=m;fa=fm;}else b=m;
   }
   return (a+b)*.5;
  };
  for(let t=out+step;t<=end+step*.25;t+=step){
   const jd=Math.min(t,end),cur=val(jd);
   samples.push(cur);
   for(const [arr,key] of [[outer,'outerGapRad'],[inner,'innerGapRad']]){
    if((prev[key]<=0)!==(cur[key]<=0)){
     const z=findZero(j=>val(j)[key],jd-step,jd);
     const hit=val(z);
     if(hit.moonFront)arr.push({jd:z,utc:iso(z),sunAboveHorizon:hit.altitudeDeg>0});
    }
   }
   prev=cur;if(jd>=end)break;
  }
  const active=samples.filter(s=>s.moonFront&&s.geometricCoverageFraction>0);
  if(!active.length)return {kind:'none',maximum:null,contacts:[],localVisibility:false};
  let best=active.reduce((a,b)=>b.outerGapRad<a.outerGapRad?b:a);
  let left=best.jd-step,right=best.jd+step;
  for(let k=0;k<32;k++){
   const p=left+(right-left)*.38196601125,q=left+(right-left)*.61803398875;
   if(val(p).outerGapRad>val(q).outerGapRad)left=p;else right=q;
  }
  const max=val((left+right)/2);
  // Very short central phases (near grazing eclipses) may fall between
  // 15-second samples. Bracket their inner contacts directly from maximum.
  if(max.central&&inner.length<2){
   const roots=[];
   for(const direction of [-1,1]){
    let near=max.jd,far=near,distance=step/2;
    while(distance<=windowHours/24){
     far=near+direction*distance;
     if(far<out||far>end)break;
     if(val(far).innerGapRad>0){
      const z=findZero(j=>val(j).innerGapRad,Math.min(far,near),Math.max(far,near));
      const hit=val(z);
      roots.push({jd:z,utc:iso(z),sunAboveHorizon:hit.altitudeDeg>0});
      break;
     }
     distance*=2;
    }
   }
   if(roots.length===2)inner.splice(0,inner.length,...roots.sort((a,b)=>a.jd-b.jd));
  }
  const entries=[];
  if(outer[0])entries.push({label:'C1',...outer[0]});
  if(inner[0]&&max.central)entries.push({label:'C2',...inner[0]});
  if(inner.length>1&&max.central)entries.push({label:'C3',...inner[inner.length-1]});
  if(outer.length>1)entries.push({label:'C4',...outer[outer.length-1]});
  return {kind:max.kind,maximum:{jd:max.jd,utc:iso(max.jd),coverageFraction:max.geometricCoverageFraction,
    sunAltitudeDeg:max.altitudeDeg,visible:max.visible},contacts:entries,localVisibility:entries.some(e=>e.sunAboveHorizon)||max.visible,
   disclaimer:'Przybliżone geometryczne kontakty; topografia, refrakcja i profil limb Księżyca nieuwzględnione.'};
 }
 return Object.freeze({moment,local,atGeo:(snapshot,lat,lon)=>atVector(snapshot,geoVector(lat,lon)),axisPoint,centralBoundary,centralTrack,contours,contacts});
}
root.ATLAS_ECLIPSE_GEO_MAP=Object.freeze({createMap,overlap,geoVector});
if(typeof module!=='undefined'&&module.exports)module.exports=root.ATLAS_ECLIPSE_GEO_MAP;
})(typeof window!=='undefined'?window:globalThis);
