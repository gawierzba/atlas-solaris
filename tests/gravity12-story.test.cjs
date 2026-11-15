'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('Etap 12: pełny artykuł, grafika użytkownika, interakcja i dotychczasowy symulator',()=>{
 const html=read('etapy/12/index.html');
 assert.match(html,/<article\b/);
 assert.match(html,/id="g12-title"/);
 assert.match(html,/gravity12-cover\.jpg/);
 assert.match(html,/gravity12-story\.css/);
 assert.match(html,/gravity12-story\.js/);
 assert.match(html,/id="g12-impulse"/);
 assert.match(html,/id="g12-trail"/);
 assert.match(html,/id="g12-lab-launch"/);
 assert.match(html,/id="stageFrame"/);
 assert.match(html,/data-src="\.\.\/\.\.\/atlas\.html\?portal=gravity"/);
 assert.match(html,/aria-controls="stageInfo"/);
 assert.match(html,/L1[\s\S]*L2[\s\S]*L3[\s\S]*L4[\s\S]*L5/);
 assert.doesNotMatch(html,/<a[^>]*href=['"][^'"]*atlas\.html/i);
 assert.ok(fs.statSync(path.join(root,'portal/media/gravity12-cover.jpg')).size>5000);
 assert.match(read('portal/gravity12-story.css'),/overflow-y:auto!important/);
});
test('Etap 12: położenia Lagrange’a i symulacja ograniczonego problemu trzech ciał',()=>{
 const ctx={window:{}};
 vm.runInNewContext(read('portal/gravity12-story.js'),ctx,{filename:'gravity12-story.js'});
 const m=ctx.window.ATLAS12_MODEL;
 assert.ok(m,'API modelu musi być dostępne do walidacji');
 assert.ok(m.massFraction>0.012&&m.massFraction<0.013);
 assert.ok(Math.abs(m.points.L1[0]-0.8369)<0.002);
 assert.ok(Math.abs(m.points.L2[0]-1.1557)<0.002);
 assert.ok(Math.abs(m.points.L3[0]+1.005)<0.002);
 assert.ok(Math.abs(m.points.L4[1]-Math.sqrt(3)/2)<1e-9);
 assert.equal(m.points.L4[1],-m.points.L5[1]);
 assert.ok(m.speedUnitMs>950&&m.speedUnitMs<1050);
 for(const id of ['L1','L2','L3','L4','L5']){
  const t=m.integrate(id,8);
  assert.ok(t.track.length>2,id+' trajectory missing');
  assert.ok(Number.isFinite(t.days)&&t.days>0,id+' invalid simulation time');
  assert.ok(Number.isFinite(t.offsetKm),id+' invalid deviation');
 }
});
