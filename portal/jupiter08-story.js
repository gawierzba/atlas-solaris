/* ATLAS SOLARIS / ETAP 08 — samodzielny model dydaktyczny 4 księżyców */
(() => {
  'use strict';
  const slider = document.getElementById('j8Time');
  const output = document.getElementById('j8Days');
  const play = document.getElementById('j8Play');
  const map = document.getElementById('j8OrbitMap');
  if (!slider || !output || !play || !map) return;
  const NS='http://www.w3.org/2000/svg';
  const moons = [
    {id:'io',name:'Io',period:1.769,rx:118,ry:57,offset:-0.38},
    {id:'eu',name:'Europa',period:3.551,rx:189,ry:92,offset:1.02},
    {id:'ga',name:'Ganimedes',period:7.155,rx:274,ry:136,offset:-1.81},
    {id:'ca',name:'Kallisto',period:16.689,rx:364,ry:183,offset:2.10}
  ];
  let playing=false,raf=0,last=0,days=Number(slider.value)||0;
  const max=Number(slider.max);
  const moving=new Map(moons.map(m=>[m.id,{
    body: document.getElementById('j8Moon'+m.id),
    text: document.getElementById('j8Label'+m.id)
  }]));
  const round=v=>Number(v.toFixed(1));
  function render(){
    output.textContent=days.toFixed(2).replace('.',',')+' dnia';
    slider.value=String(days);
    for(const moon of moons){
      const parts=moving.get(moon.id);
      if(!parts.body || !parts.text) continue;
      const angle=moon.offset+2*Math.PI*days/moon.period;
      const x=450+moon.rx*Math.cos(angle);
      const y=274+moon.ry*Math.sin(angle);
      parts.body.setAttribute('cx',String(round(x)));
      parts.body.setAttribute('cy',String(round(y)));
      const side = Math.cos(angle)<0 ? -1 : 1;
      parts.text.setAttribute('x',String(round(x+side*17)));
      parts.text.setAttribute('y',String(round(y-13)));
      parts.text.setAttribute('text-anchor',side<0?'end':'start');
    }
  }
  function stop(){
    playing=false;
    cancelAnimationFrame(raf);
    raf=0;last=0;
    play.textContent='▶ Uruchom ruch';
    play.setAttribute('aria-pressed','false');
  }
  function tick(now){
    if(!playing)return;
    const dt=last?Math.min(85,now-last):0;last=now;
    days=(days+dt*.00033)%(max+.01);
    if(days>max)days=0;
    render();
    raf=requestAnimationFrame(tick);
  }
  slider.addEventListener('input',()=>{
    stop();
    days=Number(slider.value)||0;
    render();
  });
  play.addEventListener('click',()=>{
    if(playing){stop();return}
    playing=true;last=0;
    play.textContent='Ⅱ Zatrzymaj ruch';
    play.setAttribute('aria-pressed','true');
    raf=requestAnimationFrame(tick);
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing)stop()});
  // Animacja nie uruchamia się sama; także na urządzeniach z reduced motion.
  render();
})();