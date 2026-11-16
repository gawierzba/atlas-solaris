/* ATLAS SOLARIS 34 — lab Sedowa–Taylora i ilustracje pozostałości supernowych.
   Samodzielny Canvas 2D; bez bibliotek, WebGL, sieci i niepotrzebnych animacji w tle. */
(function(){
'use strict';
function radiusPc(tYears,energy51,density){
  if(!(tYears>0&&energy51>0&&density>0))return NaN;
  return 12.9*Math.pow(energy51/density,.2)*Math.pow(tYears/10000,.4);
}
function speedKmS(tYears,energy51,density){
  return .4*radiusPc(tYears,energy51,density)/tYears*977792.22;
}
window.ATLAS_SN34_PHYSICS={radiusPc:radiusPc,speedKmS:speedKmS};
function start(){
  var btnAbout=document.getElementById('stageAbout');
  var info=document.getElementById('stageInfo');
  var closeBtn=document.getElementById('stageInfoClose');
  if(btnAbout&&info&&closeBtn){
    function setInfo(open){info.hidden=!open;btnAbout.setAttribute('aria-expanded',open?'true':'false');}
    btnAbout.addEventListener('click',function(){setInfo(info.hidden);});
    closeBtn.addEventListener('click',function(){setInfo(false);});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!info.hidden)setInfo(false);});
  }
  var canvas=document.getElementById('sn34Canvas');
  if(!canvas)return;
  var context=canvas.getContext&&canvas.getContext('2d');
  var ageEl=document.getElementById('sn34Age');
  var energyEl=document.getElementById('sn34Energy');
  var densityEl=document.getElementById('sn34Density');
  var playBtn=document.getElementById('sn34Play');
  var resetBtn=document.getElementById('sn34Reset');
  var tabEls=document.querySelectorAll('[data-sn34-view]');
  var modeHelp=document.getElementById('sn34ModeHelp');
  var elLegend=document.getElementById('sn34ElementKey');
  var modeName=document.getElementById('sn34ViewName');
  if(!ageEl||!energyEl||!densityEl)return;
  var age=Number(ageEl.value),energy=Number(energyEl.value),density=Number(densityEl.value);
  var mode='shock',angle=0,playing=false,frame=0,lastTime=0,drag=false,lastPointer=0;
  var modes={
    shock:{label:'FALA UDERZENIOWA',help:'W modelu adiabatycznym fala zbiera gaz międzygwiazdowy. Zwiększ energię lub zmniejsz gęstość, aby porównać orientacyjny zasięg ekspansji.'},
    nebula:{label:'WNĘTRZE MGŁAWICY',help:'Włókna, smugi i punkty są syntetyczną ilustracją nierównomiernej struktury. Przesuń widok palcem lub myszą; geometria nie pochodzi z obserwacji.'},
    elements:{label:'MAPA PIERWIASTKÓW',help:'Kolory oznaczają poglądowe rozmieszczenie tlenu, krzemu i żelaza. Nie jest to mapa chemiczna konkretnej mgławicy ani przewidywanie ilości pierwiastków.'}
  };
  function text(id,value){var el=document.getElementById(id);if(el)el.textContent=value;}
  function number(x,digits){return Number(x).toLocaleString('pl-PL',{minimumFractionDigits:digits,maximumFractionDigits:digits});}
  function clamp(x,min,max){return Math.max(min,Math.min(max,x));}
  function updateMetrics(){
    age=Number(ageEl.value);energy=Number(energyEl.value);density=Number(densityEl.value);
    text('sn34AgeOut',number(age,0)+' lat');
    text('sn34EnergyOut',number(energy,1)+' × 10⁵¹ erg');
    text('sn34DensityOut',number(density,1)+' cm⁻³');
    text('sn34Radius',number(radiusPc(age,energy,density),1));
    text('sn34Speed',number(speedKmS(age,energy,density),0));
  }
  var stars=[];
  function rng(a){var z=Math.sin(a*127.13+91.7)*43758.5453;return z-Math.floor(z);}
  for(var s=0;s<210;s++)stars.push({x:rng(s+1),y:rng(s+501),r:.4+rng(s+883)*1.6,a:.2+rng(s+1333)*.55});
  function shellRadius(){
    var raw=radiusPc(age,energy,density);
    return .17+Math.min(.29,raw/35*.26);
  }
  function strokeShell(ctx,cx,cy,rx,ry,scale,wobble,color,opacity,lineWidth,phase){
    ctx.beginPath();
    var count=240;
    for(var i=0;i<=count;i++){
      var a=i/count*Math.PI*2;
      var f=1+wobble*(Math.sin(a*7+phase)+.52*Math.sin(a*17-phase*1.4)+.25*Math.sin(a*31+phase*.7));
      var x=cx+Math.cos(a)*rx*scale*f,y=cy+Math.sin(a)*ry*scale*f;
      if(!i)ctx.moveTo(x,y);else ctx.lineTo(x,y);
    }
    ctx.strokeStyle=color;ctx.lineWidth=lineWidth;ctx.globalAlpha=opacity;ctx.stroke();ctx.globalAlpha=1;
  }
  function drawFilaments(ctx,cx,cy,rx,ry,intensity){
    for(var i=0;i<155;i++){
      var a=rng(i+803)*Math.PI*2;
      var a2=a+(rng(i+902)-.5)*.63;
      var f1=.33+rng(i+407)*.36;
      var f2=.7+rng(i+207)*.41;
      var mid=(a+a2)*.5;
      ctx.beginPath();
      ctx.moveTo(cx+Math.cos(a+angle)*rx*f1,cy+Math.sin(a+angle)*ry*f1);
      ctx.quadraticCurveTo(cx+Math.cos(mid+angle+.3)*rx*(.48+rng(i+119)*.48),cy+Math.sin(mid+angle-.2)*ry*(.48+rng(i+171)*.48),cx+Math.cos(a2+angle)*rx*f2,cy+Math.sin(a2+angle)*ry*f2);
      var colorIndex=i%4;
      ctx.strokeStyle=colorIndex===0?'#f4a0ad':colorIndex===1?'#a47fdd':colorIndex===2?'#84eced':'#e8c7e2';
      ctx.globalAlpha=(.09+rng(i+73)*.5)*intensity;
      ctx.lineWidth=.4+rng(i+37)*2.6;
      ctx.stroke();
    }
    ctx.globalAlpha=1;
  }
  function draw(){
    if(!context)return;
    var w=canvas.clientWidth||840,h=canvas.clientHeight||560;
    if(w<10||h<10)return;
    var dpr=Math.min(2,window.devicePixelRatio||1),pw=Math.round(w*dpr),ph=Math.round(h*dpr);
    if(canvas.width!==pw||canvas.height!==ph){canvas.width=pw;canvas.height=ph;}
    var ctx=context;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
    var bg=ctx.createRadialGradient(w*.48,h*.47,8,w*.48,h*.47,Math.max(w,h)*.73);
    bg.addColorStop(0,'#17274b');bg.addColorStop(.55,'#08152c');bg.addColorStop(1,'#050d21');
    ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
    for(var i=0;i<stars.length;i++){var star=stars[i];ctx.fillStyle='rgba(210,235,253,'+star.a+')';ctx.beginPath();ctx.arc(star.x*w,star.y*h,star.r,0,Math.PI*2);ctx.fill();}
    var span=Math.min(w,h);
    var cx=w*.51,cy=h*.50,rx=span*shellRadius()*1.13,ry=span*shellRadius()*.94;
    var halo=ctx.createRadialGradient(cx,cy,span*.05,cx,cy,rx*1.6);
    halo.addColorStop(0,'rgba(174,107,177,.17)');halo.addColorStop(.52,'rgba(117,113,200,.16)');halo.addColorStop(.8,'rgba(86,162,219,.09)');halo.addColorStop(1,'rgba(32,40,80,0)');
    ctx.fillStyle=halo;ctx.beginPath();ctx.ellipse(cx,cy,rx*1.62,ry*1.75,0,0,Math.PI*2);ctx.fill();
    ctx.save();ctx.translate(cx,cy);ctx.rotate(Math.sin(angle)*.08);ctx.translate(-cx,-cy);
    if(mode==='shock'){
      strokeShell(ctx,cx,cy,rx,ry,1,.02,'#a5eef3',.78,2.4,angle);
      strokeShell(ctx,cx,cy,rx,ry,.95,.04,'#f6b3ca',.39,5,angle+.2);
      strokeShell(ctx,cx,cy,rx,ry,.78,.07,'#b08edb',.24,1.7,angle+1.6);
      strokeShell(ctx,cx,cy,rx,ry,.57,.07,'#df86b0',.14,1.2,angle+.7);
      for(var j=0;j<75;j++){
        var a=j/75*Math.PI*2+angle;
        var inner=.47+rng(j+321)*.22;
        var outer=.86+rng(j+552)*.14;
        ctx.beginPath();
        ctx.moveTo(cx+Math.cos(a)*rx*inner,cy+Math.sin(a)*ry*inner);
        ctx.lineTo(cx+Math.cos(a+.02)*rx*outer,cy+Math.sin(a+.02)*ry*outer);
        ctx.strokeStyle=j%3?'#83b7ec':'#f9a4b6';ctx.globalAlpha=.07+rng(j+423)*.21;ctx.lineWidth=.5+rng(j+210)*1.4;ctx.stroke();
      }
      ctx.globalAlpha=1;
    } else if(mode==='nebula'){
      var cloudy=ctx.createRadialGradient(cx,cy,span*.09,cx,cy,rx);
      cloudy.addColorStop(0,'rgba(192,92,167,.18)');cloudy.addColorStop(.45,'rgba(149,94,171,.20)');cloudy.addColorStop(.82,'rgba(102,190,209,.10)');cloudy.addColorStop(1,'rgba(76,178,207,0)');
      ctx.fillStyle=cloudy;ctx.beginPath();ctx.ellipse(cx,cy,rx*1.1,ry*1.06,0,0,Math.PI*2);ctx.fill();
      drawFilaments(ctx,cx,cy,rx,ry,1.35);
      strokeShell(ctx,cx,cy,rx,ry,.91,.085,'#edb7cc',.37,2.3,angle);
      strokeShell(ctx,cx,cy,rx,ry,.72,.11,'#7fdce9',.32,1.9,angle+.9);
      for(var k=0;k<140;k++){
        var a1=rng(k+730)*Math.PI*2,r1=Math.sqrt(rng(k+948));
        var px=cx+Math.cos(a1+angle)*rx*r1,py=cy+Math.sin(a1+angle)*ry*r1;
        ctx.beginPath();ctx.arc(px,py,.5+rng(k+127)*2.3,0,Math.PI*2);
        ctx.fillStyle=k%3?'rgba(246,168,190,.44)':'rgba(143,230,235,.55)';ctx.fill();
      }
    } else {
      strokeShell(ctx,cx,cy,rx,ry,1,.06,'#96d6e7',.32,2,angle);
      strokeShell(ctx,cx,cy,rx,ry,.7,.085,'#f2b5d3',.26,1.7,angle+.7);
      for(var n=0;n<260;n++){
        var group=n%3;
        var a2=rng(n+990)*Math.PI*2+angle;
        var rr=group===0?.5+rng(n+249)*.58:group===1?.26+rng(n+249)*.57:.12+rng(n+249)*.6;
        var px2=cx+Math.cos(a2)*rx*rr,py2=cy+Math.sin(a2)*ry*rr;
        var radius=.8+rng(n+19)*2.8;
        ctx.beginPath();ctx.arc(px2,py2,radius,0,Math.PI*2);
        ctx.fillStyle=group===0?'rgba(108,224,239,.72)':group===1?'rgba(235,154,217,.68)':'rgba(255,175,162,.72)';
        ctx.fill();
      }
      ctx.font='bold '+Math.max(11,Math.round(span*.031))+'px Arial, sans-serif';
      ctx.textAlign='center';
      [['O',.82,-.25,'#9feaf1'],['Si',-.49,.33,'#f2c4e6'],['Fe',.18,.11,'#ffc4bd']].forEach(function(v){
        var x=cx+v[1]*rx,y=cy+v[2]*ry;
        ctx.fillStyle='#08162beb';ctx.beginPath();ctx.arc(x,y,14,0,Math.PI*2);ctx.fill();
        ctx.fillStyle=v[3];ctx.fillText(v[0],x,y+4);
      });
    }
    ctx.restore();ctx.textAlign='left';
    if(mode==='shock'){
      ctx.strokeStyle='#9ad9e599';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+rx,cy);ctx.stroke();
      ctx.beginPath();ctx.arc(cx,cy,3,0,Math.PI*2);ctx.fillStyle='#e0faff';ctx.fill();
      ctx.font='12px Arial,sans-serif';ctx.fillStyle='#b8e4ed';ctx.fillText('R ≈ '+number(radiusPc(age,energy,density),1)+' pc',Math.min(w-127,cx+rx*.3),cy-11);
    }
  }
  function render(){updateMetrics();draw();}
  function changeMode(next){
    if(!modes[next])return;
    mode=next;
    Array.prototype.forEach.call(tabEls,function(b){var active=b.getAttribute('data-sn34-view')===mode;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',active?'true':'false');});
    if(modeHelp)modeHelp.textContent=modes[mode].help;
    if(modeName)modeName.textContent=modes[mode].label;
    if(elLegend)elLegend.hidden=mode!=='elements';
    draw();
  }
  function pause(){playing=false;lastTime=0;if(frame)cancelAnimationFrame(frame);frame=0;if(playBtn)playBtn.textContent='▶ Uruchom czas';}
  function animate(timestamp){
    if(!playing)return;
    if(document.hidden){pause();return;}
    if(!lastTime)lastTime=timestamp;
    var delta=clamp(timestamp-lastTime,0,80);lastTime=timestamp;
    age+=delta*.55;
    if(age>=12000){age=12000;ageEl.value=String(age);render();pause();return;}
    ageEl.value=String(Math.round(age/100)*100);
    render();
    frame=requestAnimationFrame(animate);
  }
  function togglePlay(){
    if(playing){pause();return;}
    if(Number(ageEl.value)>=12000){age=800;ageEl.value='800';}
    playing=true;lastTime=0;
    if(playBtn)playBtn.textContent='Ⅱ Zatrzymaj czas';
    frame=requestAnimationFrame(animate);
  }
  [ageEl,energyEl,densityEl].forEach(function(input){
    input.addEventListener('input',function(){render();});
    input.addEventListener('change',function(){render();});
  });
  Array.prototype.forEach.call(tabEls,function(btn){btn.addEventListener('click',function(){changeMode(btn.getAttribute('data-sn34-view'));});});
  if(playBtn)playBtn.addEventListener('click',togglePlay);
  if(resetBtn)resetBtn.addEventListener('click',function(){
    pause();ageEl.value='4500';energyEl.value='1';densityEl.value='1';angle=0;changeMode('shock');render();
  });
  canvas.addEventListener('pointerdown',function(e){drag=true;lastPointer=e.clientX;if(canvas.setPointerCapture)try{canvas.setPointerCapture(e.pointerId);}catch(_){ }});
  canvas.addEventListener('pointermove',function(e){if(!drag)return;angle+=(e.clientX-lastPointer)*.012;lastPointer=e.clientX;draw();});
  canvas.addEventListener('pointerup',function(){drag=false;});
  canvas.addEventListener('pointercancel',function(){drag=false;});
  window.addEventListener('resize',draw);
  document.addEventListener('visibilitychange',function(){if(document.hidden)pause();else draw();});
  window.addEventListener('pagehide',pause);
  updateMetrics();changeMode('shock');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);
else start();
})();
