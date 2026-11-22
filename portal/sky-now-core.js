/* ATLAS SOLARIS — NIEBO NAD TOBĄ / astronomical calculation layer v1.0
 * Reuses ATLAS_NO18_PHYSICS (sidereal time / geodetic alt-az, stage 18).
 * Planetary elements and rates from NASA/JPL SSD: Approximate Positions of the
 * Planets, Table 1, valid 1800–2050. This is NOT JPL Horizons.
 * Fixed-star coordinates are approximate catalogue J2000 positions.
 * Moon: abbreviated first-order lunar longitude/latitude (Meeus-style).
 * Geocentric planets and Moon (no topocentric parallax); no refraction,
 * terrain, light-time, nutation, proper motion or precise apparent corrections.
 * Educational star chart; NOT a telescope-pointing ephemeris.
 */
(function(root){
'use strict';
var A=root.ATLAS_NO18_PHYSICS;
if(!A)return;
var D=Math.PI/180,R=180/Math.PI,eps=23.43928*D;
function rad(v){return v*D}
function norm(v){return (v%360+360)%360}
function clamp(x,a,b){return Math.max(a,Math.min(b,x))}
function jd(t){return A.julianDay(t)}
function vlen(p){return Math.hypot(p[0],p[1],p[2])}
function eclToEq(p){
 var x=p[0],y=p[1]*Math.cos(eps)-p[2]*Math.sin(eps);
 var z=p[1]*Math.sin(eps)+p[2]*Math.cos(eps);
 return {raDeg:norm(Math.atan2(y,x)*R),decDeg:Math.atan2(z,Math.hypot(x,y))*R};
}
/* a, e, i, L, perihelion, ascending node, followed by their century rates.
 * NASA/JPL, https://ssd.jpl.nasa.gov/planets/approx_pos.html */
var elements={
 mercury:[[.38709927,.20563593,7.00497902,252.25032350,77.45779628,48.33076593],[.00000037,.00001906,-.00594749,149472.67411175,.16047689,-.12534081]],
 venus:[[.72333566,.00677672,3.39467605,181.97909950,131.60246718,76.67984255],[.00000390,-.00004107,-.00078890,58517.81538729,.00268329,-.27769418]],
 earth:[[1.00000261,.01671123,-.00001531,100.46457166,102.93768193,0],[.00000562,-.00004392,-.01294668,35999.37244981,.32327364,0]],
 mars:[[1.52371034,.09339410,1.84969142,-4.55343205,-23.94362959,49.55953891],[.00001847,.00007882,-.00813131,19140.30268499,.44441088,-.29257343]],
 jupiter:[[5.202887,.04838624,1.30439695,34.39644051,14.72847983,100.47390909],[-.00011607,-.00013253,-.00183714,3034.74612775,.21252668,.20469106]],
 saturn:[[9.53667594,.05386179,2.48599187,49.95424423,92.59887831,113.66242448],[-.00125060,-.00050991,.00193609,1222.49362201,-.41897216,-.28867794]],
 uranus:[[19.18916464,.04725744,.77263783,313.23810451,170.95427630,74.01692503],[-.00196176,-.00004397,-.00242939,428.48202785,.40805281,.04240589]],
 neptune:[[30.06992276,.00859048,1.77004347,-55.12002969,44.96476227,131.78422574],[.00026291,.00005105,.00035372,218.45945325,-.32241464,-.00508664]]
};
function heliocentric(key,t){
 var coeff=elements[key],T=(jd(t)-2451545)/36525;
 if(!coeff||!Number.isFinite(T))return null;
 var E=coeff[0].map(function(v,i){return v+coeff[1][i]*T});
 var a=E[0],e=E[1],I=rad(E[2]),L=E[3],peri=E[4],N=E[5];
 var M=rad(norm(L-peri));if(M>Math.PI)M-=2*Math.PI;
 var ecc=M;for(var i=0;i<12;i++){var step=(ecc-e*Math.sin(ecc)-M)/(1-e*Math.cos(ecc));ecc-=step;if(Math.abs(step)<1e-13)break;}
 var x=a*(Math.cos(ecc)-e),y=a*Math.sqrt(1-e*e)*Math.sin(ecc);
 var w=rad(peri-N),omega=rad(N);
 var cw=Math.cos(w),sw=Math.sin(w),co=Math.cos(omega),so=Math.sin(omega),ci=Math.cos(I),si=Math.sin(I);
 return [ (cw*co-sw*so*ci)*x+(-sw*co-cw*so*ci)*y,
  (cw*so+sw*co*ci)*x+(-sw*so+cw*co*ci)*y,
  (sw*si)*x+(cw*si)*y ];
}
function solarSystemEquatorial(key,t){
 if(key==='moon')return moonEquatorial(t);
 var e=heliocentric('earth',t);
 if(!e)return null;
 var p=key==='sun'?[0,0,0]:heliocentric(key,t);
 if(!p)return null;
 var g=[p[0]-e[0],p[1]-e[1],p[2]-e[2]];
 return Object.assign(eclToEq(g),{distanceAu:vlen(g),key:key});
}
/* Short lunar series — useful for finding the Moon, not eclipse calculation.
 * Source family: Astronomical Algorithms, first periodic terms of the Moon's
 * mean longitude, anomaly and argument of latitude.
 */
function moonEquatorial(t){
 var d=jd(t)-2451545;
 if(!Number.isFinite(d))return null;
 var L=norm(218.316+13.176396*d),M=rad(norm(134.963+13.064993*d)),F=rad(norm(93.272+13.229350*d));
 var lon=rad(L+6.289*Math.sin(M)),lat=rad(5.128*Math.sin(F));
 var v=[Math.cos(lat)*Math.cos(lon),Math.cos(lat)*Math.sin(lon),Math.sin(lat)];
 return Object.assign(eclToEq(v),{distanceKm:385001-20905*Math.cos(M),key:'moon'});
}
function phaseFraction(t){
 var s=solarSystemEquatorial('sun',t),m=moonEquatorial(t);if(!s||!m)return NaN;
 var cs=Math.sin(rad(s.decDeg))*Math.sin(rad(m.decDeg))+
  Math.cos(rad(s.decDeg))*Math.cos(rad(m.decDeg))*Math.cos(rad(s.raDeg-m.raDeg));
 return (1-clamp(cs,-1,1))/2;
}
/* Named navigation stars: approximate J2000 coordinates (degrees, RA/Dec).
 * No precession/proper motion corrections on the display. */
var stars=[
 ['polaris','Polarna',37.9546,89.2641,2.0],
 ['vega','Wega',279.2347,38.7837,.03],
 ['deneb','Deneb',310.358,45.280,1.25],
 ['altair','Altair',297.696,8.868,.76],
 ['sirius','Syriusz',101.2872,-16.7161,-1.46],
 ['betelgeuse','Betelgeza',88.793,7.407,.5],
 ['rigel','Rigel',78.634,-8.202,.13],
 ['bellatrix','Bellatrix',81.282,6.350,1.64],
 ['mintaka','Mintaka',83.001,-.299,2.23],
 ['alnilam','Alnilam',84.053,-1.202,1.69],
 ['alnitak','Alnitak',85.190,-1.943,1.74],
 ['saiph','Saiph',86.939,-9.669,2.06],
 ['capella','Kapella',79.172,45.998,.08],
 ['aldebaran','Aldebaran',68.980,16.510,.87],
 ['procyon','Procjon',114.826,5.225,.34],
 ['castor','Kastor',113.650,31.888,1.58],
 ['pollux','Polluks',116.329,28.026,1.14],
 ['regulus','Regulus',152.093,11.967,1.35],
 ['spica','Spika',201.298,-11.161,.97],
 ['arcturus','Arktur',213.915,19.182,-.05],
 ['antares','Antares',247.352,-26.432,1.05],
 ['fomalhaut','Fomalhaut',344.413,-29.622,1.16],
 ['denebola','Denebola',177.265,14.572,2.14],
 ['rasalhague','Rasalhague',263.734,12.560,2.08],
 ['canopus','Kanopus',95.988,-52.696,-.72],
 ['achernar','Achernar',24.429,-57.236,.45],
 ['acrux','Akruks',186.650,-63.099,.77],
 ['mimosa','Mimosa',191.930,-59.689,1.25],
 ['gacrux','Gakruks',187.791,-57.113,1.64],
 ['deltacrux','Delta Crucis',183.786,-58.749,2.79],
 ['dubhe','Dubhe',165.932,61.751,1.79],
 ['merak','Merak',165.460,56.382,2.37],
 ['phecda','Phecda',178.457,53.694,2.41],
 ['megrez','Megrez',183.857,57.032,3.32],
 ['alioth','Alioth',193.507,55.960,1.76],
 ['mizar','Mizar',200.981,54.925,2.23],
 ['alkaid','Alkaid',206.885,49.313,1.85],
 ['caph','Caph',2.295,59.150,2.28],
 ['schedar','Schedar',10.127,56.537,2.23],
 ['gammaCas','Gamma Cas',14.177,60.717,2.47],
 ['ruchbah','Ruchbah',21.455,60.235,2.68],
 ['segin','Segin',28.600,63.670,3.37],
 ['alpheratz','Alferatz',2.097,29.090,2.07],
 ['mirach','Mirach',17.433,35.621,2.05],
 ['almach','Almach',30.974,42.329,2.17],
 ['markab','Markab',346.190,15.205,2.49],
 ['scheat','Scheat',345.944,28.082,2.42],
 ['algenib','Algenib',3.309,15.184,2.84],
 ['enif','Enif',333.366,9.875,2.38],
 ['hamal','Hamal',31.794,23.462,2.01],
 ['nunki','Nunki',283.816,-26.296,2.05],
 ['shaula','Shaula',263.402,-37.104,1.62],
 ['sargas','Sargas',264.329,-42.997,1.86]
].map(function(a){return{id:a[0],name:a[1],raDeg:a[2],decDeg:a[3],magnitude:a[4],kind:'star',href:'../etapy/06/'};});
var lines=[
 ['dubhe','merak','phecda','megrez','alioth','mizar','alkaid'],['megrez','dubhe'],
 ['caph','schedar','gammaCas','ruchbah','segin'],
 ['betelgeuse','bellatrix','mintaka','alnilam','alnitak','saiph','rigel','bellatrix'],
 ['betelgeuse','alnitak'],['rigel','alnilam'],
 ['deneb','vega','altair','deneb'],
 ['alpheratz','mirach','almach'],['markab','scheat','alpheratz','algenib','markab'],
 ['acrux','mimosa','gacrux'],['mimosa','deltacrux','acrux'],
 ['capella','aldebaran'],['castor','pollux']
];
var objects=[
 {id:'sun',name:'Słońce',kind:'solar',magnitude:-26.7,href:'../etapy/03/'},
 {id:'moon',name:'Księżyc',kind:'moon',magnitude:-12,href:'../etapy/05/'},
 {id:'mercury',name:'Merkury',kind:'planet',magnitude:0.5,href:'../etapy/01/'},
 {id:'venus',name:'Wenus',kind:'planet',magnitude:-4,href:'../etapy/01/'},
 {id:'mars',name:'Mars',kind:'planet',magnitude:1,href:'../etapy/01/'},
 {id:'jupiter',name:'Jowisz',kind:'planet',magnitude:-2,href:'../etapy/01/'},
 {id:'saturn',name:'Saturn',kind:'planet',magnitude:.6,href:'../etapy/01/'},
 {id:'uranus',name:'Uran',kind:'planet',magnitude:5.8,href:'../etapy/01/'},
 {id:'neptune',name:'Neptun',kind:'planet',magnitude:7.8,href:'../etapy/01/'}
];
var targets=Object.keys(A.targets).filter(function(id){return!['polaris','vega','sirius'].includes(id);}).map(function(id){
 var t=A.targets[id];return{id:id,name:t.name,kind:'deep',raDeg:t.ra,decDeg:t.dec,magnitude:t.magnitude,
 href:id==='m42'?'../etapy/35/':id==='m31'?'../etapy/18/':'../etapy/18/'};
});
function locate(t,lat,lon){
 if(!Number.isFinite(lat)||Math.abs(lat)>90||!Number.isFinite(lon)||Math.abs(lon)>180||!(t instanceof Date)||!Number.isFinite(t.getTime()))return null;
 var sample=objects.map(function(o){return Object.assign({},o,solarSystemEquatorial(o.id,t));}).concat(stars,targets);
 return sample.filter(function(o){return Number.isFinite(o.raDeg)&&Number.isFinite(o.decDeg)}).map(function(o){
  return Object.assign({},o,A.position(t,lat,lon,o.raDeg,o.decDeg));
 });
}
function mainBodies(t,lat,lon){return locate(t,lat,lon).filter(function(o){return ['solar','planet','moon'].includes(o.kind)})}
function riseSet(id,date,lat,lon){
 if(!Number.isFinite(lat)||Math.abs(lat)>90||!Number.isFinite(lon)||Math.abs(lon)>180||!(date instanceof Date)||!Number.isFinite(date.getTime()))return null;
 var name=objects.find(function(o){return o.id===id;});
 if(!name)return null;
 var start=new Date(date.getFullYear(),date.getMonth(),date.getDate(),0,0,0,0);
 var end=new Date(date.getFullYear(),date.getMonth(),date.getDate()+1,0,0,0,0),step=12*60000;
 var getAlt=function(t){var eq=solarSystemEquatorial(id,t);return eq?A.position(t,lat,lon,eq.raDeg,eq.decDeg).altitudeDeg:NaN};
 var prev=start.getTime(),alt=getAlt(start),result={rise:null,set:null},last=Math.min(end.getTime(),prev+step);
 while(prev<end.getTime()){
  var test=new Date(last),a=getAlt(test);
  if((alt<0&&a>=0)||(alt>0&&a<=0)){
   var lo=prev,hi=last,lowAlt=alt;
   for(var j=0;j<22;j++){var mid=(lo+hi)/2,mm=getAlt(new Date(mid));if((lowAlt<0)===(mm<0)){lo=mid;lowAlt=mm;}else hi=mid;}
   var k=alt<0?'rise':'set';if(!result[k])result[k]=new Date((lo+hi)/2);
  }
  prev=last;alt=a;last=Math.min(end.getTime(),prev+step);
 }
 return result;
}
var out={
 julianDay:jd,heliocentric:heliocentric,solarSystemEquatorial:solarSystemEquatorial,
 moonEquatorial:moonEquatorial,phaseFraction:phaseFraction,
 locate:locate,mainBodies:mainBodies,riseSet:riseSet,
 stars:stars,lines:lines,objects:objects,targets:targets,
 darkness:A.darkness,sunAltitudeDegrees:A.sunAltitudeDegrees,position:A.position,gmstDegrees:A.gmstDegrees
};
root.ATLAS_SKY_NOW_CORE=out;
if(typeof module!=='undefined'&&module.exports)module.exports=out;
})(typeof window!=='undefined'?window:globalThis);