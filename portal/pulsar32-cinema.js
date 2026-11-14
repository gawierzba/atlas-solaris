/* ATLAS SOLARIS 32.1 — Cinematic pulsar visual layer.
   Dependency-free Canvas2D projection. The scientific geometry remains in
   pulsar32-core.js. Plasma, star surface, glowing radio cones and nebulae
   are ARTISTIC, not physical radiative-transfer simulation. */
(function(root){
'use strict';
const TAU=Math.PI*2, DEG=Math.PI/180;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const V=(x,y,z)=>({x,y,z});
const add=(a,b)=>V(a.x+b.x,a.y+b.y,a.z+b.z);
const mul=(a,k)=>V(a.x*k,a.y*k,a.z*k);
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const cross=(a,b)=>V(a.y*b.z-a.z*b.y,a.z*b.x-a.x*b.z);
const unit=(a)=>mul(a,1/(Math.hypot(a.x,a.y,a.z)||1));
let seed=962184;
function random(){seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296}
const stars=Array.from({length:470},()=>({
 x:random(),y:random(),size:.22+random()*1.35,light:.17+random()*.68,
 depth:.2+random()*.8,hue:random(),twinkle:random()*TAU
}));
const dust=Array.from({length:240},()=>({
 x:random(),y:random(),s:1+random()*4,a:.015+random()*.045
}));
const particles=Array.from({length:240},()=>({
 distance:random(),az:random()*TAU,spread:Math.sqrt(random()),
 phase:random(),a:.3+random()*.7,scale:.3+random()*1.45
}));
const texCache={};
function atmosphereTexture(size){
 if(texCache[size])return texCache[size];
 const c=document.createElement('canvas');c.width=size;c.height=size;
 const ctx=c.getContext('2d'),image=ctx.createImageData(size,size),pix=image.data;
 for(let y=0;y<size;y++){
  const ny=(2*(y+.5)/size-1);
  for(let x=0;x<size;x++){
   const nx=2*(x+.5)/size-1,rr=nx*nx+ny*ny,k=4*(y*size+x);
   if(rr>=1){pix[k+3]=0;continue}
   const nz=Math.sqrt(1-rr);
   const az=Math.atan2(ny,nx),r=Math.sqrt(rr);
   // Surface turbulence: sinusoidal bands, fractal interference and polar arcs.
   const roll=Math.sin(11*nx+7*ny+3*Math.sin(6*ny)+5*nz);
   const curl=Math.sin(24*ny-13*nx+5*Math.cos(9*nx)+6*az*r);
   const gran=Math.sin(73*nx+41*ny)*Math.cos(64*ny-29*nx);
   const broad=.5+.5*Math.sin(9*az+18*r-5*Math.sin(3*nx));
   const plasma=clamp(.25+.22*roll+.16*curl+.11*gran+.22*broad,0,1);
   const spot=Math.exp(-((nx+.22)**2+(ny+.31)**2)/.075);
   const storm=Math.exp(-((nx-.45)**2+(ny-.26)**2)/.12);
   const light=clamp(.24+.64*(.31-.24*nx-.28*ny+.77*nz),0,1);
   const limb=Math.pow(nz,.29);
   const shine=light*(.65+.35*limb);
   const lum=clamp(shine*(.62+.72*plasma)+.63*spot+.18*storm,0,1.6);
   const violet=Math.pow(1-nz,1.35);
   pix[k]=Math.min(255,Math.round(9+130*lum+35*storm+32*violet));
   pix[k+1]=Math.min(255,Math.round(24+157*lum+32*spot+12*plasma));
   pix[k+2]=Math.min(255,Math.round(78+150*lum+19*spot+38*violet));
   pix[k+3]=Math.round(255*clamp((1-r)*size*.31,0,1));
  }
 }
 ctx.putImageData(image,0,0);texCache[size]=c;return c;
}
function gradient(ctx,x,y,r,stops){
 const g=ctx.createRadialGradient(x,y,0,x,y,Math.max(1,r));
 for(const [at,color] of stops)g.addColorStop(at,color);
 return g;
}
function stroke(ctx,pts,style,width=1,blur=0,dash){
 if(pts.length<2)return;
 ctx.save();ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';
 ctx.strokeStyle=style;
 if(blur){ctx.shadowBlur=blur;ctx.shadowColor=style}
 if(dash)ctx.setLineDash(dash);
 ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);
 for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i].x,pts[i].y);
 ctx.stroke();ctx.restore();
}
function projection(w,h,state){
 const yaw=state.camYaw,pitch=state.camPitch;
 const right=V(Math.cos(yaw),0,-Math.sin(yaw));
 const up=V(-Math.sin(pitch)*Math.sin(yaw),Math.cos(pitch),-Math.sin(pitch)*Math.cos(yaw));
 const front=V(Math.cos(pitch)*Math.sin(yaw),Math.sin(pitch),Math.cos(pitch)*Math.cos(yaw));
 const cx=w*.50,cy=h*.51,scale=Math.min(w,h)*.315;
 return {cx,cy,scale,right,up,front,
  point(p){
   const depth=dot(p,front),k=6.5/(6.5-depth);
   return {x:cx+dot(p,right)*scale*k,y:cy-dot(p,up)*scale*k,z:depth,k};
  }
 };
}
function background(ctx,w,h,state,quality,phase){
 ctx.fillStyle='#030713';ctx.fillRect(0,0,w,h);
 let g=gradient(ctx,w*.51,h*.51,Math.max(w,h)*.78,[
  [0,'rgba(19,53,92,.63)'],[.25,'rgba(11,27,60,.40)'],
  [.57,'rgba(8,15,39,.20)'],[1,'rgba(2,6,17,0)']]);
 ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
 const glows=[
  [w*.17,h*.18,w*.65,[[0,'rgba(84,67,151,.23)'],[.37,'rgba(51,66,132,.11)'],[1,'rgba(0,0,0,0)']]],
  [w*.78,h*.63,w*.57,[[0,'rgba(10,159,186,.15)'],[.4,'rgba(26,90,126,.055)'],[1,'rgba(0,0,0,0)']]],
  [w*.60,h*.12,w*.4,[[0,'rgba(103,95,171,.12)'],[1,'rgba(0,0,0,0)']]]
 ];
 for(const [x,y,r,stops] of glows){ctx.fillStyle=gradient(ctx,x,y,r,stops);ctx.fillRect(0,0,w,h)}
 ctx.save();ctx.globalCompositeOperation='screen';
 const dCount=quality==='cinema'?dust.length:100;
 for(let i=0;i<dCount;i++){
  const d=dust[i],x=d.x*w,y=d.y*h;
  ctx.fillStyle=i%3===0?'rgba(104,174,245,'+d.a+')':'rgba(162,122,235,'+d.a+')';
  ctx.fillRect(x,y,d.s,d.s);
 }
 const yaw=state.camYaw,pitch=state.camPitch;
 const count=quality==='cinema'?stars.length:220;
 for(let i=0;i<count;i++){
  const s=stars[i],x=((s.x+(yaw*.012*s.depth))%1+1)%1*w,
   y=((s.y+(pitch*.014*s.depth))%1+1)%1*h;
  const a=s.light*(.87+.13*Math.sin(phase*.32+s.twinkle));
  ctx.fillStyle=s.hue>.82?'rgba(255,204,191,'+a+')':
    s.hue>.45?'rgba(157,209,255,'+a+')':'rgba(245,246,255,'+a+')';
  ctx.beginPath();ctx.arc(x,y,s.size*(quality==='cinema'?1:.87),0,TAU);ctx.fill();
  if(s.size>1.12&&i%7===0){
   ctx.globalAlpha=a*.4;
   stroke(ctx,[{x:x-4,y},{x:x+4,y}],'rgba(160,215,255,.66)',.5);
   stroke(ctx,[{x,y:y-4},{x,y:y+4}],'rgba(160,215,255,.66)',.5);
   ctx.globalAlpha=1;
  }
 }
 ctx.restore();
 // Instrument framing. This stays subdued behind the specimen.
 const r=Math.min(w,h)*.385,x=w*.5,y=h*.51;
 ctx.save();ctx.setLineDash([3,12]);ctx.lineWidth=.8;ctx.strokeStyle='rgba(150,195,232,.085)';
 for(const factor of [1,1.38]){
  ctx.beginPath();ctx.ellipse(x,y,r*factor,r*factor*.79,0,0,TAU);ctx.stroke()
 }
 ctx.setLineDash([]);ctx.strokeStyle='rgba(117,160,194,.1)';
 ctx.beginPath();ctx.moveTo(x-r*1.9,y);ctx.lineTo(x+r*1.9,y);ctx.moveTo(x,y-r*1.35);ctx.lineTo(x,y+r*1.35);ctx.stroke();
 ctx.restore();
}
function fieldLines(ctx,P,m,layer,quality,phase){
 const [e1,e2]=basis(m),proj=P.point;
 ctx.save();ctx.globalCompositeOperation='screen';
 const steps=quality==='cinema'?66:38;
 const azCount=quality==='cinema'?9:6;
 for(const theta0 of [.37,.52,.66]){
  for(let j=0;j<azCount;j++){
   const az=TAU*j/azCount,ca=Math.cos(az),sa=Math.sin(az);
   const pts=[];
   for(let i=0;i<=steps;i++){
    const t=theta0+(Math.PI-2*theta0)*i/steps;
    const radius=Math.min(2.55,.43*Math.pow(Math.sin(t)/Math.sin(theta0),2));
    const p=add(mul(m,radius*Math.cos(t)),
     add(mul(e1,radius*Math.sin(t)*ca),mul(e2,radius*Math.sin(t)*sa)));
    pts.push(proj(p));
   }
   const color=j%2?
    (layer?'rgba(167,165,255,.54)':'rgba(112,109,245,.23)'):
    (layer?'rgba(96,249,248,.55)':'rgba(70,178,210,.22)');
   let continuous=[];
   for(let i=1;i<pts.length;i++){
    const visible=(pts[i].z>=0?1:0)===layer&&(pts[i-1].z>=0?1:0)===layer;
    if(visible){
     if(!continuous.length)continuous.push(pts[i-1]);
     continuous.push(pts[i]);
    }else if(continuous.length){
     stroke(ctx,continuous,color,layer?1.22:.75,layer?7:0);
     continuous=[];
    }
   }
   if(continuous.length)stroke(ctx,continuous,color,layer?1.22:.75,layer?7:0);
   if(layer&&quality==='cinema'&&j%2===0){
    const t=(phase*.55+j*.2)%1,idx=Math.max(0,Math.min(steps,Math.floor(t*steps))),p=pts[idx];
    if(p.z>0){
     ctx.fillStyle=j%4?'rgba(115,250,245,.8)':'rgba(214,196,255,.8)';
     ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=15;
     ctx.beginPath();ctx.arc(p.x,p.y,1.7,0,TAU);ctx.fill();ctx.shadowBlur=0;
    }
   }
  }
 }
 ctx.restore();
}
function basis(dir){
 const normal=Math.abs(dir.y)>.93?V(0,0,1):V(0,1,0);
 const a=unit(cross(normal,dir));
 return [a,unit(cross(dir,a))];
}
function beamPaint(ctx,P,dir,intensity,rho,quality,phase,frontLayer){
 const [u,v]=basis(dir),pt=P.point,origin=pt(mul(dir,.44));
 const r=clamp(Math.tan(rho*DEG),.06,.6);
 const localDepth=dot(dir,P.front);
 // Cones behind the star should be dimmer and partially occluded by the sphere.
 const alpha=(frontLayer?1:.57)*intensity;
 ctx.save();ctx.globalCompositeOperation='screen';
 // Six layered nested volumes give a soft-emission look instead of a flat triangle.
 const passes=quality==='cinema'?6:4;
 for(let l=passes;l>=1;l--){
  const expand=.5+.42*l,opacity=alpha*(l===1?.082:.018+.010*(passes-l));
  for(let sector=0;sector<8;sector++){
   const ang1=TAU*sector/8,ang2=TAU*(sector+1)/8;
   const boundary=(t,ang)=>{
    const rr=Math.max(.02,(t-.39)*r*expand);
    return pt(add(mul(dir,t),add(mul(u,rr*Math.cos(ang)),mul(v,rr*Math.sin(ang)))));
   };
   const tipA=boundary(3.8,ang1),tipB=boundary(3.8,ang2);
   const baseA=boundary(.5,ang1),baseB=boundary(.5,ang2);
   let grad=ctx.createLinearGradient(origin.x,origin.y,(tipA.x+tipB.x)/2,(tipA.y+tipB.y)/2);
   grad.addColorStop(0,'rgba(184,252,255,'+opacity*.5+')');
   grad.addColorStop(.26,'rgba(72,226,251,'+opacity+')');
   grad.addColorStop(.72,'rgba(64,132,255,'+opacity*.65+')');
   grad.addColorStop(1,'rgba(80,81,228,0)');
   ctx.fillStyle=grad;
   ctx.beginPath();ctx.moveTo(baseA.x,baseA.y);ctx.lineTo(tipA.x,tipA.y);
   ctx.lineTo(tipB.x,tipB.y);ctx.lineTo(baseB.x,baseB.y);ctx.closePath();ctx.fill();
  }
 }
 // Filaments follow the beam expansion, so they change with the beam width.
 const n=quality==='cinema'?11:6;
 for(let i=0;i<n;i++){
  const angle=TAU*i/n,pts=[];
  const radiusScale=.28+.61*((i*7)%11)/11;
  for(let j=0;j<=17;j++){
   const t=.46+j*3.32/17,rad=(t-.39)*r*radiusScale;
   const twist=angle+(.2*Math.sin(t*2+phase*TAU+i));
   pts.push(pt(add(mul(dir,t),
    add(mul(u,rad*Math.cos(twist)),mul(v,rad*Math.sin(twist))))));
  }
  const style=i%3?'rgba(93,229,255,'+(alpha*.22)+')':'rgba(218,251,255,'+(alpha*.43)+')';
  stroke(ctx,pts,style,i%3?.82:1.4,i%3?0:12);
 }
 // Energetic streaks are illustrative particles, not propagating radio waves.
 const limit=quality==='cinema'?115:34;
 for(let i=0;i<limit;i++){
  const p=particles[i+(!frontLayer?115:0)];
  if(!p)continue;
  const t=.57+(((p.distance+phase*.18)%1)*3.1);
  const ang=p.az+.16*Math.sin(phase*TAU*1.3+p.phase*TAU);
  const spread=(t-.39)*r*p.spread;
  const world=add(mul(dir,t),add(mul(u,spread*Math.cos(ang)),mul(v,spread*Math.sin(ang))));
  const projected=pt(world);
  const size=p.scale*(.48+.6*(t/3.7));
  ctx.fillStyle=i%5?'rgba(125,227,255,'+(alpha*.20*p.a)+')':'rgba(226,250,255,'+(alpha*.65*p.a)+')';
  ctx.fillRect(projected.x,projected.y,size,size);
 }
 // Intense core with directionally tapered transparency.
 const end=pt(mul(dir,3.7)),grad=ctx.createLinearGradient(origin.x,origin.y,end.x,end.y);
 grad.addColorStop(0,'rgba(214,255,255,'+alpha*.56+')');
 grad.addColorStop(.38,'rgba(115,246,255,'+alpha*.55+')');
 grad.addColorStop(1,'rgba(94,168,255,0)');
 stroke(ctx,[origin,end],grad,quality==='cinema'?4.4:2.9,quality==='cinema'?26:12);
 stroke(ctx,[origin,end],'rgba(234,255,255,'+alpha*.57+')',1.2,7);
 ctx.restore();
}
function neutronStar(ctx,P,m,phase,quality){
 const {cx,cy,scale}=P,r=scale*.54;
 ctx.save();ctx.globalCompositeOperation='screen';
 const layers=[
  [3.05,'rgba(82,108,246,.06)'],
  [2.25,'rgba(64,187,255,.09)'],
  [1.55,'rgba(114,245,252,.12)'],
  [1.05,'rgba(130,249,255,.14)']
 ];
 for(const [k,col] of layers){
  ctx.fillStyle=gradient(ctx,cx,cy,r*k,[[0,col],[.35,col],[1,'rgba(0,0,0,0)']]);
  ctx.beginPath();ctx.arc(cx,cy,r*k,0,TAU);ctx.fill();
 }
 ctx.restore();
 ctx.save();
 ctx.shadowColor='#5fdff5';ctx.shadowBlur=quality==='cinema'?39:23;
 const tex=atmosphereTexture(quality==='cinema'?390:250);
 ctx.drawImage(tex,cx-r,cy-r,r*2,r*2);
 ctx.shadowBlur=0;
 const rim=ctx.createRadialGradient(cx,cy,r*.78,cx,cy,r*1.09);
 rim.addColorStop(0,'rgba(25,64,126,0)');
 rim.addColorStop(.45,'rgba(101,225,255,.03)');
 rim.addColorStop(.72,'rgba(113,227,255,.29)');
 rim.addColorStop(.89,'rgba(140,223,255,.12)');
 rim.addColorStop(1,'rgba(66,126,228,0)');
 ctx.fillStyle=rim;ctx.beginPath();ctx.arc(cx,cy,r*1.1,0,TAU);ctx.fill();
 ctx.strokeStyle='rgba(204,244,255,.51)';ctx.lineWidth=1.15;
 ctx.beginPath();ctx.arc(cx,cy,r*.99,0,TAU);ctx.stroke();
 ctx.restore();
 // Magnetic polar cap projected to the visible hemisphere.
 const hotspot=P.point(mul(m,.545));
 if(hotspot.z>=-.015){
  const size=clamp(5+7*Math.sqrt(hotspot.z+.07),5,14);
  ctx.save();ctx.globalCompositeOperation='screen';
  ctx.fillStyle=gradient(ctx,hotspot.x,hotspot.y,size*4,[
   [0,'rgba(247,255,255,.96)'],[.11,'rgba(167,253,255,.71)'],
   [.27,'rgba(110,234,255,.32)'],[1,'rgba(0,0,0,0)']]);
  ctx.beginPath();ctx.arc(hotspot.x,hotspot.y,size*4,0,TAU);ctx.fill();
  ctx.fillStyle='#f3ffff';ctx.beginPath();ctx.arc(hotspot.x,hotspot.y,size*.35,0,TAU);ctx.fill();
  ctx.restore();
 }
 // A few energetic flares bloom around the limb.
 ctx.save();ctx.globalCompositeOperation='screen';
 for(let i=0;i<7;i++){
  const th=TAU*(i/7)+phase*.45,pr=r*(1.02+.035*Math.sin(i*4+phase*2));
  const x=cx+Math.cos(th)*pr,y=cy+Math.sin(th)*pr*.97;
  ctx.fillStyle=gradient(ctx,x,y,r*.38,[[0,'rgba(116,246,255,.11)'],[1,'rgba(0,0,0,0)']]);
  ctx.beginPath();ctx.arc(x,y,r*.38,0,TAU);ctx.fill();
 }
 ctx.restore();
}
function orbitAxis(ctx,P,m,state,quality){
 const pt=P.point;
 const pts=[];
 for(let i=0;i<=100;i++){const t=TAU*i/100;pts.push(pt(V(.87*Math.cos(t),0,.87*Math.sin(t))))}
 stroke(ctx,pts,'rgba(254,177,131,.21)',1.1,0,[4,6]);
 const rot=[pt(V(0,-2.6,0)),pt(V(0,2.6,0))];
 stroke(ctx,rot,'rgba(255,186,147,.52)',1.25,0,[6,7]);
 const mag=[pt(mul(m,-3.2)),pt(mul(m,3.2))];
 stroke(ctx,mag,'rgba(180,174,255,.42)',1.1,0,[5,6]);
 ctx.save();ctx.font='700 10px ui-sans-serif,system-ui';ctx.textAlign='center';
 const top=rot[1];ctx.fillStyle='#f8be9f';ctx.fillText('ROT',clamp(top.x,25,P.cx*2-25),Math.max(60,top.y-12));
 ctx.restore();
}
function observerHud(ctx,P,obs,core,state,quality){
 const pt=P.point,center=pt(V(0,0,0)),end=pt(mul(obs,3.05));
 const gain=core.pulseAtPhase(TAU*state.phase,state).gain,hot=gain>.46;
 ctx.save();ctx.globalCompositeOperation='screen';
 stroke(ctx,[center,end],hot?'rgba(155,255,239,.75)':'rgba(237,248,255,.6)',1.7,hot?16:0,[3,6]);
 ctx.beginPath();ctx.arc(end.x,end.y,hot?7:5.5,0,TAU);
 ctx.shadowBlur=hot?18:10;ctx.shadowColor=hot?'#92ffe5':'#b9e5ff';
 ctx.fillStyle=hot?'#bcfff1':'#e0f7ff';ctx.fill();ctx.shadowBlur=0;
 ctx.strokeStyle='rgba(218,242,255,.48)';
 ctx.beginPath();ctx.arc(end.x,end.y,hot?14:11,0,TAU);ctx.stroke();
 ctx.restore();
 ctx.save();ctx.fillStyle=hot?'#b5fff0':'#c0e5ff';ctx.textAlign='center';ctx.font='800 10px ui-sans-serif,system-ui';
 ctx.fillText('RADIO',clamp(end.x,31,P.cx*2-31),clamp(end.y-18,72,P.cy*2-65));ctx.restore();
}
function draw(ctx,w,h,state,core,quality='auto'){
 if(!ctx||!(w>0)||!(h>0))return;
 const isReduced=typeof matchMedia!=='undefined'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 const lowDevice=(w<570)||(typeof navigator!=='undefined'&&navigator.deviceMemory&&navigator.deviceMemory<4);
 const mode=quality==='auto'?(isReduced||lowDevice?'eco':'cinema'):quality;
 const phase=state.phase||0;
 background(ctx,w,h,state,mode,phase);
 const P=projection(w,h,state),angle=state.alpha*DEG,spin=TAU*phase;
 const m=V(Math.sin(angle)*Math.cos(spin),Math.cos(angle),Math.sin(angle)*Math.sin(spin));
 const z=state.zeta*DEG,obs=V(Math.sin(z),Math.cos(z),0);
 const cones=[{v:m,p:1},{v:mul(m,-1),p:.48}];
 const back=cones.filter(c=>dot(c.v,P.front)<0);
 const front=cones.filter(c=>dot(c.v,P.front)>=0);
 fieldLines(ctx,P,m,0,mode,phase);
 for(const c of back)beamPaint(ctx,P,c.v,c.p,state.rho,mode,phase,false);
 orbitAxis(ctx,P,m,state,mode);
 neutronStar(ctx,P,m,phase,mode);
 for(const c of front)beamPaint(ctx,P,c.v,c.p,state.rho,mode,phase,true);
 fieldLines(ctx,P,m,1,mode,phase);
 observerHud(ctx,P,obs,core,state,mode);
}
const api=Object.freeze({draw,atmosphereTexture});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.AtlasPulsar32Cinema=api;
})(typeof globalThis!=='undefined'?globalThis:this);
