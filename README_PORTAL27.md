# ATLAS SOLARIS 27.0 — portal astronomiczny

Nowa strona główna i prawdziwe podstrony z indywidualnymi adresami bez potrzeby kupowania domeny.

## Struktura

- `/` → strona główna, katalog 26 etapów, 6 działów, wyszukiwanie i animacja artystyczna.
- `/etapy/01/` … `/etapy/26/` → samodzielne podstrony wszystkich głównych etapów.
- `/laboratoria/.../` → 6 dodatkowych podstron rozszerzeń 17.1–25.1.
- `/dzialy/.../` → 6 stron z katalogiem wybranej dziedziny.
- `/o-projekcie/` → charakter projektu, źródła i ograniczenia.
- `/atlas.html` → zachowany kompletny Atlas 26.0 wraz ze wszystkimi laboratoriami.
- `/portal/embed.js` i `/portal/embed.css` → zgodnościowa adaptacja istniejących laboratoriów do pełnego ekranu; nie zmieniają ich algorytmów.

## Architektura i ograniczenia

Laboratoria 10–26 wciąż korzystają z oryginalnego silnika 26.0; na nowych podstronach są osadzane przez iframe tej samej domeny. Wysuwane okienka **wizualnie i nawigacyjnie** zastąpiono ekranami poszczególnych podstron, jednak komponent HTML `dialog` nadal działa wewnątrz osadzonego silnika, aby zachować jego funkcjonalność bez przepisywania 26 etapów. Jest to **bezpieczny etap migracji**, a nie całkowite rozdzielenie bibliotek w niezależne aplikacje. Każda podstrona wciąż wczytuje silnik Atlasu i duże efemerydy; pełna optymalizacja jest możliwa później.

Etapy 1–9 są tematycznymi wejściami do obecnego programu, nie archiwalnymi historycznymi wersjami. Wersja 25.1 i 17.1–17.3 mają osobne rozszerzenia.

Mapa orbit w nagłówku jest **dekoracyjna**, jej rozmiary, tempo i pozycje nie są efemerydami; właściwe laboratoria pokazują modele naukowe wraz z ograniczeniami w dotychczasowym README.

## Publikacja

1. Otwórz istniejące repozytorium `gawierzba/atlas-solaris`.
2. Przed instalacją utwórz gałąź kopii zapasowej z bieżącego `main`.
3. Zachowaj dotychczasowy `index.html` jako `atlas.html`.
4. Skopiuj wszystkie pliki z paczki do katalogu głównego, włączając nowy `index.html` i podstrony.
5. Do `atlas.html` dodaj w `<head>` na końcu listy stylów `<link rel="stylesheet" href="portal/embed.css">` i tuż przed `</body>` `<script src="portal/embed.js"></script>`.
6. Wdróż na GitHub Pages bez zmian ustawień domeny.

Instalator `instaluj_portal27.py` wykonuje kroki 3–5 automatycznie na sklonowanym repozytorium.

## Testy

`node tests/portal27.test.cjs`  
`node --check portal/site.js`  
`node --check portal/stage.js`  
`node --check portal/embed.js`

Zachowane testy astronomiczne pozostają uruchamiane przez GitHub Actions.
