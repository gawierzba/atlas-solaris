const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const ROOT=path.join(__dirname,'..');
const html=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const global={};const vm=require('node:vm');
vm.runInNewContext(html('portal/data.js'),{window:global});const data=global.ATLAS_PORTAL_DATA;
assert.equal(Object.keys(data.stages).length,27);
assert.equal(Object.keys(data.bonuses).length,6);
assert.equal(Object.keys(data.categories).length,6);
for(const [key,item] of Object.entries(data.stages)){
 assert.ok(item.number);assert.ok(item.title&&item.description&&item.mode);
 assert.ok(data.categories[item.category]);
 const page=html(item.path+'index.html');
 if(item.src) assert.ok(page.includes(item.src), `Missing custom src for \${key}`);
 else assert.match(page,new RegExp('portal='+item.mode));
 assert.match(page,/<iframe /);
 assert.ok(page.includes('aria-controls="stageInfo"'));
}
for(const item of Object.values(data.bonuses))assert.match(html(item.path+'index.html'),new RegExp('portal='+item.mode));
for(const item of Object.values(data.categories))assert.match(html(item.path+'index.html'),new RegExp('data-category="'+item.id+'"'));
assert.match(html('index.html'),/ATLAS SOLARIS/);
assert.match(html('portal/embed.js'),/atlas:portal:/);
assert.match(html('portal/embed.css'),/dialog\[open\]/);
assert.match(html('portal/site.js'),/drawCatalog\(/);
if(fs.existsSync(path.join(ROOT,'atlas.html'))){
 const legacy=html('atlas.html');
 const bridge=html('portal/embed.js');
 const configured=[...bridge.matchAll(/\b[a-z]+:\{dialog:'([^']+)',trigger:'([^']+)'\}/g)];
 assert.ok(configured.length>=23, 'Missing lab routes in bridge');
 for(const [,dialog,trigger] of configured){
  assert.ok(legacy.includes('id="'+dialog+'"'),'Missing dialog: '+dialog);
  assert.ok(legacy.includes('id="'+trigger+'"'),'Missing launch trigger: '+trigger);
 }
 assert.match(legacy,/portal\/embed\.js/);
 assert.match(legacy,/portal\/embed\.css/);
}
console.log('ATLAS SOLARIS 28 · routes, links, categories and entrypoints OK');
