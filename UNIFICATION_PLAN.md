# Sovelluksen toimintojen yhtenäistäminen

Päivitetty 12.11.2026. Käyttäjän pyynnöstä päällekkäisiä työnkulkuja vähennetään. Pikapainike saa olla useassa paikassa, mutta se avaa saman toiminnon samoilla käsitteillä ja tallennustavalla.

| Toiminto | Pääpaikka | Muut näkymät |
| --- | --- | --- |
| Tulon tai menon kirjaus ja sarjan muokkaus | Tulot / Menot, yhteinen kirjauslomake | Yhteenveto, budjetti ja haku avaavat saman lomakkeen esitäytettynä |
| PDF-kuittiskannaus | Menot, yhteinen avattava skanneri | Budjetin pikapainike, Tulot/Menot/Budjetti/Asetukset PDF-pudotus ja Tuonti ja vienti -siirtymä avaavat saman työkalun |
| Päivittäinen toteuma | Menojen tapahtumat | Budjetti ja raportit laskevat toteuman kirjauksista |
| Kategorian kokonaistoteuman poikkeus | Budjetin kategoriakortin edistyneet korjaukset | Budjettitaulukossa näkyy arvo ja lähde, ei toinen rinnakkainen perussyöttö |
| 50/30/20:n ja kategoriarajojen muokkaus | Asetukset | Budjetti näyttää raamit ja linkin muokkaukseen; Tulot/Menot näyttävät tiiviin tilan; kompassi ehdottaa tarkistusta |
| Tapahtuman tila ja summapoikkeus | Tulot/Menot, tapahtuman lisätiedot | Sarjan lomake muuttaa sarjaa, ei poikkeuksia |
| Analyysi | Raportit | Muut näkymät ovat yhteenvetoja ja linkkejä |
| Ohjaus ja ehdotukset | Talouden kompassi | Toimenpide ohjaa toiminnon pääpaikkaan |
| Varmuuskopiot ja tiedostosiirto | Tuonti ja vienti | Asetuksissa linkki tähän; palautuksen turvapainikkeet säilyvät poikkeustilanteissa |

Toteutus: yhdistetään tulojen/menojen lisäys ja muokkaus samaan suppeaan lomakkeeseen, jossa kaikki kahdeksan toistuvuutta, loppupäivä, aktiivisuus, tunnisteet ja muut lisätiedot säilyvät. Kopiointi luo uuden kirjauksen; muokkaus säilyttää ID:n ja esiintymäpoikkeukset. Rahojen siirtoja tai vanhoja manuaalisia toteumia ei muuteta automaattisesti.

Ohjeen korjaus: päiväperusteinen toteuma ei ole pankkivarmennus. Kategorian kokonaistoteuma on erillinen poikkeus, ei toinen tapa kirjata maksuja kassavirtaan. Hätävaran tyhjän ja täytetyn yhteenvedon näkymät käyttävät jo samaa komponenttia vaihtoehtoisesti, joten niitä ei yhdistellä keinotekoisesti.

## Tila

- [x] Yhteinen tulo-/menolomake lisäämiseen ja muokkaukseen; pikatoiminnot avaavat saman lomakkeen.
- [x] Kaikki kahdeksan toistuvuutta sekä loppupäivä, aktiivisuus, tunnisteet ja monirivinen kuvaus myös uudessa kirjauksessa.
- [x] Muokkaus säilyttää ID:n ja yksittäisten tapahtumien poikkeukset.
- [x] Budjetin päätaulukko näyttää toteuman; kokonaistoteuman erillinen korjaus on kategoriakortin lisävalinta.
- [x] 50/30/20:n näyttö on budjetissa; prosenttien ja kategoriarajojen ainoa muokkauspaikka on Asetukset. Budjetista on linkki muokkaukseen.
- [x] Listojen haku ja kategoriavalinta ovat taulukon kanssa samassa kortissa; tapahtumatila rajaa vain tuloja ja menoja; lajittelu toimii sarakeotsikoista ja mobiilivalikosta.
- [x] Sijoituskohteen katalogivalinta yhdistetty sijoituksen lisäys-/muokkauslomakkeeseen; valinta esitäyttää nimen, kategorian ja päivätyn hinnan.
- [x] Viiva- ja aluekaaviot erottuvat; pitkät budjettiohjeet ovat lisätietona ja tärkeä päätösvaroitus näkyy.
- [x] Tavallinen varmuuskopiointi keskitetty Tuonti ja vienti -näkymään; Asetuksissa navigointilinkki.
- [x] 77 yksikkötestiä, 62 selainvarmennusta, TypeScript, ESLint ja standalone-build läpäisevät.
- [x] Seuraavan UX-kierroksen [12-tasoinen esittämismalli](UX_PRESENTATION_MODEL.md) dokumentoitu ja lisätty jonoon.

Koko sovelluksen esittämisen yhdenmukaistaminen on seuraava työpaketti, ei tämän kierroksen valmis väite. Yksikään nykyinen datalaji tai laskuri ei poistu.

Kuittiskannauksen pääpaikka siirretty 10.11.2026 menoihin. Muissa näkymissä ei ole rinnakkaista parseria, tallennusta tai kuittilomaketta. Työkalun piilottaminen ja navigointi säilyttävät luonnoksen; PDF:n pudottaminen avaa saman tarkistuspolun.
