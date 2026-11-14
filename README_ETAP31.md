# ATLAS SOLARIS 31.0 — Soczewkowanie grawitacyjne

## Gotowy eksperyment

- Strona portalu: `/etapy/31/`
- Bezpośrednie laboratorium: `/laboratoria/soczewkowanie-grawitacyjne/`
- Silnik obliczeń: `/portal/lens31-core.js`
- Renderowanie: `/portal/lens31-ui.js`
- Style: `/portal/lens31.css`

Strona główna, katalog `portal/catalog.json` i dane tras `portal/data.js` uwzględniają etap 31. Luka w numeracji (etap 27) pozostaje oznaczona jako nieopublikowana. Jest zatem **30 opublikowanych etapów**, numeracja dochodzi do **31**.

## Rzeczywista fizyka za animacją

W przybliżeniu *cienkiej soczewki* dla punktowej masy M korzystamy z równania

```
β = θ − (θ_E² / |θ|²) θ
θ_E = sqrt[4GM/c² × D_ls/(D_l D_s)]
```

Wszystkie wielkości β i θ są kątami. Obserwowane promienie w sekundach łuku obliczamy z jednostek SI. W renderowaniu obrazu odwracamy relację: każdemu punktowi na ekranie odpowiada źródłowe β, z którego pobieramy syntetyczną jasność galaktyki. Pozwala to tworzyć *rzeczywiste dla przyjętego modelu* obrazy, w tym pierścień Einsteina przy centrycznej geometrii i podwójne obrazy poza osią.

Dla źródła punktowego u = |β|/θ_E:

```
θ±/θ_E = (u ± sqrt(u²+4))/2
A(u) = (u²+2)/(u sqrt(u²+4))
```

Kod udostępnia także obrazy wektorowe (pierwotny i wtórny) i ich bezwzględne powiększenia. Przy u = 0 otrzymujemy pierścień; wzór na A jest osobliwy, gdy źródło jest *idealnie punktowe*. Jasność realnego rozciągłego źródła nie staje się nieskończona.

## Eksperymenty

1. **Pierścień Einsteina:** ustaw galaktykę dokładnie za soczewką. Widoczny pierścień wynika z odwzorowania numerycznego.
2. **Dwa obrazy i łuki:** przesuń źródło względem osi. A i B pokazują punktowe obrazy środka galaktyki.
3. **Słabsze soczewkowanie:** zwiększ odległość od osi i zmniejsz masę soczewki.
4. **Przelot:** animuj przejście galaktyki przez płaszczyznę źródłową i obserwuj krzywą magnifikacji.

Dodatkowo przeciągaj położenie źródła na miniaturze nieba bez soczewki; zmieniaj masę soczewki, jej odległość, odległość źródła, pole widzenia i położenie.

## Ograniczenia, które trzeba znać

- Używamy jednej **punktowej** masy, nie realistycznego halo lub eliptycznej galaktyki — nie odtwarzamy zatem łuków, kwadów i kaustyk z rzeczywistych gromad.
- Wprowadzamy **odległości efektywne w geometrii euklidesowej**: `D_ls = D_s − D_l`. Przy kosmologicznych odległościach Gpc powinny być stosowane kątowe odległości kosmologiczne, które nie spełniają tej prostej równości. Wyniki odległościowe są przykładem dydaktycznym, a nie prognozą dla konkretnej galaktyki.
- Proceduralna galaktyka jest fikcyjnym rozciągłym źródłem; jej wygląd i kolor nie są obserwacjami.
- Krzywa wzmocnienia obliczana jest **dla punktowego źródła**, podczas gdy główny obraz przedstawia **źródło rozciągłe**. Wartości na wykresie nie są całką po powierzchni syntetycznej galaktyki.
- Pozycje źródła podajemy w jednostkach θ_E; zmieniając masę zmieniasz fizyczną skalę kątową. Pole widzenia jest regulowane niezależnie.
- Animowany przelot powtarza pozycje demonstracyjne. Nie symuluje trajektorii galaktyki w czasie kosmologicznym.

## Testowanie

`node tests/lens31.test.cjs`

## Literatura

- Schneider, Ehlers & Falco (1992), *Gravitational Lenses*, Springer.
- Bartelmann & Schneider (2001), *Weak Gravitational Lensing*, Physics Reports, https://doi.org/10.1016/S0370-1573(00)00082-X
- Narayan & Bartelmann (1996), *Lectures on Gravitational Lensing*, https://arxiv.org/abs/astro-ph/9606001
- Ogólne omówienie ESA/Hubble: https://esahubble.org/wordbank/gravitational-lensing/

Kod i wizualizacja są oryginalnymi elementami projektu ATLAS SOLARIS.
