/**
 * ATLAS SOLARIS 21.0 — timelike Kerr probe and interactive mission regressions.
 * No dependencies other than Node.js 22, including canvas DOM smoke.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const k=require('../js/blackhole201-core.js'),p=require('../js/probe21-core.js');
const bh=require('../js/blackhole20-core.js');
const close=(a,b,t=1e-7)=>assert.ok(Math.abs(a-b)<t,
 'Expected '+a+' ≈ '+b);
const base=p.release({spin:.92,r0:5.2,radial:-.25,tangential:-.40});
assert.equal(base.horizon,k.horizons(.92).outer);
assert.ok(base.E>0&&base.L<0);
close(base.gamma,1/Math.sqrt(1-.25**2-.4**2));
const initial=p.potential(base,base.r0);
close(initial.R/base.r0**4,base.state[1]**2,1e-10);
const derivatives=p.rates(base,base.state);
close(derivatives[0],base.state[1]);
close(derivatives[2],base.initialPhiRate);
close(derivatives[3],base.initialTRate);
assert.ok(derivatives[3]>1);
assert.throws(()=>p.release({spin:1,r0:8,radial:0,tangential:0}),RangeError);
assert.throws(()=>p.release({spin:.92,r0:1.2,radial:0,tangential:0}),RangeError);
assert.throws(()=>p.release({spin:.92,r0:5,radial:.85,tangential:.7}),RangeError);
console.log('OK: ZAMO release tetrad, E/L constants, timelike radial constraint, physical time rates.');

const plunge=p.integrate(base,{maxTau:120,step:.035});
assert.equal(plunge.reason,'horizon');
assert.ok(plunge.crossedErgo,'Trajectory passes equatorial static-limit r=2');
assert.ok(plunge.periapsis<1.42&&plunge.periapsis>base.horizon);
assert.ok(plunge.properElapsed>6&&plunge.properElapsed<9);
assert.ok(plunge.distantElapsed>plunge.properElapsed*2);
assert.ok(plunge.maxConstraintError<.001);
for(let i=1;i<plunge.points.length;i++){
 assert.ok(plunge.points[i].tau>plunge.points[i-1].tau);
 assert.ok(plunge.points[i].t>=plunge.points[i-1].t);
 assert.ok(plunge.points[i].r>base.horizon);
}
const pHalf=p.interpolate(plunge,plunge.properElapsed*.5);
assert.ok(pHalf.tau>0&&pHalf.tau<plunge.properElapsed);
assert.ok(pHalf.r<base.r0);
close(p.interpolate(plunge,0).r,base.r0);
close(p.interpolate(plunge,1e5).r,plunge.points.at(-1).r);
console.log('OK: stable RK4 free fall across ergosphere, accurate clocks, constraint and horizon cutoff.');

const paradox=p.release({spin:.92,r0:1.8,radial:-.12,tangential:-.70});
assert.ok(paradox.r0<2&&paradox.r0>paradox.horizon);
assert.ok(paradox.tangential<0&&paradox.L<0);
assert.ok(paradox.E<0,'Negative conserved Killing energy is possible inside ergosphere');
assert.ok(paradox.initialPhiRate>0,'Frame dragging forces positive coordinate angular direction');
const paradoxFlight=p.integrate(paradox,{maxTau:8,step:.025});
assert.ok(paradoxFlight.points.every(s=>s.angularRate>0));
assert.equal(paradoxFlight.reason,'horizon');
const zero=p.release({spin:0,r0:5.2,radial:-.25,tangential:-.40});
const flat=p.integrate(zero,{maxTau:120,step:.035});
assert.ok(flat.points.at(-1).phi<0);
assert.ok(plunge.points.at(-1).phi>0);
assert.notEqual(flat.points.at(-1).phi,plunge.points.at(-1).phi);
console.log('OK: negative local orbital speed vs positive remote azimuth, negative E, spin-dependent trajectories.');

const circularSpeed=p.circularVelocity(.92,6.5,1);
assert.ok(circularSpeed>0&&circularSpeed<1);
const circle=p.release({spin:.92,r0:6.5,radial:0,tangential:circularSpeed});
const circ=p.integrate(circle,{maxTau:120,step:.045});
assert.equal(circ.reason,'duration');
assert.ok(Math.abs(circ.points.at(-1).r-6.5)<.001,'Kerr circular orbit without thrust');
assert.ok(circ.maxConstraintError<1e-5);
assert.ok(circ.points.at(-1).phi>4);
assert.throws(()=>p.circularVelocity(.92,2,1),RangeError);
const rgTime=bh.TG_S*4e6;
close(p.physicalTime(4e6,5,bh.TG_S),rgTime*5);
console.log('OK: Kerr ISCO-admissible exact circular orbit, mass-based proper and distant time scaling.');

const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const ui=fs.readFileSync(path.join(__dirname,'..','js','probe21-ui.js'),'utf8');
for(const id of ['probe21Dialog','probe21Canvas','probe21Plot','probe21Preset',
 'probe21Spin','probe21StartR','probe21Radial','probe21Tangential',
 'probe21Play','probe21Reset','probe21Close','probe21Ghost','probe21Progress',
 'probe21Tau','probe21FarTime','probe21Angular','probe21Constraint',
 'probe21ErgoAlert','openProbe21Top','openProbe21Side']){
 assert.ok(html.includes('id="'+id+'"'),'HTML element missing: '+id);
}
assert.equal((html.match(/<dialog\b/g)||[]).length,(html.match(/<\/dialog>/g)||[]).length);
const scripts=['js/blackhole201-core.js','js/probe21-core.js','js/probe21-ui.js']
 .map(x=>html.indexOf('src="'+x+'"'));
assert.ok(scripts.every((v,i)=>v>=0&&(!i||v>scripts[i-1])));
assert.ok(html.includes('css/probe21.css'));
for(const id of [...new Set([...ui.matchAll(/\$\('([^']+)'\)/g)].map(m=>m[1]))]){
 assert.ok(html.includes('id="'+id+'"'),'Referenced UI element absent: '+id);
}
console.log('OK: main app navigation, complete controls and script order.');

const ctx=new Proxy({},{
 get(t,k){
  if(k==='createRadialGradient'||k==='createLinearGradient')
   return ()=>({addColorStop(){}});
  if(k in t)return t[k];
  if(typeof k==='symbol')return undefined;
  return ()=>{};
 },set(t,k,v){t[k]=v;return true;}
});
const nodes=new Map();
function mock(id){
 const el={id,events:{},value:id==='probe21Spin'?'92':id==='probe21StartR'?'180':
  id==='probe21Radial'?'-12':id==='probe21Tangential'?'-70':'',
  checked:true,disabled:false,hidden:false,width:1280,height:720,
  open:false,textContent:'',min:'0',max:'1000',
  addEventListener(n,fn){this.events[n]=fn;},
  getBoundingClientRect(){return id==='probe21Plot'?
   {width:790,height:190,left:0,top:0}:
   {width:920,height:510,left:0,top:0};},
  getContext(type){assert.equal(type,'2d');return ctx;},
  showModal(){this.open=true;},close(){this.open=false;},
  setPointerCapture(){},setAttribute(){}
 };
 return el;
}
const document={readyState:'complete',hidden:false,
 getElementById(id){if(!nodes.has(id))nodes.set(id,mock(id));return nodes.get(id);},
 addEventListener(){},createElement(){return mock('canvas');}};
const windowMock={document,devicePixelRatio:1,innerWidth:1200,
 addEventListener(){},ATLAS_PROBE21_CORE:p,
 ATLAS_KERR201_CORE:k,ATLAS_BLACKHOLE20_CORE:bh,
 ATLAS_MAIN_API:{getPlaying:()=>false,setPlaying(){}}
};
const sandbox={window:windowMock,document,console,
 requestAnimationFrame(){return 1;},cancelAnimationFrame(){},
 performance:{now:()=>1200}};
vm.runInNewContext(ui,sandbox,{timeout:4500});
const app=windowMock.ATLAS_PROBE21;
assert.ok(app,'Probe 21 runtime export missing');
assert.equal(app.getState().preset,'ergo');
app.open();
assert.equal(document.getElementById('probe21Dialog').open,true);
assert.equal(app.getState().reason,'horizon');
assert.equal(document.getElementById('probe21ErgoAlert').hidden,false);
assert.ok(document.getElementById('probe21Tau').textContent);
app.selectPreset('orbit');
assert.equal(app.getState().reason,'duration');
assert.equal(app.getState().hasGhost,true);
app.selectPreset('infall');
assert.equal(app.getState().reason,'horizon');
const slider=document.getElementById('probe21Progress');
slider.value='500';slider.events.input({target:slider});
assert.ok(app.getState().tau>0);
document.getElementById('probe21Play').events.click();
assert.equal(app.getState().playing,true);
document.getElementById('probe21Play').events.click();
assert.equal(app.getState().playing,false);
app.close();
assert.equal(document.getElementById('probe21Dialog').open,false);
console.log('OK: full runtime smoke, canvas rendering, preset change, scrubbing, playback and modal close.');
