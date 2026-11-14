(() => {
'use strict';
const M=[
 {name:'Powierzchnia Ziemi',short:'Start',d:1,type:'start',lead:'Tu wszystko się zaczyna.',desc:'Punkt startowy umieszczamy metr nad powierzchnią Ziemi. Dalsza podróż jest pokazana na osi logarytmicznej, dzięki czemu w jednym laboratorium mieści się zarówno Ziemia, jak i obserwowalny Wszechświat.',jump:'Ziemia'},
 {name:'Linia Kármána',short:'100 km',d:1e5,type:'orbita',lead:'Umowna granica kosmosu.',desc:'Na wysokości około 100 km nad Ziemią zaczyna się to, co często nazywamy przestrzenią kosmiczną. To wciąż zaledwie cienka warstwa ponad naszą planetą.',jump:'Kosmos'},
 {name:'Orbita geostacjonarna',short:'GEO',d:3.5786e7,type:'orbita',lead:'Satelity wiszące nad równikiem.',desc:'To tutaj krążą satelity geostacjonarne, które pozostają nad tym samym punktem na równiku Ziemi. Na tej skali Ziemia szybko staje się małą kulą.',jump:'GEO'},
 {name:'Księżyc',short:'Księżyc',d:3.844e8,type:'uklad',lead:'Pierwszy naturalny przystanek.',desc:'Średnia odległość Ziemia–Księżyc to około 384 400 km. To już dystans, przy którym światło potrzebuje ponad sekundy, aby pokonać drogę od Ziemi do Księżyca.',jump:'Księżyc'},
 {name:'1 jednostka astronomiczna',short:'1 AU',d:1.495978707e11,type:'uklad',lead:'Odległość Ziemi od Słońca.',desc:'Jednostka astronomiczna to wygodna miara dla Układu Słonecznego. W tej skali planety wewnętrzne mieszczą się blisko Słońca, ale zewnętrzne zaczynają szybko uciekać na osi odległości.',jump:'1 AU'},
 {name:'Neptun',short:'Neptun',d:4.5e12,type:'uklad',lead:'Kres głównych orbit planet.',desc:'Neptun obiega Słońce około 30 razy dalej niż Ziemia. Dla hipotetycznego podróżnika to już przestrzeń, w której klasyczny obraz Układu Słonecznego zaczyna się rozpraszać.',jump:'Neptun'},
 {name:'Heliopauza',short:'Heliopauza',d:1.8e13,type:'uklad',lead:'Granica dominacji wiatru słonecznego.',desc:'Heliopauza wyznacza obszar, gdzie ciśnienie wiatru słonecznego ustępuje ośrodkowi międzygwiazdowemu. To jedna z naturalnych granic naszego systemu gwiezdnego.',jump:'Heliopauza'},
 {name:'Wewnętrzny Obłok Oorta',short:'Obłok Oorta',d:3e15,type:'uklad',lead:'Dalekie lodowe rubieże.',desc:'Obłok Oorta nie jest bezpośrednio obserwowaną powłoką, lecz modelem rozproszonego rezerwuaru lodowych ciał. To ważny punkt, bo pokazuje, jak ogromny staje się Układ Słoneczny, gdy uwzględnimy jego najdalsze strefy.',jump:'Oort'},
 {name:'Proxima Centauri',short:'Proxima',d:4.015e16,type:'gwiazdy',lead:'Najbliższa znana gwiazda poza Słońcem.',desc:'Proxima Centauri leży około 4,24 roku świetlnego od nas. Dopiero tutaj naprawdę wychodzimy z sąsiedztwa Układu Słonecznego i zaczynamy myśleć kategorią lat świetlnych.',jump:'Proxima'},
 {name:'Średnica Drogi Mlecznej',short:'Droga Mleczna',d:1.0e21,type:'galaktyka',lead:'Nasza galaktyka ma kosmiczny rozmach.',desc:'Drogę Mleczną często opisuje się średnicą rzędu 100–120 tysięcy lat świetlnych. Z tej perspektywy pozycja Słońca staje się drobnym detalem w jednym z ramion spiralnych.',jump:'Galaktyka'},
 {name:'Galaktyka Andromedy',short:'Andromeda',d:2.4e22,type:'galaktyka',lead:'Największa sąsiadka w Grupie Lokalnej.',desc:'Andromeda jest od nas oddalona o około 2,5 miliona lat świetlnych. To pierwszy punkt w podróży, gdzie pojedyncza galaktyka staje się tylko jednym z elementów większej rodziny.',jump:'Andromeda'},
 {name:'Grupa Lokalna',short:'Grupa Lokalna',d:9.0e22,type:'gromada',lead:'Galaktyczne sąsiedztwo Drogi Mlecznej.',desc:'Grupa Lokalna obejmuje Drogę Mleczną, Andromedę, Galaktykę Trójkąta i dziesiątki mniejszych galaktyk satelitarnych. Tutaj widać, że galaktyki również tworzą układy i hierarchie.',jump:'Lokalna'},
 {name:'Gromada w Pannie',short:'Panna',d:5.0e23,type:'gromada',lead:'Wejście do większej sieci struktur.',desc:'Gromada w Pannie to najbliższa duża gromada galaktyk. Na tej skali przestajemy mówić o pojedynczych sąsiadach, a zaczynamy o wielkich węzłach kosmicznej sieci.',jump:'Panna'},
 {name:'Supergromada Laniakea',short:'Laniakea',d:5.0e24,type:'supergromada',lead:'Nasz adres na mapie wielkich struktur.',desc:'Laniakea to ogromna supergromada, do której należy także Droga Mleczna. W tego typu strukturach liczą się już nie tyle pojedyncze galaktyki, co przepływy i układ wielkoskalowy.',jump:'Laniakea'},
 {name:'Promień obserwowalnego Wszechświata',short:'Wszechświat',d:4.4e26,type:'wszechswiat',lead:'Dalej nie sięga dziś obserwacja elektromagnetyczna.',desc:'Przyjmujemy promień obserwowalnego Wszechświata około 46,5 miliarda lat świetlnych. To nie „krawędź” fizyczna w sensie ściany, lecz granica tego, skąd od Wielkiego Wybuchu zdążyło do nas dotrzeć światło.',jump:'Kres'}
];
const state={log:0,target:0,playing:false,last:0};
const minLog=Math.log10(M[0].d), maxLog=Math.log10(M[M.length-1].d);
const canvas=document.getElementById('u28Canvas'); const ctx=canvas.getContext('2d');
const els={range:document.getElementById('u28Range'), play:document.getElementById('u28Play'), prev:document.getElementById('u28Prev'), next:document.getElementById('u28Next'), jumps:document.getElementById('u28Jumps'), targetName:document.getElementById('u28TargetName'), lead:document.getElementById('u28Lead'), desc:document.getElementById('u28Description'), type:document.getElementById('u28Type'), ordinal:document.getElementById('u28Ordinal'), stats:document.getElementById('u28Stats'), rangeLabel:document.getElementById('u28RangeLabel'), phaseTitle:document.getElementById('u28PhaseTitle'), phaseRange:document.getElementById('u28PhaseRange'), phaseKicker:document.getElementById('u28PhaseKicker'), activeName:document.getElementById('u28ActiveName'), between:document.getElementById('u28Between')};
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let DPR=Math.min(2,window.devicePixelRatio||1), stars=[];
function seedStars(){let s=9;const rnd=()=>((s=s*1664525+1013904223>>>0)/4294967296);stars=Array.from({length:180},()=>({x:rnd(),y:rnd(),a:.2+rnd()*.7,r:.4+rnd()*1.9}))}
seedStars();
function fmtDistance(m){ if(m<1e3) return `${m.toFixed(m<10?1:0)} m`; if(m<1e6) return `${(m/1e3).toLocaleString('pl-PL',{maximumFractionDigits:1})} km`; if(m<1e11) return `${(m/1e6).toLocaleString('pl-PL',{maximumFractionDigits:1})} mln km`; if(m<9.46e15) return `${(m/1.495978707e11).toLocaleString('pl-PL',{maximumFractionDigits:2})} AU`; if(m<3.085677581e22) return `${(m/9.4607e15).toLocaleString('pl-PL',{maximumFractionDigits:2})} l.św.`; return `${(m/3.085677581e22).toLocaleString('pl-PL',{maximumFractionDigits:2})} mln pc`; }
function fmtTime(sec){ const minute=60,h=3600,d=86400,y=31557600; if(sec<1) return `${sec.toFixed(2)} s`; if(sec<minute) return `${sec.toFixed(1)} s`; if(sec<h) return `${(sec/minute).toFixed(1)} min`; if(sec<d) return `${(sec/h).toFixed(1)} h`; if(sec<y) return `${(sec/d).toFixed(1)} dni`; if(sec<1e3*y) return `${(sec/y).toFixed(1)} lat`; if(sec<1e6*y) return `${(sec/y/1e3).toFixed(2)} tys. lat`; if(sec<1e9*y) return `${(sec/y/1e6).toFixed(2)} mln lat`; return `${(sec/y/1e9).toFixed(2)} mld lat`; }
function phaseFor(log){ if(log<6) return ['SKALA PLANETARNA','Powierzchnia Ziemi','1 m — 1000 km']; if(log<13.5) return ['UKŁAD SŁONECZNY','Orbity i rubieże systemu','10 tys. km — 1,8e13 m']; if(log<18.5) return ['MIĘDZYGWIAZDOWA PRZESTRZEŃ','Sąsiedztwo Słońca','Lata świetlne']; if(log<22.5) return ['GALAKTYKI','Ramiona Drogi Mlecznej i Andromeda','Dziesiątki tys. — mln l.św.']; return ['WIELKOSKALOWY KOSMOS','Gromady, supergromady i obserwowalny Wszechświat','Miliony — miliardy l.św.']; }
function typeLabel(t){ return ({start:'Punkt startu',orbita:'Orbita / okolice Ziemi',uklad:'Układ Słoneczny',gwiazdy:'Gwiazdy',galaktyka:'Galaktyka',gromada:'Gromada galaktyk',supergromada:'Supergromada',wszechswiat:'Kosmologia'})[t]||t; }
function nearestIndex(log=state.log){ let best=0,delta=1e9; M.forEach((m,i)=>{const d=Math.abs(Math.log10(m.d)-log); if(d<delta){delta=d;best=i;}}); return best; }
function betweenText(log){ const x=Math.pow(10,log); let prev=M[0],next=M[M.length-1]; for(let i=0;i<M.length-1;i++){ if(x>=M[i].d && x<=M[i+1].d){prev=M[i]; next=M[i+1]; break;} }
 return `${prev.short} → ${next.short}`; }
function setLog(log, snap=false){ state.log=Math.max(minLog,Math.min(maxLog,log)); state.target=state.log; els.range.value=state.log.toFixed(3); if(snap){ const idx=nearestIndex(state.log); state.log=Math.log10(M[idx].d); state.target=state.log; els.range.value=state.log.toFixed(3);} updateUI(); draw(performance.now()); }
function jumpTo(i){ const item=M[Math.max(0,Math.min(M.length-1,i))]; state.log=Math.log10(item.d); state.target=state.log; els.range.value=state.log.toFixed(3); updateUI(); draw(performance.now()); }
function updateUI(){ const idx=nearestIndex(state.log), item=M[idx], p=phaseFor(state.log), dist=Math.pow(10,state.log);
 els.rangeLabel.textContent=`Skala przestrzeni: ${fmtDistance(dist)}`;
 els.targetName.textContent=item.name; els.lead.textContent=item.lead; els.desc.textContent=item.desc; els.type.textContent=typeLabel(item.type); els.ordinal.textContent=`#${String(idx+1).padStart(2,'0')}`;
 els.phaseKicker.textContent=p[0]; els.phaseTitle.textContent=p[1]; els.phaseRange.textContent=p[2]; els.activeName.textContent=item.name; els.between.textContent=betweenText(state.log);
 const c=299792458, voyager=17000, percentC=.01*c;
 const stats=[
   ['Skala odniesienia', fmtDistance(item.d), 'W zależności od celu: odległość lub rozmiar struktury.'],
   ['Światło', fmtTime(item.d/c), 'Czas pokonania odcinka tej długości.'],
   ['Voyager 1', fmtTime(item.d/voyager), 'Przy prędkości około 17 km/s.'],
   ['Statek 1% c', fmtTime(item.d/percentC), 'Hipotetyczny lot z 1% prędkości światła.']
 ];
 els.stats.innerHTML=stats.map(([label,val,note])=>`<div class="u28-stat"><strong>${val}</strong><span>${label}</span><small>${note}</small></div>`).join('');
 document.querySelectorAll('.u28-chip').forEach((b,i)=>b.classList.toggle('active', i===idx || b.dataset.idx==idx));
 }
function resize(){ const rect=canvas.getBoundingClientRect(); DPR=Math.min(2,devicePixelRatio||1); canvas.width=Math.round(rect.width*DPR); canvas.height=Math.round(rect.height*DPR); ctx.setTransform(DPR,0,0,DPR,0,0); }
function logX(log,w,pad){ return pad + (log-minLog)/(maxLog-minLog)*(w-pad*2); }
function drawBackground(w,h,t){ const grad=ctx.createLinearGradient(0,0,0,h); grad.addColorStop(0,'#07111f'); grad.addColorStop(.6,'#091322'); grad.addColorStop(1,'#0a1526'); ctx.fillStyle=grad; ctx.fillRect(0,0,w,h); for(const s of stars){ ctx.globalAlpha=s.a; ctx.fillStyle='#d9efff'; ctx.beginPath(); const tw=(reduced?0:Math.sin(t*.0005+s.x*8+s.y*5)*.5); ctx.arc(s.x*w,s.y*h,s.r+tw*.35,0,7); ctx.fill(); } ctx.globalAlpha=1; }
function drawScale(w,h){ const pad=52, lineY=h*.72; ctx.lineWidth=2; ctx.strokeStyle='rgba(134,185,219,.22)'; ctx.beginPath(); ctx.moveTo(pad,lineY); ctx.lineTo(w-pad,lineY); ctx.stroke();
 for(let p=0;p<=26;p+=2){ const x=logX(p,w,pad); ctx.strokeStyle='rgba(111,156,191,.18)'; ctx.beginPath(); ctx.moveTo(x,lineY-10); ctx.lineTo(x,lineY+10); ctx.stroke(); ctx.fillStyle='rgba(157,186,207,.7)'; ctx.font='11px system-ui'; ctx.fillText(`10^${p}`,x-13,lineY+30); }
 const curX=logX(state.log,w,pad); const glow=ctx.createLinearGradient(pad,0,curX,0); glow.addColorStop(0,'rgba(120,216,234,.10)'); glow.addColorStop(1,'rgba(120,216,234,.85)'); ctx.strokeStyle=glow; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(pad,lineY); ctx.lineTo(curX,lineY); ctx.stroke();
 M.forEach((m,i)=>{ const x=logX(Math.log10(m.d),w,pad); const active=i===nearestIndex(state.log); ctx.beginPath(); ctx.fillStyle=active?'#effcff':'#9cd6f0'; ctx.shadowColor=active?'#9cefff':'transparent'; ctx.shadowBlur=active?18:0; ctx.arc(x,lineY,active?6:4,0,7); ctx.fill(); ctx.shadowBlur=0; ctx.strokeStyle='rgba(156,214,240,.25)'; ctx.beginPath(); ctx.moveTo(x,lineY); ctx.lineTo(x,lineY-(active?94:48)-(i%2?12:0)); ctx.stroke(); ctx.fillStyle=active?'#f2fbff':'#b4c8da'; ctx.font=active?'600 12px system-ui':'11px system-ui'; const labelY=lineY-(active?106:58)-(i%2?12:0); ctx.fillText(m.short, Math.min(Math.max(x-26,8),w-120), labelY); });
 drawShip(curX,lineY);
 }
function drawShip(x,y){ ctx.save(); ctx.translate(x,y); ctx.fillStyle='#f3fbff'; ctx.strokeStyle='#86dff2'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(0,-18); ctx.lineTo(9,9); ctx.lineTo(0,4); ctx.lineTo(-9,9); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0,4); ctx.lineTo(0,17); ctx.stroke(); ctx.globalAlpha=.7; ctx.beginPath(); ctx.moveTo(-5,12); ctx.lineTo(0,23); ctx.lineTo(5,12); ctx.closePath(); ctx.fillStyle='#72c3ff'; ctx.fill(); ctx.restore(); }
function drawScene(w,h,t){ const idx=nearestIndex(state.log), item=M[idx]; const cx=w*.5, cy=h*.34; const phase=item.type; ctx.save(); ctx.translate(cx,cy);
 if(['start','orbita'].includes(phase)){
   const r=Math.min(w,h)*.09; const glow=ctx.createRadialGradient(0,0,1,0,0,r*3.5); glow.addColorStop(0,'#72d7ff34'); glow.addColorStop(1,'transparent'); ctx.fillStyle=glow; ctx.beginPath(); ctx.arc(0,0,r*3.5,0,7); ctx.fill(); ctx.fillStyle='#2b6da4'; ctx.beginPath(); ctx.arc(0,0,r,0,7); ctx.fill(); ctx.fillStyle='#8fd4ff'; ctx.beginPath(); ctx.arc(-r*.2,-r*.2,r*.26,0,7); ctx.fill(); const orbit=r*1.65; ctx.strokeStyle='rgba(180,220,255,.45)'; ctx.beginPath(); ctx.ellipse(0,0,orbit,orbit*.56,-.4,0,7); ctx.stroke(); const a=t*.00035 + state.log*.25; const x=Math.cos(a)*orbit,y=Math.sin(a)*orbit*.56; ctx.fillStyle='#f7f7fb'; ctx.beginPath(); ctx.arc(x,y,4.2,0,7); ctx.fill();
 }else if(phase==='uklad'){
   const sunR=Math.min(w,h)*.05; const g=ctx.createRadialGradient(0,0,1,0,0,sunR*4.5); g.addColorStop(0,'#f6ffff'); g.addColorStop(.3,'#8ae0ff'); g.addColorStop(1,'transparent'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,0,sunR*4.5,0,7); ctx.fill(); ctx.fillStyle='#dff8ff'; ctx.beginPath(); ctx.arc(0,0,sunR,0,7); ctx.fill(); const rings=[.18,.3,.44,.6,.76]; rings.forEach((r,i)=>{ctx.strokeStyle='rgba(124,166,198,.24)'; ctx.beginPath(); ctx.ellipse(0,0,w*r*.22,h*r*.07,-.28,0,7); ctx.stroke(); if(i<4){ const ang=t*.00016*(1.4-i*.18)+i; const rx=w*r*.22, ry=h*r*.07; const px=Math.cos(ang)*rx, py=Math.sin(ang)*ry; ctx.fillStyle=['#7fcff2','#f5d1b7','#74d8ff','#ed9a7d','#dcc7a4'][i]; ctx.beginPath(); ctx.arc(px,py,3.5+i*.7,0,7); ctx.fill(); } });
 }else if(phase==='gwiazdy'){
   for(let i=0;i<8;i++){ const a=i/8*Math.PI*2+t*.0001; const rr=90+i*11; ctx.strokeStyle='rgba(134,223,242,.08)'; ctx.beginPath(); ctx.arc(0,0,rr,0,7); ctx.stroke(); ctx.fillStyle=i? '#c6dcf7':'#eff8ff'; ctx.beginPath(); ctx.arc(Math.cos(a)*rr,Math.sin(a)*rr, i? 2.6:6.5,0,7); ctx.fill(); }
 }else if(phase==='galaktyka'){
   for(let arm=0;arm<2;arm++)for(let i=0;i<180;i++){ const p=i/180*6*Math.PI+arm*Math.PI; const r=i*.74; const x=Math.cos(p)*r*1.45,y=Math.sin(p)*r*.8; ctx.fillStyle=i%3? 'rgba(123,208,242,.75)':'rgba(191,159,255,.72)'; ctx.fillRect(x,y,1.8,1.8);} ctx.fillStyle='#f0fbff'; ctx.beginPath(); ctx.arc(0,0,7,0,7); ctx.fill();
 }else if(phase==='gromada' || phase==='supergromada'){
   for(let i=0;i<42;i++){ const a=i*2.399963229728653; const r=12+Math.sqrt(i)*18; const x=Math.cos(a)*r*1.5,y=Math.sin(a)*r; ctx.fillStyle=i%5? 'rgba(128,216,233,.8)':'rgba(217,188,255,.85)'; ctx.beginPath(); ctx.arc(x,y,2.3+(i%7===0),0,7); ctx.fill(); if(i%7===0){ctx.strokeStyle='rgba(132,224,242,.18)'; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(x,y); ctx.stroke();}}
 }else if(phase==='wszechswiat'){
   for(let i=0;i<22;i++){ const ax=(i*49)%360*Math.PI/180, ay=(i*91)%360*Math.PI/180; const r=40+(i%8)*22; const x=Math.cos(ax)*r*1.6, y=Math.sin(ay)*r; ctx.fillStyle='rgba(136,225,241,.9)'; ctx.beginPath(); ctx.arc(x,y,3.3,0,7); ctx.fill(); for(let j=0;j<3;j++){const xx=x+(Math.cos(ax+j)*18),yy=y+(Math.sin(ay+j*2)*9); ctx.strokeStyle='rgba(177,163,255,.22)'; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(xx,yy); ctx.stroke(); ctx.fillStyle='rgba(194,182,255,.8)'; ctx.fillRect(xx-1.2,yy-1.2,2.4,2.4);}}
   ctx.strokeStyle='rgba(134,224,242,.2)'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.arc(0,0,182,0,7); ctx.stroke();
 }
 ctx.restore();
 }
function draw(t){ const w=canvas.width/DPR,h=canvas.height/DPR; drawBackground(w,h,t); drawScene(w,h,t); drawScale(w,h); }
function loop(ts){ if(state.playing){ if(!state.last) state.last=ts; const dt=(ts-state.last)/1000; state.last=ts; state.log += dt*(reduced?0.45:0.45); if(state.log>=maxLog){ state.log=maxLog; state.playing=false; els.play.textContent='▶ Autopilot'; els.play.classList.remove('is-playing'); } els.range.value=state.log.toFixed(3); updateUI(); }
 draw(ts); requestAnimationFrame(loop); }
function makeJumps(){ els.jumps.innerHTML=M.map((m,i)=>`<button type="button" class="u28-chip" data-idx="${i}">${m.jump}</button>`).join(''); els.jumps.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>jumpTo(Number(b.dataset.idx)))); }
function post(type,extra={}){ try{ parent!==window && parent.postMessage({type,...extra},'*'); }catch(_){ } }
function init(){ resize(); makeJumps();
 els.range.min=minLog.toFixed(3); els.range.max=maxLog.toFixed(3);
 els.range.addEventListener('input',e=>{ state.log=Number(e.target.value); state.target=state.log; state.playing=false; els.play.textContent='▶ Autopilot'; els.play.classList.remove('is-playing'); updateUI(); draw(performance.now()); });
 els.play.addEventListener('click',()=>{ state.playing=!state.playing; state.last=0; els.play.textContent=state.playing?'❚❚ Zatrzymaj':'▶ Autopilot'; els.play.classList.toggle('is-playing',state.playing); });
 els.prev.addEventListener('click',()=>jumpTo(nearestIndex(state.log)-1)); els.next.addEventListener('click',()=>jumpTo(nearestIndex(state.log)+1));
 window.addEventListener('resize',()=>{resize(); draw(performance.now());});
 window.addEventListener('message',ev=>{ const msg=ev.data||{}; if(msg.type==='atlas:portal:ping') post('atlas:portal:ready'); });
 jumpTo(0); requestAnimationFrame(loop); post('atlas:portal:ready'); }
 if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
