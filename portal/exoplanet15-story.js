/* ATLAS SOLARIS 15 — Transit observatory. Circular orbits, uniform stellar disk,
   circle-overlap photometry, Kepler's 3rd law; Canvas 2D, no WebGL, no libraries. */
(function(){
'use strict';
var EARTH_PER_SOLAR_RADIUS=109.076, SOLAR_RADIUS_AU=.00465047;
function semimajorAu(periodDays){return periodDays>0?Math.pow(periodDays/365.25,2/3):NaN;}
function radiusRatio(planetEarthR,starSolarR){
 if(!(planetEarthR>0&&starSolarR>0))return NaN;
 return planetEarthR/(EARTH_PER_SOLAR_RADIUS*starSolarR);
}
function depthPpm(planetEarthR,starSolarR){
 var k=radiusRatio(planetEarthR,starSolarR);
 return Number.isFinite(k)?Math.min(1,k*k)*1e6:NaN;
}
function impactParameter(periodDays,inclinationDeg,starSolarR){
 if(!(periodDays>0&&starSolarR>0&&inclinationDeg>=0&&inclinationDeg<=90))return NaN;
 return semimajorAu(periodDays)/SOLAR_RADIUS_AU/starSolarR*Math.cos(inclinationDeg*Math.PI/180);
}
function overlapArea(normalizedDistance,radiusRatio){
 var d=Math.abs(normalizedDistance),r=radiusRatio,R=1;
 if(!(d>=0&&r>0))return NaN;
 if(d>=R+r)return 0;
 if(d<=Math.abs(R-r))return Math.PI*Math.min(R,r)**2;
 var a=Math.acos(Math.max(-1,Math.min(1,(d*d+R*R-r*r)/(2*d*R))));
 var b=Math.acos(Math.max(-1,Math.min(1,(d*d+r*r-R*R)/(2*d*r))));
 var c=Math.sqrt(Math.max(0,(-d+R+r)*(d+R-r)*(d-R+r)*(d+R+r)));
 return R*R*a+r*r*b-.5*c;
}
function transitFlux(normalizedDistance,planetEarthR,starSolarR){
 var k=radiusRatio(planetEarthR,starSolarR);
 return Number.isFinite(k)?1-overlapArea(normalizedDistance,k)/Math.PI:NaN;
}
function durationHours(periodDays,inclinationDeg,planetEarthR,starSolarR){
 var a=semimajorAu(periodDays),k=radiusRatio(planetEarthR,starSolarR),
     b=impactParameter(periodDays,inclinationDeg,starSolarR),
     starAu=SOLAR_RADIUS_AU*starSolarR;
 if(!(a>0&&k>0&&Number.isFinite(b)))return NaN;
 if(b>=1+k)return 0;
 var i=inclinationDeg*Math.PI/180;
 var under=Math.max(0,(1+k)*(1+k)-b*b);
 var ratio=starAu/a*Math.sqrt(under)/Math.sin(i);
 if(!(ratio>=0))return NaN;
 return periodDays*24/Math.PI*Math.asin(Math.min(1,ratio));
}
window.ATLAS_EX15_PHYSICS={
 EARTH_PER_SOLAR_RADIUS:EARTH_PER_SOLAR_RADIUS,SOLAR_RADIUS_AU:SOLAR_RADIUS_AU,
 semimajorAu:semimajorAu,radiusRatio:radiusRatio,depthPpm:depthPpm,
 impactParameter:impactParameter,overlapArea:overlapArea,transitFlux:transitFlux,durationHours:durationHours
};
function init(){
 var canvas=document.getElementById('ex15Canvas');
 var range={planet:document.getElementById('ex15Planet'),star:document.getElementById('ex15Star'),period:document.getElementById('ex15Period'),inclination:document.getElementById('ex15Inclination'),noise:document.getElementById('ex15Noise')};
 if(!canvas||!canvas.getContext||!range.planet||!range.star||!range.period||!range.inclination||!range.noise)return;
 var ctx=canvas.getContext('2d');if(!ctx)return;
 var presets=[].slice.call(document.querySelectorAll('[data-ex15-preset]'));
 var play=document.getElementById('ex15Play'),reset=document.getElementById('ex15Reset');
 var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 var running=!reduce,frame=0,last=0,phase=0,visible=false;
 var bgstars=[];function rand(i){var x=Math.sin(i*138.981+22.235)*43758.5453;return x-Math.floor(x);}
 for(var j=0;j<175;j++)bgstars.push({x:rand(j+1),y:rand(j+199),r:.2+rand(j+458)*1.5,a:.18+rand(j+972)*.66});
 function text(id,val){var el=document.getElementById(id);if(el)el.textContent=val;}
 function fmt(v,d){return Number(v).toLocaleString('pl-PL',{minimumFractionDigits:d,maximumFractionDigits:d});}
 function value(k){return Number(range[k].value);}
 function params(){
  var p=value('planet'),s=value('star'),P=value('period'),i=value('inclination'),noise=value('noise');
  var k=radiusRatio(p,s),b=impactParameter(P,i,s);
  return{planet:p,star:s,period:P,inclination:i,noise:noise,k:k,b:b,transit:b<1+k,
   depth:(1-transitFlux(b,p,s))*1e6,duration:durationHours(P,i,p,s),a:semimajorAu(P)};
 }
 function update(){
  var p=params();
  text('ex15PlanetValue',fmt(p.planet,1)+' R⊕');text('ex15StarValue',fmt(p.star,2)+' R☉');
  text('ex15PeriodValue',fmt(p.period,0)+' dni');text('ex15InclinationValue',fmt(p.inclination,1)+'°');
  text('ex15NoiseValue',fmt(p.noise,0)+' ppm');
  text('ex15Depth',fmt(p.transit?p.depth:0,0)+' ppm');
  text('ex15Orbit',fmt(p.a,3)+' AU');text('ex15Geometry',p.transit?'TRANZYT':'BRAK');
  text('ex15Duration',p.transit?fmt(p.duration,2)+' h':'0 h');
  var status=document.getElementById('ex15Result');
  if(status){
    status.classList.toggle('is-miss',!p.transit);
    if(!p.transit)status.textContent='W tej geometrii planeta omija tarczę gwiazdy, więc nie wystąpi tranzyt. To nie dowód, że planeta nie istnieje.';
    else status.textContent='W tej geometrii maksymalny spadek blasku wynosi '+fmt(p.depth,0)+' ppm, czyli '+fmt(p.depth/1e4,4)+'% spadku jasności. Czas tranzytu: około '+fmt(p.duration,2)+' godz. Wykres automatycznie powiększa ten maleńki sygnał.';
  }
  presets.forEach(function(btn){
   var v=btn.getAttribute('data-ex15-preset'),targets={
    earth:[1,1,365,90,20],giant:[11,1,5,89,100],red:[1,.2,5,89.5,80]
   };
   var t=targets[v],arr=[p.planet,p.star,p.period,p.inclination,p.noise];
   var match=t&&t.every(function(n,i){return Math.abs(n-arr[i])<1e-7;});
   btn.classList.toggle('is-active',!!match);btn.setAttribute('aria-pressed',match?'true':'false');
  });
  draw();
 }
 function starGlow(cx,cy,r){
  var out=ctx.createRadialGradient(cx,cy,1,cx,cy,r*2.7);
  out.addColorStop(0,'rgba(255,245,215,.58)');out.addColorStop(.37,'rgba(245,198,169,.25)');out.addColorStop(1,'rgba(80,110,156,0)');
  ctx.fillStyle=out;ctx.beginPath();ctx.arc(cx,cy,r*2.7,0,Math.PI*2);ctx.fill();
  var g=ctx.createRadialGradient(cx-r*.28,cy-r*.31,r*.01,cx,cy,r);
  g.addColorStop(0,'#fffff3');g.addColorStop(.42,'#fff9e8');g.addColorStop(.75,'#f1cfb5');g.addColorStop(1,'#b47d8d');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();
 }
 function curveFlux(t,p){
  // x is a normalized transit chord; ingress/egress from real circle overlap geometry.
  if(!p.transit)return 1;
  // -1.2..1.2 window, with 0 at mid-transit.
  var length=Math.sqrt(Math.max(0,(1+p.k)**2-p.b*p.b));
  var x=2.55*(t-.5)*length;
  var dist=Math.sqrt(x*x+p.b*p.b);
  return transitFlux(dist,p.planet,p.star);
 }
 function draw(){
  var w=canvas.clientWidth||740,h=canvas.clientHeight||640;if(w<20||h<20)return;
  var dpr=Math.min(1.65,window.devicePixelRatio||1);if(w*dpr>1650)dpr=1650/w;
  var cw=Math.round(w*dpr),ch=Math.round(h*dpr);
  if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw;canvas.height=ch;}
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  var bg=ctx.createRadialGradient(w*.45,h*.31,0,w*.5,h*.42,Math.max(w,h)*.72);
  bg.addColorStop(0,'#1c2c4a');bg.addColorStop(.67,'#09172d');bg.addColorStop(1,'#030917');
  ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
  bgstars.forEach(function(s){ctx.fillStyle='rgba(207,237,249,'+s.a+')';ctx.beginPath();ctx.arc(s.x*w,s.y*h,s.r,0,Math.PI*2);ctx.fill();});
  var p=params(),compact=w<520;
  var starArea=compact?h*.45:h*.46;
  var cy=starArea*.58,cx=w*.5,r=Math.min(w*.20,starArea*.34);
  starGlow(cx,cy,r);
  if(p.transit){
    var length=Math.sqrt(Math.max(0,(1+p.k)**2-p.b*p.b));
    var progress=(phase%1);
    var normalizedX=(progress-.5)*2.55*length;
    var px=cx+normalizedX*r,py=cy+p.b*r;
    var realR=p.k*r,shownR=Math.max(3,realR);
    ctx.fillStyle='#061121';ctx.beginPath();ctx.arc(px,py,shownR,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='rgba(153,222,235,.5)';ctx.lineWidth=1;ctx.stroke();
  }else{
    var px=cx+(phase%1-.5)*r*3.1,py=cy+p.b*r;
    // Mark no transit symbolically near star; actual b can be very large.
    ctx.beginPath();ctx.arc(px,cy+r*1.72,Math.max(3,p.k*r),0,Math.PI*2);ctx.fillStyle='#101626';ctx.fill();
  }
  ctx.textAlign='center';ctx.fillStyle='#b9d6e6';ctx.font='700 11px Arial,sans-serif';
  ctx.fillText('OBSERWACJA GWIAZDY',cx,Math.max(32,cy-r-30));
  ctx.font='10px Arial,sans-serif';ctx.fillStyle='#8dabbf';
  ctx.fillText('PLANETA POWIĘKSZONA DLA CZYTELNOŚCI',cx,Math.min(starArea-9,cy+r+25));
  var panelX=compact?20:40,panelW=w-panelX*2;
  var top=compact?starArea+12:starArea+22,bottom=h-55;
  var panelH=Math.max(90,bottom-top);
  ctx.fillStyle='rgba(5,20,36,.61)';ctx.fillRect(panelX,top,panelW,panelH);
  ctx.strokeStyle='rgba(102,153,180,.48)';ctx.lineWidth=1;ctx.strokeRect(panelX+.5,top+.5,panelW-1,panelH-1);
  var left=panelX+38,right=panelX+panelW-16,graphTop=top+42,graphBottom=top+panelH-33;
  if(graphBottom<=graphTop+25)return;
  ctx.strokeStyle='rgba(150,184,202,.31)';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(left,graphTop);ctx.lineTo(left,graphBottom);ctx.lineTo(right,graphBottom);ctx.stroke();
  ctx.textAlign='left';ctx.font='700 10px Arial,sans-serif';ctx.fillStyle='#b8d7e9';
  ctx.fillText('KRZYWA BLASKU · WYKRES POWIĘKSZONY',panelX+14,top+23);
  var maxDepth=p.transit?Math.max(3,p.depth):0;
  var zoom=Math.max(maxDepth*1.4,p.noise*3.4,50);
  var normY=function(ppm){return graphTop+(graphBottom-graphTop)*Math.max(0,Math.min(1,(ppm+zoom*.25)/(zoom*1.34)));};
  ctx.strokeStyle='rgba(184,227,241,.25)';ctx.setLineDash([4,5]);
  var zeroY=normY(0);ctx.beginPath();ctx.moveTo(left,zeroY);ctx.lineTo(right,zeroY);ctx.stroke();ctx.setLineDash([]);
  ctx.textAlign='right';ctx.font='9px Arial,sans-serif';ctx.fillStyle='#91b7c9';
  ctx.fillText('100%',left-5,zeroY-6);
  ctx.fillText('−'+fmt(zoom,0)+' ppm',right,graphBottom-5);
  // Smoothed theoretical curve; normalized t in [0,1].
  ctx.strokeStyle='#f1c0cd';ctx.lineWidth=2.1;ctx.beginPath();
  for(var j=0;j<=260;j++){
    var t=j/260,flux=curveFlux(t,p),ppm=(1-flux)*1e6;
    var x=left+(right-left)*t,y=normY(ppm);
    if(j===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
  }ctx.stroke();
  // Deterministic measurement-like noise, visualization only.
  for(var z=0;z<115;z++){
    var t=(z+.5)/115;
    var flux=curveFlux(t,p),ppm=(1-flux)*1e6;
    var random=(Math.sin(z*127.3+51.2)*43758.543)%1;
    var scatter=(Math.sin(z*19.7+7)*.67+random*.33)*p.noise;
    ctx.beginPath();ctx.arc(left+(right-left)*t,normY(ppm+scatter),1.25,0,Math.PI*2);
    ctx.fillStyle='rgba(153,227,238,.68)';ctx.fill();
  }
  var markX=left+(right-left)*(phase%1);
  ctx.strokeStyle='rgba(222,237,248,.56)';ctx.lineWidth=.8;ctx.setLineDash([3,6]);
  ctx.beginPath();ctx.moveTo(markX,graphTop);ctx.lineTo(markX,graphBottom);ctx.stroke();ctx.setLineDash([]);
  ctx.textAlign='center';ctx.font='10px Arial,sans-serif';ctx.fillStyle='#9cc8d7';
  ctx.fillText(p.transit?'TRANZYT: '+fmt(p.duration,2)+' GODZ.':'BRAK TRANZYTU W TEJ GEOMETRII',w*.5,h-22);
 }
 function stop(){if(frame&&window.cancelAnimationFrame)window.cancelAnimationFrame(frame);frame=0;last=0;}
 function schedule(){if(frame||!running||!visible||document.hidden||!window.requestAnimationFrame)return;frame=window.requestAnimationFrame(tick);}
 function tick(now){frame=0;if(!running||!visible||document.hidden)return;if(now-last>=34){phase+=last?Math.min(.06,(now-last)/1000)/12:.003;last=now;draw();}schedule();}
 function reflectPlay(){if(play){play.textContent=running?'Ⅱ Zatrzymaj':'▶ Uruchom';play.setAttribute('aria-pressed',running?'false':'true');}if(running)schedule();else stop();}
 function preset(name){
  var p={earth:[1,1,365,90,20],giant:[11,1,5,89,100],red:[1,.2,5,89.5,80]}[name];if(!p)return;
  ['planet','star','period','inclination','noise'].forEach(function(k,i){range[k].value=String(p[i]);});
  phase=0;update();
 }
 Object.keys(range).forEach(function(key){range[key].addEventListener('input',update);});
 presets.forEach(function(b){b.addEventListener('click',function(){preset(b.getAttribute('data-ex15-preset'));});});
 if(reset)reset.addEventListener('click',function(){preset('earth');});
 if(play)play.addEventListener('click',function(){running=!running;reflectPlay();});
 window.addEventListener('resize',draw);
 document.addEventListener('visibilitychange',function(){if(document.hidden)stop();else{draw();schedule();}});
 window.addEventListener('pagehide',stop);
 if(window.IntersectionObserver){var observer=new IntersectionObserver(function(items){visible=!!(items[0]&&items[0].isIntersecting);if(visible){draw();schedule();}else stop();},{threshold:.035});observer.observe(canvas);}else{visible=true;schedule();}
 update();reflectPlay();draw();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
