/* ATLAS SOLARIS — NIEBO NAD TOBĄ / v1.0
 * Accessible static sky map. Physical positions from original Stage 18 core
 * + JPL approximate planetary elements. No geolocation, storage or network.
 */
(function(){
'use strict';
var C=window.ATLAS_SKY_NOW_CORE,canvas=document.getElementById('skyCanvas');
if(!C||!canvas||!canvas.getContext)return;
var ctx=canvas.getContext('2d');if(!ctx)return;
function el(id){return document.getElementById(id)}
var place=el('skyPlace'),latInput=el('skyLat'),lonInput=el('skyLon'),dateInput=el('skyDate'),
 timeInput=el('skyTime'),slider=el('skySlider'),red=el('skyRed'),msg=el('skyValidation');
var presets={gdansk:[54.35,18.65],straszyn:[54.272,18.576],slupsk:[54.464,17.029],
 warszawa:[52.230,21.012],krakow:[50.064,19.945],wroclaw:[51.108,17.038],
 zakopane:[49.299,19.949],sydney:[-33.869,151.209]};
var state={width:650,height:650,dim:650,ratio:1,cx:325,cy:325,r:280,
 scene:[],selectedId:'moon',time:new Date(),lat:54.35,lon:18.65,red:false,
 cacheKey:null,riseCache:{},points:[]};
function fmt(n,d){return Number(n).toLocaleString('pl-PL',{minimumFractionDigits:d,maximumFractionDigits:d})}
function degrees(n){return fmt(n,1)+'°'}
function hour(t){return t?t.toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'}):'—'}
function direction(a){var d=['N','NE','E','SE','S','SW','W','NW'];return d[Math.floor(((a+22.5)%360)/45)]}
function label(id,value){var node=el(id);if(node)node.textContent=value}
function within(x,a,b){return Math.max(a,Math.min(b,x))}
function clear(){ctx.clearRect(0,0,state.width,state.height)}
function updateTimeInputs(t){
 dateInput.value=[t.getFullYear(),String(t.getMonth()+1).padStart(2,'0'),String(t.getDate()).padStart(2,'0')].join('-');
 timeInput.value=[String(t.getHours()).padStart(2,'0'),String(t.getMinutes()).padStart(2,'0')].join(':');
 slider.value=t.getHours()*60+t.getMinutes();
}
function parseTime(){
 if(!/^\d{4}-\d\d-\d\d$/.test(dateInput.value)||!/^\d\d:\d\d$/.test(timeInput.value))return null;
 var q=dateInput.value.split('-').map(Number),k=timeInput.value.split(':').map(Number);
 if(q[0]<2000||q[0]>2050||k[0]>23||k[1]>59)return null;
 var d=new Date(q[0],q[1]-1,q[2],k[0],k[1]);
 if(d.getFullYear()!==q[0]||d.getMonth()!==q[1]-1||d.getDate()!==q[2])return null;
 return d;
}
function readCoordinates(){
 var lat=Number(latInput.value),lon=Number(lonInput.value);
 if(latInput.value.trim()===''||lonInput.value.trim()===''||!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)return null;
 return {lat:lat,lon:lon};
}
function error(t){if(msg){msg.hidden=!t;msg.textContent=t||''}}
function viewObject(o){
 // Equidistant zenithal plot: zenith in center; horizon at circle boundary.
 var theta=o.azimuthDeg*Math.PI/180,radial=state.r*(90-o.altitudeDeg)/90;
 return {x:state.cx+Math.sin(theta)*radial,y:state.cy-Math.cos(theta)*radial,r:radial};
}
function setSize(){
 var rect=canvas.getBoundingClientRect();
 if(rect.width<150)return;
 var css=Math.round(rect.width),dpr=Math.min(window.devicePixelRatio||1,2);
 state.width=css;state.height=css;state.dim=css;state.r=css*.412;
 state.cx=css/2;state.cy=css/2;state.ratio=dpr;
 canvas.width=Math.round(css*dpr);canvas.height=Math.round(css*dpr);
 ctx.setTransform(dpr,0,0,dpr,0,0);
 draw();
}
function drawGrid(){
 var x=state.cx,y=state.cy,R=state.r,k=state.red;
 var bg=ctx.createRadialGradient(x,y,R*.08,x,y,R*1.3);
 bg.addColorStop(0,k?'#26090b':'#183849');
 bg.addColorStop(.68,k?'#1b0507':'#0a2432');
 bg.addColorStop(1,k?'#120203':'#081724');
 ctx.fillStyle=bg;ctx.fillRect(0,0,state.width,state.height);
 // Bright daylight overlay: every point is still geometric, not necessarily visible.
 var sun=state.scene.find(function(o){return o.id==='sun'});
 if(sun&&sun.altitudeDeg>0&&!k){
  ctx.fillStyle='rgba(50,80,102,.14)';ctx.fillRect(0,0,state.width,state.height);
 }
 ctx.beginPath();ctx.arc(x,y,R,0,Math.PI*2);ctx.strokeStyle=k?'#dc6262':'#b7dcd4';
 ctx.lineWidth=1.8;ctx.stroke();
 [30,60].forEach(function(h){
  var rr=R*(90-h)/90;ctx.beginPath();ctx.arc(x,y,rr,0,Math.PI*2);
  ctx.strokeStyle=k?'#883434':'rgba(150,195,196,.27)';ctx.lineWidth=1;ctx.stroke();
  ctx.fillStyle=k?'#d76b6b':'#97bdbe';ctx.font=Math.max(9,state.dim*.016)+'px Segoe UI,Arial,sans-serif';
  ctx.textAlign='left';ctx.fillText(h+'°',x+rr+4,y-2);
 });
 for(var i=0;i<360;i+=30){
  var a=i*Math.PI/180;
  ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.sin(a)*R,y-Math.cos(a)*R);
  ctx.strokeStyle=k?'rgba(172,65,65,.17)':'rgba(140,186,196,.12)';
  ctx.lineWidth=.8;ctx.stroke();
 }
 var font=Math.max(13,state.dim*.031);
 ctx.font='800 '+font+'px Segoe UI,Arial,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
 [['N',0,-1],['E',1,0],['S',0,1],['W',-1,0]].forEach(function(d){
  ctx.fillStyle=k?'#ff8e82':'#ddf8e8';
  ctx.fillText(d[0],x+d[1]*(R+font*.9),y+d[2]*(R+font*.8));
 });
 ctx.fillStyle=k?'#d46767':'#96c3b8';ctx.font='600 '+Math.max(9,state.dim*.014)+'px Segoe UI,Arial,sans-serif';
 ctx.fillText('ZENIT · 90°',x,y+12);
}
function circle(x,y,r,color){
 ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
}
function line(ax,ay,bx,by,color,width){
 ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.strokeStyle=color;
 ctx.lineWidth=width||1;ctx.stroke();
}
function draw(){
 if(!ctx||!state.scene.length)return;
 clear();drawGrid();
 var k=state.red;
 var visible=state.scene.filter(function(o){return o.altitudeDeg>=0;});
 var byId={};visible.forEach(function(o){byId[o.id]=o;});
 ctx.save();ctx.beginPath();ctx.arc(state.cx,state.cy,state.r-1,0,Math.PI*2);ctx.clip();
 C.lines.forEach(function(group){
  for(var i=1;i<group.length;i++){
   var a=byId[group[i-1]],b=byId[group[i]];
   if(!a||!b)continue;
   var aa=viewObject(a),bb=viewObject(b);
   line(aa.x,aa.y,bb.x,bb.y,k?'rgba(176,70,70,.45)':'rgba(108,178,197,.41)',1.1);
  }
 });
 var pts=[];
 visible.forEach(function(o){
  var v=viewObject(o),size=2,color=k?'#d87979':'#d3e4f1';
  if(o.kind==='star'){size=within(4.3-o.magnitude*.78,1.0,4.7);}
  if(o.kind==='deep'){size=4;color=k?'#a84848':'#79cbea';}
  if(o.kind==='planet'){size=within(5.3-o.magnitude*.24,3.1,6);color=k?'#ff8c78':'#ffc98e';}
  if(o.kind==='moon'){size=8;color=k?'#ff7878':'#f4f0cf';}
  if(o.kind==='solar'){size=11;color=k?'#ff3333':'#ffd29c';}
  circle(v.x,v.y,size,color);
  if(['moon','solar','planet','deep'].includes(o.kind)){
   ctx.beginPath();ctx.arc(v.x,v.y,size+3,0,Math.PI*2);
   ctx.strokeStyle=k?'#8b3a3a':'rgba(202,245,215,.5)';ctx.lineWidth=.9;ctx.stroke();
  }
  pts.push({o:o,x:v.x,y:v.y});
 });
 var named=visible.filter(function(o){
  return ['solar','moon','planet'].includes(o.kind)||
    (o.kind==='star'&&o.magnitude<=1.1)||
    (o.kind==='deep'&&['m31','m42','m45'].includes(o.id));
 });
 ctx.font='600 '+Math.max(9,state.dim*.016)+'px Segoe UI,Arial,sans-serif';
 ctx.textBaseline='middle';
 named.forEach(function(o){
  var v=viewObject(o);
  var dx=v.x<state.cx?-9:9;
  ctx.textAlign=dx<0?'right':'left';
  ctx.fillStyle=k?'#e68580':o.kind==='planet'?'#f2cfa9':'#c1d9d7';
  var yy=v.y-9;
  if(v.x<state.cx-state.r*.8||v.x>state.cx+state.r*.8)yy=v.y+12;
  ctx.fillText(o.name,v.x+dx,yy);
 });
 ctx.restore();
 var selected=visible.find(function(o){return o.id===state.selectedId;});
 if(selected){
  var v=viewObject(selected);
  ctx.beginPath();ctx.arc(v.x,v.y,10,0,Math.PI*2);
  ctx.strokeStyle=k?'#ffbaba':'#f1f9db';ctx.lineWidth=2;ctx.stroke();
  ctx.beginPath();ctx.arc(v.x,v.y,16,0,Math.PI*2);
  ctx.strokeStyle=k?'rgba(249,120,120,.65)':'rgba(214,248,229,.48)';ctx.lineWidth=1;ctx.stroke();
 }
 state.points=pts;
}
function select(id){
 if(!state.scene.some(function(o){return o.id===id}))return;
 state.selectedId=id;draw();renderDetail();renderBodySelection();renderStarSelection();
}
function getRise(id){
 var day=[state.time.getFullYear(),state.time.getMonth(),state.time.getDate()].join('/');
 var key=day+'|'+state.lat.toFixed(5)+'|'+state.lon.toFixed(5);
 if(key!==state.cacheKey){state.cacheKey=key;state.riseCache={};}
 if(!(id in state.riseCache))state.riseCache[id]=C.riseSet(id,state.time,state.lat,state.lon);
 return state.riseCache[id];
}
function objectTime(id){
 var r=getRise(id);if(!r)return '—';
 return 'wschód '+hour(r.rise)+' · zachód '+hour(r.set);
}
function renderDetail(){
 var o=state.scene.find(function(a){return a.id===state.selectedId});
 if(!o)return;
 label('skySelectedHeading',o.name);
 label('skySelectedCategory',o.kind==='planet'?'PLANETA':o.kind==='moon'?'KSIĘŻYC':o.kind==='solar'?'SŁOŃCE':o.kind==='deep'?'OBIEKT GŁĘBOKIEGO NIEBA':'GWIAZDA');
 label('skySelectedAlt',degrees(o.altitudeDeg));
 label('skySelectedAz',degrees(o.azimuthDeg));
 label('skySelectedDirection',direction(o.azimuthDeg));
 var note=o.altitudeDeg<0?'Obiekt znajduje się obecnie pod geometrycznym horyzontem.':
  o.altitudeDeg<10?'Obiekt jest nisko. Budynki, drzewa i zamglenie mogą go zasłaniać.':
  'Obiekt znajduje się nad geometrycznym horyzontem. Faktyczna widoczność zależy od pogody i oświetlenia.';
 if(o.kind==='moon')note+=' Oświetlenie tarczy: '+fmt(C.phaseFraction(state.time)*100,0)+'%.';
 if(o.kind==='star'||o.kind==='deep')note+=' Pozycja gwiazd jest przybliżona do epoki J2000.';
 if(o.kind==='planet')note+=' Pozycja planety pochodzi z uproszczonych elementów orbitalnych NASA/JPL.';
 label('skySelectedDescription',note);
 label('skyRiseSet',['solar','moon','planet'].includes(o.kind)?objectTime(o.id):'Dla gwiazd: ich wysokość i kierunek odczytasz na mapie.');
 var href=el('skyRelated');if(href)href.href=o.href||'../etapy/18/';
}
function renderBodySelection(){
 Array.prototype.forEach.call(el('skyBodiesList').querySelectorAll('[data-select]'),function(b){
  b.setAttribute('aria-pressed',String(b.dataset.select===state.selectedId));
 });
}
function renderStarSelection(){
 Array.prototype.forEach.call(el('skyStarList').querySelectorAll('[data-select]'),function(b){
  b.setAttribute('aria-pressed',String(b.dataset.select===state.selectedId));
 });
}
function renderBodyRows(){
 var html=state.scene.filter(function(o){return ['solar','moon','planet'].includes(o.kind)}).map(function(o){
  var down=o.altitudeDeg<=0;
  return '<button class="sky-body-row" type="button" data-select="'+o.id+'" aria-pressed="'+String(o.id===state.selectedId)+'">'+
  '<span class="sky-body-name">'+o.name+'</span>'+
  '<span class="sky-body-alt" data-down="'+String(down)+'">'+degrees(o.altitudeDeg)+'</span>'+
  '<span>'+direction(o.azimuthDeg)+(down?' · pod horyzontem':'')+'</span>'+
  '<span class="sky-body-rise">'+objectTime(o.id)+'</span></button>';
 }).join('');
 el('skyBodiesList').innerHTML=html;
}
function renderStarButtons(){
 var list=state.scene.filter(function(o){
  return (o.kind==='star'&&o.altitudeDeg>7&&o.magnitude<2.4)||
   (o.kind==='deep'&&o.altitudeDeg>8&&['m31','m42','m45','m13'].includes(o.id));
 }).sort(function(a,b){return a.magnitude-b.magnitude}).slice(0,16);
 el('skyStarList').innerHTML=list.length?list.map(function(o){
  return '<button type="button" data-select="'+o.id+'" aria-pressed="'+String(o.id===state.selectedId)+'">'+o.name+
   ' · '+fmt(o.altitudeDeg,0)+'°</button>';
 }).join(''):'<p>W tej godzinie brak wybranych jasnych obiektów nad naszym uproszczonym horyzontem.</p>';
}
function refresh(){
 var t=parseTime(),coords=readCoordinates();
 if(!t){error('Wybierz poprawną datę w latach 2000–2050 i godzinę.');return;}
 if(!coords){error('Podaj współrzędne: szerokość od −90 do +90°, długość od −180 do +180°.');return;}
 error('');
 state.time=t;state.lat=coords.lat;state.lon=coords.lon;
 state.scene=C.locate(t,coords.lat,coords.lon);
 if(!state.scene.length){error('Nie udało się obliczyć wybranej pozycji.');return;}
 if(!state.scene.some(function(o){return o.id===state.selectedId}))state.selectedId='moon';
 var sun=state.scene.find(function(o){return o.id==='sun'});
 var darkness=C.darkness(sun.altitudeDeg);
 label('skyDarkness',darkness);label('skySunAltitude',degrees(sun.altitudeDeg));
 label('skyMoonPhase',fmt(100*C.phaseFraction(t),0)+'% tarczy');
 label('skyCondition',darkness.toUpperCase());
 label('skyCoords','LAT '+fmt(coords.lat,2)+'° · LON '+fmt(coords.lon,2)+'°');
 label('skyMapContext',t.toLocaleDateString('pl-PL')+' / '+t.toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'}));
 var zone='lokalna strefa urządzenia';
 try{zone=Intl.DateTimeFormat().resolvedOptions().timeZone||zone;}catch(e){}
 label('skyTimezone','Godzina '+hour(t)+' jest w strefie Twojego urządzenia ('+zone+'). Wybór miasta nie zmienia strefy czasu. Dla miejscowości w innych strefach przelicz godzinę samodzielnie. Obliczenia nie korzystają z GPS ani z API pogodowych.');
 renderBodyRows();renderStarButtons();renderDetail();draw();
}
function shiftTime(hours){
 var t=parseTime()||new Date();t=new Date(t.getTime()+hours*3600000);
 if(t.getFullYear()<2000||t.getFullYear()>2050)return;
 updateTimeInputs(t);refresh();
}
function changePlace(){
 var option=presets[place.value];
 if(option){latInput.value=option[0];lonInput.value=option[1];}
 refresh();
}
place.addEventListener('change',changePlace);
latInput.addEventListener('input',function(){place.value='own';refresh();});
lonInput.addEventListener('input',function(){place.value='own';refresh();});
dateInput.addEventListener('change',refresh);
timeInput.addEventListener('change',function(){var q=timeInput.value.split(':');if(q.length===2)slider.value=Number(q[0])*60+Number(q[1]);refresh();});
slider.addEventListener('input',function(){var m=Number(slider.value);timeInput.value=String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');refresh();});
el('skyNow').addEventListener('click',function(){updateTimeInputs(new Date());refresh();});
el('skyEarlier').addEventListener('click',function(){shiftTime(-1);});
el('skyLater').addEventListener('click',function(){shiftTime(1);});
red.addEventListener('click',function(){
 state.red=!state.red;
 document.body.classList.toggle('sky-red-mode',state.red);
 red.setAttribute('aria-pressed',String(state.red));
 red.textContent=state.red?'◉ Wyłącz tryb czerwony':'◉ Tryb czerwony';draw();
});
function listSelect(e){var b=e.target.closest('[data-select]');if(b)select(b.dataset.select);}
el('skyBodiesList').addEventListener('click',listSelect);
el('skyStarList').addEventListener('click',listSelect);
canvas.addEventListener('click',function(e){
 var rect=canvas.getBoundingClientRect(),scaleX=state.width/rect.width,scaleY=state.height/rect.height;
 var x=(e.clientX-rect.left)*scaleX,y=(e.clientY-rect.top)*scaleY,best=null,dist=Infinity;
 state.points.forEach(function(p){
  var d=Math.hypot(p.x-x,p.y-y);
  if(d<dist){dist=d;best=p.o;}
 });
 if(best&&dist<Math.max(17,state.width*.029))select(best.id);
});
canvas.addEventListener('keydown',function(e){
 if(!['ArrowRight','ArrowLeft','ArrowDown','ArrowUp'].includes(e.key))return;
 e.preventDefault();
 var list=state.scene.filter(function(o){return o.altitudeDeg>=0&&(['planet','moon','solar','deep'].includes(o.kind)||(o.kind==='star'&&o.magnitude<2.2))});
 var idx=list.findIndex(function(o){return o.id===state.selectedId;});
 if(list.length)select(list[(idx+(e.key==='ArrowRight'||e.key==='ArrowDown'?1:list.length-1))%list.length].id);
});
window.addEventListener('resize',setSize,{passive:true});
if(window.ResizeObserver)new ResizeObserver(setSize).observe(canvas);
updateTimeInputs(new Date());
refresh();setSize();
})();
