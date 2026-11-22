/* ATLAS SOLARIS XX — event horizon, static clocks and scientific-images audit */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const env={window:{},document:{readyState:'loading',addEventListener(){}}};
vm.runInNewContext(read('portal/blackhole20-story.js'),env);
const m=env.window.ATLAS_BH20_PHYSICS;
const close=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<tol,'Expected '+a+' ≈ '+b);
test('Schwarzschild: Słońce ma rₛ około 2,953 km',()=>{
 close(m.schwarzschildKm(1),2.953339382,1e-6);
 close(m.schwarzschildKm(10)/m.schwarzschildKm(1),10);
 close(m.schwarzschildKm(6500000000)/m.schwarzschildKm(4300000),6500000000/4300000,1e-8);
 assert.ok(Number.isNaN(m.schwarzschildKm(0)));
});
test('Sfera fotonowa, ISCO i promień cienia mają trzy różne wartości',()=>{
 const r=m.schwarzschildKm(10);
 close(m.photonSphereKm(10)/r,1.5);
 close(m.iscoKm(10)/r,3);
 close(m.shadowRadiusKm(10)/r,1.5*Math.sqrt(3));
 assert.ok(m.shadowRadiusKm(10)>m.photonSphereKm(10));
});
test('Tempo statycznego zegara poza horyzontem',()=>{
 close(m.staticClockRate(2),Math.sqrt(.5));
 close(m.staticClockRate(3),Math.sqrt(2/3));
 close(m.staticClockRate(12),Math.sqrt(11/12));
 assert.ok(Number.isNaN(m.staticClockRate(1)));
 assert.ok(Number.isNaN(m.staticClockRate(.9)));
});
test('Przy 1,1 rₛ godzina daleko oznacza około 18,09 min dla statycznej sondy',()=>{
 close(m.farHourNearMinutes(1.1),18.09068067466,1e-5);
 close(m.farHourNearMinutes(2),42.42640687,1e-5);
 assert.ok(m.farHourNearMinutes(12)>m.farHourNearMinutes(2));
});
test('Grawitacyjny redshift i tempo zegara są wzajemnie zgodne',()=>{
 for(const r of [1.1,1.2,2,3,6,12]){
  const f=m.staticClockRate(r),z=m.gravitationalRedshift(r);
  close((1+z)*f,1,1e-10);
 }
 assert.ok(m.gravitationalRedshift(1.1)>m.gravitationalRedshift(12));
});
test('Słabe ugięcie: α = 2rₛ/b i tylko dla b ≥ 15 rₛ',()=>{
 close(m.weakDeflectionDegrees(30),2/30*180/Math.PI,1e-9);
 close(m.weakDeflectionDegrees(30)/m.weakDeflectionDegrees(60),2);
 assert.ok(Number.isNaN(m.weakDeflectionDegrees(10)));
});
test('Wszystkie trzy masy astrofizyczne i wariant gwiazdowy działają',()=>{
 for(const mass of [10,30,4300000,6500000000]){
  const s=m.observatory(mass,3,30);
  assert.ok(s);
  close(s.rsKm,m.schwarzschildKm(mass));
  close(s.photonKm/s.rsKm,1.5);
  close(s.iscoKm/s.rsKm,3);
  assert.equal(s.stableCircularOrbit,true);
  assert.ok(s.nearMinutes<60);
 }
 assert.equal(m.observatory(0,3,30),null);
 assert.equal(m.observatory(10,1,30),null);
});
test('Sześć źródeł fotograficznych i jedno wyraźnie nazwane symulacją',()=>{
 const h=read('etapy/20/index.html'),css=read('portal/blackhole20-story.css');
 assert.equal((h.match(/<figure\b/g)||[]).length,6);
 assert.equal((h.match(/<figcaption>/g)||[]).length,6);
 for(const name of ['eso2208-eht-mwh.jpg','eso1907a.jpg','eso2105a.jpg',
 'Black_Hole_Accretion_Disk_Sim_4k_ProRes.00386_print.jpg','m87jet-jpg.webp','m87_lg.jpg'])
  assert.ok(h.includes(name),'Brak źródła obrazu '+name);
 assert.match(h,/SYMULACJA NAUKOWA NASA \/ NIE FOTOGRAFIA/);
 assert.match(h,/kolory wizualizują natężenie|Kolory wizualizują natężenie/);
 assert.match(h,/15 czerwca 2026/);
 assert.doesNotMatch(css,/background-image\s*:\s*url\s*\(/);
});
test('Oryginalny symulator jest zachowany jako ręcznie uruchamiany',()=>{
 const h=read('etapy/20/index.html');
 for(const id of ['bh20Canvas','bh20Mass','bh20Radius','bh20Impact','bh20Clock','bh20Redshift',
 'bh20Horizon','bh20Deflection','bh20Reset','bh20Play','stageStartLab','stageFrame','stageViewport',
 'stageLoading','stageError','stageReload','stageAbout','stageInfo','stageInfoClose','stageRelated'])
  assert.ok(h.includes('id="'+id+'"'),'Brak '+id);
 assert.match(h,/data-src="\.\.\/\.\.\/atlas\.html\?portal=blackhole"/);
 assert.match(h,/data-lazy="true"/);
 assert.match(h,/data-manual="true"/);
 assert.doesNotMatch(h,/<a[^>]*href="\.\.\/\.\.\/atlas\.html/);
});
test('Odróżnienie dydaktycznego Schwarzschilda od prawdziwej rotacji',()=>{
 const h=read('etapy/20/index.html'),js=read('portal/blackhole20-story.js'),css=read('portal/blackhole20-story.css');
 assert.match(h,/nie są wynikiem śledzenia promieni światła/);
 assert.match(h,/utrzymywanie się w stałej odległości/);
 assert.match(h,/metryce Schwarzschilda|metryki Schwarzschilda/i);
 assert.match(js,/getContext\('2d'\)/);
 assert.match(js,/prefers-reduced-motion/);
 assert.doesNotMatch(js,/WebGLRenderingContext|THREE\.Scene/);
 assert.match(css,/@media\(max-width:720px\)/);
 assert.match(css,/overflow-y:auto!important/);
});
test('Katalog, dział Czasoprzestrzeń i polecany rozdział są spójne',()=>{
 const b={window:{}};vm.runInNewContext(read('portal/data.js'),b);
 const d=b.window.ATLAS_PORTAL_DATA,j=JSON.parse(read('portal/catalog.json'));
 assert.equal(d.stages['20'].mode,'blackhole');
 assert.equal(d.stages['20'].category,'relatywistyka');
 assert.ok(d.categories.relatywistyka.highlights.includes(20));
 assert.equal(j.stages['20'].title,d.stages['20'].title);
 assert.ok(read('portal/site.js').includes("featureCard(20,'blackhole20')"));
});
