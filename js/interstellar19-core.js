/**
 * ATLAS SOLARIS 19.0 — inertial interstellar flight in J2000 equatorial XYZ.
 * Coordinates in light-years; beta = v/c. Constant velocity along a straight
 * segment, without acceleration / orbital dynamics / cosmic expansion.
 * The Lorentz clocks and relativistic aberration are physically meaningful.
 * Light-time, stars' temporal motions, cosmological redshift and radiative
 * transfer are not simulated.
 */
(function(root){
'use strict';
const EPS=1e-11;
const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const mul=(a,k)=>[a[0]*k,a[1]*k,a[2]*k];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const norm=a=>Math.hypot(...a);
const unit=a=>{const r=norm(a);return r>EPS?mul(a,1/r):null};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const coords=(raDeg,decDeg,r=1)=>{
 const a=raDeg*Math.PI/180,d=decDeg*Math.PI/180;
 return [r*Math.cos(d)*Math.cos(a),r*Math.cos(d)*Math.sin(a),r*Math.sin(d)];
};
function lorentz(beta){
 if(!Number.isFinite(beta)||beta<=0||beta>=1)throw new RangeError('Prędkość lotu musi być większa od 0 i mniejsza od c.');
 return 1/Math.sqrt(1-beta*beta);
}
function route(target,beta,fraction){
 const p=target?.slice(0,3);
 if(!Array.isArray(p)||p.length!==3||!p.every(Number.isFinite))throw new TypeError('Nieprawidłowa pozycja celu.');
 const distance=norm(p);
 if(distance<EPS)throw new RangeError('Cel pokrywa się ze Słońcem.');
 const f=clamp(Number(fraction)||0,0,1),gamma=lorentz(beta);
 const dir=mul(p,1/distance),travelled=distance*f;
 return {target:p,position:mul(dir,travelled),direction:dir,
  distanceLy:distance,progress:f,travelledLy:travelled,
  remainingLy:Math.max(0,distance-travelled),
  earthYears:travelled/beta,shipYears:travelled/(beta*gamma),
  fullEarthYears:distance/beta,fullShipYears:distance/(beta*gamma),
  gamma,beta,signalLagYears:travelled};
}
function aberrate(direction,velocityDir,beta){
 const n=unit(direction),v=unit(velocityDir);
 if(!n||!v)throw new TypeError('Brak kierunku fotonu albo prędkości.');
 if(beta===0)return {direction:n,doppler:1,gamma:1};
 const gamma=lorentz(beta),parallel=dot(n,v),den=1+beta*parallel;
 const part=mul(sub(n,mul(v,parallel)),1/(gamma*den));
 const dir=unit(add(part,mul(v,(parallel+beta)/den)));
 return {direction:dir,doppler:gamma*den,gamma};
}
function seenFrom(star,observer,velocityDir=null,beta=0){
 const ray=sub(star,observer),d=norm(ray);
 if(d<EPS)return null;
 const n=mul(ray,1/d);
 const shifted=velocityDir&&beta>0?aberrate(n,velocityDir,beta):{direction:n,doppler:1,gamma:1};
 return {...shifted,distanceLy:d};
}
function apparentMagnitude(magSun,dSunLy,dHereLy){
 if(!Number.isFinite(magSun)||!(dSunLy>0)||!(dHereLy>0))return null;
 return magSun+5*Math.log10(dHereLy/dSunLy);
}
function sunMagnitude(distanceLy){
 if(!(distanceLy>0))return null;
 // Absolute visual magnitude of the Sun M_V≈4.83, at 10 parsecs.
 const pc=distanceLy/3.26156;
 return 4.83+5*Math.log10(pc)-5;
}
function skyAxes(yaw,pitch){
 const y=yaw,p=clamp(pitch,-Math.PI/2+.01,Math.PI/2-.01);
 return {forward:[Math.cos(p)*Math.cos(y),Math.cos(p)*Math.sin(y),Math.sin(p)],
  right:[-Math.sin(y),Math.cos(y),0],
  up:[-Math.sin(p)*Math.cos(y),-Math.sin(p)*Math.sin(y),Math.cos(p)]};
}
function directionAngles(dir){
 const n=unit(dir);if(!n)return {yaw:0,pitch:0};
 return {yaw:Math.atan2(n[1],n[0]),pitch:Math.asin(clamp(n[2],-1,1))};
}
function project(direction,axes,width,height,fovDeg=95){
 const n=unit(direction);if(!n)return null;
 const z=dot(n,axes.forward);
 if(z<=.018)return null;
 const half=Math.tan(clamp(fovDeg,25,140)*Math.PI/360),f=Math.min(width,height)*.5/half;
 return {x:width/2+f*dot(n,axes.right)/z,
  y:height/2-f*dot(n,axes.up)/z,z};
}
function angularSeparation(a,b){
 const x=unit(a),y=unit(b);
 return x&&y?Math.acos(clamp(dot(x,y),-1,1))*180/Math.PI:null;
}
function starXYZ(row){return [row[0],row[1],row[2]];}
root.ATLAS_INTERSTELLAR19_CORE=Object.freeze({add,sub,mul,dot,cross,norm,unit,coords,clamp,
 lorentz,route,aberrate,seenFrom,apparentMagnitude,sunMagnitude,
 skyAxes,directionAngles,project,angularSeparation,starXYZ});
if(typeof module!=='undefined'&&module.exports)module.exports=root.ATLAS_INTERSTELLAR19_CORE;
})(typeof window!=='undefined'?window:globalThis);
