const assert = require('node:assert/strict');
const c = require('../js/zodiac25-core.js');
function l(date){return c.sunLongitude(new Date(date+'T12:00:00Z'));}
const eq = l('2026-03-20');
assert.ok(Math.min(eq,360-eq)<1.5,'March equinox near tropical 0 degrees');
assert.ok(Math.abs(l('2026-06-21')-90)<1.5,'June solstice near 90 degrees');
assert.ok(Math.abs(l('2026-09-22')-180)<1.5,'September equinox near 180 degrees');
assert.ok(Math.abs(l('2026-12-21')-270)<1.5,'December solstice near 270 degrees');
const sectors=c.sectors(2026);assert.equal(sectors.length,13);
const sum=sectors.reduce((s,c)=>s+c.width,0);
assert.ok(Math.abs(sum-360)<1e-6,'Thirteen sectors cover 360 degrees');
assert.ok(sectors.every(x=>x.width>3&&x.width<50),'No empty or nonsensical sectors');
assert.ok(sectors.find(x=>x.id==='Sco').width < sectors.find(x=>x.id==='Vir').width);
assert.equal(c.zone(l('2026-11-14'),2026).name,'Waga');
assert.equal(c.sign(l('2026-11-14')).name,'Skorpion');
assert.equal(c.zone(l('2026-12-05'),2026).name,'Wężownik');
assert.equal(c.zone(l('2026-03-25'),2026).name,'Ryby');
assert.equal(c.zone(l('2026-12-29'),2026).name,'Strzelec');
const m=c.nearMidDate(2026,'Oph');assert.ok(m instanceof Date && !Number.isNaN(m));
assert.equal(c.zone(c.sunLongitude(m),2026).name,'Wężownik');
assert.ok(c.nextIngress(new Date('2026-11-14T12:00:00Z')).next.name==='Skorpion');
assert.ok(Math.abs(c.eclipticFromEq(0,0).lon)<1e-8);
assert.ok(Math.abs(c.eclipticFromEq(0,0).lat)<1e-8);
assert.ok(Math.abs(c.eclipticFromVector([0,1,0]).lon-90)<1e-8);
for(let y=2024;y<=2040;y+=4){for(const sector of c.sectors(y)){
 const mid=c.nearMidDate(y,sector.id);
 assert.ok(mid&&mid.getUTCFullYear()===y,`${y} ${sector.id} midpoint valid`);
 assert.equal(c.zone(c.sunLongitude(mid),y).id,sector.id,`${y} ${sector.id} midpoint hits area`);
}}
console.log('PASS: ATLAS SOLARIS 25.0 core: 13 constellations, 12 signs, Sun, ingress, coordinate projection and dates.');