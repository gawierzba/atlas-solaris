/* ATLAS SOLARIS XXI — Kerr analytic laboratory.
   Geometric (G=c=M=1) Boyer–Lindquist coordinates; a* is dimensionless spin.
   Exact r+, static limit, ZAMO angular velocity, horizon angular velocity,
   Bardeen/Press/Teukolsky ISCOs and ideal extractable spin energy fraction.
   Canvas2D is an explanatory cross-section, not ray tracing or geodesic integration.
*/
(function(){
'use strict';
var G=6.67430e-11,C=299792458,MSUN=1.98847e30,KM=1000;
var DEG=Math.PI/180;
function validSpin(a){return Number.isFinite(a)&&a>=0&&a<=1;}
function gravitationalRadiusKm(massSolar){
 return massSolar>0&&Number.isFinite(massSolar)?G*MSUN*massSolar/(C*C*KM):NaN;
}
function horizonRg(a){
 return validSpin(a)?1+Math.sqrt(1-a*a):NaN;
}
function staticLimitRg(a,thetaDeg){
 if(!validSpin(a)||!Number.isFinite(thetaDeg)||thetaDeg<0||thetaDeg>180)return NaN;
 var c=Math.cos(thetaDeg*DEG);
 return 1+Math.sqrt(Math.max(0,1-a*a*c*c));
}
function ergosphereWidthRg(a,thetaDeg){
 var h=horizonRg(a),s=staticLimitRg(a,thetaDeg);
 return Number.isFinite(h)&&Number.isFinite(s)?Math.max(0,s-h):NaN;
}
function horizonOmega(a){
 if(!validSpin(a))return NaN;
 return a/(2*horizonRg(a));
}
function zamoOmega(a,r,thetaDeg){
 if(!validSpin(a)||!Number.isFinite(r)||!Number.isFinite(thetaDeg)||thetaDeg<0||thetaDeg>180||r<horizonRg(a))return NaN;
 var th=thetaDeg*DEG,aa=a*a,Delta=r*r-2*r+aa;
 var A=(r*r+aa)*(r*r+aa)-aa*Delta*Math.sin(th)*Math.sin(th);
 return A>0?2*a*r/A:NaN;
}
function draggingRatio(a,r,thetaDeg){
 if(!validSpin(a)||!Number.isFinite(r)||r<horizonRg(a))return NaN;
 if(a===0)return 0;
 return zamoOmega(a,r,thetaDeg)/horizonOmega(a);
}
function extractableFraction(a){
 if(!validSpin(a))return NaN;
 return 1-Math.sqrt((1+Math.sqrt(1-a*a))/2);
}
function iscoRg(a,prograde){
 if(!validSpin(a))return NaN;
 var one=1-a*a;
 var z1=1+Math.cbrt(one)*(Math.cbrt(1+a)+Math.cbrt(1-a));
 var z2=Math.sqrt(3*a*a+z1*z1);
 var t=Math.sqrt(Math.max(0,(3-z1)*(3+z1+2*z2)));
 return 3+z2+(prograde?-t:t);
}
function pointStatus(a,r,thetaDeg){
 var h=horizonRg(a),e=staticLimitRg(a,thetaDeg);
 if(!(r>=0&&Number.isFinite(r)&&Number.isFinite(e)))return 'invalid';
 if(r<=h+1e-9)return 'behind-horizon';
 if(r<e-1e-9)return 'ergosphere';
 return 'outside';
}
function mission(massSolar,a,r,thetaDeg){
 var rg=gravitationalRadiusKm(massSolar),h=horizonRg(a),e=staticLimitRg(a,thetaDeg),state=pointStatus(a,r,thetaDeg);
 if(!(rg>0&&Number.isFinite(h)&&Number.isFinite(e))||state==='invalid')return null;
 return {massSolar:massSolar,spin:a,r:r,thetaDeg:thetaDeg,rgKm:rg,
  horizonRg:h,horizonKm:rg*h,staticLimitRg:e,staticLimitKm:rg*e,
  ergosphereWidthRg:Math.max(0,e-h),state:state,
  omegaH:horizonOmega(a),
  zamoOmega:state==='behind-horizon'?NaN:zamoOmega(a,r,thetaDeg),
  draggingRatio:state==='behind-horizon'?NaN:draggingRatio(a,r,thetaDeg),
  extractableFraction:extractableFraction(a),
  iscoProgradeRg:iscoRg(a,true),iscoRetrogradeRg:iscoRg(a,false)};
}
window.ATLAS_KE21_PHYSICS={G:G,C:C,MSUN:MSUN,gravitationalRadiusKm:gravitationalRadiusKm,
 horizonRg:horizonRg,staticLimitRg:staticLimitRg,ergosphereWidthRg:ergosphereWidthRg,
 horizonOmega:horizonOmega,zamoOmega:zamoOmega,draggingRatio:draggingRatio,
 extractableFraction:extractableFraction,iscoRg:iscoRg,pointStatus:pointStatus,mission:mission};
function init(){
 var canvas=document.getElementById('ke21Canvas'),ctx=canvas&&canvas.getContext&&canvas.getContext('2d');
 if(!ctx)return;
 var mass=document.getElementById('ke21Mass'),spin=document.getElementById('ke21Spin'),
 radius=document.getElementById('ke21Radius'),theta=document.getElementById('ke21Theta'),
 play=document.getElementById('ke21Play'),reset=document.getElementById('ke21Reset'),
 root=document.getElementById('ke21LabShell');
 if(!mass||!spin||!radius||!theta)return;
 var presets=[].slice.call(document.querySelectorAll('[data-ke21-preset]'));
 var reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 var running=!reduced,visible=false,frame=0,last=0,phase=0;
 var stars=[];
 function pseudo(i){var n=Math.sin(i*131.732+14.827)*43758.5453;return n-Math.floor(n);}
 for(var i=0;i<200;i++)stars.push({x:pseudo(i+1),y:pseudo(i+217),r:.27+pseudo(i+499)*1.45,a:.15+pseudo(i+832)*.55});
 function put(id,value){var el=document.getElementById(id);if(el)el.textContent=value;}
 function fmt(n,d){return Number(n).toLocaleString('pl-PL',{minimumFractionDigits:d,maximumFractionDigits:d});}
 function km(k){
  if(k>=1e9)return fmt(k/1e9,2)+' mld km';
  if(k>=1e6)return fmt(k/1e6,2)+' mln km';
  return fmt(k,k>99?0:2)+' km';
 }
 function get(){return mission(Number(mass.value),Number(spin.value),Number(radius.value),Number(theta.value));}
 function update(){
  var s=get();if(!s)return;
  put('ke21SpinOut',fmt(s.spin,3));put('ke21RadiusOut',fmt(s.r,2)+' rɡ');
  put('ke21ThetaOut',fmt(s.thetaDeg,0)+'°');
  put('ke21Horizon',km(s.horizonKm));
  put('ke21Ergosphere',fmt(s.staticLimitRg,3)+' rɡ');
  put('ke21Dragging',Number.isFinite(s.draggingRatio)?fmt(100*s.draggingRatio,1)+'%':'—');
  put('ke21Extract',fmt(100*s.extractableFraction,2)+'%');
  var el=document.getElementById('ke21Status');
  if(el){
   el.classList.toggle('is-ergo',s.state==='ergosphere');
   el.classList.toggle('is-horizon',s.state==='behind-horizon');
   if(s.state==='behind-horizon')el.textContent='Położenie r = '+fmt(s.r,2)+' rɡ znajduje się na horyzoncie lub za nim. Statyczna sonda nie może tam istnieć; nie podajemy wartości wleczenia dla tego punktu. Zwiększ promień.';
   else if(s.state==='ergosphere')el.textContent='SONDA W ERGOSFERZE. Tu żaden materialny obserwator nie może pozostawać statyczny względem odległych gwiazd. Horyzont nadal leży bliżej centrum; w zasadzie możliwa jest ucieczka.';
   else el.textContent=s.spin===0?'Czarna dziura nie obraca się — ergosfera nie ma grubości. Horyzont i granica statyczności pokrywają się.':'Sonda jest poza ergosferą. Wleczenie układów odniesienia może tu już występować, ale statyczne położenie względem odległych gwiazd pozostaje geometrycznie możliwe.';
  }
  presets.forEach(function(btn){var name=btn.getAttribute('data-ke21-preset'),v={still:0,moderate:.5,fast:.9,extreme:.998}[name],on=Math.abs(v-s.spin)<.00001;
   btn.classList.toggle('is-active',on);btn.setAttribute('aria-pressed',String(on));
  });
  draw();
 }
 function circle(x,y,r,fill){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();}
 function stroke(x1,y1,x2,y2,col,width,dashed){
  ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=col;ctx.lineWidth=width||1;
  if(dashed)ctx.setLineDash([4,7]);ctx.stroke();ctx.setLineDash([]);
 }
 function draw(){
  var w=canvas.clientWidth||730,h=canvas.clientHeight||720;if(w<20||h<20)return;
  var dpr=Math.min(1.7,window.devicePixelRatio||1);if(w*dpr>1650)dpr=1650/w;
  var cw=Math.max(1,Math.round(w*dpr)),ch=Math.max(1,Math.round(h*dpr));
  if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw;canvas.height=ch;}
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  var grad=ctx.createRadialGradient(w*.5,h*.4,0,w*.5,h*.5,Math.max(w,h)*.8);
  grad.addColorStop(0,'#272144');grad.addColorStop(.58,'#151b37');grad.addColorStop(1,'#080d20');
  ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
  stars.forEach(function(z){circle(z.x*w,z.y*h,z.r,'rgba(221,232,255,'+z.a+')');});
  var s=get();if(!s)return;
  var cx=w*.49,cy=h*.435,scale=Math.min(w*.30,h*.29)/Math.max(2.8,s.r*1.04);
  function P(a,r){return{x:cx+Math.sin(a)*r*scale,y:cy-Math.cos(a)*r*scale};}
  // Iso-coordinate contours, not proper distance or a 3D embedding.
  for(var nr=1;nr<=5;nr++){
   ctx.beginPath();ctx.arc(cx,cy,nr*scale,0,Math.PI*2);
   ctx.strokeStyle='rgba(138,158,198,.13)';ctx.lineWidth=.8;ctx.setLineDash([3,8]);ctx.stroke();ctx.setLineDash([]);
  }
  // Cross-section of r_E(theta), in Boyer–Lindquist coordinate radius.
  ctx.beginPath();
  for(var j=0;j<=360;j++){
   var ang=j*Math.PI*2/360,thetaDeg=ang*180/Math.PI;
   var e=staticLimitRg(s.spin,thetaDeg);
   var pt=P(ang,e);if(j===0)ctx.moveTo(pt.x,pt.y);else ctx.lineTo(pt.x,pt.y);
  }
  ctx.closePath();
  var eg=ctx.createRadialGradient(cx,cy,s.horizonRg*scale*.7,cx,cy,2.2*scale);
  eg.addColorStop(0,'rgba(173,107,213,.52)');eg.addColorStop(.6,'rgba(111,72,172,.38)');eg.addColorStop(1,'rgba(81,52,151,.04)');
  ctx.fillStyle=eg;ctx.fill();
  ctx.strokeStyle='rgba(212,175,253,.92)';ctx.lineWidth=1.8;ctx.stroke();
  var rH=s.horizonRg*scale;
  var hg=ctx.createRadialGradient(cx-rH*.2,cy-rH*.25,0,cx,cy,rH);
  hg.addColorStop(0,'#060711');hg.addColorStop(.6,'#060811');hg.addColorStop(.92,'#070916');hg.addColorStop(1,'#251b3d');
  circle(cx,cy,rH,hg);
  ctx.beginPath();ctx.arc(cx,cy,rH,0,Math.PI*2);ctx.strokeStyle='rgba(150,211,233,.9)';ctx.lineWidth=2.0;ctx.stroke();
  // Symbolic rotation streamlines around horizon (schematic only).
  if(s.spin>.0001){
   for(var k=0;k<3;k++){
    var rr=(s.horizonRg+.18+k*.22)*scale,begin=phase*.13*(.65+k*.18)+k*2.1;
    ctx.beginPath();ctx.arc(cx,cy,rr,begin,begin+.65);
    ctx.strokeStyle='rgba(172,199,252,'+(.55-k*.11)+')';ctx.lineWidth=2;ctx.stroke();
   }
  }
  stroke(cx,Math.max(48,cy-3.05*scale),cx,Math.min(h-120,cy+3.15*scale),'rgba(174,193,226,.23)',1,true);
  var a=s.thetaDeg*Math.PI/180,pt=P(a,s.r);
  if(s.r<=6.1){
   stroke(cx,cy,pt.x,pt.y,'rgba(218,239,253,.37)',1.2,true);
   var aura=ctx.createRadialGradient(pt.x,pt.y,0,pt.x,pt.y,29);
   aura.addColorStop(0,s.state==='behind-horizon'?'rgba(252,123,153,.65)':'rgba(169,234,250,.68)');
   aura.addColorStop(1,'rgba(80,130,163,0)');
   circle(pt.x,pt.y,29,aura);
   circle(pt.x,pt.y,6,s.state==='behind-horizon'?'#ff98ad':'#eafaff');
   ctx.beginPath();ctx.arc(pt.x,pt.y,11,0,Math.PI*2);
   ctx.strokeStyle=s.state==='behind-horizon'?'#ffb4bc':'#c5ecff';ctx.lineWidth=1.3;ctx.stroke();
  }
  ctx.font='700 10px Arial,sans-serif';ctx.fillStyle='#dfd6f7';ctx.textAlign='center';
  ctx.fillText('HORYZONT / r₊',cx,Math.max(70,cy-rH-16));
  ctx.textAlign='left';ctx.fillStyle='#a5d9f0';
  ctx.fillText('ERGOSFERA',Math.min(w-109,cx+Math.max(s.horizonRg+.3,1.7)*scale),cy+10);
  // Status cards below the cross-section.
  var panelY=h*.74,px=18,pw=w-36,ph=Math.min(120,h*.16);
  ctx.fillStyle='rgba(14,25,48,.76)';ctx.fillRect(px,panelY,pw,ph);
  ctx.strokeStyle='rgba(128,151,203,.54)';ctx.strokeRect(px+.5,panelY+.5,pw-1,ph-1);
  ctx.textAlign='left';ctx.fillStyle='#b0c7e6';ctx.font='700 10px Arial,sans-serif';
  ctx.fillText('WYMIARY W JEDNOSTKACH rɡ',px+15,panelY+20);
  var bx=px+15,barY=panelY+48,bw=pw-30;
  stroke(bx,barY,bx+bw,barY,'rgba(117,154,206,.36)',7);
  var horizonLine=bx+bw*Math.min(1,s.horizonRg/6),ergoLine=bx+bw*Math.min(1,s.staticLimitRg/6);
  stroke(bx,barY,horizonLine,barY,'rgba(134,212,229,.8)',7);
  stroke(horizonLine,barY,ergoLine,barY,'rgba(214,167,249,.9)',7);
  var pos=bx+bw*(s.r/6),sig=ctx.createRadialGradient(pos,barY,0,pos,barY,18);
  sig.addColorStop(0,'rgba(249,237,255,.63)');sig.addColorStop(1,'rgba(198,181,255,0)');
  circle(pos,barY,18,sig);circle(pos,barY,5,'#eafcff');
  ctx.font='9px Arial,sans-serif';ctx.textAlign='left';ctx.fillStyle='#a8c9da';
  ctx.fillText('0',bx,panelY+78);
  ctx.textAlign='right';ctx.fillText('6 rɡ',bx+bw,panelY+78);
  ctx.textAlign='left';ctx.fillStyle='#c8d1ee';ctx.font='700 9px Arial,sans-serif';
  ctx.fillText('TURKUS — DO HORYZONTU',bx,panelY+ph-13);
  ctx.textAlign='right';ctx.fillStyle='#d2b3eb';ctx.fillText('FIOLET — ERGOSFERA',bx+bw,panelY+ph-13);
  ctx.textAlign='center';ctx.font='9px Arial,sans-serif';ctx.fillStyle='#8ea4c4';
  ctx.fillText('PRZEKRÓJ SCHEMATYCZNY / NIE SKALA ODLEGŁOŚCI FIZYCZNYCH',w*.5,h-36);
 }
 function stop(){if(frame&&window.cancelAnimationFrame)window.cancelAnimationFrame(frame);frame=0;last=0;}
 function schedule(){if(frame||!running||!visible||document.hidden||!window.requestAnimationFrame)return;frame=window.requestAnimationFrame(tick);}
 function tick(t){frame=0;if(!running||!visible||document.hidden)return;
  if(t-last>=45){phase+=last?Math.min(.1,(t-last)/1000)*2.2:.003;last=t;draw();}schedule();
 }
 function playStatus(){if(play){play.textContent=running?'Ⅱ Zatrzymaj ruch':'▶ Uruchom ruch';play.setAttribute('aria-pressed',String(!running));}if(running)schedule();else stop();}
 function preset(name){
  var vals={still:[0,2.7],moderate:[.5,2.3],fast:[.9,1.8],extreme:[.998,1.4]}[name];if(!vals)return;
  spin.value=String(vals[0]);radius.value=String(vals[1]);theta.value='90';phase=0;update();
 }
 mass.addEventListener('change',update);
 spin.addEventListener('input',update);radius.addEventListener('input',update);theta.addEventListener('input',update);
 presets.forEach(function(b){b.addEventListener('click',function(){preset(b.getAttribute('data-ke21-preset'));});});
 if(reset)reset.addEventListener('click',function(){mass.value='4300000';preset('fast');});
 if(play)play.addEventListener('click',function(){running=!running;playStatus();});
 window.addEventListener('resize',draw);
 document.addEventListener('visibilitychange',function(){if(document.hidden)stop();else{draw();schedule();}});
 window.addEventListener('pagehide',stop);
 if(window.IntersectionObserver){var observer=new IntersectionObserver(function(items){visible=!!(items[0]&&items[0].isIntersecting);if(visible){draw();schedule();}else stop();},{threshold:.03});observer.observe(root||canvas);}
 else{visible=true;schedule();}
 update();playStatus();draw();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
