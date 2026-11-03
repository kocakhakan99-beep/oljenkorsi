# Testausraportti 3.11.2026

## Suoritetut tarkistukset

- TypeScript strict `tsc --noEmit`: läpäisi.
- ESLint: läpäisi. Käytössä rajattu syntaksi- ja virhesääntöjoukko, ei täydellinen React/a11y-lintaus.
- Vitest: 31 testiä, 2 tiedostoa, kaikki läpäisivät.
- Vite production build ja standalone-jälkikäsittely: onnistuivat.
- Playwright E2E: file://, offline=True ennen sivun avaamista, Google Chrome for Testing 149.0.7827.55, Linux headless.

## E2E:n sisältö

Onboarding tyhjästä; tulo; toistuva meno; menon muokkaus; budjetti; omaisuus; velka; sijoitus; tavoite; kassavirran ja nettovarallisuuden tarkistus; kategorian nimeäminen; teema ja tumma tila; summien piilotus; Ctrl K/Escape; kolme skenaariota; raporttitaulukko; selainprosessin sulkeminen ja uudelleenavaaminen samalla profiililla; JSON-vienti; CSV-vienti; CSV-tuonti virhe- ja duplikaattiohituksella; tuonnin kumoaminen; tietueen poisto/kumoaminen; kaiken datan poisto; JSON-palautus; väärän backupin hylkäys.

Ei sovelluksen verkkopyyntöjä, pageerror-virheitä tai console-error-viestejä näissä poluissa. file://-dokumentin lataus ei ole verkkopyyntö. Selaimen taustapalvelujen liikennettä ei mitattu järjestelmätasolla.

## Yksikkötestit

Senttiparsinta, virheelliset luvut, kassavirta, käyttövara, säästöaste, nettovarallisuus, budjetti, hätävara, arvonalenema, tavoitteen kesto, velanmaksu, korkoa korolle, kulut, inflaatio, kuukausien loput, karkauspäivät, viikkotoistot, kuukausivälit, keskeytys, päivämäärävalidointi, JSON roundtrip/eheys/versio/prototyyppisuoja, CSV lainaus/rivinvaihdot/kaavasuoja/roundtrip/päivämuoto, storage roundtrip/poisto/ristiriita/kiintiö/esto.

## Mitä ei testattu

Edge, Firefox, Windows-työpöydän kaksoisklikkaus, fyysinen internetin katkaisu, kaikki neljä teemaa kattavasti, yksityinen selaus eri selaimissa, Excelin CSV-käyttäytyminen, ruudunlukija, täydellinen näppäimistöpolku, suorituskyky tuhansilla tietueilla, riippuvuuksien auditointi ja puhdas npm-asennus toisella koneella. React Testing Library -komponenttitestejä ei ole.

Pysyvän profiilin testaus epäonnistui aluksi ympäristön /mnt/data-tiedostojärjestelmään sijoitetulla selainprofiililla. Sama testi onnistui paikallisessa tilapäisessä profiilihakemistossa. Tämä oli testiprofiilin sijaintiin liittyvä ympäristörajoitus, ei syy muuttaa sovelluksen file://-jakelua.

## V1-hyväksyntä

Laajan alkuperäisen määrittelyn Definition of Done ei täyty. Toimitus on 0.1.0 ensimmäinen toimiva käyttöversio. Testilokit ja E2E-tulos löytyvät `qa/`-hakemistosta.
