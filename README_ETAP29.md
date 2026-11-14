# ATLAS SOLARIS 29.0 — Narodziny i śmierć gwiazdy

Etap 29 rozwija portal o **interaktywne laboratorium ewolucji gwiazd**.

## Co zostało dodane

- nowa podstrona: `/etapy/29/`
- nowe laboratorium: `/laboratoria/ewolucja-gwiazdy/`
- suwak masy gwiazdy od **0,1 do 40 mas Słońca**
- oś życia gwiazdy i przycisk automatycznego odtwarzania ewolucji
- różne tory rozwoju w zależności od masy:
  - czerwony karzeł
  - gwiazda podobna do Słońca
  - gwiazda masywna
  - gwiazda bardzo masywna
- końcowe stadia:
  - biały karzeł
  - gwiazda neutronowa
  - czarna dziura
- uproszczony wykres **Hertzsprunga–Russella**
- aktualizacja portalu: **28 doświadczeń** (01–26, 28 i 29)

## Nauka i uproszczenia

To model dydaktyczny. Zależności masa–jasność–czas życia są przybliżone, a przebiegi po diagramie HR mają charakter ilustracyjny. Nie uwzględniamy np. dokładnej metaliczności, rotacji, układów podwójnych ani pełnej fizyki utraty masy.

## Pliki dodane lub zmienione

- `portal/data.js`
- `portal/catalog.json`
- `portal/site.js`
- `portal/site.css`
- `portal/star29.css` *(nowy)*
- `portal/star29.js` *(nowy)*
- `etapy/29/index.html` *(nowy)*
- `laboratoria/ewolucja-gwiazdy/index.html` *(nowy)*
- `tests/portal27.test.cjs`
- `tests/portal29.test.cjs` *(nowy)*
- `tests/browser_smoke.py`
- `README_ETAP29.md` *(nowy)*

## Uwaga techniczna

Etap 29 został przygotowany lokalnie przed etapem 30, a następnie opublikowany razem z nim. Laboratorium jest samodzielnym modułem i nie wymaga modyfikacji klasycznego `atlas.html`. Dla gwiazd powyżej 20 mas Słońca orientacyjne życie zostało ograniczone od dołu do ok. 3 mln lat, aby nie wyświetlać nierealistycznie krótkich czasów przy prostym prawie potęgowym.
