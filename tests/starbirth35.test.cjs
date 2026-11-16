/* ATLAS SOLARIS 35 — audyt fizyki i ilustracji w treści */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const context={window:{},document:{readyState:'loading',addEventListener(){}}};
vm.runInNewContext(read('portal/starbirth35-story.js'),context);
const model=context.window.ATLAS_SB35_PHYSICS;
const close=(a,b,tolerance)=>assert.ok(Math.abs(a-b)<tolerance,'Expected '+a+' ≈ '+b);
test('Masa Jeansa i czas spadku — 10 K, 10000 cm^-3',()=>{
 close(model.jeansMass(10,1e4,0),2.869,.02);
 close(model.freeFallMyr(1e4),.337,.01);
});
test('Prawa skalowania i turbulentne podtrzymywanie',()=>{
 const basic=model.jeansMass(10,1e4,0);
 close(model.jeansMass(20,1e4,0)/basic,Math.pow(2,1.5),1e-9);
 close(model.jeansMass(10,4e4,0)/basic,.5,1e-9);
 close(model.freeFallMyr(4e4)/model.freeFallMyr(1e4),.5,1e-9);
 assert.ok(model.jeansMass(10,1e4,.3)>basic);
 assert.ok(Number.isNaN(model.jeansMass(0,1e4,0)));
 assert.ok(Number.isNaN(model.freeFallMyr(0)));
});
test('Pięć plansz wewnątrz artykułu, w tym prawdziwa fotografia ESA/Webb',()=>{
 const html=read('etapy/35/index.html');
 assert.equal((html.match(/<figure\b/g)||[]).length,5);
 for(const name of ['cloud','collapse','protostar','first-light']){
   const p='portal/media/starbirth35-'+name+'.svg';
   assert.ok(html.includes('../../'+p),'Brak ilustracji w HTML '+name);
   assert.ok(fs.existsSync(path.join(root,p)),'Brak pliku '+name);
   const art=read(p);
   assert.ok(art.includes('<svg')&&art.includes('<title'),'Nieprawidłowy SVG '+name);
 }
 assert.match(html,/cdn\.esawebb\.org/);
 assert.match(html,/NASA, ESA, CSA, STScI/);
 assert.doesNotMatch(read('portal/starbirth35-story.css'),/background-image:\s*url\([^)]*starbirth35/i);
});
test('Trzy tryby, suwaki, tryb kinowy, źródła i powiązania',()=>{
 const html=read('etapy/35/index.html');
 for(const id of ['sb35Canvas','sb35ControlsCloud','sb35ControlsDisk','sb35ControlsLight','sb35Temp','sb35Density','sb35Mass','sb35Turbulence','sb35Tilt','sb35Rate','sb35Jet','sb35Phase','sb35Halo','sb35Play','sb35Reset','sb35Cinema'])assert.ok(html.includes('id="'+id+'"'),'Brak '+id);
 for(const mode of ['cloud','disk','light'])assert.ok(html.includes('data-view="'+mode+'"'),'Brak trybu '+mode);
 assert.match(html,/science\.nasa\.gov/);assert.match(html,/Jeansa/);assert.match(html,/href="\.\.\/34\/"/);
 assert.ok(read('etapy/34/index.html').includes('href="../35/"'));
});
test('Rozdział 35 pozostaje kompletny w rozwijającym się katalogu',()=>{
 const box={window:{}};vm.runInNewContext(read('portal/data.js'),box);
 const d=box.window.ATLAS_PORTAL_DATA;const json=JSON.parse(read('portal/catalog.json'));
 assert.ok(Object.keys(d.stages).length>=35);
 assert.equal(d.stages['35'].category,'gwiazdy');assert.equal(d.stages['35'].mode,'starbirth35');
 assert.ok(d.categories.gwiazdy.highlights.includes(35));assert.equal(json.version,d.version);assert.equal(Object.keys(json.stages).length,Object.keys(d.stages).length);
});
