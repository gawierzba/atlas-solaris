/* ATLAS SOLARIS · ETAP 09 — geometra cienia (ilustracyjny model 2D) */
(()=>{'use strict';
const q=id=>document.getElementById(id);
const B={solar:q('e9SolarBtn'),lunar:q('e9LunarBtn'),size:q('e9Size'),sizeWrap:q('e9SizeWrap'),offset:q('e9Offset'),angle:q('e9OffsetValue'),solarArt:q('e9SolarArt'),lunarArt:q('e9LunarArt'),solarMoon:q('e9SolarMoon'),lunarMoon:q('e9LunarMoon'),lunarMoonFill:q('e9LunarMoonFill'),solarGeo:q('e9GeoSolar'),lunarGeo:q('e9GeoLunar'),geoSolarMoon:q('e9GeoSolarMoon'),geoSolarUmbra:q('e9GeoSolarUmbra'),geoSolarPenumbra:q('e9GeoSolarPenumbra'),geoLunarMoon:q('e9GeoLunarMoon'),verdict:q('e9Verdict'),explain:q('e9Explain'),reset:q('e9Reset'),presets:Array.from(document.querySelectorAll('[data-e9-preset]'))};
if(Object.values(B).some(x=>x==null))return;
let mode='solar';
const SR=121,LR=68,UR=165,PR=225;
const desc={
 totalSolar:'Księżyc pozornie zakrywa całą jasną tarczę Słońca. Wąska strefa cienia całkowitego może dotrzeć do powierzchni Ziemi.',
 annular:'Księżyc widziany z Ziemi jest nieco mniejszy od tarczy Słońca. Pozostaje jasny pierścień; nie występuje bezpieczna do patrzenia gołym okiem faza całkowita.',
 partialSolar:'Tarcze zachodzą na siebie tylko częściowo. Z tego miejsca obserwator widziałby częściowe przesłonięcie Słońca.',
 noneSolar:'Tarcze się nie nakładają. W tej schematycznej konfiguracji nie następuje zaćmienie dla obserwatora.',
 totalLunar:'Cały Księżyc znajduje się w uproszczonym przekroju cienia całkowitego Ziemi. Jego czerwony kolor symbolizuje światło przefiltrowane przez atmosferę.',
 partialLunar:'Część tarczy Księżyca znajduje się w cieniu całkowitym Ziemi, a część poza nim.',
 penumbral:'Księżyc przechodzi tylko przez półcień Ziemi. Spadek jasności może być bardzo subtelny.',
 noneLunar:'Księżyc mija cień oraz półcień w przedstawionym przekroju — zaćmienie nie występuje.'
};
function setBtn(el,isOn){el.setAttribute('aria-pressed',String(isOn));}
function render(){
 const amount=Number(B.offset.value)||0;
 B.angle.textContent=String(amount)+' / 100';
 const solar=mode==='solar';
 B.solarArt.style.display=solar?'':'none';
 B.lunarArt.style.display=solar?'none':'';
 B.solarGeo.style.display=solar?'':'none';
 B.lunarGeo.style.display=solar?'none':'';
 B.sizeWrap.hidden=!solar;
 setBtn(B.solar,solar);setBtn(B.lunar,!solar);
 if(solar){
  const moonRadius=B.size.value==='far'?108:132;
  const d=3.48*amount;
  B.solarMoon.setAttribute('r',String(moonRadius));
  B.solarMoon.setAttribute('cx',String(450+d));
  const solarY=160+1.47*amount;
  B.geoSolarMoon.setAttribute('cy',String(solarY));
  B.geoSolarUmbra.setAttribute('points',`400,${solarY-12} 400,${solarY+12} 742,${solarY+7} 742,${solarY-7}`);
  B.geoSolarPenumbra.setAttribute('points',`400,${solarY-12} 400,${solarY+12} 742,${solarY+112} 742,${solarY-112}`);
  let key,title;
  if(d>=SR+moonRadius){key='noneSolar';title='Brak zaćmienia';}
  else if(d<=Math.abs(SR-moonRadius)){key=moonRadius>=SR?'totalSolar':'annular';title=moonRadius>=SR?'Zaćmienie całkowite':'Zaćmienie obrączkowe';}
  else{key='partialSolar';title='Zaćmienie częściowe';}
  B.verdict.textContent=title;B.explain.textContent=desc[key];
 }else{
  const d=4.2*amount;
  B.lunarMoon.setAttribute('transform',`translate(${d},0)`);
  B.geoLunarMoon.setAttribute('cy',String(160+1.47*amount));
  let key,title;
  if(d+LR<=UR){key='totalLunar';title='Zaćmienie Księżyca — całkowite';}
  else if(d<UR+LR){key='partialLunar';title='Zaćmienie Księżyca — częściowe';}
  else if(d<PR+LR){key='penumbral';title='Zaćmienie półcieniowe';}
  else{key='noneLunar';title='Brak zaćmienia';}
  B.lunarMoonFill.setAttribute('fill',key==='totalLunar'||key==='partialLunar'?'url(#e9RedMoon)':'url(#e9PaleMoon)');
  B.verdict.textContent=title;B.explain.textContent=desc[key];
 }
}
B.solar.addEventListener('click',()=>{mode='solar';B.offset.value='0';render()});
B.lunar.addEventListener('click',()=>{mode='lunar';B.offset.value='0';render()});
B.size.addEventListener('change',render);
B.offset.addEventListener('input',render);
B.reset.addEventListener('click',()=>{mode='solar';B.size.value='near';B.offset.value='0';render()});
for(const b of B.presets)b.addEventListener('click',()=>{B.offset.value=b.dataset.e9Preset;render()});
render();
})();