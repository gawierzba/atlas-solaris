/* ATLAS SOLARIS 25.1 — 13 IAU constellation regions + stellar-perspective geometry.
 * Polygon vertices are J2000 celestial coordinates from d3-celestial (BSD-3).
 * Sun: Meeus/NOAA low-precision apparent ecliptic longitude, mean equinox-of-date
 * transformed to J2000 via IAU 1976 precession. Typical limitations: arcminutes,
 * so ingress timestamps are illustrative, not authoritative astrometry.
 * Interstellar positions are from existing Atlas 19.0 data, in light-years.
 */
(function(root){'use strict';
const previous=root.ATLAS_ZODIAC25_CORE;
const bounds=root.ATLAS_ZODIAC251_BOUNDS;
if(!previous||!bounds) return;
const RAD=Math.PI/180,DEG=180/Math.PI,EPS=23.439291111*RAD;
const norm360=x=>(x%360+360)%360;
const wrap180=x=>(x+540)%360-180;
const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
const vector=(ra,dec,r=1)=>{const a=ra*RAD,d=dec*RAD;return [r*Math.cos(d)*Math.cos(a),r*Math.cos(d)*Math.sin(a),r*Math.sin(d)];};
const equatorialFromEcliptic=v=>[v[0],v[1]*Math.cos(EPS)-v[2]*Math.sin(EPS),v[1]*Math.sin(EPS)+v[2]*Math.cos(EPS)];
const directions=v=>{if(!Array.isArray(v)||v.length!==3||!v.every(Number.isFinite))return null;const r=Math.hypot(...v);if(!r)return null;return {ra:norm360(Math.atan2(v[1],v[0])*DEG),dec:Math.asin(clamp(v[2]/r,-1,1))*DEG};};
const unwrapped = new WeakMap();
function polygonContinuous(poly){
 if(unwrapped.has(poly))return unwrapped.get(poly);
 const out=[];
 for(let i=0;i<poly.length;i++){
  const ra=i?out[i-1][0]+wrap180(poly[i][0]-poly[i-1][0]):poly[i][0];
  out.push([ra,poly[i][1]]);
 }
 const xs=out.map(p=>p[0]);
 const shape={points:out,center:(Math.min(...xs)+Math.max(...xs))/2};
 unwrapped.set(poly,shape);return shape;
}
function pointInPolygon(ra,dec,poly){
 if(!Number.isFinite(ra)||!Number.isFinite(dec)||dec < -90||dec>90)return false;
 const {points,center}=polygonContinuous(poly);
 const x=ra+360*Math.round((center-ra)/360);
 let inside=false;
 for(let i=0,j=points.length-1;i<points.length;j=i++){
  const [x1,y1]=points[i],[x2,y2]=points[j];
  if((y1>dec)!==(y2>dec)){
   const at=x1+(x2-x1)*(dec-y1)/(y2-y1);
   if(at>x)inside=!inside;
  }
 }
 return inside;
}

function constellationAt(ra,dec){
 for(const entry of bounds)if(pointInPolygon(ra,dec,entry[1]))return entry[0];
 return null; // Coordinates can lie outside the 13 zodiac constellations.
}
function precessEquatorial(ra,dec,fromJD,toJD){
 // Meeus, Astronomical Algorithms 2nd ed., chapter 21, IAU 1976 model.
 const T=(fromJD-2451545)/36525,t=(toJD-fromJD)/36525;
 const arc=1/3600*RAD;
 const zeta=((2306.2181+1.39656*T-.000139*T*T)*t+(.30188-.000344*T)*t*t+.017998*t*t*t)*arc;
 const z=((2306.2181+1.39656*T-.000139*T*T)*t+(1.09468+.000066*T)*t*t+.018203*t*t*t)*arc;
 const theta=((2004.3109-.85330*T-.000217*T*T)*t-(.42665+.000217*T)*t*t-.041833*t*t*t)*arc;
 const a=ra*RAD,d=dec*RAD;
 const A=Math.cos(d)*Math.sin(a+zeta),B=Math.cos(theta)*Math.cos(d)*Math.cos(a+zeta)-Math.sin(theta)*Math.sin(d);
 const C=Math.sin(theta)*Math.cos(d)*Math.cos(a+zeta)+Math.cos(theta)*Math.sin(d);
 return {ra:norm360((Math.atan2(A,B)+z)*DEG),dec:Math.asin(clamp(C,-1,1))*DEG};
}
function sunJ2000(date){
 const d=date instanceof Date?date:new Date(date);
 const eq=previous.sunEquatorial(d);
 return precessEquatorial(eq.ra,eq.dec,previous.julianDate(d),2451545);
}
function sunZone(date){const eq=sunJ2000(date);return constellationAt(eq.ra,eq.dec);}
function sunFromAtlas(jd,api){
 const p=api?.positions?.(jd);if(!p?.earth)return null;
 const v=equatorialFromEcliptic(p.earth.map(x=>-x));const eq=directions(v);
 return eq?{...eq,zone:constellationAt(eq.ra,eq.dec)}:null;
}
const crossingsCache=new Map();
function yearCrossings(year){
 const y=Number(year);
 if(!Number.isInteger(y)||y<1800||y>2200)throw new RangeError('Rok poza zakresem modelu.');
 if(crossingsCache.has(y))return crossingsCache.get(y);
 const day=86400000,start=Date.UTC(y,0,1),end=Date.UTC(y+1,0,1);
 let prev=sunZone(new Date(start)),events=[];
 for(let t=start+day;t<=end+day;t+=day){
  const now=sunZone(new Date(t));
  if(now!==prev){
   let a=t-day,b=t;
   // 24 iterations => about 5 milliseconds (numerical precision exceeds model accuracy).
   for(let i=0;i<24;i++){
    const mid=(a+b)/2;
    if(sunZone(new Date(mid))===prev)a=mid;else b=mid;
   }
   const when=new Date(Math.round(b/1000)*1000);
   if(when.getUTCFullYear()===y)events.push({id:now,date:when,from:prev});
   prev=now;
  }
 }
 crossingsCache.set(y,events);
 return events;
}
function yearSectors(year){
 const events=yearCrossings(year);
 const map=new Map(events.map(e=>[e.id,e.date]));
 if(!previous.CATALOG.every(c=>map.has(c.id)))return null;
 const known=previous.CATALOG.map(c=>({c,date:map.get(c.id)}));
 return known.map((e,i)=>{
  const start=previous.sunLongitude(e.date),next=previous.sunLongitude(known[(i+1)%known.length].date);
  const width=norm360(next-start);
  return {...e.c,start,end:next,width,date:e.date,accurateBoundary:true};
 });
}
function nextIngress(date){
 const t=new Date(date).getTime();if(!Number.isFinite(t))throw new RangeError('Nieprawidłowa data.');
 const y=new Date(t).getUTCFullYear();
 const list=[...yearCrossings(y),...yearCrossings(y+1)].filter(e=>e.date.getTime()>t);
 return list.length?list[0]:null;
}
function solarBodyClassifications(jd,api){
 const p=api?.positions?.(jd);if(!p?.earth)return [];
 const rows=[];
 for(const id of ['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune']){
  if(id!=='sun'&&!p[id])continue;
  const v=id==='sun'?p.earth.map(x=>-x):p[id].map((x,i)=>x-p.earth[i]);
  const eq=directions(equatorialFromEcliptic(v));if(!eq)continue;
  rows.push({id,...eq,zone:constellationAt(eq.ra,eq.dec)});
 }
 return rows;
}
function physicalDistance(star){return Math.hypot(star[0],star[1],star[2]);}
function constellationStars(data,id){
 const figure=data?.figures?.[id];if(!figure)return {paths:[],nodes:[]};
 const paths=figure.paths.map(path=>path.map(i=>Number.isInteger(i)&&i>=0&&i<data.stars.length?i:null));
 const ids=[...new Set(paths.flat().filter(Number.isInteger))];
 return {paths,nodes:ids.map(i=>({index:i,row:data.stars[i],distanceLy:physicalDistance(data.stars[i])})).filter(s=>s.distanceLy>.001)};
}
const api=Object.freeze({bounds,vector,directions,equatorialFromEcliptic,pointInPolygon,constellationAt,
 precessEquatorial,sunJ2000,sunZone,sunFromAtlas,yearCrossings,yearSectors,nextIngress,
 solarBodyClassifications,physicalDistance,constellationStars});
root.ATLAS_ZODIAC251_CORE=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);