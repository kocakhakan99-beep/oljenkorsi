# Taloussuunnittelu 0.1.0

Ajantasainen selkokielinen kokonaiskuva: [checklist ja dokumentaatio aiheittain](CHECKLIST.md).

Ilmainen, yksityinen henkilökohtaisen talouden paikallinen suunnittelusovellus. Tarkoitus on auttaa käyttäjää hyötymään omasta taloudestaan, ei myydä hänen tietojaan.

## Valinnainen AI-laskuanalyysi

Tavallisessa `index.html`-sovelluksessa avaa **Menot → Analysoi lasku** tai budjetin vastaava pikatoiminto. Valitse tekstimuotoinen PDF tai liitä laskuteksti, tarkista lähetettävä teksti ja syötä valitun palvelun avain. Painike **Lähetä teksti analysoitavaksi** lähettää tekstin valitulle palvelulle ja sen käyttämälle mallipalvelulle. Sovellus pyytää ensisijaisesti ilmaista `nvidia/nemotron-3-ultra-550b-a55b:free` -mallia ja saatavuus- tai kiintiövirheessä `openrouter/free`-reititintä; mallia ei tarvitse itse valita. Saatavuus, kiintiöt ja tietojenkäsittelyehdot voivat vaihdella. Valinnainen Cloudflare Worker vaatii oman Bearer-avaimensa ja käyttäjän vahvistuksen, että se välittää vain pyydetyt ilmaismallit eikä vaihda niitä maksulliseen. Worker-palvelimen toimintaa tai kustannuksia sovellus ei voi todentaa. Tarkista AI:n ehdotus ennen menon tallentamista. Avain ja laskuteksti eivät tallennu talousdataan.

Muut ominaisuudet toimivat edelleen ilman verkkoyhteyttä. Kuvapohjaiset PDF:t tarvitsevat OCR:n, jota ei vielä ole. Jos analyysi epäonnistuu, tarkista sovelluksen virheilmoitus, valitun palvelun API-avain, ilmaismallien kiintiö ja Privacy-asetukset sekä Worker-valinnassa palvelimen CORS-asetukset. `index-online.html` säilyy yhteensopivuuskopiona, mutta sen erillinen avaaminen ei ole tarpeen. `file://`-käytössä eri HTML-tiedostojen selaintallennus voi olla erillinen; käytä aiempaa tiedostoa tai siirrä tiedot JSON-varmuuskopiolla.

## Käyttö ilman asennusta

1. Tallenna projektin juuren valmis `index.html` pysyvään paikkaan, esimerkiksi työpöydälle. Tiedoston voi nimetä uudelleen haluamakseen.
2. Avaa se kaksoisklikkaamalla selaimessa. Osoite on `file://`.
3. Aloita tyhjästä, kokeile selvästi merkittyä fiktiivistä esimerkkitaloutta tai palauta JSON.
4. Vie varmuuskopio tärkeiden muutosten jälkeen ja ennen tiedoston siirtämistä.

Neljä kompassiesimerkkiä voi ladata käyttöönotossa, kompassissa tai Asetuksista. Valitun talouden lataaminen korvaa nykyisen talouden vahvistuksen jälkeen; vie JSON-varmuuskopio ensin, jos haluat palauttaa omat tietosi. Esimerkeissä on kahden aikuisen palkat, lapsilisä, vuosien 2024–2026 kaikki 36 kuukautta vaihtelevine tuloineen, menoineen ja budjetteineen sekä omaisuutta, linkitettyjä velkoja, sijoituksia, tavoitteita ja tallennettuja skenaarioita. Ne ovat fiktiivisiä käyttöliittymän testidatoja, eivät ennusteita.

Loppukäyttäjä ei tarvitse Node.js:ää, Pythonia, palvelinta, tiliä tai internetiä. Älä käytä sähköpostin tai pilvitallennuksen HTML-esikatselua; lataa tiedosto ensin paikalliseksi. Älä käytä yksityistä selausta, jos odotat datan säilyvän.

## Toteutettu

- Tulot, menot, omaisuus, velat, sijoitukset ja tavoitteet: lisäys, muokkaus, poisto. Tiiviissä listoissa nimi ja kuvakkeellinen kategoria ovat omissa sarakkeissaan; lisätiedot avataan silmäpainikkeella. Silmäpainike avaa katseluikkunan ilman syöttökenttiä; sieltä voi myös muokata tai poistaa. Sama katselu toimii pikahaussa, raportin tietueista ja budjettikategorian menoluettelosta. Budjetin erotukset näkyvät etumerkillisinä lukuina: vihreä plus on liikkumavaraa, punainen miinus vajetta.
- Yhteenvedon tulo- ja menopainikkeet sekä Ctrl/Cmd + K avaavat nopean kirjauksen: nimi, summa, kategoria ja päivä. Menot-näkymässä kertameno ja toistuva lasku ovat omat aloitustoimintonsa; tuloissa voi aloittaa kertatulon tai toistuvan tulon. Budjettikategorian riviltä voi aloittaa menokirjauksen kategoria esivalittuna. Kuvaus ja muut tarkennukset ovat lisävalinnoissa. Viimeisimmän tulon tai menon voi kopioida uudeksi toteumaksi; useita kirjauksia voi tallentaa peräkkäin lomaketta sulkematta.
- Tulojen ja menojen toistuvuus sekä kuukauden tila näkyvät tiiviinä kuvakkeina. Napauta kuvaketta tai avaa se Enterillä nähdäksesi selitteen. Tapahtumakohtaiset summa- ja tilakorjaukset löytyvät katseluikkunan ”Korjaa kuukauden tapahtumia” -toiminnosta.
- Tapahtuman tila määräytyy maksupäivästä: mennyt tai tämän päivän esiintymä on automaattisesti toteutunut ja tuleva suunniteltu. Toistuvan palkan ja etuuden viikonloppuun tai Suomen pankkipyhään osuva maksupäivä aikaistetaan automaattisesti edeltävälle pankkipäivälle. Yksittäisen esiintymän tilan voi tarvittaessa yhä korjata käsin. Päivämäärään perustuva tila ei ole pankkivarmennus.
- Kahdeksan toistuvuutta, alku- ja loppupäivä, aktiivisuus, sarjan oletustila sekä päiväkohtaiset suunniteltu/toteutunut/ohitettu-tilat ja summapoikkeukset. Yksittäisen laskun toteuma voi poiketa sarjan oletussummasta.
- Kategoriabudjetin kuvakkeellinen nimi avaa kuukauden menokortin: tapahtumat, summat, päivät ja tilat sekä muokkaus ja kerta-/toistuvan menon lisäys esitäytettyyn kategoriaan. Kortista pääsee myös kategorian koko menoluetteloon.
- Kategoriabudjetti ja kirjauksista laskettu toteuma; erillinen kokonaistoteuman korjaus kategoriakortin lisävalinnassa; budjetoimattomat kulut erotetaan budjetoitujen kategorioiden erotuksesta. Edellisen kuukauden budjetin kopiointi.
- Kassavirta, kirjauksiin perustuva kuukausiarvio, säästöaste, nettovarallisuus ja 1/3/6/12 kuukauden hätävaramittari. Menojen ja tulojen kuukausikattavuus vahvistetaan erikseen; hätävara ja tulovaihtelu käyttävät vain vahvistettuja päättyneitä kuukausia. Hätävaranäkymässä voi syöttää oman menotason ja testata tulonmenetystä valitulla kestolla; tulos on skenaario, ei ennuste. Menon oma tyyppikenttä erottaa kulutuksen, säästösiirron ja sijoitussiirron; se ei vielä todenna pankkitapahtumaa.
- Manuaaliset sijoitushinnat euroina ja hankinta-arvo.
- Tavoitteiden eteneminen ja säästökuukausien arvio ilman tuottoa.
- Korkoa korolle, kulut, inflaatio, tallennettavien skenaarioiden vertailu ja velanmaksuarvio.
- FI-pääomatavoitteen yksivaiheinen havainnollistus, ehdollinen aika-arvio omalla säästö- ja reaalituotto-oletuksella sekä ±10 % kulutusherkkyys.
- Raportin aikarajaus vaihtuu yhdellä valinnalla yhden kuukauden ja enintään 120 kuukauden aikavälin välillä. Kuukausitilassa valitaan yksi kuukausi; aikavälitilassa valitaan alku ja loppu. Nykyvarallisuuden ja velan tilannekuvat eivät näytä harhaanjohtavaa aikaväliä, sillä historiallisia saldoja ei tallenneta.
- Raporteissa valittava pylväs-/viiva-/aluekaavio ja 70–180 % suurennus; kulurakenne pylväs-/piirakkakaaviona. Valittavat pisteet, pylväät ja sektorit avaavat tapahtumakohtaiset tietokortit.
- Piilotettavat sivukohtaiset opastuslaatikot, joiden näyttämisen voi palauttaa asetuksista; summakenttien eurokohtaiset pikasäätimet.
- Valitun raporttijakson tulot, menot, nettokassavirta ja kokonaisjakson säästöaste; tulot-, menot- ja kassavirtasummista pääsee suoraan niiden kirjauksiin.
- Kuukauden sisäisen rahavirran ajoitus, päiväsaldo ja negatiivisen jakson palautumispäivä.
- Raportit vastaavat eri kysymyksiin: tulojen ja menojen kehitys, kulujen jakauma, päivien kassavirta, budjetin toteuma, nykyinen varallisuus, linkitettyjen velkojen pääoma-arvio sekä säästöaste ja FIRE. Taulukkomuodossa voi hakea rivejä ja lajitella näkymään sopivilla avaimilla.
- Talouden kompassi: paikallinen päätössääntömoottori, jossa ehdotukset päivittyvät kirjauksia muuttaessa ja tilanteen voi päivittää käsin. Askeleet ryhmitellään kassavirtaan, menoihin, puskuriin/velkoihin ja tavoitteisiin/FIREen; näkyvissä on viisi kiireellisintä kerrallaan, enintään 20. Askeleen voi merkitä tehdyksi, siirtää viikolla tai piilottaa 30 päiväksi valinnalla ”Ei onnistu nyt”.
- Kompassi tarkistaa budjetti- ja kassavirran lisäksi asumismenojen osuuden, oman kuluhistorian muutokset, välttämättömät menot, puskurin, tulovaihtelun, säästötavoitteiden tahdin, toistuvat menot, velkojen korot ja kuukausierät, epäsäännölliset menot sekä FIRE-nostoskenaarion. Kuluvan kuun menopoikkeama vertautuu aiempien kuukausien samaan päivään; toteutunut erotus näytetään ehdollisena havaintona, ei säästölupauksena. Jokainen ehdotus näyttää seuraavan konkreettisen askeleen, lähteen ja rajauksen; sovelluskohtaisia kynnyksiä ei esitetä tutkimuksen määrittäminä henkilökohtaisina rajoina.
- Kompassin neljä kahden aikuisen ja yhden lapsen demotaloutta ovat ladattavissa myös käyttöönotossa ja asetuksissa. Esimerkit ovat samat kaikkialla: alijäämä, keskivertoarki, vakaa eteneminen ja yhden palkkatulon äkillinen katkos. Vuosien 2024–2026 tulot, menot, budjetit ja kompassivinkit vaihtuvat valinnan mukaan. Kriisiesimerkin palkkatulon katkos alkaa elokuussa 2026.
- Uudessa taloudessa näkyy 4 tulon ja 18 menon peruskategoriaa, mukaan lukien päivittäistavarat, kosmetiikka, hygieniatarvikkeet ja luottokorttilasku. Valinnaisia kategorioita lisätään tarvittaessa, ja omalle kategorialle valitaan kuvake esikatselun kanssa. Paikalliset Lucide-viivakuvat käyttävät yhtenäistä, teeman mukaan kontrastoitua tyyliä; sama aihe käyttää samaa kuvaketta omaisuudessa ja siihen linkitetyssä velassa.
- Velan voi linkittää omaisuuserään; velkaraportti näyttää nykyisen oman pääoman ja oletuksiin perustuvan takaisinmaksu- ja arvoarvion. Velanmaksunäkymä erittelee myös seuraavan erän korko- ja pääomaosuuden.
- Summien piilotus peittää myös kompassin euromääräiset todisteet. CSV on taulukkomuotoinen rivisiirto eikä säilytä velka–omaisuuslinkkejä; koko tietomallin siirtoon käytä JSON-varmuuskopiota.
- Tummat raportti- ja sovelluspinnat käyttävät vaaleaa tekstiä. Raporttien omaisuuskuva on nykyhetken tilannekuva, sillä arvostushistoriaa ei vielä tallenneta.
- Paikallinen JSON backup/restore sekä CSV-tuonti ja vienti kaikille kuudelle tietotyypille. CSV-tuonti tunnistaa yleisiä suomenkielisiä pankkiotsikoita, näyttää ensin vain perustiedot ja pitää harvemmat kentät lisävalinnoissa. Päivämäärä pitää yhdistää; sitä ei arvata tuontipäiväksi. Pankin miinusmerkkiset menot tuodaan itseisarvona, ja sekoitetun tulo- ja menoaineiston etumerkit auttavat ohjaamaan rivit oikeaan tuontiin.
- Neljä teemaa, tumma/vaalea/järjestelmätila, oma korostusväri ja summien piilotus. Teemoissa on yhtenäiset vahvat reunat ja väriperheeseen sopivat pinnat; korostusnapin teksti valitaan kontrastilaskelmalla.
- Viiteen ryhmään jaettu navigaatio, avattava mobiilivalikko sekä yhteenvedon ja suunnittelun erisävyiset mittari- ja sisältöalueet.
- Yhteenvedosta pääsee yhdellä painalluksella tulon tai menon kirjaukseen sekä budjettiin ja raportteihin.
- Pikatoiminnot ja kirjauksien haku Ctrl/Cmd + K; listojen haku, kategoria/tila-suodatus ja lajittelu.

Budjetin, tulojen ja menojen yhteinen 50/30/20-näkymä vertaa kuukauden nettotuloihin välttämättömiä menoja (enintään 50 %), valinnaisia menoja (enintään 30 %) sekä säästö-/sijoitussiirtoja (vähintään 20 %). Ryhmäosuuksia, kategoriaryhmiä ja kategoriarajoja voi muuttaa budjetin raamien asetuksista. Poikkeamat pysyvät näkyvissä ja kompassi ehdottaa menojen tarkistamista. Kehikko ja kategoriarajat ovat suunnittelun ohjeita, eivät henkilökohtaisia pakollisia rajoja. Katso [toteutussuunnitelma](BUDGET_RULE_PLAN.md).

## Kehitysteknologiat

React 19.2.1, TypeScript strict, Vite 8.0.16, React Hook Form 7.66.0, Zod 4.6.7, Tailwind CSS 4.3 ja Lucide React 1.68. Tailwind toimii vain build-vaiheessa: CSS kootaan suoraan itsenäiseen HTML-tiedostoon. Lucide-kuvakkeet sisällytetään samaan tiedostoon; sovellus ei hae kuvakkeita verkosta. Vanha design system on edelleen `src/styles.css`-tiedostossa, ja uusia sekä uudistettuja alueita voidaan siirtää Tailwind-luokkiin asteittain. Kaaviot ovat omia, paikallisia HTML/SVG-toteutuksia ja niiden rinnalla on taulukkomuotoinen tietosisältö. Testit: Vitest ja ESLint; E2E käyttää Python Playwrightia vain kehitysympäristössä.

## Kehittäjän asennus ja komennot

Kehittäjä tarvitsee Node.js 24:n ja pakettien asennukseen verkon. Tämä ei koske loppukäyttäjää.

```sh
npm install
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
```

Build suorittaa Viten ja `standalone.mjs`:n. Viten kehitysmalli on `src/index.html`. Valmis, itsenäinen sovellus kirjoitetaan projektin juuren `index.html`-tiedostoon. Väliaikainen `dist/` poistetaan koosteen lopuksi. Vite dev ei ole loppukäyttäjän käyttötapa. Asenna lukitulla riippuvuuspuulla komennolla `npm ci`.

E2E: asenna kehityskoneelle Python Playwright ja sen Chromium. Aja `python e2e.py`. Vaihtoehtoinen selainpolku annetaan `TALOUS_BROWSER`-ympäristömuuttujalla. Testit käyttävät erillistä tilapäistä selainprofiilia, eivät henkilökohtaista profiilia. Python ei ole sovelluksen ajonaikainen riippuvuus.

## Tallennus ja varmuuskopio

Selaimen localStorage toimii testatussa Chrome for Testing -ympäristössä file://-osoitteella. Tätä ei luvata kaikille selaimille. Tallennus tarkistetaan kirjoituksen jälkeen. Tallennusvirheessä sovellus pitää datan muistissa ja varoittaa viemään varmuuskopion. Älä sulje välilehteä ennen vientiä. Samanaikaista muokkausta useassa välilehdessä ei tueta; ristiriitainen kirjoitus estetään parhaalla mahdollisella tarkistuksella, ei atomisella lukituksella.

JSON on koko talouden siirrettävä kopio. CSV on tietuelistojen siirtomuoto, ei koko sovelluksen varmuuskopio. JSON ja selaindata ovat salaamattomia.

## Selainyhteensopivuus ja testit

Testattu: Google Chrome for Testing 149.0.7827.55, Linux, headless, Playwrightin offline-tila, file://, pysyvä profiili. Selainprosessi suljettiin ja käynnistettiin uudelleen; data säilyi. Edge, Firefox ja Windows-työpöydän kaksoisklikkaus eivät ole testattuja. Koneen fyysistä verkkoliitäntää ei katkaistu.

Testien valinta muutoksen mukaan on kuvattu tiedostossa [CONTRIBUTING.md](CONTRIBUTING.md). Aiemmat testiajot löytyvät tiedostosta `TESTING.md` ja niiden lokit hakemistosta `qa/`.

## Rakenne

`src/domain/`: mallit ja laskenta. `src/data/`: StorageProvider. `src/services/`: validointi, JSON ja CSV. `src/main.tsx`: sovellus ja ominaisuusnäkymät. `src/styles.css`: nykyinen design system sekä Tailwindin build-aikainen tuonti ja teematokenit. `src/test/`: yksikkötestit.

## Tietosuoja ja turvallisuus

Sovellus sallii OpenRouter-yhteyden vain käyttäjän käynnistämään laskuanalyysiin. Muut ominaisuudet toimivat ilman verkkoyhteyttä. Tietojen suojaus ei kata haittaohjelmia, laajennuksia tai laitteen muita käyttäjiä. Katso `PRIVACY.md` ja `SECURITY.md`.

## Rajaus

Tämä on toimiva ensimmäinen toimitus, ei koko 61-kohdan määrittelyn valmis V1. Katso `KNOWN_LIMITATIONS.md` ja `ROADMAP.md`. Suorat ja transitiiviset npm-riippuvuudet on lukittu `package-lock.json`-tiedostoon; puhtaan ympäristön asennus toimii komennolla `npm ci`.

## Ominaisuuskartoitus ja FIRE-jatkokehitys

Tutkimuspohjainen [ominaisuuskartoitus](FEATURE_RESEARCH.md) erottaa toteutetut toiminnot, aiemmat suunnitelmat ja uudet puutteet. [Lähdemuistio](RESEARCH_SOURCES.md) kuvaa tutkimuksen soveltamisrajat; [FIRE-suunnitelma](FIRE_PLAN.md) määrittelee laskennan ja hyväksyntäesimerkit. [Käyttöliittymän benchmark-muistio](UI_BENCHMARK.md) vertaa julkisia käyttömalleja YNABista, Monarchista ja Copilotista sekä priorisoi jatkokehityksen. Prioriteetit ovat [roadmapissa](ROADMAP.md). Nykyinen FIRE-näkymä sisältää rajatun havainnollistavan laskelman; laajempi elinkaari- ja nostovaiheen mallinnus on suunnitelma.

Kompassin nykyiset havaintoperheet, käyttörajat ja kynnysten tulkinta kuvataan [kompassin päätössäännöissä](COMPASS_ENGINE.md).

Toiminnoilla on [yhteiset pääpaikat](UNIFICATION_PLAN.md). Tulojen ja menojen lisäys ja muokkaus käyttävät samaa lomaketta; pikatoiminnot esitäyttävät sen. 50/30/20-asetukset ovat budjetissa, ja Tulot/Menot näyttävät vain tiiviin poikkeamatilan ja linkin. Tavalliset varmuuskopiot löytyvät Tuonti ja vienti -näkymästä; Asetukset ohjaa sinne. [UX-esittämisen priorisointimallin](UX_PRESENTATION_MODEL.md) soveltaminen on käynnissä: ensin yksinkertaisin riittävä esitys, monimutkaisempi vain tarpeeseen. Yhteiset ohjeet, budjetin lisäselitteet ja kompassin perustelut avautuvat käyttäjän pyynnöstä.

Yhteenvedon ja budjetin yhteiset mittarit, tilamerkit, käyttöastepalkki ja avattavat selitteet ovat `src/components/summary.tsx`-tiedostossa. Päälukujen menetelmät avautuvat tietokuvakkeesta; kulutuksen erittely ja suunnitelman siirrot saa avattua yhteenvedossa. Yhteenvedon ”Budjetoiduista käytetty” käyttää samaa toteumaa kuin budjettinäkymä. Ohjerajan ylitys erotetaan käyttäjän budjetin ylityksestä.

Talouslistojen ja kategoriakortin muokkaus-/poistotoiminnot käyttävät yhteisiä saavutettavia kuvakepainikkeita. Varallisuuslistoissa olennaiset nykyarvot ja manuaalinen tiedonlähde näkyvät ensin; laskenta- ja kirjausselitteet saa avattua. Sijoitusrivin hankinta-arvo ja tiivis tavoitteen eteneminen vähentävät tietojen toistoa. Raportin budjettitietokortti käyttää samoja mittarikortteja kuin yhteenveto, ja kokonaistoteuman korjaukset on merkitty näkyvästi.

Asetusten demopainike avaa yhteisen valintaikkunan. Tallennuksen lisätyökalut ja poistotoiminnot ovat omissa avattavissa kohdissaan; poistojen vahvistukset säilyvät. CSV:n merkistö ja erotin löytyvät Tiedoston lisäasetuksista, jotka avautuvat merkistövirheessä korjausta varten. Raportin taulukkomuoto korvaa kaavion, ja kaavion zoomaus näkyy vain kaaviomuodossa.

Velkalistassa korolle ja kuukausierälle on omat sarakkeet. Omaisuuslinkin kuvakkeet avaavat linkitetyn omaisuuden katselun. Tavoitelomake laskee kuukausisäästön tavoitesummasta ja tavoitepäivästä; kuukausisäästön muuttaminen puolestaan laskee samassa ajassa saavutettavan tavoitesumman. Nykyinen säästö huomioidaan. Laskenta olettaa kuukausierät kuukauden päästä alkaen ilman tuottoa eikä luo rahansiirtoja.

Velan katselukortissa voi avata valitun päivän saldoarvion ja kuluja huomioivan vuosikorkolaskelman. Arvio olettaa erät maksetuiksi eikä muuta kirjattua velkaa; opintolainan pääomitus tarkistetaan pankista. Skenaarioiden alussa valitaan kysymykseen sopiva laskuri. Sijoitusten 20 kohteella on nyt päivätty offline-historia 2024–2026. Ajonaikaista kurssiyhteyttä ei ole vielä otettu käyttöön: [kurssidatan jatkosuunnitelma](INVESTMENT_MARKET_DATA_PLAN.md).

Omaisuuden muokkausikkunan **Arvonmuutos**-välilehti tarjoaa asunto-, ajoneuvo-, laite-, maa- ja muun omaisuuden mallit. Rakennusvuosi/vuosimalli sekä käyttäjän markkina- ja kulumisoletukset tuottavat erillisen arvion valitulle päivälle. Oletukset voi tallentaa JSON-varmuuskopioon ilman kirjatun lähtöarvon muuttamista. Tallennetun mallin arvio näkyy valitun ajankohdan rivillä ja yhteenvedoissa. [Kaavat ja rajaukset](ASSET_VALUATION_PLAN.md).

Ylävalikon kuukausi rajaa tulo-/menolistojen tapahtumat ja omaisuus-/velkalistojen tilanteen. Raportoinnilla on oma erillinen jakso. Auton arviointiin syötetään vuosimalli, lähtökilometrit ja vuotuinen ajo; asuntoon rakennusvuosi. Sovellus antaa perustilan kertoimet. [Kuukausisuodatus ja saldot](MONTH_SCOPE_PLAN.md).

**Käytössä:** [Prisman, S-marketin, Alepan ja K-kaupan PDF-kuittiskannaus](RECEIPT_SCANNER.md) Menot-näkymässä (Skannaa kuitti), budjetin pikapainikkeesta tai pudottamalla yksi PDF Menot-/Budjetti-/Asetukset-näkymään: tuoterivit, alennukset, kategoriat, tarkistus ja kirjaus menoihin. Kuitit käsitellään paikallisesti. Kuvallisten PDF:ien OCR ja yleiset lasku-/sopimusparserit ovat vielä [suunnitelmassa](PDF_IMPORT_PLAN.md).

Uutta: arvonmuutoslomake näkyy muokkausvälilehdellä myös silloin, kun mallia ei ole otettu käyttöön. Välilehtivalitsin on selvästi erottuva palkki. Auton porrastettu v2-malli alentaa uuden auton arvoa alkuvaiheessa nopeammin ja huomioi 20 merkin arvio-oletukset. Neljä demotaloutta sisältävät yhteensä 4 480 tulo-/menokirjausta vuosille 2024–2026, tallennetut arvomallit, opintolainat, tavoitteet ja lähdehintoihin kytketyt salkut. [Kurssien lähteet](MARKET_DATA_SOURCES.md) · [Maksuttomien API:en suunnitelma](FREE_API_INTEGRATION_PLAN.md).
