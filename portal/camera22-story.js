/* ATLAS SOLARIS 22 / Optical bench: aberration and frequency shift only.
   Stars are schematic; no Kerr ray-tracing in this additional explanatory panel.
   Original high-fidelity cockpit engine is loaded on explicit request below. */
(function(){
'use strict';
var C=document.getElementById('cv22Canvas');
if(!C||!C.getContext)return;
var ctx=C.getContext('2d'),speed=document.getElementById('cv22Speed'),angle=document.getElementById('cv22Angle'),p=document.querySelectorAll('[data-cv22-speed]');
if(!speed||!angle)return;
var stars=[],N=470;
function pseudo(i){var n=Math.sin(i*147.531+23.86)*43758.5453123;return n-Math.floor(n);}
for(var i=0;i<N;i++){
 var u=2*pseudo(1+i)-1,theta=Math.acos(u),phi=2*Math.PI*pseudo(i+1353);
 stars.push({theta:theta,phi:phi,m:.5+pseudo(i+2771)*1.3,a:.28+pseudo(i+3725)*.60});
}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function aberration(beta,theta){var mu=Math.cos(theta);return Math.acos(clamp((mu+beta)/(1+beta*mu),-1,1));}
function doppler(beta,theta){return(1+beta*Math.cos(theta))/Math.sqrt(1-beta*beta);}
window.ATLAS_CV22_PHYSICS={aberration:aberration,doppler:doppler};
function fmt(n,places){return n.toLocaleString('pl-PL',{minimumFractionDigits:places,maximumFractionDigits:places});}
function put(id,t){var el=document.getElementById(id);if(el)el.textContent=t;}
var dpr=1,W=800,H=600;
function fit(){
 var r=C.getBoundingClientRect();W=Math.max(280,Math.round(r.width));H=Math.max(280,Math.round(r.height));
 dpr=Math.min(window.devicePixelRatio||1,2);C.width=Math.round(W*dpr);C.height=Math.round(H*dpr);
 ctx.setTransform(dpr,0,0,dpr,0,0);paint();
}
function drawLabel(text,x,y,align){ctx.font='10px Segoe UI, sans-serif';ctx.fillStyle='#94cbd2';ctx.textAlign=align||'left';ctx.fillText(text,x,y);}
function paint(){
 var beta=Number(speed.value),theta=Number(angle.value)*Math.PI/180;
 put('cv22SpeedOut',fmt(beta,2)+' c');put('cv22AngleOut',fmt(Number(angle.value),0)+'°');
 var tPrime=aberration(beta,theta),factor=doppler(beta,theta);
 put('cv22AngleRead',fmt(tPrime*180/Math.PI,1)+'°');put('cv22DopplerRead',fmt(factor,3)+'×');
 put('cv22Status',beta===0?'Sonda pozostaje nieruchoma względem wybranego układu: kierunek gwiazdy i częstotliwość światła nie ulegają zmianie.':factor>1.001?'W wybranym kierunku światło ma wyższą częstotliwość; gwiazda przesuwa się pozornie ku osi lotu.':'W wybranym kierunku światło ma niższą częstotliwość; kierunek także ulega aberracji.');
 [].forEach.call(p,function(btn){btn.className=Math.abs(Number(btn.getAttribute('data-cv22-speed'))-beta)<.005?'is-active':'';});
 ctx.clearRect(0,0,W,H);
 var cx=W/2,cy=H*.53,R=Math.min(W*.43,H*.43);
 var gradient=ctx.createRadialGradient(cx,cy,10,cx,cy,R*1.35);
 gradient.addColorStop(0,'#163c49');gradient.addColorStop(.7,'#071625');gradient.addColorStop(1,'#020b14');
 ctx.fillStyle=gradient;ctx.fillRect(0,0,W,H);
 ctx.save();ctx.beginPath();ctx.arc(cx,cy,R,0,Math.PI*2);ctx.clip();
 for(var z=0;z<4;z++){
  ctx.beginPath();ctx.arc(cx,cy,R*(z+1)/4,0,Math.PI*2);ctx.strokeStyle='rgba(130,202,211,.20)';ctx.lineWidth=.8;ctx.stroke();
 }
 for(var spoke=0;spoke<12;spoke++){
  var a=spoke*Math.PI/6;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+R*Math.cos(a),cy+R*Math.sin(a));ctx.strokeStyle='rgba(130,202,211,.12)';ctx.stroke();
 }
 for(var i=0;i<N;i++){
  var s=stars[i],tt=aberration(beta,s.theta),rr=R*tt/Math.PI;
  var x=cx+Math.cos(s.phi)*rr,y=cy+Math.sin(s.phi)*rr,dd=doppler(beta,s.theta);
  ctx.beginPath();ctx.arc(x,y,s.m*(dd>1.5?1.14:1),0,Math.PI*2);
  ctx.fillStyle=dd>1.3?'rgba(183,235,255,'+s.a+')':dd<.75?'rgba(255,173,170,'+s.a+')':'rgba(239,248,246,'+s.a+')';
  ctx.fill();
 }
 var srcx=cx+Math.cos(-Math.PI/3)*R*tPrime/Math.PI,srcy=cy+Math.sin(-Math.PI/3)*R*tPrime/Math.PI;
 ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(srcx,srcy);ctx.strokeStyle='#9dfff0';ctx.lineWidth=1.6;ctx.stroke();
 ctx.beginPath();ctx.arc(srcx,srcy,5,0,Math.PI*2);ctx.fillStyle='#dcfff6';ctx.shadowColor='#9ffaf0';ctx.shadowBlur=18;ctx.fill();ctx.shadowBlur=0;
 ctx.restore();
 ctx.beginPath();ctx.arc(cx,cy,R,0,Math.PI*2);ctx.strokeStyle='#68a4b0';ctx.lineWidth=1;ctx.stroke();
 ctx.beginPath();ctx.arc(cx,cy,5,0,Math.PI*2);ctx.fillStyle='#97fff0';ctx.fill();
 drawLabel('KIERUNEK LOTU',cx,cy-16,'center');
 drawLabel('TYŁ NIEBA / 180°',cx,cy+R+24,'center');
 drawLabel('MAPA CAŁEGO NIEBA · RZUT RÓWNOODLEGŁOŚCIOWY',20,H-17,'left');
}
[].forEach.call(p,function(btn){btn.addEventListener('click',function(){speed.value=btn.getAttribute('data-cv22-speed');paint();});});
speed.addEventListener('input',paint);angle.addEventListener('input',paint);
window.addEventListener('resize',fit);
if(window.ResizeObserver){var observer=new ResizeObserver(fit);observer.observe(C);}
fit();
})();