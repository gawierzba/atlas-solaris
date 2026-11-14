/* ATLAS SOLARIS 31.0 — cienka soczewka punktowa (geometria euklidesowa).
   Wielkości kątowe w radianach, współrzędne x,y w jednostkach theta_E.
   Odległości D_l, D_s, D_ls = D_s-D_l traktujemy jako efektywne: to nie model FLRW. */
(function(root){
'use strict';
const G=6.67430e-11,C=299792458,MS=1.98847e30,PC=3.085677581491367e16,ARCSEC=180*3600/Math.PI;
function einsteinRadians(massSolar,dlGpc,dsGpc){
 if(!Number.isFinite(massSolar)||massSolar<=0||!Number.isFinite(dlGpc)||!Number.isFinite(dsGpc)||dlGpc<=0||dsGpc<=dlGpc)throw new RangeError('Wymagane: M>0, 0<D_l<D_s');
 const dl=dlGpc*1e9*PC, ds=dsGpc*1e9*PC, dls=ds-dl;
 return Math.sqrt(4*G*massSolar*MS/(C*C)*dls/(dl*ds));
}
function einsteinArcseconds(massSolar,dlGpc,dsGpc){return einsteinRadians(massSolar,dlGpc,dsGpc)*ARCSEC}
function mapImageToSource(x,y){const r2=x*x+y*y;if(r2<1e-18)return{x:Infinity,y:Infinity,critical:true};return{x:x-x/r2,y:y-y/r2,critical:false}}
function images(bx,by){
 const u=Math.hypot(bx,by);
 if(u<1e-9)return{ring:true,radius:1,separation:2,magnification:Infinity,primary:null,secondary:null};
 const disc=Math.sqrt(u*u+4), r1=(u+disc)/2, r2=(u-disc)/2, m=(u*u+2)/(u*disc);
 return {ring:false,radius:null,separation:disc,magnification:m,
 primary:{x:bx*r1/u,y:by*r1/u,parity:1,absoluteMagnification:(m+1)/2},
 secondary:{x:bx*r2/u,y:by*r2/u,parity:-1,absoluteMagnification:(m-1)/2}};
}
function lightcurve(x,impact){return images(x,impact).magnification}
const api=Object.freeze({einsteinRadians,einsteinArcseconds,mapImageToSource,images,lightcurve});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.AtlasLens31=api;
})(typeof globalThis!=='undefined'?globalThis:this);
