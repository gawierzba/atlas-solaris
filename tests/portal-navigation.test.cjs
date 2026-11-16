/* Spójność sześciu dróg, etapów i powiązanych laboratoriów. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'portal/data.js'),'utf8'),context);
const data=context.window.ATLAS_PORTAL_DATA;
const categories=Object.values(data.categories);
const stages=Object.values(data.stages);
const bonuses=Object.values(data.bonuses);
const localPage=route=>path.join(root,route,'index.html');
test('35 etapów w sześciu kompletnych działach',()=>{
  assert.equal(categories.length,6);
  assert.equal(stages.length,35);
  assert.deepEqual(stages.map(s=>s.number).sort((a,b)=>a-b),Array.from({length:35},(_,i)=>i+1));
  for(const s of stages) assert.ok(data.categories[s.category],'Brak kategorii: etap '+s.number);
});
test('Wszystkie odnośniki katalogu prowadzą do istniejących stron',()=>{
  const routes=[...categories,...stages,...bonuses].map(item=>item.path);
  assert.equal(new Set(routes).size,routes.length,'Powtarzające się ścieżki');
  for(const route of routes) assert.ok(fs.existsSync(localPage(route)),'Brak pliku: '+route);
});
test('Każde dodatkowe laboratorium ma etap macierzysty w tym samym dziale',()=>{
  for(const extra of bonuses){
    const parent=stages.find(s=>s.number===extra.parent);
    assert.ok(parent,'Brak etapu macierzystego: '+extra.title);
    assert.equal(extra.category,parent.category,'Niewłaściwy dział: '+extra.title);
  }
});
test('Polecane początki podróży istnieją i należą do swoich działów',()=>{
  for(const cat of categories){
    assert.ok(Array.isArray(cat.highlights)&&cat.highlights.length>=2,'Brak polecanych etapów: '+cat.id);
    for(const number of cat.highlights){
      const stage=stages.find(s=>s.number===number);
      assert.ok(stage,'Brak polecanego etapu '+number);
      assert.equal(stage.category,cat.id,'Błędny dział dla etapu '+number);
    }
  }
});
