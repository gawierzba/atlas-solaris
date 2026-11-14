(()=>{'use strict';
const PRESETS=[0.2,1,5,12,25,40];
const STAGES={
 low:[
  {id:'proto',name:'Protogwiazda',lead:'Obłok gazu zapada się pod wpływem grawitacji.',desc:'Zagęszczający się obłok molekularny zaczyna świecić dzięki energii grawitacyjnego kurczenia. Stabilna fuzja jeszcze nie dominuje.',dur:0.03,temp:(m)=>3000+900*m,lum:(m)=>0.02+0.2*m,rad:(m)=>2.5+3*m,color:'#d9b783'},
  {id:'main',name:'Czerwony karzeł',lead:'Niewielka gwiazda spokojnie spala wodór.',desc:'Gwiazdy małej masy zużywają paliwo wyjątkowo oszczędnie. Ich życie trwa setki miliardów, a nawet biliony lat — znacznie dłużej niż obecny wiek Wszechświata.',dur:0.94,temp:(m)=>2600+2200*m,lum:(m)=>Math.max(0.001,m**3.5*0.8),rad:(m)=>0.15+0.9*m,color:'#ff8f64'},
  {id:'wd',name:'Biały karzeł',lead:'Po długiej ewolucji pozostaje gorące, gęste jądro.',desc:'Model upraszcza daleką przyszłość czerwonych karłów. Po utracie zewnętrznych warstw pozostaje stygnący biały karzeł — mały, ale bardzo gęsty obiekt.',dur:0.03,temp:(m)=>9000,lum:(m)=>0.01,rad:(m)=>0.02,color:'#d9ecff'}
 ],
 solar:[
  {id:'proto',name:'Protogwiazda',lead:'Początek narodzin gwiazdy z obłoku.',desc:'Grawitacja kurczy obłok i podnosi temperaturę w jego centrum. W jądrze zbliża się moment zapłonu stabilnej fuzji wodoru.',dur:0.02,temp:(m)=>3500+800*m,lum:(m)=>0.1+0.25*m,rad:(m)=>2+2.5*m,color:'#ebc493'},
  {id:'main',name:'Ciąg główny',lead:'Najdłuższa i najstabilniejsza faza życia gwiazdy.',desc:'W jądrze zachodzi fuzja wodoru do helu. Gwiazda pozostaje w równowadze hydrostatycznej: grawitacja jest równoważona przez ciśnienie gorącego gazu i promieniowania.',dur:0.82,temp:(m)=>5600*(m**0.45),lum:(m)=>m**3.5,rad:(m)=>m**0.8,color:'#fff0b0'},
  {id:'giant',name:'Czerwony olbrzym',lead:'Jądro się kurczy, zewnętrzne warstwy puchną.',desc:'Po wyczerpaniu wodoru w jądrze gwiazda rozszerza się i ochładza na powierzchni, ale całościowo staje się bardzo jasna.',dur:0.13,temp:(m)=>3600,lum:(m)=>150*m**1.2,rad:(m)=>50*m**0.6,color:'#ff8c63'},
  {id:'nebula',name:'Mgławica planetarna',lead:'Warstwy zewnętrzne odpływają w przestrzeń.',desc:'Odrzucony gaz tworzy efektowną mgławicę, odsłaniając gorące jądro gwiazdy. Ta faza jest krótka w porównaniu z głównym życiem gwiazdy.',dur:0.01,temp:(m)=>25000,lum:(m)=>500,rad:(m)=>0.2,color:'#8fe7ff'},
  {id:'wd',name:'Biały karzeł',lead:'Pozostaje gorący, gęsty popiół po dawnej gwieździe.',desc:'Biały karzeł nie prowadzi już aktywnej fuzji w jądrze. Świeci dzięki zgromadzonemu wcześniej ciepłu i z czasem powoli stygnie.',dur:0.02,temp:(m)=>12000,lum:(m)=>0.02,rad:(m)=>0.015,color:'#d8e8ff'}
 ],
 massive:[
  {id:'proto',name:'Masywna protogwiazda',lead:'Narodziny są gwałtowne i szybkie.',desc:'Duża masa oznacza silniejszą grawitację, szybsze zapadanie i szybki wzrost temperatury. Taka gwiazda dojrzewa znacznie szybciej niż Słońce.',dur:0.02,temp:(m)=>5000+120*m,lum:(m)=>3*m,rad:(m)=>4+0.4*m,color:'#d8c7ff'},
  {id:'main',name:'Gorąca gwiazda masywna',lead:'Fuzja przebiega intensywnie i jasno.',desc:'Gwiazda jest bardzo jasna i gorąca, ale właśnie przez to zużywa paliwo w błyskawicznym tempie. Im większa masa, tym krótsze życie.',dur:0.73,temp:(m)=>14000+700*m,lum:(m)=>m**3.9,rad:(m)=>m**0.65,color:'#b6d8ff'},
  {id:'supergiant',name:'Nadolbrzym',lead:'Jądro przechodzi przez kolejne etapy spalania cięższych pierwiastków.',desc:'Po wypaleniu wodoru i helu w centrum masywna gwiazda rozbudowuje złożoną strukturę przypominającą cebulę. Powstają coraz cięższe pierwiastki aż do żelaza.',dur:0.22,temp:(m)=>4200+(m>18?2500:0),lum:(m)=>2e5*(m/15),rad:(m)=>350*(m/10)**0.4,color:'#ff7f68'},
  {id:'sn',name:'Supernowa',lead:'Jądro zapada się, a zewnętrzne warstwy eksplodują.',desc:'Gdy w centrum pojawia się jądro żelazne, dalsza fuzja przestaje dawać energię. Dochodzi do gwałtownego kolapsu i eksplozji supernowej typu II.',dur:0.01,temp:(m)=>50000,lum:(m)=>1e8,rad:(m)=>120,color:'#ffffff'},
  {id:'remnant',name:'Gwiazda neutronowa',lead:'Po eksplozji pozostaje ultragęsty obiekt.',desc:'Masywna gwiazda kończy jako gwiazda neutronowa, jeśli masa zapadającego się jądra nie przekroczy granicy prowadzącej do czarnej dziury.',dur:0.02,temp:(m)=>600000,lum:(m)=>1e-3,rad:(m)=>2e-5,color:'#8bc4ff'}
 ],
 hyper:[
  {id:'proto',name:'Ekstremalna protogwiazda',lead:'Rodzą się bardzo szybko i gwałtownie.',desc:'Przy ogromnej masie formowanie gwiazdy jest dynamiczne, a promieniowanie od początku silnie oddziałuje z otoczeniem.',dur:0.02,temp:(m)=>7000+150*m,lum:(m)=>10*m,rad:(m)=>5+0.6*m,color:'#f0d6ff'},
  {id:'main',name:'Błękitny nadolbrzym',lead:'Krótka, jasna i niestabilna młodość.',desc:'Takie gwiazdy są niezwykle jasne i gorące. Spalają wodór w błyskawicznym tempie i szybko przygotowują się do dramatycznego końca.',dur:0.68,temp:(m)=>22000+500*m,lum:(m)=>m**4.1,rad:(m)=>m**0.7,color:'#c2dcff'},
  {id:'wr',name:'Faza Wolfa–Rayeta / nadolbrzyma',lead:'Silny wiatr gwiazdowy zdziera zewnętrzne warstwy.',desc:'Bardzo masywna gwiazda może wejść w fazę Wolfa–Rayeta. Jej wiatr jest tak silny, że odsłania głębsze warstwy i zmienia skład chemiczny powierzchni.',dur:0.18,temp:(m)=>45000,lum:(m)=>7e5*(m/25),rad:(m)=>20,color:'#9fd2ff'},
  {id:'sn',name:'Supernowa / hipernowa',lead:'Końcowa katastrofa rozrzuca ciężkie pierwiastki po kosmosie.',desc:'Końcowy wybuch jest jednym z najpotężniejszych zjawisk we Wszechświecie. W zależności od masy i rotacji może to być klasyczna supernowa lub hipernowa.',dur:0.01,temp:(m)=>70000,lum:(m)=>5e8,rad:(m)=>160,color:'#fff7f2'},
  {id:'bh',name:'Czarna dziura',lead:'Grawitacja zwycięża całkowicie.',desc:'Zapadnięte jądro przekracza granicę stabilności materii neutronowej. Powstaje czarna dziura — obiekt, z którego wnętrza nie ucieka nawet światło.',dur:0.11,temp:(m)=>0,lum:(m)=>1e-6,rad:(m)=>3e-5,color:'#090d15'}
 ]
};
const state={mass:1,life:0,playing:false,last:0};
const starCanvas=document.getElementById('s29StarCanvas'), starCtx=starCanvas.getContext('2d');
const hrCanvas=document.getElementById('hrCanvas'), hrCtx=hrCanvas.getContext('2d');
const el={massRange:document.getElementById('massRange'),lifeRange:document.getElementById('lifeRange'),massLabel:document.getElementById('massLabel'),lifeLabel:document.getElementById('lifeLabel'),kpiMass:document.getElementById('kpiMass'),kpiLife:document.getElementById('kpiLife'),kpiRemnant:document.getElementById('kpiRemnant'),phaseLabel:document.getElementById('phaseLabel'),phaseName:document.getElementById('phaseName'),phaseAge:document.getElementById('phaseAge'),stageStrip:document.getElementById('stageStrip'),currentStageTitle:document.getElementById('currentStageTitle'),stageLead:document.getElementById('stageLead'),stageDesc:document.getElementById('stageDesc'),stageStats:document.getElementById('stageStats'),playBtn:document.getElementById('playBtn'),resetBtn:document.getElementById('resetBtn'),presets:document.getElementById('massPresets')};
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches; let DPR=Math.min(2,devicePixelRatio||1), stars=[];
function seedStars(){let s=5;const rnd=()=>((s=s*1664525+1013904223>>>0)/4294967296);stars=Array.from({length:160},()=>({x:rnd(),y:rnd(),a:.15+rnd()*.7,r:.5+rnd()*1.5}))} seedStars();
function massSet(m){return m<0.5?STAGES.low:m<8?STAGES.solar:m<20?STAGES.massive:STAGES.hyper}
function totalLifeYears(m){if(m<0.5)return 1e12*(0.4/m)**1.1; return m>20?Math.max(3e6,1e10*Math.pow(m,-2.5)):1e10*Math.pow(m,-2.5)}
function protoYears(m){return Math.max(1e5,5e7*Math.pow(m,-1.6))}
function formatYears(y){if(y<1e4)return `${y.toLocaleString('pl-PL',{maximumFractionDigits:0})} lat`; if(y<1e6)return `${(y/1e3).toLocaleString('pl-PL',{maximumFractionDigits:1})} tys. lat`; if(y<1e9)return `${(y/1e6).toLocaleString('pl-PL',{maximumFractionDigits:2})} mln lat`; if(y<1e12)return `${(y/1e9).toLocaleString('pl-PL',{maximumFractionDigits:2})} mld lat`; return `${(y/1e12).toLocaleString('pl-PL',{maximumFractionDigits:2})} bln lat`; }
function f1(x){return x.toLocaleString('pl-PL',{maximumFractionDigits:1})}
function buildTrack(m){const set=massSet(m).map(stage=>({...stage}));const total=totalLifeYears(m); const proto=protoYears(m);
 // scale durations: fixed fractions converted to years with proto override for first stage
 let nonProtoFrac=set.slice(1).reduce((a,s)=>a+s.dur,0); let remaining=Math.max(total-proto, total*0.02);
 set.forEach((s,i)=>{ if(i===0)s.years=proto; else s.years=remaining*(s.dur/nonProtoFrac); s.start= i===0?0:set[i-1].end; s.end=s.start+s.years; s.fracStart=s.start/(proto+remaining); s.fracEnd=s.end/(proto+remaining); s.tempVal=s.temp(m); s.lumVal=s.lum(m); s.radVal=s.rad(m)});
 const final=set[set.length-1].name.toLowerCase(); return {stages:set,total:proto+remaining,final}; }
function stageAt(track,pct){ const age=track.total*pct; let idx=track.stages.findIndex(s=>age<=s.end); if(idx<0) idx=track.stages.length-1; const stage=track.stages[idx]; return {stage,idx,age} }
function current(){ const track=buildTrack(state.mass); return {track,...stageAt(track,state.life)} }
function typeFinal(m){return buildTrack(m).final}
let stripStateKey='';
function drawStrip(track,idx){ const key=state.mass.toFixed(2)+':'+idx; if(key===stripStateKey)return; stripStateKey=key; el.stageStrip.innerHTML=track.stages.map((s,i)=>`<button type="button" class="s29-chip ${i===idx?'active':''}" data-i="${i}" style="flex:${Math.max(.5,s.years/track.total*10)}"><span>${String(i+1).padStart(2,'0')}</span><strong>${s.name}</strong><small>${formatYears(s.years)}</small></button>`).join(''); el.stageStrip.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{const i=Number(b.dataset.i),st=track.stages[i]; state.life=(st.fracStart+st.fracEnd)/2; syncUI(); })); }
function updateInfo(){ const {track,stage,idx,age}=current();
 el.massLabel.textContent=`${f1(state.mass)} masy Słońca`; el.kpiMass.textContent=`${f1(state.mass)} M☉`; el.kpiLife.textContent=formatYears(track.total); el.kpiRemnant.textContent=track.stages[track.stages.length-1].name.toLowerCase(); el.lifeLabel.textContent=`${Math.round(state.life*100)}%`; el.lifeRange.value=Math.round(state.life*1000); el.currentStageTitle.textContent=stage.name; el.stageLead.textContent=stage.lead; el.stageDesc.textContent=stage.desc; el.phaseLabel.textContent=idx===0?'NARODZINY':idx===track.stages.length-1?'KOŃCOWE STADIUM':'EWOLUCJA'; el.phaseName.textContent=stage.name; el.phaseAge.textContent=`Wiek modelowy: ${formatYears(age)} z ${formatYears(track.total)}`;
 const lum=stage.lumVal,temp=stage.tempVal,rad=stage.radVal; const final = track.stages[track.stages.length-1].name;
 const stats=[['Temperatura', temp? `${Math.round(temp).toLocaleString('pl-PL')} K` : '—', 'Szacunkowa temperatura fotosfery lub charakterystyczna temperatura fazy.'],['Jasność', `${lum.toLocaleString('pl-PL',{maximumFractionDigits: lum<1?3:1})} L☉`, 'Wartość uproszczona względem jasności Słońca.'],['Promień', `${rad.toLocaleString('pl-PL',{maximumFractionDigits: rad<1?3:1})} R☉`, 'Orientacyjny promień względem Słońca.'],['Finał ewolucji', final, 'To końcowy rezultat dla wybranej masy w tym modelu dydaktycznym.']];
 el.stageStats.innerHTML=stats.map(([a,b,c])=>`<div class="s29-stat"><strong>${b}</strong><span>${a}</span><small>${c}</small></div>`).join('');
 document.querySelectorAll('.s29-preset').forEach(btn=>btn.classList.toggle('active',Math.abs(Number(btn.dataset.m)-state.mass)<0.051)); drawStrip(track,idx); drawStar(track,stage,idx); drawHR(track,stage,idx); }
function resize(){ const set=(canvas)=>{const r=canvas.getBoundingClientRect(),d=Math.min(2,devicePixelRatio||1); canvas.width=Math.round(r.width*d); canvas.height=Math.round(r.height*d); return d}; DPR=resizeStar(); resizeHR(); }
function resizeStar(){ const r=starCanvas.getBoundingClientRect(); const d=Math.min(2,devicePixelRatio||1); starCanvas.width=Math.round(r.width*d); starCanvas.height=Math.round(r.height*d); starCtx.setTransform(d,0,0,d,0,0); return d; }
function resizeHR(){ const r=hrCanvas.getBoundingClientRect(); const d=Math.min(2,devicePixelRatio||1); hrCanvas.width=Math.round(r.width*d); hrCanvas.height=Math.round(r.height*d); hrCtx.setTransform(d,0,0,d,0,0); }
function drawBackground(ctx,w,h,t){ const g=ctx.createLinearGradient(0,0,0,h); g.addColorStop(0,'#09111e'); g.addColorStop(1,'#070c16'); ctx.fillStyle=g; ctx.fillRect(0,0,w,h); for(const s of stars){ ctx.globalAlpha=s.a; ctx.fillStyle='#e6f2ff'; const tw=reduced?0:Math.sin(t*.0007+s.x*10+s.y*7)*.4; ctx.beginPath(); ctx.arc(s.x*w,s.y*h,s.r+tw*.4,0,7); ctx.fill(); } ctx.globalAlpha=1; }
function drawStar(track,stage,idx){ const t=performance.now(), w=starCanvas.width/DPR, h=starCanvas.height/DPR; drawBackground(starCtx,w,h,t); const cx=w*.5, cy=h*.46; starCtx.save();
 if(stage.id==='proto'){ for(let i=0;i<80;i++){ const a=(i/80)*Math.PI*2+t*0.00005; const r=120+Math.sin(i+t*0.001)*18; starCtx.fillStyle=i%3?'rgba(255,165,118,.06)':'rgba(121,196,255,.06)'; starCtx.beginPath(); starCtx.arc(cx+Math.cos(a)*r,cy+Math.sin(a)*r*.65,14,0,7); starCtx.fill(); } }
 if(stage.id==='nebula'){ for(let i=0;i<120;i++){ const a=(i/120)*Math.PI*2; const r=130+Math.sin(i*.6+t*0.002)*18; starCtx.fillStyle=i%2?'rgba(130,235,255,.08)':'rgba(173,145,255,.07)'; starCtx.beginPath(); starCtx.arc(cx+Math.cos(a)*r,cy+Math.sin(a)*r*0.7,20,0,7); starCtx.fill(); }}
 if(stage.id==='sn'){ for(let i=0;i<160;i++){ const a=(i/160)*Math.PI*2; const r=40+((t*0.13)%160); starCtx.strokeStyle=i%2?'rgba(255,240,210,.12)':'rgba(130,216,255,.08)'; starCtx.beginPath(); starCtx.moveTo(cx,cy); starCtx.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r); starCtx.stroke(); }}
 const color=stage.color; let radius=Math.min(160,Math.max(18,30+Math.log10(stage.radVal+1)*45));
 if(stage.id==='giant' || stage.id==='supergiant') radius*=1.45; if(stage.id==='wd') radius=18; if(stage.id==='remnant') radius=10; if(stage.id==='bh') radius=24;
 if(stage.id==='bh'){ const ring=starCtx.createRadialGradient(cx,cy,10,cx,cy,58); ring.addColorStop(0,'#000000'); ring.addColorStop(.35,'#000000'); ring.addColorStop(.5,'#ffcc8a'); ring.addColorStop(.75,'#ff7c45'); ring.addColorStop(1,'transparent'); starCtx.fillStyle=ring; starCtx.beginPath(); starCtx.arc(cx,cy,72,0,7); starCtx.fill(); starCtx.fillStyle='#03070e'; starCtx.beginPath(); starCtx.arc(cx,cy,26,0,7); starCtx.fill(); }
 else{
   const glow=starCtx.createRadialGradient(cx,cy,1,cx,cy,radius*3.2); glow.addColorStop(0,'#ffffff60'); glow.addColorStop(.25,color+'aa'); glow.addColorStop(1,'transparent'); starCtx.fillStyle=glow; starCtx.beginPath(); starCtx.arc(cx,cy,radius*3.2,0,7); starCtx.fill();
   const star=starCtx.createRadialGradient(cx-radius*.28,cy-radius*.28,1,cx,cy,radius); star.addColorStop(0,'#fffaf3'); star.addColorStop(.22,stage.id==='remnant'?'#dff4ff':stage.id==='wd'?'#ffffff':stage.id==='main'&&state.mass>8?'#eef7ff':color); star.addColorStop(1,stage.id==='remnant'?'#5c9bd8':stage.id==='wd'?'#d6e8ff':stage.id==='main'&&state.mass>8?'#89b8ff':color); starCtx.fillStyle=star; starCtx.beginPath(); starCtx.arc(cx,cy,radius,0,7); starCtx.fill(); }
 if(stage.id==='remnant'){ starCtx.strokeStyle='rgba(122,205,255,.22)'; for(let i=1;i<4;i++){ starCtx.beginPath(); starCtx.arc(cx,cy,radius+14*i,0,7); starCtx.stroke(); }}
 if(stage.id==='wr'){ for(let i=0;i<48;i++){ const a=i/48*Math.PI*2; starCtx.strokeStyle='rgba(171,216,255,.16)'; starCtx.beginPath(); starCtx.moveTo(cx+Math.cos(a)*(radius+4),cy+Math.sin(a)*(radius+4)); starCtx.lineTo(cx+Math.cos(a)*(radius+24+((t*0.02+i)%12)),cy+Math.sin(a)*(radius+24+((t*0.02+i)%12))); starCtx.stroke(); }}
 starCtx.restore();
 }
function drawHR(track,stage,idx){ const w=hrCanvas.width/DPR, h=hrCanvas.height/DPR, pad=38; hrCtx.clearRect(0,0,w,h); const bg=hrCtx.createLinearGradient(0,0,0,h); bg.addColorStop(0,'#081220'); bg.addColorStop(1,'#0a1525'); hrCtx.fillStyle=bg; hrCtx.fillRect(0,0,w,h); const plotW=w-pad*2, plotH=h-pad*2; const xTemp=t=>{ const logT=Math.log10(Math.max(2500,Math.min(60000,t))); return pad + (Math.log10(60000)-logT)/(Math.log10(60000)-Math.log10(2500))*plotW; }; const yLum=l=>{ const logL=Math.log10(Math.max(1e-4,l)); return pad + (6- Math.max(-4,Math.min(6,logL)))/10*plotH; };
 hrCtx.strokeStyle='rgba(144,170,200,.18)'; hrCtx.lineWidth=1; hrCtx.font='11px system-ui'; hrCtx.fillStyle='rgba(173,191,210,.78)';
 for(const T of [40000,20000,10000,6000,3000]){ const x=xTemp(T); hrCtx.beginPath(); hrCtx.moveTo(x,pad); hrCtx.lineTo(x,h-pad); hrCtx.stroke(); hrCtx.fillText(String(T),x-14,h-12);} for(const L of [1e5,1e3,1e1,1e-1,1e-3]){ const y=yLum(L); hrCtx.beginPath(); hrCtx.moveTo(pad,y); hrCtx.lineTo(w-pad,y); hrCtx.stroke(); hrCtx.fillText(`10^${Math.round(Math.log10(L))}`,8,y+4);} hrCtx.fillText('temperatura [K]  ← goręcej',w*.55,h-12); hrCtx.save(); hrCtx.translate(12,h*.62); hrCtx.rotate(-Math.PI/2); hrCtx.fillText('jasność [L☉]',0,0); hrCtx.restore();
 hrCtx.strokeStyle='rgba(135,222,240,.75)'; hrCtx.lineWidth=2.2; hrCtx.beginPath(); track.stages.forEach((s,i)=>{ const x=xTemp(s.tempVal), y=yLum(s.lumVal); if(i===0) hrCtx.moveTo(x,y); else hrCtx.lineTo(x,y); }); hrCtx.stroke(); track.stages.forEach((s,i)=>{ const x=xTemp(s.tempVal), y=yLum(s.lumVal); hrCtx.fillStyle=i===idx?'#fff4cf':'#8fd9ef'; hrCtx.beginPath(); hrCtx.arc(x,y,i===idx?6:4,0,7); hrCtx.fill(); if(i===idx){ hrCtx.strokeStyle='rgba(255,236,191,.65)'; hrCtx.stroke(); hrCtx.fillStyle='#f2f8ff'; hrCtx.fillText(s.name,x+10,y-8);} }); }
function syncUI(){ updateInfo(); }
function setMass(m){ state.mass=Math.max(0.1,Math.min(40,m)); el.massRange.value=state.mass.toFixed(1); state.life=0; syncUI(); }
function setup(){ PRESETS.forEach(m=>{ const b=document.createElement('button'); b.type='button'; b.className='s29-preset'; b.dataset.m=m; b.textContent=`${String(m).replace('.',',')} M☉`; b.addEventListener('click',()=>setMass(m)); el.presets.appendChild(b); });
 el.massRange.addEventListener('input',e=>{ state.mass=Number(e.target.value); state.life=0; syncUI(); }); el.lifeRange.addEventListener('input',e=>{ state.life=Number(e.target.value)/1000; syncUI(); }); el.playBtn.addEventListener('click',()=>{ state.playing=!state.playing; state.last=0; el.playBtn.textContent=state.playing?'❚❚ Zatrzymaj':'▶ Odtwarzaj ewolucję'; el.playBtn.classList.toggle('playing',state.playing); }); el.resetBtn.addEventListener('click',()=>{ state.life=0; state.playing=false; el.lifeRange.value=0; el.playBtn.textContent='▶ Odtwarzaj ewolucję'; el.playBtn.classList.remove('playing'); syncUI(); });
 window.addEventListener('resize',()=>{resize(); syncUI();}); window.addEventListener('message',ev=>{ const msg=ev.data||{}; if(msg.type==='atlas:portal:ping'){ try{ parent.postMessage({type:'atlas:portal:ready'},'*'); }catch(_){} } }); resize(); syncUI(); try{ parent!==window && parent.postMessage({type:'atlas:portal:ready'},'*'); }catch(_){} requestAnimationFrame(loop); }
/* Płynność przewijania: rysuj animację w każdej klatce, lecz aktualizuj
   elementy DOM najwyżej co 75 ms podczas odtwarzania. Gdy animacja jest
   zatrzymana, nie przebudowuj pasków faz ani statystyk 60 razy na sekundę. */
let lastUiUpdate=0;
function loop(ts){
 if(state.playing){
  if(!state.last)state.last=ts;
  const dt=Math.min(.1,Math.max(0,(ts-state.last)/1000));
  state.last=ts;
  state.life+=dt*(reduced?.04:.065);
  if(state.life>=1){
   state.life=1;state.playing=false;
   el.playBtn.textContent='▶ Odtwarzaj ewolucję';
   el.playBtn.classList.remove('playing');
  }
  if(!state.playing||ts-lastUiUpdate>=75){
   el.lifeRange.value=Math.round(state.life*1000);
   syncUI();
   lastUiUpdate=ts;
  }else{
   const {track,stage,idx}=current();
   drawStar(track,stage,idx);
  }
 }else{
  const {track,stage,idx}=current();
  drawStar(track,stage,idx);
 }
 requestAnimationFrame(loop);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true}); else setup();
})();
