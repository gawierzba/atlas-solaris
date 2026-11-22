/* ATLAS SOLARIS XXIII — editorial, sources, optics and original engine test.
   No npm, browser or network needed for static publication validation. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const F=require('../js/merger23-core.js');
test('GW150914: first signal 36.2 + 29.1 solar masses and around 3 M☉ radiated',()=>{
 const m=F.model(F.PRESETS.gw150914);
 assert.equal(m.m1,36.2);assert.equal(m.m2,29.1);
 assert.ok(m.energySolar>2.9&&m.energySolar<3.1);
 assert.ok(m.chirp>28&&m.chirp<28.5);
});
test('Frequencies rise during inspiral and postmerger amplitude decays',()=>{
 const m=F.model(F.PRESETS.gw150914),a=F.sampleAtProgress(m,0),b=F.sampleAtProgress(m,.6),c=F.sampleAtProgress(m,.81),d=F.sampleAtProgress(m,.99);
 assert.equal(a.stage,'inspiral');assert.equal(b.stage,'inspiral');
 assert.equal(c.stage,'ringdown');assert.equal(d.stage,'ringdown');
 assert.ok(b.frequency>a.frequency);
 assert.ok(b.amplitude>a.amplitude);
 assert.ok(d.amplitude<c.amplitude);
});
test('All scenarios preserve nonnegative orbital properties and finite waveform',()=>{
 for(const input of Object.values(F.PRESETS)){
  const m=F.model(input,{inclination:35});
  assert.ok(m.seconds>0&&m.ringTau>0);
  for(let x=0;x<=100;x++){
   const s=F.sampleAtProgress(m,x/100);
   assert.ok(Number.isFinite(s.hp)&&Number.isFinite(s.frequency));
  }
 }
});
test('Eight illustrated figures with human-readable captions and links',()=>{
 const h=read('etapy/23/index.html');
 assert.equal((h.match(/<figure\b/g)||[]).length,8);
 assert.equal((h.match(/<figcaption>/g)||[]).length,8);
 assert.equal((h.match(/<img\s/g)||[]).length,8);
 assert.equal((h.match(/<img[^>]+alt="/g)||[]).length,8);
 assert.ok((h.match(/https:\/\/svs\.gsfc\.nasa\.gov\/13197\//g)||[]).length>=6);
 assert.ok(h.includes('GW150914')&&h.includes('GW250114'));
 assert.ok(h.includes('WYNIKI POMIARU')&&h.includes('NUMERYCZNA WIZUALIZACJA'));
});
test('Modern NASA 4k imagery uses responsive image sizes rather than forced 32 MB downloads',()=>{
 const h=read('etapy/23/index.html');
 assert.equal((h.match(/srcset="/g)||[]).length,3);
 assert.ok(h.includes('img.000956_1080.jpg')&&h.includes('img.000956_4k.jpg'));
 assert.ok(h.includes('img.001946_1080.jpg')&&h.includes('img.001946_4k.jpg'));
 assert.ok(h.includes('img.002294_1080.jpg')&&h.includes('img.002294_4k.jpg'));
 assert.ok(h.includes('loading="lazy"'));
});
test('Editorial scientific honesty: observation separate from NASA visualization and model',()=>{
 const h=read('etapy/23/index.html');
 assert.match(h,/nie jest pomiarem LIGO ani pełną symulacją/i);
 assert.match(h,/nie są barwami widzialnymi/i);
 assert.match(h,/Warianty hipotetyczne służą/i);
 assert.match(h,/2026/);
 assert.match(h,/Hawkinga/);
});
test('Canvas lab has all inputs, readouts and existing physics loaded first',()=>{
 const h=read('etapy/23/index.html'),js=read('portal/merger23-story.js');
 const coreIndex=h.indexOf('src="../../js/merger23-core.js?');
 assert.ok(coreIndex>=0);
 assert.ok(h.indexOf('src="../../portal/merger23-story.js')>coreIndex);
 for(const id of ['mg23Canvas','mg23Play','mg23Progress','mg23Incline','mg23Frequency',
 'mg23Loss','mg23Masses','mg23Time','mg23Separation','mg23Phase','mg23Status',
 'stageStartLab','stageViewport','stageFrame','stageLoading','stageError','stageReload','stageAbout','stageInfo','stageRelated','stageInfoClose'])
 assert.ok(h.includes('id="'+id+'"'),'Missing '+id);
 assert.match(js,/ATLAS_MERGER23_CORE/);
 assert.match(js,/F\.sampleAtProgress/);
 assert.match(js,/document\.hidden/);
 assert.doesNotMatch(js,/THREE\.Scene|WebGLRenderingContext/);
});
test('Original merger lab starts manually and earlier/later navigation is retained',()=>{
 const h=read('etapy/23/index.html');
 assert.match(h,/data-src="\.\.\/\.\.\/atlas\.html\?portal=merger"/);
 assert.match(h,/data-lazy="true"/);
 assert.match(h,/data-manual="true"/);
 assert.doesNotMatch(h,/<iframe[^>]+\ssrc="\.\.\/\.\.\/atlas\.html/);
 assert.match(h,/href="\.\.\/22\/"/);
 assert.match(h,/href="\.\.\/24\/"/);
});
test('Stage metadata align with catalog and preserve default portal routes',()=>{
 const box={window:{}};vm.runInNewContext(read('portal/data.js'),box);
 const d=box.window.ATLAS_PORTAL_DATA,c=JSON.parse(read('portal/catalog.json'));
 assert.equal(d.stages['23'].title,'Zderzenie gigantów');
 assert.equal(d.stages['23'].category,'relatywistyka');
 assert.equal(d.stages['23'].path,'etapy/23/');
 assert.equal(d.stages['23'].mode,'merger');
 assert.equal(c.stages['23'].lead,d.stages['23'].lead);
 assert.match(d.stages['23'].description,/Osiem wizualizacji/);
 assert.equal(d.stages['22'].mode,'cockpit');
 assert.equal(d.stages['24'].mode,'ligo');
});
test('CSS supports mobile, long-page scrolling and reduced motion',()=>{
 const css=read('portal/merger23-story.css');
 assert.match(css,/overflow-y:auto!important/);
 assert.match(css,/@media\(max-width:680px\)/);
 assert.match(css,/prefers-reduced-motion/);
 assert.match(css,/\.mg23-legacy-viewport\.is-started/);
 assert.doesNotMatch(css,/background-image\s*:\s*url\s*\(/);
});
