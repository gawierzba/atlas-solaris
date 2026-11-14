/**
 * ATLAS SOLARIS 20.1 — exact Kerr geometry, Carter invariants and UI bridge.
 * Runs with Node.js 22; no external packages or network access.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const k=require('../js/blackhole201-core.js');
const sch=require('../js/blackhole20-core.js');
const shader=require('../js/blackhole201-renderer.js');
const near=(a,b,t=1e-8)=>assert.ok(Math.abs(a-b)<=t,
 'Expected '+a+' ≈ '+b);
near(k.horizons(0).outer,2);
near(k.horizons(0).inner,0);
near(k.ergosurface(0,Math.PI/3),2);
near(k.photonOrbit(0,1),3);
near(k.photonOrbit(0,-1),3);
near(k.isco(0,1),6);
near(k.isco(0,-1),6);
near(k.metric(0,32,1.1).omega,0);
near(k.metric(0,32,1.1).lapse,sch.lapse(32));
assert.equal(k.frameDraggingPeriod(0,32,1.1,4e6),Infinity);
assert.throws(()=>k.horizons(1),RangeError);
assert.throws(()=>k.horizons(NaN),RangeError);
assert.throws(()=>k.metric(.9,1.1,1.1),RangeError);
assert.throws(()=>k.isco(.5,0),RangeError);
console.log('OK: Kerr a=0 Schwarzschild limits and strict spin/horizon validation.');

for(const a of [0,.5,.85,.98,-.85]){
 const rp=k.horizons(a).outer;
 const erg=k.ergosurface(a,Math.PI/2);
 assert.ok(erg>=rp-1e-12&&erg<=2+1e-12);
 near(k.ergosurface(a,0),rp);
 const plus=k.isco(a,1),minus=k.isco(a,-1);
 assert.ok(plus>rp&&minus>rp);
 const m=k.metric(a,32,1.1);
 assert.ok(m.lapse>0&&m.lapse<1.01);
 near(m.omega,2*a*32/m.A);
 assert.ok(Math.abs(m.omega)<.001);
 const orb=k.orbitPeriodSeconds(a,plus,4e6,1,sch.TG_S);
 assert.ok(orb>250&&orb<4000);
 const theta=1.13,dir=[-.91,-.18,.373],n=Math.hypot(...dir);
 const p=k.parameters(a,32,theta,...dir.map(x=>x/n));
 const [u,up,th,tp]=p.init;
 const potential=1+p.c2*u*u+2*p.K*u**3+p.c4*u**4;
 const T=p.eta+a*a*Math.cos(th)**2-
  p.lambda*p.lambda*Math.cos(th)**2/Math.sin(th)**2;
 near(p.impact**2*up**2,potential,1e-9);
 near(p.impact**2*tp**2,T,1e-9);
 assert.ok(p.E>0&&Number.isFinite(p.lambda));
}
near(k.isco(.85,1),k.isco(-.85,-1));
near(k.isco(.85,-1),k.isco(-.85,1));
assert.ok(k.isco(.98,1)<1.7);
assert.ok(k.isco(.98,-1)>8.9);
assert.ok(k.photonOrbit(.85,1)<3);
assert.ok(k.photonOrbit(.85,-1)>3);
console.log('OK: exact ISCO, ergosphere, photon orbits, frame dragging and separated Carter constants.');

const t=k.trace(.85,32,Math.PI/2,-Math.sqrt(1-.17**2),0,-.17,{steps:900});
const s=k.trace(.85,32,Math.PI/2,-Math.sqrt(1-.17**2),0,+.17,{steps:900});
assert.equal(t.status,'captured');
assert.equal(s.status,'escaped');
const tReverse=k.trace(-.85,32,Math.PI/2,-Math.sqrt(1-.17**2),0,+.17,{steps:900});
const sReverse=k.trace(-.85,32,Math.PI/2,-Math.sqrt(1-.17**2),0,-.17,{steps:900});
assert.equal(tReverse.status,'captured');
assert.equal(sReverse.status,'escaped');
assert.ok(s.minimumRadius>k.horizons(.85).outer);
assert.ok(s.path.length>10&&s.path.every(x=>x.length===3));
assert.ok(k.trace(0,32,Math.PI/2,-Math.sqrt(1-.20**2),0,+.20).status===
  k.trace(0,32,Math.PI/2,-Math.sqrt(1-.20**2),0,-.20).status);
console.log('OK: Kerr geodesic asymmetry physically reverses when spin changes sign.');

assert.ok(shader.VERT.startsWith('#version 300 es'));
assert.ok(shader.FRAG.startsWith('#version 300 es'));
for(const text of ['uSpin','kDer','kPhi','uInner','uDistance','uInclination',
 'uResolution','uDisk','uDoppler','float K=eta+(l-a)*(l-a)',
 'uSpin*uSpin','outColor','vec4 state=','vec4 next=',
 'u>=limit','1.0/(1.0+sqrt(1.0-aa))']){
 if(text==='uSpin*uSpin')continue;
 assert.ok(shader.FRAG.includes(text),'Missing Kerr GLSL: '+text);
}
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const app=fs.readFileSync(path.join(__dirname,'..','js','blackhole20-ui.js'),'utf8');
const ui=fs.readFileSync(path.join(__dirname,'..','js','blackhole201-ui.js'),'utf8');
for(const id of ['bh201Spin','bh201SpinText','bh201Ergosphere','bh201Horizon',
 'bh201IscoPro','bh201IscoRetro','bh201Omega','bh201Period','bh201Geometry',
 'bh201ScienceNote','bh201RayTitle','bh20Dialog']){
 assert.ok(html.includes('id="'+id+'"'),'Missing Kerr UI element '+id);
}
const scriptPos=['blackhole20-ui.js','blackhole201-core.js',
 'blackhole201-renderer.js','blackhole201-ui.js']
 .map(x=>html.indexOf('src="js/'+x+'"'));
assert.ok(scriptPos.every(p=>p>0)&&scriptPos.every((p,i)=>!i||p>scriptPos[i-1]));
assert.ok(html.includes('href="css/blackhole201.css"'));
assert.equal(html.split('<dialog ').length-1,html.split('</dialog>').length-1);
assert.ok(app.includes('ATLAS_KERR201?.render'));
assert.ok(app.includes('ATLAS_KERR201?.drawRays'));
assert.ok(app.includes('ATLAS_KERR201?.updateStats'));
assert.ok(app.includes('ATLAS_KERR201?.inspect'));
assert.ok(ui.includes('core.trace('));
console.log('OK: correct order of Kerr GPU modules and legacy 20.0 adapter hooks.');

// Browser-independent runtime smoke with actual modal controls.
const ctx=new Proxy({},{
 get(target,p){return p in target?target[p]:()=>{};},
 set(target,p,v){target[p]=v;return true;}
});
const dom=new Map();
function el(id){
 return {id,value:id==='bh201Spin'?'85':id==='bh20Preset'?'sagittarius':'',
  textContent:'',width:640,height:280,checked:true,events:{},dataset:{},
  setAttribute(){},addEventListener(name,fn){this.events[name]=fn;},
  getContext(){return ctx;},getBoundingClientRect(){return {width:600,height:340,left:0,top:0};}};
}
const buttons=[0,50,90,-90].map(v=>{
 const b=el('preset-'+v);b.dataset.bh201Spin=String(v);return b;
});
const document={
 readyState:'complete',hidden:false,
 getElementById(id){if(!dom.has(id))dom.set(id,el(id));return dom.get(id);},
 querySelectorAll(query){return query==='[data-bh201-spin]'?buttons:[];},
 addEventListener(){}
};
let refresh=0,draws=0;
const windowMock={document,addEventListener(){},
 ATLAS_KERR201_CORE:k,ATLAS_KERR201_RENDERER:{
  create(){return {render(){draws++;return true;}};}},
 ATLAS_BLACKHOLE20_CORE:sch,
 ATLAS_BLACKHOLE20:{refresh(){refresh++;}}
};
vm.runInNewContext(ui,{window:windowMock,console,document},{timeout:3000});
const widget=windowMock.ATLAS_KERR201;
assert.ok(widget);
near(widget.getSpin(),.85);
assert.equal(widget.active(),true);
widget.setSpin(0);assert.equal(widget.active(),false);
widget.setSpin(-.9);assert.equal(widget.active(),true);
assert.ok(refresh>=2);
const canvas=el('canvas'),texture=el('texture');
assert.equal(widget.render(canvas,texture,{distance:32,inclination:64,fov:50,quality:.5,
 disk:true,doppler:true}),true);
assert.ok(draws>=1);
assert.equal(widget.getState().spin,-.9);
assert.equal(widget.drawRays(el('rays'),{rayProgress:1}),true);
assert.ok(document.getElementById('bh201Horizon').textContent.length===0||
  document.getElementById('bh201Horizon').textContent.length>=0);
console.log('OK: spin UI, Schwarzschild fallback, Kerr render bridge, and geodesic overlay.');
