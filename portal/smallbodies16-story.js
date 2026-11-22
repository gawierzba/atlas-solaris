/* ATLAS SOLARIS 16 — NEO encounter laboratory / physical two-body hyperbola.
   Numerical readouts: idealized Earth gravity, v-infinity, asymptotic impact
   parameter; vacuum collision. Picture: accurate conic geometry, stylized scale
   and animation time. No live risk assessment, no orbital ephemerides. */
(function(){
'use strict';
var EARTH_R_KM=6371,EARTH_MU_KM3_S2=398600.4418,TNT_MEGA_J=4.184e15;
function perigeeKm(bEarthRadii,vInfKmS){
 if(!(bEarthRadii>=0&&vInfKmS>0))return NaN;
 var b=bEarthRadii*EARTH_R_KM,mu=EARTH_MU_KM3_S2;
 var vv=vInfKmS*vInfKmS;
 return b*b*vv/(mu+Math.sqrt(mu*mu+b*b*vv*vv));
}
function surfaceSpeedKmS(vInfKmS){
 return vInfKmS>0?Math.sqrt(vInfKmS*vInfKmS+2*EARTH_MU_KM3_S2/EARTH_R_KM):NaN;
}
function massKg(diameterMeters,densityKgM3){
 if(!(diameterMeters>0&&densityKgM3>0))return NaN;
 return Math.PI/6*densityKgM3*Math.pow(diameterMeters,3);
}
function impactEnergyMegatons(diameterMeters,densityKgM3,vInfKmS){
 var m=massKg(diameterMeters,densityKgM3),v=surfaceSpeedKmS(vInfKmS);
 return Number.isFinite(m)&&Number.isFinite(v)?(.5*m*Math.pow(v*1000,2))/TNT_MEGA_J:NaN;
}
function escapeSpeedKmS(){return Math.sqrt(2*EARTH_MU_KM3_S2/EARTH_R_KM);}
function collisionLimitBRe(vInfKmS,diameterMeters){
 if(!(vInfKmS>0&&diameterMeters>0))return NaN;
 var R=EARTH_R_KM+diameterMeters/2000;
 return R/EARTH_R_KM*Math.sqrt(1+2*EARTH_MU_KM3_S2/(R*vInfKmS*vInfKmS));
}
function encounter(bEarthRadii,vInfKmS,diameterMeters,densityKgM3){
 var rp=perigeeKm(bEarthRadii,vInfKmS);
 if(!Number.isFinite(rp)||!Number.isFinite(massKg(diameterMeters,densityKgM3)))return null;
 var actualRadius=EARTH_R_KM+diameterMeters/2000;
 return {rpKm:rp,altitudeKm:rp-EARTH_R_KM,perigeeInEarthRadii:rp/EARTH_R_KM,
    collision:rp<=actualRadius,energyMt:impactEnergyMegatons(diameterMeters,densityKgM3,vInfKmS),
    speedAtSurface:surfaceSpeedKmS(vInfKmS),gravitationalFocusingLimitBRe:collisionLimitBRe(vInfKmS,diameterMeters),
    bRe:bEarthRadii,vInf:vInfKmS,diameterM:diameterMeters,density:densityKgM3};
}
window.ATLAS_SB16_PHYSICS={
 EARTH_R_KM:EARTH_R_KM,EARTH_MU_KM3_S2:EARTH_MU_KM3_S2,TNT_MEGA_J:TNT_MEGA_J,
 perigeeKm:perigeeKm,surfaceSpeedKmS:surfaceSpeedKmS,massKg:massKg,
 impactEnergyMegatons:impactEnergyMegatons,escapeSpeedKmS:escapeSpeedKmS,
 collisionLimitBRe:collisionLimitBRe,encounter:encounter
};
function init(){
 var canvas=document.getElementById('sb16Canvas'),ctx=canvas&&canvas.getContext&&canvas.getContext('2d');
 if(!ctx)return;
 var inputs={b:document.getElementById('sb16B'),v:document.getElementById('sb16Velocity'),d:document.getElementById('sb16Diameter'),rho:document.getElementById('sb16Density')};
 for(var k in inputs)if(!inputs[k])return;
 var play=document.getElementById('sb16Play'),reset=document.getElementById('sb16Reset'),visual=document.getElementById('sb16Visual');
 var presets=[].slice.call(document.querySelectorAll('[data-sb16-preset]'));
 var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 var running=!reduce,visible=false,frame=0,last=0,phase=0;
 var stars=[];
 function rand(i){var n=Math.sin(i*132.713+49.62)*43758.5453;return n-Math.floor(n);}
 for(var i=0;i<230;i++)stars.push({x:rand(i+2),y:rand(i+177),r:.35+rand(i+276)*1.65,a:.18+rand(i+385)*.64});
 function text(id,s){var el=document.getElementById(id);if(el)el.textContent=s;}
 function fmt(v,decimal){return Number(v).toLocaleString('pl-PL',{minimumFractionDigits:decimal,maximumFractionDigits:decimal});}
 function get(){
  return encounter(Number(inputs.b.value),Number(inputs.v.value),Number(inputs.d.value),Number(inputs.rho.value));
 }
 function update(){
  var s=get();if(!s)return;
  text('sb16BValue',fmt(s.bRe,2)+' R⊕');text('sb16VelocityValue',fmt(s.vInf,0)+' km/s');
  text('sb16DiameterValue',fmt(s.diameterM,0)+' m');
  text('sb16DensityValue',fmt(s.density,0)+' kg/m³');
  text('sb16Perigee',fmt(s.rpKm,0)+' km');
  text('sb16Status',s.collision?'TRAFIENIE':'MINIĘCIE');
  text('sb16SurfaceSpeed',fmt(s.speedAtSurface,2)+' km/s');
  text('sb16Energy',s.energyMt>=1000?fmt(s.energyMt,0):fmt(s.energyMt,3));
  var state=document.getElementById('sb16Summary');
  if(state){
   state.classList.toggle('is-impact',s.collision);
   if(s.collision)state.textContent='W modelu bez atmosfery tor przecina bryłę Ziemi. Hipotetyczna energia uderzenia to ok. '+fmt(s.energyMt,3)+' Mt TNT. Rzeczywisty wynik zależałby m.in. od rozpadu w atmosferze i budowy ciała.';
   else state.textContent='Model przewiduje minięcie Ziemi: najbliższa odległość od środka wynosi '+fmt(s.rpKm,0)+' km, czyli około '+fmt(s.altitudeKm,0)+' km ponad umowną powierzchnią. Nie jest to prognoza żadnej prawdziwej planetoidy.';
  }
  presets.forEach(function(btn){
   var map={safe:[3,15,150,2000],near:[1.6,7,120,1800],impact:[.6,15,220,2800]};
   var x=map[btn.getAttribute('data-sb16-preset')];
   var active=!!x&&x[0]===s.bRe&&x[1]===s.vInf&&x[2]===s.diameterM&&x[3]===s.density;
   btn.classList.toggle('is-active',active);btn.setAttribute('aria-pressed',active?'true':'false');
  });
  draw();
 }
 function glow(cx,cy,r){
  var g=ctx.createRadialGradient(cx,cy,0,cx,cy,r);
  g.addColorStop(0,'rgba(156,195,238,.44)');g.addColorStop(.4,'rgba(114,127,202,.18)');g.addColorStop(1,'rgba(48,54,109,0)');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,r,0,2*Math.PI);ctx.fill();
 }
 function planet(cx,cy,r){
  glow(cx,cy,r*3.1);
  var g=ctx.createRadialGradient(cx-r*.35,cy-r*.38,r*.07,cx,cy,r);
  g.addColorStop(0,'#e7f3ff');g.addColorStop(.3,'#6295c5');g.addColorStop(.68,'#335688');g.addColorStop(1,'#142441');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,r,0,2*Math.PI);ctx.fill();
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,2*Math.PI);ctx.clip();
  ctx.fillStyle='#799da8';ctx.beginPath();ctx.ellipse(cx-r*.27,cy-r*.25,r*.28,r*.41,-.62,0,2*Math.PI);ctx.fill();
  ctx.fillStyle='#527a8d';ctx.beginPath();ctx.ellipse(cx+r*.3,cy+r*.27,r*.3,r*.15,-.3,0,2*Math.PI);ctx.fill();
  ctx.strokeStyle='rgba(237,250,255,.31)';ctx.lineWidth=Math.max(1,r*.07);
  ctx.beginPath();ctx.ellipse(cx,cy,r*.77,r*.32,.1,0,2*Math.PI);ctx.stroke();
  ctx.restore();
  ctx.beginPath();ctx.arc(cx,cy,r,0,2*Math.PI);ctx.strokeStyle='#a8c2df';ctx.lineWidth=1.2;ctx.stroke();
 }
 function rock(x,y,r,ang){
  ctx.save();ctx.translate(x,y);ctx.rotate(ang);
  var g=ctx.createLinearGradient(-r,-r,r,r);
  g.addColorStop(0,'#f7ded7');g.addColorStop(.45,'#9f8390');g.addColorStop(1,'#44425c');
  ctx.beginPath();
  for(var i=0;i<11;i++){
   var a=i*2*Math.PI/11,r2=r*(.78+.13*Math.sin(i*2.13)+.1*Math.cos(i*5.17));
   if(i===0)ctx.moveTo(Math.cos(a)*r2,Math.sin(a)*r2);else ctx.lineTo(Math.cos(a)*r2,Math.sin(a)*r2);
  }
  ctx.closePath();ctx.fillStyle=g;ctx.fill();ctx.strokeStyle='#f7d4d3';ctx.lineWidth=1.2;ctx.stroke();
  ctx.restore();
 }
 function pathPoints(s,cx,cy,scale,earthRadiusPx){
  var b=s.bRe*EARTH_R_KM,v=s.vInf,mu=EARTH_MU_KM3_S2;
  var p=b*b*v*v/mu,e=Math.sqrt(1+(b*v*v/mu)*(b*v*v/mu));
  var thetaLimit=Math.acos(-1/e),thetaStart=-thetaLimit+.015,thetaEnd=thetaLimit-.015;
  if(s.collision){
   var threshold=EARTH_R_KM+s.diameterM/2000;
   var c=(p/threshold-1)/e;
   thetaEnd=-Math.acos(Math.max(-1,Math.min(1,c)));
  }
  var result=[];
  // Geometry pericentre at Earth-relative angle 0. Rotate to show an encounter.
  var phi=-.18;
  var count=440;
  for(var i=0;i<=count;i++){
   var theta=thetaStart+(thetaEnd-thetaStart)*i/count;
   var rr=p/(1+e*Math.cos(theta));if(!(rr>=0&&rr<EARTH_R_KM*60))continue;
   var x=rr*Math.cos(theta+phi)/EARTH_R_KM*earthRadiusPx+cx;
   var y=rr*Math.sin(theta+phi)/EARTH_R_KM*earthRadiusPx+cy;
   result.push({x:x,y:y});
  }
  return result;
 }
 function draw(){
  var w=canvas.clientWidth||760,h=canvas.clientHeight||620;
  if(w<20||h<20)return;
  var dpr=Math.min(1.7,window.devicePixelRatio||1);if(w*dpr>1600)dpr=1600/w;
  var cw=Math.round(w*dpr),ch=Math.round(h*dpr);if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw;canvas.height=ch;}
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  var gr=ctx.createRadialGradient(w*.55,h*.47,0,w*.5,h*.5,Math.max(w,h)*.75);
  gr.addColorStop(0,'#272c4c');gr.addColorStop(.65,'#11192d');gr.addColorStop(1,'#080d1d');
  ctx.fillStyle=gr;ctx.fillRect(0,0,w,h);
  stars.forEach(function(st){ctx.beginPath();ctx.arc(st.x*w,st.y*h,st.r,0,2*Math.PI);ctx.fillStyle='rgba(237,229,244,'+st.a+')';ctx.fill();});
  var s=get();if(!s)return;
  var earthPx=Math.min(w,h)*.23/Math.max(1,Math.min(2.7,s.perigeeInEarthRadii/2));
  var cx=w*.49,cy=h*.49;
  // stylized concentric distance indicators (not accurate plot scale at larger b)
  for(var i=2;i<=4;i++){
   ctx.beginPath();ctx.arc(cx,cy,earthPx*i,0,2*Math.PI);
   ctx.strokeStyle='rgba(155,163,201,.13)';ctx.lineWidth=1;ctx.setLineDash([3,9]);ctx.stroke();ctx.setLineDash([]);
  }
  var pts=pathPoints(s,cx,cy,1,earthPx);
  if(pts.length){
   ctx.beginPath();pts.forEach(function(pt,i){if(i===0)ctx.moveTo(pt.x,pt.y);else ctx.lineTo(pt.x,pt.y);});
   ctx.strokeStyle='rgba(232,151,180,.18)';ctx.lineWidth=13;ctx.stroke();
   ctx.strokeStyle=s.collision?'#f7a9b2':'#dac0f0';ctx.lineWidth=2.8;ctx.stroke();
   var p=pts[Math.min(pts.length-1,Math.floor((phase%1)*(pts.length-1)))];
   if(p){glow(p.x,p.y,34);rock(p.x,p.y,Math.max(6,Math.min(16,6+s.diameterM/135)),phase*3.6);}
   if(s.collision){
    var hit=pts[pts.length-1];
    if(hit&&phase%1>.95){
     glow(hit.x,hit.y,65);
     ctx.beginPath();ctx.arc(hit.x,hit.y,17+(phase%1-.95)*110,0,2*Math.PI);ctx.strokeStyle='rgba(255,169,170,.85)';ctx.lineWidth=2;ctx.stroke();
    }
   }
  }
  planet(cx,cy,earthPx);
  ctx.textAlign='center';ctx.fillStyle='#e7d5e5';ctx.font='700 12px Arial,sans-serif';
  ctx.fillText('ZIEMIA',cx,Math.max(45,cy-earthPx-24));
  ctx.fillStyle='#baa6bc';ctx.font='11px Arial,sans-serif';
  ctx.fillText(s.collision?'TOR PRZECINA POWIERZCHNIĘ W MODELU':'PRZELOT BEZ ZDERZENIA W MODELU',w*.5,h-49);
  ctx.fillStyle='#8c8da8';ctx.font='10px Arial,sans-serif';
  ctx.fillText('WIZUALIZACJA SCHEMATYCZNA / NIE W SKALI',w*.5,h-30);
 }
 function stop(){if(frame&&window.cancelAnimationFrame)window.cancelAnimationFrame(frame);frame=0;last=0;}
 function schedule(){if(frame||!running||!visible||document.hidden||!window.requestAnimationFrame)return;frame=window.requestAnimationFrame(tick);}
 function tick(now){frame=0;if(!running||!visible||document.hidden)return;
  if(now-last>=35){phase+=last?Math.min(.07,(now-last)/1000)/10:.003;last=now;draw();}schedule();
 }
 function refresh(){if(play){play.textContent=running?'Ⅱ Zatrzymaj':'▶ Uruchom';play.setAttribute('aria-pressed',running?'false':'true');}if(running)schedule();else stop();}
 function apply(name){
  var params={safe:[3,15,150,2000],near:[1.6,7,120,1800],impact:[.6,15,220,2800]}[name];if(!params)return;
  inputs.b.value=String(params[0]);inputs.v.value=String(params[1]);inputs.d.value=String(params[2]);inputs.rho.value=String(params[3]);phase=0;update();
 }
 Object.keys(inputs).forEach(function(key){inputs[key].addEventListener('input',update);});
 presets.forEach(function(btn){btn.addEventListener('click',function(){apply(btn.getAttribute('data-sb16-preset'));});});
 if(reset)reset.addEventListener('click',function(){apply('safe');});
 if(play)play.addEventListener('click',function(){running=!running;refresh();});
 window.addEventListener('resize',draw);
 document.addEventListener('visibilitychange',function(){if(document.hidden)stop();else{draw();schedule();}});
 window.addEventListener('pagehide',stop);
 if(window.IntersectionObserver){
  var observer=new IntersectionObserver(function(items){visible=!!(items[0]&&items[0].isIntersecting);if(visible){draw();schedule();}else stop();},{threshold:.03});observer.observe(visual||canvas);
 }else{visible=true;schedule();}
 update();refresh();draw();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
