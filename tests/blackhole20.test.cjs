/**
 * ATLAS SOLARIS 20.0 — Schwarzschild physics, ray tracing and UI regression.
 * Node.js built-in assert and VM; no npm or Internet needed.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const c=require('../js/blackhole20-core.js');
const render=require('../js/blackhole20-renderer.js');
const close=(a,b,t=1e-8)=>assert.ok(Math.abs(a-b)<=Math.max(t,Math.abs(b)*1e-12),'Expected '+a+' ≈ '+b);
close(c.RG_KM,1.4766,.001);
close(c.TG_S,4.9255e-6,1e-9);
close(c.PHOTON_B,3*Math.sqrt(3));
close(c.lapse(4),1/Math.sqrt(2));
close(c.lapse(6),Math.sqrt(2/3));
assert.equal(c.lapse(2),0);
close(c.speedCircular(6),.5);
close(c.gammaCircular(6),Math.sqrt(2));
assert.throws(()=>c.speedCircular(3),RangeError);
assert.throws(()=>c.gammaCircular(2.5),RangeError);
assert.throws(()=>c.shadowAngle(2.1),RangeError);
close(c.shadowAngle(40),Math.asin(3*Math.sqrt(3)*Math.sqrt(.95)/40));
const a=c.physical(4e6,32),b=c.physical(6.5e9,32);
assert.ok(a.rsKm>1.1e7&&a.rsKm<1.3e7);
assert.ok(b.rsKm>1.8e10&&b.rsKm<2.0e10);
close(b.rsKm/a.rsKm,6.5e9/4e6,1e-9);
close(a.staticClockRatio,b.staticClockRatio);
assert.ok(a.iscoPeriodSeconds>1700&&a.iscoPeriodSeconds<2100);
close(b.iscoPeriodSeconds/a.iscoPeriodSeconds,6.5e9/4e6,1e-9);
const massTide=c.tideAcceleration(2.6,10,2);
const massiveTide=c.tideAcceleration(2.6,4e6,2);
assert.ok(massTide>1e7&&massiveTide<.01);
close(massTide/massiveTide,(4e6/10)**2,1e-5);
assert.ok(c.lapse(2.05)<c.lapse(2.6));
assert.ok(c.lapse(2.6)<c.lapse(9));
assert.throws(()=>c.physical(-1,20),RangeError);
console.log('OK: horizon, photon sphere, ISCO, orbital periods, static clocks, tidal gradient and mass scaling.');

const outcomes={};
for(const impact of [4.7,5.19,5.2,5.7,8]){
 const t=c.trace(impact,{r0:160,maxSteps:2200,stepRadians:.012,rExit:150});
 outcomes[impact]=t;
 assert.ok(t.path.length>40,'Must trace multiple ray segments');
 assert.ok(Number.isFinite(t.minimumRadius));
 assert.ok(t.path.every(v=>v.length===2&&v.every(Number.isFinite)));
}
assert.equal(outcomes[4.7].status,'captured');
assert.equal(outcomes[5.19].status,'captured');
assert.equal(outcomes[5.2].status,'escaped');
assert.equal(outcomes[5.7].status,'escaped');
assert.equal(outcomes[8].status,'escaped');
assert.ok(outcomes[5.7].minimumRadius>3);
assert.ok(outcomes[8].minimumRadius>outcomes[5.7].minimumRadius);
assert.ok(outcomes[5.2].angleRad>outcomes[5.7].angleRad,
 'Near-critical ray wraps farther around the black hole');
const flat=c.trace(4.7,{r0:160,maxSteps:2200,stepRadians:.012,rExit:150,flat:true});
assert.equal(flat.status,'escaped','Straight ray with b>2M should not enter the horizon');
console.log('OK: RK4 photon trajectories, capture/escape near bcrit and flat-space control.');

assert.ok(render.VERT.startsWith('#version 300 es'));
assert.ok(render.FRAG.startsWith('#version 300 es'));
for(const snippet of ['3.0*x.x*x.x','vec2 rk4','uniform float uDistance',
 'uniform float uInclination','uniform float uRoll','uniform sampler2D uSky',
 'nextU>=.5','nextU<=.00065','prev.z*pos.z<=0.0','r>=6.0&&r<=32.0',
 'diskLight','uLensing>.5','gl_FragCoord.xy']){
 assert.ok(render.FRAG.includes(snippet),'Shader missing: '+snippet);
}
const shaderCalls=[],gl=new Proxy({},{
 get(target,name){
  const constants={VERTEX_SHADER:35633,FRAGMENT_SHADER:35632,COMPILE_STATUS:35713,
   LINK_STATUS:35714,TEXTURE0:33984,TEXTURE_2D:3553,
   UNPACK_FLIP_Y_WEBGL:37440,RGBA:6408,UNSIGNED_BYTE:5121,
   TEXTURE_MIN_FILTER:10241,TEXTURE_MAG_FILTER:10240,
   TEXTURE_WRAP_S:10242,TEXTURE_WRAP_T:10243,REPEAT:10497,
   CLAMP_TO_EDGE:33071,LINEAR:9729,TRIANGLES:4};
  if(name in constants)return constants[name];
  if(name==='getShaderParameter'||name==='getProgramParameter')return ()=>true;
  if(name==='getUniformLocation')return (p,s)=>s;
  if(name==='createShader'||name==='createProgram'||name==='createTexture'||name==='createVertexArray')
   return ()=>({name});
  if(name==='getShaderInfoLog'||name==='getProgramInfoLog')return ()=>'';
  if(typeof name==='symbol')return undefined;
  return (...args)=>{shaderCalls.push([name,...args]);};
 }
});
const canvas={width:0,height:0,
 getContext(type){assert.equal(type,'webgl2');return gl;},
 getBoundingClientRect(){return {width:700,height:420};},
 addEventListener(){}};
const rr=render.create(canvas,{width:2048,height:1024});
assert.equal(rr.render({distance:32,inclination:64,fov:50,roll:7,lensing:true,disk:true,
 doppler:true,quality:.65,time:0}),true);
assert.equal(canvas.width,455);assert.equal(canvas.height,273);
assert.ok(shaderCalls.some(c=>c[0]==='drawArrays'&&c[3]===3));
assert.ok(shaderCalls.some(c=>c[0]==='uniform1f'&&c[1]==='uRoll'&&c[2]===7));
rr.dispose();
console.log('OK: WebGL2 setup, shader inputs, responsive resolution and draw invocation.');

const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const ui=fs.readFileSync(path.join(__dirname,'..','js','blackhole20-ui.js'),'utf8');
const ids=[...new Set([...ui.matchAll(/\$\('([^']+)'\)/g)].map(m=>m[1]))];
for(const id of ids)assert.ok(html.includes('id="'+id+'"'),'Missing HTML ID '+id);
for(const file of ['blackhole20-core.js','blackhole20-renderer.js','blackhole20-ui.js'])
 assert.ok(html.includes('src="js/'+file+'"'),'Missing script '+file);
assert.ok(html.includes('href="css/blackhole20.css"'));
assert.equal(html.split('<dialog ').length-1,html.split('</dialog>').length-1);
const positions=['blackhole20-core.js','blackhole20-renderer.js','blackhole20-ui.js']
 .map(x=>html.indexOf('src="js/'+x+'"'));
assert.ok(positions[0]<positions[1]&&positions[1]<positions[2]);
console.log('OK: all scientific controls, script order, modal balance and integration into previous versions.');

// Minimal DOM/canvas smoke test: no browser dependencies or network.
const ctx=new Proxy({},{
 get(target,key){return typeof key==='symbol'?undefined:(target[key]||(()=>{}));},
 set(target,key,v){target[key]=v;return true;}
});
const elements=new Map();
function element(id){
 const el={id,value: id==='bh20Preset'?'sagittarius':id==='bh20Distance'?'32':
  id==='bh20Incline'?'64':id==='bh20ClockR'?'260':id==='bh20Quality'?'0.65':'50',
  checked:true,open:false,width:900,height:330,disabled:false,hidden:false,
  innerText:'',textContent:'',events:{},
  addEventListener(name,fn){this.events[name]=fn;},
  getContext(type){if(type==='2d')return ctx;throw new Error('Only mock canvas2d');},
  getBoundingClientRect(){return {width:800,height:470,left:0,top:0};},
  showModal(){this.open=true;},close(){this.open=false;},
  setPointerCapture(){},
  setAttribute(){}
 };
 return el;
}
const document={
 readyState:'complete',hidden:false,
 getElementById(id){if(!elements.has(id))elements.set(id,element(id));return elements.get(id);},
 createElement(tag){return element(tag);},
 addEventListener(){}
};
let mockRenders=0;
const rendererMock={create:()=>({render(){mockRenders++;return true;}})};
const windowMock={document,addEventListener(){},
 ATLAS_BLACKHOLE20_CORE:c,ATLAS_BLACKHOLE20_RENDERER:rendererMock,
 ATLAS_INTERSTELLAR19_DATA:{stars:[[1,0,0,0,.4,'Star',1,0]]},
 ATLAS_MAIN_API:{getPlaying:()=>false,setPlaying(){}}
};
vm.runInNewContext(ui,{window:windowMock,document,
 requestAnimationFrame:()=>1,cancelAnimationFrame(){},console},{timeout:2500});
const mode=windowMock.ATLAS_BLACKHOLE20;
assert.ok(mode,'UI must export entrypoint');
mode.open();
assert.equal(document.getElementById('bh20Dialog').open,true);
assert.ok(mockRenders>=1);
assert.equal(mode.getState().preset,'sagittarius');
assert.equal(mode.getState().webglAvailable,true);
assert.equal(document.getElementById('bh20Horizon').textContent.includes('km'),true);
mode.close();
assert.equal(document.getElementById('bh20Dialog').open,false);
console.log('OK: runtime smoke opening, drawing image, clocks/physics, closing and preserving main atlas.');
