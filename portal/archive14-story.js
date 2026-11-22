/* ATLAS SOLARIS XIV — Deep Space Network laboratory.
   Real light-time calculations + strictly artistic Canvas 2D visualization.
   No WebGL or external dependencies; all numerical examples are hypothetical. */
(function(){
'use strict';
var AU_KM=149597870.7,C_KM_S=299792.458;
function oneWayMinutes(distanceAu){
 if(!(distanceAu>0))return NaN;
 return distanceAu*AU_KM/C_KM_S/60;
}
function roundTripMinutes(distanceAu){return 2*oneWayMinutes(distanceAu);}
function distanceBillionKm(distanceAu){
 if(!(distanceAu>0))return NaN;
 return distanceAu*AU_KM/1e9;
}
function relativeFluxPercent(distanceAu){
 if(!(distanceAu>0))return NaN;
 return 100/Math.pow(distanceAu,2);
}
window.ATLAS_AR14_PHYSICS={AU_KM:AU_KM,C_KM_S:C_KM_S,oneWayMinutes:oneWayMinutes,roundTripMinutes:roundTripMinutes,distanceBillionKm:distanceBillionKm,relativeFluxPercent:relativeFluxPercent};
function init(){
 var root=document.getElementById('ar14LabFrame'),canvas=document.getElementById('ar14Canvas');
 var range=document.getElementById('ar14Distance'),play=document.getElementById('ar14Play'),reset=document.getElementById('ar14Reset');
 if(!canvas||!root||!range||!canvas.getContext)return;
 var ctx=canvas.getContext('2d');if(!ctx)return;
 var presets=[].slice.call(document.querySelectorAll('[data-ar14-distance]'));
 var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 var canAnimate=!reduce,visible=false,frame=0,last=0,phase=0;
 var starfield=[];
 function pseudo(i){var v=Math.sin(i*127.73+48.12)*43758.5453;return v-Math.floor(v);}
 for(var i=0;i<240;i++)starfield.push({x:pseudo(i+2),y:pseudo(i+204),r:.35+Math.pow(pseudo(i+611),4)*2.4,a:.18+pseudo(i+831)*.68});
 function setText(id,value){var el=document.getElementById(id);if(el)el.textContent=value;}
 function polish(v,dec){return Number(v).toLocaleString('pl-PL',{minimumFractionDigits:dec,maximumFractionDigits:dec});}
 function duration(minutes){
  var h=Math.floor(minutes/60),m=Math.floor(minutes-h*60),s=Math.round((minutes-h*60-m)*60);
  if(s===60){s=0;m+=1;}if(m===60){m=0;h+=1;}
  if(h>=24){var d=Math.floor(h/24);h=h%24;return d+' d '+h+' godz. '+m+' min';}
  if(h>0)return h+' godz. '+m+' min';
  return m+' min '+s+' s';
 }
 function update(){
  var d=Number(range.value);
  var one=oneWayMinutes(d),round=roundTripMinutes(d),flux=relativeFluxPercent(d);
  setText('ar14DistanceOut',polish(d,1)+' AU');
  setText('ar14OneWay',duration(one));setText('ar14RoundTrip',duration(round));
  setText('ar14Km',polish(distanceBillionKm(d),2));
  setText('ar14Loss',flux<.01?polish(flux,4)+'%':polish(flux,2)+'%');
  setText('ar14Result','Przy '+polish(d,1)+' AU sygnał radiowy dociera do sondy po około '+duration(one)+'. Najwcześniejsza odpowiedź wróci po około '+duration(round)+' — bez uwzględnienia obróbki i kolejki transmisji.');
  presets.forEach(function(btn){
    var active=Math.abs(Number(btn.getAttribute('data-ar14-distance'))-d)<.01;
    btn.classList.toggle('is-active',active);
    btn.setAttribute('aria-pressed',active?'true':'false');
  });
  draw();
 }
 function glow(cx,cy,r,start,mid,alpha){
  var g=ctx.createRadialGradient(cx,cy,0,cx,cy,r);
  g.addColorStop(0,start);g.addColorStop(.4,mid);g.addColorStop(1,'rgba(31,40,87,0)');
  ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fillStyle=g;ctx.globalAlpha=alpha;ctx.fill();ctx.globalAlpha=1;
 }
 function drawEarth(cx,cy,r){
  glow(cx,cy,r*4,'rgba(145,196,246,.36)','rgba(80,126,216,.13)',.55);
  var g=ctx.createRadialGradient(cx-r*.27,cy-r*.34,3,cx,cy,r);
  g.addColorStop(0,'#cff8ff');g.addColorStop(.25,'#4198ca');g.addColorStop(.67,'#245588');g.addColorStop(1,'#112b4c');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,r,0,6.2831853);ctx.fill();
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,6.2831853);ctx.clip();ctx.fillStyle='rgba(133,205,176,.85)';
  ctx.beginPath();ctx.ellipse(cx-r*.20,cy-r*.13,r*.18,r*.44,-.5,0,6.2831853);ctx.fill();
  ctx.beginPath();ctx.ellipse(cx+r*.34,cy+r*.31,r*.32,r*.18,.5,0,6.2831853);ctx.fill();
  ctx.strokeStyle='rgba(236,253,255,.35)';ctx.lineWidth=r*.1;
  ctx.beginPath();ctx.ellipse(cx,cy,r*.8,r*.27,.36,0,6.2831853);ctx.stroke();
  ctx.restore();ctx.beginPath();ctx.arc(cx,cy,r,0,6.2831853);ctx.strokeStyle='rgba(185,236,255,.45)';ctx.lineWidth=1;ctx.stroke();
 }
 function drawProbe(x,y,s){
  glow(x,y,s*3,'rgba(249,227,252,.47)','rgba(146,139,225,.17)',.5);
  ctx.save();ctx.translate(x,y);ctx.rotate(-.23);
  ctx.strokeStyle='#c3e0ec';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(-s*.9,0);ctx.lineTo(-s*.22,0);ctx.moveTo(s*.3,0);ctx.lineTo(s*1.25,0);ctx.stroke();
  ctx.fillStyle='#c5dbe8';ctx.fillRect(-s*.24,-s*.3,s*.48,s*.6);
  ctx.fillStyle='#8db7d4';ctx.fillRect(-s*1.15,-s*.28,s*.43,s*.56);
  ctx.fillRect(s*.72,-s*.28,s*.43,s*.56);
  ctx.strokeStyle='#f0edf8';ctx.lineWidth=3;
  ctx.beginPath();ctx.ellipse(s*.38,0,s*.34,s*.51,.23,0,6.2831853);ctx.stroke();
  ctx.restore();
 }
 function draw(){
  var w=canvas.clientWidth||750,h=canvas.clientHeight||540;
  if(w<20||h<20)return;
  var dpr=Math.min(1.65,window.devicePixelRatio||1);if(w*dpr>1500)dpr=1500/w;
  var cw=Math.max(1,Math.round(w*dpr)),ch=Math.max(1,Math.round(h*dpr));
  if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw;canvas.height=ch;}
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  var bg=ctx.createRadialGradient(w*.63,h*.42,0,w*.5,h*.46,Math.max(w,h)*.8);
  bg.addColorStop(0,'#1c284c');bg.addColorStop(.62,'#0c1831');bg.addColorStop(1,'#070d20');
  ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
  for(var i=0;i<starfield.length;i++){var p=starfield[i];ctx.beginPath();ctx.arc(p.x*w,p.y*h,p.r,0,Math.PI*2);ctx.fillStyle='rgba(222,233,255,'+p.a+')';ctx.fill();}
  var x0=w*.18,y0=h*.52,x1=w*.80,y1=h*.43,dist=x1-x0,angle=Math.atan2(y1-y0,dist);
  var ux=Math.cos(angle),uy=Math.sin(angle);
  ctx.save();ctx.setLineDash([5,11]);ctx.lineWidth=1.2;ctx.strokeStyle='rgba(167,193,235,.44)';
  ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();ctx.setLineDash([]);ctx.restore();
  var waves=7;
  for(var k=0;k<waves;k++){
   var p=((phase*.22+k/waves)%1);
   var xx=x0+dist*p,yy=y0+(y1-y0)*p,r=6+11*p;
   glow(xx,yy,r*2,'rgba(222,252,255,.53)','rgba(91,226,234,.18)',.58);
   ctx.beginPath();ctx.arc(xx,yy,r,0,Math.PI*2);
   ctx.strokeStyle='rgba(151,244,248,'+(.63*(1-p*.45))+')';ctx.lineWidth=1.5;ctx.stroke();
  }
  drawEarth(x0,y0,Math.max(20,Math.min(w,h)*.078));
  drawProbe(x1,y1,Math.max(26,Math.min(w,h)*.065));
  ctx.textAlign='center';ctx.fillStyle='#dfe9ff';ctx.font='700 12px Arial,sans-serif';
  ctx.fillText('ZIEMIA / DSN',x0,Math.max(70,y0-Math.min(w,h)*.13));
  ctx.fillText('ODLEGŁA SONDA',x1,Math.max(70,y1-Math.min(w,h)*.15));
  ctx.fillStyle='#9eb7d5';ctx.font='12px Arial,sans-serif';
  ctx.fillText(polish(Number(range.value),1)+' AU',w*.5,Math.min(h-85,h*.67));
  var beam=ctx.createLinearGradient(x0,y0,x1,y1);beam.addColorStop(0,'rgba(158,250,251,.20)');beam.addColorStop(.5,'rgba(167,245,243,.56)');beam.addColorStop(1,'rgba(239,215,253,.20)');
  ctx.strokeStyle=beam;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();
  ctx.font='10px Arial,sans-serif';ctx.fillStyle='rgba(161,186,215,.75)';
  ctx.fillText('ANIMACJA POKAZUJE KIERUNEK SYGNAŁU, NIE PRAWDZIWY CZAS LOTU',w*.5,h-46);
 }
 function stop(){if(frame&&window.cancelAnimationFrame)window.cancelAnimationFrame(frame);frame=0;last=0;}
 function schedule(){if(frame||!canAnimate||!visible||document.hidden||!window.requestAnimationFrame)return;frame=window.requestAnimationFrame(tick);}
 function tick(now){frame=0;if(!canAnimate||!visible||document.hidden)return;if(now-last>=35){phase+=last?Math.min(.09,(now-last)/1000):.035;last=now;draw();}schedule();}
 function updatePlay(){if(play){play.textContent=canAnimate?'Ⅱ Zatrzymaj animację':'▶ Uruchom animację';play.setAttribute('aria-pressed',canAnimate?'false':'true');}if(canAnimate)schedule();else stop();}
 range.addEventListener('input',update);
 presets.forEach(function(btn){btn.addEventListener('click',function(){range.value=btn.getAttribute('data-ar14-distance');update();});});
 if(reset)reset.addEventListener('click',function(){range.value='160';phase=0;update();});
 if(play)play.addEventListener('click',function(){canAnimate=!canAnimate;updatePlay();draw();});
 window.addEventListener('resize',draw);
 document.addEventListener('visibilitychange',function(){if(document.hidden)stop();else{draw();schedule();}});
 window.addEventListener('pagehide',stop);
 if(window.IntersectionObserver){
  var obs=new IntersectionObserver(function(entries){visible=!!(entries[0]&&entries[0].isIntersecting);if(visible){draw();schedule();}else stop();},{threshold:.04});obs.observe(root);
 }else{visible=true;schedule();}
 update();updatePlay();draw();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
