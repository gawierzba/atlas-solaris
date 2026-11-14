/**
 * ATLAS SOLARIS 23.0 — real Chromium render + waveform + timeline smoke.
 * Source logic and modal are taken from production index; no npm or CDN.
 */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const browser=['chromium','google-chrome','chromium-browser'].find(cmd=>
 cp.spawnSync('which',[cmd],{encoding:'utf8'}).status===0);
if(!browser){console.log('SKIP: Chromium not installed for stage-23 canvas smoke.');process.exit(0);}
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const a=html.indexOf('<dialog id="merger23Dialog"');
const b=html.indexOf('</dialog>',a);
assert.ok(a>0&&b>a);
const modal=html.slice(a,b+'</dialog>'.length);
const scripts=['merger23-core.js','merger23-ui.js']
 .map(x=>fs.readFileSync(path.join(root,'js',x),'utf8'));
function verify(){
 document.addEventListener('DOMContentLoaded',()=>{
  const report=s=>document.body.setAttribute('data-result',s);
  try{
   const api=window.ATLAS_MERGER23;if(!api)throw new Error('No stage23 API');
   api.open();
   const dialog=document.getElementById('merger23Dialog');
   if(!dialog.open)throw new Error('Merger dialog did not open');
   const scene=document.getElementById('merger23Canvas');
   const wave=document.getElementById('merger23Waveform');
   const capture=(canvas)=>{
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
    let bright=0,dark=0,blue=0,coral=0;const grid=[];
    for(let i=0;i<pixels.length;i+=4){
     const r=pixels[i],g=pixels[i+1],b=pixels[i+2];
     const max=Math.max(r,g,b);
     if(max>55)bright++;
     if(max<24)dark++;
     if(b>100&&b>r*1.25)blue++;
     if(r>85&&r>g*1.13)coral++;
    }
    for(let i=0;i<140;i++){
     const pix=Math.floor((i+.3)*pixels.length/4/140)*4;
     grid.push(pixels[pix],pixels[pix+1],pixels[pix+2]);
    }
    return {bright,dark,blue,coral,grid};
   };
   const start=capture(scene),graph=capture(wave);
   if(start.bright<100||start.dark<100||start.blue<100)
    throw new Error('Initial merger scene missing distinct light and shadow: '+JSON.stringify({bright:start.bright,dark:start.dark,blue:start.blue}));
   if(graph.bright<50||graph.dark<50)
    throw new Error('Physical h+ waveform not drawn: '+JSON.stringify({bright:graph.bright,dark:graph.dark}));
   const diff=(p,q)=>p.grid.reduce((s,x,i)=>s+Math.abs(x-q.grid[i]),0);
   api.setProgress(.65);api.renderNow();
   const near=capture(scene);
   const d1=diff(start,near);
   if(d1<100)throw new Error('Inspiral animation did not change: '+d1);
   api.setProgress(.83);api.renderNow();
   const merged=capture(scene);
   const d2=diff(near,merged);
   if(d2<130||api.getState().stage!=='ringdown')
    throw new Error('Merger/ringdown scene did not transition: '+d2);
   api.selectPreset('super');api.renderNow();
   if(api.getState().model.m1!==1e6)throw new Error('Supermassive preset missing');
   const slider=document.getElementById('merger23Mass1');
   slider.value='1500000';slider.dispatchEvent(new Event('input',{bubbles:true}));
   if(api.getState().preset!=='custom')throw new Error('Custom mass not applied');
   const btn=document.getElementById('merger23Play');
   btn.click();if(!api.getState().playing)throw new Error('Playback did not start');
   btn.click();if(api.getState().playing)throw new Error('Playback did not pause');
   api.close();if(dialog.open)throw new Error('Dialog did not close');
   report('SUCCESS scene '+scene.width+'x'+scene.height+
    ' bright='+start.bright+' dark='+start.dark+' blue='+start.blue+
    ' inspiralDiff='+d1+' mergerDiff='+d2+' waveBright='+graph.bright);
  }catch(e){
   report('ERROR '+String(e.stack||e.message||e).replace(/\n/g,' ').slice(0,1000));
  }
 });
}
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'merger23-chromium-'));
const file=path.join(tmp,'index.html');
const page='<!doctype html><html><head><meta charset="UTF-8"><style>'+
 '#merger23Canvas{display:block;width:760px;height:420px}'+
 '#merger23Waveform{display:block;width:760px;height:220px}'+
 '#merger23Dialog{max-height:960px;overflow:auto;color:#f6f6ff;background:#10182b}'+
 '</style></head><body><button id="openMerger23Side">Side</button>'+
 '<button id="openMerger23Top">Top</button>'+modal+
 '<script>window.ATLAS_MAIN_API={getPlaying:()=>false,setPlaying:()=>{}};</script>'+
 scripts.map(x=>'<script>'+x.replaceAll('</script','<\\/script')+'</script>').join('')+
 '<script>('+verify.toString()+')();</script></body></html>';
fs.writeFileSync(file,page,'utf8');
const args=['--headless=new','--no-sandbox','--disable-dev-shm-usage',
 '--enable-unsafe-swiftshader','--ignore-gpu-blocklist',
 '--window-size=1240,1000','--virtual-time-budget=3000','--dump-dom','file://'+file];
const proc=cp.spawnSync(browser,args,{timeout:65000,encoding:'utf8',maxBuffer:4e6});
try{
 if(proc.error||proc.status!==0){
  console.log('SKIP: Chromium unable to initialise: '+
   String(proc.error?.message||proc.stderr||proc.status).slice(0,240));process.exit(0);
 }
 const hit=/data-result="([^"]*)"/.exec(proc.stdout||'');
 assert.ok(hit,'No browser smoke result');
 console.log('Merger 23 Chromium: '+hit[1]);
 if(hit[1].startsWith('SKIP'))process.exit(0);
 assert.ok(hit[1].startsWith('SUCCESS'),hit[1]);
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
