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
- Ei mukautettua toistuvuutta, poikkeuspäiviä, yksittäisten esiintymien toteumahallintaa tai vuosittaista hinnanmuutosta.
- Actual-toistuva tapahtuma oletetaan toteutuneeksi jokaisella esiintymällä; käyttäjä vastaa tilasta.
- Vain kategoriabudjetti; ei budjettipohjia, nollapohjaista/prosenttijakoa tai kuun lopun ennustetta.
- Hätävara käyttää valittua 1/3/6/12 kuukauden jaksoa ja laskee keskiarvon vain kuukausista, joilla on välttämättömiä kulutuskirjauksia. Havaintokattavuus ei todista kaikkien menojen kirjaamista; nykyinen kuukausi voi olla kesken. Menojen välttämättömyys ja omaisuuden likvidiys perustuvat käyttäjän merkintöihin.
- Omaisuuden manuaalinen nykyarvo ja omistusosuus; ei arvostushistoriaa, automaattista arvonalenemaa tai auton erillismallia.
- Velkasaldo manuaalinen; erä ei generoi menoa eikä vähennä saldoa.
- Sijoitukset vain EUR; ei ticker/ISIN/pörssi/valuutta-allokaatioita, erillisiä sijoitustapahtumia tai arvostushistoriaa. Hankinta-arvo näkyy, erilliset tuottoprosentit eivät.
- Tavoitepäivä informatiivinen; arvio on säästökuukausia ilman tuottoa. Ei prioriteettien optimointia.
- Rajatut laskurit: korkoa korolle, kulut, inflaatio ja velanmaksu. Ei nettovarallisuus-/budjettiprojektioita tai tulo-/menomuutoksen erillislaskuria.
- Raportti kattaa 1/3/6/12 kuukautta valittuun kuukauteen tai käyttäjän rajaaman enintään 120 kuukauden jakson; nettovarallisuuden historiakaaviota ei ole.

## UX ja laatu

- Kategoriat: nimeäminen/lisäys/arkistointi/poisto; ei yhdistämistä, järjestystä tai väri/kuvake-editoria.
- Teemat: neljä valmista, tumma/vaalea/järjestelmä ja oma korostusväri. Ei kaikkien tokenien editoria tai automaattista kontrastilaskentaa. Järjestelmätilan vaihtuminen ei päivity välttämättä ennen seuraavaa renderöintiä.
- Summien piilotus ei salaa dataa eikä piilota muokkauslomakkeita tai kaikkia johdettuja tietoja.
- Haku ja kategoria/tila/lajittelu; ei kaikkia summa/aikaväli/toistuvuus-suodattimia tai tallennettuja suodattimia.
- CSV-kartoituksen tekniset kenttänimet ovat englanniksi; korjaus tapahtuu lähde-CSV:ssä. Ei pankkiformaatteja tai täydellistä merkistötunnistusta.
- Ei täydellistä WCAG-auditointia, ruudunlukijakoetta, komponenttitestejä tai tuhansien rivien suorituskykymittausta.
- main.tsx sisältää useita feature-näkymiä; modulaarisuus tulee parantaa.
- Npm-lukitustiedosto on lisätty; täysin puhtaan ympäristön asennuskoe ja riippuvuusauditointi puuttuvat edelleen.
- Tailwind-tyylit on otettu käyttöön asteittain, eikä vanhaa CSS-design systemiä ole vielä siirretty kokonaan. Ei kaikkia alkuperäisen teknologialistan kirjastoja. Ei fake-toimintoja niiden tilalla.

Tätä toimitusta ei tule kutsua alkuperäisen määrittelyn täysin hyväksytyksi V1:ksi tai auditoiduksi benchmark-tuotteeksi.

## FIRE ja mittareiden tulkinta (kartoitus 3.11.2026)

- Säästöaste erottaa menolomakkeen kulutus-, säästösiirto- ja sijoitussiirtotyypit. Tyyppi tallentuu yhteensopivuuden vuoksi varattuna tags-merkintänä; vanhoissa tietueissa tulkinta perustuu oletuskategorioihin. Ei pankista todennettua siirtoa, eikä lainapääomaa erotella.
- FI-pääomatavoite ja aika-arvio ovat yksivaiheisia havainnollistuksia tasaisella reaalituotolla ja käyttäjän oletuksilla. Ei elinkaaren vaiheistusta, eläke- tai veromallia, nostostrategioita eikä tuottojärjestys-/Monte Carlo -laskentaa. Nykyinen vakiotuottolaskuri ei korvaa niitä.
- Kokonaisnettovarallisuus ei tarkoita nostettavissa olevaa FIRE-pääomaa. Oma asunto ja puskuri vaativat erillisen rajauksen.
- Viten kehitysmalli on `src/index.html`, ja tuotantokooste kirjoittaa yhden valmiin `index.html`-tiedoston projektin juureen. Hallittu Chromium esti aiemmassa pilviympäristössä file://-E2E:n; paikallinen HTTP-tarkistus ei varmista file://-pysyvyyttä kaikissa selaimissa.

Katso [ominaisuuskartoitus](FEATURE_RESEARCH.md) ja [toteutussuunnitelma](FIRE_PLAN.md). Nämä eivät muuta nykyisiä laskentatuloksia.
