/**
 * ATLAS SOLARIS 18.0 — independent observing-night / twilight regression.
 * Run: node tests/observatory18.test.cjs
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const core=require('../js/observatory18-core.js');
const JD=2460990.5;
const near=(a,b,tol=.02)=>assert.ok(Math.abs(a-b)<tol,'Expected '+a+' near '+b);
assert.equal(core.darkness(25),'day');
assert.equal(core.darkness(0),'day');
assert.equal(core.darkness(-.01),'civil');
assert.equal(core.darkness(-6),'nautical');
assert.equal(core.darkness(-12),'astronomical');
assert.equal(core.darkness(-18),'night');
assert.equal(core.darkness(-25),'night');
assert.equal(core.instantDescription(-18),'Noc astronomiczna');
assert.equal(core.darkness(NaN),'unknown');
console.log('OK: nautical, civil and astronomical twilight boundary angles.');

const sample=jd=>{
 const hours=((jd-JD)*24+48)%24;
 const phi=2*Math.PI*hours/24;
 // A synthetic Earth day: astronomical darkness around UTC midnight.
 const sunAltitude=-16-30*Math.cos(phi);
 const marsAltitude=30+26*Math.cos(phi);
 const starAltitude=15+50*Math.cos(phi);
 return {sunAltitude,moonAltitude:45,moonIllumination:.38,targets:[
  {id:'mars',name:'Mars',kind:'body',altitude:marsAltitude,azimuth:120},
  {id:'star-1',name:'Syriusz',kind:'star',mag:-1.4,altitude:starAltitude,azimuth:230},
  {id:'hidden',name:'Niewidoczny',kind:'star',mag:2,altitude:-20,azimuth:0}
 ]};
};
const result=core.plan({startJD:JD,hours:24,stepMinutes:20,sample});
assert.equal(result.records.length,73);
assert.equal(result.endJD,JD+1);
assert.ok(result.hasAstronomicalNight);
assert.ok(result.astronomicalDarkHours>10&&result.astronomicalDarkHours<14);
assert.equal(result.targets.length,3);
assert.ok(result.windows.length>=1);
const mars=result.targets.find(t=>t.id==='mars');
assert.equal(mars.quality,'very-good');
near(mars.best.altitude,56,.03);
assert.ok(mars.best.jd>=JD&&mars.best.jd<=JD+1);
assert.ok(result.targets.find(t=>t.id==='hidden').quality==='below');
near(core.nearestNight(JD+.5,result),JD+.3,.25);
console.log('OK: 24h scan, Moon illumination, recommended maximum and target sorting.');

const polar=core.plan({startJD:JD,hours:24,stepMinutes:30,sample:jd=>({
 sunAltitude:-4,moonAltitude:22,moonIllumination:1,targets:[
  {id:'saturn',name:'Saturn',kind:'body',altitude:50,azimuth:180}
]})});
assert.equal(polar.hasAstronomicalNight,false);
assert.equal(polar.astronomicalDarkHours,0);
assert.equal(core.nearestNight(JD,polar),null);
assert.equal(polar.targets[0].quality,'twilight-or-day');
assert.throws(()=>core.plan({startJD:NaN,sample}),RangeError);
assert.throws(()=>core.plan({startJD:JD,sample:()=>({sunAltitude:NaN,targets:[]})}),TypeError);
console.log('OK: polar summer twilight, absence of dark sky, invalid-data rejection.');

// Integration assertions guard the deferred module + new classic script ordering.
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const ui=fs.readFileSync(path.join(__dirname,'..','js','observatory18-ui.js'),'utf8');
const app=fs.readFileSync(path.join(__dirname,'..','js','app.js'),'utf8');
const ids=[...new Set([...ui.matchAll(/\$\('([^']+)'\)/g)].map(m=>m[1]))];
for(const id of ids)assert.ok(html.includes('id="'+id+'"'),'Missing observatory DOM ID: '+id);
for(const file of ['js/observatory18-core.js','js/observatory18-ui.js','css/observatory18.css'])
 assert.ok(html.includes(file),'Missing asset: '+file);
assert.ok(html.indexOf('src="js/observatory18-core.js"')<html.indexOf('src="js/observatory18-ui.js"'));
assert.ok(ui.includes('const api=root.ATLAS_MAIN_API;'),'Defer module access until init');
assert.ok(app.includes('observatorySnapshot:(jd,world,lat,lon,includeCatalog=false)'));
assert.ok(app.includes('ATLAS_OBSERVATORY18?.onSkyDraw'));
assert.ok(html.includes('Żywe Obserwatorium'));
console.log('OK: all observatory UI IDs, script order, and original sky map integration.');
