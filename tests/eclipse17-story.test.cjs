/* ATLAS SOLARIS XVII — eclipse shadow geometry / image and navigation audit */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const bx={window:{},document:{readyState:'loading',addEventListener(){}}};
vm.runInNewContext(read('portal/eclipse17-story.js'),bx);
const m=bx.window.ATLAS_EC17_PHYSICS,close=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<tol,'Expected '+a+' ≈ '+b);
test('Orbita Księżyca jest pochylona o 5,145 stopnia',()=>{
 close(m.moonLatitudeDeg(0),0);
 close(m.moonLatitudeDeg(90),m.TILT_DEG,1e-9);
 close(m.moonLatitudeDeg(-90),-m.TILT_DEG,1e-9);
 assert.ok(m.moonLatitudeDeg(10)<m.moonLatitudeDeg(20));
});
test('Długość i rozmiary stożka cienia pochodzą z geometrii',()=>{
 const s=m.solarEclipse(360000,0),far=m.solarEclipse(407000,0);
 assert.ok(s.umbraLengthKm>360000);
 assert.ok(s.coreKm>0);
 assert.ok(far.coreKm<0);
 assert.ok(s.penumbraKm>s.coreKm);
 const l=m.lunarEclipse(384000,0);
 assert.ok(l.penumbraKm>l.coreKm);
 assert.ok(l.coreKm>m.MOON_R);
});
test('Całkowite i obrączkowe zaćmienie Słońca',()=>{
 assert.equal(m.solarEclipse(360000,0).kind,'total');
 assert.equal(m.solarEclipse(407000,0).kind,'annular');
 assert.equal(m.solarEclipse(384000,14).kind,'partial');
 assert.equal(m.solarEclipse(384000,20).kind,'none');
});
test('Cztery wyniki przy zaćmieniu Księżyca',()=>{
 assert.equal(m.lunarEclipse(384000,0).kind,'total');
 assert.equal(m.lunarEclipse(384000,8.5).kind,'partial');
 assert.equal(m.lunarEclipse(384000,15.5).kind,'penumbral');
 assert.equal(m.lunarEclipse(384000,20).kind,'none');
});
test('Oś cienia oddala się od Ziemi ze wzrostem λ',()=>{
 const a=m.axisOffsetKm(384000,0),b=m.axisOffsetKm(384000,10),c=m.axisOffsetKm(384000,20);
 assert.equal(a,0);assert.ok(c>b&&b>a);
 assert.equal(m.calculate('unknown',384000,0),null);
 assert.equal(m.solarEclipse(0,0),null);
 assert.equal(m.lunarEclipse(-1,0),null);
});
test('Sześć obrazów NASA w treści, z podpisem i źródłem',()=>{
 const h=read('etapy/17/index.html'),css=read('portal/eclipse17-story.css');
 assert.equal((h.match(/<figure\b/g)||[]).length,6);
 assert.equal((h.match(/<figcaption>/g)||[]).length,6);
 for(const f of ['NHQ202404080101~large.jpg','53261650839-69540d1c1d-k.jpg','epic_1b_20170821174450.png','5663_Bailys_Beads-1.jpeg','afrc2018-0020-06_eclipse_composite_cropped-1.jpg','3dld.jpg'])
  assert.ok(h.includes(f),'Brak fotografii '+f);
 assert.match(h,/NASA\/Keegan Barber/);
 assert.match(h,/NASA\/Ken Ulbrich/);
 assert.doesNotMatch(css,/background-image\s*:\s*url\s*\(/);
});
test('Bezpieczne obserwacje Słońca i prawidłowe ograniczenia modelu',()=>{
 const h=read('etapy/17/index.html');
 for(const s of ['ISO 12312-2','Księżyca można oglądać gołym okiem','nie wyznaczenie lokalnego czasu','5,145','umbr','penumbra'])
  assert.ok(h.toLowerCase().includes(s.toLowerCase()),'Brak '+s);
});
test('Oryginalny symulator zaćmień pozostaje ręcznie uruchamiany',()=>{
 const h=read('etapy/17/index.html');
 for(const id of ['stageStartLab','stageFrame','stageLoading','stageViewport','stageError','stageReload','stageAbout','stageInfo','stageInfoClose','stageRelated','ec17Canvas','ec17Node','ec17MoonDistance'])
  assert.ok(h.includes('id="'+id+'"'),'Brak id '+id);
 assert.match(h,/data-src="\.\.\/\.\.\/atlas\.html\?portal=geometry"/);
 assert.match(h,/data-lazy="true"/);
 assert.match(h,/data-manual="true"/);
 assert.doesNotMatch(h,/<a[^>]*href="\.\.\/\.\.\/atlas\.html/);
});
test('Katalog 17, nawigacja i tryb bez WebGL',()=>{
 const dctx={window:{}};vm.runInNewContext(read('portal/data.js'),dctx);
 const d=dctx.window.ATLAS_PORTAL_DATA,c=JSON.parse(read('portal/catalog.json'));
 assert.equal(d.stages['17'].mode,'geometry');
 assert.equal(d.stages['17'].category,'zjawiska');
 assert.ok(d.categories.zjawiska.highlights.includes(17));
 assert.equal(c.stages['17'].title,d.stages['17'].title);
 assert.ok(read('portal/site.js').includes("featureCard(17,'eclipse17')"));
 const js=read('portal/eclipse17-story.js'),css=read('portal/eclipse17-story.css');
 assert.match(js,/getContext\('2d'\)/);
 assert.match(js,/prefers-reduced-motion/);
 assert.doesNotMatch(js,/THREE\.Scene|WebGLRenderingContext/);
 assert.match(css,/@media\(max-width:720px\)/);
});
