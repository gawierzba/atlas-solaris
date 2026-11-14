'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const fs=require('node:fs');
const path=require('node:path');
const L=require('../portal/lens31-core.js');
const near=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<tol, String(a)+' != '+String(b));
test('Promień Einsteina: zależność od masy sqrt(M)',()=>{
 const r=L.einsteinArcseconds(1e12,.8,2);
 assert.ok(r>2&&r<3);
 near(L.einsteinArcseconds(4e12,.8,2),r*2);
});
test('Geometria soczewki: D_l < D_s',()=>{
 assert.throws(()=>L.einsteinArcseconds(1e12,2,2),RangeError);
 assert.throws(()=>L.einsteinArcseconds(-1,.8,2),RangeError);
 assert.throws(()=>L.einsteinArcseconds(1,.8,0),RangeError);
});
test('Idealne ustawienie daje pierścień Einsteina o promieniu 1 theta_E',()=>{
 const r=L.images(0,0);assert.equal(r.ring,true);near(r.radius,1);
 assert.equal(r.magnification,Infinity);near(r.separation,2);
});
test('Dwa obrazy dla beta = 1 theta_E: złoty stosunek',()=>{
 const r=L.images(1,0);assert.equal(r.ring,false);
 near(r.primary.x,(1+Math.sqrt(5))/2);
 near(r.secondary.x,(1-Math.sqrt(5))/2);
 near(r.separation,Math.sqrt(5));
 near(r.magnification,3/Math.sqrt(5));
 assert.equal(r.secondary.parity,-1);
 near(r.primary.absoluteMagnification+r.secondary.absoluteMagnification,r.magnification);
});
test('Odwzorowanie odwrotne obrazów do jednego źródła',()=>{
 for(const [x,y] of [[.3,.4],[1.4,0],[-.5,1.2]]){
  const r=L.images(x,y);
  for(const im of [r.primary,r.secondary]){
   const source=L.mapImageToSource(im.x,im.y);
   near(source.x,x,1e-8);near(source.y,y,1e-8);
  }
 }
});
test('Powiększenie maleje do 1 daleko od osi',()=>{
 assert.ok(L.lightcurve(.2,.1)>L.lightcurve(2,.1));
 assert.ok(L.lightcurve(20,0)>1);
 assert.ok(L.lightcurve(20,0)<1.001);
});
test('Etap 31 figuruje w obu bazach tras bez nadpisania 27',()=>{
 const json=JSON.parse(fs.readFileSync(path.join(__dirname,'../portal/catalog.json'),'utf8'));
 const js=fs.readFileSync(path.join(__dirname,'../portal/data.js'),'utf8');
 assert.equal(json.version,'31.0');
 assert.equal(json.stages['31'].path,'etapy/31/');
 assert.equal(json.stages['27'],undefined);
 assert.ok(js.includes('soczewkowanie-grawitacyjne'));
});
