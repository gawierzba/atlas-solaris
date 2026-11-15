'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('etapy/07/index.html'),css=read('portal/method07-story.css'),art=read('portal/media/method07-cover.svg'),js=read('portal/method07-story.js'),stage=read('portal/stage.js'),engine=read('atlas.html'),core=read('js/app.js');
test('History, scientific limitations, JPL accuracy and a technical source dialog',()=>{
 const lower=html.toLocaleLowerCase('pl');
 for(const subject of ['Najpierw była liczba','Neptuna','Uran','1846','Le Verrier','Adams','Galle','d’Arrest','NASA/JPL','1800–2050','2024–2040','6 godzin','Keplera','geometryczne','światła','Aberrac','barycentrum','wizualizac','geometrii','świadomym','nie jest narzędzie','precyzyjną efemerydę'])assert.ok(lower.includes(subject.toLocaleLowerCase('pl')),'Missing editorial theme '+subject);
 for(const id of ['opowiesc','neptun','jak-powstaje-model','jpl','doswiadczenie-orbita','doswiadczenie-swiatlo','co-atlas-obiecuje','pewnosc','dokumentacja','zrodla'])assert.ok(html.includes('id="'+id+'"'),'Missing '+id);
 assert.ok(html.indexOf('id="opowiesc"')<html.indexOf('id="dokumentacja"'));
 assert.ok(html.indexOf('id="doswiadczenie-swiatlo"')<html.indexOf('id="dokumentacja"'));
 assert.ok(html.indexOf('id="dokumentacja"')<html.indexOf('id="zrodla"'));
 assert.match(html,/Jowisz<\/td><td>400″<\/td><td>600 tys\. km/);
 assert.match(html,/Saturn<\/td><td>600″<\/td><td>1 500 tys\. km/);
 assert.match(html,/Neptun<\/td><td>10″<\/td><td>200 tys\. km/);
 assert.match(html,/nie gwarancja|NIE GWARANCJA/);
 assert.match(html,/Część innych planet ma ilustracyjne tekstury proceduralne/);
 assert.match(engine,/ATLAS SOLARIS 7\.0 — metoda i ograniczenia/);
 assert.match(core,/https:\/\/ssd\.jpl\.nasa\.gov\/planets\/approx_pos\.html/);
 assert.match(core,/const elements =/);
 for(const link of ['ssd.jpl.nasa.gov/planets/approx_pos.html','ssd.jpl.nasa.gov/horizons/manual.html','ssd.jpl.nasa.gov/astro_par.html','naif.jpl.nasa.gov/pub/naif/toolkit_docs/C/req/abcorr.html','www.nasa.gov/history/175-years-ago-astronomers-discover-neptune-the-eighth-planet/','science.nasa.gov/photojournal/neptune-full-disk/'])assert.ok(html.includes(link),'Missing verified reference '+link);
});
test('Editorial is static, attributed and original technical dialog loads on demand',()=>{
 assert.match(art,/viewBox="0 0 1600 900"/);
 assert.ok(Buffer.byteLength(art,'utf8')<50000);
 assert.doesNotMatch(art,/<script|<animate|<foreignObject|filter=/i);
 assert.match(html,/portal\/media\/method07-cover\.svg/);
 assert.match(html,/PIA00046\.jpg\/jcr%3Acontent\/renditions\/cq5dam\.thumbnail\.319\.319\.png/);
 assert.match(html,/NASA\/JPL \/ VOYAGER 2/);
 assert.match(html,/data-lazy="true" data-manual="true"/);
 assert.match(html,/data-src="\.\.\/\.\.\/atlas\.html\?portal=method"/);
 for(const id of ['stageFrame','stageStartLab','stageViewport','stageAbout','stageLaunch','stageReload','stageLoading','stageInfo','stageRelated'])assert.ok(html.includes('id="'+id+'"'),'missing portal id '+id);
 assert.match(stage,/const manualLab=iframe\?\.dataset\.manual==='true'/);
 assert.match(engine,/id="methodDialog"/);
 assert.match(css,/overflow-y:auto/);
 assert.match(css,/@media\(max-width:650px\)/);
 assert.match(css,/@media\(max-width:360px\)/);
 assert.doesNotMatch(html,/<canvas|<script[^>]+three(?:\.min)?\.js/);
 assert.doesNotMatch(js.replace(/\/\*[\s\S]*?\*\//g,''),/requestAnimationFrame|setInterval|setTimeout|\.getContext\(|\.fetch\(/);
});
test('Orbit geometry matches JPL J2000 eccentricity examples and focus convention',()=>{
 assert.match(js,/const sunX=325,cy=220,a=162/);
 assert.match(js,/const cx=sunX\+a\*e,minor=a\*Math\.sqrt\(1-e\*e\)/);
 assert.match(js,/const p=sunX-a\*\(1-e\),q=sunX\+a\*\(1\+e\)/);
 for(const [e,peri,apo,ratio] of [[0,1,1,1],[.0167,.9833,1.0167,1.03398],[.2056,.7944,1.2056,1.5176],[.5,.5,1.5,3]]){
  assert.ok(Math.abs((1-e)-peri)<1e-10);
  assert.ok(Math.abs((1+e)-apo)<1e-10);
  assert.ok(Math.abs((1+e)/(1-e)-ratio)<.0001);
  const cx=325+162*e,r=162*Math.sqrt(1-e*e);
  assert.ok(Math.abs((cx-162)-(325-162*(1-e)))<1e-10);
  assert.ok(Math.abs((cx+162)-(325+162*(1+e)))<1e-10);
  assert.ok(r>0);
 }
});
test('Light time constants from JPL are exact and the examples are transparent',()=>{
 assert.match(js,/const AU_KM=149597870\.7/);
 assert.match(js,/const C_KM_S=299792\.458/);
 assert.match(js,/const minKm=384400/);
 assert.match(js,/const maxKm=35\*AU_KM/);
 assert.match(js,/const seconds=km\/C_KM_S/);
 const c=299792.458,au=149597870.7,moon=384400;
 assert.ok(Math.abs(au/c-499.004783836)<.000000001);
 assert.ok(Math.abs(moon/c-1.282220)<.00001);
 assert.ok(Math.abs(5*au/c-2495.023919)<.000001);
 assert.ok(Math.abs(30*au/c-14970.143515)<.000001);
 assert.match(html,/nie bieżącą odległość konkretnej planety/);
 assert.match(html,/Średnia odległość do Księżyca/);
});
