/* ATLAS SOLARIS 12 · Circular Restricted Three Body Problem.
   Earth–Moon, rotating barycentric frame, normalized units, classic ES5 for Tizen. */
(function(){
"use strict";
var GME=398600.4418, GMM=4902.8001, DIST=384400, MU=GMM/(GME+GMM);
var N=Math.sqrt((GME+GMM)/(DIST*DIST*DIST)), VSCALE=DIST*N*1000;
var pointNames=["L1","L2","L3","L4","L5"], selected="L4";
function eq(x){
 var a=x+MU,b=x-1+MU;
 return x-(1-MU)*a/Math.pow(Math.abs(a),3)-MU*b/Math.pow(Math.abs(b),3);
}
function bisect(a,b){
 var fa=eq(a),fb=eq(b),m,fm,i;
 for(i=0;i<90;i++){m=(a+b)/2;fm=eq(m);if(fa*fm<=0){b=m;fb=fm;}else{a=m;fa=fm;}}
 return (a+b)/2;
}
var pts={
 L1:[bisect(-MU+.001,1-MU-.001),0],
 L2:[bisect(1-MU+.001,2),0],
 L3:[bisect(-2,-MU-.001),0],
 L4:[.5-MU,Math.sqrt(3)/2],
 L5:[.5-MU,-Math.sqrt(3)/2]
};
function deriv(z){
 var x=z[0],y=z[1],vx=z[2],vy=z[3],q=x+MU,r=x-1+MU;
 var a=Math.pow(q*q+y*y,1.5),b=Math.pow(r*r+y*y,1.5);
 if(a<0.0000001||b<0.0000001)return null;
 return [vx,vy,2*vy+x-(1-MU)*q/a-MU*r/b,-2*vx+y-(1-MU)*y/a-MU*y/b];
}
function integrate(name,impulse){
 var p=pts[name],z=[p[0]+.004,p[1],0,impulse/VSCALE],dt=.012,steps=1550,path=[[z[0],z[1]]],end=0,crash=false,i,k1,k2,k3,k4,j,tmp,next;
 for(i=0;i<steps;i++){
  k1=deriv(z);if(!k1){crash=true;break;}
  tmp=[];for(j=0;j<4;j++)tmp.push(z[j]+dt*k1[j]/2);k2=deriv(tmp);if(!k2){crash=true;break;}
  tmp=[];for(j=0;j<4;j++)tmp.push(z[j]+dt*k2[j]/2);k3=deriv(tmp);if(!k3){crash=true;break;}
  tmp=[];for(j=0;j<4;j++)tmp.push(z[j]+dt*k3[j]);k4=deriv(tmp);if(!k4){crash=true;break;}
  next=[];for(j=0;j<4;j++)next.push(z[j]+dt*(k1[j]+2*k2[j]+2*k3[j]+k4[j])/6);
  z=next;end=i+1;
  if(!isFinite(z[0])||!isFinite(z[1])||Math.abs(z[0])>20||Math.abs(z[1])>20){crash=true;break;}
  if(i%6===0)path.push([z[0],z[1]]);
 }
 path.push([z[0],z[1]]);
 var departure=Math.sqrt(Math.pow(z[0]-p[0],2)+Math.pow(z[1]-p[1],2))*DIST;
 return {point:name,position:z,track:path,days:end*dt/N/86400,offsetKm:departure,interrupted:crash,impulse:impulse};
}
function xy(x,y){return [Math.round((420+207*x)*100)/100,Math.round((300-207*y)*100)/100];}
function byId(id){return document.getElementById(id);}
function setText(id,value){var o=byId(id);if(o)o.textContent=value;}
function fmt(n){if(!isFinite(n))return "—";return Math.round(n).toLocaleString ? Math.round(n).toLocaleString("pl-PL"):String(Math.round(n));}
function paint(){
 var inp=byId("g12-impulse");if(!inp)return;
 var impulse=Number(inp.value),result=integrate(selected,impulse),p=pts[selected];
 setText("g12-impulse-value",impulse+" m/s");
 setText("g12-selected",selected+(selected==="L4"||selected==="L5"?" · punkt trójkątny":" · punkt współliniowy"));
 setText("g12-stability",(selected==="L4"||selected==="L5")?"Liniowo stabilny w idealnym modelu":"Niestabilny w idealnym modelu");
 setText("g12-days","~"+Math.round(result.days)+" dni");
 setText("g12-offset",fmt(result.offsetKm)+" km");
 setText("g12-outcome",result.interrupted?"Silne zbliżenie / ucieczka":(result.offsetKm<30000?"Ruch w sąsiedztwie":"Wyraźne oddalenie"));
 var path=byId("g12-trail"),probe=byId("g12-probe"),s="",i,q;
 for(i=0;i<result.track.length;i++){q=xy(result.track[i][0],result.track[i][1]);s+=(i===0?"M":"L")+q[0]+" "+q[1]+" ";}
 if(path){path.setAttribute("d",s);path.setAttribute("stroke",(selected==="L4"||selected==="L5")?"#8de0d9":"#f1b4aa");}
 if(probe){q=xy(result.position[0],result.position[1]);probe.setAttribute("cx",q[0]);probe.setAttribute("cy",q[1]);}
 var buttons=document.querySelectorAll(".g12-point-selector button"),b;
 for(i=0;i<buttons.length;i++){b=buttons[i];b.setAttribute("aria-pressed",b.getAttribute("data-l")===selected?"true":"false");}
 var circles=document.querySelectorAll("#g12-points circle");
 for(i=0;i<circles.length;i++){circles[i].setAttribute("class",circles[i].getAttribute("data-point")===selected?"is-selected":"");}
}
if(typeof window!=="undefined")window.ATLAS12_MODEL={points:pts,integrate:integrate,massFraction:MU,distanceKm:DIST,speedUnitMs:VSCALE,gravity:"CR3BP"};
if(typeof document==="undefined")return;
var circles=document.querySelectorAll("#g12-points circle"),keys=["L1","L2","L3","L4","L5"];
for(var i=0;i<keys.length;i++){
 var name=keys[i],pos=xy(pts[name][0],pts[name][1]),circle=document.querySelector('#g12-points circle[data-point="'+name+'"]');
 if(circle){circle.setAttribute("cx",pos[0]);circle.setAttribute("cy",pos[1]);}
}
var earth=xy(-MU,0),moon=xy(1-MU,0);
if(byId("g12-earth")){byId("g12-earth").setAttribute("cx",earth[0]);byId("g12-earth").setAttribute("cy",earth[1]);}
if(byId("g12-moon")){byId("g12-moon").setAttribute("cx",moon[0]);byId("g12-moon").setAttribute("cy",moon[1]);}
var buttons=document.querySelectorAll(".g12-point-selector button");
for(i=0;i<buttons.length;i++){buttons[i].addEventListener("click",function(){selected=this.getAttribute("data-l");paint();});}
if(byId("g12-impulse"))byId("g12-impulse").addEventListener("input",paint);
if(byId("g12-reset"))byId("g12-reset").addEventListener("click",function(){selected="L4";byId("g12-impulse").value="8";paint();});
paint();
var info=byId("stageInfo"),about=byId("stageAbout"),close=byId("stageInfoClose");
function showInfo(open){if(!info)return;info.hidden=!open;if(about)about.setAttribute("aria-expanded",open?"true":"false");}
if(about&&info)about.addEventListener("click",function(){showInfo(info.hidden);});
if(close)close.addEventListener("click",function(){showInfo(false);if(about)about.focus();});
document.addEventListener("keydown",function(e){if((e.key||e.keyCode)==="Escape"&&info&&!info.hidden)showInfo(false);});
var launch=byId("g12-lab-launch"),frame=byId("stageFrame"),placeholder=byId("g12-lab-placeholder");
if(launch&&frame&&placeholder)launch.addEventListener("click",function(){frame.src=frame.getAttribute("data-src");frame.hidden=false;placeholder.hidden=true;launch.disabled=true;frame.focus();});
})();
