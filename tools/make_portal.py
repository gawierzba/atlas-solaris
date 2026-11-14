#!/usr/bin/env python3
"""ATLAS SOLARIS 27 – generate static GitHub Pages route files, no deps."""
import json, pathlib, html
ROOT=pathlib.Path(__file__).resolve().parents[1]
STAGES=[
(1,'Od Słońca do planet','Pierwszy krok do Układu Słonecznego','Odkryj planety w działającym planetarium 3D. To współczesna odsłona pierwszych eksperymentów, nie archiwalna wersja kodu.','planety','solar'),
(2,'Orbity i upływ czasu','Układ Słoneczny w ruchu','Zmieniaj tempo symulacji, odczytuj datę i obserwuj ruch planet po orbitach.','planety','solar'),
(3,'Przestrzeń 3D','Odkryj skalę planet i odległości','Obracaj kamerę, przybliżaj i porównuj obiekty na scenie planetarium.','planety','solar'),
(4,'Ziemia z kosmosu','Nasza planeta widziana z zewnątrz','Podejdź bliżej do Ziemi i zobacz jej miejsce w systemie planetarnym.','planety','earth'),
(5,'Księżyc i Ziemia','Dwa powiązane światy','Poznaj wzajemny ruch Ziemi i Księżyca oraz współczesny model nieba.','planety','moon'),
(6,'Niebo z powierzchni','Zmień punkt obserwacji','Obserwuj niebo z Ziemi. Orientację i położenia obiektów oblicza silnik Atlasu.','planety','earthsky'),
(7,'Nauka i dokładność','Skąd biorą się obliczenia?','Poznaj źródła danych, zastosowane uproszczenia i ograniczenia modeli astronomicznych.','nauka','method'),
(8,'Światy Jowisza','Cztery księżyce Galileuszowe','Przenoś się wokół Jowisza i obserwuj Io, Europę, Ganimedesa oraz Kallisto.','planety','jupiter'),
(9,'Geometria zaćmień','Światło, cień i ustawienie ciał','Zobacz, jak Słońce, Ziemia i Księżyc tworzą zjawiska na niebie.','zjawiska','eclipse'),
(10,'Centrum Misji','Zaplanuj lot między planetami','Wybierz start, cel i parametry misji w interaktywnym laboratorium.','misje','missions'),
(11,'Laboratorium Trajektorii','Kiedy najlepiej wystartować?','Analizuj okna startowe, energię C3 oraz mapy czasu i kosztu transferów.','misje','porkchop'),
(12,'Laboratorium Grawitacji','Punkty Lagrange’a i trzy ciała','Eksperymentuj z dynamiką orbitalną i obszarami równowagi grawitacyjnej.','nauka','gravity'),
(13,'Asysty grawitacyjne','Energia ukryta w przelocie','Sprawdź, jak sonda może zmienić prędkość dzięki spotkaniu z planetą.','misje','assist'),
(14,'Archiwum Misji','Śladami Voyagera i Cassini','Zobacz historyczne trajektorie sond na podstawie próbek danych NASA/JPL.','misje','archive'),
(15,'Łowca Egzoplanet','Odkryj planetę światłem gwiazdy','Wygeneruj krzywą blasku i rozpoznaj tranzyt egzoplanety.','gwiazdy','exo'),
(16,'Asteroidy i komety','Bliskie spotkania z Ziemią','Oglądaj dane o małych ciałach Układu Słonecznego i ich orbitalne wizualizacje.','nauka','neo'),
(17,'Laboratorium Zaćmień','Od syzygii do cienia','Eksperymentuj z geometrią stożków cienia i obliczeniami zaćmień.','zjawiska','geometry'),
(18,'Żywe Obserwatorium','Planer obserwacji nocnego nieba','Sprawdzaj wysokości obiektów, godziny obserwacji i katalog Messiera.','gwiazdy','observatory'),
(19,'Podróż między gwiazdami','Ponad 7400 gwiazd w przestrzeni','Zmień miejsce obserwacji w rzeczywistym układzie współrzędnych 3D.','gwiazdy','interstellar'),
(20,'Czarna dziura','Na granicy czasoprzestrzeni','Zobacz ugięcie światła, cień horyzontu i geometrię wirującej czarnej dziury.','relatywistyka','blackhole'),
(21,'Misja przez ergosferę','Lot sondy w pobliżu horyzontu','Symuluj trajektorie w czasoprzestrzeni Kerra i odczytuj zegary.','relatywistyka','probe'),
(22,'Kamera sondy','Oczy obserwatora w relatywistyce','Zobacz niebo i dysk czarnej dziury z pokładu poruszającej się sondy.','relatywistyka','cockpit'),
(23,'Zderzenie gigantów','Narodziny fali grawitacyjnej','Połącz dwie czarne dziury i obserwuj sygnał inspiralu oraz wygaszania.','relatywistyka','merger'),
(24,'Obserwatorium LIGO','Wykryj sygnał ukryty w szumie','Przeprowadź eksperyment detekcji fali grawitacyjnej w dwóch detektorach.','relatywistyka','ligo'),
(25,'Atlas Zodiaku','Dwanaście znaków i trzynaście gwiazdozbiorów','Odkryj ekliptykę, Wężownika oraz rzeczywiste granice astronomicznych konstelacji.','gwiazdy','zodiac'),
(26,'Maszyna Czasu Nieba','Podróż przez 28 tysięcy lat','Obserwuj precesję ziemskiej osi, wędrówkę bieguna niebieskiego i równonocy.','gwiazdy','time')
]
BONUS=[
('zywe-konstelacje','Żywe Konstelacje 25.1','Podróż 3D między gwiazdami zodiaku; zmiana perspektywy i umowne figury konstelacji.','gwiazdy','living',25),
('kalendarz-zacmien','Kalendarz Zaćmień 17.1','Automatyczne wyszukiwanie zaćmień na podstawie syzygii i geometrii cienia.','zjawiska','calendar',17),
('mapa-cienia','Mapa Cienia 17.2–17.3','Widok Ziemi i położenia cienia Księżyca podczas zaćmienia.','zjawiska','eclipsemap',17),
('obserwatorium-messiera','Atlas Messiera 18.1','Sto dziesięć obiektów Messiera, figury gwiazdozbiorów i planowanie obserwacji.','gwiazdy','observatory',18),
('czasoprzestrzen-kerra','Czarna Dziura Kerra 20.1','Obrót, ergosfera i wleczenie czasoprzestrzeni w rozszerzonym laboratorium.','relatywistyka','blackhole',20),
('ziemia-z-kosmosu','Ziemia z Kosmosu','Geograficzny widok Ziemi i oświetlenia powierzchni.','planety','globe',4)
]
CATS=[
('planety','Światy i orbity','Ziemia, Księżyc, planety i ich ruch.','◌','#60baff'),
('misje','Misje kosmiczne','Trajektorie, asysty grawitacyjne, odkrywcze wyprawy.','↗','#68ddd0'),
('zjawiska','Zjawiska na niebie','Zaćmienia, światło, geometria cienia.','◉','#fbab8e'),
('gwiazdy','Gwiazdy i czas','Obserwatorium, konstelacje, ekliptyka.','✦','#b4a1ff'),
('relatywistyka','Czarne dziury','Horyzonty, fale grawitacyjne, LIGO.','◎','#d5a0f7'),
('nauka','Naukowe laboratoria','Modelowanie, pomiary, precyzja i dane.','⌁','#8bdab6')
]
modules={str(i).zfill(2):dict(number=i,title=t,lead=lead,description=d,category=cat,mode=mode,path=f'etapy/{i:02d}/',kind='stage') for i,t,lead,d,cat,mode in STAGES}
bonuses={slug:dict(slug=slug,title=t,description=d,category=cat,mode=mode,parent=parent,path=f'laboratoria/{slug}/',kind='bonus') for slug,t,d,cat,mode,parent in BONUS}
categories={k:dict(id=k,title=t,description=d,symbol=icon,color=color,path=f'dzialy/{k}/') for k,t,d,icon,color in CATS}
data={'version':'27.0','categories':categories,'stages':modules,'bonuses':bonuses}
(ROOT/'portal'/'data.js').write_text('/* Atlas Solaris 27.0 · źródło wszystkich tras */\nwindow.ATLAS_PORTAL_DATA='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
(ROOT/'portal'/'catalog.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

def esc(s):return html.escape(s,quote=True)

def stage_page(stage_id,item,isbonus=False):
    n=item.get('number'); mode=item['mode']; title=item['title'];lead=item.get('lead','');desc=item['description'];cat=categories[item['category']]['title']
    version=f'ETAP {n:02d}' if n else 'ROZSZERZENIE'
    rootrel='../../'
    return f'''<!doctype html>
<html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#050c17">
<title>{esc(title)} | ATLAS SOLARIS</title><meta name="description" content="{esc(desc)}">
<link rel="stylesheet" href="{rootrel}portal/stage.css"><script src="{rootrel}portal/data.js" defer></script><script src="{rootrel}portal/stage.js" defer></script></head>
<body data-route="{esc(stage_id)}" data-kind="{'bonus' if isbonus else 'stage'}">
<header class="stage-nav"><a class="stage-brand" href="{rootrel}" aria-label="ATLAS SOLARIS — strona główna"><span class="stage-brand-mark"><i></i></span><span>ATLAS <b>SOLARIS</b></span></a>
<div class="stage-crumb"><span>{esc(version)} / {esc(cat)}</span><strong>{esc(title)}</strong></div>
<nav class="stage-actions" aria-label="Nawigacja eksperymentu"><a class="stage-catalog" href="{rootrel}#etapy">← <span>Katalog</span></a><button type="button" id="stageAbout" aria-expanded="false" aria-controls="stageInfo">ⓘ <span>O doświadczeniu</span></button><a class="stage-home" href="{rootrel}" title="Strona główna">⌂</a></nav></header>
<main class="stage-main"><div id="stageViewport" class="stage-viewport"><div id="stageLoading" class="stage-loader" aria-live="polite"><span class="stage-loading-orbit"><i></i></span><strong>URUCHAMIAMY LABORATORIUM</strong><small>Wczytywanie silnika astronomicznego…</small></div><iframe id="stageFrame" title="{esc(title)} — interaktywne laboratorium" src="{rootrel}atlas.html?portal={esc(mode)}" allow="fullscreen; clipboard-write" referrerpolicy="strict-origin-when-cross-origin"></iframe></div>
<div id="stageError" hidden role="alert">Nie udało się uruchomić laboratorium. <button id="stageReload" type="button">Spróbuj ponownie</button> · <a href="{rootrel}atlas.html">Otwórz klasyczny Atlas</a></div></main>
<aside id="stageInfo" class="stage-info" hidden aria-label="Informacje o etapie"><div class="stage-info-head"><span>{esc(version)}</span><button type="button" id="stageInfoClose" aria-label="Zamknij informacje">✕</button></div><h1>{esc(title)}</h1>{f'<p class="stage-lead">{esc(lead)}</p>' if lead else ''}<p>{esc(desc)}</p><p class="stage-info-note">Oglądasz aktualne laboratorium w samodzielnym adresie. Wczesne etapy 01–09 to tematyczne widoki obecnego silnika, nie kopie historycznych wydań.</p><div id="stageRelated"></div><a class="stage-readme" href="{rootrel}README.md">Dokumentacja naukowa ↗</a></aside>
<noscript><p class="stage-nojs">Do działania eksperymentów potrzebny jest JavaScript. <a href="{rootrel}atlas.html">Przejdź do klasycznej wersji Atlasu.</a></p></noscript>
</body></html>'''

for id_,item in modules.items():
    p=ROOT/item['path']/'index.html';p.parent.mkdir(parents=True,exist_ok=True);p.write_text(stage_page(id_,item),encoding='utf-8')
for slug,item in bonuses.items():
    p=ROOT/item['path']/'index.html';p.parent.mkdir(parents=True,exist_ok=True);p.write_text(stage_page(slug,item,True),encoding='utf-8')
for name,cat in categories.items():
    p=ROOT/cat['path']/'index.html';p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text(f'''<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#050d18"><title>{esc(cat['title'])} — ATLAS SOLARIS</title><meta name="description" content="{esc(cat['description'])}"><link rel="stylesheet" href="../../portal/site.css"><script src="../../portal/data.js" defer></script><script src="../../portal/site.js" defer></script></head><body class="portal-page" data-view="category" data-category="{esc(name)}" data-root="../../"><div id="portalApp"></div></body></html>''',encoding='utf-8')
print(f'Generated: {len(modules)} stage pages, {len(bonuses)} extras, {len(categories)} category pages')
