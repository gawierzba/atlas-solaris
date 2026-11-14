/**
 * ATLAS SOLARIS 21.0 — full-browser canvas/DOM smoke test, no npm.
 * Uses optional headless Chromium/SwiftShader available on GitHub runner.
 * Loads the real version-21 modal HTML and the actual physics + UI JS.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const cp=require('node:child_process');
const chrome=['chromium','google-chrome','chromium-browser'].find(exe=>
 cp.spawnSync('which',[exe],{encoding:'utf8'}).status===0);
if(!chrome){console.log('SKIP: Chromium not present for real browser stage 21.0.');process.exit(0);}
const root=path.join(__dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const start=index.indexOf('<dialog id="probe21Dialog"'),end=index.indexOf('</dialog>',start);
assert.ok(start>0&&end>start,'Real probe dialog must exist in index.html');
const modal=index.slice(start,end+'</dialog>'.length);
const scripts=['blackhole20-core.js','blackhole201-core.js','probe21-core.js','probe21-ui.js']
 .map(name=>fs.readFileSync(path.join(root,'js',name),'utf8'));
function verify(){
 const out=txt=>document.body.dataset.result=txt;
 try{
  if(!window.ATLAS_PROBE21)throw new Error('No stage 21.0 API.');
  const api=window.ATLAS_PROBE21;
  api.open();
  const dlg=document.getElementById('probe21Dialog');
  if(!dlg.open)throw new Error('Modal did not open.');
  let s=api.getState();
  if(s.preset!=='ergo'||s.reason!=='horizon')throw new Error('Bad default '+JSON.stringify(s));
  const c=document.getElementById('probe21Canvas');
  if(c.width<300||c.height<200)throw new Error('Canvas did not resize: '+c.width+'x'+c.height);
  const ctx=c.getContext('2d',{willReadFrequently:true}),px=ctx.getImageData(0,0,c.width,c.height).data;
  let luminous=0,black=0,brightWarm=0;
  for(let i=0;i<px.length;i+=16){
   const r=px[i],g=px[i+1],b=px[i+2];
   const intensity=Math.max(r,g,b);
   if(intensity>65)luminous++;
   if(intensity<25)black++;
   if(r>70&&r>g*1.18&&r>b*1.22)brightWarm++;
  }
  if(luminous<100||black<100)throw new Error('Canvas contrast failed: '+luminous+'/'+black);
  const plot=document.getElementById('probe21Plot');
  const gp=plot.getContext('2d'),pixels=gp.getImageData(0,0,plot.width,plot.height).data;
  let colored=0;for(let i=0;i<pixels.length;i+=20)
   if(pixels[i+1]>80||pixels[i+2]>120)colored++;
  if(colored<100)throw new Error('Scientific plot was not drawn.');
  api.selectPreset('orbit');
  if(api.getState().reason!=='duration')throw new Error('Stable orbit was not calculated.');
  api.selectPreset('infall');
  if(!api.getState().hasGhost)throw new Error('Schwarzschild ghost comparison missing.');
  const progress=document.getElementById('probe21Progress');
  progress.value='550';progress.dispatchEvent(new Event('input',{bubbles:true}));
  if(!(api.getState().tau>0))throw new Error('Flight timeline did not move.');
  const play=document.getElementById('probe21Play');
  play.click();if(!api.getState().playing)throw new Error('Flight did not start.');
  play.click();if(api.getState().playing)throw new Error('Pause did not work.');
  const spin=document.getElementById('probe21Spin');
  spin.value='-90';spin.dispatchEvent(new Event('input',{bubbles:true}));
  if(Math.abs(api.getState().spin+.90)>.001)throw new Error('Spin change was ignored.');
  api.close();
  if(dlg.open)throw new Error('Closing modal failed.');
  out('SUCCESS '+c.width+'x'+c.height+
   ' luminous='+luminous+' dark='+black+' plot='+colored+' warm='+brightWarm+
   ' / scripts, timeline, spin, play, pause, modal OK');
 }catch(e){out('ERROR '+String(e.stack||e.message||e).replace(/\n/g,' ').slice(0,700));}
}
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'solar-probe21-'));
const page=path.join(tmp,'test.html');
const html='<!doctype html><html><meta charset="UTF-8"><body>'+
 '<button id="openProbe21Side">Open</button><button id="openProbe21Top">Open</button>'+
 modal+
 '<style>#probe21Canvas{display:block;width:730px;height:460px}'+
 '#probe21Plot{display:block;width:730px;height:160px}'+
 '#probe21Dialog{width:800px;max-height:870px;overflow:auto;color:#fff;background:#07172c}'+
 '#probe21Dialog input,#probe21Dialog button,#probe21Dialog select{display:inline-block}</style>'+
 '<script>window.ATLAS_MAIN_API={getPlaying:()=>false,setPlaying:()=>{}};</script>'+
 scripts.map(x=>'<script>'+x.replaceAll('</script','<\\/script')+'</script>').join('')+
 '<script>('+verify.toString()+')();</script></body></html>';
fs.writeFileSync(page,html,'utf8');
const args=['--headless=new','--no-sandbox','--disable-dev-shm-usage',
 '--enable-unsafe-swiftshader','--ignore-gpu-blocklist',
 '--window-size=1280,930','--dump-dom','file://'+page];
const process=cp.spawnSync(chrome,args,{timeout:55000,encoding:'utf8',maxBuffer:5e6});
try{
 if(process.error||process.status!==0){
  console.log('SKIP: Chromium could not start: '+
   String(process.error?.message||process.stderr||process.status).slice(0,200));
  process.exit(0);
 }
 const hit=/data-result="([^"]*)"/.exec(process.stdout||'');
 assert.ok(hit,'Chromium did not return test result (page error)');
 console.log('Kerr probe 21.0 Chromium: '+hit[1]);
 if(hit[1].startsWith('SKIP'))process.exit(0);
 assert.ok(hit[1].startsWith('SUCCESS'),hit[1]);
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
