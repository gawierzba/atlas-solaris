/**
 * ATLAS SOLARIS 22.0 — moving-observer tetrad, SR aberration,
 * Kerr photon constants and real mission UI smoke (Node 22, no npm).
 */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const BH=require('../js/blackhole20-core.js');
const K=require('../js/blackhole201-core.js');
const P=require('../js/probe21-core.js');
const C=require('../js/cockpit22-core.js');
const G=require('../js/cockpit22-renderer.js');
const near=(a,b,t=1e-8)=>assert.ok(Math.abs(a-b)<t,'Expected '+a+' ≈ '+b);
const scenarios=[
 {spin:.92,r0:5.2,radial:-.25,tangential:-.40},
 {spin:.92,r0:1.80,radial:-.12,tangential:-.70},
 {spin:-.92,r0:3.4,radial:-.38,tangential:-.55},
 {spin:.92,r0:6.5,radial:0,tangential:P.circularVelocity(.92,6.5,1)}
];
for(const cfg of scenarios){
 const release=P.release(cfg),trajectory=P.integrate(release,{maxTau:50,step:.038});
 for(const ix of [0,Math.floor(trajectory.points.length/3),
  Math.floor(trajectory.points.length*2/3),trajectory.points.length-1]){
  const p=trajectory.points[ix],v=C.localVelocity(release,p);
  assert.ok(v.speed<1,'Physical ZAMO speed must stay subluminal');
  near(v.gamma,K.metric(release.spin,p.r,Math.PI/2).lapse*v.dtPerTau,2e-6);
  near(v.gamma,1/Math.sqrt(1-v.beta2),2e-9);
  near(v.lapse/v.gamma,1/v.dtPerTau,2e-8);
  assert.ok(v.lapse>0&&v.lapse<=1.01);
  assert.ok(Math.abs(v.radial)<1&&Math.abs(v.azimuthal)<1);
 }
 const v=C.localVelocity(release,trajectory.points[0]);
 near(v.radial,cfg.radial,1e-8);
 near(v.azimuthal,cfg.tangential,1e-8);
}
console.log('OK: ship worldline -> ZAMO local velocity, gamma, lapse and both clocks at 16 events.');

near(C.norm([3,4,0]),5);
for(const beta of [0,.2,.8,.98]){
 const v=[beta,0,0],gamma=1/Math.sqrt(1-beta*beta);
 const forward=C.shipToZamo([1,0,0],v),back=C.shipToZamo([-1,0,0],v);
 near(forward.doppler,gamma*(1+beta),1e-9);
 near(back.doppler,gamma*(1-beta),1e-9);
 near(C.norm(forward.direction),1);
 for(const d of [[0,1,0],[-.2,.4,.3],[.7,.1,-.45]]){
  const n=C.unit(d),z=C.shipToZamo(n,v),
   ship=C.zamoToShip(z.direction,v);
  assert.ok(C.norm(C.plus(n,C.mul(ship.direction,-1)))<1e-10);
  near(z.doppler,ship.doppler,1e-10);
  near(C.norm(z.direction),1,1e-10);
 }
}
const motion=P.release(scenarios[0]),trajectory=P.integrate(motion,{maxTau:25});
const observer=P.interpolate(trajectory,trajectory.properElapsed*.42);
const v=C.localVelocity(motion,observer);
for(const yaw of [0,.4,1.5,3.14]){
 for(const pitch of [-.5,0,.7]){
  const b=C.cameraBasis(yaw,pitch);
  near(C.dot(b.forward,b.right),0);
  near(C.dot(b.forward,b.up),0);
  near(C.dot(b.right,b.up),0);
  near(C.norm(b.forward),1);
  near(C.norm(b.right),1);
  near(C.norm(b.up),1);
  const d=C.diagnostic(motion,observer,b,true);
  assert.ok(d.doppler>0&&Number.isFinite(d.photon.lambda));
  assert.ok(Number.isFinite(d.photon.eta));
  const central=C.sightFromPixel(b,0,0,68,600);
  assert.ok(C.norm(C.plus(central,C.mul(b.forward,-1)))<1e-12);
 }
}
assert.throws(()=>C.shipToZamo([1,0,0],[1,0,0]),RangeError);
assert.throws(()=>C.zamoToShip([0,1,0],[0,0,1]),RangeError);
assert.throws(()=>C.cameraBasis(Infinity,0),RangeError);
console.log('OK: Lorentz aberration forward/back, reversible transformations, camera frames and Kerr photon constants.');

assert.ok(G.VERT.startsWith('#version 300 es'));
assert.ok(G.FRAG.startsWith('#version 300 es'));
for(const fragment of [
 'uniform vec3 uShipV,uCamForward,uCamRight,uCamUp',
 'uniform float uRelativity,uShiftBrightness,uProbePhi',
 'vec3 ship=normalize(uCamForward',
 'float denom=gam*(1.0-dn)',
 'freqFactor=1.0/max(0.000001,denom)',
 'float phi=uProbePhi',
 'kDer','kPhi','u>=limit','radiance*=clamp(pow(freqFactor,3.0)'
])assert.ok(G.FRAG.includes(fragment),'GPU shader missing '+fragment);
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const ui=fs.readFileSync(path.join(__dirname,'..','js','cockpit22-ui.js'),'utf8');
const s21=fs.readFileSync(path.join(__dirname,'..','js','probe21-ui.js'),'utf8');
assert.ok(html.includes('id="openCockpit22Side"'),'Stage 22 must remain available after later versions.');
assert.ok(html.includes('href="css/cockpit22.css"'));
for(const file of ['cockpit22-core.js','cockpit22-renderer.js','cockpit22-ui.js']){
 assert.ok(html.includes('src="js/'+file+'"'),'Missing script '+file);
}
assert.ok(s21.includes('config:{...state.config}'),'Stage21 API must export flight conditions');
const indices=['probe21-core.js','probe21-ui.js','cockpit22-core.js',
 'cockpit22-renderer.js','cockpit22-ui.js'].map(x=>html.indexOf('src="js/'+x+'"'));
assert.ok(indices.every((p,i)=>p>=0&&(!i||p>indices[i-1])));
assert.equal(html.split('<dialog ').length-1,html.split('</dialog>').length-1);
for(const id of [
 'cockpit22Dialog','cockpit22Canvas','cockpit22Radar','cockpit22Relativity',
 'cockpit22LookHole','cockpit22LookMotion','cockpit22LookSky',
 'cockpit22Play','cockpit22Progress','cockpit22TauClock','cockpit22FarClock',
 'cockpit22Doppler','cockpit22Gamma','cockpit22Lapse','cockpit22Omega',
 'cockpit22ClockRate','cockpit22Fallback','openCockpit22Top',
 'openCockpit22Side','probe21CockpitLaunch']){
 assert.ok(html.includes('id="'+id+'"'),'Missing UI element '+id);
}
for(const id of [...new Set([...ui.matchAll(/\$\('([^']+)'\)/g)].map(m=>m[1]))]){
 assert.ok(html.includes('id="'+id+'"'),'UI references absent element '+id);
}
console.log('OK: new camera linked from Atlas 21.0, full HTML elements and shader script order.');

// True runtime smoke with a canvas/WebGL2 dependency substituted by a capture spy.
const canvasContext=new Proxy({},{
 get(o,key){
  if(key==='createRadialGradient')return ()=>({addColorStop(){}});
  if(typeof key==='symbol')return undefined;
  return key in o?o[key]:(()=>{});
 },set(o,k,v){o[k]=v;return true;}
});
const elements=new Map();
function el(id){
 return {
  id,value:id==='cockpit22Quality'?'0.40':
   id==='cockpit22Tempo'?'1':id==='cockpit22Preset'?'infall':'',
  checked:true,hidden:false,disabled:false,open:false,width:1200,height:700,
  textContent:'',events:{},
  addEventListener(name,fn){this.events[name]=fn;},
  getContext(type){if(type==='2d')return canvasContext;throw new Error('Mock2D only');},
  getBoundingClientRect(){return id==='cockpit22Radar'?{left:0,top:0,width:620,height:194}:
   {left:0,top:0,width:840,height:520};},
  showModal(){this.open=true;},close(){this.open=false;},
  setPointerCapture(){},setAttribute(){}
 };
}
const document={readyState:'complete',hidden:false,
 getElementById(id){if(!elements.has(id))elements.set(id,el(id));return elements.get(id);},
 createElement(tag){return el(tag);},
 addEventListener(){}
};
let numRender=0,mainPlaying=false,stage21Closed=false;
const mockWindow={document,devicePixelRatio:1,innerWidth:1280,
 addEventListener(){},ATLAS_COCKPIT22_CORE:C,
 ATLAS_COCKPIT22_RENDERER:{
  create(){return {render(o){
   numRender++;assert.ok(o.distance>1);
   assert.equal(o.velocity.length,3);
   assert.ok(o.basis.forward.length===3);
   return true;
  },dispose(){}};}},
 ATLAS_PROBE21_CORE:P,ATLAS_KERR201_CORE:K,
 ATLAS_BLACKHOLE20_CORE:BH,ATLAS_INTERSTELLAR19_DATA:{
  stars:[[4,2,3,1,.1,'star']]
 },
 ATLAS_MAIN_API:{getPlaying:()=>mainPlaying,setPlaying(v){mainPlaying=v;}},
 ATLAS_PROBE21:{getState:()=>({
  preset:'infall',spin:.92,tau:1.5,mass:'m87',
  config:{spin:.92,r0:5.2,radial:-.25,tangential:-.40}
 }),close(){stage21Closed=true;}}
};
const sandbox={window:mockWindow,document,
 performance:{now:()=>1400},requestAnimationFrame:()=>1,cancelAnimationFrame(){},console};
vm.runInNewContext(ui,sandbox,{timeout:4500});
const api=mockWindow.ATLAS_COCKPIT22;
assert.ok(api,'Camera runtime API missing');
assert.equal(api.getState().preset,'infall');
api.open();
assert.equal(document.getElementById('cockpit22Dialog').open,true);
assert.ok(numRender>0,'GPU adapter must render at least one frame');
assert.ok(document.getElementById('cockpit22Radar').width>0);
assert.ok(document.getElementById('cockpit22TauClock').textContent.includes('s'));
api.setTau(2);assert.equal(api.getState().tau,2);
api.selectPreset('orbit');assert.equal(api.getState().reason,'duration');
api.selectPreset('ergo');assert.equal(api.getState().reason,'horizon');
document.getElementById('cockpit22LookSky').events.click();
assert.equal(api.getState().aim,'sky');
const rel=document.getElementById('cockpit22Relativity');rel.checked=false;rel.events.change({target:rel});
assert.equal(api.getState().relativity,false);
document.getElementById('cockpit22Play').events.click();
assert.equal(api.getState().playing,true);
document.getElementById('cockpit22Play').events.click();
assert.equal(api.getState().playing,false);
api.fromProbe21();
assert.ok(stage21Closed);
assert.equal(api.getState().preset,'infall');
assert.equal(api.getState().tau,1.5);
api.close();assert.equal(document.getElementById('cockpit22Dialog').open,false);
console.log('OK: real UI module, mocked GPU and radar, camera angles, stage-21 transfer and playback.');
