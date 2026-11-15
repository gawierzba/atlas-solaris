/* ATLAS SOLARIS 03.1 — one-scale astronomical model.
 * Lightweight arithmetic only: no animation loop, timer, canvas, GPU or API.
 * All dimensions in km; scaled lengths are then converted into mm / cm / m / km.
 */
(() => {
 'use strict';
 const earthDiameterKm=12742;
 const objects=Object.freeze({
  s3MoonSize:3474.8,
  s3MoonDistance:384400,
  s3SunSize:1392700,
  s3SunDistance:149597870.7,
  s3JupiterDistance:778000000,
  s3NeptuneDistance:4500000000
 });
 const buttons=[...document.querySelectorAll('#s3Calculator button[data-size-mm]')];
 if(!buttons.length)return;
 const fmt=new Intl.NumberFormat('pl-PL',{minimumFractionDigits:2,maximumFractionDigits:2});
 function formattedLength(mm){
  if(mm<10)return fmt.format(mm)+' mm';
  if(mm<1000)return fmt.format(mm/10)+' cm';
  if(mm<1e6)return fmt.format(mm/1000)+' m';
  return fmt.format(mm/1e6)+' km';
 }
 function render(sizeMm){
  if(![1,10,100].includes(sizeMm))return;
  for(const [id,km] of Object.entries(objects)){
   const el=document.getElementById(id);
   if(el)el.textContent=formattedLength(km/earthDiameterKm*sizeMm);
  }
  for(const button of buttons){
   button.setAttribute('aria-pressed',String(Number(button.dataset.sizeMm)===sizeMm));
  }
 }
 for(const button of buttons)button.addEventListener('click',()=>render(Number(button.dataset.sizeMm)));
 render(10);
})();
