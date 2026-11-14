# ATLAS SOLARIS 20.0 — Na granicy czarnej dziury

ATLAS SOLARIS to interaktywny atlas Układu Słonecznego. Wersja **20.0** dodaje laboratorium czarnej dziury: per-pixel WebGL2 śledzenie promieni Schwarzschilda, fizykę horyzontu, model dysku akrecyjnego i grawitacyjne zegary. Wersja **19.0** dodała pełnoekranową, interaktywną nawigację międzygwiezdną opartą na przestrzennych pozycjach ponad 7400 gwiazd i relatywistyce szczególnej. Wersja **18.1** rozszerzyła Obserwatorium o 110 obiektów Messiera, figury gwiazdozbiorów i wyszukiwarkę pięciu najlepszych nocy w ciągu 30 dni. Wersja **18.0** rozbudowała Obserwatorium 6.0 o naukowy planer 24 godzin, wyszukiwanie obiektów, wykres wysokości i cyfrowy okular o regulowanym polu widzenia. Zachowuje zaćmienia 17.x, misje, egzoplanety i wcześniejsze funkcje atlasu. Zachowuje mapę 17.2, kontakty C1–C4 i kalendarz 17.1. Zachowuje istniejące laboratoria astronomiczne, w tym moduł asteroid i komet z wersji 16.0.

## Nowość 20.0 — Na granicy czarnej dziury

**Uruchomienie:** na stronie głównej wybierz **◉ CZARNA DZIURA** w górnym pasku lub **◉ CZARNA DZIURA 20.0 · ZAKRZYWIENIE ŚWIATŁA** w menu. Pojawi się laboratorium z obrazem czarnej dziury, wyborem Sgr A* / M87* / przykładowej czarnej dziury o masie 10 Słońc i wykresem torów fotonów.

**Efekty i sterowanie:**
- Obraz generowany jest na żywo w WebGL2: **każdy piksel odpowiada promieniowi światła**, który biegnie od obserwatora, zakrzywia się w symetrycznej czasoprzestrzeni Schwarzschilda i albo spada pod horyzont \(r=2GM/c²\), przecina równikowy dysk akrecyjny, albo ucieka do sfery dalekiego tła.
- Przybliżona fizycznie geometria cienkiego dysku: od stabilnej orbity \(r=6GM/c²\) do umownego zewnętrznego promienia \(r=32GM/c²\). Promień może po zakrzywieniu przeciąć dysk *za* czarną dziurą — to naturalny mechanizm powstawania zniekształconego wtórnego obrazu dysku.
- Wybór odległości obserwatora \`9–90 r_g\` i nachylenia \`8–84°\`; regulacja pola widzenia \`30–90°\`, obrotu orientacji kamery palcem i przełączenie obrazu na wariant bez zakrzywienia toru światła (\(u''+u=0\)) dla porównania.
- Włączanie i wyłączanie dysku, przybliżonego wzmocnienia jasności przez ruch orbitalny i grawitację, animacja struktury dysku. Tekstury dysku i barwy są **stylizowaną emisją**, nie symulacją widma plazmy ani obrazem Event Horizon Telescope.
- Zegar sondy zawieszonej nieruchomo nad horyzontem: przy \(r>2r_g\) stosunek czasu własnego do czasu odległego obserwatora wynosi \(\sqrt{1-2r_g/r}\). Zobacz, ile z 60 minut daleko od czarnej dziury upływa na sondzie w odległości \`2.05–9 r_g\`.
- Obliczanie promienia horyzontu, sfery fotonowej, krytycznego parametru zderzenia \(b_{crit}=3\sqrt3\,r_g\), kąta obserwowanego cienia, czasu kołowej orbity na ISCO \(r=6r_g\), przybliżonego gradientu pływowego na 2-metrowej sondzie.
- Eksperyment ze śledzeniem trzech fotonów: \`b=4.7\` (pochłonięty), \`b=5.7\` i \`b=8\` (ugięte). Kliknięcie dowolnego piksela obrazu pokazuje w wykresie odpowiadającą mu trajektorię i jej wynik. Przyciskiem można animować drogę promieni.
- Dostępne trzy tryby rozdzielczości obrazu; brak WebGL2 nie powoduje awarii całego atlasu — pozostają wykres geodezyjnych i wzory fizyczne.
- Tło gwiazd z rzeczywistymi pozycjami J2000 z istniejącej wersji 19.0, wykorzystywane jako *scenograficzne odniesienie*, nie prawdziwe niebo widziane z sąsiedztwa Sgr A* czy M87*.

**Matematyka:** używamy współrzędnych w jednostkach geometrycznych \(G=c=M=1\), \(r_g=GM/c²=M\). W płaszczyźnie promienia geodezyjna zerowa (światło) spełnia
\[
 \frac{d²u}{d\varphi²}+u=3u²,\quad u=1/r.
\]
Shader WebGL2 rozwiązuje tę równość na każdym pikselu metodą Rungego–Kutty 4, klasyfikuje pochłonięcie i ucieczkę oraz oblicza przecięcie z modelem dysku. Wstępny parametr zderzenia wyznaczany jest z kąta promienia względem lokalnego statycznego obserwatora i metrycznej funkcji \(\sqrt{1-2M/r}\). Wycieniowanej stronie dysku nadajemy przybliżony mnożnik grawitacyjno-Dopplerowski z prędkości kołowej \(v/c=\sqrt{M/(r-2M)}\); emisja w RGB jest obrazową funkcją odległości i nie jest rozwiązaniem radiatywnego transferu.

**Przykładowe masy:** Sagittarius A*: \(\sim 4.0\times10^6 M_\odot\); M87*: \(\sim 6.5\times10^9 M_\odot\). W modelu Schwarzschilda, po wyrażeniu odległości w \(r_g\), kształt geometryczny jest taki sam dla obu mas; *fizyczne rozmiary i czas orbitalny różnią się proporcjonalnie do masy*. Rzeczywiste obiekty mogą mieć niezerowy spin i znacznie bardziej złożone przepływy plazmy, więc nie należy mylić tego z ich pomiarowym obrazem.

**Ograniczenia naukowe:** model nierotujący (bez Kerra i ergosfery), cienki, umowny, nieprzezroczysty dysk, brak hydrodynamiki, polaryzacji, rozpraszania, transportu widma, wielokrotnego sumowania dyskowych obrazów i dokładnego rozwiązania geodezyjnej dla nieskończenie bliskich orbit fotonowych (ograniczona liczba kroków shaderów). Zegar statycznej sondy przy \(r=2.05r_g\) zakłada nierealistyczne dla człowieka podtrzymywanie położenia tuż nad horyzontem; nie opisuje swobodnie spadającego obserwatora. Gradient pływowy ma postać newtonowskiego przybliżenia lokalnego \(\Delta a\approx 2GM L/r³\). Symulacja nie odpowiada na pytanie, co jest za horyzontem.

**Źródła:**
- NASA, *Anatomy of a Black Hole*: https://science.nasa.gov/universe/black-holes/anatomy/
- NASA, *Visual Distortions Near a Black Hole*: https://science.nasa.gov/apod/visual-distortions-near-a-black-hole-and-neutron-star/
- NASA, *What Are Black Holes?*, informacja o M87*: https://www.nasa.gov/universe/what-are-black-holes/
- EHT Collaboration, *First Sagittarius A* Results IV*, masa Sgr A*: https://doi.org/10.3847/2041-8213/ac6736
- Podstawy geodezyjnych Schwarzschilda: https://gravity.univie.ac.at/fileadmin/user_upload/i_gravity_physics/material/teaching/rt2/SS_2012/2012-04-24.pdf

**Pliki:** \`js/blackhole20-core.js\`, \`js/blackhole20-renderer.js\`, \`js/blackhole20-ui.js\`, \`css/blackhole20.css\`, \`tests/blackhole20.test.cjs\`. Test: \`node tests/blackhole20.test.cjs\`. Regresja wersji 17–19 zachowana w GitHub Actions.

---

## Nowość 19.0 — Podróż między gwiazdami 3D

**Jak uruchomić:** na stronie głównej kliknij 🚀 **LOT MIĘDZYGWIEZDNY** lub pozycję **PODRÓŻ MIĘDZY GWIAZDAMI 19.0** w menu bocznym. Z rozwijanej listy wybierz np. *Proxima Centauri* (około 4,25 roku świetlnego od Słońca), *Sirius A*, *Wega* lub *Betelgeuse*. Uruchom przyciskiem **Rozpocznij lot**.

**Funkcje:**
- Interaktywna panorama gwiazd widziana z dowolnego punktu na odcinku 3D między Słońcem a wybraną gwiazdą. Ruch przez przestrzeń jest realną zmianą położenia obserwatora, więc gwiazdy są oglądane pod nowymi kątami — nie jest to obrót płaskiej mapy.
- Przyspieszony, kilkudziesięciosekundowy pokaz całej trasy; prędkość fizyczna statku ustawiana osobno od tempa odtwarzania animacji (0,01–0,99 prędkości światła).
- Wskaźniki: przebyty i pozostały dystans w latach świetlnych, czas w układzie Słońca, czas własny na statku oraz opóźnienie jednokierunkowego sygnału radiowego wracającego do Ziemi.
- Interaktywny tryb **relatywistycznej aberracji** światła: kierunki gwiazd przeliczane ze szczególnej teorii względności dla stałej prędkości względem układu katalogu. Wyświetlany czynnik Dopplera *w kierunku ruchu*. Nie symulujemy fizycznie dokładnych widm, jasności relatywistycznej ani opóźnionych obrazów.
- 88 ziemskich figur gwiazdozbiorów odtworzonych przez punkty 3D z katalogu. Szybkie przełączniki: Orion, Wielka Niedźwiedzica, Kasjopeja, Łabędź, wszystkie lub bez linii. Pozostawiono przerwy tam, gdzie katalog nie podaje wiarygodnej odległości.
- Porównanie **Oriona widzianego ze Słońca i z aktualnego miejsca statku** w dwóch równoległych kadrach, z rzeczywiście obliczanym odstępem kątowym skrajnych gwiazd jego Pasa. Przykładowo, podróż ku Betelgezie znacznie mocniej zmienia kształt gwiazdozbioru niż podróż do Proximy Centauri.
- Sterowanie dotykiem: przeciąganie panoramy, wskazywanie gwiazdy do wyznaczenia kursu, suwak pozycji na trasie, kierowanie na cel, Oriona lub Słońce, powrót do miejsca startu.
- Przy starcie krótki **wyraźnie podpisany prolog ilustrujący opuszczenie Układu Słonecznego**. Orbity narysowano w schematycznej skali logarytmicznej AU; nie należy mylić ich z następującą później liniową skalą lat świetlnych.

**Rzetelność naukowa:** podstawą współrzędnych są rektascensja i deklinacja J2000, z odległościami z dawnych pomiarów paralaksy **Hipparcos/Yale Bright Star Catalogue** (public-domain compilation Geir Isene). Dodatkowo uwzględniono najbliższe gwiazdy z zestawienia RECONS/Gliese. Wszystkie punkty mają rzeczywiste współrzędne w latach świetlnych, nie losowo rozrzucone dekoracje. Katalog **nie jest nowym, pełnym katalogiem Gaia DR3** — to osobny etap ewentualnej przyszłej aktualizacji. Wpisy bez wiarygodnej odległości nie otrzymują sztucznej głębokości. Cztery ważne, niepewne odległości (*Betelgeuse*, *Alnilam*, *Mintaka*, *Deneb*) zostały uzupełnione jawnymi oszacowaniami z literatury, oznaczonymi w danych odpowiednim kodem, a w interfejsie napisem „odległość szacunkowa”, jeżeli obiekt jest celem podróży.

**Model fizyczny:** tor statku to odcinek prosty w heliocentrycznym układzie współrzędnych J2000. Przy stałej prędkości \`β=v/c\` i długości \`D\` lat świetlnych upływ czasu w układzie Słońca to \`D/β\` lat, czasu na pokładzie \`D/(βγ)\`, gdzie \`γ=1/sqrt(1−β²)\`. Wzór na aberrację przelicza składową kierunku gwiazdy równoległą do lotu \`cos(θ′)=(cosθ+β)/(1+βcosθ)\`, a czynnik Dopplera częstotliwości wynosi \`δ=γ(1+βcosθ)\`. Obserwator znajduje się w przestrzeni euklidesowej z ustalonymi gwiazdami. **Nie uwzględniono:** fizycznego przyspieszania i hamowania, grawitacji, ruchów własnych gwiazd na przestrzeni setek lat, opóźnienia propagacji światła widzianego z różnych epok, a także szczegółów względności ogólnej. Efekty deformacji gwiazdozbiorów wynikają z obecnych współrzędnych przestrzennych, natomiast liczby czasu własnego i wzór aberracji są poprawne dla przyjętego modelu ruchu jednostajnego.

**Źródła:**
- Geir Isene, *starmap*, pozycje i odległości ~9 tys. jasnych gwiazd z Yale Bright Star Catalogue / Hipparcos; dane gwiazd public domain: https://github.com/isene/starmap/blob/master/data/README.md
- Mike Bertin, *proxima*, zestawienie najbliższych sąsiadów Słońca według RECONS/Gliese: https://github.com/MikeBertin/proxima
- Royal Museums Greenwich, materiały o dystansach gwiazd Oriona, oraz NASA Night Sky Network — Deneb i niepewność jego odległości: https://nightsky.jpl.nasa.gov/documents/215/NightSkyNotes_Aug2020_Deneb.pdf
- Olaf Frohn, *d3-celestial* (BSD-3-Clause), tradycyjne linie figur gwiazdozbiorów, wykorzystane już w Obserwatorium 18.1: https://github.com/ofrohn/d3-celestial
- Wprowadzenie do szczególnej teorii względności: https://people.maths.bris.ac.uk/~macpd/spec_rel/notes.pdf

Pliki: \`js/interstellar19-data.js\`, \`js/interstellar19-core.js\`, \`js/interstellar19-ui.js\`, \`css/interstellar19.css\`, \`tests/interstellar19.test.cjs\`. Test: \`node tests/interstellar19.test.cjs\`. Zestaw GitHub Actions wykonuje również regresję modułów 17.0–18.1.

---

## Nowość 18.1 — Gwiazdozbiory i katalog Messiera

**Uruchomienie:** wybierz przycisk „Obserwatorium 18.1 · Messier i gwiazdozbiory”. W istniejącej mapie nieba można włączać/wyłączać figury gwiazdozbiorów, ich nazwy i punktowe znaczniki katalogu Messiera. Na liście obiektów przełącz zakładkę **Messier 110**, wyszukaj np. M31 lub „Galaktyka Andromedy”, kliknij obiekt i ustaw najlepszą godzinę w ciągu najbliższych 24 godzin. Przycisk kierowania kamery na cel działa również dla obiektów Messiera.

**Rzeczywiste dane:** 110 obiektów z pozycjami J2000 (rektascensja i deklinacja), przybliżoną jasnością wizualną oraz katalogowymi rozmiarami kątowymi, gdy są znane. Obejmuje M1–M110. 89 rekordów ilustracyjnych łączy tradycyjne figury 88 gwiazdozbiorów (jedna figura ma dwa odrębne fragmenty). Linie figur nie są oficjalnymi granicami gwiazdozbiorów określonymi przez IAU. Dla każdej klatki kierunki są przeliczane z J2000 na istniejący horyzont obserwatora.

**Najlepsze noce:** po wybraniu obiektu i miejsca na Ziemi kliknij „Znajdź pięć najlepszych nocy”. Lokalny, niezależny od Internetu algorytm przelicza kolejne 30 dób z próbkowaniem co godzinę i odrzuca chwile, gdy środek Słońca znajduje się powyżej −18° lub cel jest niżej niż 20° nad geometrycznym horyzontem. Wyżej oceniane są duże wysokości nad horyzontem i Księżyc pod horyzontem / słabiej oświetlony. Wynik to pięć najwyżej ocenionych nocy i orientacyjne chwile UTC, które można otworzyć jednym kliknięciem. Nie jest to przewidywanie zachmurzenia, seeingu, łuny miejskiej, jasności powierzchniowej galaktyk ani parametrów teleskopu. Ranking jest **heurystyczny**. Analiza 30 nocy jest przeznaczona dla Ziemi (nie Marsa i Księżyca). Pełna noc astronomiczna według USNO występuje przy geometrycznej wysokości Słońca poniżej −18°.

**Okular:** obiekty Messiera są prezentowane jako kontury ich przybliżonych rozmiarów kątowych, nie jako sztucznie wymyślone zdjęcia galaktyk i mgławic. Widoczność zależy również od jasności powierzchniowej obiektu i sprzętu; samo położenie powyżej horyzontu i niska jasność nieba nie gwarantują obserwacji.

**Źródła i prawa do danych:**
- Diego Hernangómez / Olaf Frohn, *Celestial Data* (dataset J2000, BSD-3-Clause), DOI 10.5281/zenodo.7561601 — https://github.com/dieghernan/celestial_data; dane obiektów Messiera pochodzą z katalogu H. Frommerta/SEDS, zaś figury gwiazdozbiorów z d3-celestial.
- IAU, definicja 88 gwiazdozbiorów i rozróżnienie granic/figur: https://www.iau.org/IAU/Astronomy-FAQs/Constellations.aspx
- U.S. Naval Observatory, definicje zmierzchu: https://aa.usno.navy.mil/faq/RST_defs

**Ograniczenia:** kąty katalogowe pozostają przybliżonymi współrzędnymi J2000, bez precesji, ruchów własnych, nutacji i refrakcji. Katalog zawiera wyłącznie 110 obiektów Messiera oraz istniejący wyciąg jasnych gwiazd, nie wszystkie znane obiekty głębokiego nieba. Animacja i planowanie bazują na uproszczonych efemerydach projektu i czasie UTC. Rozmiary kątowe są informacją katalogową, nie fotometrią powierzchniową.

Pliki wersji: js/observatory181-catalog.js, js/observatory181-core.js, js/observatory181-ui.js, css/observatory181.css, tests/observatory181.test.cjs. Test: node tests/observatory181.test.cjs.

---

## Nowość 18.0 — Żywe Obserwatorium

**Uruchomienie:** na stronie głównej kliknij **OBSERWATORIUM**. Obok dotychczasowej azymutalnej mapy nieba, listy gwiazd HYG i narzędzia wschodów/zachodów znajduje się teraz panel *Twoja noc pod gwiazdami*.

**Co dodaliśmy:**
- Wybrana godzina UTC z rzeczywistym modelem dla lat 1800–2050. Przyciski: Teraz, −/+ 1 dzień i przejście do momentu, gdy geometryczny środek Słońca jest najniżej w wybranym oknie.
- Miejsca: Gdańsk, Warszawa, Kraków, Londyn, Luksor i Sydney; lub dowolne współrzędne w starych polach. Dotychczasowy widok z powierzchni Ziemi, Księżyca, Marsa, Merkurego i Wenus pozostaje dostępny.
- Wykres 24-godzinny: wysokość Słońca, Księżyca i wybranego obiektu, podkład cywilnego, żeglarskiego i astronomicznego zmierzchu. Dotknij wykresu lub użyj strzałek na klawiaturze, aby przesunąć zegar całej symulacji.
- Animacja całej doby: przycisk „Odtwórz noc” / „Pauza” z czterema prędkościami (5, 15, 30 albo 60 minut symulacji na sekundę rzeczywistą). Mapa horyzontu, wykres i cyfrowy okular reagują na przesuwanie zegara. Odtwarzanie kończy się po 24 godzinach od wybranego momentu UTC.
- Planer i wyszukiwarka jasnych nazwanych gwiazd z istniejącego katalogu HYG J2000 oraz planet i Księżyca. Dla każdego obiektu przewidywany jest optymalny moment w wybranym oknie 24 h, a podana wysokość i ocena warunków uwzględniają wysokość Słońca (nie pogodę ani jasność tła od Księżyca).
- Okular cyfrowy: centra pozycji w prawdziwych współrzędnych topocentrycznych, pola widzenia 0,1°, 0,5°, 1°, 5°, 15°, 40°; przy obiektach Układu Słonecznego średnice kątowe obliczane z odległości. Gwiazdy są geometrycznymi punktami katalogu HYG, planety schematycznymi tarczami kolorystycznymi. Dwa przyciski przenoszą do najlepszej godziny i kierują istniejącą kamerę powierzchniową w dany azymut/wysokość.

**Definicje:** zmierzch cywilny (Słońce od 0° do −6°), żeglarski (−6° do −12°), astronomiczny (−12° do −18°), noc astronomiczna poniżej −18°. Współrzędne odnoszą się do geometrycznego środka Słońca, według definicji US Naval Observatory: https://aa.usno.navy.mil/faq/RST_defs.

**Ograniczenia:** to edukacyjne narzędzie planowania geometrii nieba bez pobierania aktualnej pogody, zachmurzenia, jakości atmosfery, lokalnych przeszkód terenowych, obliczeń ekstynkcji ani precyzyjnej refrakcji. Model korzysta ze starych efemeryd przybliżonych (JPL 1800–2050), uproszczonej teorii Księżyca i katalogu jasnych gwiazd HYG J2000, bez precesji i ruchu własnego. Sam okular nie jest astrofotografią ani realistycznym symulatorem optyki: nie zawiera szczegółów powierzchni, a schemat pierścieni Saturna ma charakter symboliczny. Dla innych ciał niebieskich wykres nadal obejmuje 24 **ziemskie** godziny UTC; nie stanowi pełnego lokalnego dnia marsjańskiego czy księżycowego.

**Bezpieczeństwo:** nie obserwuj Słońca przez teleskop ani lornetkę bez odpowiedniego certyfikowanego filtra słonecznego; obiekt Słońce jest celowo wyłączony z listy celów okularu.

Pliki: js/observatory18-core.js, js/observatory18-ui.js, css/observatory18.css, tests/observatory18.test.cjs. Test automatyczny: node tests/observatory18.test.cjs. Regresja wersji 17.0–17.3 zachowana.

---

## Nowość 17.3 — animacja przelotu pasa centralnego

**Jak uruchomić:** na stronie głównej wybierz „Mapa zaćmień 17.3 · wędrówka cienia” albo „Ziemia z kosmosu”. Wybierz zaćmienie Słońca z centralnym pasem (np. 2 sierpnia 2027). W panelu **Wędrówka cienia** kliknij „Odtwórz cały przelot”.

**Co pokazuje animacja:**
- Obrotowy glob Ziemi z aktualnym zaciemnieniem powierzchni obliczonym z geometrycznego nakładania tarcz Słońca i Księżyca dla każdej klatki.
- Podświetloną turkusowo trasę już przebytą przez punkt przecięcia osi cienia z Ziemią; trasę pozostałą do przebycia pokazuje linia przerywana. Dostępne są przełączniki obu warstw.
- Pulsujący znacznik aktualnego punktu osi cienia z kierunkiem ruchu. Położenie pochodzi z bieżącej efemerydy, a nie z ręcznie przygotowanej animacji.
- Szacunkową prędkość punktu osi po powierzchni Ziemi (km/h), długość przebytej i całkowitej trasy, procent drogi, szerokość i długość geograficzną.
- Suwak obejmujący cały przebieg centralny, od pierwszego do ostatniego wyznaczonego punktu, niezależnie od dotychczasowej osi ±4 h względem maksimum; przyciski odtwarzania od początku oraz pauzy i wznowienia.

**Metoda:** do wizualizacji wykorzystano przygotowany w 17.2 tor z funkcji centralTrack() wyznaczany z interpolowanych efemeryd i obrotu Ziemi. Prędkość wynika z długości łuków ortodromy między próbkami (promień Ziemi 6371 km) i ich odstępu czasowego. Pozycja bieżącego znacznika jest dodatkowo wyliczana z aktualnej geometrii. Przy przecięciu południka 180° kierunek i odległość liczone są jako geodezyjne na kuli; przerwy w torze nie są łączone wymyśloną linią. Przed odtworzeniem wykonywana jest analiza centralnej ścieżki. Podczas animacji aktualizowane są również wcześniejsze strefy zakrycia, pas i mapa zbliżenia.

**Ograniczenia:** przedstawiamy średnią prędkość punktu osi cienia na powierzchni Ziemi między sąsiednimi próbkami, nie prędkość przestrzenną Księżyca ani dokładne wartości z elementów Bessela. Przy brzegach tarczy Ziemi prędkość osi na powierzchni może szybko rosnąć; obliczone wartości trzeba traktować orientacyjnie. Kształt i przebieg pasa są modelowe, bez topografii i nierówności księżycowego brzegu. Dla zaćmień częściowych bez pasa centralnego animacja trasy nie jest dostępna, ale nadal działa glob z zaciemnieniem częściowym.

Pliki: js/eclipse17-motion.js, js/eclipse17-motion-ui.js, css/eclipse17-motion.css, tests/eclipse17-motion.test.cjs. Test: node tests/eclipse17-motion.test.cjs.

---

## Nowość 17.2 — mapa geograficzna zaćmienia na Ziemi

**Jak uruchomić:** na stronie głównej wybierz ZIEMIA Z KOSMOSU, a następnie zaćmienie Słońca (np. 2 sierpnia 2027). Panel STREFY ZAĆMIENIA pozwala włączać granicę częściowego zakrycia (>0,1%), izolinię 50% powierzchni Słońca, centralną granicę fazy całkowitej lub obrączkowej oraz granice pasa centralnego wzdłuż jego przebiegu.

**Model obliczeniowy:** nowy moduł js/eclipse17-map-engine.js wylicza położenia Słońca i Księżyca w obracającym się ziemskim układzie geograficznym na podstawie istniejących efemeryd. Dla punktów powierzchni Ziemi liczy rzeczywisty rozmiar kątowy tarcz i ich odległość kątową, uwzględniając paralaksę. Oznacza częściowe, całkowite i obrączkowe zakrycie tylko przy Słońcu nad geometrycznym horyzontem. Izolinie częściowego zakrycia wyznacza metodą marching squares na siatce 3°, a bardzo wąski pas centralny rozwiązuje przez przeszukiwanie promieni wychodzących z punktu przecięcia osi cienia z kulą Ziemi. Tor osi i jego boczne krawędzie powstają przez próbkowanie ruchu cienia. Zakres pasa przy wejściu lub wyjściu cienia na brzeg Ziemi jest uproszczony.

**Mapa zbliżenia:** pod przełącznikami globu jest druga mapa — zbliżenie do osi cienia lub wybranego obserwatora (skala 4°, 12°, 30° lub 60°). Kliknięcie mapy ustawia położenie obserwatora na Ziemi. Zakrycie i wysokość Słońca przeliczane są na bieżąco. Dotychczasowe: obrót Ziemi, animacja czasu, mapa Blue Marble i obserwacja teleskopowa pozostają dostępne.

**Kontakty lokalne:** przycisk Oblicz lokalne kontakty C1–C4 sprawdza punkt w zakresie ±5 godzin od maksimum zdarzenia, wykrywa geometryczne początki i końce zakrycia tarczy oraz granice fazy centralnej. Pokazuje przybliżone UTC i wysokość Słońca, w tym ostrzeżenie, jeśli jest pod horyzontem. C1/C4 = pierwsze i ostatnie dotknięcie brzegów tarcz, C2/C3 = początek i koniec fazy centralnej.

**Ograniczenia naukowe:** nie jest to oficjalna mapa ani precyzyjny pas NASA. Zastosowano kulistą Ziemię o promieniu 6371 km, stałe promienie Słońca i Księżyca, interpolowane efemerydy dostępne dla lat 2024–2040 oraz uproszczoną orientację Ziemi. Brak topografii, nierówności brzegu Księżyca, refrakcji, elementów Bessela, szczegółowej atmosfery i czasu drogi światła. Siatka izoliniowa 3° nie wyznacza dokładnych granic częściowego zakrycia; kontakty lokalne są orientacyjne. Nie używać do planowania bezpiecznych obserwacji.

Pliki: js/eclipse17-map-engine.js, js/eclipse17-map-ui.js, css/eclipse17-map.css, tests/eclipse17-map.test.cjs. Test: node tests/eclipse17-map.test.cjs.

---

## Nowość 17.1 — automatyczne wyszukiwanie zaćmień

**Jak uruchomić:** w bocznej nawigacji wybierz **Kalendarz zaćmień · znajdź daty 2024–2040**. Kalendarz jest dostępny również z paneli *Geometria 3D* i *Laboratorium zaćmień*.

Wpisz rok (2024–2040), opcjonalnie miesiąc i filtr: wszystkie / tylko Słońca / tylko Księżyca. Kalendarz oblicza nowie i pełnie, weryfikuje szerokość ekliptyczną Księżyca, a następnie wyszukuje przecięcia stożków cienia w oknie każdego możliwego zjawiska. Wyniki zawierają **przybliżoną datę maksimum w UTC i czasie polskim**, typ zjawiska, odległość Ziemia–Księżyc i informację o węźle. Z każdej karty można przejść do widoku **Geometria 3D**, **Ziemia z kosmosu** lub **Widok tarcz** — system automatycznie ustawia datę oraz rejestruje zdarzenie w dotychczasowych selektorach.

Dzięki wyszukiwaniu w okolicy syzygii analiza całego roku wymaga jedynie niewielkiej części obliczeń potrzebnych do skanowania każdej minuty w roku. Wyszukiwanie zwalnia klatkę interfejsu po każdym miesiącu, aktualizuje pasek postępu i można je anulować przez zamknięcie okna. Całość działa w przeglądarce bez API i bez dodatkowych bibliotek.

**Uwaga naukowa:** lista przedstawia wyniki automatycznego **modelu geometrycznego**, a nie oficjalne prognozy NASA. NASA rozróżnia również kontakty lokalne, elementy Bessela i efekty atmosferyczne. Dla płytkich zaćmień półcieniowych zaimplementowano przybliżenie powiększenia ziemskiego cienia o 2%: bez niego model pomijał m.in. bardzo płytkie zaćmienie z **18 lipca 2027**. Porównanie z oficjalnymi katalogami NASA wskazuje pięć zaćmień w 2027 i pięć w 2028, ale nie gwarantuje dokładności wszystkich dat i czasów maksimum. Model pozostał odrębny od katalogu NASA — przybywa wyników z obliczeń, nie z pobranej tabeli.

Pliki: `js/eclipse17-calendar-search.js`, `js/eclipse17-calendar-ui.js`, `css/eclipse17-calendar.css`, `tests/eclipse17-calendar.test.cjs`. Test: `node tests/eclipse17-calendar.test.cjs`.

---
  
## Nowość 17.0 — naukowy silnik zaćmień połączony z geometrią 3D

**Wejście:** przycisk **ZAĆMIENIA 17** w górnym pasku albo **Laboratorium Zaćmień 17.0 · silnik naukowy** w panelu bocznym. Dotychczasowe przyciski GEOMETRIA 3D, ZAĆMIENIA i ZIEMIA Z KOSMOSU nadal działają. Nowe przyciski otwierają istniejącą obrotową scenę stożków z dodatkowym panelem obliczeniowym.

**W trakcie animacji:** pozycje Słońca, Ziemi i Księżyca są liczone z istniejących efemeryd atlasu. Nowy silnik analizuje matematyczne przecięcia **półcienia**, **cienia głównego (umbry)** i **antumbry** z kulą Ziemi lub Księżyca. Panel pokazuje typ zjawiska (brak / Słońca / Księżyca wraz z podtypem), syzygię, szerokość ekliptyczną Księżyca, najbliższe przejście przez węzeł orbitalny, odległości oraz rodzaj przecięcia cienia.

Wielkości klasyfikacyjne są liczone niezależnie od powiększenia wizualizacji. Scena 3D ma istniejącą opcję ścisłej skali 1:1 lub czytelnej skali poglądowej ze skróconymi odległościami. Bez dodatkowych bibliotek JavaScript i bez zewnętrznego API w przeglądarce.

Pliki wersji: js/eclipse-engine.js, js/eclipse17-ui.js, css/eclipse17.css, tests/eclipse17.test.cjs. Test syntetycznych scenariuszy: node tests/eclipse17.test.cjs.

**Ograniczenia:** w latach 2024–2040 atlas wykorzystuje dostarczone wcześniej próbkowane efemerydy i ich interpolację; poza tym zakresem prognozy są orientacyjne (uproszczony model Księżyca). Nowy silnik używa konwencjonalnego przybliżenia powiększenia ziemskiego cienia o 2% przy zaćmieniach Księżyca (rzeczywisty promień Ziemi pozostaje równy 6371 km), ale nie uwzględnia precyzyjnej refrakcji i szczegółowych własności atmosfery, nieregularnego brzegu Księżyca, topografii, refrakcji, dokładnych elementów Bessela, lokalnego horyzontu i czasu drogi światła. Wcześniejsze demonstracyjne widoki 3D i globu zachowują swoje odrębne uproszczenia opisane w dokumentacji. Nie wyznaczać na tej podstawie bezpiecznych czasów obserwacji ani precyzyjnego pasa całkowitości.

Dla dokładnych danych zaćmień: [NASA GSFC — katalog zaćmień Słońca](https://eclipse.gsfc.nasa.gov/SEcat5/SEcatalog.html) i [NASA GSFC — katalog zaćmień Księżyca](https://eclipse.gsfc.nasa.gov/LEcat5/LEcatalog.html).

---

## Otwórz stronę

**https://gawierzba.github.io/atlas-solaris/**

GitHub Pages: Settings → Pages → Deploy from a branch → `main` → `/(root)`.

## Nowość: Asteroidy, komety i bliskie spotkania — 16.0

### Funkcje

- **Katalog zbliżeń z Ziemią** — tabela nominalnych przejść wyliczonych przez NASA/JPL SBDB Close Approach Data (CAD). Filtr według nazwy, kategorii i maksymalnej odległości w LD (średnia odległość Ziemia–Księżyc = 384 400 km).
- **Oficjalne parametry JPL:** nominalna odległość od środka Ziemi, granice odległości 3σ, względna prędkość obiektu, prędkość nadmiarowa, niepewność czasu przelotu, wielkość H i zmierzona średnica (jeśli istnieje).
- **Orbity 3D** z oskulacyjnych elementów `a,e,i,Ω,ω,M` w heliocentrycznej ekliptyce J2000; animacja Keplera z dwuciałowym przybliżeniem słonecznym. Wstępnie udokumentowane przykłady to 99942 Apophis i 101955 Bennu (ESA Aegis, 30 lipca 2026) oraz kometa 67P/Churyumov–Gerasimenko (MPC, 5 listopada 2026).
- **Oś czasu bliskiego przejścia**, regulowane tempo i moment ±72 h od oficjalnego czasu najbliższego zbliżenia. Dodatkowy wykres odległości jest jawnie oznaczonym **modelem dydaktycznym** `r(t) = sqrt(d₀² + [v_rel·t]²)` dla stałej prędkości, nie autentyczną efemerydą ani prognozą ryzyka.
- Powiększanie i obracanie 3D gestami na telefonie; pobieranie danych zbliżeń CSV.
- **Rozdzielenie znaczeń:** `3σ` to przybliżony przedział niepewności obliczonej odległości; nie jest prawdopodobieństwem uderzenia. `MOID` to najmniejsza geometryczna odległość między orbitami, nie minimalna odległość w konkretnej dacie. Z oceną rzeczywistego ryzyka należy zapoznać się w [JPL Sentry](https://cneos.jpl.nasa.gov/sentry/).

### Dlaczego strona nie odpytuje NASA bezpośrednio?

**NASA/JPL SSD API zabrania osadzania zapytań do API bezpośrednio w witrynach internetowych (polityka CORS/fair use).** Stąd projekt przechowuje migawki w plikach `data/neo-close-approaches.json` oraz `data/neo-orbits.json`. Kod w przeglądarce **nie wykonuje zapytań do ssd-api.jpl.nasa.gov**.

Skrypt `scripts/update_neo_data.py` pobiera je **po stronie serwera** przez GitHub Actions, weryfikuje wersję interfejsu, zakres i spójność pól, zapisuje źródło oraz dokładną datę aktualizacji. Workflow `.github/workflows/update-neo.yml` przewiduje **codzienny** pobór bliskich przejść na następne 366 dni, w promieniu nominalnym do 0,05 AU (do 100 rekordów). W niedzielę albo przy ręcznym uruchomieniu dodatkowo zapisuje wybrane aktualne oskulacyjne orbity, m.in. komet 67P i 1P, o ile API zwróci poprawne eliptyczne elementy. Zapytania są wykonywane pojedynczo i z odstępami.

**Ważne: harmonogram automatycznej aktualizacji działa wyłącznie przy włączonych GitHub Actions, odpowiednich uprawnieniach do zapisu i pomyślnym uruchomieniu workflow.** Sam fakt dodania pliku do repozytorium nie potwierdza, że automatyzacja już wykonała pobór danych. Sprawdzaj workflow w zakładce **Actions**. Jeśli GitHub Actions są wyłączone lub wystąpi błąd, aplikacja wyświetla datę ostatniej zapisanej kopii, a nie udaje bieżących pomiarów.

Bot aktualizuje pliki w gałęzi `main`. Ponieważ commity wykonane standardowym `GITHUB_TOKEN` **nie uruchamiają automatycznie przebudowy GitHub Pages w trybie „Deploy from a branch”**, strona próbuje pobierać **gotowy statyczny JSON z publicznej gałęzi `main` na `raw.githubusercontent.com`**, a w razie niepowodzenia używa pliku opublikowanego na Pages. To nie jest połączenie z NASA API, lecz tylko pobranie publicznego pliku własnego repozytorium.

### Dane startowe i pochodzenie

Na początku dostępna jest **oznaczona demonstracja dokumentacyjna**, a nie lista z dnia wydania programu: trzy przykładowe rekordy JPL CAD 1.5 dotyczące 153814 (2001 WN5), 99942 Apophis oraz (2001 AV43) z 2028–2029. Są to dokładnie liczby z oficjalnej [dokumentacji JPL CAD API](https://ssd-api.jpl.nasa.gov/doc/cad.html), wraz z `dist_min`, `dist_max` i `v_rel`. Po pomyślnym pobraniu przez workflow główna lista wyświetla aktualny zestaw z datą jego zapisania. **Przykład Apophisa z 13 kwietnia 2029 pozostaje dodatkowo dostępny przez osobny przycisk**, zawsze oznaczony jako dane dokumentacyjne JPL z 2023 r. (a nie najnowsza prognoza).

Orbits seed: [ESA Aegis — Apophis (epoka 2026-06-09)](https://neo.ssa.esa.int/search-for-asteroids?des=99942+Apophis&tab=orbprop), [ESA Aegis — Bennu](https://neo.ssa.esa.int/search-for-asteroids?des=101955+Bennu&tab=summary), [MPC/MPEC — 67P (epoka 2026-11-05)](https://cobs.si/comet/68/). Dla 67P anomalia średnia przy epoce została przeliczona z czasu peryhelium według modelu Keplera.

### Najważniejsze ograniczenia naukowe

- **Dokładność zbliżenia** bierze się wyłącznie z `dist`, `dist_min`, `dist_max` oficjalnej migawki JPL. Nie wyznaczamy jej na podstawie dwuciałowego wykresu orbit. To istotne np. dla **Apophisa w 2029**, gdy ziemska grawitacja wyraźnie zmienia orbitę planetoidy. Sama wizualizacja heliocentrycznej elipsy może w takich przypadkach odchylać się bardzo znacznie od prawdziwej trajektorii.
- JPL nie rekomenduje używania dwuciałowego Orbit Viewer do precyzyjnych prognoz przy bliskich przejściach; poprawne wyznaczanie położeń i ocena ryzyka wymagają zaburzanego modelu N-ciał lub Horizons i Sentry.
- Granice `dist_min` i `dist_max` to **formalny przedział odległości 3σ**, a nie geometryczna osłona wokół osi czasu. Nie są równoznaczne z szansą kolizji; szansa uderzenia może wymagać badania nieliniowego w systemie Sentry.
- Średnica pozostaje nieznana, jeśli JPL jej nie podało; **nie wyprowadzamy domniemanej średnicy z samego H** bez przyjęcia albedo.
- Orbity komet mogą dodatkowo zmieniać się wskutek aktywności i sił niegrawitacyjnych. Moduł dwuciałowy świadomie tego nie oblicza.
- Czas `jd` jest w **TDB**, prezentowany w datowaniu cywilnym jako przybliżenie UTC — różnica rzędu około minuty. Dla dokładnych wydarzeń używaj kart JPL.

### Źródła oficjalne

- [NASA/JPL — SBDB Close Approach Data API](https://ssd-api.jpl.nasa.gov/doc/cad.html)
- [NASA/JPL — Small Body Database API](https://ssd-api.jpl.nasa.gov/doc/sbdb.html)
- [JPL — Orbit Viewer, ograniczenia dwuciałowego modelu](https://ssd.jpl.nasa.gov/ov/index.html)
- [NASA/JPL — Sentry, monitorowanie zagrożeń](https://cneos.jpl.nasa.gov/sentry/intro.html)
- [NASA/JPL — SSD API fair use / CORS](https://ssd-api.jpl.nasa.gov/)
- [GitHub — GitHub Pages build i GITHUB_TOKEN](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## Zachowane moduły poprzednich wersji
## Nowość: Łowca Egzoplanet 15.0

### Eksperyment

- Wybierz jedną z pięciu znanych egzoplanet: HD 209458 b, TRAPPIST-1 e, GJ 1214 b, WASP-12 b lub Kepler-22 b.
- Obserwuj gwiazdę i planetę od strony odległego teleskopu. Obracający się schemat orbity jest poglądowy; tarcze w widoku fotometrycznym są względnie skalowane, z minimalnym rozmiarem piksela dla bardzo małych planet.
- Zmieniaj promień planety (R⊕), promień i masę gwiazdy (jednostki słoneczne), okres orbitalny, nachylenie orbity i dwa współczynniki ciemnienia brzegowego.
- Odczytuj spadek jasności w ppm, czas tranzytu między pierwszym i czwartym kontaktem, parametr b oraz wielkość a/R★. Jeśli inklinacja jest niewłaściwa, tranzyt znika całkowicie.
- Obserwuj wykres względnego strumienia z **SYNTETYCZNYMI** punktami pomiarowymi; można regulować szum w ppm, ponawiać jego losowanie, przewijać czas i pobrać próbki CSV.
- Włącz **Tryb odkrywcy**: promień planety i nachylenie zostają ukryte. Zgadywane wartości generują własną krzywą modelową, którą można porównać z zaszumionymi obserwacjami za pomocą błędu RMS. Na koniec można odsłonić odpowiedź.

### Co dokładnie liczy symulator?

Planeta porusza się po idealnej orbicie kołowej. Jej pozycja jest rzutowana na tarczę gwiazdy z uwzględnieniem inklinacji. Następnie numerycznie całkowany jest strumień zakrytej części tarczy; algorytm rozdziela przedziały w punktach styczności geometrycznej. Używamy **kwadratowego ciemnienia brzegowego** (quadratic limb darkening):

`I(μ) = 1 − u₁(1−μ) − u₂(1−μ)²`, gdzie `μ = √(1−r²)`.

`k = R_planety/R_gwiazdy`, `b = (a/R★)·|cos(i)|`; tranzyt występuje dla `b < 1+k`. Całkowity znormalizowany strumień niezasłoniętej gwiazdy to `1−u₁/3−u₂/6`. Gdy `u₁=u₂=0` i przejście jest centralne oraz całkowite, głębokość wynosi `k²`. W pozostałych przypadkach zależy również od jasności w miejscu przejścia.

### Pochodzenie danych i ograniczenia

Dla rzeczywistych przykładów stosujemy **offline zestaw przybliżonych parametrów** pochodzących z opisów NASA Science i NASA Exoplanet Archive. Część wartości pochodzi z różnych publikacji, a niektóre inklinacje i promienie gwiazd oznaczono jako orientacyjne. Żadne parametry nie są pobierane na żywo. Wykresy są wyliczane przez program, zaś szum dodawany sztucznie — **nie przedstawiamy ich jako faktycznych szeregów fotometrycznych TESS lub Keplera**.

Model pomija ekscentryczność orbit, zmienność gwiazd, plamy, wpływ innych planet, atmosferę planety, zanieczyszczenia fotometryczne i czas integracji ekspozycji. Rozwiązanie zadania odwrotnego może być niejednoznaczne, ponieważ wiele par promienia i nachylenia daje podobne krzywe, zwłaszcza w obecności szumu.

**Źródła wybranych układów:**

- [NASA Exoplanet Archive — HD 209458](https://exoplanetarchive.ipac.caltech.edu/overview/HD_209458)
- [NASA Exoplanet Archive — TRAPPIST-1](https://exoplanetarchive.ipac.caltech.edu/overview/TRAPPIST-1)
- [NASA Science — GJ 1214 b i gwiazda](https://science.nasa.gov/asset/webb/exoplanet-gj-1214-b-and-its-star-illustration/)
- [NASA Science — WASP-12 b](https://science.nasa.gov/exoplanet-catalog/wasp-12-b/)
- [NASA Science — Kepler-22 b](https://science.nasa.gov/exoplanet-catalog/kepler-22b/)
- [NASA Exoplanet Archive — kolumny tabel PS](https://exoplanetarchive.ipac.caltech.edu/docs/API_PS_columns.html)
- [NASA Exoplanet Archive — API TAP](https://exoplanetarchive.ipac.caltech.edu/docs/TAP/usingTAP.html)

### Kontrola obliczeń 15.0

- Numeryczne całkowanie centralnego tranzytu na jednorodnej tarczy dało, dla testowanych przypadków, zgodność ze wzorem `k²` z błędem poniżej `10⁻⁸`.
- Dla inklinacji eliminującej tranzyt uzyskano jasność `F=1` i czas tranzytu równy zero.
- Pięć skonfigurowanych planet daje oczekiwany tranzyt; parametry dopasowania w trybie odkrywcy obniżają RMS do poziomu wygenerowanego szumu.

## Zachowane moduły wcześniejszych wersji
## Nowość: Archiwum Misji Kosmicznych 14.0

### Zakres i funkcje

- **Voyager 1:** 861 próbek heliocentrycznych, od 5 września 1977 do 16 sierpnia 2026.
- **Voyager 2:** 1012 próbek heliocentrycznych, od 20 sierpnia 1977 do 16 sierpnia 2026.
- **Cassini:** 975 próbek heliocentrycznych, od 15 października 1997 do 15 września 2017.
- Interaktywny obracany widok przestrzenny trajektorii (rzut 3D), możliwość przybliżania i centrowania na Słońcu, sondzie lub planecie historycznego wydarzenia.
- Przewijanie osi czasu, automatyczna animacja, różne prędkości odtwarzania, skoki do wybranych wydarzeń i krok do poprzedniego/następnego.
- Daty historycznych przelotów: Voyager 1 (Jowisz, Saturn, Pale Blue Dot, heliopauza), Voyager 2 (Jowisz, Saturn, Uran, Neptun, heliopauza), Cassini (Wenus × 2, Ziemia, Jowisz, przybycie do Saturna, Huygens, Wielki Finał).
- Możliwość nałożenia śladów pozostałych dwóch sond i podglądu położeń planet z istniejącego silnika Atlasu.
- Odczyty heliocentrycznej odległości w AU i km, znormalizowanej współrzędnej Z, odległości przebytej na łamanej próbkowanej trajektorii, średniej prędkości **na odcinku między dwiema próbkami** oraz orientacyjnego czasu lotu światła od Słońca.
- Eksport CSV zawierający **rzeczywiste zapisane próbki** (a nie interpolowane punkty animacji) z Julian Date i współrzędnymi J2000.
- Moduł działa offline i na GitHub Pages. Nie wywołuje Horizons podczas działania aplikacji.

### Źródło danych, jego pochodzenie i przekształcenia

**Oryginalne pochodzenie:** NASA/JPL Horizons, `EPHEM_TYPE=VECTORS`, `CENTER=500@10` (środek Słońca), `REF_PLANE=ECLIPTIC`, `OUT_UNITS=AU-D`, `CSV_FORMAT=YES`, `VEC_TABLE=1`, `COMMAND=-31` (Voyager 1), `-32` (Voyager 2), `-82` (Cassini). Układ odniesienia: heliocentryczna ekliptyka i równonoc J2000. Czas zapisany jako **JD TDB**.

**Weryfikowalna kopia:** próbki zostały pozyskane ze zbioru `data/probes.json` w publicznym repozytorium [giancarloerra/Astro.Observer-Orrery](https://github.com/giancarloerra/Astro.Observer-Orrery/blob/main/data/probes.json). Autor dokumentuje dokładne zapytania, próbkowanie i ograniczenia w [DATA-SOURCES.md](https://github.com/giancarloerra/Astro.Observer-Orrery/blob/main/DATA-SOURCES.md). SHA pliku źródłowego w chwili importu: `c5ba457593e249dfeeb6cae3235e0f09f021b7a4`.

**Dostosowanie na potrzeby ATLAS SOLARIS:** współrzędne zaokrąglono do 10 miejsc po przecinku w AU, a JD do 7 miejsc po przecinku. Z obu Voyagerów wyłączono próbki **późniejsze niż 16 sierpnia 2026**, by prognozowanych przyszłych trajektorii Horizons nie przedstawiać jako historii. Cassini pozostawiono do chwili zakończenia misji 15 września 2017. Zestaw znajduje się w `js/mission-tracks.js` i jest ładowany statycznie.

### Ważne ograniczenia — przeczytaj

- **Wszystkie pozycje zapisanych próbek pochodzą z danych Horizons**, lecz animowana pozycja pomiędzy nimi jest **interpolacją liniową**. Nie jest ponownie wyznaczoną efemerydą NASA.
- Rozdzielczość próbkowania: Voyager 1 co 4 dni w pierwszych latach, potem co 30; Voyager 2 co 8 dni w okresie przelotów międzyplanetarnych, potem co 30; Cassini co 5 dni przed przybyciem do Saturna i **co 10 dni w trakcie orbity saturnowej**. To za mało, by odtworzyć pojedyncze bliskie przejścia, kilkudniowe obiegi, manewry napędu i orbitę lądownika Huygens. Linie łączące próbki Cassini po 2004 r. są tylko wizualizacją rzadkich próbek.
- **Położenia planet** pochodziły z już istniejącego uproszczonego silnika orbitalnego Atlasu (JPL approx. positions), a nie z tego samego zestawu Horizons dla sond. Nie należy na podstawie sceny obliczać dokładnych odległości minimalnych pomiędzy sondą a planetą.
- Odczyt prędkości = moduł różnicy kolejnych pozycji, podzielony przez upływ czasu. Jest **średnią prędkością odcinkową** i może różnić się od prędkości chwilowej szczególnie podczas zbliżeń.
- Długość narysowanego śladu jest sumą odległości między próbkami i stanowi **dolne oszacowanie** drogi po rzeczywistej krzywej. Nie jest dokładnym dystansem pokonanym podczas misji.
- Zapisana data to JD **TDB**, a daty wyświetlane przybliżono cywilnym kalendarzem UTC, bez korekty TDB–UTC (rzędu 1 minuty). Historyczne przyciski wskazują datę wydarzenia, nie dokładny moment perycentrum.
- Okręgi orbit i rozmiary planet służą orientacji wizualnej; nie są dokładną wizualizacją rozmiarów ciał w jednej skali.
- Najnowszy archiwalny punkt Voyagerów pochodzi z 16.08.2026; **nie udajemy pomiaru w czasie rzeczywistym**. Aktualne położenie można sprawdzić w bieżących serwisach NASA.

### Materiały NASA

- [JPL Horizons — oficjalne efemerydy](https://ssd.jpl.nasa.gov/horizons/)
- [Voyager 1 — NASA](https://science.nasa.gov/mission/voyager/voyager-1/)
- [Voyager 2 — NASA](https://science.nasa.gov/mission/voyager/voyager-2/)
- [NASA NSSDC — dokładne daty i czasy przelotów Voyagerów](https://nssdc.gsfc.nasa.gov/planetary/voyager-periapse.html)
- [Cassini — NASA](https://science.nasa.gov/mission/cassini/)
- [Cassini — chronologia ESA](https://www.esa.int/Science_Exploration/Space_Science/Cassini-Huygens_overview)

## Zachowane laboratoria wcześniejszych wersji

## Nowość: Asysty Grawitacyjne 13.0

Laboratorium przedstawia przelot sondy obok planety w modelu **patched conics / niewymuszonej hiperboli Keplera**. Obliczenia są dynamiczne, oparte na prędkości planety z istniejącego silnika JPL Atlasu i na stałych grawitacyjnych opublikowanych przez JPL. Nie jest to nagranie ani ręcznie narysowany, niezależny od parametrów tor.

- **8 planet** (Merkury–Neptun) z ich parametrami GM oraz promieniami.
- Wybór daty, prędkości nadmiarowej sondy względem planety `v∞`, wysokości perycentrum `h`, kierunku nadlotu względem ruchu planety oraz strony skrętu.
- Tor hiperboliczny z rzeczywistą geometrią Keplera: dynamiczna mimośrodowość, kąt skrętu, parametr zderzenia `b`, promień i prędkość w perycentrum.
- Animacja z parametryzacją **czasową** przez anomalię hiperboliczną i równanie Keplera; sterowanie czasem, prędkością animacji i kamerą.
- Oddzielne wykresy pozycji sondy wokół planety oraz **dodawania wektorów prędkości** w układzie heliocentrycznym.
- Porównanie `v∞` przed i po (moduły równe), zmianę prędkości sondy względem Słońca oraz zmianę jej heliocentrycznej energii właściwej.
- Scenariusze „↑ Maks. zysk energii” i „↓ Maks. hamowanie”, wyznaczające skrajne kąty nadlotu dla danych `GM`, `h` i `v∞` przy uproszczeniach dwuwymiarowych.
- Zapis i przywrócenie parametrów porównawczych A.
- Działa lokalnie w przeglądarce, bez serwera aplikacji i dodatkowych bibliotek, z wersją mobilną.

### Równania

```text
rₚ = promień planety + wysokość przelotu
e = 1 + rₚ · v∞² / GM
δ = 2 · asin(1/e)
|v∞,przed| = |v∞,po|
v_helio = V_planety + v∞
Δε = (|v_helio,po|² − |v_helio,przed|²)/2
vₚ = sqrt(v∞² + 2GM/rₚ)
b = (GM/v∞²) · sqrt(e² − 1)
```

Animacja pozycji liczona jest z hiperbolicznej anomalii `H`, równania `M = e sinh(H) − H` i promienia `r = (GM/v∞²)(e cosh(H) − 1)`. Model zakłada układ dwóch ciał i brak impulsów silnika podczas przelotu.

### Ważne ograniczenia

To **model edukacyjny przelotu planetocentrycznego** połączony z chwilową planetarną prędkością heliocentryczną. Nie jest analizą kompletnej misji ani pełnym problemem N-ciał. Kierunki wektorów ograniczono do płaszczyzny ekliptyki; w rzeczywistych asystach stosuje się trójwymiarowe celowanie w płaszczyźnie B (B-plane). Pominięto zmianę pozycji planety podczas przelotu, oddziaływanie grawitacyjne innych ciał, spłaszczenie i atmosfery planet, podgrzewanie przy niskim perycentrum, korekty i napęd. W szczególności symulator nie weryfikuje, czy dana konfiguracja przybycia jest fizycznie osiągalna od poprzedniej planety.

**Ważne fizycznie:** w układzie planety przed i po przelocie moduły prędkości `v∞` są identyczne, ponieważ tor jest niepowered. Zysk lub utrata energii względem Słońca pochodzi ze zmiany wektorowego dodawania prędkości planety. To nie „stworzenie energii” — w pełnym modelu planeta również wymienia pęd, choć jej odpowiednia zmiana jest znikoma.

### Źródła 13.0

- [NASA — Trajectories, gravity assist](https://science.nasa.gov/learn/basics-of-space-flight/chapter4-1/)
- [NASA — Gravity Assist Primer](https://science.nasa.gov/learn/basics-of-space-flight/primer/)
- [JPL — Astrodynamic Parameters](https://ssd.jpl.nasa.gov/astro_par.html)
- [JPL — Planetary Satellite Physical Parameters, GM planets](https://ssd.jpl.nasa.gov/sats/phys_par/)

## Zachowane laboratoria

## Nowość: Laboratorium Grawitacji 12.0

Interaktywny, **planarny model CR3BP** (Circular Restricted Three-Body Problem) z rozwiązaniem numerycznym równań ruchu sondy metodą Rungego–Kutty 4. rzędu (RK4) oraz automatycznym doborem kroku zależnym od odległości od masywnych ciał.

- Dwa układy fizyczne: **Ziemia–Księżyc** (średnia separacja 384 400 km, okres 27,321661 d) oraz **Słońce–Ziemia** (1 AU, okres 365,2568983 d). Masy i promienie reprezentowane wartościami średnimi.
- Numeryczne wyznaczanie współliniowych **L1, L2, L3** oraz analitycznych trójkątnych **L4, L5** w normalizowanym, obracającym się układzie barycentrycznym.
- Zmiana pozycji startowej i impulsu prędkości sondy; regulacja tempa czasu, pauza i restart eksperymentu. Możliwość dotknięcia punktu L na scenie lub ręcznego ustawienia sondy w innym miejscu.
- Dwa układy odniesienia: **współobracający się** (punkty L nieruchome) oraz **inercjalny barycentryczny** (ciała, punkty i ich trajektorie poruszają się).
- Wersja współobracająca pokazuje wektory przyspieszeń grawitacyjnych od obu ciał, odśrodkowe i Coriolisa; strzałki przeskalowane wizualnie, nie są wektorami w jednolitej skali.
- Wyświetlanie obszarów dostępnych/niedostępnych ruchowo z warunku stałej Jacobiego **2Ω ≥ C** (potencjał efektywny), położenia sondy, odległości i przyspieszeń w jednostkach fizycznych.
- Monitor **stałej Jacobiego**: C = 2Ω − (ẋ² + ẏ²), procentowy dryf numeryczny C, wykrywanie zderzeń z podstawowymi ciałami oraz opuszczenia skali symulacji.
- Eksperyment porównawczy: **Zachowaj ślad A** i uruchom kolejną próbę, aby nałożyć oba ślady i badać wrażliwość na warunki początkowe.
- Obsługa gestów na telefonie (przesuwanie i przybliżanie) oraz sterowania klawiaturą.

### Równania i interpretacja

W znormalizowanym układzie barycentrycznym, z μ = m₂/(m₁ + m₂), przy położeniach ciał (−μ, 0) i (1−μ, 0):

```text
Ω(x,y) = ½(x²+y²) + (1−μ)/r₁ + μ/r₂
x¨ = 2 y˙ + ∂Ω/∂x
y¨ = −2 x˙ + ∂Ω/∂y
C = 2Ω − (x˙² + y˙²)
r₁² = (x+μ)²+y²
r₂² = (x−1+μ)²+y²
```

Stabilność L4/L5 wynika z kryterium Routha **μ < 0,0385209** i dotyczy liniowej teorii idealnego modelu. L1/L2/L3 są niestabilne. Symulacja jest **dwuwymiarowa** — nie rekonstruuje prawdziwych przestrzennych orbit halo ani lotu JWST. Rzeczywiste trajektorie są modyfikowane przez nieregularności orbit, inne ciała, promieniowanie i manewry napędu.

**Pomysł na doświadczenie:** wybierz Ziemia–Księżyc i L4 z przesunięciem 0,5%; odtwórz kilka okresów, zachowaj ślad A. Następnie wybierz L1 z przesunięciem 0,5% i porównaj, jak szybko sonda opuszcza otoczenie punktu równowagi.

### Źródła do modelu

- [NASA — What are Lagrange Points?](https://science.nasa.gov/solar-system/resources/faq/what-are-lagrange-points/)
- [NASA Webb — Orbital Mechanics and L2](https://science.nasa.gov/mission/webb/orbit/)
- [ESA — What are Lagrange points?](https://www.esa.int/Enabling_Support/Operations/What_are_Lagrange_points)

## Zachowane moduły
## Laboratorium Trajektorii 11.0

- **Interaktywna mapa porkchop**: data startu (oś X), czas lotu w dniach (oś Y), kolory — wymagany koszt energetyczny.
- 40 × 26 = **1040 niezależnych wariantów** obliczanych w przeglądarce metodą Lamberta 3D dla daty odlotu, czasu lotu i pozycji planet ze wspólnego silnika Atlasu.
- Wybór planet Merkury, Wenus, Ziemia, Mars, Jowisz i Saturn, zakresu dat oraz czasu lotu.
- Zmiana miary kolorów: suma v∞ odlot + v∞ przylot [km/s], energia C3 = (v∞ odlot)² [km²/s²] oraz v∞ przy przylocie [km/s].
- Kliknięcie/dotknięcie punktu pokazuje dokładne daty, C3 i prędkości. Biały krzyżyk wskazuje minimum z siatki, ulepszone lokalnym badaniem sąsiedztwa.
- Przycisk **Odtwórz lot sondy w 3D** przenosi bez modyfikowania wybraną datę i czas lotu do Centrum Misji.
- Eksport CSV ze wszystkimi poprawnie wyznaczonymi wariantami; kopiowanie wyników dla pojedynczej trajektorii.
- Przetwarzanie porcjowane między kolejnymi klatkami animacji, bez zewnętrznych API.

**Jak skorzystać:** otwórz Laboratorium Trajektorii z górnego paska lub menu bocznego, wybierz trasę i zakres, oblicz mapę, wskaż punkt i kliknij **Odtwórz lot sondy w 3D**.

**Jak interpretować wyniki:** C3 to kwadrat prędkości hiperbolicznego nadmiaru przy odlocie, a nie paliwo zużyte przez sondę. Suma v∞ jest orientacyjną miarą porównawczą, a nie pełnym budżetem Δv z powierzchni. Skala kolorów jest względna dla aktualnego wykresu. Znalezione minimum jest najlepsze w badanym przedziale i przy lokalnej optymalizacji, niekoniecznie globalne.

**Granice modelu:** heliocentryczny model dwóch ciał, pozycje planet z przybliżeń JPL, brak perturbacji innych planet, efektów napędu, asyst grawitacyjnych, manewrów naprowadzania, startu z powierzchni i ograniczeń rakiet. Zdarzenia poza zasięgiem przybliżeń 1800–2050 nie są obliczane.

## Centrum Misji — zachowane funkcje 10.1

- **Centrum Misji** w górnym pasku i w menu bocznym; działa również na telefonach.
- Wybór planet początkowej i docelowej, gotowe trasy m.in. Ziemia–Mars, Ziemia–Wenus, Ziemia–Jowisz, Ziemia–Saturn i Mars–Ziemia.
- Orientacyjny czas lotu Hohmanna; dla danej daty tor 3D rozwiązany numerycznie metodą Lamberta i propagowany po keplerowskiej orbicie wokół Słońca. Animacja i ślad sondy korzystają z **tych samych** współrzędnych.
- Orientacyjne wyszukiwanie kolejnych **okien fazowych** na podstawie faz geometrycznych ciał z silnika astronomicznego Atlasu.
- Kalkulacja czasu lotu, długości rzeczywistej obliczonej trasy w modelu dwuciałowym, różnic heliocentrycznych prędkości (Δv), wymaganej idealnej fazy Hohmanna i jej odchylenia.
- Licznik odległości sonda–cel; koniec animacji sygnalizuje „CEL OSIĄGNIĘTY” i odległość 0 km w spójnym modelu symulacji.
- Możliwość przeniesienia daty lotu do głównego planetarium i skopiowania tekstowego podsumowania misji.
- Brak zależności od zewnętrznych API, bibliotek i serwera.

## Struktura

- `index.html` — aplikacja i panele.
- `css/style.css` i `js/app.js` — główny silnik astronomiczny i sceny.
- `css/jupiter.css`, `js/jupiter.js`, `js/jupiter-assets.js` — moduł Jowisza.
- `css/missions.css`, `js/missions.js` — Centrum Misji i połączenie z Laboratorium.
- `css/porkchop.css`, `js/porkchop.js` — Laboratorium Trajektorii 11.0.
- `css/gravity.css`, `js/gravity.js` — Laboratorium Grawitacji 12.0 (CR3BP i RK4).
- `css/assists.css`, `js/assists.js` — Asysty Grawitacyjne 13.0 (hiperbola, czas i wektory).
- `css/archive.css`, `js/archive.js` — interaktywne archiwum misji 14.0.
- `js/mission-tracks.js` — lokalne, archiwalne próbki NASA/JPL Horizons dla Voyager 1, Voyager 2 i Cassini.
- `css/exoplanets.css`, `js/exoplanets.js` — Łowca Egzoplanet 15.0: fizyczny model tranzytów, wykres fotometryczny i tryb odkrywcy.
- `css/neo.css`, `js/neo.js` — Asteroidy/komety 16.0, orbity Keplera, geometria spotkań, odczyty niepewności JPL.
- `data/neo-close-approaches.json`, `data/neo-orbits.json` — lokalne i okresowo odświeżane migawki danych.
- `scripts/update_neo_data.py`, `.github/workflows/update-neo.yml` — aktualizacja danych po stronie GitHub Actions.
- `js/assets.js`, `js/stars.js`, `js/ephemeris.js` — zasoby wbudowane i dane.

Do uruchomienia lokalnego: `python -m http.server 8000`, a następnie `http://localhost:8000/`. Wariant wieloplikowy może nie działać poprawnie przez `file://` ze względu na moduły ES.

## Granice dokładności

To jest **symulator edukacyjny**, nie system do faktycznego planowania startów i manewrów orbitalnych.

- Czas trwania misji jest początkowym oszacowaniem Hohmanna, bazującym na średnich promieniach orbit (dla rzeczywistego projektu należałoby dobierać również czas lotu).
- Tor sondy rozwiązuje **zadanie Lamberta** dla jej położenia początkowego i położenia planety docelowej po upływie czasu lotu. Następnie punkt sondy w każdej klatce wynika z propagacji keplerowskiej 3D ze stałym parametrem grawitacyjnym Słońca. Start i koniec toru są dokładnie zgrane z efemerydami planet użytymi przez Atlas.
- Założenia: dwa ciała (Słońce + bezmasowa sonda), brak perturbacji grawitacyjnych od innych ciał, manewrów, ograniczeń napędu, atmosfery, startu z powierzchni planet i asyst grawitacyjnych.
- Pokazane Δv to suma modułów różnic prędkości heliocentrycznych sondy i każdej planety w chwilach startu i przylotu. To **nie** pełny budżet paliwowy misji ani Δv wymagane do wystrzelenia z powierzchni.
- Wyszukiwarka okien fazowych nadal bazuje na orientacyjnym modelu kołowym Hohmanna, nie na optymalizacji pełnego transferu. Przy kiepskiej dacie metoda Lamberta może znaleźć tor spotkania, ale kosztem bardzo dużego Δv. Program nie udaje rzeczywistego okna startowego NASA.
- W niemal współliniowych, numerycznie osobliwych ustawieniach może zostać użyta **oznaczona jako interpolowana** krzywa poglądowa zamiast rozwiązania Lamberta; wtedy Δv nie jest wyliczane.
- Pozostałe moduły wykorzystują własne uproszczenia, opisane w oknie „Źródła, dokładność i ograniczenia” w aplikacji.

### Źródła

- [JPL SSD — przybliżone pozycje planet](https://ssd.jpl.nasa.gov/planets/approx_pos.html)
- [NASA Trajectory Browser — wykresy porkchop, Lambert, ograniczenia](https://trajbrowser.arc.nasa.gov/user_guide.php)
- [JPL Mission-Design Tool — definicja C3 i prędkości v∞](https://ssd.jpl.nasa.gov/tools/mdesign.html)
- [NASA Planetary Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/)
- [NASA — Basics of Space Flight](https://science.nasa.gov/learn/basics-of-space-flight/)
- [GPU Accelerated Lambert Solution Method — opis metody zmiennych uniwersalnych](https://www.adrc.iastate.edu/files/2012/09/AAS-11-263.pdf)

## Zachowanie poprzedniej wersji

Poprzednie wersje zabezpieczono w gałęziach `backup-v8-before-v10`, `backup-v10-before-transfer-fix`, `backup-v10-1-before-porkchop`, `backup-v11-before-three-body`, `backup-v12-before-gravity-assists`, `backup-v13-before-mission-archive`, `backup-v14-before-exoplanets` oraz `backup-v15-before-small-bodies`. Gałąź `main` zawiera wersję 16.0.
