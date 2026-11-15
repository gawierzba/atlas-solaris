/* ATLAS SOLARIS 33 — lightweight Canvas 2D magnetar, educational not MHD. */
(()=>{'use strict';
const $=id=>document.getElementById(id), canvas=$('m33Canvas');if(!canvas)return;
const ctx=canvas.getContext('2d');const b=$('m33B'),p=$('m33P'),s=$('m33S'),d=$('m33D');
const modeButtons=[...document.querySelectorAll('[data-m33-mode]')],f=new Intl.NumberFormat('pl-PL',{maximumFractionDigits:2});
let mode='quiet',w=0,h=0,phase=0,burst=0,prev=0,active=true;
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
const power=x=>'⁰¹²³⁴⁵⁶⁷⁸⁹'[x]||String(x);
function sci(x){const e=Math.floor(Math.log10(x)),v=x/10**e;return f.format(v)+' × 10'+String(e).split('').map(n=>n==='-'?'⁻':power(Number(n))).join('')+' erg'}
function renderData(){
 const B=+b.value,P=+p.value,S=+s.value,D=+d.value;
 $('m33BVal').textContent=f.format(B)+' × 10¹⁴ G';
 $('m33PVal').textContent=f.format(P)+' s';
 $('m33SVal').textContent=f.format(S)+'%';
 $('m33DVal').textContent=Math.round(D).toLocaleString('pl-PL')+' km';
 $('m33Ratio').textContent=f.format(B*.2)+' biliarda razy';
 const Bgauss=B*1e14,Rcm=1.2e6;
 $('m33Energy').textContent='~'+sci(Bgauss*Bgauss*Rcm*Rcm*Rcm/6);
 $('m33Flux').textContent=f.format((35000/D)**2)+' ×';
 const states={quiet:'Emisja spokojna',quake:'Naprężenia skorupy',flare:'Wielki rozbłysk'};
 $('m33State').textContent=states[mode];
 $('m33ModeLabel').textContent={quiet:'STAN SPOKOJNY',quake:'TRZĘSIENIE SKORUPY',flare:'GIANT FLARE'}[mode];
 $('m33Caption').textContent={
 quiet:'Spokojna emisja. Linie wyznaczają umowny przebieg pola; tempo obrotu odpowiada ustawionemu okresowi.',
 quake:'Umowna wizualizacja wzrostu naprężeń i gwałtownego zaburzenia magnetosfery. Suwak nie przewiduje prawdziwych trzęsień.',
 flare:'Widowiskowy błysk gamma i umowny, pulsujący ogon. Natężenie na ekranie nie jest rzeczywistą jasnością promieniowania.'
 }[mode];
}
function switchMode(next){
 mode=next;burst=next==='quiet'?0:1;
 modeButtons.forEach(x=>{const on=x.dataset.m33Mode===next;x.classList.toggle('selected',on);x.setAttribute('aria-pressed',on?'true':'false')});
 renderData();
}
for(const btn of modeButtons)btn.addEventListener('click',()=>switchMode(btn.dataset.m33Mode));
for(const ctrl of [b,p,s,d])ctrl.addEventListener('input',renderData);
function resize(){
 const r=canvas.getBoundingClientRect();const ratio=Math.min(devicePixelRatio||1,2);
 w=Math.max(1,r.width);h=Math.max(1,r.height);
 canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);
 ctx.setTransform(ratio,0,0,ratio,0,0);
}
if('ResizeObserver'in window)new ResizeObserver(resize).observe(canvas);
else window.addEventListener('resize',resize);
function draw(t){
 if(!active)return;
 const delta=prev?Math.min(.05,(t-prev)/1000):.016;prev=t;
 if(!w||!h)resize();
 ctx.clearRect(0,0,w,h);
 const cx=w*.5,cy=h*.46,scale=Math.min(w,h)/510;
 const radius=57*scale,B=+b.value,P=+p.value,S=+s.value,D=+d.value;
 if(!reduce)phase+=delta*2*Math.PI/P;
 const glow=ctx.createRadialGradient(cx,cy,0,cx,cy,260*scale);
 glow.addColorStop(0,'rgba(179,151,255,.29)');glow.addColorStop(.55,'rgba(92,125,244,.07)');glow.addColorStop(1,'rgba(0,0,0,0)');
 ctx.fillStyle=glow;ctx.beginPath();ctx.arc(cx,cy,260*scale,0,Math.PI*2);ctx.fill();
 const seedCount=95;for(let i=0;i<seedCount;i++){
  const px=(Math.sin(i*78.233+12.3)*43758.54)%1,py=(Math.sin(i*29.46+36.92)*1647.7)%1;
  const x=(px<0?px+1:px)*w,y=(py<0?py+1:py)*h;
  ctx.fillStyle=i%6===0?'rgba(202,224,255,.56)':'rgba(171,202,244,.25)';
  ctx.fillRect(x,y,i%13===0?1.5:1,i%13===0?1.5:1);
 }
 ctx.save();ctx.translate(cx,cy);
 const strength=.72+B/28;
 for(let j=0;j<7;j++){
  const tilt=(j/7)*Math.PI*2+phase*.15;
  ctx.save();ctx.rotate(tilt);
  ctx.beginPath();
  ctx.moveTo(-radius*.55,0);
  ctx.bezierCurveTo(-radius*1.9,-radius*(2.6+strength*.6),radius*1.9,-radius*(2.6+strength*.6),radius*.55,0);
  ctx.strokeStyle=j%2?'rgba(179,141,255,.34)':'rgba(98,210,246,.43)';
  ctx.lineWidth=(1.1+(B/25))*Math.max(.65,scale);ctx.stroke();
  ctx.restore();
 }
 const spin=phase+Math.PI/7;
 const beamBoost=mode==='flare'?1.4:mode==='quake'?1.15:1;
 ctx.save();ctx.rotate(spin);
 for(let side of [-1,1]){
  const base=side*radius*.92,len=side*radius*beamBoost*(4.7+B/7);
  const lg=ctx.createLinearGradient(0,base,0,len);
  lg.addColorStop(0,'rgba(235,249,255,.8)');lg.addColorStop(.45,'rgba(150,199,255,.22)');lg.addColorStop(1,'rgba(108,175,255,0)');
  ctx.fillStyle=lg;ctx.beginPath();ctx.moveTo(-radius*.26,base);ctx.lineTo(-radius*.95,len);ctx.lineTo(radius*.95,len);ctx.lineTo(radius*.26,base);ctx.closePath();ctx.fill();
 }
 ctx.restore();
 const g=ctx.createRadialGradient(-radius*.33,-radius*.42,2,0,0,radius);
 g.addColorStop(0,'#ffffff');g.addColorStop(.2,'#f5d7ff');g.addColorStop(.57,'#ac7ef3');g.addColorStop(1,'#382271');
 ctx.shadowColor=mode==='flare'?'#f8aaff':'#9775ff';ctx.shadowBlur=(30+S/4)*scale;
 ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
 ctx.save();ctx.rotate(spin);
 ctx.lineWidth=3*scale;ctx.strokeStyle='rgba(255,244,255,.44)';
 ctx.beginPath();ctx.ellipse(0,0,radius*.92,radius*.27,Math.PI/5,0,Math.PI*2);ctx.stroke();ctx.restore();
 if(mode==='quake'){
  ctx.strokeStyle='rgba(255,148,193,.75)';ctx.lineWidth=2.4*scale;
  for(let i=0;i<3;i++){const angle=i*1.8+phase*2;ctx.beginPath();ctx.arc(0,0,radius*(1.25+i*.18),angle,angle+(.35+S/140));ctx.stroke()}
 }
 if(mode==='flare'){
  burst=Math.max(0,burst-delta*.65);
  const pulse=Math.max(.12,burst)+(Math.sin(phase*2)*.07+.07);
  const circle=radius*(2+3*(1-burst));
  ctx.strokeStyle='rgba(255,198,238,'+Math.min(.75,pulse)+')';ctx.lineWidth=(3+12*burst)*scale;
  ctx.beginPath();ctx.arc(0,0,circle,0,Math.PI*2);ctx.stroke();
  if(burst===0)burst=.5;
 }
 ctx.restore();
 ctx.beginPath();ctx.setLineDash([3,8]);ctx.arc(cx,cy,Math.min(215,(110+D/3500))*scale,0,Math.PI*2);
 ctx.strokeStyle='rgba(169,198,255,.16)';ctx.lineWidth=1;ctx.stroke();ctx.setLineDash([]);
 if(!reduce)requestAnimationFrame(draw);
}
document.addEventListener('visibilitychange',()=>{active=!document.hidden;if(active&&!reduce){prev=0;requestAnimationFrame(draw)}});
const about=$('stageAbout'),info=$('stageInfo'),close=$('stageInfoClose');
function setInfo(v){info.hidden=!v;about.setAttribute('aria-expanded',String(v))}
about.addEventListener('click',()=>setInfo(info.hidden));close.addEventListener('click',()=>setInfo(false));
document.addEventListener('keydown',e=>{if(e.key==='Escape')setInfo(false)});
resize();renderData();requestAnimationFrame(draw);
})();