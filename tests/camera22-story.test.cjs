/* ATLAS SOLARIS 22 — optics, images, accessible article and preserved cockpit */
const test=require('node:test'),assert=require('node:assert/strict'),
  fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const sandbox={window:{},document:{getElementById(){return null;}}};
vm.runInNewContext(read('portal/camera22-story.js'),sandbox);
const math=sandbox.window.ATLAS_CV22_PHYSICS;
const near=(a,b,tol=1e-11)=>assert.ok(Math.abs(a-b)<tol,`Oczekiwano ${a} ≈ ${b}`);
test('W spoczynku kierunki gwiazd i częstotliwość nie ulegają zmianie',()=>{
 for(const a of [0,.2,Math.PI/2,Math.PI-.1,Math.PI]){
  near(math.aberration(0,a),a);near(math.doppler(0,a),1);
 }
});
test('Aberracja ku osi lotu i podłużny Doppler dla β=0,6',()=>{
 const b=.6;
 near(math.aberration(b,0),0);
 near(math.aberration(b,Math.PI),Math.PI);
 near(math.aberration(b,Math.PI/2),Math.acos(.6));
 near(math.doppler(b,0),2);
 near(math.doppler(b,Math.PI),.5);
 near(math.doppler(b,Math.PI/2),1.25);
});
test('Silniejsza aberracja przy rosnącej prędkości; skrajne kierunki poprawne',()=>{
 for(const theta of [.3,.9,Math.PI/2,2,2.8]){
  assert.ok(math.aberration(.9,theta)<math.aberration(.6,theta));
  assert.ok(math.aberration(.6,theta)<theta);
 }
 for(const b of [.01,.15,.5,.8,.95]){
  near(math.doppler(b,0)*math.doppler(b,Math.PI),1,1e-9);
 }
});
test('Strona artykułu etapu 22 ma osiem podpisanych obrazów i zachowuje ich źródła',()=>{
 const h=read('etapy/22/index.html');
 assert.equal((h.match(/<figure\b/g)||[]).length,8);
 assert.equal((h.match(/<figcaption>/g)||[]).length,8);
 assert.equal((h.match(/<img\s/g)||[]).length,8);
 assert.equal((h.match(/<img[^>]*alt="/g)||[]).length,8);
 for(const x of ['svs.gsfc.nasa.gov/14585/','svs.gsfc.nasa.gov/14620/',
   'svs.gsfc.nasa.gov/13326/','eso1907a.jpg','0,41 c','0,62 c','0,69 c','0,76 c']){
  assert.ok(h.includes(x),'Brak: '+x);
 }
 assert.match(h,/SYMU[LŁ]ACJ/i);
 assert.match(h,/PRAWDZIWA OBSERWACJA/);
});
test('Laboratorium 2D ma suwaki, wyniki i wyraźnie określone granice modelu',()=>{
 const h=read('etapy/22/index.html'),css=read('portal/camera22-story.css'),js=read('portal/camera22-story.js');
 for(const id of ['cv22Canvas','cv22Speed','cv22Angle','cv22AngleRead','cv22DopplerRead',
   'cv22Status','cv22Cockpit','stageStartLab','stageFrame','stageViewport',
   'stageLoading','stageError','stageReload','stageAbout','stageInfo','stageInfoClose','stageRelated']){
  assert.ok(h.includes('id="'+id+'"'),'Brak ID: '+id);
 }
 assert.match(h,/szczególnej teorii względności/i);
 assert.match(h,/nie obliczamy tu grawitacyjnego/i);
 assert.match(js,/getContext\('2d'\)/);
 assert.doesNotMatch(js,/THREE\.Scene|WebGLRenderingContext/);
 assert.match(css,/@media\(max-width:680px\)/);
 assert.match(css,/overflow-y:auto!important/);
});
test('Oryginalny kokpit uruchamia się wyłącznie po kliknięciu',()=>{
 const h=read('etapy/22/index.html');
 assert.match(h,/data-src="\.\.\/\.\.\/atlas\.html\?portal=cockpit"/);
 assert.match(h,/data-lazy="true"/);
 assert.match(h,/data-manual="true"/);
 assert.doesNotMatch(h,/<iframe[^>]*\ssrc="\.\.\/\.\.\/atlas\.html/);
 assert.ok(read('portal/stage.js').includes("stageStartLab"));
});
test('Katalog i dane etapu 22 zachowują spójność nawigacji',()=>{
 const a={window:{}};
 vm.runInNewContext(read('portal/data.js'),a);
 const d=a.window.ATLAS_PORTAL_DATA,cat=JSON.parse(read('portal/catalog.json'));
 assert.equal(d.stages['22'].title,'Kamera sondy');
 assert.equal(d.stages['22'].path,'etapy/22/');
 assert.equal(d.stages['22'].mode,'cockpit');
 assert.equal(d.stages['22'].category,'relatywistyka');
 assert.equal(d.stages['22'].lead,cat.stages['22'].lead);
 assert.match(d.stages['22'].description,/Osiem obrazów/);
 const h=read('etapy/22/index.html');
 assert.match(h,/href="\.\.\/21\/"/);
 assert.match(h,/href="\.\.\/23\/"/);
 assert.match(h,/href="\.\.\/\.\.\/#etapy"/);
});
