/* ATLAS SOLARIS 36 — planet formation interactive laboratory.
   Canvas 2D, no WebGL or dependencies. Idealized astronomy calculators.
   Disk/growth renderings are explicitly artistic rather than N-body / hydro simulations. */
(function(){
'use strict';
var EARTH_MASSES_PER_SOLAR=332946.0487;
function periodYears(radiusAu,stellarSolarMass){
 if(!(radiusAu>0&&stellarSolarMass>0))return NaN;
 return Math.sqrt(Math.pow(radiusAu,3)/stellarSolarMass);
}
function hillRadiusAu(radiusAu,planetEarthMass,stellarSolarMass){
 if(!(radiusAu>0&&planetEarthMass>0&&stellarSolarMass>0))return NaN;
 return radiusAu*Math.pow(planetEarthMass/(3*EARTH_MASSES_PER_SOLAR*stellarSolarMass),1/3);
}
function equilibriumTemperatureK(luminositySolar,radiusAu){
 if(!(luminositySolar>0&&radiusAu>0))return NaN;
 return 278*Math.pow(luminositySolar,.25)/Math.sqrt(radiusAu);
}
function snowlineAu(luminositySolar,thresholdK){
 var threshold=thresholdK||170;
 if(!(luminositySolar>0&&threshold>0))return NaN;
 return Math.pow(278/threshold,2)*Math.sqrt(luminositySolar);
}
window.ATLAS_PB36_PHYSICS={
 periodYears:periodYears,
 hillRadiusAu:hillRadiusAu,
 equilibriumTemperatureK:equilibriumTemperatureK,
 snowlineAu:snowlineAu
};
function init(){
 var about=document.getElementById('stageAbout');
 var info=document.getElementById('stageInfo');
 var close=document.getElementById('stageInfoClose');
 if(about&&info&&close){
   var setOpen=function(show){info.hidden=!show;about.setAttribute('aria-expanded',show?'true':'false');};
   about.addEventListener('click',function(){setOpen(info.hidden);});
   close.addEventListener('click',function(){setOpen(false);about.focus();});
   document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!info.hidden){setOpen(false);about.focus();}});
 }
 var root=document.getElementById('pb36LabFrame');
 var canvas=document.getElementById('pb36Canvas');
 if(!root||!canvas||!canvas.getContext)return;
 var ctx=canvas.getContext('2d');if(!ctx)return;
 var controls={
  star:document.getElementById('pb36StarMass'),
  orbit:document.getElementById('pb36Orbit'),
  planet:document.getElementById('pb36PlanetMass'),
  luminosity:document.getElementById('pb36Luminosity'),
  iceDistance:document.getElementById('pb36IceDistance'),
  growth:document.getElementById('pb36GrowthStage'),
  dustiness:document.getElementById('pb36Dustiness')
 };
 for(var key in controls)if(!controls[key])return;
 var panels={disk:document.getElementById('pb36PanelDisk'),ice:document.getElementById('pb36PanelIce'),growth:document.getElementById('pb36PanelGrowth')};
 var buttons=[].slice.call(document.querySelectorAll('[data-pb36-mode]'));
 var play=document.getElementById('pb36Play'),reset=document.getElementById('pb36Reset'),cinema=document.getElementById('pb36Cinema');
 var mode='disk',time=0,angle=-.22,frame=0,lastTick=0,visible=false,drag=false,lastX=0;
 var prefersReduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 var motion=!prefersReduce;
 var stars=[],dust=[];
 function rand(i){var x=Math.sin(i*133.7+41.8)*43758.5453;return x-Math.floor(x);}
 for(var i=0;i<310;i++)stars.push({x:rand(i+1),y:rand(i+200),size:.38+rand(i+345)*1.7,a:.18+rand(i+557)*.64});
 for(var j=0;j<850;j++)dust.push({a:rand(j+923)*Math.PI*2,r:Math.sqrt(.025+rand(j+231)*.975),size:.4+rand(j+125)*2.15,shade:rand(j+9231),speed:.3+rand(j+452)*1.3});
 var stages=[
 {name:'Mikroskopijny pył',desc:'Maleńkie ziarna unoszą się w gazie. To jeszcze nie są planetozymale.',count:400},
 {name:'Porowate agregaty',desc:'Część drobin przywiera do siebie po łagodnych zderzeniach; inne mogą się rozpaść.',count:190},
 {name:'Otoczaki i grudki',desc:'Wielkość rośnie, ale pojawiają się bariery zderzeń, dryfu i fragmentacji.',count:90},
 {name:'Planetozymale',desc:'Powstają grawitacyjnie związane ciała — budulec embrionów planet.',count:33},
 {name:'Embriony planetarne',desc:'Rosnące zalążki zaczynają silnie wpływać grawitacyjnie na otoczenie.',count:9}
 ];
 function val(k){return Number(controls[k].value);}
 function fmt(number,places){return Number(number).toLocaleString('pl-PL',{minimumFractionDigits:places,maximumFractionDigits:places});}
 function txt(id,value){var el=document.getElementById(id);if(el)el.textContent=value;}
 function updateOutputs(){
  var a=val('orbit'),m=val('star'),pm=val('planet'),L=val('luminosity'),r=val('iceDistance'),step=val('growth')-1;
  txt('pb36StarMassOut',fmt(m,1)+' M☉');txt('pb36OrbitOut',fmt(a,1)+' AU');txt('pb36PlanetMassOut',fmt(pm,0)+' M⊕');
  txt('pb36Period',fmt(periodYears(a,m),1));txt('pb36Hill',fmt(hillRadiusAu(a,pm,m),2));
  txt('pb36LuminosityOut',fmt(L,1)+' L☉');txt('pb36IceDistanceOut',fmt(r,1)+' AU');
  var T=equilibriumTemperatureK(L,r),snow=snowlineAu(L);
  txt('pb36Temp',fmt(T,0));txt('pb36Snow',fmt(snow,2));
  var status=document.getElementById('pb36IceStatus');
  if(status){var hot=r<snow;status.classList.toggle('is-hot',hot);status.textContent=hot?'W tym prostym modelu region leży po ciepłej stronie granicy lodu wodnego.':'W tym prostym modelu region leży po chłodnej stronie granicy lodu wodnego.';}
  txt('pb36GrowthStageOut',fmt(step+1,0)+' / 5');txt('pb36DustinessOut',fmt(val('dustiness'),0)+'%');
  txt('pb36GrowthName',stages[step].name);txt('pb36GrowthDesc',stages[step].desc);
  var message=document.getElementById('pb36LabMessage');
  if(message){message.textContent=mode==='disk'?'Przy tym promieniu i masie gwiazdy orbita trwa około '+fmt(periodYears(a,m),1)+' roku/lat; szczeliny na obrazie są umowne.':mode==='ice'?'Dla jasności '+fmt(L,1)+' L☉ temperatura modelowa w odległości '+fmt(r,1)+' AU to około '+fmt(T,0)+' K.':'Etap '+(step+1)+'/5: '+stages[step].name+'. To ilustracja, nie zegar wzrostu planet.';}
 }
 function choose(next){
  if(!panels[next])return;mode=next;
  Object.keys(panels).forEach(function(k){panels[k].hidden=k!==next;});
  buttons.forEach(function(b){var current=b.getAttribute('data-pb36-mode')===next;b.classList.toggle('is-active',current);b.setAttribute('aria-pressed',current?'true':'false');});
  txt('pb36ViewLabel',next==='disk'?'DYSK PROTOPLANETARNY':next==='ice'?'TEMPERATURA I LÓD':'ZIARNA I EMBRIONY');
  txt('pb36PanelTitle',next==='disk'?'RUCH W DYSKU':next==='ice'?'TERMICZNA MAPA DYSKU':'MATERIA W RUCHU');
  txt('pb36PanelKind',next==='disk'?'KEPLER / HILL':next==='ice'?'MODEL 278 K':'ILUSTRACJA');
  updateOutputs();draw();
 }
 function gradientBackground(w,h){
  var grad=ctx.createRadialGradient(w*.5,h*.49,0,w*.5,h*.49,Math.max(w,h)*.67);
  grad.addColorStop(0,'#17294c');grad.addColorStop(.54,'#0a1935');grad.addColorStop(1,'#050e20');
  ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
  for(var i=0;i<stars.length;i++){var p=stars[i];ctx.fillStyle='rgba(224,240,255,'+p.a+')';ctx.beginPath();ctx.arc(p.x*w,p.y*h,p.size,0,Math.PI*2);ctx.fill();}
 }
 function glow(cx,cy,r,core,edge,alpha){
  var g=ctx.createRadialGradient(cx,cy,0,cx,cy,Math.max(2,r));
  g.addColorStop(0,core);g.addColorStop(.31,edge);g.addColorStop(1,'rgba(37,69,112,0)');
  ctx.globalAlpha=alpha;ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
 }
 function drawStar(cx,cy,s){
  glow(cx,cy,s*3.9,'rgba(255,253,248,.98)','rgba(244,163,191,.35)',.75);
  var g=ctx.createRadialGradient(cx-s*.22,cy-s*.35,0,cx,cy,s);
  g.addColorStop(0,'#ffffff');g.addColorStop(.38,'#f8fdff');g.addColorStop(.78,'#d9effb');g.addColorStop(1,'#9ac1e0');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,s,0,Math.PI*2);ctx.fill();
 }
 function orbitRadius(a,size){
  return (Math.pow(a/60,.55)*.77+.10)*size;
 }
 function drawDisk(w,h,isIce){
  var cx=w*.51,cy=h*.52,size=Math.min(w,h)*.56;
  var tilt=.47+Math.sin(angle)*.12,rot=angle*.52;
  glow(cx,cy,size*1.7,'rgba(135,118,201,.27)','rgba(76,107,179,.16)',.58);
  ctx.save();ctx.translate(cx,cy);ctx.rotate(rot);
  // Gas arcs and concentric dust bands; visualization is not hydrodynamic.
  for(var j=23;j>=0;j--){
    var rr=size*(.20+j*.034),ry=rr*tilt;
    ctx.beginPath();ctx.ellipse(0,0,rr,ry,0,0,Math.PI*2);
    ctx.strokeStyle=j%4===0?'rgba(242,170,195,.31)':j%3===0?'rgba(141,232,240,.33)':'rgba(192,169,226,.21)';
    ctx.lineWidth=1+(j%4===0?4:0)+(j%9===0?2:0);ctx.stroke();
  }
  var testA=val('orbit'),testSize=orbitRadius(testA,size);
  var gap=0.017+Math.min(.07,Math.pow(val('planet')/300,.44)*.045);
  if(!isIce){
    ctx.beginPath();ctx.ellipse(0,0,testSize,testSize*tilt,0,0,Math.PI*2);
    ctx.strokeStyle='rgba(5,15,33,.78)';ctx.lineWidth=size*gap*1.8;ctx.stroke();
    ctx.beginPath();ctx.ellipse(0,0,testSize,testSize*tilt,0,0,Math.PI*2);
    ctx.strokeStyle='rgba(174,217,246,.58)';ctx.lineWidth=1.2;ctx.stroke();
  }
  var density=isIce?660:850;
  for(var i=0;i<density;i++){
    var particle=dust[i],r=.22+particle.r*.77,aa=particle.a+time*(.20+particle.speed*.38)/(r+.25);
    if(!isIce&&Math.abs(r-testSize/size)<gap)continue;
    var x=Math.cos(aa)*size*r,y=Math.sin(aa)*size*r*tilt;
    ctx.beginPath();ctx.arc(x,y,particle.size*(r>.56?1:.8),0,Math.PI*2);
    var a=isIce?(r>.48?'rgba(138,229,242,.49)':'rgba(236,158,198,.52)'):(i%3===0?'rgba(254,205,196,.56)':i%3===1?'rgba(126,222,241,.59)':'rgba(185,157,230,.47)');
    ctx.fillStyle=a;ctx.fill();
  }
  if(isIce){
    var snow=snowlineAu(val('luminosity'));
    var marker=orbitRadius(Math.min(60,snow),size);
    ctx.beginPath();ctx.ellipse(0,0,marker,marker*tilt,0,0,Math.PI*2);
    ctx.strokeStyle='rgba(157,238,248,.94)';ctx.lineWidth=2;ctx.setLineDash([7,7]);ctx.stroke();ctx.setLineDash([]);
    var checkA=val('iceDistance'),radius=orbitRadius(checkA,size);
    var pos=(time*.12+.23)%6.283185;
    ctx.beginPath();ctx.arc(Math.cos(pos)*radius,Math.sin(pos)*radius*tilt,5.5,0,Math.PI*2);
    ctx.fillStyle=checkA<snow?'#f5bed8':'#bcfcff';ctx.fill();
    ctx.font='bold 11px Arial,sans-serif';ctx.fillStyle='#c5eff5';ctx.fillText('GRANICA LODU',-marker*.45,-marker*tilt-13);
  }else{
    var phase=time*.13+.24;
    var x=Math.cos(phase)*testSize,y=Math.sin(phase)*testSize*tilt;
    glow(x,y,18,'rgba(229,248,255,.55)','rgba(105,208,229,.2)',.6);
    ctx.beginPath();ctx.arc(x,y,3.4+Math.pow(val('planet')/300,.5)*5,0,Math.PI*2);
    ctx.fillStyle='#f8e7ed';ctx.fill();
  }
  drawStar(0,0,Math.max(8,size*.065));
  ctx.restore();
  var top=Math.max(35,cy-size*.54);
  ctx.fillStyle='rgba(180,213,233,.72)';ctx.textAlign='center';ctx.font='11px Arial,sans-serif';
  ctx.fillText(isIce?'STREFA CIEPŁA ↔ STREFA CHŁODNA':'DYSK PYŁOWY · SCHEMAT',cx,top);
 }
 function rock(ctx,x,y,r,rot,shade){
  ctx.save();ctx.translate(x,y);ctx.rotate(rot);
  ctx.beginPath();
  for(var i=0;i<9;i++){
   var a=i*Math.PI*2/9,v=r*(.75+.20*Math.sin(i*3.7+shade*8)+.15*Math.cos(i*1.9+shade*7));
   if(i===0)ctx.moveTo(Math.cos(a)*v,Math.sin(a)*v);
   else ctx.lineTo(Math.cos(a)*v,Math.sin(a)*v);
  }ctx.closePath();
  var g=ctx.createLinearGradient(-r,-r,r,r);
  g.addColorStop(0,shade>.48?'#c3a1d8':'#8cb3c8');g.addColorStop(.6,shade>.48?'#68729d':'#627c9b');g.addColorStop(1,'#1b2b47');ctx.fillStyle=g;ctx.fill();
  ctx.strokeStyle='rgba(217,239,247,.25)';ctx.lineWidth=Math.max(.4,r*.035);ctx.stroke();
  if(r>12){ctx.fillStyle='rgba(13,25,48,.22)';ctx.beginPath();ctx.arc(r*.22,-r*.21,r*.13,0,Math.PI*2);ctx.fill();}
  ctx.restore();
 }
 function drawGrowth(w,h){
  var step=val('growth')-1,settings=stages[step],cx=w*.49,cy=h*.5,u=Math.min(w,h);
  var ratio=val('dustiness')/100;
  glow(cx,cy,u*.63,'rgba(171,132,208,.33)','rgba(61,112,163,.13)',.64);
  for(var j=0;j<14;j++){
    var rad=u*(.23+j*.028);
    ctx.beginPath();ctx.ellipse(cx,cy,rad,rad*.53,-.15,0,Math.PI*2);
    ctx.strokeStyle=j%2?'rgba(154,219,246,.1)':'rgba(235,150,209,.13)';ctx.lineWidth=1;ctx.stroke();
  }
  var count=Math.round(settings.count*(.35+.65*ratio));
  for(var i=0;i<count;i++){
    var p=dust[(i*3)%dust.length],a=p.a+time*.12/(.4+p.r),radius=u*(.12+p.r*.5);
    var x=cx+Math.cos(a)*radius*1.4,y=cy+Math.sin(a)*radius*.9;
    if(step<=1){
      ctx.beginPath();ctx.arc(x,y,p.size*(1+step*.5),0,Math.PI*2);
      ctx.fillStyle=i%3===0?'rgba(238,173,223,.68)':i%3===1?'rgba(147,229,242,.72)':'rgba(244,225,216,.57)';ctx.fill();
    }else{
      var r=Math.max(1.5,(step-1)*3.2+(i%11===0?(step-1)*7:0));
      rock(ctx,x,y,r,a,p.shade);
    }
  }
  if(step>=2){
    var f=(step-1)/3;
    rock(ctx,cx+u*.15,cy+u*.13,u*(.095+.13*f),-.18,.28);
    if(step>=4){rock(ctx,cx-u*.23,cy-u*.10,u*.11,.65,.9);}
  } else {
    glow(cx+u*.12,cy+.05*u,u*(.17+step*.10),'rgba(228,234,255,.24)','rgba(145,183,244,.12)',.46);
  }
  ctx.font='12px Arial,sans-serif';ctx.textAlign='center';ctx.fillStyle='rgba(226,245,252,.85)';
  ctx.fillText(settings.name.toUpperCase(),cx,Math.min(h-64,cy+u*.42));
 }
 function render(){
  var w=canvas.clientWidth||760,h=canvas.clientHeight||600;if(w<20||h<20)return;
  var dpr=Math.min(1.65,window.devicePixelRatio||1),maxW=1700;
  if(w*dpr>maxW)dpr=maxW/w;
  var cw=Math.round(w*dpr),ch=Math.round(h*dpr);
  if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw;canvas.height=ch;}
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  gradientBackground(w,h);
  if(mode==='growth')drawGrowth(w,h);else drawDisk(w,h,mode==='ice');
 }
 function cancel(){if(frame&&window.cancelAnimationFrame)window.cancelAnimationFrame(frame);frame=0;lastTick=0;}
 function schedule(){if(frame||!motion||!visible||document.hidden||!window.requestAnimationFrame)return;frame=window.requestAnimationFrame(tick);}
 function tick(now){
  frame=0;if(!motion||!visible||document.hidden)return;
  if(now-lastTick>=32){var dt=lastTick?Math.min(.09,(now-lastTick)/1000):.033;time+=dt;lastTick=now;render();}
  schedule();
 }
 function reflectPlay(){if(play)play.textContent=motion?'Ⅱ Zatrzymaj ruch':'▶ Uruchom ruch';if(motion)schedule();else cancel();}
 for(var k in controls)controls[k].addEventListener('input',function(){updateOutputs();render();});
 buttons.forEach(function(b){b.addEventListener('click',function(){choose(b.getAttribute('data-pb36-mode'));});});
 if(play)play.addEventListener('click',function(){motion=!motion;reflectPlay();});
 if(reset)reset.addEventListener('click',function(){
  var defaults={star:1,orbit:8,planet:30,luminosity:1,iceDistance:3,growth:2,dustiness:72};
  for(var name in defaults)controls[name].value=String(defaults[name]);
  time=0;angle=-.22;choose('disk');updateOutputs();render();
 });
 if(cinema)cinema.addEventListener('click',function(){
  var on=root.classList.toggle('is-cinema');cinema.setAttribute('aria-pressed',on?'true':'false');
  cinema.textContent=on?'⤡ Wróć do zwykłego widoku':'⤢ Tryb kinowy';
  render();if(on&&root.scrollIntoView)root.scrollIntoView({behavior:prefersReduce?'auto':'smooth',block:'start'});
 });
 canvas.addEventListener('pointerdown',function(e){drag=true;lastX=e.clientX;if(canvas.setPointerCapture)try{canvas.setPointerCapture(e.pointerId);}catch(_){ }});
 canvas.addEventListener('pointermove',function(e){if(!drag)return;angle+=(e.clientX-lastX)*.014;lastX=e.clientX;render();});
 canvas.addEventListener('pointercancel',function(){drag=false;});
 canvas.addEventListener('pointerup',function(){drag=false;});
 document.addEventListener('keydown',function(e){if(e.key==='Escape'&&root.classList.contains('is-cinema')){root.classList.remove('is-cinema');if(cinema){cinema.textContent='⤢ Tryb kinowy';cinema.setAttribute('aria-pressed','false');}render();}});
 document.addEventListener('visibilitychange',function(){if(document.hidden)cancel();else{render();schedule();}});
 window.addEventListener('resize',render);
 if(window.IntersectionObserver){
  var observer=new IntersectionObserver(function(entries){visible=!!(entries[0]&&entries[0].isIntersecting);if(visible){render();schedule();}else cancel();},{threshold:.035});
  observer.observe(root);
 }else{
  var check=function(){var box=root.getBoundingClientRect();visible=box.bottom>=0&&box.top<(window.innerHeight||700);if(visible)schedule();else cancel();};
  window.addEventListener('scroll',check);check();
 }
 window.addEventListener('pagehide',cancel);
 updateOutputs();choose('disk');reflectPlay();render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
})();
