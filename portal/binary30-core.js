/* ATLAS SOLARIS 30.0 — laboratory core: circular orbits, Eggleton Roche lobe,
   collinear L1 equilibrium, geometric light curve; educational approximations. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.ATLAS_BINARY30_CORE=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const G=6.67430e-11, MSUN=1.98847e30, RSUN=6.957e8, DAY=86400, TAU=2*Math.PI;
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function rocheFraction(q){if(!Number.isFinite(q)||q<=0)throw Error('q must be >0');const u=Math.cbrt(q),u2=u*u;return 0.49*u2/(0.6*u2+Math.log(1+u));}
 function periodDays(m1,m2,a){if(!(m1>0&&m2>0&&a>0))throw Error('Invalid orbital parameters');return TAU*Math.sqrt((a*RSUN)**3/(G*(m1+m2)*MSUN))/DAY;}
 function l1Normalized(m1,m2){
  if(!(m1>0&&m2>0))throw Error('Invalid masses');
  const mu=m2/(m1+m2),x1=-mu,x2=1-mu;
  const f=x=>x-(1-mu)/(x+mu)**2+mu/(x2-x)**2;
  let lo=x1+1e-8,hi=x2-1e-8;
  for(let i=0;i<95;i++){const x=(lo+hi)/2;if(f(x)>0)hi=x;else lo=x;}
  return (lo+hi)/2;
 }
 function radiusCompanion(kind,m2){switch(kind){
   case 'white-dwarf':return 0.0115*Math.sqrt(1/Math.max(0.3,m2));
   case 'neutron-star':return 12e3/RSUN;
   case 'black-hole':return (2*G*m2*MSUN/(299792458**2))/RSUN;
   case 'star':return Math.pow(m2,0.8);
   default:throw Error('Unknown companion kind');
 }}
 function derived(p){
   const m1=Number(p.m1),m2=Number(p.m2),a=Number(p.a),fill=Number(p.fill),incl=Number(p.incl);
   const kind=p.kind||'white-dwarf';
   if(!(m1>0&&m2>0&&a>0&&fill>0&&incl>=0&&incl<=90))throw Error('Invalid system');
   const mu=m2/(m1+m2),rl1=a*rocheFraction(m1/m2),rl2=a*rocheFraction(m2/m1);
   const r1=rl1*fill,r2=radiusCompanion(kind,m2);
   const overflow=fill>=1;
   const contact=overflow&&r2>=rl2;
   const period=periodDays(m1,m2,a),l1=l1Normalized(m1,m2);
   const diskR=overflow&&kind!=='star'?Math.min(rl2*.65,a*.29):0;
   // Brightness of accretion disk is qualitative; not a mass-transfer-rate computation.
   const lum1=Math.pow(m1,3.2),lum2=kind==='star'?Math.pow(m2,3.4):0.005*lum1;
   const diskLum=diskR>0?0.32*lum1:0;
   return {m1,m2,a,fill,incl,kind,rl1,rl2,r1,r2,mu,l1,period,overflow,contact,diskR,lum1,lum2,diskLum,
           condition: contact?'contact':overflow?'overflow':r2>=rl2?'companion-overflow':'detached'};
 }
 function orbit(phase,s){
  // Orbit of donor and companion about barycentre; phase=0 is conjunction.
  const angle=TAU*phase+Math.PI/2,co=Math.cos(angle),si=Math.sin(angle),inc=s.incl*Math.PI/180;
  const vec=(r)=>({x:r*co,y:r*si*Math.cos(inc),z:r*si*Math.sin(inc)});
  return {angle,donor:vec(-s.mu*s.a),accretor:vec((1-s.mu)*s.a),
          separationProjected:s.a*Math.hypot(co,si*Math.cos(inc))};
 }
 function overlapArea(r1,r2,d){
  if(!(r1>0&&r2>0)||d>=r1+r2)return 0;
  if(d<=Math.abs(r1-r2))return Math.PI*Math.min(r1,r2)**2;
  const a=clamp((d*d+r1*r1-r2*r2)/(2*d*r1),-1,1),b=clamp((d*d+r2*r2-r1*r1)/(2*d*r2),-1,1);
  return r1*r1*Math.acos(a)+r2*r2*Math.acos(b)-.5*Math.sqrt(Math.max(0,(-d+r1+r2)*(d+r1-r2)*(d-r1+r2)*(d+r1+r2)));
 }
 function flux(phase,s){
   const o=orbit(phase,s),r1=s.r1,r2=Math.max(s.r2,s.diskR);
   const f1=s.lum1,f2=s.lum2+s.diskLum;
   if(!(r1>0&&r2>0))return 1;
   const overlap=overlapArea(r1,r2,o.separationProjected),all=f1+f2;
   const blocked=o.donor.z>o.accretor.z? f2*overlap/(Math.PI*r2*r2) : f1*overlap/(Math.PI*r1*r1);
   return clamp((all-blocked)/all,0,1);
 }
 function rochePotential(x,y,s){
   const mu=s.mu,x1=-mu,x2=1-mu;
   const r1=Math.hypot(x-x1,y),r2=Math.hypot(x-x2,y);
   return -(1-mu)/Math.max(1e-7,r1)-mu/Math.max(1e-7,r2)-.5*(x*x+y*y);
 }
 // Numerical contours in orbital coordinates (units of binary separation).
 function equipotentialSegments(s,n=90){
   const phiL1=rochePotential(s.l1,0,s),left=-1.85,right=1.85,bottom=-1.24,top=1.24;
   const nx=n,ny=Math.round(n*.7),dx=(right-left)/nx,dy=(top-bottom)/ny;
   const val=new Float64Array((nx+1)*(ny+1));
   const ix=(x,y)=>y*(nx+1)+x;
   for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++)val[ix(i,j)]=rochePotential(left+i*dx,bottom+j*dy,s)-phiL1;
   const segments=[];
   for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
     const x=left+i*dx,y=bottom+j*dy,v=[val[ix(i,j)],val[ix(i+1,j)],val[ix(i+1,j+1)],val[ix(i,j+1)]];
     const p=[[x,y],[x+dx,y],[x+dx,y+dy],[x,y+dy]];
     const intersections=[];
     for(let k=0;k<4;k++){
       const h=(k+1)%4;if((v[k]<0)===(v[h]<0))continue;
       const a=v[k]/(v[k]-v[h]);intersections.push([p[k][0]+a*(p[h][0]-p[k][0]),p[k][1]+a*(p[h][1]-p[k][1])]);
     }
     if(intersections.length===2)segments.push([intersections[0],intersections[1]]);
     if(intersections.length===4){segments.push([intersections[0],intersections[1]],[intersections[2],intersections[3]]);}
   }
   return segments;
 }
 return {G,MSUN,RSUN,DAY,TAU,rocheFraction,periodDays,l1Normalized,radiusCompanion,derived,orbit,overlapArea,flux,rochePotential,equipotentialSegments};
});
