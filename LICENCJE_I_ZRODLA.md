# ATLAS SOLARIS — źródła i prawa do danych

W module Obserwatorium wykorzystano wybrane rekordy katalogu HYG (Astronexus), dostępnego na licencji Creative Commons Attribution-ShareAlike 4.0: https://github.com/astronexus/HYG-Database.

Globalna mozaika Ziemi pochodzi z NASA Blue Marble: Next Generation: https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/.

Elementy orbitalne planet: https://ssd.jpl.nasa.gov/planets/approx_pos.html.
Elementy księżyców Jowisza: https://ssd.jpl.nasa.gov/sats/elem/.

Część tekstur planet i księżyców oraz widoków powierzchniowych ma charakter ilustracyjny, nie stanowi rzeczywistych map NASA. Model naukowy jest przybliżony i nie służy do prognozowania dokładnych momentów zaćmień czy nawigacji.


## Etap 25.1 — Żywe Konstelacje
- Polygonalna geometria 13 obszarów gwiazdozbiorów: [d3-celestial, Olaf Frohn](https://github.com/ofrohn/d3-celestial), `data/constellations.bounds.json`, licencja BSD-3-Clause. Wersja J2000; źródłowe granice Delporte/IAU. Zapisane własne podzbiory współrzędnych w `js/zodiac251-bounds.js`.
- Wzory pozycji Słońca: Meeus/NOAA, precesja IAU 1976; implementacja własna `js/zodiac251-core.js`.
- Pozycje gwiazd, figury i odległości: wcześniej udokumentowany lokalny pakiet `js/interstellar19-data.js` i `js/observatory181-catalog.js`, Hipparcos/Yale/RECONS, część oszacowana. Nie jest to katalog Gaia.
- Dodatkowe prawa HYG: Astronexus CC BY-SA 4.0; udokumentowane w dotychczasowych licencjach i źródłach.
