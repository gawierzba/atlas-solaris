/**
 * ATLAS SOLARIS 24.0 — optical Michelson physics, independent white strain,
 * GW150914 delay, known-template matched filter and real UI DOM smoke.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const GW=require('../js/merger23-core.js');
const C=require('../js/ligo24-core.js');
const close=(a,b,rtol=1e-8)=>assert.ok(Math.abs(a-b)<=rtol*Math.max(Math.abs(b),1e-30),
 'Expected '+a+' ≈ '+b);
close(C.ARM_LENGTH,4000);close(C.LASER_WAVELENGTH,1064e-9);
close(C.opticalResponse(0).deltaX,0);close(C.opticalResponse(0).phase,0);
close(C.opticalResponse(0).darkPort,0);
const optical=C.opticalResponse(1e-21);
close(optical.deltaX,2e-18);close(optical.deltaY,-2e-18);
close(optical.differential,4e-18);
close(optical.phase,4*Math.PI*4e-18/1064e-9);
assert.ok(optical.darkPort>5e-22&&optical.darkPort<6e-22);
close(optical.roundTripMicroseconds,26.685127615852164);
const inverse=C.opticalResponse(-1e-21);
close(inverse.deltaX,-optical.deltaX);
close(inverse.phase,-optical.phase);
close(inverse.darkPort,optical.darkPort);
assert.throws(()=>C.opticalResponse(NaN),RangeError);
assert.throws(()=>C.modelFor(-2,30,420),RangeError);
assert.throws(()=>C.modelFor(36,29,0),RangeError);
console.log('OK: 4 km Michelson response, ±2e−18m mirror changes, 4e−18m arm difference and 1064nm phase.');

const data=C.generate({scenario:'discovery',seed:240914});
const repeat=C.generate({scenario:'discovery',seed:240914});
assert.equal(data.N,6144);
assert.equal(data.l1.length,data.N);
assert.equal(data.h1.length,data.N);
assert.equal(data.template.values.length,1024);
assert.equal(data.model.m1,36.2);
assert.equal(data.model.m2,29.1);
assert.ok(data.noiseSigma>8e-22&&data.noiseSigma<11e-22);
assert.ok(data.l1.every(Number.isFinite)&&data.h1.every(Number.isFinite));
for(let i of [0,52,400,1300,2100,3800,6143]){
 assert.equal(data.l1[i],repeat.l1[i]);
 assert.equal(data.h1[i],repeat.h1[i]);
 assert.equal(data.cleanL1[i],repeat.cleanL1[i]);
}
assert.ok(Math.abs(data.expectedTimeH1-data.expectedTimeL1-.0069)<.00025);
assert.ok(data.expectedTimeH1>data.expectedTimeL1);
const noiseOnly=C.generate({scenario:'null',seed:240914});
assert.ok(noiseOnly.cleanL1.every(x=>x===0));
assert.ok(noiseOnly.cleanH1.every(x=>x===0));
for(let i of [0,20,500,1200,3400,6143]){
 assert.equal(noiseOnly.l1[i],data.l1[i]-data.cleanL1[i]);
 assert.equal(noiseOnly.h1[i],data.h1[i]-data.cleanH1[i]);
}
console.log('OK: reproducible independently sampled noise, time delay and hidden additive GW signal.');

for(const scenario of ['discovery','loud','weak','null']){
 const set=C.generate({scenario,seed:240914}),out=C.matches(set),b=out.best;
 assert.equal(out.times.length,out.rhoL1.length);
 assert.equal(out.times.length,out.rhoH1.length);
 assert.ok(out.times.length>1000);
 assert.ok(Number.isFinite(b.networkSNR)&&b.networkSNR>0);
 assert.ok(Math.abs(b.delayMs)<=10.1);
 assert.equal(b.isSimulated,true);
 assert.equal(b.found,scenario==='discovery'||scenario==='loud',
  'Expected reliable simulated detection: '+scenario);
 if(b.found){
  assert.ok(Math.abs(b.timeL1-set.expectedTimeL1)<.003);
  assert.ok(Math.abs(b.timeH1-set.expectedTimeH1)<.004);
  assert.ok(b.snrL1>=5&&b.snrH1>=5&&b.networkSNR>=9);
 }
}
const p=C.matches(data).best;
assert.ok(p.networkSNR>18&&p.networkSNR<28);
assert.ok(Math.abs(p.delayMs-6.9)<1.5);
for(const seed of [444,2024,991914,12341]){
 const nullResult=C.matches(C.generate({scenario:'null',seed})).best;
 assert.equal(nullResult.found,false,'Noise-only run must not create a GW detection');
}
const farther=C.generate({scenario:'discovery',distance:840});
close(farther.cleanL1[farther.mergeIndex],
      data.cleanL1[data.mergeIndex]/2,1e-6);
assert.throws(()=>C.generate({noiseLevel:0}),RangeError);
assert.throws(()=>C.matches(data,{step:0}),RangeError);
console.log('OK: two-site coincidence, ±10ms arrival consistency, SNR and no false triggers on Gaussian-only trials.');

const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const ui=fs.readFileSync(path.join(__dirname,'..','js','ligo24-ui.js'),'utf8');
const style=fs.readFileSync(path.join(__dirname,'..','css','ligo24.css'),'utf8');
for(const id of ['openLigo24Side','openLigo24Top','merger23ToLigo24',
 'ligo24Dialog','ligo24Canvas','ligo24DataPlot','ligo24SNRPlot','ligo24Preset',
 'ligo24Distance','ligo24Noise','ligo24M1','ligo24M2','ligo24Play','ligo24Detect',
 'ligo24Reveal','ligo24NewNoise','ligo24SNRL','ligo24SNRH','ligo24SNRNet',
 'ligo24Verdict','ligo24Strain','ligo24DX','ligo24DY','ligo24DL','ligo24Phase']){
 assert.ok(html.includes('id="'+id+'"'),'HTML missing '+id);
}
for(const id of [...new Set([...ui.matchAll(/\$\('([^']+)'\)/g)].map(x=>x[1]))])
 assert.ok(html.includes('id="'+id+'"'),'UI element referenced but not present '+id);
assert.equal((html.match(/<dialog\b/g)||[]).length,(html.match(/<\/dialog>/g)||[]).length);
assert.ok(html.includes('href="css/ligo24.css"'));
assert.ok(style.includes('.ligo24-dialog'));
const scripts=['merger23-core.js','merger23-ui.js','ligo24-core.js','ligo24-ui.js']
 .map(x=>html.indexOf('src="js/'+x+'"'));
assert.ok(scripts.every((n,i)=>n>=0&&(!i||n>scripts[i-1])));
console.log('OK: new LIGO modal, 23.0 bridge, CSS and four-script order in the production site.');

const ctx=new Proxy({},{
 get(o,k){
  if(k==='createRadialGradient'||k==='createLinearGradient')
   return ()=>({addColorStop(){}});
  if(typeof k==='symbol')return undefined;
  return k in o?o[k]:()=>{};
 },set(o,k,v){o[k]=v;return true;}
});
const map=new Map();
function mock(id){
 return {id,open:false,hidden:false,disabled:false,checked:true,style:{},dataset:{},
  width:1120,height:670,textContent:'',events:{},
  value:id==='ligo24Distance'?'420':id==='ligo24M1'?'36.2':
   id==='ligo24M2'?'29.1':id==='ligo24Noise'?'100':
   id==='ligo24Preset'?'discovery':id==='ligo24Site'?'L1':'',
  addEventListener(n,fn){this.events[n]=fn;},
  showModal(){this.open=true;},close(){this.open=false;},
  getContext(which){assert.equal(which,'2d');return ctx;},
  getBoundingClientRect(){return {left:0,top:0,width:860,
   height:id==='ligo24Canvas'?460:190};},
  setPointerCapture(){},setAttribute(){}
 };
}
const doc={readyState:'complete',hidden:false,
 getElementById(id){if(!map.has(id))map.set(id,mock(id));return map.get(id);},
 addEventListener(){}};
let closed23=false,mainPlaying=false;
const win={document:doc,devicePixelRatio:1,addEventListener(){},
 ATLAS_LIGO24_CORE:C,ATLAS_MERGER23_CORE:GW,
 ATLAS_MAIN_API:{getPlaying(){return mainPlaying;},setPlaying(x){mainPlaying=x;}},
 ATLAS_MERGER23:{
  getState:()=>({model:{m1:30,m2:25,distance:300}}),
  close(){closed23=true;}
 }};
const sandbox={window:win,document:doc,console,
 performance:{now:()=>1400},requestAnimationFrame(){return 1;},cancelAnimationFrame(){}};
vm.runInNewContext(ui,sandbox,{timeout:4500});
const app=win.ATLAS_LIGO24;
assert.ok(app,'Stage 24 runtime API missing');
assert.equal(app.getState().scenario,'discovery');
app.open();
assert.equal(doc.getElementById('ligo24Dialog').open,true);
assert.ok(doc.getElementById('ligo24DX').textContent.includes('m'));
assert.ok(doc.getElementById('ligo24DataPlot').width>250);
const detected=app.detect();
assert.equal(detected.found,true);
assert.equal(app.getState().found,true);
assert.ok(doc.getElementById('ligo24SNRNet').textContent.length>0);
app.reveal();assert.equal(app.getState().revealed,true);
app.chooseScenario('null');assert.equal(app.detect().found,false);
app.chooseScenario('weak');assert.equal(app.detect().found,false);
app.chooseScenario('loud');assert.equal(app.detect().found,true);
doc.getElementById('ligo24Site').events.change({target:{value:'H1'}});
assert.equal(app.getState().site,'H1');
app.setTime(.8);assert.equal(app.getState().time,.8);
doc.getElementById('ligo24Play').events.click();
assert.equal(app.getState().playing,true);
doc.getElementById('ligo24Play').events.click();
assert.equal(app.getState().playing,false);
app.fromMerger23();
assert.ok(closed23);
close(app.getState().model.m1,30);
close(app.getState().model.m2,25);
app.close();
assert.equal(doc.getElementById('ligo24Dialog').open,false);
console.log('OK: DOM+Canvas instrument, four scenarios, blind search/reveal, timeline, site switching and 23→24 mission link.');
