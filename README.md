# ATLAS SOLARIS 8.0 — Światy Jowisza

Interaktywne planetarium i laboratorium astronomiczne z modułami orbit, widoków z powierzchni, gwiazd, zaćmień oraz czterech księżyców Galileuszowych.

## Uruchomienie

Po włączeniu GitHub Pages (Settings → Pages → Deploy from a branch → main → /root) aplikacja będzie dostępna pod adresem https://gawierzba.github.io/atlas-solaris/.

Projekt jest statyczny, więc nie wymaga serwera aplikacyjnego. W repozytorium kod jest rozdzielony na `index.html`, `css/` oraz `js/`. Do uruchomienia lokalnego wieloplikowej wersji użyj np. `python -m http.server 8000` i otwórz `http://localhost:8000`. Z poziomu `file://` przeglądarka może blokować moduły JavaScript.

## Ograniczenia

- Położenia i orientacje oparte na uproszczonych modelach astronomicznych; nie służą do precyzyjnej nawigacji ani prognozowania kontaktów zaćmień.
- Model księżyców Jowisza wykorzystuje przybliżenia Meeusa, a nie pełne efemerydy JUP365.
- Niektóre powierzchnie, atmosfery i krajobrazy są ilustracyjne. Ziemia ma mapę NASA Blue Marble, a atlas gwiazd używa danych HYG (CC BY-SA 4.0).
- Widok historycznego tranzytu z 24.01.2015 jest rekonstrukcją przybliżoną.

## Źródła

[NASA/JPL — elementy orbit planet](https://ssd.jpl.nasa.gov/planets/approx_pos.html) · [JPL — elementy księżyców](https://ssd.jpl.nasa.gov/sats/elem/) · [NASA — Blue Marble](https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/) · [Astronexus HYG](https://github.com/astronexus/HYG-Database).

Repozytorium zawiera kod aplikacji, osadzone dane i tekstury (w plikach JavaScript), aby strona działała bez dodatkowych usług zewnętrznych.
