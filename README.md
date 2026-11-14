# ATLAS SOLARIS 27.0 — Portal Astronomiczny

ATLAS SOLARIS to interaktywny atlas Układu Słonecznego. Wersja **24.0** dodaje obserwatorium dwóch laserowych interferometrów LIGO, detekcję syntetycznych sygnałów GW150914 w niezależnych szumach i interaktywny filtr dopasowany. Wersja **23.0** dodała obserwatorium fal grawitacyjnych z widowiskową wizualizacją zderzenia dwóch czarnych dziur, fizyką inspiralu i przybliżonym wygaszaniem drgań Kerra. Wersja **22.0** dodała kamerę poruszającą się wraz z sondą po geodezyjnej Kerra i przelicza widok nieba oraz dysku z uwzględnieniem lokalnej aberracji relatywistycznej. Wersja **21.0** dodała pilotażową ekspedycję: geodezyjny ruch sondy w równikowej czasoprzestrzeni Kerra, porównanie zegarów, wleczenie azymutu i wizualizację wejścia do ergosfery. Wersja **20.1** rozbudowuje laboratorium o rzeczywistą geometrię Kerra (obrót, ergosfera, wleczenie i geodezyjne Cartera), zachowując fizykę Schwarzschilda przy spinie zerowym. Wersja **20.0** dodała laboratorium czarnej dziury: per-pixel WebGL2 śledzenie promieni Schwarzschilda, fizykę horyzontu, model dysku akrecyjnego i grawitacyjne zegary. Wersja **19.0** dodała pełnoekranową, interaktywną nawigację międzygwiezdną opartą na przestrzennych pozycjach ponad 7400 gwiazd i relatywistyce szczególnej. Wersja **18.1** rozszerzyła Obserwatorium o 110 obiektów Messiera, figury gwiazdozbiorów i wyszukiwarkę pięciu najlepszych nocy w ciągu 30 dni. Wersja **18.0** rozbudowała Obserwatorium 6.0 o naukowy planer 24 godzin, wyszukiwanie obiektów, wykres wysokości i cyfrowy okular o regulowanym polu widzenia. Zachowuje zaćmienia 17.x, misje, egzoplanety i wcześniejsze funkcje atlasu. Zachowuje mapę 17.2, kontakty C1–C4 i kalendarz 17.1. Zachowuje istniejące laboratoria astronomiczne, w tym moduł asteroid i komet z wersji 16.0.

## Nowość 27.0 — Portal Astronomiczny, 26 osobnych podstron

**Strona główna** `/`: sześć działów, wyróżnione doświadczenia, wyszukiwarka wszystkich 26 etapów, płynna dekoracyjna animacja orbit i responsywny układ.

**Każdy etap otrzymał adres:** `/etapy/01/` do `/etapy/26/`; sześć rozszerzeń `/laboratoria/...` (Żywe Konstelacje 25.1, Kalendarz Zaćmień 17.1, Mapa Cienia 17.2–17.3, Messier 18.1, Kerr 20.1, Ziemia z Kosmosu). Dodatkowo `/dzialy/...` i `/o-projekcie/`.

**Dotychczasowy Atlas 26.0 w całości zachowany pod `/atlas.html`.** Podstrony są niezależnymi adresami, ale korzystają ze wspólnego silnika 26.0 przez wewnętrzną ramkę tej samej domeny. Mostek `portal/embed.js` otwiera laboratorium w pełnym ekranie bez wyglądu modalnego okna i przekierowuje między modułami na ich własne adresy. To etap migracji: technicznie pozostawiono wewnętrzne komponenty HTML `dialog` z zachowanymi funkcjami, ale zewnętrzny interfejs jest stroną z paskiem nawigacji. Poszczególne podstrony wczytują wciąż zasoby 26.0, dlatego niezależne budowanie bibliotek i optymalizacja ładowania mogą zostać wykonane później.

**Wersje 1–9:** nie są archiwalnymi kopiami historycznych programów; ich strony prowadzą do odpowiednich tematycznych widoków aktualnego silnika. Wersje 10–26 prowadzą do konkretnych laboratoriów.

**Ważne:** animacja planet na stronie głównej jest dekoracyjna. Obliczenia astronomiczne znajdują się we właściwych laboratoriach i mają opisane tam zakresy dokładności.

**Test:** `node tests/portal27.test.cjs`. Kopia poprzedniego stanu repozytorium: `backup-v26-before-portal27`. Szczegółowe instrukcje i architektura: `README_PORTAL27.md`.

## Nowość 26.0 — Maszyna Czasu Nieba: 28 tysięcy lat precesji Ziemi

**Otwórz:** przycisk „◷ MASZYNA CZASU 26” w górnym pasku lub „◷ MASZYNA CZASU NIEBA 26.0 · PRECESJA ZIEMI” w menu bocznym. Dostępne są również przejścia z Zodiaku 25 i Żywych Konstelacji 25.1.

- Dwie zsynchronizowane sceny Canvas2D: **mapa północnego nieba**, prezentująca zmieniający się kierunek północnego bieguna niebieskiego, oraz **schemat 3D Ziemi**, z osią obrotu i biegunem ekliptyki.
- Przedział **rok astronomiczny −12000 do +16000**, animacja i suwak. W zapisie astronomicznym rok 0 oznacza rok 1 p.n.e., a −2800 to 2801 p.n.e.
- Epoki: Thuban (około −2800), Polarna (2026) i Wega (około 13700). Pokazane odległości to **kąty na niebie**; „najbliższa gwiazda” oznacza najbliższą spośród dziewięciu opisanych kandydatów.
- Prawdziwa geometria J2000: biegun równika, biegun ekliptyki, kąt nachylenia, punkt równonocy marcowej, długość ekliptyczna J2000 oraz rektascensja i deklinacja.
- **Długookresowa precesja Vondrák, Capitaine, Wallace (2011, 2012)**, zaadaptowana z implementacji ERFA (biblioteka wywodząca się z IAU SOFA), zamiast extrapolacji krótkookresowego wielomianu IAU 1976. Warunki licencyjne ERFA opisane w `legal/ERFA-LICENSE.txt`.
- Wskaźnik równonocy na ekliptycznej mapie **13 gwiazdozbiorów IAU J2000**, klasyfikowany z rzeczywistej pozycji równonocy w układzie J2000; współrzędne gwiazd z wcześniej używanego Atlasu 19.
- Nawigacja między modułami 25, 25.1 i 26. Wszystkie wcześniejsze laboratoria zachowane; kopia kodu przed tym etapem jest w gałęzi `backup-v25-1-before-time-machine26`.

### Ograniczenia i interpretacja

**Precesja jest obliczana na podstawie opublikowanego modelu**, ale star map wykorzystuje **nieruchomy katalog gwiazd J2000**. Przy tysiącach lat ruchy własne gwiazd mogą być istotne, toteż dokładna odległość gwiazdy od bieguna w takim odległym roku jest tu przybliżeniem. Prawdziwy tor bieguna ekliptyki zmienia się w czasie i jest liczony; wizualny wygląd Ziemi, graticule, jasność i szybkość lotu przez epoki pozostają schematyczne. Nie obliczamy wstecz lub wprzód pozycji planet poza wiarygodnym zakresem istniejącego silnika JPL, nie przewidujemy historycznych zjawisk ani położeń gwiazd z pełnym ruchem własnym. Wskaźnik ekliptyczny przedstawia **długość J2000**, a nie projekcję na ekliptykę daty; w odległych epokach te płaszczyzny nie pokrywają się.

**Testy:** `node tests/time26.test.cjs`; zawierają referencyjne wyniki ERFA dla epoki −1373.5959534565 oraz kontrolę geometrii historycznej i przyszłej. Testy całego Atlasu są uruchamiane przez GitHub Actions.

**Źródła:** [Vondrák et al. 2011, A&A 534 A22](https://doi.org/10.1051/0004-6361/201117274), [ERFA NumFOCUS — ltpequ, ltpecl, ltp](https://github.com/liberfa/erfa), [NASA StarChild — Earth's precession](https://starchild.gsfc.nasa.gov/docs/StarChild/question.html). Zob. także lokalną dokumentację `legal/ERFA-LICENSE.txt`.

## Nowość 25.1 — Żywe Konstelacje, paralaksa 3D i rzeczywiste granice IAU

**Uruchomienie:** przycisk „✦ ŻYWE KONSTELACJE 25.1” na pasku i w menu bocznym lub „✦ ŻYWE KONSTELACJE · LOT 3D” w istniejącym Atlasie Zodiaku 25.0. Wszystkie etapy do 25.0 są zachowane, a przed aktualizacją utworzono gałąź `backup-v25-before-living-constellations`.

- **13 rzeczywistych wielokątów IAU J2000** z d3-celestial i klasyfikacją Słońca na sferze niebieskiej, włącznie z Wężownikiem. Zastępują dawne przybliżone granice na zewnętrznym kole etapu 25.0.
- **Wyszukiwanie kolejnego przekroczenia** wielokąta Słońca w okresie 2024–2040 z uwzględnieniem precesji układu współrzędnych z daty do J2000. Algorytm używa przybliżonych wzorów Meeusa/NOAA, dlatego czas przekroczenia nie jest certyfikowaną efemerydą.
- **Prawdziwa geometria 3D** z katalogu ok. 7 400 gwiazd w `js/interstellar19-data.js`. Lot do wybranej gwiazdy, ręczny suwak, sterowanie kamerą, przybliżenie, kolory gwiazd, ich odległości i umowne figury na niebie. Linie zmieniają kształt dlatego, że widzimy gwiazdy z innego punktu w przestrzeni.
- **Interaktywny ekran** zoptymalizowany do smartfonów i komputerów. Z widoku przestrzennego można wrócić do koła zodiaku 25.0 i przekazać datę do głównego silnika Atlasu.
- **Granice nie są ścianami w przestrzeni**: wyświetlamy je tylko przy widoku z Układu Słonecznego. Pełen katalog 88 gwiazdozbiorów nie jest częścią tego etapu.

### Naukowe ograniczenia etapu 25.1

Katalog 3D korzysta z dotychczasowych odległości Hipparcos/Yale oraz lokalnych źródeł RECONS, **nie** z najnowszego katalogu Gaia. Gwiazdy z oszacowanymi odległościami są oznaczane. Ruchy własne gwiazd, czas propagacji fotonów i efekty relatywistyczne nie są uwzględnione. Lot jest wizualizacją zmiany miejsca obserwacji (0–95% odległości do celu), nie realistyczną symulacją napędu. Poświaty i tempo przelotu są artystyczne. Gwiazdozbiorowe figury są umowne, natomiast wielokąty granic to geometra IAU w J2000; błędy klasyfikacji mogą wystąpić w pobliżu granic z uwagi na przybliżony model słoneczny oraz pominięte małe poprawki astrometryczne.

**Testy:** `node tests/zodiac251.test.cjs` i `node tests/zodiac25.test.cjs`.

**Źródła:** [IAU — Constellations](https://www.iau.org/IAU/IAU/Astronomy-FAQs/Constellations.aspx), [Olaf Frohn / d3-celestial — constellations.bounds.json, BSD 3-Clause](https://github.com/ofrohn/d3-celestial), [HYG Database v4.1 / Astronexus, CC BY-SA 4.0](https://github.com/astronexus/HYG-Database). Szczegółowe pochodzenie odległości: `js/interstellar19-data.js`.

## Nowość 25.0 — Atlas Zodiaku i wędrówka Słońca przez 13 gwiazdozbiorów

**Wejście:** przycisk „✧ ATLAS ZODIAKU 25” na górnym pasku lub „✧ ATLAS ZODIAKU 25.0 · 13 GWIAZDOZBIORÓW” w menu bocznym. Zachowane zostały wszystkie laboratoria 1.0–24.0.

- Panorama ekliptyki oparta na katalogowych współrzędnych gwiazd J2000 z już istniejącego HYG i figurach z d3-celestial/Celestial Data (figury umowne, nie oficjalne obrysy IAU).
- Dwa koncentryczne pierścienie: **13 nierównych odcinków konstelacji astronomicznych** i **12 równych 30-stopniowych sektorów tradycyjnego zodiaku tropikalnego**. Wężownik (Ophiuchus) znajduje się między Skorpionem i Strzelcem.
- Pozycje Słońca przybliżone algorytmem Meeusa/NOAA, odczyt długości ekliptycznej i deklinacji. Rzeczywiste kierunki planet i Księżyca wyprowadzane z dostępnego już silnika Atlasu (przybliżenia JPL i efemerydy Księżyca).
- Wybór daty 2024–2040, suwak dni roku, odtwarzanie 3/10/25 dni na sekundę, klikane gwiazdozbiory i koło, przesuwanie i przybliżanie panoramy, synchronizacja daty z główną sceną.
- Tryb mobilny, brak bibliotek zewnętrznych i dodatkowych żądań sieciowych.

**Istotne ograniczenie naukowe:** wyświetlane sektory 13 konstelacji nie są pełnymi wielokątami oficjalnych granic IAU. Wyznaczono je z przybliżonych przejść Słońca przez granice w roku 2026 oraz małej poprawki precesyjnej dla lat bliskich 2026. Daty kolejnych przejść w module są orientacyjne, nie precyzyjnymi chwilami ingressu. Tło gwiazd jest oparte na J2000; brak pełnej korekty precesji/nutacji, aberracji i refrakcji. Słabe punkty dekoracyjne w panoramie nie są obiektami katalogowymi. **Moduł opisuje astronomię, nie przewiduje przyszłości ani charakteru ludzi na podstawie daty urodzenia.**

**Źródła:** [OpenStax — The Sky Above](https://openstax.org/books/astronomy/pages/2-1-the-sky-above), [NASA/JPL — Constellations of the Zodiac](https://nightsky.jpl.nasa.gov/documents/344/0SolSysManual.pdf), [NASA/JPL — Approximate positions](https://ssd.jpl.nasa.gov/planets/approx_pos.html), d3-celestial/Celestial Data (zachowane licencje poprzednich etapów).

**Test:** `node tests/zodiac25.test.cjs`.

## Nowość 24.0 — Obserwatorium LIGO: naprawdę wykryj falę w szumie

**Wejście:** przycisk **◈ OBSERWATORIUM LIGO** w górnym pasku albo **◈ OBSERWATORIUM LIGO 24.0 · WYKRYJ FALĘ** w menu bocznym. Z laboratorium zderzeń 23.0 można również przejść przyciskiem **„Wykryj tę falę w LIGO 24.0”**. Dla źródła o masach gwiazdowych i obsługiwanej odległości przejmowane są wartości mas i odległości. Hipotetycznych czarnych dziur supermasywnych nie kierujemy do pasma detektorów naziemnych: ich sygnał mHz należy do innych typów obserwatoriów, więc przejście w tym wypadku resetuje misję do GW150914 i wyświetla powód.

### Co przedstawia laboratorium?

**Interferometr:** wizualny schemat dwóch prostopadłych ramion \`L=4000 m\`, lasera podczerwonego \`λ=1064 nm\`, rozdzielacza wiązki, zwierciadeł (mas testowych) i fotodiody. Przy przechodzeniu fali \`+\` przy osi odpowiednio ustawionego interferometru jeden kierunek ulega wydłużeniu, a drugi skróceniu. Ruch zwierciadeł oraz widoczne wiązki na scenie są **poglądowo zwielokrotnione**: rzeczywista wiązka podczerwieni jest niewidoczna, a zmiany odległości są mniejsze niż skale jądrowe.

**Dwa detektory:** Hanford (H1, stan Waszyngton) i Livingston (L1, Luizjana), w rzeczywistości odległe o około 3000 km. Model zawiera dwa *niezależne* białe szumy Gaussa, cyfrowe próbki strain \`h(t)\` o częstotliwości 4096 Hz przez 1,50 sekundy, falę wyliczoną przez silnik inspiralu + ringdown z etapu 23 i odmienną odpowiedź antenową. Dla scenariusza GW150914 wzorcowa fala pojawia się najpierw w L1, a około **6,9 ms później** w H1 (w rzeczywistych obserwacjach opóźnienie wyniosło około 7 ms). Znak i względna amplituda \`H1 = −0,75 × L1\` są **uproszczoną, wybraną orientacją modelową**; nie pochodzą z wyliczenia kierunku na niebie konkretnego układu pod kątem ramion LIGO.

**Filtrowanie:** możesz patrzeć na wykresy dwóch strumieni strain, a następnie uruchomić **„SZUKAJ SYGNAŁU / FILTR DOPASOWANY”**. Algorytm dla każdej możliwej chwili coalescence porównuje próbki danych z przesuwanym szablonem fali (korelacja normalizowana znanym odchyleniem szumu i normą szablonu). Osobno liczymy \`ρ_L1(t)\` i \`ρ_H1(t)\`, szukamy pików zgodnych w przedziale ±10 ms i podajemy umowną statystykę sieci \`√(ρ_L1²+ρ_H1²)\`. Reguła **ρ każdego detektora ≥5 i ρ sieci ≥9** jest demonstracyjnym progiem ustawionym tylko dla tego symulatora. **Nie wolno interpretować jej jako rzeczywistej częstości fałszywych alarmów, istotności p, sigma ani jako rankingu zdarzeń LIGO.**

**Wzorzec jest znany:** filtr używa *tej samej fazy i parametrów modelu*, z którego wstrzyknięto falę. W rzeczywistym LIGO stosuje się banki szablonów o różnych masach, spinach, fazach i orientacjach, kalibrację, korekcję spektralną przez PSD, rozpoznawanie krótkich artefaktów szumu, testy spójności i ocenę alarmów z tła. Nasz wybór to świadomie dydaktyczny **matched filter dla syntetycznego szumu białego**, a nie zaawansowany detektor prawdziwego sygnału LIGO. Dla bazowej injekcji GW150914 poziom sztucznego szumu ustawiono *ręcznie*, aby wynik miał podobny rząd wielkości do historycznego network SNR 23,6; uzyskane SNR około 22–23 nie jest niezależną rekonstrukcją tego pomiaru.

### Eksperymenty

- **GW150914 / ukryty sygnał:** wartości startowe to źródłowe masy 36,2 i 29,1 M☉ oraz dystans 420 Mpc; inspiral i ringdown liczone są modelem 23.0, nie skopiowanym sygnałem ani rzeczywistymi danymi z detektorów.
- **Silne źródło:** dystans około 210 Mpc, przez co amplituda się zwiększa i odnalezienie fali w dwukanałowym szumie jest znacznie łatwiejsze.
- **Odległe źródło:** około 1350 Mpc i podwyższony poziom szumu; program wstrzykuje falę, ale może jej **nie wykryć**. Pokaż pozycję prawdziwej injekcji, aby zaobserwować wynik fałszywie ujemny.
- **Szum bez źródła:** falę wyłączono całkowicie. Przypadkowe lokalne szczyty korelacji nie powinny spełnić demonstracyjnego progu dwóch detektorów.
- **Własne warunki:** suwaki mas \`m1\`, \`m2\` (10–80 M☉), dystansu (100–2000 Mpc), poziomu szumu (0,30–4,00 ×). W modelu zmienionych mas masa końcowa i spin są **przyjęte orientacyjnie**, nie rozwiązane pełną numeryczną względnością. Przycisk „Nowa próbka szumu” generuje nowy deterministyczny strumień z innym ziarnem; przycisk „Pokaż injekcję” ujawnia prawdziwą obecność i położenie sztucznego sygnału.
- **Odtwarzanie:** 1,5 sekundy rzeczywistej skali czasu modelu rozciągnięte na około 13 sekund filmu, z pauzą i przewijaniem. Tempo odtwarzania nie zmienia próbki fizycznej.

### Fizyka metrologii

Idealny, uproszczony interferometr Michelsona przy fali \`+\` propagującej prostopadle do płaszczyzny ramion i skierowanej wzdłuż osi detektora daje
\[
\Delta L_x=\frac{1}{2}Lh,\qquad \Delta L_y=-\frac{1}{2}Lh,\qquad
\Delta L_x-\Delta L_y=Lh.
\]
Faza dwóch powracających wiązek w uproszczeniu jednej podróży tam i z powrotem wynosi
\[
\Delta\phi=\frac{4\pi\Delta L}{\lambda},\qquad
\frac{I_{\mathrm{dark}}}{I_0}=\sin^2\!\left(\frac{\Delta\phi}{2}\right).
\]
Dla \`h≈10⁻²¹\` i \`L=4 km\`: \`ΔLx≈+2×10⁻¹⁸ m\`, \`ΔLy≈−2×10⁻¹⁸ m\`, \`ΔL≈4×10⁻¹⁸ m\`, \`Δφ≈4,72×10⁻¹¹ rad\`, \`I_dark/I_0≈5,58×10⁻²²\`, a foton potrzebowałby \`2L/c≈26,69 µs\` na pojedynczą trasę tam i z powrotem. Tak małych wartości nie przedstawiamy w skali pikseli — położenia luster są artystycznie powiększone. Rzeczywisty Advanced LIGO ma wielokrotne obiegi w wnękach Fabry’ego–Perota, recycling światła, złożoną odpowiedź częstotliwościową oraz specjalne techniki odczytu, dlatego wykres \`I_dark\` nie powinien być traktowany jako rzeczywisty prąd fotodiody.

Syntetyczne próbki strain dla każdego detektora to
\[
d_\mathrm{L1}[n]=F_\mathrm{L1} h(t_n-t_0)+\epsilon_{\mathrm{L1}}[n], \quad
d_\mathrm{H1}[n]=F_\mathrm{H1}h(t_n-t_0-\delta t)+\epsilon_{\mathrm{H1}}[n],
\]
gdzie \`F_L1=+1\`, \`F_H1=−0.75\`, \`δt=6.9 ms\`, a każde \`ε\` ma rozkład normalny o odchyleniu \`σ\` w *fizycznych bezwymiarowych jednostkach strain na próbkę*. Obecna symulacja **nie** modeluje rzeczywistego szumu kolorowego (charakterystyki sejsmicznej, kwantowej, linii widmowych). Korelacja przy znanym szumie białym i znanym szablonie \`q\`:
\[
\rho(t_k)=\frac{\sum_j d[k+j]q[j]}
{\sigma\sqrt{\sum_j q[j]^2}},
\]
przy umownie skorygowanym przeciwnym znaku odpowiedzi H1. Czas opóźnienia estymujemy z maksimów korelacji, sprawdzając zgodność nie większą niż 10 ms. Nie wykonujemy automatycznie realnej analizy fałszywych alarmów; sygnały testowe pozostają niezależne.

### Źródła naukowe

- LIGO Scientific Collaboration, [GW150914 — science summary](https://ligo.org/science-summaries/GW150914/): 14 września 2015, pierwszy sygnał najpierw w Livingston, po około 7 ms w Hanford; podstawy interferometrii.
- LIGO, [Advanced LIGO — instrument at the first detection](https://ligo.org/science-summaries/gw150914detector/): ramiona po 4 km, zmiana różnicy odległości rzędu 4×10⁻¹⁸ m, realne wnęki optyczne.
- Caltech/MIT LIGO Lab, [LIGO's Laser](https://www.ligo.caltech.edu/MIT/page/laser): źródło 1064 nm w podczerwieni.
- GWOSC, [intro and matched filtering tutorial](https://gwosc.org/s/events/GW150914/LOSC_Event_tutorial_GW150914.html): filtrowanie dopasowane, PSD i rzeczywista analiza GW150914.
- GWOSC, [public GW150914 data](https://gwosc.org/events/GW150914/): **prawdziwe otwarte próbki H1/L1**, które w przyszłym etapie można dodać jako osobny tryb. Wersja 24.0 **ich jeszcze nie pobiera ani nie używa**.

**Pliki:** \`js/ligo24-core.js\`, \`js/ligo24-ui.js\`, \`css/ligo24.css\`, \`tests/ligo24.test.cjs\`, \`tests/ligo24-browser.test.cjs\`. Poprzednie wersje atlasu 17–23 działają niezależnie. Składnię JS, prawa optyki, odtwarzalność szumu, rzeczywiste opóźnienie oraz detekcje i brak detekcji dla czterech scenariuszy weryfikuje CI; test w Chromium uruchamia rzeczywiste Canvas2D i komplet sterowania.

---

## Nowość 23.0 — Zderzenie gigantów / fale grawitacyjne

**Start:** przycisk **✦ ZDERZENIE GIGANTÓW** na górnym pasku lub **✦ ZDERZENIE GIGANTÓW 23.0 · FALE GRAWITACYJNE** w menu. Otwiera osobne laboratorium, bez usuwania poprzednich modułów atlasu.

### Co jest naukowe, a co widowiskowe?

W pierwszej fazie, **inspiral**, ruch dwóch punktowych mas po quasi-kołowych orbitach jest wyznaczany z wiodącego przybliżenia kwadrupolowego emisji fal grawitacyjnych. Masy \`m1\`, \`m2\`, odległość \`D\`, stosunek mas \`η\`, masa chirpu \`ℳ\` i fizyczny czas (sekundy układu źródła) są prawdziwymi parametrami wejściowymi wzorów. Rozdzielenie orbity maleje, częstotliwość rośnie, a waveform h+ oraz h× są obliczane liczbowo z analitycznych zależności. Ich wykres jest zsynchronizowany z obrazem. Przyjęte **zakończenie inspiralu przy \`r=5.3 GM/c²\` to umowny próg modelu** — nie wynik pełnych równań nieliniowych i nie dokładna geometria powstawania wspólnego horyzontu.

W drugiej fazie, po umownym momencie połączenia, liczymy **fenomenologiczny ringdown**: sinusoidę z tłumieniem wykładniczym, z częstotliwością fundamentalnego modu \`l=m=2, n=0\` obliczoną z masy i spinu końcowej czarnej dziury. Model zachowuje ciągłość fazy i amplitudy w miejscu zmiany faz, ale częstotliwość nie jest tam wygładzona pełnym rozwiązaniem inspiral–merger–ringdown. Takie pełne, dokładne rozwiązanie wymagałoby m.in. numerycznej względności.

**Warstwa wizualna** to przestrzenny *rzut współrzędnościowy* z dwoma czarnymi dziurami, świecącymi śladami orbity, siatką i falami-kręgami. Te kręgi oraz błysk „połączenia” są **scenografią**, nie materialnymi falami w przestrzeni, nie obrazem rzeczywistego zakrzywienia geometrii 3D i nie elektromagnetycznym błyskiem generowanym przez czarne dziury. Nie symulujemy akrecji gazu ani zachowania fotonów z pełnej czasoprzestrzeni dwóch ciał.

### Eksperymenty i parametry

- **GW150914:** historyczne pierwsze bezpośrednie wykrycie fal grawitacyjnych z połączenia dwóch czarnych dziur 14 września 2015 r. Wartości wybrane ze współczesnej tabeli GWOSC: **36,2 M☉ + 29,1 M☉ → 62,3 M☉**, spin końcowy około **0,68**, dystans jasności około **420 Mpc** i energia **3,0 M☉c²**. To pomiary/oszacowania LIGO, **ale waveform i animacja są nowym modelem** — nie odtwarzają surowych danych LIGO.
- **Dwie jednakowe:** 30+30 M☉, orientacyjna masa końcowa 57,4 M☉ i spin 0,69: model eksperymentalny, nie konkretne wykrycie.
- **Supermasywne olbrzymy:** milion M☉ oraz 800 tys. M☉, masa końcowa 1,72 mln M☉, spin 0,72. Pokazuje jak znacząco zmieniają się skale czasu, częstotliwości i fizycznego rozmiaru. To także przykład hipotetyczny, nie rzeczywiste zdarzenie.
- **Własne parametry:** suwak mas \`m1\`, \`m2\`, dystansu \`D\` i nachylenia obserwacji; masa końcowa dla danych wpisanych ręcznie przyjmuje **umowną utratę 4,7% masy** i spin \`a_f=0,68\`. Wyniki nie mogą być interpretowane jako pomiary.
- **Odtwarzanie:** 17-sekundowy filmowy pokaz, przyspieszanie/spowalnianie, ręczne przewijanie, pauza i ponowne odtworzenie. To *kompresja lub rozciąganie czasu na ekranie*: w panelu wyświetlany jest **rzeczywisty czas źródła** z równań modelu. Około 80% pokazu przypada na inspiral, 20% na ringdown.
- **Sonifikacja:** opcjonalny, lokalnie syntetyzowany dźwięk, którego częstotliwość jest proporcjonalna do częstości fizycznego modelu (z ograniczeniami słyszalności). Nie używa utworu muzycznego, pliku dźwiękowego, źródła zewnętrznego ani nagrania LIGO. Dźwięk jest wyłączony domyślnie i wymaga działania Web Audio oraz zgody użytkownika w przeglądarce.

### Równania

Niech \(\eta=m_1m_2/(m_1+m_2)^2\), \(M=m_1+m_2\), \(r_g=GM/c^2\), \(t_g=GM/c^3\), \(\mathcal M=(m_1m_2)^{3/5}/M^{1/5}\). Dla bezwymiarowego rozdzielenia \(\rho=r/r_g\) (wiodący rząd dla orbity quasi-kołowej):
\[
\frac{d\rho}{d(t/t_g)}=-\frac{64\eta}{5\rho^3},\qquad
\rho^4(t)=\rho_{\text{merge}}^4+\frac{256\eta}{5}\frac{-t}{t_g},
\]
gdzie \(t=0\) jest umowną chwilą zakończenia inspiralu. Częstotliwość fali \(f_{\text{GW}}=2f_{\text{orbit}}\) wynosi
\[
f_{\text{GW}}=\frac{1}{\pi t_g\rho^{3/2}},\qquad
\phi_{\text{orb}}(\rho)=\frac{\rho_0^{5/2}-\rho^{5/2}}{32\eta}.
\]
Dla lokalnych ram źródła, dystansu obserwatora \(D\) i kąta inklinacji \(\iota\), przy amplitudzie \(A=4\eta r_g/(D\rho)\), przybliżone polaryzacje są
\[
h_+ = A\,\frac{1+\cos^2\iota}{2}\cos(2\phi_{\text{orb}}),\quad
h_\times=A\cos\iota\,\sin(2\phi_{\text{orb}}).
\]
Powyższe jest **wzorem modelowym leading-order i nie uwzględnia m.in. przesunięcia kosmologicznego**. W szczególności prezentowane częstotliwości i czasy są w *układzie źródła*. Wartość z katalogu obserwacji LIGO należy pod względem redshiftu rozumieć odrębnie.

Dla końcowego spinu bezwymiarowego \(a_f\) i końcowej masy \(M_f\) przyjmujemy znany fit Berti–Cardoso–Will do dominującego quasi-normalnego modu Kerra:
\[
\omega_{220} M_f\simeq 1.5251-1.1568(1-a_f)^{0.1292},\quad
Q\simeq 0.7000+1.4187(1-a_f)^{-0.4990},
\]
\[
f_{\text{ring}}=\omega_{220}/(2\pi t_{g,f}),\quad
\tau_{\text{ring}}=Q/(\pi f_{\text{ring}}),\quad
h_\text{ring}\propto e^{-t/\tau_{\text{ring}}}
 \cos(2\pi f_{\text{ring}}t+2\phi_{\text{orb}}(t=0)).
\]
Dzięki temu model oblicza np. dla GW150914 częstotliwość tonu ringdown około **273 Hz** i czas zanikania około **3,7 ms** (źródłowe, przy parametrach katalogowych).

**Bilans mas i energii:** \(\Delta M=m_1+m_2-M_f\), \(E_{\text{GW}}=\Delta M\,M_\odot c^2\). Dla GW150914 jest to około \(5.36\times10^{47}\) J. Nie jest to energia obliczona przez całkowanie przybliżonego waveformu w symulatorze — energia jest **osobno zaczerpnięta z estymacji parametrów zdarzenia**.

### Źródła

- [LIGO Scientific Collaboration: GW150914 science summary](https://ligo.org/science-summaries/GW150914/).
- [Gravitational Wave Open Science Center: GW150914 — estimated source parameters](https://gwosc.org/events/GW150914/).
- [Peters & Mathews, *Gravitational Radiation from Point Masses in a Keplerian Orbit* (1963)](https://doi.org/10.1103/PhysRev.131.435).
- [Berti, Cardoso & Will, quasi-normal mode fits (2006)](https://doi.org/10.1103/PhysRevD.73.064030).
- [GW150914 waveform educational example](https://cpoli.github.io/physicskit/api/gallery/relativity/gravitational_waves/plot_binary_merger_chirp.html).

**Pliki:** \`js/merger23-core.js\`, \`js/merger23-ui.js\`, \`css/merger23.css\`, \`tests/merger23.test.cjs\`, \`tests/merger23-browser.test.cjs\`. Regresja 17–22 niezmieniona i wykonywana wraz z nowymi testami 23.0 w GitHub Actions. Publikacja przez istniejący \`.github/workflows/deploy-pages.yml\`.

---

## Nowość 22.0 — Oczy sondy: kamera w ruchu przy czarnej dziurze

**Uruchomienie:** przycisk **◉ KAMERA SONDY** w górnym pasku, **◉ KAMERA NA POKŁADZIE 22.0** w menu bocznym lub przycisk **„Kamera na pokładzie 22.0”** w oknie misji 21.0. Przy przejściu bezpośrednio z misji 21.0 przenosimy **jej dokładne warunki startowe, chwilę lotu i wybraną masę**; nie rozpoczynamy od nowa niezależnego pokazu.

**Najważniejsze funkcje:**
- **Kamera fizycznie dołączona do geodezyjnej sondy**. Dla każdego kroku bierzemy jej aktualne współrzędne Boyera–Lindquista \(r,\phi\) oraz czteroprędkość \(u^\mu\), wynikające z niezależnie przetestowanego silnika 21.0.
- **Rozdzielenie grawitacji od ruchu kamery.** W układzie lokalnego obserwatora ZAMO (zero angular momentum observer) wyznaczamy zmierzone składowe prędkości sondy. Następnie promień biegnący z wybranego piksela kamery w jej własnym układzie Lorentzowskim jest transformowany do ZAMO, po czym śledzimy jego **zerową geodezyjną w metryce Kerra**, numerycznie, metodą RK4 dla rozdzielonych równań Cartera (moduł 20.1).
- **Aberracja światła:** przełącznik włącza/wyłącza transformację kierunków światła, pozwalając w *tym samym punkcie czasoprzestrzeni* porównać obraz statycznego względem ZAMO instrumentu i instrumentu lecącego z sondą. Opcja kontrolna nie oznacza, że pojazd zmienił tor.
- **Współczynnik Dopplera w osi kamery:** \(D=\nu_{\text{sonda}}/\nu_{\mathrm{ZAMO}}=1/[\gamma(1-\mathbf v\cdot\mathbf n_{\text{sonda}})]\), gdzie \(\mathbf v\) i kierunek do źródła \(\mathbf n\) są mierzone lokalnie w jednostkach \(c=1\). Opcjonalna zmiana jasności według \(D^3\) to uproszczenie z transformacji intensywności; nie daje prawdziwej spektroskopii.
- **Dokąd patrzy kamera:** na czarną dziurę, zgodnie z bieżącą prędkością sondy, na zewnętrzne niebo albo wzdłuż kierunku \(+\phi\); swobodne przeciąganie i zoom FOV \`32–100°\`.
- **Cztery scenariusze z 21.0:** swobodny spadek przez ergosferę, start wewnątrz ergosfery, stabilna kołowa orbita i odwrócony spin. Przewijanie trajektorii po czasie własnym, pauza i tempo odtwarzania **nie wpływają na fizyczne prędkości**.
- **Przyrządy naukowe:** promień \(r\), prędkość sondy względem ZAMO \(v/c\), współczynnik \(\gamma\), \(\alpha\), \(\omega\), \(d\tau/dt=\alpha/\gamma\), czasy w sekundach według wybranej masy, czynnik Dopplera \(D\) dla centralnego piksela, a także jego stałe Kerr \(L_z/E\) i \(Q/E^2\). Radar pokazuje *współrzędnościowy* ślad sondy, horyzont \(r_+\) i równikową granicę ergosfery \(r=2r_g\).
- **Optymalizacja telefonów:** bez bibliotek CDN, skalowana rozdzielczość WebGL2, odtwarzanie animacji z ograniczeniem odświeżania najcięższego ray tracingu, tryb oszczędny. Brak WebGL2 nie wyłącza pozostałego atlasu ani wskazań fizycznych. Interaktywny obraz GPU jest ograniczony skończonym budżetem całkowania, dlatego bardzo blisko niektórych orbit fotonowych możliwe są obszary numerycznie nierozstrzygnięte.

**Równania układów lokalnych.** Metryka Kerra ma \(\Delta=r^2-2Mr+a^2\), \(\Sigma=r^2+a^2\cos^2\theta\), \(A=(r^2+a^2)^2-a^2\Delta\sin^2\theta\). Dla biegunowo stacjonarnego obserwatora ZAMO \(\alpha=\sqrt{\Delta\Sigma/A}\) i \(\omega=2Mar/A\). Ponieważ sonda w wersji 21.0 porusza się po równiku, \(g_{rr}=r^2/\Delta\). Zmierzona przez ZAMO prędkość ma składowe
\[
 \gamma=\alpha u^t,\quad
 v^{\hat r}=\frac{\sqrt{g_{rr}}u^r}{\gamma},\quad
 v^{\hat\phi}=\frac{\sqrt{g_{\phi\phi}}(u^\phi-\omega u^t)}{\gamma}.
\]
Dla kierunku \(\mathbf n_S\) *od kamery ku źródłu* i wektora \(\mathbf v\) sondy względem ZAMO, kierunek potrzebny do śledzenia w lokalnym ZAMO otrzymujemy przez odwrotne przekształcenie optycznego kierunku:
\[
 \mathbf n_Z=\frac{\mathbf n_S+
 \left[\frac{(\gamma-1)(\mathbf v\cdot\mathbf n_S)}{|\mathbf v|^2}-\gamma\right]\mathbf v}
 {\gamma(1-\mathbf v\cdot\mathbf n_S)}.
\]
Następnie używamy tetrady ZAMO, stałych Cartera i równań Kerra dla światła. Testy numeryczne sprawdzają \(|\mathbf n|=1\), odwracalność transformacji i poprawność przesunięć \(\gamma(1\pm \beta)\) dla promieni patrzących na wprost/do tyłu. Używamy jednostek \(G=c=M=1\) wewnątrz symulacji i fizycznego \(t_g=GM/c^3\) do konwersji na sekundy.

**Ograniczenia interpretacyjne:** obraz powstaje w prawdziwej geometrii geodezyjnych Kerra w stacjonarnej metryce i poprawnej lokalnej transformacji SR, ale **nie jest fotograficznym, pełnym rozwiązaniem obserwacyjnym**. Kamera jest idealnym obserwatorem z hipotetycznym sensorem; nie liczy transferu promieniowania, opóźnień zmiennego źródła ani rzeczywistego widma. Jasność dysku, kolory, tekstury i sztuczny katalog gwiazd J2000 są ilustracyjne. Zastosowano **cienki modelowy dysk o wewnętrznej granicy co najmniej \(8r_g\)**, tak aby kamera nie znalazła się wewnątrz nieprzezroczystej materii; nie jest to dynamicznie wyznaczona krawędź akrecji konkretnego Sgr A* ani M87*. Zależnie od misji wewnętrzna granica może być przesunięta dalej, aby utrzymać idealizowaną pustą przestrzeń kamery. Przy horyzoncie symulacja jest zatrzymywana przed osobliwością współrzędnych Boyera–Lindquista. Nie pokazujemy wnętrza horyzontu ani nie obiecujemy dokładnych obrazów EHT.

**Weryfikacja:** \`node tests/cockpit22.test.cjs\` sprawdza fizykę ZAMO, lokalną aberrację, kierunek odwrotny, relację dwóch zegarów i integrację DOM. \`node tests/cockpit22-browser.test.cjs\` uruchamia shader WebGL2 w prawdziwym Chromium i weryfikuje obraz, różnicę między optyką sondy a optyką ZAMO, zmianę obrazu w innym punkcie toru i radar. Pełna regresja etapów 17–21 pozostaje aktywna.

**Źródła i opracowania:**
- Bardeen, Press, Teukolsky (1972), *Rotating Black Holes: Locally Nonrotating Frames, Energy Extraction, and Scalar Synchrotron Radiation*: https://ui.adsabs.harvard.edu/abs/1972ApJ...178..347B/abstract
- Black Hole Perturbation Toolkit, równania geodezyjnych Kerra: https://bhptoolkit.org/KerrGeodesics/
- KerrGeoPy, parametry i trajektorie w czasoprzestrzeni Kerra: https://kerrgeopy.readthedocs.io/en/stable/
- Materiały edukacyjne NASA o wizualizacji soczewkowania światła przez czarne dziury: https://science.nasa.gov/universe/black-holes/

**Pliki:** \`js/cockpit22-core.js\`, \`js/cockpit22-renderer.js\`, \`js/cockpit22-ui.js\`, \`css/cockpit22.css\`, \`tests/cockpit22.test.cjs\`, \`tests/cockpit22-browser.test.cjs\`. Przejście z misji 21.0 wspierane przez rozszerzone \`ATLAS_PROBE21.getState()\`, bez zmiany istniejących równań ruchu.

---

## Nowość 21.0 — Misja przez ergosferę

**Uruchomienie:** przycisk 🚀 **LOT PRZEZ ERGOSFERĘ** na górnym pasku albo **🚀 MISJA 21.0 · LOT PRZEZ ERGOSFERĘ** w menu bocznym.

To samodzielny **symulator swobodnego ruchu sondy** w równikowej płaszczyźnie metryki Kerra (\(\theta=\pi/2,\;Q=0\)). W odróżnieniu od 20.0/20.1, gdzie śledzimy promienie świetlne, tutaj całkujemy **geodezyjną czasopodobną** masywnej sondy (\(ds^2<0\)) i uwzględniamy upływ jej czasu własnego \(\tau\).

**Eksperymenty:**
- **Paradoks ergosfery:** spin \(a_*=+0.92\), promień startowy \(r_0=1.80 r_g\), radialna prędkość względem ZAMO \(v_{\hat r}=-0.12c\), azymutalna \(v_{\hat\phi}=-0.70c\). Mimo lokalnego ruchu przeciwnie do obrotu, sonda wewnątrz ergosfery ma *dodatnie* \(d\phi/dt\). To rzeczywisty skutek wleczenia czasoprzestrzeni. Zachowana energia Killinga \(E\) może w tej strefie być ujemna — zjawisko umożliwiające proces Penrose’a, ale **sama sonda nie przeprowadza procesu Penrose’a**.
- **Lot przez granicę:** przy \(a_*=0.92\), \(r_0=5.20 r_g\) z ujemnymi składowymi radialną i azymutalną, sonda zaczyna poza ergosferą, mija jej równikową granicę \(r=2r_g\) i kieruje się w stronę horyzontu \(r_+=1+\sqrt{1-a_*^2}\).
- **Kołowa orbita stabilna:** start \(r=6.50 r_g\) przy prędkości lokalnej wyznaczonej z dokładnej częstotliwości orbity kołowej \(\Omega=1/(r^{3/2}+a)\) oraz tetrady ZAMO, bez sztucznego utrzymywania promienia ani dopisywania przyspieszenia silnikami.
- **Spin odwrócony:** przy \(a_*=-0.92\) i niezmienionych znakach składowych lokalnej prędkości trajektoria staje się drastycznie inna; pozwala porównać różnicę między ruchem zgodnym i przeciwnym do rotacji.

**Sterowanie:** zmiana \(a_*\) od −0.98 do +0.98, promienia \(r_0\) i lokalnych \(v_{\hat r}\), \(v_{\hat\phi}\). Model pilnuje \(v<c\) i tego, aby sonda startowała poza horyzontem. Wybrać można masę Sgr A* (około 4 mln mas Słońca), M87* (6,5 mld) lub model 10 \(M_\odot\): w *geometrycznych* jednostkach trajektoria jest taka sama, ale zmienia się fizyczny czas. Po starcie sonda nie włącza silników. Interaktywny ekran zawiera obracaną kamerę, suwak przewijania trajektorii, odtwarzanie i trzy zakresy szybkości odtwarzania \(\tau\) — **tempo odtwarzania nie jest prędkością statku**.

**Wizualizacje:** droga \((x=r\cos\phi,y=r\sin\phi)\) w ortograficznym rzucie odchylonej płaszczyzny, współrzędnościowy horyzont, siatka powierzchni statyczności \(r_E(\theta)=1+\sqrt{1-a_*^2\cos^2\theta}\), scenograficzny dysk akrecyjny i opcjonalnie *kontrastowy tor sondy dla spinu \(a_*=0\)* z zachowaniem tego samego \(r_0,v_{\hat r},v_{\hat\phi}\) względem lokalnego ZAMO. Tor porównawczy nie jest możliwy przy startach wewnątrz horyzontu Schwarzschilda \(r_0\le 2r_g\) — wówczas pozostaje ukryty. Wykres naukowy pokazuje promień i azymut sondy w funkcji jej czasu własnego, wraz z granicą ergosfery.

**Równania:** zachowane \(E=-u_t\) i \(L_z=u_\phi\) uzyskujemy z ortonormalnego układu lokalnego ZAMO:
\[
\gamma=(1-v_{\hat r}^2-v_{\hat\phi}^2)^{-1/2},\quad
E=\gamma\alpha+\omega L_z,\quad
L_z=\gamma\sqrt{g_{\phi\phi}}\,v_{\hat\phi}.
\]
Dla geodezyjnej równikowej o masie spoczynkowej sondy (jednostkowej) zachodzi
\[
R(r)=\left[E(r^2+a^2)-aL_z\right]^2-
 \Delta\left[r^2+(L_z-aE)^2\right],\qquad
\left(\frac{dr}{d\tau}\right)^2=R(r)/r^4.
\]
Integrator wykorzystuje równoważne równanie drugiego rzędu
\[
\frac{d^2r}{d\tau^2}=\frac{R'(r)}{2r^4}-\frac{2R(r)}{r^5},
\]
wraz z obliczonymi geodezyjnymi \(dt/d\tau\) i \(d\phi/d\tau\), całkowanymi metodą RK4. W ten sposób przechodzimy także przez radialne punkty zwrotne. Rzeczywiste sekundy z odległego zegara \(t\) i czasu sondy \(\tau\) otrzymujemy mnożąc jednostki geometryczne przez \(t_g=GM/c^3\). Numeryczny błąd wiązania radialnego \(v_r^2-R/r^4\) podajemy na panelu.

**Bezpieczeństwo interpretacji:** wizualizacja to rzut współrzędnych Boyera–Lindquista; nie jest dokładnym odwzorowaniem ich **odległości własnych** ani symulacją wyglądu otoczenia z kamery na pokładzie. Efekty kolorystyczne, tło i postać statku są ilustracyjne. Nie liczymy ruchu poza płaszczyzną równikową, manewrów silnikowych, reakcji zwrotnej sondy na masę czarnej dziury, plazmy, tarcia ani emisji fotonów z kamery. Czas współrzędnościowy \(t\) w tej parametryzacji rośnie bez ograniczenia w pobliżu horyzontu, więc **integrację kończymy jeszcze na zewnątrz horyzontu**. Nie oznacza to, że pokładowy czas własny przestaje płynąć.

**Źródła naukowe:**
- Opracowanie równań geodezyjnych Kerra i pierwszych całek: <https://academic.oup.com/ptep/article/2026/7/073E04/8722630>
- P. Giudice, rozprawa doktorska, *Kerr spacetime* (ruch czasopodobny i równikowy), University of Southampton: <https://eprints.soton.ac.uk/429746/1/Paco_Giudice.pdf>
- ZAMO i ograniczenia obserwatorów statycznych w ergosferze: <https://www.roma1.infn.it/teongrav/onde19_20/kerr.pdf>
- Max Planck Institute for Gravitational Physics — *Black Holes* (wleczenie, ergosfera, ISCO): <https://imprs-lectures.aei.mpg.de/2023-astrophysics-of-compact-objects/wp-content/uploads/sites/8/2023/05/lecture02.pdf>

**Nowe pliki:** \`js/probe21-core.js\`, \`js/probe21-ui.js\`, \`css/probe21.css\`, \`tests/probe21.test.cjs\`. Regresja: poprzednie testy 17–20.1 oraz nowy test całkowania, zachowania stałych i symulowanego uruchomienia interfejsu. GitHub Pages publikuje zmiany na \`main\` przez workflow \`.github/workflows/deploy-pages.yml\`.

---

## Nowość 20.1 — Obracająca się czarna dziura Kerra

**Uruchomienie:** na stronie wybierz **CZARNA DZIURA 20.1**. Poprzednie laboratorium 20.0 stało się jednym z dwóch trybów — przy \`a*=0\` obrazy i obliczenia generuje dotychczasowy silnik Schwarzschilda, a przy \`a*≠0\` obraz jest liczony nowym rendererem Kerra, nie poziomym przesunięciem starego pierścienia. Ustaw domyślny spin \`+0.85\`, przełącz go na \`−0.90\` i zwróć uwagę na zmianę asymetrii oraz zakrzywienie trajektorii fotonów.

**Nowe funkcje:**
- Suwak spinu \`a* = Jc/(GM²)\` od **−0,98 do +0,98**, szybkie nastawy 0 / +0,50 / +0,90 / −0,90. W tym modelu znak oznacza kierunek spinu wobec ustalonej osi \`+φ\` i ruchu dysku. Zakres ograniczono przed wartością ekstremalną 1, aby uniknąć niestabilnego numerycznego całkowania dokładnie na osobliwych granicach współrzędnych.
- **Ray tracing w WebGL2 z metryką Kerra:** na podstawie lokalnego kierunku fotonu względem obserwatora ZAMO wyznaczane są całki geodezyjne \`E\`, \`Lz\` i stała Cartera \`Q\`. Równania w czasie Mino są numerycznie całkowane metodą Rungego–Kutty czwartego rzędu dla \`u=1/r\`, \`θ\` i \`φ\`. Promienie są klasyfikowane jako pochłonięte przez horyzont, trafiające w model dysku lub uciekające ku tłu.
- **Horyzont Kerra i ergosfera:** promień zewnętrznego horyzontu \`r₊=1+√(1−a*²)\` i granica statyczności \`r_E(θ)=1+√(1−a*² cos²θ)\`, w jednostkach \`r_g=GM/c²\`; horyzont nie pokrywa się z powierzchnią granicy statyczności poza biegunami. Przy spinie zerowym oba promienie wynoszą 2 \`r_g\`.
- **ISCO zgodna/przeciwna:** wyznaczenie najbliższych stabilnych orbit kołowych \`+φ\` i \`−φ\` wzorem Bardeena–Pressa–Teukolsky'ego. Dla \`a*=0\` obie leżą przy \`r=6 r_g\`; dla \`a*=+0.85\` wartości to około **2,632 \`r_g\`** i **8,575 \`r_g\`**.
- **Wleczenie czasoprzestrzeni:** lokalna prędkość kątowa obserwatorów o zerowym momencie pędu (ZAMO), \`ω=2ar/A\`, i okres obrotu takiego układu względem odległego obserwatora (w czasie \`t\` Boyera–Lindquista), z fizyczną masą wybranej czarnej dziury.
- **Wykres asymetrycznych torów fotonów** w rzucie na płaszczyznę równikową. W tym samym układzie odniesienia promienie biegnące po dwóch stronach czarnej dziury mogą mieć różne losy. Kliknięcie obrazu wyznacza parametry Cartera \`λ=Lz/E\`, \`η=Q/E²\` i pokazuje obliczoną trajektorię.
- **Przekrój ergosfery i porównanie orbit** — diagram ma znaczenie współrzędnościowe, nie przedstawia odległości własnych. Spin 0 automatycznie przełącza na sprawdzony shader Schwarzschilda.
- **Bieg zegara ZAMO:** przy spinie niezerowym porównanie tempa zegara układu lokalnie nierotującego (który jest wleczony przez geometrię) z dalekim zegarem: \`dτ/dt = α = √(ΔΣ/A)\`. Nie jest to zegar nieruchomo zawieszonego obserwatora wewnątrz ergosfery — taki obserwator nie może istnieć.

**Wzory i jednostki:** geometria Kerra ma \`Δ=r²−2r+a²\`, \`Σ=r²+a²cos²θ\`, \`A=(r²+a²)²−a²Δ sin²θ\`. Foton ma stałe \`E\`, \`Lz\`, \`Q\`. W czasie Mino \`γ\`, gdzie \`dγ ∝ dλ/Σ\`, rozdziela się ruch radialny i biegunowy; dla \`u=1/r\`, zmiennej \`ψ=bγ\`, \`b=√(λ²+η)\`, radialna część spełnia
\[
\frac{d²u}{dψ²}
=\frac{\bigl[2(a²-aλ)-K\bigr]u+3Ku²+2\bigl[(a²-aλ)²-a²K\bigr]u³}{b²},
\quad K=\eta+(\lambda-a)².
\]
Ruch \`θ\` i \`φ\` wynika z rozdzielonych równań Cartera. Renderowane promienie są obliczane numerycznie, a nie generowane przez ozdobną deformację obrazu.

**Ważne ograniczenia:** to **naukowy model geometrii Kerra**, lecz nie obraz konkretnej rzeczywistej czarnej dziury zmierzony przez EHT. Dysk jest cienki, umowny, optycznie nieprzezroczysty i na stałe wiruje w kierunku \`+φ\`; promień jego wewnętrznej krawędzi przyjmuje ISCO tej orientacji. Barwy i struktura emisji są ilustracyjne; przesunięcie fotometryczne ma uproszczony lokalny czynnik Dopplera i grawitacyjny, ale nie rozwiązuje hydrodynamiki magnetycznej, transportu promieniowania, polaryzacji ani obserwacji z różnych epok. Liczba iteracji shaderów jest skończona, szczególnie blisko niestabilnych orbit fotonowych. Widok tła gwiazd jest odniesieniem katalogowym J2000 z atlasu, nie rzeczywistą astrometrią okolic Sgr A* ani M87*. Obserwator to hipotetyczny ZAMO na ustalonym promieniu i kolatytudzie, nie statek na swobodnie spadającej trajektorii. Model dotyczy zewnętrznej geometrii; nie przedstawia fizyki wnętrza horyzontu.

**Źródła fizyki:**
- KerrGeoPy — rozdzielone równania geodezyjnych Kerra i czas Mino: https://kerrgeopy.readthedocs.io/en/stable/notebooks/Trajectory.html
- D. Bardeen, W. H. Press, S. A. Teukolsky (1972), *Rotating Black Holes: Locally Nonrotating Frames, Energy Extraction, and Scalar Synchrotron Radiation*, Astrophysical Journal 178, 347–370.
- Max Planck Institute for Gravitational Physics — wykłady o ergosferze i wleczeniu czasoprzestrzeni: https://imprs-gw-lectures.aei.mpg.de/2023-astrophysics-of-compact-objects/wp-content/uploads/sites/8/2023/05/lecture02.pdf
- Dokumentacja obliczania ISCO: https://cpoli.github.io/physicskit/api/gallery/relativity/kerr/plot_ergosphere_and_penrose.html

**Testy:** \`node tests/blackhole201.test.cjs\` (horyzont, ergosfera, ISCO, niezmienniki Cartera, asymetria torów, integracja UI), \`node tests/blackhole201-browser.test.cjs\` (rzeczywista kompilacja WebGL2, render obrazu dla przeciwnych znaków spinu), pełna regresja 17.0–20.0. Nowe pliki: \`js/blackhole201-core.js\`, \`js/blackhole201-renderer.js\`, \`js/blackhole201-ui.js\`, \`css/blackhole201.css\`, \`tests/blackhole201*.test.cjs\`.

---

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
