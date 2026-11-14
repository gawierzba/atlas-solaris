/* ATLAS SOLARIS 27.0 · non-destructive bridge between stage pages and the
   original, shared laboratory engine. All dialogs render edge-to-edge. */
(() => {
'use strict';
const search=new URLSearchParams(location.search);
const mode=search.get('portal');
if(!mode)return;
const registry={
 solar:{},earth:{},moon:{},earthsky:{},moonsky:{},
 method:{dialog:'methodDialog',trigger:'openMethod'},
 jupiter:{dialog:'jupiterDialog',trigger:'openJupiter'},
 eclipse:{dialog:'eclipseDialog',trigger:'openEclipses'},
 geometry:{dialog:'geometryDialog',trigger:'openEclipses17Side'},
 globe:{dialog:'globeDialog',trigger:'openGlobe'},
 eclipsemap:{dialog:'globeDialog',trigger:'openEclipseMap17Side'},
 calendar:{dialog:'e17CalendarDialog',trigger:'openEclipses17CalendarSide'},
 missions:{dialog:'missionDialog',trigger:'openMissions'},
 porkchop:{dialog:'porkchopDialog',trigger:'openPorkchop'},
 gravity:{dialog:'gravityDialog',trigger:'openGravity'},
 assist:{dialog:'assistDialog',trigger:'openAssist'},
 archive:{dialog:'archiveDialog',trigger:'openArchive'},
 exo:{dialog:'exoDialog',trigger:'openExoplanets'},
 neo:{dialog:'neoDialog',trigger:'openNeo'},
 observatory:{dialog:'observatoryDialog',trigger:'openObservatory18Side'},
 interstellar:{dialog:'inter19Dialog',trigger:'openInterstellar19Side'},
 blackhole:{dialog:'bh20Dialog',trigger:'openBlackHole20Side'},
 probe:{dialog:'probe21Dialog',trigger:'openProbe21Side'},
 cockpit:{dialog:'cockpit22Dialog',trigger:'openCockpit22Side'},
 merger:{dialog:'merger23Dialog',trigger:'openMerger23Side'},
 ligo:{dialog:'ligo24Dialog',trigger:'openLigo24Side'},
 zodiac:{dialog:'zodiac25Dialog',trigger:'openZodiac25Side'},
 living:{dialog:'z251Dialog',trigger:'openZodiac251Side'},
 time:{dialog:'time26Dialog',trigger:'openTime26Side'}
};
const route=registry[mode];if(!route)return;
document.documentElement.classList.add('atlas-embed');
const isLab=!!route.dialog;
const transitions={
 z25ToLive:'laboratoria/zywe-konstelacje/',
 z25ToTime26:'etapy/26/',
 z251BackTo25:'etapy/25/',
 z251ToTime26:'etapy/26/',
 time26ToZodiac:'etapy/25/',
 time26ToLiving:'laboratoria/zywe-konstelacje/',
 merger23ToLigo24:'etapy/24/',
 probe21CockpitLaunch:'etapy/22/',
 e17CalendarFromGeometry:'laboratoria/kalendarz-zacmien/',
 e17CalendarFromEclipse:'laboratoria/kalendarz-zacmien/',
 eclipseGeometry:'etapy/17/',
 eclipseGlobe:'laboratoria/mapa-cienia/',
 eclipseVisit:'etapy/18/',
 jovToSolar:'etapy/01/',
 openTime26Side:'etapy/26/',openTime26Top:'etapy/26/',
 openZodiac25Side:'etapy/25/',openZodiac25Top:'etapy/25/',
 openZodiac251Side:'laboratoria/zywe-konstelacje/',openZodiac251Top:'laboratoria/zywe-konstelacje/',
 openLigo24Side:'etapy/24/',openLigo24Top:'etapy/24/',
 openMerger23Side:'etapy/23/',openMerger23Top:'etapy/23/',
 openCockpit22Side:'etapy/22/',openCockpit22Top:'etapy/22/',
 openProbe21Side:'etapy/21/',openProbe21Top:'etapy/21/'
};
const dialogRoutes={time26Dialog:'etapy/26/',z251Dialog:'laboratoria/zywe-konstelacje/',zodiac25Dialog:'etapy/25/',ligo24Dialog:'etapy/24/',merger23Dialog:'etapy/23/',cockpit22Dialog:'etapy/22/',probe21Dialog:'etapy/21/',bh20Dialog:'etapy/20/',inter19Dialog:'etapy/19/',observatoryDialog:'etapy/18/',geometryDialog:'etapy/17/',eclipseDialog:'etapy/09/',globeDialog:'laboratoria/mapa-cienia/',methodDialog:'etapy/07/',jupiterDialog:'etapy/08/',missionDialog:'etapy/10/',porkchopDialog:'etapy/11/',gravityDialog:'etapy/12/',assistDialog:'etapy/13/',archiveDialog:'etapy/14/',exoDialog:'etapy/15/',neoDialog:'etapy/16/',e17CalendarDialog:'laboratoria/kalendarz-zacmien/'};
const routeUrl=mode==='living'?'laboratoria/zywe-konstelacje/':mode==='calendar'?'laboratoria/kalendarz-zacmien/':mode==='eclipsemap'?'laboratoria/mapa-cienia/':null;
function post(type,payload={}){if(window.parent===window)return;try{window.parent.postMessage({type:'atlas:portal:'+type,...payload},location.origin)}catch(_){}}
window.addEventListener('message',event=>{if(event.origin===location.origin&&event.data?.type==='atlas:portal:ping'){if(!isLab||document.getElementById(route.dialog)?.open)post('ready')}});
function init(){
 document.body.classList.add(isLab?'atlas-embedded-lab':'atlas-embedded-solar');
 const dialog=isLab?document.getElementById(route.dialog):null;
 if(isLab&&!dialog){post('error',{message:'Nie znaleziono laboratorium: '+route.dialog});return}
 let forward=false;let opened=false;
 document.addEventListener('click',event=>{
  const btn=event.target.closest?.('button');const target=btn&&transitions[btn.id];
  if(!target || !isLab)return;
  if(target===(routeUrl||dialogRoutes[route.dialog]))return;
  event.preventDefault();event.stopImmediatePropagation();forward=true;post('navigate',{path:target});
 },true);
 if(dialog){
  dialog.addEventListener('close',()=>{if(!forward){setTimeout(()=>{if(!document.querySelector('dialog[open]'))post('closed')},160)}});
  const watcher=new MutationObserver(changes=>{
   if(forward)return;
   for(const c of changes){const el=c.target;if(c.attributeName==='open'&&el instanceof HTMLDialogElement&&el!==dialog&&el.open){const path=dialogRoutes[el.id];if(path){forward=true;post('navigate',{path});break}}}
  });
  for(const d of document.querySelectorAll('dialog'))watcher.observe(d,{attributes:true,attributeFilter:['open']});
 }
 let tries=0;
 function open(){
  tries++;
  if(isLab){
   if(dialog.open){opened=true;post('ready');return}
   document.getElementById(route.trigger)?.click();
   if(dialog.open){opened=true;post('ready');return}
  }else{
   if(mode==='earth'||mode==='moon'){
    const el=document.querySelector(`.nav-planet[data-target="${mode}"]`);el?.click();
   }else if(mode==='earthsky'||mode==='moonsky'){
    const btn=document.querySelector(`[data-mission="${mode}"]`);btn?.click();
   }
   if(window.ATLAS_MAIN_API || tries>20){post('ready');return}
  }
  if(tries<40)setTimeout(open,140);
  else post('error',{message:'Nie udało się otworzyć laboratorium '+mode});
 }
 setTimeout(open,50);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
