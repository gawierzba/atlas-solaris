'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('etapy/29/index.html'),css=read('portal/star29-story.css'),
 cover=read('portal/media/star29-cover.svg'),lab=read('laboratoria/ewolucja-gwiazdy/index.html'),shell=read('portal/stage.js');
test('Stellar biography 29 contains scientifically qualified choices, sources and full laboratory',()=>{
 for(const text of ['Filary Stworzenia','Cassiopeia A','czerwonego karła','ciągiem głównym','Hertzsprunga','Czarna dziura','biały karzeł','gwiazdą neutronową'])assert.ok(html.toLowerCase().includes(text.toLowerCase()),'Missing '+text);
 for(const id of ['prolog','narodziny','zycie','rozdroze','koniec','laboratorium','zrodla'])assert.ok(html.includes('id="'+id+'"'),'Missing chapter: '+id);
 assert.ok(html.indexOf('id="prolog"')<html.indexOf('id="laboratorium"'));
 assert.ok(html.indexOf('id="koniec"')<html.indexOf('id="laboratorium"'));
 assert.ok(html.indexOf('id="laboratorium"')<html.indexOf('id="zrodla"'));
 assert.match(html,/data-lazy="true"/);
 assert.match(html,/id="stageFrame"[^>]*data-lazy="true"/);
 assert.match(html,/id="stageLaunch"/);
 assert.match(html,/id="stageRelated"/);
 assert.match(html,/id="stageInfo"/);
 assert.match(html,/id="stageReload"/);
 assert.match(html,/id="stageLoading"/);
 assert.match(lab,/id="s29StarCanvas"/);
 assert.match(lab,/id="massRange"/);
 assert.match(lab,/id="lifeRange"/);
 assert.match(lab,/id="hrCanvas"/);
 assert.match(html,/nie zdążył jeszcze/i);
 assert.match(html,/hipotetycz/i);
 assert.match(html,/metaliczność/i);
});
test('Hero is genuinely static vector artwork; photos are credited and loaded lazily',()=>{
 assert.match(cover,/<svg/);
 assert.match(cover,/viewBox="0 0 1600 900"/);
 assert.ok(Buffer.byteLength(cover,'utf8')<50000);
 assert.doesNotMatch(cover,/<script|<animate|<foreignObject|filter=/i);
 assert.match(html,/portal\/media\/star29-cover\.svg/);
 assert.match(html,/weic2216a\.jpg/);
 assert.match(html,/weic2311a\.jpg/);
 assert.match(html,/loading="lazy"/);
 assert.match(html,/NASA, ESA, CSA/);
 assert.doesNotMatch(html,/three(?:\.min)?\.js|pulsar32-cinema|WebGLRenderingContext/);
 assert.match(css,/overflow-y:auto/);
 assert.match(css,/@media\(max-width:650px\)/);
 assert.match(css,/@media\(max-width:360px\)/);
});
test('Source links and deferred laboratory integrate with existing portal shell',()=>{
 for(const url of ['https://science.nasa.gov/universe/stars/','https://esawebb.org/images/weic2216a/','https://esawebb.org/images/weic2311a/','https://science.nasa.gov/mission/hubble/'])assert.ok(html.includes(url),'Missing source '+url);
 assert.match(shell,/const lazyLab=!!\(iframe&&iframe\.dataset\.lazy==='true'\)/);
 assert.match(shell,/IntersectionObserver/);
 assert.match(shell,/else startLab\(\)/);
 assert.match(shell,/atlas:portal:ready/);
});
