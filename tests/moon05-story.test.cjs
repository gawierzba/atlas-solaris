'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('etapy/05/index.html'),css=read('portal/moon05-story.css');
const cover=read('portal/media/moon05-cover.svg'),js=read('portal/moon05-story.js');
const stage=read('portal/stage.js'),engine=read('atlas.html'),data=read('portal/data.js');
test('Chapter 05 is a complete lunar science story with correct astronomy',()=>{
 for(const phrase of ['Zawsze ta sama twarz','rotacją synchroniczną','27,32','29,53','1959','Łuna 3','Lunar Reconnaissance Orbiter','~59','384 400','3,8','barycentrum','pływ','węzły orbity','GRAWITACJA']){
  assert.ok(html.toLocaleLowerCase('pl').includes(phrase.toLocaleLowerCase('pl')),'Missing chapter concept '+phrase);
 }
 for(const id of ['wstep','synchronizacja','dwa-zegary','druga-strona','fazy','grawitacja','odkrycie','zadania','laboratorium','zrodla'])assert.ok(html.includes('id="'+id+'"'),'Missing article anchor '+id);
 assert.ok(html.indexOf('id="wstep"')<html.indexOf('id="fazy"'));
 assert.ok(html.indexOf('id="fazy"')<html.indexOf('id="laboratorium"'));
 assert.ok(html.indexOf('id="laboratorium"')<html.indexOf('id="zrodla"'));
 assert.match(html,/nie jest wiecznie pogrążona w ciemności/i);
 assert.match(html,/Właśnie dlatego mniej więcej ta sama/);
 assert.match(html,/Księżyc obraca się/);
 assert.match(html,/nie precyzyjną efemerydą/);
 for(const url of ['science.nasa.gov/moon/moon-phases/','science.nasa.gov/moon/facts/','science.nasa.gov/resource/first-photo-of-the-lunar-far-side/','science.nasa.gov/moon/viewing-tips/','science.nasa.gov/moon/tides/','nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html','science.nasa.gov/resource/lunar-far-side/','science.nasa.gov/resource/lunar-near-side/'])assert.ok(html.includes(url),'Missing NASA source '+url);
});
test('NASA photographic maps distinguish near side from far side without claiming simultaneous photography',()=>{
 assert.match(html,/lro_nearside\.jpg/);
 assert.match(html,/lro_farside\.jpg/);
 assert.match(html,/NASA\/GSFC\/Arizona State University/);
 assert.match(html,/nie fotografie wykonane jednocześnie/);
 assert.match(html,/loading="lazy"/);
 assert.equal((html.match(/class="m5-photo-pair"/g)||[]).length,1);
 assert.equal((html.match(/class="m5-moon-photo"/g)||[]).length,2);
});
test('Only static cover and lightweight geometric phases load when reader opens article',()=>{
 assert.match(cover,/viewBox="0 0 1600 900"/);
 assert.ok(Buffer.byteLength(cover,'utf8')<65000);
 assert.doesNotMatch(cover,/<script|<animate|<foreignObject|filter=/i);
 assert.match(html,/portal\/media\/moon05-cover\.svg/);
 assert.match(css,/overflow-y:auto/);
 assert.match(css,/@media\(max-width:650px\)/);
 assert.match(css,/@media\(max-width:350px\)/);
 assert.match(html,/id="m5PhaseRange" type="range"/);
 assert.match(html,/id="m5LitShape"/);
 assert.match(html,/id="m5MoonFaceMarker"/);
 assert.match(html,/data-lazy="true" data-manual="true"/);
 assert.match(html,/data-src="\.\.\/\.\.\/atlas\.html\?portal=moon"/);
 for(const id of ['stageStartLab','stageLaunch','stageReload','stageLoading','stageRelated','stageInfo'])assert.ok(html.includes('id="'+id+'"'),'Missing portal '+id);
 assert.match(stage,/const manualLab=iframe\?\.dataset\.manual==='true'/);
 assert.match(data,/"05":\{"number":5/);
 assert.match(engine,/id="space"/);
 assert.doesNotMatch(html,/<canvas|<script[^>]+three(?:\.min)?\.js/);
 assert.doesNotMatch(js.replace(/\/\*[\s\S]*?\*\//g,''),/requestAnimationFrame|setInterval|setTimeout|\.getContext\(|\.fetch\(/);
});
test('Analytic illuminated fraction and phase shape has correct precision at the four quarters',()=>{
 assert.match(js,/50\*\(1-Math\.cos\(theta\)\)/);
 assert.match(js,/monthDays=29\.53059/);
 assert.match(js,/Math\.cos\(theta\)\*halfWidth/);
 for(const [p,expected] of [[0,0],[.25,50],[.5,100],[.75,50],[1,0]]){
  const measured=50*(1-Math.cos(2*Math.PI*p));
  assert.ok(Math.abs(measured-expected)<1e-10,'Phase error '+p);
 }
 assert.match(js,/mx\+dx\*13/);
 assert.match(js,/my\+dy\*13/);
 assert.match(js,/near\.setAttribute\('cx'/);
 assert.match(js,/near\.setAttribute\('cy'/);
});
