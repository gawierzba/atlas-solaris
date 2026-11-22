/* ATLAS SOLARIS / ODKRYCIA — progressive enhancement, zero dependencies.
   Two separate Webb images. Toggle, not spatially aligned image blending. */
(function(){
'use strict';
var controls=document.querySelectorAll('[data-mag-spectrum]');
if(!controls.length)return;
controls.forEach(function(control){
 var buttons=control.querySelectorAll('[data-spectrum-channel]');
 var images=control.querySelectorAll('[data-spectrum-image]');
 var desc=control.querySelector('[data-spectrum-description]');
 function select(ch){
  buttons.forEach(function(b){b.setAttribute('aria-pressed',String(b.getAttribute('data-spectrum-channel')===ch));});
  images.forEach(function(img){img.hidden=img.getAttribute('data-spectrum-image')!==ch;});
  if(desc)desc.textContent=ch==='nircam'?'NIRCam · bliska podczerwień: bogate pole gwiazd i gęste, ciemne pasma pyłu.':
   'MIRI · średnia podczerwień: inny zestaw długości fal uwidacznia ciepły pył i złożone struktury. Zdjęcia mają różne kadry i orientacje.';
 }
 buttons.forEach(function(b){b.addEventListener('click',function(){select(b.getAttribute('data-spectrum-channel'));});});
 select('nircam');
});
})();