'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const p=require('../portal/pulsar32-core.js');
test('magnetic axis aligns with observer at zero phase',()=>{
 assert.ok(Math.abs(p.separationDeg(38,38,0))<.001);
 assert.ok(Math.abs(p.separationDeg(0,90,0)-90)<.001);
});
test('beam half-power angle is correct',()=>assert.ok(Math.abs(p.beamGain(11,11)-.5)<1e-12));
test('signal repeats after full rotation',()=>{
 const o={alpha:38,zeta:43,rho:11};
 for(const phase of [0,.4,1,2.8])assert.ok(Math.abs(p.pulseAtPhase(phase,o).gain-p.pulseAtPhase(phase+2*Math.PI,o).gain)<1e-12);
});
test('wrong observer direction yields no pulses',()=>{
 assert.equal(p.visibility({alpha:19,zeta:116,rho:7}).visible,false);
 assert.equal(p.visibility({alpha:38,zeta:43,rho:11}).visible,true);
});
test('trace includes periodic signal for 33 milliseconds',()=>{
 const o={alpha:38,zeta:43,rho:11,period:.033,noise:.03};
 const t=p.makeTrace(o,9,1800);
 assert.ok(Math.abs(t.duration-.297)<1e-10);
 const found=p.estimatePeriod(t.samples,t.dt,80,330);
 assert.ok(found!==null);
 assert.ok(Math.abs(found.period-.033)/.033<.05,'period: '+found.period);
});
test('5-ms pulsar produces 200 Hz spin rate',()=>{
 const o={alpha:61,zeta:65,rho:8,period:.005,noise:.03};
 const t=p.makeTrace(o,9,1800);
 const found=p.estimatePeriod(t.samples,t.dt,80,330);
 assert.ok(found!==null);
 assert.ok(Math.abs(found.period-.005)/.005<.06,'period: '+found.period);
});