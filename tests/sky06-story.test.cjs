'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('etapy/06/index.html'),css=read('portal/sky06-story.css'),cover=read('portal/media/sky06-cover.svg');
const sky=read('portal/sky06-story.js'),shell=read('portal/stage.js'),engine=read('atlas.html'),data=read('portal/data.js');
test('Stage 06 tells a complete, properly sourced astronomy story',()=>{
 for(const subject of ['Niebo nie krąży','horyzont','sfery niebieskiej','Polaris','Wega','Syriusz','Kanopus','23 ','56 ','4 ','ALMA','Tafreshi','doba gwiazdowa','Gdańsk','zenit','azymut','refra','precesj','kąt godzinny']){
  assert.ok(html.toLocaleLowerCase('pl').includes(subject.toLocaleLowerCase('pl')),'Missing '+subject);
 }
 for(const id of ['poczatek','horyzont','slady-gwiazd','polarna','kompas-nieba','niebo-w-roku','zadania','laboratorium','zrodla'])assert.ok(html.includes('id="'+id+'"'),'Missing section '+id);
 assert.ok(html.indexOf('id="poczatek"')<html.indexOf('id="kompas-nieba"'));
 assert.ok(html.indexOf('id="kompas-nieba"')<html.indexOf('id="laboratorium"'));
 assert.ok(html.indexOf('id="laboratorium"')<html.indexOf('id="zrodla"'));
 for(const u of ['spaceplace.nasa.gov/constellations/sp/','science.nasa.gov/learn/basics-of-space-flight/chapter2-1/','aa.usno.navy.mil/data/topocentric','www.eso.org/public/images/potw1253a/','science.nasa.gov/image-article/apod-2025-september-13-star-trails-over-one-mile-radio-telescope/','www.rmg.co.uk/stories/space-astronomy/how-long-day-on-mars','simbad.harvard.edu/simbad/sim-id?Ident=Polaris','www.aa.quae.nl/en/reken/hemelpositie.html'])assert.ok(html.includes(u),'Missing trusted source '+u);
 assert.match(html,/zdjęcie i oryginalny opis ESO/i);
 assert.match(html,/© ESO\/B\. Tafreshi/);
 assert.match(html,/kąt godzinny gwiazdy, a nie czasem cywilnym/);
 assert.match(html,/nie lokalny zegar ani prognoza widoczności na dzisiejszą noc/);
});
test('Visuals are light, credited, with a separate manual laboratory',()=>{
 assert.match(cover,/<svg/);
 assert.match(cover,/viewBox="0 0 1600 900"/);
 assert.ok(Buffer.byteLength(cover,'utf8')<45000);
 assert.doesNotMatch(cover,/<script|<animate|<foreignObject|filter=/i);
 assert.match(html,/portal\/media\/sky06-cover\.svg/);
 assert.match(html,/https:\/\/cdn\.eso\.org\/images\/screen\/potw1253a\.jpg/);
 assert.match(html,/loading="lazy"/);
 assert.match(html,/data-lazy="true" data-manual="true"/);
 assert.match(html,/data-src="\.\.\/\.\.\/atlas\.html\?portal=earthsky"/);
 for(const id of ['stageFrame','stageViewport','stageStartLab','stageLaunch','stageReload','stageLoading','stageInfo','stageRelated'])assert.ok(html.includes('id="'+id+'"'),'Missing portal '+id);
 assert.match(css,/overflow-y:auto/);
 assert.match(css,/@media\(max-width:650px\)/);
 assert.match(css,/@media\(max-width:350px\)/);
 assert.match(shell,/const manualLab=iframe\?\.dataset\.manual==='true'/);
 assert.match(engine,/id="surfaceMode"/);
 assert.match(engine,/id="latitude"/);
 assert.match(engine,/id="sunAlt"/);
 assert.match(data,/"06":\{"number":6/);
 assert.doesNotMatch(html,/<canvas|<script[^>]+three(?:\.min)?\.js/);
 assert.doesNotMatch(sky.replace(/\/\*[\s\S]*?\*\//g,''),/requestAnimationFrame|setInterval|setTimeout|\.getContext\(|\.fetch\(/);
});
test('Local horizontal coordinate formula and signs match reliable astronomical conventions',()=>{
 assert.match(sky,/const east=-Math\.cos\(delta\)\*Math\.sin\(H\)/);
 assert.match(sky,/const north=Math\.sin\(delta\)\*Math\.cos\(phi\)-Math\.cos\(delta\)\*Math\.cos\(H\)\*Math\.sin\(phi\)/);
 assert.match(sky,/Math\.atan2\(east,north\)/);
 assert.match(sky,/Math\.cos\(delta\)\*Math\.cos\(phi\)\*Math\.cos\(H\)/);
 assert.match(sky,/polaris:\{name:'Polarna',dec:89\.2641\}/);
 assert.match(sky,/vega:\{name:'Wega',dec:38\.7837\}/);
 assert.match(sky,/sirius:\{name:'Syriusz',dec:-16\.7161\}/);
 assert.match(sky,/canopus:\{name:'Kanopus',dec:-52\.6957\}/);
 const alt=(phi,delta,H=0)=>{
  const r=Math.PI/180;return Math.asin(Math.sin(phi*r)*Math.sin(delta*r)+Math.cos(phi*r)*Math.cos(delta*r)*Math.cos(H*r))*180/Math.PI;
 };
 assert.ok(Math.abs(alt(54.35,38.7837)-74.4337)<1e-4,'Vega culmination Gdansk');
 assert.ok(Math.abs(alt(54.35,38.7837,180)-3.1337)<1e-4,'Vega never sets Gdansk');
 assert.ok(Math.abs(alt(54.35,-16.7161)-18.9339)<1e-4,'Sirius culmination Gdansk');
 assert.ok(alt(54.35,-52.6957)<-17,'Canopus never rises in Gdansk');
 assert.ok(alt(-33.87,89.2641)<0,'Polaris always below Sydney');
 assert.ok(Math.abs(alt(-33.87,-52.6957)-71.1743)<1e-4,'Canopus high in Sydney');
 assert.ok(Math.abs(alt(0,-16.7161,-90))<1e-10,'Sirius on equatorial east horizon H=-6');
});
