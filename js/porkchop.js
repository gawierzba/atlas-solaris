/* ATLAS SOLARIS 11.0 — Laboratorium Trajektorii (porkchop plot)
   Real sampled Lambert solutions, 3D JPL-approximate positions, and v-infinity metrics.
   Scientific/educational, heliocentric two-body; not an operational flight design. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const AU_KM=149597870.7,AU_DAY_TO_KMS=AU_KM/86400;
const DAY=86400000, JD_EPOCH=2440587.5;
const BODY={mercury:'Merkury',venus:'Wenus',earth:'Ziemia',mars:'Mars',jupiter:'Jowisz',saturn:'Saturn'};
const COLS=40,ROWS=26,BATCH=13,DATE_CUTOFF=Date.parse('2050-12-31T23:59:00Z')/DAY+JD_EPOCH;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const dateFromJD=jd=>new Date((jd-JD_EPOCH)*DAY);
const jdFromDate=date=>date.getTime()/DAY+JD_EPOCH;
const dateLabel=jd=>dateFromJD(jd).toLocaleDateString('pl-PL',{year:'numeric',month:'short',day:'numeric',timeZone:'UTC'});
const fullDate=jd=>dateFromJD(jd).toLocaleDateString('pl-PL',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'});
const num=(x,d=2)=>Number(x).toLocaleString('pl-PL',{minimumFractionDigits:d,maximumFractionDigits:d});
const norm=v=>Math.hypot(v[0],v[1],v[2]);
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
const parseDate=x=>{const d=new Date(x+'T12:00:00Z');return Number.isFinite(d.getTime())?jdFromDate(d):null;};
const getPositions=jd=>window.ATLAS_MAIN_API.positions(jd);
const solver=()=>window.ATLAS_MISSIONS_TEST;
let token=0,job=null,plotBox=null,hovered=null,runFrame=0,resizeQueued=false;
const state={
 from:'earth',to:'mars',baseJD:null,months:30,minDays:155,maxDays:440,
 metric:'sum',grid:[],best:null,selected:null,complete:false,priorPlaying:null,routeChanged:true,
 range:[0,1],valid:0,failed:0,progress:0,lastParams:''
};
function metricName(){return {sum:'v∞ odlotu + v∞ przylotu',c3:'Energia odlotu C3',arrival:'v∞ przy przylocie'}[state.metric];}
function unit(){return state.metric==='c3'?'km²/s²':'km/s';}
function val(m){return m?state.metric==='c3'?m.c3:state.metric==='arrival'?m.vArr:m.sum:Infinity;}
function monthsLater(jd,months){
 const d=dateFromJD(jd);
 const startDay=d.getUTCDate();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+months);
 const last=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();
 d.setUTCDate(Math.min(startDay,last));return jdFromDate(d);
}
function inputParams(){
 const from=$('pcFrom').value,to=$('pcTo').value,base=parseDate($('pcStart').value);
 const months=Number($('pcSpan').value),minDays=Number($('pcMinDays').value),maxDays=Number($('pcMaxDays').value);
 if(!BODY[from]||!BODY[to]||from===to||base===null||!Number.isFinite(months)||!Number.isFinite(minDays)||!Number.isFinite(maxDays)||minDays<20||maxDays<=minDays||maxDays>4000||months<1)return null;
 return {from,to,baseJD:base,months,minDays,maxDays};
}
function defaultDurations(){
 const h=solver().calc($('pcFrom').value,$('pcTo').value).days;
 const shortest=Math.max(30,Math.round(h*.58)),longest=Math.min(4000,Math.round(h*1.76));
 $('pcMinDays').value=shortest;$('pcMaxDays').value=longest;
}
function velocity(id,jd){
 const delta=.02,a=getPositions(jd-delta)[id],b=getPositions(jd+delta)[id];
 return [(b[0]-a[0])/(2*delta),(b[1]-a[1])/(2*delta),(b[2]-a[2])/(2*delta)];
}
function evaluate(jd,days){
 if(jd+days>DATE_CUTOFF||jd<2378496.5)return null;
 const a=getPositions(jd)[state.from],b=getPositions(jd+days)[state.to];
 const solution=solver().solveLambert(a,b,days);
 if(!solution)return null;
 const vA=velocity(state.from,jd),vB=velocity(state.to,jd+days);
 const vDep=distance(solution.v0,vA)*AU_DAY_TO_KMS;
 const vArr=distance(solution.v1,vB)*AU_DAY_TO_KMS;
 if(!Number.isFinite(vDep)||!Number.isFinite(vArr)||vDep>250||vArr>250)return null;
 return {launchJD:jd,arrivalJD:jd+days,days,vDep,vArr,c3:vDep*vDep,sum:vDep+vArr};
}
function layout(){
 const c=$('pcCanvas'),w=Math.max(280,c.clientWidth||850),h=Math.max(270,c.clientHeight||480);
 return {w,h,x:61,y:23,pw:Math.max(100,w-83),ph:Math.max(110,h-81)};
}
function color(t){
 const stops=[[21,73,119],[29,139,166],[70,190,171],[155,146,156],[206,88,116]];
 const x=clamp(t,0,1)*(stops.length-1),i=Math.min(stops.length-2,Math.floor(x)),a=x-i,c=stops[i],d=stops[i+1];
 return 'rgb('+c.map((n,k)=>Math.round(n+(d[k]-n)*a)).join(',')+')';
}
function shade(v){
 const [lo,hi]=state.range;
 return color((v-lo)/Math.max(.001,hi-lo));
}
function recomputeRange(){
 const scores=state.grid.filter(Boolean).map(val).filter(Number.isFinite).sort((a,b)=>a-b);
 if(!scores.length){state.range=[0,1];return;}
 const p=q=>scores[Math.floor((scores.length-1)*q)];
 const low=p(.06),hi=p(.87);
 state.range=[low,hi<=low?low+1:hi];
}
function draw(){
 $('pcMetricLabel').textContent=metricName();
 const c=$('pcCanvas');if(!c)return;
 const L=layout(),dpr=Math.min(2,window.devicePixelRatio||1);
 if(c.width!==Math.round(L.w*dpr)||c.height!==Math.round(L.h*dpr)){c.width=Math.round(L.w*dpr);c.height=Math.round(L.h*dpr);}
 const ctx=c.getContext('2d');if(!ctx)return;ctx.setTransform(dpr,0,0,dpr,0,0);
 const {w,h,x,y,pw,ph}=L;plotBox=L;
 ctx.fillStyle='#071321';ctx.fillRect(0,0,w,h);
 const grad=ctx.createLinearGradient(0,y,0,y+ph);grad.addColorStop(0,'#132d44');grad.addColorStop(1,'#081727');
 ctx.fillStyle=grad;ctx.fillRect(x,y,pw,ph);
 const cw=pw/COLS,ch=ph/ROWS;
 for(let row=0;row<ROWS;row++)for(let col=0;col<COLS;col++){
  const item=state.grid[row*COLS+col];
  if(item===undefined)continue;
  ctx.fillStyle=item?shade(val(item)):'#26384a';
  ctx.fillRect(x+col*cw+.18,y+row*ch+.18,Math.max(.6,cw-.36),Math.max(.6,ch-.36));
 }
 ctx.strokeStyle='#638fa540';ctx.lineWidth=1;
 ctx.strokeRect(x+.5,y+.5,pw-1,ph-1);
 ctx.font='10px system-ui';ctx.fillStyle='#9bb6c8';ctx.textAlign='center';
 for(let k=0;k<=4;k++){
  const xx=x+k*pw/4;
  ctx.beginPath();ctx.strokeStyle='#ffffff20';ctx.moveTo(xx,y);ctx.lineTo(xx,y+ph);ctx.stroke();
  const date=state.baseJD===null?null:state.baseJD+(monthsLater(state.baseJD,state.months)-state.baseJD)*k/4;
  ctx.fillStyle='#9bb6c8';if(date!==null)ctx.fillText(dateFromJD(date).toLocaleDateString('pl-PL',{month:'short',year:'2-digit',timeZone:'UTC'}),xx,y+ph+20);
 }
 ctx.textAlign='right';
 for(let k=0;k<=4;k++){
  const yy=y+k*ph/4;
  ctx.strokeStyle='#ffffff20';ctx.beginPath();ctx.moveTo(x,yy);ctx.lineTo(x+pw,yy);ctx.stroke();
  ctx.fillStyle='#9bb6c8';ctx.fillText(String(Math.round(state.maxDays-(state.maxDays-state.minDays)*k/4)),x-9,yy+3);
 }
 ctx.save();ctx.translate(15,y+ph/2);ctx.rotate(-Math.PI/2);ctx.textAlign='center';ctx.font='10px system-ui';ctx.fillStyle='#9bb6c8';ctx.fillText('CZAS LOTU · DNI',0,0);ctx.restore();
 ctx.fillStyle='#a7cbd7';ctx.textAlign='center';ctx.font='11px system-ui';ctx.fillText('DATA STARTU →',x+pw/2,h-13);
 const mapPoint=m=>({
  sx:x+((m.launchJD-state.baseJD)/(monthsLater(state.baseJD,state.months)-state.baseJD))*pw,
  sy:y+((state.maxDays-m.days)/(state.maxDays-state.minDays))*ph
 });
 if(state.best){
  const p=mapPoint(state.best);
  ctx.strokeStyle='#f7ffff';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(p.sx,p.sy,8,0,Math.PI*2);ctx.stroke();
  ctx.beginPath();ctx.moveTo(p.sx-11,p.sy);ctx.lineTo(p.sx+11,p.sy);ctx.moveTo(p.sx,p.sy-11);ctx.lineTo(p.sx,p.sy+11);ctx.stroke();
 }
 if(state.selected){
  const p=mapPoint(state.selected);ctx.strokeStyle='#e8ffff';ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(p.sx,p.sy,4.5,0,Math.PI*2);ctx.stroke();
  ctx.beginPath();ctx.arc(p.sx,p.sy,11.5,0,Math.PI*2);ctx.stroke();
 }
 if(hovered){
  const p=mapPoint(hovered);ctx.strokeStyle='#ffffff70';ctx.lineWidth=1;ctx.beginPath();ctx.arc(p.sx,p.sy,9,0,2*Math.PI);ctx.stroke();
 }
 if(!state.grid.length){
  ctx.fillStyle='#c5e6ed';ctx.font='600 16px system-ui';ctx.textAlign='center';
  ctx.fillText('WYBIERZ TRASĘ I OBLICZ MAPĘ',x+pw/2,y+ph/2);
 }
 drawLegend();
}
function drawLegend(){
 const c=$('pcLegend'),ctx=c.getContext('2d');if(!ctx)return;
 const w=Math.max(180,c.clientWidth||360),h=32,dpr=Math.min(2,window.devicePixelRatio||1);
 if(c.width!==Math.round(w*dpr)||c.height!==Math.round(h*dpr)){c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);}
 ctx.setTransform(dpr,0,0,dpr,0,0);
 ctx.clearRect(0,0,w,h);const n=70,x=4,width=w-8;
 for(let i=0;i<n;i++){ctx.fillStyle=color(i/(n-1));ctx.fillRect(x+i*width/n,3,width/n+1,10);}
 ctx.font='10px system-ui';ctx.fillStyle='#9fbacc';ctx.textAlign='left';ctx.fillText(num(state.range[0],1)+' '+unit(),x,27);
 ctx.textAlign='right';ctx.fillText(num(state.range[1],1)+' '+unit(),x+width,27);
}
function select(m){
 if(!m)return;
 state.selected=m;
 const cells=[
  ['pcChosenStart',fullDate(m.launchJD)],['pcChosenArrival',fullDate(m.arrivalJD)],
  ['pcChosenTime',num(m.days,1)+' dni'],['pcChosenC3',num(m.c3,2)+' km²/s²'],
  ['pcChosenDep',num(m.vDep,2)+' km/s'],['pcChosenArr',num(m.vArr,2)+' km/s'],
  ['pcChosenTotal',num(m.sum,2)+' km/s']
 ];
 for(const [id,text]of cells)$(id).textContent=text;
 $('pcMission').disabled=false;$('pcCopy').disabled=false;
 $('pcSelection').textContent='Wybrany punkt mapy. Sonda dotrze do celu w tej samej chwili, którą pokazuje data przylotu.';
 draw();
}
function status(msg){$('pcStatus').textContent=msg;}
function countProgress(n,total){
 state.progress=n/total;$('pcProgress').value=Math.round(state.progress*100);
 $('pcPercent').textContent=Math.round(state.progress*100)+'%';
 status('Obliczam '+n.toLocaleString('pl-PL')+' / '+total.toLocaleString('pl-PL')+' wariantów lotu…');
}
function recomputeBest(){
 let best=null;
 for(const m of state.grid)if(m&&(!best||val(m)<val(best)))best=m;
 if(!best){state.best=null;select(null);return;}
 if(state.complete){
  const dx=(monthsLater(state.baseJD,state.months)-state.baseJD)/COLS,dy=(state.maxDays-state.minDays)/ROWS;
  // Deterministic local refinement around the best solved grid cell.
  for(const scale of [1,.5,.25,.125,.06]){
   let candidate=best;
   for(const i of [-1,0,1])for(const j of [-1,0,1]){
    const launch=best.launchJD+i*dx*scale,days=best.days+j*dy*scale;
    if(launch<state.baseJD||launch>monthsLater(state.baseJD,state.months)||days<state.minDays||days>state.maxDays)continue;
    const m=evaluate(launch,days);if(m&&val(m)<val(candidate))candidate=m;
   }
   best=candidate;
  }
 }
 state.best=best;
 select(best);
 $('pcBestMetric').textContent=num(val(best),2)+' '+unit();
 $('pcBestStart').textContent=fullDate(best.launchJD);
 $('pcBestTime').textContent=num(best.days,1)+' dni';
}
function run(){
 const p=inputParams();
 if(!p){token++;status('Sprawdź planetę docelową, datę i zakres czasu lotu.');return;}
 Object.assign(state,p);
 token++;const active=token;
 state.grid=new Array(COLS*ROWS);state.best=null;state.selected=null;
 state.valid=0;state.failed=0;state.complete=false;state.progress=0;
 hovered=null;$('pcMission').disabled=true;$('pcCopy').disabled=true;$('pcCSV').disabled=true;
 for(const id of ['pcChosenStart','pcChosenArrival','pcChosenTime','pcChosenC3','pcChosenDep','pcChosenArr','pcChosenTotal'])$(id).textContent='—';
 $('pcSelection').textContent='Mapa jest obliczana…';$('pcBestMetric').textContent='—';$('pcBestStart').textContent='—';$('pcBestTime').textContent='—';
 countProgress(0,state.grid.length);
 const span=monthsLater(p.baseJD,p.months)-p.baseJD,total=COLS*ROWS;
 let at=0;
 function chunk(){
  if(active!==token||!$('porkchopDialog').open)return;
  const end=Math.min(total,at+BATCH);
  for(;at<end;at++){
   const i=at%COLS,j=Math.floor(at/COLS);
   const jd=p.baseJD+span*(i+.5)/COLS;
   const days=p.maxDays-(p.maxDays-p.minDays)*(j+.5)/ROWS;
   const m=evaluate(jd,days);
   state.grid[at]=m;
   if(m)state.valid++;else state.failed++;
  }
  if(at%COLS<BATCH||at===total){
   recomputeRange();draw();countProgress(at,total);
  }
  if(at<total){runFrame=requestAnimationFrame(chunk);return;}
  state.complete=true;recomputeRange();recomputeBest();draw();
  $('pcCSV').disabled=state.valid===0;
  if(state.valid){
   status('Zbadano '+total.toLocaleString('pl-PL')+' par (start, czas lotu); rozwiązania: '+
     state.valid.toLocaleString('pl-PL')+'. Biały krzyżyk: najniższy koszt według wybranej miary.');
   $('pcSelection').textContent='Biały krzyżyk oznacza najkorzystniejszy znaleziony wariant w badanym zakresie. Dotknij innego miejsca na mapie, aby zobaczyć jego parametry.';
  }else status('Brak poprawnych rozwiązań w wybranym przedziale. Zmień daty lub zakres czasu lotu.');
 }
 runFrame=requestAnimationFrame(chunk);
}
function changeMetric(){
 state.metric=$('pcMetric').value;
 if(!state.complete){draw();return;}
 recomputeRange();recomputeBest();draw();
}
function pointerCell(event){
 if(!plotBox)return null;
 const r=$('pcCanvas').getBoundingClientRect(),x=(event.clientX-r.left)*plotBox.w/r.width,y=(event.clientY-r.top)*plotBox.h/r.height;
 if(x<plotBox.x||x>=plotBox.x+plotBox.pw||y<plotBox.y||y>=plotBox.y+plotBox.ph)return null;
 const i=clamp(Math.floor((x-plotBox.x)/plotBox.pw*COLS),0,COLS-1);
 const j=clamp(Math.floor((y-plotBox.y)/plotBox.ph*ROWS),0,ROWS-1);
 return {i,j,m:state.grid[j*COLS+i]};
}
function exportCSV(){
 if(!state.complete||!state.valid)return;
 const header=['ATLAS SOLARIS 11.0','Model heliocentryczny dwuciałowy; orbity planet JPL-approx; transfer zero-rev Lambert',
 'Trajektoria: '+BODY[state.from]+' > '+BODY[state.to],'Data początkowa: '+fullDate(state.baseJD),'Data startu UTC;Data przylotu UTC;Czas lotu [dni];v∞ odlot [km/s];C3 [km2/s2];v∞ przylot [km/s];Suma v∞ [km/s]'].join('\r\n');
 const rows=state.grid.filter(Boolean).map(m=>[
  dateFromJD(m.launchJD).toISOString().slice(0,10),dateFromJD(m.arrivalJD).toISOString().slice(0,10),
  m.days.toFixed(4),m.vDep.toFixed(5),m.c3.toFixed(5),m.vArr.toFixed(5),m.sum.toFixed(5)].join(';'));
 const blob=new Blob(['\uFEFF'+header+'\r\n'+rows.join('\r\n')+'\r\n'],{type:'text/csv;charset=utf-8'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='Atlas_Solaris_11_'+state.from+'_'+state.to+'.csv';
 document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
function sendToMission(){
 const m=state.selected;if(!m)return;
 const open=window.ATLAS_MISSIONS?.openSelected;
 if(typeof open!=='function'){status('Moduł misji nie jest dostępny. Odśwież stronę.');return;}
 close();
 if(!open({from:state.from,to:state.to,launchJD:m.launchJD,days:m.days}))status('Nie udało się przenieść wybranego wariantu.');
}
function exportSelected(){
 const m=state.selected;if(!m)return;
 const txt='ATLAS SOLARIS 11.0 — Laboratorium Trajektorii\n'+BODY[state.from]+' → '+BODY[state.to]+
  '\nOdlot UTC: '+fullDate(m.launchJD)+'\nPrzylot UTC: '+fullDate(m.arrivalJD)+
  '\nCzas lotu: '+num(m.days,1)+' dni\nv∞ odlot: '+num(m.vDep,3)+' km/s'+
  '\nC3: '+num(m.c3,3)+' km²/s²\nv∞ przylot: '+num(m.vArr,3)+' km/s'+
  '\nSuma v∞: '+num(m.sum,3)+' km/s\nModel: JPL approx + Lambert, dwa ciała, bez perturbacji.';
 if(navigator.clipboard?.writeText){
  navigator.clipboard.writeText(txt).then(()=>status('Parametry skopiowane.')).catch(()=>status('Przeglądarka nie zezwoliła na kopiowanie.'));
 }else status('Kopiowanie wymaga bezpiecznego połączenia HTTPS.');
}
function close(){
 token++;
 $('porkchopDialog').close();
}
function show(){
 const dlg=$('porkchopDialog');if(dlg.open)return;
 state.priorPlaying=window.ATLAS_MAIN_API.getPlaying();
 window.ATLAS_MAIN_API.setPlaying(false);
 if(state.baseJD===null){
  const now=window.ATLAS_MAIN_API.getJD(),today=dateFromJD(now);
  const defaultStart=jdFromDate(new Date(Date.UTC(clamp(today.getUTCFullYear(),1800,2045),today.getUTCMonth(),today.getUTCDate(),12)));
  $('pcStart').value=dateFromJD(defaultStart).toISOString().slice(0,10);
  defaultDurations();
 }
 dlg.showModal();
 requestAnimationFrame(()=>{if(!dlg.open)return;if(!state.grid.length)run();else draw();});
}
function init(){
 if(!window.ATLAS_MAIN_API||!solver()||!$('porkchopDialog'))return;
 const selects=['pcFrom','pcTo'];
 for(const id of selects)for(const [name,title] of Object.entries(BODY)){
  const opt=document.createElement('option');opt.value=name;opt.textContent=title;$(id).appendChild(opt);
 }
 $('pcFrom').value='earth';$('pcTo').value='mars';$('pcMetric').value='sum';$('pcSpan').value='30';
 $('openPorkchop').onclick=show;$('openPorkchopSide').onclick=show;$('pcClose').onclick=close;
 $('porkchopDialog').addEventListener('close',()=>{
  token++;if(runFrame)cancelAnimationFrame(runFrame);runFrame=0;
  if(state.priorPlaying!==null)window.ATLAS_MAIN_API.setPlaying(state.priorPlaying);
  state.priorPlaying=null;
 });
 $('pcFrom').onchange=()=>{if($('pcFrom').value===$('pcTo').value)$('pcTo').value=$('pcFrom').value==='earth'?'mars':'earth';defaultDurations();run();};
 $('pcTo').onchange=()=>{if($('pcFrom').value===$('pcTo').value)$('pcFrom').value=$('pcTo').value==='earth'?'mars':'earth';defaultDurations();run();};
 for(const id of ['pcStart','pcSpan','pcMinDays','pcMaxDays'])$(id).onchange=run;
 $('pcRun').onclick=run;
 $('pcMetric').onchange=changeMetric;
 $('pcBest').onclick=()=>{if(state.best)select(state.best);};
 $('pcMission').onclick=sendToMission;$('pcCSV').onclick=exportCSV;$('pcCopy').onclick=exportSelected;
 const c=$('pcCanvas');
 c.addEventListener('pointermove',e=>{const hit=pointerCell(e),next=hit?.m||null;if(next!==hovered){hovered=next;draw();}});
 c.addEventListener('pointerleave',()=>{hovered=null;draw();});
 c.addEventListener('pointerup',e=>{const hit=pointerCell(e);if(hit?.m)select(hit.m);});
 c.addEventListener('keydown',e=>{
  if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
  e.preventDefault();
  const ix=state.selected?clamp(Math.floor((state.selected.launchJD-state.baseJD)/(monthsLater(state.baseJD,state.months)-state.baseJD)*COLS),0,COLS-1):Math.floor(COLS/2);
  const iy=state.selected?clamp(Math.floor((state.maxDays-state.selected.days)/(state.maxDays-state.minDays)*ROWS),0,ROWS-1):Math.floor(ROWS/2);
  const x=clamp(ix+(e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0),0,COLS-1);
  const y=clamp(iy+(e.key==='ArrowDown'?1:e.key==='ArrowUp'?-1:0),0,ROWS-1);
  const m=state.grid[y*COLS+x];if(m)select(m);
 });
 window.addEventListener('resize',()=>{if($('porkchopDialog').open&&!resizeQueued){resizeQueued=true;requestAnimationFrame(()=>{resizeQueued=false;draw();});}});
 window.ATLAS_PORKCHOP_TEST={state,evaluate,run,select,changeMetric,monthsLater,draw,show};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
