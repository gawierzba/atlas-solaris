/* ATLAS SOLARIS 31 — rozszerzone źródło + cienka soczewka punktowa.
   Każdy piksel obrazu liczony z równania beta = theta - theta_E^2/theta.
   Animowane tło i dekoracyjne kolory galaktyki są proceduralne. */
(function(){
'use strict';
const core=window.AtlasLens31;
const el=id=>document.getElementById(id);
const canvas=el('l31Canvas'),sourceCanvas=el('l31Source'),curveCanvas=el('l31Curve');
if(!core||!canvas||!sourceCanvas||!curveCanvas)return;
const state={massLog:12,dl:.8,ds:2,field:10,x:0,y:0,playing:false,phase:0};
let lastDraw=0,lastTick=0,selected='ring',smallSourceScale=1,smallSourceW=1,smallSourceH=1;
const sliders={massLog:el('l31Mass'),dl:el('l31Dl'),ds:el('l31Ds'),field:el('l31Field'),x:el('l31X'),y:el('l31Y')};
const fmt=(n,d=2)=>Number(n).toLocaleString('pl-PL',{minimumFractionDigits:d,maximumFractionDigits:d});
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const rad=Math.PI/180;
const stars=[];
let seed=345819;
function rnd(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
for(let i=0;i<90;i++)stars.push({x:(rnd()-.5)*8,y:(rnd()-.5)*8,mag:rnd(),tint:rnd()});
function lensAngle(){return core.einsteinArcseconds(Math.pow(10,state.massLog),state.dl,state.ds)}
function configureCanvas(c,large){
 const rect=c.getBoundingClientRect();
 const cssW=Math.max(1,rect.width),cssH=Math.max(1,rect.height);
 const rasterScale=large?.72:.85;
 const w=Math.min(large?640:380,Math.max(160,Math.round(cssW*rasterScale)));
 const h=Math.max(110,Math.round(w*cssH/cssW));
 if(c.width!==w||c.height!==h){c.width=w;c.height=h}
 return{ctx:c.getContext('2d',{alpha:false}),w,h};
}
function galacticGlow(x,y,bx,by){
 const dx=x-bx,dy=y-by,a=.61,bb=.29,co=.886,si=.464;
 const qx=(dx*co+dy*si)/a,qy=(-dx*si+dy*co)/bb;
 const r=Math.hypot(qx,qy);
 if(r>5.9)return 0;
 const theta=Math.atan2(qy,qx);
 const arms=Math.pow(.5+.5*Math.cos(2*theta-2.65*Math.log(r+.10)+.5),5);
 const outskirts=Math.exp(-1.35*r),bulge=Math.exp(-r*r*5.6);
 return Math.min(1.9,bulge*1.22+outskirts*(.18+arms*.95)+.035*Math.exp(-r*.65));
}
function backgroundSample(idata,j,lum){
 const data=idata.data;
 const glow=clamp(lum,0,1.9);
 // Syntetyczna galaktyka: ramiona bardziej błękitne, jądro jasnoróżowe.
 const k=glow>0?.75+.25*Math.tanh(glow):0;
 data[j]=Math.min(255,Math.round(4+glow*160*k));
 data[j+1]=Math.min(255,Math.round(9+glow*129*k));
 data[j+2]=Math.min(255,Math.round(23+glow*177*k));
 data[j+3]=255;
}
function drawStars(ctx,w,h,scale,lensed){
 ctx.save();
 for(const star of stars){
  const points=lensed?core.images(star.x,star.y):null;
  const positions=lensed?(points.ring?[]:[points.primary,points.secondary]):[{x:star.x,y:star.y,absoluteMagnification:1}];
  for(const p of positions){
   if(!p)continue;
   const x=w/2+p.x*scale,y=h/2+p.y*scale;
   if(x<4||y<4||x>w-4||y>h-4)continue;
   const m=clamp(p.absoluteMagnification,0,8);
   const size=clamp((.5+star.mag*.95)*Math.sqrt(m),.35,2.6);
   ctx.beginPath();ctx.arc(x,y,size,0,Math.PI*2);
   const alpha=(.18+star.mag*.45)*clamp(m,.25,1.7);
   ctx.fillStyle=star.tint>.6?'rgba(171,218,255,'+clamp(alpha,0,.8)+')':'rgba(241,231,255,'+clamp(alpha,0,.8)+')';
   ctx.fill();
  }
 }
 ctx.restore();
}
function renderSky(c,lensed){
 const {ctx,w,h}=configureCanvas(c,lensed);
 const te=lensAngle();
 const scale=te*Math.min(w,h)/state.field;
 const bg=ctx.createImageData(w,h),d=bg.data;
 const pixelToUnits=1/scale;
 for(let py=0;py<h;py++){
  const y=(py-h/2)*pixelToUnits;
  for(let px=0;px<w;px++){
   const x=(px-w/2)*pixelToUnits;
   const beta=lensed?core.mapImageToSource(x,y):{x,y};
   const glow=galacticGlow(beta.x,beta.y,state.x,state.y);
   backgroundSample(bg,4*(py*w+px),glow);
  }
 }
 ctx.putImageData(bg,0,0);
 // Źródła punktowe z tej samej płaszczyzny odległego źródła.
 drawStars(ctx,w,h,scale,lensed);
 ctx.save();ctx.translate(w/2,h/2);
 if(lensed){
  ctx.beginPath();ctx.arc(0,0,scale,0,Math.PI*2);ctx.setLineDash([5,7]);ctx.lineWidth=1.2;
  ctx.strokeStyle='rgba(133,235,245,.7)';ctx.stroke();ctx.setLineDash([]);
  ctx.beginPath();ctx.arc(0,0,Math.max(2,Math.min(8,scale*.06)),0,2*Math.PI);
  ctx.fillStyle='#f1edff';ctx.shadowColor='#baa6ff';ctx.shadowBlur=22;ctx.fill();ctx.shadowBlur=0;
  const point=core.images(state.x,state.y);
  if(!point.ring){
   for(const [p,label] of [[point.primary,'A'],[point.secondary,'B']]){
    ctx.beginPath();ctx.arc(p.x*scale,p.y*scale,3,0,2*Math.PI);
    ctx.fillStyle='#f6e1ef';ctx.fill();
    ctx.font='bold 10px system-ui';ctx.fillStyle='#e5eefb';
    ctx.fillText(label,p.x*scale+8,p.y*scale-7);
   }
  }
  ctx.font='bold 11px system-ui';ctx.fillStyle='rgba(150,237,247,.95)';
  ctx.fillText('θE',Math.max(0,scale+8),-10);
 }else{
  ctx.beginPath();ctx.arc(state.x*scale,state.y*scale,9,0,2*Math.PI);
  ctx.strokeStyle='#baf6fb';ctx.lineWidth=1.2;ctx.stroke();
  ctx.beginPath();ctx.moveTo(state.x*scale-15,state.y*scale);ctx.lineTo(state.x*scale+15,state.y*scale);
  ctx.moveTo(state.x*scale,state.y*scale-15);ctx.lineTo(state.x*scale,state.y*scale+15);ctx.stroke();
 }
 ctx.restore();
 if(!lensed){smallSourceScale=scale;smallSourceW=w;smallSourceH=h}
}
function drawCurve(){
 const {ctx,w,h}=configureCanvas(curveCanvas,false);
 ctx.clearRect(0,0,w,h);
 ctx.fillStyle='#0b1a2b';ctx.fillRect(0,0,w,h);
 const left=40,right=w-13,top=13,bottom=h-28;
 const impact=Math.abs(state.y);
 const cap=impact<.09?18:Math.min(18,Math.max(4,core.lightcurve(0,impact)*1.16));
 const val=x=>Math.min(cap,core.lightcurve(x,impact));
 const xPx=x=>left+(x+3)/6*(right-left);
 const yPx=v=>bottom-(v-1)/(cap-1)*(bottom-top);
 ctx.strokeStyle='#253750';ctx.lineWidth=1;
 for(let i=0;i<5;i++){const yy=top+i*(bottom-top)/4;ctx.beginPath();ctx.moveTo(left,yy);ctx.lineTo(right,yy);ctx.stroke()}
 ctx.fillStyle='#97aec5';ctx.font='10px system-ui';
 ctx.fillText('μ',13,15);ctx.fillText(fmt(cap,0)+'×',4,top+10);ctx.fillText('1×',16,bottom);
 ctx.fillText('−3',left,bottom+16);ctx.fillText('0',xPx(0)-3,bottom+16);ctx.fillText('+3',right-17,bottom+16);
 const gradient=ctx.createLinearGradient(0,top,0,bottom);gradient.addColorStop(0,'#d49eff');gradient.addColorStop(1,'#74e8f1');
 ctx.beginPath();
 for(let i=0;i<=190;i++){let x=-3+i*6/190,y=yPx(val(x));i?ctx.lineTo(xPx(x),y):ctx.moveTo(xPx(x),y)}
 ctx.strokeStyle=gradient;ctx.lineWidth=2.6;ctx.stroke();
 const xpos=xPx(state.x),ypos=yPx(val(state.x));
 ctx.strokeStyle='#ffffff77';ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(xpos,top);ctx.lineTo(xpos,bottom);ctx.stroke();ctx.setLineDash([]);
 ctx.fillStyle='#f8e2ff';ctx.beginPath();ctx.arc(xpos,ypos,4.3,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle='#a9badd';ctx.strokeRect(left,top,right-left,bottom-top);
}
function sync(){
 const te=lensAngle(),img=core.images(state.x,state.y),u=Math.hypot(state.x,state.y);
 el('l31Theta').textContent=fmt(te,2)+'″';
 el('l31Magnification').textContent=img.ring?'→ ∞':fmt(img.magnification,2)+'×';
 el('l31Separation').textContent=fmt(img.separation*te,2)+'″';
 el('l31MassValue').textContent='10^'+fmt(state.massLog,2)+' M☉';
 el('l31DlValue').textContent=fmt(state.dl,2)+' Gpc';
 el('l31DsValue').textContent=fmt(state.ds,2)+' Gpc';
 el('l31FieldValue').textContent=fmt(state.field,0)+'″';
 el('l31XValue').textContent=fmt(state.x,2)+' θE';
 el('l31YValue').textContent=fmt(state.y,2)+' θE';
 el('l31U').textContent=fmt(u,2);
 el('l31Status').textContent=img.ring?'Pierścień Einsteina':u<.65?'Dwa silnie zniekształcone obrazy':'Dwa obrazy źródła';
 el('l31Interpret').textContent=img.ring?
  'Przy idealnym ustawieniu punktowego źródła i masy obserwujemy pierścień Einsteina. Formalne μ → ∞ dotyczy źródła punktowego; rozciągła galaktyka ma skończoną jasność.':
  'Cienka soczewka punktowa daje dwa obrazy jądra źródła po przeciwnych stronach masy. Oddalając źródło od osi, osłabiasz zniekształcenia i powiększenie.';
 el('l31Play').textContent=state.playing?'Ⅱ ZATRZYMAJ PRZELOT':'▶ URUCHOM PRZELOT';
 el('l31Play').setAttribute('aria-pressed',String(state.playing));
 Object.keys(sliders).forEach(key=>sliders[key].value=state[key]);
 document.querySelectorAll('[data-l31preset]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.l31preset===selected)));
}
function draw(){sync();renderSky(canvas,true);renderSky(sourceCanvas,false);drawCurve()}
function scheduleDraw(){
 if(scheduleDraw.pending)return;
 scheduleDraw.pending=true;
 requestAnimationFrame(()=>{scheduleDraw.pending=false;draw()});
}
scheduleDraw.pending=false;
Object.entries(sliders).forEach(([key,input])=>{
 input.addEventListener('input',()=>{
  state[key]=Number(input.value);
  if(key==='dl'&&state.ds<=state.dl){state.ds=clamp(state.dl+.1,.7,5);sliders.ds.value=state.ds}
  if(key==='ds'&&state.dl>=state.ds){state.dl=clamp(state.ds-.1,.2,2.4);sliders.dl.value=state.dl}
  if(key==='x'||key==='y')state.playing=false;
  selected='';scheduleDraw();
 })
});
const presets={
 ring:{x:0,y:0,massLog:12,dl:.8,ds:2,field:10},
 arcs:{x:.65,y:.18,massLog:12,dl:.8,ds:2,field:10},
 weak:{x:2.3,y:.35,massLog:11.65,dl:.9,ds:2.2,field:10},
 flyby:{x:-2.6,y:.21,massLog:12,dl:.8,ds:2,field:10}
};
document.querySelectorAll('[data-l31preset]').forEach(b=>b.addEventListener('click',()=>{
 const p=presets[b.dataset.l31preset];if(!p)return;
 Object.assign(state,p);state.phase=0;state.playing=b.dataset.l31preset==='flyby';
 selected=b.dataset.l31preset;scheduleDraw();
}));
el('l31Play').addEventListener('click',()=>{
 if(!state.playing&&state.x>=2.5)state.x=-2.6;
 state.playing=!state.playing;selected=state.playing?'flyby':'';scheduleDraw();
});
el('l31Reset').addEventListener('click',()=>{
 Object.assign(state,presets.ring);state.playing=false;selected='ring';scheduleDraw();
});
function moveSource(e){
 const rect=sourceCanvas.getBoundingClientRect();
 if(!rect.width||!rect.height)return;
 const px=(e.clientX-rect.left)/rect.width*smallSourceW;
 const py=(e.clientY-rect.top)/rect.height*smallSourceH;
 state.x=clamp((px-smallSourceW/2)/smallSourceScale,-2.8,2.8);
 state.y=clamp((py-smallSourceH/2)/smallSourceScale,-1.5,1.5);
 state.playing=false;selected='';scheduleDraw();
}
sourceCanvas.addEventListener('pointerdown',e=>{sourceCanvas.setPointerCapture(e.pointerId);moveSource(e)});
sourceCanvas.addEventListener('pointermove',e=>{if(e.buttons===1&&sourceCanvas.hasPointerCapture(e.pointerId))moveSource(e)});
let resizeHandle;
if(typeof ResizeObserver!=='undefined')new ResizeObserver(()=>{cancelAnimationFrame(resizeHandle);resizeHandle=requestAnimationFrame(scheduleDraw)}).observe(canvas);
window.addEventListener('resize',scheduleDraw,{passive:true});
function frame(now){
 if(!lastTick)lastTick=now;
 const dt=Math.min(.15,(now-lastTick)/1000);lastTick=now;
 if(state.playing&&now-lastDraw>95){
  state.x+=dt*.72;
  if(state.x>2.75)state.x=-2.75;
  lastDraw=now;draw();
 }
 requestAnimationFrame(frame);
}
draw();requestAnimationFrame(frame);
function reportReady(){try{if(window.parent!==window)window.parent.postMessage({type:'atlas:portal:ready'},location.origin)}catch(_e){}}
window.addEventListener('message',e=>{if(e.origin===location.origin&&e.data?.type==='atlas:portal:ping')reportReady()});
reportReady();
})();
