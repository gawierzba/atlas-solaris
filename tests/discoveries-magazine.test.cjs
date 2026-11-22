/* ATLAS SOLARIS ODKRYCIA 01/2026 — static editorial quality gate.
 * No tests need network or npm dependencies. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const intro=read('odkrycia/index.html'),home=read('index.html'),js=read('portal/discoveries-home.js'),css=read('odkrycia/editorial.css');
const articles=['n159','bao','kocia-glowa','beta-pictoris'].map(name=>({name,html:read('odkrycia/'+name+'/index.html')}));
test('Homepage loads new magazine without touching ATLAS stage initialization',()=>{
 assert.match(home,/portal\/site\.js\?v=36/);
 assert.match(home,/portal\/discoveries-home\.css/);
 assert.match(home,/portal\/discoveries-home\.js/);
 assert.ok(home.indexOf('portal/site.js')<home.indexOf('portal/discoveries-home.js'));
 assert.match(js,/if\(!body\|\|body\.getAttribute\('data-view'\)!=='home'\)return/);
 assert.match(js,/hero\.parentNode\.insertBefore/);
 assert.match(js,/id="odkrycia"/);
 assert.ok(!js.includes('stageGrid.innerHTML='));
});
test('Homepage magazine links all four articles and adds keyboard-accessible navigation',()=>{
 for(const x of articles)assert.ok(js.includes('odkrycia/'+x.name+'/'),x.name);
 assert.ok(js.includes("navLink(desktop"));
 assert.ok(js.includes("navLink(mobile"));
 assert.match(js,/aria-labelledby="asjTitle"/);
});
test('Magazine hub exists as own page with four story links',()=>{
 assert.match(intro,/<main id="magMain">/);
 assert.match(intro,/NR 01 \/ 2026/);
 for(const x of articles)assert.ok(intro.includes('href="'+x.name+'/'),x.name);
 assert.match(intro,/https:\/\/cdn\.esawebb\.org\/archives\/images\/publicationjpg\/potm2610a\.jpg/);
 assert.match(intro,/nie automatyczny kanał newsowy/i);
});
test('All four articles have standalone titles, leads, sources and link back to magazine',()=>{
 for(const x of articles){
  const h=x.html;
  for(const v of ['<!doctype html>','lang="pl"','<main id="magMain">','<h1>','mag-article-deck','mag-story-meta','mag-story-hero','mag-story-layout','mag-story-text','mag-trust','mag-bottom-nav'])assert.ok(h.includes(v),x.name+' missing '+v);
  assert.match(h,/href="\.\.\/" aria-current="page"/);
  assert.ok((h.match(/<h2>/g)||[]).length>=4,x.name+' too short');
  assert.ok((h.match(/<p/g)||[]).length>=15,x.name+' not enough prose');
  assert.ok((h.match(/https:\/\/.*?\.org/g)||[]).length>=2);
  assert.match(h,/<img[^>]+alt="[^"]+"/);
  assert.match(h,/target="_blank" rel="noopener noreferrer"/);
 }
});
test('Four correct science-to-lab connections are navigable',()=>{
 const m=Object.fromEntries(articles.map(x=>[x.name,x.html]));
 assert.ok(m['n159'].includes('href="../../etapy/35/"'));
 assert.ok(m['bao'].includes('href="../../etapy/30/"'));
 assert.ok(m['kocia-glowa'].includes('href="../../etapy/35/"'));
 assert.ok(m['beta-pictoris'].includes('href="../../etapy/15/"'));
 for(const n of [15,30,35])assert.ok(fs.existsSync(path.join(root,'etapy',String(n).padStart(2,'0'),'index.html')));
});
test('Strong provenance: NASA/ESA/ESO sources, dates, observation vs illustration',()=>{
 assert.ok(intro.includes('22 LISTOPADA 2026'));
 const m=Object.fromEntries(articles.map(x=>[x.name,x.html]));
 assert.match(m['n159'],/22 PAŹDZIERNIKA 2026/);
 assert.match(m['bao'],/18 LISTOPADA 2026/);
 assert.match(m['kocia-glowa'],/29 PAŹDZIERNIKA 2026/);
 assert.match(m['beta-pictoris'],/15 LIPCA 2026/);
 assert.match(m['bao'],/nie.*film/i);
 assert.match(m['beta-pictoris'],/100 razy słabsz/i);
 assert.match(m['kocia-glowa'],/różne pola widzenia/i);
 assert.match(m['n159'],/161 tysięcy/i);
});
test('NIRCam/MIRI truly switches two different Webb images via accessible button state',()=>{
 const h=articles.find(x=>x.name==='kocia-glowa').html,j=read('odkrycia/editorial.js');
 assert.match(h,/data-mag-spectrum/);
 assert.match(h,/data-spectrum-channel="nircam"/);
 assert.match(h,/data-spectrum-channel="miri"/);
 assert.match(h,/weic2622c\.jpg/);
 assert.match(h,/weic2622d\.jpg/);
 assert.match(h,/aria-pressed="true"/);
 assert.match(h,/aria-live="polite"/);
 assert.match(j,/img\.hidden=img\.getAttribute/);
 assert.match(j,/setAttribute\('aria-pressed'/);
 assert.match(h,/nie.*zdjęciami.*1:1/i);
});
test('Responsive independently styled edition including reduced motion',()=>{
 assert.match(css,/@media\(max-width:500px\)/);
 assert.match(css,/@media\(max-width:720px\)/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/\.mag-story-layout/);
 const c=read('portal/discoveries-home.css');
 assert.match(c,/@media\(max-width:700px\)/);
 assert.match(c,/prefers-reduced-motion:reduce/);
 assert.match(c,/#odkrycia/);
});
test('Magazine has no automatic location, tracking, live-data claims or heavy dependencies',()=>{
 const combined=[intro,js,read('odkrycia/editorial.js'),...articles.map(x=>x.html)].join('\n');
 assert.doesNotMatch(combined,/geolocation\.getCurrentPosition/);
 assert.doesNotMatch(combined,/google-analytics\.com|gtag\(/);
 assert.doesNotMatch(combined,/<script[^>]+src="https:\/\//);
 assert.doesNotMatch(combined,/three\.min\.js|three\.js/);
 assert.match(intro,/nie automatyczny kanał newsowy/i);
});

test('Mobile homepage stories stack photos above text without overlapping columns',()=>{
 const c=read('portal/discoveries-home.css');
 const mobile=c.split('@media(max-width:700px)')[1]?.split('@media(max-width:425px)')[0];
 assert.ok(mobile,'Expected mobile CSS block');
 assert.ok(mobile.includes('.asj-story{display:flex;flex-direction:column'),'Mobile stories must stack');
 assert.ok(mobile.includes('.asj-story figure{display:block;width:100%;aspect-ratio:16/9'),'Photos above title');
 assert.ok(mobile.includes('.asj-story h4{display:block;max-width:100%'),'Heading must wrap within card');
 assert.ok(mobile.includes('overflow-wrap:anywhere'),'Long titles must wrap');
 assert.ok(!mobile.includes('grid-template-columns:130px 1fr'),'Remove broken two-column layout');
 const small=c.split('@media(max-width:425px)')[1]?.split('@media(prefers-reduced-motion:reduce)')[0];
 assert.ok(small,'Expected smallest screen rules');
 assert.ok(!small.includes('grid-template-columns:105px 1fr'),'No side-by-side narrow layout');
 assert.ok(home.includes('portal/discoveries-home.css?v=1.1'),'Invalidate older CSS cache');
});

test('Every discovery now features a prominent lab card and direct experiment link',()=>{
 const map={
  n159:{stage:'35',lab:'sb35Laboratorium'},
  bao:{stage:'30',lab:'laboratorium'},
  'kocia-glowa':{stage:'35',lab:'sb35Laboratorium'},
  'beta-pictoris':{stage:'15',lab:'ex15Lab'}
 };
 for(const {name,html:h} of articles){
  const {stage,lab}=map[name];
  assert.match(h,/id="magRelatedLab"/,name+' missing related-lab panel');
  assert.match(h,/id="magRelatedLabTitle"/,name+' missing heading');
  assert.match(h,/POWIĄZANE LABORATORIUM/,name+' missing clear lab label');
  assert.ok(h.includes('href="#magRelatedLab"'),name+' missing early shortcut');
  assert.ok(h.includes('href="../../etapy/'+stage+'/"'),name+' missing stage CTA');
  assert.ok(h.includes('href="../../etapy/'+stage+'/#'+lab+'"'),name+' missing experiment CTA');
  assert.match(h,/Uruchom eksperyment/,name+' missing direct CTA');
  assert.match(h,/Poznaj etap/,name+' missing full stage CTA');
  assert.match(h,/mag-related-lab-photo.+?<img[^>]+alt="/s,name+' missing illustrated related lab');
  assert.ok(h.includes('../editorial.css?v=1.1'),name+' CSS not cache-busted');
 }
});
test('Three original stages link back to exact four discoveries, without replacing simulation',()=>{
 const byStage={
  '15':['beta-pictoris'],
  '30':['bao'],
  '35':['n159','kocia-glowa']
 };
 for(const [number,slugs] of Object.entries(byStage)){
  const h=read('etapy/'+number+'/index.html');
  assert.match(h,/id="powiazane-odkrycia"/,number+' missing discovery rail');
  assert.match(h,/portal\/related-discoveries\.css\?v=1\.0/,number+' missing rail stylesheet');
  assert.equal((h.match(/class="as-related-item"/g)||[]).length,slugs.length,number+' card count');
  assert.equal((h.match(/<h3>[^<]+<\/h3>/g)||[]).length>=slugs.length,true,number+' semantic titles');
  for(const slug of slugs)assert.ok(h.includes('href="../../odkrycia/'+slug+'/"'),number+' missing '+slug);
  assert.ok(h.includes('id="'),number+' malformed stage');
 }
 for(const [n,marker] of [['15','data-src="../../atlas.html?portal=exo"'],['30','data-src="../../laboratoria/gwiazdy-podwojne/index.html?v=30.1"'],['35','id="sb35Laboratorium"']]){
  assert.ok(read('etapy/'+n+'/index.html').includes(marker),'Original laboratory altered '+n);
 }
});
test('Discovery rail is responsive, has separate light and dark themes and no scripting',()=>{
 const c=read('portal/related-discoveries.css');
 assert.match(c,/\.as-related-grid/);
 assert.match(c,/\.as-related-grid--single/);
 assert.match(c,/body\[data-route="30"\] \.as-related/);
 assert.match(c,/@media\(max-width:700px\)/);
 assert.match(c,/prefers-reduced-motion:reduce/);
 assert.ok(!c.includes('position:fixed'),'Related rail must not cover original labs');
});
test('Magazine issue labels stages 15, 30 and 35 before opening the story',()=>{
 assert.match(intro,/REPORTAŻ OTWARCIA · ETAP 35/);
 for(const n of ['15','30','35'])assert.ok(intro.includes('POWIĄZANY ETAP '+n),'Missing index link to '+n);
 assert.match(intro,/editorial\.css\?v=1\.2/);
});
