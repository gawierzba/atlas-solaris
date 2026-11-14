/**
 * ATLAS SOLARIS 20.1 — Kerr geometry and Carter's null geodesics.
 * Geometric units G=c=M=1. Signed dimensionless spin a* [-.98,+.98].
 * Coordinates: Boyer–Lindquist r, theta, phi; local ZAMO tetrad.
 * Null photons integrated in scaled Mino time psi=b gamma, with u=1/r.
 */
(function(root){'use strict';
const pi=Math.PI,eps=1e-9;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function spin(a){if(!Number.isFinite(a)||Math.abs(a)>.98)throw new RangeError('Spin a* musi należeć do [-.98,.98]');return a;}
function horizons(a){a=spin(a);return {outer:1+Math.sqrt(1-a*a),inner:1-Math.sqrt(1-a*a)};}
function ergosurface(a,theta){a=spin(a);return 1+Math.sqrt(1-a*a*Math.cos(theta)**2);}
function metric(a,r,theta){
 a=spin(a);if(!(r>horizons(a).outer)||!Number.isFinite(theta)||theta<=0||theta>=pi)
 throw new RangeError('ZAMO musi być poza horyzontem i osią obrotu.');
 const si=Math.sin(theta),co=Math.cos(theta),sigma=r*r+a*a*co*co;
 const delta=r*r-2*r+a*a,A=(r*r+a*a)**2-a*a*delta*si*si;
 return {sigma,delta,A,omega:2*a*r/A,
  lapse:Math.sqrt(delta*sigma/A),gpp:A*si*si/sigma};
}
function isco(a,direction=1){
 a=spin(a);if(Math.abs(direction)!==1)throw new RangeError('Kierunek +1 lub −1');
 const z1=1+Math.cbrt(1-a*a)*(Math.cbrt(1+a)+Math.cbrt(1-a));
 const z2=Math.sqrt(3*a*a+z1*z1);
 return 3+z2-Math.sign(a*direction)*Math.sqrt(Math.max(0,(3-z1)*(3+z1+2*z2)));
}
function photonOrbit(a,direction=1){
 a=spin(a);if(Math.abs(direction)!==1)throw new RangeError('Kierunek +1 lub −1');
 return 2*(1+Math.cos(2/3*Math.acos(clamp(-a*direction,-1,1))));
}
function orbitOmega(a,r,direction=1){
 a=spin(a);if(Math.abs(direction)!==1||!(r>horizons(a).outer))throw new RangeError('Zła orbita');
 return direction/(r**1.5+direction*a);
}
function orbitPeriodSeconds(a,r,massSolar,direction=1,tgSeconds=4.925639893961039e-6){
 if(!(massSolar>0)||r<isco(a,direction))throw new RangeError('Stabilna orbita i dodatnia masa');
 return 2*pi*tgSeconds*massSolar/Math.abs(orbitOmega(a,r,direction));
}
function zamoClock(a,r,theta){return metric(a,r,theta).lapse;}
function frameDraggingPeriod(a,r,theta,massSolar,tgSeconds=4.925639893961039e-6){
 if(!(massSolar>0))throw new RangeError('Masa musi być dodatnia');
 const w=Math.abs(metric(a,r,theta).omega);
 return w<eps?Infinity:2*pi*tgSeconds*massSolar/w;
}
function parameters(a,r,theta,nr,nt,np){
 const m=metric(a,r,theta),d=Math.hypot(nr,nt,np);
 if(Math.abs(d-1)>1e-5)throw new RangeError('Lokalny wektor promienia musi być jednostkowy.');
 const E=m.lapse+m.omega*Math.sqrt(m.gpp)*np;
 if(E<=0)throw new RangeError('Niedodatnia energia fotonu.');
 const lambda=Math.sqrt(m.gpp)*np/E;
 const pth=Math.sqrt(m.sigma)*nt/E,si=Math.sin(theta),co=Math.cos(theta);
 const eta=pth*pth+co*co*(lambda*lambda/(si*si)-a*a);
 const impact=Math.sqrt(Math.max(0,lambda*lambda+eta));
 const K=eta+(lambda-a)**2;
 const c2=2*(a*a-a*lambda)-K,c4=(a*a-a*lambda)**2-a*a*K;
 const b=Math.max(eps,impact);
 const up=-Math.sqrt(m.sigma*m.delta)*nr/(E*r*r*b);
 return {a,lambda,eta,impact,K,c2,c4,E,
  init:[1/r,up,theta,pth/b,0],omega:m.omega,lapse:m.lapse};
}
function derivative(s,p){
 const [u,up,theta,tp]=s,{a,lambda,K,c2,c4,impact}=p;
 const b=Math.max(eps,impact),si=Math.sin(theta),co=Math.cos(theta);
 const D=Math.max(1e-7,1-2*u+a*a*u*u),s2=Math.max(1e-6,si*si);
 const ph=(a*(1+(a*a-a*lambda)*u*u)/D+lambda/s2-a)/b;
 return [up,(c2*u+3*K*u*u+2*c4*u*u*u)/(b*b),
  tp,(-a*a*si*co+lambda*lambda*co/(si*s2))/(b*b),ph];
}
function rk4(s,p,h){
 const add=(v,k,q)=>v.map((x,i)=>x+q*k[i]);
 const k1=derivative(s,p),k2=derivative(add(s,k1,.5*h),p),
 k3=derivative(add(s,k2,.5*h),p),k4=derivative(add(s,k3,h),p);
 return s.map((x,i)=>x+h*(k1[i]+2*k2[i]+2*k3[i]+k4[i])/6);
}
function trace(a,r,theta,nr,nt,np,{steps=570,step=.025,outer=1000}={}){
 if(steps<1||steps>5000||!(step>0&&step<=.09))throw new RangeError('Niepoprawny krok śledzenia');
 const p=parameters(a,r,theta,nr,nt,np),horizon=horizons(a).outer;
 if(p.impact<.05)return {status:'captured',impact:p.impact,path:[],constants:p};
 let s=p.init,status='limit',minimum=r,crossings=0;
 const path=[[r,theta,0]];
 for(let i=0;i<steps;i++){
  const n=rk4(s,p,step);
  if(n[0]>=1/horizon){status='captured';minimum=horizon;break;}
  if(n[0]<=1/outer&&n[1]<0){status='escaped';break;}
  if(n[0]<=0||!n.every(Number.isFinite)||n[2]<=.005||n[2]>=pi-.005)break;
  const rad=1/n[0];minimum=Math.min(minimum,rad);
  if((s[2]-pi/2)*(n[2]-pi/2)<=0)crossings++;
  if(i%4===0)path.push([rad,n[2],n[4]]);
  s=n;
 }
 return {status,impact:p.impact,constants:p,minimumRadius:minimum,crossings,path,finalState:s};
}
root.ATLAS_KERR201_CORE=Object.freeze({spin,horizons,ergosurface,metric,isco,photonOrbit,
 orbitOmega,orbitPeriodSeconds,zamoClock,frameDraggingPeriod,parameters,derivative,rk4,trace,clamp});
if(typeof module!=='undefined'&&module.exports)module.exports=root.ATLAS_KERR201_CORE;
})(typeof window!=='undefined'?window:globalThis);
