/* ATLAS SOLARIS — Odkrycia, wydanie 01/2026.
   Adds an editorial rail to home ONLY, without touching stage routing,
   heavy simulations, scroll handlers, search or category pages. */
(function(){
'use strict';
var doc=document,body=doc.body;
if(!body||body.getAttribute('data-view')!=='home')return;
var portal=doc.querySelector('.portal-app'),hero=portal&&portal.querySelector('.hero');
if(!portal||!hero||doc.getElementById('odkrycia'))return;
var content=[
'<section id="odkrycia" aria-labelledby="asjTitle"><div class="asj-wrap">',
'<div class="asj-heading"><div><p class="asj-overline">NOWOŚĆ W ATLAS SOLARIS / MAGAZYN ASTRONOMICZNY</p><h2 id="asjTitle">Od<em><i>krycia.</i></em></h2></div><div><p>Nie tylko symulacje. Prawdziwe historie z obserwatoriów, wyjątkowe fotografie NASA, ESA i ESO oraz nauka opowiedziana tak, żeby chciało się odkrywać więcej.</p><p class="asj-edition">PIERWSZY NUMER · 22 LISTOPADA 2026</p></div></div>',
'<a class="asj-lead" href="odkrycia/n159/" aria-label="Otwórz reportaż o gwiezdnej kolebce N159"><div class="asj-lead-image"><img src="https://cdn.esawebb.org/archives/images/screen/potm2610a.jpg" srcset="https://cdn.esawebb.org/archives/images/screen/potm2610a.jpg 1000w, https://cdn.esawebb.org/archives/images/publicationjpg/potm2610a.jpg 2300w" sizes="(max-width:700px) 96vw, 55vw" width="1200" height="800" loading="lazy" decoding="async" alt="Obserwacyjny obraz Webba: błękitne i miedziane obłoki formowania gwiazd N159 w Wielkim Obłoku Magellana."></div><div class="asj-lead-copy"><span>HISTORIA Z OKŁADKI / ESA–WEBB</span><div><h3>Tam, gdzie <em>rodzą się słońca.</em></h3><p>Obłok o szerokości około 230 lat świetlnych, tysiące młodych gwiazd i najnowszy obraz Webba. Zobacz z bliska jedno z miejsc narodzin światła.</p></div><b><span>PRZECZYTAJ WIELKĄ OPOWIEŚĆ</span><span>↗</span></b></div></a>',
'<div class="asj-stories"><div class="asj-stories-head"><h3>Historie pierwszego numeru.</h3><a href="odkrycia/">CAŁY MAGAZYN ↗</a></div><div class="asj-stories-list">',
'<a class="asj-story" href="odkrycia/bao/"><figure><img src="https://cdn.esawebb.org/archives/images/screen/AT2025abao.jpg" width="900" height="620" loading="lazy" decoding="async" alt="Galaktyka Andromedy i cztery obserwacje połączenia gwiazd Bao."></figure><small>18.11.2026 / NASA–ESA</small><h4>Gdy wielka gwiazda pochłania mniejszą.</h4><span>CZYTAJ ↗</span></a>',
'<a class="asj-story" href="odkrycia/kocia-glowa/"><figure><img src="https://cdn.esawebb.org/archives/images/screen/weic2622c.jpg" width="730" height="1000" loading="lazy" decoding="async" alt="Mgławica Kociej Głowy na rzeczywistym obrazie podczerwieni NIRCam."></figure><small>29.10.2026 / ESA–WEBB</small><h4>Kocia Głowa w dwóch rodzajach podczerwieni.</h4><span>PORÓWNAJ ↗</span></a>',
'<a class="asj-story" href="odkrycia/beta-pictoris/"><figure><img src="https://cdn.eso.org/images/screen/eso2609a.jpg" width="900" height="600" loading="lazy" decoding="async" alt="Dwie planety Beta Pictoris b i d zarejestrowane w podczerwieni na obrazie ESO."></figure><small>15.07.2026 / ESO</small><h4>Planeta ukryta w archiwalnych fotografiach.</h4><span>ODKRYJ ↗</span></a>',
'</div></div><div class="asj-outro"><p>Wszystkie teksty opracowujemy na podstawie materiałów NASA, ESA i ESO. To redagowany magazyn, nie automatyczny kanał wiadomości. Nasze 36 etapów pozostaje bez zmian.</p><a href="odkrycia/">OTWÓRZ ODKRYCIA ↗</a></div>',
'</div></section>'
].join('');
var holder=doc.createElement('div');holder.innerHTML=content;
var section=holder.firstChild;
hero.parentNode.insertBefore(section,hero.nextSibling);
function navLink(nav,ref){
 if(!nav||nav.querySelector('a[href$="odkrycia/"]'))return;
 var a=doc.createElement('a');a.href='odkrycia/';a.textContent='Odkrycia';
 if(ref&&ref.parentNode===nav)nav.insertBefore(a,ref.nextSibling);else nav.appendChild(a);
}
var desktop=portal.querySelector('.header-links'),mobile=doc.getElementById('mobilePanel');
navLink(desktop,desktop&&desktop.querySelector('a'));
navLink(mobile,mobile&&mobile.querySelector('a'));
var cols=portal.querySelectorAll('.footer-col');
if(cols.length){
 var project=cols[cols.length-1],a=doc.createElement('a');a.href='odkrycia/';a.textContent='Magazyn Odkrycia';
 project.appendChild(a);
}
})();