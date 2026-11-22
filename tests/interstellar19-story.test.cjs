/* ATLAS SOLARIS XIX — constellation perspective and interstellar flight */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const ctx={window:{},document:{readyState:'loading',addEventListener(){}}};vm.runInNewContext(read('portal/interstellar19-story.js'),ctx);
const p=ctx.window.ATLAS_IS19_PHYSICS,close=(a,b,tol=1e-7)=>assert.ok(Math.abs(a-b)<tol,'Expected '+a+' ≈ '+b);
test('Sferyczny RA/Dec zmienia się w ortogonalne współrzędne kartezjańskie',()=>{
 const a=p.vector(0,0,10),b=p.vector(90,0,10),c=p.vector(0,90,10);
 close(a.x,10);close(a.y,0);close(a.z,0);
 close(b.x,0,1e-8);close(b.y,10);
 close(c.z,10);close(c.x,0,1e-8);
 assert.equal(p.vector(0,100,1),null);
});
test('Odległości siedmiu gwiazd wynikają z prawdziwej trójwymiarowej normy',()=>{
 assert.equal(p.STARS.length,7);assert.equal(p.WIRES.length,7);
 for(const star of p.STARS)close(p.distance(p.position(star),p.observer(0)),star.ly,1e-7);
 close(p.STARS.find(s=>s.key==='dubhe').ly,123);
 close(p.STARS.find(s=>s.key==='merak').ly,80);
});
test('Widok z Ziemi i przesunięty obserwator nie są tą samą projekcją',()=>{
 const m=p.STARS.find(s=>s.key==='mizar');
 const earth=p.project(m,0),far=p.project(m,40);
 assert.ok(earth&&far);
 assert.ok(Math.abs(earth.xDeg-far.xDeg)>2);
 assert.ok(p.constellationChangeDeg(40,'mizar')>5);
 assert.ok(p.distance(p.position(m),p.observer(40))<p.distance(p.position(m),p.observer(0)));
});
test('Z Ziemi Wielki Wóz mieści się w polu widzenia obu modeli',()=>{
 const visible=p.STARS.filter(s=>{const x=p.project(s,0);return x&&Math.abs(x.xDeg)<47&&Math.abs(x.yDeg)<40;});
 assert.equal(visible.length,7);
 for(const s of p.STARS)close(p.constellationChangeDeg(0,s.key),0,1e-6);
});
test('Kąt dwóch kierunków wynosi 0°, 90° lub 180° jak w geometrii',()=>{
 const a=p.vector(0,0,1),b=p.vector(90,0,1),c=p.vector(180,0,1);
 close(p.angularSeparationDeg(a,a),0,1e-6);
 close(p.angularSeparationDeg(a,b),90,1e-6);
 close(p.angularSeparationDeg(a,c),180,1e-6);
});
test('Paralaksa Proximy i zależność odwrotna od dystansu',()=>{
 close(p.parallaxArcsec(4.24),.76923674,1e-5);
 close(p.parallaxArcsec(10)/p.parallaxArcsec(20),2);
 assert.ok(Number.isNaN(p.parallaxArcsec(0)));
});
test('Czas lotu ciała i zegar pokładowy są zgodne ze STW',()=>{
 const a=p.travelTimes(4.24,.1),b=p.travelTimes(40,.5);
 close(a.sunYears,42.4);assert.ok(a.shipYears<a.sunYears);
 close(b.sunYears,80);close(b.shipYears,80*Math.sqrt(.75),1e-8);
 close(p.travelTimes(0,.2).sunYears,0);
 assert.equal(p.travelTimes(10,1),null);
 assert.equal(p.travelTimes(-1,.2),null);
});
test('Sześć poprawnie opisanych obrazów archiwów astronomicznych',()=>{
 const h=read('etapy/19/index.html'),css=read('portal/interstellar19-story.css');
 assert.equal((h.match(/<figure\b/g)||[]).length,6);
 assert.equal((h.match(/<figcaption>/g)||[]).length,6);
 for(const name of ['eso1908e.jpg','potw1635a.jpg','potw1343a.jpg','STScI-01EVT7ZJ6D77V1MAV8F65NSFE7.tif','eso1837d.jpg','davidedemartin_5.jpg'])
  assert.ok(h.includes(name),'Missing image '+name);
 assert.match(h,/nie pojedyncze zdjęcie|nie pojedynczym/i);
 assert.match(h,/trzy nałożone obserwacje/);
 assert.doesNotMatch(css,/background-image\s*:\s*url\s*\(/);
});
test('Pierwotna interaktywna podróż pozostaje dostępna bez autostartu',()=>{
 const h=read('etapy/19/index.html');
 for(const id of ['is19Canvas','is19Distance','is19Speed','is19TimeSun','is19TimeShip','is19Mizar','is19Visible','is19Play','is19Reset','stageStartLab','stageFrame','stageViewport','stageLoading','stageError','stageReload','stageAbout','stageInfo','stageInfoClose','stageRelated'])
  assert.ok(h.includes('id="'+id+'"'),'Missing '+id);
 assert.match(h,/data-src="\.\.\/\.\.\/atlas\.html\?portal=interstellar"/);
 assert.match(h,/data-manual="true"/);
 assert.match(h,/data-lazy="true"/);
 assert.doesNotMatch(h,/<a[^>]*href="\.\.\/\.\.\/atlas\.html/);
});
test('Wykres Canvas 2D jest lekki, mobilny i respektuje preferencje ruchu',()=>{
 const js=read('portal/interstellar19-story.js'),css=read('portal/interstellar19-story.css');
 assert.match(js,/getContext\('2d'\)/);
 assert.doesNotMatch(js,/THREE\.Scene|WebGLRenderingContext/);
 assert.match(js,/prefers-reduced-motion/);
 assert.match(css,/@media\(max-width:720px\)/);
 assert.match(css,/overflow-y:auto!important/);
});
test('Wyraźny podział między katalogiem tysięcy gwiazd a małym modelem',()=>{
 const h=read('etapy/19/index.html');
 assert.match(h,/ponad 7400 gwiazd/);
 assert.match(h,/siedmiu gwiazdach/);
 assert.match(h,/Pomijamy ruch własny/);
 assert.match(h,/nie projekt realnej misji/);
});
test('Katalog, polecane wyprawy i nawigacja są spójne',()=>{
 const b={window:{}};vm.runInNewContext(read('portal/data.js'),b);
 const d=b.window.ATLAS_PORTAL_DATA,json=JSON.parse(read('portal/catalog.json'));
 assert.equal(d.stages['19'].mode,'interstellar');
 assert.equal(d.stages['19'].category,'gwiazdy');
 assert.ok(d.categories.gwiazdy.highlights.includes(19));
 assert.equal(json.stages['19'].title,d.stages['19'].title);
 assert.ok(read('portal/site.js').includes("featureCard(19,'interstellar19')"));
});
