/**
 * ATLAS SOLARIS 17.2 — geographic eclipse map regression tests.
 * Run: node tests/eclipse17-map.test.cjs
 * Synthetic geometry is deliberately exact; it does not pretend to be a NASA ephemeris.
 */
const assert=require('node:assert/strict');
const {createMap}=require('../js/eclipse17-map-engine.js');
const AU=149597870.7,JD=2460000.5;
const axes=()=>({x:[1,0,0],y:[0,1,0],z:[0,0,1]});
const staticMap=distance=>createMap({
 getPositions:()=>({sun:[0,0,0],earth:[1,0,0],moon:[1-distance/AU,0,0]}),
 getEarthAxes:axes
});
const total=staticMap(355000),annular=staticMap(405000);
assert.equal(total.local(JD,0,180).visibleKind,'total');
assert.equal(annular.local(JD,0,180).visibleKind,'annular');
assert.equal(total.local(JD,0,0).visibleKind,'none');
assert.equal(total.local(JD,0,0).visible,false);
assert.ok(total.local(JD,0,180).coverageFraction>.999);
assert.ok(annular.local(JD,0,180).coverageFraction<.99);
const axis=total.axisPoint(JD);
assert.ok(axis&&Math.abs(axis.lat)<1e-9);
assert.ok(Math.abs(Math.abs(axis.lon)-180)<1e-9);
assert.ok(total.centralBoundary(JD,72).points.length>=70);
assert.equal(total.centralTrack(JD,{minutes:30,stepMinutes:3}).center.filter(Boolean).length,21);
assert.ok(total.contours(JD,{stepDeg:3,levels:[.001]})['0.001'].length>10);
console.log('OK: total/annular, night visibility, shadow axis, central strip and penumbra outline');

const moving=createMap({
 getPositions:jd=>({
  sun:[0,0,0],earth:[1,0,0],
  moon:[1-355000/AU,(jd-JD)*1440*60/AU,0]
 }),
 getEarthAxes:axes
});
const contacts=moving.contacts(JD,0,180);
assert.equal(contacts.kind,'total');
assert.deepEqual(contacts.contacts.map(c=>c.label),['C1','C2','C3','C4']);
assert.ok(contacts.contacts.every(c=>c.sunAboveHorizon));
assert.ok(contacts.contacts[0].jd<contacts.contacts[1].jd);
assert.ok(contacts.contacts[1].jd<contacts.maximum.jd);
assert.ok(contacts.maximum.jd<contacts.contacts[2].jd);
assert.ok(contacts.contacts[2].jd<contacts.contacts[3].jd);
assert.equal(moving.contacts(JD,0,0).kind,'none');
console.log('OK: local C1-C4 timing, maximum, observer on opposite Earth hemisphere');
const grazing=createMap({
 getPositions:jd=>({
  sun:[0,0,0],earth:[1,0,0],
  moon:[1-379000/AU,(jd-JD)*1440*60/AU,0]
 }),
 getEarthAxes:axes
});
const shortContacts=grazing.contacts(JD,0,180);
assert.equal(shortContacts.kind,'total');
assert.deepEqual(shortContacts.contacts.map(x=>x.label),['C1','C2','C3','C4']);
assert.ok((shortContacts.contacts[2].jd-shortContacts.contacts[1].jd)*86400<15);
console.log('OK: sub-15-second central phase recovered between sampling instants');


const displaced=createMap({
 getPositions:()=>({sun:[0,0,0],earth:[1,0,0],moon:[1-355000/AU,18000/AU,0]}),
 getEarthAxes:axes
});
assert.equal(displaced.axisPoint(JD),null);
assert.equal(displaced.centralBoundary(JD),null);
assert.throws(()=>total.local(JD,91,0),RangeError);
assert.throws(()=>total.contours(JD,{stepDeg:7}),RangeError);
console.log('OK: axis misses Earth, and invalid input is rejected');
