/* ATLAS SOLARIS 27.0 — interaktywna opowieść o przebudowie portalu.
 * Canvas jest grafiką schematyczną, bez astronomicznych efemeryd. */
(() => {
'use strict';
const $=id=>document.getElementById(id);
const buttonBefore=$('o27Before'),buttonAfter=$('o27After');
const oldModel=$('o27OldModel'),newModel=$('o27NewModel');
const description={
 before:{
  address:'atlas-solaris / symulator',
  index:'26.0 <span>/ JEDNO CENTRUM</span>',
  title:'Wiele narzędzi w jednym programie.',
  text:'Planetarium było sercem wszystkich doświadczeń. Z czasem zaawansowane laboratoria uruchamiały się w oknach i panelach osadzonych w tej samej aplikacji.',
  bullets:['Jedna główna strona programu','Laboratoria jako panele i dialogi','Wspólne zasoby i silnik astronomiczny']
 },
 after:{
  address:'atlas-solaris / etapy / 27',
  index:'27.0 <span>/ OTWARTY PORTAL</span>',
  title:'Każde odkrycie dostało własny adres.',
  text:'Etap 27 wprowadził nową stronę główną, sześć działów, katalog i podstrony. Istniejące symulacje zachowano, osadzając ich wspólny silnik w pełnoekranowych widokach.',
  bullets:['Osobne adresy etapów i dodatkowych laboratoriów','Sześć działów tematycznych i wyszukiwarka','Stare planetarium zachowane jako atlas.html']
 }
};
function show(mode){
 const after=mode==='after',d=description[mode];
 buttonAfter.classList.toggle('is-active',after);
 buttonBefore.classList.toggle('is-active',!after);
 buttonAfter.setAttribute('aria-pressed',String(after));
 buttonBefore.setAttribute('aria-pressed',String(!after));
 oldModel.hidden=after;newModel.hidden=!after;
 $('o27Address').textContent=d.address;
 $('o27ComparisonNumber').innerHTML=d.index;
 $('o27CompareTitle').textContent=d.title;
 $('o27CompareText').textContent=d.text;
 $('o27CompareBullets').replaceChildren(...d.bullets.map(t=>{
  const li=document.createElement('li');li.textContent=t;return li;
 }));
 document.querySelector('.o27-compare').dataset.mode=mode;
}
buttonBefore?.addEventListener('click',()=>show('before'));
buttonAfter?.addEventListener('click',()=>show('after'));
const canvas=$('o27Canvas');
const ctx=canvas?.getContext('2d',{alpha:false});
const reduced=!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
if(ctx){
 let width=1,height=1,dpr=1,active=true,phase=0,last=0;
 const nodes=[
  {p:.01,r:.19,theta:0.7,label:'ŚWIATY',shade:'#92e2ee'},
  {p:.25,r:.37,theta:1.4,label:'MISJE',shade:'#a2f1d1'},
  {p:.50,r:.51,theta:2.6,label:'ZJAWISKA',shade:'#ffb9c9'},
  {p:.75,r:.48,theta:3.9,label:'GWIAZDY',shade:'#c6b5ff'},
  {p:1.00,r:.31,theta:5.25,label:'NAUKA',shade:'#a8d1f9'},
  {p:.9,r:.67,theta:4.7,label:'CZARNE DZIURY',shade:'#afa4f5'}
 ];
 const rand=(n)=>{let x=Math.sin(n*127.1+78.233)*43758.5453123;return x-Math.floor(x)};
 const stars=Array.from({length:105},(_,i)=>({x:rand(i+3),y:rand(i+400),r:.4+rand(i+630)*1.15,a:.12+rand(i+930)*.5}));
 function size(){
  const rect=canvas.getBoundingClientRect();
  dpr=Math.min(window.devicePixelRatio||1,1.65);
  width=Math.max(1,rect.width);height=Math.max(1,rect.height);
  canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
 }
 function frame(time){
  if(!active)return;
  const dt=last?Math.min(.06,(time-last)/1000):0;last=time;
  if(!reduced)phase+=dt*.11;
  ctx.fillStyle='#071324';ctx.fillRect(0,0,width,height);
  const glow=ctx.createRadialGradient(width*.5,height*.49,0,width*.5,height*.49,Math.max(width,height)*.67);
  glow.addColorStop(0,'#244961');glow.addColorStop(.47,'#132b45');glow.addColorStop(1,'#071322');
  ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
  for(const s of stars){ctx.beginPath();ctx.fillStyle='rgba(206,234,248,'+s.a+')';ctx.arc(s.x*width,s.y*height,s.r,0,Math.PI*2);ctx.fill()}
  const x=width*.49,y=height*.53,scale=Math.min(width,height);
  ctx.save();ctx.translate(x,y);
  for(let k=1;k<4;k++){
   ctx.beginPath();ctx.ellipse(0,0,scale*(.15+k*.098),scale*(.11+k*.064),-.41,0,Math.PI*2);
   ctx.strokeStyle='rgba(116,181,213,'+(0.08+k*.045)+')';ctx.lineWidth=.8;ctx.stroke();
  }
  const positions=nodes.map((n,i)=>{
   const t=n.theta+phase*((i%2)?1:-1)*(.85+i*.08);
   return {x:Math.cos(t)*scale*n.r*.78,y:Math.sin(t)*scale*n.r*.65,label:n.label,shade:n.shade};
  });
  for(let i=0;i<positions.length;i++){
   const n=positions[i];
   ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(n.x,n.y);
   ctx.lineWidth=1;ctx.strokeStyle='rgba(124,202,226,.23)';ctx.stroke();
  }
  for(let i=0;i<positions.length;i++){
   for(let j=i+1;j<positions.length;j++){
    if((j-i)%3===0){
     ctx.beginPath();ctx.moveTo(positions[i].x,positions[i].y);ctx.lineTo(positions[j].x,positions[j].y);
     ctx.strokeStyle='rgba(153,185,240,.09)';ctx.stroke();
    }
   }
  }
  const core=ctx.createRadialGradient(-9,-13,1,0,0,scale*.095);
  core.addColorStop(0,'#f4ffff');core.addColorStop(.19,'#a9f2f3');core.addColorStop(.51,'#4f9bc4');core.addColorStop(1,'rgba(28,85,147,0)');
  ctx.beginPath();ctx.fillStyle=core;ctx.arc(0,0,scale*.095,0,2*Math.PI);ctx.fill();
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillStyle='#eaffff';ctx.font='800 '+Math.max(10,scale*.027)+'px system-ui';
  ctx.fillText('ATLAS',0,-2);ctx.font='600 '+Math.max(7,scale*.019)+'px system-ui';ctx.fillStyle='#d0edf5';ctx.fillText('SOLARIS',0,13);
  for(const n of positions){
   ctx.beginPath();ctx.arc(n.x,n.y,13,0,2*Math.PI);ctx.fillStyle=n.shade;ctx.shadowColor=n.shade;ctx.shadowBlur=22;ctx.fill();ctx.shadowBlur=0;
   ctx.beginPath();ctx.arc(n.x,n.y,18,0,2*Math.PI);ctx.strokeStyle=n.shade+'73';ctx.stroke();
   if(width>400){
    ctx.fillStyle='#cfdeef';ctx.font='700 9px system-ui';ctx.fillText(n.label,n.x,n.y-28);
   }
  }
  ctx.restore();
  if(!reduced)requestAnimationFrame(frame);
 }
 size();requestAnimationFrame(frame);
 if(window.ResizeObserver)new ResizeObserver(size).observe(canvas);
 else window.addEventListener('resize',size,{passive:true});
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden){active=false;return}
  if(!active){active=true;last=0;requestAnimationFrame(frame)}
 });
}
function announceReady(){
 try{if(window.parent!==window)window.parent.postMessage({type:'atlas:portal:ready'},window.location.origin)}catch(_){}
}
window.addEventListener('message',event=>{
 if(event.origin===location.origin&&event.data?.type==='atlas:portal:ping')announceReady();
});
announceReady();
})();
