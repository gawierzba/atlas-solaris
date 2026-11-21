/* ATLAS SOLARIS XIII — Gravity-assist physics and vector laboratory.
   Idealized planar patched-conic swingby; Canvas 2D; no network or WebGL. */
(function(){
'use strict';
var PLANETS={
 jupiter:{name:'JOWISZ',mu:126686534,radius:69911,sunSpeed:13.07,color:'#d3b4a3'},
 saturn:{name:'SATURN',mu:37931187,radius:58232,sunSpeed:9.68,color:'#cfb7a9'},
 earth:{name:'ZIEMIA',mu:398600.4418,radius:6371,sunSpeed:29.78,color:'#9ecfe6'},
 venus:{name:'WENUS',mu:324858.592,radius:6052,sunSpeed:35.02,color:'#e5b6ac'}
};
function model(planetKey,vinf,altitude,side){
 var planet=PLANETS[planetKey];
 if(!planet||!(vinf>0)||!(altitude>=0)||(side!==1&&side!==-1))return null;
 var rp=planet.radius+altitude;
 var e=1+rp*vinf*vinf/planet.mu;
 var turn=2*Math.asin(1/e);
 var V=planet.sunSpeed;
 // Incoming v∞ is (0,-vinf) in a planet-aligned Cartesian frame.
 // The outgoing vector is (±vinf*sin(turn),-vinf*cos(turn)).
 // Sun-relative vectors are the sum of these vectors and planet velocity (V,0).
 var vi={x:V,y:-vinf};
 var vo={x:V+side*vinf*Math.sin(turn),y:-vinf*Math.cos(turn)};
 var before=Math.hypot(vi.x,vi.y);
 var after=Math.hypot(vo.x,vo.y);
 return {name:planet.name,planet:planet,rp:rp,angleRad:turn,angleDeg:turn*180/Math.PI,
   vinfBefore:vinf,vinfAfter:vinf,before:before,after:after,delta:after-before,
   inbound:vi,outbound:vo,relativeOutbound:{x:side*vinf*Math.sin(turn),y:-vinf*Math.cos(turn)},
   vectorChange:2*vinf*Math.sin(turn/2),side:side};
}
window.ATLAS_GA13_PHYSICS={model:model,PLANETS:PLANETS};
function init(){
 var canvas=document.getElementById('ga13Canvas');if(!canvas||!canvas.getContext)return;
 var ctx=canvas.getContext('2d');if(!ctx)return;
 var elements={planet:document.getElementById('ga13Planet'),vinf:document.getElementById('ga13Vinf'),
  altitude:document.getElementById('ga13Altitude'),boost:document.getElementById('ga13Boost'),
  brake:document.getElementById('ga13Brake'),reset:document.getElementById('ga13Reset'),
  cinema:document.getElementById('ga13Cinema'),root:document.querySelector('.ga13-lab-shell')};
 if(!elements.planet||!elements.vinf||!elements.altitude||!elements.boost||!elements.brake)return;
 var choice=1,view=model('jupiter',10,30000,1),frame=0,time=0,last=0,visible=false;
 var reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 var stars=[];function rnd(i){var n=Math.sin(i*131.37+77.4)*43758.5453;return n-Math.floor(n);}
 for(var i=0;i<190;i++)stars.push({x:rnd(i+100),y:rnd(i+300),r:.4+rnd(i+600)*1.45,a:.16+rnd(i+900)*.65});
 var text=function(id,s){var n=document.getElementById(id);if(n)n.textContent=s;};
 var num=function(x,dec){return x.toLocaleString('pl-PL',{minimumFractionDigits:dec,maximumFractionDigits:dec});};
 function update(){
  view=model(elements.planet.value,Number(elements.vinf.value),Number(elements.altitude.value),choice);
  if(!view)return;
  elements.boost.classList.toggle('is-active',choice===1);elements.brake.classList.toggle('is-active',choice===-1);
  elements.boost.setAttribute('aria-pressed',choice===1?'true':'false');elements.brake.setAttribute('aria-pressed',choice===-1?'true':'false');
  text('ga13PlanetTitle',view.name);text('ga13VinfOut',num(view.vinfBefore,1)+' km/s');
  text('ga13AltitudeOut',num(Number(elements.altitude.value),0)+' km');
  text('ga13Turn',num(view.angleDeg,1)+'°');
  text('ga13Speed',num(view.after,2));text('ga13Delta',(view.delta>0?'+':'')+num(view.delta,2));
  text('ga13PlanetRelative',num(view.vinfBefore,1)+' km/s');
  text('ga13Explanation',choice===1?'Wybrany przelot zwiększa szybkość sondy względem Słońca o '+num(view.delta,2)+' km/s. Względem planety v∞ nadal wynosi '+num(view.vinfBefore,1)+' km/s.':'Wybrany przelot zmniejsza szybkość sondy względem Słońca o '+num(-view.delta,2)+' km/s. Względem planety v∞ nadal wynosi '+num(view.vinfBefore,1)+' km/s.');
  draw();
 }
 function line(x1,y1,x2,y2,color,width){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=width||2;ctx.stroke();}
 function arrow(x1,y1,x2,y2,color,width){
  var a=Math.atan2(y2-y1,x2-x1),head=9+(width||2)*1.3;
  line(x1,y1,x2,y2,color,width||3);
  ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-head*Math.cos(a-.48),y2-head*Math.sin(a-.48));
  ctx.lineTo(x2-head*Math.cos(a+.48),y2-head*Math.sin(a+.48));ctx.closePath();ctx.fillStyle=color;ctx.fill();
 }
 function label(x,y,str,size,color,align){
  ctx.textAlign=align||'left';ctx.font='700 '+(size||11)+'px Arial, sans-serif';ctx.fillStyle=color||'#a6d4d2';ctx.fillText(str,x,y);
 }
 function drawPlanet(x,y,r){
  var gl=ctx.createRadialGradient(x-r*.3,y-r*.3,1,x,y,r*3);
  gl.addColorStop(0,'rgba(187,224,224,.34)');gl.addColorStop(1,'rgba(50,80,109,0)');
  ctx.fillStyle=gl;ctx.beginPath();ctx.arc(x,y,r*3,0,Math.PI*2);ctx.fill();
  var g=ctx.createRadialGradient(x-r*.38,y-r*.45,r*.05,x,y,r);
  g.addColorStop(0,'#fff0df');g.addColorStop(.43,view.planet.color);g.addColorStop(.88,'#7e8694');g.addColorStop(1,'#263c51');
  ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();
  ctx.save();ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.clip();
  if(elements.planet.value==='jupiter'||elements.planet.value==='saturn'){
   for(var j=-6;j<=6;j++){var yy=y+j*r*.14;
    line(x-r,yy,x+r,yy+(j%2)*r*.03,j%3===0?'rgba(234,175,155,.33)':'rgba(250,242,220,.28)',3+Math.abs(j%3));
   }
  }else if(elements.planet.value==='earth'){
   ctx.fillStyle='rgba(90,179,169,.4)';ctx.beginPath();ctx.ellipse(x-r*.2,y-r*.05,r*.34,r*.2,-.4,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();ctx.strokeStyle='rgba(200,242,240,.42)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();
 }
 function panel(x,y,w,h,title){
  ctx.fillStyle='rgba(8,30,44,.55)';ctx.fillRect(x,y,w,h);
  ctx.strokeStyle='rgba(104,153,165,.3)';ctx.lineWidth=1;ctx.strokeRect(x+.5,y+.5,w-1,h-1);
  label(x+16,y+25,title,11,'#b2dbdc');
 }
 function drawVectors(x,y,w,h,planetFrame){
  var cx=x+w*.5,cy=y+h*.52,rr=Math.min(w,h)*.16;
  if(planetFrame){
   drawPlanet(cx,cy,rr);
   // Incoming asymptotic velocity points down; outgoing is turned by δ.
   var vlen=Math.min(w,h)*.31;
   arrow(cx-rr*1.6,cy-vlen*.96,cx-rr*1.6,cy-vlen*.16,'#a0f4df',3.2);
   var dx=view.relativeOutbound.x/view.vinfBefore,dy=-view.relativeOutbound.y/view.vinfBefore;
   var startX=cx+Math.sign(dx||1)*rr*1.12,startY=cy+Math.sign(dy||1)*rr*.4;
   arrow(startX,startY,startX+dx*vlen*.8,startY+dy*vlen*.8,'#f1baaf',3.2);
   label(x+15,y+h-39,'|v∞| = '+num(view.vinfBefore,1)+' km/s',12,'#d9f3e9');
   label(x+15,y+h-19,'ZAKRĘT: '+num(view.angleDeg,1)+'°',10,'#86b8c0');
  }else{
   var sx=x+w*.46,sy=y+h*.56;
   line(sx-w*.34,sy,sx+w*.35,sy,'rgba(167,197,211,.28)',1);
   line(sx,sy+h*.30,sx,sy-h*.32,'rgba(167,197,211,.28)',1);
   var max=Math.max(30,view.planet.sunSpeed+view.vinfBefore)*1.45;
   var scale=Math.min(w*.38,h*.33)/max;
   var a=view.inbound,b=view.outbound;
   arrow(sx,sy,sx+a.x*scale,sy-a.y*scale,'#a0f4df',3.2);
   arrow(sx,sy,sx+b.x*scale,sy-b.y*scale,'#f1baaf',3.2);
   label(x+15,y+h-41,'PRZED: '+num(view.before,2)+' km/s',11,'#b1f0e5');
   label(x+15,y+h-20,'PO: '+num(view.after,2)+' km/s',11,'#f7c5b9');
  }
 }
 function draw(){
  var w=canvas.clientWidth||760,h=canvas.clientHeight||600;if(w<10||h<10)return;
  var dpr=Math.min(window.devicePixelRatio||1,1.75);
  if(w*dpr>1700)dpr=1700/w;
  var cw=Math.ceil(w*dpr),ch=Math.ceil(h*dpr);if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw;canvas.height=ch;}
  ctx.setTransform(dpr,0,0,dpr,0,0);
  var bg=ctx.createRadialGradient(w*.6,h*.45,5,w*.6,h*.45,Math.max(w,h)*.72);
  bg.addColorStop(0,'#173446');bg.addColorStop(.6,'#091c2d');bg.addColorStop(1,'#040d1b');
  ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
  stars.forEach(function(s){ctx.beginPath();ctx.arc(s.x*w,s.y*h,s.r,0,Math.PI*2);ctx.fillStyle='rgba(216,244,245,'+s.a+')';ctx.fill();});
  var narrow=w<570;
  if(narrow){
   var ph=(h-70)*.5;
   panel(13,54,w-26,ph,'01 / WZGLĘDEM PLANETY');
   panel(13,57+ph,w-26,ph,'02 / WZGLĘDEM SŁOŃCA');
   drawVectors(13,54,w-26,ph,true);
   drawVectors(13,57+ph,w-26,ph,false);
  }else{
   var pw=(w-42)*.5,ph=h-114;
   panel(13,58,pw,ph,'01 / WZGLĘDEM PLANETY');
   panel(26+pw,58,pw,ph,'02 / WZGLĘDEM SŁOŃCA');
   drawVectors(13,58,pw,ph,true);
   drawVectors(26+pw,58,pw,ph,false);
  }
  label(20,h-14,''+view.name+' / JEDEN PRZELOT • DWA WYNIKI',10,'#7fb8bb');
 }
 function stop(){if(frame&&window.cancelAnimationFrame)window.cancelAnimationFrame(frame);frame=0;last=0;}
 function schedule(){if(frame||reduced||!visible||document.hidden||!window.requestAnimationFrame)return;frame=window.requestAnimationFrame(tick);}
 function tick(now){frame=0;if(reduced||!visible||document.hidden)return;if(now-last>70){time+=.02;last=now;draw();}schedule();}
 function reset(){elements.planet.value='jupiter';elements.vinf.value='10';elements.altitude.value='30000';choice=1;update();}
 elements.planet.addEventListener('change',update);
 elements.vinf.addEventListener('input',update);
 elements.altitude.addEventListener('input',update);
 elements.boost.addEventListener('click',function(){choice=1;update();});
 elements.brake.addEventListener('click',function(){choice=-1;update();});
 if(elements.reset)elements.reset.addEventListener('click',reset);
 if(elements.cinema)elements.cinema.addEventListener('click',function(){
   if(!elements.root)return;var expanded=elements.root.classList.toggle('is-cinema');elements.cinema.textContent=expanded?'⤡ Zwykły widok':'⤢ Tryb kinowy';elements.cinema.setAttribute('aria-pressed',expanded?'true':'false');draw();
 });
 document.addEventListener('keydown',function(e){if(e.key==='Escape'&&elements.root&&elements.root.classList.contains('is-cinema')){elements.root.classList.remove('is-cinema');if(elements.cinema){elements.cinema.textContent='⤢ Tryb kinowy';elements.cinema.setAttribute('aria-pressed','false');}draw();}});
 window.addEventListener('resize',draw);
 document.addEventListener('visibilitychange',function(){if(document.hidden)stop();else{draw();schedule();}});
 window.addEventListener('pagehide',stop);
 if(window.IntersectionObserver){
  var observer=new IntersectionObserver(function(items){visible=!!(items[0]&&items[0].isIntersecting);if(visible){draw();schedule();}else stop();},{threshold:.04});
  observer.observe(canvas);
 }else{visible=true;schedule();}
 update();draw();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
