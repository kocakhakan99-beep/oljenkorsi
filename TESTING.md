# Testausraportti 4.11.2026

## Lisävarmennus 5.11.2026: kompassin päätössäännöt

- TypeScript-tarkistus ja ESLint läpäisivät; Vitestissä läpäisi 53 testiä neljästä tiedostosta.
- `npm run build` läpäisi ja tuotti päivitetyn itsenäisen `index.html`-tiedoston.
- `python -m py_compile e2e.py` läpäisi. Päivitetty selainpolku suoritettiin system Chromium 155:llä paikallisen HTTP-palvelimen kautta: kaikki 54 varmennusta läpäisivät, mukaan lukien kompassin aihekohtainen suodatus. Selaimessa ei havaittu JavaScript- tai konsolivirheitä eikä sovelluksen verkkopyyntöjä. `file://`-navigointi on edelleen ympäristön selainkäytännöllä estetty.
- Uudet yksikkötestit tarkistavat asumisosuuden rajauksen, vertailun oman kuluhistorian perusteella, FIRE-nostojen lähderajauksen, neuvontavinkin sekä `Ei onnistu nyt` -tilan tallentumisen ja määräajan. Käyttöliittymän testiin lisättiin myös siirto-, palautus- ja manuaalisen uudelleenarvioinnin polut.

## Suoritetut tarkistukset

- TypeScript strict `tsc --noEmit`, ESLint ja 37 Vitest-testiä läpäisivät.
- Vite production build ja standalone-jälkikäsittely tuottivat juureen itsenäisen `index.html`-tiedoston (noin 396 kB).
- Standalone-build varmistaa, että CSP lisätään tuotettuun HTML:ään eikä dokumenttiin jää ulkoisia script/link-tageja. Tailwind-luokat ja Lucide-kuvakkeet ovat mukana samassa bundle-tiedostossa.
- Playwrightillä suoritettiin 35 selainvarmennusta system Chromium 155:llä tuotetusta standalone-HTML:stä paikallisen localhost-palvelun kautta. Kaikki pääpolut läpäisivät, eikä JavaScript-, console- tai ulkoisia verkkovirheitä havaittu.
- Responsiivinen testi tarkisti yhteenvedon, budjetin, menot, skenaariot, raportit ja tuonnin/viennin 320, 375, 390, 600, 760 ja 768 pikselissä. Sivun leveys tai taulukkosäiliö ei ylittänyt näkymää, ja taulukkokortit aktivoituivat pienissä leveyksissä.
- `e2e.py` kattaa ohjelaatikon piilotuksen/palautuksen, summapikanapit, rivin näppäimistöavauksen, raportin jakson/kaavion/zoomin, valittavat raporttitietokortit sekä talousdatan vienti-, tuonti- ja palautuspolut. Tulokset ovat `qa/e2e-results.json`-tiedostossa.
- Suora `file://`-navigointi on hallitussa Chromiumissa estetty selaimen ylläpitokäytännöllä, joten tässä ajossa ei varmennettu offline-tilaa tai `file://`-tallennusta. Aiempi `qa`-ajon file/offline-tulos edeltää nykyisiä interaktioita ja ulkoasua.

## E2E:n sisältö

Suoritetussa E2E-ajossa: tyhjä aloitus; ohjeen piilotus/palautus; summa-pikanapit; tulo; toistuva meno; Enter/Space-avattava rivitieto; menon muokkaus; budjetin tallennus; omaisuus; velka; sijoitus; tavoite; kassavirta ja nettovarallisuus; kategorian nimeäminen; tumma tila ja summien piilotus; Ctrl K/Escape; kolme skenaariota; raportin ajanjakso, zoom ja kaaviot; valittavat raporttitietokortit; välilehtien näppäimistö; kuuden reitin responsiivisuus; selaimen uudelleenkäynnistys samalla profiililla; JSON-vienti; CSV-vienti/-tuonti ja virhe-/duplikaattiohitus; kumoaminen; poisto; JSON-palautus; virheellisen varmuuskopion hylkäys.

Ei sovelluksen verkkopyyntöjä, pageerror-virheitä tai console-error-viestejä tallennetussa aiemmassa ajossa. Nykyinen standalone-build säilyttää inline-tyylit, -kuvat ja -skriptin; staattinen lähdetagitarkistus ei korvaa selaimen verkkopyyntöjen mittausta. Selaimen taustapalvelujen liikennettä ei mitattu järjestelmätasolla.

## Yksikkötestit

Senttiparsinta, virheelliset luvut, kassavirta, käyttövara, säästöaste, nettovarallisuus, budjetti, hätävara, arvonalenema, tavoitteen kesto, velanmaksu, korkoa korolle, kulut, inflaatio, kuukausien loput, karkauspäivät, viikkotoistot, kuukausivälit, keskeytys, päivämäärävalidointi, JSON roundtrip/eheys/versio/prototyyppisuoja, CSV lainaus/rivinvaihdot/kaavasuoja/roundtrip/päivämuoto, storage roundtrip/poisto/ristiriita/kiintiö/esto.

## Mitä ei testattu

Edge, Firefox, Windows-työpöydän kaksoisklikkaus, fyysinen internetin katkaisu, kaikki neljä teemaa kattavasti, yksityinen selaus eri selaimissa, Excelin CSV-käyttäytyminen, ruudunlukija, täydellinen näppäimistöpolku, suorituskyky tuhansilla tietueilla, riippuvuuksien auditointi ja puhdas npm-asennus toisella koneella. React Testing Library -komponenttitestejä ei ole.

Pysyvän profiilin testaus epäonnistui aluksi ympäristön /mnt/data-tiedostojärjestelmään sijoitetulla selainprofiililla. Sama testi onnistui paikallisessa tilapäisessä profiilihakemistossa. Tämä oli testiprofiilin sijaintiin liittyvä ympäristörajoitus, ei syy muuttaa sovelluksen file://-jakelua.

## V1-hyväksyntä

Laajan alkuperäisen määrittelyn Definition of Done ei täyty. Toimitus on 0.1.0 ensimmäinen toimiva käyttöversio. Testilokit ja E2E-tulos löytyvät `qa/`-hakemistosta.
