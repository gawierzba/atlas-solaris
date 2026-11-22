/* ATLAS SOLARIS XVII — eclipse shadow geometry.
   Sun-Earth-Moon ideal circular sections, lunar inclination, umbra,
   antumbra, penumbra. No dates, no local visibility predictions.
   Canvas 2D only; optional animation respects reduced motion. */
(function(){
'use strict';
var SUN_R=695700,EARTH_R=6371,MOON_R=1737.4,AU=149597870.7,TILT_DEG=5.145;
function rad(x){return x*Math.PI/180;}
function moonLatitudeDeg(nodeDeg){
 if(!Number.isFinite(nodeDeg))return NaN;
 return Math.asin(Math.sin(rad(TILT_DEG))*Math.sin(rad(nodeDeg)))*180/Math.PI;
}
function axisOffsetKm(distanceKm,nodeDeg){
 return distanceKm>0?Math.abs(distanceKm*Math.tan(rad(moonLatitudeDeg(nodeDeg)))):NaN;
}
function shadowRadii(sourceR,occulterR,sourceToOcculterKm,targetDistanceKm){
 // Signed umbral radius. Negative = antumbra section beyond the cone vertex.
 return {core:occulterR-(sourceR-occulterR)*targetDistanceKm/sourceToOcculterKm,
         penumbra:occulterR+(sourceR+occulterR)*targetDistanceKm/sourceToOcculterKm};
}
function solarEclipse(distanceKm,nodeDeg){
 if(!(distanceKm>0&&distanceKm<AU)||!Number.isFinite(nodeDeg))return null;
 var rr=shadowRadii(SUN_R,MOON_R,AU-distanceKm,distanceKm);
 var axis=axisOffsetKm(distanceKm,nodeDeg);
 var coreAbs=Math.abs(rr.core);
 var kind;
 if(axis<=EARTH_R+coreAbs)kind=rr.core>=0?'total':'annular';
 else if(axis<=EARTH_R+rr.penumbra)kind='partial';
 else kind='none';
 return {mode:'solar',kind:kind,coreKm:rr.core,penumbraKm:rr.penumbra,
   axisKm:axis,latitudeDeg:moonLatitudeDeg(nodeDeg),distanceKm:distanceKm,
   nodeDeg:nodeDeg,umbraLengthKm:MOON_R*(AU-distanceKm)/(SUN_R-MOON_R)};
}
function lunarEclipse(distanceKm,nodeDeg){
 if(!(distanceKm>0&&distanceKm<AU)||!Number.isFinite(nodeDeg))return null;
 var rr=shadowRadii(SUN_R,EARTH_R,AU,distanceKm);
 var axis=axisOffsetKm(distanceKm,nodeDeg);
 var kind;
 if(axis<=rr.core-MOON_R)kind='total';
 else if(axis<=rr.core+MOON_R)kind='partial';
 else if(axis<=rr.penumbra+MOON_R)kind='penumbral';
 else kind='none';
 return {mode:'lunar',kind:kind,coreKm:rr.core,penumbraKm:rr.penumbra,
   axisKm:axis,latitudeDeg:moonLatitudeDeg(nodeDeg),distanceKm:distanceKm,nodeDeg:nodeDeg,
   umbraLengthKm:EARTH_R*AU/(SUN_R-EARTH_R)};
}
function calculate(mode,distanceKm,nodeDeg){
 if(mode==='solar')return solarEclipse(distanceKm,nodeDeg);
 if(mode==='lunar')return lunarEclipse(distanceKm,nodeDeg);
 return null;
}
window.ATLAS_EC17_PHYSICS={SUN_R:SUN_R,EARTH_R:EARTH_R,MOON_R:MOON_R,AU:AU,TILT_DEG:TILT_DEG,
 moonLatitudeDeg:moonLatitudeDeg,axisOffsetKm:axisOffsetKm,shadowRadii:shadowRadii,
 solarEclipse:solarEclipse,lunarEclipse:lunarEclipse,calculate:calculate};
function init(){
 var canvas=document.getElementById('ec17Canvas');if(!canvas||!canvas.getContext)return;
 var ctx=canvas.getContext('2d');if(!ctx)return;
 var root=document.getElementById('ec17LabFrame'),node=document.getElementById('ec17Node'),
 distance=document.getElementById('ec17MoonDistance');
 var solarBtn=document.getElementById('ec17Solar'),lunarBtn=document.getElementById('ec17Lunar'),
 play=document.getElementById('ec17Animate'),reset=document.getElementById('ec17Reset');
 if(!node||!distance||!solarBtn||!lunarBtn)return;
 var presets=[].slice.call(document.querySelectorAll('[data-ec17-preset]'));
 var mode='solar',frame=0,last=0,phase=0,visible=false;
 var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 var animated=!reduce;
 function fmt(x,d){return Number(x).toLocaleString('pl-PL',{minimumFractionDigits:d,maximumFractionDigits:d});}
 function text(id,s){var x=document.getElementById(id);if(x)x.textContent=s;}
 var names={total:'CAŁKOWITE',annular:'OBRĄCZKOWE',partial:'CZĘŚCIOWE',penumbral:'PÓŁCIENIOWE',none:'BRAK'};
 var notes={
 solar:{total:'W tym idealizowanym przekroju pełny cień Księżyca może dosięgnąć Ziemi. Rzeczywiste pasy widoczności wymagają dokładniejszej geometrii.',annular:'Końcówka stożka pełnego cienia znajduje się przed Ziemią. W antumbrze możliwy jest jasny pierścień Słońca.',partial:'Obszar półcienia może przeciąć Ziemię, ale centralny stożek cienia nie zachodzi na jej przekrój.',none:'Oś cienia przechodzi dostatecznie daleko od Ziemi. W tym modelu nie dochodzi do zaćmienia Słońca.'},
 lunar:{total:'Cała tarcza Księżyca mieści się w pełnym cieniu Ziemi. To model zaćmienia całkowitego Księżyca.',partial:'Część tarczy Księżyca wchodzi w pełny cień Ziemi. To model zaćmienia częściowego.',penumbral:'Księżyc przechodzi tylko przez półcień Ziemi. Takie zaćmienie bywa bardzo subtelne.',none:'Księżyc omija zarówno pełny cień, jak i półcień Ziemi.'}
 };
 function current(){return calculate(mode,Number(distance.value),Number(node.value));}
 function update(){
  var s=current();if(!s)return;
  text('ec17NodeValue',fmt(Number(node.value),1)+'°');
  text('ec17DistanceValue',fmt(Number(distance.value),0)+' km');
  text('ec17ResultType',names[s.kind]);text('ec17Latitude',fmt(s.latitudeDeg,3)+'°');
  text('ec17Axis',fmt(s.axisKm,0)+' km');
  text('ec17Core',fmt(Math.abs(s.coreKm),1)+' km'+(s.coreKm<0?'*':''));
  text('ec17Explanation',notes[mode][s.kind]+(s.coreKm<0?' *Promień antumbry, nie umbry.':''));
  solarBtn.classList.toggle('is-active',mode==='solar');lunarBtn.classList.toggle('is-active',mode==='lunar');
  solarBtn.setAttribute('aria-pressed',String(mode==='solar'));lunarBtn.setAttribute('aria-pressed',String(mode==='lunar'));
  presets.forEach(function(btn){
   var p=btn.getAttribute('data-ec17-preset'),expected=(mode==='solar'?{
     total:[0,360000],annular:[0,407000],partial:[14,384000],none:[20,384000]
   }:{total:[0,384000],annular:[15.5,384000],partial:[8.5,384000],none:[20,384000]})[p];
   var selected=expected&&Number(node.value)===expected[0]&&Number(distance.value)===expected[1];
   btn.classList.toggle('is-active',!!selected);btn.setAttribute('aria-pressed',String(!!selected));
   if(p==='annular')btn.textContent=mode==='solar'?'Obrączkowe':'Półcieniowe';
  });
  draw();
 }
 function setPreset(p){
  var values=(mode==='solar'?{total:[0,360000],annular:[0,407000],partial:[14,384000],none:[20,384000]}:
    {total:[0,384000],annular:[15.5,384000],partial:[8.5,384000],none:[20,384000]})[p];
  if(!values)return;
  node.value=String(values[0]);distance.value=String(values[1]);phase=0;update();
 }
 function dot(cx,cy,r,color){ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();}
 function line(x1,y1,x2,y2,col,width,dash){
  ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);
  ctx.strokeStyle=col;ctx.lineWidth=width||1;if(dash)ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([]);
 }
 function glow(cx,cy,r,color){
  var g=ctx.createRadialGradient(cx,cy,0,cx,cy,r);
  g.addColorStop(0,color);g.addColorStop(1,'rgba(14,25,48,0)');
  dot(cx,cy,r,g);
 }
 function disc(cx,cy,r,variant){
  var g=ctx.createRadialGradient(cx-r*.33,cy-r*.33,1,cx,cy,r);
  if(variant==='sun'){g.addColorStop(0,'#fff7dc');g.addColorStop(.6,'#f4bc8e');g.addColorStop(1,'#bd5961');glow(cx,cy,r*2.6,'rgba(242,162,126,.24)');}
  else if(variant==='earth'){g.addColorStop(0,'#e7f3fd');g.addColorStop(.4,'#6d9dcc');g.addColorStop(1,'#173054');glow(cx,cy,r*2.5,'rgba(112,158,218,.22)');}
  else if(variant==='redmoon'){g.addColorStop(0,'#f2b1a0');g.addColorStop(.65,'#af4b54');g.addColorStop(1,'#402437');}
  else{g.addColorStop(0,'#eee4e4');g.addColorStop(.55,'#a2a6bc');g.addColorStop(1,'#35364e');}
  dot(cx,cy,r,g);
  ctx.strokeStyle=variant==='sun'?'#fff0cb':'rgba(236,239,250,.5)';
  ctx.lineWidth=1;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();
 }
 function draw(){
  var w=canvas.clientWidth||730,h=canvas.clientHeight||620;if(w<20||h<20)return;
  var dpr=Math.min(window.devicePixelRatio||1,1.7);if(w*dpr>1600)dpr=1600/w;
  var cw=Math.round(w*dpr),ch=Math.round(h*dpr);if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw;canvas.height=ch;}
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  var bg=ctx.createRadialGradient(w*.53,h*.4,4,w*.5,h*.48,Math.max(w,h)*.8);
  bg.addColorStop(0,'#1a2442');bg.addColorStop(.58,'#0b1730');bg.addColorStop(1,'#050b1a');
  ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
  for(var i=0;i<110;i++){var x=Math.sin(i*27.31+4.9)*43758.5;var xx=(x-Math.floor(x))*w;var y=Math.sin(i*31.34+24.2)*9362.7;var yy=(y-Math.floor(y))*h;dot(xx,yy,.4+((i*7)%6)*.12,'rgba(231,230,251,.34)');}
  var s=current();if(!s)return;
  var left=w*.14,mid=w*.48,right=w*.84;
  var y0=h*.35,spread=Math.min(110,w*.145),shift=Math.min(spread*1.25,(s.axisKm/(EARTH_R+s.penumbraKm+3000))*spread*1.7);
  var sourceX=left,targetX=right,occX=mid,sourceY=y0,occY=y0;
  var coreP=Math.max(5,Math.min(24,Math.abs(s.coreKm)/160)),penP=Math.max(33,Math.min(70,s.penumbraKm/110));
  if(mode==='solar'){
   var moonY=y0-shift*.55,earthY=y0;
   ctx.fillStyle='rgba(170,187,240,.10)';
   ctx.beginPath();ctx.moveTo(mid,moonY-13);ctx.lineTo(right,earthY-penP);ctx.lineTo(right,earthY+penP);ctx.lineTo(mid,moonY+13);ctx.closePath();ctx.fill();
   ctx.fillStyle=s.coreKm>=0?'rgba(111,136,194,.28)':'rgba(214,122,161,.25)';
   ctx.beginPath();ctx.moveTo(mid,moonY-8);ctx.lineTo(right,earthY+shift*.6-coreP);ctx.lineTo(right,earthY+shift*.6+coreP);ctx.lineTo(mid,moonY+8);ctx.closePath();ctx.fill();
   disc(left,y0,Math.min(50,w*.09),'sun');
   disc(mid,moonY,Math.max(12,Math.min(19,w*.036)),'moon');
   disc(right,earthY,Math.max(27,Math.min(42,w*.069)),'earth');
   line(mid,moonY,right,earthY+shift*.6,'rgba(240,177,198,.54)',1.2,[5,6]);
  }else{
   var moonY=y0-shift*.63;
   ctx.fillStyle='rgba(141,170,226,.13)';
   ctx.beginPath();ctx.moveTo(mid,y0-20);ctx.lineTo(right,y0-penP);ctx.lineTo(right,y0+penP);ctx.lineTo(mid,y0+20);ctx.closePath();ctx.fill();
   ctx.fillStyle='rgba(30,43,82,.72)';
   ctx.beginPath();ctx.moveTo(mid,y0-16);ctx.lineTo(right,y0-coreP);ctx.lineTo(right,y0+coreP);ctx.lineTo(mid,y0+16);ctx.closePath();ctx.fill();
   disc(left,y0,Math.min(50,w*.09),'sun');
   disc(mid,y0,Math.max(23,Math.min(38,w*.06)),'earth');
   disc(right,moonY,Math.max(13,Math.min(22,w*.039)),s.kind==='total'?'redmoon':'moon');
   line(mid,y0,right,moonY,'rgba(221,172,207,.54)',1.1,[5,6]);
  }
  // A tiny traveling highlight represents the passage of a light signal.
  // The body positions themselves are NOT time-accurate trajectories.
  var frac=(phase%1),rayX=left+(right-left)*frac;
  var rayY=y0+(mode==='solar'?-shift*.10:0)*frac;
  ctx.beginPath();ctx.arc(rayX,rayY,2.5+1.1*Math.sin(phase*6)*Math.sin(phase*6),0,Math.PI*2);
  ctx.fillStyle='rgba(241,221,252,.75)';ctx.fill();
  ctx.font='700 10px Arial,sans-serif';ctx.fillStyle='#dbe5f6';ctx.textAlign='center';
  ctx.fillText('SŁOŃCE',left,Math.max(45,y0-68));
  ctx.fillText(mode==='solar'?'KSIĘŻYC':'ZIEMIA',mid,Math.max(45,y0-75));
  ctx.fillText(mode==='solar'?'ZIEMIA':'KSIĘŻYC',right,Math.max(45,y0-74));
  var boxTop=h*.63,boxHeight=Math.min(160,h*.24),bx=w*.12,bw=w*.76;
  ctx.fillStyle='rgba(9,22,43,.68)';ctx.fillRect(bx,boxTop,bw,boxHeight);
  ctx.strokeStyle='rgba(104,138,184,.45)';ctx.strokeRect(bx,boxTop,bw,boxHeight);
  ctx.textAlign='left';ctx.font='700 10px Arial,sans-serif';ctx.fillStyle='#acc6dc';
  ctx.fillText(mode==='solar'?'PRZEKRÓJ CIENIA NA PŁASZCZYŹNIE ZIEMI':'PRZEKRÓJ CIENIA ZIEMI NA PŁASZCZYŹNIE KSIĘŻYCA',bx+15,boxTop+23);
  var plotCenterX=bx+bw*.49,plotCenterY=boxTop+boxHeight*.62;
  var earthPlotRadius=mode==='solar'?Math.min(48,boxHeight*.3):Math.min(22,boxHeight*.17);
  var targetR=mode==='solar'?earthPlotRadius:Math.min(14,boxHeight*.12);
  var coreScaled=mode==='solar'?Math.max(3,Math.min(12,Math.abs(s.coreKm)/(EARTH_R+s.penumbraKm)*55)):Math.min(38,Math.abs(s.coreKm)/(s.penumbraKm+MOON_R)*51);
  var penScaled=mode==='solar'?Math.min(28,s.penumbraKm/(EARTH_R+s.penumbraKm)*66):Math.min(56,s.penumbraKm/(s.penumbraKm+MOON_R)*63);
  var targetY=plotCenterY+Math.min(boxHeight*.32,s.axisKm/(EARTH_R+s.penumbraKm+MOON_R)*boxHeight*.42);
  dot(plotCenterX,plotCenterY,penScaled,'rgba(141,171,222,.12)');
  dot(plotCenterX,plotCenterY,coreScaled,'rgba(112,121,182,.52)');
  dot(plotCenterX,plotCenterY,s.coreKm<0?coreScaled:1,'rgba(213,128,176,.3)');
  ctx.strokeStyle='rgba(220,219,248,.4)';ctx.lineWidth=1;
  ctx.beginPath();ctx.arc(plotCenterX,plotCenterY,penScaled,0,Math.PI*2);ctx.stroke();
  ctx.beginPath();ctx.arc(plotCenterX,plotCenterY,coreScaled,0,Math.PI*2);ctx.stroke();
  dot(plotCenterX,targetY,targetR,mode==='solar'?'rgba(96,160,209,.78)':s.kind==='total'?'rgba(211,100,89,.85)':'rgba(207,212,225,.86)');
  ctx.beginPath();ctx.arc(plotCenterX,targetY,targetR,0,Math.PI*2);ctx.strokeStyle='#dbeafd';ctx.lineWidth=1.3;ctx.stroke();
  ctx.fillStyle=s.kind==='none'?'#eea5af':'#c7e5ef';ctx.textAlign='center';ctx.font='700 12px Arial,sans-serif';
  ctx.fillText(names[s.kind],w*.5,h-48);
  ctx.fillStyle='#8aa1ba';ctx.font='10px Arial,sans-serif';ctx.fillText('SCHEMAT WYJAŚNIAJĄCY / ODLEGŁOŚCI I ROZMIARY PRZESKALOWANE',w*.5,h-29);
 }
 function stop(){if(frame&&window.cancelAnimationFrame)window.cancelAnimationFrame(frame);frame=0;last=0;}
 function schedule(){if(frame||!animated||!visible||document.hidden||!window.requestAnimationFrame)return;frame=window.requestAnimationFrame(tick);}
 function tick(t){frame=0;if(!animated||!visible||document.hidden)return;if(t-last>=80){phase+=.02;last=t;draw();}schedule();}
 function reflectPlay(){if(play){play.textContent=animated?'Ⅱ Zatrzymaj':'▶ Uruchom';play.setAttribute('aria-pressed',String(!animated));}if(animated)schedule();else stop();}
 node.addEventListener('input',update);distance.addEventListener('input',update);
 solarBtn.addEventListener('click',function(){mode='solar';setPreset('total');});
 lunarBtn.addEventListener('click',function(){mode='lunar';setPreset('total');});
 presets.forEach(function(x){x.addEventListener('click',function(){setPreset(x.getAttribute('data-ec17-preset'));});});
 if(reset)reset.addEventListener('click',function(){mode='solar';setPreset('total');});
 if(play)play.addEventListener('click',function(){animated=!animated;reflectPlay();});
 window.addEventListener('resize',draw);
 document.addEventListener('visibilitychange',function(){if(document.hidden)stop();else{draw();schedule();}});
 window.addEventListener('pagehide',stop);
 if(window.IntersectionObserver){var o=new IntersectionObserver(function(items){visible=!!(items[0]&&items[0].isIntersecting);if(visible){draw();schedule();}else stop();},{threshold:.04});o.observe(root||canvas);}
 else{visible=true;schedule();}
 update();reflectPlay();draw();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
