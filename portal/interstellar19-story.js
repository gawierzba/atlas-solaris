/* ATLAS SOLARIS XIX — geometric starfield perspectives, SRT travel clock.
   Scientific core: spherical equatorial coordinates + distances -> Cartesian,
   observer translations and gnomonic angular projection. Big Dipper stars use
   approximate epoch-J2000 RA/Dec and rounded distances, no proper motion.
   Visual layer: Canvas 2D, stylized sizes/luminosity, no WebGL.
*/
(function(){
'use strict';
var D2R=Math.PI/180,R2D=180/Math.PI,LY_KM=9460730472580.8,PARSEC_LY=3.261563777167433;
var STARS=[
 {key:'dubhe',name:'Dubhe',ra:165.929,dec:61.751,ly:123,mag:1.79},
 {key:'merak',name:'Merak',ra:165.460,dec:56.382,ly:80,mag:2.37},
 {key:'phecda',name:'Phecda',ra:178.458,dec:53.694,ly:83,mag:2.41},
 {key:'megrez',name:'Megrez',ra:183.857,dec:57.033,ly:81,mag:3.31},
 {key:'alioth',name:'Alioth',ra:193.507,dec:55.960,ly:81,mag:1.77},
 {key:'mizar',name:'Mizar',ra:200.984,dec:54.925,ly:83,mag:2.27},
 {key:'alkaid',name:'Alkaid',ra:206.885,dec:49.313,ly:104,mag:1.86}
];
var WIRES=[['dubhe','merak'],['merak','phecda'],['phecda','megrez'],['megrez','dubhe'],['megrez','alioth'],['alioth','mizar'],['mizar','alkaid']];
var ROUTE={ra:190,dec:55};
function vector(raDeg,decDeg,distanceLy){
 if(!Number.isFinite(raDeg)||!Number.isFinite(decDeg)||!(distanceLy>=0)||Math.abs(decDeg)>90)return null;
 var ra=raDeg*D2R,dec=decDeg*D2R;
 return {x:distanceLy*Math.cos(dec)*Math.cos(ra),y:distanceLy*Math.cos(dec)*Math.sin(ra),z:distanceLy*Math.sin(dec)};
}
function subtract(a,b){return{x:a.x-b.x,y:a.y-b.y,z:a.z-b.z};}
function dot(a,b){return a.x*b.x+a.y*b.y+a.z*b.z;}
function length(a){return Math.sqrt(dot(a,a));}
function unit(a){var n=length(a);return n>0?{x:a.x/n,y:a.y/n,z:a.z/n}:null;}
function distance(a,b){return length(subtract(a,b));}
function observer(distanceLy){return vector(ROUTE.ra,ROUTE.dec,distanceLy);}
function position(star){return vector(star.ra,star.dec,star.ly);}
function direction(star,travelLy){
 var delta=subtract(position(star),observer(travelLy));
 return unit(delta);
}
function angularSeparationDeg(a,b){
 if(!a||!b)return NaN;
 return Math.acos(Math.max(-1,Math.min(1,dot(a,b))))*R2D;
}
function project(star,travelLy){
 var u=direction(star,travelLy);if(!u)return null;
 var ra=ROUTE.ra*D2R,dec=ROUTE.dec*D2R;
 var forward=vector(ROUTE.ra,ROUTE.dec,1),
 east={x:-Math.sin(ra),y:Math.cos(ra),z:0},
 north={x:-Math.sin(dec)*Math.cos(ra),y:-Math.sin(dec)*Math.sin(ra),z:Math.cos(dec)};
 var front=dot(u,forward);
 if(!(front>0))return null;
 return {xDeg:Math.atan2(dot(u,east),front)*R2D,
         yDeg:Math.atan2(dot(u,north),front)*R2D,
         rangeLy:distance(position(star),observer(travelLy)),
         isBehind:false};
}
function parallaxArcsec(ly){return ly>0?PARSEC_LY/ly:NaN;}
function travelTimes(ly,speedC){
 if(!(ly>=0&&speedC>0&&speedC<1))return null;
 var sunYears=ly/speedC,properYears=sunYears*Math.sqrt(1-speedC*speedC);
 return {sunYears:sunYears,shipYears:properYears,lorentzGamma:1/Math.sqrt(1-speedC*speedC)};
}
function constellationChangeDeg(ly,key){
 var s=STARS.find(function(x){return x.key===key;});
 if(!s)return NaN;
 return angularSeparationDeg(direction(s,0),direction(s,ly));
}
window.ATLAS_IS19_PHYSICS={
 LY_KM:LY_KM,PARSEC_LY:PARSEC_LY,STARS:STARS,WIRES:WIRES,ROUTE:ROUTE,
 vector:vector,position:position,direction:direction,observer:observer,distance:distance,
 angularSeparationDeg:angularSeparationDeg,project:project,parallaxArcsec:parallaxArcsec,
 travelTimes:travelTimes,constellationChangeDeg:constellationChangeDeg
};
function init(){
 var canvas=document.getElementById('is19Canvas'),ctx=canvas&&canvas.getContext&&canvas.getContext('2d');
 var range=document.getElementById('is19Distance'),speed=document.getElementById('is19Speed');
 if(!ctx||!range||!speed)return;
 var play=document.getElementById('is19Play'),reset=document.getElementById('is19Reset');
 var presets=[].slice.call(document.querySelectorAll('[data-is19-distance]'));
 var shell=document.getElementById('is19LabShell');
 var reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 var moving=!reduced,visible=false,frame=0,last=0,elapsed=0;
 var bg=[];
 function random(i){var n=Math.sin(i*135.41+59.32)*43758.5453;return n-Math.floor(n);}
 for(var j=0;j<260;j++)bg.push({x:random(j+1),y:random(j+223),r:.25+random(j+384)*1.45,a:.2+random(j+576)*.55});
 function put(id,value){var el=document.getElementById(id);if(el)el.textContent=value;}
 function fmt(x,n){return Number(x).toLocaleString('pl-PL',{minimumFractionDigits:n,maximumFractionDigits:n});}
 function currentDistance(){return Number(range.value);}
 function update(){
  var d=currentDistance(),beta=Number(speed.value),tt=travelTimes(d,beta),
      mizar=STARS.filter(function(x){return x.key==='mizar';})[0],
      mizarDist=distance(position(mizar),observer(d));
  put('is19DistanceOut',fmt(d,1)+' ly');put('is19SpeedOut',fmt(beta,2)+' c');
  put('is19TimeSun',fmt(tt.sunYears,1)+' lat');put('is19TimeShip',fmt(tt.shipYears,1)+' lat');
  put('is19Mizar',fmt(mizarDist,1)+' ly');
  var visibleCount=STARS.filter(function(s){var p=project(s,d);return p&&Math.abs(p.xDeg)<47&&Math.abs(p.yDeg)<40;}).length;
  put('is19Visible',String(visibleCount)+' / 7');
  var feedback=document.getElementById('is19Feedback');
  if(feedback)feedback.textContent=d<1?'Oba widoki pokazują tę samą geometryczną projekcję Wielkiego Wozu. Przesuń obserwatora, żeby ujawnić głębię gwiazd.':
   'Po przemieszczeniu o '+fmt(d,1)+' ly linia widzenia do Dubhe zmieniła się o około '+fmt(constellationChangeDeg(d,'dubhe'),1)+'°. Gwiazdy nie przesunęły się fizycznie w czasie tego eksperymentu — zmienił się punkt obserwacji.';
  presets.forEach(function(btn){var selected=Math.abs(Number(btn.getAttribute('data-is19-distance'))-d)<.01;btn.classList.toggle('is-active',selected);btn.setAttribute('aria-pressed',String(selected));});
  draw();
 }
 function circle(x,y,r,fill){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();}
 function stroke(x1,y1,x2,y2,color,width){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.lineWidth=width;ctx.strokeStyle=color;ctx.stroke();}
 function panelStarfield(panel,travel,faded){
  var bounds={cx:panel.x+panel.w/2,cy:panel.y+panel.h/2,halfW:panel.w*.43,halfH:panel.h*.38};
  var coords={},limitX=47,limitY=40;
  STARS.forEach(function(s){
   var p=project(s,travel);if(!p)return;
   var x=bounds.cx+(p.xDeg/limitX)*bounds.halfW;
   var y=bounds.cy-(p.yDeg/limitY)*bounds.halfH;
   coords[s.key]={x:x,y:y,inFrame:Math.abs(p.xDeg)<=limitX&&Math.abs(p.yDeg)<=limitY,p:p};
  });
  ctx.save();ctx.beginPath();ctx.rect(panel.x+1,panel.y+1,panel.w-2,panel.h-2);ctx.clip();
  for(var i=0;i<4;i++){
   var x=panel.x+panel.w*(i+1)/5;stroke(x,panel.y,x,panel.y+panel.h,'rgba(102,144,183,.13)',.7);
   var y=panel.y+panel.h*(i+1)/5;stroke(panel.x,y,panel.x+panel.w,y,'rgba(102,144,183,.13)',.7);
  }
  WIRES.forEach(function(c){
   var a=coords[c[0]],b=coords[c[1]];
   if(a&&b&&a.inFrame&&b.inFrame)stroke(a.x,a.y,b.x,b.y,faded?'rgba(186,193,241,.48)':'rgba(235,195,227,.68)',1.5);
  });
  STARS.forEach(function(s,i){
   var c=coords[s.key];if(!c||!c.inFrame)return;
   var size=Math.max(3.7,7-s.mag);
   var g=ctx.createRadialGradient(c.x,c.y,0,c.x,c.y,size*3.2);
   g.addColorStop(0,'rgba(223,228,255,.44)');g.addColorStop(1,'rgba(125,163,235,0)');
   circle(c.x,c.y,size*3.2,g);
   circle(c.x,c.y,size,'#fff1ec');
   ctx.lineWidth=1;ctx.strokeStyle='rgba(224,222,250,.52)';ctx.beginPath();ctx.arc(c.x,c.y,size+2,0,Math.PI*2);ctx.stroke();
   ctx.textAlign='left';ctx.font=(panel.w<330?'9':'10')+'px Arial,sans-serif';
   ctx.fillStyle=faded?'#bec7dc':'#e3d6f4';
   var tx=c.x+size+5,ty=c.y-(i%2?6:-12);
   if(tx>panel.x+panel.w-56)tx=c.x-49;
   ctx.fillText(s.name,tx,ty);
  });
  ctx.restore();
  return coords;
 }
 function renderPanel(panel,dist,label,desc,faded){
  var g=ctx.createLinearGradient(panel.x,panel.y,panel.x+panel.w,panel.y+panel.h);
  g.addColorStop(0,faded?'#152344':'#25203f');g.addColorStop(.55,'#0c1935');g.addColorStop(1,'#0a1328');
  ctx.fillStyle=g;ctx.fillRect(panel.x,panel.y,panel.w,panel.h);
  ctx.strokeStyle=faded?'rgba(116,140,192,.71)':'rgba(197,162,212,.74)';ctx.lineWidth=1;ctx.strokeRect(panel.x+.5,panel.y+.5,panel.w-1,panel.h-1);
  ctx.textAlign='left';ctx.fillStyle='#dce6ff';ctx.font='700 11px Arial,sans-serif';
  ctx.fillText(label,panel.x+15,panel.y+21);
  ctx.font='10px Arial,sans-serif';ctx.fillStyle='#b9c1da';
  ctx.fillText(desc,panel.x+15,panel.y+37);
  return panelStarfield(panel,dist,faded);
 }
 function draw(){
  var w=canvas.clientWidth||750,h=canvas.clientHeight||720;if(w<20||h<20)return;
  var dpr=Math.min(1.7,window.devicePixelRatio||1);if(w*dpr>1620)dpr=1620/w;
  var cw=Math.max(1,Math.round(w*dpr)),ch=Math.max(1,Math.round(h*dpr));
  if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw;canvas.height=ch;}
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  var bgColor=ctx.createRadialGradient(w*.65,h*.2,2,w*.5,h*.44,Math.max(w,h)*.85);
  bgColor.addColorStop(0,'#21294e');bgColor.addColorStop(.67,'#0c152e');bgColor.addColorStop(1,'#070c1c');
  ctx.fillStyle=bgColor;ctx.fillRect(0,0,w,h);
  bg.forEach(function(s){circle(s.x*w,s.y*h,s.r,'rgba(231,233,251,'+s.a+')');});
  var compact=w<560,padding=compact?16:21,top=compact?61:80;
  var panel1,panel2;
  if(compact){
   var bottom=h-128,gap=12,ph=(bottom-top-gap)/2;
   panel1={x:padding,y:top,w:w-padding*2,h:ph};
   panel2={x:padding,y:top+ph+gap,w:w-padding*2,h:ph};
  }else{
   var gap=14,ph=h-204,pw=(w-2*padding-gap)/2;
   panel1={x:padding,y:top,w:pw,h:ph};
   panel2={x:padding+pw+gap,y:top,w:pw,h:ph};
  }
  var d=currentDistance();
  renderPanel(panel1,0,'01 / Z OKOLIC SŁOŃCA','Wielki Wóz · referencja',true);
  renderPanel(panel2,d,'02 / NOWY OBSERWATOR','Przesunięcie '+fmt(d,1)+' lat świetlnych',false);
  var lyLabel='PRZEBYTA ODLEGŁOŚĆ '+fmt(d,1)+' LY / 65 LY';
  var travelTop=h-(compact?104:139);
  ctx.textAlign='left';ctx.font='700 10px Arial,sans-serif';ctx.fillStyle='#bed1f0';
  ctx.fillText(lyLabel,padding,travelTop);
  var x1=padding+12,x2=w-padding-12,y=travelTop+(compact?35:48);
  stroke(x1,y,x2,y,'rgba(180,199,248,.36)',2);
  stroke(x1,y,x1+(x2-x1)*(d/65),y,'rgba(235,183,210,.94)',3);
  for(var i=0;i<=4;i++){var xx=x1+(x2-x1)*i/4;circle(xx,y,2.1,'rgba(168,187,226,.9)');}
  var pos=x1+(x2-x1)*(d/65);
  var markGlow=ctx.createRadialGradient(pos,y,0,pos,y,21);
  markGlow.addColorStop(0,'rgba(239,195,216,.45)');markGlow.addColorStop(1,'rgba(235,195,216,0)');
  circle(pos,y,21,markGlow);circle(pos,y,6,'#f6e5ed');
  ctx.textAlign='left';ctx.font='10px Arial,sans-serif';ctx.fillStyle='#acb9da';
  ctx.fillText('SŁOŃCE',x1,y+23);
  ctx.textAlign='right';ctx.fillText('KIERUNEK WIELKIEGO WOZU',x2,y+23);
 }
 function stop(){if(frame&&window.cancelAnimationFrame)window.cancelAnimationFrame(frame);frame=0;last=0;}
 function schedule(){if(frame||!moving||!visible||document.hidden||!window.requestAnimationFrame)return;frame=window.requestAnimationFrame(tick);}
 function tick(now){
  frame=0;if(!moving||!visible||document.hidden)return;
  if(!last){last=now;schedule();return;}
  if(now-last>=34){
   var dt=Math.min(.1,(now-last)/1000);last=now;elapsed+=dt;
   var d=currentDistance()+dt*2.9;if(d>=65)d=0;
   range.value=String(Math.round(d*2)/2);
   update();
  }
  schedule();
 }
 function playStatus(){
  if(play){play.textContent=moving?'Ⅱ Zatrzymaj podróż':'▶ Uruchom podróż';play.setAttribute('aria-pressed',String(!moving));}
  if(moving)schedule();else stop();
 }
 range.addEventListener('input',function(){update();});
 speed.addEventListener('input',update);
 presets.forEach(function(btn){btn.addEventListener('click',function(){range.value=btn.getAttribute('data-is19-distance');update();});});
 if(reset)reset.addEventListener('click',function(){range.value='0';speed.value='.2';update();});
 if(play)play.addEventListener('click',function(){moving=!moving;playStatus();});
 window.addEventListener('resize',draw);
 document.addEventListener('visibilitychange',function(){if(document.hidden)stop();else{draw();schedule();}});
 window.addEventListener('pagehide',stop);
 if(window.IntersectionObserver){var observer=new IntersectionObserver(function(items){visible=!!(items[0]&&items[0].isIntersecting);if(visible){draw();schedule();}else stop();},{threshold:.03});observer.observe(shell||canvas);}
 else{visible=true;schedule();}
 update();playStatus();draw();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
