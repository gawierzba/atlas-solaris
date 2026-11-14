/* ATLAS SOLARIS 25.1 / Żywe Konstelacje.
 * A real 3D stellar perspective rendered through Canvas2D, not fictitious 3D stars.
 * Visual motion speed, glow, horizon grid, and camera are artistic; parallax and
 * relative angular directions derive from catalogued equatorial J2000 XYZ (ly).
 */
(function(root){'use strict';
const doc=root.document;const $=id=>doc?.getElementById(id);const PI=Math.PI,TWO=2*PI,RAD=PI/180,DEG=180/PI;
const COLOR={blue:'#a5cafd',white:'#f4f5ff',warm:'#fae4cb',orange:'#f4c1a7',red:'#eb9993'};
const preferred={Ari:'Hamal',Tau:'Aldebaran',Gem:'Pollux',Cnc:'Acubens',Leo:'Regulus',Vir:'Spica',Lib:'Zubenelgenubi',Sco:'Shaula',Oph:'Rasalhague',Sgr:'Kaus Australis',Cap:'Deneb Algedi',Aqr:'Sadalsuud',Psc:'Alpherg'};
const labelId={sun:'Słońce',moon:'Księżyc',mercury:'Merkury',venus:'Wenus',mars:'Mars',jupiter:'Jowisz',saturn:'Saturn',uranus:'Uran',neptune:'Neptun'};
const prettyNum=(n,dp=1)=>Number(n).toLocaleString('pl-PL',{minimumFractionDigits:dp,maximumFractionDigits:dp});
const safeDate=d=>new Date(Math.max(Date.UTC(2024,0,1),Math.min(Date.UTC(2040,11,31,23,59,59),d.getTime())));
function init(){
 const C=root.ATLAS_ZODIAC25_CORE,Q=root.ATLAS_ZODIAC251_CORE,D=root.ATLAS_INTERSTELLAR19_DATA,G=root.ATLAS_INTERSTELLAR19_CORE;
 const dialog=$('z251Dialog'),canvas=$('z251Canvas');
 if(!dialog||!canvas||!C||!Q||!D||!G||!$('z251Constellations'))return;
 const stars=D.stars.map((r,i)=>({id:i,pos:[r[0],r[1],r[2]],mag:r[3],bv:r[4],name:r[5]||'',hip:r[6],source:r[7],distanceLy:Math.hypot(r[0],r[1],r[2])}));
 const visibleStars=stars.filter(s=>Number.isFinite(s.mag)&&s.mag<=5.9&&s.distanceLy>.01);
 let today=safeDate(new Date());
 const atlas=root.ATLAS_MAIN_API;
 if(atlas?.getJD){const d=new Date((atlas.getJD()-2440587.5)*86400000);if(Number.isFinite(d.getTime())&&d.getUTCFullYear()>=2024&&d.getUTCFullYear()<=2040)today=d;}
 const state={date:today,id:'Leo',target:null,progress:0,playing:false,flightSeconds:8,camera:'figure',
  showBounds:true,showFigure:true,yaw:0,pitch:0,targetYaw:0,targetPitch:0,fov:74,
  raf:0,prev:0,lastUi:0,dirty:true,drag:null,hitTargets:[],priorZodiacOpen:false,resizeObserver:null};
 let current={paths:[],nodes:[]};
 function setText(id,v){const el=$(id);if(el)el.textContent=v;}
 function dateString(d){return d.toISOString().slice(0,10);}
 function currentPos(){return state.target?G.mul(state.target.pos,state.progress):[0,0,0];}
 function ang(a,b){return Math.atan2(Math.sin(a-b),Math.cos(a-b));}
 function meanDirection(observer){
  const sum=[0,0,0];let count=0;
  for(const node of current.nodes){
   const ray=G.unit(G.sub(stars[node.index].pos,observer));if(!ray)continue;
   for(let i=0;i<3;i++)sum[i]+=ray[i];count++;
  }
  return count?G.unit(sum):[1,0,0];
 }
 function cameraDirection(observer){
  if(state.camera==='target'&&state.target)return G.unit(G.sub(state.target.pos,observer))||G.unit(state.target.pos);
  if(state.camera==='sun'&&state.progress>0.00001)return G.unit(G.mul(observer,-1));
  return meanDirection(observer);
 }
 function setCameraInstant(mode){
  if(mode)state.camera=mode;
  const v=cameraDirection(currentPos());if(!v)return;
  const a=G.directionAngles(v);state.yaw=state.targetYaw=a.yaw;state.pitch=state.targetPitch=a.pitch;
 }
 function approachCamera(dt){
  if(state.camera==='free')return;
  const v=cameraDirection(currentPos());if(!v)return;
  const a=G.directionAngles(v),factor=Math.min(1,1-Math.exp(-Math.max(.01,dt)*4.5));
  state.yaw+=ang(a.yaw,state.yaw)*factor;
  state.pitch+= (a.pitch-state.pitch)*factor;
  state.targetYaw=a.yaw;state.targetPitch=a.pitch;
 }
 function pickStar(st,reset=true){
  if(!st)return;
  state.target=st;if(reset){state.playing=false;state.progress=0;}
  $('z251StarSelect').value=String(st.id);$('z251Fly').textContent='▶ ROZPOCZNIJ LOT';
  if(state.camera==='sun')state.camera='figure';
  $('z251Camera').value=state.camera;
  updateReadouts();state.dirty=true;
 }
 function selectConstellation(id,center=true){
  const meta=C.CATALOG.find(x=>x.id===id);if(!meta)return;
  state.id=id;current=Q.constellationStars(D,id);
  const usable=current.nodes.map(n=>stars[n.index]).filter(s=>s&&s.distanceLy>0&&Number.isFinite(s.mag));
  const select=$('z251StarSelect');select.replaceChildren();
  usable.sort((a,b)=>a.mag-b.mag);
  for(const s of usable){const opt=doc.createElement('option');opt.value=String(s.id);opt.textContent=(s.name||'HIP '+(s.hip||s.id))+' · '+prettyNum(s.distanceLy,0)+' lat świetlnych';select.appendChild(opt);}
  const target=usable.find(s=>s.name===preferred[id])||usable[0];
  state.target=target||null;state.playing=false;state.progress=0;
  if(target)select.value=String(target.id);
  for(const btn of $('z251Constellations').querySelectorAll('button'))btn.setAttribute('aria-pressed',String(btn.dataset.id===id));
  $('z251Fly').textContent='▶ ROZPOCZNIJ LOT';
  if(state.camera==='sun'||state.camera==='free')state.camera='figure';$('z251Camera').value=state.camera;
  if(center)setCameraInstant('figure');
  setText('z251ActiveName',meta.name+' / '+meta.latin);
  setText('z251NodeCount',String(current.nodes.length)+' gwiazd');
  setText('z251InfoTitle',meta.name+' · '+meta.latin);
  setText('z251Glyph',meta.symbol);
  setText('z251InfoText',meta.fact);
  setText('z251StageHeading',meta.name+' — widok przestrzenny');
  const dist=usable.map(s=>s.distanceLy);setText('z251Depth',dist.length?prettyNum(Math.min(...dist),0)+'–'+prettyNum(Math.max(...dist),0)+' ly':'brak wiarygodnej odległości');
  updateReadouts();state.dirty=true;
 }
 function updateReadouts(){
  const star=state.target,p=state.progress;
  setText('z251DestinationDistance',star?prettyNum(star.distanceLy,1)+' ly':'—');
  setText('z251TargetStar',star?(star.name||'HIP '+(star.hip||star.id)):'—');
  setText('z251StarDistance',star?prettyNum(star.distanceLy,2)+' lat świetlnych':'—');
  setText('z251Magnitude',star?prettyNum(star.mag,2)+' mag (V)':'—');
  setText('z251StarCaption',star?(star.source===2?'Odległość jest oszacowaniem pomocniczym':'HIP '+(star.hip||'—')+' · barwa i jasność katalogowa'):'Wybierz gwiazdę');
  setText('z251Position',star?prettyNum(star.distanceLy*p,2)+' ly':'0,00 ly');
  setText('z251ProgressText',prettyNum(p*100,1)+'% drogi');
  $('z251Progress').value=String(Math.round(p*1000));
  setText('z251ViewMode',p>0?'POZYCJA W PRZESTRZENI / '+prettyNum(star.distanceLy*p,1)+' ly':'PERSPEKTYWA SŁOŃCA');
  setText('z251SceneTime','J2000 · BRYŁA GWIAZD · BEZ RUCHU WŁASNEGO');
  if(p>0.001){setText('z251BorderNote','Granice IAU pokazujemy wyłącznie z perspektywy Ziemi — w przestrzeni nie tworzą ścian.');}
  else{setText('z251BorderNote',state.showBounds?'Cienkie linie wyznaczają oficjalne obszary IAU na niebie J2000.':'Obrysy IAU ukryte · przywróć przyciskiem „Granice IAU”.');}
  let change=null;
  if(current.nodes.length>=2&&star){
   const first=stars[current.nodes.find(x=>x.index!==star.id)?.index||star.id];
   const second=stars[current.nodes.reduce((best,n)=>stars[n.index].distanceLy>stars[best.index].distanceLy?n:best,current.nodes[0]).index];
   if(first&&second&&first.id!==second.id){
    const initial=G.angularSeparation(first.pos,second.pos),observer=currentPos();
    const now=G.angularSeparation(G.sub(first.pos,observer),G.sub(second.pos,observer));
    if(initial!==null&&now!==null)change=Math.abs(now-initial);
   }
  }
  setText('z251Separation',change===null?'—':prettyNum(change,2)+'°');
 }
 function updateDate(input){
  if(!Number.isFinite(new Date(input).getTime()))return;
  state.date=safeDate(new Date(input));$('z251Date').value=dateString(state.date);
  const now=Q.sunZone(state.date),entry=C.CATALOG.find(x=>x.id===now);
  setText('z251SunZone',entry?entry.symbol+' '+entry.name:'poza pasem zodiakalnym');
  const longitude=C.sunLongitude(state.date);
  setText('z251SunLongitude','Długość ekliptyczna Słońca ≈ '+prettyNum(longitude,2)+'° (równonoc daty)');
  const next=Q.nextIngress(state.date),target=C.CATALOG.find(x=>x.id===next?.id);
  const locale={timeZone:'UTC',year:'numeric',month:'long',day:'numeric'};
  setText('z251NextCrossing',next&&target?target.name:'—');
  setText('z251CrossingNote',next?new Intl.DateTimeFormat('pl-PL',locale).format(next.date)+' UTC · model przybliżony':'Brak danych w podanym zakresie');
  state.dirty=true;
 }
 function getSize(){const r=canvas.getBoundingClientRect();if(r.width<10||r.height<10)return null;
  const ratio=Math.min(root.devicePixelRatio||1,1.7),budget=Math.min(ratio,1700/r.width,1100/r.height);
  const w=Math.round(r.width*budget),h=Math.round(r.height*budget);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;state.dirty=true;}
  const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)return null;ctx.setTransform(budget,0,0,budget,0,0);
  return {ctx,w:r.width,h:r.height};}
 function spectral(bv){return bv<0.02?COLOR.blue:bv<.35?'#cbe1fc':bv<.82?COLOR.white:bv<1.25?COLOR.warm:bv<1.6?COLOR.orange:COLOR.red;}
 function bg(ctx,w,h,dt){
  ctx.fillStyle='#020815';ctx.fillRect(0,0,w,h);
  const grad=ctx.createRadialGradient(w*.5,h*.38,0,w*.5,h*.47,Math.max(w,h)*.8);
  grad.addColorStop(0,'#132c49');grad.addColorStop(.32,'#0b1830');grad.addColorStop(1,'#030913');ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
  const light=ctx.createLinearGradient(0,0,w,h);light.addColorStop(0,'#22356b13');light.addColorStop(.55,'#31778d12');light.addColorStop(1,'#25163c1b');ctx.fillStyle=light;ctx.fillRect(0,0,w,h);
 }
 function paintPoint(ctx,x,y,mag,bv,emphasis=false){
  const r=Math.max(.42,Math.min(5.1,2.9-mag*.36))+(emphasis?.6:0);
  ctx.fillStyle=spectral(bv);
  if(emphasis||mag<1.2){ctx.shadowBlur=Math.min(19,7+r*2);ctx.shadowColor=spectral(bv);}
  ctx.beginPath();ctx.arc(x,y,r,0,TWO);ctx.fill();ctx.shadowBlur=0;
 }
 function projectStar(star,observer,axes,w,h){const ray=G.sub(star.pos,observer);const distance=G.norm(ray);if(distance<.0001)return null;
  const q=G.project(ray,axes,w,h,state.fov);return q?{...q,distance,mag:G.apparentMagnitude(star.mag,star.distanceLy,distance)}:null;}
 function drawIAU(ctx,axes,w,h){
  if(!state.showBounds||state.progress>.0001)return;
  const entries=Q.bounds.filter(b=>b[0]===state.id);
  const plot=q=>G.project(Q.vector(q[0],q[1]),axes,w,h,state.fov);
  for(const [id,path] of entries){
   const isSel=id===state.id;ctx.save();ctx.lineWidth=isSel?1.75:1;
   ctx.strokeStyle=isSel?'rgba(100,230,238,.88)':'rgba(93,160,205,.16)';ctx.setLineDash(isSel?[4,5]:[2,6]);
   ctx.beginPath();let prev=null;
   for(const vertex of path){const p=plot(vertex);if(p&&prev&&Math.hypot(p.x-prev.x,p.y-prev.y)<Math.max(w,h)*.55){ctx.moveTo(prev.x,prev.y);ctx.lineTo(p.x,p.y);}prev=p;}
   ctx.stroke();ctx.restore();
  }
 }
 function drawPattern(ctx,observer,axes,w,h){
  if(!state.showFigure)return;
  ctx.save();ctx.strokeStyle='rgba(126,215,240,.60)';ctx.shadowBlur=11;ctx.shadowColor='rgba(71,183,229,.40)';ctx.lineWidth=1.6;
  for(const path of current.paths){
   let prev=null;
   for(const index of path){const st=stars[index];if(!st){prev=null;continue;}
    const p=projectStar(st,observer,axes,w,h);if(prev&&p&&Math.hypot(p.x-prev.x,p.y-prev.y)<Math.max(w,h)*1.2){
     ctx.beginPath();ctx.moveTo(prev.x,prev.y);ctx.lineTo(p.x,p.y);ctx.stroke();
    }
    prev=p;
   }
  }
  ctx.restore();
 }
 function drawSun(ctx,observer,axes,w,h){
  if(state.progress<.0002)return;
  const ray=G.mul(observer,-1);const pr=G.project(ray,axes,w,h,state.fov);if(!pr)return;
  if(pr.x<0||pr.x>w||pr.y<0||pr.y>h)return;
  ctx.beginPath();ctx.arc(pr.x,pr.y,3,0,TWO);ctx.fillStyle='#e7f4ff';ctx.shadowBlur=17;ctx.shadowColor='#8bb9fc';ctx.fill();ctx.shadowBlur=0;
  ctx.font='10px system-ui';ctx.textAlign='left';ctx.fillStyle='#8db2d2';ctx.fillText('SŁOŃCE',pr.x+9,pr.y-6);
 }
 function drawScene(){
  if(!dialog.open)return;
  const CSize=getSize();if(!CSize)return;const {ctx,w,h}=CSize;
  const observer=currentPos(),axes=G.skyAxes(state.yaw,state.pitch);
  bg(ctx,w,h);
  const now=performance.now();
  ctx.save();ctx.globalAlpha=.13;ctx.strokeStyle='#315175';ctx.lineWidth=.55;
  for(let r=1;r<=3;r++){ctx.beginPath();ctx.ellipse(w*.5,h*.5,Math.min(w,h)*r*.22,Math.min(w,h)*r*.22,0,0,TWO);ctx.stroke();}
  ctx.beginPath();ctx.moveTo(w*.5,0);ctx.lineTo(w*.5,h);ctx.moveTo(0,h*.5);ctx.lineTo(w,h*.5);ctx.stroke();ctx.restore();
  drawIAU(ctx,axes,w,h);
  drawPattern(ctx,observer,axes,w,h);
  for(const st of visibleStars){
   const p=projectStar(st,observer,axes,w,h);if(!p||p.mag>7.2||p.x<-10||p.x>w+10||p.y<-10||p.y>h+10)continue;
   paintPoint(ctx,p.x,p.y,p.mag,st.bv,false);
  }
  drawSun(ctx,observer,axes,w,h);
  const nodes=current.nodes.map(n=>stars[n.index]).filter(Boolean);
  const highlighted=[];const hits=[];
  for(const st of nodes){
   const p=projectStar(st,observer,axes,w,h);if(!p||p.x<-20||p.x>w+20||p.y<-20||p.y>h+20)continue;
   paintPoint(ctx,p.x,p.y,Math.min(5,p.mag),st.bv,true);
   hits.push({st,x:p.x,y:p.y});
   if(st.name||st===state.target)highlighted.push({st,x:p.x,y:p.y});
  }
  highlighted.sort((a,b)=>a.st.mag-b.st.mag);
  ctx.save();ctx.font='11px system-ui';ctx.textAlign='left';ctx.fillStyle='#c9e7f5';
  const labels=[];for(const p of highlighted){
   if(labels.length>=11)break;
   if(labels.some(q=>Math.hypot(q.x-p.x,q.y-p.y)<47))continue;
   ctx.fillStyle=p.st===state.target?'#e6f9ff':'rgba(186,214,234,.9)';
   ctx.fillText(p.st.name||'HIP '+(p.st.hip||p.st.id),p.x+8,p.y-9);labels.push(p);
  }
  ctx.restore();state.hitTargets=hits;
  if(state.target){const p=projectStar(state.target,observer,axes,w,h);
   if(p&&p.x>-50&&p.x<w+50&&p.y>-50&&p.y<h+50){
    const radius=14+(Math.sin(now*.002)*1.8);
    ctx.beginPath();ctx.arc(p.x,p.y,radius,0,TWO);ctx.lineWidth=1;ctx.strokeStyle='#9bf5f2';ctx.setLineDash([3,6]);ctx.stroke();ctx.setLineDash([]);
    for(let i=0;i<4;i++){let a=i*PI/2+PI/4;ctx.beginPath();ctx.moveTo(p.x+Math.cos(a)*21,p.y+Math.sin(a)*21);ctx.lineTo(p.x+Math.cos(a)*28,p.y+Math.sin(a)*28);ctx.strokeStyle='#9fe5f2a0';ctx.stroke();}
   }
  }
  ctx.save();const margin=16;
  ctx.textAlign='left';ctx.fillStyle='#79b8d6';ctx.font='700 10px system-ui';ctx.fillText((C.CATALOG.find(x=>x.id===state.id)?.latin||'ZODIAK').toUpperCase()+'  /  '+prettyNum(state.progress*100,1)+'% LOTU',margin,h-75);
  ctx.fillStyle='#3e7198';ctx.fillRect(margin,h-63,Math.min(165,w*.43),1);
  ctx.restore();
 }
 function setPlaying(on){state.playing=!!on;if(state.progress>=.949&&state.playing)state.progress=0;
  $('z251Fly').textContent=state.playing?'Ⅱ PAUZA':state.progress>=.949?'↺ POWTÓRZ LOT':'▶ ROZPOCZNIJ LOT';
  state.dirty=true;
 }
 function frame(time){
  if(!dialog.open){state.raf=0;return;}
  const dt=state.prev?Math.min(.09,(time-state.prev)/1000):0;state.prev=time;
  const moving=state.playing;
  if(moving){state.progress=Math.min(.95,state.progress+dt*.95/state.flightSeconds);if(state.progress>=.95)setPlaying(false);state.dirty=true;}
  const beforeYaw=state.yaw,beforePitch=state.pitch;
  approachCamera(dt);
  if(Math.abs(ang(beforeYaw,state.yaw))>.0001||Math.abs(beforePitch-state.pitch)>.0001)state.dirty=true;
  if(time-state.lastUi>140){updateReadouts();state.lastUi=time;}
  if(state.dirty||moving){drawScene();state.dirty=false;}
  state.raf=root.requestAnimationFrame(frame);
 }
 function open(id){
  if(root.ATLAS_ZODIAC25){state.priorZodiacOpen=!!$('zodiac25Dialog')?.open;root.ATLAS_ZODIAC25.close();}
  if(!dialog.open){try{dialog.showModal();}catch(_){dialog.setAttribute('open','');}}
  const old=state.id;
  if(id&&C.CATALOG.some(x=>x.id===id))selectConstellation(id);
  else if(!state.target){const sun=Q.sunZone(state.date)||'Leo';selectConstellation(sun);}
  else if(old)updateReadouts();
  setPlaying(false);state.prev=0;state.dirty=true;updateDate(state.date);
  if(!state.raf)state.raf=root.requestAnimationFrame(frame);
 }
 function close(){setPlaying(false);if(dialog.open)dialog.close();}
 function backTo25(){const date=state.date;close();root.ATLAS_ZODIAC25?.open?.();root.ATLAS_ZODIAC25?.setDate?.(date);}
 for(const c of C.CATALOG){const b=doc.createElement('button');b.type='button';b.dataset.id=c.id;b.setAttribute('aria-pressed','false');
  const s=doc.createElement('span');s.textContent=c.symbol;s.setAttribute('aria-hidden','true');b.append(s,doc.createTextNode(c.name));b.title='Zobacz gwiazdozbiór '+c.name;
  b.onclick=()=>selectConstellation(c.id);$('z251Constellations').appendChild(b);
 }
 $('openZodiac251Side')?.addEventListener('click',()=>open());
 $('openZodiac251Top')?.addEventListener('click',()=>open());
 $('z25ToLive')?.addEventListener('click',()=>{
  const older=root.ATLAS_ZODIAC25?.getState?.();const date=older?.date;
  if(date)state.date=safeDate(new Date(date));
  const id=C.CATALOG.find(c=>c.name===older?.constellation)?.id;
  open(id||Q.sunZone(state.date)||state.id);
 });
 $('z251Close').addEventListener('click',close);
 dialog.addEventListener('click',e=>{if(e.target===dialog)close();});
 dialog.addEventListener('close',()=>{state.playing=false;state.prev=0;if(state.raf){root.cancelAnimationFrame(state.raf);state.raf=0;}});
 $('z251FigureToggle').addEventListener('click',()=>{state.showFigure=!state.showFigure;$('z251FigureToggle').setAttribute('aria-pressed',String(state.showFigure));state.dirty=true;});
 $('z251BorderToggle').addEventListener('click',()=>{state.showBounds=!state.showBounds;$('z251BorderToggle').setAttribute('aria-pressed',String(state.showBounds));updateReadouts();state.dirty=true;});
 $('z251ResetView').addEventListener('click',()=>{state.camera='figure';$('z251Camera').value='figure';setCameraInstant();state.dirty=true;});
 $('z251Camera').addEventListener('change',e=>{state.camera=e.target.value;if(state.camera!=='free')setCameraInstant();state.dirty=true;});
 $('z251StarSelect').addEventListener('change',e=>pickStar(stars[Number(e.target.value)]));
 $('z251FlightSpeed').addEventListener('change',e=>state.flightSeconds=Math.max(4,Math.min(16,Number(e.target.value)||8)));
 $('z251Fly').addEventListener('click',()=>setPlaying(!state.playing));
 $('z251Home').addEventListener('click',()=>{setPlaying(false);state.progress=0;state.camera='figure';$('z251Camera').value='figure';setCameraInstant();updateReadouts();state.dirty=true;});
 $('z251Progress').addEventListener('input',e=>{setPlaying(false);state.progress=Math.max(0,Math.min(.95,Number(e.target.value)/1000));updateReadouts();state.dirty=true;});
 $('z251Date').addEventListener('change',e=>{if(/^\d{4}-\d{2}-\d{2}$/.test(e.target.value))updateDate(e.target.value+'T12:00:00Z');});
 $('z251Today').addEventListener('click',()=>updateDate(new Date()));
 $('z251AtlasDate').addEventListener('click',()=>{const api=root.ATLAS_MAIN_API;
  if(api?.setJD){api.setJD(C.julianDate(state.date));api.setPlaying?.(false);setText('z251CrossingNote','✓ Data głównego Atlasu ustawiona · '+dateString(state.date)+' UTC');}
 });
 $('z251BackTo25').addEventListener('click',backTo25);
 canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;state.drag={id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,moved:false};canvas.setPointerCapture?.(e.pointerId);});
 canvas.addEventListener('pointermove',e=>{const d=state.drag;if(!d||d.id!==e.pointerId)return;
  const dx=e.clientX-d.lastX,dy=e.clientY-d.lastY;
  if(Math.hypot(e.clientX-d.x,e.clientY-d.y)>4)d.moved=true;
  if(d.moved){state.camera='free';$('z251Camera').value='free';const width=Math.max(200,canvas.getBoundingClientRect().width);
   state.yaw-=dx/width*2.3;state.pitch=G.clamp(state.pitch+dy/width*2.3,-PI/2+.08,PI/2-.08);state.dirty=true;}
  d.lastX=e.clientX;d.lastY=e.clientY;
 });
 canvas.addEventListener('pointerup',e=>{const d=state.drag;if(!d||d.id!==e.pointerId)return;state.drag=null;
  if(d.moved)return;const rect=canvas.getBoundingClientRect();const xx=e.clientX-rect.left,yy=e.clientY-rect.top;
  const hit=state.hitTargets.map(h=>({...h,r:Math.hypot(h.x-xx,h.y-yy)})).filter(h=>h.r<17).sort((a,b)=>a.r-b.r)[0];
  if(hit){pickStar(hit.st);state.dirty=true;}
 });
 canvas.addEventListener('pointercancel',()=>state.drag=null);
 canvas.addEventListener('wheel',e=>{e.preventDefault();state.fov=Math.max(36,Math.min(118,state.fov*(e.deltaY>0?1.08:.92)));state.dirty=true;},{passive:false});
 canvas.addEventListener('keydown',e=>{const k=e.key;
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(k)){
   state.camera='free';$('z251Camera').value='free';state.yaw+=(k==='ArrowLeft'?-1:k==='ArrowRight'?1:0)*.08;
   state.pitch=G.clamp(state.pitch+(k==='ArrowUp'?1:k==='ArrowDown'?-1:0)*.08,-PI/2+.08,PI/2-.08);state.dirty=true;e.preventDefault();
  } else if(k==='+'||k==='='||k==='-'){state.fov=G.clamp(state.fov*(k==='-'?1.1:.9),36,118);state.dirty=true;e.preventDefault();}
 });
 doc.addEventListener('visibilitychange',()=>{if(doc.hidden)setPlaying(false);});
 root.addEventListener('resize',()=>{state.dirty=true;});
 const initial=Q.sunZone(state.date)||'Leo';selectConstellation(initial);updateDate(state.date);
 root.ATLAS_ZODIAC251=Object.freeze({open,close,select:selectConstellation,setDate:updateDate,goHome:()=>$('z251Home').click(),
  getState:()=>({constellation:state.id,target:state.target?.name,progress:state.progress,date:dateString(state.date),playing:state.playing,showBounds:state.showBounds,showFigure:state.showFigure})});
}
if(doc?.readyState==='loading')doc.addEventListener('DOMContentLoaded',init);else if(doc)init();
})(typeof window!=='undefined'?window:globalThis);