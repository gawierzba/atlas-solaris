/* ATLAS SOLARIS 25 / Two zodiacs, one sky.
   12 equal 30-degree tropical signs are drawn inside 13 UNEQUAL sectors.
   The astronomical sectors are approximate calibrated 2026 crossings provided
   by the original zodiac25-core.js, NOT full IAU polygons.
   Canvas background stars are illustrative, not Gaia catalogue data.
   UI accessible with date and preset buttons; no automatic 3D loading. */
(function(){
'use strict';
var C=window.ATLAS_ZODIAC25_CORE;
var canvas=document.getElementById('zo25Canvas'),date=document.getElementById('zo25Date');
if(!C||!canvas||!canvas.getContext||!date)return;
var ctx=canvas.getContext('2d');if(!ctx)return;
var W=780,H=680,mode='both',stars=[],sectorColors=['#9b9bff','#9cd3f2','#8bd6d8','#a7b8fd','#c4aaff','#cda2ed','#aeacf5','#f1afd5','#f0b0e9','#c4aeff','#9fbcef','#b8b7f2','#98cddb'];
var constNames=C.CATALOG.map(function(x){return x.name;});
var signs=C.SIGNS;
var glyphs=C.CATALOG.map(function(x){return x.symbol;});
var overlay=document.getElementById('zo25Status');
for(var i=0;i<230;i++){
 var sx=(Math.sin(i*134.345+39.15)*43758.545)%1,sy=(Math.sin(i*42.915+93.37)*97123.221)%1;
 stars.push([(sx+1)%1,(sy+1)%1,.4+Math.abs(Math.sin(i*68.2))*1.35,.18+Math.abs(Math.sin(i*42.75))*.50]);
}
function write(id,text){var n=document.getElementById(id);if(n)n.textContent=text;}
function fmt(x,d){return Number(x).toLocaleString('pl-PL',{minimumFractionDigits:d,maximumFractionDigits:d});}
function label(t,x,y,size,color,align,font){
 ctx.fillStyle=color||'#e9dbfc';ctx.font=(font||'600')+' '+(size||12)+'px Segoe UI,Arial,sans-serif';
 ctx.textAlign=align||'center';ctx.textBaseline='middle';ctx.fillText(t,x,y);
}
function drawArc(cx,cy,r0,r1,start,w,color,opacity){
 var a=(start-90)*Math.PI/180,b=(start+w-90)*Math.PI/180;
 ctx.beginPath();ctx.arc(cx,cy,r1,a,b);ctx.arc(cx,cy,r0,b,a,true);ctx.closePath();
 ctx.fillStyle=color;ctx.globalAlpha=opacity===undefined?1:opacity;ctx.fill();ctx.globalAlpha=1;
}
function polar(cx,cy,r,degrees){
 var a=(degrees-90)*Math.PI/180;return [cx+Math.cos(a)*r,cy+Math.sin(a)*r];
}
function pathCircle(cx,cy,r,col){
 ctx.beginPath();ctx.arc(cx,cy,r,0,2*Math.PI);ctx.strokeStyle=col;ctx.lineWidth=1;ctx.stroke();
}
function fit(){
 var box=canvas.getBoundingClientRect();
 W=Math.max(260,Math.round(box.width));H=Math.max(360,Math.round(box.height));
 var dpr=Math.min(2,window.devicePixelRatio||1);
 canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
 draw();
}
function parseDate(){
 var v=date.value;
 if(!/^20\d\d-\d\d-\d\d$/.test(v))return new Date('2026-11-22T12:00:00Z');
 var t=new Date(v+'T12:00:00Z');
 if(!Number.isFinite(t.getTime()))return new Date('2026-11-22T12:00:00Z');
 return t;
}
function draw(){
 var d=parseDate(),year=d.getUTCFullYear(),l=C.sunLongitude(d);
 var sign=C.sign(l),constellation=C.zone(l,year),segments=C.sectors(year);
 var cx=W*.5,cy=H*.505,rad=Math.max(114,Math.min(W*.39,H*.38,245));
 var ringInner=rad*.69,ringOuter=rad*.94;
 ctx.clearRect(0,0,W,H);
 var grad=ctx.createRadialGradient(cx,cy,10,cx,cy,Math.max(W,H)*.72);
 grad.addColorStop(0,'#21143e');grad.addColorStop(.65,'#0e0b26');grad.addColorStop(1,'#090b21');
 ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
 for(var j=0;j<stars.length;j++){
  var z=stars[j];ctx.beginPath();ctx.arc(z[0]*W,z[1]*H,z[2],0,Math.PI*2);
  ctx.fillStyle='rgba(220,211,252,'+z[3]+')';ctx.fill();
 }
 // Solar annual direction ring: unequal IAU-sky-region approximations on outer ring.
 segments.forEach(function(s,i){
  var active=s.id===constellation.id;
  drawArc(cx,cy,ringInner,ringOuter,s.start,s.width,
    active?'#f0b8df':sectorColors[i],active?1:.55);
  if(s.width>11){
   var at=polar(cx,cy,rad*.815,s.start+s.width*.5);
   var sz=W<540?8:10;
   label(s.id,at[0],at[1],sz,active?'#30142e':'#1d173d','center','800');
  }
 });
 // Band defining the 12 fixed tropical signs.
 if(mode==='both'){
  for(var i2=0;i2<12;i2++){
   drawArc(cx,cy,rad*.46,rad*.65,i2*30,30,i2===sign.index?'#b5edf5':'#7376ba',i2===sign.index?1:.50);
   var at2=polar(cx,cy,rad*.555,i2*30+15);
   label(['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'][i2],at2[0],at2[1],
    W<480?14:19,i2===sign.index?'#17213e':'#efe4ff');
  }
 }
 pathCircle(cx,cy,ringInner-2,'#a38ec369');pathCircle(cx,cy,ringOuter+2,'#ac93cb67');
 if(mode==='both')pathCircle(cx,cy,rad*.455,'#b4abc37c');
 // Sun's apparent ecliptic longitude marker.
 var point=polar(cx,cy,rad*.84,l);
 var glow=ctx.createRadialGradient(point[0],point[1],0,point[0],point[1],31);
 glow.addColorStop(0,'rgba(255,244,252,.88)');glow.addColorStop(.22,'rgba(250,176,231,.65)');glow.addColorStop(1,'rgba(240,135,240,0)');
 ctx.fillStyle=glow;ctx.beginPath();ctx.arc(point[0],point[1],31,0,Math.PI*2);ctx.fill();
 ctx.beginPath();ctx.arc(point[0],point[1],7,0,2*Math.PI);ctx.fillStyle='#fff6fa';ctx.fill();
 var centerR=rad*.43;
 ctx.beginPath();ctx.arc(cx,cy,centerR,0,Math.PI*2);ctx.fillStyle='rgba(12,14,41,.90)';ctx.fill();
 label('☉',cx,cy-rad*.155,28,'#fad0ef','center','400');
 label('SŁOŃCE',cx,cy-rad*.02,11,'#baa6d8');
 label(fmt(l,1)+'°',cx,cy+rad*.115,W<530?25:32,'#f5e7ff','center','400');
 label('DŁUGOŚĆ EKLIPTYCZNA',cx,cy+rad*.235,8,'#a79acb');
 label(mode==='both'?'13 GWIAZDOZBIORÓW + 12 ZNAKÓW':'13 OBSZARÓW NA EKLIPTYCE',17,34,10,'#e0c5f2','left');
 label('SCHEMAT KĄTÓW · NIE MAPA KATALOGOWYCH GWIAZD',17,H-29,W<520?8:10,'#ab9ac5','left');
 // Rays mark axes of λ = 0, 90, 180, 270 deg.
 for(var q=0;q<4;q++){
  var ap=polar(cx,cy,rad*.99,q*90);
  label(q*90+'°',ap[0],ap[1],9,'#9c8fc1');
 }
 write('zo25Lambda',fmt(l,2)+'°');
 write('zo25Sign',sign.name);
 write('zo25Constellation',constellation.name);
 write('zo25Width',fmt(constellation.width,1)+'°');
 write('zo25SunInfo','W dniu '+d.toLocaleDateString('pl-PL',{timeZone:'UTC',day:'numeric',month:'long',year:'numeric'})+
  ' tropikalny znak to '+sign.name+', a przybliżona astronomiczna konstelacja na tle Słońca: '+constellation.name+'.');
 var next=C.nextIngress(d);
 if(next&&next.next){
  write('zo25Next',next.next.name+' · ~'+next.date.toLocaleDateString('pl-PL',{timeZone:'UTC',day:'numeric',month:'short',year:'numeric'}));
 }
 write('zo25Fact',constellation.fact);
 write('zo25Status',mode==='both'?
  'Zewnętrzny pierścień: nierówne sektory 13 konstelacji. Wewnętrzny: 12 równych znaków po 30°. Jasny punkt oznacza przybliżone położenie Słońca.':
  'Pokazujesz astronomiczne gwiazdozbiory przecięte ekliptyką. Odstępy i przejścia pochodzą z uproszczonego modelu roku '+year+', a nie z dokładnych wielokątów IAU.');
}
date.addEventListener('change',draw);
[].slice.call(document.querySelectorAll('[data-zo25-mode]')).forEach(function(b){
 b.addEventListener('click',function(){
  mode=b.getAttribute('data-zo25-mode');
  [].slice.call(document.querySelectorAll('[data-zo25-mode]')).forEach(function(el){el.setAttribute('aria-pressed',String(el===b));});
  draw();
 });
});
[].slice.call(document.querySelectorAll('[data-zo25-day]')).forEach(function(b){
 b.addEventListener('click',function(){
  var mode=b.getAttribute('data-zo25-day'),y=parseDate().getUTCFullYear(),v=null;
  if(mode==='equinox')v=C.solarDateAtLongitude(y,0);
  else if(mode==='solstice')v=C.solarDateAtLongitude(y,90);
  else if(mode==='ophiuchus')v=C.nearMidDate(y,'Oph');
  if(v){date.value=v.toISOString().slice(0,10);draw();}
 });
});
canvas.addEventListener('click',function(ev){
 var rect=canvas.getBoundingClientRect(),cx=rect.width*.5,cy=rect.height*.505;
 var x=ev.clientX-rect.left-cx,y=ev.clientY-rect.top-cy;
 var r=Math.hypot(x,y),radius=Math.max(114,Math.min(rect.width*.39,rect.height*.38,245));
 if(r<radius*.43||r>radius*1.02)return;
 var lambda=C.mod(Math.atan2(y,x)*180/Math.PI+90),d=C.solarDateAtLongitude(parseDate().getUTCFullYear(),lambda);
 if(d){date.value=d.toISOString().slice(0,10);draw();}
});
window.addEventListener('resize',fit,{passive:true});
if(window.ResizeObserver)new ResizeObserver(fit).observe(canvas);
fit();
})();