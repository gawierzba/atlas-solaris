/* ATLAS SOLARIS 11 · Circular coplanar Sun–Earth–Mars Lambert model. ES5 / Tizen compatible. */
(function () {
"use strict";
var MU=132712440018, AU=149597870.7, RE=AU, RM=1.523679*AU, DAY=86400;
var nEarth=Math.sqrt(MU/(RE*RE*RE)), nMars=Math.sqrt(MU/(RM*RM*RM));
var hohmannDays=Math.PI*Math.sqrt(Math.pow((RE+RM)/2,3)/MU)/DAY;
var initialPhase=Math.PI-nMars*DAY*hohmannDays;
function norm(a){a=a%(2*Math.PI);return a<0?a+2*Math.PI:a;}
function stumpff(z) {
 if(Math.abs(z)<0.000001){return {c:0.5-z/24+z*z/720,s:1/6-z/120+z*z/5040};}
 if(z>0){var w=Math.sqrt(z);return {c:(1-Math.cos(w))/z,s:(w-Math.sin(w))/(w*w*w)};}
 var u=Math.sqrt(-z);return {c:(Math.cosh(u)-1)/(-z),s:(Math.sinh(u)-u)/(u*u*u)};
}
function solve(startOffsetDays,flightDays) {
 var t=flightDays*DAY, aEarth=nEarth*startOffsetDays*DAY, aMars=initialPhase+nMars*(startOffsetDays+flightDays)*DAY;
 var d=norm(aMars-aEarth),eps=0.0001;
 /* Keep the position vectors consistent when regularizing collinear transfer geometry. */
 if(Math.abs(d-Math.PI)<eps)d=Math.PI-eps;
 if(d<eps)d=eps;
 if(d>2*Math.PI-eps)d=2*Math.PI-eps;
 aMars=aEarth+d;
 var cs=Math.cos(d),A=Math.sin(d)*Math.sqrt(RE*RM/(1-cs));
 if(!isFinite(A)||Math.abs(A)<0.001)return null;
 function timeFor(z){
  var st=stumpff(z);if(st.c<=0||!isFinite(st.c))return null;
  var y=RE+RM+A*(z*st.s-1)/Math.sqrt(st.c);
  if(y<=0||!isFinite(y))return null;
  var x=Math.sqrt(y/st.c);
  return {time:(x*x*x*st.s+A*Math.sqrt(y))/Math.sqrt(MU),y:y};
 }
 var low=-100,high=4*Math.PI*Math.PI-0.01,mid,state,i;
 for(i=0;i<52;i++){
  mid=(low+high)/2;state=timeFor(mid);
  if(state===null||state.time<t)low=mid;else high=mid;
 }
 state=timeFor((low+high)/2);if(state===null)return null;
 var y=state.y,f=1-y/RE,g=A*Math.sqrt(y/MU),gDot=1-y/RM;
 if(!isFinite(g)||Math.abs(g)<0.001)return null;
 var x1=RE*Math.cos(aEarth),y1=RE*Math.sin(aEarth);
 var x2=RM*Math.cos(aMars),y2=RM*Math.sin(aMars);
 var vx1=(x2-f*x1)/g,vy1=(y2-f*y1)/g;
 var vx2=(gDot*x2-x1)/g,vy2=(gDot*y2-y1)/g;
 var veX=-nEarth*y1,veY=nEarth*x1,vmX=-nMars*y2,vmY=nMars*x2;
 var vinf=Math.sqrt(Math.pow(vx1-veX,2)+Math.pow(vy1-veY,2));
 var arrived=Math.sqrt(Math.pow(vx2-vmX,2)+Math.pow(vy2-vmY,2));
 if(!isFinite(vinf)||!isFinite(arrived))return null;
 return {c3:vinf*vinf,vinf:vinf,arrival:arrived,days:flightDays,offset:startOffsetDays,angle:d*180/Math.PI};
}
if(typeof window!=="undefined")window.ATLAS11_MODEL={solve:solve,hohmannDays:hohmannDays,initialPhaseDegrees:initialPhase*180/Math.PI,unit:"km²/s²",assumptions:"Dwie kolowe wspolplaszczyznowe orbity, Slonce, jednoobiegowy transfer Lambert"};
if(typeof document==="undefined")return;
function byId(id){return document.getElementById(id);}
function txt(id,v){var e=byId(id);if(e)e.textContent=v;}
var slideStart=byId("m11-launch"),slideFlight=byId("m11-flight"),marker=byId("m11-map-cross");
function pl(n,p){return isFinite(n)?n.toFixed(p||0).replace(".",","):"—";}
function selected(){
 if(!slideStart||!slideFlight)return;
 var start=Number(slideStart.value),days=Number(slideFlight.value),out=solve(start,days);
 txt("m11-launch-value",(start>0?"+":"")+start+" dni");
 txt("m11-flight-value",days+" dni");
 if(marker){marker.style.left=(((start+90)/180)*100).toFixed(2)+"%";marker.style.top=(((380-days)/210)*100).toFixed(2)+"%";}
 if(!out){txt("m11-c3","—");txt("m11-vinf","—");txt("m11-arrival","—");txt("m11-quality","Granica modelu");txt("m11-status","Dla tych parametrów uproszczony model nie zwrócił wiarygodnego wyniku.");return;}
 txt("m11-c3",pl(out.c3,1));txt("m11-vinf",pl(out.vinf,2));txt("m11-arrival",pl(out.arrival,2));
 var quality,remark;
 if(out.c3<13){quality="Niski koszt energetyczny";remark="Wybrany punkt znajduje się w korzystnej dolinie modelowej mapy.";}
 else if(out.c3<27){quality="Umiarkowany koszt";remark="Taka podróż wymaga większej prędkości nadmiarowej przy Ziemi.";}
 else if(out.c3<80){quality="Wysoki koszt";remark="Warto poszukać innej pary terminów startu i przylotu.";}
 else{quality="Bardzo wysoki koszt";remark="Model przewiduje trudną energetycznie trajektorię.";}
 txt("m11-quality",quality);txt("m11-status",remark);
}
if(slideStart&&slideFlight){
 slideStart.addEventListener("input",selected);slideFlight.addEventListener("input",selected);
 var reset=byId("m11-reset");if(reset)reset.addEventListener("click",function(){slideStart.value="0";slideFlight.value=String(Math.round(hohmannDays));selected();slideStart.focus();});
 selected();
}
var canvas=byId("m11-map");
if(canvas&&canvas.getContext){
 var ctx=canvas.getContext("2d");
 if(ctx){
  var cols=66,rows=50,cw=canvas.width/cols,ch=canvas.height/rows,ri=0;
  function mix(a,b,t){return Math.round(a+(b-a)*t);}
  function shade(v){
   if(!v||!isFinite(v))return "#27303e";
   var stops=[{at:8,c:[11,168,153]},{at:13,c:[30,140,143]},{at:23,c:[56,108,144]},{at:48,c:[109,104,151]},{at:105,c:[202,125,115]},{at:180,c:[238,154,106]},{at:400,c:[107,61,68]}];
   if(v<=stops[0].at)return "rgb(11,168,153)";
   for(var j=1;j<stops.length;j++){
    if(v<=stops[j].at){
     var a=stops[j-1],b=stops[j],t=(Math.log(v)-Math.log(a.at))/(Math.log(b.at)-Math.log(a.at));
     return "rgb("+mix(a.c[0],b.c[0],t)+","+mix(a.c[1],b.c[1],t)+","+mix(a.c[2],b.c[2],t)+")";
    }
   }
   return "#4b3441";
  }
  function draw(){
   var stop=Math.min(rows,ri+3);
   for(var r=ri;r<stop;r++){
    var flight=380-(r+0.5)*210/rows;
    for(var c=0;c<cols;c++){
     var offset=-90+(c+0.5)*180/cols;
     var p=solve(offset,flight);
     ctx.fillStyle=shade(p&&p.c3);
     ctx.fillRect(c*cw,r*ch,cw+0.6,ch+0.6);
    }
   }
   ri=stop;
   if(ri<rows){window.setTimeout(draw,0);} else {
    var fallback=byId("m11-map-fallback");if(fallback)fallback.hidden=true;
   }
  }
  window.setTimeout(draw,90);
  function choose(evt){
   var rect=canvas.getBoundingClientRect();
   if(!rect.width||!rect.height)return;
   var x=Math.max(0,Math.min(1,(evt.clientX-rect.left)/rect.width));
   var y=Math.max(0,Math.min(1,(evt.clientY-rect.top)/rect.height));
   slideStart.value=String(Math.round(-90+x*180));slideFlight.value=String(Math.round(380-y*210));selected();
  }
  canvas.addEventListener("click",choose);
 }
}
var about=byId("stageAbout"),info=byId("stageInfo"),close=byId("stageInfoClose");
function infoSet(open){if(!info)return;info.hidden=!open;if(about)about.setAttribute("aria-expanded",open?"true":"false");}
if(about&&info)about.addEventListener("click",function(){infoSet(info.hidden);});
if(close)close.addEventListener("click",function(){infoSet(false);if(about)about.focus();});
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&info&&!info.hidden)infoSet(false);});
var btn=byId("m11-launch-lab"),frame=byId("stageFrame"),placeholder=byId("m11-lab-placeholder");
if(btn&&frame&&placeholder){
 btn.addEventListener("click",function(){
  if(!frame.src)frame.src=frame.getAttribute("data-src");
  frame.hidden=false;placeholder.hidden=true;btn.disabled=true;frame.focus();
 });
}
})();
