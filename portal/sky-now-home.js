/* ATLAS SOLARIS · landing navigation for observational map.
   Home-only, tiny progressive enhancement; existing 36 stage tiles untouched. */
(function(){
'use strict';
if(!document.body||document.body.dataset.view!=='home')return;
var portal=document.querySelector('.portal-app'),hero=portal&&portal.querySelector('.hero');
if(!hero||document.getElementById('skyHomePromo'))return;
var section=document.createElement('section');section.id='skyHomePromo';
section.setAttribute('aria-labelledby','skyPromoTitle');
section.innerHTML='<div class="sky-promo-inner"><div class="sky-promo-copy">'+
 '<span class="sky-promo-eyebrow"><i></i> NOWE W ATLAS SOLARIS / OBSERWATORIUM</span>'+
 '<h2 id="skyPromoTitle">Niebo <em>nad Tobą.</em></h2>'+
 '<p>Odkryj położenie Księżyca, planet i jasnych gwiazd z wybranego miejsca i o dowolnej godzinie. Interaktywna mapa horyzontu, przybliżone wschody, zachody i tryb obserwacji nocnej.</p>'+
 '<a href="niebo/" class="sky-promo-cta">OTWÓRZ MAPĘ SWOJEGO NIEBA <span aria-hidden="true">↗</span></a></div>'+
 '<div class="sky-promo-art" aria-hidden="true"><span class="sky-promo-ring a"></span><span class="sky-promo-ring b"></span><span class="sky-promo-ring c"></span><span class="sky-promo-n">N</span><span class="sky-promo-e">E</span><span class="sky-promo-s">S</span><span class="sky-promo-w">W</span><span class="sky-promo-pole">✦</span><span class="sky-promo-p1">●</span><span class="sky-promo-caption">AZYMUT · HORYZONT · CZAS</span></div></div>';
hero.parentNode.insertBefore(section,hero.nextSibling);
var navs=[portal.querySelector('.header-links'),document.getElementById('mobilePanel')];
navs.forEach(function(nav){
 if(!nav||nav.querySelector('a[href="niebo/"]'))return;
 var a=document.createElement('a');a.href='niebo/';a.textContent='Niebo nad Tobą';
 var first=nav.querySelector('a');
 if(first&&first.nextSibling)nav.insertBefore(a,first.nextSibling);else nav.appendChild(a);
});
var foot=portal.querySelectorAll('.footer-col'),last=foot[foot.length-1];
if(last&&!last.querySelector('a[href="niebo/"]')){
 var link=document.createElement('a');link.href='niebo/';link.textContent='Niebo nad Tobą';last.appendChild(link);
}
})();
