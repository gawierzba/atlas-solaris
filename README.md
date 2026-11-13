# ATLAS SOLARIS 13.0 — Asysty Grawitacyjne · Układ Słoneczny 3D

Interaktywny atlas Układu Słonecznego i naukowe laboratoria lotów kosmicznych. Nowa wersja **13.0** dodaje obliczeniowy symulator hiperbolicznych asyst grawitacyjnych. Nie usuwa modułów poprzednich wersji: Laboratorium Grawitacji 12.0, Laboratorium Trajektorii 11.0, Centrum Misji 10.1, Jowisza, zaćmień, globu Ziemi i obserwatorium.

## Otwórz stronę

**https://gawierzba.github.io/atlas-solaris/**

GitHub Pages: Settings → Pages → Deploy from a branch → `main` → `/(root)`.

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

Poprzednie wydania zabezpieczono w gałęziach `backup-v8-before-v10`, `backup-v10-before-transfer-fix`, `backup-v10-1-before-porkchop` `backup-v11-before-three-body` oraz `backup-v12-before-gravity-assists`. Gałąź `main` zawiera wersję 13.0.
