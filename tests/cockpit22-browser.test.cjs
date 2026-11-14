/**
 * ATLAS SOLARIS 22.0 — real-browser Kerr ship-frame imaging smoke.
 * Headless Chromium+SwiftShader: compile GLSL, render on-board sensor,
 * compare pixel data for SR on/off and different ship locations.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const cp=require('node:child_process');
const browser=['chromium','google-chrome','chromium-browser'].find(bin=>
 cp.spawnSync('which',[bin],{encoding:'utf8'}).status===0);
if(!browser){console.log('SKIP: Chromium not installed for cockpit-22 GPU smoke.');process.exit(0);}
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const at=html.indexOf('<dialog id="cockpit22Dialog"');
const end=html.indexOf('</dialog>',at);
assert.ok(at>0&&end>at,'On-board camera dialog absent');
const modal=html.slice(at,end+'</dialog>'.length);
const scripts=['blackhole20-core.js','blackhole201-core.js',
 'probe21-core.js','cockpit22-core.js','cockpit22-renderer.js','cockpit22-ui.js']
 .map(f=>fs.readFileSync(path.join(root,'js',f),'utf8'));
function verify(){
 document.addEventListener('DOMContentLoaded',()=>{
  const report=s=>document.body.setAttribute('data-result',s);
  try{
   const api=window.ATLAS_COCKPIT22;
   if(!api)throw new Error('Camera 22.0 UI failed to initialise.');
   api.open();
   if(!document.getElementById('cockpit22Dialog').open)
    throw new Error('Camera dialog did not open.');
   const scene=document.getElementById('cockpit22Canvas');
   const gl=scene.getContext('webgl2');
   if(!gl){report('SKIP WebGL2 not supported');return;}
   if(!api.getState().webglAvailable)
    throw new Error('Kerr cockpit shader failed: '+api.getState().error);
   const pixelRecord=()=>{
    gl.finish();
    const w=scene.width,h=scene.height;
    const pixels=new Uint8Array(w*h*4);
    gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
    let bright=0,dark=0,warm=0,cyan=0;
    let checksum=0;
    for(let i=0;i<pixels.length;i+=4){
     const r=pixels[i],g=pixels[i+1],b=pixels[i+2];
     const intensity=Math.max(r,g,b);
     if(intensity>32)bright++;
     if(intensity<15)dark++;
     if(r>49&&r>g*1.04&&r>b*1.1)warm++;
     if(b>30&&b>r*1.10)cyan++;
     checksum=(checksum+Math.imul(r+1,i+13)+Math.imul(g+1,i+27)+Math.imul(b+1,i+41))>>>0;
    }
    const grid=[];
    const total=w*h;
    for(let i=0;i<120;i++){
     const j=Math.min(total-1,Math.floor((i+.37)*total/120))*4;
     grid.push(pixels[j],pixels[j+1],pixels[j+2]);
    }
    return {w,h,bright,dark,warm,cyan,checksum,grid};
   };
   const A=pixelRecord();
   if(A.bright<35||A.dark<35)throw new Error(
    'Camera first view lacks shadow/background contrast: '+JSON.stringify({
     bright:A.bright,dark:A.dark,warm:A.warm,cyan:A.cyan}));
   const control=document.getElementById('cockpit22Relativity');
   control.checked=false;
   control.dispatchEvent(new Event('change',{bubbles:true}));
   api.renderNow();
   const B=pixelRecord();
   if(api.getState().relativity!==false)throw new Error('SR toggle did not switch off.');
   const changed=(p,q)=>p.grid.reduce((sum,n,i)=>sum+Math.abs(n-q.grid[i]),0);
   const diffAB=changed(A,B);
   if(diffAB<120)throw new Error('Aberration did not change the image: diff='+diffAB);
   control.checked=true;control.dispatchEvent(new Event('change',{bubbles:true}));
   api.setTau(2);
   api.renderNow();
   const C=pixelRecord();
   const diffAC=changed(A,C);
   if(diffAC<120)throw new Error('Camera image does not update with ship motion: diff='+diffAC);
   document.getElementById('cockpit22LookSky').click();
   api.renderNow();
   const D=pixelRecord();
   if(changed(C,D)<120)throw new Error('Reversing camera did not change sky.');
   const radar=document.getElementById('cockpit22Radar');
   const ctx=radar.getContext('2d');
   const chart=ctx.getImageData(0,0,radar.width,radar.height).data;
   let nonempty=0;
   for(let i=0;i<chart.length;i+=12)
    if(chart[i]>35||chart[i+1]>55||chart[i+2]>80)nonempty++;
   if(nonempty<40)throw new Error('Navigation radar was not drawn.');
   api.selectPreset('orbit');api.renderNow();
   if(api.getState().reason!=='duration')throw new Error('Stable mission not loaded.');
   const timeline=document.getElementById('cockpit22Progress');
   timeline.value='500';timeline.dispatchEvent(new Event('input',{bubbles:true}));
   if(!(api.getState().tau>0))throw new Error('Time scrubbing broken.');
   const play=document.getElementById('cockpit22Play');
   play.click();if(!api.getState().playing)throw new Error('Play broken.');
   play.click();if(api.getState().playing)throw new Error('Pause broken.');
   api.close();
   report('SUCCESS '+A.w+'x'+A.h+' bright='+A.bright+
    ' dark='+A.dark+' warm='+A.warm+' SRdiff='+diffAB+
    ' motionDiff='+diffAC+' radar='+nonempty);
  }catch(e){report('ERROR '+String(e.stack||e.message||e).replace(/\n/g,' ').slice(0,850));}
 });
}
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'atlas-cockpit22-'));
const file=path.join(tmp,'test.html');
const compactStars=[];
for(let i=0;i<360;i++){
 const a=i*2.39996,t=((i*197)%359)/359*2-1;
 const r=50+((i*37)%120);
 compactStars.push([r*Math.sqrt(1-t*t)*Math.cos(a),
   r*Math.sqrt(1-t*t)*Math.sin(a),r*t,2+(i%5),.4,'',i,0]);
}
const data='window.ATLAS_INTERSTELLAR19_DATA={stars:'+JSON.stringify(compactStars)+'};';
const page='<!doctype html><html><meta charset="UTF-8"><body>'+
 '<button id="openCockpit22Top">Open</button><button id="openCockpit22Side">Open</button>'+
 '<button id="probe21CockpitLaunch">Launch from stage21</button>'+
 modal+
 '<style>#cockpit22Canvas{display:block;width:700px;height:420px}'+
 '#cockpit22Radar{display:block;width:600px;height:210px}'+
 '#cockpit22Dialog{max-height:800px;overflow:auto;color:#fff;background:#081726}'+
 '</style>'+
 '<script>window.ATLAS_MAIN_API={getPlaying:()=>false,setPlaying:()=>{}};'+data+'</script>'+
 scripts.map(x=>'<script>'+x.replaceAll('</script','<\\/script')+'</script>').join('')+
 '<script>('+verify.toString()+')();</script></body></html>';
fs.writeFileSync(file,page,'utf8');
const args=['--headless=new','--no-sandbox','--disable-dev-shm-usage',
 '--enable-unsafe-swiftshader','--ignore-gpu-blocklist',
 '--use-gl=angle','--use-angle=swiftshader','--window-size=1280,920',
 '--virtual-time-budget=4000','--dump-dom','file://'+file];
const proc=cp.spawnSync(browser,args,{timeout:115000,encoding:'utf8',maxBuffer:5e6});
try{
 if(proc.error||proc.status!==0){
  console.log('SKIP: Chromium unable to start: '+
   String(proc.error?.message||proc.stderr||proc.status).slice(0,240));
  process.exit(0);
 }
 const hit=/data-result="([^"]*)"/.exec(proc.stdout||'');
 assert.ok(hit,'Chromium did not report camera test result.');
 console.log('On-board camera 22 Chromium: '+hit[1]);
 if(hit[1].startsWith('SKIP'))process.exit(0);
 assert.ok(hit[1].startsWith('SUCCESS'),hit[1]);
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
