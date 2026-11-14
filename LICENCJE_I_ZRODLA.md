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


## Etap 26.0 — Maszyna Czasu Nieba
- Matematyczny model długookresowej precesji: Vondrák, J., Capitaine, N., Wallace, P. (2011), A&A 534 A22 i corrigendum A&A 541 C1 (2012), DOI 10.1051/0004-6361/201117274.
- Współczynniki i pomysł konstrukcji biegunów z otwartoźródłowej biblioteki [ERFA](https://github.com/liberfa/erfa) (NumFOCUS Foundation, 2013–2023; BSD-3-style). Szczegóły: `legal/ERFA-LICENSE.txt`; kod JavaScript w `js/time26-core.js` jest niezależną adaptacją na potrzeby Atlasu, NIE jest oficjalnym SOFA.
- Gwiazdy: dotychczasowy katalog Atlasu 19.0, J2000, bez ruchów własnych; umowne rysunki Ziemi w 2D Canvas.
- Granice zodiaku: atlas 25.1 — IAU J2000/d3-celestial BSD-3. Mapa nieba nie jest astrologicznym horoskopem ani dokładną efemerydą historyczną.
