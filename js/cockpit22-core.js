/**
 * ATLAS SOLARIS 22.0 — physical camera mounted on the 21.0 geodesic probe.
 *
 * Kerr Boyer–Lindquist equatorial motion, local ZAMO tetrad:
 * γ = α u^t, v^hat_r = sqrt(g_rr) u^r / γ,
 * v^hat_phi = sqrt(g_phi_phi)(u^phi - ωu^t)/γ.
 *
 * Directions n represent spatial directions TO a source (backward photon ray).
 * Converting an incoming photon from ship to ZAMO with a Lorentz boost v:
 * n_Z = [n_S + (((γ−1)(v·n_S)/v²) − γ) v] / [γ(1−v·n_S)].
 * D=ν_ship/ν_Z = 1/[γ(1−v·n_S)] (local SR shift only).
 *
 * The gravity and Kerr null geodesics are handled by the renderer.
 */
(function(root){'use strict';
const Kerr=root.ATLAS_KERR201_CORE;
const Probe=root.ATLAS_PROBE21_CORE;
const BH=root.ATLAS_BLACKHOLE20_CORE;
const PI=Math.PI,EPS=1e-11;
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}
function norm(v){return Math.hypot(...v);}
function mul(a,n){return a.map(x=>x*n);}
function plus(a,b){return a.map((x,i)=>x+b[i]);}
function unit(a){const l=norm(a);return l>EPS?mul(a,1/l):null;}
function localVelocity(release,position){
 if(!Kerr||!Probe)throw new Error('Moduły fizyczne etapów 20.1 i 21.0 są wymagane.');
 const a=release.spin,r=position.r;
 const metric=Kerr.metric(a,r,PI/2),st=[r,position.vr,position.phi,position.t];
 const [, ,phidot,tdot]=Probe.rates(release,st);
 const gamma=metric.lapse*tdot;
 const radial=(r/Math.sqrt(metric.delta))*position.vr/gamma;
 const azimuthal=Math.sqrt(metric.gpp)*(phidot-metric.omega*tdot)/gamma;
 const beta2=radial*radial+azimuthal*azimuthal;
 if(!(gamma>=1-1e-6)||beta2>=1+.0005||!Number.isFinite(beta2)){
  throw new RangeError('Nieprawidłowa prędkość względem ZAMO');
 }
 const speed=Math.sqrt(Math.max(0,beta2));
 return {v:[radial,0,azimuthal],radial,azimuthal,
  speed,gamma:1/Math.sqrt(Math.max(EPS,1-beta2)),
  dtPerTau:tdot,phiPerTau:phidot,omega:metric.omega,lapse:metric.lapse,
  beta2,gravitationalClock:metric.lapse};
}
function shipToZamo(nShip,v){
 const n=unit(nShip),beta2=dot(v,v);
 if(!n||beta2>=1||beta2<0)throw new RangeError('Kierunek i prędkość: wektory fizyczne');
 if(beta2<EPS)return {direction:n,doppler:1,gamma:1};
 const gamma=1/Math.sqrt(1-beta2),vdot=dot(v,n);
 const denominator=gamma*(1-vdot);
 const scalar=((gamma-1)*vdot/beta2-gamma);
 const direction=unit(mul(plus(n,mul(v,scalar)),1/denominator));
 return {direction,doppler:1/denominator,gamma};
}
function zamoToShip(nZamo,v){
 const n=unit(nZamo),beta2=dot(v,v);
 if(!n||beta2>=1||beta2<0)throw new RangeError('Kierunek i prędkość: wektory fizyczne');
 if(beta2<EPS)return {direction:n,doppler:1,gamma:1};
 const gamma=1/Math.sqrt(1-beta2),vdot=dot(v,n);
 const scalar=((gamma-1)*vdot/beta2+gamma);
 const direction=unit(mul(plus(n,mul(v,scalar)),1/(gamma*(1+vdot))));
 return {direction,doppler:gamma*(1+vdot),gamma};
}
function cameraBasis(yaw=0,pitch=0){
 if(!Number.isFinite(yaw)||!Number.isFinite(pitch))throw new RangeError('Zły kąt kamery');
 const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
 const forward=[-cp*cy,-sp,cp*sy];
 const right=[sy,0,cy];
 const up=[sp*cy,-cp,-sp*sy];
 return {forward,right,up};
}
function direction(basis,x=0,y=0,fov=70){
 const n=plus(basis.forward,plus(mul(basis.right,x),mul(basis.up,y)));
 if(!Number.isFinite(fov)||fov<=0||fov>=170)throw new RangeError('Nieprawidłowe pole widzenia');
 return unit(n);
}
function sightFromPixel(basis,x,y,fov,height){
 const s=2*Math.tan(fov*PI/360)/height;
 return direction(basis,x*s,y*s,fov);
}
function yawAlongVelocity(v,away=false){
 const n=unit(v);
 if(!n)return 0;
 return Math.atan2(n[2],-n[0])+(away?PI:0);
}
function diagnostic(release,position,basis,relativistic=true){
 const local=localVelocity(release,position);
 const directionShip=basis.forward;
 const transform=relativistic?shipToZamo(directionShip,local.v):
  {direction:directionShip,doppler:1,gamma:local.gamma};
 const photon=Kerr.parameters(release.spin,position.r,PI/2,...transform.direction);
 const clockSeconds=BH?.TG_S||4.925639893961039e-6;
 return {local,doppler:transform.doppler,nShip:directionShip,
  nZamo:transform.direction,photon,photonEnergy:photon.E,
  rgTime:clockSeconds};
}
root.ATLAS_COCKPIT22_CORE=Object.freeze({
 dot,norm,mul,plus,unit,clamp,localVelocity,shipToZamo,zamoToShip,
 cameraBasis,direction,sightFromPixel,yawAlongVelocity,diagnostic
});
if(typeof module!=='undefined'&&module.exports)module.exports=root.ATLAS_COCKPIT22_CORE;
})(typeof window!=='undefined'?window:globalThis);
