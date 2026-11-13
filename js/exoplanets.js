/* ATLAS SOLARIS 15.0 — Łowca Egzoplanet
   Scientific educational circular-orbit transit simulator and synthetic photometry.
   Limb-darkened star: I(mu)=1-u1(1-mu)-u2(1-mu)^2. Stellar ring integration.
   Orbital projection: x=-(a/Rs)sin(phi), y=(a/Rs)cos(i)cos(phi), z=(a/Rs)sin(i)cos(phi).
   Data points are SYNTHETIC, never falsely described as original Kepler/TESS observations.
   Catalog values are illustrative NASA snapshots, not uniform fitted solutions. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const TAU=2*Math.PI,DEG=Math.PI/180,AU_RSUN=215.03215567,RSUN_REARTH=109.076,JD_EPOCH=2440587.5;
const CATALOG={
 hd209458:{name:'HD 209458 b',type:'Gorący Jowisz',period:3.52474859,radius:15.58,starR:1.16,starM:1.15,aAU:.04707,inc:86.6,u1:.33,u2:.22,temp:6100,color:'#f5c5a7',source:'https://exoplanetarchive.ipac.caltech.edu/overview/HD_209458',comment:'Jedna z pierwszych planet, dla których zaobserwowano tranzyt i zbadano atmosferę. Parametry złożone z archiwalnych wartości katalogowych.',inclNote:'Nachylenie przyjęte orientacyjnie do demonstracji.'},
 trappist1e:{name:'TRAPPIST-1 e',type:'Planeta skalista',period:6.101013,radius:.92,starR:.121,starM:.089,aAU:.02925,inc:89.793,u1:.18,u2:.24,temp:2550,color:'#ff987a',source:'https://exoplanetarchive.ipac.caltech.edu/overview/TRAPPIST-1',comment:'Niewielka skalista planeta na orbicie wokół ultrachłodnego czerwonego karła. Niski promień gwiazdy ułatwia wykrycie tranzytu.'},
 gj1214:{name:'GJ 1214 b',type:'Subneptun',period:1.58,radius:2.74,starR:.22,starM:.18,aAU:.0149,inc:88.6,u1:.25,u2:.19,temp:3250,color:'#e1abeb',source:'https://science.nasa.gov/asset/webb/exoplanet-gj-1214-b-and-its-star-illustration/',comment:'Planeta o promieniu ok. 2,74 promienia Ziemi, krążąca przed małą gwiazdą typu M.',inclNote:'Nachylenie przyjęte orientacyjnie do demonstracji.'},
 wasp12:{name:'WASP-12 b',type:'Rozgrzany gazowy olbrzym',period:1.1,radius:22.04,starR:1.63,starM:1.35,aAU:.0234,inc:83.3,u1:.33,u2:.18,temp:6300,color:'#ffd18c',source:'https://science.nasa.gov/exoplanet-catalog/wasp-12-b/',comment:'Gorący Jowisz o ogromnym promieniu i wyjątkowo krótkim okresie orbitalnym. Model ignoruje efekty jego deformacji pływowej.',inclNote:'Nachylenie i promień gwiazdy przyjęte orientacyjnie do demonstracji.'},
 kepler22:{name:'Kepler-22 b',type:'Superziemia',period:289.8623,radius:2.1,starR:.979,starM:.97,aAU:.812,inc:89.75,u1:.39,u2:.17,temp:5520,color:'#87c4ef',source:'https://science.nasa.gov/exoplanet-catalog/kepler-22b/',comment:'Planeta o bardzo długim, prawie 290-dniowym okresie. Wykrycie słabego, rzadko powtarzającego się tranzytu jest trudniejsze.',inclNote:'Nachylenie przybliżono na podstawie parametrów tranzytu; dane z różnych publikacji mogą się różnić.'}
};
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v)),fmt=(n,d=2)=>Number(n).toLocaleString('pl-PL',{minimumFractionDigits:d,maximumFractionDigits:d}),round=(n,d=2)=>Number(n.toFixed(d)),nearest=(a,b)=>Math.abs(a-b)<1e-10;
const state={id:'hd209458',period:3.52474859,radius:15.58,starR:1.16,starM:1.15,aAU:.04707,inc:86.6,u1:.33,u2:.22,temp:6100,noise:175,
 t:0,playing:false,rate:1,priorPlaying:null,challenge:false,revealed:false,truth:null,guessRadius:8,guessIncl:89.3,noiseSeed:77,observations:[],windowHours:8,limitHours:16,photModel:[],fitModel:[],orbitTilt:.32,showLD:true};
let raf=0,last=0,dirty=true;
const at=()=>CATALOG[state.id],num=id=>Number($(id).value);
function paramCopy(s=state){return {period:s.period,radius:s.radius,starR:s.starR,starM:s.starM,aAU:s.aAU,inc:s.inc,u1:s.u1,u2:s.u2,temp:s.temp};}
function aRatio(p){
 const preset=CATALOG[state.id];
 const a=(preset.aAU*Math.cbrt((p.starM/preset.starM)*Math.pow(p.period/preset.period,2)));
 return a*AU_RSUN/p.starR;
}
function radiusRatio(p){return p.radius/(p.starR*RSUN_REARTH);}
function orbit(p,h){
 const phase=TAU*(h/24)/p.period,ar=aRatio(p),ci=Math.cos(p.inc*DEG),si=Math.sin(p.inc*DEG);
 return {x:-ar*Math.sin(phase),y:ar*ci*Math.cos(phase),z:ar*si*Math.cos(phase),phase,d:Math.hypot(ar*Math.sin(phase),ar*ci*Math.cos(phase))};
}
function transitDuration(p){
 const ar=aRatio(p),k=radiusRatio(p),b=ar*Math.abs(Math.cos(p.inc*DEG));
 if(b>=1+k)return 0;
 const denominator=ar*Math.abs(Math.sin(p.inc*DEG));
 if(denominator<=0)return 0;
 return (p.period*24/Math.PI)*Math.asin(clamp(Math.sqrt(Math.max(0,(1+k)*(1+k)-b*b))/denominator,0,1));
}
/* Adaptive-geometry stellar radial integration. For uniform brightness this
   converges to exact circle-overlap area, including very small transiting planets.
   Break integral at tangencies r=|d-k|, r=d+k and use r(theta)=lo+(hi-lo)sin²theta
   to smooth square-root endpoint cusps. */
function weights(p){return {u1:p.u1,u2:p.u2,norm:1-p.u1/3-p.u2/6};}
function simpson(fun,a,b,n=96){
 if(!(b>a))return 0;
 const h=(b-a)/n;
 let result=fun(a)+fun(b);
 for(let j=1;j<n;j++)result+=(j%2?4:2)*fun(a+h*j);
 return result*h/3;
}
function intensity(r,w){
 const mu=Math.sqrt(Math.max(0,1-r*r)),one=1-mu;
 return 1-w.u1*one-w.u2*one*one;
}
function lossAt(d,k,w){
 if(d>=1+k||k<=0)return 0;
 if(k>=1+d)return 1;
 const norm=w.norm;
 const fullRadius=Math.min(1,Math.max(0,k-d));
 const core=simpson(r=>2*r*intensity(r,w),0,fullRadius,64);
 const lo=Math.max(0,Math.abs(k-d)),hi=Math.min(1,k+d);
 let partial=0;
 if(d>1e-12&&hi>lo){
  const spread=hi-lo;
  partial=simpson(theta=>{
   const sn=Math.sin(theta),r=lo+spread*sn*sn;
   if(r<=0)return 0;
   const cosang=clamp((r*r+d*d-k*k)/(2*r*d),-1,1);
   const fraction=Math.acos(cosang)/Math.PI;
   return 2*r*intensity(r,w)*fraction*spread*Math.sin(2*theta);
  },0,Math.PI/2,96);
 }
 return clamp((core+partial)/norm,0,1);
}
function flux(p,h,w){
 const o=orbit(p,h);
 return o.z>0?1-lossAt(o.d,radiusRatio(p),w||weights(p)):1;
}
function makeModel(p,hours=state.windowHours,count=301){
 const w=weights(p),arr=[];
 for(let i=0;i<count;i++){const t=(i/(count-1)-.5)*hours;arr.push({h:t,flux:flux(p,t,w)});}
 return arr;
}
function pseudoNoise(seed=737){
 let x=seed>>>0;
 return ()=>{
  x=(Math.imul(1664525,x)+1013904223)>>>0;const u=Math.max(1e-10,(x+.5)/4294967296);
  x=(Math.imul(1664525,x)+1013904223)>>>0;const v=(x+.5)/4294967296;
  return Math.sqrt(-2*Math.log(u))*Math.cos(TAU*v);
 };
}
function generateObservations(p,noisePPM,seed=state.noiseSeed){
 const random=pseudoNoise(seed),w=weights(p),arr=[];
 for(let i=0;i<126;i++){
  const h=(i/125-.5)*state.windowHours;
  const noiseless=flux(p,h,w);
  arr.push({h,raw:noiseless,flux:noiseless+random()*noisePPM*1e-6});
 }
 return arr;
}
function summarize(p){
 const k=radiusRatio(p),b=aRatio(p)*Math.abs(Math.cos(p.inc*DEG)),duration=transitDuration(p),center=flux(p,0);
 return {k,b,duration,depthPPM:(1-center)*1e6,transit:duration>0};
}
function truth(){return state.challenge?state.truth:paramCopy();}
function fitParams(){return {...truth(),radius:state.guessRadius,inc:state.guessIncl};}
function rmsFit(){
 if(!state.challenge)return 0;
 const p=fitParams(),w=weights(p),sum=state.observations.reduce((v,o)=>v+Math.pow((o.flux-flux(p,o.h,w))*1e6,2),0);
 return Math.sqrt(sum/state.observations.length);
}
function choose(id){
 const data=CATALOG[id];if(!data)return;
 Object.assign(state,{id,period:data.period,radius:data.radius,starR:data.starR,starM:data.starM,aAU:data.aAU,inc:data.inc,u1:data.u1,u2:data.u2,temp:data.temp,
 challenge:false,revealed:false,truth:null,playing:false,guessRadius:Math.max(.3,round(data.radius*.65,2)),guessIncl:Math.max(78,round(data.inc-.35,3))});
 const duration=transitDuration(state),edgeOn=transitDuration({...paramCopy(),inc:90});
 state.windowHours=clamp(Math.max(duration,edgeOn,0.3)*3.6,1.8,40);
 state.t=0;state.noiseSeed=137+Object.keys(CATALOG).indexOf(id)*29;
 state.observations=generateObservations(state,state.noise,state.noiseSeed);
 state.photModel=makeModel(state);
 state.fitModel=[];
 $('exoPreset').value=id;
 syncInputs();syncInfo();draw();
}
function syncInputs(){
 const pairs=[['exoRadius',state.radius],['exoStarR',state.starR],['exoStarM',state.starM],['exoPeriod',state.period],['exoIncl',state.inc],['exoU1',state.u1],['exoU2',state.u2],['exoNoise',state.noise],['exoGuessR',state.guessRadius],['exoGuessI',state.guessIncl],['exoRate',state.rate]];
 for(const [id,val]of pairs)$(id).value=val;
}
function syncInfo(){
 const p=paramCopy(),T=summarize(p),hidden=state.challenge;
 const table={
 exoRadiusV:hidden?'??? R⊕':fmt(p.radius,2)+' R⊕',
 exoStarRV:fmt(p.starR,3)+' R☉',exoStarMV:fmt(p.starM,3)+' M☉',
 exoPeriodV:fmt(p.period,3)+' d',exoInclV:hidden?'???°':fmt(p.inc,3)+'°',
 exoU1V:fmt(p.u1,2),exoU2V:fmt(p.u2,2),exoNoiseV:fmt(state.noise,0)+' ppm',
 exoGuessRV:fmt(state.guessRadius,2)+' R⊕',exoGuessIV:fmt(state.guessIncl,3)+'°',
 exoKnownStar:'Dane gwiazdy: R★ = '+fmt(p.starR,3)+' R☉; a/R★ = '+fmt(aRatio(p),2)+'; okres P = '+fmt(p.period,3)+' d.',
 exoAR:fmt(aRatio(p),2),exoImpact:hidden?'???':fmt(T.b,3),
 exoDepth:hidden?'???':fmt(T.depthPPM,0)+' ppm',
 exoDuration:hidden?'???':T.transit?fmt(T.duration,2)+' h':'brak tranzytu',
 exoTransit:T.transit?'TAK — PLANETA PRZECHODZI PRZED GWIAZDĄ':'NIE — ORBITA NIE PRZECINA TARCZY GWIAZDY',
 exoTime:fmt(state.t,2)+' h',exoPhase:fmt(100*state.t/(state.period*24),2)+'% okresu',
 exoStatus:state.playing?'REJESTRACJA TRWA':'REJESTRACJA ZATRZYMANA',
 exoStarTitle:at().name+' · '+at().type,
 exoStarDesc:at().comment,
 exoNote:at().inclNote||'Parametry źródłowe mogą pochodzić z różnych publikacji; używamy uproszczonej orbity kołowej.'
 };
 for(const [id,value]of Object.entries(table))$(id).textContent=value;
 $('exoTransit').className=T.transit?'exo-transit-yes':'exo-transit-no';
 $('exoPlay').textContent=state.playing?'Ⅱ Pauza':state.t>=state.windowHours/2?'↻ Powtórz':'▶ Odtwórz tranzyt';
 $('exoTimeSlider').value=String(Math.round((state.t/state.windowHours+.5)*1000));
 $('exoSource').href=at().source;
 $('exoChallengeMode').textContent=state.challenge?'Zakończ zagadkę':'◈ Tryb odkrywcy';
 $('exoChallengeSection').hidden=!state.challenge;
 $('exoKnownSection').classList.toggle('exo-masked',hidden);
 $('exoFitResult').textContent=state.challenge?(state.revealed?'ODKRYTO · '+fmt(state.radius,2)+' R⊕ · i = '+fmt(state.inc,3)+'°':'Zmień rozmiar i nachylenie, aby dopasować linię do pomiarów.'):'Wybierz „Tryb odkrywcy”, aby spróbować wyznaczyć parametry planety.';
 $('exoRMS').textContent=state.challenge?fmt(rmsFit(),0)+' ppm':'—';
 $('exoExplain').textContent=state.challenge?'Kropki to syntetyczne pomiary z losowym szumem; linia oznacza Twoją próbę dopasowania.':'Kropki to generowane sztucznie pomiary; ciągła linia to model fotometrii z ciemnieniem brzegowym.';
}
function recalculate(){
 state.radius=num('exoRadius');state.starR=num('exoStarR');state.starM=num('exoStarM');state.period=num('exoPeriod');state.inc=num('exoIncl');
 state.u1=num('exoU1');state.u2=num('exoU2');state.noise=num('exoNoise');
 const duration=transitDuration(state),edgeOn=transitDuration({...paramCopy(),inc:90});
 state.windowHours=clamp(Math.max(duration,edgeOn,.3)*3.6,1.8,40);
 state.t=clamp(state.t,-state.windowHours/2,state.windowHours/2);
 state.observations=generateObservations(state,state.noise,state.noiseSeed);
 state.photModel=makeModel(state);
 syncInfo();draw();
}
function beginChallenge(){
 if(state.challenge){state.challenge=false;state.truth=null;state.revealed=false;state.photModel=makeModel(state);syncInfo();draw();return;}
 state.truth=paramCopy();state.challenge=true;state.revealed=false;state.playing=false;state.guessRadius=clamp(round(state.radius*.68,2),.2,26);
 state.guessIncl=clamp(round(state.inc-0.35,3),75,90);
 state.observations=generateObservations(state.truth,state.noise,state.noiseSeed);
 state.fitModel=makeModel(fitParams());
 syncInputs();syncInfo();draw();
}
function reveal(){
 if(!state.challenge)return;
 state.revealed=true;
 const errR=Math.abs(state.guessRadius-state.radius)/Math.max(state.radius,.01)*100;
 const errI=Math.abs(state.guessIncl-state.inc);
 $('exoFeedback').textContent='Błąd promienia: '+fmt(errR,1)+'%. Błąd nachylenia: '+fmt(errI,3)+'°. '+(rmsFit()<state.noise*1.5?'Dobre dopasowanie obserwacji!':'Możesz poprawić dopasowanie i porównać je ponownie.');
 syncInfo();draw();
}
function guessChanged(){
 state.guessRadius=num('exoGuessR');state.guessIncl=num('exoGuessI');
 if(state.challenge)state.fitModel=makeModel(fitParams());
 syncInfo();draw();
}
function canvas(c,width=600,height=300){
 const w=Math.max(280,c.clientWidth||width),h=Math.max(190,c.clientHeight||height),dpr=Math.min(2,window.devicePixelRatio||1);
 if(c.width!==Math.round(w*dpr)||c.height!==Math.round(h*dpr)){c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);}
 const ctx=c.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);
 return {ctx,w,h};
}
function drawScene(){
 const c=$('exoStarCanvas');if(!c)return;
 const {ctx,w,h}=canvas(c,600,360),starR=Math.min(w*.18,h*.29),cx=w*.36,cy=h*.49;
 ctx.fillStyle='#03101e';ctx.fillRect(0,0,w,h);
 for(let i=0;i<115;i++){const x=(i*157.37+13)%w,y=(i*57.11+41)%h;ctx.fillStyle=i%12===0?'#a9d7f2ab':'#b4d9ed44';ctx.fillRect(x,y,1,1);}
 const t=orbit(state,state.t),k=radiusRatio(state),diskR=Math.max(1.3,starR*k),pixX=cx+t.x*starR,pixY=cy-t.y*starR;
 const gradient=ctx.createRadialGradient(cx-starR*.25,cy-starR*.28,starR*.04,cx,cy,starR);
 const temp=state.temp;
 const colors=temp<3500?['#fff2db','#f4ad88','#883d42']:temp<5600?['#fff9e4','#ffca8c','#a66945']:['#fffdf1','#f0e2b1','#957d6a'];
 gradient.addColorStop(0,colors[0]);gradient.addColorStop(.56,colors[1]);gradient.addColorStop(1,colors[2]);
 ctx.shadowColor=temp<3500?'#ff8055':'#ffe2a1';ctx.shadowBlur=28;ctx.fillStyle=gradient;ctx.beginPath();ctx.arc(cx,cy,starR,0,TAU);ctx.fill();ctx.shadowBlur=0;
 if(t.z>0){ctx.fillStyle='#10223a';ctx.beginPath();ctx.arc(pixX,pixY,diskR,0,TAU);ctx.fill();ctx.strokeStyle='#7896af';ctx.lineWidth=.6;ctx.stroke();}
 else if(Math.hypot(t.x,t.y)<3){ctx.fillStyle='#678baa44';ctx.beginPath();ctx.arc(pixX,pixY,diskR,0,TAU);ctx.fill();}
 ctx.fillStyle='#b7d5e7';ctx.font='700 12px system-ui';ctx.fillText('WIDOK Z ODLEGŁEGO TELESKOPU',17,24);
 ctx.font='11px system-ui';ctx.fillStyle='#85a5bd';ctx.fillText('Względne promienie; bardzo małe tarcze mają minimum pikselowe.',17,h-20);
 const info=[
 ['ŚRODEK TRANZYTU',fmt(100*(1-flux(state,state.t)),4)+'% spadku jasności'],
 ['PROMIEŃ PLANETY',state.challenge&&!state.revealed?'UKRYTY':fmt(state.radius,2)+' R⊕'],
 ['PRZEBIEG',orbit(state,state.t).z>0?'przed gwiazdą':'za gwiazdą']
 ];
 const x=w*.65;
 info.forEach(([label,val],i)=>{ctx.font='700 9px system-ui';ctx.fillStyle='#7db6cb';ctx.fillText(label,x,45+i*56);ctx.font='650 12px system-ui';ctx.fillStyle='#e0f8ff';ctx.fillText(val,x,64+i*56);});
}
function drawOrbit(){
 const c=$('exoOrbitCanvas');if(!c)return;
 const {ctx,w,h}=canvas(c,420,235),ox=w*.5,oy=h*.52;
 ctx.fillStyle='#061625';ctx.fillRect(0,0,w,h);
 const rad=Math.min(w*.33,h*.38),cy=.4;
 ctx.save();ctx.translate(ox,oy);
 ctx.beginPath();ctx.ellipse(0,0,rad,rad*.49,state.orbitTilt,0,TAU);
 ctx.strokeStyle='#6babbc77';ctx.lineWidth=1.4;ctx.stroke();
 ctx.beginPath();ctx.arc(0,0,9,0,TAU);ctx.fillStyle=state.temp<3500?'#ee9b83':'#ffdaa2';ctx.shadowColor='#e3b690';ctx.shadowBlur=14;ctx.fill();ctx.shadowBlur=0;
 const angle=TAU*(state.t/24)/state.period+Math.PI*.5;
 const px=Math.cos(angle)*rad,py=Math.sin(angle)*rad*.49;
 const xr=px*Math.cos(state.orbitTilt)-py*Math.sin(state.orbitTilt),yr=px*Math.sin(state.orbitTilt)+py*Math.cos(state.orbitTilt);
 ctx.beginPath();ctx.arc(xr,yr,4.5,0,TAU);ctx.fillStyle='#bceafa';ctx.fill();
 ctx.strokeStyle='#bceafabb';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(xr,yr);ctx.stroke();
 ctx.restore();
 ctx.fillStyle='#a6becd';ctx.font='10px system-ui';ctx.fillText('ORBITA — WIDOK POGLĄDOWY 3D',12,19);
 ctx.fillStyle='#729ab0';ctx.font='10px system-ui';ctx.fillText('Geometria ma charakter orientacyjny, nie skala a/R★.',12,h-15);
}
function drawChart(){
 const c=$('exoChart');if(!c)return;
 const {ctx,w,h}=canvas(c,760,330);
 ctx.fillStyle='#071525';ctx.fillRect(0,0,w,h);
 const pad={l:56,r:18,t:22,b:40},x0=pad.l,x1=w-pad.r,y0=pad.t,y1=h-pad.b;
 const truthP=truth(),model=state.challenge?state.fitModel:state.photModel;
 const stats=summarize(truthP);
 const depth=Math.max(0,stats.depthPPM),noise=state.noise;
 const yRange=Math.max(200,depth*1.45,noise*5,500);
 const minFlux=1-yRange*1e-6;
 const xx=h=>x0+(h/state.windowHours+.5)*(x1-x0),yy=f=>y0+(1-f)/(1-minFlux)*(y1-y0);
 ctx.strokeStyle='#35536c';ctx.lineWidth=1;ctx.strokeRect(x0,y0,x1-x0,y1-y0);
 ctx.font='10px system-ui';ctx.textAlign='right';ctx.fillStyle='#87abc1';
 for(let i=0;i<=4;i++){
  const f=1-(yRange*1e-6)*i/4,y=yy(f);
  ctx.strokeStyle='#3c52672c';ctx.beginPath();ctx.moveTo(x0,y);ctx.lineTo(x1,y);ctx.stroke();
  ctx.fillStyle='#8dacbc';ctx.fillText(fmt(f,5),x0-8,y+3);
 }
 ctx.textAlign='center';ctx.fillStyle='#96bdc9';
 for(let i=0;i<=4;i++){const hour=(i/4-.5)*state.windowHours,x=xx(hour);ctx.fillText(fmt(hour,1)+'h',x,y1+19);}
 ctx.font='700 10px system-ui';ctx.fillStyle='#aad4e2';ctx.fillText('GODZINY WZGLĘDEM ŚRODKA TRANZYTU',x0+(x1-x0)/2,h-7);
 const drawLine=(arr,col,width,dashed=false)=>{
  if(!arr?.length)return;
  ctx.beginPath();
  arr.forEach((p,i)=>{const x=xx(p.h),y=yy(p.flux);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});
  ctx.strokeStyle=col;ctx.lineWidth=width;ctx.setLineDash(dashed?[6,5]:[]);ctx.stroke();ctx.setLineDash([]);
 };
 if(!state.challenge)drawLine(state.photModel,'#5df0d4',2.5);
 else drawLine(model,'#8fe6c7',2.8);
 ctx.fillStyle='#b8dbfbab';const pointR=w<500?1.45:2;
 state.observations.forEach(o=>{ctx.beginPath();ctx.arc(xx(o.h),yy(o.flux),pointR,0,TAU);ctx.fill();});
 const cursorX=xx(state.t);ctx.strokeStyle='#ffffff99';ctx.lineWidth=1;ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(cursorX,y0);ctx.lineTo(cursorX,y1);ctx.stroke();ctx.setLineDash([]);
 ctx.fillStyle='#b7edeb';ctx.font='700 10px system-ui';ctx.textAlign='left';
 ctx.fillText(state.challenge?'OBSERWACJE SYNTETYCZNE + TWOJA HIPOTEZA':'SYNTETYCZNA KRZYWA JASNOŚCI',x0+7,y0+16);
}
function draw(){if(!$('exoDialog')?.open)return;drawScene();drawOrbit();drawChart();}
function show(){
 const d=$('exoDialog');if(d.open)return;
 state.priorPlaying=window.ATLAS_MAIN_API?.getPlaying?.()??null;
 window.ATLAS_MAIN_API?.setPlaying?.(false);
 d.showModal();syncInfo();draw();
 if(!raf)raf=requestAnimationFrame(frame);
}
function close(){state.playing=false;$('exoDialog').close();}
function frame(now){
 raf=0;if(!$('exoDialog')?.open)return;
 const dt=last?clamp((now-last)/1000,0,.08):0;last=now;
 if(state.playing){
  state.t=clamp(state.t+dt*state.rate*state.windowHours/18,-state.windowHours/2,state.windowHours/2);
  if(state.t>=state.windowHours/2)state.playing=false;
  syncInfo();draw();
 }
 raf=requestAnimationFrame(frame);
}
function init(){
 if(!$('exoDialog'))return;
 for(const [id,e]of Object.entries(CATALOG)){
  const op=document.createElement('option');op.value=id;op.textContent=e.name;$('exoPreset').appendChild(op);
 }
 $('openExoplanets').onclick=show;$('openExoplanetsSide').onclick=show;$('exoClose').onclick=close;
 $('exoDialog').addEventListener('close',()=>{
  state.playing=false;last=0;if(raf){cancelAnimationFrame(raf);raf=0;}
  if(state.priorPlaying!==null)window.ATLAS_MAIN_API?.setPlaying?.(state.priorPlaying);
  state.priorPlaying=null;
 });
 $('exoPreset').onchange=()=>choose($('exoPreset').value);
 for(const id of ['exoRadius','exoStarR','exoStarM','exoPeriod','exoIncl','exoU1','exoU2'])$(id).oninput=()=>{
  if(state.challenge)return;
  recalculate();
 };
 $('exoNoise').oninput=()=>{state.noise=num('exoNoise');state.observations=generateObservations(truth(),state.noise,state.noiseSeed);syncInfo();draw();};
 for(const id of ['exoGuessR','exoGuessI'])$(id).oninput=guessChanged;
 $('exoChallengeMode').onclick=beginChallenge;$('exoReveal').onclick=reveal;
 $('exoPlay').onclick=()=>{if(state.t>=state.windowHours/2)state.t=-state.windowHours/2;state.playing=!state.playing;syncInfo();};
 $('exoReset').onclick=()=>{state.playing=false;state.t=-state.windowHours/2;syncInfo();draw();};
 $('exoTimeSlider').oninput=()=>{state.playing=false;state.t=(num('exoTimeSlider')/1000-.5)*state.windowHours;syncInfo();draw();};
 $('exoRate').onchange=()=>{state.rate=num('exoRate');};
 $('exoNewNoise').onclick=()=>{state.noiseSeed+=379;state.observations=generateObservations(truth(),state.noise,state.noiseSeed);syncInfo();draw();};
 $('exoExport').onclick=()=>{
  const csv=['# ATLAS SOLARIS 15.0 - SYNTETYCZNE obserwacje, nie dane oryginalne Kepler/TESS',
    '# NASA catalog example '+at().name+'; simulated circular orbit and quadratic limb darkening',
    'time_hours;flux_normalized;flux_without_noise',
    ...state.observations.map(o=>[o.h.toFixed(5),o.flux.toFixed(8),o.raw.toFixed(8)].join(';'))].join('\r\n');
  const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='ATLAS_SOLARIS_15_syntetyczna_fotometria.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
 };
 window.addEventListener('resize',draw);
 choose('hd209458');state.t=-state.windowHours/2;syncInfo();
 window.ATLAS_EXO_TEST={CATALOG,state,orbit,weights,lossAt,flux,transitDuration,summarize,radiusRatio,aRatio,generateObservations,pseudoNoise,rmsFit,choose,beginChallenge,fitParams,show};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();