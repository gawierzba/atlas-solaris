/* ATLAS SOLARIS XXIV — optical physics, photo-report and laboratory.
   Node 22; no browser/network/npm needed for the content quality gate. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const C=require('../js/ligo24-core.js');
const near=(a,b,tol=1e-11)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),'Expected '+a+' to be close to '+b);

test('Ideal 4 km Michelson response: differential strain and 1064 nm phase',()=>{
 const h=1e-21,o=C.opticalResponse(h);
 near(C.ARM_LENGTH,4000);near(C.LASER_WAVELENGTH,1064e-9);
 near(o.deltaX,2e-18,1e-22);near(o.deltaY,-2e-18,1e-22);
 near(o.differential,4e-18,1e-22);
 near(o.phase,4*Math.PI*4e-18/1064e-9,1e-18);
 assert.ok(o.darkPort>5e-22&&o.darkPort<6e-22);
});
test('Zero strain leaves dark port dark, sign changes phase only',()=>{
 const z=C.opticalResponse(0),p=C.opticalResponse(1.8e-21),n=C.opticalResponse(-1.8e-21);
 assert.equal(z.phase,0);assert.equal(z.darkPort,0);
 near(p.phase,-n.phase);near(p.darkPort,n.darkPort);
 assert.throws(()=>C.opticalResponse(NaN),RangeError);
});
test('Existing dual-detector model distinguishes signal and no-injection scenarios',()=>{
 const signal=C.generate({scenario:'discovery',seed:240914});
 const control=C.generate({scenario:'null',seed:240914});
 assert.ok(signal.N>4000);
 assert.equal(signal.l1.length,signal.h1.length);
 assert.equal(control.cleanL1.every(x=>x===0),true);
 assert.equal(control.cleanH1.every(x=>x===0),true);
 assert.ok(signal.cleanL1.some(x=>x!==0));
});
test('Ten illustrated figures, full citations, alternatives and lazy loading',()=>{
 const h=read('etapy/24/index.html');
 assert.equal((h.match(/<figure\b/g)||[]).length,10);
 assert.equal((h.match(/<figcaption>/g)||[]).length,10);
 assert.equal((h.match(/<img\s/g)||[]).length,10);
 assert.equal((h.match(/<img[^>]+alt="/g)||[]).length,10);
 assert.equal((h.match(/loading="lazy"/g)||[]).length,9);
 assert.ok((h.match(/Caltech\/MIT\/LIGO Lab/g)||[]).length>=7);
 for(const link of ['ligo20150519c','ligo20150731i','ligo20150731j','ligo20150731g','ligo20150731b','G2301207','GW150914_Strain-diagrams_whitebg.png']) assert.ok(h.includes(link),'Photo not found '+link);
});
test('Facts and explanations clearly distinguish model from data',()=>{
 const h=read('etapy/24/index.html');
 for(const x of ['4 kilometrów','1064 nm','40 kilogramów','6,9 milisekundy','szum','filtr dopasowany','interferometr','optyczny','GW150914']) assert.ok(h.includes(x),'No '+x);
 assert.match(h,/nie pobiera surowego odczytu LIGO/i);
 assert.match(h,/wykres obserwacyjny LIGO, nie nasza symulacja/i);
 assert.match(h,/między detektorami/i);
 assert.doesNotMatch(h,/\*\*[^*]+\*\*/);
});
test('Laser optical story relies on original, tested stage 24 core',()=>{
 const h=read('etapy/24/index.html'),j=read('portal/ligo24-story.js');
 assert.ok(h.indexOf('src="../../js/merger23-core.js') < h.indexOf('src="../../js/ligo24-core.js'));
 assert.ok(h.indexOf('src="../../js/ligo24-core.js') < h.indexOf('src="../../portal/ligo24-story.js'));
 assert.match(j,/ATLAS_LIGO24_CORE/);assert.match(j,/phys\.opticalResponse\(strain\)/);
 assert.doesNotMatch(j,/THREE\.|WebGLRenderingContext/);
});
test('All interactive elements, port readouts and original portal IDs exist',()=>{
 const h=read('etapy/24/index.html');
 for(const id of ['li24Canvas','li24Amplitude','li24Phase','li24Play','li24Strain',
  'li24Delta','li24Optical','li24Dark','li24Status','stageStartLab','stageViewport',
  'stageFrame','stageLoading','stageError','stageReload','stageAbout','stageInfo',
  'stageInfoClose','stageRelated']) assert.ok(h.includes('id="'+id+'"'),'ID not found '+id);
});
test('Original portal=ligo is preserved and started manually',()=>{
 const h=read('etapy/24/index.html');
 assert.match(h,/data-src="\.\.\/\.\.\/atlas\.html\?portal=ligo"/);
 assert.match(h,/data-lazy="true"/);assert.match(h,/data-manual="true"/);
 assert.doesNotMatch(h,/<iframe[^>]+\ssrc="\.\.\/\.\.\/atlas\.html/);
 assert.match(h,/href="\.\.\/23\/"/);assert.match(h,/href="\.\.\/25\/"/);
});
test('Mobile and older browsers have long-page scrolling and lightweight 2D graphics',()=>{
 const h=read('etapy/24/index.html'),css=read('portal/ligo24-story.css'),j=read('portal/ligo24-story.js');
 assert.match(css,/overflow-y:auto!important/);
 assert.match(css,/@media\(max-width:700px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/\.li24-legacy-viewport\.is-started/);
 assert.match(j,/getContext\('2d'\)/);
 assert.match(j,/document\.hidden/);
 assert.ok(h.includes('loading="eager"'));
});
test('Portal metadata matches stage catalogue and preserves adjacent stage modes',()=>{
 const s={window:{}};vm.runInNewContext(read('portal/data.js'),s);
 const data=s.window.ATLAS_PORTAL_DATA,catalog=JSON.parse(read('portal/catalog.json'));
 assert.equal(data.stages['24'].title,'Obserwatorium LIGO');
 assert.equal(data.stages['24'].path,'etapy/24/');
 assert.equal(data.stages['24'].mode,'ligo');
 assert.equal(data.stages['24'].category,'relatywistyka');
 assert.equal(data.stages['24'].lead,catalog.stages['24'].lead);
 assert.match(data.stages['24'].description,/Dziesięć fotografii/);
 assert.equal(data.stages['23'].mode,'merger');
 assert.equal(data.stages['25'].mode,'zodiac');
});
