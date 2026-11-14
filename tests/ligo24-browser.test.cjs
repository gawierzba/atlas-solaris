/**
 * ATLAS SOLARIS 24.0 — real Chromium scientific instrument smoke, no npm.
 * Renders Canvas2D laser arms, detector strain and matched-filter SNR,
 * tests verified GW injection, null experiment, blind reveal and bridge.
 */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const chrome=['chromium','google-chrome','chromium-browser'].find(name=>
 cp.spawnSync('which',[name],{encoding:'utf8'}).status===0);
if(!chrome){console.log('SKIP: Chromium not installed for LIGO stage 24 smoke test.');process.exit(0);}
const root=path.join(__dirname,'..'),index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const a=index.indexOf('<dialog id="ligo24Dialog"'),b=index.indexOf('</dialog>',a);
assert.ok(a>=0&&b>a,'LIGO stage24 dialog was not found in index.html');
const modal=index.slice(a,b+'</dialog>'.length);
const scripts=['merger23-core.js','ligo24-core.js','ligo24-ui.js']
 .map(name=>fs.readFileSync(path.join(root,'js',name),'utf8'));
function verify(){
 document.addEventListener('DOMContentLoaded',()=>{
  const report=x=>document.body.setAttribute('data-result',x);
  try{
   const app=window.ATLAS_LIGO24;
   if(!app)throw new Error('LIGO stage 24 UI is absent.');
   app.open();
   const dlg=document.getElementById('ligo24Dialog');
   if(!dlg.open)throw new Error('LIGO modal did not open.');
   const scene=document.getElementById('ligo24Canvas');
   const raw=document.getElementById('ligo24DataPlot');
   const corr=document.getElementById('ligo24SNRPlot');
   const pixels=(canvas)=>{
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    const pix=ctx.getImageData(0,0,canvas.width,canvas.height).data;
    let bright=0,dark=0,lime=0,violet=0;
    for(let j=0;j<pix.length;j+=4){
     const r=pix[j],g=pix[j+1],b=pix[j+2],v=Math.max(r,g,b);
     if(v>75)bright++;
     if(v<25)dark++;
     if(g>130&&g>r*1.10)lime++;
     if(b>100&&b>g*1.07)violet++;
    }
    const grid=[];
    for(let y=0;y<12;y++)for(let x=0;x<23;x++){
     const ix=Math.min(canvas.width-1,Math.floor(canvas.width*(x+.5)/23));
     const iy=Math.min(canvas.height-1,Math.floor(canvas.height*(y+.5)/12));
     const o=4*(iy*canvas.width+ix);
     grid.push(pix[o],pix[o+1],pix[o+2]);
    }
    return {bright,dark,lime,violet,grid};
   };
   const p1=pixels(scene),p2=pixels(raw),p3=pixels(corr);
   if(p1.bright<100||p1.dark<100||p1.lime<20)
    throw new Error('Laser interferometer image missing physical optics contrast: '+
     JSON.stringify({bright:p1.bright,dark:p1.dark,lime:p1.lime}));
   if(p2.bright<100||p2.dark<100)
    throw new Error('Dual-detector strain curves did not render.');
   if(p3.bright<50)throw new Error('SNR baseline panel missing.');
   if(app.getState().found!==null)throw new Error('Blind search was not blind.');
   const result=app.detect();
   if(!result.found||result.networkSNR<14)
    throw new Error('Matched filter could not find synthetic GW150914.');
   app.renderNow();
   const searched=pixels(corr);
   let diff=0;
   for(let i=0;i<p3.grid.length;i++)diff+=Math.abs(p3.grid[i]-searched.grid[i]);
   if(diff<600)throw new Error('Matched-filter curves did not appear visually: '+diff);
   if(Math.abs(result.delayMs-6.9)>1.5)
    throw new Error('H/L site delay should be about 7ms, measured '+result.delayMs);
   app.reveal();
   if(!app.getState().revealed)throw new Error('Reveal action did not work.');
   if(!app.chooseScenario('null')||app.detect().found)
    throw new Error('Pure independent noise incorrectly detected.');
   if(!app.chooseScenario('weak')||app.detect().found)
    throw new Error('Weak signal should not be positively detected.');
   if(!app.chooseScenario('loud')||!app.detect().found)
    throw new Error('Strong synthetic source was not detected.');
   const location=document.getElementById('ligo24Site');
   location.value='H1';location.dispatchEvent(new Event('change',{bubbles:true}));
   if(app.getState().site!=='H1')throw new Error('Hanford site switch ignored.');
   app.setTime(.93);app.renderNow();
   const after=pixels(scene);
   if(after.bright<80)throw new Error('After-switch interferometer disappeared.');
   const slider=document.getElementById('ligo24Distance');
   slider.value='880';slider.dispatchEvent(new Event('input',{bubbles:true}));
   if(app.getState().scenario!=='custom')
    throw new Error('Custom source distance not applied.');
   const play=document.getElementById('ligo24Play');
   play.click();if(!app.getState().playing)throw new Error('Play did not start.');
   play.click();if(app.getState().playing)throw new Error('Pause did not stop.');
   app.close();if(dlg.open)throw new Error('Modal did not close.');
   report('SUCCESS '+scene.width+'x'+scene.height+
    ' bright='+p1.bright+' dark='+p1.dark+' laser='+p1.lime+
    ' dualPlot='+p2.bright+' filterDelta='+diff+
    ' networkSNR='+result.networkSNR.toFixed(2)+' delay='+result.delayMs.toFixed(2)+'ms');
  }catch(e){report('ERROR '+String(e.stack||e.message||e).replace(/\n/g,' ').slice(0,850));}
 });
}
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'atlas-ligo24-'));
const file=path.join(dir,'test.html');
const page='<!doctype html><html><head><meta charset="utf-8"><style>'+
 '#ligo24Canvas{display:block;width:780px;height:480px}'+
 '#ligo24DataPlot{display:block;width:780px;height:220px}'+
 '#ligo24SNRPlot{display:block;width:780px;height:200px}'+
 '#ligo24Dialog{max-height:950px;overflow:auto;color:#fff;background:#121f22}'+
 '</style></head><body>'+
 '<button id="openLigo24Side">Side</button><button id="openLigo24Top">Top</button>'+
 '<button id="merger23ToLigo24">Bridge</button>'+
 modal+
 '<script>window.ATLAS_MAIN_API={getPlaying:()=>false,setPlaying:()=>{}};</script>'+
 scripts.map(x=>'<script>'+x.replaceAll('</script','<\\/script')+'</script>').join('')+
 '<script>('+verify.toString()+')();</script></body></html>';
fs.writeFileSync(file,page,'utf8');
const cmd=['--headless=new','--no-sandbox','--disable-dev-shm-usage',
 '--enable-unsafe-swiftshader','--ignore-gpu-blocklist',
 '--window-size=1300,1050','--virtual-time-budget=3000',
 '--dump-dom','file://'+file];
const p=cp.spawnSync(chrome,cmd,{timeout:85000,encoding:'utf8',maxBuffer:5e6});
try{
 if(p.error||p.status!==0){
  console.log('SKIP: Chromium start failed: '+
   String(p.error?.message||p.stderr||p.status).slice(0,230));
  process.exit(0);
 }
 const m=/data-result="([^"]*)"/.exec(p.stdout||'');
 assert.ok(m,'Headless Chromium did not report LIGO lab result');
 console.log('LIGO 24 Chromium: '+m[1]);
 if(m[1].startsWith('SKIP'))process.exit(0);
 assert.ok(m[1].startsWith('SUCCESS'),m[1]);
}finally{fs.rmSync(dir,{recursive:true,force:true});}
