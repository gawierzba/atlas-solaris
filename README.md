# ATLAS SOLARIS 10.1 — interaktywny Układ Słoneczny i Centrum Misji

Statyczna aplikacja astronomiczna 3D do nauki i eksploracji Układu Słonecznego. Wersja 10.1 poprawia **Centrum Misji**, tak aby wyliczony tor sondy kończył się dokładnie w pozycji docelowej planety w chwili przylotu. Zachowuje wszystkie wcześniej istniejące moduły: obserwatorium, rekonstrukcje zaćmień, geometrię cieni, glob Ziemi, widoki z powierzchni i księżyce Jowisza.

## Otwórz stronę

**https://gawierzba.github.io/atlas-solaris/**

Wymagane ustawienie: GitHub → Settings → Pages → Deploy from a branch → `main` → `/(root)`.

## Centrum Misji w wersji 10.1

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
- `css/missions.css`, `js/missions.js` — Centrum Misji 10.1.
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
- [NASA Planetary Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/)
- [NASA — Basics of Space Flight](https://science.nasa.gov/learn/basics-of-space-flight/)
- [GPU Accelerated Lambert Solution Method — opis metody zmiennych uniwersalnych](https://www.adrc.iastate.edu/files/2012/09/AAS-11-263.pdf)

## Zachowanie poprzedniej wersji

Poprzednie wydania zabezpieczono w gałęziach `backup-v8-before-v10` oraz `backup-v10-before-transfer-fix`. Główna gałąź `main` zawiera poprawioną wersję 10.1.
