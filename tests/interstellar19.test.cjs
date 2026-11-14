/**
 * ATLAS SOLARIS 19.0 — interstellar science + UI wiring.
 * Node.js 22, no network calls, no third-party dependencies.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const data=require('../js/interstellar19-data.js');
const c=require('../js/interstellar19-core.js');
const approx=(a,b,tol=1e-6)=>assert.ok(Math.abs(a-b)<=tol,'Expected '+a+' ≈ '+b);
assert.equal(data.epoch,'J2000');
assert.equal(data.unit,'light-year');
assert.ok(data.stars.length>=7000,'Thousands of real stars with measured distance');
assert.equal(Object.keys(data.figures).length,88);
assert.ok(data.suggestedTargets.length>=20);
assert.ok(data.stars.every(s=>s.length===8&&s.slice(0,3).every(Number.isFinite)));
const names=Object.fromEntries(data.stars.filter(s=>s[5]).map(s=>[s[5],s]));
for(const name of ['Proxima Centauri','Rigil Kentaurus',"Barnard's Star",
 'Sirius A','Betelgeuse','Rigel','Alnitak','Alnilam','Mintaka','Deneb','Vega']){
 assert.ok(names[name],name+' must exist');
}
const d=s=>c.norm(s.slice(0,3));
approx(d(names['Proxima Centauri']),4.2465,.01);
approx(d(names['Rigil Kentaurus']),4.3441,.01);
approx(d(names["Barnard's Star"]),5.9629,.02);
assert.equal(names['Betelgeuse'][7],2,'Uncertain distance estimate clearly flagged');
assert.equal(data.gapFillEstimatesLy.Betelgeuse,642);
assert.equal(data.gapFillEstimatesLy.Deneb,1548);
for(const [id,fig] of Object.entries(data.figures)){
 assert.ok(fig.paths.length,id+' must have lines');
 for(const chain of fig.paths)for(const ix of chain){
  assert.ok(ix===-1||(Number.isInteger(ix)&&ix>=0&&ix<data.stars.length),'Invalid graph edge '+id);
 }
}
assert.ok(data.figures.Ori.paths.flat().filter(ix=>ix>=0).length>=16,'Real Orion links');
assert.ok(data.figures.UMa.paths.flat().filter(ix=>ix>=0).length>=20,'Real Ursa Major links');
console.log('OK: 7k+ documented stellar positions, nearest neighbors, uncertain distances and 88 figures.');

approx(c.lorentz(.6),1.25,1e-12);
assert.throws(()=>c.lorentz(0),RangeError);
assert.throws(()=>c.lorentz(1),RangeError);
const trip=c.route(names['Proxima Centauri'].slice(0,3),.8,1);
approx(trip.travelledLy,4.2465,.02);
approx(trip.earthYears,trip.distanceLy/.8,1e-9);
approx(trip.shipYears,trip.earthYears/c.lorentz(.8),1e-9);
approx(trip.remainingLy,0,1e-8);
for(let j=0;j<3;j++)approx(trip.position[j],names['Proxima Centauri'][j],1e-8);
const half=c.route(names['Proxima Centauri'].slice(0,3),.8,.5);
approx(half.travelledLy,trip.distanceLy/2,1e-8);
approx(half.shipYears,trip.shipYears/2,1e-8);
approx(half.signalLagYears,half.travelledLy,1e-8);
approx(c.sunMagnitude(32.6156),4.83,1e-8);
const v=c.aberrate([0,1,0],[1,0,0],.6);
approx(v.direction[0],.6,1e-12);
approx(v.direction[1],.8,1e-12);
approx(v.doppler,1.25,1e-12);
const head=c.aberrate([1,0,0],[1,0,0],.6);
approx(head.doppler,2,1e-12);
const rear=c.aberrate([-1,0,0],[1,0,0],.6);
approx(rear.doppler,.5,1e-12);
approx(c.norm(v.direction),1);
approx(c.apparentMagnitude(2,10,100),7);
approx(c.apparentMagnitude(2,10,1),-3);
const ax=c.skyAxes(0,0);
approx(c.dot(ax.forward,ax.right),0);
approx(c.dot(ax.right,ax.up),0);
assert.ok(c.project([1,0,0],ax,1000,600,90));
assert.equal(c.project([-1,0,0],ax,1000,600,90),null);
const a=c.sub(names.Alnitak.slice(0,3),[0,0,0]),b=c.sub(names.Mintaka.slice(0,3),[0,0,0]);
const fromEarth=c.angularSeparation(a,b);
const observer=c.mul(names.Betelgeuse.slice(0,3),.70);
const fromVoyage=c.angularSeparation(c.sub(a,observer),c.sub(b,observer));
assert.ok(Math.abs(fromEarth-fromVoyage)>.2,'Orion perspective actually changes along a long voyage');
console.log('OK: Lorentz gamma, dual clocks, light delay, Doppler, aberration, true 3D constellation parallax.');

const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=fs.readFileSync(path.join(__dirname,'..','js','interstellar19-ui.js'),'utf8');
for(const id of ['inter19Dialog','inter19Canvas','inter19Compare','inter19Destination',
 'inter19Beta','inter19Relativity','inter19Progress','inter19Play','inter19Close',
 'inter19Reset','inter19LookOrion','openInterstellar19Top','openInterstellar19Side',
 'inter19EarthTime','inter19ShipTime','inter19Signal','inter19Doppler']){
 assert.ok(html.includes('id="'+id+'"'),'Missing UI element '+id);
}
const order=['interstellar19-data.js','interstellar19-core.js','interstellar19-ui.js']
 .map(f=>html.indexOf('src="js/'+f+'"'));
assert.ok(order.every(x=>x>0)&&order[0]<order[1]&&order[1]<order[2]);
assert.ok(html.includes('href="css/interstellar19.css"'));
assert.equal((html.match(/<dialog\\b/g)||[]).length,(html.match(/<\\/dialog>/g)||[]).length);
console.log('OK: UI controls, repository scripts and balanced dialogs.');

// Smoke-test a real canvas draw / dialog open without relying on browser packages.
function node(id){
 const obj={
  id,value:id==='inter19Beta'?'80':id==='inter19Patterns'?'ori':'',
  open:false,width:1440,height:820,checked:false,innerText:'',textContent:'',
  listeners:{},children:[],classList:{add(){},remove(){},toggle(){}},
  addEventListener(type,fn){this.listeners[type]=fn;},
  replaceChildren(...xs){this.children=[...xs];},
  append(...xs){this.children.push(...xs);},
  getBoundingClientRect(){return {left:0,top:0,width:920,height:520};},
  getContext(){return canvasCtx;},
  showModal(){this.open=true;},
  close(){this.open=false;},
  setPointerCapture(){},
  setAttribute(){},
  blur(){}
 };
 return obj;
}
const canvasCtx=new Proxy({},{
 get(target,key){
  if(key==='createRadialGradient')return ()=>({addColorStop(){}});
  if(key in target)return target[key];
  return ()=>{};
 },
 set(target,key,value){target[key]=value;return true;}
});
const elements=new Map(),doc={
 readyState:'complete',hidden:false,
 getElementById(id){if(!elements.has(id))elements.set(id,node(id));return elements.get(id);},
 createElement(tag){return node(tag);},
 addEventListener(){}
};
const sandbox={window:{
 ATLAS_INTERSTELLAR19_DATA:data,
 ATLAS_INTERSTELLAR19_CORE:c,
 ATLAS_MAIN_API:{getPlaying:()=>false,setPlaying(){}},
 document:doc,devicePixelRatio:1,
 addEventListener(){},requestAnimationFrame(){return 1;}
},document:doc,performance:{now:()=>1200},
requestAnimationFrame:()=>1,cancelAnimationFrame:()=>{},console};
vm.runInNewContext(script,sandbox,{timeout:1500});
const ui=sandbox.window.ATLAS_INTERSTELLAR19;
assert.ok(ui);
ui.open();
assert.equal(doc.getElementById('inter19Dialog').open,true);
assert.equal(ui.getState().destination,'Proxima Centauri');
assert.ok(doc.getElementById('inter19EarthTime').textContent.includes('lat')||
 doc.getElementById('inter19EarthTime').textContent.includes('roku'));
assert.ok(ui.selectDestination('Betelgeuse'));
assert.equal(ui.getState().destination,'Betelgeuse');
assert.equal(doc.getElementById('inter19TargetDist').textContent.includes('szacunkowa'),true);
assert.ok(!ui.selectDestination('Nieistniejąca gwiazda'));
ui.close();
assert.equal(doc.getElementById('inter19Dialog').open,false);
console.log('OK: full runtime initialisation, opening UI, rendering two skies, selecting target and closing.');
