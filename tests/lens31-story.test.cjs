'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('etapy/31/index.html');
const css=read('portal/lens31-story.css');
const svg=read('portal/media/lens31-cover.svg');
const lab=read('laboratoria/soczewkowanie-grawitacyjne/index.html');
const stage=read('portal/stage.js');
test('31 is a substantial article with sources and experiments, before the laboratory',()=>{
 assert.match(html,/<html lang="pl">/);
 for(const t of ['Einsteina','1919','1979','QSO 0957+561','pierścień Einsteina','ciemnej materii','l31-model-warning'])assert.ok(html.includes(t),'Missing: '+t);
 assert.match(html,/cdn\.esawebb\.org\/archives\/images\/screen\/potm2503a\.jpg/);
 assert.match(html,/id="stageFrame"[^>]*data-lazy="true"/);
 assert.match(html,/id="stageLaunch"/);
 assert.ok(html.indexOf('id="zagadka"')<html.indexOf('id="laboratorium"'));
 assert.ok(html.indexOf('id="fizyka"')<html.indexOf('id="laboratorium"'));
 assert.ok(html.indexOf('id="ciemna-materia"')<html.indexOf('id="laboratorium"'));
 assert.ok(html.indexOf('id="laboratorium"')<html.indexOf('id="zrodla"'));
 assert.match(html,/id="stageAbout"/);
 assert.match(html,/id="stageInfo"/);
 assert.match(html,/id="stageRelated"/);
 assert.match(html,/id="stageReload"/);
 assert.match(lab,/id="l31Canvas"/);
 assert.match(lab,/lens31-core\.js/);
 assert.match(stage,/IntersectionObserver/);
});
test('Cover graphic is local, static, no animation or expensive library',()=>{
 assert.match(svg,/<svg/);
 assert.match(svg,/viewBox="0 0 1600 900"/);
 assert.ok(Buffer.byteLength(svg)<40000);
 assert.doesNotMatch(svg,/<script|<animate|<foreignObject|filter=/i);
 assert.match(html,/portal\/media\/lens31-cover\.svg/);
 assert.doesNotMatch(html,/three\.js|webgl|pulsar32-cinema/);
 assert.match(css,/overflow-y:auto/);
 assert.match(css,/@media\(max-width:650px\)/);
});
test('Scientific model unchanged and real sources cited',()=>{
 for(const u of ['https://esawebb.org/images/potm2503a/','https://www.esa.int/Science_Exploration/Space_Science/Relativity_and_the_1919_eclipse','https://science.nasa.gov/missions/hubble/hubble-hubble-seeing-double/','https://www.esa.int/media/einstein-ring-explained'])assert.ok(html.includes(u),u);
});
