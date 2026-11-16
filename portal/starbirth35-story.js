/* ATLAS SOLARIS 35 — laboratorium narodzin gwiazd.
   Model Jeansa i swobodnego spadku; dwa dodatkowe tryby są ilustracjami Canvas 2D.
   Bez WebGL, bibliotek, zdalnych skryptów i dźwięku. */
(function(){
'use strict';
var G=6.67430e-11;
var kB=1.380649e-23;
var mH=1.6735575e-27;
var mu=2.33;
var solarMass=1.98847e30;
var secondsPerMyr=365.25*86400*1e6;
function densityMass(numberDensityCm3){
  return mu*mH*numberDensityCm3*1e6;
}
function effectiveSoundSpeed(temperatureK,turbulenceKmS){
  var v2=kB*temperatureK/(mu*mH)+Math.pow((turbulenceKmS||0)*1000,2);
  return Math.sqrt(v2);
}
function jeansMass(temperatureK,numberDensityCm3,turbulenceKmS){
  if(!(temperatureK>0&&numberDensityCm3>0)||turbulenceKmS<0)return NaN;
  var rho=densityMass(numberDensityCm3);
  var v=effectiveSoundSpeed(temperatureK,turbulenceKmS);
  var jeansLength=Math.sqrt(Math.PI*v*v/(G*rho));
  return (Math.PI/6)*rho*Math.pow(jeansLength,3)/solarMass;
}
function freeFallMyr(numberDensityCm3){
  if(!(numberDensityCm3>0))return NaN;
  return Math.sqrt(3*Math.PI/(32*G*densityMass(numberDensityCm3)))/secondsPerMyr;
}
window.ATLAS_SB35_PHYSICS={
  jeansMass:jeansMass,
  freeFallMyr:freeFallMyr,
  effectiveSoundSpeed:effectiveSoundSpeed,
  densityMass:densityMass
};
function boot(){
 var buttonAbout=document.getElementById('stageAbout');
 var info=document.getElementById('stageInfo');
 var close=document.getElementById('stageInfoClose');
 if(buttonAbout&&info&&close){
   function setInfo(open){info.hidden=!open;buttonAbout.setAttribute('aria-expanded',String(open));}
   buttonAbout.addEventListener('click',function(){setInfo(info.hidden);});
   close.addEventListener('click',function(){setInfo(false);buttonAbout.focus();});
   document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!info.hidden){setInfo(false);buttonAbout.focus();}});
 }
 var canvas=document.getElementById('sb35Canvas');
 var root=document.getElementById('sb35Lab');
 if(!canvas||!root||!canvas.getContext)return;
 var ctx=canvas.getContext('2d');
 if(!ctx)return;
 var inputs={
   temp:document.getElementById('sb35Temp'),
   density:document.getElementById('sb35Density'),
   mass:document.getElementById('sb35Mass'),
   turbulence:document.getElementById('sb35Turbulence'),
   tilt:document.getElementById('sb35Tilt'),
   rate:document.getElementById('sb35Rate'),
   jet:document.getElementById('sb35Jet'),
   phase:document.getElementById('sb35Phase'),
   halo:document.getElementById('sb35Halo')
 };
 if(!inputs.temp||!inputs.density||!inputs.mass||!inputs.turbulence)return;
 var outputIds={
   temp:'sb35TempValue',density:'sb35DensityValue',mass:'sb35MassValue',turbulence:'sb35TurbulenceValue',
   tilt:'sb35TiltValue',rate:'sb35RateValue',jet:'sb35JetValue',phase:'sb35PhaseValue',halo:'sb35HaloValue'
 };
 var panels={
   cloud:document.getElementById('sb35ControlsCloud'),
   disk:document.getElementById('sb35ControlsDisk'),
   light:document.getElementById('sb35ControlsLight')
 };
 var buttons=Array.prototype.slice.call(document.querySelectorAll('[data-view]'));
 var label=document.getElementById('sb35ModeLabel');
 var modelType=document.getElementById('sb35ModelType');
 var title=document.getElementById('sb35ControlTitle');
 var result=document.getElementById('sb35Result');
 var description=document.getElementById('sb35LiveDescription');
 var play=document.getElementById('sb35Play');
 var reset=document.getElementById('sb35Reset');
 var cinema=document.getElementById('sb35Cinema');
 var mode='cloud';
 var phase=0;
 var lastTick=0;
 var frame=0;
 var visible=false;
 var reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 var wantsMotion=!reduced;
 var running=false;
 var shift=0;
 var dragging=false,dragX=0;
 var pixelRatio=1;
 var logicalWidth=0,logicalHeight=0;
 var dust=[],backgroundStars=[];
 function pseudo(seed){var n=Math.sin(seed*134.13+23.73)*43758.54531;return n-Math.floor(n);}
 for(var j=0;j<260;j++)backgroundStars.push({x:pseudo(j+1),y:pseudo(j+1041),size:.35+pseudo(j+299)*1.55,alpha:.22+pseudo(j+716)*.75});
 for(var i=0;i<410;i++)dust.push({angle:pseudo(i+10)*Math.PI*2,radius:Math.sqrt(pseudo(i+427)),depth:pseudo(i+113),size:.6+pseudo(i+843)*2.6,speed:.2+pseudo(i+713)*.9});
 function getValue(k){return Number(inputs[k].value);}
 function fmt(v,d){return Number(v).toLocaleString('pl-PL',{minimumFractionDigits:d,maximumFractionDigits:d});}
 function setText(id,value){var el=document.getElementById(id);if(el)el.textContent=value;}
 function update(){
   var t=getValue('temp'),density=Math.pow(10,getValue('density'));
   var mass=getValue('mass'),turb=getValue('turbulence');
   var jeans=jeansMass(t,density,turb),free=freeFallMyr(density);
   setText(outputIds.temp,fmt(t,0)+' K');
   setText(outputIds.density,fmt(density,0)+' cm⁻³');
   setText(outputIds.mass,fmt(mass,0)+' M☉');
   setText(outputIds.turbulence,fmt(turb,2)+' km/s');
   setText('sb35Jeans',fmt(jeans,2));
   setText('sb35Freefall',fmt(free,3));
   setText(outputIds.tilt,fmt(getValue('tilt'),0)+'°');
   setText(outputIds.rate,fmt(getValue('rate'),0)+'%');
   setText(outputIds.jet,fmt(getValue('jet'),0)+'%');
   setText(outputIds.phase,fmt(getValue('phase'),0)+' / 100');
   setText(outputIds.halo,fmt(getValue('halo'),0)+'%');
   var stable=mass<=jeans;
   if(result){
     result.classList.toggle('is-supported',stable);
     result.textContent=stable
       ?'W modelu idealnym masa rdzenia nie przekracza masy Jeansa. Nie przewidujemy tu samorzutnego kolapsu; rzeczywistość może być bardziej złożona.'
       :'W modelu idealnym masa rdzenia przekracza masę Jeansa: możliwa niestabilność grawitacyjna. To kryterium, nie dokładna prognoza narodzin gwiazdy.';
   }
   var p=getValue('phase');
   var stage=p<21?'Zagęszczony rdzeń':p<50?'Protogwiazda':p<83?'Przed ciągiem głównym':'Ciąg główny';
   setText('sb35StageName',stage);
   setText('sb35Progress',fmt(p,0)+'%');
   if(description){
     description.textContent=mode==='cloud'
       ?(stable?'W uproszczonym modelu rdzeń pozostaje poniżej granicy Jeansa. Zmień parametry, by sprawdzić rolę grawitacji.':'W uproszczonym modelu rdzeń jest powyżej granicy Jeansa. Smugi pokazują możliwy kierunek ruchu materii, nie dokładne trajektorie.')
       :mode==='disk'?'Wirujący dysk i wypływy to widowiskowa ilustracja. Możesz obracać kadr przeciągnięciem po wizualizacji.'
       :'Pokazujemy symboliczną drogę do pierwszego światła. Skala 0–100 nie oznacza lat ani dokładnego rozwoju temperatury.';
   }
 }
 function switchMode(next){
   if(!panels[next])return;
   mode=next;
   Object.keys(panels).forEach(function(k){if(panels[k])panels[k].hidden=k!==mode;});
   buttons.forEach(function(b){var active=b.getAttribute('data-view')===mode;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active));});
   if(label)label.textContent=mode==='cloud'?'GRAWITACJA / GAZ':mode==='disk'?'DYSK / DŻETY':'OD PROTOGWIAZDY DO GWIAZDY';
   if(title)title.textContent=mode==='cloud'?'PARAMETRY RDZENIA':mode==='disk'?'KAMERA PROTOGWIAZDY':'ETAP NARODZIN';
   if(modelType)modelType.textContent=mode==='cloud'?'MODEL FIZYCZNY':'WIZJA ARTYSTYCZNA';
   update();draw();
 }
 function bg(w,h){
   var g=ctx.createRadialGradient(w*.55,h*.43,6,w*.54,h*.45,Math.max(w,h)*.75);
   g.addColorStop(0,mode==='light'?'#1b2d4e':'#132645');g.addColorStop(.47,'#091932');g.addColorStop(1,'#040b1b');
   ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
   for(var i=0;i<backgroundStars.length;i++){
      var s=backgroundStars[i];ctx.beginPath();ctx.arc(s.x*w,s.y*h,s.size,0,Math.PI*2);
      ctx.fillStyle='rgba(202,239,249,'+s.alpha+')';ctx.fill();
   }
 }
 function glow(cx,cy,r,color0,color1,alpha){
   ctx.save();ctx.globalAlpha=alpha;
   var g=ctx.createRadialGradient(cx,cy,0,cx,cy,Math.max(3,r));g.addColorStop(0,color0);g.addColorStop(.3,color1);g.addColorStop(1,'rgba(12,22,48,0)');
   ctx.beginPath();ctx.fillStyle=g;ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();ctx.restore();
 }
 function gas(cx,cy,w,h,strength){
   ctx.save();
   var q=200;
   for(var i=0;i<q;i++){
      var v=dust[i];var a=v.angle+shift*.15;var r=(.2+v.radius*.78);
      var x=cx+Math.cos(a)*w*r,y=cy+Math.sin(a)*h*r;
      var size=8+25*v.size;
      var g=ctx.createRadialGradient(x,y,1,x,y,size);var tint=i%3===0?'rgba(181,128,227,.09)':i%3===1?'rgba(114,221,231,.09)':'rgba(231,141,179,.09)';
      g.addColorStop(0,tint);g.addColorStop(1,'rgba(27,36,71,0)');
      ctx.fillStyle=g;ctx.globalAlpha=strength;ctx.beginPath();ctx.arc(x,y,size,0,6.2831853);ctx.fill();
   }
   ctx.restore();
 }
 function drawCloud(w,h){
   var cx=w*.52,cy=h*.5,r=Math.min(w,h)*.38;
   var dens=Math.pow(10,getValue('density')),mass=getValue('mass'),mJ=jeansMass(getValue('temp'),dens,getValue('turbulence'));
   var instability=Math.min(3,mass/Math.max(.01,mJ));
   var collapse=instability>1?Math.min(.56,Math.log(instability)*.23):.02;
   gas(cx,cy,r*1.3,r*.95,.95);
   glow(cx,cy,r*1.18,'rgba(214,133,226,.44)','rgba(78,115,192,.21)',.65);
   for(var j=0;j<14;j++){
     ctx.beginPath();
     var a=Math.PI*2*j/14+shift*.04,rad=r*(.65+j%3*.11);
     ctx.ellipse(cx+Math.cos(a)*r*.11,cy+Math.sin(a)*r*.08,rad,rad*.70,a*.25,0,Math.PI*2);
     ctx.strokeStyle=j%3===0?'rgba(152,229,244,.12)':j%3===1?'rgba(220,166,231,.14)':'rgba(244,174,200,.10)';
     ctx.lineWidth=.7+(j%3)*.4;ctx.stroke();
   }
   for(var i=0;i<dust.length;i++){
     var p=dust[i];var a=p.angle+shift*(.12+.07*p.speed)+Math.sin(shift*.3+p.angle)*.07;
     var b=p.radius*(1-collapse*(.32+.68*(.5+.5*Math.sin(shift*.48+p.angle))));
     var x=cx+Math.cos(a)*r*b*1.2,y=cy+Math.sin(a)*r*b*.85;
     ctx.beginPath();ctx.arc(x,y,p.size*(.38+.7*p.depth),0,6.2831853);
     ctx.fillStyle=i%4===0?'rgba(245,197,226,.63)':i%4===1?'rgba(160,225,241,.72)':'rgba(169,166,234,.54)';ctx.fill();
     if(i%8===0&&instability>1){
       var tx=cx+Math.cos(a+.15)*r*b*.68,ty=cy+Math.sin(a+.15)*r*b*.5;
       ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(tx,ty);ctx.strokeStyle='rgba(161,224,240,.19)';ctx.lineWidth=.8;ctx.stroke();
     }
   }
   glow(cx,cy,Math.min(w,h)*(.2+collapse*.1),'rgba(246,241,255,.6)','rgba(153,205,238,.25)',.46+collapse*.45);
   ctx.beginPath();ctx.arc(cx,cy,3.6+collapse*11,0,6.2831853);ctx.fillStyle='#eefeff';ctx.fill();
   ctx.textAlign='center';ctx.fillStyle='rgba(191,222,236,.8)';ctx.font='12px Arial, sans-serif';
   ctx.fillText(instability>1?'PRZEKROCZONA GRANICA JEANSA':'PONIŻEJ GRANICY JEANSA',cx,Math.min(h-65,cy+r*.84+18));
 }
 function drawDisk(w,h){
   var cx=w*.52,cy=h*.5,unit=Math.min(w,h);
   var angle=(-.17+shift*.11),tilt=getValue('tilt')*Math.PI/180;
   var ratio=Math.max(.12,Math.cos(tilt));
   var rate=getValue('rate')/100,jets=getValue('jet')/100;
   gas(cx,cy,unit*.51,unit*.36,.38);
   ctx.save();ctx.translate(cx,cy);ctx.rotate(angle);
   glow(0,0,unit*.34,'rgba(255,250,255,.50)','rgba(134,164,222,.19)',.44);
   // Wypływy są prostopadłe do wyobrażonej płaszczyzny dysku.
   for(var side=-1;side<=1;side+=2){
     if(jets<=.02)continue;
     for(var k=0;k<12;k++){
       var a=-unit*(.13+.03*k),end=-unit*(.51+.02*k);
       ctx.beginPath();
       ctx.moveTo((k-6)*unit*.005,side*a);
       ctx.quadraticCurveTo((k-6)*unit*.015,side*unit*.35,(k-6)*unit*.027,side*end);
       ctx.strokeStyle=k%3===0?'rgba(229,252,255,'+(.07+jets*.26)+')':'rgba(120,233,249,'+(.04+jets*.20)+')';
       ctx.lineWidth=2+k%3;ctx.stroke();
     }
     for(var p=0;p<65;p++){
       var v=dust[(p*3)%dust.length];
       var y=side*(unit*.05+v.radius*unit*.60);
       var x=Math.sin(v.angle+shift*(.4+v.speed))*unit*(.035+.02*v.radius);
       ctx.beginPath();ctx.arc(x,y,Math.max(.7,v.size*(.35+.6*jets)),0,6.2831853);
       ctx.fillStyle='rgba(162,246,251,'+(.08+.67*jets*(1-v.radius*.5))+')';ctx.fill();
     }
   }
   for(var j=17;j>=0;j--){
     var rr=unit*(.11+j*.016);
     ctx.beginPath();ctx.ellipse(0,0,rr,rr*ratio*.54,0,0,Math.PI*2);
     ctx.strokeStyle=j%3===0?'rgba(239,185,222,.28)':j%3===1?'rgba(115,237,246,.25)':'rgba(165,154,241,.22)';
     ctx.lineWidth=1+(j%4===0?2.3:0);ctx.stroke();
   }
   for(var i=0;i<310;i++){
     var p=dust[i%dust.length],r=unit*(.12+.45*Math.sqrt(p.radius));
     var a=p.angle+shift*(.14+1.3/(.18+r/unit))*(.36+rate*.95)+p.depth*4;
     var x=Math.cos(a)*r,y=Math.sin(a)*r*ratio*.50;
     ctx.beginPath();ctx.arc(x,y,Math.max(.4,p.size*(.4+rate*.18)),0,6.2831853);
     ctx.fillStyle=i%3===0?'rgba(251,193,220,.75)':i%3===1?'rgba(156,235,247,.66)':'rgba(201,178,242,.55)';
     ctx.fill();
   }
   glow(0,0,unit*.22,'rgba(250,255,255,.92)','rgba(188,227,251,.45)',1);
   ctx.beginPath();ctx.arc(0,0,Math.max(7,unit*.026),0,6.2831853);ctx.fillStyle='#effeff';ctx.fill();
   ctx.restore();
 }
 function drawLight(w,h){
   var cx=w*.50,cy=h*.50,unit=Math.min(w,h),progress=getValue('phase')/100,bright=getValue('halo')/100;
   var cover=Math.pow(1-progress,1.2);
   gas(cx,cy,unit*.62,unit*.49,cover*.9+.18);
   for(var j=0;j<12;j++){
     var phaseA=shift*.06+j*.5;
     ctx.beginPath();ctx.ellipse(cx,cy,unit*(.26+j*.021),unit*(.18+j*.018),phaseA*.04,0,6.2831853);
     ctx.strokeStyle=j%3===0?'rgba(150,216,237,.12)':j%3===1?'rgba(226,165,220,.11)':'rgba(245,194,218,.10)';
     ctx.lineWidth=.6;ctx.stroke();
   }
   var radius=unit*(.10+.08*progress);
   glow(cx,cy,unit*(.26+.22*progress),'rgba(255,255,255,.82)','rgba(132,207,243,.33)',bright*(.35+.7*progress));
   for(var i=0;i<65;i++){
     var a=i*Math.PI*2/65+shift*.012,r=radius*(1+.13*Math.sin(i*3.1));
     var far=radius*(1.8+progress*1.1)+(i%4)*unit*.025;
     ctx.beginPath();
     ctx.moveTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);
     ctx.lineTo(cx+Math.cos(a)*far,cy+Math.sin(a)*far);
     ctx.strokeStyle=i%3===0?'rgba(228,252,255,.24)':'rgba(175,224,250,.13)';
     ctx.lineWidth=.6+(i%5===0?1.4:0);ctx.stroke();
   }
   var star=ctx.createRadialGradient(cx-radius*.25,cy-radius*.22,3,cx,cy,radius);
   star.addColorStop(0,'#ffffff');star.addColorStop(.25,'#f1ffff');star.addColorStop(.73,'#d4edf9');star.addColorStop(1,'rgba(115,171,223,.65)');
   ctx.beginPath();ctx.arc(cx,cy,radius,0,6.2831853);ctx.fillStyle=star;ctx.globalAlpha=.35+.65*progress;ctx.fill();ctx.globalAlpha=1;
   var hue=ctx.createRadialGradient(cx,cy,radius*.8,cx,cy,radius*1.75);
   hue.addColorStop(0,'rgba(232,250,255,.33)');hue.addColorStop(1,'rgba(104,189,233,0)');
   ctx.beginPath();ctx.arc(cx,cy,radius*1.75,0,6.2831853);ctx.fillStyle=hue;ctx.fill();
   // Gęsty, rozpraszający się pył wokół gwiazdy.
   for(var k=0;k<220;k++){
     var pp=dust[k],a=pp.angle+shift*.11,rr=radius*(1.05+pp.radius*4.3);
     var x=cx+Math.cos(a)*rr,y=cy+Math.sin(a)*rr*.77;
     ctx.beginPath();ctx.arc(x,y,pp.size*.7,0,6.2831853);
     ctx.fillStyle=k%3===0?'rgba(207,151,219,'+(.56*cover)+')':'rgba(114,194,233,'+(.40*cover)+')';ctx.fill();
   }
   ctx.textAlign='center';ctx.font='12px Arial, sans-serif';ctx.fillStyle='rgba(201,233,247,.76)';
   ctx.fillText(progress<.2?'OSŁONIĘTY RDZEŃ':progress<.5?'PROTOGWIAZDA':progress<.83?'PRZED CIĄGIEM GŁÓWNYM':'UMOWNY CIĄG GŁÓWNY',cx,Math.min(h-62,cy+unit*.39));
 }
 function draw(){
   if(!canvas)return;
   var w=canvas.clientWidth||800,h=canvas.clientHeight||530;if(w<20||h<20)return;
   var dpr=Math.min(1.6,window.devicePixelRatio||1);
   if(w*dpr>1700)dpr=1700/w;
   var cw=Math.max(1,Math.round(w*dpr)),ch=Math.max(1,Math.round(h*dpr));
   if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw;canvas.height=ch;}
   pixelRatio=dpr;logicalWidth=w;logicalHeight=h;
   ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
   bg(w,h);
   ctx.save();
   if(mode==='cloud')drawCloud(w,h);else if(mode==='disk')drawDisk(w,h);else drawLight(w,h);
   ctx.restore();
 }
 function schedule(){
   if(frame||!wantsMotion||!visible||document.hidden)return;
   if(!window.requestAnimationFrame)return;
   frame=window.requestAnimationFrame(tick);
 }
 function tick(now){
   frame=0;
   if(!wantsMotion||!visible||document.hidden)return;
   if(now-lastTick>=33){
     var dt=lastTick?Math.min(.07,(now-lastTick)/1000):.033;
     phase+=dt;shift+=dt*1.05;lastTick=now;
     draw();
   }
   schedule();
 }
 function stopFrame(){if(frame&&window.cancelAnimationFrame)window.cancelAnimationFrame(frame);frame=0;lastTick=0;}
 function updatePlay(){
   if(play)play.textContent=wantsMotion?'Ⅱ Zatrzymaj ruch':'▶ Uruchom ruch';
   if(wantsMotion)schedule();else stopFrame();
 }
 Array.prototype.forEach.call(document.querySelectorAll('input[type=range]'),function(input){
   if(!/^sb35/.test(input.id))return;
   input.addEventListener('input',function(){update();draw();});
 });
 buttons.forEach(function(b){b.addEventListener('click',function(){switchMode(b.getAttribute('data-view'));});});
 if(play)play.addEventListener('click',function(){wantsMotion=!wantsMotion;updatePlay();});
 if(reset)reset.addEventListener('click',function(){
   var defaults={temp:12,density:4,mass:6,turbulence:.05,tilt:32,rate:58,jet:85,phase:35,halo:65};
   Object.keys(defaults).forEach(function(k){if(inputs[k])inputs[k].value=String(defaults[k]);});
   shift=0;phase=0;switchMode('cloud');update();draw();
 });
 if(cinema)cinema.addEventListener('click',function(){
   var on=root.classList.toggle('is-cinema');
   cinema.setAttribute('aria-pressed',String(on));
   cinema.textContent=on?'⤡ Zwykły widok':'⤢ Tryb kinowy';
   draw();
   if(on&&root.scrollIntoView)root.scrollIntoView({behavior:reduced?'auto':'smooth',block:'start'});
 });
 canvas.addEventListener('pointerdown',function(e){
   dragging=true;dragX=e.clientX;
   if(canvas.setPointerCapture)try{canvas.setPointerCapture(e.pointerId);}catch(_){}
 });
 canvas.addEventListener('pointermove',function(e){
   if(!dragging)return;shift+=(e.clientX-dragX)*.014;dragX=e.clientX;draw();
 });
 canvas.addEventListener('pointerup',function(){dragging=false;});
 canvas.addEventListener('pointercancel',function(){dragging=false;});
 document.addEventListener('keydown',function(e){
   if(e.key==='Escape'&&root.classList.contains('is-cinema')){
     root.classList.remove('is-cinema');if(cinema){cinema.textContent='⤢ Tryb kinowy';cinema.setAttribute('aria-pressed','false');}draw();
   }
 });
 document.addEventListener('visibilitychange',function(){if(document.hidden){stopFrame();}else{draw();schedule();}});
 window.addEventListener('resize',draw);
 if(window.IntersectionObserver){
   var observer=new IntersectionObserver(function(entries){
     visible=!!(entries[0]&&entries[0].isIntersecting);
     if(visible){draw();schedule();}else stopFrame();
   },{threshold:0.04});
   observer.observe(root);
 }else{
   function checkVisibility(){
     var rect=root.getBoundingClientRect();
     var height=window.innerHeight||700;
     visible=rect.bottom>=0&&rect.top<height;
     if(visible)schedule();else stopFrame();
   }
   window.addEventListener('scroll',checkVisibility);
   checkVisibility();
 }
 window.addEventListener('pagehide',stopFrame);
 update();switchMode('cloud');updatePlay();draw();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
