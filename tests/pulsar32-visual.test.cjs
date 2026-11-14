'use strict';
/* ATLAS SOLARIS 32.1 — dependency-free deterministic renderer smoke.
   Mocked Canvas2D lets CI verify both scene qualities without Chromium. */
const test=require('node:test');
const assert=require('node:assert/strict');
const physics=require('../portal/pulsar32-core.js');
const renderer=require('../portal/pulsar32-cinema.js');
function fakeCanvas(){
 const stats={pixels:0,shapes:0,lines:0};
 function grad(){return {addColorStop(at,c){assert.ok(at>=0&&at<=1);assert.equal(typeof c,'string')}}}
 const ctx={
  createImageData(w,h){stats.pixels+=w*h;return{data:new Uint8ClampedArray(w*h*4)}},
  putImageData(){},
  createLinearGradient:grad,createRadialGradient:grad,
  fillRect(){stats.shapes++},strokeRect(){stats.shapes++},
  beginPath(){stats.shapes++},arc(){stats.shapes++},ellipse(){stats.shapes++},
  moveTo(){stats.lines++},lineTo(){stats.lines++},
  quadraticCurveTo(){stats.lines++},bezierCurveTo(){stats.lines++},
  closePath(){},stroke(){stats.shapes++},fill(){stats.shapes++},
  setLineDash(){},save(){},restore(){},drawImage(){stats.shapes++},
  fillText(){},clearRect(){},setTransform(){},translate(){},rotate(){},
 };
 return {stats,ctx,getContext(){return ctx}};
}
test('Cinematic renderer draws full-quality and lightweight scene without affecting the scientific core',()=>{
 const old=global.document;
 global.document={createElement(tag){assert.equal(tag,'canvas');return fakeCanvas()}};
 try{
  const config={alpha:38,zeta:43,rho:11,phase:.23,camYaw:-.72,camPitch:.34};
  const geometryBefore=physics.pulseAtPhase(2*Math.PI*config.phase,config);
  for(const quality of ['cinema','eco','auto']){
   const canvas=fakeCanvas();
   assert.doesNotThrow(()=>renderer.draw(canvas.ctx,860,530,config,physics,quality));
   assert.ok(canvas.stats.shapes>200,'No visual elements in '+quality+': '+canvas.stats.shapes);
   assert.ok(canvas.stats.lines>200,'No projected geometry in '+quality+': '+canvas.stats.lines);
  }
  const geometryAfter=physics.pulseAtPhase(2*Math.PI*config.phase,config);
  assert.deepEqual(geometryAfter,geometryBefore,'Graphics must not mutate scientific results');
 }finally{global.document=old}
});
test('Quality resolver visibly differentiates lightweight, auto-balanced and filmic scenes',()=>{
 assert.equal(renderer.resolveQuality('eco',980),'eco');
 assert.equal(renderer.resolveQuality('cinema',320),'cinema');
 assert.equal(renderer.resolveQuality('auto',980),'balanced');
 assert.equal(renderer.resolveQuality('auto',380),'eco');
 const old=global.document;global.document={createElement:()=>fakeCanvas()};
 try{
  const state={alpha:38,zeta:43,rho:11,phase:.23,camYaw:-.72,camPitch:.34};
  const stats={};
  for(const mode of ['eco','balanced','cinema']){
   const cv=fakeCanvas();
   renderer.draw(cv.ctx,860,530,state,physics,mode);
   stats[mode]={...cv.stats};
  }
  assert.ok(stats.cinema.shapes>stats.balanced.shapes*1.3,
   'Full movie view must visibly add layers: '+JSON.stringify(stats));
  assert.ok(stats.balanced.shapes>stats.eco.shapes,
   'Balanced rendering must have more layers than the lightweight projection');
 }finally{global.document=old}
});
test('Different line of sight and zero magnetic tilt are safe to render',()=>{
 const canvas=fakeCanvas();const old=global.document;
 global.document={createElement:()=>fakeCanvas()};
 try{
  for(const state of [
   {alpha:0,zeta:0,rho:3,phase:0,camYaw:0,camPitch:0},
   {alpha:90,zeta:180,rho:38,phase:.81,camYaw:3.7,camPitch:1.2},
   {alpha:19,zeta:116,rho:7,phase:.4,camYaw:-3.14,camPitch:-1.2},
  ])assert.doesNotThrow(()=>renderer.draw(canvas.ctx,320,450,state,physics,'eco'));
 }finally{global.document=old}
});
