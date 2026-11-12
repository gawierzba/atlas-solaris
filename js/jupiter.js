/* ATLAS SOLARIS 8.0 — Światy Jowisza
   JPL mean orbital parameters + Meeus chapter 44 for apparent moon positions.
   Built-in Canvas2D 3D-projection viewer, no online dependencies. */
(()=>{
'use strict';
const $=id=>document.getElementById(id), PI=Math.PI, TAU=PI*2, RAD=180/PI, DEG=PI/180, DAY=86400000, J2000=2451545, AU=149597870.7;
const RJ=71492, SUN_RADIUS=695700, SUN_JUP_DIST=778500000;
const moonDefs=[
 {id:'io',name:'Io',a:421800,e:.004,i:0,node:0,peri:49.1,M:330.9,period:1.762732,apsis:1.333,nodePeriod:0,r:1821.6,color:'#e6c474',tag:'WULKANICZNY'},
 {id:'europa',name:'Europa',a:671100,e:.009,i:.5,node:184.0,peri:45.0,M:345.4,period:3.525463,apsis:1.394,nodePeriod:30.202,r:1560.8,color:'#d9d3b6',tag:'LODOWY'},
 {id:'ganymede',name:'Ganimedes',a:1070400,e:.001,i:.2,node:58.5,peri:198.3,M:324.8,period:7.155588,apsis:68.301,nodePeriod:137.812,r:2634.1,color:'#b09a7c',tag:'NAJWIĘKSZY'},
 {id:'callisto',name:'Kallisto',a:1882700,e:.007,i:.3,node:309.1,peri:43.8,M:87.4,period:16.690440,apsis:277.921,nodePeriod:577.264,r:2410.3,color:'#8d8171',tag:'KRATEROWY'}
];
const v=(x,y,z)=>[x,y,z],plus=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],minus=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],mul=(a,k)=>[a[0]*k,a[1]*k,a[2]*k],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],len=a=>Math.hypot(...a),unit=a=>mul(a,1/Math.max(1e-10,len(a))),clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const jupPole=unit([Math.cos(64.4953*DEG)*Math.cos(268.0566*DEG),Math.cos(64.4953*DEG)*Math.sin(268.0566*DEG),Math.sin(64.4953*DEG)]);
const xBase=unit(cross([0,0,1],jupPole)),yBase=unit(cross(jupPole,xBase));
const eclToEq=a=>[a[0],Math.cos(23.43928*DEG)*a[1]-Math.sin(23.43928*DEG)*a[2],Math.sin(23.43928*DEG)*a[1]+Math.cos(23.43928*DEG)*a[2]];
const dateToJD=d=>d.getTime()/DAY+2440587.5, jdToDate=jd=>new Date(Math.round((jd-2440587.5)*DAY/1000)*1000), stamp=jd=>jdToDate(jd).toISOString().slice(0,16).replace('T',' · ')+' UTC';
function basisFrame(dir){
  const view=unit(dir),test=Math.abs(dot(view,jupPole))>.97?yBase:jupPole;
  const right=unit(cross(test,view)),up=unit(cross(view,right));
  return {view,right,up};
}
function moonPos(m,jd){
 const t=jd-J2000, phase=((m.M*DEG+TAU*t/m.period)%(TAU)+TAU)%(TAU);
 let E=phase; for(let k=0;k<8;k++) E-=(E-m.e*Math.sin(E)-phase)/(1-m.e*Math.cos(E));
 const arg=(m.peri+(m.apsis?360*t/(m.apsis*365.25):0))*DEG;
 const node=(m.node+(m.nodePeriod?360*t/(m.nodePeriod*365.25):0))*DEG, inc=m.i*DEG;
 const xp=m.a*(Math.cos(E)-m.e),yp=m.a*Math.sqrt(1-m.e*m.e)*Math.sin(E);
 const cN=Math.cos(node),sN=Math.sin(node),cW=Math.cos(arg),sW=Math.sin(arg),ci=Math.cos(inc),si=Math.sin(inc);
 const x=(cN*cW-sN*sW*ci)*xp+(-cN*sW-sN*cW*ci)*yp;
 const y=(sN*cW+cN*sW*ci)*xp+(-sN*sW+cN*cW*ci)*yp;
 const z=sW*si*xp+cW*si*yp;
 return plus(plus(mul(xBase,x),mul(yBase,y)),mul(jupPole,z));
}

/* Meeus, Astronomical Algorithms ch. 44 (low-accuracy Galilean satellites).
   Corrections to the four mean longitudes account for resonant perturbations.
   Produces apparent Jovian projected positions including approximate light time.
   Does NOT reproduce a high-precision JPL SPK solution. */
function galileanMeeus(jd,observerView){
 const t=jd-J2000,si=Math.sin,co=Math.cos;
 const V=(172.74+.00111588*t)*DEG,M=(357.529+.9856003*t)*DEG;
 const N=(20.02+.0830853*t+.329*si(V))*DEG;
 const J=(66.115+.9025179*t-.329*si(V))*DEG;
 const A=(1.915*si(M)+.02*si(2*M))*DEG;
 const B=(5.555*si(N)+.168*si(2*N))*DEG;
 const K=J+A-B;
 const R=1.00014-.01671*co(M)-.00014*co(2*M);
 const r=5.20872-.25208*co(N)-.00611*co(2*N);
 const delta=Math.sqrt(r*r+R*R-2*r*R*co(K));
 const psi=Math.asin(clamp(R*si(K)/delta,-1,1));
 const L=(34.35+.083091*t+.329*si(V))*DEG+B;
 const DS=3.12*DEG*si(L+42.8*DEG);
 const DE=DS-2.22*DEG*si(psi)*co(L+22*DEG)-1.3*DEG*(r-delta)/delta*si(L-100.5*DEG);
 const delayed=t-delta/173;
 const u=[(163.8069+203.4058646*delayed)*DEG+psi-B,
 (358.414+101.2916335*delayed)*DEG+psi-B,
 (5.7176+50.234518*delayed)*DEG+psi-B,
 (224.8092+21.48798*delayed)*DEG+psi-B];
 const G=(331.18+50.310482*delayed)*DEG,H=(87.45+21.569231*delayed)*DEG;
 const correction=[.473*DEG*si(2*(u[0]-u[1])),1.065*DEG*si(2*(u[1]-u[2])),.165*DEG*si(G),.843*DEG*si(H)];
 const radii=[5.9057-.0244*co(2*(u[0]-u[1])),9.3966-.0882*co(2*(u[1]-u[2])),14.9883-.0216*co(G),26.3627-.1939*co(H)];
 const b=basisFrame(observerView);
 return u.map((ui,j)=>{
  const theta=ui+correction[j];
  // Reconstruct jovicentric positions from line-of-sight x,y and depth.
  const x=radii[j]*RJ*si(theta), y=-radii[j]*RJ*co(theta)*si(DE);
  const z=radii[j]*RJ*co(theta)*co(DE);
  return plus(plus(mul(b.right,x),mul(b.up,y)),mul(b.view,z));
 });
}

function positionFrame(jd){
 const api=window.ATLAS_MAIN_API,p=api?.positions(jd),j=p?.jupiter||[5.2,0,0],sun=unit(eclToEq(mul(j,-1))),earth=unit(eclToEq(minus(p?.earth||[1,0,0],j)));
 const distKm=len(j)*AU; const meeus=galileanMeeus(jd,earth);
 return {sun,earth,sunKm:distKm,moons:moonDefs.map((m,i)=>({...m,pos:meeus[i]}))};
}
function isEclipsed(moon,info){
 const a=-dot(moon.pos,info.sun); if(a<=0)return false;
 const perp=len(plus(moon.pos,mul(info.sun,a)));const umbra=RJ-a*(SUN_RADIUS-RJ)/info.sunKm;
 return perp<umbra+moon.r;
}
function shadowHit(m,info){
 const D=mul(info.sun,-1),P=m.pos,b=dot(P,D),c=dot(P,P)-RJ*RJ;
 let disc=b*b-c;if(disc<0)return null;
 const t=-b-Math.sqrt(disc);if(t<0)return null;
 const point=plus(P,mul(D,t));
 if(dot(unit(point),info.sun)<0)return null;
 const rU=m.r-t*(SUN_RADIUS-m.r)/info.sunKm;
 const rP=m.r+t*(SUN_RADIUS+m.r)/info.sunKm;
 return {point,rU:Math.max(0,rU),rP};
}
function sphereRotation(jd){let w=((284.95+870.536*(jd-J2000))%360)*DEG;return {x:plus(mul(xBase,Math.cos(w)),mul(yBase,Math.sin(w))),y:plus(mul(yBase,Math.cos(w)),mul(xBase,-Math.sin(w)))};}
const canvas=$('jovCanvas');if(!canvas)return;const ctx=canvas.getContext('2d',{alpha:false});
const world={jd:dateToJD(new Date()),anchorJD:dateToJD(new Date()),speed:600,playing:false,source:'main',cam:'earth',zoom:6.5,freeAz:0,freeEl:.28,orbit:true,labels:true,shadows:true,overlay:true,selected:'europa',last:0,restoreMain:null};
let tex={},planetFrame=null,planetLast=-Infinity,w=0,h=0,dpr=1,drag=null,stars=[];
const assets={jupiter:'assets/jupiter/jupiter.jpg',io:'assets/jupiter/io.jpg',europa:'assets/jupiter/europa.jpg',ganymede:'assets/jupiter/ganymede.jpg',callisto:'assets/jupiter/callisto.jpg'};
function imagesReady(){return Object.keys(tex).length===5&&tex.jupiter?.width;}
function loadMaps(){for(const [id,url] of Object.entries(assets)){
 const image=new Image();image.onload=()=>{const t=document.createElement('canvas');t.width=image.naturalWidth;t.height=image.naturalHeight;const cc=t.getContext('2d',{willReadFrequently:true});cc.drawImage(image,0,0);tex[id]={width:t.width,height:t.height,rgba:cc.getImageData(0,0,t.width,t.height).data};};
 image.onerror=()=>{$('jovStatus').textContent='Brak mapy: '+id;};image.src=(window.SOLAR_JUP_ASSETS&&window.SOLAR_JUP_ASSETS[url])||url;}}
function resize(){const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;dpr=Math.min(2,window.devicePixelRatio||1);let ww=Math.round(r.width*dpr),hh=Math.round(r.height*dpr);if(canvas.width!==ww||canvas.height!==hh){canvas.width=ww;canvas.height=hh;w=r.width;h=r.height;ctx.setTransform(dpr,0,0,dpr,0,0);planetLast=-Infinity;}}
function initStars(){let seed=1729;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};for(let i=0;i<420;i++)stars.push({x:random(),y:random(),s:random()*1.7+.35,a:random()*.45+.2});}
function skyBackground(cx=0,cy=0){let grd=ctx.createRadialGradient(w*.45,h*.47,20,w*.48,h*.5,Math.max(w,h)*.8);grd.addColorStop(0,'#09182b');grd.addColorStop(.55,'#07111e');grd.addColorStop(1,'#02070f');ctx.fillStyle=grd;ctx.fillRect(0,0,w,h);
 for(const s of stars){let x=s.x*w+(cx*.015),y=s.y*h+(cy*.02);ctx.globalAlpha=s.a;ctx.fillStyle='#dde7fa';ctx.beginPath();ctx.arc((x+w)%w,(y+h)%h,s.s,0,TAU);ctx.fill();}ctx.globalAlpha=1;
 let halo=ctx.createRadialGradient(w*.5,h*.49,0,w*.5,h*.49,Math.min(w,h)*.7);halo.addColorStop(0,'rgba(105,151,183,.035)');halo.addColorStop(1,'transparent');ctx.fillStyle=halo;ctx.fillRect(0,0,w,h);
}
function cameraDirection(info){
 if(world.cam==='sun')return info.sun;
 if(world.cam==='pole')return plus(jupPole,mul(info.earth,.22));
 if(world.cam==='free')return unit(plus(plus(mul(xBase,Math.cos(world.freeAz)*Math.cos(world.freeEl)),mul(yBase,Math.sin(world.freeAz)*Math.cos(world.freeEl))),mul(jupPole,Math.sin(world.freeEl))));
 return info.earth;
}
function projection(frame,info){const basis=basisFrame(cameraDirection(info)),radius=clamp(Math.min(w*.40,h*.43)*world.zoom/12,8,Math.min(w,h)*.40),pxPerKm=radius/RJ;
 const origin={x:w*.50,y:h*.495};const project=(p)=>({x:origin.x+dot(p,basis.right)*pxPerKm,y:origin.y-dot(p,basis.up)*pxPerKm,z:dot(p,basis.view)});
 return {basis,radius,pxPerKm,origin,project};}
function drawOrbits(proj,info){if(!world.orbit)return;
 for(const moon of moonDefs){ctx.beginPath();for(let k=0;k<=220;k++){
 const theta=k/220*TAU;const pt=plus(mul(xBase,Math.cos(theta)*moon.a),mul(yBase,Math.sin(theta)*moon.a));const s=proj.project(pt);k?ctx.lineTo(s.x,s.y):ctx.moveTo(s.x,s.y);}
 ctx.strokeStyle=moon.color+'3c';ctx.lineWidth=.9;ctx.stroke();}}
function renderJupiterDisk(proj,info){const R=Math.ceil(proj.radius),dim=R*2;
 if(dim<5)return;const c=document.createElement('canvas');c.width=dim;c.height=dim;const g=c.getContext('2d'),buf=g.createImageData(dim,dim),dst=buf.data;
 const T=tex.jupiter;let basis=proj.basis,rot=sphereRotation(world.jd),s=info.sun,rs=proj.radius;
 const moonShadows=world.shadows?info.moons.map(m=>({...m,hit:shadowHit(m,info)})).filter(m=>m.hit):[];
 for(let py=0;py<dim;py++){const y=(R-py-.5)/rs;for(let px=0;px<dim;px++){
 const x=(px+.5-R)/rs,d2=x*x+y*y;if(d2>=1)continue;
 const z=Math.sqrt(1-d2),n=plus(plus(mul(basis.right,x),mul(basis.up,y)),mul(basis.view,z));
 const lat=Math.asin(clamp(dot(n,jupPole),-1,1));let lon=Math.atan2(dot(n,rot.y),dot(n,rot.x));
 let u=(((lon/TAU)+.5)%1+1)%1,vy=clamp(.5-lat/PI,0,.999999);
 const tx=Math.floor(u*T.width),ty=Math.floor(vy*T.height),ti=(ty*T.width+tx)*4;
 let lit=Math.max(0,dot(n,s)),light=.075+1.06*Math.pow(lit,.68);
 if(world.shadows){let surface=mul(n,RJ);for(const m of moonShadows){
  const p=minus(m.pos,surface),distance=len(p),sunRadius=Math.atan2(SUN_RADIUS,info.sunKm),moonRadius=Math.atan2(m.r,distance);
  const delta=Math.acos(clamp(dot(mul(p,1/distance),s),-1,1));
  if(delta<sunRadius+moonRadius){const f=clamp((sunRadius+moonRadius-delta)/(2*Math.max(1e-8,sunRadius)),0,1);light*=1-.95*f;}
 }}
 const shade=clamp(light*(1-.08*Math.pow(1-z,2)),0,1.35),rim=Math.pow(1-z,3)*.2;
 const idx=(py*dim+px)*4;
 dst[idx]=clamp(T.rgba[ti]*shade+rim*65,0,255);dst[idx+1]=clamp(T.rgba[ti+1]*shade+rim*100,0,255);dst[idx+2]=clamp(T.rgba[ti+2]*shade+rim*150,0,255);dst[idx+3]=255;
 }}g.putImageData(buf,0,0);ctx.drawImage(c,proj.origin.x-R,proj.origin.y-R);
 // delicate bright limb drawn over atmosphere
 ctx.beginPath();ctx.arc(proj.origin.x,proj.origin.y,rs,0,TAU);ctx.strokeStyle='rgba(213,197,163,.25)';ctx.lineWidth=1.1;ctx.stroke();
}
function drawMoon(m,proj,info,inFront){const pt=proj.project(m.pos),radius=Math.max(1,m.r*proj.pxPerKm);
 if(pt.z>=0!==inFront)return; if(pt.x<-40||pt.x>w+40||pt.y<-40||pt.y>h+40)return;
 const eclipsed=isEclipsed(m,info),visible=Math.hypot(pt.x-proj.origin.x,pt.y-proj.origin.y)>proj.radius+radius||pt.z>0;
 if(!visible)return;
 if(radius>4){let glow=ctx.createRadialGradient(pt.x,pt.y,radius*.13,pt.x,pt.y,radius*2.8);glow.addColorStop(0,m.color+'66');glow.addColorStop(1,'transparent');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(pt.x,pt.y,radius*2.8,0,TAU);ctx.fill();}
 let g=ctx.createRadialGradient(pt.x-radius*.4,pt.y-radius*.4,radius*.1,pt.x,pt.y,radius*1.2);g.addColorStop(0,eclipsed?'#383838':m.color);g.addColorStop(.75,eclipsed?'#141821':m.color);g.addColorStop(1,'#141821');ctx.fillStyle=g;ctx.beginPath();ctx.arc(pt.x,pt.y,radius,0,TAU);ctx.fill();
 if(world.labels){ctx.font='600 11px system-ui';ctx.fillStyle='#dde9f8';ctx.textAlign='center';ctx.fillText(m.name,pt.x,pt.y-radius-11);if(eclipsed){ctx.fillStyle='#dbad81';ctx.font='9px system-ui';ctx.fillText('W CIENIU',pt.x,pt.y+radius+15);}}
}
function drawProjectedShadows(info,proj){if(!world.shadows)return;
 for(const moon of info.moons){const sh=shadowHit(moon,info);if(!sh)continue;
 const d=dot(unit(sh.point),proj.basis.view);if(d<=0)continue;const pp=proj.project(sh.point);
 const R=Math.max(1.4,sh.rU*proj.pxPerKm),pen=Math.max(3,R+sh.rP*proj.pxPerKm);
 ctx.save();ctx.beginPath();ctx.arc(proj.origin.x,proj.origin.y,proj.radius,0,TAU);ctx.clip();
 const gg=ctx.createRadialGradient(pp.x,pp.y,R*.45,pp.x,pp.y,pen*1.45);gg.addColorStop(0,'rgba(0,0,5,.9)');gg.addColorStop(.5,'rgba(0,0,4,.79)');gg.addColorStop(1,'rgba(0,0,6,0)');ctx.fillStyle=gg;ctx.beginPath();ctx.arc(pp.x,pp.y,pen*1.5,0,TAU);ctx.fill();ctx.restore();
 if(world.labels){ctx.fillStyle='#f0cf9b';ctx.font='600 10px system-ui';ctx.textAlign='center';ctx.fillText('CIEŃ '+moon.name.toUpperCase(),pp.x,pp.y-pen-9);}
 }}
function renderSpace(info){const proj=projection(world,info);
 skyBackground();drawOrbits(proj,info);
 const moons=[...info.moons].sort((a,b)=>proj.project(a.pos).z-proj.project(b.pos).z);
 for(const moon of moons)drawMoon(moon,proj,info,false);
 if(tex.jupiter&&proj.radius>9)renderJupiterDisk(proj,info);else{ctx.fillStyle='#a78975';ctx.beginPath();ctx.arc(proj.origin.x,proj.origin.y,proj.radius,0,TAU);ctx.fill();}
 drawProjectedShadows(info,proj);
 for(const moon of moons)drawMoon(moon,proj,info,true);
 ctx.fillStyle='rgba(231,237,250,.42)';ctx.font='10px system-ui';ctx.textAlign='left';ctx.fillText('JOWISZ · RÓWNIK 142 984 km · OBRÓT ≈ 9 h 55 min',22,h-22);
 ctx.font='9px system-ui';ctx.fillText('WIDOK '+({earth:'Z ZIEMI',sun:'OD SŁOŃCA',pole:'Z BIEGUNA',free:'SWOBODNY'}[world.cam]||'ORBITALNY')+' · ROZMIARY CIAŁ W JEDNEJ SKALI',22,h-39);
 return proj;
}
function drawMoonSurface(info){const m=info.moons.find(x=>x.id===world.cam.slice(7)),moon=m||info.moons[0];
 skyBackground();const horizon=h*.79;
 // At a surface point 65° away from the sub-Jovian point, Jupiter has altitude ≈25°.
 const sub=unit(mul(moon.pos,-1));const side=unit(cross(jupPole,sub));const observerNormal=unit(plus(mul(sub,Math.cos(65*DEG)),mul(side,Math.sin(65*DEG))));
 const observer=plus(moon.pos,mul(observerNormal,moon.r));const toward=unit(mul(observer,-1));
 const altitude=Math.asin(dot(toward,observerNormal));
 const fov=48*DEG,scale=h*.68/fov;const apparentRadius=Math.asin(clamp(RJ/len(observer),0,1));let r=apparentRadius*scale;
 const center={x:w*.53,y:horizon-altitude*scale};r=clamp(r,8,h*.48);
 const surfaceView={right:unit(cross(jupPole,toward)),view:toward,up:unit(cross(toward,unit(cross(jupPole,toward))))};
 const proj={origin:center,radius:r,basis:surfaceView,pxPerKm:r/RJ,
 project:(p)=>({x:center.x+dot(p,surfaceView.right)*r/RJ,y:center.y-dot(p,surfaceView.up)*r/RJ,z:dot(p,surfaceView.view)})};
 if(tex.jupiter)renderJupiterDisk(proj,info);else{ctx.fillStyle='#ae927c';ctx.beginPath();ctx.arc(center.x,center.y,r,0,TAU);ctx.fill();}
 drawProjectedShadows(info,proj);
 // Other Galilean moons and Sun in the topocentric sky, above this site's horizon.
 const sRight=surfaceView.right,sUp=surfaceView.up;
 const paintSkyBody=(id,name,position,radius,color,isSun=false)=>{
   const ray=minus(position,observer),rd=len(ray),u=mul(ray,1/rd);
   if(dot(u,observerNormal)<=0)return;
   const along=dot(u,toward),angleX=Math.atan2(dot(u,sRight),along);
   const angleY=Math.atan2(dot(u,sUp),Math.hypot(dot(u,sRight),along));
   if(Math.abs(angleX)>1.5||Math.abs(angleY)>1.5)return;
   const screenX=center.x+angleX*scale,screenY=center.y-angleY*scale;
   if(screenX<0||screenX>w||screenY<0||screenY>horizon-8)return;
   const rr=clamp(Math.atan2(radius,rd)*scale,isSun?2.3:1.5,isSun?5:7);
   if(isSun){let glow=ctx.createRadialGradient(screenX,screenY,0,screenX,screenY,rr*9);glow.addColorStop(0,'rgba(255,242,213,.8)');glow.addColorStop(.2,'rgba(255,220,163,.18)');glow.addColorStop(1,'rgba(255,218,144,0)');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(screenX,screenY,rr*9,0,TAU);ctx.fill();}
   ctx.beginPath();ctx.arc(screenX,screenY,rr,0,TAU);ctx.fillStyle=color;ctx.fill();
   ctx.fillStyle='#d9e6f2';ctx.font='600 11px system-ui';ctx.textAlign='center';ctx.fillText(name,screenX,screenY-rr-8);
 };
 for(const other of info.moons){if(other.id===moon.id)continue;paintSkyBody(other.id,other.name,other.pos,other.r,other.color);}
 paintSkyBody('sun','SŁOŃCE',mul(info.sun,info.sunKm),SUN_RADIUS,'#fff0c9',true);
 // thin rim of topographic skyline; illustrative (not landing site imagery)
 const gradient=ctx.createLinearGradient(0,horizon,0,h);let tone={io:['#4a3323','#201b1c'],europa:['#7b8a8d','#303f51'],ganymede:['#4e5049','#242729'],callisto:['#484645','#1d2127']}[moon.id];
 gradient.addColorStop(0,tone[0]);gradient.addColorStop(1,tone[1]);ctx.fillStyle=gradient;
 ctx.beginPath();ctx.moveTo(0,h);ctx.lineTo(0,horizon+13);for(let x=0;x<=w+14;x+=12){let n=15*Math.sin(x/95+moon.a*.0001)+8*Math.sin(x/29+moon.a*.00004)+3*Math.sin(x/7);ctx.lineTo(x,horizon+n);}ctx.lineTo(w,h);ctx.closePath();ctx.fill();
 ctx.strokeStyle='rgba(255,255,255,.10)';ctx.beginPath();ctx.moveTo(0,horizon+13);for(let x=0;x<=w;x+=12){let n=15*Math.sin(x/95+moon.a*.0001)+8*Math.sin(x/29+moon.a*.00004)+3*Math.sin(x/7);ctx.lineTo(x,horizon+n);}ctx.stroke();
 ctx.textAlign='center';ctx.font='600 13px system-ui';ctx.fillStyle='#dbe5f4';ctx.fillText('JOWISZ Z POWIERZCHNI '+moon.name.toUpperCase(),w/2,34);
 ctx.font='11px system-ui';ctx.fillStyle='#99acbe';ctx.fillText('Kamera na wysokości ok. '+(altitude*RAD).toFixed(0)+'° nad horyzontem · krajobraz ilustracyjny',w/2,54);
 ctx.font='11px system-ui';ctx.fillText('Pozorna średnica Jowisza: '+(apparentRadius*2*RAD).toFixed(1)+'°',w/2,h-28);
 return proj;
}
function observeData(info){
 const b=basisFrame(cameraDirection(info));let count=0,notes=[];
 for(const m of info.moons){let plane=len(minus(m.pos,mul(b.view,dot(m.pos,b.view))));
  let status='Na orbicie';if(isEclipsed(m,info))status='Zaćmiony przez Jowisza';else if(plane<RJ+m.r){status=dot(m.pos,b.view)>0?'Tranzyt przed Jowiszem':'Zakryty przez Jowisza';}
  if(shadowHit(m,info))status+=(status==='Na orbicie'?'Cień na Jowiszu':' · cień na Jowiszu');
  if(status!=='Na orbicie')count++;
  const el=$('jovMoon-'+m.id);if(el){el.querySelector('.jmoon-dist').textContent=Math.round(len(m.pos)).toLocaleString('pl-PL')+' km';el.querySelector('.jmoon-status').textContent=status;el.classList.toggle('jmoon-highlight',m.id===world.selected);}
  notes.push(m.name+': '+status);
 }
 $('jovPhenomena').textContent=count?notes.filter(t=>!t.includes('Na orbicie')).join('  ·  '):'Brak tranzytów i zaćmień księżyców w tej chwili.';
 $('jovDistance').textContent=(info.sunKm/AU).toFixed(3)+' AU';
 $('jovClock').textContent=stamp(world.jd);
 $('jovDate').value=jdToDate(world.jd).toISOString().slice(0,16);
 $('jovMoonFocus').textContent=world.selected==='all'?'System Galileuszowy':moonDefs.find(m=>m.id===world.selected)?.name||'System Galileuszowy';
 $('jovTimeline').value=clamp(Math.round((world.jd-world.anchorJD)*24),-480,480);
 $('jovTimeOffset').textContent=(world.jd-world.anchorJD>0?'+':'')+Math.round((world.jd-world.anchorJD)*24)+' h';
 $('jovPlay').textContent=world.playing?'Ⅱ Pauza':'▶ Odtwórz';
 $('jovStatus').textContent=world.cam.startsWith('surface')?'POWIERZCHNIA: '+(moonDefs.find(m=>m.id===world.cam.slice(7))?.name.toUpperCase()||'KSIĘŻYC'):world.cam==='earth'?'OBSERWATOR: ZIEMIA':'OBSERWATOR: '+world.cam.toUpperCase();
}
function render(ts){if(!$('jupiterDialog').open)return;resize();if(!w||!h)return;
 if(ts-(render.lastPaint||0)<36){requestAnimationFrame(render);return;} render.lastPaint=ts;
 if(world.playing&&world.last){world.jd+=clamp((ts-world.last)/1000,0,.09)*world.speed/86400;}
 world.last=ts;
 const info=positionFrame(world.jd);if(world.cam.startsWith('surface'))drawMoonSurface(info);else renderSpace(info);
 if(ts-(render.lastData||0)>180){observeData(info);render.lastData=ts;}
 requestAnimationFrame(render);
}
function assignTime(date){world.jd=typeof date==='number'?date:dateToJD(new Date(date));world.anchorJD=world.jd;world.playing=false;observeData(positionFrame(world.jd));}
function open(){const dlg=$('jupiterDialog');if(dlg.open)return;
 const main=window.ATLAS_MAIN_API;if(main){world.restoreMain=main.getPlaying();main.setPlaying(false);world.jd=main.getJD();}
 world.anchorJD=world.jd;dlg.showModal();resize();world.last=0;observeData(positionFrame(world.jd));requestAnimationFrame(render);}
function close(){world.playing=false;$('jupiterDialog').close();if(window.ATLAS_MAIN_API){window.ATLAS_MAIN_API.setJD(world.jd);window.ATLAS_MAIN_API.setPlaying(false);} }
function syncMain(){window.ATLAS_MAIN_API?.setJD(world.jd);close();window.ATLAS_MAIN_API?.selectJupiter();}
function selectCam(c){world.cam=c;world.playing=false;if(c.startsWith('surface'))world.selected=c.slice(7);highlightView();}
function highlightView(){document.querySelectorAll('[data-jov-camera]').forEach(b=>b.classList.toggle('active',b.dataset.jovCamera===world.cam));}
function jumpToTransit(){let t=world.jd,found=null;
 // Search in 10 minute steps up to 60 days. Avoid skipped transits by using fine cadence.
 for(let step=1;step<=8640;step++){
  const d=t+step/144;const f=positionFrame(d),eye=f.earth;
  for(const m of f.moons){const dist=len(minus(m.pos,mul(eye,dot(m.pos,eye))));if(dot(m.pos,eye)>0&&dist<RJ-m.r*1.4){found=d;break;}}
  if(found)break;
 }
 if(found){assignTime(found-.7/24);world.cam='earth';highlightView();$('jovModeNote').textContent='Znaleziony przybliżony tranzyt według wzorów Meeusa; nie jest to oficjalna efemeryda NASA.';}
 else{$('jovModeNote').textContent='Nie znaleziono tranzytu w 60 dniach od tej daty.';}
}
function setup(){loadMaps();initStars();
 $('openJupiter').onclick=open;$('jovClose').onclick=close;
 $('jupiterDialog').addEventListener('close',()=>{world.playing=false;});
 $('jovDate').onchange=e=>{if(!e.target.value)return;assignTime(e.target.value+':00Z');};
 $('jovNow').onclick=()=>assignTime(new Date());
 $('jovHubble').onclick=()=>{assignTime('2015-01-24T06:28:00Z');selectCam('earth');world.zoom=13;$('jovZoom').value=13;$('jovModeNote').textContent='Hubble sfotografował potrójny tranzyt 24.01.2015 o 06:28 i 07:10 UTC. Pozycje księżyców: przybliżony model Meeusa (nie dokładne efemerydy JUP365), dlatego wygląd i momenty kontaktów mogą się różnić.';};
 $('jovNext').onclick=jumpToTransit;
 $('jovPlay').onclick=()=>{world.playing=!world.playing;world.last=0;};
 $('jovBeginning').onclick=()=>{world.jd=world.anchorJD-2/24;world.playing=false;};
 $('jovSpeed').onchange=e=>world.speed=Number(e.target.value)||600;
 $('jovTimeline').oninput=e=>{world.jd=world.anchorJD+Number(e.target.value)/24;world.playing=false;};
 $('jovZoom').oninput=e=>{world.zoom=Number(e.target.value);planetLast=0;};
 $('jovWide').onclick=()=>{world.zoom=2.7;$('jovZoom').value=world.zoom;};
 $('jovCloseup').onclick=()=>{world.zoom=14;$('jovZoom').value=world.zoom;};
 for(const key of ['orbit','labels','shadows'])$('jov'+key[0].toUpperCase()+key.slice(1)).onchange=e=>world[key]=e.target.checked;
 for(const b of document.querySelectorAll('[data-jov-camera]'))b.onclick=()=>selectCam(b.dataset.jovCamera);
 for(const b of document.querySelectorAll('[data-jov-moon]'))b.onclick=()=>{world.selected=b.dataset.jovMoon;world.cam='surface'+world.selected;highlightView();};
 $('jovToSolar').onclick=syncMain;
 canvas.addEventListener('wheel',e=>{e.preventDefault();if(world.cam.startsWith('surface'))return;world.zoom=clamp(world.zoom*Math.exp(-e.deltaY*.001),1.2,22);$('jovZoom').value=world.zoom;},{passive:false});
 canvas.addEventListener('pointerdown',e=>{if(e.button!==0&&e.pointerType==='mouse')return;canvas.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY,az:world.freeAz,el:world.freeEl};});
 canvas.addEventListener('pointermove',e=>{if(!drag)return;
 const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(world.cam==='earth'&&Math.hypot(dx,dy)>6){world.cam='free';let info=positionFrame(world.jd);let direction=info.earth;world.freeAz=Math.atan2(dot(direction,yBase),dot(direction,xBase));world.freeEl=Math.asin(dot(direction,jupPole));drag.az=world.freeAz;drag.el=world.freeEl;drag.x=e.clientX;drag.y=e.clientY;}
 if(world.cam==='free'){world.freeAz=drag.az+(e.clientX-drag.x)*.008;world.freeEl=clamp(drag.el-(e.clientY-drag.y)*.0065,-1.48,1.48);highlightView();}
 });
 canvas.addEventListener('pointerup',()=>{drag=null;});canvas.addEventListener('pointercancel',()=>{drag=null;});
 canvas.addEventListener('dblclick',()=>{world.zoom=8;$('jovZoom').value=8;world.cam='earth';highlightView();});
 window.addEventListener('resize',()=>{if($('jupiterDialog').open)resize();});
 const info=$('jovMoonCards');for(const m of moonDefs){const b=document.createElement('button');b.className='jmoon-card';b.id='jovMoon-'+m.id;b.innerHTML=`<div class="jmoon-name"><span class="jmoon-dot" style="--moon:${m.color}"></span><strong>${m.name}</strong><small>${m.tag}</small></div><div class="jmoon-facts"><span>Promień ${Math.round(m.r).toLocaleString('pl-PL')} km</span><span>Obieg ${m.period.toFixed(3)} d</span></div><div class="jmoon-dist">—</div><div class="jmoon-status">Na orbicie</div>`;
 b.onclick=()=>{world.selected=m.id;world.cam='surface'+m.id;highlightView();};info.append(b);}
 world.cam='earth';highlightView();
}
// Module uses late DOM initialization so that the v7 module boot can attach its state bridge.
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
window.ATLAS_JUPITER_TEST={moonPos,positionFrame,isEclipsed,shadowHit,moonDefs,getWorld:()=>world,open};
})();

