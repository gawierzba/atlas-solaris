/* ATLAS SOLARIS 32.0 — geometric rotating lighthouse model.
   Dipolar radio beam toy model. Angular separation is derived from vectors;
   pulse profile and radio noise are SYNTHETIC, never telescope recordings.
   This module is also importable into Node test suites. */
(function(root){
'use strict';
const PI=Math.PI,TAU=2*PI,RAD=PI/180,LN2=Math.log(2);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const degrees=r=>r/RAD;
const radians=d=>d*RAD;
function separationDeg(alphaDeg,zetaDeg,phase){
 const a=radians(alphaDeg),z=radians(zetaDeg);
 const dot=Math.cos(a)*Math.cos(z)+Math.sin(a)*Math.sin(z)*Math.cos(phase);
 return degrees(Math.acos(clamp(dot,-1,1)));
}
function beamGain(angleDeg,halfPowerDeg){
 const r=Math.max(0.5,halfPowerDeg);
 return Math.exp(-LN2*Math.pow(angleDeg/r,2));
}
function pulseAtPhase(phase,opts){
 const {alpha=36,zeta=43,rho=12,secondPole=.48}=opts||{};
 const gamma=separationDeg(alpha,zeta,phase);
 const one=beamGain(gamma,rho),two=secondPole*beamGain(180-gamma,rho);
 return {main:one,opposite:two,gain:Math.min(1,one+two),angle:gamma};
}
function visibility(opts){
 let max=0,best=0;
 for(let i=0;i<720;i++){const r=pulseAtPhase(i*TAU/720,opts);if(r.gain>max){max=r.gain;best=i/720}}
 return {peak:max,visible:max>=.11,bestPhase:best};
}
function random(seed){let x=seed>>>0;return()=>{x=(Math.imul(1664525,x)+1013904223)>>>0;return x/4294967296}}
function makeTrace(opts,cycles=9,count=1800,seed=32026){
 const period=Math.max(.001,Number(opts.period)||.033),n=clamp(Math.floor(count),100,10000);
 const dt=cycles*period/(n-1),rand=random(seed);
 const samples=new Float64Array(n),clean=new Float64Array(n);
 let peak=0;
 for(let i=0;i<n;i++){
  const phase=TAU*(i*dt/period);
  const p=pulseAtPhase(phase,opts).gain;peak=Math.max(peak,p);clean[i]=p;
  // Box-Muller Gaussian receiver noise; deterministic seed for repeatable lab.
  const u=Math.max(1e-12,rand()),v=rand();
  const gaussian=Math.sqrt(-2*Math.log(u))*Math.cos(TAU*v);
  samples[i]=Math.max(0,.045+p+gaussian*(opts.noise??.075));
 }
 return {samples,clean,dt,period,peak,duration:(n-1)*dt};
}
function estimatePeriod(samples,dt,minLag,maxLag){
 const n=samples.length;
 if(n<80||!(dt>0))return null;
 const lo=clamp(Math.floor(minLag??Math.max(12,n/30)),4,n-3);
 const hi=clamp(Math.ceil(maxLag??n/3),lo+2,Math.floor(n*.47));
 let mean=0;for(let i=0;i<n;i++)mean+=samples[i];mean/=n;
 const v=new Float64Array(n);let power=0;
 for(let i=0;i<n;i++){v[i]=samples[i]-mean;power+=v[i]*v[i]}
 if(power/n<.00015)return null;
 // Normalized correlation by overlap, with local maximum selection.
 const corr=[];
 for(let lag=lo;lag<=hi;lag++){
  let dot=0,e1=0,e2=0;
  for(let i=0;i<n-lag;i++){const a=v[i],b=v[i+lag];dot+=a*b;e1+=a*a;e2+=b*b}
  corr[lag]=dot/Math.sqrt(Math.max(1e-20,e1*e2));
 }
 let best=-1,bestLag=-1;
 for(let lag=lo+1;lag<hi;lag++){
  if(corr[lag]>=corr[lag-1]&&corr[lag]>=corr[lag+1]&&corr[lag]>best){
   best=corr[lag];bestLag=lag;
  }
 }
 if(bestLag<0||best<.18)return null;
 // Parabolic interpolation around the correlation maximum.
 const a=corr[bestLag-1],b=corr[bestLag],c=corr[bestLag+1];
 const delta=clamp(.5*(a-c)/(a-2*b+c||1),-.5,.5);
 return {period:(bestLag+delta)*dt,confidence:best,lag:bestLag};
}
const api=Object.freeze({separationDeg,beamGain,pulseAtPhase,visibility,makeTrace,estimatePeriod});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.AtlasPulsar32=api;
})(typeof globalThis!=='undefined'?globalThis:this);
