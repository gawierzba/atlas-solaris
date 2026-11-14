/**
 * ATLAS SOLARIS 21.0 — free-falling probe in Kerr equatorial spacetime.
 * Geometric units G=c=M=1, radial Boyer–Lindquist coordinate r.
 *
 * Timelike geodesics with E=-u_t, L=u_phi, Carter Q=0:
 *   R=[E(r²+a²)-aL]² - Δ[r²+(L-aE)²]
 *   dr/dτ = v_r, d²r/dτ² = R'/(2r⁴)-2R/r⁵
 *   r² dt/dτ = ((r²+a²) P / Δ)+ a(L-aE)
 *   r² dφ/dτ = (aP/Δ)+(L-aE)
 *
 * This uses actual proper time τ and a second-order radial equation,
 * avoiding artificial braking/boosting near radial turning points.
 * Initial local speeds are measured relative to a ZAMO tetrad;
 * worldline is a freely-falling test body after release, without thrust.
 * At horizon we stop slightly above r_+ because BL t diverges.
 */
(function(root){'use strict';
const k=root.ATLAS_KERR201_CORE;
const RAD=Math.PI/180,PI=Math.PI;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
function valid(a,r,vr,vphi){
 if(!k)throw new Error('Brak silnika Kerr 20.1');
 k.spin(a);
 if(!(r>k.horizons(a).outer+.015))throw new RangeError('Start musi być poza horyzontem Kerra.');
 if(!Number.isFinite(vr)||!Number.isFinite(vphi)||vr*vr+vphi*vphi>=.99**2)
  throw new RangeError('Prędkości lokalne muszą być mniejsze od c.');
}
function release({spin=+.92,r0=5.2,radial=-.22,tangential=-.40}={}){
 valid(spin,r0,radial,tangential);
 const metric=k.metric(spin,r0,PI/2);
 const gamma=1/Math.sqrt(1-radial*radial-tangential*tangential);
 const sqrtG=Math.sqrt(metric.gpp);
 const L=gamma*sqrtG*tangential;
 const E=gamma*metric.lapse+metric.omega*L;
 const vr=gamma*radial*Math.sqrt(metric.delta)/r0;
 const dt=gamma/metric.lapse;
 const dphi=gamma*(metric.omega/metric.lapse+tangential/sqrtG);
 return {spin,r0,radial,tangential,gamma,E,L,
  horizon:k.horizons(spin).outer,ergo:2,
  frameDrag:metric.omega,
  state:[r0,vr,0,0],initialPhiRate:dphi,initialTRate:dt};
}
function potential(m,r){
 const a=m.spin,E=m.E,L=m.L;
 const delta=r*r-2*r+a*a;
 const P=E*(r*r+a*a)-a*L;
 const B=r*r+(L-a*E)**2;
 const R=P*P-delta*B;
 const Rp=4*E*r*P-(2*r-2)*B-2*r*delta;
 return {P,delta,B,R,Rp};
}
function rates(m,state){
 const [r,vr]=state,{P,delta,R,Rp}=potential(m,r);
 if(r<=m.horizon+.001||delta<=0)throw new RangeError('Poza domeną współrzędnych BL.');
 const a=m.spin;
 const tdot=((r*r+a*a)*P/delta+a*(m.L-a*m.E))/(r*r);
 const phidot=(a*P/delta+m.L-a*m.E)/(r*r);
 const ar=Rp/(2*r**4)-2*R/r**5;
 return [vr,ar,phidot,tdot];
}
function rk4(m,state,h){
 const combine=(s,k,f)=>s.map((v,i)=>v+k[i]*f);
 const k1=rates(m,state);
 const k2=rates(m,combine(state,k1,h*.5));
 const k3=rates(m,combine(state,k2,h*.5));
 const k4=rates(m,combine(state,k3,h));
 return state.map((v,i)=>v+h*(k1[i]+2*k2[i]+2*k3[i]+k4[i])/6);
}
function position(m,state,tau=0){
 const [r,vr,phi,t]=state,rt=r*r;
 const q=potential(m,r);
 const radialError=vr*vr-q.R/(rt*rt);
 const omega=r>m.horizon+.003?rates(m,state)[2]/rates(m,state)[3]:NaN;
 return {r,vr,phi,t,tau,properTime:tau,distantTime:t,
  x:r*Math.cos(phi),y:r*Math.sin(phi),angularRate:omega,
  radialError,insideErgo:r<2&&r>m.horizon,nearHorizon:r<=m.horizon+.07};
}
function integrate(m,{maxTau=120,step=.045,maxPoints=7500,limitRadius=100}={}){
 if(!(step>.001&&step<=.14)||!(maxTau>0)||!(maxPoints>=2))throw new RangeError('Invalid integration options');
 const states=[position(m,m.state,0)];
 let s=m.state.slice(),tau=0,reason='duration',crossedErgo=s[0]<2;
 let periapsis=s[0],maxError=0,turnings=0;
 for(let i=0;i<maxPoints&&tau<maxTau;i++){
  const margin=s[0]-m.horizon;
  if(margin<.015){reason='horizon';break;}
  if(s[0]>limitRadius){reason='escaped';break;}
  let h=Math.min(step,maxTau-tau);
  // Refine near horizon; BL dt/dτ diverges at r+ and is not physical.
  h=Math.min(h,Math.max(.00012,margin/(Math.abs(s[1])*3+1e-4)));
  let next;
  try{next=rk4(m,s,h);}
  catch(error){reason='numerical-limit';break;}
  if(next.some(x=>!Number.isFinite(x))){reason='numerical-limit';break;}
  if(next[0]<m.horizon+.006){reason='horizon';break;}
  if(s[1]*next[1]<0)turnings++;
  if(s[0]>=2&&next[0]<2)crossedErgo=true;
  s=next;tau+=h;
  const p=position(m,s,tau);
  maxError=Math.max(maxError,Math.abs(p.radialError));
  periapsis=Math.min(periapsis,p.r);
  states.push(p);
 }
 if(states.length>=maxPoints&&reason==='duration')reason='step-limit';
 return {release:m,points:states,reason,crossedErgo,periapsis,maxConstraintError:maxError,
  turnings,properElapsed:tau,distantElapsed:s[3]};
}
function interpolate(trajectory,tau){
 const points=trajectory.points;
 if(tau<=0)return points[0];
 const last=points[points.length-1];
 if(tau>=last.tau)return last;
 let lo=0,hi=points.length-1;
 while(hi-lo>1){const mid=(lo+hi)>>1;if(points[mid].tau<tau)lo=mid;else hi=mid;}
 const p=points[lo],q=points[hi],f=(tau-p.tau)/(q.tau-p.tau);
 const out={};
 for(const key of ['r','vr','phi','t','tau','properTime','distantTime','x','y','angularRate','radialError'])
  out[key]=p[key]+(q[key]-p[key])*f;
 out.insideErgo=out.r<2&&out.r>trajectory.release.horizon;
 out.nearHorizon=out.r<=trajectory.release.horizon+.07;
 return out;
}
function circularVelocity(spin,r,direction=1){
 if(!(r>=k.isco(spin,direction)))throw new RangeError('Orbita kołowa poniżej ISCO jest niestabilna.');
 const m=k.metric(spin,r,Math.PI/2),omega=k.orbitOmega(spin,r,direction);
 return (omega-m.omega)*Math.sqrt(m.gpp)/m.lapse;
}
function physicalTime(massSolar,geometricSeconds,rgSeconds=4.925639893961039e-6){
 return massSolar*rgSeconds*geometricSeconds;
}
root.ATLAS_PROBE21_CORE=Object.freeze({
 release,potential,rates,rk4,position,integrate,interpolate,physicalTime,circularVelocity,clamp,RAD
});
if(typeof module!=='undefined'&&module.exports)module.exports=root.ATLAS_PROBE21_CORE;
})(typeof window!=='undefined'?window:globalThis);
