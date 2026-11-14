# ATLAS SOLARIS — ETAP 27.0
## Narodziny portalu · kamień milowy architektury

**Status:** ukończony etap historyczno-architektoniczny, obecnie z własną podstroną `/etapy/27/`.

Ten numer nie był przeznaczony na oddzielny eksperyment fizyczny. Został przyznany przebudowie ATLAS SOLARIS 26.0 z jednej aplikacji w portal astronomiczny z odrębnymi podstronami. Numerację 1–31 świadomie **pozostawiono bez przesunięć**, aby zachować historię, odnośniki i dokumentację kolejnych prac.

## Co zrealizowano w pierwotnym etapie 27.0

1. Nowa strona główna i katalog działów.
2. Sześć sekcji tematycznych: światy i orbity, misje kosmiczne, zjawiska, gwiazdy i czas, relatywistyka, laboratoria naukowe.
3. Osobne adresy `/etapy/01/` do `/etapy/26/`, na początku zbudowane jako wejścia tematyczne do wspólnego silnika.
4. Osobne strony rozszerzeń (`/laboratoria/...`) i stron kategorii (`/dzialy/...`).
5. Zachowanie pełnej wersji dotychczasowego programu jako `/atlas.html`.
6. Adaptacja istniejących doświadczeń poprzez `portal/embed.js` i `portal/embed.css`, bez przepisywania fizyki od zera.
7. Podstawowa nawigacja i możliwość publikowania kolejnych niezależnych podstron w GitHub Pages.

**Ważne:** w pierwotnej wersji 27.0 osadzone laboratoria nadal korzystały z mechanizmu `iframe` i części dotychczasowych elementów `dialog`. „Osobna podstrona” nie znaczyła wtedy „osobny niezależny silnik obliczeniowy”.

Źródłem opisu jest oryginalna dokumentacja [README_PORTAL27.md](README_PORTAL27.md). Ta historyczna dokumentacja została zachowana, nie zastąpiona retroaktywnym opisem.

## Co dodano teraz, aby etap miał własną stronę

- `/etapy/27/index.html` — powłoka zgodna z nawigacją pozostałych etapów (26 ← 27 → 28), panel informacyjny i źródła.
- `/opowiesc/narodziny-atlasu/index.html` — pełna, interaktywna opowieść o narodzinach portalu.
- `/portal/origin27.css` — niezależna, responsywna warstwa wizualna.
- `/portal/origin27.js` — dostępny przełącznik architektury „przed / po”, dekoracyjna animacja sieci laboratoriów, komunikat gotowości dla portalu.
- Aktualizacja `portal/data.js`, `portal/catalog.json`, `portal/site.js`, `index.html`: katalog zawiera **31 numerowanych etapów**, a numer 27 jest oznaczony jako *kamień milowy*, nie jako brak lub eksperyment fizyczny.

## Zasady wiarygodności

- Oś rozwoju pokazuje wybrane **numery etapów**, nie daty odkryć naukowych ani dokładny harmonogram.
- Ilustracja „przed / po” to autorski **schemat interfejsu i architektury**, nie archiwalne zrzuty ekranu.
- Animowana grafika przedstawia ideę połączonych laboratoriów — nie realne orbity ani efemerydy.
- Zachowano etapy 1–26, 28–31 i ich adresy bez renumeracji. Niczego nie przenoszono ani nie usuwano.

## Weryfikacja

```bash
node tests/origin27.test.cjs
node tests/portal27.test.cjs
```

Osobny test sprawdza kompletność numerów, obecność strony historycznej, poprawność tras i istnienie oryginalnej dokumentacji. Testy GitHub Actions nie powinny ponownie wprowadzać stałej liczby wcześniejszych etapów.
