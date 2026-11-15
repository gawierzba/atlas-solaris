/* ATLAS SOLARIS 07.1 — Notebook of falsifiable models.
 * Two deterministic DOM/SVG experiments. NO canvas, WebGL, timers, requests
 * or active animation. Numerical constants: https://ssd.jpl.nasa.gov/astro_par.html
 * Orbit experiment: a=1 arbitrary; ellipse geometry only, no ephemeris.
 * Light time experiment: one-way propagation in vacuum, straight path d/c.
 */
(() => {
 'use strict';
 const ecc=document.getElementById('m7Eccentricity');
 const output=document.getElementById('m7EccValue');
 const peri=document.getElementById('m7Peri');
 const apo=document.getElementById('m7Apo');
 const ratio=document.getElementById('m7Ratio');
 const ellipse=document.getElementById('m7OrbitEllipse');
 const nearLine=document.getElementById('m7PeriLine');
 const farLine=document.getElementById('m7ApoLine');
 const nearPoint=document.getElementById('m7PeriPoint');
 const farPoint=document.getElementById('m7ApoPoint');
 const nearLabel=document.getElementById('m7PeriLabel');
 const farLabel=document.getElementById('m7ApoLabel');
 const orbitSvg=document.getElementById('m7OrbitSvg');
 const orbitButtons=[...document.querySelectorAll('.m7-e-preset button[data-e]')];
 const fmt=(v,digits)=>new Intl.NumberFormat('pl-PL',{minimumFractionDigits:digits,maximumFractionDigits:digits}).format(v);
 if(ecc&&ellipse&&peri&&apo&&ratio){
  const sunX=325,cy=220,a=162;
  function renderOrbit(){
   const e=Math.max(0,Math.min(.60,Number(ecc.value)||0));
   const cx=sunX+a*e,minor=a*Math.sqrt(1-e*e);
   const p=sunX-a*(1-e),q=sunX+a*(1+e);
   output.textContent=fmt(e,4);
   peri.textContent=fmt(1-e,4)+' a';
   apo.textContent=fmt(1+e,4)+' a';
   ratio.textContent=fmt((1+e)/(1-e),2)+'×';
   ellipse.setAttribute('cx',cx.toFixed(3));
   ellipse.setAttribute('ry',minor.toFixed(3));
   nearLine.setAttribute('d','M'+sunX+' '+cy+'L'+p.toFixed(3)+' '+cy);
   farLine.setAttribute('d','M'+sunX+' '+cy+'L'+q.toFixed(3)+' '+cy);
   nearPoint.setAttribute('cx',p.toFixed(3));
   farPoint.setAttribute('cx',q.toFixed(3));
   nearLabel.setAttribute('x',p.toFixed(3));
   farLabel.setAttribute('x',q.toFixed(3));
   for(const button of orbitButtons)button.setAttribute('aria-pressed',String(Math.abs(Number(button.dataset.e)-e)<.00001));
   orbitSvg?.setAttribute('aria-label','Orbita eliptyczna, mimośród '+fmt(e,4)+'. Odległość peryhelium '+fmt(1-e,4)+' jednostek a, aphelium '+fmt(1+e,4)+' jednostek a. Słońce w ognisku.');
  }
  ecc.addEventListener('input',renderOrbit,{passive:true});
  for(const button of orbitButtons)button.addEventListener('click',()=>{ecc.value=button.dataset.e;renderOrbit()});
  renderOrbit();
 }
 const slider=document.getElementById('m7Distance');
 const distanceKm=document.getElementById('m7DistanceKm');
 const distanceAu=document.getElementById('m7DistanceAu');
 const lightTime=document.getElementById('m7LightTime');
 const lightSeconds=document.getElementById('m7LightSeconds');
 const buttons=[...document.querySelectorAll('.m7-light-preset button')];
 const AU_KM=149597870.7;  // 1 au, IAU 2012, in kilometres (exact by definition)
 const C_KM_S=299792.458; // c, SI exact in km/s
 const minKm=384400;      // illustrative average Earth-Moon distance
 const maxKm=35*AU_KM;
 const logMin=Math.log(minKm),logMax=Math.log(maxKm);
 if(slider&&distanceKm&&distanceAu&&lightTime&&lightSeconds){
  const posForKm=km=>100*(Math.log(km)-logMin)/(logMax-logMin);
  const kmForPos=pos=>Math.exp(logMin+(logMax-logMin)*pos/100);
  function humanTime(seconds){
   if(seconds<60)return fmt(seconds,2)+' s';
   let rounded=Math.round(seconds);
   const hours=Math.floor(rounded/3600);
   rounded-=hours*3600;
   const mins=Math.floor(rounded/60);
   const secs=rounded-mins*60;
   if(hours)return hours+' h '+String(mins).padStart(2,'0')+' min '+String(secs).padStart(2,'0')+' s';
   return mins+' min '+String(secs).padStart(2,'0')+' s';
  }
  function renderLight(km){
   if(!Number.isFinite(km)||km<=0)return;
   const seconds=km/C_KM_S;
   distanceKm.textContent=fmt(km,1)+' km';
   distanceAu.textContent=fmt(km/AU_KM,5)+' au';
   lightTime.textContent=humanTime(seconds);
   lightSeconds.textContent=fmt(seconds,2)+' sekundy';
   for(const button of buttons){
    const preset=button.dataset.km?Number(button.dataset.km):Number(button.dataset.au)*AU_KM;
    button.setAttribute('aria-pressed',String(Math.abs(preset-km)/km<1e-9));
   }
  }
  slider.addEventListener('input',()=>renderLight(kmForPos(Number(slider.value))),{passive:true});
  for(const button of buttons)button.addEventListener('click',()=>{
   const preset=button.dataset.km?Number(button.dataset.km):Number(button.dataset.au)*AU_KM;
   slider.value=String(Math.round(posForKm(preset)));
   renderLight(preset);
  });
  const initial=AU_KM;
  slider.value=String(Math.round(posForKm(initial)));
  renderLight(initial);
 }
})();
