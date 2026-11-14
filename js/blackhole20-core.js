/**
 * ATLAS SOLARIS 20.0 — Schwarzschild science core.
 *
 * G=c=1, M=1 in all geodesic formulas. The Schwarzschild radial
 * coordinate r is measured in gravitational radii r_g=GM/c².
 * Null geodesics in a plane: u=1/r,
 * d²u/dφ² + u = 3u². No spin (Kerr), no radiative transfer.
 */
(function(root){
'use strict';
const G=6.67430e-11,C=299792458,MSUN=1.98847e30;
const RG_KM=G*MSUN/(C*C)/1000;
const TG_S=G*MSUN/(C*C*C);
const PHOTON_B=3*Math.sqrt(3);
const ISCO=6;
const masses=Object.freeze({
 sagittarius:{id:'sagittarius',name:'Sagittarius A*',short:'Sgr A*',massSolar:4.0e6,region:'Centrum Drogi Mlecznej'},
 m87:{id:'m87',name:'M87*',short:'M87*',massSolar:6.5e9,region:'Galaktyka Messier 87'},
 stellar:{id:'stellar',name:'Model gwiazdowy',short:'10 M☉',massSolar:10,region:'Przykładowa czarna dziura o masie 10 Słońc'}
});
function finite(value,name){
 if(!Number.isFinite(value))throw new RangeError(name+' musi być skończoną liczbą.');
 return value;
}
function clamp(x,a,b){return Math.max(a,Math.min(b,x));}
function lapse(r){
 finite(r,'Promień');
 if(r<=2)return 0;
 return Math.sqrt(1-2/r);
}
function gammaCircular(r){
 finite(r,'Promień orbity');
 if(r<=3)throw new RangeError('Brak kołowej orbity czasopodobnej poniżej sfery fotonowej.');
 return 1/Math.sqrt(1-3/r);
}
function speedCircular(r){
 finite(r,'Promień orbity');
 if(r<=3)throw new RangeError('Orbita niemożliwa.');
 return Math.sqrt(1/(r-2));
}
function shadowAngle(r){
 if(r<=3)throw new RangeError('Wybierz kamerę poza sferą fotonową (r > 3M).');
 return Math.asin(clamp(PHOTON_B*lapse(r)/r,0,1));
}
function orbitalPeriodSeconds(r,massSolar){
 finite(r,'Promień orbity');finite(massSolar,'Masa');
 if(r<6||massSolar<=0)throw new RangeError('Czas orbity stabilnej: r >= 6M i dodatnia masa.');
 return 2*Math.PI*Math.pow(r,1.5)*TG_S*massSolar;
}
function tideAcceleration(r,massSolar,lengthM=2){
 finite(r,'Promień');finite(massSolar,'Masa');finite(lengthM,'Rozmiar obiektu');
 if(r<=0||massSolar<=0||lengthM<0)throw new RangeError('Nieprawidłowa wartość.');
 const mass=massSolar*MSUN,distance=r*RG_KM*1000*massSolar;
 return 2*G*mass*lengthM/(distance*distance*distance);
}
function physical(massSolar,r){
 if(!(massSolar>0)||!(r>2))throw new RangeError('Masa musi być dodatnia, promień poza horyzontem.');
 const rg=massSolar*RG_KM,rs=2*rg,clock=lapse(r);
 return {massSolar,rgKm:rg,rsKm:rs,radiusKm:r*rg,
  photonSphereKm:3*rg,iscoKm:ISCO*rg,
  shadowAngularRadiusDeg:shadowAngle(Math.max(r,3.001))*180/Math.PI,
  staticClockRatio:clock,gravityRedshift:1/clock,
  iscoPeriodSeconds:orbitalPeriodSeconds(6,massSolar),
  tidalAcceleration2m:tideAcceleration(r,massSolar,2),
  gravitationalTimeSeconds:TG_S*massSolar};
}
function rhs(u){return 3*u*u-u;}
function step(u,v,h,curvature=true){
 // RK4 for u'=v, v'=3u²-u, with optional flat-space test v'=-u.
 const accel=x=>curvature?rhs(x):-x;
 const a1=v,b1=accel(u);
 const a2=v+.5*h*b1,b2=accel(u+.5*h*a1);
 const a3=v+.5*h*b2,b3=accel(u+.5*h*a2);
 const a4=v+h*b3,b4=accel(u+h*a3);
 return [u+h*(a1+2*a2+2*a3+a4)/6,
  v+h*(b1+2*b2+2*b3+b4)/6];
}
function initial(r0,impact,curvature=true){
 if(!(r0>3)||!(impact>0))throw new RangeError('Promień musi być > 3M, parametr zderzenia dodatni.');
 const f=curvature?1-2/r0:1;
 const sin=impact*Math.sqrt(f)/r0;
 if(sin>=1)throw new RangeError('Przy tej odległości b jest zbyt duże dla promienia skierowanego ku środkowi.');
 return {u:1/r0,v:Math.sqrt(Math.max(0,1-sin*sin))/impact,b:impact};
}
function trace(impact,{r0=160,maxSteps=2200,stepRadians=.012,flat=false,rExit=150}={}){
 if(!Number.isFinite(impact)||!(impact>0)||!(r0>3)||!(stepRadians>0))throw new RangeError('Nieprawidłowe parametry promienia.');
 let {u,v}=initial(r0,impact,!flat),phi=0,status='limit',minimum=r0;
 const path=[[r0,0]],h=stepRadians;
 for(let i=0;i<maxSteps;i++){
  [u,v]=step(u,v,h,!flat);phi+=h;
  if(u>=.5){status='captured';path.push([2*Math.cos(phi),2*Math.sin(phi)]);minimum=2;break;}
  if(u<=0){
   status='escaped';break;
  }
  const r=1/u;
  minimum=Math.min(minimum,r);
  if(i%3===0&&r<r0*1.2)path.push([r*Math.cos(phi),r*Math.sin(phi)]);
  if(v<0&&r>=rExit){status='escaped';break;}
 }
 return {impact,status,path,minimumRadius:minimum,angleRad:phi,flat};
}
function snapshotAtCamera(r,massSolar,id){
 const base=physical(massSolar,r);
 return {...base,id,criticalImpact:PHOTON_B,photonSphere:3,isco:6,
  horizon:2,model:'Schwarzschild bez rotacji',
  assumptions:'Statyczny obserwator poza horyzontem; akrecja modelowa.'};
}
root.ATLAS_BLACKHOLE20_CORE=Object.freeze({G,C,MSUN,RG_KM,TG_S,PHOTON_B,ISCO,
 masses,lapse,speedCircular,gammaCircular,shadowAngle,
 orbitalPeriodSeconds,tideAcceleration,physical,step,initial,trace,snapshotAtCamera,clamp});
if(typeof module!=='undefined'&&module.exports)module.exports=root.ATLAS_BLACKHOLE20_CORE;
})(typeof window!=='undefined'?window:globalThis);
