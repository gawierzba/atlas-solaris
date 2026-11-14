/**
 * ATLAS SOLARIS 23 — quadrupole binary black-hole wave physics and UI regression.
 * Node.js 22; no npm, network or graphical environment required.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const F=require('../js/merger23-core.js');
const close=(a,b,t=1e-10)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),
 'Expected '+a+' ≈ '+b);
const g=F.PRESETS.gw150914,m=F.model(g);
close(m.m1,36.2);close(m.m2,29.1);close(m.mf,62.3);
close(m.energySolar,3.0);close(m.total,65.3);
close(m.chirp,F.chirpMass(36.2,29.1));
assert.ok(m.chirp>28&&m.chirp<28.5);
assert.ok(m.eta>0&&m.eta<=.25);
assert.ok(m.seconds>.19&&m.seconds<.26);
assert.ok(m.rStart>m.rMerge);
assert.ok(m.fStart>30&&m.fStart<35);
assert.ok(m.fMerge>75&&m.fMerge<100);
assert.ok(m.ringHz>260&&m.ringHz<280);
assert.ok(m.ringTau>.003&&m.ringTau<.005);
assert.ok(m.energyJ>5e47&&m.energyJ<6e47);
assert.ok(m.waveScale/m.rMerge>1e-22&&m.waveScale/m.rMerge<1e-20);
assert.throws(()=>F.model({...g,m2:-1}),RangeError);
assert.throws(()=>F.model({...g,mf:66}),RangeError);
assert.throws(()=>F.model({...g,distance:0}),RangeError);
assert.throws(()=>F.chirpMass(0,50),RangeError);
assert.throws(()=>F.sample(m,NaN),RangeError);
console.log('OK: GW150914 masses, 3-solar-mass radiated energy, chirp mass, time and ringdown scales.');

const begin=F.inspiral(m,-m.seconds),mid=F.inspiral(m,-m.seconds/2);
const mergeLeft=F.inspiral(m,-1e-11),mergeRight=F.ringdown(m,0);
close(begin.r,m.rStart);close(begin.freq,m.fStart);
assert.ok(mid.r<begin.r&&mid.r>m.rMerge);
assert.ok(mid.freq>begin.freq&&mid.freq<m.fMerge);
assert.ok(mid.amplitude>begin.amplitude);
close(mergeLeft.r,m.rMerge,2e-7);
close(mergeRight.amplitude,mergeLeft.amplitude,2e-8);
assert.ok(Math.abs(mergeRight.hp-mergeLeft.hp)<1e-18,'Wave h+ must be continuous in merger');
assert.ok(Math.abs(mergeRight.hx-mergeLeft.hx)<1e-18,'Wave hx must be continuous in merger');
const after=F.ringdown(m,3*m.ringTau);
close(after.amplitude,mergeRight.amplitude*Math.exp(-3),1e-24);
assert.ok(Math.abs(after.hp)<Math.abs(mergeRight.amplitude));
assert.ok(F.power(m,m.rMerge)>F.power(m,m.rStart));
assert.ok(F.strainAtDistance(m,840)<F.strainAtDistance(m,420));
close(F.strainAtDistance(m,840)*2,F.strainAtDistance(m,420),1e-25);
console.log('OK: quadrupole r^4 law, frequency/amplitude rise, phase continuity and exponential ringdown.');

for(const config of Object.values(F.PRESETS)){
 const model=F.model(config),wave=F.waveform(model,1600);
 assert.equal(wave.length,1600);
 assert.ok(wave[0].t<0&&wave.at(-1).t>0);
 assert.ok(wave.every((x,i)=>Number.isFinite(x.hp)&&Number.isFinite(x.hx)&&
  Number.isFinite(x.amplitude)&&(!i||x.t>wave[i-1].t)));
 assert.equal(F.sampleAtProgress(model,0).stage,'inspiral');
 assert.equal(F.sampleAtProgress(model,.79999).stage,'inspiral');
 assert.equal(F.sampleAtProgress(model,.8).stage,'ringdown');
 assert.equal(F.sampleAtProgress(model,1).stage,'ringdown');
 const start=F.sampleAtProgress(model,0),end=F.sampleAtProgress(model,1);
 assert.ok(start.distanceKm>0&&end.distanceKm===0);
 const coord=start.positions,comX=coord.one.x*model.m1+coord.two.x*model.m2;
 const comY=coord.one.y*model.m1+coord.two.y*model.m2;
 close(comX,0,1e-7);close(comY,0,1e-7);
}
const alt=F.model({...g,m1:72.4,m2:58.2,mf:124.6,lowerHz:16});
assert.ok(alt.seconds>m.seconds*1.9&&alt.seconds<m.seconds*2.1);
assert.ok(alt.ringHz<m.ringHz);
console.log('OK: COM, mass/distance scaling, all presets, ringdown boundaries and waveform samples.');

const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const ui=fs.readFileSync(path.join(__dirname,'..','js','merger23-ui.js'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'..','css','merger23.css'),'utf8');
for(const id of [
 'merger23Dialog','merger23Canvas','merger23Waveform',
 'merger23Preset','merger23Mass1','merger23Mass2',
 'merger23Distance','merger23Tilt','merger23Play',
 'merger23Replay','merger23Progress','merger23Tempo',
 'merger23Sound','merger23Ripples','merger23Traces',
 'merger23Lost','merger23Strain','merger23RingFreq','merger23EnergyJ',
 'openMerger23Side','openMerger23Top'
])assert.ok(html.includes('id="'+id+'"'),'Missing 23 UI control '+id);
for(const id of [...new Set([...ui.matchAll(/\$\('([^']+)'\)/g)].map(x=>x[1]))])
 assert.ok(html.includes('id="'+id+'"'),'Missing referenced UI control '+id);
assert.ok(html.includes('href="css/merger23.css"'));
assert.ok(css.includes('.merger23-dialog'));
assert.equal((html.match(/<dialog\b/g)||[]).length,(html.match(/<\/dialog>/g)||[]).length);
const scripts=['merger23-core.js','merger23-ui.js'].map(x=>html.indexOf('src="js/'+x+'"'));
assert.ok(scripts[0]>=0&&scripts[1]>scripts[0]);
console.log('OK: complete stage 23 modal, controls, required styles and correct script order.');

// DOM+Canvas2D mocked smoke test, ensuring actual UI can launch and render.
const ctx=new Proxy({},{
 get(t,k){
  if(k==='createRadialGradient'||k==='createLinearGradient')
   return (...args)=>({addColorStop(){}});
  if(typeof k==='symbol')return undefined;
  return k in t?t[k]:()=>{};
 },set(t,k,v){t[k]=v;return true;}
});
const elements=new Map();
function mock(id){
 return {
  id,style:{},events:{},open:false,checked:true,hidden:false,width:1280,height:740,
  value:id==='merger23Preset'?'gw150914':id==='merger23Tilt'?'35':
   id==='merger23Tempo'?'1':id==='merger23Distance'?'420':
   id==='merger23Mass1'?'36.2':id==='merger23Mass2'?'29.1':'',
  textContent:'',max:'1000',min:'0',step:'1',
  addEventListener(name,fn){this.events[name]=fn;},
  showModal(){this.open=true;},close(){this.open=false;},
  getBoundingClientRect(){return id==='merger23Waveform'?
   {width:880,height:200,left:0,top:0}:
   {width:880,height:490,left:0,top:0};},
  getContext(type){assert.equal(type,'2d');return ctx;},
  setPointerCapture(){}
 };
}
const document={
 readyState:'complete',hidden:false,
 getElementById(id){if(!elements.has(id))elements.set(id,mock(id));return elements.get(id);},
 addEventListener(){}
};
const windowMock={document,devicePixelRatio:1,addEventListener(){},
 ATLAS_MERGER23_CORE:F,ATLAS_MAIN_API:{getPlaying:()=>false,setPlaying(){}}
};
vm.runInNewContext(ui,{window:windowMock,document,console,
 performance:{now:()=>4000},requestAnimationFrame:()=>1,cancelAnimationFrame(){}},{timeout:4500});
const app=windowMock.ATLAS_MERGER23;
assert.ok(app);
app.open();
assert.equal(document.getElementById('merger23Dialog').open,true);
assert.equal(app.getState().stage,'inspiral');
assert.ok(document.getElementById('merger23Lost').textContent.includes('M☉'));
app.setProgress(.82);app.renderNow();assert.equal(app.getState().stage,'ringdown');
app.selectPreset('super');assert.equal(app.getState().preset,'super');
app.selectPreset('gw150914');
document.getElementById('merger23Play').events.click();assert.equal(app.getState().playing,true);
document.getElementById('merger23Play').events.click();assert.equal(app.getState().playing,false);
const progress=document.getElementById('merger23Progress');
progress.value='670';progress.events.input({target:progress});
assert.ok(app.getState().progress>.66);
document.getElementById('merger23Close').events.click();
assert.equal(document.getElementById('merger23Dialog').open,false);
console.log('OK: simulated DOM+Canvas2D runtime, Play/Pause, masses, waveform, presets and dialog closure.');
