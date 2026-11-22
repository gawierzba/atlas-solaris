/* ATLAS SOLARIS XXI — Kerr spacetime, ergosphere, angular momentum and source audit */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const b={window:{},document:{readyState:'loading',addEventListener(){}}};
vm.runInNewContext(read('portal/kerr21-story.js'),b);
const p=b.window.ATLAS_KE21_PHYSICS;
const near=(a,x,tol=1e-8)=>assert.ok(Math.abs(a-x)<=tol,'Expected '+a+' ≈ '+x);
test('Promień grawitacyjny = GM/c²; dla M☉ połowa promienia Schwarzschilda',()=>{
 near(p.gravitationalRadiusKm(1),1.476669691,1e-6);
 near(p.gravitationalRadiusKm(10)/p.gravitationalRadiusKm(1),10,1e-9);
 assert.ok(Number.isNaN(p.gravitationalRadiusKm(0)));
});
test('Dla zerowego spinu horyzont pokrywa się z granicą statyczności',()=>{
 near(p.horizonRg(0),2);
 for(const th of [0,30,60,90,180])near(p.staticLimitRg(0,th),2);
 near(p.ergosphereWidthRg(0,90),0);
 near(p.extractableFraction(0),0);
 near(p.horizonOmega(0),0);
});
test('Horyzont Kerra maleje, a ergosfera zwęża się do bieguna',()=>{
 for(const a of [.2,.5,.9,.998]){
  const r=p.horizonRg(a);
  assert.ok(r>1&&r<2);
  near(p.staticLimitRg(a,0),r);
  near(p.staticLimitRg(a,90),2,1e-12);
  near(p.staticLimitRg(a,180),r);
  assert.ok(p.ergosphereWidthRg(a,90)>0);
  near(p.ergosphereWidthRg(a,90),2-r);
 }
 assert.ok(p.horizonRg(.9)<p.horizonRg(.5));
});
test('Horyzont i ergosfera zachowują znane wartości a* = 0,9',()=>{
 near(p.horizonRg(.9),1.4358898943540672,1e-12);
 near(p.staticLimitRg(.9,90),2,1e-12);
 assert.equal(p.pointStatus(.9,1.8,90),'ergosphere');
 assert.equal(p.pointStatus(.9,2.2,90),'outside');
 assert.equal(p.pointStatus(.9,1.2,90),'behind-horizon');
 assert.equal(p.pointStatus(.9,1.8,0),'outside');
});
test('Ruch ZAMO: omega horyzontu i granica dla zbliżenia do horyzontu',()=>{
 const a=.9,h=p.horizonRg(a);
 near(p.horizonOmega(a),a/(2*h),1e-12);
 near(p.zamoOmega(a,h,90),p.horizonOmega(a),1e-10);
 near(p.draggingRatio(a,h,90),1,1e-10);
 assert.ok(p.draggingRatio(a,1.8,90)>0&&p.draggingRatio(a,1.8,90)<1);
 assert.ok(p.draggingRatio(a,6,90)<p.draggingRatio(a,2,90));
 near(p.draggingRatio(0,4,90),0);
 assert.ok(Number.isNaN(p.zamoOmega(a,1,90)));
});
test('Orbitowanie prograde / retrograde zależy od spinu (ISCO BPT)',()=>{
 near(p.iscoRg(0,true),6,1e-12);
 near(p.iscoRg(0,false),6,1e-12);
 near(p.iscoRg(1,true),1,1e-10);
 near(p.iscoRg(1,false),9,1e-10);
 near(p.iscoRg(.9,true),2.32088304176,1e-6);
 near(p.iscoRg(.9,false),8.71735227961,1e-6);
 assert.ok(p.iscoRg(.998,true)<p.iscoRg(.5,true));
});
test('Energia rotacyjna: idealny limit Penrose’a < 29,3%',()=>{
 near(p.extractableFraction(1),1-1/Math.sqrt(2),1e-12);
 near(p.extractableFraction(.9),.152683679387,1e-9);
 assert.ok(p.extractableFraction(.998)<.293);
 assert.ok(p.extractableFraction(.998)>p.extractableFraction(.9));
 assert.ok(Number.isNaN(p.extractableFraction(1.1)));
});
test('Liczby misji zachowują jednostki, klasyfikacje i brak wyniku pod horyzontem',()=>{
 const x=p.mission(4300000,.9,1.8,90);
 assert.equal(x.state,'ergosphere');assert.ok(x.horizonKm>9000000);
 near(x.horizonKm,p.gravitationalRadiusKm(4300000)*p.horizonRg(.9),.01);
 near(x.draggingRatio,.6446194811915,1e-7);
 assert.equal(p.mission(4300000,0,2.7,90).state,'outside');
 const hidden=p.mission(10,.5,1.5,90);
 assert.equal(hidden.state,'behind-horizon');
 assert.ok(Number.isNaN(hidden.draggingRatio));
 assert.equal(p.mission(0,.9,2.3,90),null);
});
test('Parametry niefizyczne są odrzucane',()=>{
 assert.ok(Number.isNaN(p.horizonRg(-.1)));
 assert.ok(Number.isNaN(p.horizonRg(1.01)));
 assert.ok(Number.isNaN(p.staticLimitRg(.9,-10)));
 assert.ok(Number.isNaN(p.zamoOmega(.5,2,200)));
 assert.equal(p.pointStatus(.8,-1,90),'invalid');
});
test('Sześć zweryfikowanych ilustracji i obserwacji ma opis metody',()=>{
 const html=read('etapy/21/index.html'),css=read('portal/kerr21-story.css');
 assert.equal((html.match(/<figure\b/g)||[]).length,6);
 assert.equal((html.match(/<figcaption>/g)||[]).length,6);
 for(const name of ['eso2305b.jpg','eso2612a.jpg','DMBH_layered.jpg','eso2612d.jpg','eso2305a.jpg','late_stage_bigscreen.png'])
  assert.ok(html.includes(name),'Brak obrazu '+name);
 assert.match(html,/PRAWDZIWE DANE OBSERWACYJNE/);
 assert.match(html,/SYMULACJA KOMPUTEROWA/);
 assert.match(html,/19 sierpnia 2026/);
 assert.doesNotMatch(css,/background-image\s*:\s*url\s*\(/);
});
test('Zachowany silnik etapu 21 i bezpieczne uruchomienie na żądanie',()=>{
 const h=read('etapy/21/index.html'),js=read('portal/kerr21-story.js');
 for(const id of ['ke21Canvas','ke21Mass','ke21Spin','ke21Radius','ke21Theta','ke21Horizon','ke21Ergosphere','ke21Dragging','ke21Extract','ke21Status','ke21Reset','ke21Play','stageStartLab','stageFrame','stageViewport','stageLoading','stageError','stageReload','stageAbout','stageInfo','stageInfoClose','stageRelated'])
  assert.ok(h.includes('id="'+id+'"'),'Brak id '+id);
 assert.match(h,/data-src="\.\.\/\.\.\/atlas\.html\?portal=probe"/);
 assert.match(h,/data-lazy="true"/);
 assert.match(h,/data-manual="true"/);
 assert.doesNotMatch(h,/<a[^>]*href="\.\.\/\.\.\/atlas\.html/);
 assert.match(js,/getContext\('2d'\)/);
 assert.match(js,/prefers-reduced-motion/);
 assert.doesNotMatch(js,/THREE\.Scene|WebGLRenderingContext/);
});
test('Naukowe zastrzeżenia, mobilność i architektura serwisu',()=>{
 const h=read('etapy/21/index.html'),css=read('portal/kerr21-story.css');
 assert.match(h,/nie obliczamy trajektorii sondy/i);
 assert.match(h,/nie ogłosił w sierpniu 2026 roku bezpośredniego wyznaczenia spinu/);
 assert.match(h,/29,3%/);
 assert.match(css,/@media\(max-width:720px\)/);
 assert.match(css,/overflow-y:auto!important/);
 const e={window:{}};vm.runInNewContext(read('portal/data.js'),e);
 const d=e.window.ATLAS_PORTAL_DATA,cat=JSON.parse(read('portal/catalog.json'));
 assert.equal(d.stages['21'].mode,'probe');
 assert.equal(d.stages['21'].category,'relatywistyka');
 assert.ok(d.categories.relatywistyka.highlights.includes(21));
 assert.equal(cat.stages['21'].title,d.stages['21'].title);
 assert.ok(read('portal/site.js').includes("featureCard(21,'kerr21')"));
});
