# Ominaisuuksien nykytila

Päivitetty 19.11.2026. Tämä lista kuvaa sovelluksen koodia; toiminnon toteutus ja sen käytännön varmennus ovat eri asioita. Tarkempi kartoitus: [auditointi](AUDIT_2026-11-19.md).

| Ominaisuus | Tila ja rajaus |
| --- | --- |
| Tulot, menot, varat, velat, sijoitukset ja tavoitteet | Toteutettu; kirjaukset ja toistuvuus ovat käyttäjän omia tietoja. |
| Budjetti, vertailu ja kuukausitarkistus | Toteutettu; uusien toimintojen kattava regressiovarmennus kesken. |
| Vuosikello ja hintahistoria | Toteutettu; varaus ei todista pankkimaksua. Reunatapauksia varmennetaan. |
| Laskurit, raportit, kompassi ja kokeilutila | Toteutettu; kokeilu säilyy välilehden muistissa. |
| Kuitti- ja laskutuonti | Tekstimuotoinen PDF, käyttäjän tarkistamat AI-ehdotukset ja suomalaisen virtuaaliviivakoodin lukeminen selaimessa; OCR ja kameran viivakoodiluku puuttuvat. |
| Kirjautuminen | Google käytössä; Apple-vaihtoehdon todellista tuotantotoimivuutta ei ole varmennettu. |
| Pilvitallennus ja perhetilit | Automaattitallennus, revisiot, kutsut ja jäsenhallinta toteutettu. Kahden käyttäjän kokonaiskoe on avoin. |
| Vieraskäyttö | Talous on välilehden muistissa; JSON on täydellinen varmuuskopio. |
| Julkaisu | GitHub Pages seuraa `codex/fire-expense-types`-haaraa. `cloud-save` validoi kirjoitusversion 0.4.0. |
| Offline/PWA ja pankkiyhteydet | Eivät kuulu nykyiseen toteutukseen. |

Korjausten eteneminen ja hyväksyntäkriteerit: [toteutussuunnitelma](KORJAUSSUUNNITELMA_2026-11-19.md).

## Korjauskierros 19.11.2026

- Repositorion yksityisten kuittien historia puhdistettu julkaisuhaaroista; GitHubin PR-viitteiden poisto odottaa Supportia. Katso [tietotarkistus](REPOSITORY_SECURITY_2026-11-19.md).
- Vuosikellon, hintahistorian, budjettikopion ja kokeilun regressioita lisätty: nykyinen testiajo 30 tiedostoa / 229 testiä. Laajempi selain-/oikeusvarmennus on edelleen avoin.
- Käyttämättömien symbolien TypeScript-tarkistus käytössä, käynnistysnäkymä erotettu komponentiksi ja tarkistava CI-työnkulku lisätty. CI:n GitHub-ajo vahvistetaan erikseen.
- Laskuviivakoodin toteutus rajattu Suomeen; myöhemmässä erässä lisättiin virtuaaliviivakoodin liittäminen.

### Seuraava korjauserä 19.11.2026

- Poistettu käytöstä estetty manuaalinen perheen lataus-/tallennuspolku ja sitä palvellut revisiotila. Nykyinen pilvijono ja vanhojen varmuuskopioiden palautustuki säilyvät.
- Tuonti ja vienti -näkymä siirretty `components/transfer.tsx`-moduuliin.
- Poistettu enää testeissä käytetty tulevien menojen laskentamoduuli sekä käytöstä poistettujen painikkeiden CSS-säännöt.
- Testimäärä on nyt 28 tiedostoa / 226 testiä; kolmen testin poistuminen johtuu poistetuista tuotantomoduuleista.

### Laskurinäkymän moduulijako 19.11.2026

Laskurit ja yhteiset numerokontrollit, kalenteri sekä lainalaskelman erittely ovat omissa komponenteissaan. main.tsx pieneni tässä erässä noin 900 rivillä (jäljellä 8 039). Sivujen laiska lataus ja CSS:n laajempi ryhmittely ovat edelleen tekemättä; tiedostojakoa ei pidetä osoitettuna nopeusparannuksena.

### Raporttien ja asetusten moduulijako 19.11.2026

Aikarajaus, kuukausivalitsin, taulukon kontrollit, rahavirran paneeli sekä asetusten välilehdet/ulkoasu/budjettiraamit erotettu. main.tsx on nyt 7 423 riviä. Raporttien laskenta säilyy vielä Appissa. Seuraava erä erotti myös varallisuus-/velka-/FIRE-paneelit ja tietojenhallinta-asetukset, ks. alla. Selainregressio: e2e_reports_settings.py.

### Varallisuusraportit ja tietojenhallinta 19.11.2026

Varallisuuden, velkojen ja FIREn paneelit sekä tietojenhallinta-asetukset on erotettu. Niiden laskenta ja tallennuksen ohjaus säilyvät yhteisinä. main.tsx on 6 923 riviä. Raporttien yleiskuva, kulurakenne, budjettiraportti ja valinnan erittely ovat vielä erottamatta. Laajennettu selainregressio varmistaa fiktiivisen omaisuus-/velka-aineiston luvut sekä poistovahvistuksen ja perumisen.

### Raporttipaneelien erottaminen valmis 19.11.2026

Myös yleiskuva, kulurakenne, budjettiraportti ja raporttivalinnan tietokortti ovat omissa komponenteissaan. Yhteiset valinta-/rivityypit ovat domain/report-model.ts-moduulissa. Kaikki raporttipaneelit on erotettu; raporttidatan koostaminen ja sovelluksen yhteinen ohjaus ovat yhä Appissa. main.tsx on nyt 5 906 riviä. Selainregressio kattaa kaikkien paneelien mobiilirajat ja uusien siirtojen valinta-/erittelypolut.

### Raporttidatan koostaminen erotettu 19.11.2026

Aikasarjat, varallisuus-/FIRE-koosteet, kategoriat ja rahavirta ovat report-series.ts-moduulissa; taulukoiden suodatus/lajittelu report-tables.ts:ssä ja valinnan erittely report-selection.ts:ssä. App säilyttää rajauksen ja valintojen ohjauksen. main.tsx on 5 419 riviä. Kahdeksan uutta koostetestiä läpäisi, kokonaismäärä 29 tiedostoa / 234 testiä; molemmat selainregressiot läpäisivät. Yhteiset tapahtumien tilasäännöt käyttävät edelleen sovelluksen nykyhetkeä; asOf-parametri koskee arvostuspäivän valintaa, ei koko raportin aikamatkustussimulaatiota.

### Kategoriat ja kuukausivahvistukset 19.11.2026

Kategorioiden hallinta on nyt omassa komponentissaan. Kategorian nimeäminen ja kuukausivahvistusten avaaminen muutosten jälkeen on erotettu domain-moduuleihin. Korjattu virhe, jossa nimen reunavälilyönnit saattoivat poistaa saman kategorian budjetti- ja toteuma-avaimet. Tallennusskeema ja kategoriaviitteiden nimipohjaisuus säilyvät; pysyvien ID-viitteiden migraatio on edelleen tekemättä. main.tsx on 5 045 riviä. Kokonaismäärä on 31 testitiedostoa / 253 testiä.
