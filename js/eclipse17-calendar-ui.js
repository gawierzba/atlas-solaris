/**
 * ATLAS SOLARIS 17.1 — interactive eclipse calendar.
 * Runs wholly offline from the app's existing planetary/lunar ephemerides.
 */
(function(root){
'use strict';
const $=id=>document.getElementById(id);
const types={solar:'ZAĆMIENIE SŁOŃCA',lunar:'ZAĆMIENIE KSIĘŻYCA'};
const subtypes={total:'całkowite',partial:'częściowe',annular:'obrączkowe',
 hybrid:'hybrydowe',penumbral:'półcieniowe'};
const plDay=new Intl.DateTimeFormat('pl-PL',{timeZone:'UTC',day:'numeric',month:'long',year:'numeric'});
const plUTC=new Intl.DateTimeFormat('pl-PL',{timeZone:'UTC',hour:'2-digit',minute:'2-digit',hour12:false});
const plPoland=new Intl.DateTimeFormat('pl-PL',{timeZone:'Europe/Warsaw',hour:'2-digit',minute:'2-digit',hour12:false});
function node(tag,className,content){
 const result=document.createElement(tag);
 if(className)result.className=className;
 if(content!==undefined)result.textContent=content;
 return result;
}
function start(){
 const api=root.ATLAS_MAIN_API,engine=root.ATLAS_ECLIPSE17,finderApi=root.AtlasSolarisCalendarSearch;
 const dialog=$('e17CalendarDialog');
 if(!api||!engine||!finderApi||!dialog)return;
 const finder=finderApi.createFinder(engine);
 let token=0,events=[],lastSearch='';
 const status=$('e17CalendarStatus'),list=$('e17CalendarResults'),form=$('e17CalendarForm');
 const year=$('e17CalendarYear'),month=$('e17CalendarMonth'),kind=$('e17CalendarKind');
 const now=new Date(),defaultYear=Math.min(2040,Math.max(2024,now.getUTCFullYear()+(now.getUTCMonth()>=9?1:0)));
 year.value=String(defaultYear);
 const setStatus=(message)=>{status.textContent=message;};
 function card(ev,i){
  const article=node('article','e17c-event '+ev.type);
  const meta=node('div','e17c-meta');
  meta.append(node('span','e17c-date',plDay.format(new Date(ev.approximatePeakUTC))));
  meta.append(node('span','e17c-category',ev.type==='solar'?'☀ SŁONECZNE':'☾ KSIĘŻYCOWE'));
  article.append(meta);
  const title=node('h3','',types[ev.type]+' · '+(subtypes[ev.subtype]||ev.subtype));
  article.append(title);
  const date=new Date(ev.approximatePeakUTC);
  article.append(node('p','e17c-peak','≈ '+plUTC.format(date)+' UTC · w Polsce: '+plPoland.format(date)+' (czas modelu)'));
  const specs=node('div','e17c-specs');
  specs.append(node('span','', 'Odległość Księżyca: '+Math.round(ev.moonDistanceKm).toLocaleString('pl-PL')+' km'));
  specs.append(node('span','', 'Szerokość ekliptyczna: '+ev.lunarLatitudeDeg.toFixed(2)+'°'));
  if(ev.node)specs.append(node('span','', 'Węzeł '+(ev.node.kind==='ascending'?'wstępujący':'zstępujący')+
     ' · '+Math.abs(ev.node.daysFromCrossing).toFixed(1)+' dnia od przejścia'));
  article.append(specs);
  const actions=node('div','e17c-actions');
  for(const [view,label] of [['geometry','◈ Geometria 3D'],['globe','🌍 Ziemia z kosmosu'],['lab','☀ Widok tarcz']]){
   const b=node('button','e17c-action'+(view==='geometry'?' primary':''),label);
   b.type='button';b.dataset.idx=String(i);b.dataset.view=view;
   actions.append(b);
  }
  article.append(actions);
  return article;
 }
 function render(result){
  events=result.events;list.replaceChildren();
  $('e17CalendarCount').textContent=String(events.length);
  if(events.length===0){
   const empty=node('div','e17c-empty','Nie znaleziono zaćmień spełniających warunki w tym okresie. Możesz wybrać inny rok lub oba rodzaje zjawisk.');
   list.append(empty);
  }else events.forEach((event,i)=>list.append(card(event,i)));
  $('e17CalendarProgress').value=100;
  const scope=result.month?('w miesiącu '+month.options[month.selectedIndex].text.toLowerCase()):('w roku '+result.year);
  setStatus('Zakończono. '+events.length+' '+(events.length===1?'zjawisko':'zjawisk')+' '+scope+'.');
 }
 async function search(){
  const my=++token;
  const y=Number(year.value),m=Number(month.value),t=kind.value;
  if(!Number.isInteger(y)||y<2024||y>2040){
   setStatus('Wybierz rok od 2024 do 2040.');return;
  }
  list.replaceChildren(node('div','e17c-scanning','Analizuję syzygie i stożki cienia…'));
  const btn=$('e17CalendarSearch');btn.disabled=true;btn.textContent='Obliczanie…';
  $('e17CalendarProgress').value=0;
  setStatus('Wyszukiwanie w danych orbitalnych ATLAS SOLARIS. Bez pobierania danych z Internetu.');
  try{
   const result=await finder.search({year:y,month:m,type:t,
    isCancelled:()=>my!==token||!dialog.open,
    onProgress:({done,total,found})=>{
     if(my!==token)return;
     $('e17CalendarProgress').value=100*done/total;
     setStatus('Przeszukano '+done+' z '+total+' miesięcy · wykryte zjawiska: '+found);
    }});
   if(my!==token||!dialog.open||!result)return;
   render(result);
   lastSearch=y+'-'+m+'-'+t;
  }catch(err){
   if(my===token){list.replaceChildren();setStatus('Błąd wyszukiwania: '+(err?.message||err));}
  }finally{
   if(my===token){btn.disabled=false;btn.textContent='Wyszukaj zaćmienia';}
  }
 }
 form.addEventListener('submit',e=>{e.preventDefault();search();});
 list.addEventListener('click',e=>{
  const button=e.target.closest('button[data-view]');
  if(!button)return;
  const picked=events[Number(button.dataset.idx)];
  if(!picked)return;
  const view=button.dataset.view;
  ++token;
  dialog.close();
  try{api.openCalendarEclipse(picked,view);}
  catch(err){setStatus('Nie udało się otworzyć sceny: '+(err?.message||err));dialog.showModal();}
 });
 function open(){
  if($('geometryDialog')?.open)$('geometryClose')?.click();
  if($('eclipseDialog')?.open)$('closeEclipses')?.click();
  if(dialog.open)return;
  dialog.showModal();
  const key=year.value+'-'+month.value+'-'+kind.value;
  if(!lastSearch||key!==lastSearch)search();
 }
 for(const id of ['openEclipses17CalendarSide','e17CalendarFromGeometry','e17CalendarFromEclipse']){
  $(id)?.addEventListener('click',open);
 }
 $('e17CalendarClose').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
 dialog.addEventListener('close',()=>{
  ++token;
  const b=$('e17CalendarSearch');b.disabled=false;b.textContent='Wyszukaj zaćmienia';
 });
 for(const y of [2027,2028,2029]){
  const btn=$('e17CalendarQuick'+y);
  btn?.addEventListener('click',()=>{year.value=String(y);month.value='0';kind.value='all';search();});
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);
else start();
})(window);
