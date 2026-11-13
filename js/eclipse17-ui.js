/*
 * ATLAS SOLARIS 17 — live scientific readout for the existing
 * 3D shadow-cone and Earth-globe laboratories.
 * Uses v16's precision ephemeris through ATLAS_MAIN_API.positions(jd).
 */
(function(root){
'use strict';
const $=id=>document.getElementById(id);
const fmt=(v,n=2)=>Number.isFinite(v)?v.toLocaleString('pl-PL',{maximumFractionDigits:n,minimumFractionDigits:n}):'—';
const km=(v)=>Number.isFinite(v)?Math.round(v).toLocaleString('pl-PL')+' km':'—';
const TYPES={
 none:'BRAK ZAĆMIENIA',
 solar:'ZAĆMIENIE SŁOŃCA',
 lunar:'ZAĆMIENIE KSIĘŻYCA'
};
const SUB={
 none:'brak zjawiska',total:'całkowite',partial:'częściowe',
 annular:'obrączkowe',hybrid:'hybrydowe',penumbral:'półcieniowe'
};
const DAY=86400000,START=Date.parse('2024-01-01T00:00:00Z')/DAY+2440587.5,
 END=Date.parse('2041-01-01T00:00:00Z')/DAY+2440587.5;
function start(){
 const main=root.ATLAS_MAIN_API;
 const engineApi=root.AtlasSolarisEclipse;
 if(!main||!engineApi||!$('geometryDialog'))return;
 const engine=engineApi.createEngine({getPositions:main.positions});
 root.ATLAS_ECLIPSE17=engine;
 const dlg=$('geometryDialog');
 const open=()=>{
  const button=$('openGeometry');
  if(button)button.click();
  schedule(true);
 };
 for(const id of ['openEclipses17Side','openEclipses17Top']){
  const button=$(id);
  if(button)button.addEventListener('click',open);
 }
 let lastJD=NaN,lastPaint=0,dirty=true;
 const set=(id,value)=>{const node=$(id);if(node)node.textContent=value;};
 const show=(id,yes)=>{const node=$(id);if(node)node.classList.toggle('e17-lit',yes);};
 const exactTime=jd=>new Date((jd-2440587.5)*DAY).toISOString().replace('T',' ').slice(0,19)+' UTC';
 function update(){
  const jd=main.getJD();
  if(!Number.isFinite(jd))return;
  let r;
  try{r=engine.at(jd);}catch(err){
   set('e17Result','NIE MOŻNA OBLICZYĆ');set('e17Description',String(err.message||err));return;
  }
  const s=r.shadow[r.type==='lunar'?'lunar':'solar'],a=r.alignment;
  set('e17Result',TYPES[r.type]);
  set('e17Subtype',SUB[r.subtype]||r.subtype);
  set('e17Instant',exactTime(jd));
  set('e17Syzygy',(a.nearestSyzygy==='new'?'Nów':'Pełnia')+' · odchylenie '+fmt(a.syzygyOffsetDeg,3)+'°');
  set('e17Latitude',fmt(a.lunarEclipticLatitudeDeg,3)+'°');
  set('e17Node',a.nearestNode?
   (a.nearestNode.kind==='ascending'?'Wstępujący':'Zstępujący')+
   ' · '+(a.nearestNode.daysFromCrossing>=0?'+':'')+fmt(a.nearestNode.daysFromCrossing,2)+' dni od przejścia'
   :'Brak węzła w oknie ±8 dni');
  set('e17MoonKm',km(r.bodies.distancesKm.earthMoon));
  set('e17SolarKm',km(r.bodies.distancesKm.earthSun));
  const ps=r.shadow.solar,pl=r.shadow.lunar;
  set('e17Penumbra',ps.hitsPenumbra?'Ziemia w półcieniu':pl.hitsPenumbra?'Księżyc w półcieniu':'Nie przecina ciała docelowego');
  set('e17Umbra',ps.hitsUmbra?'Cień Księżyca na Ziemi':ps.hitsAntumbra?'Antumbra na Ziemi':pl.hitsUmbra?'Księżyc w cieniu Ziemi':'Brak przecięcia cienia głównego');
  set('e17Axis',km(s.axisDistanceKm));
  const precise=jd>=START&&jd<END;
  set('e17Precision',precise?'Efemerydy próbkowane 2024–2040 · geometria chwilowa':'Model pozycji zapasowych · wynik orientacyjny');
  show('e17Result',r.isEclipse);
  const text=r.type==='solar'?
    (r.subtype==='total'?'Stożek cienia głównego przecina Ziemię.':'Półcień lub antumbra Księżyca przecina Ziemię.'):
    r.type==='lunar'?
    (r.subtype==='penumbral'?'Księżyc znajduje się wyłącznie w półcieniu Ziemi.':'Tarcza Księżyca wchodzi w cień główny Ziemi.'):
    a.syzygyOffsetDeg<=3?'Następuje zbliżenie do syzygii, ale stożek nie trafia w tarczę celu.':'Brak przecięcia cienia: sama bliskość węzła nie wystarcza do zaćmienia.';
  set('e17Description',text);
  lastJD=jd;
 }
 function schedule(force=false){
  if(force){dirty=true;lastJD=NaN;}
  if(!dlg.open)return;
  const jd=main.getJD(),now=performance.now();
  if(dirty||(Math.abs(jd-lastJD)>1/864000&&now-lastPaint>150)){
   update();dirty=false;lastPaint=now;
  }
 }
 function tick(){
  if(dlg.open)schedule();
  requestAnimationFrame(tick);
 }
 dlg.addEventListener('toggle',()=>schedule(true));
 for(const id of ['geometryEvent','geometryProgress','geometrySpeed','geometryPlay','geometryStart']){
  $(id)?.addEventListener('change',()=>schedule(true));
  $(id)?.addEventListener('input',()=>schedule(true));
  $(id)?.addEventListener('click',()=>schedule(true));
 }
 requestAnimationFrame(tick);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);
else start();
})(window);
