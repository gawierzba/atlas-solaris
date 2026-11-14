'use strict';
/* Interfejs publiczny Atlasu nie powinien zawierać przycisków do plików
   dokumentacji, archiwalnego silnika lub repozytorium technicznego.
   Cytowania naukowe i wymagane uznania autorstwa pozostają dozwolone. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
function collect(base,relative='',out=[]){
 for(const entry of fs.readdirSync(base,{withFileTypes:true})){
  const rel=path.join(relative,entry.name);
  if(entry.isDirectory()){if(entry.name==='.git'||entry.name==='node_modules')continue;collect(path.join(base,entry.name),rel,out)}
  else if(/\.html$/i.test(entry.name)&&rel!=='atlas.html')out.push(rel);
 }
 return out;
}
const pages=collect(ROOT);
assert.ok(pages.length>=50,'Audyt publicznego HTML obejmuje stronę główną, 31 etapów, rozszerzenia i sekcje');
const forbidden=/(?:^|\/)README[^\/]*\.md(?:[#?].*)?$|(?:^|\/)LICENCJE_I_ZRODLA\.md(?:[#?].*)?$|(?:^|\/)atlas\.html(?:[#?].*)?$|github\.com\/gawierzba\/atlas-solaris/i;
const failures=[];
for(const p of pages){
 const html=read(p);
 const anchors=html.matchAll(/<a\b[^>]*\bhref\s*=\s*(['"])(.*?)\1[^>]*>/gi);
 for(const m of anchors){
  const href=m[2].trim();
  if(forbidden.test(href))failures.push(p+' -> '+href);
 }
}
const js=read('portal/site.js');
assert.doesNotMatch(js,/<a[^>]*href=\\?"[^"<>]*(?:github\.com\/gawierzba|README|LICENCJE|atlas\.html)/i,'Dynamiczny footer nie może przywracać odnośników technicznych');
assert.ok(read('atlas.html').includes('HYG Astronexus'),'Naukowe źródło gwiazd i jego uznanie autorstwa muszą pozostać');
assert.ok(read('portal/stage.js').includes('atlas.html?portal='),'Stary silnik jest nadal potrzebny w ramkach');
assert.deepEqual(failures,[],'Publiczne odnośniki techniczne nadal widoczne');
console.log('ATLAS SOLARIS: audyt '+pages.length+' publicznych stron HTML OK — linki techniczne ukryte, silnik i źródła zachowane');
