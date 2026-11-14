/* ATLAS SOLARIS 25.0 — geometry of apparent solar motion and two different zodiacs.
   Solar longitude: low-precision apparent Sun, Meeus/NOAA form; not an ephemeris.
   Astronomical constellation boundaries: approximate crossings calibrated to 2026,
   NOT the full IAU polygon classifier. All dates UTC.
   No astrology or predictive interpretations. */
(function(root){'use strict';
const rad=Math.PI/180,deg=180/Math.PI,EPS=23.439291111*rad;
const mod=x=>(x%360+360)%360;
const CLAMP=(x,a,b)=>Math.min(b,Math.max(a,x));
const FMT=Object.freeze([
 ['Ari','Baran','Aries','♈','19 kwietnia','Ognisty początek dawnych map nieba; Hamal jest jego najjaśniejszą gwiazdą.'],
 ['Tau','Byk','Taurus','♉','14 maja','Aldebaran i gromada Plejad — charakterystyczne drogowskazy zimowego nieba.'],
 ['Gem','Bliźnięta','Gemini','♊','21 czerwca','Kastor i Polluks tworzą parę jasnych gwiazd, niebędących fizycznym układem podwójnym ze sobą.'],
 ['Cnc','Rak','Cancer','♋','21 lipca','W jego okolicy świeci gromada otwarta Żłóbek (M44).'],
 ['Leo','Lew','Leo','♌','11 sierpnia','Regulus leży blisko ekliptyki, dzięki czemu bywa zakrywany przez Księżyc.'],
 ['Vir','Panna','Virgo','♍','17 września','Spika jest jasną gwiazdą w ogromnej, nierównomiernie rozciągniętej na ekliptyce konstelacji.'],
 ['Lib','Waga','Libra','♎','31 października','Starożytne gwiazdy Wagi bywały uważane za szczypce Skorpiona.'],
 ['Sco','Skorpion','Scorpius','♏','23 listopada','Antares świeci czerwono; Słońce przechodzi przez ten obszar tylko przez około tydzień.'],
 ['Oph','Wężownik','Ophiuchus','⛎','30 listopada','Trzynasty gwiazdozbiór przecięty przez ekliptykę; nie jest dodatkowym znakiem tradycyjnego zodiaku.'],
 ['Sgr','Strzelec','Sagittarius','♐','18 grudnia','Patrząc w jego stronę, spoglądamy w przybliżeniu ku centrum Drogi Mlecznej.'],
 ['Cap','Koziorożec','Capricornus','♑','20 stycznia','Niewielkie jasności gwiazd tworzą rozległy zarys po południowej stronie ekliptyki.'],
 ['Aqr','Wodnik','Aquarius','♒','16 lutego','Rozległa, słabo świecąca konstelacja nieba jesiennego.'],
 ['Psc','Ryby','Pisces','♓','12 marca','Obszar nieba w pobliżu współczesnego punktu równonocy marcowej.']
]);
const INGRESS_2026=Object.freeze([
 '2026-04-19T02:29:00Z','2026-05-14T13:57:00Z','2026-06-21T21:19:00Z',
 '2026-07-21T02:04:00Z','2026-08-11T01:09:00Z','2026-09-17T02:15:00Z',
 '2026-10-31T14:40:00Z','2026-11-23T17:27:00Z','2026-11-30T05:39:00Z',
 '2026-12-18T13:06:00Z','2026-01-20T02:18:00Z','2026-02-16T12:54:00Z',
 '2026-03-12T14:30:00Z'
]);
function julianDate(date){const t=(date instanceof Date?date:new Date(date)).getTime();return t/86400000+2440587.5;}
function sunLongitude(date){
 const T=(julianDate(date)-2451545.0)/36525;
 const L0=mod(280.46646+T*(36000.76983+T*.0003032));
 const M=mod(357.52911+T*(35999.05029-.0001537*T));
 const C=(1.914602-T*(.004817+.000014*T))*Math.sin(M*rad)
  +(.019993-.000101*T)*Math.sin(2*M*rad)+.000289*Math.sin(3*M*rad);
 const omega=125.04-1934.136*T;
 return mod(L0+C-.00569-.00478*Math.sin(omega*rad));
}
function sunEquatorial(date){
 const lam=sunLongitude(date)*rad,T=(julianDate(date)-2451545)/36525;
 const eps=(23.439291111-.013004167*T+.00256*Math.cos((125.04-1934.136*T)*rad))*rad;
 return {ra:mod(Math.atan2(Math.cos(eps)*Math.sin(lam),Math.cos(lam))*deg),dec:Math.asin(Math.sin(eps)*Math.sin(lam))*deg};
}
const CATALOG=Object.freeze(FMT.map((item,i)=>Object.freeze({
 id:item[0],name:item[1],latin:item[2],symbol:item[3],approxStart:item[4],fact:item[5],
 start2026:sunLongitude(INGRESS_2026[i]), index:i
})));
const SIGNS=Object.freeze(['Baran','Byk','Bliźnięta','Rak','Lew','Panna','Waga','Skorpion','Strzelec','Koziorożec','Wodnik','Ryby']);
function sectors(year=2026){
 // Equinox moves ~50.29 arcsec/y with respect to J2000 star background.
 // Small correction allows nearby years without implying exact IAU crossing times.
 const prec=(Number(year)-2026)*50.29/3600;
 return CATALOG.map((c,i)=>({...c,start:mod(c.start2026+prec),
  end:mod(CATALOG[(i+1)%CATALOG.length].start2026+prec),
  width:mod(CATALOG[(i+1)%CATALOG.length].start2026-c.start2026)}));
}
function zone(lambda,year=2026){
 const arr=sectors(year),v=mod(lambda);
 return arr.find(c=>mod(v-c.start)<c.width) || arr[0];
}
function sign(lambda){const i=Math.floor(mod(lambda)/30)%12;return {name:SIGNS[i],index:i,degree:mod(lambda)%30};}
function nextIngress(date){
 const d=date instanceof Date?date:new Date(date),lambda=sunLongitude(d),arr=sectors(d.getUTCFullYear()),here=zone(lambda,d.getUTCFullYear());
 const idx=(here.index+1)%arr.length,next=arr[idx];
 const dist=mod(next.start-lambda),estimate=new Date(d.getTime()+dist/(360/365.2422)*86400000);
 return {next,angularDistance:dist,date:estimate,approximate:true};
}
function eclipticFromEq(ra,dec){
 const a=ra*rad,d=dec*rad,cd=Math.cos(d),x=cd*Math.cos(a),y=cd*Math.sin(a),z=Math.sin(d);
 const yp=y*Math.cos(EPS)+z*Math.sin(EPS),zp=-y*Math.sin(EPS)+z*Math.cos(EPS);
 return {lon:mod(Math.atan2(yp,x)*deg),lat:Math.asin(CLAMP(zp,-1,1))*deg};
}
function eclipticFromVector(v){
 if(!v||!v.every(Number.isFinite))return null;
 const len=Math.hypot(...v);if(!(len>0))return null;
 return {lon:mod(Math.atan2(v[1],v[0])*deg),lat:Math.asin(CLAMP(v[2]/len,-1,1))*deg,distanceAU:len};
}
function solarDateAtLongitude(year,target){
 // Bracket and bisect the forward progression of the Sun, preventing 0° wrap errors.
 // Grid search 0.5-day, then binary search; date range 2024–2040 intended.
 const start=Date.UTC(year,0,1),end=Date.UTC(year+1,0,1),targetMod=mod(target);
 const diff=t=>((sunLongitude(new Date(t))-targetMod+540)%360)-180;
 let best=null;
 for(let t=start;t<end;t+=43200000){
  const t2=Math.min(end,t+43200000),a=diff(t),b=diff(t2);
  if(a<=0&&b>=0&&b-a<30){let lo=t,hi=t2;
   for(let k=0;k<36;k++){const mid=(lo+hi)/2;if(diff(mid)<0)lo=mid;else hi=mid;}
   best=new Date((lo+hi)/2);break;
  }
 }
 return best;
}
function nearMidDate(year,sectorId){
 const arr=sectors(year),c=arr.find(c=>c.id===sectorId);
 return c?solarDateAtLongitude(year,mod(c.start+c.width*.5)):null;
}
const DATA=Object.freeze({CATALOG,INGRESS_2026,SIGNS,julianDate,sunLongitude,sunEquatorial,
 sectors,zone,sign,nextIngress,eclipticFromEq,eclipticFromVector,solarDateAtLongitude,nearMidDate,mod});
root.ATLAS_ZODIAC25_CORE=DATA;
if(typeof module!=='undefined'&&module.exports)module.exports=DATA;
})(typeof window!=='undefined'?window:globalThis);