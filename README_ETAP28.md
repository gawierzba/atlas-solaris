# ATLAS SOLARIS 28.0 — Od Ziemi do granic obserwowalnego Wszechświata

Nowy etap rozwija portal 27.0 o **samodzielne laboratorium kosmologicznej skali**.

## Co zostało dodane

- nowa podstrona: `/etapy/28/`
- nowe laboratorium: `/laboratoria/granice-wszechswiata/`
- interaktywna oś logarytmiczna od **1 m** do **4,4 × 10^26 m**
- 15 punktów orientacyjnych: Ziemia, linia Kármána, GEO, Księżyc, 1 AU, Neptun, heliopauza, Obłok Oorta, Proxima Centauri, Droga Mleczna, Andromeda, Grupa Lokalna, Gromada w Pannie, Laniakea i promień obserwowalnego Wszechświata
- porównanie czasu podróży dla światła, Voyagera 1 i hipotetycznego statku lecącego z prędkością **1% prędkości światła**
- aktualizacja katalogu portalu: **27 ekspedycji** (numery 01–26 + 28; numer 27 pozostał etapem architektonicznej przebudowy portalu)
- poprawiona nawigacja etapów: poprzedni / następny działa już na podstawie rzeczywistej kolejności w danych, a nie na sztywnym zakresie 1–26

## Pliki do podmiany / dodania

- `portal/data.js`
- `portal/catalog.json`
- `portal/site.js`
- `portal/site.css`
- `portal/stage.js`
- `portal/universe28.css` *(nowy)*
- `portal/universe28.js` *(nowy)*
- `etapy/28/index.html` *(nowy)*
- `laboratoria/granice-wszechswiata/index.html` *(nowy)*
- `tests/portal28.test.cjs` *(nowy)*
- `README_ETAP28.md` *(nowy)*

## Założenia naukowe

To laboratorium nie udaje pełnej mapy Wszechświata. Jego celem jest **intuicyjne pokazanie skali**. Dystanse są przybliżonymi wartościami referencyjnymi używanymi w popularyzacji astronomii. Wielkoskalowa sieć kosmiczna ma charakter ilustracyjny. Odległość do granicy obserwowalnego Wszechświata przyjęto jako promień około **46,5 miliarda lat świetlnych**.

## Jak używać

1. Otwórz etap 28.
2. Użyj suwaka albo przycisku „Autopilot”.
3. Skacz między punktami orientacyjnymi.
4. Porównuj czasy lotu i obserwuj, jak zmienia się dominująca skala przestrzeni.

## Uwaga techniczna

W tym środowisku nie publikowałem zmian bezpośrednio do Twojego repozytorium GitHub. Przygotowałem natomiast kompletną paczkę plików do wgrania.

## Wiarygodność danych

Odległości i rozmiary to odrębne wielkości: część punktów pokazuje odległość do obiektu, inne jego rozmiar (np. średnicę Drogi Mlecznej). Na osi używany jest wspólny rząd wielkości, natomiast czasy lotu wyłącznie porównują hipotetyczną drogę o tej długości. Rozszerzanie Wszechświata i ograniczenia kosmologiczne uniemożliwiają interpretowanie czasu `46,5 mld lat` jako realistycznego czasu dotarcia statku do granicy.

Odnośniki: [NASA — How Big is Space?](https://www.nasa.gov/science-research/astrophysics/how-big-is-space-we-asked-a-nasa-expert-episode-61/), [NASA — Voyager 1](https://science.nasa.gov/mission/voyager/voyager-1/).
