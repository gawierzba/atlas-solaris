/* ATLAS SOLARIS XX — Schwarzschild horizon, static clocks, gravitational redshift.
   Exact analytic idealizations outside event horizon; weak-field bending only
   for b >= 15 Rs. The Canvas 2D drawing is a scientific schematic and not
   general-relativistic ray tracing or a simulation of EHT observations. */
(function(){
'use strict';
var G=6.67430e-11,C=299792458,MSUN=1.98847e30,KM=1000,SECONDS_PER_HOUR=3600,DEG=180/Math.PI;
function schwarzschildKm(massSolar){
 return massSolar>0&&Number.isFinite(massSolar)?2*G*MSUN*massSolar/(C*C*KM):NaN;
}
function photonSphereKm(massSolar){return 1.5*schwarzschildKm(massSolar);}
function iscoKm(massSolar){return 3*schwarzschildKm(massSolar);}
function shadowRadiusKm(massSolar){return 1.5*Math.sqrt(3)*schwarzschildKm(massSolar);}
function staticClockRate(radiusInRs){
 return radiusInRs>1?Math.sqrt(1-1/radiusInRs):NaN;
}
function farHourNearMinutes(radiusInRs){
 var rate=staticClockRate(radiusInRs);
 return Number.isFinite(rate)?60*rate:NaN;
}
function gravitationalRedshift(radiusInRs){
 var rate=staticClockRate(radiusInRs);
 return Number.isFinite(rate)?1/rate-1:NaN;
}
function weakDeflectionDegrees(impactInRs){
 // α = 4GM/(c² b) = 2 Rs/b rad. For b >> Rs only.
 return impactInRs>=15?2/impactInRs*DEG:NaN;
}
function observatory(massSolar,radiusInRs,impactInRs){
 var rs=schwarzschildKm(massSolar),rate=staticClockRate(radiusInRs),alpha=weakDeflectionDegrees(impactInRs);
 if(!(rs>0&&Number.isFinite(rate)&&Number.isFinite(alpha)))return null;
 return {rsKm:rs,horizonDiameterKm:2*rs,photonKm:1.5*rs,iscoKm:3*rs,
 shadowRadiusKm:1.5*Math.sqrt(3)*rs,staticRate:rate,nearMinutes:rate*60,
 redshift:1/rate-1,deflectionDeg:alpha,
 massSolar:massSolar,radiusInRs:radiusInRs,impactInRs:impactInRs,
 stableCircularOrbit:radiusInRs>=3,hoverAccelerationNecessary:true};
}
window.ATLAS_BH20_PHYSICS={G:G,C:C,MSUN:MSUN,schwarzschildKm:schwarzschildKm,photonSphereKm:photonSphereKm,
 iscoKm:iscoKm,shadowRadiusKm:shadowRadiusKm,staticClockRate:staticClockRate,
 farHourNearMinutes:farHourNearMinutes,gravitationalRedshift:gravitationalRedshift,
 weakDeflectionDegrees:weakDeflectionDegrees,observatory:observatory};
function init(){
 var canvas=document.getElementById('bh20Canvas'),ctx=canvas&&canvas.getContext&&canvas.getContext('2d');
 if(!ctx)return;
 var mass=document.getElementById('bh20Mass'),radius=document.getElementById('bh20Radius'),impact=document.getElementById('bh20Impact'),
     play=document.getElementById('bh20Play'),reset=document.getElementById('bh20Reset'),stage=document.getElementById('bh20LabShell');
 if(!mass||!radius||!impact)return;
 var presets=[].slice.call(document.querySelectorAll('[data-bh20-radius]'));
 var reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 var running=!reduced,visible=false,frame=0,last=0,phase=0;
 var stars=[];
 function pseudo(n){var x=Math.sin(n*129.71+43.919)*43758.5453;return x-Math.floor(x);}
 for(var i=0;i<210;i++)stars.push({x:pseudo(i+23),y:pseudo(i+443),r:.2+pseudo(i+970)*1.35,a:.16+pseudo(i+1141)*.52});
 function put(id,value){var el=document.getElementById(id);if(el)el.textContent=value;}
 function fmt(n,d){return Number(n).toLocaleString('pl-PL',{minimumFractionDigits:d,maximumFractionDigits:d});}
 function prettyKm(k){
  if(k>=1e9)return fmt(k/1e9,2)+' mld km';
  if(k>=1e6)return fmt(k/1e6,2)+' mln km';
  return fmt(k,k>=100?0:2)+' km';
 }
 function get(){return observatory(Number(mass.value),Number(radius.value),Number(impact.value));}
 function update(){
  var s=get();if(!s)return;
  put('bh20RadiusOut',fmt(s.radiusInRs,1)+' rₛ');put('bh20ImpactOut',fmt(s.impactInRs,0)+' rₛ');
  put('bh20Horizon',prettyKm(s.rsKm));
  put('bh20Clock',fmt(s.nearMinutes,2)+' min');
  put('bh20Redshift',fmt(s.redshift,3));
  put('bh20Deflection',fmt(s.deflectionDeg,2)+'°');
  var feedback=document.getElementById('bh20Feedback');
  if(feedback){
   feedback.classList.toggle('is-close',s.radiusInRs<2);
   feedback.textContent='Zegar utrzymywany nieruchomo w odległości '+fmt(s.radiusInRs,1)+
   ' rₛ odmierza '+fmt(s.nearMinutes,2)+' min, gdy daleki zegar odmierza 60 min. '+
   (s.radiusInRs<3?'Ten punkt leży wewnątrz granicy stabilnej orbity kołowej materii (3 rₛ), ale utrzymywanie sondy w miejscu jest tu tylko hipotetyczne.':'Położenie znajduje się poza granicą 3 rₛ dla stabilnych orbit kołowych materii.')+
   ' Obliczenie ugięcia promienia dotyczy niezależnego przelotu światła, a nie zegara sondy.';
  }
  presets.forEach(function(b){
   var active=Math.abs(Number(b.getAttribute('data-bh20-radius'))-s.radiusInRs)<.01;
   b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active));
  });
  draw();
 }
 function circle(x,y,r,fill){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();}
 function circleStroke(x,y,r,color,width,dashed){
  ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);
  ctx.strokeStyle=color;ctx.lineWidth=width||1;
  if(dashed)ctx.setLineDash([4,7]);ctx.stroke();ctx.setLineDash([]);
 }
 function glow(x,y,r,c1){
  var g=ctx.createRadialGradient(x,y,0,x,y,r);
  g.addColorStop(0,c1);g.addColorStop(1,'rgba(5,9,15,0)');
  circle(x,y,r,g);
 }
 function draw(){
  var w=canvas.clientWidth||760,h=canvas.clientHeight||650;if(w<20||h<20)return;
  var dpr=Math.min(window.devicePixelRatio||1,1.65);if(w*dpr>1640)dpr=1640/w;
  var cw=Math.max(1,Math.round(w*dpr)),ch=Math.max(1,Math.round(h*dpr));
  if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw;canvas.height=ch;}
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  var g=ctx.createRadialGradient(w*.52,h*.42,3,w*.5,h*.5,Math.max(w,h)*.73);
  g.addColorStop(0,'#33212a');g.addColorStop(.62,'#111420');g.addColorStop(1,'#080c16');
  ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  stars.forEach(function(s){circle(s.x*w,s.y*h,s.r,'rgba(230,238,248,'+s.a+')');});
  var s=get();if(!s)return;
  var cx=w*.5,cy=h*.405;
  var rS=Math.min(w*.145,h*.125,70);
  function diagramR(x){return rS*(1+.57*Math.log(Math.max(1,x)));}
  var photon=diagramR(1.5),isco=diagramR(3),probe=diagramR(s.radiusInRs);
  // Emissive gas bands are decorative context, not ray-traced plasma.
  var fog=ctx.createRadialGradient(cx,cy,rS*.74,cx,cy,rS*3.3);
  fog.addColorStop(0,'rgba(222,120,76,.18)');fog.addColorStop(.38,'rgba(195,89,59,.11)');fog.addColorStop(1,'rgba(109,31,50,0)');
  circle(cx,cy,rS*3.3,fog);
  ctx.save();ctx.translate(cx,cy);
  for(var j=21;j>=0;j--){
   var a=.25+(j/21)*.46,rad=isco*(.85+(j/21)*.62);
   ctx.beginPath();ctx.ellipse(0,0,rad,rad*.44,a+phase*.012,0,Math.PI*2);
   ctx.strokeStyle='rgba('+(220+j)+','+(109+Math.round(j*.95))+',93,'+(.02+.015*(21-j))+')';
   ctx.lineWidth=1.3+((j+3)%4)*.5;ctx.stroke();
  }
  ctx.restore();
  // Thin nested contours: visual guide to numerical radii; NOT spatially to scale.
  circleStroke(cx,cy,isco,'rgba(180,206,229,.52)',1,[4,7]);
  circleStroke(cx,cy,photon,'rgba(248,181,126,.73)',1.4,[4,7]);
  glow(cx,cy,rS*1.6,'rgba(251,132,88,.28)');
  var ring=ctx.createRadialGradient(cx,cy,rS*.67,cx,cy,rS*1.12);
  ring.addColorStop(0,'#030509');ring.addColorStop(.68,'#030509');ring.addColorStop(.93,'#1b1016');ring.addColorStop(1,'#b87955');
  circle(cx,cy,rS,ring);
  circleStroke(cx,cy,rS,'rgba(239,159,109,.71)',1.5);
  var angle=phase*.09-Math.PI*.19,px=cx+probe*Math.cos(angle),py=cy+probe*Math.sin(angle);
  circleStroke(cx,cy,probe,'rgba(188,203,224,.15)',1.1,true);
  glow(px,py,23,'rgba(179,227,241,.52)');circle(px,py,6,'#dff8fb');
  ctx.font='700 10px Arial,sans-serif';ctx.fillStyle='#f1d7d3';ctx.textAlign='center';
  ctx.fillText('HORYZONT / 1 rₛ',cx,Math.max(75,cy-rS-16));
  ctx.textAlign='left';ctx.fillStyle='#b3cdd5';
  ctx.fillText('SFERA FOTONOWA / 1,5 rₛ',Math.max(8,cx-photon-50),cy+photon+21);
  ctx.fillStyle='#d5b6bb';ctx.fillText('ISCO / 3 rₛ',Math.min(w-108,cx+isco*.66),cy+isco*.70);
  // Independent, qualitative illustration of distant weak-field deflection.
  var y=h*.795,left=28,right=w-28,bump=Math.min(29,7+s.deflectionDeg*1.25);
  var gradient=ctx.createLinearGradient(left,y,right,y);
  gradient.addColorStop(0,'rgba(127,193,215,.12)');gradient.addColorStop(.4,'rgba(180,229,234,.92)');gradient.addColorStop(1,'rgba(188,240,238,.2)');
  ctx.beginPath();ctx.moveTo(left,y-15);ctx.bezierCurveTo(w*.28,y-13,w*.34,y+bump*.75,w*.5,y+bump);
  ctx.bezierCurveTo(w*.64,y+bump*1.25,w*.7,y-3,right,y-15);
  ctx.strokeStyle=gradient;ctx.lineWidth=2.2;ctx.stroke();
  var pulseX=left+(right-left)*((phase*.08)%1);
  glow(pulseX,y+Math.sin((phase*.08)%1*Math.PI)*bump,17,'rgba(172,231,236,.38)');
  circle(pulseX,y+Math.sin((phase*.08)%1*Math.PI)*bump,2.6,'#e7f9ff');
  ctx.textAlign='center';ctx.fillStyle='#b7b7c7';ctx.font='9px Arial,sans-serif';
  ctx.fillText('PROMIEŃ ŚWIATŁA / PRZYBLIŻENIE SCHEMATYCZNE',w*.5,h*.71);
  ctx.fillStyle='#95aab8';ctx.fillText('PROMIENIE NA RYSUNKU W SKALI NIELINIOWEJ / NIE RAY TRACING',w*.5,h-38);
 }
 function stop(){if(frame&&window.cancelAnimationFrame)window.cancelAnimationFrame(frame);frame=0;last=0;}
 function schedule(){if(frame||!running||!visible||document.hidden||!window.requestAnimationFrame)return;frame=window.requestAnimationFrame(tick);}
 function tick(now){frame=0;if(!running||!visible||document.hidden)return;
  if(now-last>=43){phase+=last?Math.min(.1,(now-last)/1000)*3:.005;last=now;draw();}schedule();
 }
 function playStatus(){if(play){play.textContent=running?'Ⅱ Zatrzymaj':'▶ Uruchom';play.setAttribute('aria-pressed',String(!running));}if(running)schedule();else stop();}
 mass.addEventListener('change',update);radius.addEventListener('input',update);impact.addEventListener('input',update);
 presets.forEach(function(b){b.addEventListener('click',function(){radius.value=b.getAttribute('data-bh20-radius');update();});});
 if(reset)reset.addEventListener('click',function(){mass.value='10';radius.value='12';impact.value='30';phase=0;update();});
 if(play)play.addEventListener('click',function(){running=!running;playStatus();});
 window.addEventListener('resize',draw);
 document.addEventListener('visibilitychange',function(){if(document.hidden)stop();else{draw();schedule();}});
 window.addEventListener('pagehide',stop);
 if(window.IntersectionObserver){
  var observer=new IntersectionObserver(function(entries){visible=!!(entries[0]&&entries[0].isIntersecting);if(visible){draw();schedule();}else stop();},{threshold:.03});
  observer.observe(stage||canvas);
 }else{visible=true;schedule();}
 update();playStatus();draw();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
