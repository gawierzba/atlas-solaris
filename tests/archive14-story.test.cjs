/* ATLAS SOLARIS 14 — test naukowy DSN i zachowania Archiwum Misji */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const box={window:{},document:{readyState:'loading',addEventListener(){}}};
vm.runInNewContext(read('portal/archive14-story.js'),box);
const p=box.window.ATLAS_AR14_PHYSICS;
const approx=(got,want,tol=1e-9)=>assert.ok(Math.abs(got-want)<tol,'Expected '+got+' ≈ '+want);
test('Światło pokonuje 1 AU w około 8,317 minuty',()=>{
 approx(p.oneWayMinutes(1),149597870.7/299792.458/60,1e-10);
 approx(p.oneWayMinutes(1),8.3167464,1e-6);
 approx(p.roundTripMinutes(1),2*p.oneWayMinutes(1));
});
test('Opóźnienie rośnie proporcjonalnie do dystansu sondy',()=>{
 approx(p.oneWayMinutes(160)/p.oneWayMinutes(10),16);
 approx(p.roundTripMinutes(30)/p.roundTripMinutes(15),2);
 approx(p.distanceBillionKm(10),1.495978707);
});
test('Względny strumień energii maleje z kwadratem dystansu',()=>{
 approx(p.relativeFluxPercent(1),100);
 approx(p.relativeFluxPercent(10),1);
 approx(p.relativeFluxPercent(100),.01);
 approx(p.relativeFluxPercent(20)/p.relativeFluxPercent(10),.25);
});
test('Niepoprawne odległości nie dają fikcyjnych wartości',()=>{
 for(const d of [0,-1]){assert.ok(Number.isNaN(p.oneWayMinutes(d)));assert.ok(Number.isNaN(p.relativeFluxPercent(d)));}
});
test('Sześć ilustracji NASA jako figury w treści z podpisem i linkami źródłowymi',()=>{
 const html=read('etapy/14/index.html');
 assert.equal((html.match(/<figure\b/g)||[]).length,6);
 const pias=['04495','00046','21438','17792','23645','14113'];
 for(const id of pias){
  assert.ok(html.includes('/pia/pia'+id.slice(0,2)+'/pia'+id+'/PIA'+id+'.jpg'),'Brak zdjęcia NASA PIA'+id);
 }
 assert.equal((html.match(/<figcaption>/g)||[]).length,6);
 assert.equal((html.match(/assets\.science\.nasa\.gov\/dynamicimage/g)||[]).length,7); // 6 <img> i 1 og:image
 assert.doesNotMatch(read('portal/archive14-story.css'),/background-image:\s*url\(/);
 assert.ok(html.includes('sześć obrazów')||html.includes('Sześć obrazów'));
});
test('Wcześniejszy symulator Archiwum Misji nie został usunięty',()=>{
 const html=read('etapy/14/index.html');
 for(const id of ['stageStartLab','stageFrame','stageViewport','stageReload','stageLoading','stageAbout','stageInfo','stageRelated'])assert.ok(html.includes('id="'+id+'"'),'Brak '+id);
 assert.match(html,/data-src="\.\.\/\.\.\/atlas\.html\?portal=archive"/);
 assert.match(html,/data-manual="true"/);
 assert.match(html,/<article\b/);
 assert.match(html,/<canvas\b/);
 assert.doesNotMatch(html,/<a[^>]+href="\.\.\/\.\.\/atlas\.html/);
});
test('Panel laboratoryjny i deklaracje ograniczeń modelu istnieją',()=>{
 const html=read('etapy/14/index.html');
 for(const id of ['ar14Canvas','ar14Distance','ar14OneWay','ar14RoundTrip','ar14Km','ar14Loss','ar14Reset','ar14Play'])assert.ok(html.includes('id="'+id+'"'));
 assert.ok(html.includes('149 597 870,7'));
 assert.ok(html.includes('299 792,458'));
 assert.match(html,/nie są bieżącymi pomiarami/);
});
test('Katalog i nawigacja prowadzą do rozbudowanego etapu 14',()=>{
 const dataBox={window:{}};vm.runInNewContext(read('portal/data.js'),dataBox);
 const d=dataBox.window.ATLAS_PORTAL_DATA,json=JSON.parse(read('portal/catalog.json'));
 assert.equal(d.stages['14'].mode,'archive');
 assert.equal(d.stages['14'].category,'misje');
 assert.equal(json.stages['14'].title,d.stages['14'].title);
 assert.ok(d.categories.misje.highlights.includes(14));
 assert.ok(read('portal/site.js').includes("featureCard(14,'archive14')"));
});
