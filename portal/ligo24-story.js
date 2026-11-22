/* ATLAS SOLARIS XXIV — ideal single-pass Michelson demonstrator.
   Optical physics is delegated to the tested ATLAS_LIGO24_CORE.
   Mirror excursions on Canvas are magnified by about 10^19 and are NOT to scale.
   The original dual-site detector simulator is launched manually and unchanged. */
(function(){
'use strict';
var phys=window.ATLAS_LIGO24_CORE;
var canvas=document.getElementById('li24Canvas'),amp=document.getElementById('li24Amplitude'),
  phase=document.getElementById('li24Phase'),play=document.getElementById('li24Play');
if(!phys||!canvas||!canvas.getContext||!amp||!phase||!play)return;
var ctx=canvas.getContext('2d');if(!ctx)return;
var W=700,H=620,dpr=1,running=false,raf=0,last=0;
var reduce=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
function n(x,d){return Number(x).toLocaleString('pl-PL',{minimumFractionDigits:d,maximumFractionDigits:d});}
function put(id,v){var e=document.getElementById(id);if(e)e.textContent=v;}
function power(x,p){var z=x===0?'0':n(x/(Math.pow(10,p)),2);return z+' × 10'+(p===-18?'⁻¹⁸':p===-21?'⁻²¹':p===-11?'⁻¹¹':'⁻¹⁹');}
function line(x,y,a,b,color,width){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(a,b);ctx.lineWidth=width||1;ctx.strokeStyle=color;ctx.stroke();}
function txt(s,x,y,size,color,align){ctx.font='700 '+(size||11)+'px Segoe UI,Arial,sans-serif';ctx.textAlign=align||'left';ctx.fillStyle=color||'#b7d6ed';ctx.fillText(s,x,y);}
function disk(x,y,r,c){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=c;ctx.fill();}
function fit(){
 var b=canvas.getBoundingClientRect();
 W=Math.max(260,Math.round(b.width));H=Math.max(350,Math.round(b.height));
 dpr=Math.min(window.devicePixelRatio||1,2);
 canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);
 ctx.setTransform(dpr,0,0,dpr,0,0);draw();
}
function draw(){
 var a=Number(amp.value)*1e-21,angle=Number(phase.value)*Math.PI/180;
 var strain=a*Math.sin(angle),o=phys.opticalResponse(strain);
 put('li24AmplitudeOut',n(a/1e-21,2)+' × 10⁻²¹');
 put('li24PhaseOut',n(Number(phase.value),0)+'°');
 put('li24Strain',n(strain/1e-21,3)+' × 10⁻²¹');
 put('li24Delta',n(o.differential/1e-18,3)+' × 10⁻¹⁸ m');
 put('li24Optical',n(o.phase/1e-11,4)+' × 10⁻¹¹ rad');
 put('li24Dark',n(o.darkPort/1e-21,4)+' × 10⁻²¹');
 put('li24Status',a===0?'Brak fali w modelu: oba ramiona pozostają równe i idealny port wyjściowy jest ciemny.':Math.abs(strain)<1e-28?'W tej fazie przejście fali przez zero: chwilowy sygnał optyczny również wynosi zero.':'Jedno ramię jest chwilowo dłuższe, drugie krótsze. Światło wraca z minimalną różnicą faz — odczyt fotodiody w modelu pozostaje ekstremalnie mały.');
 var gr=ctx.createLinearGradient(0,0,W,H);
 gr.addColorStop(0,'#132c48');gr.addColorStop(.7,'#07152b');gr.addColorStop(1,'#050c1b');
 ctx.fillStyle=gr;ctx.fillRect(0,0,W,H);
 // Geometric schematic: two arms occupy only a tiny fraction of the actual length.
 var compact=W<530;
 var cx=W*.29,cy=H*.45;
 var arm=Math.min(W*.47,H*.42);
 var ex=cx+arm+strain*1e18*6;
 var ey=cy-arm+strain*1e18*6;
 for(var t=0;t<7;t++){
  var mm=t*arm/6;
  line(cx+mm,cy-7,cx+mm,cy+7,'rgba(179,221,246,.06)',1);
  line(cx-7,cy-mm,cx+7,cy-mm,'rgba(179,221,246,.06)',1);
 }
 // Laser source and two paths. Red accent is illustrative; real 1064 nm is IR.
 line(cx-70,cy,cx,cy,'#ff97aa',5);
 line(cx,cy,ex,cy,'#ff97aa',4);
 line(cx,cy,cx,ey,'#ff97aa',4);
 line(cx-70,cy,cx,cy,'#ffe2e8',1.2);
 line(cx,cy,ex,cy,'#ffcbd0',1.1);
 line(cx,cy,cx,ey,'#ffcbd0',1.1);
 line(cx,cy,cx,cy+52,'rgba(165,222,255,.8)',3);
 ctx.save();ctx.translate(cx,cy);ctx.rotate(-Math.PI/4);ctx.fillStyle='#d4f6ff';ctx.fillRect(-4,-15,8,30);ctx.restore();
 // Multiple reflections in actual interferometer are omitted.
 ctx.fillStyle='#b5defb';ctx.fillRect(ex-6,cy-24,12,48);ctx.fillRect(cx-24,ey-6,48,12);
 ctx.fillStyle='#e8f9ff';ctx.fillRect(ex-7,cy-17,4,34);ctx.fillRect(cx-17,ey-7,34,4);
 disk(cx,cy+66,12,'#6b8bab');disk(cx,cy+66,5,'#ceeaff');
 // Scaled displacement visual only
 var sense=n(Math.abs(strain)/1e-21,2);
 txt('ZWIERCIADŁO X',Math.min(W-20,ex),cy+42,compact?8:10,'#bedff4','right');
 txt('ZWIERCIADŁO Y',cx+38,Math.max(61,ey+7),compact?8:10,'#bedff4');
 txt('DZIELNIK',cx+19,cy-14,10,'#daeaf7');
 txt('LASER',Math.max(8,cx-100),cy-12,10,'#ffb7c4');
 txt('ODCZYT',cx+22,cy+69,10,'#d2e7f8');
 txt('4 km / ramię',Math.min(W-19,(cx+ex)/2),cy-14,10,'#a8c4e5','right');
 txt('4 km / ramię',cx+16,Math.max(45,(cy+ey)/2),10,'#a8c4e5');
 txt('SZKIC / RUCH LUSTER SZTUCZNIE POWIĘKSZONY',17,32,compact?8:10,'#b3cade');
 // A miniature sine wave at the bottom tracks wave phase.
 var y0=H*.77,bh=Math.min(54,H*.10),left=20,right=W-20;
 for(var j=0;j<4;j++){var yy=y0+(-1+j*.66)*bh;line(left,yy,right,yy,'rgba(146,192,221,.13)',1);}
 ctx.beginPath();
 for(var i=0;i<=400;i++){
  var x=left+(right-left)*i/400;
  var phi=(i/400)*Math.PI*2;
  var y=y0-Math.sin(phi)*bh;
  if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
 }
 ctx.lineWidth=2;ctx.strokeStyle='#9fddfc';ctx.stroke();
 var px=left+(right-left)*(Number(phase.value)/360);
 line(px,y0-bh-9,px,y0+bh+9,'#f6bed4',1.6);
 disk(px,y0-Math.sin(angle)*bh,5,'#fff0f4');
 txt('FAZA FALI 0–360°',left,y0-bh-21,10,'#b8d9ef');
 txt('AMPLITUDA  h = '+sense+' × 10⁻²¹',left,H-28,10,'#b8d9ef');
 txt('POMIAR ΔL NIE OZNACZA, ŻE TAK WIDAĆ LUSTRA',W-17,H-28,compact?8:9,'#b8d9ef','right');
}
function stop(){
 running=false;play.textContent='▶ Uruchom falę';play.setAttribute('aria-pressed','false');
 if(raf){cancelAnimationFrame(raf);raf=0;}
}
function tick(t){
 if(!running)return;
 if(!last)last=t;
 var dt=Math.min(48,t-last);last=t;
 var q=(Number(phase.value)+dt*.047)%360;
 phase.value=q.toFixed(1);draw();
 raf=requestAnimationFrame(tick);
}
play.addEventListener('click',function(){
 if(running){stop();return;}
 running=true;last=0;play.textContent='Ⅱ Zatrzymaj falę';play.setAttribute('aria-pressed','true');raf=requestAnimationFrame(tick);
});
amp.addEventListener('input',draw);
phase.addEventListener('input',function(){stop();draw();});
document.addEventListener('visibilitychange',function(){if(document.hidden)stop();});
window.addEventListener('resize',fit,{passive:true});
if(window.ResizeObserver){new ResizeObserver(fit).observe(canvas);}
fit();
})();