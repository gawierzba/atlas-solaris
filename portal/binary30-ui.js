/* ATLAS SOLARIS 30.0 · binary stars full-page laboratory.
   Canvas drawings (including stream/disk) are illustrative; see core.js for math. */
(function(){
'use strict';
const B=window.ATLAS_BINARY30_CORE;if(!B)return;
const $=id=>document.getElementById(id);
const E={scene:$('b30Scene'),curve:$('b30Curve'),m1:$('b30M1'),m2:$('b30M2'),a:$('b30A'),fill:$('b30Fill'),incl:$('b30Incl'),kind:$('b30Type'),cam:$('b30Cam'),roche:$('b30Roche'),
 period:$('b30Period'),condition:$('b30Condition'),l1:$('b30L1'),m1v:$('b30M1Val'),m2v:$('b30M2Val'),av:$('b30AVal'),fillv:$('b30FillVal'),inclv:$('b30InclVal'),status:$('b30StatusTitle'),description:$('b30StatusText'),metrics:$('b30Metrics'),interpret:$('b30Interpret'),
 sceneTitle:$('b30SceneTitle'),sceneSub:$('b30SceneSub'),phase:$('b30Phase'),phaseBar:$('b30PhaseBar'),flux:$('b30Flux'),cameraNote:$('b30CameraNote'),curveTitle:$('b30CurveHeading'),pause:$('b30Pause'),restart:$('b30Restart'),speed:$('b30Speed'),presets:$('b30Presets')};
const ctx=E.scene.getContext('2d'),graph=E.curve.getContext('2d'),TAU=B.TAU;
const presets=[
 {key:'overflow',label:'01 · PRZELEW ROCHE’A',p:{m1:1.5,m2:.9,a:8,fill:1.04,incl:85,kind:'white-dwarf'}},
 {key:'eclipses',label:'02 · ZAĆMIENIA',p:{m1:1.9,m2:1.2,a:8,fill:.85,incl:90,kind:'star'}},
 {key:'pulsar',label:'03 · GWIAZDA NEUTRONOWA',p:{m1:2.3,m2:1.4,a:9,fill:1.12,incl:76,kind:'neutron-star'}},
 {key:'blackhole',label:'04 · CZARNA DZIURA',p:{m1:4,m2:8,a:18,fill:1.06,incl:81,kind:'black-hole'}},
 {key:'detached',label:'05 · UKŁAD ODERWANY',p:{m1:1.3,m2:1.0,a:16,fill:.48,incl:36,kind:'star'}}
];
const limits={'white-dwarf':[.5,1.38],'neutron-star':[1,2.3],'black-hole':[3,20],'star':[.5,20]};
const view={phase:0,playing:true,speed:.34,curves:[],contours:[],system:null,last:0,dpr:1,dprGraph:1,activePreset:'overflow',muted:false};
const fmt=(n,d=2)=>Number(n).toLocaleString('pl-PL',{maximumFractionDigits:d,minimumFractionDigits:d});
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const randSeed=n=>{let s=n>>>0;return()=>((s=(1664525*s+1013904223)>>>0)/4294967296)};
const rng=randSeed(18009);
const stars=Array.from({length:240},()=>({x:rng(),y:rng(),r:.4+rng()*1.25,a:.13+rng()*.7}));
const dust=Array.from({length:140},()=>({a:rng()*TAU,r:.2+rng()*.8,z:rng(),w:.25+rng()*.75}));
function nearestPreset(p){for(const pre of presets){if(pre.p.kind===p.kind&&Math.abs(pre.p.m1-p.m1)<.055&&Math.abs(pre.p.m2-p.m2)<.055&&Math.abs(pre.p.a-p.a)<.11&&Math.abs(pre.p.fill-p.fill)<.012&&Math.abs(pre.p.incl-p.incl)<1)return pre.key;}return null;}
function getParams(){return {m1:+E.m1.value,m2:+E.m2.value,a:+E.a.value,fill:+E.fill.value,incl:+E.incl.value,kind:E.kind.value};}
function updateKindLimits(){const [min,max]=limits[E.kind.value];E.m2.min=min;E.m2.max=max;E.m2.value=clamp(+E.m2.value,min,max);}
function syncFields(p){E.m1v.textContent=`${fmt(p.m1,1)} M☉`;E.m2v.textContent=`${fmt(p.m2,2)} M☉`;E.av.textContent=`${fmt(p.a,1)} R☉`;E.fillv.textContent=`${Math.round(p.fill*100)}%`;E.inclv.textContent=`${p.incl}°`;}
function refresh(){const p=getParams(),s=B.derived(p);view.system=s;view.curves=Array.from({length:321},(_,i)=>B.flux(i/320,s));view.contours=B.equipotentialSegments(s,94);view.activePreset=nearestPreset(p);
 for(const btn of E.presets.querySelectorAll('button'))btn.classList.toggle('active',btn.dataset.key===view.activePreset);
 syncFields(p);E.period.textContent=s.period<1?`${fmt(s.period*24,1)} godz.`:`${fmt(s.period,2)} dni`;
 E.l1.textContent=`${fmt((s.l1+s.mu)*s.a,2)} R☉`;
 E.condition.textContent=s.condition==='detached'?'ODERWANY':s.condition==='overflow'?'PRZELEW ROCHE’A':s.condition==='contact'?'KONTAKTOWY':'PRZELEW TOWARZYSZA';
 const compact=s.kind!=='star';
 if(s.condition==='contact'){
  E.status.textContent='Układ kontaktowy / wspólna otoczka';E.description.textContent='Obie gwiazdy wypełniają swoje krytyczne obszary; prosty model transferu materii nie rozstrzyga stabilności takiego układu.';E.interpret.textContent='Dla tego przypadku potrzebna jest pełna ewolucja układu, a być może model wspólnej otoczki.';E.sceneTitle.textContent='Układ kontaktowy';E.sceneSub.textContent='Obydwie gwiazdy wypełniają strefy Roche’a';
 }else if(s.condition==='overflow'){
  E.status.textContent='Materia przekracza granicę Roche’a';
  E.description.textContent=compact?'Donor przekroczył swój krytyczny promień. Gaz może przemieszczać się przez punkt L1 w kierunku zwartego towarzysza, tworząc strukturę akrecyjną.':'Donor przekroczył krytyczną granicę. W takim układzie materia może płynąć przez punkt L1 do drugiej gwiazdy; transfer może zmieniać orbitę i masy.';
  E.interpret.textContent=`Promień donora przewyższa ekwiwalentny promień Roche’a o ${fmt((s.fill-1)*100,0)}%. Pokazany strumień jest ilustracyjny — nie wyznaczamy natężenia transferu ani jego stabilności.`;
  E.sceneTitle.textContent='Przelew przez punkt L1';E.sceneSub.textContent=compact?'Geometria Roche’a + ilustracyjny dysk akrecyjny':'Geometria Roche’a + modelowany transfer materii';
 }else if(s.condition==='companion-overflow'){
  E.status.textContent='Towarzysz wypełnia obszar Roche’a';E.description.textContent='Dla wybranych mas i zbyt małej odległości zwykła gwiazda towarzysząca może sama przekroczyć swój promień Roche’a.';E.interpret.textContent='Zmień odległość lub masy, aby uzyskać stabilniejszy układ oderwany.';E.sceneTitle.textContent='Towarzysz w kontakcie';E.sceneSub.textContent='Promień drugiej gwiazdy przekracza granicę Roche’a';
 }else{
  E.status.textContent='Układ oderwany — bez przelewu';E.description.textContent='Promień donora jest mniejszy od promienia strefy Roche’a. Obie gwiazdy mogą okrążać wspólny środek masy bez ciągłego przepływu materii przez punkt L1.';E.interpret.textContent='Zwiększ wypełnienie Roche’a powyżej 100%, aby przekroczyć granicę i uruchomić wizualizację przepływu.';E.sceneTitle.textContent='Taniec dwóch gwiazd';E.sceneSub.textContent='Ruch kołowy wokół środka masy układu';
 }
 const noEclipse=Math.min(...view.curves)>.999;
 E.curveTitle.textContent=noEclipse?'Brak geometrycznych zaćmień':'Zaćmienia zmieniają jasność układu';
 const items=[
  ['MASY / STOSUNEK',`q = ${fmt(s.m1/s.m2,2)}`],
  ['KRYTYCZNY PROMIEŃ DONORA',`${fmt(s.rl1,2)} R☉`],
  ['PROMIEŃ DONORA',`${fmt(s.r1,2)} R☉`],
  ['ROCHE TOWARZYSZA',`${fmt(s.rl2,2)} R☉`],
  ['PROMIEŃ TOWARZYSZA',s.kind==='star'?`${fmt(s.r2,2)} R☉`:s.kind==='black-hole'?`${fmt(2.95*s.m2,1)} km (Schwarzschild)`:`${fmt(s.r2*B.RSUN/1000,1)} km`],
  ['PRZEWIDYWANE ZAĆMIENIA',noEclipse?'Nie (przy tych parametrach)':'Tak (geometryczne)'],
 ];
 E.metrics.innerHTML=items.map(([a,b])=>`<div class="b30-metric"><small>${a}</small><strong>${b}</strong></div>`).join('');
 E.cameraNote.textContent=E.cam.checked?`Obserwator: i = ${p.incl}°`:'Kamera 3D: schematyczne 55°';
 drawGraph();drawScene(performance.now());
}
function applyPreset(pre){E.kind.value=pre.kind;updateKindLimits();for(const key of ['m1','m2','a','fill','incl'])E[key].value=pre[key];view.phase=0;refresh();}
function resizeCanvas(canvas,context){const rect=canvas.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.max(1,Math.round(rect.width*dpr));canvas.height=Math.max(1,Math.round(rect.height*dpr));context.setTransform(dpr,0,0,dpr,0,0);return dpr;}
function resize(){view.dpr=resizeCanvas(E.scene,ctx);view.dprGraph=resizeCanvas(E.curve,graph);drawGraph();drawScene(performance.now());}
function ellipse(ctx,x,y,rx,ry){ctx.beginPath();ctx.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),0,0,TAU);}
function inScene(s,theta){const w=E.scene.width/view.dpr,h=E.scene.height/view.dpr;const sc=Math.min(w*.37,h*.38);const cx=w*(w<630?.52:.53),cy=h*.455;
 const i=(E.cam.checked?s.incl:55)*Math.PI/180,cosi=Math.cos(i),sini=Math.sin(i);
 const project=(x,y)=>{const co=Math.cos(theta),si=Math.sin(theta),u=x*co-y*si,v=x*si+y*co;return {x:cx+u*sc,y:cy+v*cosi*sc,depth:v*sini}};
 return {w,h,sc,cx,cy,project,cosi,sini};
}
function setupBackground(P,t){const {w,h}=P;const bg=ctx.createRadialGradient(w*.47,h*.45,0,w*.47,h*.45,w*.8);bg.addColorStop(0,'#102b44');bg.addColorStop(.35,'#0a1b2d');bg.addColorStop(1,'#060c1a');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
 ctx.save();for(const x of stars){ctx.globalAlpha=x.a*(.85+.15*Math.sin(t*.001+x.y*27));ctx.fillStyle=x.a>.62?'#e4efff':'#a5bdd8';ctx.beginPath();ctx.arc(x.x*w,x.y*h,x.r,0,TAU);ctx.fill();}ctx.globalAlpha=1;ctx.restore();
 const aura=ctx.createRadialGradient(P.cx,P.cy,0,P.cx,P.cy,P.sc*1.3);aura.addColorStop(0,'#2c5f8025');aura.addColorStop(1,'#111a3000');ctx.fillStyle=aura;ctx.beginPath();ctx.arc(P.cx,P.cy,P.sc*1.3,0,TAU);ctx.fill();}
function orbitRing(P,r,col){const steps=180;ctx.beginPath();for(let i=0;i<=steps;i++){const a=i/steps*TAU,q=P.project(r*Math.cos(a),r*Math.sin(a));if(i===0)ctx.moveTo(q.x,q.y);else ctx.lineTo(q.x,q.y);}ctx.strokeStyle=col;ctx.lineWidth=1.15;ctx.stroke();}
function rocheContours(P){if(!E.roche.checked)return;ctx.save();ctx.strokeStyle='#bcbaff88';ctx.lineWidth=1.04;ctx.setLineDash([3.6,4]);ctx.beginPath();for(const [a,b] of view.contours){const u=P.project(a[0],a[1]),v=P.project(b[0],b[1]);ctx.moveTo(u.x,u.y);ctx.lineTo(v.x,v.y);}ctx.stroke();ctx.setLineDash([]);ctx.restore();}
function label(x,y,text,align='center'){ctx.font='700 10px system-ui';ctx.textAlign=align;ctx.fillStyle='#d3e9f6';ctx.shadowColor='#000e';ctx.shadowBlur=6;ctx.fillText(text,x,y);ctx.shadowBlur=0;}
function starSphere(x,y,r,kind,t,seed){
 const color=kind==='donor'?['#fff2d2','#ffbb82','#d87258']:kind==='star'?['#ffffff','#b3ddff','#3c7ebb']:['#ffffff','#c9edff','#69a7fa'];
 ctx.save();const glow=ctx.createRadialGradient(x,y,r*.3,x,y,r*2.2);glow.addColorStop(0,kind==='donor'?'#ffac7855':'#8acaff57');glow.addColorStop(1,'#141a2c00');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(x,y,r*2.2,0,TAU);ctx.fill();
 const grad=ctx.createRadialGradient(x-r*.32,y-r*.31,1,x+r*.12,y+r*.14,r*1.13);grad.addColorStop(0,color[0]);grad.addColorStop(.5,color[1]);grad.addColorStop(1,color[2]);ctx.fillStyle=grad;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();
 ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.clip();let rand=randSeed(seed);for(let n=0;n<32;n++){const px=(rand()*2-1)*r,py=(rand()*2-1)*r;if(px*px+py*py>r*r)continue;ctx.fillStyle=kind==='donor'?'#d77b4a18':'#a4c5ff15';ctx.beginPath();ctx.arc(x+px,y+py,3+rand()*r*.13,0,TAU);ctx.fill();}ctx.restore();
}
function drawDisk(P,s,theta,t){if(!(s.diskR>0))return;
 const origin=P.project(1-s.mu,0),rr=s.diskR/s.a*P.sc,flat=Math.max(.16,P.cosi),rot=-.24;
 ctx.save();ctx.translate(origin.x,origin.y);ctx.rotate(rot);
 const halo=ctx.createRadialGradient(0,0,3,0,0,rr*1.4);halo.addColorStop(0,'#bdf8ffbb');halo.addColorStop(.35,'#61cde28c');halo.addColorStop(.7,'#eb9a7255');halo.addColorStop(1,'#050b1500');ctx.save();ctx.scale(1,flat);ctx.fillStyle=halo;ctx.beginPath();ctx.arc(0,0,rr*1.4,0,TAU);ctx.fill();
 for(let i=0;i<8;i++){ctx.strokeStyle=i%2?'#84f0ff55':'#e0b99844';ctx.lineWidth=(i%3===0?2:1);ellipse(ctx,0,0,rr*(.3+i*.09),rr*(.3+i*.09));ctx.stroke();}
 for(const pt of dust){const angle=pt.a+t*.0009*(.7+pt.w),rad=rr*(.19+pt.r*.85),x=Math.cos(angle)*rad,y=Math.sin(angle)*rad;
 ctx.globalAlpha=.25+pt.w*.6;ctx.fillStyle=pt.w>.7?'#e9ffff':'#f4c49c';ctx.beginPath();ctx.arc(x,y,.7+pt.z*1.8,0,TAU);ctx.fill();}ctx.restore();ctx.globalAlpha=1;ctx.restore();
}
function bezier(a,b,c,d,t){const u=1-t;return {x:u*u*u*a.x+3*u*u*t*b.x+3*u*t*t*c.x+t*t*t*d.x,y:u*u*u*a.y+3*u*u*t*b.y+3*u*t*t*c.y+t*t*t*d.y};}
function drawStream(P,s,t){if(!s.overflow||s.kind==='star')return;
 const a={x:s.l1,y:0},b={x:s.l1+.105,y:.12},c={x:1-s.mu-.13,y:.16},d={x:1-s.mu-.04,y:0};
 ctx.save();ctx.globalCompositeOperation='screen';
 const grad=ctx.createLinearGradient(P.project(a.x,a.y).x,P.project(a.x,a.y).y,P.project(d.x,d.y).x,P.project(d.x,d.y).y);grad.addColorStop(0,'#ffc7a5cc');grad.addColorStop(.6,'#ecb99ecc');grad.addColorStop(1,'#8df5ffee');
 ctx.lineWidth=4.4;ctx.strokeStyle=grad;ctx.beginPath();for(let k=0;k<=80;k++){const q=bezier(a,b,c,d,k/80),pos=P.project(q.x,q.y);if(!k)ctx.moveTo(pos.x,pos.y);else ctx.lineTo(pos.x,pos.y);}ctx.shadowBlur=18;ctx.shadowColor='#8be9ffa8';ctx.stroke();ctx.shadowBlur=0;
 for(let k=0;k<22;k++){const v=(k/22+t*.00045*(1+k%3*.22))%1,q=bezier(a,b,c,d,v),pos=P.project(q.x,q.y);ctx.globalAlpha=.45+.45*Math.sin(v*Math.PI);ctx.fillStyle=k%3?'#c9fbff':'#ffc7aa';ctx.beginPath();ctx.arc(pos.x,pos.y,1.2+k%3*.7,0,TAU);ctx.fill();}
 ctx.restore();
}
function drawScene(t){if(!view.system)return;
 const s=view.system,theta=view.phase*TAU+Math.PI/2,P=inScene(s,theta);
 setupBackground(P,t);
 const donorX=-s.mu,acceptX=1-s.mu,st1=P.project(donorX,0),st2=P.project(acceptX,0),bary=P.project(0,0),crit=P.project(s.l1,0);
 orbitRing(P,s.mu,'#639bbf44');orbitRing(P,1-s.mu,'#749bb955');
 rocheContours(P);
 ctx.fillStyle='#8ff8f1';ctx.beginPath();ctx.arc(bary.x,bary.y,3.2,0,TAU);ctx.fill();ctx.strokeStyle='#86d9e44d';ctx.beginPath();ctx.moveTo(bary.x-10,bary.y);ctx.lineTo(bary.x+10,bary.y);ctx.moveTo(bary.x,bary.y-10);ctx.lineTo(bary.x,bary.y+10);ctx.stroke();
 ctx.save();ctx.shadowBlur=16;ctx.shadowColor='#62e6cd';ctx.fillStyle='#6debcf';ctx.beginPath();ctx.arc(crit.x,crit.y,4.5,0,TAU);ctx.fill();ctx.restore();label(crit.x,crit.y-14,'L1');
 drawStream(P,s,t);
 // The disk is placed underneath the stars. View choice only changes visual projection, not photometric inclination.
 drawDisk(P,s,theta,t);
 const r1=clamp(s.r1/s.a*P.sc,10,Math.min(P.w*.28,P.h*.27)),physical2=s.r2/s.a*P.sc;
 const r2=s.kind==='star'?clamp(physical2,9,P.h*.25):s.kind==='white-dwarf'?9:s.kind==='neutron-star'?6:11;
 const bodies=[{type:'donor',point:st1,r:r1},{type:s.kind,point:st2,r:r2}].sort((a,b)=>a.point.depth-b.point.depth);
 for(const body of bodies){const {x,y}=body.point;
  if(body.type==='black-hole'){
   ctx.save();ctx.shadowColor='#ffbc85';ctx.shadowBlur=24;ctx.strokeStyle='#ffbe84';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(x,y,body.r*1.5,body.r*.95,-.2,0,TAU);ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle='#01030a';ctx.beginPath();ctx.arc(x,y,body.r,0,TAU);ctx.fill();ctx.restore();
  }else starSphere(x,y,body.r,body.type==='donor'?'donor':body.type==='star'?'star':'compact',t,body.type==='donor'?170:441);
 }
 if(P.w>550){label(st1.x,st1.y+r1+23,'DONOR • '+fmt(s.m1,1)+' M☉');label(st2.x,st2.y+r2+22,s.kind==='star'?'GWIAZDA':s.kind==='white-dwarf'?'BIAŁY KARZEŁ':s.kind==='neutron-star'?'NEUTRONOWA':'CZARNA DZIURA');}
 E.phase.textContent=fmt(view.phase,2);E.phaseBar.style.width=(view.phase*100).toFixed(2)+'%';
 const f=B.flux(view.phase,s);E.flux.textContent=(f*100).toLocaleString('pl-PL',{maximumFractionDigits:2,minimumFractionDigits:2})+'%';
}
function chartCoords(){const w=E.curve.width/view.dprGraph,h=E.curve.height/view.dprGraph;return {w,h,left:42,right:w-17,top:13,bottom:h-27};}
function drawGraph(){if(!view.system)return;const s=view.system,values=view.curves;const p=chartCoords(),minV=Math.min(.98,Math.min(...values)-.024),maxV=1.025;
 graph.clearRect(0,0,p.w,p.h);const gr=graph.createLinearGradient(0,0,0,p.h);gr.addColorStop(0,'#0b1b2e');gr.addColorStop(1,'#0b1424');graph.fillStyle=gr;graph.fillRect(0,0,p.w,p.h);
 const X=t=>p.left+t*(p.right-p.left),Y=y=>p.top+(maxV-y)/(maxV-minV)*(p.bottom-p.top);
 graph.save();graph.font='10px system-ui';graph.lineWidth=1;
 for(let j=0;j<=4;j++){const flux=minV+(maxV-minV)*j/4,y=Y(flux);graph.strokeStyle='#4d739038';graph.beginPath();graph.moveTo(p.left,y);graph.lineTo(p.right,y);graph.stroke();graph.fillStyle='#8fadc3';graph.textAlign='right';graph.fillText(`${(flux*100).toFixed(0)}%`,p.left-7,y+3);}
 for(let j=0;j<=4;j++){const x=X(j/4);graph.strokeStyle='#6c90ad2a';graph.beginPath();graph.moveTo(x,p.top);graph.lineTo(x,p.bottom);graph.stroke();graph.fillStyle='#83a5c1';graph.textAlign='center';graph.fillText((j/4).toFixed(2),x,p.h-8);}
 const area=graph.createLinearGradient(0,p.top,0,p.bottom);area.addColorStop(0,'#83defd3d');area.addColorStop(1,'#83defd02');graph.beginPath();values.forEach((v,i)=>{if(!i)graph.moveTo(X(0),Y(v));else graph.lineTo(X(i/(values.length-1)),Y(v));});graph.lineTo(p.right,p.bottom);graph.lineTo(p.left,p.bottom);graph.closePath();graph.fillStyle=area;graph.fill();
 graph.beginPath();values.forEach((v,i)=>{if(!i)graph.moveTo(X(0),Y(v));else graph.lineTo(X(i/(values.length-1)),Y(v));});graph.strokeStyle='#8de8ff';graph.lineWidth=2.4;graph.shadowColor='#68d6ff88';graph.shadowBlur=9;graph.stroke();graph.shadowBlur=0;graph.restore();view.graph={X,Y,p};drawPhaseMarker();}
function drawPhaseMarker(){if(!view.graph)return;
 // Efficient redraw of chart is cheap enough at 30fps but avoid point accumulation.
 const {X,Y,p}=view.graph,x=X(view.phase),y=Y(B.flux(view.phase,view.system));
 // preserve the graph by redrawing every four frames? Implement marker in overlay canvas without redrawing full field is not possible.
 // The animation calls redrawChart periodically via timer below; mark on fresh redraw only.
 graph.save();graph.strokeStyle='#f7c697cc';graph.lineWidth=1.3;graph.beginPath();graph.moveTo(x,p.top);graph.lineTo(x,p.bottom);graph.stroke();graph.fillStyle='#ffead6';graph.shadowColor='#ffa568';graph.shadowBlur=13;graph.beginPath();graph.arc(x,y,4.5,0,TAU);graph.fill();graph.restore();
}
function change(){refresh();}
function ready(){const target=location.origin==='null'?'*':location.origin;try{if(parent!==window)parent.postMessage({type:'atlas:portal:ready'},target);}catch(_){} }
function setup(){
 E.presets.innerHTML=presets.map(x=>`<button type="button" data-key="${x.key}">${x.label}</button>`).join('');
 E.presets.addEventListener('click',ev=>{const b=ev.target.closest('button[data-key]');if(!b)return;applyPreset(presets.find(x=>x.key===b.dataset.key).p);});
 for(const key of ['m1','m2','a','fill','incl'])E[key].addEventListener('input',change);
 E.kind.addEventListener('change',()=>{updateKindLimits();change();});E.roche.addEventListener('change',()=>drawScene(performance.now()));E.cam.addEventListener('change',()=>refresh());
 E.pause.addEventListener('click',()=>{view.playing=!view.playing;E.pause.textContent=view.playing?'Ⅱ PAUZA':'▶ ODTWARZAJ';view.last=0;});
 E.restart.addEventListener('click',()=>{view.phase=0;view.last=0;drawGraph();drawScene(performance.now());});
 E.speed.addEventListener('change',()=>{view.speed=Number(E.speed.value);});
 window.addEventListener('resize',resize);
 window.addEventListener('message',ev=>{if(ev.source!==parent)return;if(ev.data?.type==='atlas:portal:ping')ready();});
 document.addEventListener('visibilitychange',()=>{view.last=0;});
 updateKindLimits();refresh();resize();requestAnimationFrame(frame);ready();
}
let lastChart=0;
function frame(t){if(document.hidden){view.last=0;requestAnimationFrame(frame);return;}
 if(!view.last)view.last=t;
 const dt=clamp((t-view.last)/1000,0,.12);view.last=t;
 if(view.playing)view.phase=(view.phase+dt*view.speed)%1;
 // Light curve is redrawn periodically so the marker does not leave trails.
 if(t-lastChart>75){lastChart=t;drawGraph();}
 drawScene(t);
 requestAnimationFrame(frame);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})();
