# PDF-laskujen, sopimusten ja kuittien tuontisuunnitelma

Suunnitelma 10.11.2026. Käyttäjän pyytämä suunnittelutyö; parseria tai PDF-tuontia ei ole vielä toteutettu. Ensisijainen lähde on PDF. Kokonaisuus kuuluu nykyiseen Tuonti ja vienti -näkymään, johon meno-, velka- ja budjettinäkymät voivat avata saman tuonnin esivalitulla kohteella.

## Tavoite ja kaksi käyttötapaa

1. **Lasku tai sopimus → tarkistetut perustiedot → uusi meno, olemassa olevan maksun päivitys tai velan luonti/päivitys.**
2. **S- tai K-kaupan PDF-kuitti → tuoterivit → ehdotetut kategoriat → tarkistus → olemassa olevan kategorian budjettitoteuma.**

Poiminta tuottaa luonnoksen. Käyttäjä hyväksyy kirjaukset yhdellä yhteisellä vahvistuksella; tuonti ei tallenna epävarmoja arvauksia automaattisesti. Dokumenttilaji voidaan myös vaihtaa käsin. Tavoitteena on tarkistaa vain puuttuvat ja epäselvät kohdat, ei täyttää koko lomaketta uudelleen.

## Käyttöpolku

**Valitse PDF → Tarkista → Tallenna.**

- PDF:n voi valita, pudottaa tai jakaa sovellukselle, jos käyttöympäristö tukee jakamista. Kamera on myöhempi laajennus.
- Tekstin löytyessä poiminta alkaa heti. Kuvapohjainen sivu ohjataan OCR:ään. Sekadokumentissa käsitellään vain ne sivut OCR:llä, joilta teksti puuttuu tai on käyttökelvotonta; samaa sisältöä ei yhdistetä kahdesti.
- Tarkistusnäkymässä pääluvut ovat ensimmäisinä: toimittaja/kauppa, summa, päivä ja kohde. Lähteen PDF-kohta avautuu poimitun kentän vierestä.
- Käyttäjälle näytetään erikseen **tunnistettu**, **tarkistettava** ja **puuttuu**. Teknisen mallin pistemäärää ei esitetä varmana todennäköisyytenä.
- Hyväksyntäpainike kertoo vaikutuksen: esimerkiksi **Lisää 42,60 € toteumaan** tai **Päivitä lasku 78,50 €**. Ennen painamista näkyvät luotavat ja päivitettävät tietueet.
- Tallennuksen jälkeen yksi yhteenveto ja **Kumoa tuonti**. Luonnoksen voi keskeyttää ilman talouden muutoksia.

## 1. Laskun ja sopimuksen poiminta

### Dokumenttilajit

Sähkö, vesi/lämpö, vakuutus, puhelin/internet, laite- ja osamaksusopimus, luottosopimus, luottokorttilasku sekä yleinen lasku. Dokumentilla voi olla useampi rooli: esimerkiksi osamaksusopimus sisältää sekä rahoitusehdot että laskutusaikataulun. Luokittelua ei ratkaista yhdestä sanasta.

### Yhteiset kentät

- Toimittaja, dokumenttilaji, lasku-/sopimusnumero ja mahdollinen maksun yksilöivä viite.
- Laskutuspäivä, **eräpäivä**, sopimuksen alku/loppu ja laskutusjakson alku/loppu erillisinä.
- Maksettava loppusumma, valuutta ja mahdollinen eräkohtainen laskuerittely.
- Maksuväli: kerta, kuukausi, neljännesvuosi, vuosi tai muu.
- Kategoriaehdotus ja perustelu. Tuonti ei muuta käyttäjän kategoriabudjetin määrää itsestään.

**Kuukausierä**, **tämän laskun maksettava summa** ja **vertailua varten laskettu kuukausihinta** ovat eri kenttiä. Esimerkiksi 240 €/vuosi on 20 €/kk vertailuhintana, mutta maksettava lasku on edelleen 240 €. Kulutusperusteista sähkölaskua ei muuteta toistuvaksi kiinteäksi menoksi ilman käyttäjän valintaa. €/kWh on yksikköhinta, ei kuukausikulu. Osittainen tai epäselvä laskutusjakso ei anna varmaa keskihintaa.

### Luotto- ja laitesopimusten lisäkentät

- Alkuperäinen luotto, nettomääräinen nosto sekä erikseen ilmoitettu **jäljellä oleva pääoma ja sen päivämäärä**.
- Kuukausierä, maksuerien määrä, ensimmäinen maksupäivä ja mahdollinen viimeinen suurempi erä.
- Nimelliskorko, viitekorko, marginaali ja sopimuksessa ilmoitettu todellinen vuosikorko erillisinä.
- Avauskulu, erä-/tilinhoitokulu ja muut kulut omilla ajoitustiedoillaan.
- Takaisinmaksun alkaminen, lyhennysvapaa sekä mahdollinen koron pääomitus vain, jos ne löytyvät dokumentista.

**Kuukausierä ei ole velan pääoma.** Luoton kokonaishinta ei ole jäljellä oleva velka. Nimelliskorkoa ei korvata todellisella vuosikorolla. Sopimus ei yksin todista nostoa tai maksettuja lyhennyksiä. Jos nykyistä velkasaldoa ei ole ilmoitettu, se kysytään käyttäjältä tai jätetään velan luonti tarkistettavaksi; alkuperäistä luottoa ei nimetä nykyiseksi saldoksi. Sopimuksen vuosikorko ja sovelluksen laskennallinen arvio näytetään erikseen.

### Kirjauksen kohde

| Valinta | Tallennus ja vaikutus |
| --- | --- |
| Uusi kertameno | Summa, eräpäivä ja kategoria nykyiseen menopolkuun. Tuleva maksu on suunniteltu. |
| Toistuva lasku | Maksuväli ja ensimmäinen erä tarkistetaan; yksittäinen lasku voi antaa sarjalle vain yhden esiintymän summapoikkeuksen. |
| Olemassa oleva maksu | Ehdotetaan toimittajan, tunnisteen, summan ja päivän perusteella. Päivitetään sama tietue tai sarjan yksi esiintymä, ei lisätä uutta rinnalle. |
| Uusi/päivitettävä velka | Käyttäjä tarkistaa pääoman, saldopäivän ja korot/kulut. Mahdollinen omaisuuslinkki valitaan. Velka ja sen maksu ovat erilliset, linkitetyt tiedot. |
| Meno budjettikategoriaan | Käytetään olemassa olevaa budjettikategoriaa. Menotapahtuma päivittää toteuman normaalin laskennan kautta, ei erillistä budjettisummaa. |

Luottokorttilasku ei lisää ostoksista uutta kulua, jos ostokset on jo kirjattu. Laitehankinnan koko hintaa ja osamaksueriä ei kirjata samanaikaisesti kulutukseksi. Epäselvässä tapauksessa kysytään **Onko ostos jo kirjattu?** ja näytetään vaikutus ennen tallennusta. Velan saldoa ei alenneta sekä maksutuonnin että laskennallisen lyhennyksen perusteella kahteen kertaan: maksun vahvistaminen ja lähtösaldon mahdollinen päivittäminen tarvitsevat yhteisen täsmäytyksen.

## 2. S- ja K-kaupan sähköiset kuitit

### Poimittavat tiedot

Kaupparyhmä, kauppa/Y-tunnus, kuitin tunniste, ostoajankohta, valuutta, maksettu summa ja maksutavat. Tuoterivillä: alkuperäinen nimi, tuotekoodi/EAN jos saatavilla, määrä/yksikkö, yksikköhinta, rivin bruttosumma sekä siihen liittyvät alennukset/palautukset. ALV-osuudet ovat lisätietoja: niitä ei lisätä verolliseen loppusummaan uudelleen.

S- ja K-kaupalle tehdään omat sovittimet yhteisen tekstirakenteen päälle. Formaattia ei oleteta tunnetuksi ilman esimerkkiaineistoa: eri kaupat, verkkokauppa-/myymäläkuitit ja eri PDF-versiot voivat poiketa. Molempien sovittimien on palautettava sama skeema ja alkuperäisen rivin lähdekohta.

### Luokittelu nopeasti

1. Käyttäjän aiemmin hyväksymä tuotetunnus/EAN → sama kategoria.
2. Kaupparyhmäkohtainen tuotetieto tai tarkka paikallinen nimi-/tunnistesääntö.
3. Selvä nimiehdotus, esimerkiksi elintarvike, hygieniatarvike tai kosmetiikka.
4. Epäselvä tuote → **Valitse kategoria**. Tuntematonta ei piiloteta automaattisesti ruokaan.

Tarkistus näyttää oletuksena kategorioittain niputetut summat. Tuoterivit avautuvat ryhmästä. **Vain tarkistettavat** näyttää epäselvät rivit; yhdellä valinnalla voi luokitella monta samankaltaista riviä. Valitsimessa ovat haettavat kategoriat, viimeksi käytetyt ja muutama kontekstin mukainen ehdotus. Näppäimistöllä valinta ja siirtyminen seuraavaan epäselvään riviin tapahtuvat ilman ylimääräistä ikkunaa. Käyttäjä voi valita **Muista tälle tuotteelle**; oppiminen on paikallista eikä yleinen sääntö muutu vahingossa yhden poikkeusostoksen vuoksi.

Alkuperäinen rivinimi näkyy aina tarvittaessa. Arvattu tai lyhennetty nimi ei korvaa lähdetietoa. Monirivinen tuotenimi, painotuote ja sen määrä-/hintarivi yhdistetään yhdeksi tuotteeksi.

### Täsmäytys ennen tallennusta

- Tuotekohtainen alennus yhdistetään oikeaan tuotteeseen; myös kampanjan omat miinusrivit käsitellään.
- Koko ostosta koskeva alennus kohdistetaan sääntöjen salliessa suhteessa tuotteiden nettosummiin. Senttijäännös jaetaan deterministisesti suurimpien jäännösten menetelmällä. Näytetään tarvittaessa kohdistus.
- Pantit, palautetut pantit, toimitusmaksu, kassit ja muut erät eivät katoa. Ne luokitellaan erikseen tai hyväksytään samaan kulukategoriaan.
- Maksutaparivi, lahjakortin käyttö tai kortin katevaraus ei ole toinen ostos. Lahjakortin ostoa ja sillä maksettua kulutusta ei kirjata kahteen kertaan.
- Palautus ei ole uusi palkkatulo. Palautukset tarvitsevat kuluhyvityksen ja mahdollisen alkuperäisen tapahtuman linkin; niitä ei muuteta väkisin positiivisiksi menoiksi.
- Kohdistettujen nettotuoterivien, kulujen ja hyvitysten summan on oltava **sentilleen sama kuin maksettu loppusumma**. Poikkeama näytetään omana ratkaistavana rivinä. Toleranssilla ei hävitetä euroja.

### Budjettiin vieminen

Esimerkki: kuitti 60 €, josta ruoka 45 € ja hygienia 15 €. Tuonti luo yhden tuontiryhmän ja kaksi kategoriakohtaista menokirjausta. Kuitin 60 € on ryhmän tarkistussumma, **ei kolmas menokirjaus**. Tuoterivit ja lähdeviitteet kuuluvat ryhmän erittelyyn, ja kaikki ryhmän kirjaukset voidaan avata ja kumota yhdessä.

- Olemassa olevat kategoriabudjetit säilyvät. Toteuma syntyy tuoduista tapahtumista niiden ostopäivän kuukauteen, ei sovelluksessa valittuun kuukauteen.
- Jos sama 60 € maksu on jo kirjattu, käyttäjä valitsee **Täsmäytä olemassa olevaan**. Jo kirjattu meno jaetaan tarvittaessa 45/15 €:ksi atomisesti; vanha 60 € ei jää lisäksi mukaan.
- Toistuvan sarjan yksi esiintymä käsitellään erikseen. Kategorian muuttaminen yhden kuitin vuoksi ei saa vaihtaa koko sarjan kategoriaa. Tämä vaatii ryhmän ja esiintymän täsmäytyksen, ei vain nykyisen sarjan peruskenttien muokkausta.
- Kuukausittainen ruokamenoarvio 500 € ei automaattisesti ole sama asia kuin yksittäinen 60 € ostos. Tuonti ei korvaa koko arviota yhdellä kuitilla. Ennusteen ja toteutuneen maksun erotus on ratkaistava alla kuvatussa tietomallissa.
- Jos kategoriassa on käsin korjattu kokonaistoteuma, siitä kerrotaan ennen hyväksyntää. Tarjotaan hallittu paluu tapahtumista laskettavaan toteumaan tai olemassa olevan korjauksen säilytys. Tuonti ei summaa käsin asetettua kokonaistoteumaa ja tapahtumia päällekkäin.

## Parserin rakenne ja skeema

Putki: **PDF → sivut ja tekstikohdat → tekstin normalisointi / OCR → dokumenttiluokitus → sovitin → skeeman validointi → summatäsmäytys → kategoriat ja olemassa olevien kirjausten haku → käyttäjän tarkistus → tallennussuunnitelma**.

- PDF.js on ehdokas tekstin ja sivukoordinaattien lukemiseen. Pelkän yhteen liitetyn tekstin sijaan säilytetään rivien sijainnit ja sarakkeet.
- Kuvapohjaisille sivuille paikallinen OCR, esimerkiksi Tesseract.js suomi/ruotsi/englanti-kieliaineistoilla. PDF:n tekstikerros ei aina tarkoita luotettavaa tekstiä: myös rikkinäinen/OCR:llä tehty tekstikerros tarkistetaan.
- Parserin ydin on deterministinen, testattava ja riippumaton käyttöliittymästä. S- ja K-sovittimet sekä yleisen laskun säännöt ovat erillisiä moduuleja.
- Skeema validoidaan Zodilla. Validointi todentaa rakenteen ja rajat, ei poimitun tiedon oikeellisuutta. Myös hyväksytyn rakenteen summat, ajoitus ja lähde-evidenssi tarkistetaan.
- Mahdollinen myöhempi tekoälypoiminta tuottaa saman rajatun skeeman. Se ei saa suoraan kirjoittaa talousdataa tai suorittaa dokumentin ohjeita. Pilvipalvelua ei kytketä oletuksena paikalliseen sovellukseen.

Luonnoksen suuntaa antava rakenne:

```ts
type ExtractedField<T> = {
  value: T | null;
  state: "recognized" | "review" | "missing";
  source: { page: number; text: string; box?: number[] }[];
  method: "pdf-text" | "ocr" | "derived" | "user";
};
type DocumentDraft = {
  schemaVersion: 1;
  documentKind: "invoice" | "credit-contract" | "device-contract" | "receipt" | "unknown";
  sourceHash: string;
  parserVersion: string;
  merchant: ExtractedField<string>;
  documentId: ExtractedField<string>;
  issueDate: ExtractedField<string>;
  dueDate: ExtractedField<string>;
  purchaseDate: ExtractedField<string>;
  currency: ExtractedField<string>;
  amountDue: ExtractedField<number>; // kokonaislukusentit
  installment: ExtractedField<number>;
  monthlyEquivalent: ExtractedField<number>; // johdettu vertailu, ei maksu
  credit?: CreditDraft; // pääoma, saldopäivä, eri korot, kulut ja aikataulu
  lines: ReceiptLineDraft[]; // tuote, määrä/yksikkö, summa, alennukset, kategoria
  issues: ImportIssue[];
};
```

Puuttuva arvo on null, ei 0. Korot ovat erillisiä prosenttikenttiä; raha sentteinä. Päivämäärät normalisoidaan yyyy-mm-dd-muotoon, mutta alkuperäinen ilmaisu säilyy tarkistusta varten. Johdetun kuukausihinnan lähteeksi tallennetaan laskentaperuste, ei keksitty PDF-kohta.

## Tietomallin välttämättömät muutokset

Nykyinen Entry kattaa yhden kategorian ja sarjan päiväkohtaisen summa-/tilapoikkeuksen. Se ei yksin riitä monikategoriseen kuittiin, kuluhyvitykseen tai ennusteen ja maksun täsmäytykseen.

1. **ImportGroup / ReceiptGroup**: lähteen tiiviste, dokumenttitunniste, osto-/laskupäivä, tarkistussumma, tuoterivit ja syntyneet/muutetut tapahtumat. Ryhmä ei itsessään ole kassavirtakirjaus.
2. **ImportLink**: tietue-/esiintymäviite ja muutoshistoria, jolla sama maksu täsmäytetään eikä tuoda uudelleen.
3. **Kulukirjauksen suunta**: meno tai kuluhyvitys. Laskenta, budjetit ja raportit käsittelevät hyvityksen kulun vähennyksenä, eivät tulona. Nykyistä positiivisten Entry.amount-arvojen validointia ei kierretä tuomalla negatiivista summaa luvatta.
4. **Ennuste ja maksutapahtuma**: erotetaan suunnitteluarvio oikeasta lasku-/ostotapahtumasta. Arvion päivämäärän ohittuminen ei yksin tee siitä maksettua ostosta. Toteumiin lasketaan maksut; jäljellä oleva ennuste huomioidaan vain suunnittelussa. Ennusteeseen kohdistetut maksut vähentävät ennusteen jäljellä olevaa osaa sovitulla säännöllä. Vanhoja kirjauksia ei luokitella uudelleen ilman tarkistusta.
5. **Velan sopimustiedot**: alkuperäinen luotto ja nykyinen pääoma, pääoman päiväys, nimellinen/ilmoitettu todellinen korko, kulut ja maksuaikataulu erillisinä. Pelkkä OCR-tulos ei käynnistä oletettua takaisinmaksua.
6. **Paikallinen luokittelumuisti**: käyttäjän hyväksymät EAN-/nimisäännöt, kauppakohtaisuus ja mahdollisuus poistaa sääntö.

Muutokset suunnitellaan versionoituna migraationa; nykyistä schemaVersion 1:tä ei rikota vain lisäämällä tunnistamattomia pakollisia kenttiä. Vanhat JSON-varmuuskopiot on edelleen voitava palauttaa. Uusi ryhmä-/kuluhyvitysdata siirtyy JSONissa; CSV:n rajoitukset ja mahdollinen erillinen erittelyvienti nimetään.

## Kaksoistuonti, tallennus ja kumoaminen

Tarkistetaan sekä tiedoston SHA-256 että semanttinen tunniste: toimittaja/kauppa + dokumentti-/kuittitunniste + päivä + loppusumma. Sama kuitti eri PDF-tiedostona ei ohita tarkistusta pelkän tiedostotiivisteen vuoksi. Puuttuvat tunnisteet johtavat mahdollisen kaksoiskirjauksen tarkistuslistaan; samanhintaista eri ostosta ei estetä automaattisesti.

Tallennussuunnitelma on yksi atominen tilapäivitys: ryhmä, menot, esiintymämuutokset, velka ja luokittelumuistin hyväksytyt muutokset onnistuvat yhdessä tai eivät ollenkaan. Käytetään nykyistä tallennuksen ristiriitatarkistusta ja kuitataan onnistuminen vasta tallennuksen varmistuttua. Kumoaminen palauttaa myös muutetun alkuperäisen maksun ja budjetin kattavuusvahvistuksen. Myöhempää käyttäjän muokkausta ei saa ylikirjoittaa vanhalla tuontisuunnitelmalla.

## Paikallisuus, PDF-käsittely ja jakelu

PDF käsitellään oletuksena selaimessa; alkuperäistä tiedostoa ei lähetetä palvelimelle eikä säilytetä automaattisesti localStoragessa. Varmuuskopioon tallennetaan ryhmä, kirjaukset ja tarpeelliset lähdeviitteet. Koko PDF:n säilyttämisestä tulee myöhemmin erillinen valinta. IBANia, henkilötunnusta tai koko maksukorttitietoa ei tarvita menon luontiin.

Ehdotetut ensimmäiset rajat ovat 20 MiB ja 50 sivua. Käsittely keskeytyy käyttäjän pyynnöstä, näyttää etenemisen ja tekee rasteroinnin sivu kerrallaan. Rajoja tarkennetaan puhelintesteillä. Kesken jätettyä tai rajattua poimintaa ei esitetä koko dokumentin onnistuneena tulkintana. Salattu PDF pyytää salasanan vain istunnoksi; lukukelvoton tiedosto antaa selkeän virheen.

PDF:n skriptejä, upotettuja ohjelmia tai ulkoisia linkkejä ei suoriteta. PDF-esikatselu perustuu parserin renderöimiin sivuihin. Dokumentin sisältö on dataa, ei sovellukselle annettuja ohjeita.

Nykyisen offline-/yhden HTML-tiedoston jakelu säilytetään tekstipohjaiselle PDF-tuonnille. OCR:n WASM-, worker- ja kieliaineistot ovat suuria: tehdään erillinen täydellinen offline-OCR-build, johon ne pakataan paikallisesti, eikä piilotettua CDN-latausta. Ennen kirjaston valintaa varmennetaan lisenssi, ajantasainen versio, työntekijäsäikeet sekä nykyisen CSP:n ja file://-käytön toiminta; suojausta ei löysätä kokeilematta rajattua ratkaisua. Mobiilin muisti ja tiedoston koko ovat erilliset hyväksymiskriteerit.

## Toteutusjärjestys ja tarkistuspisteet

| Vaihe | Toimitus | Valmis kun |
| --- | --- | --- |
| 1. Aineisto ja sääntökirja | Anonymisoidut teksti-/kuva-/sekamuotoiset PDF-fixturet, erilliset S/K-versiot ja poiminnan skeema | Todelliset muodot on dokumentoitu; odotetut kentät ja rivit on tarkistettu käsin |
| 2. Kirjausten perusta | Tuontiryhmät, kuluhyvitys, ennuste/maksu-erottelu ja täsmäytyssäännöt | Kategoriasummat, kassavirta ja kumoaminen eivät kaksinkertaista maksuja; vanha JSON palautuu |
| 3. Lasku-/sopimus-MVP | Tekstipohjainen PDF, tunnistus, muokattava luonnos, meno/velka/täsmäytys | Summa/erä/pääoma eivät sekoitu; epäselvät kentät vaativat tarkistuksen; yksi hyväksyntä |
| 4. S/K-kuitti-MVP | Tuoterivit, alennukset, kategoriat, nopea eräluokittelu ja olemassa oleva budjetti | Tuonnin nettosumma vastaa kuittia sentilleen ja jokainen euro kohdistuu vain kerran |
| 5. OCR | Kuvalliset ja sekamuotoiset PDF:t paikallisesti | Samat fixture-odotukset, peruutus, näkyvä OCR-epävarmuus ja puhelimen muistirajat toimivat |
| 6. Viimeistely | Luokittelumuisti, monen PDF:n käsittely ja sujuva mobiili/näppäimistöpolku | Toistuva kuitti vaatii vähemmän korjauksia; mikään muistiin opittu sääntö ei ohita täsmäytystä |

Suositus on tämä järjestys: ensin talouskirjausten oikeellisuus, sitten automaattisen poiminnan kattavuus. Yhden toimittajan lasku ei vielä tarkoita yleistä laskutukea. S/K-tuki ilmoitetaan tuetun testatun formaatin tasolla.

## Testaus ja hyväksyminen

- Suomalaiset desimaalit ja välilyönnit, valuuttamerkit, negatiiviset palautukset, OCR:n numero-/päivämäärävirheet sekä useat mahdolliset loppusummat.
- Eräpäivä vs laskutuspäivä, maksuväli vs vertailuhinta, pääoma vs kokonaishinta, nimelliskorko vs todellinen korko, lyhennysvapaa ja epäselvä jäljellä oleva saldo.
- S- ja K-fixturet: rivinvaihdot, painotuotteet, monikappalehinnat, tuote-/ostotason alennukset, pantit, palautukset, useat maksutavat ja ALV-yhteenveto.
- Täsmäytyksen invarianssit: ryhmän nettosumma = maksettu summa = sen budjettiin/kassavirtaan vaikuttavien kirjausten nettosumma. Sama dokumentti kahdesti ei lisää toteumaa. Tallennus ja kumoaminen palauttavat myös olemassa olevien tietueiden muutokset.
- Toistuvan menon yksi esiintymä, kuukausien vaihde, eri ostokuukausi kuin ylävalikossa, käsin korjattu kategoriatoteuma sekä ennusteen osittainen kattaminen usealla kuitilla.
- Virheelliset/salatut/isot PDF:t, osittainen OCR, tallennusristiriita ja selaimen kiintiön loppuminen eivät muuta taloutta puolittain.
- Käyttötestissä mitataan hyväksymisaika, käsin korjattavien kenttien määrä, tunnistettujen rivien osuus ja väärät kategoriat erikseen. Nopeustavoitteet asetetaan fixturet ja laitteet tuntien; nollan kriittisen automaattivirheen vaatimus tarkoittaa epävarmojen tapausten pysäyttämistä tarkistukseen.

## Vielä tarvittava aineisto

Toteutuksen alussa tarvitaan anonymisoituja esimerkkejä S- ja K-kaupan todellisista PDF-kuiteista sekä lasku-/sopimustyypeistä. Mukaan vähintään yksi kuvallinen PDF ja yksi alennuksia/pantteja sisältävä kuitti. Ilman näitä voi tehdä parserin rungon ja synteettiset testit, mutta ei rehellisesti luvata formaattikohtaista tunnistustarkkuutta.
