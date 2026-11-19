# Olennaisten puutteiden toteutussuunnitelma

Päiväys: 19.11.2026. Lähtöversio: ed8ab41, sovellus 0.4.0.
Tila: toteutus aloitettu. 19.11.: luotu ominaisuuslista ja lisätty rajattuja regressiotestejä; käynnistyksen häivytystä muutettu. Dokumentaatiota päivitetty, CI-tarkistus lisätty ja käyttämättömien symbolien tarkistus otettu käyttöön. Vuosikellon/hintahistorian/kokeilun regressioita lisätty. Vanha manuaalinen perhepolku ja sen revisiotila on poistettu. Tuonti/vienti erotettu omaksi moduulikseen ja sen käyttöpolku tarkistettu selaimessa. Laajemmat käyttöliittymätestit, hookkien linttisäännöt ja muiden näkymien moduulijako ovat kesken. Laskurinäkymä, numerokontrollit, kalenteri ja lainalaskelman erittely on nyt erotettu ja niiden keskeiset käyttöpolut tarkistettu selaimessa. Lisäksi kuukausivalitsin, raporttikontrollit, rahavirran paneeli sekä asetusten välilehdet/ulkoasu/budjettiraamit on erotettu ja regressioajettu. Muiden raporttien ja tietojenhallinta-asetusten erottaminen jatkuu. Tietotarkistus ja historian puhdistus: REPOSITORY_SECURITY_2026-11-19.md.

Lähtöaineisto: [auditointi](AUDIT_2026-11-19.md), nykyinen lähdekoodi ja [kehitysohje](CONTRIBUTING.md).
Numerointi vastaa käyttäjälle esitettyä yhdeksän kohdan listaa. Auditointiraportin erillinen linttaushavainto sisältyy tämän suunnitelman kohtaan 6.

## 1. Korjattavat puutteet ja valmistumisen ehdot

| Kohta | Työ | Valmis, kun |
| --- | --- | --- |
| 1 | Uusien toimintojen testikattavuus | Raha-, toistuvuus-, varaus- ja tallennusrajatapaukset on varmennettu, ja kokeilutilan eristys testattu myös käyttöliittymän kautta. |
| 2 | Käynnistyssiirtymä | Todellinen häivytys näkyy hitaalla ja nopealla latauksella; virhetilanteista voi jatkaa ja vähennetty liike huomioidaan. |
| 3 | Pääkomponentin moduulijako | Näkymät ja dialogit ovat omissa moduuleissaan; App kokoaa sovelluksen ja ohjaa yhteisiä istuntoja. |
| 4 | CSS:n rakenne | Yhteisillä kontrolleilla on yksi selkeä perusmäärittely; sivukohtaiset tyylit sijaitsevat oman ominaisuuden yhteydessä ja ulkoasu on varmennettu. |
| 5 | Lataus ja PDF-suorituskyky | Aloituksen verkko- ja suoritusjälki on mitattu, raskaat sivut ja PDF latautuvat tarvittaessa ja optimoinnin vaikutus osoitettu. |
| 6 | Ylimääräinen koodi ja tarkistukset | Vanhat käytöstä poistetut kirjoituspolut sekä vahvistetusti käyttämättömät osat on poistettu, käyttämättömät tuonnit ja hookkien säännöt tarkistetaan automaattisesti. |
| 7 | Dokumentaation ristiriidat | Nykytilalle on yksi ensisijainen ominaisuuslista; README, arkkitehtuuri, rajoitukset ja roadmap vastaavat sitä. |
| 8 | Julkaisumenettely | Testattu CI julkaisee saman tarkistetun commitin, selain- ja palvelinversioiden yhteensopivuus tarkistetaan, ja palautuspolku on dokumentoitu ja harjoiteltu. |
| 9 | Entry-malli ja kategoriaviitteet | Tyyppikohtainen validointi sekä ID-pohjaiset budjettiviitteet toimivat, vanhat varmuuskopiot palautuvat ja tietojen säilyminen on osoitettu migraatiotestein. |

## 2. Toteutusjärjestys

1. **A — Lähtötilan lukitus ja dokumentaatio:** kohta 7 sekä kohdan 8 nykyisen julkaisun kuvaus.
2. **B — Turvaverkko ja käynnistys:** kohdat 1 ja 2.
3. **C — Vanhojen polkujen siivous:** kohta 6.
4. **D — Sovelluksen ja tyylien pilkkominen:** kohdat 3 ja 4 pieninä siirtoina.
5. **E — Mitattu suorituskyky:** kohta 5, kun sivut ovat eroteltavissa.
6. **F — Automaattinen julkaisu:** kohta 8. Pelkkä CI-tarkistus tuodaan käyttöön jo vaiheessa B; tuotantojulkaisu automatisoidaan tässä.
7. **G — Tietomallin uudistus:** kohta 9, erillisinä alavaiheina.

Jokainen vaihe on oma tarkistettava muutosjoukkonsa. Vaiheiden sisällä tehdään tarvittaessa useita pieniä committeja. Havaittu laskentavirhe korjataan omassa muutoksessaan ennen rakenteen siirtoa. Käyttöliittymän ulkoasun muutokset ja laskennan muutokset pidetään erikseen arvioitavina.

## A. Nykytilan ja dokumentaation yhtenäistäminen — kohta 7

### Työt

- Luo `FEATURE_STATUS.md`: toteutettu, osittainen, suunniteltu, poistettu/hylätty ja varmennusta odottava toiminto. Lisää koodin sijainti ja viimeinen varmennus.
- Merkitse nykyiseksi käyttömalliksi HTTPS-sovellus, kirjautuneen käyttäjän Supabase-tallennus ja vieraan välilehtimuisti.
- Päivitä `README.md`, `ARCHITECTURE.md`, `KNOWN_LIMITATIONS.md`, `ROADMAP.md` ja `CHECKLIST.md`; korjaa versio, automaattitallennus, hintahistoria, vuosikello ja omaisuuden arvonmuutosmallit.
- Merkitse vanhat offline- ja muut korvatut suunnitelmat historiallisiksi. Säilytä päätösten historia ja linkitä nykyinen toimintamalli alkuun.
- Kirjaa julkaisuosoite, nykyinen Pages-haara, Edge Functionien rooli ja nykyinen version hyväksyntä ennen julkaisumenettelyn muuttamista.

### Hyväksyntä ja palautus

- Toiminnon tila voidaan tarkistaa yhdestä listasta. Toteutettu koodi ja käyttäjän hyväksyntä ovat erillisiä merkintöjä.
- Linkit ja muutosten eheys tarkistetaan. Dokumentaatiovaihe ei tarvitse sovelluksen buildia.
- Palautus on dokumentaatiocommitin peruminen.

## B. Testikattavuus ja käynnistyssiirtymä — kohdat 1–2

### B1. Kohdennettu turvaverkko

Käytä fiktiivisiä aineistoja, kiinteää tarkastelupäivää ja käsin laskettuja odotustuloksia. Testit eivät saa muodostaa odotustulosta samalla tuotantofunktiolla kuin varsinainen laskenta.

- `annual-planning.test.ts`: kerta-/vuosi-/puolivuosimeno, vuoden ja kuukauden vaihtuminen, saman päivän erä, ohitettu ja päättynyt sarja, hinta- ja päiväpoikkeus, kuukausivarauksen pyöristys, jo varattu/käytetty summa, orpo tai vanhentunut kohdistus sekä kaksoislaskennan esto.
- `monthly-planning.test.ts`: tyhjä/vahvistettu/keskeneräinen kuukausi, nollavertailu, vuodenvaihde, käsin asetettu toteuma, kopioinnissa tietoinen nolla, täydennä/korvaa sekä arkistoitu tai uudelleennimetty kategoria.
- Hintahistoria: ennen voimaantuloa, voimaantulopäivänä ja sen jälkeen; päiväkohtainen summa ohittaa sarjan hinnan; ristiriitaiset päivät ja virheelliset summat hylätään. Vahvistetun menokuukauden avaaminen testataan muutosajankohdan mukaan.
- Kokeilutila: lähtötilan muuttumattomuus, 12 kuukauden laskelma, talouden vaihto ja uloskirjautuminen. JSON/CSV-vienti ja pilveen lähetetty dokumentti eivät sisällä kokeilua.
- Tallennuksen läpimeno: vanha varmuuskopio → nykyinen malli → uusi varmuuskopio → palautus; uudet kentät säilyvät. Sama aineisto hyväksytään selaimen ja Edge Functioniin generoidun validaattorin kautta.
- Lisää pieni selainregressio käynnistykseen, budjetin kopiointiin, vuosivarauksen tallennukseen ja kokeilun eristykseen. Tarkista käyttöliittymän käyttäytyminen ja ulosmenevä tallennus rajapinnan kautta; vältä sisäiseen React-tilaan sidottua testiä.
- Ota maksuton CI käyttöön tarkistustilassa: lukittu asennus, tyypitys, lint ja testit. Tuotantojulkaisua ei vielä kytketä tähän työnkulkuun.

### B2. Käynnistyksen korjaus

- Erota `StartupGate`/`StartupScreen` omaksi komponentiksi ja kuvaa tilat: odottaa → paljastaa → valmis; virhe ja käyttäjän päätöstä vaativa tila ohittavat animaation.
- Pidä sama latauskerros liitettynä latauksesta häivytyksen loppuun. Säilytä sen sisältö häivytyksen ajan ja käynnistä CSS-siirtymä vasta näkyvän alkutilan renderöinnin jälkeen.
- Liitä valmis sovellus latauskerroksen alle. Estä alapuolisten kontrollien fokus ja käyttö, kunnes siirtymä on valmis.
- Päätä poistaminen `transitionend`-tapahtumaan; lisää varmistusajastin ja siivoa sekä ajastin että renderöintikehysten callbackit komponentin poistuessa.
- Vähennetyn liikkeen asetuksella siirtymä valmistuu välittömästi. Nopealle lataukselle ei lisätä keinotekoista vähimmäisodotusta.
- Pitkittynyt lataus näyttää tilanteen ja tarkoituksenmukaisen uudelleenyrityksen tai vieraskäyttöön siirtymisen vain, kun se on turvallista. Keskeneräinen pyyntö ei saa myöhemmin korvata uuden istunnon tietoja.

### Hyväksyntä ja palautus

- Kohdennetut testit ja nykyinen testisarja läpäisevät. Virheellinen käyttäytyminen tunnistetaan ennen korjausta tai sitä kuvaavalla testillä.
- Selainkoe: nopea/hidas lataus, latausvirhe, vieras, kirjautunut käyttäjä, pienikokoinen näyttö, näppäimistö ja vähennetty liike. Varsinainen opacity-siirtymä tarkistetaan selaimessa.
- Palautus on UI-korjauksen peruminen; testit voivat säilyä. Tallennusformaatti ei vaihdu tässä vaiheessa.

## C. Kuolleen koodin poisto ja tarkistukset — kohta 6

### Työt

- Poista vahvistetut käyttämättömät tuonnit. Käy `upcoming.ts` läpi ja poista se testinsä kanssa, jos tuotantokäyttöä tai sovittua säilytystarvetta ei ole.
- Poista `Family`-komponentista estetty manuaalinen `family_save` ja sitä palvelevat lataus-/revisiotilat, propsit sekä vain niihin liittyvät palvelut. Tarkista koko kutsuketju ennen poistoa.
- Säilytä aktiivinen jäsen- ja kutsuhallinta, automaattitallennus sekä vanhojen varmuuskopioiden palautus. Käyttämätön kirjoituspolku ja tarpeellinen lukuyhteensopivuus erotellaan riippuvuuskartalla.
- Ota `noUnusedLocals` ja `noUnusedParameters` käyttöön. Lisää React-hookkien sääntöjen tarkistus maksuttomalla ESLint-lisäosalla.
- Korjaa hookkien riippuvuuslöydökset yksitellen: vakauta callback tarvittaessa ja tarkista vaikutus tallennusjonoihin. Älä lisää riippuvuuksia mekaanisesti tai kuittaa ongelmia yleisellä sääntöjen ohituksella.

### Hyväksyntä ja palautus

- Tyypitys, lint ja testit läpäisevät ilman käyttämättömiä symboleja.
- Perheen luonti, liittyminen, jäsenhallinta, talouden vaihto ja tallennus käyttävät aktiivista polkua. JSON-palautus vanhasta aineistosta toimii.
- Palautus siivouscommit kerrallaan. Tietokannasta ei poisteta vanhoja rakenteita tämän siivouksen yhteydessä.

## D. Näkymien ja CSS:n moduulijako — kohdat 3–4

### Tavoiterakenne

```text
src/
  app/          # App, shell, navigaatio ja yhteisten istuntojen kokoaminen
  features/     # dashboard, entries, budget, annual-calendar, reports,
                # compass, calculators, settings ja transfer
  components/   # yhteiset kontrollit, dialogirunko ja mittarit
  domain/       # puhdas laskenta ja tietomalli
  services/     # auth, pilvi, jonot, validointi ja tuontirajapinnat
  styles/       # tokenit, reset ja yhteinen perusasu
```

### Työt pienissä erissä

1. Siirrä yhteiset kuukausi-/päivämäärä-/raha-/prosenttikontrollit ja dialogirungot.
2. Siirrä itsenäisimmät sivut: tuonti/vienti ja laskurit, sitten raportit ja asetukset.
3. Siirrä kirjaukset, budjetti ja vuosikello; viimeiseksi laajemmin kytkeytyvät yhteenveto ja kompassi.
4. Erota kirjausten muutokset, kuukausivahvistukset ja navigaatio nimetyiksi ohjaimiksi/hookeiksi vasta, kun niiden vastuut näkyvät sivurajoista.
5. Pidä yksi auktoritatiivinen taloustila ja yksi tallennuspolku. Sivut saavat rajatut tiedot ja nimetyt toiminnot; älä kopioi koko App-tilaa jokaiselle sivulle tai luo piilotettuja sivukohtaisia pilvijonoja.
6. Siirrä sivun tyylit sen mukana, säilyttäen ensin nykyinen latausjärjestys. Yhdistä CSS-säännöt vasta tämän jälkeen komponentti kerrallaan.
7. Keskitetään painikkeiden, kalenterin ja dialogien perussäännöt. Tailwind ja tavallinen CSS voivat säilyä; valitse kullekin komponentille selkeä omistaja samoille ominaisuuksille.

### Hyväksyntä ja palautus

- App kokoaa sovelluksen; siinä ei enää määritellä sivujen suuria JSX-lohkoja tai itsenäisiä lomakkeita. Rivimäärän pienentäminen yksin ei ole hyväksyntäkriteeri.
- Importit kulkevat app → features → yhteiset domain/services/components; domain ei riipu käyttöliittymästä. Ei uusia kehäriippuvuuksia.
- Jokaisen siirron jälkeen kyseisen sivun käyttäjäpolku, kohdennetut testit, tyypitys ja lint.
- CSS-vertailu vähintään 320, 390, 768 ja 1280 px leveydellä, vaalea/tumma tila, pitkät nimet, dialogit, kalenteri ja suurennetut tekstit.
- Palautus sivu- tai komponenttikohtaisella commitilla. Laskennan ja tallennusmuodon muutokset käsitellään erikseen.

## E. Suorituskyky — kohta 5

### Mittaus ennen muutosta

- Kirjaa aloituksessa ladatut JS/CSS-resurssit ja pakettikoot samoilla asetuksilla kuin auditissa. Nykyinen vertailu: JS 1 089 kB / gzip 309 kB, CSS 328 kB / gzip 164 kB, PDF 1 644 kB / gzip 511 kB.
- Mittaa käynnistys, navigaatio, yhden kirjauksen muutos ja PDF-käsittely sovitulla mobiiliprofiililla sekä 1 000 ja 10 000 fiktiivisen tapahtuman aineistolla.
- Tarkista Reactin renderöinnit sekä pääsäikeen pitkät tehtävät. Raportoi käyttölaite ja aineisto; animaation sujuvuus ei korvaa latausajan mittausta.

### Optimoinnit tässä järjestyksessä

1. Laiska sivulataus erityisesti laskureille, raporteille, kompassille ja tuonnille; selkeä lataus- ja virhetila. Varmista alihakemistosta avautuvat suorat linkit.
2. Tarkista PDF-moduulin lataus: se alkaa vasta PDF-toiminnosta. Kokeile oikeaa workeria erillisenä muutoksena. Hyväksy se vain, jos mukana toimii build, CSP, polut, peruutus ja GitHub Pages.
3. Pienennä kuvien/fonttien inline-rajaa mittauksen perusteella; tarkista välimuistin hyöty ja HTTP-pyyntöjen määrä.
4. Optimoi todistetut laskenta-/renderöintipullonkaulat. Memoisointi ja listojen virtualisointi vain mitatun tarpeen perusteella.

### Hyväksyntä ja palautus

- Aloitus ei lataa PDF:ää eikä käyttämättömien raskaiden sivujen kokonaisuuksia. Pääpaketti pienenee; jos vain tiedostojako muuttuu ilman latauksen hyötyä, muutosta ei kirjata parannukseksi.
- Samaa koeasetelmaa käyttäen käynnistys ja tavalliset toiminnot eivät hidastu, ja havaittujen pullonkaulojen mittaustulos paranee.
- Testit, build ja HTTPS-selainpolut läpäisevät. Palautus optimointi kerrallaan; worker voidaan palauttaa aiempaan toteutukseen erikseen.

## F. Tarkistettu ja palautettava julkaisu — kohta 8

### Työt

- Tarkista ensin oikea Pages-lähde ja GitHubin nykyiset asetukset. Valitse `main` ainoaksi tuotantolähteeksi ja maksuton GitHub Actions -julkaisu build-artifactista; vaihto tehdään valmistellulla työnkululla.
- Pipeline: `npm ci` → typecheck → lint → testit → build → artefaktin tarkistus → julkaisu. Julkaise vain hyväksytyn commitin artefakti. Rajaa kirjoitusoikeudet julkaisutöihin ja estä päällekkäiset julkaisut.
- Tarkista HTML:n resurssiviitteet, Supabase-validaattorin generointi sekä palvelin- ja selainversion yhteensopivuus. Lisää mahdollisuuksien mukaan pieni HTTPS-selainkoe.
- Erota tuoteversio ja dokumentin kirjoitus-/skeemaversio. Määritä sallitut lukija- ja kirjoittajaversiot ja ymmärrettävä päivityspyyntö vanhalle välilehdelle. Säilytä tuntemattomien kenttien hylkäys, kunnes vanhan kirjoittajan turvallisuus on osoitettu.
- Palvelimen yhteensopiva lukutuki julkaistaan ennen uutta kirjoittavaa selainversiota. Vanhaa kirjoittajaa estävä katkaisu tehdään tarkoituksella, näkyvällä päivitysviestillä.
- Edge-julkaisun salaisuudet pysyvät CI:n salaisuuksissa. Hallintatunnusta ei sisällytetä selaimeen. Edge-koodi voidaan aluksi julkaista dokumentoidusti erillisellä työvaiheella, jos turvallista CI-tunnusta ei ole saatavilla; kokonaisjulkaisua ei merkitä automaattiseksi ennen sen kattamista.
- Poista versionhallinnan generoituja juuritiedostoja vasta, kun artifact-julkaisu on todettu toimivaksi ja vanhaan julkaisuun paluu on mahdollinen.

### Hyväksyntä ja palautus

- Puhtaasta asennuksesta syntyy toimiva julkaisu. Sovellus avautuu HTTPS-alihakemistosta ja suoralinkeistä, Google-paluu toimii ja cloud-save hyväksyy uuden dokumentin.
- Vanha ja uusi välilehti testataan rinnakkain: vanha ei voi pudottaa uutta kenttää eikä korvata uutta revisiota hiljaisesti.
- Palauta edellinen tarkistettu artefakti harjoituksessa. Edge voidaan palauttaa vain, jos se hyväksyy jo tuotantoon kirjoitetun datan; muuten julkaistaan korjaava eteenpäin yhteensopiva versio.
- Säilytä edellisen julkaisun lähdecommit ja artefakti sekä kirjallinen palautusohje.

## G. Tietomallin ja kategoriaviitteiden uudistus — kohta 9

Tämä vaihe alkaa vasta, kun testit, moduulirajat ja version yhteensopivuus ovat kunnossa. Kategoriaviitteet ja koko Entry-malli toteutetaan eri muutoksissa.

### G1. Tyyppikohtaiset rajat ilman tallennusmuodon vaihtoa

- Inventoi kunkin tietotyypin käytetyt kentät ja validointisäännöt. Määritä yhteinen vähimmäisrunko ja tyyppikohtaiset sovellustyypit.
- Lisää muunnos nykyisen Entry-dokumentin ja uusien sovellustyyppien väliin. Säilytä tallennusmuoto tässä alavaiheessa.
- Testaa raha-, päivämäärä- ja pakollisten kenttien säännöt erikseen tuloille/menoille, omaisuudelle, veloille, sijoituksille ja tavoitteille.

### G2. Kategoriat ID-viitteiksi

- Lisää `categoryId` ja siirrä ensin budjetin ja manuaalisten toteumien viitteet pysyviin ID:ihin; määritä adapterit raportteihin, CSV-tuontiin ja kategorian näyttönimeen.
- Migraatio käsittelee nimen vaihdon, arkistoinnin, poistuneen kategorian ja nimikonfliktin. Samannimisiä ei yhdistetä arvaamalla; puuttuva viite ratkaistaan dokumentoidulla talouskohtaisella migraatiokategorialla tai pysäytetään esikatseluun.
- Näytä ennen hyväksymistä muutosten yhteenveto. Säilytä budjettien ja toteumien kuukaudet sekä summat.

### G3. Uusi tallennusskeema tarvittaessa

- Julkaise versioitu ja deterministinen migraatio: tunnistettu vanha skeema → uusi skeema. Tuntematon tuleva skeema hylätään.
- Testaa vanhoja fiktiivisiä JSON- ja pilvidokumentteja, puuttuvia valinnaisia kenttiä, tyhjiä listoja sekä suurta aineistoa.
- Tarkista ennen/jälkeen kaikkien kuukausien summat, tietuemäärät, tapahtumapoikkeukset, budjetit, varaukset ja tavoitteet; sallitut muutokset ovat vain sovittua rakennemuutosta.
- Varmuuskopio tarjotaan ennen käyttäjän datan migraatiota. Pilvikirjoitus on revisioehdollinen ja idempotentti; osittainen tai epäonnistunut migraatio ei korvaa alkuperäistä dokumenttia.

### Hyväksyntä ja palautus

- Kategorian nimen vaihto ei enää muuta budjettiviitteen identiteettiä.
- Vanha JSON voidaan tuoda, nykyinen viedä ja palauttaa samoilla talousluvuilla. CSV:n rajaus tiedonsiirtomuotona säilyy selkeänä.
- Vanha selain ei voi tallentaa uutta skeemaa vajavaisena. Käyttäjä saa päivitysohjeen ja mahdollisuuden viedä muistissa olevat muutokset.
- Ennen uuden skeeman kirjoittamista voidaan palauttaa vanha käyttöliittymä. Kirjoittamisen jälkeen käytetään uutta skeemaa lukevaa korjausversiota; vanhan JSON-kopion palauttaminen on erillinen, käyttäjälle näkyvä palautustoiminto, joka voi menettää sen jälkeiset muutokset.

## 3. Julkaisun yhteinen tarkistuslista

- [ ] Vaiheen rajaus ja muutetut käyttäjäpolut kirjattu.
- [ ] Vaiheen kohdennetut tarkistukset läpäisevät.
- [ ] Laskennan odotustulokset ovat käsin tarkistettavia, kun laskenta muuttuu.
- [ ] Vanhan datan palautus ja epäonnistuvan tallennuksen polku tarkistettu, kun ne muuttuvat.
- [ ] Tuotantobuild ja resurssipolut tarkistettu ennen julkaisua.
- [ ] Supabase-muutoksissa nykyiset asetukset, oikeudet ja ajantasainen ohjeistus tarkistettu; tietokannan rakenteeseen koskettaessa migraatio ja advisorit mukana.
- [ ] Palautuskelpoinen versio tai skeemamuutoksen korjaava eteenpäin julkaisu määritetty.
- [ ] FEATURE_STATUS ja testausmerkintä päivitetty todellisten tulosten mukaan.

Ensimmäinen toteutettava erä: A, sitten B1:n laskenta- ja tallennustestit sekä B2:n käynnistyskorjaus. Laajat malli- tai julkaisumuutokset eivät kuulu tähän ensimmäiseen erään.
