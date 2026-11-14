const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const C=require('../portal/binary30-core.js');
const near=(a,b,eps=1e-6)=>assert.ok(Math.abs(a-b)<=eps,`Expected ${a} near ${b} +/- ${eps}`);
// Eggleton's q=1 radius 0.3789205 a.
near(C.rocheFraction(1),.49/(.6+Math.log(2)),1e-13);
near(C.l1Normalized(1,1),0,1e-9);
for(const q of [.02,.1,1,7,100]){
 const R=C.rocheFraction(q);assert.ok(R>0&&R<1);
 const l=C.l1Normalized(q,1);const mu=1/(q+1);assert.ok(l>-mu&&l<1-mu);
}
// Earth around Sun in solar units: about a sidereal year.
const AU=149597870700/C.RSUN;
near(C.periodDays(1,3.003e-6,AU),365.256,0.01);
const s=C.derived({m1:1.5,m2:.9,a:8,fill:1.04,incl:85,kind:'white-dwarf'});
assert.equal(s.condition,'overflow');assert.ok(s.diskR>0);assert.ok(s.r1>s.rl1);
assert.ok(C.equipotentialSegments(s,56).length>20);
const d=C.derived({m1:1,m2:1,a:5,fill:.65,incl:90,kind:'star'});
const f0=C.flux(0,d),f25=C.flux(.25,d),f50=C.flux(.5,d);
assert.ok(f0<f25-.01,`Primary eclipse: ${f0} ${f25}`);
assert.ok(f50<f25-.01,`Secondary eclipse: ${f50} ${f25}`);
const face=C.derived({m1:1,m2:1,a:5,fill:.65,incl:0,kind:'star'});
for(const p of [0,.25,.5,.75])near(C.flux(p,face),1,1e-12);
near(C.overlapArea(1,1,0),Math.PI,1e-12);
near(C.overlapArea(1,1,2.01),0,1e-12);
assert.ok(C.orbit(.25,s).separationProjected>0);
for(const kind of ['star','white-dwarf','neutron-star','black-hole'])assert.ok(C.radiusCompanion(kind,1.2)>0);
const repo=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(repo,rel),'utf8');
assert.match(read('etapy/30/index.html'),/gwiazdy-podwojne\/index\.html/);
assert.match(read('laboratoria/gwiazdy-podwojne/index.html'),/binary30-core\.js/);
assert.match(read('portal/binary30-ui.js'),/atlas:portal:ready/);
console.log('ATLAS SOLARIS 30 · Eggleton, L1, Kepler, equipotentials, geometric eclipses and route OK');
