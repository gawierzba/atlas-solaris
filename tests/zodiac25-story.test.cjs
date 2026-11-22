/* ATLAS SOLARIS XXV — science and editorial quality gate.
   12 tropical sectors vs 13 unequal constellations, no ephemeris overclaims.
   Runs on Node 22, without npm/network/browser. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const dir=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(dir,p),'utf8');
const Z=require('../js/zodiac25-core.js');
const h=read('etapy/25/index.html');

test('Exactly twelve signs, thirteen non-uniform ecliptic constellations',()=>{
 assert.equal(Z.SIGNS.length,12);
 assert.equal(Z.CATALOG.length,13);
 assert.equal(Z.sectors(2026).length,13);
 assert.ok(Z.CATALOG.some(c=>c.id==='Oph'&&c.name==='Wężownik'));
 const x=Z.sectors(2026),total=x.reduce((v,c)=>v+c.width,0);
 assert.ok(Math.abs(total-360)<.01,'Whole circle should have 360 degrees');
 assert.ok(Math.max(...x.map(c=>c.width))>Math.min(...x.map(c=>c.width))*3);
});
test('Sun longitudes track the main seasonal points in 2026',()=>{
 const l=d=>Z.sunLongitude(new Date(d+'T12:00:00Z'));
 const eq=l('2026-03-20'),jun=l('2026-06-21'),sep=l('2026-09-22'),dec=l('2026-12-21');
 assert.ok(Math.min(eq,360-eq)<2);
 assert.ok(Math.abs(jun-90)<2);assert.ok(Math.abs(sep-180)<2);assert.ok(Math.abs(dec-270)<2);
});
test('Different systems can describe the same Sun differently',()=>{
 const d=new Date('2026-11-22T12:00:00Z'),l=Z.sunLongitude(d),sg=Z.sign(l),ct=Z.zone(l,2026);
 assert.ok(sg.name&&ct.name);
 assert.equal(Z.sign(0).name,'Baran');
 assert.equal(Z.sign(30).name,'Byk');
 assert.ok(ct.width>0);
});
test('Date-to-longitude inversion and Ophiuchus midpoint work',()=>{
 const x=Z.solarDateAtLongitude(2026,90);
 assert.ok(x instanceof Date && Number.isFinite(x.getTime()));
 assert.ok(Math.abs(Z.sunLongitude(x)-90)<.1);
 const o=Z.nearMidDate(2026,'Oph');
 assert.ok(o instanceof Date);
 assert.equal(Z.zone(Z.sunLongitude(o),2026).id,'Oph');
});
test('Ten distinct astrophotographs, ten source captions and accessible image alternatives',()=>{
 const images=[...h.matchAll(/<img\s+src="([^"]+)"/g)].map(x=>x[1]);
 assert.equal(images.length,10);assert.equal(new Set(images).size,10);
 assert.equal((h.match(/<figure\b/g)||[]).length,10);
 assert.equal((h.match(/<figcaption>/g)||[]).length,10);
 assert.equal((h.match(/<img[^>]+alt="/g)||[]).length,10);
 assert.equal((h.match(/loading="lazy"/g)||[]).length,9);
 assert.ok(images.every(src=>src.startsWith('https://')));
 assert.ok(images.filter(src=>src.includes('cdn.eso.org')).length>=8);
 assert.ok(images.includes('https://cdn.eso.org/images/publicationjpg/vlt-mw-potw.jpg'));
});
test('Photo attributions and source links from astronomy institutions',()=>{
 for(const x of ['www.eso.org/public/images/eso0934a/','www.eso.org/public/images/b11/','www.eso.org/public/images/potw1348a/','apod.nasa.gov/apod/ap060714.html','www.iau.org/IAU/Astronomy-FAQs/Constellations.aspx']) assert.ok(h.includes(x));
 assert.match(h,/ESO\/S\. Guisard/);
 assert.match(h,/NASA APOD/);
 assert.match(h,/DROGA MLECZNA/i);
});
test('Thirteen-card reference covers each recognized ecliptic constellation',()=>{
 assert.equal((h.match(/<article(?:\s+class="is-extra")?>/g)||[]).length,13);
 for(const name of ['Baran','Byk','Bliźnięta','Rak','Lew','Panna','Waga','Skorpion','Wężownik','Strzelec','Koziorożec','Wodnik','Ryby']) assert.match(h,new RegExp(name));
 assert.match(h,/TRZYNASTY/);
});
test('Science notes distinguish 12 signs, 13 unequal constellations and approximate ephemeris',()=>{
 assert.match(h,/12 równych sektorów/i);
 assert.match(h,/13 przeciętych gwiazdozbiorów/i);
 assert.match(h,/nie jest dokładne testowanie pełnych wielokątów granic IAU/i);
 assert.match(h,/interpretacje astrologiczne nie są częścią fizycznego modelu/i);
 assert.match(h,/precesj/i);
});
test('Interactive sky wheel uses the existing zodiac core and all controls are present',()=>{
 const j=read('portal/zodiac25-story.js');
 for(const id of ['zo25Canvas','zo25Date','zo25Lambda','zo25Sign','zo25Constellation','zo25Width','zo25Next','zo25Fact','zo25SunInfo','zo25Status','stageStartLab','stageViewport','stageFrame','stageAbout','stageInfo','stageRelated','stageInfoClose']) assert.ok(h.includes('id="'+id+'"'),'Missing id '+id);
 assert.ok(h.indexOf('src="../../js/zodiac25-core.js')<h.indexOf('src="../../portal/zodiac25-story.js'));
 for(const x of ['C.sunLongitude','C.zone','C.sign','C.sectors','C.solarDateAtLongitude','C.nearMidDate'])assert.ok(j.includes(x));
 assert.match(j,/data-zo25-day/);assert.match(j,/canvas\.addEventListener\('click'/);
 assert.match(j,/getContext\('2d'\)/);
});
test('Original Zodiac engine is retained as manual and catalog metadata synchronized',()=>{
 assert.match(h,/data-src="\.\.\/\.\.\/atlas\.html\?portal=zodiac"/);
 assert.match(h,/data-lazy="true"/);assert.match(h,/data-manual="true"/);
 assert.doesNotMatch(h,/<iframe[^>]+\ssrc="\.\.\/\.\.\/atlas\.html/);
 assert.match(h,/href="\.\.\/24\/"/);assert.match(h,/href="\.\.\/26\/"/);
 const b={window:{}};vm.runInNewContext(read('portal/data.js'),b);
 const d=b.window.ATLAS_PORTAL_DATA,c=JSON.parse(read('portal/catalog.json'));
 assert.equal(d.stages['25'].title,'Atlas Zodiaku');
 assert.equal(d.stages['25'].lead,c.stages['25'].lead);
 assert.equal(d.stages['25'].mode,'zodiac');
 assert.equal(d.stages['24'].mode,'ligo');assert.equal(d.stages['26'].mode,'time');
});
test('Mobile long-form reader, accessible focus and reduced motion remain functional',()=>{
 const css=read('portal/zodiac25-story.css');
 assert.match(css,/overflow-y:auto!important/);
 assert.match(css,/@media\(max-width:720px\)/);
 assert.match(css,/@media\(max-width:460px\)/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/\.zo25-legacy-viewport\.is-started/);
 assert.match(css,/\.zo25-constellations/);
 assert.ok(h.includes('aria-live="polite"'));
});
