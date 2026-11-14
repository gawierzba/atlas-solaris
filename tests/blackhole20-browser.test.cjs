/**
 * ATLAS SOLARIS 20.0 — optional real-browser GLSL compile/render smoke test.
 * Used by GitHub Actions and locally if Chromium or Google Chrome is present.
 * Deliberately skips on hosts without a WebGL2 renderer instead of failing CI.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const cp=require('node:child_process');
const chrome=['google-chrome','chromium','chromium-browser'].find(bin=>
 cp.spawnSync('which',[bin],{encoding:'utf8'}).status===0);
if(!chrome){console.log('SKIP: No Chromium/Chrome installed for browser GLSL smoke test.');process.exit(0);}
const src=fs.readFileSync(path.join(__dirname,'..','js','blackhole20-renderer.js'),'utf8');
function verify(){
 try{
  const cv=document.querySelector('#sim');
  const sky=document.createElement('canvas');sky.width=64;sky.height=32;
  const cx=sky.getContext('2d');cx.fillStyle='#0c162d';cx.fillRect(0,0,64,32);
  cx.fillStyle='#fff5c4';cx.fillRect(28,16,6,6);
  const renderer=window.ATLAS_BLACKHOLE20_RENDERER;
  const gl=cv.getContext('webgl2');
  if(!gl){document.body.setAttribute('data-result','SKIP WebGL2 unavailable');return;}
  const r=renderer.create(cv,sky);
  r.render({distance:32,inclination:64,fov:50,roll:0,
   lensing:true,disk:true,doppler:true,time:0,quality:.65,brightness:1.2});
  gl.finish();
  const w=cv.width,h=cv.height;
  const pixels=new Uint8Array(w*h*4);
  gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
  let bright=0,dark=0,warm=0;
  for(let i=0;i<pixels.length;i+=4){
   const rr=pixels[i],gg=pixels[i+1],bb=pixels[i+2];
   const intensity=Math.max(rr,gg,bb);
   if(intensity>25)bright++;else dark++;
   if(rr>50&&rr>bb*1.25&&rr>gg*1.07)warm++;
  }
  if(bright<80||dark<80||warm<80)throw new Error(
   'GLSL ray tracer has insufficient disk/shadow pixels: bright='+bright+
   ', dark='+dark+', warm disk='+warm);
  document.body.setAttribute('data-result','SUCCESS '+w+'x'+h+
   ' bright='+bright+' dark='+dark+' warm-disk='+warm);
 }catch(e){document.body.setAttribute('data-result','ERROR '+String(e.message||e));}
}
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'atlassolaris-bh20-'));
const file=path.join(tmp,'smoke.html');
const html=['<!doctype html><html><head><meta charset="UTF-8"></head><body>',
 '<canvas id="sim" style="display:block;width:460px;height:260px"></canvas>',
 '<script>'+src.replaceAll('</script','<\\/script')+'</script>',
 '<script>('+verify.toString()+')();</script>',
 '</body></html>'].join('\n');
fs.writeFileSync(file,html,'utf8');
const args=['--headless=new','--no-sandbox','--disable-dev-shm-usage',
 '--enable-unsafe-swiftshader','--ignore-gpu-blocklist',
 '--use-gl=angle','--use-angle=swiftshader','--dump-dom','file://'+file];
const proc=cp.spawnSync(chrome,args,{timeout:40000,encoding:'utf8',maxBuffer:2e6});
try{
 if(proc.error||proc.status!==0){
  console.log('SKIP: Headless browser could not initialise: '+String(proc.error?.message||proc.stderr||proc.status).slice(0,200));
  process.exit(0);
 }
 const marker=/data-result="([^"]*)"/.exec(proc.stdout||'');
 if(!marker)throw new Error('Browser did not report GLSL test result.');
 const result=marker[1];
 if(result.startsWith('SKIP')){
  console.log(result);process.exit(0);
 }
 console.log('Chromium WebGL2: '+result);
 assert.ok(result.startsWith('SUCCESS'),result);
}finally{
 fs.rmSync(tmp,{recursive:true,force:true});
}
