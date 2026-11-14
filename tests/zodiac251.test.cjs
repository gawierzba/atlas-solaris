const assert=require('node:assert/strict');
const path=require('node:path');
const C=require('../js/zodiac25-core.js');
const B=require('../js/zodiac251-bounds.js');
const Q=require('../js/zodiac251-core.js');
assert.equal(B.length,13,'Only the thirteen ecliptic IAU boundary polygons');
assert.deepEqual(new Set(B.map(p=>p[0])),new Set(C.CATALOG.map(p=>p.id)));
for(const [name,ra,dec,id] of [
 ['Hamal',31.79,23.46,'Ari'],['Aldebaran',68.98,16.51,'Tau'],
 ['Pollux',116.33,28.03,'Gem'],['Regulus',152.09,11.97,'Leo'],
 ['Spica',201.30,-11.16,'Vir'],['Antares',247.35,-26.43,'Sco'],
 ['Rasalhague',263.73,12.56,'Oph'],['Kaus Australis',276.04,-34.38,'Sgr']]){
 assert.equal(Q.constellationAt(ra,dec),id,name+' membership from IAU J2000');
}
assert.equal(Q.constellationAt(0,80),null,'Zodiac subset does not classify polar sky');
for(const [day,id] of [['2026-01-01','Sgr'],['2026-01-25','Cap'],['2026-02-20','Aqr'],
 ['2026-03-25','Psc'],['2026-04-22','Ari'],['2026-05-20','Tau'],['2026-06-25','Gem'],
 ['2026-07-26','Cnc'],['2026-08-20','Leo'],['2026-09-25','Vir'],
 ['2026-11-14','Lib'],['2026-11-27','Sco'],['2026-12-05','Oph'],['2026-12-29','Sgr']]){
 assert.equal(Q.sunZone(day+'T12:00:00Z'),id,day+' solar zone');
}
for(let year=2024;year<=2040;year++){
 const events=Q.yearCrossings(year);
 assert.equal(events.length,13,year+' has 13 distinct Sun ingress events');
 assert.equal(new Set(events.map(e=>e.id)).size,13,year+' visits each one once');
 for(let i=1;i<events.length;i++)assert.ok(events[i].date>events[i-1].date,year+' ordered ingress');
 const sectors=Q.yearSectors(year);
 assert.equal(sectors.length,13);
 assert.ok(Math.abs(sectors.reduce((acc,e)=>acc+e.width,0)-360)<1e-7,'Full ecliptic circle');
 assert.ok(sectors.find(x=>x.id==='Sco').width<10,'Scorpius short interval');
 assert.ok(sectors.find(x=>x.id==='Vir').width>40,'Virgo long interval');
 for(const e of events){
  const after=new Date(e.date.getTime()+2*60*60*1000);
  const before=new Date(e.date.getTime()-2*60*60*1000);
  assert.equal(Q.sunZone(after),e.id,year+' incoming zone '+e.id);
  assert.notEqual(Q.sunZone(before),e.id,year+' outgoing zone '+e.id);
 }
}
const last=Q.nextIngress('2026-11-14T12:00:00Z');assert.equal(last.id,'Sco');
assert.ok(last.date.toISOString().startsWith('2026-11-23'));
const first=Q.nextIngress('2026-12-28T12:00:00Z');assert.equal(first.id,'Cap');
assert.ok(first.date.toISOString().startsWith('2027-01-20'));
const eq=Q.sunJ2000('2026-03-20');assert.ok(eq.ra>=0&&eq.ra<360&&eq.dec<1);
const vec=Q.vector(45,0),ang=Q.directions(vec);assert.ok(Math.abs(ang.ra-45)<1e-10);
assert.ok(Math.abs(ang.dec)<1e-10);
const d={stars:[[1,0,0,1,0,'Alpha',1,0],[2,1,0,2,0,'Beta',2,0]],figures:{Test:{name:'Test',paths:[[0,-1,1]]}}};
const shaped=Q.constellationStars(d,'Test');
assert.deepEqual(shaped.paths,[[0,null,1]],'Unknown star produces gap, not fake link');
assert.equal(shaped.nodes.length,2);assert.equal(shaped.nodes[0].distanceLy,1);
console.log('PASS ATLAS SOLARIS 25.1: 13 real J2000 IAU polygons, 17 annual series, stellar parallax paths, event boundaries.');