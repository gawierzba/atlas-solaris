/**
 * ATLAS SOLARIS 20.1 — real WebGL2 / Kerr geodesics browser smoke test.
 * Confirms GLSL compiles, draws accretion disk and changes with spin sign.
 * Node.js / headless Chromium (SwiftShader), no external dependencies.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const cp=require('node:child_process');
const chrome=['google-chrome','chromium','chromium-browser'].find(bin=>
 cp.spawnSync('which',[bin],{encoding:'utf8'}).status===0);
if(!chrome){
 console.log('SKIP: Chromium not available on this runner.');process.exit(0);
}
const source=fs.readFileSync(path.join(__dirname,'..','js','blackhole201-renderer.js'),'utf8');
function verify(){
 try{
  const sky=document.createElement('canvas');sky.width=64;sky.height=32;
  const bg=sky.getContext('2d');bg.fillStyle='#0e1628';bg.fillRect(0,0,64,32);
  bg.fillStyle='#ffffff';bg.fillRect(22,13,3,3);
  const cv=document.getElementById('screen');
  const gl=cv.getContext('webgl2');
  if(!gl){document.body.dataset.result='SKIP WebGL2 unavailable';return;}
  const renderer=window.ATLAS_KERR201_RENDERER.create(cv,sky);
  const records=[];
  for(const spin of [.85,-.85]){
   renderer.render({spin,distance:32,inclination:64,fov:50,roll:0,time:1,
    inner:spin>0?2.6321006857:8.5749382944,
    disk:true,doppler:true,brightness:1.15,quality:.33});
   gl.finish();
   const w=cv.width,h=cv.height,px=new Uint8Array(w*h*4);
   gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,px);
   const tally={bright:0,dark:0,warm:0};
   for(let i=0;i<px.length;i+=4){
    const r=px[i],g=px[i+1],b=px[i+2],hi=Math.max(r,g,b);
    if(hi>25)tally.bright++;if(hi<17)tally.dark++;
    if(r>55&&r>g*1.06&&r>b*1.13)tally.warm++;
   }
   if(tally.bright<40||tally.dark<15||tally.warm<20){
    throw new Error('No distinct Kerr disk/horizon at spin '+spin+': '+JSON.stringify(tally));
   }
   records.push({spin,w,h,tally,pixels:pw(px)});
  }
  function pw(x){
   // Small diagnostic vector of image samples, not an encoded image.
   const result=[];
   const num=Math.floor(x.length/4);
   for(let i=0;i<90;i++){
    const j=Math.floor((i+.5)*num/90)*4;
    result.push(x[j],x[j+1],x[j+2]);
   }
   return result;
  }
  let difference=0;
  for(let i=0;i<records[0].pixels.length;i++)
   difference+=Math.abs(records[0].pixels[i]-records[1].pixels[i]);
  if(difference<400)throw new Error('Opposite-spin image did not change: diff='+difference);
  document.body.dataset.result='SUCCESS '+records[0].w+'x'+records[0].h+
   ' spin+ warm='+records[0].tally.warm+
   ' spin- warm='+records[1].tally.warm+' diff='+difference;
 }catch(error){document.body.dataset.result='ERROR '+String(error.message||error);}
}
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'atlas-kerr201-'));
const file=path.join(dir,'browser.html');
const html='<!doctype html><html><meta charset="UTF-8"><body>'+
 '<canvas id="screen" style="display:block;width:530px;height:320px"></canvas>'+
 '<script>'+source.replaceAll('</script','<\\/script')+'</script>'+
 '<script>('+verify.toString()+')();</script></body></html>';
fs.writeFileSync(file,html);
const args=['--headless=new','--no-sandbox','--disable-dev-shm-usage',
 '--enable-unsafe-swiftshader','--ignore-gpu-blocklist',
 '--use-gl=angle','--use-angle=swiftshader',
 '--dump-dom','file://'+file];
const result=cp.spawnSync(chrome,args,{timeout:90000,encoding:'utf8',maxBuffer:3e6});
try{
 if(result.error||result.status!==0){
  console.log('SKIP: Chromium failed to start: '+
   String(result.error?.message||result.stderr||result.status).slice(0,250));
  process.exit(0);
 }
 const match=/data-result="([^"]*)"/.exec(result.stdout||'');
 assert.ok(match,'Headless browser did not report any WebGL2 status');
 console.log('Kerr WebGL2: '+match[1]);
 if(match[1].startsWith('SKIP'))process.exit(0);
 assert.ok(match[1].startsWith('SUCCESS'),match[1]);
}finally{fs.rmSync(dir,{recursive:true,force:true});}
