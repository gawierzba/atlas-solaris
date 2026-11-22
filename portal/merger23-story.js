/* ATLAS SOLARIS XXIII / editorial waveform and orbit laboratory.
   Uses the existing tested 23.0 physical engine. The drawn horizons, ripples
   and signal progression are illustrative; not NR or actual LIGO data.
   No external dependencies and no automatic animation on article load. */
(function(){
'use strict';
var F=window.ATLAS_MERGER23_CORE;
var canvas=document.getElementById('mg23Canvas'),play=document.getElementById('mg23Play'),
 progress=document.getElementById('mg23Progress'),incline=document.getElementById('mg23Incline');
if(!F||!canvas||!canvas.getContext||!play||!progress||!incline)return;
var ctx=canvas.getContext('2d');if(!ctx)return;
var buttons=[].slice.call(document.querySelectorAll('[data-mg23-preset]'));
var current='gw150914',model=null,running=false,frame=0,t0=0,from=0,resize=null;
var W=1100,H=700,stars=[];
function rnd(n){var v=Math.sin(n*141.52+9.711)*43758.545;return v-Math.floor(v);}
for(var k=0;k<180;k++)stars.push([rnd(k+1),rnd(k+276),.2+rnd(k+516)*1.2,rnd(k+928)*.50+.1]);
function num(v,n){return Number(v).toLocaleString('pl-PL',{minimumFractionDigits:n,maximumFractionDigits:n});}
function put(id,val){var n=document.getElementById(id);if(n)n.textContent=val;}
function frequency(x){if(x<.01)return num(x*1000,2)+' mHz';if(x<1)return num(x,3)+' Hz';return num(x,x<100?1:0)+' Hz';}
function duration(s){if(s>=86400)return num(s/86400,2)+' dni';if(s>=60)return num(s/60,2)+' min';if(s>=1)return num(s,2)+' s';return num(s*1000,1)+' ms';}
function rebuild(){
 model=F.model(F.PRESETS[current],{inclination:Number(incline.value)});
 buttons.forEach(function(b){var active=b.getAttribute('data-mg23-preset')===current;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active));});
 put('mg23InclineOut',num(Number(incline.value),0)+'°');
 put('mg23PresetName',model.title);
 put('mg23Masses',num(model.m1,model.m1>=1e5?0:1)+' / '+num(model.m2,model.m2>=1e5?0:1)+' M☉');
 put('mg23Loss',num(model.energySolar,model.energySolar>=1e4?0:2)+' M☉');
 put('mg23Time',duration(model.seconds));
 put('mg23Note',model.info);
 draw();
}
function fit(){
 var box=canvas.getBoundingClientRect(),dpi=Math.min(window.devicePixelRatio||1,2);
 W=Math.max(320,Math.round(box.width));H=Math.max(430,Math.round(box.height));
 canvas.width=Math.round(W*dpi);canvas.height=Math.round(H*dpi);
 ctx.setTransform(dpi,0,0,dpi,0,0);draw();
}
function text(s,x,y,color,size,align){
 ctx.font=(size||12)+'px Segoe UI,Arial,sans-serif';ctx.fillStyle=color||'#e7d3f1';ctx.textAlign=align||'left';ctx.fillText(s,x,y);
}
function circle(x,y,r,stroke,width){
 ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.strokeStyle=stroke;ctx.lineWidth=width||1;ctx.stroke();
}
function paintOrbit(p,s){
 var yBase=H*.275,xBase=W*.5,outer=Math.min(W*.25,H*.27);
 for(var i=0;i<stars.length;i++){
  var st=stars[i],xx=st[0]*W,yy=st[1]*H*.49;
  ctx.beginPath();ctx.arc(xx,yy,st[2],0,Math.PI*2);ctx.fillStyle='rgba(213,197,248,'+st[3]+')';ctx.fill();
 }
 var wave=ctx.createRadialGradient(xBase,yBase,15,xBase,yBase,outer*1.22);
 wave.addColorStop(0,'rgba(104,61,117,.34)');wave.addColorStop(.5,'rgba(62,46,104,.15)');wave.addColorStop(1,'rgba(2,5,18,0)');
 ctx.fillStyle=wave;ctx.beginPath();ctx.arc(xBase,yBase,outer*1.22,0,Math.PI*2);ctx.fill();
 for(var z=0;z<5;z++){
  var rr=outer*(.43+.18*z);
  circle(xBase,yBase,rr,'rgba(207,117,228,'+(.22-z*.027)+')',1);
 }
 ctx.save();ctx.translate(xBase,yBase);
 if(s.stage==='inspiral'){
  var r=Math.max(s.r,model.rMerge),sep=Math.min(outer*.50,Math.max(18,(r/(model.rStart*.88))*outer*.52));
  var theta=s.orbitalPhase;
  var frac1=model.m2/model.total,frac2=model.m1/model.total;
  var a=theta+(p<.01?0:Math.PI/5),xx1=sep*frac1*2*Math.cos(a),yy1=sep*frac1*2*Math.sin(a)*.52;
  var xx2=-sep*frac2*2*Math.cos(a),yy2=-sep*frac2*2*Math.sin(a)*.52;
  for(var j=0;j<7;j++){
   circle(0,0,10+j*17,'rgba(255,166,121,'+(.055+j*.013)+')',.7);
  }
  for(var n=0;n<2;n++){
   var x=n?xx2:xx1,y=n?yy2:yy1;
   var mass=n?model.m2:model.m1;
   var radius=Math.max(11,Math.min(37,18*Math.sqrt(mass/(model.total/2))));
   var grd=ctx.createRadialGradient(x-radius*.25,y-radius*.45,3,x,y,radius);
   grd.addColorStop(0,'#141222');grd.addColorStop(.77,'#050611');grd.addColorStop(1,'#020308');
   ctx.fillStyle=grd;ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.fill();
   circle(x,y,radius+2,'rgba(255,180,147,.85)',2.5);
   circle(x,y,radius+10,'rgba(182,111,185,.33)',1);
  }
  var rline=Math.min(outer*.72,Math.max(38,sep*1.8));
  circle(0,0,rline,'rgba(190,144,244,.27)',1.2);
 }else{
  var rr=36;
  var grd2=ctx.createRadialGradient(-9,-14,0,0,0,rr);
  grd2.addColorStop(0,'#131021');grd2.addColorStop(.9,'#03040d');grd2.addColorStop(1,'#020309');
  ctx.fillStyle=grd2;ctx.beginPath();ctx.arc(0,0,rr,0,Math.PI*2);ctx.fill();
  circle(0,0,rr+3,'rgba(251,174,154,.75)',3);
  for(var n2=0;n2<5;n2++){
   circle(0,0,rr+11+n2*20,'rgba(201,147,254,'+(.35-n2*.055)*(Math.max(.1,s.amplitude/(model.waveScale/model.rMerge)))+')',1.5);
  }
 }
 ctx.restore();
 text(s.stage==='inspiral'?'FAZA INSPIRALU / ZBLIŻANIE':'RINGDOWN / WYGASZANIE',23,38,'#efbdd7',10);
 text('SCHEMAT ORBIT / NIE W SKALI',23,H*.5-15,'#ac95c0',10);
}
function paintSignal(p){
 var left=35,right=W-29,top=H*.575,bottom=H*.88,mid=(top+bottom)/2;
 var range=bottom-top;
 ctx.fillStyle='rgba(15,13,32,.96)';ctx.fillRect(left-14,top-29,right-left+26,bottom-top+54);
 for(var j=0;j<5;j++){
  var y=top+j*range/4;
  ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(right,y);ctx.strokeStyle='rgba(170,139,199,.16)';ctx.lineWidth=1;ctx.stroke();
 }
 var points=750,peak=model.waveScale/model.rMerge;
 ctx.beginPath();
 for(var i=0;i<points;i++){
  var q=i/(points-1),s=F.sampleAtProgress(model,q);
  var x=left+(right-left)*q;
  var y=mid-s.hp/peak*range*.40;
  if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
 }
 ctx.strokeStyle='#ffc199';ctx.lineWidth=1.6;ctx.stroke();
 var seam=left+(right-left)*.8;
 ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(seam,top);ctx.lineTo(seam,bottom);ctx.strokeStyle='rgba(233,170,235,.75)';ctx.lineWidth=1;ctx.stroke();ctx.setLineDash([]);
 var xMark=left+(right-left)*p;
 ctx.beginPath();ctx.moveTo(xMark,top-7);ctx.lineTo(xMark,bottom+7);ctx.strokeStyle='#c4b2f9';ctx.lineWidth=1.7;ctx.stroke();
 circle(xMark,mid,3,'#fff4f3',2);
 text('POGRĄŻANIE SIĘ W SPIRALI',left,top-8,'#d6bfdc',10);
 text('POŁĄCZENIE',seam-5,top-8,'#e5a1c3',10,'right');
 text('WYGASZANIE',seam+8,top-8,'#e5a1c3',10);
 text('WZGLĘDNA AMPLITUDA · SYGNAŁ MODELOWY',left,bottom+26,'#b6a0c5',10);
 text('POSTĘP '+num(p*100,0)+'%',right,bottom+26,'#e6c2cf',10,'right');
}
function draw(){
 if(!model)return;
 var p=Math.max(0,Math.min(1,Number(progress.value)/100)),s=F.sampleAtProgress(model,p);
 ctx.clearRect(0,0,W,H);
 var g=ctx.createLinearGradient(0,0,W,H);g.addColorStop(0,'#151126');g.addColorStop(.63,'#0c0a21');g.addColorStop(1,'#1c112a');
 ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 paintOrbit(p,s);paintSignal(p);
 put('mg23ProgressOut',num(p*100,0)+'%');
 put('mg23Phase',s.stage==='inspiral'?'Zbliżanie':'Wygaszanie');
 put('mg23Frequency',frequency(s.frequency));
 put('mg23Separation',s.stage==='inspiral'?num(s.distanceKm,s.distanceKm>1000?0:1)+' km':'Jeden horyzont');
 put('mg23Status',s.stage==='inspiral'?'Fale grawitacyjne odbierają układowi energię. Orbita się kurczy, a częstotliwość narasta. To uproszczona faza inspiralu w przybliżeniu kwadrupolowym.':'W modelu powstał pojedynczy obiekt. Pozostałe drgania zanikają wykładniczo — część nazywana ringdown. Przejście jest fenomenologiczne.');
}
function stop(){
 running=false;play.textContent='▶ Odtwórz zderzenie';play.setAttribute('aria-pressed','false');
 if(frame){cancelAnimationFrame(frame);frame=0;}
}
function tick(now){
 if(!running)return;
 var p0=from+(now-t0)/5200;
 if(p0>=1){progress.value=100;draw();stop();return;}
 progress.value=(100*p0).toFixed(2);draw();frame=requestAnimationFrame(tick);
}
play.addEventListener('click',function(){
 if(running){stop();return;}
 if(Number(progress.value)>=99.98)progress.value=0;
 running=true;play.textContent='Ⅱ Zatrzymaj zderzenie';play.setAttribute('aria-pressed','true');
 t0=performance.now();from=Number(progress.value)/100;frame=requestAnimationFrame(tick);
});
buttons.forEach(function(b){b.addEventListener('click',function(){stop();current=b.getAttribute('data-mg23-preset');progress.value=0;rebuild();});});
incline.addEventListener('input',function(){stop();rebuild();});
progress.addEventListener('input',function(){stop();draw();});
document.addEventListener('visibilitychange',function(){if(document.hidden)stop();});
window.addEventListener('resize',function(){fit();},{passive:true});
if(window.ResizeObserver){resize=new ResizeObserver(fit);resize.observe(canvas);}
rebuild();fit();
})();