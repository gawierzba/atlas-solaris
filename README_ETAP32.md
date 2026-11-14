# ATLAS SOLARIS 32.0 — Pulsar. Kosmiczna latarnia

## Ścieżki i budowa
- Podstrona etapu: `/etapy/32/`
- Laboratorium: `/laboratoria/pulsar/`
- Obliczenia: `/portal/pulsar32-core.js`
- Interfejs, animacja przestrzenna, wykresy i audio: `/portal/pulsar32-ui.js`
- Responsywne style: `/portal/pulsar32.css`
- Testy modelu: `/tests/pulsar32.test.cjs`

## Model fizyczny
Kąt osi magnetycznej od osi rotacji: α; kąt obserwatora od osi rotacji: ζ; faza obrotu: φ.
Kąt między osią magnetyczną a obserwatorem:

`cos γ = cos α cos ζ + sin α sin ζ cos φ`

Kierunek przeciwnego bieguna ma odległość kątową `180°−γ`. Natężenie w uproszczonym modelu:

`I(γ) = exp[-ln(2) · (γ/ρ)²]`

Zatem w kącie `ρ` natężenie jest połową maksimum. Drugi biegun jest mnożony przez czynnik 0.48. Profile są syntetyczne i nie oznaczają rzeczywistych rozkładów kątowych radioemisji.

Okres obrotu P wybierany jest w zakresie około 1.6 ms do 1.8 s. `f=1/P` podaje częstotliwość wirowania. Sygnał generujemy numerycznie w przedziale 9 okresów, ze zdefiniowanym zaszumieniem losowym; można badać okres funkcją autokorelacji. Przy dwóch impulsach na obrót możliwa jest niejednoznaczność harmonicznych. Nie narzucamy prezentacji fałszywie precyzyjnych pomiarów dla nieobserwowalnych sygnałów.

## Interakcje
- Obracanie kamery myszą albo palcem.
- Presety: ~33 ms, ~89 ms, 5 ms, brak sygnału.
- Kąty α i ζ, szerokość wiązki ρ, okres P, względne tempo animacji, szum.
- Wykres fazowy profilu na jeden obrót.
- Syntetyczny radioteleskop z zakłóceniami i próbkami sygnału.
- Przycisk do analizy okresowości oraz wynik pomiaru.
- Sonifikacja poprzez Web Audio API (uruchamiana wyłącznie przez kliknięcie użytkownika).
- Przyciski odtwarzania, resetu kamery i całego laboratorium.

## Ograniczenia i uczciwość naukowa
- Geometryczny model obrotowej wiązki; struktura magnetosfery, polaryzacja, emisja koherentna, hamowanie rotacji, rozpraszanie radiowe i efekty grawitacyjne nie są modelowane.
- Linie dipolowe, gwiazda i stożki są obrazem poglądowym, **nie są** skalowane w kilometrach.
- Dźwięk to umowna sonifikacja w tempie animacji. Pulsar o okresie 5 ms naprawdę wykonuje 200 obrotów/s, ale model przestrzenny celowo obraca się wolniej.
- 33 ms i 89 ms nawiązują do typowych okresów odpowiednio pulsara Krab i Vela, nie wykorzystujemy rzeczywistych pomiarów ani rzeczywistej geometrii tych obiektów.
- Autokorelacja bada własny sygnał syntetyczny i w szumie może nie dać jednoznacznego wyniku.
- Brak zewnętrznych zależności i sieciowych żądań potrzebnych do działania doświadczenia.

## Źródła
- NASA Imagine the Universe, neutron stars and pulsars — https://imagine.gsfc.nasa.gov/science/objects/neutron_stars1.html
- NASA Hubble, Pulsars — https://science.nasa.gov/mission/hubble/science/science-behind-the-discoveries/hubble-pulsars/
- NASA ATNF Pulsar Catalog — https://catalog.data.gov/dataset/atnf-pulsar-catalog

Testy: `node --test tests/pulsar32.test.cjs`.