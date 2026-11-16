/* ATLAS SOLARIS 36 — prawa orbit, temperatura lodu i jakość rozdziału */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const box={window:{},document:{readyState:'loading',addEventListener(){}}};vm.runInNewContext(read('portal/planetbirth36-story.js'),box);
const physics=box.window.ATLAS_PB36_PHYSICS;
const close=(a,b,tol=1e-10)=>assert.ok(Math.abs(a-b)<tol,'Expected '+a+' ≈ '+b);
test('III prawo Keplera: 1 AU wokół 1 M☉ oznacza 1 rok',()=>{
 close(physics.periodYears(1,1),1);
 close(physics.periodYears(5.2,1),11.8578244210,1e-6);
 close(physics.periodYears(8,.5)/physics.periodYears(8,1),Math.sqrt(2));
});
test('Promień Hilla: skaluje się z masą planety i gwiazdy',()=>{
 close(physics.hillRadiusAu(1,1,1),.01000387585,1e-8);
 close(physics.hillRadiusAu(2,1,1)/physics.hillRadiusAu(1,1,1),2);
 close(physics.hillRadiusAu(1,8,1)/physics.hillRadiusAu(1,1,1),2);
 close(physics.hillRadiusAu(1,1,8)/physics.hillRadiusAu(1,1,1),.5);
});
test('Temperatura i przybliżona granica lodu wodnego',()=>{
 close(physics.equilibriumTemperatureK(1,1),278);
 close(physics.equilibriumTemperatureK(1,4),139);
 close(physics.equilibriumTemperatureK(16,1),556);
 close(physics.snowlineAu(1),(278/170)**2);
 close(physics.snowlineAu(4)/physics.snowlineAu(1),2);
 close(physics.equilibriumTemperatureK(1,physics.snowlineAu(1)),170,1e-8);
});
test('Odrzucenie niepoprawnych parametrów',()=>{
 for(const bad of [physics.periodYears(0,1),physics.hillRadiusAu(-1,1,1),physics.equilibriumTemperatureK(1,0),physics.snowlineAu(-1)])assert.ok(Number.isNaN(bad));
});
test('Pięć ilustracji w HTML i prawdziwa obserwacja ALMA',()=>{
 const html=read('etapy/36/index.html');assert.equal((html.match(/<figure\b/g)||[]).length,5);
 for(const name of ['disk','pebbles','planetesimals','protoplanets']){
  const file='portal/media/planetbirth36-'+name+'.svg';
  assert.ok(fs.existsSync(path.join(root,file)),'Brak grafiki '+name);
  assert.ok(html.includes('../../'+file),'Grafika nie jest osadzona w treści '+name);
  const svg=read(file);assert.match(svg,/<svg/);assert.match(svg,/<title/);
 }
 assert.match(html,/cdn\.eso\.org\/images\/screen\/eso1436a\.jpg/);
 assert.match(html,/ALMA \(ESO\/NAOJ\/NRAO\)/);
 assert.ok(!read('portal/planetbirth36-story.css').includes('background-image:url('));
});
test('Trzy tryby laboratorium, suwak i kinowy podgląd',()=>{
 const html=read('etapy/36/index.html');
 for(const id of ['pb36Canvas','pb36LabFrame','pb36StarMass','pb36Orbit','pb36PlanetMass','pb36Luminosity','pb36IceDistance','pb36GrowthStage','pb36Dustiness','pb36Cinema','pb36Play','pb36Reset'])assert.ok(html.includes('id="'+id+'"'),'Brak elementu '+id);
 for(const mode of ['disk','ice','growth'])assert.ok(html.includes('data-pb36-mode="'+mode+'"'),'Brak trybu '+mode);
 assert.match(html,/Keplera/);assert.match(html,/promień Hilla/);assert.match(html,/href="\.\.\/35\/"/);
});
test('Wszystkie etapy i dwa katalogi mają tę samą wersję 36.0',()=>{
 const w={window:{}};vm.runInNewContext(read('portal/data.js'),w);
 const data=w.window.ATLAS_PORTAL_DATA,json=JSON.parse(read('portal/catalog.json'));
 assert.equal(data.version,'36.0');assert.equal(json.version,'36.0');assert.equal(Object.keys(data.stages).length,36);assert.equal(Object.keys(json.stages).length,36);
 assert.equal(data.stages['36'].category,'planety');assert.equal(data.stages['36'].mode,'planetbirth36');
 assert.ok(read('etapy/35/index.html').includes('href="../36/"'));
});
