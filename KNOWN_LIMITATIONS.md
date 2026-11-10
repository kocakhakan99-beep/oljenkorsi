# Tunnetut rajoitukset

## Data ja tallennus

- Ei salausta. JSON/CSV ja selaintallennus ovat luettavissa laitteen käyttäjille.
- LocalStorage file:// ei ole yleisesti taattu; Edge/Firefox/Windows testaamatta.
- Selaimen kiintiö voi täyttyä ennen tiedostokokorajaa. Virheessä tila jää muistiin ja on vietävä JSON:ksi.
- Ei atomista monivälilehtilukitusta tai yhdistelyä. Käytä yhtä välilehteä. Kumoaminen palauttaa koko aiemman tilan.
- Tuntematon skeema hylätään; ei historiallisia migraatioita.
- Backup-tarkiste ei ole kryptografinen.

## Domain

- Yhteinen Entry-malli on suppeampi kuin alkuperäinen erillisten domain-mallien vaatimus.
- Ei mukautettua toistuvuutta, yksittäisen esiintymän päivämäärän siirtämistä eikä vuosittaista hinnanmuutosta.
- Toistuvalla tietueella on sarjan oletustila ja -summa sekä päivämääräkohtaiset actual/planned/skipped- ja summapoikkeukset. Niillä voi kirjata laskun todellisen summan muuttamatta muita kuukausia. Tila tai summa ei kuitenkaan varmennu pankista, eikä poikkeus muuta tapahtuman päivää.
- Vain kategoriabudjetti; ei budjettipohjia, nollapohjaista/prosenttijakoa tai kuun lopun ennustetta.
- Hätävara käyttää valittua 1/3/6/12 kuukauden jaksoa ja laskee keskiarvon vain käyttäjän vahvistamista päättyneistä kuukausista. Vahvistus ei ole pankkivarmennus, ja vanhojen varmuuskopioiden kattavuutta ei päätellä takautuvasti. Menojen välttämättömyys ja omaisuuden likvidiys perustuvat käyttäjän merkintöihin.
- Tulokatkoksen stressitesti käyttää enintään kuuden vahvistetun kuukauden keskituloa ja yhtä tulojen menetysprosenttia kaikille tuloille. Se ei erottele kotitalouden tulolähteitä, brutto-/nettotuloa, tukia, veroja tai velkojen maksua; tulos on käyttäjän skenaario, ei ennuste tai tavoitesuositus.
- Omaisuuden manuaalinen nykyarvo ja omistusosuus; ei arvostushistoriaa, automaattista arvonalenemaa tai auton erillismallia.
- Velkasaldo manuaalinen; erä ei generoi menoa eikä vähennä saldoa.
- Sijoitukset vain EUR; ei ticker/ISIN/pörssi/valuutta-allokaatioita, erillisiä sijoitustapahtumia tai arvostushistoriaa. Hankinta-arvo näkyy, erilliset tuottoprosentit eivät.
- Tavoitepäivä informatiivinen; arvio on säästökuukausia ilman tuottoa. Ei prioriteettien optimointia.
- Rajatut laskurit: korkoa korolle, kulut, inflaatio ja velanmaksu. Ei nettovarallisuus-/budjettiprojektioita tai tulo-/menomuutoksen erillislaskuria.
- Raportti kattaa 1/3/6/12 kuukautta valittuun kuukauteen tai käyttäjän rajaaman enintään 120 kuukauden jakson; nettovarallisuuden historiakaaviota ei ole.

## UX ja laatu

- Kategoriat: nimeäminen/lisäys/arkistointi/poisto; ei yhdistämistä, järjestystä tai väri/kuvake-editoria.
- Teemat: neljä valmista, tumma/vaalea/järjestelmä ja oma korostusväri. Järjestelmän vaalea/tumma-asetuksen muutosta seurataan sovelluksen ollessa auki. Ei kaikkien tokenien editoria tai automaattista kontrastilaskentaa.
- Summien piilotus ei salaa dataa eikä piilota muokkauslomakkeita tai kaikkia johdettuja tietoja.
- Haku ja kategoria/tila/lajittelu; ei kaikkia summa/aikaväli/toistuvuus-suodattimia tai tallennettuja suodattimia.
- CSV-tuonti tunnistaa yleisiä suomenkielisiä otsikoita, mutta kaikkia pankkiformaatteja tai merkistöjä ei tunnisteta. Toistuman tila- ja summapoikkeukset kulkevat JSON-tekstikentissä; päivämäärä pitää olla aineistossa.
- Ei täydellistä WCAG-auditointia, ruudunlukijakoetta, komponenttitestejä tai tuhansien rivien suorituskykymittausta.
- main.tsx sisältää useita feature-näkymiä; modulaarisuus tulee parantaa.
- Npm-lukitustiedosto on lisätty; täysin puhtaan ympäristön asennuskoe ja riippuvuusauditointi puuttuvat edelleen.
- Tailwind-tyylit on otettu käyttöön asteittain, eikä vanhaa CSS-design systemiä ole vielä siirretty kokonaan. Ei kaikkia alkuperäisen teknologialistan kirjastoja. Ei fake-toimintoja niiden tilalla.

Tätä toimitusta ei tule kutsua alkuperäisen määrittelyn täysin hyväksytyksi V1:ksi tai auditoiduksi benchmark-tuotteeksi.

## FIRE ja mittareiden tulkinta (kartoitus 3.11.2026)

- Säästöaste erottaa menolomakkeen kulutus-, säästösiirto- ja sijoitussiirtotyypit omassa kentässään. Vanhojen tietueiden tags-merkintä ja oletuskategoriat muunnetaan palautuksessa. Siirtoa ei todenneta pankista, eikä lainapääoman lyhennystä erotella.
- FI-pääomatavoite ja aika-arvio ovat yksivaiheisia havainnollistuksia tasaisella reaalituotolla ja käyttäjän oletuksilla. Ei elinkaaren vaiheistusta, eläke- tai veromallia, nostostrategioita eikä tuottojärjestys-/Monte Carlo -laskentaa. Nykyinen vakiotuottolaskuri ei korvaa niitä.
- Kokonaisnettovarallisuus ei tarkoita nostettavissa olevaa FIRE-pääomaa. Oma asunto ja puskuri vaativat erillisen rajauksen.
- Viten kehitysmalli on `src/index.html`, ja tuotantokooste kirjoittaa yhden valmiin `index.html`-tiedoston projektin juureen. Chromium-pääpolku on testattu loopback HTTP -palvelun kautta; hallittu selain esti suoran file://-avauksen. Testi ei varmista file://-pysyvyyttä tai offline-tilaa eri selaimissa.

Katso [ominaisuuskartoitus](FEATURE_RESEARCH.md) ja [toteutussuunnitelma](FIRE_PLAN.md). Nämä eivät muuta nykyisiä laskentatuloksia.

## PDF-kuittien nykyinen rajaus 10.11.2026

Prisma-/K-kaupan tekstikuitit ovat nyt käytössä testatuilla kolmella formaatilla, ks. [kuittiskannaus](RECEIPT_SCANNER.md). Kuvallisten kuittien OCR, salasanan syöttö, kuluhyvitykset ja yleiset lasku-/sopimusparserit puuttuvat. Koko kuukauden menoarviota ei automaattisesti vähennetä ostoksilla: mahdollinen päällekkäisyys tarkistetaan hyväksynnässä. Kuittituonnin kumoaminen on käytettävissä vain seuraavaan tallennettuun muutokseen asti. Kirjaston pääsäie kasvattaa tiedostoa ja tarvitsee myöhemmin suorituskykyvarmennuksen fyysisillä puhelimilla.
