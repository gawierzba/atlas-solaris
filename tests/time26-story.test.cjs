/* ATLAS SOLARIS XXVI — physics, sourcing, responsive editorial and lab startup.
   Node 22; no network/browser/npm required to validate content and ERFA model. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(base,p),'utf8');
const F=require('../js/time26-core.js'),h=read('etapy/26/index.html'),js=read('portal/time26-story.js'),css=read('portal/time26-story.css');
function near(a,b,tol=1e-5){assert.ok(Math.abs(a-b)<=tol,'Expected '+a+' near '+b);}
test('Precession core preserved and still returns J2000 reference axis',()=>{
 const v=F.precession(2000);near(v.pole[0],0,3e-5);near(v.pole[1],0,3e-5);
 near(v.pole[2],1,3e-5);near(v.obliquity,23.43927944,.0001);
 assert.ok(Array.isArray(v.matrix)&&v.matrix.length===3);
});
test('Physics of three pole stars: Thuban, Polaris and Vega',()=>{
 assert.equal(F.nearestPoleStars(-2800,1)[0].name,'Tubana');
 assert.equal(F.nearestPoleStars(2026,1)[0].name,'Polarna');
 assert.equal(F.nearestPoleStars(13700,1)[0].name,'Wega');
 assert.ok(F.nearestPoleStars(2026,1)[0].separation<1);
 assert.ok(F.nearestPoleStars(13700,1)[0].separation>3);
});
test('Long-term samples and equinox vectors finite from -12000 to 16000',()=>{
 for(let year=-12000;year<=16000;year+=500){
  const v=F.precession(year),eq=F.eclipticLongitudeJ2000(v.equinox);
  assert.ok(Number.isFinite(eq)&&eq>=0&&eq<360);
  near(F.norm(v.pole),1,1e-9);
  assert.ok(v.obliquity>21&&v.obliquity<25);
 }
});
test('Eight unique real ESO sky photographs, captions, descriptions and verified source URLs',()=>{
 const imgs=[...h.matchAll(/<img\s+src="([^"]+)"/g)].map(x=>x[1]);
 assert.equal(imgs.length,8);
 assert.equal(new Set(imgs).size,8);
 assert.equal((h.match(/<figure\b/g)||[]).length,8);
 assert.equal((h.match(/<figcaption>/g)||[]).length,8);
 assert.equal((h.match(/<img[^>]+alt="/g)||[]).length,8);
 assert.equal((h.match(/loading="lazy"/g)||[]).length,7);
 assert.ok(imgs.every(src=>src.startsWith('https://cdn.eso.org/images/')));
 for(const p of ['polaris-earth-rotation','271109-cc','potw2041a','potw1421a','potw2040a','potw1301a','potw1817a','vltstartrail-6365-6375-final-cc'])
 assert.ok(imgs.some(x=>x.includes(p)),p);
});
test('Sources distinguish real daily star trails from millennial precession',()=>{
 for(const s of ['Fot. ESO/A. Santerne','Fot. ESO/B. Tafreshi','Fot. ESO/F. Char','Fot. ESO/G. Lombardi','Fot. ESO/P. Horálek','Fot. ESO/F. Kamphues'])
 assert.ok(h.includes(s),'Missing credit '+s);
 for(const s of ['nie pokazuje precesji','dobowego','tysiącleci','nie ukazuje bezpośrednio precesji'])
 assert.ok(h.toLowerCase().includes(s.toLowerCase()),'Missing distinction '+s);
});
test('Story is careful about Vega not exactly on pole and stellar proper motion',()=>{
 assert.match(h,/o kilka stopni od niego/);
 assert.match(h,/ruchów własnych/);
 assert.match(h,/nie jest prognoza temperatur ani pór lodowych/i);
 assert.match(h,/J2000/);
 assert.match(h,/ERFA/);
});
test('Original astrophysics model preserved and referenced by supplementary lab',()=>{
 assert.ok(h.indexOf('src="../../js/time26-core.js')<h.indexOf('src="../../portal/time26-story.js'));
 assert.match(js,/ATLAS_TIME26_CORE/);
 for(const k of ['F.precession','F.nearestPoleStars','F.eclipticLongitudeJ2000','F.J2000_ECL','F.POLE_STARS']) assert.ok(js.includes(k),'Core dependency '+k);
 assert.match(js,/getContext\('2d'\)/);
 assert.doesNotMatch(js,/THREE\.|WebGLRenderingContext/);
});
test('Interactive 28,000-year chronoscope and six historical quick buttons',()=>{
 for(const id of ['tm26Canvas','tm26Year','tm26YearText','tm26Play','tm26Nearest','tm26Distance','tm26Obliquity','tm26Equinox','tm26Brief','tm26PoleCoords'])
 assert.ok(h.includes('id="'+id+'"'),id);
 assert.match(h,/min="-12000" max="16000"/);
 assert.equal((h.match(/data-tm26-year="/g)||[]).length,6);
 assert.match(js,/requestAnimationFrame\(tick\)/);
 assert.match(js,/canvas\.addEventListener\('click'/);
});
test('Original portal time engine is not changed and only loads on demand',()=>{
 for(const id of ['stageStartLab','stageViewport','stageFrame','stageLoading','stageError','stageReload','stageInfo','stageRelated','stageAbout','stageInfoClose']) assert.ok(h.includes('id="'+id+'"'),'Missing '+id);
 assert.match(h,/data-src="\.\.\/\.\.\/atlas\.html\?portal=time"/);
 assert.match(h,/data-lazy="true"/);assert.match(h,/data-manual="true"/);
 assert.doesNotMatch(h,/<iframe[^>]+\ssrc="\.\.\/\.\.\/atlas\.html/);
 assert.match(h,/href="\.\.\/25\/"/);assert.match(h,/href="\.\.\/27\/"/);
});
test('Long responsive page, reduced-motion and existing footer control retained',()=>{
 assert.match(css,/overflow-y:auto!important/);
 assert.match(css,/@media\(max-width:700px\)/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/\.tm26-legacy-viewport\.is-started/);
 assert.ok(h.includes('aria-label="Nawigacja etapu"'));
 assert.ok(h.includes('lang="pl"'));
 assert.ok(js.includes('visibilitychange'));
});
test('Portal metadata aligned between data.js and catalog.json',()=>{
 const box={window:{}};vm.runInNewContext(read('portal/data.js'),box);
 const data=box.window.ATLAS_PORTAL_DATA,cat=JSON.parse(read('portal/catalog.json'));
 assert.equal(data.stages['26'].title,'Maszyna Czasu Nieba');
 assert.equal(data.stages['26'].lead,'Północ nie jest wieczna');
 assert.equal(data.stages['26'].lead,cat.stages['26'].lead);
 assert.equal(data.stages['26'].mode,'time');
 assert.equal(data.stages['25'].mode,'zodiac');
 assert.equal(data.stages['27'].mode,'origin27');
});
