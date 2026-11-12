# ATLAS SOLARIS 10.0 — interaktywny Układ Słoneczny i Centrum Misji

Statyczna aplikacja astronomiczna 3D do nauki i eksploracji Układu Słonecznego. Wersja 10.0 dodaje **Centrum Misji**, niezależny moduł do projektowania uproszczonych lotów międzyplanetarnych. Zachowuje wszystkie wcześniej istniejące moduły: obserwatorium, rekonstrukcje zaćmień, geometrię cieni, glob Ziemi, widoki z powierzchni i księżyce Jowisza.

## Otwórz stronę

**https://gawierzba.github.io/atlas-solaris/**

Wymagane ustawienie: GitHub → Settings → Pages → Deploy from a branch → `main` → `/(root)`.

## Co nowego w 10.0

- **Centrum Misji** w górnym pasku i w menu bocznym; działa również na telefonach.
- Wybór planet początkowej i docelowej, gotowe trasy m.in. Ziemia–Mars, Ziemia–Wenus, Ziemia–Jowisz, Ziemia–Saturn i Mars–Ziemia.
- Idealny półeliptyczny transfer Hohmanna, rysowanie trasy sondy, animacja podróży, kontrola postępu i tempa symulacji.
- Orientacyjne wyszukiwanie kolejnych **okien fazowych** na podstawie faz geometrycznych ciał z silnika astronomicznego Atlasu.
- Kalkulacja czasu lotu, długości łuku orbitalnego, idealnego heliocentrycznego Δv, wymaganej fazy i jej odchylenia.
- Możliwość przeniesienia daty lotu do głównego planetarium i skopiowania tekstowego podsumowania misji.
- Brak zależności od zewnętrznych API, bibliotek i serwera.

## Struktura

- `index.html` — aplikacja i panele.
- `css/style.css` i `js/app.js` — główny silnik astronomiczny i sceny.
- `css/jupiter.css`, `js/jupiter.js`, `js/jupiter-assets.js` — moduł Jowisza.
- `css/missions.css`, `js/missions.js` — Centrum Misji 10.0.
- `js/assets.js`, `js/stars.js`, `js/ephemeris.js` — zasoby wbudowane i dane.

Do uruchomienia lokalnego: `python -m http.server 8000`, a następnie `http://localhost:8000/`. Wariant wieloplikowy może nie działać poprawnie przez `file://` ze względu na moduły ES.

## Granice dokładności

To jest **symulator edukacyjny**, nie system do faktycznego planowania startów i manewrów orbitalnych.

- Transfer Hohmanna: model idealny, dwa ciała, kołowe orbity o promieniach równych średnim półosiom wielkim i wspólna płaszczyzna. Pomija nachylenie i ekscentryczność orbit podczas wyznaczania toru sondy.
- Wyznaczanie okien fazowych używa geometrycznych położeń planet z modelu Atlasu (JPL approximate positions), ale oblicza idealną fazę dla orbit kołowych. Nie jest to rozwiązanie problemu Lamberta, szczegółowa efemeryda sondy ani prognoza oficjalnych okien startowych.
- Prezentowane Δv obejmuje idealne zmiany heliocentrycznej prędkości orbitalnej na początku i końcu transferu. **Nie** jest pełnym budżetem paliwa ani Δv startu z powierzchni planety.
- Animacja nie uwzględnia grawitacji planet, manewrów asyst grawitacyjnych, korekt, ograniczeń napędowych i dat rzeczywistych startów.
- Pozostałe moduły wykorzystują własne uproszczenia, opisane w oknie „Źródła, dokładność i ograniczenia” w aplikacji.

### Źródła

- [JPL SSD — przybliżone pozycje planet](https://ssd.jpl.nasa.gov/planets/approx_pos.html)
- [NASA Planetary Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/)
- [NASA — Basics of Space Flight](https://science.nasa.gov/learn/basics-of-space-flight/)

## Zachowanie poprzedniej wersji

Stan przed aktualizacją został zabezpieczony w osobnej gałęzi GitHub: `backup-v8-before-v10`. Główna gałąź `main` zawiera wersję 10.0.
