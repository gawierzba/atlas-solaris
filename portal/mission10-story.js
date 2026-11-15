/* ATLAS SOLARIS 10 · self-contained scientific teaching widget; classic JS for Tizen */
(function(){
"use strict";
var $=function(id){return document.getElementById(id);};
var input=$("m10-phase"), mars=$("m10-mars"),ray=$("m10-mars-ray"), label=$("m10-mars-label"),err=$("m10-error"),result=$("m10-result"),phase=$("m10-phase-number"),reset=$("m10-reset");
var a=(1+1.523679)/2, duration=0.5*Math.sqrt(a*a*a)*365.25636, nMars=360/686.98, ideal=180-nMars*duration;
function refresh(){
if(!input)return;
var d=parseFloat(input.value), rad=d*Math.PI/180, x=300+203*Math.cos(rad),y=230-203*Math.sin(rad), deviation=Math.abs(d-ideal);
mars.setAttribute("cx",x.toFixed(2));mars.setAttribute("cy",y.toFixed(2));ray.setAttribute("d","M300 230L"+x.toFixed(2)+" "+y.toFixed(2));label.setAttribute("x",(x+14).toFixed(2));label.setAttribute("y",(y-12).toFixed(2));
phase.textContent=d+"°";err.textContent=deviation.toFixed(1).replace(".",",")+"°";
result.textContent=deviation<3?"Geometria bliska idealnemu transferowi":deviation<13?"Przybliżony kurs wymaga zmiany trajektorii":"Przy tej konfiguracji idealny transfer minie Marsa";
}
if(input){input.addEventListener("input",refresh);refresh();}
if(reset)reset.addEventListener("click",function(){input.value=Math.round(ideal);refresh();input.focus();});
if($("m10-duration"))$("m10-duration").textContent=Math.round(duration)+" dni";
if($("m10-optimal"))$("m10-optimal").textContent=Math.round(ideal)+"°";
var button=$("m10-launch"), frame=$("m10-mission-frame"), placeholder=$("m10-lab-placeholder");
if(button&&frame&&placeholder){button.addEventListener("click",function(){frame.src=frame.getAttribute("data-src");frame.hidden=false;placeholder.hidden=true;button.disabled=true;frame.focus();});}
})();
