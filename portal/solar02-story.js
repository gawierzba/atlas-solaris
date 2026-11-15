/* ATLAS SOLARIS 02 — quiet orbital chronometer.
 * DOM-only. No canvas, timers, animation loop, storage or network.
 * Sidereal orbital periods (days) follow the long-standing JPL/NASA approximate
 * values used in atlas; precision here is pedagogical, not an ephemeris. */
(() => {
 'use strict';
 const slider=document.getElementById('s2Years');
 const output=document.getElementById('s2YearDisplay');
 const readings=document.querySelectorAll('#s2OrbitReadings .s2-reading');
 const quick=document.querySelectorAll('.s2-quickyears button[data-year]');
 if(!slider||!output||!readings.length)return;
 const siderealYear=365.256;
 const formatter=new Intl.NumberFormat('pl-PL',{minimumFractionDigits:2,maximumFractionDigits:2});
 function update(){
  const years=Math.max(1,Math.min(100,Number(slider.value)||10));
  output.textContent='';
  const numeric=document.createTextNode(String(years)+' ');
  const units=document.createElement('small');
  units.textContent=years===1?'rok':years%10>=2&&years%10<=4&&(years%100<12||years%100>14)?'lata':'lat';
  output.append(numeric,units);
  for(const row of readings){
   const days=Number(row.dataset.orbitDays);
   if(!(days>0))continue;
   const revolutions=years*siderealYear/days;
   const result=row.querySelector('[data-result]');
   const dial=row.querySelector('.s2-reading-dial');
   if(result)result.textContent=formatter.format(revolutions);
   if(dial){
    const fraction=revolutions-Math.floor(revolutions);
    const completion=fraction<1e-9?1:fraction;
    dial.style.setProperty('--angle',(completion*360).toFixed(2)+'deg');
   }
  }
  for(const button of quick)button.setAttribute('aria-pressed',String(Number(button.dataset.year)===years));
 }
 slider.addEventListener('input',update,{passive:true});
 for(const button of quick)button.addEventListener('click',()=>{slider.value=button.dataset.year;update()});
 update();
})();
