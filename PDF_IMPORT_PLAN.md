# PDF-laskujen, sopimusten ja kuittien tuontisuunnitelma

Päivitetty 10.11.2026. **Prisman, S-marketin, Alepan ja K-kaupan tekstipohjainen PDF-kuittiskannaus on toteutettu**: poiminta, tarkistus, kategoriakirjaukset, saman päivän ja summan täsmäytys sekä kumoaminen. Katso [käyttö ja varmennettu kattavuus](RECEIPT_SCANNER.md). Alla on laajempi tavoitesuunnitelma; OCR, yleiset lasku-/sopimusparserit, kuluhyvitykset ja ennusteen jäännösmalli eivät vielä ole käytössä. Ensisijainen lähde on PDF. Nykyinen kuittiskannaus kuuluu Menot-näkymään; budjetin pikatoiminto ja Menot-/Budjetti-/Asetukset-näkymän PDF-pudotus avaavat saman työkalun. Tulevien lasku-/tiliotetuontien pääpaikat täsmennetään niiden toteutussuunnittelussa.

## Uusi ensisijainen suunnitelma: tekoälyavusteinen laskun kirjaus 11.11.2026

**Tila: osittain toteutettu.** Tavallinen `index.html` sisältää Menot → Analysoi lasku -toiminnon: tekstipohjaisen PDF:n tai liitetyn tekstin esikatselu, ensisijaisesti OpenRouterin `nvidia/nemotron-3-ultra-550b-a55b:free`, tarvittaessa `openrouter/free`, valinnaisen käyttäjän Cloudflare Workerin, AI-ehdotuksen tarkistus ja kerta-/toistuvan menon lomake. OpenRouterin autentikointivirhepolku on testattu tekaistulla avaimella; onnistunutta vastausta oikealla avaimella ei ole varmennettu. Worker-palvelimen malliohjaus ja selain-CORS ovat varmentamatta. OCR, automaattinen asiakirjalajin tunnistus, laskun lähdeviitteet ja kaksoiskirjausehdotukset ovat edelleen suunnitelmia. Tämä osio tarkentaa alla olevaa vanhempaa suunnitelmaa ja menee ristiriitatilanteessa sen edelle. Erillistä kuittien tai laskujen tuontihistoriaa, dokumenttitunnisteita, lähdetekstejä tai PDF:iä ei tallenneta hyväksynnän jälkeen. Nykyinen kuittiskanneri toimii edelleen [oman ohjeensa](RECEIPT_SCANNER.md) mukaan; alla olevat vanhemmat ehdotukset ImportGroupista, pysyvästä kuittierittelystä ja automaattisesta kaksoistunnisteesta eivät kuvaa nykyistä toteutusta eivätkä ole tämän lasku-MVP:n edellytyksiä.

### Käyttäjän polku

1. **Menot → Skannaa lasku**; budjetin pikatoiminto ja nykyinen PDF-pudotus avaavat saman käsittelyn. Pudotetun PDF:n tyypistä annetaan ehdotus **Lasku / Kuitti / En tiedä**. Käyttäjä voi vaihtaa ehdotusta, eikä epävarmaa asiakirjaa kirjata automaattisesti. Tiliotteet ovat erillinen suunnitelma.
2. PDF luetaan laitteella nykyisen PDF.js-pohjan avulla. Tunnistetaan esimerkiksi laskuttaja, maksettava kokonaissumma, eräpäivä, mahdollinen laskutusjakso ja kategoriaehdotus. Poimintatuloksessa kukin kenttä on tunnistettu, tarkistettava tai puuttuva ja sen lähde voidaan näyttää. Muualla laskussa näkyvä aiempi saldo, avoin saldo, viivästyskulu, hyvitys tai ALV ei automaattisesti ole maksettava loppusumma.
3. Tarkistus näyttää muokattavat **nimi, summa, eräpäivä ja kategoria**. Ensimmäiseksi valitaan **Kertameno** tai **Toistuva lasku**. Kertameno käyttää laskun summaa ja eräpäivää; status määräytyy sovelluksen nykyisen päivälogiikan mukaan eikä todista maksua. Toistuvassa laskussa käyttäjä tarkistaa ensimmäisen eräpäivän, summan ja rytmin. Yhdestä laskusta ei päätellä varmuudella toistuvuutta, laskutusrytmiä tai seuraavan laskun määrää; epäselvä rytmi vaatii käyttäjän valinnan. Muuttuva sähkölasku on korkeintaan käyttäjän hyväksymä arvio, ei lupaus tulevien erien suuruudesta.
4. Ennen tallennusta näytetään mahdolliset samannimiset tai samansuuruiset lähipäivien menot ja käyttäjä voi perua tai jatkaa erillisenä. Ehdotus ei todista kaksoiskirjausta eikä pysyvää laskuarkistoa luoda. Luottokorttilaskussa ja osamaksussa varoitetaan mahdollisesta ostosten tai maksuerien kahteen kertaan kirjaamisesta.
5. **Lisää meno** tai **Lisää toistuva lasku** luo nykyisen menotietueen ja hyödyntää nykyisiä sarja-, kattavuus- ja kumoamissääntöjä. Ostopäivän sijasta käytetään laskun tarkistettua eräpäivää. Budjetin suunniteltu summa ei muutu automaattisesti; tapahtuman vaikutus toteumaan noudattaa nykyistä laskentaa. PDF, raaka teksti, lähteet ja väliaikaiset tekoälyvastaukset poistuvat muistista onnistuneen tallennuksen jälkeen.

### Poimintaputki ja apukeinot

**PDF → paikallinen tekstikerros → sääntöpohjaiset kenttäehdokkaat → tarvittaessa OCR → tarvittaessa LLM → validointi → käyttäjän tarkistus.** PDF:n luettavuus tarkistetaan sivukohtaisesti, ei vain sen perusteella, sisältääkö se tekstiä. Sekamuotoisessa asiakirjassa käsitellään puuttuvat sivut ilman tuplarivejä. Ensimmäinen versio käyttää laskuihin sovitettua yhteistä PDF-tekstinlukijaa; nykyinen kuittikohtainen tunnistus pysyy erillään. Tuntematon tai ristiriitainen summa jää tyhjäksi tai tarkistettavaksi. Valuutta ja päivämäärä validoidaan, summat säilytetään sentteinä. Laskun teksti ja mallin vastaus ovat epäluotettavaa dataa, eivät sovelluksen komentoja.

- **OCR vain tarvittaessa:** tekstittömälle tai käyttökelvottomalle kuvasivulle ensisijainen vaihtoehto on paikallinen Tesseract.js. Suomi, ruotsi ja englanti, OCR-aineiston koko, suoritusaika, lisenssi, selain/puhelin, `file://`, worker ja CSP on todistettava ennen valintaa. Offline-paketti voi kasvaa huomattavasti; latausta tai CDN:ää ei tehdä salaa. OCR-virheitä ei pidä kuvata varmoina tuloksina.
- **Valinnainen OCR API:** jos paikallinen OCR ei riitä, arvioidaan esimerkiksi [OCR.space API](https://ocr.space/ocrapi) ja sen senhetkiset maksuttoman tason ehdot, tietojen säilytys ja EU-/käsittelyalue. Palvelulle lähetetään kuvasivuja tai PDF vain käyttäjän nimenomaisella toimintokohtaisella hyväksynnällä. OCR-palvelun käyttöä ei pidä sekoittaa paikalliseen OCR:ään.
- **Valinnainen LLM:** jos paikallinen poiminta ei löydä kenttiä tai tuottaa ristiriidan, arvioidaan esimerkiksi [Gemini API:n maksuton taso](https://ai.google.dev/gemini-api/docs/pricing) sekä vaihtoehtoiset palvelut. Maksuttomuus, kiintiöt, avaimen saanti, datan käyttö/koulutus, säilytys, alue ja ehdot tarkistetaan virallisesta dokumentaatiosta ennen valintaa; tässä ei luvata maksutonta käsittelyä tai sopivaa yksityisyyttä. Suosi vain tarpeellisia laskurivejä; henkilötunnus, IBAN, viitenumero, osoite ja asiakasnumero poistetaan tai peitetään ennen lähetystä, mutta täydellistä anonymisointia ei luvata. Jos tunnistetietoja ei voi varmasti rajata, käyttäjä näkee lähetettävän sisällön ja voi jättää pilvikäsittelyn väliin. Pelkän tekstin lähetys ei auta kuvapohjaiseen laskuun ilman OCR:ää; multimodaalinen analyysi tarkoittaisi kuvan lähettämistä ja vaatii erillisen näkyvän hyväksynnän.
- Molemmissa ulkoisissa vaihtoehdoissa näytetään vastaanottaja, lähetettävät tiedot ja käyttäjälle aiheutuvat mahdolliset kulut ennen jokaista lähetystä. Ulkoista palvelua ei käytetä automaattisesti tai hiljaisena vararatkaisuna. Valitun palvelun API-avain pidetään vain tilapäisesti muistissa, ei HTML:ssä, varmuuskopiossa tai lokissa. Worker-pyyntö sisältää käyttäjän antaman Bearer-avaimen. Kiintiö-, verkko-, aikakatkaisu- ja CORS-virheissä säilytetään paikallinen luonnos ja käsin täyttö.
- Tavallisen yhden HTML-tiedoston CSP sallii käyttäjän käynnistämät OpenRouter- ja Worker-pyynnöt. Muut verkkopalvelut tarvitsevat rajatun CSP:n ja testatun CORS-tuen tai erikseen suunnitellun turvallisen palvelimen; avainta tai laskua ei lähetetä omalle välityspalvelimelle ilman nimenomaista suunnittelua. Ei luvata, että kolmannen osapuolen API toimii `file://`-osoitteesta. OCR-/LLM-vastaukselle rajattu koko, skeema ja aikakatkaisu; mallilla ei ole työkaluja, navigointia eikä oikeutta kirjata menoja. Vain tarkistettu käyttäjän hyväksyntä voi tallentaa.

### Toteutusvaiheet ja hyväksyntä

| Vaihe | Toimitus | Valmis kun |
| --- | --- | --- |
| 1 | Anonymisoidut suomalaiset teksti-PDF-laskut eri laskuttajilta ja käsin varmistetut odotuskentät | Aineisto kattaa monta taittoa, puuttuvat kentät, useita summia, hyvitykset ja eräpäivän; aineistoja ei tallenneta henkilötietoineen. |
| 2 | Paikallinen teksti-PDF:n luku, laskutyyppiehdotus ja validoitu luonnos | Ristiriitainen/puuttuva summa tai eräpäivä vaatii käyttäjän tarkistuksen; lähde näkyy ja dokumentin ohjeet eivät suoritu. |
| 3 | Kerta-/toistuvaismeno, duplikaattiehdotus, hyväksyntä ja kumoaminen | Käyttäjä valitsee rytmin, yksi lasku tuottaa vain valitun kirjauksen, budjetin suunnitelma säilyy ja vanhat tallennukset palautuvat. |
| 4 | Paikallisen OCR:n toteutettavuus ja valinnainen toteutus | Teksti-, kuva- ja sekapohjaisten laskujen oikeellisuus, suorituskyky, peruutus ja offline-toiminta on mitattu; epäonnistuminen sallii käsinsyötön. |
| 5 | Vapaaehtoiset OCR-/LLM-sovittimet vain palveluehtojen ja tietosuojan tarkistuksen jälkeen | Suostumus, lähetettävän datan esikatselu, avainten suoja, skeemavalidointi, CORS ja epäonnistumisen varapolku testattu erikseen. |

Testaa tarkoituksenmukaisesti rahamäärän senttierottimet, eräpäivä ja vuodenvaihde, saman päivän muut summat, monisivuisuus, OCR-virheet, dokumenttiin piilotetut käskyt, toistuvan sarjan vaikutus, tuonnin kumoaminen ja vanhan JSONin palautus. Mittaa kenttäkohtainen tarkkuus erillisellä käsin varmennetulla aineistolla sekä se, miten usein virheellistä tietoa ehdotetaan hyväksyttäväksi; älä lupaa 100 % tai 99,9 % ilman edustavaa näyttöä.

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

Yhdeksän käyttäjän toimittamaa PDF-tiedostoa (K-Citymarket, Prisma, S-market ja Alepa) on nyt varmennettu. Ne edustavat kahdeksaa eri ostosta; kaksi tiedostoa on samasta Korso-ostoksesta. Muiden formaattien, kuvallisten kuittien sekä lasku-/sopimustyyppien toteutukseen tarvitaan vielä anonymisoituja esimerkkejä. Mukaan vähintään yksi kuvallinen PDF ja yksi alennuksia/pantteja sisältävä kuitti. Ilman näitä voi tehdä parserin rungon ja synteettiset testit, mutta ei rehellisesti luvata formaattikohtaista tunnistustarkkuutta.

## Jonossa: koko näkymän drag and drop ja tilioteparseri

Käyttäjätoive 10.11.2026. **Kuittien PDF-pudotus on toteutettu Menot-, Budjetti- ja Asetukset-näkymissä; tilioteparseri ja Tulot-näkymän laajennus ovat edelleen jonossa.**

Nykyinen yhden PDF-kuitin pudotus käynnistää Menojen skannerin mistä tahansa Menot-, Budjetti- tai Asetukset-näkymässä. Alkuperäisen jatkotoiveen Tulot-näkymää ei tässä muutettu. Tuleva laajennus tunnistaa, onko kyse kuitista vai tiliotteesta, siirtyy tarvittavaan näkymään ja käynnistää sopivan parserin/prosessin; nykyinen pudotus ei vielä erottele näitä dokumenttilajeja. Tavoitteena on hyödyllinen quick-start sekä helpompi tulojen ja menojen syöttö. Kirjausten nykyinen tarkistus- ja hyväksyntäperiaate säilyy lähtökohtana.

Jatkotyöhön kuuluu myös tilioteparserin suunnittelu. Käyttäjä voi toimittaa tässä vaiheessa kahden pankin esimerkkitiliotteet; näitä ei ole vielä saatu, eikä pankkeja, tiedostomuotoja tai poimintasääntöjä ole määritelty. Tarkempi suunnittelu tehdään myöhemmin esimerkkiaineiston pohjalta.
