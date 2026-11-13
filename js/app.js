
/**
 * Astronomical core — JPL SSD approximate planetary elements, Table 1 (1800–2050).
 * Earth corrected for geocenter using approximate lunar theory.
 * Geometric, not light-time corrected. No external libraries or API requests.
 * Source: https://ssd.jpl.nasa.gov/planets/approx_pos.html
 */
const AU_KM = 149597870.7;
const DEG = Math.PI/180;
const RAD = 180/Math.PI;
const J2000 = 2451545.0;
const EPS = 23.439291111*DEG;
const P = (x)=>((x%360)+360)%360;
const bodies = [
 {id:'sun',pl:'Słońce',type:'Gwiazda',radiusKm:696340,color:'#ffbd71',desc:'Gwiazda centralna, źródło światła i energii.'},
 {id:'mercury',pl:'Merkury',type:'Planeta skalista',radiusKm:2439.7,color:'#a9a8a3',desc:'Najbliższa Słońcu planeta, z bardzo długą dobą słoneczną.'},
 {id:'venus',pl:'Wenus',type:'Planeta skalista',radiusKm:6051.8,color:'#e4c68c',desc:'Gęsta atmosfera i powolny obrót wsteczny.'},
 {id:'earth',pl:'Ziemia',type:'Planeta skalista',radiusKm:6371,color:'#75b9ec',desc:'Jedyny znany świat z życiem na powierzchni.'},
 {id:'moon',pl:'Księżyc',type:'Naturalny satelita',radiusKm:1737.4,color:'#c6c8c5',desc:'Naturalny satelita Ziemi, obraca się synchronicznie.'},
 {id:'mars',pl:'Mars',type:'Planeta skalista',radiusKm:3389.5,color:'#dc825c',desc:'Czerwona planeta z cienką atmosferą i sezonowymi czapami polarnymi.'},
 {id:'jupiter',pl:'Jowisz',type:'Olbrzym gazowy',radiusKm:69911,color:'#e9c5a9',desc:'Największa planeta Układu Słonecznego.'},
 {id:'saturn',pl:'Saturn',type:'Olbrzym gazowy',radiusKm:58232,color:'#e8d1a4',desc:'Planeta otoczona rozbudowanym systemem pierścieni.'},
 {id:'uranus',pl:'Uran',type:'Olbrzym lodowy',radiusKm:25362,color:'#94dbe0',desc:'Oś obrotu silnie pochylona względem płaszczyzny orbity.'},
 {id:'neptune',pl:'Neptun',type:'Olbrzym lodowy',radiusKm:24622,color:'#5189ef',desc:'Odległy lodowy olbrzym o silnych wiatrach.'}
];
const byId = Object.fromEntries(bodies.map(x=>[x.id,x]));
// [a, e, inclination, mean longitude, longitude of perihelion, longitude of node]
// each entry contains element values at J2000 and change per Julian century.
const elements = {
 mercury:[[.38709927,.20563593,7.00497902,252.25032350,77.45779628,48.33076593],[.00000037,.00001906,-.00594749,149472.67411175,.16047689,-.12534081]],
 venus:[[.72333566,.00677672,3.39467605,181.97909950,131.60246718,76.67984255],[.00000390,-.00004107,-.00078890,58517.81538729,.00268329,-.27769418]],
 earth:[[1.00000261,.01671123,-.00001531,100.46457166,102.93768193,0],[.00000562,-.00004392,-.01294668,35999.37244981,.32327364,0]],
 mars:[[1.52371034,.09339410,1.84969142,-4.55343205,-23.94362959,49.55953891],[.00001847,.00007882,-.00813131,19140.30268499,.44441088,-.29257343]],
 jupiter:[[5.20288700,.04838624,1.30439695,34.39644051,14.72847983,100.47390909],[-.00011607,-.00013253,-.00183714,3034.74612775,.21252668,.20469106]],
 saturn:[[9.53667594,.05386179,2.48599187,49.95424423,92.59887831,113.66242448],[-.00125060,-.00050991,.00193609,1222.49362201,-.41897216,-.28867794]],
 uranus:[[19.18916464,.04725744,.77263783,313.23810451,170.95427630,74.01692503],[-.00196176,-.00004397,-.00242939,428.48202785,.40805281,.04240589]],
 neptune:[[30.06992276,.00859048,1.77004347,-55.12002969,44.96476227,131.78422574],[.00026291,.00005105,.00035372,218.45945325,-.32241464,-.00508664]]
};
const orbitalPeriods = {mercury:87.969,venus:224.701,earth:365.256,mars:686.980,jupiter:4332.59,saturn:10759.2,uranus:30688.5,neptune:60182};
function julianDate(date){return date.getTime()/86400000+2440587.5;}
function fromJulian(jd){return new Date((jd-2440587.5)*86400000);}
const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const mul=(a,s)=>[a[0]*s,a[1]*s,a[2]*s];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const norm=(a)=>Math.hypot(...a);
const unit=(a)=>mul(a,1/Math.max(1e-20,norm(a)));
function eqToEcl(v){return [v[0],Math.cos(EPS)*v[1]+Math.sin(EPS)*v[2],-Math.sin(EPS)*v[1]+Math.cos(EPS)*v[2]];}
function eclToEq(v){return [v[0],Math.cos(EPS)*v[1]-Math.sin(EPS)*v[2],Math.sin(EPS)*v[1]+Math.cos(EPS)*v[2]];}
function getElements(id,jd){
 const [base,rate]=elements[id]; const T=(jd-J2000)/36525;
 return base.map((b,i)=>b+rate[i]*T);
}
function keplerPos(id,jd, Eoverride=null){
 const [a,e,i,L,peri,node]=getElements(id,jd);
 let M=P(L-peri)*DEG;
 if(M>Math.PI)M-=2*Math.PI;
 let E=M;
 if(Eoverride===null){for(let k=0;k<12;k++){const d=(E-e*Math.sin(E)-M)/(1-e*Math.cos(E));E-=d;if(Math.abs(d)<1e-12)break;}}
 else E=Eoverride;
 const xp=a*(Math.cos(E)-e),yp=a*Math.sqrt(1-e*e)*Math.sin(E);
 const w=(peri-node)*DEG,o=node*DEG,inc=i*DEG;
 const cw=Math.cos(w),sw=Math.sin(w),co=Math.cos(o),so=Math.sin(o),ci=Math.cos(inc),si=Math.sin(inc);
 return [(cw*co-sw*so*ci)*xp+(-sw*co-cw*so*ci)*yp,
         (cw*so+sw*co*ci)*xp+(-sw*so+cw*co*ci)*yp,
         (sw*si)*xp+(cw*si)*yp];
}
/** Simplified lunar periodic series, sufficient for visual phase and nearby angle, not occultations. */
function moonGeo(jd){
 const T=(jd-J2000)/36525;
 const L=P(218.3164477+481267.88123421*T-.0015786*T*T)*DEG;
 const D=P(297.8501921+445267.1114034*T-.0018819*T*T)*DEG;
 const M=P(357.5291092+35999.0502909*T-.0001536*T*T)*DEG;
 const MP=P(134.9633964+477198.8675055*T+.0087414*T*T)*DEG;
 const F=P(93.2720950+483202.0175233*T-.0036539*T*T)*DEG;
 const sn=Math.sin,cs=Math.cos;
 const lon=(L/DEG+6.289*sn(MP)+1.274*sn(2*D-MP)+.658*sn(2*D)+.214*sn(2*MP)-.186*sn(M)-.114*sn(2*F)+.059*sn(2*D-2*MP)+.057*sn(2*D-M-MP)+.053*sn(2*D+MP)+.046*sn(2*D-M)+.041*sn(M-MP)-.035*sn(D)-.031*sn(M+MP))*DEG;
 const lat=(5.128*sn(F)+.280*sn(MP+F)+.277*sn(MP-F)+.173*sn(2*D-F)+.055*sn(2*D+F-MP)+.046*sn(2*D-F-MP)+.033*sn(2*D+F)+.017*sn(2*MP+F))*DEG;
 const dist=(385000.56-20905*cs(MP)-3699*cs(2*D-MP)-2956*cs(2*D)-570*cs(2*MP)+246*cs(2*MP-2*D)-205*cs(M-2*D)-171*cs(MP+2*D))/AU_KM;
 return [dist*Math.cos(lat)*Math.cos(lon),dist*Math.cos(lat)*Math.sin(lon),dist*Math.sin(lat)];
}
/** Ephemeris high resolution 2024–2040 for eclipse geometries; fallback elsewhere. */
const PRECISE_EPHEMERIS=(()=>{
 const data=window.ATLAS_EPHEMERIS;if(!data)return null;
 try{const bytes=atob(data.packed),buffer=new ArrayBuffer(bytes.length),u8=new Uint8Array(buffer);
 for(let k=0;k<bytes.length;k++)u8[k]=bytes.charCodeAt(k);
 const result={jd0:data.jd0,step:data.step,count:data.count,values:new Float64Array(buffer)};
 delete data.packed;return result;}catch(e){console.warn('Eclipse ephemeris unavailable',e);return null;}
})();
function sampledEphemeris(jd){
 const e=PRECISE_EPHEMERIS;if(!e)return null;let x=(jd-e.jd0)/e.step;
 if(x<0||x>e.count-1)return null;
 const i=Math.min(e.count-2,Math.floor(x)),t=x-i,v=e.values;
 const interpolated=(j)=>{
   const y0=v[Math.max(0,i-1)*6+j],y1=v[i*6+j],y2=v[(i+1)*6+j],y3=v[Math.min(e.count-1,i+2)*6+j];
   return y1+.5*t*(y2-y0+t*(2*y0-5*y1+4*y2-y3+t*(3*(y1-y2)+y3-y0)));
 };
 return {sun:[interpolated(0),interpolated(1),interpolated(2)],moon:[interpolated(3),interpolated(4),interpolated(5)]};
}
function positions(jd){
 const precise=sampledEphemeris(jd);
 const moonRelative=precise?.moon||moonGeo(jd);
 const emb=keplerPos('earth',jd);
 const earth=precise?mul(precise.sun,-1):sub(emb,mul(moonRelative,.0121505856));
 const out={sun:[0,0,0],earth,moon:add(earth,moonRelative)};
 for(const id of Object.keys(elements)){if(id!=='earth')out[id]=keplerPos(id,jd);}
 return out;
}
/** Equatorial body fixed axes expressed in ecliptic J2000. */
function axes(id,jd,p=null){
 const d=jd-J2000,T=d/36525;
 if(id==='earth'){
   // GMST in degrees, J2000 mean sidereal angle; correct for civil longitude.
   const theta=P(280.46061837+360.98564736629*d+.000387933*T*T-T*T*T/38710000)*DEG;
   const x=eqToEcl([Math.cos(theta),Math.sin(theta),0]);
   const y=eqToEcl([-Math.sin(theta),Math.cos(theta),0]);
   const z=eqToEcl([0,0,1]);
   return {x,y,z};
 }
 if(id==='moon'){
   // Mean lunar near-side, approximate synchronous orientation, omits physical libration.
   const pos=p||positions(jd);
   const x=unit(sub(pos.earth,pos.moon));
   const pole0=unit(eqToEcl([Math.cos(66.5392*DEG)*Math.cos(269.9949*DEG),Math.cos(66.5392*DEG)*Math.sin(269.9949*DEG),Math.sin(66.5392*DEG)]));
   const y=unit(cross(pole0,x));
   const z=unit(cross(x,y));
   return {x:unit(x),y,z};
 }
 const poleRotation={
 sun:[286.13,63.87,84.176,14.1844000],
 mercury:[281.0097-.0328*T,61.4143-.0049*T,329.5469,6.1385025],
 venus:[272.76,67.16,160.20,-1.4813688],
 mars:[317.68143-.1061*T,52.88650-.0609*T,176.630,350.89198226],
 jupiter:[268.056595-.006499*T,64.495303+.002413*T,284.95,870.536],
 saturn:[40.589-.036*T,83.537-.004*T,38.90,810.7939024],
 uranus:[257.311,-15.175,203.81,-501.1600928],
 neptune:[299.36,43.46,253.18,536.3128492]
 };
 const [ra,dec,w0,wRate]=poleRotation[id]||poleRotation.sun;
 const pole=unit(eqToEcl([Math.cos(dec*DEG)*Math.cos(ra*DEG),Math.cos(dec*DEG)*Math.sin(ra*DEG),Math.sin(dec*DEG)]));
 const node=unit(cross(eqToEcl([0,0,1]),pole));
 const q=unit(cross(pole,node)), w=P(w0+wRate*d)*DEG;
 const x=add(mul(node,Math.cos(w)),mul(q,Math.sin(w)));
 const y=unit(cross(pole,x));
 return {x:unit(x),y,z:pole};
}
/** Location at latitude and east longitude, measured from Earth's or Moon's prime meridian. */
function surfacePoint(id,jd,latDeg,lonDeg,p=null){
 const ax=axes(id,jd,p); const lat=latDeg*DEG,lon=lonDeg*DEG;
 const cl=Math.cos(lat),sl=Math.sin(lat),co=Math.cos(lon),so=Math.sin(lon);
 const up=unit(add(add(mul(ax.x,cl*co),mul(ax.y,cl*so)),mul(ax.z,sl)));
 const east=unit(add(mul(ax.x,-so),mul(ax.y,co)));
 const north=unit(cross(up,east));
 const radiusKm=byId[id].radiusKm;
 const observer=add((p||positions(jd))[id],mul(up,(radiusKm+0.002)/AU_KM));
 return {observer,up,east,north};
}
function horizon(id,jd,lat,lon){
 const pos=positions(jd),point=surfacePoint(id,jd,lat,lon,pos);
 const result={};
 for(const body of bodies){if(body.id===id)continue;
  const dir=sub(pos[body.id],point.observer);
  const east=dot(dir,point.east),north=dot(dir,point.north),up=dot(dir,point.up);
  const distanceAU=norm(dir);
  result[body.id]={east:east/distanceAU,north:north/distanceAU,up:up/distanceAU,
   altitude:Math.asin(Math.max(-1,Math.min(1,up/distanceAU)))*RAD,
   azimuth:P(Math.atan2(east,north)*RAD),distanceAU,
   angularRadius:Math.atan2(byId[body.id].radiusKm,AU_KM*distanceAU)};
 }
 return result;
}

/** HYG J2000 equatorial stars. V magnitudes, B-V color; no precession/proper-motion. */
const STAR_CATALOG=(window.ATLAS_STARS||[]).map((s,index)=>{
 const ra=s[0]/100*DEG, dec=s[1]/100*DEG;
 const eq=[Math.cos(dec)*Math.cos(ra),Math.cos(dec)*Math.sin(ra),Math.sin(dec)];
 return {id:index,name:s[4]||'',ra:s[0]/100,dec:s[1]/100,mag:s[2]/10,bv:s[3]/10,dir:unit(eqToEcl(eq))};
});
const NAMED_STARS=STAR_CATALOG.filter(s=>s.name);
function starHorizon(star,pt){const v=star.dir;const east=dot(v,pt.east),north=dot(v,pt.north),up=dot(v,pt.up);return {
 altitude:Math.asin(Math.max(-1,Math.min(1,up)))*RAD, azimuth:P(Math.atan2(east,north)*RAD),east,north,up};}
function colorBV(ci){
 if(ci<-.06)return [.67,.80,1];if(ci<.38)return [.86,.91,1];
 if(ci<.88)return [1,.96,.82];if(ci<1.40)return [1,.80,.60];return [1,.66,.48];
}
function rgbaStar(star,opacity){const [r,g,b]=colorBV(star.bv);return `rgba(${Math.round(r*255)},${Math.round(g*255)},${Math.round(b*255)},${opacity})`;}

function scientificRange(jd){const y=fromJulian(jd).getUTCFullYear();return y>=1800&&y<=2050;}

;

const VS_SPHERE=`#version 300 es
precision highp float;
in vec3 aPos;in vec3 aNormal;in vec2 aUV;
uniform mat4 uVP;uniform mat4 uModel;uniform mat3 uBasis;
out vec3 vNormal;out vec3 vWorld;out vec2 vUV;
void main(){vec4 w=uModel*vec4(aPos,1.);vWorld=w.xyz;vNormal=normalize(uBasis*aNormal);vUV=aUV;gl_Position=uVP*w;}`;
const FS_SPHERE=`#version 300 es
precision highp float;in vec3 vNormal;in vec3 vWorld;in vec2 vUV;
uniform sampler2D uTex;uniform vec3 uSun;uniform vec3 uCamera;
uniform float uEmit;uniform float uLighting;uniform float uAtmos;
uniform float uEclipseBody;uniform vec3 uEarthPhysical;uniform vec3 uMoonPhysical;
uniform float uRe,uRm,uRs;
out vec4 frag;
void main(){
 vec3 tex=texture(uTex,vUV).rgb;
 float L=max(0.,dot(normalize(vNormal),normalize(uSun-vWorld)));
 vec3 c=tex*(uEmit>0.5?1.4:mix(.93,.028+1.35*pow(L,.75),uLighting));
 if(uEmit>0.5)c=mix(c,vec3(1.,.82,.42),.22);
 if(uEclipseBody>0.5 && uLighting>.5){
   if(uEclipseBody<1.5){
     vec3 pt=uEarthPhysical+normalize(vNormal)*uRe;
     vec3 sv=normalize(-pt), mv=normalize(uMoonPhysical-pt);
     float ds=length(pt),dm=length(uMoonPhysical-pt);
     float asun=atan(uRs,ds),amoon=atan(uRm,dm);
     float delta=acos(clamp(dot(sv,mv),-1.,1.));
     float overlap=1.-smoothstep(max(0.,amoon-asun),asun+amoon,delta);
     if(amoon<asun)overlap*=min(1.,(amoon*amoon)/(asun*asun));
     c*=1.-.95*overlap;
   }else{
     vec3 moonP=uMoonPhysical+normalize(vNormal)*uRm;
     vec3 axis=normalize(uEarthPhysical); // Sun at origin, umbra extends away from Sun
     vec3 q=moonP-uEarthPhysical;
     float along=dot(q,axis);
     float d=length(q-along*axis);
     float rUmbra=uRe*1.02-along*(uRs-uRe)/max(length(uEarthPhysical),.00001);
     float rPen=uRe*1.02+along*(uRs+uRe)/max(length(uEarthPhysical),.00001);
     float umbra=step(0.,along)*(1.-smoothstep(rUmbra-uRm*.3,rUmbra+uRm*.4,d));
     float penumbra=step(0.,along)*(1.-smoothstep(rUmbra,rPen,d));
     c=mix(c,c*.7,penumbra);
     c=mix(c,vec3(.24,.048,.036)+c*.14,umbra*.88);
   }
 }
 if(uAtmos>.5&&uLighting>.5){
    float rim=pow(1.-max(0.,dot(normalize(vNormal),normalize(uCamera-vWorld))),3.4);
    vec3 tint=uAtmos<1.5?vec3(.16,.52,.89):(uAtmos<2.5?vec3(.96,.76,.37):vec3(.76,.36,.18));
    c+=tint*rim*(.11+.28*L);
 }
 frag=vec4(c,1.);
}`;
const VS_LINE=`#version 300 es
precision highp float;in vec3 aPos;uniform mat4 uVP;void main(){gl_Position=uVP*vec4(aPos,1.);}`;
const FS_LINE=`#version 300 es
precision highp float;uniform vec4 uColor;out vec4 frag;void main(){frag=uColor;}`;
const VS_POINTS=`#version 300 es
precision highp float;in vec3 aPos;in float aSize;in vec3 aColor;uniform mat4 uStarVP;uniform float uScale;uniform mat3 uStarBasis;uniform float uSurface;
out vec3 vColor;void main(){vec3 pt=uSurface>.5?uStarBasis*aPos:aPos;gl_Position=uStarVP*vec4(pt,1.);gl_PointSize=min(70.,max(1.,aSize*uScale));vColor=aColor;}`;
const FS_POINTS=`#version 300 es
precision highp float;in vec3 vColor;uniform float uAlpha;out vec4 frag;
void main(){vec2 p=gl_PointCoord*2.-1.;float r=length(p);float a=pow(max(0.,1.-r*r),2.);if(r>1.)discard;frag=vec4(vColor,a*uAlpha);}`;
const VS_RING=`#version 300 es
precision highp float;in vec3 aPos;in vec2 aUV;uniform mat4 uVP;uniform mat4 uModel;out vec2 vUV;void main(){vUV=aUV;gl_Position=uVP*uModel*vec4(aPos,1.);}`;
const FS_RING=`#version 300 es
precision highp float;uniform sampler2D uTex;in vec2 vUV;out vec4 frag;void main(){frag=texture(uTex,vUV);}`;
const VS_SKY=`#version 300 es
precision highp float;out vec2 vUv;
void main(){vec2 pos=vec2((gl_VertexID==1)?3.:-1.,(gl_VertexID==2)?3.:-1.);vUv=pos*.5+.5;gl_Position=vec4(pos,0.,1.);}`;
const FS_SKY=`#version 300 es
precision highp float;
in vec2 vUv;out vec4 frag;
uniform float uWorld;uniform float uSunAlt;uniform vec3 uSunDir;
uniform vec3 uRight;uniform vec3 uUp;uniform vec3 uForward;uniform float uAspect;uniform float uTan;
void main(){
 if(uWorld<-.5){float r=length((vUv-.5)*vec2(uAspect,1.));vec3 c=mix(vec3(.010,.015,.032),vec3(.003,.008,.017),clamp(r,0.,1.));frag=vec4(c,1.);return;}
 if(uWorld>0.5&&uWorld<2.5){frag=vec4(.003,.006,.011,1.);return;}
 vec3 ray=normalize(uForward+(2.*vUv.x-1.)*uAspect*uTan*uRight+(2.*vUv.y-1.)*uTan*uUp);
 float elev=clamp(ray.z,0.,1.);
 float day=smoothstep(-.19,.15,uSunAlt);
 float twilight=1.-smoothstep(-.17,.18,abs(uSunAlt));
 vec3 c;
 if(uWorld>2.5&&uWorld<3.5){
    // Approximate Martian color from NASA Pathfinder/Curiosity observations, not a weather forecast.
    vec3 daycol=mix(vec3(.71,.37,.20),vec3(.38,.23,.18),pow(elev,.65));
    vec3 nightcol=mix(vec3(.025,.015,.025),vec3(.008,.009,.021),elev);
    c=mix(nightcol,daycol,day);
    float nearSun=pow(max(0.,dot(ray,normalize(uSunDir))),12.);
    c=mix(c,vec3(.24,.37,.53),twilight*nearSun*.64);
 }else if(uWorld>3.5){
    // Opaque Venusian clouds: no naked-eye Sun or background planets.
    c=mix(vec3(.20,.12,.05),mix(vec3(.69,.39,.15),vec3(.46,.27,.12),elev),.75+.2*day);
 }else{
    vec3 daycol=mix(vec3(.58,.73,.91),vec3(.047,.26,.58),pow(elev,.5));
    vec3 dusk=mix(vec3(.36,.20,.23),vec3(.05,.075,.16),pow(elev,.35));
    vec3 nightcol=mix(vec3(.014,.022,.048),vec3(.003,.009,.026),elev);
    c=mix(nightcol,daycol,day);
    c=mix(c,dusk,twilight*.60*exp(-elev*3.));
 }
 frag=vec4(c,1.);
}`;
const VS_GROUND=`#version 300 es
precision highp float;in vec3 aPos;uniform mat4 uVP;out vec2 vPlane;out float vDistance;
void main(){vPlane=aPos.xy;vDistance=length(aPos.xy);gl_Position=uVP*vec4(aPos,1.);}`;
const FS_GROUND=`#version 300 es
precision highp float;in vec2 vPlane;in float vDistance;out vec4 frag;
uniform float uWorld;uniform float uSunAlt;
float hash(vec2 n){return fract(sin(dot(n,vec2(127.1,311.7)))*43758.5453);}
void main(){
 vec2 q=floor(vPlane*1.4);float n=hash(q)*.14+hash(floor(vPlane*.15))*.13;
 float day=smoothstep(-.15,.12,uSunAlt);
 vec3 dark=vec3(.012,.019,.021);vec3 lit=vec3(.075,.12,.104);
 if(uWorld>.5&&uWorld<1.5){dark=vec3(.024,.026,.029);lit=vec3(.19,.18,.18);}
 else if(uWorld>1.5&&uWorld<2.5){dark=vec3(.034,.030,.029);lit=vec3(.22,.20,.18);}
 else if(uWorld>2.5&&uWorld<3.5){dark=vec3(.035,.019,.014);lit=vec3(.34,.18,.105);}
 else if(uWorld>3.5){dark=vec3(.23,.12,.055);lit=vec3(.37,.22,.10);}
 vec3 c=mix(dark,lit,day)*(.82+n);
 float haze=clamp((vDistance-90.)/700.,0.,.8);
 if(uWorld<.5)c=mix(c,vec3(.10,.135,.17)*(day*.65+.18),haze);
 else if(uWorld>2.5&&uWorld<3.5)c=mix(c,vec3(.40,.25,.17)*(day*.7+.15),haze);
 frag=vec4(c,1.);
}`;
const VS_HALO=`#version 300 es
precision highp float;in vec3 aPos;uniform mat4 uVP;uniform float uSize;void main(){gl_Position=uVP*vec4(aPos,1.);gl_PointSize=uSize;}`;
const FS_HALO=`#version 300 es
precision highp float;out vec4 frag;uniform vec3 uColor;uniform float uOpacity;
void main(){float r=length(gl_PointCoord*2.-1.);float a=pow(max(0.,1.-r),2.6);frag=vec4(uColor,uOpacity*a);}`;
function shader(gl,type,source){let s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
function prog(gl,v,f){let p=gl.createProgram();gl.attachShader(p,shader(gl,gl.VERTEX_SHADER,v));gl.attachShader(p,shader(gl,gl.FRAGMENT_SHADER,f));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p;}
function matMultiply(a,b){let o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++){o[c*4+r]=0;for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];}return o;}
function perspective(fov,ratio,near,far){let f=1/Math.tan(fov/2),a=1/(near-far);return new Float32Array([f/ratio,0,0,0, 0,f,0,0, 0,0,(far+near)*a,-1, 0,0,2*far*near*a,0]);}
function lookAt(eye,target,worldUp){let z=unit(sub(eye,target)),x=unit(cross(worldUp,z)),y=cross(z,x);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);}
function model(center, ax, radius){const X=mul(ax.x,radius),Y=mul(ax.y,radius),Z=mul(ax.z,radius);return new Float32Array([X[0],X[1],X[2],0,Y[0],Y[1],Y[2],0,Z[0],Z[1],Z[2],0,...center,1]);}
function basis(a){return new Float32Array([...a.x,...a.y,...a.z]);}
function sphereGeometry(nLon=64,nLat=40){const verts=[];const idx=[];
 for(let i=0;i<=nLat;i++){let lat=(-Math.PI/2+i*Math.PI/nLat),s=Math.sin(lat),c=Math.cos(lat);
  for(let j=0;j<=nLon;j++){let lon=-Math.PI+j*2*Math.PI/nLon;let x=c*Math.cos(lon),y=c*Math.sin(lon),z=s;verts.push(x,y,z,x,y,z,j/nLon,i/nLat);}}
 for(let i=0;i<nLat;i++)for(let j=0;j<nLon;j++){let k=i*(nLon+1)+j;idx.push(k,k+1,k+nLon+1,k+1,k+nLon+2,k+nLon+1);}
 return {verts:new Float32Array(verts),idx:new Uint16Array(idx)};}
function ringGeometry(){const a=[],idx=[],segments=192;
 for(let i=0;i<=segments;i++){let th=i/segments*Math.PI*2,c=Math.cos(th),s=Math.sin(th);
  for(let j=0;j<2;j++){let rad=j?2.29:1.25;a.push(c*rad,s*rad,0,j,0.5);}}
 for(let i=0;i<segments;i++){let k=i*2;idx.push(k,k+1,k+2,k+1,k+3,k+2);}return {verts:new Float32Array(a),idx:new Uint16Array(idx)};}
function groundGeometry(){const arr=[],idx=[],rings=35,segs=128;
 for(let r=0;r<=rings;r++){let dist=r===0?0:Math.pow(r/rings,1.8)*1100;
  for(let i=0;i<=segs;i++){let a=i/segs*Math.PI*2,x=Math.cos(a)*dist,y=Math.sin(a)*dist;
   let height=-1.7+(r?Math.sin(x*.09)*.35+Math.sin(y*.052+x*.021)*.25:0);arr.push(x,y,height);
  }}
 for(let r=0;r<rings;r++)for(let i=0;i<segs;i++){let k=r*(segs+1)+i;idx.push(k,k+1,k+segs+1,k+1,k+segs+2,k+segs+1);}
 return {verts:new Float32Array(arr),idx:new Uint32Array(idx)};}
function buf(gl,data,type=gl.ARRAY_BUFFER){let b=gl.createBuffer();gl.bindBuffer(type,b);gl.bufferData(type,data,gl.STATIC_DRAW);return b;}
function texture(gl,url){let t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([120,130,150,255]));
 const img=new Image();img.onload=()=>{gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);gl.generateMipmap(gl.TEXTURE_2D);};img.src=window.SOLAR_ASSETS?.[url]||url;return t;
}
function sphereColor(hex){return [parseInt(hex.substring(1,3),16)/255,parseInt(hex.substring(3,5),16)/255,parseInt(hex.substring(5,7),16)/255];}
const radii={sun:2.9,mercury:.30,venus:.46,earth:.51,moon:.17,mars:.35,jupiter:1.55,saturn:1.34,uranus:.88,neptune:.86};
const SW=22;
const physicalRadius=id=>byId[id].radiusKm/AU_KM*SW;
const surfaceWorld = {earth:0,moon:1,mercury:2,mars:3,venus:4};
class Renderer {
 constructor(canvas){this.canvas=canvas;
  const gl=canvas.getContext('webgl2',{alpha:false,antialias:true,powerPreference:'high-performance'});
  if(!gl)throw new Error('Ta przeglądarka nie obsługuje WebGL 2.');
  this.gl=gl;gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
  this.programs={sphere:prog(gl,VS_SPHERE,FS_SPHERE),line:prog(gl,VS_LINE,FS_LINE),point:prog(gl,VS_POINTS,FS_POINTS),ring:prog(gl,VS_RING,FS_RING),sky:prog(gl,VS_SKY,FS_SKY),ground:prog(gl,VS_GROUND,FS_GROUND),halo:prog(gl,VS_HALO,FS_HALO)};
  const s=sphereGeometry(),r=ringGeometry(),gr=groundGeometry();
  this.sphere={vb:buf(gl,s.verts),ib:buf(gl,s.idx,gl.ELEMENT_ARRAY_BUFFER),count:s.idx.length};
  this.ring={vb:buf(gl,r.verts),ib:buf(gl,r.idx,gl.ELEMENT_ARRAY_BUFFER),count:r.idx.length};
  this.ground={vb:buf(gl,gr.verts),ib:buf(gl,gr.idx,gl.ELEMENT_ARRAY_BUFFER),count:gr.idx.length};
  this.dynamic=gl.createBuffer();this.haloVertex=gl.createBuffer();
  this.textures={};for(const b of bodies)this.textures[b.id]=texture(gl,`./assets/${b.id}.jpg`);
  this.textures.ring=texture(gl,'./assets/saturn_rings.png');
  // Real J2000 sky positions from HYG. No fabricated star points in scientific sky.
  const stars=[];
  for(const star of STAR_CATALOG){const col=colorBV(star.bv),brightness=Math.max(1.8,5-star.mag);
   stars.push(...mul(star.dir,1350),brightness,...col);
  }
  this.stars={vb:buf(gl,new Float32Array(stars)),count:stars.length/7};
  this.orbits={};this.orbitJD=0;
  this.frame={width:1,height:1,vp:null,cam:[0,0,0],projected:{}};
 }
 resize(){const d=Math.min(2,window.devicePixelRatio||1),w=Math.max(1,Math.floor(this.canvas.clientWidth*d)),h=Math.max(1,Math.floor(this.canvas.clientHeight*d));if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}this.gl.viewport(0,0,w,h);this.frame.width=w;this.frame.height=h;return w/h;}
 attr(p,name,size,stride,offset){const gl=this.gl,loc=gl.getAttribLocation(p,name);if(loc<0)return;gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,stride,offset);}
 uni(p,name){return this.gl.getUniformLocation(p,name);}
 uniform3(p,n,x){this.gl.uniform3fv(this.uni(p,n),x);}
 uniform1(p,n,x){this.gl.uniform1f(this.uni(p,n),x);}
 uniformMat4(p,n,x){this.gl.uniformMatrix4fv(this.uni(p,n),false,x);}
 drawSky(surface,world,sunAlt,dir,sunDir){const gl=this.gl,p=this.programs.sky;gl.disable(gl.DEPTH_TEST);gl.useProgram(p);this.uniform1(p,'uWorld',surface?world:-1);this.uniform3(p,'uSunDir',sunDir||[0,1,0]);this.uniform1(p,'uSunAlt',sunAlt);this.uniform3(p,'uRight',dir.right);this.uniform3(p,'uUp',dir.up);this.uniform3(p,'uForward',dir.forward);this.uniform1(p,'uAspect',this.frame.width/this.frame.height);this.uniform1(p,'uTan',Math.tan((this.frame.eclipseZoom?2.4:52)*DEG/2));gl.drawArrays(gl.TRIANGLES,0,3);gl.enable(gl.DEPTH_TEST);}
 drawSphere(center,ax,radius,id,sun,lighting){const gl=this.gl,p=this.programs.sphere;gl.useProgram(p);gl.bindBuffer(gl.ARRAY_BUFFER,this.sphere.vb);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.sphere.ib);this.attr(p,'aPos',3,32,0);this.attr(p,'aNormal',3,32,12);this.attr(p,'aUV',2,32,24);this.uniformMat4(p,'uVP',this.frame.vp);this.uniformMat4(p,'uModel',model(center,ax,radius));gl.uniformMatrix3fv(this.uni(p,'uBasis'),false,basis(ax));this.uniform3(p,'uSun',sun);this.uniform3(p,'uCamera',this.frame.cam);this.uniform1(p,'uAtmos',id==='earth'?1:id==='venus'?2:id==='mars'?3:0);this.uniform1(p,'uEmit',id==='sun'?1:0);this.uniform1(p,'uLighting',lighting?1:0);
 const phys=this.frame.eclipsePhysical;
 this.uniform1(p,'uEclipseBody',phys?(id==='earth'?1:id==='moon'?2:0):0);
 this.uniform3(p,'uEarthPhysical',phys?phys.earth:[0,0,0]);
 this.uniform3(p,'uMoonPhysical',phys?phys.moon:[0,0,0]);
 this.uniform1(p,'uRe',6371/AU_KM*SW);this.uniform1(p,'uRm',1737.4/AU_KM*SW);this.uniform1(p,'uRs',696340/AU_KM*SW);
 gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.textures[id]);gl.uniform1i(this.uni(p,'uTex'),0);gl.drawElements(gl.TRIANGLES,this.sphere.count,gl.UNSIGNED_SHORT,0);}
 drawRing(center,ax,radius){const gl=this.gl,p=this.programs.ring;gl.useProgram(p);gl.bindBuffer(gl.ARRAY_BUFFER,this.ring.vb);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.ring.ib);this.attr(p,'aPos',3,20,0);this.attr(p,'aUV',2,20,12);this.uniformMat4(p,'uVP',this.frame.vp);this.uniformMat4(p,'uModel',model(center,ax,radius));gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.textures.ring);gl.uniform1i(this.uni(p,'uTex'),0);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);gl.drawElements(gl.TRIANGLES,this.ring.count,gl.UNSIGNED_SHORT,0);gl.depthMask(true);gl.disable(gl.BLEND);}
 drawLine(points,col,alpha=1){const gl=this.gl,p=this.programs.line;gl.useProgram(p);gl.bindBuffer(gl.ARRAY_BUFFER,this.dynamic);gl.bufferData(gl.ARRAY_BUFFER,points,gl.DYNAMIC_DRAW);this.attr(p,'aPos',3,12,0);this.uniformMat4(p,'uVP',this.frame.vp);gl.uniform4fv(this.uni(p,'uColor'),[...col,alpha]);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.drawArrays(gl.LINE_STRIP,0,points.length/3);gl.disable(gl.BLEND);}
 drawPoints(alpha=1,surface=false,basisLocal=null){const gl=this.gl,p=this.programs.point;gl.useProgram(p);gl.bindBuffer(gl.ARRAY_BUFFER,this.stars.vb);this.attr(p,'aPos',3,28,0);this.attr(p,'aSize',1,28,12);this.attr(p,'aColor',3,28,16);this.uniformMat4(p,'uStarVP',this.frame.starVP);this.uniform1(p,'uAlpha',alpha);this.uniform1(p,'uScale',Math.min(2,window.devicePixelRatio||1));this.uniform1(p,'uSurface',surface?1:0);const b=basisLocal;gl.uniformMatrix3fv(this.uni(p,'uStarBasis'),false,b?new Float32Array([b.east[0],b.north[0],b.up[0],b.east[1],b.north[1],b.up[1],b.east[2],b.north[2],b.up[2]]):new Float32Array([1,0,0,0,1,0,0,0,1]));gl.depthMask(false);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.drawArrays(gl.POINTS,0,this.stars.count);gl.disable(gl.BLEND);gl.depthMask(true);}
 drawHalo(center,px,color,opacity){const gl=this.gl,p=this.programs.halo;gl.useProgram(p);gl.bindBuffer(gl.ARRAY_BUFFER,this.haloVertex);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(center),gl.DYNAMIC_DRAW);this.attr(p,'aPos',3,12,0);this.uniformMat4(p,'uVP',this.frame.vp);this.uniform1(p,'uSize',px);this.uniform3(p,'uColor',color);this.uniform1(p,'uOpacity',opacity);gl.depthMask(false);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.drawArrays(gl.POINTS,0,1);gl.disable(gl.BLEND);gl.depthMask(true);}
 drawGround(world,sunAlt){const gl=this.gl,p=this.programs.ground;gl.useProgram(p);gl.bindBuffer(gl.ARRAY_BUFFER,this.ground.vb);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.ground.ib);this.attr(p,'aPos',3,12,0);this.uniformMat4(p,'uVP',this.frame.vp);this.uniform1(p,'uWorld',world);this.uniform1(p,'uSunAlt',sunAlt);gl.drawElements(gl.TRIANGLES,this.ground.count,gl.UNSIGNED_INT,0);}
 project(point){const m=this.frame.vp,x=point[0],y=point[1],z=point[2];const w=m[3]*x+m[7]*y+m[11]*z+m[15];if(w<=0)return null;
 const px=(m[0]*x+m[4]*y+m[8]*z+m[12])/w,py=(m[1]*x+m[5]*y+m[9]*z+m[13])/w,pz=(m[2]*x+m[6]*y+m[10]*z+m[14])/w;
 if(pz>1||pz< -1)return null;
 return {x:(px*.5+.5)*(this.canvas.clientWidth),y:(.5-py*.5)*(this.canvas.clientHeight),z:pz};
 }
 rebuildOrbits(jd){this.orbitJD=jd;for(const b of bodies){if(!(''+b.id in {mercury:1,venus:1,earth:1,mars:1,jupiter:1,saturn:1,uranus:1,neptune:1}))continue;
 const out=[];for(let i=0;i<=384;i++){const p=keplerPos(b.id,jd,i/384*Math.PI*2);out.push(p[0]*SW,p[1]*SW,p[2]*SW);}this.orbits[b.id]=new Float32Array(out);}}
 render(opts){const gl=this.gl,aspect=this.resize(),jd=opts.jd,p=positions(jd);
 this.frame.eclipsePhysical={earth:mul(p.earth,SW),moon:mul(p.moon,SW)};
 const surface=opts.mode==='surface';let eye,target,dir={right:[1,0,0],up:[0,0,1],forward:[0,1,0]};
 let local=null,sunAlt=-1,world=surfaceWorld[opts.focus]??0;
 if(surface){local=horizon(opts.focus,jd,opts.lat,opts.lon);sunAlt=Math.sin(local.sun.altitude*DEG);
  const az=opts.az*DEG,alt=opts.alt*DEG;
  const forward=[Math.sin(az)*Math.cos(alt),Math.cos(az)*Math.cos(alt),Math.sin(alt)],right=unit(cross(forward,[0,0,1]));const up=unit(cross(right,forward));dir={forward,right,up};eye=[0,0,0];target=forward;
 }else{
  const t=opts.focus==='solar'?[0,0,0]:opts.focus==='moon'?(opts.trueScale?mul(p.moon,SW):add(mul(p.earth,SW),mul(sub(p.moon,p.earth),SW*80))):mul(p[opts.focus],SW);
  let dist=opts.dist,elev=Math.max(-1.45,Math.min(1.45,opts.pitch)),yaw=opts.yaw;
  const travel=opts.flightProgress===undefined?1:opts.flightProgress;
  target=travel<1&&opts.flightFrom?add(mul(opts.flightFrom,1-travel),mul(t,travel)):t;
  if(travel<1&&opts.flightDistFrom){dist=opts.flightDistFrom*(1-travel)+dist*travel;}
  eye=add(target,[dist*Math.cos(elev)*Math.sin(yaw),-dist*Math.cos(elev)*Math.cos(yaw),dist*Math.sin(elev)]);
 }
 this.frame.eclipseZoom=surface&&opts.eclipseZoom;
 const view=lookAt(eye,target,[0,0,1]);let near=surface?.05:(opts.trueScale&&opts.focus!=='solar'?Math.max(.000001,opts.dist/150):.05),far=4000;const projection=perspective((surface&&opts.eclipseZoom?2.4:52)*DEG,aspect,near,far);
 this.frame.vp=matMultiply(projection,view);this.frame.cam=eye;
 // Stars are effectively at infinity: camera translation must NOT cause parallax.
 this.frame.starVP=matMultiply(projection,lookAt([0,0,0],unit(sub(target,eye)),[0,0,1]));
 gl.disable(gl.CULL_FACE);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
 const skyDarkening=surface&&opts.focus==='earth'&&opts.eclipseZoom&&opts.eclipseKind==='solar'?sunMoonObserver(jd,opts.lat,opts.lon,p).coverage:0;
 this.drawSky(surface,world,sunAlt-skyDarkening*1.25,dir,surface?[local.sun.east,local.sun.north,local.sun.up]:[0,1,0]);
 this.drawPoints(surface&&(world===0||world===3||world===4)?Math.max(.015,1-Math.min(1,(sunAlt+.12)*6)):.60,surface,opts.basis);
 this.frame.projected={};
 if(surface){
  const pt=(id)=>local[id]?[local[id].east*410,local[id].north*410,local[id].up*410]:null;
  for(const b of bodies){if(b.id===opts.focus)continue;const hh=local[b.id],center=pt(b.id);
   if(!hh||!center||hh.altitude< -2.5||world===4)continue;
   const radius=Math.max(b.id==='sun'?.12:.065,Math.tan(hh.angularRadius)*410);const axesWorld=axes(b.id,jd,p);
   const obsAxes=(a)=>({x:[dot(a.x,opts.basis.east),dot(a.x,opts.basis.north),dot(a.x,opts.basis.up)],y:[dot(a.y,opts.basis.east),dot(a.y,opts.basis.north),dot(a.y,opts.basis.up)],z:[dot(a.z,opts.basis.east),dot(a.z,opts.basis.north),dot(a.z,opts.basis.up)]});
   let bb=obsAxes(axesWorld);
   const sunvec=unit(sub(p.sun,p[b.id]));const sl=[dot(sunvec,opts.basis.east),dot(sunvec,opts.basis.north),dot(sunvec,opts.basis.up)];
   const sunPoint=add(center,mul(sl,10000));
   if(b.id==='sun')this.drawHalo(center,opts.eclipseZoom?60:160,[1,.43,.12],opts.eclipseZoom?.24:.75);
   this.drawSphere(center,bb,radius,b.id,sunPoint,opts.lighting);
   if(b.id==='saturn')this.drawRing(center,bb,radius);
   this.frame.projected[b.id]=this.project(center);
  }
  this.drawGround(world,sunAlt);
 }else{
   if(jd-this.orbitJD>365||jd-this.orbitJD< -365||!this.orbitJD)this.rebuildOrbits(jd);
   if(opts.orbits){for(const b of bodies){const arr=this.orbits[b.id];if(!arr)continue;this.drawLine(arr,sphereColor(b.color),.18);}}
   // orbital center used for Moon display in focused Earth/Moon mode; never for ephemeris calculations.
   let moonVis=opts.focus==='earth'||opts.focus==='moon';
   const moonVector=sub(p.moon,p.earth);
   const moonDisplay=add(mul(p.earth,SW),mul(moonVector,SW*(opts.trueScale?1:80)));
   if(moonVis&&opts.orbits){const pts=[];const rad=norm(mul(moonVector,SW*(opts.trueScale?1:80)));let basisX=unit(moonVector),basisY=unit(cross([0,0,1],basisX));for(let i=0;i<=144;i++){let a=i/144*Math.PI*2;let xx=add(mul(p.earth,SW),add(mul(basisX,rad*Math.cos(a)),mul(basisY,rad*Math.sin(a))));pts.push(...xx);}this.drawLine(new Float32Array(pts),[.61,.66,.74],.22);}
   const all=[...bodies].sort((a,b)=>norm(sub(mul(p[b.id],SW),eye))-norm(sub(mul(p[a.id],SW),eye)));
   for(const b of all){if(b.id==='moon'&&!moonVis)continue;
    const center=b.id==='moon'?moonDisplay:mul(p[b.id],SW),ax=axes(b.id,jd,p);
    let radius=opts.trueScale?physicalRadius(b.id):radii[b.id];
    if(b.id==='sun'&&!opts.trueScale)this.drawHalo(center,135,[1,.36,.07],.58);
    // Make moons/plants pickable at all distances without altering computed positions.
    this.drawSphere(center,ax,radius,b.id,[0,0,0],opts.lighting);
    if(b.id==='saturn')this.drawRing(center,ax,radius);
    this.frame.projected[b.id]=this.project(center);
   }
 }
 return {projected:this.frame.projected,pos:p,local};
 }
}

;

/** Graceful compatibility renderer for browsers without WebGL2.
 * Keeps the live JPL ephemerides, camera controls and topocentric sky positions.
 * It is a 2D projection, not the primary 3D visualization. */
const SCENE_SCALE=22;
const pxRadius={sun:2.9,mercury:.30,venus:.46,earth:.51,moon:.17,mars:.35,jupiter:1.55,saturn:1.34,uranus:.88,neptune:.86};
const col=(hex,alpha=1)=>{const n=parseInt(hex.slice(1),16);return `rgba(${n>>16},${(n>>8)&255},${n&255},${alpha})`;};
class CanvasRenderer{
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});if(!this.ctx)throw new Error('Brak obsługi Canvas 2D.');
 this.images={};for(const b of bodies){const img=new Image();img.src=(window.SOLAR_ASSETS?.[`./assets/${b.id}.jpg`]||`./assets/${b.id}.jpg`);this.images[b.id]=img;}
 this.frame={projected:{}};
 this.stars=STAR_CATALOG;

 }
 resize(){const d=Math.min(2,window.devicePixelRatio||1),w=this.canvas.clientWidth,h=this.canvas.clientHeight;if(this.canvas.width!==Math.floor(w*d)||this.canvas.height!==Math.floor(h*d)){this.canvas.width=Math.floor(w*d);this.canvas.height=Math.floor(h*d);}this.ctx.setTransform(d,0,0,d,0,0);return {w,h};}
 ball(ctx,xy,r,id,sunVec=null,lighting=true){if(!xy||r<.5)return;const img=this.images[id];ctx.save();ctx.beginPath();ctx.arc(xy.x,xy.y,r,0,Math.PI*2);ctx.clip();
 let grad=ctx.createRadialGradient(xy.x-r*.23,xy.y-r*.3,r*.03,xy.x,xy.y,r);const c=byId[id].color;grad.addColorStop(0,id==='sun'?'#fff0af':c);grad.addColorStop(1,id==='sun'?'#ce6026':'#182f40');ctx.fillStyle=grad;ctx.fillRect(xy.x-r,xy.y-r,r*2,r*2);
 if(img.complete&&img.naturalWidth>0){ctx.globalAlpha=id==='sun'?.65:.88;ctx.drawImage(img,xy.x-r,xy.y-r,2*r,2*r);ctx.globalAlpha=1;}
 if(id!=='sun'&&lighting&&sunVec){const l=unit(sunVec);const g=ctx.createLinearGradient(xy.x-l[0]*r,xy.y+l[1]*r,xy.x+l[0]*r,xy.y-l[1]*r);g.addColorStop(0,'rgba(0,0,0,.91)');g.addColorStop(.38,'rgba(0,0,0,.52)');g.addColorStop(.65,'rgba(0,0,0,.05)');g.addColorStop(1,'rgba(255,255,255,.12)');ctx.fillStyle=g;ctx.fillRect(xy.x-r,xy.y-r,2*r,2*r);}
 ctx.restore();if(id==='sun'){const h=ctx.createRadialGradient(xy.x,xy.y,r*.25,xy.x,xy.y,Math.max(r*4,15));h.addColorStop(0,'#ffc68190');h.addColorStop(.35,'#e99d3b30');h.addColorStop(1,'#e99d3b00');ctx.fillStyle=h;ctx.beginPath();ctx.arc(xy.x,xy.y,Math.max(r*4,15),0,Math.PI*2);ctx.fill();}
 }
 render(o){const ctx=this.ctx,{w,h}=this.resize(),p=positions(o.jd),surface=o.mode==='surface';this.frame.projected={};
 let project,cam=[],local=null;
 if(surface){
  local=horizon(o.focus,o.jd,o.lat,o.lon);
  const az=o.az*DEG,alt=o.alt*DEG,forward=[Math.sin(az)*Math.cos(alt),Math.cos(az)*Math.cos(alt),Math.sin(alt)],right=unit(cross(forward,[0,0,1])),up=cross(right,forward);
  const x0=w/2,y0=h/2,tan=Math.tan((o.eclipseZoom?2.4:52)*DEG/2);
  project=v=>{const z=dot(v,forward);if(z<=.0001)return null;return {x:x0+(dot(v,right)/z)*(h/2)/tan,y:y0-(dot(v,up)/z)*(h/2)/tan,depth:z};};
  const sun=local.sun;let day=clamp2d((Math.sin(sun.altitude*DEG)+.14)*4,0,1); if(o.eclipseZoom&&o.focus==='earth'&&o.eclipseKind==='solar')day*=Math.max(.018,1-sunMoonObserver(o.jd,o.lat,o.lon,p).coverage*.99);
  let gradient=ctx.createLinearGradient(0,0,0,h);if(['moon','mercury'].includes(o.focus)){gradient.addColorStop(0,'#030710');gradient.addColorStop(1,'#0a0d16');}else if(o.focus==='mars'){gradient.addColorStop(0,day>.5?'#7c5344':'#100d18');gradient.addColorStop(1,day>.5?'#c18b62':'#2d1b1a');}else if(o.focus==='venus'){gradient.addColorStop(0,'#765034');gradient.addColorStop(1,'#b57b39');}else{gradient.addColorStop(0,`rgb(${Math.round(3+7*day)},${Math.round(10+73*day)},${Math.round(29+125*day)})`);gradient.addColorStop(1,`rgb(${Math.round(9+88*day)},${Math.round(16+114*day)},${Math.round(33+135*day)})`);}
  ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
  if(o.focus==='mars'&&Math.abs(sun.altitude)<12){
   const ss=project([sun.east*410,sun.north*410,sun.up*410]);
   if(ss){let gr=ctx.createRadialGradient(ss.x,ss.y,1,ss.x,ss.y,230);
    gr.addColorStop(0,'rgba(142,191,221,.5)');gr.addColorStop(.35,'rgba(109,148,185,.19)');gr.addColorStop(1,'rgba(90,130,171,0)');
    ctx.fillStyle=gr;ctx.fillRect(0,0,w,h);
   }
  }
  // Project J2000 stars into the local east/north/up horizon. Suppress in bright daylight.
  if(o.focus!=='venus'){
    const pt=surfacePoint(o.focus,o.jd,o.lat,o.lon,p);let night=clamp2d((-sun.altitude-3)/10,0,1); if(o.eclipseZoom&&o.focus==='earth'&&o.eclipseKind==='solar')night=Math.max(night,sunMoonObserver(o.jd,o.lat,o.lon,p).coverage*.7);
    if(night>.01)for(const star of this.stars){const localDir=starHorizon(star,pt);if(localDir.altitude<0)continue;
      const xy=project([localDir.east*410,localDir.north*410,localDir.up*410]);
      if(!xy||xy.x<0||xy.x>w||xy.y<0||xy.y>h)continue;
      ctx.fillStyle=rgbaStar(star,night*.86);ctx.beginPath();ctx.arc(xy.x,xy.y,Math.max(.7,2.1-star.mag*.24),0,Math.PI*2);ctx.fill();
      if(star.name&&star.mag<1.65&&w>680){ctx.font='10px system-ui';ctx.fillStyle=rgbaStar(star,night*.72);ctx.fillText(star.name,xy.x+6,xy.y-5);}
    }
  }
  const hor=project([Math.sin(az+Math.PI/2)*500,Math.cos(az+Math.PI/2)*500,0]);
  let hy=h/2+Math.tan(alt)*h/(2*tan);hy=clamp2d(hy,0,h);
  ctx.fillStyle=o.focus==='moon'?'#272a32':o.focus==='mercury'?'#524e49':o.focus==='mars'?'#70402d':o.focus==='venus'?'#704020':`rgb(${Math.round(11+23*day)},${Math.round(23+36*day)},${Math.round(25+21*day)})`;ctx.fillRect(0,hy,w,h-hy);
  ctx.strokeStyle='#b0c7cf3a';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,hy);ctx.lineTo(w,hy);ctx.stroke();
  ctx.save();ctx.strokeStyle='#6e8a9a25';for(let i=0;i<16;i++){ctx.beginPath();let y=hy+(h-hy)*i/16;ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}ctx.restore();
  for(const b of bodies){if(b.id===o.focus)continue;const obj=local[b.id];const xy=project([obj.east*410,obj.north*410,obj.up*410]);if(!xy||xy.y<0||xy.y>hy+10)continue;
   const rr=Math.max(b.id==='sun'?6:1.5,Math.atan2(b.radiusKm,149597870.7*obj.distanceAU)*410*(h/(2*tan))/Math.max(150,xy.depth));
   if(obj.altitude<0||o.focus==='venus')continue;
   this.ball(ctx,xy,clamp2d(rr,2,40),b.id,b.id==='sun'?null:[local.sun.east,local.sun.up],o.lighting);
   if(!o.eclipseZoom&&xy.x>10&&xy.x<w-50){ctx.fillStyle='#c8d7e7';ctx.font='11px system-ui';ctx.fillText(b.pl,xy.x+9,xy.y-10);}
   this.frame.projected[b.id]=xy;
  }
  if(o.eclipseZoom&&o.focus==='earth'){
   if(o.eclipseKind==='solar'){
    const g=sunMoonObserver(o.jd,o.lat,o.lon,p),s=local.sun,m=local.moon;
    if(g.sep<g.rS+g.rM+.013&&g.altitude>0){
      const sunXY=project([s.east*410,s.north*410,s.up*410]);const moonXY=project([m.east*410,m.north*410,m.up*410]);
      if(sunXY&&moonXY){
       const rs=Math.tan(g.rS)*h/(2*tan),rm=Math.tan(g.rM)*h/(2*tan);
       const corona=ctx.createRadialGradient(sunXY.x,sunXY.y,rs*.92,sunXY.x,sunXY.y,rs*1.9);
       corona.addColorStop(0,'rgba(255,241,210,.42)');corona.addColorStop(.27,'rgba(255,220,170,.20)');corona.addColorStop(1,'rgba(217,224,255,0)');ctx.fillStyle=corona;ctx.beginPath();ctx.arc(sunXY.x,sunXY.y,rs*1.9,0,7);ctx.fill();
       const disk=ctx.createRadialGradient(sunXY.x-rs*.2,sunXY.y-rs*.2,rs*.04,sunXY.x,sunXY.y,rs);
       disk.addColorStop(0,'#fffbe9');disk.addColorStop(.82,'#ffe7aa');disk.addColorStop(1,'#ffc977');ctx.fillStyle=disk;ctx.beginPath();ctx.arc(sunXY.x,sunXY.y,rs,0,7);ctx.fill();
       ctx.fillStyle='#030812';ctx.beginPath();ctx.arc(moonXY.x,moonXY.y,rm,0,7);ctx.fill();
       ctx.lineWidth=.7;ctx.strokeStyle='rgba(222,232,243,.28)';ctx.stroke();
      }
    }
   }else if(o.eclipseKind==='lunar'){
    const mm=local.moon,xy=project([mm.east*410,mm.north*410,mm.up*410]);
    const lg=lunarGeometry(o.jd,p);
    if(xy&&lg.umbraFraction>.0001){const radius=Math.tan(mm.angularRadius)*h/(2*tan);ctx.save();ctx.beginPath();ctx.arc(xy.x,xy.y,radius,0,7);ctx.clip();
      ctx.fillStyle=`rgba(37,5,7,${Math.min(.87,lg.umbraFraction*.8)})`;ctx.fillRect(xy.x-radius,xy.y-radius,2*radius,2*radius);
      ctx.fillStyle=`rgba(180,64,46,${lg.umbraFraction*.29})`;ctx.fillRect(xy.x-radius,xy.y-radius,2*radius,2*radius);ctx.restore();}
   }
  }
 }else{
  const to=o.focus==='solar'?[0,0,0]:o.focus==='moon'?(o.trueScale?mul(p.moon,SCENE_SCALE):add(mul(p.earth,SCENE_SCALE),mul(sub(p.moon,p.earth),SCENE_SCALE*80))):mul(p[o.focus],SCENE_SCALE);
  const tr=o.flightProgress??1;const target=tr<1&&o.flightFrom?add(mul(o.flightFrom,1-tr),mul(to,tr)):to;const dist=tr<1&&o.flightDistFrom?o.flightDistFrom*(1-tr)+o.dist*tr:o.dist;
  cam=add(target,[dist*Math.cos(o.pitch)*Math.sin(o.yaw),-dist*Math.cos(o.pitch)*Math.cos(o.yaw),dist*Math.sin(o.pitch)]);
  const forward=unit(sub(target,cam)),right=unit(cross(forward,[0,0,1])),up=cross(right,forward),tan=Math.tan((o.eclipseZoom?2.4:52)*DEG/2);
  project=q=>{const v=sub(q,cam),z=dot(v,forward);if(z<=.05)return null;return {x:w/2+(dot(v,right)/z)*h/(2*tan),y:h/2-(dot(v,up)/z)*h/(2*tan),depth:z};};
  let bg=ctx.createRadialGradient(w*.55,h*.50,12,w*.55,h*.5,Math.max(w,h)*.72);bg.addColorStop(0,'#10192b');bg.addColorStop(1,'#040a14');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
  for(const st of this.stars){const xy=project(add(cam,mul(st.dir,1350)));if(!xy||xy.x<0||xy.x>w||xy.y<0||xy.y>h)continue;
   ctx.fillStyle=rgbaStar(st,Math.max(.36,1-st.mag*.12));ctx.beginPath();ctx.arc(xy.x,xy.y,Math.max(.7,2.1-st.mag*.27),0,Math.PI*2);ctx.fill();}
  if(o.orbits){for(const b of bodies){if(!Object.prototype.hasOwnProperty.call({mercury:1,venus:1,earth:1,mars:1,jupiter:1,saturn:1,uranus:1,neptune:1},b.id))continue;ctx.strokeStyle=col(b.color,.28);ctx.lineWidth=1;ctx.beginPath();let drawing=false;
   for(let i=0;i<=290;i++){const a=i/290*2*Math.PI,v=mul(keplerPos(b.id,o.jd,a),SCENE_SCALE),xy=project(v);if(xy){if(!drawing)ctx.moveTo(xy.x,xy.y);else ctx.lineTo(xy.x,xy.y);drawing=true;}else drawing=false;}ctx.stroke();}}
  let ids=bodies.filter(b=>b.id!=='moon'||o.focus==='earth'||o.focus==='moon').map(b=>({b,center:b.id==='moon'?(o.trueScale?mul(p.moon,SCENE_SCALE):add(mul(p.earth,SCENE_SCALE),mul(sub(p.moon,p.earth),SCENE_SCALE*80))):mul(p[b.id],SCENE_SCALE)}));
  ids.sort((a,b)=>norm(sub(b.center,cam))-norm(sub(a.center,cam)));
  for(const {b,center} of ids){const xy=project(center);if(!xy||xy.x< -100||xy.x>w+100||xy.y< -100||xy.y>h+100)continue;
   let rr=(o.trueScale?physicalRadius(b.id):pxRadius[b.id])*h/(Math.max(.000001,xy.depth)*2*tan);let r=o.trueScale?Math.min(170,Math.max(.02,rr)):clamp2d(rr,b.id==='sun'?4:2,140);const light=sub([0,0,0],center);
   this.ball(ctx,xy,r,b.id,light,o.lighting);this.frame.projected[b.id]=xy;
   if(b.id==='saturn'&&r>5){ctx.save();ctx.translate(xy.x,xy.y);ctx.rotate(-.38);
     // Stylized C, B and A ring zones, with a visible Cassini gap.
     for(const [rad,thick,color] of [[1.42,.25,'#8f8880a8'],[1.77,.31,'#b7a993ae'],[2.11,.20,'#c6b39b80']]){
       ctx.strokeStyle=color;ctx.lineWidth=Math.max(1,r*thick);ctx.beginPath();ctx.ellipse(0,0,r*rad,r*rad*.32,0,0,Math.PI*2);ctx.stroke();}
     ctx.restore();}
  }
 }
 return {projected:this.frame.projected,pos:p,local};
 }
}
function clamp2d(a,b,c){return Math.max(b,Math.min(c,a));}

;



const $=id=>document.getElementById(id);
const canvas=$('space');
const state={
 eclipseZoom:false,eclipseKind:null,
 jd:julianDate(new Date()),anchorJD:julianDate(new Date()),speed:1,playing:true,orbits:true,lighting:true,
 focus:'solar',mode:'orbit',yaw:0,pitch:.53,dist:1150,az:180,alt:18,lat:54.35,lon:18.65,flight:null,trueScale:false,rememberedDist:null
};
/** A compact, self-contained measurement layer: geometric positions, never observatory-grade ephemerides. */
function astroMetrics(id,jd){
 const pos=positions(jd);
 if(id==='solar')return {distance:'0–30,1 AU',light:'—',velocity:'—',detail:'8 planet · orbity eliptyczne'};
 const loc=pos[id],toSun=sub(pos.sun,loc),dist=norm(toSun);
 const light=dist*AU_KM/299792.458/60;
 let velocity='—';
 if(id!=='sun'){
   const before=positions(jd-0.0125)[id],after=positions(jd+0.0125)[id];
   velocity=number(norm(sub(after,before))*AU_KM/(.025*86400),2)+' km/s';
 }
 let detail='';
 if(id==='moon'){
   const m=unit(sub(pos.sun,pos.moon)),e=unit(sub(pos.earth,pos.moon));
   const illuminated=(1+dot(m,e))/2;
   // Phase angle from Sun--Moon--Earth; 0 = new moon, 1 = full moon.
   detail='Oświetlona tarcza: '+number(illuminated*100,0)+'%';
 }else if(id==='earth')detail='Ziemia–Księżyc: '+number(norm(sub(pos.moon,pos.earth))*AU_KM,0)+' km';
 else if(id==='sun')detail='Jedna jednostka astronomiczna = 149 597 870,7 km';
 else detail='Okres obiegu: '+number(orbitalPeriods[id]/365.256,2)+' lat ziemskich';
 return {distance:dist<.04?number(dist*AU_KM,0)+' km':number(dist,3)+' AU',light:dist===0?'—':light<1?number(light*60,1)+' s':number(light,1)+' min',velocity,detail};
}
/** Sky-map engine: topocentric direction derived from the same JPL approximate coordinates. */
const skyBodies=['sun','moon','mercury','venus','earth','mars','jupiter','saturn','uranus','neptune'];
let obsStarLocations=[];
let obsLocations=[],obsSelected='sun',obsLastDraw=0,obsSkyCoords=null,obsLastEventKey='',obsPriorPlaying=false;
function observerOptions(){return {world:$('obsWorld').value,lat:clamp(Number($('obsLatitude').value)||0,-90,90),lon:clamp(Number($('obsLongitude').value)||0,-180,180)};}
function obsSyncLocation(){if(state.mode==='surface'){ $('obsWorld').value=state.focus;$('obsLatitude').value=state.lat;$('obsLongitude').value=state.lon;} else { $('obsWorld').value=['earth','moon','mars','mercury','venus'].includes(state.focus)?state.focus:'earth';$('obsLatitude').value=state.lat;$('obsLongitude').value=state.lon;}}
function obsPolar(alt,az,R,cx,cy){const r=R*(90-clamp(alt,0,90))/90;return {x:cx+r*Math.sin(az*DEG),y:cy-r*Math.cos(az*DEG)};}
function moonPhaseAt(jd){const p=positions(jd),vSun=unit(sub(p.sun,p.moon)),vEarth=unit(sub(p.earth,p.moon));const cos=clamp(dot(vSun,vEarth),-1,1);const fraction=(1+cos)/2; // From the Moon, Sun and Earth on same side -> full Moon
 const signed=dot(cross(sub(p.moon,p.earth),sub(p.sun,p.earth)),[0,0,1]);
 return {fraction, waxing:signed<0, distanceKm:norm(sub(p.moon,p.earth))*AU_KM};}
function renderMoonIcon(phase){const canvas=$('obsMoonPhase'),ctx=canvas.getContext('2d'),W=canvas.width,H=canvas.height,cx=W/2,cy=H/2,r=43;
 ctx.clearRect(0,0,W,H);ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fillStyle='#0a1018';ctx.fill();ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.clip();
 // Illuminated width is a symbolic illustration of illuminated fraction; the angular orientation is not modelled.
 const k=phase.fraction,delta=(k-.5)*2;
 ctx.fillStyle='#c9d1d3';ctx.beginPath();const direction=phase.waxing?1:-1;
 for(let i=0;i<=170;i++){const y=-r+2*r*i/170,xOuter=Math.sqrt(Math.max(0,r*r-y*y));let xA,xB;
  if(k<.5){xA=direction*xOuter*(1-2*k);xB=direction*xOuter;}
  else {xA=-direction*xOuter;xB=direction*xOuter;}
  // Use a fractional lunar terminator curve.
  let inner=direction*(1-2*k)*xOuter;
  if(k<.5){xA=inner;xB=direction*xOuter;}else{xA=-direction*xOuter;xB=inner;}
  const L=Math.min(xA,xB),Q=Math.max(xA,xB);ctx.fillRect(cx+L,cy+y,Q-L,Math.max(.5,2*r/170+1));
 }
 ctx.restore();ctx.strokeStyle='#526b78';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();}
function obsPhaseUI(){const phase=moonPhaseAt(state.jd),pct=Math.round(phase.fraction*100);
 $('obsPhasePercent').textContent=pct+'%';$('obsPhaseName').textContent=(pct<2?'Nów':pct>98?'Pełnia':phase.waxing?'Faza rosnąca':'Faza malejąca');$('obsMoonDistance').textContent='Odległość od Ziemi '+number(phase.distanceKm,0)+' km';renderMoonIcon(phase);}
function obsDraw(){if(!$('observatoryDialog').open)return;
 const o=observerOptions();$('obsDate').textContent=fromJulian(state.jd).toISOString().slice(0,19).replace('T',' ')+' UTC';
 const coords=horizon(o.world,state.jd,o.lat,o.lon);obsSkyCoords=coords;
 const canv=$('skyMap'),ctx=canv.getContext('2d'),W=canv.width,H=canv.height,cx=W/2,cy=H/2,R=217;
 ctx.clearRect(0,0,W,H);let bg=ctx.createRadialGradient(cx,cy,2,cx,cy,R);bg.addColorStop(0,'#163447');bg.addColorStop(1,'#071525');ctx.fillStyle=bg;ctx.beginPath();ctx.arc(cx,cy,R,0,Math.PI*2);ctx.fill();
 for(const alt of [0,30,60]){ctx.strokeStyle=alt===0?'#81bacd':'#2d4e61';ctx.lineWidth=alt===0?1.8:1;ctx.beginPath();ctx.arc(cx,cy,R*(90-alt)/90,0,2*Math.PI);ctx.stroke();}
 ctx.strokeStyle='#34576a';for(let a=0;a<360;a+=30){const r=a*DEG;ctx.beginPath();ctx.moveTo(cx+Math.sin(r)*R,cy-Math.cos(r)*R);ctx.lineTo(cx-Math.sin(r)*R,cy+Math.cos(r)*R);ctx.stroke();}
 for(const [text0,dx,dy] of [['N',0,-R-17],['E',R+17,0],['S',0,R+20],['W',-R-17,0]]){ctx.font='700 18px system-ui';ctx.fillStyle='#b6d1de';ctx.textAlign='center';ctx.fillText(text0,cx+dx,cy+dy+5);}
 ctx.font='11px system-ui';ctx.fillStyle='#7894a5';ctx.textAlign='left';for(const alt of [30,60])ctx.fillText('+'+alt+'°',cx+9,cy-R*(90-alt)/90+14);
 obsLocations=[];obsStarLocations=[];
 const site=surfacePoint(o.world,state.jd,o.lat,o.lon);
 const visibleStars=[];
 if($('obsStarsToggle').checked){
  for(const star of STAR_CATALOG){const hp=starHorizon(star,site);if(hp.altitude<0)continue;
   visibleStars.push({star,hp});const xy=obsPolar(hp.altitude,hp.azimuth,R,cx,cy);
   ctx.fillStyle=rgbaStar(star,.77);ctx.beginPath();ctx.arc(xy.x,xy.y,Math.max(1,2.75-star.mag*.30),0,Math.PI*2);ctx.fill();
   if(star.name){obsStarLocations.push({star,x:xy.x,y:xy.y});if($('obsNamesToggle').checked&&star.mag<2.2){
     ctx.font='9px system-ui';ctx.textAlign='left';ctx.fillStyle='#b7cfe2';ctx.fillText(star.name,xy.x+6,xy.y-6);}}
  }
  if($('obsTrianglesToggle').checked){
    for(const [name,seq] of [['Trójkąt Letni',['Wega','Altair','Deneb']],['Trójkąt Zimowy',['Syriusz','Procjon','Betelgeza']]]){
      const ordered=seq.map(n=>visibleStars.find(v=>v.star.name===n));if(ordered.some(v=>!v))continue;
      const xyz=ordered.map(v=>obsPolar(v.hp.altitude,v.hp.azimuth,R,cx,cy));ctx.beginPath();ctx.moveTo(xyz[0].x,xyz[0].y);
      for(const q of [...xyz.slice(1),xyz[0]])ctx.lineTo(q.x,q.y);
      ctx.strokeStyle='#a4bcca77';ctx.lineWidth=1.0;ctx.setLineDash([5,5]);ctx.stroke();ctx.setLineDash([]);
    }
  }
 }
 $('obsStarCount').textContent=visibleStars.length+' widocznych · HYG J2000';
 const starsList=$('obsStarList');starsList.replaceChildren();
 for(const item of visibleStars.filter(v=>v.star.name).sort((a,b)=>a.star.mag-b.star.mag).slice(0,14)){
   const row=document.createElement('button');row.className='obs-starrow';row.type='button';
   const pnt=item.hp,star=item.star;row.textContent=star.name+'  ·  '+number(pnt.altitude,1)+'°  / Az '+number(pnt.azimuth,1)+'°';
   row.title='Spójrz na '+star.name;row.onclick=()=>obsGoStar(star);starsList.appendChild(row);
 }
 if(!starsList.children.length)starsList.textContent='Brak jasnych nazwanych gwiazd nad horyzontem.';
 for(const id of skyBodies){if(id===o.world)continue;const b=byId[id],s=coords[id];if(!s||s.altitude<0)continue;const xy=obsPolar(s.altitude,s.azimuth,R,cx,cy),rr=id==='sun'?11:id==='moon'?9:id===obsSelected?8:6;
 ctx.beginPath();ctx.arc(xy.x,xy.y,rr+5,0,Math.PI*2);ctx.fillStyle=id===obsSelected?'#ffffff22':'#0000';ctx.fill();ctx.beginPath();ctx.arc(xy.x,xy.y,rr,0,Math.PI*2);ctx.fillStyle=b.color;ctx.fill();ctx.strokeStyle='#d9f0ef';ctx.lineWidth=id===obsSelected?2.2:.8;ctx.stroke();
 const ly=xy.y+(xy.y>cy?20:-14);ctx.font='11px system-ui';ctx.textAlign='center';ctx.fillStyle='#dceaf5';ctx.fillText(b.pl,xy.x,ly);obsLocations.push({id,x:xy.x,y:xy.y});}
 const list=$('obsBodies'), priorScroll=list.scrollTop;list.replaceChildren();
 const ranked=skyBodies.filter(id=>id!==o.world).map(id=>({id,h:coords[id]})).sort((a,b)=>b.h.altitude-a.h.altitude);
 for(const {id,h} of ranked){const b=byId[id],button=document.createElement('button');button.className='obs-object';button.type='button';
 const distance=h.distanceAU*AU_KM;const shown=distance<1.5e6?number(distance,0)+' km':number(h.distanceAU,3)+' AU';
 const angle=2*h.angularRadius*RAD;const angular=angle*60>1?number(angle*60,1)+'′':number(angle*3600,1)+'″';
 button.innerHTML='<span class="obs-dot" style="background:'+b.color+';color:'+b.color+'"></span><span class="obs-object-names"><b>'+b.pl+'</b><small>'+shown+' · średnica pozorna '+angular+'</small></span><span class="obs-values '+(h.altitude<0?'below':'')+'"><b>'+(h.altitude>=0?'↑ ':'↓ ')+number(h.altitude,1)+'°</b><small>Az '+number(h.azimuth,1)+'°</small></span>';
 button.title='Przejdź do powierzchni i skieruj kamerę na '+b.pl;button.onclick=()=>obsGo(id);list.appendChild(button);}
 list.scrollTop=priorScroll;obsPhaseUI();
}
function obsGoStar(star){const loc=observerOptions();if(state.focus!==loc.world)select(loc.world);
 state.lat=loc.lat;state.lon=loc.lon;$('latitude').value=loc.lat;$('longitude').value=loc.lon;
 if(state.mode!=='surface')setMode('surface');
 const hz=starHorizon(star,surfacePoint(loc.world,state.jd,loc.lat,loc.lon));
 state.az=hz.azimuth;state.alt=clamp(hz.altitude,-85,85);obsPriorPlaying=false;
 $('observatoryDialog').close();showToast(star.name+' · azymut '+number(hz.azimuth,1)+'° · wysokość '+number(hz.altitude,1)+'° · czas zatrzymany.');}
function obsGo(id=null){const loc=observerOptions();if(id===loc.world)return;
 // Preserve the selected observation point after select() resets default coordinates.
 if(state.focus!==loc.world)select(loc.world);
 state.lat=loc.lat;state.lon=loc.lon;$('latitude').value=loc.lat;$('longitude').value=loc.lon;
 if(state.mode!=='surface')setMode('surface');
 if(id&&id!==loc.world){lookAtSky(id);obsSelected=id;}
 $('observatoryDialog').close();showToast('Obserwator: '+byId[loc.world].pl+(id?' · kierunek: '+byId[id].pl:''));}
function obsSunAlt(world,jd,lat,lon){const p=positions(jd),pt=surfacePoint(world,jd,lat,lon,p),v=unit(sub(p.sun,pt.observer));return Math.asin(clamp(dot(v,pt.up),-1,1))*RAD;}
function obsFindEvents(){const loc=observerOptions();const {world,lat,lon}=loc;
 $('obsSunTimes').textContent='Wyznaczam kolejne przejścia Słońca przez geometryczny horyzont…';
 // Start a few minutes ahead, look for a sign change, then refine with bisection.
 const times=[],start=state.jd+.004,days=world==='moon'?45:world==='mercury'?200:world==='venus'?320:world==='mars'?6:14;
 const step=world==='earth'?.06:world==='mars'?.08:world==='moon'?.25:world==='mercury'?.5:1;
 let oldT=start,oldH=obsSunAlt(world,oldT,lat,lon);
 for(let t=start+step;t<=start+days;t+=step){const h=obsSunAlt(world,t,lat,lon);
  if((oldH<0&&h>=0)||(oldH>0&&h<=0)){
   const rise=oldH<0;let a=oldT,b=t,ha=oldH;
   for(let j=0;j<22;j++){let m=(a+b)/2,hm=obsSunAlt(world,m,lat,lon);if((ha<0)===(hm<0)){a=m;ha=hm;}else b=m;}
   times.push({rise,iso:fromJulian((a+b)/2).toISOString().replace('T',' ').slice(0,16)+' UTC'});
   if(times.length>=2)break;
  }oldT=t;oldH=h;
 }
 if(times.length===0){$('obsSunTimes').textContent='Nie znaleziono wschodu ani zachodu w badanym okresie '+number(days,0)+' dni ziemskich. Na wysokich szerokościach może trwać dzień lub noc polarna.';return;}
 $('obsSunTimes').innerHTML=times.map(t=>(t.rise?'☀ Wschód: ':'◒ Zachód: ')+t.iso).join('<br>')+'<small style="display:block;margin-top:7px;color:#6e94a8">Przejście środka Słońca przez horyzont; bez refrakcji i nierówności terenu.</small>';
}
function setupObservatory(){const dialog=$('observatoryDialog');$('openObservatory').onclick=()=>{obsPriorPlaying=state.playing;state.playing=false;syncPlay();obsSyncLocation();obsLastEventKey='';$('obsSunTimes').textContent='Wybierz „Policz wschód / zachód”, aby wyznaczyć dwa następne zdarzenia.';dialog.showModal();obsDraw();};
 $('closeObservatory').onclick=()=>dialog.close();for(const id of ['obsWorld','obsLatitude','obsLongitude','obsStarsToggle','obsNamesToggle','obsTrianglesToggle'])$(id).addEventListener('change',()=>{obsDraw();$('obsSunTimes').textContent='Nowe współrzędne: oblicz ponownie wschód i zachód.';});
 $('obsSurfaceGo').onclick=()=>obsGo();$('obsSunriseFind').onclick=obsFindEvents;
 $('skyMap').onclick=e=>{if(!obsLocations.length&&!obsStarLocations.length)return;const r=$('skyMap').getBoundingClientRect(),mx=(e.clientX-r.left)*540/r.width,my=(e.clientY-r.top)*540/r.height;let best=null,d=25;for(const o of obsLocations){let x=Math.hypot(o.x-mx,o.y-my);if(x<d){d=x;best=o.id;}} if(best){obsGo(best);return;}let nearest=null;
  for(const o of obsStarLocations){const dd=Math.hypot(o.x-mx,o.y-my);if(dd<d){d=dd;nearest=o.star;}}
  if(nearest)obsGoStar(nearest);};
 dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});dialog.addEventListener('close',()=>{state.playing=obsPriorPlaying;syncPlay();});}
function worldPosition(id,jd,trueScale=false){const p=positions(jd);return id==='solar'?[0,0,0]:id==='moon'?(trueScale?mul(p.moon,SW):add(mul(p.earth,SW),mul(sub(p.moon,p.earth),SW*80))):mul(p[id],SW);}
function flightEase(t){t=clamp(t,0,1);return t*t*(3-2*t);}

let renderer=null,lastFrame=0,lastUI=0,lastSelected='',lastMode='',lastOrbitalData=null,toastUntil=0;
const YEAR=365.256;
const number=(n,dp=0)=>new Intl.NumberFormat('pl-PL',{minimumFractionDigits:dp,maximumFractionDigits:dp}).format(n);
const titleBody=(id)=>id==='solar'?'Cały Układ Słoneczny':byId[id]?.pl||'Układ Słoneczny';
const dateString=()=>fromJulian(state.jd).toISOString().slice(0,16);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function showToast(message){const el=$('toast');el.textContent=message;el.classList.add('visible');toastUntil=performance.now()+3300;}
function showError(err){console.error(err);$('errorScreen').classList.remove('hidden');$('errorText').textContent=String(err?.message||err);}
function createNav(){for(const body of bodies){const btn=document.createElement('button');btn.className='nav-planet';btn.dataset.target=body.id;const cap=body.id==='sun'?'Gwiazda':body.id==='moon'?'Naturalny satelita':body.type;
 btn.innerHTML=`<span class="nav-icon"><span class="planet-dot" style="--planet-color:${body.color}"></span></span><span class="nav-text"><strong>${body.pl}</strong><small>${cap}</small></span><span class="nav-arrow">↗</span>`;
 btn.addEventListener('click',()=>select(body.id));$('planetList').appendChild(btn);}}
function select(id){state.eclipseZoom=false;state.eclipseKind=null;if(id!==state.focus){const previous=state.focus,priorDistance=state.dist;state.flight={from:worldPosition(previous,state.jd,state.trueScale),distFrom:priorDistance,started:performance.now()};state.focus=id;state.mode='orbit';state.yaw=0;state.pitch=.43;
 const distances={solar:1150,sun:18,mercury:4.7,venus:6.1,earth:7,moon:5.1,mars:5.4,jupiter:14,saturn:16,uranus:10,neptune:10};state.dist=state.trueScale?(id==='solar'?1150:Math.max(.005,physicalRadius(id)*7)):distances[id]||10;
 if(id==='moon'){state.lat=0;state.lon=0;}else if(id==='earth'){state.lat=54.35;state.lon=18.65;}
 $('latitude').value=state.lat;$('longitude').value=state.lon;
 }
 syncView();$('sidebar').classList.remove('open');}
function syncView(){document.querySelectorAll('.nav-planet').forEach(el=>el.classList.toggle('active',el.dataset.target===state.focus));
 $('pageHeading').textContent=titleBody(state.focus);$('infoName').textContent=titleBody(state.focus);
 $('infoType').textContent=state.focus==='solar'?'8 planet':byId[state.focus].type;
 $('infoDesc').textContent=state.focus==='solar'?'Osiem planet i ich eliptyczne orbity. Podążaj za dowolnym ciałem niebieskim.':byId[state.focus].desc;
 $('introTitle').textContent=state.focus==='solar'?'Odkrywaj kosmos.':state.mode==='surface'?'Spójrz w niebo.':`Odkryj: ${titleBody(state.focus)}.`;
 $('introDesc').textContent=state.mode==='surface'?'Przeciągnij, aby rozglądać się po horyzoncie. Kliknij na Słońce lub drugie ciało poniżej.':state.focus==='solar'?'Przeciągnij, aby obrócić widok. Przybliżaj rolką lub gestem szczypania.':'Obróć kamerę, przybliż obiekt lub wybierz widok z jego powierzchni (jeśli dostępny).';
 $('cameraMode').textContent=state.mode==='surface'?'OBSERWATOR NA POWIERZCHNI':state.focus==='solar'?'WIDOK HELIOCENTRYCZNY':'WIDOK ORBITALNY';
 $('surfaceMode').disabled=!['earth','moon','mars','mercury','venus'].includes(state.focus);
 $('orbitMode').classList.toggle('selected',state.mode==='orbit');$('surfaceMode').classList.toggle('selected',state.mode==='surface');
 $('surfaceOptions').classList.toggle('hidden',state.mode!=='surface');
 $('lookOther').textContent=state.focus==='moon'?'◌ Na Ziemię':state.focus==='earth'?'◌ Na Księżyc':'◌ Na Ziemię';
 $('lookOther').disabled=state.focus==='venus';
 $('lookSun').disabled=state.focus==='venus';
 $('surfaceNote').textContent=state.focus==='venus'?'Na Wenus gęsta pokrywa chmur ukrywa tarczę Słońca i gwiazdy. Krajobraz oraz barwy są poglądowe.':state.focus==='mars'?'Niebo i grunt pokazane ilustracyjnie: na Marsie dzienne niebo ma często barwę rdzawą, a okolice zachodzącego Słońca bywają niebieskawe.':state.focus==='mercury'?'Merkury praktycznie nie ma atmosfery. Niebo pozostaje czarne; teren jest poglądowy.':'Położenia obiektów i horyzont liczone geometrycznie; krajobraz poglądowy. Księżyc i orientacje planet są przybliżone.';
 $('zoomScale').textContent=state.mode==='surface'&&state.eclipseZoom?'TELESKOP · POLE WIDZENIA 2,4°':state.mode==='surface'?'HORYZONT OBLICZONY · TEREN ILUSTRACYJNY':state.trueScale?'SKALA FIZYCZNA 1:1 · MAŁE PLANETY MOGĄ ZNIKAĆ':'SKALA ORBIT PRAWDZIWA · ŚREDNICE POWIĘKSZONE';
 $('infoPanel').classList.remove('collapsed');
}
function setMode(mode){if(mode==='surface'&&!['earth','moon','mars','mercury','venus'].includes(state.focus))return;
 if(state.mode===mode)return;
 state.mode=mode;state.az=180;state.alt=20;state.flight=null; if(mode==='orbit')state.eclipseZoom=false;
 syncView();if(mode==='surface'){if(state.focus!=='venus')lookAtSky('sun');showToast('Astronomiczny horyzont · powierzchnia i pogoda poglądowe.');}
}
function dateClamp(){let year=fromJulian(state.jd).getUTCFullYear();if(year<1800||year>2050){state.jd=julianDate(new Date(year<1800?'1800-01-01T00:00:00Z':'2050-12-31T23:59:00Z'));state.playing=false;syncPlay();showToast('Granica modelu JPL: lata 1800–2050.');}}
function syncPlay(){$('playBtn').textContent=state.playing?'Ⅱ':'▶';$('playBtn').title=state.playing?'Wstrzymaj animację':'Wznów animację';$('liveStatus').textContent=state.playing?'SYMULACJA URUCHOMIONA':'CZAS ZATRZYMANY';}
function animateUI(now,results){if(now-lastUI<240)return;lastUI=now;
 if(document.activeElement!==$('dateInput'))$('dateInput').value=dateString();
 if(Math.abs(state.jd-state.anchorJD)>3650)state.anchorJD=state.jd;
 $('timeSlider').value=Math.round(clamp(500+500*(state.jd-state.anchorJD)/(3652.56),0,1000));
 $('epochWarning').textContent=scientificRange(state.jd)?'POZYCJE · JPL 1800–2050':'POZA ZAKRESEM MODELU';
 const p=results.pos;
 $('metricDistance').textContent=state.focus==='solar'?'0–30,1 AU':state.focus==='sun'?'0 AU':state.focus==='moon'?number(norm(sub(p.moon,p.sun)),3)+' AU':number(norm(p[state.focus]),3)+' AU';
 $('metricDiameter').textContent=state.focus==='solar'?'8 planet':number(byId[state.focus].radiusKm*2,0)+' km';
 const m=astroMetrics(state.focus,state.jd);$('metricLight').textContent=m.light;$('metricVelocity').textContent=m.velocity;$('metricExtra').textContent=m.detail;
 if(state.mode==='surface'&&results.local){let sun=results.local.sun;$('sunAlt').textContent=number(sun.altitude,1)+'°';$('skyDay').textContent=sun.altitude>=0?'DZIEŃ':sun.altitude>=-6?'ZMIERZCH':'NOC';$('sunAz').textContent=number(sun.azimuth,1)+'°';
   const other=state.focus==='moon'?'earth':state.focus==='earth'?'moon':'earth';const obj=results.local[other];$('otherSky').textContent=titleBody(other)+': '+number(obj.altitude,1)+'° / '+number(obj.azimuth,1)+'°';}
 }
function updateLabels(results){const labels=$('labels');labels.innerHTML='';
 if(state.mode==='surface')return;
 for(const body of bodies){const pos=results.projected[body.id];if(!pos)continue;
  if(pos.x<4||pos.x>canvas.clientWidth-90||pos.y<70||pos.y>canvas.clientHeight-200)continue;
  if(body.id==='sun'&&state.focus==='sun')continue;
  const label=document.createElement('button');label.className='planet-label';label.textContent=body.pl;label.style.cssText=`left:${pos.x}px;top:${pos.y}px;--planet-color:${body.color}`;label.type='button';label.title=`Przejdź do obiektu: ${body.pl}`;label.addEventListener('click',()=>select(body.id));labels.appendChild(label);
 }
}
function loop(now){if(!renderer)return;
 const dt=Math.min(.08,Math.max(0,(now-lastFrame)/1000));lastFrame=now;
 if(state.playing){state.jd+=dt*state.speed;dateClamp();}
 if($('eclipseDialog').open&&eclipseIsPlaying){state.jd+=dt*eclipseSpeedSeconds/86400;dateClamp();}
 if($('globeDialog').open&&globePlaying){state.jd+=dt*globeSpeed/86400;dateClamp();}
 if($('geometryDialog').open&&geometryPlaying){state.jd+=dt*geometrySpeed/86400;dateClamp();}
 const opts={...state};
 if(state.flight&&state.mode==='orbit'){const progress=clamp((now-state.flight.started)/1800,0,1);opts.flightFrom=state.flight.from;opts.flightDistFrom=state.flight.distFrom;opts.flightProgress=flightEase(progress);if(progress>=1)state.flight=null;}
 if(state.mode==='surface')opts.basis=surfacePoint(state.focus,state.jd,state.lat,state.lon);
 try{const result=renderer.render(opts);
  animateUI(now,result);
  if(now>lastOrbitalData+160||!lastOrbitalData){updateLabels(result);lastOrbitalData=now;}
  if($('observatoryDialog').open&&now-obsLastDraw>900){obsDraw();obsLastDraw=now;}
  if($('eclipseDialog').open&&now-eclipseLastDraw>90){eclipseDraw();eclipseLastDraw=now;}
  if($('globeDialog').open&&now-globeLastDraw>115){globeDraw();globeLastDraw=now;}
  if($('geometryDialog').open&&now-geometryLastDraw>72){geometryDraw();geometryLastDraw=now;}
 }catch(e){showError(e);renderer=null;return;}
 if(toastUntil&&now>toastUntil){$('toast').classList.remove('visible');toastUntil=0;}
 requestAnimationFrame(loop);
}
function lookAtSky(id){if(state.mode!=='surface')return;
 const pos=horizon(state.focus,state.jd,state.lat,state.lon);if(!pos[id])return;
 state.az=pos[id].azimuth;state.alt=clamp(pos[id].altitude,-85,85);
 if(pos[id].altitude<0)showToast(`${titleBody(id)} znajduje się pod horyzontem (${number(pos[id].altitude,1)}°).`);
}
/** ATLAS SOLARIS 5 — Zaćmienia. All geometric values are computed from ephemerides. */
const ECLIPSES=[
 {id:'s2026',kind:'solar',type:'CAŁKOWITE',date:'2026-08-12T17:47:05Z',name:'12 sierpnia 2026 · całkowite',lat:64.59,lon:-24.88,place:'Atlantyk, w pobliżu Islandii',source:'NASA GSFC'},
 {id:'s2027a',kind:'solar',type:'OBRĄCZKOWE',date:'2027-02-06T16:00:47Z',name:'6 lutego 2027 · obrączkowe',lat:-31.04,lon:-48.2,place:'Atlantyk u wybrzeży Ameryki Płd.',source:'NASA GSFC'},
 {id:'s2027b',kind:'solar',type:'CAŁKOWITE',date:'2027-08-02T10:06:38Z',name:'2 sierpnia 2027 · całkowite',lat:25.24,lon:33.54,place:'Górny Egipt, okolice Luksoru',source:'NASA GSFC'},
 {id:'s2028a',kind:'solar',type:'OBRĄCZKOWE',date:'2028-01-26T15:08:58Z',name:'26 stycznia 2028 · obrączkowe',lat:3.13,lon:-51.35,place:'Brazylia, rejon Amapá',source:'NASA GSFC'},
 {id:'s2028b',kind:'solar',type:'CAŁKOWITE',date:'2028-07-22T02:56:39Z',name:'22 lipca 2028 · całkowite',lat:-15.78,lon:127.01,place:'Północna Australia',source:'NASA GSFC'},
 {id:'l2026',kind:'lunar',type:'CZĘŚCIOWE',date:'2026-08-28T04:12:58Z',name:'28 sierpnia 2026 · częściowe',lat:40,lon:-100,place:'Ameryka Północna',source:'NASA GSFC'},
 {id:'l2027',kind:'lunar',type:'PÓŁCIENIOWE',date:'2027-02-20T23:12:51Z',name:'20 lutego 2027 · półcieniowe',lat:54.35,lon:18.65,place:'Polska',source:'NASA GSFC'},
 {id:'l2028',kind:'lunar',type:'CAŁKOWITE',date:'2028-12-31T16:52:08Z',name:'31 grudnia 2028 · całkowite',lat:54.35,lon:18.65,place:'Polska',source:'NASA GSFC'},
 {id:'l2029',kind:'lunar',type:'CAŁKOWITE',date:'2029-06-26T03:22:11Z',name:'26 czerwca 2029 · całkowite',lat:40,lon:-100,place:'Ameryka Północna',source:'NASA GSFC'}
];
const eclipseF=clamp;
const ECLIPSE_RSUN=696340, ECLIPSE_RMOON=1737.4,ECLIPSE_REARTH=6371;
let eclipseSelected=ECLIPSES[2], eclipseIsPlaying=false,eclipseSpeedSeconds=300,eclipseLastDraw=0,eclipsePriorPlay=false;
let eclipseEarthMap=null,eclipseTrackCache=new Map(),eclipsePriorJD=null,eclipseExitToSurface=false;
function circleOverlap(R,r,d){
 if(d>=R+r)return 0;
 if(d<=Math.abs(R-r))return Math.PI*Math.min(R,r)**2;
 const a=Math.acos(clamp((d*d+R*R-r*r)/(2*d*R),-1,1));
 const b=Math.acos(clamp((d*d+r*r-R*R)/(2*d*r),-1,1));
 return R*R*a+r*r*b-.5*Math.sqrt(Math.max(0,(-d+R+r)*(d+R-r)*(d-R+r)*(d+R+r)));
}
function sunMoonObserver(jd,lat,lon,p){
 const pt=surfacePoint('earth',jd,lat,lon,p);
 const ds=sub(p.sun,pt.observer),dm=sub(p.moon,pt.observer);
 const sd=norm(ds)*AU_KM,md=norm(dm)*AU_KM;
 const sv=unit(ds),mv=unit(dm);
 const rS=Math.atan(ECLIPSE_RSUN/sd),rM=Math.atan(ECLIPSE_RMOON/md);
 const sep=Math.atan2(norm(cross(sv,mv)),dot(sv,mv));
 const visible=dot(pt.up,sv)>0;
 return {pt,sv,mv,rS,rM,sep,visible,altitude:Math.asin(dot(pt.up,sv))*RAD,coverage:circleOverlap(rS,rM,sep)/(Math.PI*rS*rS),distMoon:md,distSun:sd};
}
function lunarGeometry(jd,p){
 const u=unit(p.earth),q=sub(p.moon,p.earth),x=dot(q,u)*AU_KM;
 const perpendicular=sub(q,mul(u,dot(q,u))),d=norm(perpendicular)*AU_KM;
 const sunDistance=norm(p.earth)*AU_KM;
 const uR=ECLIPSE_REARTH*1.02-x*(ECLIPSE_RSUN-ECLIPSE_REARTH)/sunDistance;
 const pR=ECLIPSE_REARTH*1.02+x*(ECLIPSE_RSUN+ECLIPSE_REARTH)/sunDistance;
 const umbraFraction=x>0?circleOverlap(Math.max(0,uR),ECLIPSE_RMOON,d)/(Math.PI*ECLIPSE_RMOON**2):0;
 const penumbraFraction=x>0?circleOverlap(Math.max(0,pR),ECLIPSE_RMOON,d)/(Math.PI*ECLIPSE_RMOON**2):0;
 return {axis:u,q,x,perpendicular,d,uR,pR,umbraFraction,penumbraFraction};
}
function eclipseStamp(jd){return fromJulian(jd).toISOString().replace('T',' ').slice(0,19)+' UTC';}
function eclipseDateShort(jd){return fromJulian(jd).toISOString().slice(0,16);}
function eclipseSetDate(date){state.jd=julianDate(new Date(date));state.anchorJD=state.jd;state.playing=false;syncPlay();}
function eclipseFrameRect(c){const dpr=Math.min(2,devicePixelRatio||1),width=c.clientWidth||600,height=c.clientHeight||360;const w=Math.max(2,Math.round(width*dpr)),h=Math.max(2,Math.round(height*dpr));if(c.width!==w||c.height!==h){c.width=w;c.height=h;}const ctx=c.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);return {ctx,w:width,h:height};}
function eclipseStarBackdrop(ctx,w,h){ctx.fillStyle='#030916';ctx.fillRect(0,0,w,h);
 const g=ctx.createRadialGradient(w*.52,h*.5,1,w*.52,h*.5,w*.55);g.addColorStop(0,'#16243a');g.addColorStop(.53,'#081325');g.addColorStop(1,'#020610');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
 // An intentionally decorative field, not catalog coordinates.
 for(let i=0;i<145;i++){const x=(Math.sin(i*127.1+7.4)*9381.8)%1,y=(Math.sin(i*63.8+12.4)*18281.7)%1;
 ctx.fillStyle=`rgba(190,211,231,${.13+(i%7)*.045})`;ctx.beginPath();ctx.arc((x<0?x+1:x)*w,(y<0?y+1:y)*h,(i%17===0?1.2:.55),0,Math.PI*2);ctx.fill();}
}
function eclipseDrawSolar(ctx,w,h,obs){
 const cx=w*.5,cy=h*.54,rs=Math.min(h*.335,w*.25),rm=rs*obs.rM/obs.rS;
 const ref=unit(cross(obs.sv,obs.pt.north));const tangentUp=unit(cross(ref,obs.sv));
 const dx=Math.atan2(dot(obs.mv,ref),dot(obs.mv,obs.sv))*rs/obs.rS;
 const dy=-Math.atan2(dot(obs.mv,tangentUp),dot(obs.mv,obs.sv))*rs/obs.rS;
 const moonX=cx+eclipseF(dx,-w*3,w*3),moonY=cy+eclipseF(dy,-h*3,h*3);
 const near=Math.hypot(dx,dy)<rs+rm;
 if(near){const corona=ctx.createRadialGradient(cx,cy,rs*.87,cx,cy,rs*1.72);corona.addColorStop(0,'rgba(255,241,201,.35)');corona.addColorStop(.12,'rgba(243,211,144,.23)');corona.addColorStop(.50,'rgba(185,210,255,.09)');corona.addColorStop(1,'rgba(185,210,255,0)');ctx.fillStyle=corona;ctx.beginPath();ctx.arc(cx,cy,rs*1.72,0,7);ctx.fill();}
 const glow=ctx.createRadialGradient(cx,cy,rs*.6,cx,cy,rs*1.8);glow.addColorStop(0,'rgba(248,197,112,.37)');glow.addColorStop(.5,'rgba(247,157,71,.13)');glow.addColorStop(1,'rgba(255,142,39,0)');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(cx,cy,rs*1.8,0,7);ctx.fill();
 const star=ctx.createRadialGradient(cx-rs*.3,cy-rs*.22,rs*.04,cx,cy,rs);star.addColorStop(0,'#fff9de');star.addColorStop(.5,'#ffe7a2');star.addColorStop(.87,'#ffc76e');star.addColorStop(1,'#f59b47');ctx.beginPath();ctx.arc(cx,cy,rs,0,7);ctx.fillStyle=star;ctx.fill();
 if(Math.abs(dx)<w*1.5&&Math.abs(dy)<h*1.5){ctx.save();ctx.beginPath();ctx.arc(moonX,moonY,rm,0,Math.PI*2);ctx.clip();ctx.fillStyle='#080d17';ctx.fillRect(moonX-rm,moonY-rm,rm*2,rm*2);
 const rgrad=ctx.createRadialGradient(moonX-rm*.22,moonY-rm*.19,rm*.03,moonX,moonY,rm);
 rgrad.addColorStop(0,'#1c2635');rgrad.addColorStop(1,'#070b14');ctx.fillStyle=rgrad;ctx.fillRect(moonX-rm,moonY-rm,rm*2,rm*2);ctx.restore();ctx.strokeStyle='rgba(207,222,234,.42)';ctx.lineWidth=.8;ctx.beginPath();ctx.arc(moonX,moonY,rm,0,7);ctx.stroke();}
 ctx.strokeStyle='rgba(198,218,237,.20)';ctx.setLineDash([3,6]);ctx.beginPath();ctx.moveTo(cx-3,cy);ctx.lineTo(cx+3,cy);ctx.moveTo(cx,cy-3);ctx.lineTo(cx,cy+3);ctx.stroke();ctx.setLineDash([]);
 ctx.font='12px system-ui';ctx.textAlign='left';ctx.fillStyle='#ccd6e3';ctx.fillText('SŁOŃCE',16,h-38);ctx.fillStyle='#96a8ba';ctx.fillText(`Promień kątowy ${ (obs.rS*RAD*60).toFixed(2)}′`,16,h-20);ctx.textAlign='right';ctx.fillStyle='#ccd6e3';ctx.fillText('KSIĘŻYC',w-16,h-38);ctx.fillStyle='#96a8ba';ctx.fillText(`Promień kątowy ${(obs.rM*RAD*60).toFixed(2)}′`,w-16,h-20);
 return {coverage:obs.coverage,sepArcmin:obs.sep*RAD*60};
}
function eclipseDrawLunar(ctx,w,h,g,obs,p){
 const baseR=Math.min(h*.095,w*.075),scale=baseR/ECLIPSE_RMOON;
 const midX=w*.52,midY=h*.53;
 const shadowR=g.uR*scale,penR=g.pR*scale;
 const northEcl=[0,0,1],xAxis=unit(cross(northEcl,g.axis)),yAxis=unit(cross(g.axis,xAxis));
 const mx=midX+dot(g.perpendicular,xAxis)*AU_KM*scale;
 const my=midY-dot(g.perpendicular,yAxis)*AU_KM*scale;
 ctx.save();ctx.fillStyle='rgba(35,51,75,.12)';ctx.beginPath();ctx.arc(midX,midY,penR,0,7);ctx.fill();ctx.strokeStyle='rgba(142,167,198,.37)';ctx.setLineDash([4,6]);ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(midX,midY,penR,0,7);ctx.stroke();ctx.setLineDash([]);
 let umb=ctx.createRadialGradient(midX,midY,shadowR*.12,midX,midY,shadowR);umb.addColorStop(0,'rgba(55,15,17,.54)');umb.addColorStop(.78,'rgba(85,20,20,.3)');umb.addColorStop(1,'rgba(70,28,27,.06)');ctx.fillStyle=umb;ctx.beginPath();ctx.arc(midX,midY,shadowR,0,7);ctx.fill();ctx.strokeStyle='rgba(235,131,94,.63)';ctx.beginPath();ctx.arc(midX,midY,shadowR,0,7);ctx.stroke();ctx.restore();
 // The textured Moon is clipped to the real angular disk at the selected instant.
 ctx.save();ctx.beginPath();ctx.arc(mx,my,baseR,0,7);ctx.clip();
 const moonAsset=window.SOLAR_ASSETS?.['./assets/moon.jpg'];
 if(!eclipseDrawLunar.img){eclipseDrawLunar.img=new Image();eclipseDrawLunar.img.src=moonAsset||'./assets/moon.jpg';}
 if(eclipseDrawLunar.img.complete&&eclipseDrawLunar.img.naturalWidth){ctx.drawImage(eclipseDrawLunar.img,mx-baseR,my-baseR,baseR*2,baseR*2);}else{ctx.fillStyle='#d8d6c9';ctx.fillRect(mx-baseR,my-baseR,baseR*2,baseR*2);}
 ctx.globalCompositeOperation='source-over';ctx.fillStyle='rgba(21,22,28,.30)';ctx.beginPath();ctx.arc(midX,midY,penR,0,7);ctx.fill();
 ctx.fillStyle='rgba(47,8,6,.80)';ctx.beginPath();ctx.arc(midX,midY,shadowR,0,7);ctx.fill();
 // Atmospheric scattering shown as a stylized, physically motivated red glow.
 const r=ctx.createRadialGradient(midX,midY,0,midX,midY,shadowR);r.addColorStop(0,'rgba(151,50,38,.55)');r.addColorStop(1,'rgba(130,42,26,.08)');ctx.fillStyle=r;ctx.beginPath();ctx.arc(midX,midY,shadowR,0,7);ctx.fill();
 ctx.restore();ctx.strokeStyle='#dee5e3';ctx.lineWidth=1;ctx.beginPath();ctx.arc(mx,my,baseR,0,7);ctx.stroke();
 ctx.fillStyle='#b9c5d5';ctx.textAlign='left';ctx.font='12px system-ui';ctx.fillText('PÓŁCIEŃ',16,h-39);ctx.fillStyle='#d99580';ctx.fillText('CIEŃ GŁÓWNY',16,h-19);
 ctx.fillStyle='#dce5ee';ctx.textAlign='right';ctx.fillText(`Księżyc: ${Math.round(g.d)} km od osi cienia`,w-15,h-20);
 return {umbra:g.umbraFraction,penumbra:g.penumbraFraction};
}
function eclipseShadowAxis(jd,p){
 const ray=unit(sub(p.moon,p.sun)),moonOffset=sub(p.moon,p.earth),t=-dot(moonOffset,ray),closest=add(moonOffset,mul(ray,t));
 const radius=ECLIPSE_REARTH/AU_KM,d=norm(closest);
 if(t<0||d>=radius)return null;
 const tImpact=t-Math.sqrt(Math.max(0,radius*radius-d*d));
 const surface=add(moonOffset,mul(ray,tImpact));
 const a=axes('earth',jd,p),lat=Math.asin(clamp(dot(surface,a.z)/radius,-1,1))*RAD;
 const lon=Math.atan2(dot(surface,a.y),dot(surface,a.x))*RAD;
 return {lat,lon,d};
}
function eclipseDrawMap(canvas,p,jd,kind,lat,lon){
 const {ctx,w,h}=eclipseFrameRect(canvas);
 const pad=13,box={x:pad,y:pad,w:w-2*pad,h:h-2*pad};
 ctx.fillStyle='#071121';ctx.fillRect(0,0,w,h);
 if(!eclipseEarthMap){eclipseEarthMap=new Image();eclipseEarthMap.src=window.SOLAR_ASSETS?.['./assets/earth.jpg']||'./assets/earth.jpg';}
 if(eclipseEarthMap.complete&&eclipseEarthMap.naturalWidth){ctx.drawImage(eclipseEarthMap,box.x,box.y,box.w,box.h);}
 else{ctx.fillStyle='#18334b';ctx.fillRect(box.x,box.y,box.w,box.h);}
 const ax=axes('earth',jd,p),sDir=unit(sub(p.sun,p.earth));
 const cols=200,rows=100,off=eclipseDrawMap.off||document.createElement('canvas');eclipseDrawMap.off=off;off.width=cols;off.height=rows;
 const imageCtx=off.getContext('2d'),pix=imageCtx.createImageData(cols,rows),data=pix.data;
 const earthCenter=p.earth,moonCenter=p.moon,re=ECLIPSE_REARTH/AU_KM;
 const rSun=Math.atan2(ECLIPSE_RSUN,norm(earthCenter)*AU_KM);
 for(let y=0;y<rows;y++){
  const phi=(90-(y+.5)*180/rows)*DEG,cl=Math.cos(phi),sl=Math.sin(phi);
  for(let x=0;x<cols;x++){
   const theta=(-180+(x+.5)*360/cols)*DEG;
   const up=add(add(mul(ax.x,cl*Math.cos(theta)),mul(ax.y,cl*Math.sin(theta))),mul(ax.z,sl));
   const bright=dot(up,sDir);
   let opacity=bright<0?.75*(1-Math.max(0,bright+0.15)/.15):0;
   if(kind==='solar'&&bright>-.09){
    const observer=add(earthCenter,mul(up,re)),ds=mul(observer,-1),dm=sub(moonCenter,observer);
    const nds=norm(ds),ndm=norm(dm),dsun=unit(ds),dmoon=unit(dm);
    const rm=Math.atan2(ECLIPSE_RMOON,ndm*AU_KM),rs=Math.atan2(ECLIPSE_RSUN,nds*AU_KM);
    const cos=dot(dsun,dmoon);
    if(cos>Math.cos(rs+rm)){
     const sep=Math.acos(clamp(cos,-1,1)),c=circleOverlap(rs,rm,sep)/(Math.PI*rs*rs);
     opacity=Math.max(opacity,c*.96);
    }
   }
   if(kind==='lunar'){
    const moonDir=unit(sub(moonCenter,add(earthCenter,mul(up,re))));
    const moonAlt=dot(up,moonDir);
    if(moonAlt>0&&bright<0)opacity=Math.min(opacity,.19);
   }
   const k=(y*cols+x)*4;data[k]=4;data[k+1]=9;data[k+2]=22;data[k+3]=Math.round(clamp(opacity,0,.97)*255);
  }
 }
 imageCtx.putImageData(pix,0,0);ctx.save();ctx.imageSmoothingEnabled=true;ctx.drawImage(off,box.x,box.y,box.w,box.h);ctx.restore();
 ctx.strokeStyle='rgba(221,235,246,.36)';ctx.lineWidth=1;ctx.strokeRect(box.x+.5,box.y+.5,box.w-1,box.h-1);
 const toXY=(la,lo)=>({x:box.x+(lo+180)/360*box.w,y:box.y+(90-la)/180*box.h});
 const marker=(la,lo,color,r)=>{let pt=toXY(la,lo);ctx.lineWidth=1.5;ctx.strokeStyle=color;ctx.beginPath();ctx.arc(pt.x,pt.y,r,0,7);ctx.stroke();ctx.beginPath();ctx.moveTo(pt.x-r-5,pt.y);ctx.lineTo(pt.x+r+5,pt.y);ctx.moveTo(pt.x,pt.y-r-5);ctx.lineTo(pt.x,pt.y+r+5);ctx.stroke();};
 // Draw shadow axis track across the terrestrial globe, only where it actually hits Earth.
 if(kind==='solar'){
  const peakJD=julianDate(new Date(eclipseSelected.date));let track=eclipseTrackCache.get(eclipseSelected.id);
  if(!track){track=[];for(let m=-135;m<=135;m+=3){const when=peakJD+m/1440;let pt=eclipseShadowAxis(when,positions(when));if(pt)track.push(pt);}eclipseTrackCache.set(eclipseSelected.id,track);}
  ctx.lineWidth=2;ctx.strokeStyle='rgba(255,190,91,.95)';ctx.beginPath();let last=null;
  for(const point of track){const pt=toXY(point.lat,point.lon);if(last&&Math.abs(pt.x-last.x)<box.w*.12)ctx.lineTo(pt.x,pt.y);else ctx.moveTo(pt.x,pt.y);last=pt;}
  ctx.stroke();let curr=eclipseShadowAxis(jd,p);if(curr)marker(curr.lat,curr.lon,'#ffc16e',4);
 }
 marker(lat,lon,'#7cfcdb',3.5);
 ctx.fillStyle='rgba(4,12,23,.87)';ctx.fillRect(box.x,box.y+box.h-25,box.w,25);
 ctx.fillStyle='#c7d8e5';ctx.font='11px system-ui';ctx.textAlign='left';ctx.fillText(kind==='solar'?'◉ pomarańczowy: oś cienia  ·  turkusowy: obserwator':'◉ turkusowy: obserwator  ·  jasne obszary: możliwa widoczność Księżyca',box.x+9,box.y+box.h-8);
}
function eclipseDraw(){const dlg=$('eclipseDialog');if(!dlg.open)return;
 const jd=state.jd,p=positions(jd),lat=clamp(Number($('eclipseLat').value)||0,-90,90),lon=clamp(Number($('eclipseLon').value)||0,-180,180),kind=eclipseSelected.kind;
 const obs=sunMoonObserver(jd,lat,lon,p),lunar=lunarGeometry(jd,p);
 const canvas=$('eclipseDiagram'),{ctx,w,h}=eclipseFrameRect(canvas);eclipseStarBackdrop(ctx,w,h);
 if(kind==='solar')eclipseDrawSolar(ctx,w,h,obs);else eclipseDrawLunar(ctx,w,h,lunar,obs,p);
 eclipseDrawMap($('eclipseMap'),p,jd,kind,lat,lon);
 $('eclipseNow').textContent=eclipseStamp(jd);
 if(document.activeElement!==$('eclipseDate'))$('eclipseDate').value=eclipseDateShort(jd);
 const t=(jd-julianDate(new Date(eclipseSelected.date)))*1440;
 $('eclipseProgress').value=clamp(t,-240,240).toFixed(2);
 $('eclipseOffset').textContent=(t<0?'−':'+')+Math.abs(t).toFixed(1)+' min od maksimum';
 if(kind==='solar'){
  let type='Brak zakrycia';
  if(obs.coverage>.9999)type=obs.rM>=obs.rS?'Całkowite':'Obrączkowe';
  else if(obs.coverage>.00005)type='Częściowe';
  $('eclipseValue').textContent=(obs.coverage*100).toFixed(2)+'%';
  $('eclipseValueLabel').textContent='ZAKRYCIE TARCZY SŁOŃCA';
  $('eclipseStatus').textContent=type+(obs.visible?' · Słońce nad horyzontem':' · Słońce pod horyzontem');
  $('eclipseStat1').textContent=(obs.sep*RAD*60).toFixed(2)+'′';$('eclipseStat2').textContent=obs.altitude.toFixed(1)+'°';
  $('eclipseStat1Label').textContent='ODSTĘP ŚRODKÓW';$('eclipseStat2Label').textContent='WYSOKOŚĆ SŁOŃCA';
 }else{
  $('eclipseValue').textContent=(lunar.umbraFraction*100).toFixed(1)+'%';$('eclipseValueLabel').textContent='TARCZA KSIĘŻYCA W CIENIU GŁÓWNYM';
  let type=lunar.umbraFraction>.9999?'Całkowite':lunar.umbraFraction>.001?'Częściowe':lunar.penumbraFraction>.01?'Półcieniowe':'Brak zaćmienia';
  const moonVisible=horizon('earth',jd,lat,lon).moon.altitude>0;
  $('eclipseStatus').textContent=type+(moonVisible?' · Księżyc nad horyzontem':' · Księżyc pod horyzontem');
  $('eclipseStat1').textContent=Math.round(lunar.d).toLocaleString('pl-PL')+' km';$('eclipseStat2').textContent=Math.round(lunar.uR).toLocaleString('pl-PL')+' km';
  $('eclipseStat1Label').textContent='ODSTĘP OD OSI CIENIA';$('eclipseStat2Label').textContent='PROMIEŃ CIENIA GŁÓWNEGO';
 }
 $('eclipsePlay').textContent=eclipseIsPlaying?'Ⅱ Zatrzymaj':'▶ Odtwórz';
}
function eclipsePickEvent(id){const event=ECLIPSES.find(e=>e.id===id)||ECLIPSES[2];eclipseSelected=event;
 $('eclipseEvent').value=event.id;$('eclipseLat').value=event.lat;$('eclipseLon').value=event.lon;
 $('eclipsePlace').textContent=event.place+(event.computed?' · orientacyjny czas z modelu geometrycznego (UTC)':' · czas maksimum wg katalogu NASA (UTC)');
 $('eclipseType').textContent=event.kind==='solar'?'ZAĆMIENIE SŁOŃCA':'ZAĆMIENIE KSIĘŻYCA';
 $('eclipseTitle').textContent=event.name;$('eclipseMapTitle').textContent=event.kind==='solar'?'Zasięg cienia na Ziemi':'Widoczność Księżyca na Ziemi';
 eclipseSetDate(event.date);eclipseIsPlaying=false;eclipseDraw();
}
function eclipseGoSurface(){const lat=clamp(Number($('eclipseLat').value)||0,-90,90),lon=clamp(Number($('eclipseLon').value)||0,-180,180);
 eclipseIsPlaying=false;eclipseExitToSurface=true;if($('eclipseDialog').open)$('eclipseDialog').close();if($('globeDialog').open){globeGoSurface=true;$('globeDialog').close();}
 select('earth');state.lat=lat;state.lon=lon;$('latitude').value=lat;$('longitude').value=lon;
 setMode('surface');lookAtSky(eclipseSelected.kind==='solar'?'sun':'moon');state.eclipseZoom=true;state.eclipseKind=eclipseSelected.kind;syncView();
 state.playing=false;syncPlay();showToast('Teleskop 2,4° · geometria nieba obliczona dla współrzędnych obserwatora.');
}
function setupEclipseLab(){
 const d=$('eclipseDialog'),select=$('eclipseEvent');
 ECLIPSES.forEach(e=>{const opt=document.createElement('option');opt.value=e.id;opt.textContent=(e.kind==='solar'?'☀ ':'☾ ')+e.name;select.appendChild(opt);});
 const mapImage=new Image();mapImage.src=window.SOLAR_ASSETS?.['./assets/earth.jpg']||'./assets/earth.jpg';eclipseEarthMap=mapImage;
 $('openEclipses').onclick=()=>{eclipsePriorJD=state.jd;eclipsePriorPlay=state.playing;state.playing=false;syncPlay();d.showModal();eclipsePickEvent(eclipseSelected.id);};
 $('closeEclipses').onclick=()=>d.close();d.addEventListener('click',e=>{if(e.target===d)d.close();});
 d.addEventListener('close',()=>{eclipseIsPlaying=false;if(!eclipseExitToSurface)state.playing=eclipsePriorPlay;else state.playing=false;eclipseExitToSurface=false;syncPlay();});
 select.onchange=()=>eclipsePickEvent(select.value);
 $('eclipseProgress').oninput=e=>{eclipseIsPlaying=false;state.jd=julianDate(new Date(eclipseSelected.date))+Number(e.target.value)/1440;state.anchorJD=state.jd;eclipseDraw();};
 $('eclipseDate').onchange=e=>{if(e.target.value){eclipseIsPlaying=false;eclipseSetDate(e.target.value+':00Z');eclipseDraw();}};
 for(const id of ['eclipseLat','eclipseLon'])$(id).onchange=()=>{eclipseIsPlaying=false;eclipseDraw();};
 $('eclipsePlay').onclick=()=>{eclipseIsPlaying=!eclipseIsPlaying;if(eclipseIsPlaying){state.playing=false;syncPlay();}eclipseDraw();};
 $('eclipseRewind').onclick=()=>{eclipseIsPlaying=false;state.jd=julianDate(new Date(eclipseSelected.date))-(eclipseSelected.kind==='solar'?125:225)/1440;state.anchorJD=state.jd;eclipseDraw();};
 $('eclipsePeak').onclick=()=>{eclipseIsPlaying=false;eclipseSetDate(eclipseSelected.date);eclipseDraw();};
 $('eclipseSpeed').onchange=e=>{eclipseSpeedSeconds=Number(e.target.value);};
 $('eclipseVisit').onclick=eclipseGoSurface;
 $('eclipseGlobe').onclick=()=>globeOpen(true);
 $('eclipseGeometry').onclick=()=>geometryOpen('lab');
 $('eclipseToday').onclick=()=>{eclipseIsPlaying=false;state.playing=false;state.jd=eclipsePriorJD||state.jd;state.anchorJD=state.jd;syncPlay();eclipseDraw();};
 $('eclipseMinus').onclick=()=>{eclipseIsPlaying=false;state.jd-=5/1440;eclipseDraw();};
 $('eclipsePlus').onclick=()=>{eclipseIsPlaying=false;state.jd+=5/1440;eclipseDraw();};
}

function setupControls(){setupObservatory();setupEclipseLab();setupGlobe();setupGeometry();
 $('toggleMenu').onclick=()=>$('sidebar').classList.toggle('open');$('openMethod').onclick=()=>$('methodDialog').showModal();$('helpBtn').onclick=()=>$('methodDialog').showModal();$('closeMethod').onclick=()=>$('methodDialog').close();
 document.querySelector('[data-target="solar"]').onclick=()=>select('solar');
 $('orbitMode').onclick=()=>setMode('orbit');$('surfaceMode').onclick=()=>setMode('surface');
 $('homeView').onclick=()=>select('solar');$('resetCam').onclick=()=>{if(state.mode==='surface'){state.az=180;state.alt=18;}else{state.yaw=0;state.pitch=.53;}showToast('Kamera wycentrowana.');};
 $('zoomIn').onclick=()=>{if(state.mode==='surface'){state.alt=clamp(state.alt+4,-85,85);}else state.dist=Math.max(1.6,state.dist*.7);};
 $('zoomOut').onclick=()=>{if(state.mode==='surface'){state.alt=clamp(state.alt-4,-85,85);}else state.dist=Math.min(2800,state.dist*1.43);};
 $('collapseInfo').onclick=()=>{$('infoPanel').classList.toggle('collapsed');$('collapseInfo').textContent=$('infoPanel').classList.contains('collapsed')?'+':'−';};
 $('orbitsToggle').onchange=e=>state.orbits=e.target.checked;$('lightingToggle').onchange=e=>state.lighting=e.target.checked;
 $('trueScaleToggle').onchange=e=>{state.trueScale=e.target.checked;state.flight=null;
  if(state.mode==='orbit')state.dist=state.trueScale?(state.focus==='solar'?1150:Math.max(.005,physicalRadius(state.focus)*7)):({solar:1150,sun:18,mercury:4.7,venus:6.1,earth:7,moon:5.1,mars:5.4,jupiter:14,saturn:16,uranus:10,neptune:10}[state.focus]||10);
  syncView();showToast(state.trueScale?'Skala fizyczna 1:1 — odległe planety naprawdę są bardzo małe.':'Przywrócono czytelną skalę ilustracyjną.');};
 $('playBtn').onclick=()=>{state.playing=!state.playing;syncPlay();};
 $('speedSelect').onchange=e=>{state.speed=Number(e.target.value);state.playing=true;syncPlay();};
 $('dateInput').onchange=e=>{if(!e.target.value)return;const dt=new Date(e.target.value+':00Z');if(Number.isNaN(dt.getTime()))return;state.jd=julianDate(dt);dateClamp();state.anchorJD=state.jd;};
 $('nowBtn').onclick=()=>{state.jd=julianDate(new Date());state.anchorJD=state.jd;};
 $('timeSlider').oninput=e=>{state.jd=state.anchorJD+(Number(e.target.value)-500)/500*3652.56;dateClamp();};
 $('latitude').oninput=e=>state.lat=clamp(Number(e.target.value)||0,-90,90);
 $('longitude').oninput=e=>state.lon=clamp(Number(e.target.value)||0,-180,180);
 $('lookSun').onclick=()=>lookAtSky('sun');$('lookOther').onclick=()=>lookAtSky(state.focus==='moon'?'earth':state.focus==='earth'?'moon':'earth');
 document.querySelectorAll('[data-mission]').forEach(button=>button.addEventListener('click',()=>{
  const preset=button.dataset.mission;
  if(preset==='earthsky'){select('earth');setMode('surface');return;}
  if(preset==='moonsky'){select('moon');state.lat=0;state.lon=0;$('latitude').value=0;$('longitude').value=0;setMode('surface');lookAtSky('earth');return;}
  if(preset==='marssky'){
   select('mars');state.lat=0;state.lon=0;$('latitude').value=0;$('longitude').value=0;
   // Find the next approximate Mars sunset in the visual ephemeris, then stop time for inspection.
   const targetAltitude=1.5,start=state.jd;
   let lastTime=start,lastAlt=horizon('mars',lastTime,0,0).sun.altitude;
   for(let j=1;j<=65;j++){
     let nextTime=start+j*.02,nextAlt=horizon('mars',nextTime,0,0).sun.altitude;
     if(lastAlt>targetAltitude&&nextAlt<=targetAltitude){
       let lo=lastTime,hi=nextTime;
       for(let k=0;k<19;k++){let md=(lo+hi)/2;if(horizon('mars',md,0,0).sun.altitude>targetAltitude)lo=md;else hi=md;}
       state.jd=(lo+hi)/2;state.anchorJD=state.jd;break;
     }
     lastTime=nextTime;lastAlt=nextAlt;
   }
   setMode('surface');state.alt=1.5;lookAtSky('sun');state.alt=2;
   state.playing=false;syncPlay();showToast('Mars: przybliżony zachód Słońca · czas zatrzymany.');return;
  }
  if(preset==='saturn'){select('saturn');state.pitch=.32;return;}
  if(preset==='venus'){select('venus');state.pitch=.21;return;}
  select('solar');
 }));
 $('captureBtn').onclick=()=>{try{const a=document.createElement('a');a.download='ATLAS_SOLARIS_'+dateString().replace(/[:T]/g,'-')+'_'+state.focus+'.png';a.href=canvas.toDataURL('image/png');document.body.appendChild(a);a.click();a.remove();showToast('Zapisano obraz symulacji PNG.');}catch(err){showToast('Przeglądarka zablokowała zapis obrazu.');}};

 let down=null,moved=false,mouseLast=null,pointers=new Map(),pinchLast=0;
 const onDown=e=>{if(e.button!==0&&e.pointerType==='mouse')return;canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);down={x:e.clientX,y:e.clientY,time:performance.now()};mouseLast=[e.clientX,e.clientY];moved=false;canvas.classList.add('dragging');};
 canvas.addEventListener('pointerdown',onDown);
 canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;
  const previous=pointers.get(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);
  if(pointers.size===2){const arr=[...pointers.values()];let d=Math.hypot(arr[0][0]-arr[1][0],arr[0][1]-arr[1][1]);if(pinchLast&&state.mode==='orbit'){state.dist=clamp(state.dist*(pinchLast/d),1.5,3000);}pinchLast=d;moved=true;return;}
  const dx=e.clientX-previous[0],dy=e.clientY-previous[1];if(Math.abs(e.clientX-down.x)+Math.abs(e.clientY-down.y)>5)moved=true;
  if(state.mode==='surface'){state.az=((state.az-dx*.22)%360+360)%360;state.alt=clamp(state.alt+dy*.20,-87,87);}
  else{state.yaw-=dx*.006;state.pitch=clamp(state.pitch+dy*.006,-1.48,1.48);}
 });
 canvas.addEventListener('pointerup',e=>{pointers.delete(e.pointerId);pinchLast=0;canvas.classList.remove('dragging');
  if(!moved&&state.mode==='orbit'&&renderer){const rect=canvas.getBoundingClientRect();let nearest=null,dist=24;
   for(const [id,point] of Object.entries(renderer.frame.projected)){if(!point)continue;let d=Math.hypot(point.x-(e.clientX-rect.left),point.y-(e.clientY-rect.top));if(d<dist){nearest=id;dist=d;}}
   if(nearest)select(nearest);}
 });
 canvas.addEventListener('pointercancel',e=>{pointers.delete(e.pointerId);pinchLast=0;canvas.classList.remove('dragging');});
 canvas.addEventListener('wheel',e=>{e.preventDefault();if(state.mode==='orbit'){state.dist=clamp(state.dist*Math.exp(Math.sign(e.deltaY)*.15),1.5,3000);}else state.alt=clamp(state.alt-Math.sign(e.deltaY)*2,-87,87);},{passive:false});
 document.addEventListener('keydown',e=>{if(e.target.matches('input, select, textarea')||$('methodDialog').open||$('observatoryDialog').open||$('eclipseDialog').open||$('globeDialog').open||$('geometryDialog').open)return;
  if(e.code==='Space'){e.preventDefault();state.playing=!state.playing;syncPlay();}
  if(e.key==='Escape')$('sidebar').classList.remove('open');
  if(e.key==='+'||e.key==='=')state.dist=clamp(state.dist*.8,1.5,3000);
  if(e.key==='-')state.dist=clamp(state.dist*1.25,1.5,3000);
  if(e.key==='ArrowLeft')state.mode==='surface'?state.az-=8:state.yaw-=.1;
  if(e.key==='ArrowRight')state.mode==='surface'?state.az+=8:state.yaw+=.1;
 });
}
function boot(){try{createNav();setupControls();try{renderer=new Renderer(canvas);}catch(glError){console.warn('WebGL 2 unavailable, switching to Canvas 2D:',glError);renderer=new CanvasRenderer(canvas);$('cameraMode').textContent='TRYB ZGODNOŚCI · 2D';$('zoomScale').textContent='TRYB ZGODNOŚCI 2D · ZALECANA PRZEGLĄDARKA WEBGL 2';showToast('Brak WebGL 2. Włączony uproszczony tryb 2D.');}syncView();syncPlay();$('dateInput').value=dateString();requestAnimationFrame(t=>{lastFrame=t;loop(t);});}catch(e){showError(e);}}

/**
 * ATLAS SOLARIS 6.0 — Orbital eclipse globe (offline Canvas 2D).
 * Physically grounded orthographic Earth projection with texture sampling,
 * diurnal illumination and geometric solar occultation per geographic point.
 * This educational visualization deliberately does not claim limb-contact precision.
 */
let globePriorPlay=false, globeFromLab=false, globeGoSurface=false;
let globePlaying=false, globeSpeed=300, globeLastDraw=0, globeTexture=null, globeOffscreen=null;
let globeCamera={lat:21,lon:30,zoom:1.0,follow:true,mode:'shadow'};
let globeObserver={lat:25.24,lon:33.54};
let globeGlobeRect=null;
let globePointer=null, globeDragging=false;
const GLOBE_R_EARTH=6371/AU_KM;
const GLOBE_R_MOON=1737.4/AU_KM;
const GLOBE_R_SUN=696340/AU_KM;
function globeClamp(x,a,b){return Math.max(a,Math.min(b,x));}
function globeWrapLon(x){return ((x+180)%360+360)%360-180;}
function globeDeltaLon(x,y){return globeWrapLon(x-y);}
function globePosition(lat,lon){const a=lat*DEG,b=lon*DEG,c=Math.cos(a);return [c*Math.cos(b),c*Math.sin(b),Math.sin(a)];}
function globeGeographic(v){return {lat:Math.asin(globeClamp(v[2],-1,1))*RAD,lon:globeWrapLon(Math.atan2(v[1],v[0])*RAD)};}
function globeBasis(){const la=globeCamera.lat*DEG,lo=globeCamera.lon*DEG;
 const toward=globePosition(globeCamera.lat,globeCamera.lon),right=[-Math.sin(lo),Math.cos(lo),0],up=[-Math.sin(la)*Math.cos(lo),-Math.sin(la)*Math.sin(lo),Math.cos(la)];
 return {toward,right,up};
}
function globeProject(lat,lon,rect=globeGlobeRect){if(!rect)return null;
 const n=globePosition(lat,lon),b=globeBasis(),d=dot(n,b.toward);
 if(d<.004)return null;
 return {x:rect.cx+dot(n,b.right)*rect.r,y:rect.cy-dot(n,b.up)*rect.r,front:d};
}
function globeUnproject(x,y,rect=globeGlobeRect){if(!rect)return null;
 const nx=(x-rect.cx)/rect.r,ny=-(y-rect.cy)/rect.r,rr=nx*nx+ny*ny;
 if(rr>=1)return null;
 const b=globeBasis(),z=Math.sqrt(1-rr),n=[0,1,2].map(k=>b.right[k]*nx+b.up[k]*ny+b.toward[k]*z);
 return globeGeographic(n);
}
function globeFixedVectors(jd,p){const a=axes('earth',jd,p);const eqvec=v=>[dot(v,a.x),dot(v,a.y),dot(v,a.z)];
 const S=eqvec(sub(p.sun,p.earth)),M=eqvec(sub(p.moon,p.earth));
 const sunny=unit(S),moonny=unit(M);
 return {S,M,sunny,moonny,ss:dot(S,S),mm:dot(M,M),sm:dot(S,M)};
}
function globeShadowAt(n,geo){
 // The same finite-disc angular overlap used by the v5 local telescope,
 // expressed directly in Earth-fixed Cartesian coordinates for fast rasterization.
 const ns=dot(n,geo.S),nm=dot(n,geo.M);
 const ds2=geo.ss+GLOBE_R_EARTH**2-2*GLOBE_R_EARTH*ns;
 const dm2=geo.mm+GLOBE_R_EARTH**2-2*GLOBE_R_EARTH*nm;
 const ds=Math.sqrt(ds2),dm=Math.sqrt(dm2);
 if(dm>=ds)return 0;
 const cs=globeClamp((geo.sm-GLOBE_R_EARTH*(ns+nm)+GLOBE_R_EARTH**2)/(ds*dm),-1,1);
 if(cs<0.99972)return 0;
 const rS=Math.atan2(GLOBE_R_SUN,ds),rM=Math.atan2(GLOBE_R_MOON,dm);
 if(cs<=Math.cos(rS+rM))return 0;
 const sep=Math.acos(cs);
 return globeClamp(circleOverlap(rS,rM,sep)/(Math.PI*rS*rS),0,1);
}
function globeImageReady(img){try{
 const tex=document.createElement('canvas');tex.width=1536;tex.height=768;
 const c=tex.getContext('2d',{willReadFrequently:true});c.drawImage(img,0,0,tex.width,tex.height);
 globeTexture={rgba:c.getImageData(0,0,tex.width,tex.height).data,w:tex.width,h:tex.height};
 $('globeLoading').hidden=true;
 }catch(err){$('globeLoading').textContent='Nie można odczytać mapy. Użyję palety zastępczej.';console.warn(err);}
}
function globeFrame(){const canvas=$('globeCanvas'),dpr=Math.min(devicePixelRatio||1,2);
 const w=canvas.clientWidth||850,h=canvas.clientHeight||550;
 if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
 const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);
 const r=Math.min(w*.425,h*.442,430)*globeCamera.zoom;
 const cx=w*(w>540?.50:.50),cy=h*(w>540?.545:.52);
 globeGlobeRect={cx,cy,r};return {ctx,w,h,cx,cy,r};
}
function globeBackdrop(ctx,w,h){
 const bg=ctx.createRadialGradient(w*.48,h*.53,10,w*.48,h*.53,Math.max(w,h)*.73);
 bg.addColorStop(0,'#11283d');bg.addColorStop(.57,'#071222');bg.addColorStop(1,'#02060e');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
 // Decorative pinpoints, not a physical star chart (the Observatory has HYG stars).
 for(let i=0;i<108;i++){
  const x=((Math.sin(i*79.42+6.13)*17721.7)%1+1)%1*w,y=((Math.sin(i*112.15+3.41)*19331.2)%1+1)%1*h;
  const a=.11+(i%5)*.065;ctx.fillStyle=`rgba(192,216,240,${a})`;ctx.beginPath();ctx.arc(x,y,i%17===0?1.15:.55,0,Math.PI*2);ctx.fill();
 }
}
function globeDrawSphere(ctx,rect,geo,solar){
 const {cx,cy,r}=rect;
 const size=globePlaying?360:globeDragging?300:globeClamp(Math.floor(r*1.78),340,535);
 if(!globeOffscreen)globeOffscreen=document.createElement('canvas');
 if(globeOffscreen.width!==size||globeOffscreen.height!==size){globeOffscreen.width=size;globeOffscreen.height=size;}
 const gc=globeOffscreen.getContext('2d',{willReadFrequently:true});const im=gc.createImageData(size,size),data=im.data;
 const B=globeBasis(),x0=B.right,y0=B.up,z0=B.toward, tex=globeTexture;
 const R=size*.5,invR=1/R;
 const sx=geo.sunny,moon=geo.moonny;
 for(let y=0;y<size;y++){
  const v=(R-y-.5)*invR;
  for(let x=0;x<size;x++){
   const u=(x+.5-R)*invR,rsq=u*u+v*v,off=(y*size+x)*4;
   if(rsq>=1){data[off+3]=0;continue;}
   const z=Math.sqrt(1-rsq);
   const a=x0[0]*u+y0[0]*v+z0[0]*z;
   const b=x0[1]*u+y0[1]*v+z0[1]*z;
   const c=x0[2]*u+y0[2]*v+z0[2]*z;
   const sunlit=a*sx[0]+b*sx[1]+c*sx[2];
   let light=.065+1.24*Math.pow(Math.max(0,sunlit),.72);
   if(!solar)light=Math.max(.48,light); // explicitly enhanced night exposure for lunar-eclipse hemisphere
   let shadow=0;
   if(solar&&sunlit>0){shadow=globeShadowAt([a,b,c],geo);light*=1-shadow*.970;}
   // Moon eclipses have no lunar shadow on Earth; faintly mark the lunar-visible hemisphere.
   if(!solar&&sunlit<0 &&a*moon[0]+b*moon[1]+c*moon[2]>0){light+=.15;} // mark approximate lunar visibility, not measured moonlight
   const lon=Math.atan2(b,a),lat=Math.asin(globeClamp(c,-1,1));
   let rr=26,gg=70,bb=106;
   if(tex){const ix=Math.min(tex.w-1,Math.max(0,Math.floor((lon/(2*Math.PI)+.5)*tex.w))),iy=Math.min(tex.h-1,Math.max(0,Math.floor((.5-lat/Math.PI)*tex.h)));const k=(iy*tex.w+ix)*4;rr=tex.rgba[k];gg=tex.rgba[k+1];bb=tex.rgba[k+2];}
   const rim=Math.pow(1-z,3.5);
   const blueGlow=.09*rim;
   const limb=.73+.27*z;
   let cr=rr*light*limb+13*blueGlow,cg=gg*light*limb+57*blueGlow,cb=bb*light*limb+140*blueGlow;
   // On close-up solar eclipses this yields a natural dark umbra, not a fake flat circle.
   data[off]=Math.min(255,cr);data[off+1]=Math.min(255,cg);data[off+2]=Math.min(255,cb);data[off+3]=255;
  }
 }
 gc.putImageData(im,0,0);
 ctx.save();ctx.shadowColor='rgba(67,168,232,.30)';ctx.shadowBlur=Math.max(12,r*.13);
 ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fillStyle='#14283d';ctx.fill();ctx.shadowBlur=0;
 ctx.drawImage(globeOffscreen,cx-r,cy-r,2*r,2*r);
 ctx.strokeStyle='rgba(138,207,243,.46)';ctx.lineWidth=1.35;ctx.beginPath();ctx.arc(cx,cy,r-.6,0,Math.PI*2);ctx.stroke();ctx.restore();
}
function globeDrawLine(ctx,points,color,width=1.2,dashed=false){
 ctx.beginPath();let last=null,penUp=true;
 for(const item of points){const q=globeProject(item.lat,item.lon);if(q&&q.front>.01){if(penUp||!last||Math.hypot(q.x-last.x,q.y-last.y)>globeGlobeRect.r*.18){ctx.moveTo(q.x,q.y);}else ctx.lineTo(q.x,q.y);penUp=false;last=q;}else{penUp=true;last=null;}}
 ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dashed?[3,6]:[]);ctx.stroke();ctx.setLineDash([]);
}
function globeDrawGrid(ctx){for(let la=-60;la<=60;la+=30){const pts=[];for(let lo=-180;lo<=180;lo+=3)pts.push({lat:la,lon:lo});globeDrawLine(ctx,pts,'rgba(180,223,239,.16)',.8,true);}
 for(let lo=-180;lo<180;lo+=30){const pts=[];for(let la=-90;la<=90;la+=3)pts.push({lat:la,lon:lo});globeDrawLine(ctx,pts,'rgba(180,223,239,.16)',.8,true);}}
function globeDrawMarker(ctx,lat,lon,label,color,secondary=false){const q=globeProject(lat,lon);if(!q)return;
 const radius=secondary?5:7;ctx.fillStyle='#071421';ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(q.x,q.y,radius,0,Math.PI*2);ctx.fill();ctx.stroke();
 ctx.beginPath();ctx.moveTo(q.x-radius-6,q.y);ctx.lineTo(q.x+radius+6,q.y);ctx.moveTo(q.x,q.y-radius-6);ctx.lineTo(q.x,q.y+radius+6);ctx.stroke();
 if(label){ctx.font='600 10px system-ui';const tx=q.x+15,ty=q.y-12;ctx.fillStyle='#071827e9';ctx.fillRect(tx-5,ty-13,ctx.measureText(label).width+13,19);ctx.fillStyle=color;ctx.fillText(label,tx,ty);}
}
function globeSublunar(jd,p){const a=axes('earth',jd,p),direction=unit(sub(p.moon,p.earth));return globeGeographic([dot(direction,a.x),dot(direction,a.y),dot(direction,a.z)]);}
function globeSubsolar(jd,p){const a=axes('earth',jd,p),direction=unit(sub(p.sun,p.earth));return globeGeographic([dot(direction,a.x),dot(direction,a.y),dot(direction,a.z)]);}
function globeTrack(){if(eclipseSelected.kind!=='solar')return [];
 let track=eclipseTrackCache.get(eclipseSelected.id);
 if(track)return track;
 const peak=julianDate(new Date(eclipseSelected.date));track=[];
 for(let m=-150;m<=150;m+=2){const j=peak+m/1440;const point=eclipseShadowAxis(j,positions(j));if(point)track.push(point);else track.push({lat:NaN,lon:NaN});}
 eclipseTrackCache.set(eclipseSelected.id,track);return track;
}
function globeFollowTarget(jd,p){if(globeCamera.mode==='observer')return globeObserver;
 if(globeCamera.mode==='sun')return globeSubsolar(jd,p);
 if(eclipseSelected.kind==='lunar')return globeSublunar(jd,p);
 return eclipseShadowAxis(jd,p)||globeSubsolar(jd,p);
}
function globeDraw(){const dlg=$('globeDialog');if(!dlg.open)return;
 const jd=state.jd,p=positions(jd);
 if(globeCamera.follow){const goal=globeFollowTarget(jd,p);if(goal){globeCamera.lat+=(goal.lat-globeCamera.lat)*.18;globeCamera.lon=globeWrapLon(globeCamera.lon+globeDeltaLon(goal.lon,globeCamera.lon)*.18);}}
 const {ctx,w,h,cx,cy,r}=globeFrame();globeBackdrop(ctx,w,h);
 const geo=globeFixedVectors(jd,p),solar=eclipseSelected.kind==='solar';
 globeDrawSphere(ctx,{cx,cy,r},geo,solar);
 if($('globeGrid').checked)globeDrawGrid(ctx);
 if($('globeTrack').checked&&solar){const track=globeTrack();globeDrawLine(ctx,track,'rgba(250,190,111,.95)',2.2);}
 if(solar){const shadow=eclipseShadowAxis(jd,p);if(shadow)globeDrawMarker(ctx,shadow.lat,shadow.lon,'OŚ CIENIA','#ffc477',true);}
 else {const submoon=globeSublunar(jd,p);globeDrawMarker(ctx,submoon.lat,submoon.lon,'KSIĘŻYC W ZENICIE','#99bfff',true);}
 globeDrawMarker(ctx,globeObserver.lat,globeObserver.lon,'OBSERWATOR','#69f2d9');
 $('globeModeLabel').textContent=solar?'ZAĆMIENIE SŁOŃCA • CIEŃ KSIĘŻYCA':'ZAĆMIENIE KSIĘŻYCA • ROZJAŚNIONA NOC';
 $('globeClock').textContent=eclipseStamp(jd);
 const peak=julianDate(new Date(eclipseSelected.date)),mins=(jd-peak)*1440;
 $('globeProgress').value=globeClamp(mins,-240,240);
 $('globeOffset').textContent=(mins>=0?'+':'−')+Math.abs(mins).toFixed(1)+' min od maksimum';
 $('globePlay').textContent=globePlaying?'Ⅱ Zatrzymaj':'▶ Odtwórz';
 const obs=sunMoonObserver(jd,globeObserver.lat,globeObserver.lon,p),horizonInfo=horizon('earth',jd,globeObserver.lat,globeObserver.lon);
 if(solar){$('globeValueLabel').textContent='ZAKRYCIE TARCZY SŁOŃCA';$('globeCoverage').textContent=(obs.coverage*100).toFixed(2)+'%';$('globeSubLabel').textContent='WYSOKOŚĆ SŁOŃCA';$('globeSunAlt').textContent=obs.altitude.toFixed(1)+'°';
 $('globeObservationNote').textContent=obs.altitude<=0?'W tym miejscu Słońce jest pod horyzontem. Zakrycie geometryczne nie oznacza widocznego zaćmienia.':obs.coverage>=.999?'Z tego punktu: całkowite lub obrączkowe zakrycie tarczy (zależnie od rozmiaru kątowego Księżyca).':obs.coverage>0?'W tym miejscu: zaćmienie częściowe.':'W tym miejscu tarcze Słońca i Księżyca się nie nakładają.';
 }else{$('globeValueLabel').textContent='TARCZA KSIĘŻYCA W CIENIU ZIEMI';$('globeCoverage').textContent=(lunarGeometry(jd,p).umbraFraction*100).toFixed(1)+'%';$('globeSubLabel').textContent='WYSOKOŚĆ KSIĘŻYCA';$('globeSunAlt').textContent=horizonInfo.moon.altitude.toFixed(1)+'°';
 $('globeObservationNote').textContent=horizonInfo.moon.altitude>0?'Księżyc jest nad horyzontem. Zaćmienie może być stąd widoczne przy sprzyjającej pogodzie.':'Księżyc znajduje się pod horyzontem. W tym momencie zaćmienia stąd nie zobaczysz.';}
}
function globeSyncObserver(){globeObserver.lat=globeClamp(Number($('globeLat').value)||0,-90,90);globeObserver.lon=globeWrapLon(Number($('globeLon').value)||0);
 $('globeLat').value=globeObserver.lat.toFixed(2);$('globeLon').value=globeObserver.lon.toFixed(2);
 $('eclipseLat').value=globeObserver.lat.toFixed(2);$('eclipseLon').value=globeObserver.lon.toFixed(2);
}
function globeSetObserver(lat,lon){globeObserver.lat=globeClamp(lat,-90,90);globeObserver.lon=globeWrapLon(lon);
 $('globeLat').value=globeObserver.lat.toFixed(2);$('globeLon').value=globeObserver.lon.toFixed(2);
 $('eclipseLat').value=globeObserver.lat.toFixed(2);$('eclipseLon').value=globeObserver.lon.toFixed(2);
}
function globePickEvent(id){const e=ECLIPSES.find(e=>e.id===id)||ECLIPSES[2];eclipseSelected=e;
 $('globeEvent').value=e.id;globeSetObserver(e.lat,e.lon);globePlaying=false;globeCamera.mode='shadow';globeCamera.follow=true;
 globeSyncCameras();eclipseSetDate(e.date);globeDraw();}
function globeSyncCameras(){for(const [id,mode] of [['globeFollow','shadow'],['globeSunward','sun'],['globeLocation','observer']]){$(id).classList.toggle('selected',globeCamera.follow&&globeCamera.mode===mode);}}
function globeOpen(fromLab=false){if($('globeDialog').open)return;
 globeFromLab=fromLab;globeGoSurface=false;globePriorPlay=fromLab?eclipsePriorPlay:state.playing;
 globePlaying=false;
 if(!fromLab){globeSetObserver(eclipseSelected.lat,eclipseSelected.lon);eclipseSetDate(eclipseSelected.date);}
 if(fromLab){globeSetObserver(clamp(Number($('eclipseLat').value)||0,-90,90),clamp(Number($('eclipseLon').value)||0,-180,180));
  eclipseIsPlaying=false;$('eclipseDialog').close();}
 state.playing=false;syncPlay();$('globeDialog').showModal();$('globeEvent').value=eclipseSelected.id;
 globeCamera.mode='shadow';globeCamera.follow=true;globeSyncCameras();globeDraw();}
function globeGoTelescope(){globeSyncObserver();globePlaying=false;globeGoSurface=true;$('globeDialog').close();
 select('earth');state.lat=globeObserver.lat;state.lon=globeObserver.lon;$('latitude').value=state.lat;$('longitude').value=state.lon;
 setMode('surface');lookAtSky(eclipseSelected.kind==='solar'?'sun':'moon');state.eclipseZoom=true;state.eclipseKind=eclipseSelected.kind;
 state.playing=false;syncPlay();showToast('Teleskop 2,4° · punkt obserwacji z globu Ziemi.');}
function setupGlobe(){
 const g=$('globeDialog'),canvas=$('globeCanvas');
 for(const e of ECLIPSES){const opt=document.createElement('option');opt.value=e.id;opt.textContent=(e.kind==='solar'?'☀ ':'☾ ')+e.name;$('globeEvent').appendChild(opt);}
 const map=new Image();map.onload=()=>{globeImageReady(map);if(g.open)globeDraw();};map.onerror=()=>{$('globeLoading').textContent='Mapa Ziemi niedostępna';};map.src=window.SOLAR_ASSETS?.['./assets/earth.jpg']||'./assets/earth.jpg';
 $('openGlobe').onclick=()=>globeOpen(false);
 $('globeClose').onclick=()=>g.close();
 g.addEventListener('click',e=>{if(e.target===g)g.close();});
 g.addEventListener('close',()=>{globePlaying=false;if(!globeGoSurface)state.playing=globePriorPlay;else state.playing=false;globeGoSurface=false;syncPlay();});
 $('globeEvent').onchange=e=>globePickEvent(e.target.value);
 $('globeProgress').oninput=e=>{globePlaying=false;state.jd=julianDate(new Date(eclipseSelected.date))+Number(e.target.value)/1440;globeDraw();};
 $('globeRewind').onclick=()=>{globePlaying=false;state.jd=julianDate(new Date(eclipseSelected.date))-(eclipseSelected.kind==='solar'?115:210)/1440;globeDraw();};
 $('globePlay').onclick=()=>{globePlaying=!globePlaying;state.playing=false;syncPlay();globeDraw();};
 $('globeSpeed').onchange=e=>globeSpeed=Number(e.target.value);
 for(const [id,mode] of [['globeFollow','shadow'],['globeSunward','sun'],['globeLocation','observer']]){$(id).onclick=()=>{globeCamera.follow=true;globeCamera.mode=mode;globeSyncCameras();globeDraw();};}
 $('globeReset').onclick=()=>{globeCamera={lat:21,lon:30,zoom:1,follow:true,mode:'shadow'};globeSyncCameras();globeDraw();};
 $('globeTrack').onchange=globeDraw;$('globeGrid').onchange=globeDraw;
 $('globeLat').onchange=()=>{globeSyncObserver();globeDraw();};$('globeLon').onchange=()=>{globeSyncObserver();globeDraw();};
 $('globeTelescope').onclick=globeGoTelescope;
 $('globeLaboratory').onclick=()=>{globePlaying=false;globeGoSurface=true;const selectedJD=state.jd;g.close();$('eclipseDialog').showModal();eclipsePriorPlay=false;eclipsePickEvent(eclipseSelected.id);state.jd=selectedJD;
   $('eclipseLat').value=globeObserver.lat.toFixed(2);$('eclipseLon').value=globeObserver.lon.toFixed(2);eclipseDraw();};
 canvas.addEventListener('pointerdown',e=>{if(e.button!==0&&e.pointerType==='mouse')return;canvas.setPointerCapture(e.pointerId);globePointer={x:e.clientX,y:e.clientY,lat:globeCamera.lat,lon:globeCamera.lon};globeDragging=false;});
 canvas.addEventListener('pointermove',e=>{if(!globePointer)return;const r=canvas.getBoundingClientRect(),dx=e.clientX-globePointer.x,dy=e.clientY-globePointer.y;
  if(Math.hypot(dx,dy)<4&&!globeDragging)return;globeDragging=true;globeCamera.follow=false;globeCamera.lat=globeClamp(globePointer.lat+dy*.23,-88,88);globeCamera.lon=globeWrapLon(globePointer.lon-dx*.28);globeSyncCameras();globeDraw();});
 canvas.addEventListener('pointerup',e=>{if(!globePointer)return;const rect=canvas.getBoundingClientRect();if(!globeDragging){const geo=globeUnproject(e.clientX-rect.left,e.clientY-rect.top);if(geo){globeSetObserver(geo.lat,geo.lon);globeDraw();}}globePointer=null;globeDragging=false;});
 canvas.addEventListener('pointercancel',()=>{globePointer=null;globeDragging=false;});
 canvas.addEventListener('wheel',e=>{e.preventDefault();globeCamera.zoom=globeClamp(globeCamera.zoom*(e.deltaY>0?.91:1.10),.60,1.36);globeDraw();},{passive:false});
 canvas.addEventListener('keydown',e=>{if(e.key==='ArrowLeft')globeCamera.lon-=5;else if(e.key==='ArrowRight')globeCamera.lon+=5;else if(e.key==='ArrowUp')globeCamera.lat=Math.min(87,globeCamera.lat+5);else if(e.key==='ArrowDown')globeCamera.lat=Math.max(-87,globeCamera.lat-5);else return;e.preventDefault();globeCamera.follow=false;globeSyncCameras();globeDraw();});
}

/** Geometry 7 code inserted below */
// geometry module
/**
 * ATLAS SOLARIS 7 — 3D shadow-cone projections.
 * Physical conic radii computed from finite solar disc; no artificial shadow shapes.
 * Visual compression only along cone axis in explanatory mode.
 */
let geometryPlaying=false,geometrySpeed=300,geometryLastDraw=0;
let geometryPriorPlay=false,geometryPrevJD=null,geometryFrom='main',geometryExitToOther=false;
let geometryCamera={az:-.26,el:.32,zoom:1,center:0,mode:'side',drag:null};
const geometryC=()=>document.getElementById('geometryCanvas');
const geoFmtKm=v=>`${Math.round(v).toLocaleString('pl-PL')} km`;
const geoP=(v,s)=>[v[0]*s,v[1]*s,v[2]*s];
const geoAdd=add,geoSub=sub;
const geoBound=(v,min,max)=>Math.max(min,Math.min(max,v));
function geoInfo(){
 const p=positions(state.jd),moonKm=mul(sub(p.moon,p.earth),AU_KM),sunKm=mul(sub(p.sun,p.earth),AU_KM);
 const solar=eclipseSelected.kind==='solar';
 let start,ray,sunD,intercept,shadowSourceRadius;
 if(solar){start=moonKm;ray=unit(sub(p.moon,p.sun));sunD=norm(sub(sunKm,moonKm));shadowSourceRadius=ECLIPSE_RMOON;intercept=dot(mul(moonKm,-1),ray);}
 else{start=[0,0,0];ray=unit(mul(sunKm,-1));sunD=norm(sunKm);shadowSourceRadius=ECLIPSE_REARTH;intercept=dot(moonKm,ray);}
 const delta=solar?mul(start,-1):moonKm;
 // The v17 engine provides the precise cone/sphere geometry independently
 // of the illustrated zoom or the axial distance compression.
 const result17=window.ATLAS_ECLIPSE17?.at(state.jd,{includeNode:false});
 const shadow17=result17?.shadow[solar?'solar':'lunar'];
 const miss=shadow17?.axisDistanceKm??norm(sub(delta,mul(ray,intercept)));
 const x=intercept;
 const blocker=solar?ECLIPSE_RMOON:ECLIPSE_REARTH*1.02;
 const umbra=shadow17?.umbraSignedRadiusAtTargetKm??(blocker-x*(ECLIPSE_RSUN-blocker)/sunD);
 const penumbra=shadow17?.penumbraRadiusAtTargetKm??(blocker+x*(ECLIPSE_RSUN+blocker)/sunD);
 const apex=shadow17?.coneApexDistanceKm??(blocker*sunD/(ECLIPSE_RSUN-blocker));
 return {p,solar,moonKm,sunKm,start,ray,sunD,intercept,miss,umbra,penumbra,blocker,apex,shadowSourceRadius};
}
function geoFrame(){let c=geometryC(),dpr=Math.min(2,window.devicePixelRatio||1),w=c.clientWidth||900,h=c.clientHeight||590;if(c.width!==Math.round(w*dpr)||c.height!==Math.round(h*dpr)){c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);}
 const ctx=c.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);return {ctx,w,h};}
function geoOrbitBasis(axis){let trial=[0,0,1];if(Math.abs(dot(axis,trial))>.94)trial=[0,1,0];let side=unit(cross(trial,axis)),vertical=unit(cross(axis,side));return {axis,side,vertical};}
function geoLocal(p,origin,basis,compress){let d=sub(p,origin);return [dot(d,basis.axis)*compress/ECLIPSE_REARTH,dot(d,basis.side)/ECLIPSE_REARTH,dot(d,basis.vertical)/ECLIPSE_REARTH];}
function geoCamProject(v,cfg){
 let delta=[v[0]-geometryCamera.center,v[1],v[2]],az=geometryCamera.az,el=geometryCamera.el;
 const right=[Math.cos(az),-Math.sin(az),0],up=[-Math.sin(az)*Math.sin(el),-Math.cos(az)*Math.sin(el),Math.cos(el)],look=[Math.sin(az)*Math.cos(el),Math.cos(az)*Math.cos(el),Math.sin(el)];
 const depth=dot(delta,look),k=geoBound(1+depth/42,.55,1.55);
 return {x:cfg.w*.50+dot(delta,right)*cfg.scale*k,y:cfg.h*.52-dot(delta,up)*cfg.scale*k,depth,k};
}
function geoDrawPath(ctx,pts,fill,stroke,width=1,dashed=false){if(!pts.length)return;ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i].x,pts[i].y);ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.setLineDash(dashed?[5,5]:[]);ctx.stroke();ctx.setLineDash([]);}}
function geoSphere(ctx,proj,r,label,fill1,fill2,ring){const rad=Math.max(.1,r*proj.k);ctx.save();let glow=ctx.createRadialGradient(proj.x-rad*.3,proj.y-rad*.38,rad*.13,proj.x,proj.y,rad*1.1);glow.addColorStop(0,fill1);glow.addColorStop(.72,fill2);glow.addColorStop(1,'#040b18');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(proj.x,proj.y,rad,0,2*Math.PI);ctx.fill();ctx.strokeStyle=ring;ctx.lineWidth=1;ctx.stroke();ctx.restore();if(rad>3){ctx.font='600 11px system-ui';ctx.fillStyle='#e2ecf7';ctx.textAlign='center';ctx.fillText(label,proj.x,proj.y+rad+18);}}
function geoDrawStars(ctx,w,h){ctx.fillStyle='#030a18';ctx.fillRect(0,0,w,h);const radial=ctx.createRadialGradient(w*.5,h*.55,8,w*.5,h*.55,Math.max(w,h)*.7);radial.addColorStop(0,'#18243d70');radial.addColorStop(1,'#05091200');ctx.fillStyle=radial;ctx.fillRect(0,0,w,h);
 for(let i=0;i<100;i++){const xx=((Math.sin((i+1)*12.9898)*43758.54)%1+1)%1*w,yy=((Math.sin((i+1)*48.233)*28714.26)%1+1)%1*h;ctx.fillStyle=`rgba(208,224,245,${.12+(i%4)*.06})`;ctx.beginPath();ctx.arc(xx,yy,i%31===0?1.1:.5,0,Math.PI*2);ctx.fill();}}
function geoDrawWireGrid(ctx,project){ctx.lineWidth=.8;ctx.strokeStyle='#45708c40';for(let u=-10;u<=10;u+=2){ctx.beginPath();for(let j=-10;j<=10;j++){let p=project([u,j,-1.65]);if(j===-10)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);}ctx.stroke();ctx.beginPath();for(let j=-10;j<=10;j++){let p=project([j,u,-1.65]);if(j===-10)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);}ctx.stroke();}}
function geoDrawConic(ctx,project,first,last,radFn,fillColor,strokeColor){
 let count=28,ringPts=[];
 for(let j=0;j<=count;j++){
  let t=j/count,ang=t*2*Math.PI;
  ringPts.push({angle:ang,front:[],back:[]});
  for(let d of [first,last]){let r=Math.max(0,radFn(d)),p=project([d*Math.cos(0),r*Math.cos(ang),r*Math.sin(ang)]);(d===first?ringPts[j].front:ringPts[j].back).push(p);}
 }
 // Projected upper/lower silhouette, together with six longitudinal generators.
 const a=[],b=[];
 for(let i=0;i<=36;i++){const d=first+(last-first)*i/36;let r=Math.max(0,radFn(d));a.push(project([d,-r,0]));b.push(project([d,r,0]));}
 geoDrawPath(ctx,a.concat(b.reverse()),fillColor,strokeColor,.7);
 for(let theta=0;theta<6;theta++){let ang=theta/6*2*Math.PI;ctx.beginPath();for(let i=0;i<=32;i++){let d=first+(last-first)*i/32,rr=Math.max(0,radFn(d));const p=project([d,rr*Math.cos(ang),rr*Math.sin(ang)]);if(i===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);}ctx.strokeStyle=strokeColor;ctx.lineWidth=theta%3===0?1.15:.55;ctx.stroke();}
 for(let d of [first,last]){let rr=Math.max(0,radFn(d));if(rr<=0)continue;ctx.beginPath();for(let i=0;i<=48;i++){let a=i*2*Math.PI/48,p=project([d,rr*Math.cos(a),rr*Math.sin(a)]);if(i===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);}ctx.strokeStyle=strokeColor;ctx.lineWidth=1;ctx.stroke();}
}
let geometryEarthTex=null;
function geometryPreloadEarth(){
 const img=new Image();img.onload=()=>{try{const t=document.createElement('canvas');t.width=1536;t.height=768;const c=t.getContext('2d',{willReadFrequently:true});c.drawImage(img,0,0,t.width,t.height);geometryEarthTex={w:t.width,h:t.height,d:c.getImageData(0,0,t.width,t.height).data};geometryDraw();}catch(e){console.warn('Ziemia: tekstura niedostępna',e);}};
 img.src=window.SOLAR_ASSETS?.['./assets/earth.jpg']||'./assets/earth.jpg';
}
function geoEarthSphere(ctx,p,r,basis,info){
 const rad=r*p.k;if(rad<3){geoSphere(ctx,p,r,'ZIEMIA','#2d9dd9','#123250','#84b9ef');return;}
 if(!geometryEarthTex){geoSphere(ctx,p,r,'ZIEMIA','#2d9dd9','#123250','#84b9ef');return;}
 const res=Math.max(30,Math.min(240,Math.round(rad*1.75))),tex=geometryEarthTex;
 const off=document.createElement('canvas');off.width=res;off.height=res;
 const g=off.getContext('2d'),img=g.createImageData(res,res),data=img.data;
 const az=geometryCamera.az,el=geometryCamera.el;
 const right=[Math.cos(az),-Math.sin(az),0],up=[-Math.sin(az)*Math.sin(el),-Math.cos(az)*Math.sin(el),Math.cos(el)],toward=[Math.sin(az)*Math.cos(el),Math.cos(az)*Math.cos(el),Math.sin(el)];
 const fixed=axes('earth',state.jd,info.p),light=unit(sub(info.p.sun,info.p.earth)), geo=globeFixedVectors(state.jd,info.p);
 const R=res*.5;
 for(let j=0;j<res;j++){let yy=(R-j-.5)/R;for(let i=0;i<res;i++){
  let xx=(i+.5-R)/R,rr=xx*xx+yy*yy,k=(j*res+i)*4;if(rr>=1){data[k+3]=0;continue;}
  let zz=Math.sqrt(1-rr),local=[0,1,2].map(t=>right[t]*xx+up[t]*yy+toward[t]*zz);
  let n=[0,1,2].map(t=>basis.axis[t]*local[0]+basis.side[t]*local[1]+basis.vertical[t]*local[2]);
  let lat=Math.asin(geoBound(dot(n,fixed.z),-1,1)),lon=Math.atan2(dot(n,fixed.y),dot(n,fixed.x));
  let ix=Math.max(0,Math.min(tex.w-1,Math.floor((lon/(2*Math.PI)+.5)*tex.w)));
  let iy=Math.max(0,Math.min(tex.h-1,Math.floor((.5-lat/Math.PI)*tex.h))),tidx=(iy*tex.w+ix)*4;
  let sunlight=dot(n,light),strength=.065+1.09*Math.pow(Math.max(0,sunlight),.7),rim=Math.pow(1-zz,3.4);
  if(info.solar&&sunlight>0){let bound=[dot(n,fixed.x),dot(n,fixed.y),dot(n,fixed.z)],shadow=globeShadowAt(bound,geo);strength*=1-shadow*.95;}
  data[k]=Math.min(255,tex.d[tidx]*strength+10*rim);data[k+1]=Math.min(255,tex.d[tidx+1]*strength+44*rim);data[k+2]=Math.min(255,tex.d[tidx+2]*strength+100*rim);data[k+3]=255;
 }}
 g.putImageData(img,0,0);ctx.drawImage(off,p.x-rad,p.y-rad,rad*2,rad*2);
 ctx.beginPath();ctx.arc(p.x,p.y,rad,0,2*Math.PI);ctx.strokeStyle='#91b9de75';ctx.lineWidth=1;ctx.stroke();
 ctx.font='600 11px system-ui';ctx.fillStyle='#e2ecf7';ctx.textAlign='center';ctx.fillText('ZIEMIA',p.x,p.y+rad+18);
}
function geoDrawCone(ctx,cfg,g,compress,focusX,scale){
 let basis=geoOrbitBasis(g.ray),solar=g.solar,origin=solar?g.moonKm:[0,0,0];
 const pos=(p)=>geoLocal(p,origin,basis,compress), localMoon=pos(g.moonKm),localEarth=pos([0,0,0]);
 const project=(p)=>geoCamProject(p,{...cfg,scale});
 if($('geometryGrid').checked)geoDrawWireGrid(ctx,project);
 const start=0,xMax=Math.max(400000,g.intercept+100000),end=xMax/ECLIPSE_REARTH*compress;
 const radiusPen=d=>Math.max(0,(g.blocker+(ECLIPSE_RSUN+g.blocker)*(d*ECLIPSE_REARTH/compress)/g.sunD)/ECLIPSE_REARTH);
 const radiusUmb=d=>Math.max(0,(g.blocker-(ECLIPSE_RSUN-g.blocker)*(d*ECLIPSE_REARTH/compress)/g.sunD)/ECLIPSE_REARTH);
 const crossAt=Math.max(0,g.intercept)/ECLIPSE_REARTH*compress;
 if($('geometryPen').checked)geoDrawConic(ctx,project,start,end,radiusPen,'#95d5ff24','#8ed4ef98');
 const endUmb=Math.min(end,g.apex/ECLIPSE_REARTH*compress);
 if($('geometryUmbra').checked &&endUmb>0)geoDrawConic(ctx,project,start,endUmb,radiusUmb,'#1b2f5052','#628cacda');
 if($('geometryUmbra').checked &&end>endUmb){const radiusAnti=d=>Math.max(0,((ECLIPSE_RSUN-g.blocker)*(d*ECLIPSE_REARTH/compress)/g.sunD-g.blocker)/ECLIPSE_REARTH);geoDrawConic(ctx,project,endUmb,end,radiusAnti,'#e5a45d28','#e7bd7fa6');}
 // Shadow axis, emitted opposite the incident sunlight.
 ctx.beginPath();let pa=project([start,0,0]),pb=project([end,0,0]);ctx.moveTo(pa.x,pa.y);ctx.lineTo(pb.x,pb.y);ctx.setLineDash([9,6]);ctx.lineWidth=1.5;ctx.strokeStyle='#85efe2';ctx.stroke();ctx.setLineDash([]);
 // Beam direction, from Sun to blocker, is shown with a directional guide.
 let beamStart=project([-3.4,0,0]),beamEnd=project([-1.0,0,0]);ctx.beginPath();ctx.moveTo(beamStart.x,beamStart.y);ctx.lineTo(beamEnd.x,beamEnd.y);ctx.strokeStyle='#ffd490aa';ctx.lineWidth=2;ctx.stroke();
 const eproj=project(localEarth),mproj=project(localMoon); const near=[{id:'earth',point:eproj,r:Math.max(2,scale*eproj.k),z:eproj.depth},{id:'moon',point:mproj,r:Math.max(2,scale*.2727*mproj.k),z:mproj.depth}];near.sort((a,b)=>a.z-b.z);
 for(const b of near){if(b.id==='earth')geoEarthSphere(ctx,b.point,Math.max(2,scale),basis,g);else {const f=!g.solar?lunarGeometry(state.jd,g.p).umbraFraction:0;geoSphere(ctx,b.point,Math.max(2,scale*.2727),'KSIĘŻYC',f>.6?'#bb5f42':'#d0d1ce',f>.6?'#48251e':'#52575f',f>.6?'#d28b78':'#a5b2bd');}}
 const sunLabel=project([-2.3,0,0]);ctx.textAlign='center';ctx.font='700 10px system-ui';ctx.fillStyle='#f6d19e';ctx.fillText('☀ PROMIENIE SŁOŃCA',geoBound(sunLabel.x,90,cfg.w-95),sunLabel.y-21);
 if(g.solar){const hit=eclipseShadowAxis(state.jd,g.p);if(hit){const a=axes('earth',state.jd,g.p);const dir=unit(add(add(mul(a.x,Math.cos(hit.lat*DEG)*Math.cos(hit.lon*DEG)),mul(a.y,Math.cos(hit.lat*DEG)*Math.sin(hit.lon*DEG))),mul(a.z,Math.sin(hit.lat*DEG))));const target=geoLocal(mul(dir,ECLIPSE_REARTH),origin,basis,compress);const pt=project(target);ctx.beginPath();ctx.arc(pt.x,pt.y,4,0,Math.PI*2);ctx.fillStyle='#ffcd8c';ctx.fill();ctx.strokeStyle='#ffca7c';ctx.beginPath();ctx.arc(pt.x,pt.y,8,0,Math.PI*2);ctx.stroke();}}
 ctx.textAlign='left';ctx.fillStyle='#98afc5';ctx.font='10px system-ui';ctx.fillText(compress===1?'SKALA ODLEGŁOŚCI I ŚREDNIC 1:1':'OŚ ODLEGŁOŚCI SKRÓCONA 6,25×',12,cfg.h-82);
 return {localEarth,localMoon,basis,project};
}
function geometryDraw(){const dlg=$('geometryDialog');if(!dlg?.open)return;const {ctx,w,h}=geoFrame();geoDrawStars(ctx,w,h);const info=geoInfo();
 const actual=$('geometryActual').checked,compress=actual?1:.16,sceneScale=Math.min(w/14,h/6.2)*(actual?.16:1)*geometryCamera.zoom;
 const focus=geometryCamera.mode==='earth'?0:info.intercept*compress/(ECLIPSE_REARTH*2);
 geometryCamera.center=focus;
 geoDrawCone(ctx,{w,h},info,compress,focus,sceneScale);
 $('geometryTime').textContent=eclipseStamp(state.jd);
 $('geometryKindLabel').textContent=info.solar?'ZAĆMIENIE SŁOŃCA · KSIĘŻYC RZUCA CIEŃ':'ZAĆMIENIE KSIĘŻYCA · ZIEMIA RZUCA CIEŃ';
 $('geometryDist').textContent=geoFmtKm(norm(info.moonKm));
 $('geometrySunDist').textContent=(norm(info.sunKm)/AU_KM).toFixed(6).replace('.',',')+' AU';
 $('geometryUmbraLabel').textContent=info.solar?'PROMIEŃ CIENIA NA OSI ZIEMI':'PROMIEŃ CIENIA NA OSI KSIĘŻYCA';
 $('geometryUmbraR').textContent=info.umbra>=0?geoFmtKm(info.umbra):`antumbra ${geoFmtKm(-info.umbra)}`;
 $('geometryCoverageLabel').textContent=info.solar?'ODCHYLENIE OSI OD ŚRODKA ZIEMI':'ODCHYLENIE KSIĘŻYCA OD OSI';
 $('geometryAxisMiss').textContent=geoFmtKm(info.miss);
 if(info.solar){const hit=eclipseShadowAxis(state.jd,info.p);$('geometryNote').textContent=hit?`Oś cienia przecina powierzchnię Ziemi: ${hit.lat.toFixed(2)}° szer., ${hit.lon.toFixed(2)}° dł. (model geometryczny).`:'Oś cienia omija Ziemię w tej chwili. Nawet wtedy może istnieć zaćmienie częściowe z niektórych miejsc.';
 }else{const lunar=lunarGeometry(state.jd,info.p);$('geometryNote').textContent=`Księżyc w cieniu głównym: ${(lunar.umbraFraction*100).toFixed(1)}% tarczy. Półcień: ${(lunar.penumbraFraction*100).toFixed(1)}% tarczy (przybliżenie).`;}
 const base=julianDate(new Date(eclipseSelected.date)),mins=(state.jd-base)*1440;if(document.activeElement!==$('geometryProgress'))$('geometryProgress').value=geoBound(mins,-180,180);$('geometryOffset').textContent=(mins>=0?'+':'')+mins.toFixed(1)+' min';
}
function geometrySyncView(){for(const [id,mode] of [['geometrySide','side'],['geometryAxis','axis'],['geometryEarth','earth']])$(id).classList.toggle('active',geometryCamera.mode===mode);}
function geometrySetView(mode){geometryCamera.mode=mode;geometryCamera.zoom=1;geometryCamera.az=mode==='axis'?1.48:mode==='earth'?.16:-.26;geometryCamera.el=mode==='axis'?.12:.32;geometrySyncView();geometryDraw();}
function geometryOpen(from='main'){
 const dlg=$('geometryDialog');if(dlg.open)return;
 geometryFrom=from;geometryExitToOther=false;geometryPriorPlay=state.playing;geometryPrevJD=state.jd;state.playing=false;syncPlay();
 if(from==='lab'&&$('eclipseDialog').open){eclipseIsPlaying=false;$('eclipseDialog').close();}
 if(from==='globe'&&$('globeDialog').open){globePlaying=false;$('globeDialog').close();}
 $('geometryEvent').value=eclipseSelected.id;$('geometrySpeed').value=String(geometrySpeed);$('geometryProgress').value=0;
 geometryPlaying=false;$('geometryPlay').textContent='▶ Odtwórz';if(from==='main')eclipseSetDate(eclipseSelected.date);dlg.showModal();geometrySetView('side');geometryDraw();
}
function geometryExit(destination){geometryPlaying=false;geometryExitToOther=!!destination;$('geometryDialog').close();
 const chosenJD=state.jd;
 if(destination==='globe'){globeOpen(false);state.jd=chosenJD;globeDraw();}if(destination==='lab'){$('eclipseDialog').showModal();eclipsePriorPlay=false;eclipsePickEvent(eclipseSelected.id);state.jd=chosenJD;eclipseDraw();}
}
function setupGeometry(){
 const dlg=$('geometryDialog'),c=geometryC();geometryPreloadEarth();for(const ev of ECLIPSES){let opt=document.createElement('option');opt.value=ev.id;opt.textContent=(ev.kind==='solar'?'☀ ':'☾ ')+ev.name;$('geometryEvent').appendChild(opt);}
 $('openGeometry').onclick=()=>geometryOpen('main');$('globeGeometry').onclick=()=>geometryOpen('globe');
 $('geometryClose').onclick=()=>geometryExit(null);
 dlg.addEventListener('close',()=>{geometryPlaying=false;if(!geometryExitToOther){state.playing=geometryPriorPlay;syncPlay();}geometryExitToOther=false;});
 $('geometryEvent').onchange=()=>{eclipseSelected=ECLIPSES.find(ev=>ev.id===$('geometryEvent').value)||ECLIPSES[2];eclipseSetDate(eclipseSelected.date);geometryPlaying=false;$('geometryPlay').textContent='▶ Odtwórz';geometryDraw();};
 $('geometryProgress').oninput=()=>{let jd=julianDate(new Date(eclipseSelected.date));state.jd=jd+Number($('geometryProgress').value)/1440;geometryDraw();};
 $('geometryStart').onclick=()=>{geometryPlaying=false;$('geometryPlay').textContent='▶ Odtwórz';state.jd=julianDate(new Date(eclipseSelected.date))-180/1440;geometryDraw();};
 $('geometryPlay').onclick=()=>{geometryPlaying=!geometryPlaying;$('geometryPlay').textContent=geometryPlaying?'Ⅱ Pauza':'▶ Odtwórz';};
 $('geometrySpeed').onchange=()=>{geometrySpeed=Number($('geometrySpeed').value)||300;};
 for(const id of ['geometryActual','geometryPen','geometryUmbra','geometryGrid'])$(id).onchange=geometryDraw;
 $('geometrySide').onclick=()=>geometrySetView('side');$('geometryAxis').onclick=()=>geometrySetView('axis');$('geometryEarth').onclick=()=>geometrySetView('earth');$('geometryReset').onclick=()=>{geometryCamera.zoom=1;geometrySetView('side');};
 $('geometryToGlobe').onclick=()=>geometryExit('globe');$('geometryToLab').onclick=()=>geometryExit('lab');
 let pt=null,moved=false;
 c.addEventListener('pointerdown',e=>{if(e.button!==0&&e.pointerType==='mouse')return;c.setPointerCapture(e.pointerId);pt={x:e.clientX,y:e.clientY,az:geometryCamera.az,el:geometryCamera.el};moved=false;});
 c.addEventListener('pointermove',e=>{if(!pt)return;let dx=e.clientX-pt.x,dy=e.clientY-pt.y;if(Math.hypot(dx,dy)>3)moved=true;geometryCamera.az=pt.az+dx*.0065;geometryCamera.el=geoBound(pt.el-dy*.0055,-1.38,1.38);geometryDraw();});
 c.addEventListener('pointerup',()=>{pt=null;});c.addEventListener('pointercancel',()=>{pt=null;});
 c.addEventListener('dblclick',()=>geometrySetView('side'));
 c.addEventListener('wheel',e=>{e.preventDefault();geometryCamera.zoom=geoBound(geometryCamera.zoom*(e.deltaY>0?.91:1.11),.4,4.5);geometryDraw();},{passive:false});
 c.addEventListener('keydown',e=>{if(e.key==='ArrowLeft')geometryCamera.az-=.12;else if(e.key==='ArrowRight')geometryCamera.az+=.12;else if(e.key==='ArrowUp')geometryCamera.el=geoBound(geometryCamera.el+.12,-1.38,1.38);else if(e.key==='ArrowDown')geometryCamera.el=geoBound(geometryCamera.el-.12,-1.38,1.38);else return;e.preventDefault();geometryDraw();});
}


window.ATLAS_MAIN_API={
 getJD:()=>state.jd,
 getPlaying:()=>state.playing,
 setPlaying:(yes)=>{state.playing=!!yes;syncPlay();},
 setJD:(jd)=>{state.jd=jd;state.anchorJD=jd;dateClamp();},
 positions:(jd)=>positions(jd),
 selectJupiter:()=>select('jupiter'),
 /** Register a computed eclipse and open an existing visualization scene. */
 openCalendarEclipse:(candidate,view='geometry')=>{
  if(!candidate||!['solar','lunar'].includes(candidate.type)||!['geometry','globe','lab'].includes(view))
   throw new Error('Nieprawidłowe zaćmienie lub widok.');
  const when=new Date(candidate.approximatePeakUTC);
  if(!Number.isFinite(when.getTime())||when.getUTCFullYear()<2024||when.getUTCFullYear()>2040)
   throw new Error('Nieprawidłowa data wyszukanego zaćmienia.');
  const labels={partial:'częściowe',total:'całkowite',annular:'obrączkowe',
   hybrid:'hybrydowe',penumbral:'półcieniowe'};
  const plDate=new Intl.DateTimeFormat('pl-PL',{timeZone:'UTC',day:'numeric',month:'long',year:'numeric'}).format(when);
  const description=labels[candidate.subtype]||'geometryczne';
  const id='calc-'+candidate.type+'-'+when.toISOString().slice(0,10);
  const event={id,kind:candidate.type,type:description.toUpperCase(),
   date:when.toISOString(),name:plDate+' · '+description+' (model)',
   lat:54.35,lon:18.65,place:'Punkt testowy: Polska (nie oznacza widoczności)',
   source:'ATLAS SOLARIS 17.1 · wynik obliczeń',computed:true};
  const index=ECLIPSES.findIndex(item=>item.id===id);
  if(index>=0)ECLIPSES[index]=event;else ECLIPSES.push(event);
  for(const selectId of ['eclipseEvent','geometryEvent','globeEvent']){
   const select=$(`${selectId}`);
   if(!select)continue;
   let option=Array.from(select.options).find(o=>o.value===id);
   if(!option){option=document.createElement('option');option.value=id;select.appendChild(option);}
   option.textContent=(candidate.type==='solar'?'☀ ':'☾ ')+event.name;
  }
  eclipseSelected=event;
  if(view==='geometry')geometryOpen('main');
  else if(view==='globe')globeOpen(false);
  else $('openEclipses').click();
  return event;
 }
};
boot();

