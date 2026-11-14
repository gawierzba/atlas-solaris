/* ATLAS SOLARIS 26.0 — Long-term sky precession time machine.
 * Vondrák, Capitaine & Wallace (2011, corrigendum 2012); expressions ported
 * from the open-source ERFA project (NumFOCUS), ltpequ.c, ltpecl.c and ltp.c.
 * Copyright (C) 2013-2023 NumFOCUS Foundation. ERFA BSD-3-like license:
 * see legal/ERFA-LICENSE.txt and https://github.com/liberfa/erfa.
 * This is an independent JavaScript reimplementation; not official SOFA.
 * Coordinates: mean J2000 equator/equinox, Julian epoch TT approximated by year.
 * No high-precision stellar propagation, atmospheric refraction or nutation.
 */
(function(root){'use strict';
const R=Math.PI/180,D=180/Math.PI,AS2R=Math.PI/(180*3600),EPS0=84381.406*AS2R,TAU=2*Math.PI;
const XY_POL=[[5453.282155,.4252841,-.00037173,-.000000152],[-73750.930350,-.7675452,-.00018725,.000000231]];
const XY_PER=[
 [256.75,-819.940624,75004.344875,81491.287984,1558.515853],
 [708.15,-8444.676815,624.033993,787.163481,7774.939698],
 [274.20,2600.009459,1251.136893,1251.296102,-2219.534038],
 [241.45,2755.175630,-1102.212834,-1257.950837,-2523.969396],
 [2309.00,-167.659835,-2660.664980,-2966.799730,247.850422],
 [492.20,871.855056,699.291817,639.744522,-846.485643],
 [396.10,44.769698,153.167220,131.600209,-1393.124055],
 [288.90,-512.313065,-950.865637,-445.040117,368.526116],
 [231.10,-819.415595,499.754645,584.522874,749.045012],
 [1610.00,-538.071099,-145.188210,-89.756563,444.704518],
 [620.00,-189.793622,558.116553,524.429630,235.934465],
 [157.87,-402.922932,-23.923029,-13.549067,374.049623],
 [220.30,179.516345,-165.405086,-210.157124,-171.330180],
 [1200.00,-9.814756,9.344131,-44.919798,-22.899655]
];
const PQ_POL=[[5851.607687,-.1189000,-.00028913,.000000101],[-1600.886300,1.1689818,-.00000020,-.000000437]];
const PQ_PER=[
 [708.15,-5486.751211,-684.661560,667.666730,-5523.863691],
 [2309.00,-17.127623,2446.283880,-2354.886252,-549.747450],
 [1620.00,-617.517403,399.671049,-428.152441,-310.998056],
 [492.20,413.442940,-356.652376,376.202861,421.535876],
 [1183.00,78.614193,-186.387003,184.778874,-36.776172],
 [622.00,-180.732815,-316.800070,335.321713,-145.278396],
 [882.00,-87.676083,198.296701,-185.138669,-34.744450],
 [547.00,46.140315,101.135679,-120.972830,22.885731]
];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const norm=v=>Math.hypot(...v);
const unit=v=>{const d=norm(v);return d>1e-15?v.map(x=>x/d):null;};
const scale=(v,k)=>v.map(x=>x*k);
const add=(a,b)=>a.map((x,i)=>x+b[i]);
const eqVec=(ra,dec)=>[Math.cos(dec*R)*Math.cos(ra*R),Math.cos(dec*R)*Math.sin(ra*R),Math.sin(dec*R)];
const vecDir=v=>({ra:((Math.atan2(v[1],v[0])*D)%360+360)%360,dec:Math.asin(clamp(v[2]/norm(v),-1,1))*D});
function periodic(year,pol,terms){
 const t=(year-2000)/100,w=TAU*t;
 const a=[0,0];
 for(const [period,cx,cy,sx,sy] of terms){const ang=w/period,c=Math.cos(ang),s=Math.sin(ang);a[0]+=c*cx+s*sx;a[1]+=c*cy+s*sy;}
 let p=1;for(let i=0;i<4;i++,p*=t){a[0]+=pol[0][i]*p;a[1]+=pol[1][i]*p;}
 return a.map(x=>x*AS2R);
}
function equatorPole(epoch){
 if(!Number.isFinite(epoch)||epoch<-220000||epoch>220000)throw new RangeError('Nieprawidłowa epoka precesji.');
 const [x,y]=periodic(epoch,XY_POL,XY_PER);
 return [x,y,Math.sqrt(Math.max(0,1-x*x-y*y))];
}
function eclipticPole(epoch){
 if(!Number.isFinite(epoch)||epoch<-220000||epoch>220000)throw new RangeError('Nieprawidłowa epoka precesji.');
 const [p,q]=periodic(epoch,PQ_POL,PQ_PER),w=Math.sqrt(Math.max(0,1-p*p-q*q));
 return [p,-q*Math.cos(EPS0)-w*Math.sin(EPS0),-q*Math.sin(EPS0)+w*Math.cos(EPS0)];
}
function precession(epoch){
 const pole=equatorPole(epoch),ecliptic=eclipticPole(epoch),equinox=unit(cross(pole,ecliptic)),east=unit(cross(pole,equinox));
 const epsilon=Math.acos(clamp(dot(pole,ecliptic),-1,1))*D;
 return {epoch,pole,ecliptic,equinox,east,obliquity:epsilon,matrix:[equinox,east,pole],
  northPole:vecDir(pole),equinoxDir:vecDir(equinox),eclipticPole:vecDir(ecliptic)};
}
const J2000_ECL=[0,-Math.sin(EPS0),Math.cos(EPS0)],J2000_X=[1,0,0],J2000_Y=unit(cross(J2000_ECL,J2000_X));
function eclipticLongitudeJ2000(v){return ((Math.atan2(dot(v,J2000_Y),dot(v,J2000_X))*D)%360+360)%360;}
const angle=(a,b)=>Math.acos(clamp(dot(unit(a),unit(b)),-1,1))*D;
const POLE_STARS=Object.freeze([
 {name:'Polarna',latin:'Polaris · α UMi',ra:37.95456,dec:89.26411,mag:1.98},
 {name:'Tubana',latin:'Thuban · α Dra',ra:211.097,dec:64.3758,mag:3.66},
 {name:'Wega',latin:'Vega · α Lyr',ra:279.2347,dec:38.7837,mag:.03},
 {name:'Errai',latin:'γ Cep',ra:354.836,dec:77.632,mag:3.21},
 {name:'Alderamin',latin:'α Cep',ra:319.645,dec:62.585,mag:2.45},
 {name:'Kochab',latin:'β UMi',ra:222.676,dec:74.156,mag:2.08},
 {name:'Deneb',latin:'α Cyg',ra:310.358,dec:45.280,mag:1.25},
 {name:'Alfirk',latin:'β Cep',ra:322.165,dec:70.560,mag:3.23},
 {name:'Sadr',latin:'γ Cyg',ra:305.557,dec:40.256,mag:2.23}
].map(s=>Object.freeze({...s,v:eqVec(s.ra,s.dec)})));
function nearestPoleStars(epoch,limit=5){const v=precession(epoch).pole;return POLE_STARS.map(s=>({...s,separation:angle(s.v,v)})).sort((a,b)=>a.separation-b.separation).slice(0,limit);}
function horizonAtPole(epoch,starRa,starDec){const p=precession(epoch);return 90-angle(p.pole,eqVec(starRa,starDec));}
function markers(step=250){const out=[];for(let year=-12000;year<=16000;year+=step)out.push(precession(year));return out;}
const API=Object.freeze({equatorPole,eclipticPole,precession,eclipticLongitudeJ2000,nearestPoleStars,
 horizonAtPole,markers,eqVec,vecDir,angle,clamp,dot,cross,norm,unit,scale,add,POLE_STARS,J2000_ECL,J2000_X,J2000_Y});
root.ATLAS_TIME26_CORE=API;
if(typeof module!=='undefined'&&module.exports)module.exports=API;
})(typeof window!=='undefined'?window:globalThis);