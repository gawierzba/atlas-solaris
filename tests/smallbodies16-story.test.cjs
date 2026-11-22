/* ATLAS SOLARIS XVI — fizyka hiperbolicznych przelotów i audyt zdjęć */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const environment={window:{},document:{readyState:'loading',addEventListener(){}}};
vm.runInNewContext(read('portal/smallbodies16-story.js'),environment);
const m=environment.window.ATLAS_SB16_PHYSICS,close=(a,b,tol=1e-7)=>assert.ok(Math.abs(a-b)<tol,'Expected '+a+' ≈ '+b);
test('Poprawna prędkość ucieczki i prędkość uderzenia przy Ziemi',()=>{
 close(m.escapeSpeedKmS(),11.18613569,1e-5);
 close(m.surfaceSpeedKmS(15)**2-15**2,2*m.EARTH_MU_KM3_S2/m.EARTH_R_KM,1e-8);
 assert.ok(Number.isNaN(m.surfaceSpeedKmS(0)));
});
test('Najbliższa odległość hiperbolicznego przelotu rośnie wraz z b',()=>{
 const a=m.perigeeKm(1,15),b=m.perigeeKm(3,15);
 assert.ok(a<m.EARTH_R_KM);
 assert.ok(b>m.EARTH_R_KM);
 assert.ok(b>a);
 assert.ok(Number.isNaN(m.perigeeKm(-1,10)));
 close(m.perigeeKm(0,15),0);
});
test('Ogniskowanie: dla mniejszej v∞ bliższe perycentrum przy tym samym b',()=>{
 const slow=m.perigeeKm(2.2,7);
 const fast=m.perigeeKm(2.2,30);
 assert.ok(slow<fast);
 assert.ok(m.collisionLimitBRe(7,150)>m.collisionLimitBRe(30,150));
});
test('Masa obiektu skalowana z sześcianem średnicy',()=>{
 const x=m.massKg(100,2000);
 close(m.massKg(200,2000)/x,8);
 close(m.massKg(100,4000)/x,2);
 close(m.impactEnergyMegatons(200,2000,15)/m.impactEnergyMegatons(100,2000,15),8);
});
test('Wynik wszystkich trzech przykładów jest zgodny z podpisem',()=>{
 const safe=m.encounter(3,15,150,2000);
 const near=m.encounter(2.2,7,120,1800);
 const hit=m.encounter(.6,15,220,2800);
 assert.equal(safe.collision,false);
 assert.equal(near.collision,false);
 assert.ok(near.altitudeKm>0&&near.altitudeKm<3000);
 assert.equal(hit.collision,true);
 assert.ok(hit.energyMt>0);
 assert.ok(m.encounter(-1,15,100,2000)===null);
});
test('Sześć autentycznych fotografii w artykule, każda z podpisem',()=>{
 const html=read('etapy/16/index.html');
 assert.equal((html.match(/<figure\b/g)||[]).length,6);
 assert.equal((html.match(/<figcaption>/g)||[]).length,6);
 for(const id of ['comet-67p.jpg','STScI-01EVST5JTG5EF5XY9DEHJMB453.tif','PIA14317.jpg','PIA18874.jpg','Bennu-at-300-px.png','STScI-01H5Q6WNZ8GPX2B6JMHX4G3RMT.tif']){
  assert.ok(html.includes(id),'Brak obrazu '+id);
 }
 for(const word of ['Rosetta','Philae','Bennu','DART','NEOWISE','Westa'])assert.ok(html.includes(word),'Brak sekcji '+word);
 assert.doesNotMatch(read('portal/smallbodies16-story.css'),/background-image\s*:\s*url\s*\(/);
});
test('Stary symulator został zachowany i nie startuje samoczynnie',()=>{
 const html=read('etapy/16/index.html');
 for(const id of ['stageStartLab','stageFrame','stageViewport','stageLoading','stageError','stageReload','stageAbout','stageInfo','stageRelated','stageInfoClose','sb16Canvas','sb16B','sb16Velocity','sb16Diameter','sb16Density']){
  assert.ok(html.includes('id="'+id+'"'),'Missing '+id);
 }
 assert.match(html,/data-src="\.\.\/\.\.\/atlas\.html\?portal=neo"/);
 assert.match(html,/data-manual="true"/);
 assert.match(html,/data-lazy="true"/);
 assert.doesNotMatch(html,/<a[^>]*href="\.\.\/\.\.\/atlas\.html/);
});
test('Katalog, polecane wyprawy i oddzielna podstrona są spójne',()=>{
 const b={window:{}};vm.runInNewContext(read('portal/data.js'),b);
 const d=b.window.ATLAS_PORTAL_DATA,c=JSON.parse(read('portal/catalog.json'));
 assert.equal(d.stages['16'].number,16);
 assert.equal(d.stages['16'].mode,'neo');
 assert.equal(d.stages['16'].category,'nauka');
 assert.ok(d.categories.nauka.highlights.includes(16));
 assert.equal(c.stages['16'].title,d.stages['16'].title);
 assert.ok(read('etapy/16/index.html').includes('id="sb16Title"'),"Etap 16 musi pozostać samodzielnie dostępny");
});
test('Brak WebGL, jest tryb mobilny i ostrzeżenia o ograniczeniach',()=>{
 const html=read('etapy/16/index.html'),css=read('portal/smallbodies16-story.css'),js=read('portal/smallbodies16-story.js');
 assert.match(css,/@media\(max-width:700px\)/);
 assert.match(js,/getContext\('2d'\)/);
 assert.doesNotMatch(js,/THREE\.Scene|WebGLRenderingContext/);
 assert.match(js,/prefers-reduced-motion/);
 assert.match(html,/nie obliczamy prawdopodobieństwa trafienia Ziemi/);
 assert.match(html,/aria-live="polite"/);
});
