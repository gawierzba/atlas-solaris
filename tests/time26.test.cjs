const assert=require('node:assert/strict');
const F=require('../js/time26-core.js');
const r=F.precession(2000);
const nearly=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<tol,`${a} versus ${b} (tol ${tol})`);
for(const [a,b] of [[r.pole[0],0],[r.pole[1],0],[r.pole[2],1],[r.obliquity,23.43927944],[r.equinox[0],1]])nearly(a,b,3e-5);
assert.ok(F.eclipticLongitudeJ2000(r.equinox)<1e-3);
// Reference vectors for year -1373.5959534565 in ERFA tests/Vondrak paper.
const t=F.precession(-1373.5959534565);
const pole=[-0.29437643797368795,-0.11719098023370023,0.9484770882408219];
const ecl=[0.0004172478576399914,-0.40495491104576153,0.9143365605312654];
for(let i=0;i<3;i++){nearly(t.pole[i],pole[i],2e-8);nearly(t.ecliptic[i],ecl[i],2e-8);}
for(const year of [-12000,-10000,-8000,-4000,-3000,0,2026,8000,13700,16000]){
 const p=F.precession(year);for(const vec of [p.pole,p.ecliptic,p.equinox,p.east])nearly(Math.hypot(...vec),1,1e-9);
 nearly(F.dot(p.pole,p.equinox),0,1e-9);
 nearly(F.dot(p.ecliptic,p.equinox),0,1e-9);
 assert.ok(p.obliquity>21&&p.obliquity<25,'reasonable obliquity '+year);
 assert.ok(F.nearestPoleStars(year).length>=5);
 assert.ok(F.eclipticLongitudeJ2000(p.equinox)>=0&&F.eclipticLongitudeJ2000(p.equinox)<360);
}
const recent=F.nearestPoleStars(2026,1)[0];assert.equal(recent.name,'Polarna');assert.ok(recent.separation<1);
const ancient=F.nearestPoleStars(-2800,1)[0];assert.equal(ancient.name,'Tubana');assert.ok(ancient.separation<2);
const future=F.nearestPoleStars(13700,1)[0];assert.equal(future.name,'Wega');assert.ok(future.separation<8);
const oldLongitude=F.eclipticLongitudeJ2000(F.precession(2000).equinox);
const newLongitude=F.eclipticLongitudeJ2000(F.precession(2026).equinox);
assert.ok(oldLongitude<.01);
assert.ok(newLongitude>359.5&&newLongitude<359.9,'equinox regresses west');
assert.equal(F.markers(250).length,113);
assert.throws(()=>F.precession(Number.NaN),RangeError);
assert.throws(()=>F.precession(500000),RangeError);
console.log('PASS ATLAS SOLARIS 26.0 — ERFA reference vectors, 2 historic pole stars, equinox drift, normalized precession frames.');