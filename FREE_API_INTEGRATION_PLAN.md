# Maksuttomat rajapinnat ja turvallinen käyttöönotto

Kartoitus 10.11.2026. Markkinadataa koskeva suunnitelma; sovellukseen ei ole kytketty automaattista ulkoista liikennettä. `index.html` sallii käyttäjän käynnistämän laskuanalyysin OpenRouterin tai käyttäjän Cloudflare Workerin kautta; muut toiminnot eivät edellytä verkkoyhteyttä; katso [PDF-suunnitelma](PDF_IMPORT_PLAN.md).

## Jo toteutettu: päivätty offline-kurssiaineisto

20 valitulle kohteelle on haettu Yahoo Financen julkisesta chart-lähteestä vuoden 2024 ensimmäinen saatavilla oleva havainto ja kuukausien viimeiset saatavilla olevat kaupankäyntihavainnot 10.11.2026 asti. Yhteensä 720 hintahavaintoa. EUR/USD-muunnokset ovat EKP:n julkisesta aineistosta (730 havaintoa). Hinta, valuutta, lähde, aikaleima ja raakavastauksen SHA-256 säilyvät aineistossa. Raakavastauksia ei tarvita sovelluksen ajonaikaiseen käyttöön.

Saman päivän havainto merkitään keskeneräiseksi. Vuoden 2026 tuleville päiville, kuten joulukuulle, ei keksitä toteutunutta kurssia: näytetään viimeisin tunnettu havainto päivämäärineen. Aineisto ei ole livekurssi. Valuuttakurssi valitaan hintapäivältä tai sitä edeltävältä saatavilla olevalta päivältä, ei tulevaisuudesta.

Tiedosto: `src/data/market-history.json`. Uudelleenpoiminnan työkalu: `scripts/fetch-market-history.py`. Se tekee nimenomaisen verkkopyynnön vain kehitystyökaluna. Historiallinen Close on lähteen split-oikaistu hinta, ei osingot sisältävä kokonaistuotto; hintojen ja osakemäärien yksikön on vastattava toisiaan. Lähde voi korjata historiallisia sarjoja myöhemmin. Lähdeviite ei itsessään anna oikeutta kurssidatan kaupalliseen näyttöön/jälleenjakeluun: tuotantopalvelun käyttöehdot ja näyttölupa on tarkistettava erikseen.

## Osake-API-ehdokkaat

| Palvelu | Maksuton taso ja havaittu saatavuus | Soveltuvuus / rajoitus | Päätös |
| --- | --- | --- | --- |
| Financial Modeling Prep | Virallinen hinnoittelu ilmoittaa 250 kutsua/päivä sekä EOD- ja historiallista dataa ilmaisessa kokeilu-/aloitustasossa | Avaimen, endpoint-kohtaisten oikeuksien, henkilökohtaisen käytön/näytön ja erityisesti Suomen/Xetran 20 tunnuksen kattavuus täytyy testata. Maksuton kiintiö ei automaattisesti anna edelleenjakeluoikeutta. | Ensisijainen BYOK-kokeilu päivittäisiin hintoihin, jos käyttötarkoituksen oikeudet ja kohdekattavuus hyväksytään. |
| Alpha Vantage | Virallinen tukisivu ilmoittaa 25 kutsua/päivä. Demoavain palautti IBM:n kuukausihistorian; dokumentaatio kattaa kuukausisarjat. | 20 kohteen yksi päivitys/päivä on kiintiön kannalta mahdollinen, mutta endpointit/markkinat ja historiatason oikeudet vaihtelevat. Reaaliaikaiset ja 15 min US-kurssit ovat lisensoitua premium-dataa. | Vaihtoehto US-/historiapainotteiseen henkilökohtaiseen käyttöön; ei luvata ilmaisia reaaliaikaisia kaikkien markkinoiden hintoja. |
| Twelve Data | Basic-sivulla 8 API-krediittiä/min ja 800/päivä, mutta käyttö kuvataan **internal non-display usage** -tasoksi | Ilmaisen tason käyttäminen tämän sovelluksen kurssinäyttöön ei ole oletusarvoisesti hyväksyttävissä. Markkina- ja näyttöoikeus on erillinen. | Ei valita näkyvän tuotantokurssin ilmaiseksi oletuslähteeksi näillä ehdoilla. |
| Finnhub | Virallinen hinnoittelusivu avautuu, mutta tässä kartoituksessa ei saatu luotettavasti poimittua nykyisiä ilmaisen tason endpoint-/markkinaoikeuksia | Ei lukita vanhoista blogeista muistettuja kiintiöitä. Nasdaq Helsinki ja historia on varmistettava avaimella ja nykyisillä ehdoilla. | Varavaihtoehto, ei vielä valittu. |
| Yahoo Finance chart | Julkinen päätepiste palautti kaikki 20 pyydettyä sarjaa. Ei API-avainta tähän poimintaan. | Epävirallinen integraatiorajapinta, ei taattua SLA:ta, aiemmin myös HTTP 429. Käyttö-/näyttö-/jakeluehdot täytyy erottaa teknisestä saatavuudesta. | Päivättyä lähdeotosta tukeva lähde, ei ainoa ajonaikainen kriittinen riippuvuus. |

Tarkistetut viralliset sivut:
- FMP: https://site.financialmodelingprep.com/developer/docs/pricing
- Alpha Vantage: https://www.alphavantage.co/support/#api-key ja https://www.alphavantage.co/documentation/
- Twelve Data: https://twelvedata.com/pricing
- Finnhub: https://finnhub.io/pricing

Hinnoittelu ja ehdot voivat muuttua; taulukko on tarkistuspäivän kartoitus, ei pysyvä palvelulupaus. Maksuton API ei ole sama asia kuin maksuton pörssidatan julkinen näyttöoikeus.

## Suositeltu osakeintegraatio

1. **Säilytä toimiva offline-pohja.** Käyttäjän talous ei riipu API:n saatavuudesta. Nykyinen aineisto näkyy päivämäärineen.
2. **Lähderiippumaton sovitin:** `getQuote`, `getHistory`, `getFx` palauttavat yhden validoidun muodon. Tunniste, pörssi, valuutta, lähde, havaintoaika, hakuaika, oikaisutapa ja keskeneräisyys ovat erillisiä tietoja.
3. **20 kohteen kattavuuskoe:** täsmäytetään jokaisen nykyisen tunnuksen vastine lähteessä. NOKIA.HE ja NOKIA:n US-ADR eivät ole sama instrumentti. ETF:ssä pörssi/listaus ja valuutta varmistetaan. Tuntematonta valuuttaa ei oleteta euroksi.
4. **Päivähinta ennen liveä.** Aloitetaan EOD-/viiveellisestä datasta. Yksi pyyntö kohteelle päivässä, välimuisti ja erillinen Päivitä hinnat -toiminto. Historia haetaan harvoin eikä jokaisella kuukausivalinnan muutoksella. Kiintiö lasketaan lähteen todellisten krediittisääntöjen mukaan.
5. **Käyttäjän oma avain (BYOK).** Avain pidetään aluksi vain muistissa istunnon ajan. Ei avainta HTML-bundleen, repositorioon, localStorage-talousdataan, JSON-/CSV-varmuuskopioon, lokiin tai analytiikkaan. Yhteistä ylläpitäjän avainta ei jaeta selaimille.
6. **Verkkokäyttö erillisenä valintana ja buildina.** Ennen ensimmäistä hakua näytetään palvelu ja lähetettävä tieto: instrumenttitunnus, julkinen aikaväli, mahdollinen API-avain. Ei määriä, hankintahintoja, tilisaldoja, henkilötietoja, laskuja tai koko salkkua. Offline-versio ei lähetä mitään.
7. **CORS ja file:// testataan erikseen.** Jos palvelu ei hyväksy file-originia, käytetään erillistä HTTPS-verkkoversiota. Avaimia sisältävää ylläpitäjäproxyä ei improvisoida. Palvelinproxy tulee kyseeseen vasta omana hallittuna palvelunaan, jossa on host-/endpoint-allowlist, kiintiöt ja salaisuuksien hallinta.
8. **Virhe ei korvaa hyvää hintaa.** HTTP 429 noudattaa Retry-Afteria, 401/403 pysäyttää toiston, aikakatkaisu ja puuttuva päivä näyttävät viimeisimmän varmennetun tiedon. Puuttuvaa hintaa ei korvata nollalla tai toisella yhtiöllä.

### Tietoturvan ja laskennan hyväksymiskriteerit

- HTTPS ja TLS-varmennus käytössä. Kiinteä palveluntarjoajien allowlist, ei mielivaltaista URL-kenttää tai JSONP-/etäskriptin suorittamista.
- Strict JSON-/Zod-validointi: instrumentin identiteetti, valuutta, rajatut numeeriset arvot, aikaleima ja kohtuullinen vastauksen koko. HTML-virhesivu ei ole kelvollinen kurssivastaus.
- Raakatekstiä ei injektoida HTML:ksi. Hintoja ei suoriteta koodina. Avaimet ja URL:n avainparametrit peitetään virheilmoituksissa.
- Verkkoversion CSP:n connect-src rajataan täsmällisiin lähteisiin. Ei `*`-avausta nykyiseen offline-versioon. Ei ulkoisia fontteja, mainoksia tai analytiikkaa.
- Viimeisin havainto ja sen tuoreus näkyvät. Kuukauden valinta ei saa käyttää tulevaa hintaa tai tulevaa valuuttakurssia. Pörssin aikavyöhyke ja keskeneräinen päivä erotetaan.
- Osakkeiden splitit, valuutan yksikkö (esim. GBP/GBp), rahastojen osuuslajit sekä hintatuotto/total return erotetaan. Poikkeava kertaluokkamuutos pysäyttää automaattisen arvon päivityksen tarkistukseen.
- Hintahaku ei muuta käyttäjän osakemäärää tai hankintahintaa. Hinta- ja tapahtumahistoria ovat eri aineistoja.

## Muut hyödylliset maksuttomat rajapinnat

| Rajapinta | Sovelluksen hyöty | Tietosuoja / vaadittava tieto | Suositus |
| --- | --- | --- | --- |
| **EKP Data API** | EUR-valuuttakurssit, Euribor- ja muut julkiset korkoaikasarjat lainasopimuksen viitekoron tueksi | Ei käyttäjätietoja tai API-avainta; valuuttapari, korkosarja ja päiväväli. Sopimuksen korkojakso ja marginaali eivät selviä markkinakorosta. | Korkein prioriteetti. EUR/USD-historia on jo offline-otoksena. EXR-haku vastasi 200/CSV. https://data.ecb.europa.eu/help/api/overview |
| **Tilastokeskus StatFin / PxWeb** | Asuntohintaindeksit alueittain, kuluttajahinnat, kotitalouksien kulutus- ja asumisvertailut | Ei henkilötietoja. Alue-/kuntataso riittää, tarkkaa osoitetta ei lähetetä. Keskiarvo ei ole yksittäisen talouden maksimibudjetti. | Korkea prioriteetti asunto- ja kompassimalleihin. Metadatarajapinta vastasi 200/JSON: https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin |
| **Eurostat julkiset tilastot** | Maiden hintataso, inflaatio ja kotitalouksien vertailut; tukee FIRE-skenaarion ostovoimaoletusta | Julkiset sarjat ja aikavälit, ei käyttäjädataa. Nimellinen ja reaalinen kehitys pidetään erillään. | Hyvä seuraava lisäys. https://ec.europa.eu/eurostat/web/user-guides/data-browser/api-data-access/api-introduction |
| **PRH/YTJ avoin yritysdata** | PDF-laskun toimittajan Y-tunnuksen/nimen täsmäytys | Lähetettäisiin vain käyttäjän hyväksymä Y-tunnus tai yritysnimi, ei laskua tai tilinumeroa. Virallinen hakutulos ei vahvista laskun aitoutta tai IBANia. | Valinnainen PDF-tuonnin lisätarkistus. Etusivu vastasi 200, mutta arvatun v3 api-docs -polun 404 ei riitä endpoint-varmennukseksi: toteutuksessa seurataan virallista dokumentaatiolinkkiä. https://avoindata.prh.fi/fi |
| **Fingrid avoin data** | Sähköjärjestelmän tilanne ja energiasuunnittelun taustasarjat | Maksuton rekisteröitymällä ja avaimella. Julkinen aikasarja, ei käyttäjän sähkösopimusta. Ei tarkoita kuluttajan spot-kokonaishintaa tai omaa laskua. | Keskitasoinen hyöty; energiakulujen selitteisiin myöhemmin. https://data.fingrid.fi/en/instructions |
| **Open-Meteo** | Lämmitystarpeen kausivaihtelu ja energiabudjetin skenaariot | Kuntatason koordinaatit riittävät, ei kotiosoitetta. Maksuton taso on ei-kaupalliseen käyttöön, kaupalliseen käyttöön maksullinen lisenssi. | Valinnainen prototyyppi; ei välttämätön talousdatan käsittelyyn. https://open-meteo.com/en/pricing |

Verkkopyynnön vastaanottaja voi aina nähdä IP-osoitteen ja pyyntöajan, vaikka talousdataa ei lähetetä. Siksi myös avaimeton rajapinta on valinnainen. Vertailutilastojen haku voidaan tehdä kehitysvaiheessa päivättyyn offline-aineistoon samoin kuin kurssihistoria, jolloin käyttäjä ei tee pyyntöjä lainkaan.

### Pois ensimmäisestä toteutuksesta

- Pankki-/PSD2-yhteydet eivät ole samanlainen matalan riskin julkinen API: ne tarvitsevat vahvan tunnistuksen, käyttöoikeudet ja palveluntarjoajan. Ei lisätä vain siksi, että kokeilu on maksuton.
- Rekisteritunnus/VIN-haut, joista voi seurata omistajan tai tarkan ajoneuvon henkilötietoja, eivät ole tarpeen nykyiseen arvonalenemamalliin.
- Mainos-/seuranta-SDK:t, ulkoiset dokumenttianalyysit sekä satunnaiset hintascraperit eivät kuulu oletusratkaisuun.

## Toimitusjärjestys

1. **Valmis:** 20 kohteen päivätty 2024–2026 snapshot + EKP-muunnokset, lähdehistoria näkyviin ja demokytkentä.
2. **Suunnitelma valmis:** FMP/Alpha Vantage -BYOK-koe, 20 tunnuksen oikeus-/kattavuusmatriisi ja välimuisti. Tämä vaihe ei ole vielä toteutettu.
3. EKP:n viitekorkojen ja StatFinin alueellisen indeksin adapterit; vain käyttäjän sopimusehtojen ja kohteen tiedon tueksi.
4. Verkkoversion erillinen opt-in, CSP, virheenkäsittely, kiintiötestit ja avainten vuototestit.
5. Vasta sen jälkeen automaattinen ajastus. Offline-käyttö ja viimeisin luotettu aineisto säilyvät toimivina.
