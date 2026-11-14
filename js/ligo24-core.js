/**
 * ATLAS SOLARIS 24.0 / LIGO — synthetic detector, not LIGO raw strain.
 *
 * 2 perpendicular 4km arms, ideal single-pass Michelson phase response.
 * GW source waveform: stage 23 quadrupole inspiral + model Kerr ringdown.
 * Synthetically inject into independent WHITE Gaussian strain noise.
 * The correlation SNR below is optimal for this *ideal white-noise model*
 * and a known phase/template. It is not the LIGO PSD-weighted search,
 * template-bank pipeline, observed network SNR, FAR or p-value.
 */
(function(root){'use strict';
const GW=root.ATLAS_MERGER23_CORE;
const C=299792458,ARM_LENGTH=4000,LASER_WAVELENGTH=1064e-9;
const SAMPLE_RATE=4096,DURATION=1.5,DELAY_SEC=.0069;
const RESPONSE_L1=1,RESPONSE_H1=-.75;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const SCENARIOS=Object.freeze({
 discovery:Object.freeze({title:'GW150914 · ukryty sygnał',m1:36.2,m2:29.1,distance:420,noiseLevel:1,event:true,
  description:'Historyczne masy GW150914. Dwa niezależne, syntetyczne strumienie danych; fala pojawia się w niewiadomej chwili.'}),
 loud:Object.freeze({title:'Silne źródło · eksperyment',m1:36.2,m2:29.1,distance:210,noiseLevel:1,event:true,
  description:'Hipotetyczne źródło o dwukrotnie mniejszej odległości. Porównaj większą amplitudę, zachowując szum detektorów.'}),
 weak:Object.freeze({title:'Odległa fala · eksperyment',m1:36.2,m2:29.1,distance:1350,noiseLevel:1.9,event:true,
  description:'Jest prawdziwa injekcja, ale model może nie osiągnąć progu detekcji. Brak wykrycia nie oznacza braku źródła.'}),
 null:Object.freeze({title:'Szum bez sygnału · próba kontrolna',m1:36.2,m2:29.1,distance:420,noiseLevel:1,event:false,
  description:'Nie wstrzykujemy żadnej fali. Obserwuj przypadkowe szczyty filtru i brak zgodnego wykrycia w dwóch detektorach.'})
});
function requireGW(){if(!GW)throw new Error('Moduł fizyki fal grawitacyjnych 23.0 jest wymagany.');}
function modelFor(m1=36.2,m2=29.1,distance=420){
 requireGW();
 if(!(m1>=5&&m1<=90&&m2>=5&&m2<=90&&distance>=10&&distance<=5000))
  throw new RangeError('Dozwolone: masy 5–90 M☉, odległość 10–5000 Mpc');
 const total=m1+m2,original=Math.abs(m1-36.2)<1e-7&&Math.abs(m2-29.1)<1e-7;
 const massFinal=original?62.3:.954*total;
 const spec={m1,m2,mf:massFinal,af:.68,distance,
  lowerHz:32*65.3/total,title:original?'Parametry GW150914 · model':'Własne masy · model'};
 return GW.model(spec,{inclination:35});
}
function sampleTemplate(m,sr=SAMPLE_RATE){
 const before=Math.ceil(m.seconds*sr),after=Math.ceil(m.ringDuration*sr);
 const values=new Float64Array(before+after+1);
 let norm2=0;
 for(let i=0;i<values.length;i++){
  const t=(i-before)/sr;
  const value=GW.sample(m,t).hp;
  values[i]=value;norm2+=value*value;
 }
 return {values,before,after,norm:Math.sqrt(norm2),sr};
}
function randomGenerator(seed){
 let a=(seed>>>0)||1;
 return ()=>{
  a=(a+0x6D2B79F5)>>>0;
  let t=a;t=Math.imul(t^(t>>>15),t|1);
  t^=t+Math.imul(t^(t>>>7),t|61);
  return ((t^(t>>>14))>>>0)/4294967296;
 };
}
function gaussian(rng){
 const u=Math.max(1e-12,rng()),v=rng();
 return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);
}
function referenceNoiseSigma(){
 const m=modelFor(),tpl=sampleTemplate(m);
 return tpl.norm/18.4;
}
function opticalResponse(strain,visualGain=1){
 if(!Number.isFinite(strain))throw new RangeError('Nieprawidłowy strain');
 const deltaX=ARM_LENGTH*strain/2;
 const deltaY=-deltaX;
 const differential=deltaX-deltaY;
 // Δφ of RETURNED Michelson beams = 4π(Lx−Ly)/λ.
 const phase=4*Math.PI*differential/LASER_WAVELENGTH;
 const darkPort=Math.sin(phase*.5)**2;
 return {strain,deltaX,deltaY,differential,phase,darkPort,
  visualDisplacement:deltaX*visualGain,roundTripMicroseconds:2*ARM_LENGTH/C*1e6};
}
function generate(options={}){
 const scenario=SCENARIOS[options.scenario||'discovery'];
 if(!scenario)throw new RangeError('Nieznany scenariusz');
 const m1=+(options.m1??scenario.m1),m2=+(options.m2??scenario.m2);
 const distance=+(options.distance??scenario.distance);
 const noiseLevel=+(options.noiseLevel??scenario.noiseLevel);
 const event=options.event??scenario.event;
 const seed=+(options.seed??240914);
 if(!(noiseLevel>=.2&&noiseLevel<=8&&Number.isInteger(seed)))
  throw new RangeError('Nieprawidłowy poziom szumu lub ziarno');
 const model=modelFor(m1,m2,distance),template=sampleTemplate(model);
 const N=Math.round(DURATION*SAMPLE_RATE);
 if(template.values.length>N*.75)throw new RangeError('Zbyt długa fala dla okna danych');
 const noiseSigma=referenceNoiseSigma()*noiseLevel;
 const l1=new Float64Array(N),h1=new Float64Array(N);
 const cleanL1=new Float64Array(N),cleanH1=new Float64Array(N);
 const rng=randomGenerator(seed);
 for(let i=0;i<N;i++){l1[i]=gaussian(rng)*noiseSigma;h1[i]=gaussian(rng)*noiseSigma;}
 // Event's exact arrival time is deliberately hidden from the UI.
 const nominal=.79+randomGenerator(seed^0x4441b17a)()*.32;
 const mergeIndex=Math.max(template.before+25,Math.min(
  N-template.after-50,Math.round(nominal*SAMPLE_RATE)));
 const delaySamples=Math.round(DELAY_SEC*SAMPLE_RATE);
 if(event){
  for(let j=0;j<template.values.length;j++){
   const value=template.values[j],i=mergeIndex-template.before+j;
   if(i>=0&&i<N){const s=RESPONSE_L1*value;l1[i]+=s;cleanL1[i]+=s;}
   const iH=i+delaySamples;
   if(iH>=0&&iH<N){const s=RESPONSE_H1*value;h1[iH]+=s;cleanH1[iH]+=s;}
  }
 }
 return {scenario:options.scenario||'discovery',model,template,
  l1,h1,cleanL1,cleanH1,event,noiseSigma,noiseLevel,seed,
  sampleRate:SAMPLE_RATE,duration:DURATION,N,mergeIndex,delaySamples,
  expectedTimeL1:mergeIndex/SAMPLE_RATE,
  expectedTimeH1:(mergeIndex+delaySamples)/SAMPLE_RATE,
  responseL1:RESPONSE_L1,responseH1:RESPONSE_H1,
  detected:null};
}
function signalAt(data,time,site='L1'){
 const n=clamp(Math.round(time*data.sampleRate),0,data.N-1);
 return site==='H1'?data.cleanH1[n]:data.cleanL1[n];
}
function matches(data,options={}){
 const {template,l1,h1,noiseSigma,sampleRate,N}=data;
 const step=options.step??3;
 if(!Number.isInteger(step)||step<1||step>32)throw new RangeError('Błędny krok filtru');
 const norm=template.norm*noiseSigma;
 if(!(norm>0))throw new Error('Zerowa norma szablonu');
 const start=Math.max(template.before+2,Math.round(.28*sampleRate));
 const end=Math.min(N-template.after-2,Math.round(1.35*sampleRate));
 const n=Math.floor((end-start)/step)+1;
 const times=new Float64Array(n),rhoL1=new Float64Array(n),rhoH1=new Float64Array(n);
 const t=template.values,offset=template.before;
 const inv=1/norm;
 for(let i=0;i<n;i++){
  const k=start+i*step,b=k-offset;
  let dotL=0,dotH=0;
  for(let j=0;j<t.length;j++){
   const v=t[j];dotL+=l1[b+j]*v;dotH+=h1[b+j]*v;
  }
  times[i]=k/sampleRate;
  rhoL1[i]=dotL*inv;
  rhoH1[i]=-dotH*inv; // known sign convention of the toy Hanford antenna.
 }
 // Two-detector coincidence, NOT a real LIGO statistical detection claim.
 const maxLag=Math.ceil(.01*sampleRate/step);
 let best={networkSNR:0,snrL1:0,snrH1:0,timeL1:NaN,timeH1:NaN,delayMs:NaN};
 for(let i=0;i<n;i++){
  const L=rhoL1[i];
  if(L<=0)continue;
  for(let j=Math.max(0,i-maxLag);j<=Math.min(n-1,i+maxLag);j++){
   const H=rhoH1[j];
   if(H<=0)continue;
   const lag=times[j]-times[i];
   if(Math.abs(lag)>.0101)continue;
   const network=Math.hypot(L,H);
   if(network>best.networkSNR)best={
    networkSNR:network,snrL1:L,snrH1:H,
    timeL1:times[i],timeH1:times[j],delayMs:lag*1000,
    idxL1:i,idxH1:j};
  }
 }
 best.found=best.snrL1>=5&&best.snrH1>=5&&best.networkSNR>=9;
 best.threshold=9;best.coincidenceWindowMs=10;
 best.isSimulated=true;
 return {times,rhoL1,rhoH1,best,step,
  method:'Idealized known-template matched filter in independent Gaussian white strain noise.'};
}
root.ATLAS_LIGO24_CORE=Object.freeze({
 C,ARM_LENGTH,LASER_WAVELENGTH,SAMPLE_RATE,DURATION,DELAY_SEC,
 SCENARIOS,RESPONSE_L1,RESPONSE_H1,
 modelFor,sampleTemplate,gaussian,randomGenerator,referenceNoiseSigma,
 opticalResponse,generate,signalAt,matches,clamp
});
if(typeof module!=='undefined'&&module.exports)module.exports=root.ATLAS_LIGO24_CORE;
})(typeof window!=='undefined'?window:globalThis);
