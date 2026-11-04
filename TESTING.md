# Testausraportti 4.11.2026

## Suoritetut tarkistukset

- 4.11 lähdekoodista: TypeScript strict `tsc --noEmit`, ESLint ja 37 Vitest-testiä läpäisivät.
- Vite production build ja standalone-jälkikäsittely tuottivat juureen itsenäisen `index.html`-tiedoston (noin 396 kB).
- Standalone-build varmistaa, että CSP lisätään tuotettuun HTML:ään eikä dokumenttiin jää ulkoisia script/link-tageja. Tailwind-luokat ja Lucide-kuvakkeet ovat mukana samassa bundle-tiedostossa.
- Hallitun työympäristön selain-E2E:n uudelleenajo estyi: Playwrightin oletus-Chromiumia ei ole asennettu. Ympäristön `/usr/bin/chromium` kaatuu `setsockopt: Operation not permitted` -virheeseen ja SIGTRAPiin myös `--no-sandbox`-tilassa. Siksi tämän muutoksen jälkeen ei ole uutta selainvarmennusta.
- `e2e.py` sisältää nyt myös yhteenvedon pikatoiminnot sekä kuluraportin tietokortin, piirakkasektorin näppäimistöaktivoinnin, rahavirtapäivän ja kuukausipylvään avauspolut; ne odottavat selainympäristössä suoritusta.
- `qa/e2e-results.json` sisältää 3.11.2026 tallennetun aiemman offline/file://-ajon (23 hyväksyttyä tarkistusta); se edeltää nykyisiä raporttien interaktioita ja Tailwind/Lucide-ulkoasumuutosta.

## E2E:n sisältö

Tallennetussa aiemmassa E2E-ajossa: onboarding tyhjästä; tulo; toistuva meno; menon muokkaus; budjetti; omaisuus; velka; sijoitus; tavoite; kassavirran ja nettovarallisuuden tarkistus; kategorian nimeäminen; teema ja tumma tila; summien piilotus; Ctrl K/Escape; kolme skenaariota; raporttitaulukko; selainprosessin sulkeminen ja uudelleenavaaminen samalla profiililla; JSON-vienti; CSV-vienti; CSV-tuonti virhe- ja duplikaattiohituksella; tuonnin kumoaminen; tietueen poisto/kumoaminen; kaiken datan poisto; JSON-palautus; väärän backupin hylkäys.

Ei sovelluksen verkkopyyntöjä, pageerror-virheitä tai console-error-viestejä tallennetussa aiemmassa ajossa. Nykyinen standalone-build säilyttää inline-tyylit, -kuvat ja -skriptin; staattinen lähdetagitarkistus ei korvaa selaimen verkkopyyntöjen mittausta. Selaimen taustapalvelujen liikennettä ei mitattu järjestelmätasolla.

## Yksikkötestit

Senttiparsinta, virheelliset luvut, kassavirta, käyttövara, säästöaste, nettovarallisuus, budjetti, hätävara, arvonalenema, tavoitteen kesto, velanmaksu, korkoa korolle, kulut, inflaatio, kuukausien loput, karkauspäivät, viikkotoistot, kuukausivälit, keskeytys, päivämäärävalidointi, JSON roundtrip/eheys/versio/prototyyppisuoja, CSV lainaus/rivinvaihdot/kaavasuoja/roundtrip/päivämuoto, storage roundtrip/poisto/ristiriita/kiintiö/esto.

## Mitä ei testattu

Edge, Firefox, Windows-työpöydän kaksoisklikkaus, fyysinen internetin katkaisu, kaikki neljä teemaa kattavasti, yksityinen selaus eri selaimissa, Excelin CSV-käyttäytyminen, ruudunlukija, täydellinen näppäimistöpolku, suorituskyky tuhansilla tietueilla, riippuvuuksien auditointi ja puhdas npm-asennus toisella koneella. React Testing Library -komponenttitestejä ei ole.

Pysyvän profiilin testaus epäonnistui aluksi ympäristön /mnt/data-tiedostojärjestelmään sijoitetulla selainprofiililla. Sama testi onnistui paikallisessa tilapäisessä profiilihakemistossa. Tämä oli testiprofiilin sijaintiin liittyvä ympäristörajoitus, ei syy muuttaa sovelluksen file://-jakelua.

## V1-hyväksyntä

Laajan alkuperäisen määrittelyn Definition of Done ei täyty. Toimitus on 0.1.0 ensimmäinen toimiva käyttöversio. Testilokit ja E2E-tulos löytyvät `qa/`-hakemistosta.
