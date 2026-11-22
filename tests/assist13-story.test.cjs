/* ATLAS SOLARIS XIII — fizyka asyst, publikacja i zachowanie wcześniejszego laboratorium */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const box={window:{},document:{readyState:'loading',addEventListener(){}}};
vm.runInNewContext(read('portal/assist13-story.js'),box);
const model=box.window.ATLAS_GA13_PHYSICS.model;
const close=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<tol,'Expected '+a+' ≈ '+b);
test('Hiperbola: kąt przelotu Jowisza odpowiada wzorowi δ',()=>{
 const m=model('jupiter',10,30000,1);
 const mu=126686534, r=69911+30000;
 close(m.angleRad,2*Math.asin(1/(1+r*100/mu)));
 close(m.angleDeg,135.91332889329908,1e-8);
 close(m.vinfBefore,m.vinfAfter);
});
test('Asysta może przyspieszyć albo wyhamować względem Słońca',()=>{
 for(const planet of ['jupiter','saturn','earth','venus']){
  const boost=model(planet,10,30000,1),brake=model(planet,10,30000,-1);
  assert.ok(boost.delta>0,planet+' should boost');
  assert.ok(brake.delta<0,planet+' should brake');
  close(boost.before,brake.before);
  close(boost.vinfBefore,boost.vinfAfter);
  close(brake.vinfBefore,brake.vinfAfter);
 }
});
test('Zmiana modułu prędkości nie jest tym samym co zmiana wektora',()=>{
 const m=model('jupiter',10,30000,1);
 const dx=m.outbound.x-m.inbound.x,dy=m.outbound.y-m.inbound.y;
 close(Math.hypot(dx,dy),m.vectorChange,1e-9);
 assert.ok(m.vectorChange>Math.abs(m.delta));
});
test('Bliższy przelot mocniej zakrzywia tor, szybki przelot słabiej',()=>{
 const low=model('earth',8,1000,1);
 const high=model('earth',8,100000,1);
 const rapid=model('earth',25,1000,1);
 assert.ok(low.angleDeg>high.angleDeg);
 assert.ok(low.angleDeg>rapid.angleDeg);
 assert.equal(model('none',10,1000,1),null);
 assert.equal(model('earth',0,1000,1),null);
});
test('Artykuł zawiera cztery ilustracje w treści oraz źródła NASA i ESA',()=>{
 const html=read('etapy/13/index.html');
 assert.equal((html.match(/<figure\b/g)||[]).length,4);
 for(const name of ['jupiter','frames','voyager','venus']){
  const file='portal/media/assist13-'+name+'.svg';
  assert.ok(html.includes('../../'+file),'Brak ilustracji w treści: '+name);
  assert.ok(fs.existsSync(path.join(root,file)),'Brak SVG: '+name);
  assert.match(read(file),/<svg/);
 }
 for(const term of ['NASA','Voyager','Cassini','MESSENGER','v∞','arcsin','Parker Solar Probe'])assert.ok(html.includes(term),'Brak tematu: '+term);
 assert.match(html,/science\.nasa\.gov\/mission\/voyager/);
 assert.match(html,/esa\.int\/Enabling_Support/);
});
test('Nowy kalkulator i starszy symulator działają obok siebie bez zastępowania trasy',()=>{
 const html=read('etapy/13/index.html');
 for(const id of ['ga13Canvas','ga13Planet','ga13Vinf','ga13Altitude','ga13Boost','ga13Brake','ga13Turn','ga13Speed','ga13Delta','ga13Reset','stageStartLab','stageAbout','stageInfo','stageRelated','stageViewport','stageFrame','stageLoading','stageError','stageReload']){
  assert.ok(html.includes('id="'+id+'"'),'Brak: '+id);
 }
 assert.match(html,/data-src="\.\.\/\.\.\/atlas\.html\?portal=assist"/);
 assert.match(html,/data-lazy="true"/);
 assert.match(html,/data-manual="true"/);
 assert.match(html,/<iframe /);
 const stage=read('portal/stage.js');
 assert.ok(stage.includes("getElementById('stageStartLab')"));
 assert.ok(stage.includes("const manualLab="));
 assert.ok(stage.includes("if(lazyLab)"));
});
test('Integracja z działem misji i polecanymi wyprawami',()=>{
 const context={window:{}};
 vm.runInNewContext(read('portal/data.js'),context);
 const data=context.window.ATLAS_PORTAL_DATA;
 assert.equal(data.stages['13'].category,'misje');
 assert.equal(data.stages['13'].mode,'assist');
 assert.ok(data.categories.misje.highlights.includes(13),'Etap 13 pozostaje polecaną wyprawą w dziale misji');
 assert.equal(Object.keys(data.stages).length,36);
 assert.equal(JSON.parse(read('portal/catalog.json')).stages['13'].lead,data.stages['13'].lead);
 assert.ok(read('etapy/13/index.html').includes('id="ga13Title"'),'Etap 13 musi pozostać dostępny jako samodzielny artykuł');
});
