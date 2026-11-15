/* ATLAS SOLARIS 05.1 — a small, geometric lunar phase notebook.
 * No time loop, canvas, WebGL, network, library dependencies or dates.
 * Simplified synodic geometry: Earth at (222,177), Moon at 121 units,
 * Sun direction +x, phases from the angle Sun–Earth–Moon.
 * Sidereal rotation is a separate 27.3217-day period, explained in prose.
 */
(() => {
 'use strict';
 const slider=document.getElementById('m5PhaseRange');
 const lit=document.getElementById('m5LitShape');
 const body=document.getElementById('m5MoonOrbitBody');
 const near=document.getElementById('m5MoonFaceMarker');
 const disk=document.getElementById('m5MoonDisk');
 const orbit=document.getElementById('m5OrbitSvg');
 const label=document.getElementById('m5PhaseLabel');
 const illumination=document.getElementById('m5Illumination');
 const elapsed=document.getElementById('m5Elapsed');
 const buttons=[...document.querySelectorAll('.m5-phase-presets button[data-phase]')];
 if(!slider||!lit||!body||!near||!label||!illumination||!elapsed)return;
 const monthDays=29.53059,centerX=100,centerY=100,radius=84,orbitX=222,orbitY=177,orbitRadius=121;
 const one=new Intl.NumberFormat('pl-PL',{minimumFractionDigits:1,maximumFractionDigits:1});
 const two=new Intl.NumberFormat('pl-PL',{minimumFractionDigits:2,maximumFractionDigits:2});
 function phaseName(p){
  if(p<.03||p>=.97)return 'Nów';
  if(p<.22)return 'Sierp przybywający';
  if(p<.28)return 'Pierwsza kwadra';
  if(p<.47)return 'Księżyc garbaty przybywający';
  if(p<.53)return 'Pełnia';
  if(p<.72)return 'Księżyc garbaty ubywający';
  if(p<.78)return 'Ostatnia kwadra';
  return 'Sierp ubywający';
 }
 // Lit shape: the projected edge of the illuminated hemisphere lies on an
 // ellipse x = 100 ± cos(theta)*sqrt(r^2 - (y-100)^2).
 // The ratio of the lit area to the whole disk is (1-cos(theta))/2.
 function phasePath(theta){
  const waxing=theta<=Math.PI,outer=[],inner=[],n=85;
  for(let i=0;i<=n;i++){
   const y=centerY-radius+2*radius*i/n;
   const halfWidth=Math.sqrt(Math.max(0,radius*radius-(y-centerY)**2));
   const outsideX=centerX+(waxing?halfWidth:-halfWidth);
   const innerX=centerX+(waxing?Math.cos(theta)*halfWidth:-Math.cos(theta)*halfWidth);
   outer.push(outsideX.toFixed(3)+','+y.toFixed(3));
   inner.push(innerX.toFixed(3)+','+y.toFixed(3));
  }
  return 'M'+outer.join(' L')+' L'+inner.reverse().join(' L')+' Z';
 }
 function update(){
  const progress=Math.min(100,Math.max(0,Number(slider.value)||0));
  const fraction=progress/100,theta=2*Math.PI*fraction;
  const percentage=50*(1-Math.cos(theta));
  const title=phaseName(fraction);
  lit.setAttribute('d',phasePath(theta));
  const mx=orbitX+orbitRadius*Math.cos(theta);
  const my=orbitY-orbitRadius*Math.sin(theta);
  const dx=(orbitX-mx)/orbitRadius,dy=(orbitY-my)/orbitRadius;
  body.setAttribute('cx',mx.toFixed(2));body.setAttribute('cy',my.toFixed(2));
  near.setAttribute('cx',(mx+dx*13).toFixed(2));near.setAttribute('cy',(my+dy*13).toFixed(2));
  label.textContent=title;
  illumination.textContent=one.format(percentage)+'%';
  elapsed.textContent=two.format(monthDays*fraction)+' dnia';
  if(disk)disk.setAttribute('aria-label',title+': '+one.format(percentage)+' procent widocznej tarczy oświetlone. Schematyczny widok z półkuli północnej.');
  if(orbit)orbit.setAttribute('aria-label','Położenie Księżyca: '+one.format(fraction*360)+' stopni względem Słońca; znacznik na tarczy jest skierowany do Ziemi.');
  for(const button of buttons)button.setAttribute('aria-pressed',String(Number(button.dataset.phase)===progress));
 }
 slider.addEventListener('input',update,{passive:true});
 for(const button of buttons)button.addEventListener('click',()=>{slider.value=button.dataset.phase;update()});
 update();
})();
