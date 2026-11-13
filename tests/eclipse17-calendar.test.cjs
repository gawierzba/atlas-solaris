/**
 * ATLAS SOLARIS 17.1 automated calendar and grazing lunar-shadow regression.
 * Run: node tests/eclipse17-calendar.test.cjs
 */
const assert=require('node:assert/strict');
const {createEngine}=require('../js/eclipse-engine.js');
const {createFinder}=require('../js/eclipse17-calendar-search.js');
const AU=149597870.7;
const jd=date=>Date.parse(date)/86400000+2440587.5;
async function main(){
 const fixed={sun:[0,0,0],earth:[1,0,0],moon:[1+380000/AU,9950/AU,0]};
 const ideal=createEngine({getPositions:()=>fixed,lunarShadowScale:1}).at(jd('2027-07-18T12:00:00Z'));
 const improved=createEngine({getPositions:()=>fixed}).at(jd('2027-07-18T12:00:00Z'));
 assert.equal(ideal.type,'none','geometrically grazing shadow does not hit without correction');
 assert.equal(improved.type,'lunar','2% atmosphere enlargement catches grazing lunar shadow');
 assert.equal(improved.subtype,'penumbral');
 console.log('OK: grazing penumbral lunar eclipse');
 const origin=jd('2027-02-06T12:00:00Z');
 const moon=jdNow=>{
  const angle=(jdNow-origin)*2*Math.PI/29.53059, r=380000/AU;
  return {sun:[0,0,0],earth:[1,0,0],moon:[1-r*Math.cos(angle),-r*Math.sin(angle),0]};
 };
 const finder=createFinder(createEngine({getPositions:moon}));
 const feb=await finder.search({year:2027,month:2});
 assert.equal(feb.events.length,2,'synthetic February must contain new + full Moon events');
 assert.equal(feb.events[0].type,'solar');
 assert.equal(feb.events[1].type,'lunar');
 assert.ok(Math.abs(feb.events[0].approximatePeakJD-origin)<.01);
 console.log('OK: automatic February search and peak refinement');
 const solar=await finder.search({year:2027,month:2,type:'solar'});
 assert.equal(solar.events.length,1);assert.equal(solar.events[0].type,'solar');
 const cancelled=await finder.search({year:2027,month:2,isCancelled:()=>true});
 assert.equal(cancelled,null);
 await assert.rejects(()=>finder.search({year:2041}),RangeError);
 await assert.rejects(()=>finder.search({year:2027,month:13}),RangeError);
 console.log('OK: filter, cancellation, invalid range checks');
}
main().catch(err=>{console.error(err);process.exitCode=1;});
