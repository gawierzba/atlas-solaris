/* ATLAS SOLARIS XVIII — celestial sphere, solar altitude and editorial audit */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const bx={window:{},document:{readyState:'loading',addEventListener(){}}};
vm.runInNewContext(read('portal/night18-story.js'),bx);
const m=bx.window.ATLAS_NO18_PHYSICS;
const close=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<tol,'Expected '+a+' ≈ '+b);
const j2000=new Date('2000-01-01T12:00:00Z');
test('Epoka J2000.0 ma JD 2451545.0 i poprawny GMST',()=>{
 close(m.julianDay(j2000),2451545);
 close(m.gmstDegrees(j2000),280.46061837,1e-6);
 close(m.localSiderealDegrees(j2000,90),10.46061837,1e-6);
});
test('Kulminacja równikowa w zenicie i przeciwna poniżej horyzontu',()=>{
 const ra=m.gmstDegrees(j2000);
 close(m.position(j2000,0,0,ra,0).altitudeDeg,90,1e-5);
 close(m.position(j2000,0,0,ra+90,0).altitudeDeg,0,1e-5);
 close(m.position(j2000,0,0,ra+180,0).altitudeDeg,-90,1e-5);
});
test('Azymut jest wyznaczany od północy przez wschód',()=>{
 const ra=m.gmstDegrees(j2000);
 const east=m.position(j2000,0,0,ra+90,0);
 close(east.azimuthDeg,90,1e-6);
 const west=m.position(j2000,0,0,ra-90,0);
 close(west.azimuthDeg,270,1e-6);
});
test('Polaris znajduje się blisko wysokości równej szerokości geograficznej',()=>{
 const date=new Date('2026-11-22T19:00:00Z'),star=m.targets.polaris;
 const p=m.position(date,54.35,18.65,star.ra,star.dec);
 assert.ok(p.altitudeDeg>53&&p.altitudeDeg<56);
 assert.ok(p.azimuthDeg<3||p.azimuthDeg>357);
});
test('NGC 3324 w Carina nigdy nie wschodzi nad horyzont północnej Polski',()=>{
 const star=m.targets.carina,lat=54.35;
 assert.ok(90-Math.abs(lat-star.dec)<0);
 for(let h=0;h<24;h+=3){
  const t=new Date(Date.parse('2026-11-22T00:00:00Z')+h*3600000);
  assert.ok(m.position(t,lat,18.65,star.ra,star.dec).altitudeDeg<0);
 }
});
test('Czas gwiazdowy zmienia się o ok. 360 stopni na dobę gwiazdową',()=>{
 const a=m.gmstDegrees(j2000);
 const b=m.gmstDegrees(new Date(j2000.getTime()+86164.0905*1000));
 const diff=Math.min(Math.abs(a-b),360-Math.abs(a-b));
 assert.ok(diff<.01);
});
test('Położenie Słońca i głębokość zmierzchu są poprawne',()=>{
 const june=m.sunEquatorial(new Date('2026-06-21T12:00:00Z'));
 const dec=m.sunEquatorial(new Date('2026-12-21T12:00:00Z'));
 assert.ok(june.decDeg>23.2&&june.decDeg<23.5);
 assert.ok(dec.decDeg<-23.2&&dec.decDeg>-23.5);
 assert.equal(m.darkness(-19),'Noc astronomiczna');
 assert.equal(m.darkness(-15),'Zmierzch astronomiczny');
 assert.equal(m.darkness(12),'Słońce nad horyzontem');
});
test('Wartości pozycji i parametry nie mogą wyjść poza poprawną sferę',()=>{
 assert.equal(m.position(j2000,95,0,0,0),null);
 assert.equal(m.position(j2000,0,0,0,95),null);
 for(const v of Object.values(m.targets)){
  const p=m.position(j2000,50,20,v.ra,v.dec);
  assert.ok(p.altitudeDeg>=-90&&p.altitudeDeg<=90);
  assert.ok(p.azimuthDeg>=0&&p.azimuthDeg<360);
 }
});
test('Sześć obserwacji NASA/ESA jako obrazy śródtekstowe z podpisami',()=>{
 const h=read('etapy/18/index.html');
 assert.equal((h.match(/<figure\b/g)||[]).length,6);
 assert.equal((h.match(/<figcaption>/g)||[]).length,6);
 for(const img of ['startrailtimelapse_lrg.jpg','interstellar_cloud_in_pleiades-jpg.webp','orion-nebula-xlarge_web-jpg.webp','PIA04921.jpg','STScI-01EVT60XG208K2Q805241EMW5S.tif','weic2205a.jpg'])
  assert.ok(h.includes(img),'Missing NASA/ESA source image '+img);
 assert.ok(h.includes('NASA Earth Observatory'));
 assert.ok(h.includes('widok przez amatorską lornetkę'));
 assert.doesNotMatch(read('portal/night18-story.css'),/background-image\s*:\s*url\s*\(/);
});
test('Laboratorium i dotychczasowy silnik obserwatorium współistnieją',()=>{
 const h=read('etapy/18/index.html'),js=read('portal/night18-story.js');
 for(const id of ['no18Object','no18Place','no18Lat','no18Lon','no18Date','no18Time','no18Canvas','no18Altitude','no18Azimuth','no18Sun','no18Lst','no18Motion','no18Reset','no18Now','stageStartLab','stageFrame','stageLoading','stageViewport','stageError','stageReload','stageAbout','stageInfo','stageInfoClose','stageRelated'])
  assert.ok(h.includes('id="'+id+'"'),'Missing '+id);
 assert.match(h,/data-src="\.\.\/\.\.\/atlas\.html\?portal=observatory"/);
 assert.match(h,/data-lazy="true"/);
 assert.match(h,/data-manual="true"/);
 assert.doesNotMatch(h,/<a[^>]*href="\.\.\/\.\.\/atlas\.html/);
 assert.match(js,/getContext\('2d'\)/);
 assert.match(js,/prefers-reduced-motion/);
 assert.doesNotMatch(js,/THREE\.Scene|WebGLRenderingContext/);
});
test('Katalog gwiazd, sześć działów i strona główna są zsynchronizowane',()=>{
 const env={window:{}};vm.runInNewContext(read('portal/data.js'),env);
 const d=env.window.ATLAS_PORTAL_DATA,json=JSON.parse(read('portal/catalog.json'));
 assert.equal(d.stages['18'].mode,'observatory');
 assert.equal(d.stages['18'].category,'gwiazdy');
 assert.ok(d.categories.gwiazdy.highlights.includes(18));
 assert.equal(json.stages['18'].title,d.stages['18'].title);
 assert.ok(read('etapy/18/index.html').includes('id="no18Title"'),"Artykuł 18 musi pozostawać dostępny");
});
test('Widoczność jest geometrią, nie obietnicą pogody ani precyzyjnych efemeryd',()=>{
 const h=read('etapy/18/index.html'),css=read('portal/night18-story.css');
 assert.match(h,/strefie czasowej urządzenia/);
 assert.match(h,/nie gwarantuje dostrzeżenia obiektu/);
 assert.match(h,/nie fotometrycznie wierne planetarium/);
 assert.match(css,/@media\(max-width:720px\)/);
 assert.match(css,/overflow-y:auto!important/);
});
