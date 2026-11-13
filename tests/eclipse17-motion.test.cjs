/**
 * ATLAS SOLARIS 17.3 — regression tests for the moving ground-track.
 * Run: node tests/eclipse17-motion.test.cjs
 */
const assert=require('node:assert/strict');
const Motion=require('../js/eclipse17-motion.js');
const Map=require('../js/eclipse17-map-engine.js');
const near=(actual,want,tol,label)=>assert.ok(Math.abs(actual-want)<tol,label+': '+actual+' vs '+want);
const origin=2460000.5,oneHour=1/24;
const track={center:[
 null,
 {lat:0,lon:179,jd:origin,kind:'total'},
 {lat:0,lon:-179,jd:origin+oneHour,kind:'total'},
 null,
 {lat:10,lon:10,jd:origin+2*oneHour,kind:'annular'},
 {lat:11,lon:10,jd:origin+3*oneHour,kind:'annular'},
 null
]};
const prepared=Motion.prepare(track);
assert.equal(prepared.groupCount,2);
near(Motion.arcKm(track.center[1],track.center[2]),222.389853,0.001,'Dateline geodesic');
near(Motion.bearingDeg(track.center[1],track.center[2]),90,.001,'Eastern bearing');
near(prepared.totalKm,333.58478,.005,'No phantom connection across missing samples');
const before=Motion.evaluate(prepared,origin-.01);
assert.equal(before.status,'before');near(before.progress,0,.001,'Before start progress');
const mid=Motion.evaluate(prepared,origin+oneHour/2);
assert.equal(mid.status,'crossing');near(mid.current.lon,-180,.001,'Crossed antimeridian');
near(mid.velocityKmH,222.389853,.1,'Distance in one hour equals km/h');
near(mid.progress,100/3,.01,'Intermediate path progress');
assert.equal(mid.past[3],null);
const exactFirst=Motion.evaluate(prepared,origin);
assert.equal(exactFirst.status,'crossing');
const exactLast=Motion.evaluate(prepared,origin+3*oneHour);
assert.equal(exactLast.status,'crossing');
const after=Motion.evaluate(prepared,origin+3*oneHour+.001);
assert.equal(after.status,'after');near(after.progress,100,.001,'End progress');
assert.equal(Motion.evaluate(Motion.prepare({center:[null,null]}),origin).status,'none');
assert.throws(()=>Motion.prepare({center:[{lat:91,lon:0,jd:0}]}),RangeError);
console.log('OK: dateline, 2 track segments, distance and speed, first/last, before/after.');

const AU=149597870.7;
const map=Map.createMap({
 getPositions:jd=>({sun:[0,0,0],earth:[1,0,0],
  moon:[1-355000/AU,(jd-origin)*1440*60/AU,0]}),
 getEarthAxes:()=>({x:[1,0,0],y:[0,1,0],z:[0,0,1]})
});
const real=map.centralTrack(origin,{minutes:45,stepMinutes:3});
const movement=Motion.prepare(real);
assert.ok(movement.valid.length>=15);
const now=Motion.evaluate(movement,origin);
assert.equal(now.status,'crossing');
assert.ok(now.velocityKmH>100);
assert.ok(now.totalKm>100);
assert.ok(now.progress>5&&now.progress<95);
console.log('OK: integrated with eclipse 17.2 geographical centralTrack() and live speed.');
