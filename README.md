# ATLAS SOLARIS 16.0 — Asteroidy, komety i bliskie zbliżenia z Ziemią

ATLAS SOLARIS to naukowy atlas Układu Słonecznego. Wersja **16.0** dodaje laboratorium małych ciał — rozróżnia **oficjalnie policzone zbliżenia NASA/JPL**, **formalną niepewność odległości** oraz **poglądową wizualizację heliocentrycznej orbity oskulacyjnej**. Zachowano wszystkie moduły wersji 8–15, w tym łowcę egzoplanet, archiwum sond i misje.

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
