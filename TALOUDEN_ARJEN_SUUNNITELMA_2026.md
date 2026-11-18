# Talouden arjen uudet toiminnot – toteutussuunnitelma

Päiväys: 18.11.2026. Tila: toteutus paikallisesti valmis, julkaisu ja käyttäjän tuotantotestaus odottavat.

## Toteutuksen eteneminen

- Vaihe 1: kuukausivertailu ja budjetin kopiointi toteutettu.
- Vaihe 2: ohjattu kuukauden tarkistus ja vahvistusten avaamissäännöt toteutettu.
- Vaihe 3: alkuperätieto ja vanhojen kirjoittajien yhteensopivuussuoja toteutettu paikallisessa koodissa.
- Vaihe 4: toistuvan hinnan voimaantulohistoria toteutettu paikallisessa koodissa.
- Vaihe 5: vuosikello, eräkohtaiset varaukset, varauksen käytetyksi kuittaus ja budjetin erillinen varausosio toteutettu paikalliseen koodiin.
- Vaihe 6: erillinen, tallennuksesta irrotettu kokeilutila toteutettu paikalliseen koodiin.

Vuosikellon ja hintahistorian kirjoittavan sovellusversion julkaisu edellyttää päivitetyn `cloud-save`-validaattorin ja verkkosovelluksen yhteisjulkaisua.

## Rajaus ja päätökset

Hyväksyttyjä ovat kuukausivertailu, budjetin kopiointi, ohjattu kuukauden tarkistus, vuosikello, voimaantulopäivään perustuva hinnanmuutos, erikseen käynnistettävä kokeilutila ja kirjausten alkuperätieto. Uutta tuonnin tarkistusjonoa ei tehdä. Nykyiset esikatselut säilyvät, ja epäonnistunut tuonti kertoo ymmärrettävän syyn sekä korjaustavan.

Vuosikulu jaetaan automaattisesti 12 kuukaudelle **laskelmassa**. Varausta ei lisätä budjettiin ilman käyttäjän toimintoa. Ennen seuraavaa eräpäivää tarvittava kuukausisäästö näytetään erillisenä, koska vuosikulu / 12 ei välttämättä enää riitä.

Kaikki toimii nykyisellä teknologialla ja maksuttomilla käytössä olevilla palveluilla. Suunnitelma ei tarvitse pankkiyhteyttä, maksullista analytiikkaa tai uutta kirjautumisratkaisua.

## 1. Kuukausivertailu: ”Mikä muuttui?”

**Paikka:** yhteenvedossa pieni kortti; tarkempi erittely avautuu siitä. Oletusvertailu valittu kuukausi vastaan edellinen kuukausi, myös vuodenvaihteessa.

- Näytetään tulojen, kulutusmenojen ja niiden erotuksen muutos euroina. Säästäminen ja sijoittaminen erotetaan kulutuksesta.
- Nostetaan enintään kolme suurinta kulutuksen muutosta kategorioittain. Riviltä pääsee kyseisen kuukauden kirjauksiin.
- Kokonaiset kuukaudet ovat ensisijainen vertailu. Keskeneräisen kuukauden kohdalla näkyy ”Kuukausi kesken”; kulunutta osakuukautta ei esitetä suoraan vertailukelpoisena täyden edellisen kuukauden kanssa. Ensiversiossa ei tehdä päivätasoista suhteutusta tai loppukuun ennustetta.
- Molempien kuukausien vahvistustila näytetään. Puuttuvia tietoja ei väitetä nollakulutukseksi. Nollasta kasvulle näytetään euromuutos, ei ääretöntä prosenttia.
- Budjetin käsin asetettu kategoriatoteuma (`budgetActuals`) huomioidaan budjettivertailun nykyisillä säännöillä. Se ei muutu uudeksi kassavirtakirjaukseksi. Jos budjetin toteuma eroaa kirjausten summasta, erotus selitetään; kortti ei sekoita näitä kahta laskentapohjaa.
- Tuodaan esiin numeerinen muutos, ei arvata syytä. Kategorian kasvu ei automaattisesti tarkoita huonoa kehitystä.

**Tekniikka:** puhdas kuukausivertailun domain-funktio nykyisten laskentafunktioiden päälle. Vertailu johdetaan tiedoista; uutta pilveen tallennettavaa yhteenvetotaulua ei tarvita.

**Valmis, kun:** vahvistetut, tyhjät ja keskeneräiset kuukaudet, manuaaliset toteumat, nollavertailu sekä vuoden vaihtuminen esitetään oikein.

## 2. Budjetin kopiointi seuraavalle kuukaudelle

**Paikka:** Budjetti → ”Kopioi budjetti”. Lähteeksi oletuksena valittu kuukausi ja kohteeksi seuraava; kohteen voi vaihtaa.

1. Näytetään lähde, kohde ja aktiivinen talous.
2. Esikatselu kertoo lisättävät kategoriat ja kohteessa jo olevat budjettisummaa sisältävät kategoriat.
3. Oletus on ”Täydennä puuttuvat”. Myös tietoisesti nollaksi asetettu kohdebudjetti säilytetään. Vaihtoehto ”Korvaa kohdebudjetti” vahvistetaan erikseen.
4. Käyttäjä hyväksyy yhden kokonaismuutoksen, joka tallentuu nykyisen automaattitallennuksen kautta.

Kopioidaan vain suunnitellut kategoriabudjetit. Kirjauksia, manuaalisia toteumia, kuukauden vahvistuksia ja tapahtumien tiloja ei kopioida. Arkistoidut tai poistuneet kategoriat näytetään esikatselussa ohitettavina; niitä ei luoda takaisin automaattisesti. Nykyiset budjettiavaimet ovat kategorianimiä, joten nimenvaihdon ja arkistoinnin käsittely tarkistetaan ennen kopiointia; laajaa kategoriamigraatiota ei liitetä tähän ominaisuuteen.

Ensiversioon ei tarvita nimettyjen budjettipohjien kirjastoa: olemassa oleva kuukausi toimii pohjana. Nimetyt pohjat voidaan lisätä myöhemmin käyttötarpeen perusteella. Peruminen käyttää nykyistä kumoamismekanismia vain, jos se on turvallinen suhteessa myöhempiin muutoksiin ja pilviversioon.

**Valmis, kun:** joulukuusta tammikuuhun kopiointi toimii, kohteen olemassa olevat arvot säilyvät oletuksena ja esikatselun jälkeen muuttunut lähtötilanne vaatii uuden esikatselun.

## 3. Ohjattu kuukauden tarkistus

**Paikka:** yhteenvedossa ”Tarkista kuukausi”, ensisijaisesti päättyneelle kuukaudelle. Ei pakollista käynnistysikkunaa.

Kolme vaihetta:

1. **Tulot:** kirjausten yhteenveto, mahdollisuus korjata ja ”Tulot tarkistettu”.
2. **Menot:** kulutus, säästäminen ja sijoittaminen erikseen; budjetin manuaaliset toteumat sekä poikkeavat tapahtumat näkyviin; ”Menot tarkistettu”.
3. **Yhteenveto:** kuukauden luvut ja tarkistustila. Oikopolku seuraavan kuukauden budjetin kopiointiin.

Käytetään olemassa olevia `coverage.incomeMonths`- ja `coverage.expenseMonths`-vahvistuksia. Ei toista ”suljettu kuukausi” -totuutta eikä muokkauslukkoa. Keskeytetty tarkistus säilyttää vain jo vahvistetut osat. Merkintä tarkoittaa käyttäjän tarkistusta, ei pankin vahvistamaa maksua.

Korjaus avaa vaikutuksen alaiset tarkistukset uudelleen. Nykyistä `coverageAfterEntryChanges`-logiikkaa täydennetään: tuleva hinnanmuutos ei saa avata muuttumattomia menneitä kuukausia; budjettitoteuman muutos puolestaan vaatii menojen uuden tarkistuksen. Pelkkä budjettisuunnitelman, esitystavan tai alkuperätiedon muutos ei muuta tulon tai menon toteumaa.

**Valmis, kun:** käyttäjä voi keskeyttää ja jatkaa, korjata jo tarkistettua kuukautta ja nähdä, mitä tarvitsee tarkistaa uudelleen. Toisessa selaimessa muuttunut pilviversio käsitellään nykyisen ristiriitamenettelyn kautta.

## 4. Vuosikello ja kuukausivaraus

**Paikka:** Suunnittelu-ryhmään ”Vuosikello”. Näkymässä seuraavat 12 kuukautta, mobiilissa kuukausittainen lista. Yhteenvedossa voidaan näyttää seuraava suuri erä.

### Tietojen lähde

Vuosikello käyttää olemassa olevia kertaluonteisia ja toistuvia menoja. Kalenteriin lisätty uusi meno luo tavallisen menotietueen, ei erillistä rinnakkaista laskua. Kunkin tapahtuman summa, päivämäärä ja ohitus noudattavat samoja sääntöjä kuin muu sovellus. Käyttäjä valitsee, mille menoille suunnitellaan erillinen varaus; jokaista päivittäisostosta ei tarvitse näyttää varaussuunnitelmana.

### Kaksi eri lukua

- **Tasainen vuosivaraus:** esimerkiksi kerran vuodessa maksettava 1 200 € → **100 €/kk**. Kahdesti vuodessa maksettava 600 € tarkoittaa samaa. Tämä on normaalin täyden vuoden suunnitteluluku; kertamenolle ei väitetä automaattista vuosittaista toistumista.
- **Tarve seuraavaan eräpäivään:** `(seuraava maksu − tähän maksuun varattu summa) / jäljellä olevat säästökerrat`. Jos maksuun on kuusi säästökertaa eikä varausta ole, 1 200 € → **200 €/kk**. Jos varattuna on 300 €, tarve on **150 €/kk**.

Ensiversion säästökerrat lasketaan nykyisen tavoitelaskennan tapaan kuukauden välein laskentapäivästä, ensimmäinen kuukauden päästä; päivämäärät näytetään. Kuukauden loput rajataan kelvollisiin päiviin. Jos ennen eräpäivää ei ole yhtään säästökertaa, näytetään puuttuva summa ja ”Tarvitaan ennen eräpäivää”, ei jakoa nollalla. Riittävä varaus antaa tarpeeksi 0 €. Laskennan oletukset ovat näkyvissä.

### Varaus ja budjetti

- Kuukausivaraus lasketaan automaattisesti. ”Lisää varaussuunnitelmaan” on käyttäjän erillinen toiminto.
- Varaussuunnitelma esitetään budjetissa erillisenä suunnitteluosiona. Se kertoo kuukausittain varattavan määrän, mutta ei luo automaattisia toteutuneita menoja tai tilisiirtoja.
- Todellinen lasku lasketaan kulutukseksi kerran maksukuukautena. Varauksen näyttäminen ei kasvata kulutusmenoja toiseen kertaan. Mahdollinen oikea siirto säästöön käsitellään nykyisen säästämisen tyypin mukaan.
- ”Varattu tähän maksuun” on käyttäjän ilmoittama, tiettyyn erään kohdistettu summa; se ei ole pankkisaldo. Ensiversio ei kohdista yhteistä säästötilin saldoa automaattisesti useaan laskuun.
- Varauksen käyttö kuitataan erikseen. Pelkkä eräpäivän ohittuminen tai päivämäärästä johdettu ”toteutunut” ei kuluta varausta eikä vahvista laskua maksetuksi.
- Hintamuutos, eräpäivän muutos ja ohitettu maksu päivittävät ennusteen. Aiemmin tallennettua budjettisuunnitelmaa ei korvata hiljaisesti: tarjotaan päivityksen esikatselu.

**Tietomalli:** pienet varaussuunnitelmat viittaavat menon tunnisteeseen; varatut määrät lisäksi nimenomaiseen tapahtumapäivään. Summaa ja toistuvuutta ei kopioida toiseen laskurekisteriin. Menon poistaminen tai siirtäminen tunnistetaan, ja irtoavan varauksen käsittely vahvistetaan. Tallennetaan vain käyttäjän valinnat ja kohdistukset, ei uudelleen laskettavaa kalenteria.

**Valmis, kun:** 12 kk:n tasaus ja seuraavan erän kiinniottotarve eroavat oikein, senttipyöristys ei aliarvioi tarvetta, samaa erää ei monisteta ja kulutus pysyy samana varauksen lisäämisen jälkeen.

## 5. Toistuvan menon hinnanmuutos

**Paikka:** toistuvan menon toimintovalikko → ”Muuta hintaa”. Lomakkeella vain **Alkamispäivä** ja **Uusi hinta**, lisäksi esikatselu ensimmäisestä muuttuvasta maksusta.

- Vanha hinta säilyy ennen alkamispäivää. Uusi hinta koskee sen jälkeisiä tapahtumia alkamispäivä mukaan lukien.
- Voimaantulo ratkaistaan sovelluksen käyttämän tapahtumapäivän perusteella, myös pankkipäiväsiirroissa. Esikatselu näyttää täsmällisesti, mihin maksuun muutos osuu.
- Yksittäiselle tapahtumalle asetettu summakorjaus ohittaa sarjan hinnan. Käyttöliittymä kertoo poikkeuksesta; ”palauta sarjan hinta” poistaa vain tämän korjauksen.
- Historiassa voi olla useita hinnanmuutoksia. Samalle päivälle ei tallenneta kahta eri hintaa. Takautuva muutos näyttää vaikutuskuukaudet ja pyytää vahvistuksen.
- Tietomallissa säilyvät perushinta ja järjestetty voimaantulohistoria. Pelkkää nykyistä `amount`-kenttää ei korvata niin, että historia muuttuisi.
- Myös hinnanmuutoksen korjaus ja poisto näyttävät vaikutuksen ennen tallennusta. Tavallinen menon muokkaus ei saa kiertää näitä sääntöjä ja vahingossa kirjoittaa koko hintahistoriaa uudelleen.

**Tekniikka:** hinnan ratkaisu keskitetään `occurrenceAmount`-funktioon. Tarkistetaan myös suorat `amount`-käytöt, raportit, tulevat tapahtumat, tuonti ja vienti sekä kuukausien tarkistuslogiikka. Vanha tietue ilman historiaa toimii entiseen tapaan.

**Valmis, kun:** tuleva muutos ei muuta vanhoja summia, useat hinnat ja poikkeukset toimivat kaikissa näkymissä ja JSON-vienti/palautus säilyttää historian.

## 6. Erikseen kytkettävä ”Mitä jos” -tila

**Paikka:** Laskurit → ”Kokeile omaa taloutta”. Kytkin aloittaa erillisen kokeilun, ja sivun yläosassa näkyy koko ajan ”Kokeilutila – ei muuta taloutesi tietoja” sekä ”Lopeta kokeilu”.

Ensiversiossa kokeillaan rajattuja muutoksia: tulot ± €/kk, kulutusmenot ± €/kk sekä yksittäisen toistuvan menon poistuminen tai hinnanmuutos. Tuloksena näytetään kuukausittaisen käyttövaran ja 12 kuukauden kassavirran ero lähtötilanteeseen. Kyseessä on oletuksiin perustuva laskelma, ei pankkisaldoennuste. Epäsäännöllisiä eriä ei kerrota sokeasti kahdellatoista.

- Kokeilu käyttää muistissa olevaa erillistä lähtötilannekopiota ja muutoksia. Se ei kutsu oikean talouden `commit`- tai pilvitallennuspolkua.
- Kokeilun aikana muokataan vain kokeilupaneelin kenttiä. Tavalliset kirjauslomakkeet eivät muutu salaa kokeilulomakkeiksi. Sivulta poistuminen päättää kokeilun vahvistuksen jälkeen.
- Oikean talouden keskeneräiset tallennukset toimivat normaalisti myös kokeilun aikana. Kokeilu ei muuta henkilökohtaisia asetuksia eikä kuukauden tarkistuksia.
- Jos oikea talous päivittyy toisessa istunnossa, kokeilun lähtötilanne ei vaihdu kesken laskelman. Näytetään ”Lähtötiedot ovat muuttuneet” ja tarjotaan kokeilun aloittamista uudelleen.
- Talouden vaihto tai uloskirjautuminen päättää kokeilun ja tyhjentää kopion. Selaimen päivitys hävittää kokeilun; tästä kerrotaan alussa.
- Ensiversiossa ei ”tallenna oikeaksi taloudeksi” -painiketta. Kokeilun lopetus ei koskaan automaattisesti hyväksy muutoksia. Olemassa olevat sijoituslaskurin tallennetut skenaariot säilyvät ennallaan.

**Valmis, kun:** kokeilumuutokset eivät näy pilvipyyntöjen sisällössä, oikean talouden viennissä, vahvistuksissa tai toisessa selaimessa. Poistuminen, päivitys ja talouden vaihto ovat yksiselitteisiä.

## 7. Kirjauksen alkuperä

**Paikka:** kirjauksen tietokortissa hillitty ”Lisätty käsin”, ”Tuotu CSV:stä”, ”Kuitista”, ”Laskusta” tai ”Alkuperä ei tiedossa”. Listalla vain tarvittaessa pieni merkintä.

- Lisätään rajattu rakenteinen alkuperäkenttä. Vanhojen tietojen alkuperä on tuntematon; sitä ei päätellä nimestä tai kuvauksesta.
- Toistuvuus on erillinen asia kuin alkuperä: CSV:stä tuotu kirjaus voi olla toistuva. Tapahtuma kertoo tarvittaessa myös, että se kuuluu toistuvaan sarjaan.
- Käsin muokkaaminen ei muuta CSV:stä tullutta kirjausta käsin luoduksi. Alkuperä ei ole muuttumaton auditointiloki tai todiste oikeellisuudesta.
- Alkuperä asetetaan vasta hyväksytyn tuonnin yhteydessä. JSON-palautus säilyttää aiemman alkuperän, jos se on mukana ja kelvollinen.
- Ei tallenneta raakakuitteja, tiedostopolkuja, tiedostonimiä, Google-tietoja tai muuta tarpeetonta henkilötietoa alkuperän yhteyteen.

**Valmis, kun:** kaikki lisäyspolut asettavat oikean alkuperän, muokkaus säilyttää sen ja vanhat varmuuskopiot latautuvat.

## Rakenne, pilvitallennus ja yhteensopivuus

Uudet laskentasäännöt sijoitetaan `src/domain`-moduuleihin ja käyttöliittymä omiin komponentteihin. Suurta `main.tsx`-tiedostoa ei kasvateta uusilla kokonaisilla näkymillä. Uudelleenkäytetään nykyisiä rahamäärä-, päivämäärä-, modaali- ja tallennusratkaisuja. Ei uutta yleistä tilanhallintakirjastoa.

Johdetut vertailut ja laskelmat lasketaan muistissa. Talouden yhteiseen dokumenttiin kuuluvat hintahistoria, varaussuunnitelmat ja alkuperätiedot. Henkilökohtaiset esitysvalinnat pysyvät erillisissä käyttäjäpreferensseissä. Kokeilun tilaa ei tallenneta kumpaankaan. Vieraskäyttö toimii muistissa ja tukee vientiä.

Nykyinen pilvitallennus validoi dokumentit tarkasti sekä selaimessa että palvelimella. Uudet kentät eivät siksi ole vain käyttöliittymämuutos:

1. Määritellään valinnaiset kentät, turvalliset oletukset ja vanhojen dokumenttien lukeminen. Päivitetään selaimen ja palvelimen validaattorit sekä kanoninen varmuuskopiointi samalla määrittelyllä.
2. Testataan vanha dokumentti uudella lukijalla ja uusi dokumentti uudella palvelinvalidaattorilla. Tuntemattomia kenttiä ei pudoteta huomaamatta.
3. Julkaistaan ensin yhteensopiva palvelimen lukija/validaattori, vasta sitten uusia kenttiä kirjoittava käyttöliittymä.
4. Suojataan myös vanhat avoimet välilehdet: palvelin ei saa hyväksyä vanhan asiakkaan koko dokumentin tallennusta, jos se hävittäisi uudet kentät. Tarkistetaan nykyinen versio- ja revisionvalvonta ja lisätään tarvittaessa vähimmäiskirjoittajaversio. Tällöin käyttäjä saa päivityskehotuksen ja voi viedä keskeneräisen työn.
5. Säilytetään nykyinen revisiontarkistus ja sarjoitettu automaattitallennus. Monivaiheinen toiminto tallentaa hyväksytyn kokonaisuuden kerralla; ristiriitaa ei ratkaista automaattisella yhdistämisellä.

Oikeudet perustuvat edelleen nykyiseen talousjäsenyyteen ja palvelimen tarkistuksiin. Mitään uutta julkista taulua tai selaimeen toimitettavaa salaista avainta ei tarvita. Myös julkaisun palautuksen pitää osata lukea jo kirjoitetut kentät; vanhaan niitä pudottavaan asiakkaaseen ei palata suoraan.

## Toteutusjärjestys ja tarkistuspisteet

| Vaihe | Sisältö | Miksi tässä järjestyksessä |
| --- | --- | --- |
| 1 | Kuukausivertailu ja budjetin kopiointi | Hyöty heti, pääosin nykyistä tietomallia käyttäen. |
| 2 | Kuukauden ohjattu tarkistus ja vahvistusten vaikutussäännöt | Rakentuu olemassa olevien vahvistusten päälle ja tukee myöhempiä muutoksia. |
| 3 | Tietomallin yhteensopivuussuoja ja alkuperätieto | Ensimmäinen pieni lisäkenttä todentaa turvallisen julkaisutavan. |
| 4 | Voimaantulopäivään perustuva hintahistoria | Tarvitaan, jotta vuosikellon tulevat summat ovat oikein. |
| 5 | Vuosikello, eräkohtaiset varaukset ja budjetin varausosio | Käyttää jo korjattua hintalaskentaa ja tarkistussääntöjä. |
| 6 | Eristetty kokeilutila | Hyödyntää valmiita laskentasääntöjä ja vaatii oman tallennuksesta erillisen tilansa. |

Jokainen vaihe on erikseen tarkistettava ja julkaistava kokonaisuus. Käytetään synteettisiä tietoja; ei maksullisia palveluja eikä oikeiden taloustietojen kopiointia testiaineistoksi.

Laskentatesteissä painottuvat senttien pyöristys, vuoden- ja kuunvaihteet, hinnan voimaantulo, pankkipäiväsiirrot sekä poikkeusten etusija. Käyttöpoluissa testataan vieras ja kirjautunut, oma ja yhteinen talous, kaksi samanaikaista istuntoa ja verkkovirhe tallennuksessa. Kokeilutilasta varmistetaan nimenomaisesti, ettei yhtään kokeiluarvoa kirjoiteta palvelimelle. Käyttöliittymä tarkistetaan mobiilissa ja työpöydällä sekä näppäimistöllä: fokus, dialogien nimet, virheiden yhteys kenttiin ja tiedon välitys muutenkin kuin värillä.

Kaikki kuusi vaihetta ovat paikallisessa koodissa. TypeScript-tarkistus ja Vite-tuotantobuildi onnistuvat. Supabase Edge Functionia ei ole julkaistu; hinnanhistorian ja vuosikellon kirjoittava sovellusversio vaatii Edge Functionin ja staattisen verkkosovelluksen yhteisjulkaisun ennen tuotantotestausta.
