/* ATLAS SOLARIS XV — photometric transit geometry and source-images audit */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const box={window:{},document:{readyState:'loading',addEventListener(){}}};vm.runInNewContext(read('portal/exoplanet15-story.js'),box);
const p=box.window.ATLAS_EX15_PHYSICS;const approx=(x,y,tol=1e-7)=>assert.ok(Math.abs(x-y)<tol,'Expected '+x+' ≈ '+y);
test('Kepler III: Ziemia ma 1 AU i okres roczny',()=>{
 approx(p.semimajorAu(365.25),1);
 approx(p.semimajorAu(365.25/Math.pow(2,1.5)),.5);
 assert.ok(Number.isNaN(p.semimajorAu(0)));
});
test('Ziemia zasłania około 84 ppm światła Słońca',()=>{
 approx(p.depthPpm(1,1),84.05075008,.01);
 approx(p.depthPpm(2,1)/p.depthPpm(1,1),4);
 approx(p.depthPpm(1,.5)/p.depthPpm(1,1),4);
 approx(p.transitFlux(0,1,1),1-p.depthPpm(1,1)/1e6);
});
test('Geometria tranzytu i brak tranzytu przy małym nachyleniu',()=>{
 approx(p.impactParameter(365.25,90,1),0,1e-9);
 assert.ok(p.impactParameter(365.25,89,1)>1+p.radiusRatio(1,1));
 approx(p.durationHours(365.25,90,1,1),13.0952403,.01);
 approx(p.durationHours(365.25,89,1,1),0);
 assert.ok(p.durationHours(5,89.5,1,.2)>0);
});
test('Przecięcie tarcz: zero, pełne zasłonięcie i brzeg',()=>{
 const k=.1;
 approx(p.overlapArea(0,k),Math.PI*k*k,1e-9);
 approx(p.overlapArea(1+k,k),0,1e-9);
 const half=p.overlapArea(1,k);
 assert.ok(half>0&&half<Math.PI*k*k);
 approx(p.overlapArea(0,2),Math.PI,1e-9);
 assert.ok(Number.isNaN(p.transitFlux(0,0,1)));
});
test('Sześć zdjęć NASA / ESA w artykule, z właściwą atrybucją',()=>{
 const html=read('etapy/15/index.html');
 assert.equal((html.match(/<figure\b/g)||[]).length,6);
 assert.equal((html.match(/<figcaption>/g)||[]).length,6);
 const anchors=['exoplanetstar1280.jpeg','ffi04132009hot300yellow_95-1494-full.jpeg','PIA17999.jpg','PIA21422.jpg','weic2213a.jpg','weic2213b.jpg'];
 for(const name of anchors)assert.ok(html.includes(name),'Missing image: '+name);
 assert.match(html,/Prawdziwe światło Keplera/i);
 assert.match(html,/dwutlenek węgla/i);
 assert.match(html,/Wizje artystyczne|wizja artystyczna|Wizja artystyczna/i);
 assert.doesNotMatch(read('portal/exoplanet15-story.css'),/background-image\s*:\s*url\s*\(/);
});
test('Dwa laboratoria i przycisk ręcznego uruchamiania oryginału',()=>{
 const html=read('etapy/15/index.html');
 const ids=['ex15Canvas','ex15Planet','ex15Star','ex15Period','ex15Inclination','ex15Noise','ex15Depth','ex15Orbit','ex15Geometry','ex15Duration','ex15Play','ex15Reset','stageStartLab','stageFrame','stageViewport','stageReload','stageInfo','stageAbout','stageInfoClose','stageRelated','stageLoading'];
 for(const id of ids)assert.ok(html.includes('id="'+id+'"'),'Missing id '+id);
 assert.match(html,/data-src="\.\.\/\.\.\/atlas\.html\?portal=exo"/);
 assert.match(html,/data-lazy="true"/);assert.match(html,/data-manual="true"/);
 assert.doesNotMatch(html,/<a[^>]*href="\.\.\/\.\.\/atlas\.html/);
});
test('Katalog zgadza się z wpisem etapu 15',()=>{
 const bx={window:{}};vm.runInNewContext(read('portal/data.js'),bx);
 const d=bx.window.ATLAS_PORTAL_DATA,json=JSON.parse(read('portal/catalog.json'));
 assert.equal(d.stages['15'].mode,'exo');assert.equal(d.stages['15'].category,'gwiazdy');
 assert.ok(d.categories.gwiazdy.highlights.includes(15));
 assert.equal(json.stages['15'].title,d.stages['15'].title);
 assert.ok(read('etapy/15/index.html').includes('id="ex15Title"'),"Artykuł etapu 15 musi być nadal dostępny");
});
test('Mobilny, bez WebGL, z dostępnością i opisem ograniczeń',()=>{
 const html=read('etapy/15/index.html');
 const css=read('portal/exoplanet15-story.css');
 const js=read('portal/exoplanet15-story.js');
 assert.match(css,/@media\(max-width:700px\)/);
 assert.match(css,/overflow-y:auto!important/);
 assert.match(js,/getContext\('2d'\)/);
 assert.match(js,/prefers-reduced-motion/);
 assert.doesNotMatch(js,/WebGLRenderingContext|THREE\.|createWebGL/);
 assert.match(html,/aria-live="polite"/);
 assert.match(html,/nie są prawdziwymi danymi astronomicznymi/);
});
