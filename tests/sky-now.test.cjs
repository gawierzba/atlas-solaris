/* ATLAS SOLARIS — NIEBO NAD TOBĄ.
   Node 22, no external dependencies. Checks JPL orbital geometry, sky map,
   mobile layout, observational limits, and preservation of Stage 18. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),
 vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const e={window:{},document:{readyState:'loading',addEventListener(){}}};
vm.createContext(e);
vm.runInContext(read('portal/night18-story.js'),e);
vm.runInContext(read('portal/sky-now-core.js'),e);
const core=e.window.ATLAS_SKY_NOW_CORE, stage=e.window.ATLAS_NO18_PHYSICS;
const at=iso=>vm.runInContext('new Date('+JSON.stringify(iso)+')',e);
function near(a,b,tol=1e-6){assert.ok(Math.abs(a-b)<=tol,'Expected '+a+' near '+b+', tolerance '+tol);}
function angular(a,b){
 let ra=(a.raDeg-b.raDeg)*Math.PI/180;
 let d1=a.decDeg*Math.PI/180,d2=b.decDeg*Math.PI/180;
 return Math.acos(Math.max(-1,Math.min(1,Math.sin(d1)*Math.sin(d2)+Math.cos(d1)*Math.cos(d2)*Math.cos(ra))))*180/Math.PI;
}
const home=read('index.html'),mapHtml=read('niebo/index.html'),stage18=read('etapy/18/index.html');
test('Original stage18 spherical astronomical core is reused rather than duplicated',()=>{
 assert.ok(core&&stage);
 assert.equal(core.position,stage.position);
 assert.equal(core.gmstDegrees,stage.gmstDegrees);
 assert.equal(core.sunAltitudeDegrees,stage.sunAltitudeDegrees);
 near(core.julianDay(at('2000-01-01T12:00:00Z')),2451545,1e-9);
});
test('NASA/JPL approximate Kepler elements reproduce terrestrial orbital geometry',()=>{
 const t=at('2026-11-22T18:00:00Z');
 const earth=core.heliocentric('earth',t);
 const venus=core.heliocentric('venus',t);
 const saturn=core.heliocentric('saturn',t);
 assert.ok(Array.isArray(earth)&&earth.length===3);
 assert.ok(Math.hypot(...earth)>.98&&Math.hypot(...earth)<1.02,'Earth 1 AU orbit');
 assert.ok(Math.hypot(...venus)>.71&&Math.hypot(...venus)<.74,'Venus heliocentric orbit');
 assert.ok(Math.hypot(...saturn)>9&&Math.hypot(...saturn)<11,'Saturn heliocentric orbit');
 assert.equal(core.heliocentric('invalid',t),null);
});
test('Solar declination stays consistent with original stage18 solar approximation',()=>{
 for(const iso of ['2026-03-20T12:00:00Z','2026-06-21T12:00:00Z','2026-09-23T12:00:00Z','2026-12-21T12:00:00Z']){
  const t=at(iso),sun=core.solarSystemEquatorial('sun',t);
  const earlier=stage.sunEquatorial(t);
  assert.ok(angular(sun,earlier)<1.6,'JPL vs Stage18 '+iso);
 }
 const summer=core.solarSystemEquatorial('sun',at('2026-06-21T12:00:00Z'));
 const winter=core.solarSystemEquatorial('sun',at('2026-12-21T12:00:00Z'));
 assert.ok(summer.decDeg>22.5&&summer.decDeg<24.4);
 assert.ok(winter.decDeg< -22.5&&winter.decDeg> -24.4);
});
test('Planet right ascensions/declinations finite throughout supported date range',()=>{
 for(const iso of ['2000-01-01T12:00:00Z','2026-11-22T18:00:00Z','2049-12-31T12:00:00Z']){
  const t=at(iso);
  for(const id of ['mercury','venus','mars','jupiter','saturn','uranus','neptune','sun','moon']){
   const o=core.solarSystemEquatorial(id,t);
   assert.ok(o&&Number.isFinite(o.raDeg)&&Number.isFinite(o.decDeg),id+' '+iso);
   assert.ok(o.raDeg>=0&&o.raDeg<360,id+' RA');
   assert.ok(o.decDeg>=-90&&o.decDeg<=90,id+' Dec');
  }
 }
});
test('Moon phase varies between nearly new and full over one synodic month',()=>{
 const values=[];
 for(let i=0;i<=30;i++){
  let t=at(new Date(Date.UTC(2026,10,1+i,12)).toISOString());
  values.push(core.phaseFraction(t));
 }
 assert.ok(Math.min(...values)<.045,'A new moon occurs');
 assert.ok(Math.max(...values)>.96,'A full moon occurs');
});
test('Azimuth map geometry: Polaris follows latitude and southern targets remain below horizon',()=>{
 const scene=core.locate(at('2026-11-22T18:00:00Z'),54.35,18.65);
 assert.ok(scene.length>52,'Named star catalogue');
 const polaris=scene.find(x=>x.id==='polaris');
 const carina=scene.find(x=>x.id==='carina');
 assert.ok(polaris.altitudeDeg>53&&polaris.altitudeDeg<56);
 assert.ok(polaris.azimuthDeg<3||polaris.azimuthDeg>357);
 assert.ok(carina.altitudeDeg<0,'Southern nebula below horizon of Gdańsk');
 assert.ok(scene.some(x=>x.id==='moon'));
 assert.equal(core.locate(at('2026-11-22T12:00:00Z'),96,18),null);
});
test('Geometric Sun rising/setting in northern summer and polar day',()=>{
 const t=at('2026-06-21T12:00:00Z');
 const r=core.riseSet('sun',t,54.35,18.65);
 assert.ok(r&&r.rise&&r.set,'Sun rises and sets in Gdańsk');
 assert.ok(r.rise.getUTCHours()>=1&&r.rise.getUTCHours()<=4);
 assert.ok(r.set.getUTCHours()>=18&&r.set.getUTCHours()<=21);
 const polar=core.riseSet('sun',t,80,18);
 assert.equal(polar.rise,null);
 assert.equal(polar.set,null);
});
test('Earth-Moon and planetary rise/set are approximate, dates are local-device based',()=>{
 const t=at('2026-11-22T15:00:00Z');
 for(const p of core.objects){
  const r=core.riseSet(p.id,t,52.23,21.01);
  assert.ok(r&&Object.hasOwn(r,'rise')&&Object.hasOwn(r,'set'),p.id);
  for(const key of ['rise','set'])if(r[key])assert.equal(r[key].getDate(),t.getDate(),p.id);
 }
 assert.equal(core.riseSet('moon',t,94,21),null);
 assert.equal(core.riseSet('invalid',t,50,21),null);
});
test('Standalone new sky page loads existing science first, with no remote JS/required sign-in',()=>{
 const scripts=[...mapHtml.matchAll(/<script src="([^"]+)"/g)].map(v=>v[1]);
 assert.deepEqual(scripts,['../portal/night18-story.js?v=18.1','../portal/sky-now-core.js?v=1.0','../portal/sky-now-ui.js?v=1.0']);
 for(const file of ['portal/sky-now-core.js','portal/sky-now-ui.js','portal/sky-now.css'])
  assert.ok(fs.statSync(path.join(root,file)).size>500, file);
 for(const id of ['skyCanvas','skyPlace','skyLat','skyLon','skyDate','skyTime','skySlider','skyRed','skyNow','skyEarlier','skyLater','skyBodiesList','skyStarList','skyMoonPhase','skySelectedHeading'])
  assert.ok(mapHtml.includes('id="'+id+'"'),id);
 assert.match(mapHtml,/NASA\/JPL/);
 assert.match(mapHtml,/lokalnej strefie urządzenia/);
 assert.match(mapHtml,/nie zna ani nie zapisuje Twojej pozycji/);
 assert.doesNotMatch(mapHtml,/<script src="https?:\/\//);
});
test('Mobile responsive layout, accessible controls, daylight and red-only mode',()=>{
 const css=read('portal/sky-now.css'),js=read('portal/sky-now-ui.js');
 for(const bp of ['930px','700px','380px'])assert.ok(css.includes('max-width:'+bp),'Missing breakpoint '+bp);
 assert.match(css,/body\.sky-red-mode/);
 assert.match(css,/#skyCanvas/);
 assert.match(css,/grid-template-columns:1fr/);
 assert.match(mapHtml,/aria-pressed="false"/);
 assert.match(mapHtml,/aria-label="Interaktywna mapa azymutalna/);
 assert.match(js,/canvas\.addEventListener\('keydown'/);
 assert.match(read('portal/sky-now-core.js'),/solarSystemEquatorial/);
 assert.match(js,/\.riseSet\(/);
 assert.match(js,/toLocaleTimeString\('pl-PL'/);
 assert.doesNotMatch(js,/geolocation\.|localStorage|fetch\(|WebGL|THREE\./);
});
test('Homepage, stage 18 and entire original observatory are intact and linked',()=>{
 assert.match(home,/portal\/sky-now-home\.css\?v=1\.0/);
 assert.match(home,/portal\/sky-now-home\.js\?v=1\.0/);
 const banner=read('portal/sky-now-home.js');
 assert.match(banner,/href="niebo\/"/);
 assert.match(banner,/mobilePanel/);
 assert.match(stage18,/href="\.\.\/\.\.\/niebo\/"/);
 assert.match(stage18,/id="no18SkyBridge"/);
 assert.match(stage18,/id="no18Lab"/);
 assert.match(stage18,/data-src="\.\.\/\.\.\/atlas\.html\?portal=observatory"/);
 assert.equal((stage18.match(/<figure\b/g)||[]).length,6,'Do not delete NASA/ESA image captions');
 assert.match(stage18,/portal\/night18-story\.js\?v=18\.1/);
 assert.ok(fs.existsSync(path.join(root,'etapy/18/index.html')));
 assert.ok(fs.existsSync(path.join(root,'etapy/05/index.html')));
});
