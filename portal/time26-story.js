/* ATLAS SOLARIS 26 — editorial chronoscope of the north celestial pole.
 * Physics: the pre-existing ATLAS_TIME26_CORE, independently ported from ERFA.
 * Rendering: equidistant angular azimuthal projection centered on the J2000
 * north ecliptic pole, reference J2000 star coordinates, no proper motion.
 * Long periods are approximated by precession alone: no nutation/refraction.
 * Canvas star dust is decorative. The original 3D/sky lab is unchanged.
 */
(function(){
'use strict';
var F=window.ATLAS_TIME26_CORE,canvas=document.getElementById('tm26Canvas'),slider=document.getElementById('tm26Year');
if(!F||!canvas||!canvas.getContext||!slider)return;
var ctx=canvas.getContext('2d');if(!ctx)return;
var W=790,H=685,year=2026,play=false,raf=0,last=0,stars=[];
var reduce=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
function fmt(n,p){return Number(n).toLocaleString('pl-PL',{minimumFractionDigits:p,maximumFractionDigits:p});}
function yr(n){n=Math.round(n);return n<=0?(1-n).toLocaleString('pl-PL')+' p.n.e.':n.toLocaleString('pl-PL')+' n.e.';}
function text(id,s){var el=document.getElementById(id);if(el)el.textContent=s;}
function norm(v){return Math.hypot(v[0],v[1],v[2]);}
function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}
function cl(v,a,b){return Math.min(Math.max(v,a),b);}
function polarProj(v,cx,cy,R){
 var ep=F.J2000_ECL,x=dot(v,F.J2000_X),y=dot(v,F.J2000_Y),cos=dot(v,ep);
 var a=Math.acos(cl(cos,-1,1))*180/Math.PI,th=Math.atan2(y,x);
 var rad=R*a/54;
 return [cx+Math.cos(th)*rad,cy-Math.sin(th)*rad,a];
}
function label(str,x,y,size,color,align,font){
 ctx.font=(font||'600')+' '+(size||12)+'px Segoe UI,Arial,sans-serif';
 ctx.textAlign=align||'left';ctx.textBaseline='middle';ctx.fillStyle=color||'#d9eee7';ctx.fillText(str,x,y);
}
function pathRing(cx,cy,r,color,width){
 ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.lineWidth=width||1;ctx.strokeStyle=color;ctx.stroke();
}
function star(x,y,r,c){
 ctx.beginPath();ctx.arc(x,y,r,0,2*Math.PI);ctx.fillStyle=c;ctx.fill();
}
for(var i=0;i<160;i++){
 var q=(Math.sin((i+7)*118.92)*43758.545)%1,p=(Math.sin((i+97)*92.27)*84172.39)%1;
 stars.push([(q+1)%1,(p+1)%1,.5+Math.abs(Math.sin(i*.71))*1.1,.15+Math.abs(Math.sin(i*.55))*.35]);
}
var pts=[];
for(var y=-12000;y<=16000;y+=140){pts.push({year:y,v:F.precession(y).pole});}
if(pts[pts.length-1].year!==16000)pts.push({year:16000,v:F.precession(16000).pole});
function draw(){
 var cX=W*.48,cY=H*.515,R=Math.max(105,Math.min(W*.42,H*.415,292));
 var e=F.precession(year),pole=e.pole,near=F.nearestPoleStars(year,3),eq=F.eclipticLongitudeJ2000(e.equinox);
 var drift=eq>180?eq-360:eq,position=polarProj(pole,cX,cY,R),past=polarProj(F.precession(2026).pole,cX,cY,R);
 ctx.clearRect(0,0,W,H);
 var bg=ctx.createRadialGradient(cX,cY,15,cX,cY,Math.max(W,H)*.74);
 bg.addColorStop(0,'#18434c');bg.addColorStop(.47,'#0c2b35');bg.addColorStop(1,'#07131e');
 ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
 for(var i=0;i<stars.length;i++){var s=stars[i];star(s[0]*W,s[1]*H,s[2],'rgba(196,229,225,'+s[3]+')');}
 // An equidistant radial chart from north ecliptic pole, 18°, 36°, 54° rings.
 [18,36,54].forEach(function(deg){
  var rad=R*deg/54;
  pathRing(cX,cY,rad,deg===54?'rgba(160,227,210,.42)':'rgba(122,181,181,.22)',1);
  label(deg+'°',cX+rad+3,cY+3,9,'#82abaa');
 });
 for(var d=0;d<360;d+=30){
  var th=d*Math.PI/180;
  ctx.beginPath();ctx.moveTo(cX,cY);ctx.lineTo(cX+Math.cos(th)*R,cY-Math.sin(th)*R);
  ctx.strokeStyle='rgba(95,151,157,.095)';ctx.lineWidth=1;ctx.stroke();
 }
 // Full J2000-referenced pole path. The true path varies in radius, obliquity.
 ctx.beginPath();
 pts.forEach(function(p,i){var xy=polarProj(p.v,cX,cY,R);if(i===0)ctx.moveTo(xy[0],xy[1]);else ctx.lineTo(xy[0],xy[1]);});
 ctx.strokeStyle='rgba(235,201,155,.78)';ctx.lineWidth=2.3;ctx.stroke();
 // Circular hint is not a precisely fixed cone.
 var ecl=[cX,cY];star(ecl[0],ecl[1],4,'#d1f5d7');
 pathRing(ecl[0],ecl[1],11,'rgba(154,233,200,.56)');
 label('BIEGUN EKLIPTYKI J2000',cX+12,cY-13,W<500?7:10,'#bbefd4');
 F.POLE_STARS.forEach(function(s){
  var xy=polarProj(s.v,cX,cY,R);
  if(xy[2]>53.5)return;
  var active=s.name===near[0].name;
  star(xy[0],xy[1],s.mag<2?3.8:2.7,active?'#fff6c8':'#c5dae5');
  if(active){pathRing(xy[0],xy[1],8,'rgba(252,227,165,.73)',1.4);}
  label(s.name,xy[0]+(xy[0]<cX?-9:9),xy[1]-10,Math.max(9,Math.min(W/80,11)),
        active?'#f7e8b8':'#bed9d7',xy[0]<cX?'right':'left');
 });
 // Landmarks for the historical epochs and the time 2026.
 [{y:-2800,name:'ok. 2800 p.n.e.'},{y:2026,name:'2026'},{y:13700,name:'13 700'}].forEach(function(d){
  var t=polarProj(F.precession(d.y).pole,cX,cY,R);
  star(t[0],t[1],3.4,'#f7bd94');
  label(d.name,t[0]+9,t[1]+14,9,'#f1c9ad');
 });
 ctx.beginPath();ctx.moveTo(past[0],past[1]);ctx.lineTo(position[0],position[1]);
 ctx.lineWidth=1;ctx.strokeStyle='rgba(194,255,236,.53)';ctx.setLineDash([4,6]);ctx.stroke();ctx.setLineDash([]);
 star(position[0],position[1],10,'rgba(246,186,133,.23)');star(position[0],position[1],5.5,'#ffdb9c');
 pathRing(position[0],position[1],17,'rgba(250,217,163,.85)',2);
 var x=position[0],yy=position[1];ctx.beginPath();ctx.arc(x,yy,27,0,2*Math.PI);ctx.strokeStyle='rgba(242,189,139,.25)';ctx.stroke();
 label('BIEGUN NIEBIESKI',17,33,10,'#cdecdc');
 label('MAPA W STAŁYM UKŁADZIE J2000 · BEZ RUCHÓW WŁASNYCH GWIAZD',17,H-30,W<590?7:9,'#adcac6');
 text('tm26YearText',yr(year));text('tm26Nearest',near[0].name);text('tm26Distance',fmt(near[0].separation,2)+'°');
 text('tm26Obliquity',fmt(e.obliquity,2)+'°');
 text('tm26Equinox',fmt(drift,2)+'°');
 text('tm26PoleCoords','RA '+fmt(e.northPole.ra/15,1)+' h / Dec '+fmt(e.northPole.dec,1)+'° (J2000)');
 text('tm26Brief','W epoce '+yr(year)+' północny biegun niebieski wypada najbliżej gwiazdy '+near[0].name+
    ' (kąt '+fmt(near[0].separation,2)+'°). W tym modelu nie uwzględniamy ruchu własnego gwiazd.');
}
function stop(){
 play=false;var b=document.getElementById('tm26Play');
 if(b){b.textContent='▶ Podróż przez epoki';b.setAttribute('aria-pressed','false');}
 if(raf){cancelAnimationFrame(raf);raf=0;}
}
function tick(t){
 if(!play)return;if(!last)last=t;
 var dt=Math.min(60,t-last);last=t;
 var yy=year+dt*2.8;if(yy>16000)yy=-12000;
 year=Math.round(yy);slider.value=year;draw();raf=requestAnimationFrame(tick);
}
function setYear(y){
 stop();year=cl(Math.round(y),-12000,16000);slider.value=year;draw();
 var presets=[].slice.call(document.querySelectorAll('[data-tm26-year]'));
 presets.forEach(function(b){b.setAttribute('aria-pressed',String(Number(b.getAttribute('data-tm26-year'))===year));});
}
slider.addEventListener('input',function(){setYear(Number(slider.value));});
[].slice.call(document.querySelectorAll('[data-tm26-year]')).forEach(function(b){
 b.addEventListener('click',function(){setYear(Number(b.getAttribute('data-tm26-year')));});
});
var playBtn=document.getElementById('tm26Play');
if(playBtn)playBtn.addEventListener('click',function(){
 if(play){stop();return;}
 if(reduce){setYear(year+1000);return;}
 if(year>=16000)setYear(-12000);
 play=true;last=0;playBtn.textContent='Ⅱ Zatrzymaj czas';playBtn.setAttribute('aria-pressed','true');
 raf=requestAnimationFrame(tick);
});
function fit(){
 var rect=canvas.getBoundingClientRect(),dpi=Math.min(window.devicePixelRatio||1,2);
 W=Math.max(300,Math.round(rect.width));H=Math.max(360,Math.round(rect.height));
 canvas.width=Math.round(W*dpi);canvas.height=Math.round(H*dpi);
 ctx.setTransform(dpi,0,0,dpi,0,0);draw();
}
canvas.addEventListener('click',function(e){
 var rect=canvas.getBoundingClientRect(),x=(e.clientX-rect.left)/rect.width*W,y=(e.clientY-rect.top)/rect.height*H;
 var cx=W*.48,cy=H*.515,R=Math.max(105,Math.min(W*.42,H*.415,292)),best=null,dist=Infinity;
 pts.forEach(function(p){var q=polarProj(p.v,cx,cy,R),ds=Math.hypot(q[0]-x,q[1]-y);if(ds<dist){best=p;dist=ds;}});
 if(dist<35&&best)setYear(best.year);
});
document.addEventListener('visibilitychange',function(){if(document.hidden)stop();});
window.addEventListener('resize',fit,{passive:true});
if(window.ResizeObserver)new ResizeObserver(fit).observe(canvas);
fit();
})();