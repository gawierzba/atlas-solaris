# ATLAS SOLARIS 30.0 — Taniec Gwiazd Podwójnych

Samodzielne laboratorium astroﬁzyki układów podwójnych, które w portalu 28.0 rozwija etapy 29 i 30.

## Nowe strony

- `/etapy/29/` – Narodziny i śmierć gwiazdy (wcześniej przygotowane lokalnie, obecnie publikowane razem z etapem 30)
- `/etapy/30/` – Taniec Gwiazd Podwójnych
- `/laboratoria/ewolucja-gwiazdy/` – samodzielny etap 29
- `/laboratoria/gwiazdy-podwojne/` – samodzielny etap 30

## Fizyka

1. **III prawo Keplera:** \(P=2π\sqrt{a^3/(G(M_1+M_2))}\) dla orbity kołowej o separacji środków \(a\).
2. **Promień Roche’a Eggletona (1983):** \(R_{L,1}/a=0{,}49q^{2/3}/(0{,}6q^{2/3}+\ln(1+q^{1/3}))\), \(q=M_1/M_2\). Jest to *promień kuli o tej samej objętości co krytyczny płat Roche’a*, a nie odległość punktu L1 od środka gwiazdy.
3. **L1:** numerycznie rozwiązywane równanie równowagi w obracającym się układzie znormalizowanym (obserwowana pozycja względem donora jest rzeczywiście obliczona).
4. **Krytyczny potencjał Roche’a:** ekwipotencjalna krzywa w płaszczyźnie orbity, na poziomie wartości potencjału w punkcie L1, liczona na siatce metodą interpolacji; wizualizacja przeliczana przy zmianie mas.
5. **Krzywa blasku:** geometria kołowych tarcz gwiazd, ich wzajemne zasłanianie i model przyjętej jasności. Sygnał nie uwzględnia rzeczywistego poczerwienienia brzegowego, odbić, elipsoidalnych deformacji ani transportu promieniowania.

## Użytkowanie

- Zmień masę donora i towarzysza, odległość, poziom wypełnienia Roche’a i nachylenie do obserwatora.
- Wybierz białego karła, zwykłą gwiazdę, gwiazdę neutronową albo czarną dziurę jako towarzysza.
- Zobacz, jak przy **100% wypełnienia Roche’a** uruchamia się animacja przepływu przez punkt L1 do zwartego towarzysza.
- Włącz „kamera zgodna z nachyleniem obserwatora”, aby zobaczyć układ z perspektywy użytej do obliczeń zaćmień.
- Zmiana masy i odległości zmienia okres orbitalny, rozmiar płatów Roche’a i pozycję L1.
- Presety: przelew Roche’a, zaćmienia, układ z gwiazdą neutronową, czarna dziura i układ oderwany.

## Ograniczenia

- Układy kołowe, obrót zsynchronizowany w przybliżeniu Roche’a.
- Początkowe masy i separacja pozostają stałe nawet podczas widocznej animacji strumienia; nie modelujemy dynamicznej zmiany orbity ani historii układu.
- Wizualne rozmiary białych karłów, gwiazd neutronowych i czarnych dziur są powiększane dla czytelności. Czarne dziury obrazowane są schematycznie.
- Światło dysku akrecyjnego jest **względną arbitralną jasnością ilustracyjną**, nie obserwacyjnie wyznaczonym strumieniem. Krytyczny kontur Roche’a jest przekrojem 2D potencjału, a nie powierzchnią 3D.
- Próg wystąpienia trwałego, stabilnego przelewu materii nie zależy wyłącznie od prostego warunku \(R_1\ge R_{L,1}\). Wynik pokazuje kontakt z objętościowym płatem Roche’a i możliwy kierunek przepływu; nie rozstrzyga stabilności.

## Źródła

- Eggleton, P. P. (1983), *Approximations to the radii of Roche lobes*, ApJ 268, 368, https://ui.adsabs.harvard.edu/abs/1983ApJ...268..368E/abstract
- Siess et al. (2013), *BINSTAR: a new binary stellar evolution code*, https://doi.org/10.1051/0004-6361/201220327
- Podstawa krzywych zaćmieniowych: geometryczne nakładanie się dwóch dysków o stałej jasności powierzchniowej.

## Testowanie

`node tests/binary30.test.cjs`

Po publikacji poprzedni stan jest zachowany w gałęzi `backup-v28-before-binaries30`.
