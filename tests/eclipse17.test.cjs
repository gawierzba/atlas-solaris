/**
 * ATLAS SOLARIS 17.0: geometric regression cases in real kilometers.
 * Run: node tests/eclipse17.test.cjs
 */
const assert=require('node:assert/strict');
const {createEngine,shadowAt,coneHitsSphere}=require('../js/eclipse-engine.js');
const AU=149597870.7,JD=2460000.5;
function positions(distanceKm,lateralKm,afterEarth){
 return {sun:[0,0,0],earth:[1,0,0],
  moon:[1+(afterEarth?distanceKm:-distanceKm)/AU,lateralKm/AU,0]};
}
function type(distance,lateral,after){
 const p=positions(distance,lateral,after);
 return createEngine({getPositions:()=>p}).at(JD);
}
for(const [label,params,want] of [
 ['totalne Słońca',[355000,0,false],'solar/total'],
 ['obrączkowe Słońca',[405000,0,false],'solar/annular'],
 ['brak Słońca',[380000,60000,false],'none/none'],
 ['całkowite Księżyca',[380000,0,true],'lunar/total'],
 ['częściowe Księżyca',[380000,4500,true],'lunar/partial'],
 ['półcieniowe Księżyca',[380000,8000,true],'lunar/penumbral'],
 ['brak Księżyca',[380000,20000,true],'none/none']
]){
 const r=type(...params);
 assert.equal(r.type+'/'+r.subtype,want,label);
 assert.ok(Number.isFinite(r.alignment.elongationDeg));
 assert.ok(Number.isFinite(r.bodies.distancesKm.earthMoon));
 console.log('OK',label,want);
}
const r=type(355000,0,false);
assert.equal(r.shadow.solar.hitsUmbra,true);
assert.equal(r.alignment.nearestSyzygy,'new');
assert.equal(type(380000,0,true).alignment.nearestSyzygy,'full');
assert.equal(coneHitsSphere(0,100,0,0,100,20,0).hit,true);
const shadow=shadowAt([0,0,0],[AU,0,0],6371,696340,[AU+380000,0,0],1737.4);
assert.equal(shadow.hitsUmbra,true);
console.log('ZALICZONE: 7 scenariuszy + geometria i syzygia.');
