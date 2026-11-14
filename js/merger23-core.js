/**
 * ATLAS SOLARIS 23.0 / Zderzenie gigantów
 * Binary black-hole circular inspiral at leading (Newtonian quadrupole) order.
 * The merger transition at r=5.3 GM/c² and damped Kerr l=m=2 ringdown are
 * deliberately labelled phenomenological. NOT a numerical-relativity solver,
 * gravitational-wave telescope, or reconstruction of measured LIGO strain.
 * References: Peters & Mathews 1963, Berti et al. QNM fits, GWOSC GW150914.
 */
(function(root){'use strict';
const C=299792458,G=6.67430e-11,MSUN=1.98847e30, MPC=3.085677581491367e22;
const TG=G*MSUN/C**3, RG=G*MSUN/C**2;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const PRESETS=Object.freeze({
 gw150914:{title:'GW150914 · pierwsze wykrycie',m1:36.2,m2:29.1,mf:62.3,af:.68,
  distance:420,redshift:.09,lowerHz:32,observed:true,
  info:'LIGO / 14.09.2015. Masy i spin to oszacowania źródłowe z katalogu GWOSC; fala w symulatorze jest analityczna, nie odtworzona z detektora.'},
 equal:{title:'Dwa równe giganty · eksperyment',m1:30,m2:30,mf:57.4,af:.69,
  distance:250,redshift:0,lowerHz:25,observed:false,
  info:'Scenariusz modelowy dwóch czarnych dziur po 30 M☉. Masa końcowa przyjęta orientacyjnie; to nie jest rzeczywiste zdarzenie.'},
 super:{title:'Supermasywne olbrzymy · eksperyment',m1:1e6,m2:8e5,mf:1.72e6,af:.72,
  distance:700,redshift:0,lowerHz:0.00035,observed:false,
  info:'Hipotetyczne supermasywne czarne dziury. Wydarzenie rozgrywa się w innych skalach czasu i częstotliwości niż GW150914.'}
});
function chirpMass(m1,m2){if(!(m1>0&&m2>0))throw new RangeError('Obie masy muszą być dodatnie');return (m1*m2)**(3/5)/(m1+m2)**(1/5);}
function model(config={},options={}){
 const m1=+config.m1,m2=+config.m2,mf=+config.mf,af=+config.af;
 const distance=+(config.distance??420),rMerge=+(options.rMerge??5.3);
 if(!(m1>0&&m2>0&&mf>0&&mf<m1+m2&&distance>0&&af>=0&&af<.99&&rMerge>3.5))
  throw new RangeError('Niedozwolone parametry dwóch czarnych dziur');
 const total=m1+m2,eta=m1*m2/total**2,tg=TG*total;
 const fMerge=1/(Math.PI*tg*rMerge**1.5);
 let fStart=+(options.fStart??config.lowerHz??25);
 fStart=clamp(fStart,0.0000001,fMerge*.75);
 const rStart=(1/(Math.PI*fStart*tg))**(2/3);
 const seconds=(5/(256*eta))*(rStart**4-rMerge**4)*tg;
 const chirp=chirpMass(m1,m2);
 const eLoss=(total-mf),eJ=eLoss*MSUN*C*C;
 const x=1-af;
 // Berti/Cardoso/Will fits for the dominant gravitational l=m=2, n=0 mode.
 const omegaDimless=1.5251-1.1568*x**.1292;
 const quality=.7000+1.4187*x**(-.4990);
 const ringHz=omegaDimless/(2*Math.PI*TG*mf);
 const ringTau=quality/(Math.PI*ringHz);
 const ringDuration=ringTau*8;
 const mergeOrbitalPhase=(rStart**2.5-rMerge**2.5)/(32*eta);
 const geomG=RG*total/(distance*MPC);
 const orient=+(options.inclination??35)*Math.PI/180;
 const plusAngle=(1+Math.cos(orient)**2)/2;
 const crossAngle=Math.cos(orient);
 return Object.freeze({m1,m2,mf,af,total,eta,tg,rStart,rMerge,
  distance,fStart,fMerge,seconds,chirp,ringHz,ringTau,ringDuration,mergeOrbitalPhase,
  energySolar:eLoss,energyJ:eJ,energyEJ:eJ/1e18,
  waveScale:4*eta*geomG,plusAngle,crossAngle,orient,
  observed:!!config.observed,title:config.title||'Dwie czarne dziury',
  info:config.info||''});
}
function inspiral(m,t){
 // Source-frame time, t from -m.seconds to 0.
 const tau=clamp(-t,0,m.seconds),geom=tau/m.tg;
 const r=(m.rMerge**4+(256/5)*m.eta*geom)**.25;
 const phase=(m.rStart**2.5-r**2.5)/(32*m.eta);
 const frequency=1/(Math.PI*m.tg*r**1.5);
 const ampl=m.waveScale/r;
 const fr=(r-m.rMerge)/(m.rStart-m.rMerge);
 const sep=r*RG*m.total/1000;
 return {stage:'inspiral',r,phase,orbitalPhase:phase,
  freq:frequency,frequency,amplitude:ampl,
  hp:ampl*m.plusAngle*Math.cos(2*phase),
  hx:ampl*m.crossAngle*Math.sin(2*phase),
  distanceKm:sep,t,progress:clamp(1-fr,0,1),
  positions:positions(m,r,phase)};
}
function positions(m,r,phase){
 const frac1=m.m2/m.total,frac2=m.m1/m.total;
 const cs=Math.cos(phase),sn=Math.sin(phase);
 const p1={x:frac1*r*cs,y:frac1*r*sn};
 const p2={x:-frac2*r*cs,y:-frac2*r*sn};
 return {one:p1,two:p2};
}
function ringdown(m,t){
 // Phase continuity with inspiral at t=0; different approximated mode frequency.
 const v=Math.max(0,t),a0=m.waveScale/m.rMerge;
 const env=a0*Math.exp(-v/m.ringTau),angle=2*m.mergeOrbitalPhase+2*Math.PI*m.ringHz*v;
 return {stage:'ringdown',r:0,phase:0,orbitalPhase:0,
  freq:m.ringHz,frequency:m.ringHz,amplitude:env,
  hp:env*m.plusAngle*Math.cos(angle),
  hx:env*m.crossAngle*Math.sin(angle),
  distanceKm:0,t,progress:1,positions:null};
}
function sample(m,time){
 if(!Number.isFinite(time))throw new RangeError('Nieprawidłowy czas');
 return time<0?inspiral(m,time):ringdown(m,time);
}
function sampleAtProgress(m,p){
 p=clamp(p,0,1);
 // 80% visual duration for inspiral, 20% for damped ringdown.
 const t=p<.80?-m.seconds*(1-p/.8):(p-.8)/.2*m.ringDuration;
 return sample(m,t);
}
function waveform(m,N=1200){
 const result=[];
 if(!(N>=16&&N<=20000))throw new RangeError('Liczba próbek 16–20 000');
 for(let i=0;i<N;i++){
  const p=i/(N-1);
  const t=-m.seconds+p*(m.seconds+m.ringDuration);
  result.push(sample(m,t));
 }
 return result;
}
function power(m,r){
 // Leading-order instantaneous GW luminosity, geometric circular orbit.
 if(!(r>0))throw new RangeError('Promień musi być dodatni');
 return 32/5*(C**5/G)*m.eta**2/r**5;
}
function strainAtDistance(m,distMpc){
 if(!(distMpc>0))throw new RangeError('Dodatnia odległość');
 return m.waveScale*m.distance/distMpc/m.rMerge;
}
function clockScale(m){return m.tg;}
root.ATLAS_MERGER23_CORE=Object.freeze({
 C,G,MSUN,MPC,TG,RG,PRESETS,chirpMass,model,positions,
 inspiral,ringdown,sample,sampleAtProgress,waveform,power,strainAtDistance,clockScale,clamp
});
if(typeof module!=='undefined'&&module.exports)module.exports=root.ATLAS_MERGER23_CORE;
})(typeof window!=='undefined'?window:globalThis);
