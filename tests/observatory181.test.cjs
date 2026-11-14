/**
 * ATLAS SOLARIS 18.1 — Messier / constellation data + observational nights.
 * Node.js standard-library only: node tests/observatory181.test.cjs
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const catalog=require('../js/observatory181-catalog.js');
const core=require('../js/observatory181-core.js');
const observatory=require('../js/observatory18-core.js');
assert.equal(catalog.messier.length,110,'Full M1–M110 catalog');
assert.equal(new Set(catalog.messier.map(o=>o.id)).size,110,'Unique M numbers');
for(let i=1;i<=110;i++)assert.ok(catalog.messier.some(x=>x.id==='M'+i));
assert.equal(catalog.constellations.length,89,'One IAU constellation has two line figures in the source');
assert.equal(new Set(catalog.constellations.map(x=>x.id)).size,88,'88 unique constellation codes');
assert.ok(catalog.constellations.some(x=>x.id==='Ori'));
assert.ok(catalog.constellations.some(x=>x.id==='UMa'));
const m31=catalog.messier.find(x=>x.id==='M31');
assert.ok(Math.abs(m31.ra-10.6751)<.005);
assert.ok(Math.abs(m31.dec-41.2667)<.005);
assert.equal(m31.type,'s');
assert.ok(m31.mag>3&&m31.mag<4);
const m42=catalog.messier.find(x=>x.id==='M42');
assert.ok(Math.abs(m42.ra-83.85)<.005);
assert.ok(Math.abs(m42.dec+5.45)<.005);
assert.equal(core.approximateSizeArcmin('190x60'),190);
assert.equal(core.approximateSizeArcmin(''),null);
assert.ok(core.matching(m31,'M31')&&core.matching(m31,'ngc 224'));
assert.ok(core.matching(m31,'galaktyka andromedy'));
assert.ok(!core.matching(m31,'Saturn'));
for(const figure of catalog.constellations)for(const line of figure.lines){
 assert.ok(line.length>=2,'line must connect at least two stars');
 for(const [ra,dec] of line){
  assert.ok(ra>=0&&ra<360,'Right ascension normalized to degrees');
  assert.ok(dec>=-90&&dec<=90,'Declination valid');
 }
}
console.log('OK: 110 licensed J2000 Messier coordinates, 88 constellations / 89 line records.');

assert.equal(core.scoreSample({sunAltitude:-9,targetAltitude:70,moonAltitude:-3,moonIllumination:0}),null);
assert.equal(core.scoreSample({sunAltitude:-20,targetAltitude:10,moonAltitude:-3,moonIllumination:0}),null);
const a=core.scoreSample({sunAltitude:-20,targetAltitude:65,moonAltitude:-12,moonIllumination:1});
const b=core.scoreSample({sunAltitude:-20,targetAltitude:65,moonAltitude:45,moonIllumination:1});
assert.ok(a.score>b.score&&a.score===65&&b.score===35);
assert.equal(core.moonPenalty(.5,-5),0);
assert.equal(core.moonPenalty(.5,30),15);
const JD=2460990.5;
const night=core.scanNight({startJD:JD,stepHours:1,sample:jd=>{
 const h=(jd-JD)*24;
 return {sunAltitude:h>=6&&h<=18?-22:10,
  targetAltitude:45+25*Math.cos((h-12)*Math.PI/12),
  moonAltitude:-12,moonIllumination:.2};
}});
assert.equal(night.hasAstronomicalNight,true);
assert.ok(night.best);
assert.ok(night.best.altitude>=69.9);
assert.ok(night.best.sunAltitude<=-18);
const dusk=core.scanNight({startJD:JD,sample:()=>({
 sunAltitude:0,targetAltitude:80,moonAltitude:-20,moonIllumination:0})});
assert.equal(dusk.hasAstronomicalNight,false);
assert.equal(dusk.best,null);
assert.equal(core.rankNights([dusk,night])[0].startJD,JD);
assert.throws(()=>core.scanNight({startJD:NaN,sample:()=>({})}),RangeError);
assert.throws(()=>core.scanNight({startJD:JD,sample:()=>({sunAltitude:NaN,targetAltitude:5})}),TypeError);
console.log('OK: scoring prefers dark sky and Moon below horizon; 30-night scan primitives.');

const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const app=fs.readFileSync(path.join(__dirname,'..','js','app.js'),'utf8');
const ui=fs.readFileSync(path.join(__dirname,'..','js','observatory181-ui.js'),'utf8');
const oldUi=fs.readFileSync(path.join(__dirname,'..','js','observatory18-ui.js'),'utf8');
for(const id of ['obs181Figures','obs181Names','obs181MessierMap','obs181ObjectName',
 'obs181ObjectData','obs181Scan','obs181ScanStatus','obs181Nights']){
 assert.ok(html.includes('id="'+id+'"'),id+' missing');
}
const order=['observatory181-catalog.js','observatory181-core.js','observatory181-ui.js']
 .map(f=>html.indexOf('src="js/'+f+'"'));
assert.ok(order.every(n=>n>0)&&order[0]<order[1]&&order[1]<order[2]);
assert.ok(html.includes('href="css/observatory181.css"'));
assert.ok(app.includes('observatoryTargetSnapshot:(jd,lat,lon,id)=>'));
assert.ok(app.includes('ATLAS_OBS181?.drawSkyOverlay'));
assert.ok(app.includes("obsGoStar({name:m.id+' · '+m.name,dir:m.dir})"));
assert.ok(oldUi.includes('ATLAS_OBS181?.onPlannerDraw'));
assert.ok(oldUi.includes("selected.kind==='dso'"));
assert.ok(ui.includes('root.ATLAS_OBS181=Object.freeze'));
console.log('OK: script order, interactivity hooks, target pointing and safe integration.');
