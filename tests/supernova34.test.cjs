/* ATLAS SOLARIS 34: model fizyczny i kompletność nowego rozdziału */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const script=fs.readFileSync(path.join(root,'portal/supernova34-story.js'),'utf8');
const scope={window:{},document:{readyState:'loading',addEventListener(){}}};
vm.runInNewContext(script,scope);
const physics=scope.window.ATLAS_SN34_PHYSICS;
const close=(a,b,tolerance=1e-8)=>assert.ok(Math.abs(a-b)<=tolerance,'Expected '+a+' ≈ '+b);
test('Faza Sedowa–Taylora: promień odniesienia przy 10 000 lat',()=>{
  close(physics.radiusPc(10000,1,1),12.9);
  close(physics.speedKmS(10000,1,1),.4*12.9/10000*977792.22);
});
test('Promień zwiększa się z energią i wiekiem, a maleje z gęstością',()=>{
  const baseline=physics.radiusPc(4000,1,1);
  assert.ok(physics.radiusPc(8000,1,1)>baseline);
  assert.ok(physics.radiusPc(4000,2,1)>baseline);
  assert.ok(physics.radiusPc(4000,1,2)<baseline);
  close(physics.radiusPc(10000,2,1)/physics.radiusPc(10000,1,1),Math.pow(2,.2));
});
test('Prędkość jest dodatnia i maleje wraz z upływem czasu',()=>{
  assert.ok(physics.speedKmS(3000,1,1)>physics.speedKmS(6000,1,1));
  assert.ok(Number.isFinite(physics.speedKmS(12000,3,.1)));
  assert.ok(Number.isNaN(physics.radiusPc(0,1,1)));
});
test('Rozdział zawiera grafikę, wszystkie widoki laboratorium, źródła i nawigację',()=>{
  const html=fs.readFileSync(path.join(root,'etapy/34/index.html'),'utf8');
  for(const marker of ['sn34Canvas','sn34Age','sn34Energy','sn34Density','sn34Play','sn34Reset','data-sn34-view="shock"','data-sn34-view="nebula"','data-sn34-view="elements"','supernova34-cover.svg','supernova34-story.css','supernova34-story.js','NASA','Sedowa–Taylora','../33/']){
    assert.ok(html.includes(marker),'Missing marker '+marker);
  }
  assert.ok(fs.existsSync(path.join(root,'portal/media/supernova34-cover.svg')));
});
