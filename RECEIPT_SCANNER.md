# Kuittiskannaus — toteutettu 10.11.2026

## Käyttö

**Menot → Skannaa kuitti → Valitse PDF → Tarkista → Kirjaa menoihin.**

Budjetin **Skannaa kuitti** avaa saman skannerin menoissa. Tietokoneella yhden PDF-kuitin voi myös pudottaa mihin tahansa Menot-, Budjetti- tai Asetukset-näkymässä: sovellus siirtyy menoihin, avaa skannerin ja käynnistää poiminnan. Tuonti ja vienti sisältää siirtymäpainikkeen samaan pääpaikkaan, ei toista skanneria.

1. Valitse Prisman, S-marketin, Alepan tai K-Citymarketin tekstimuotoinen PDF-kuitti. PDF luetaan selaimessa ilman verkkoyhteyttä tai tiedoston lähettämistä.
2. Tarkista kauppa, ostopäivä, loppusumma ja tuoterivit. Summan on täsmättävä sentilleen. Luokittelut ovat paikallisia nimisääntöihin perustuvia ehdotuksia, eivät varmoja tuotetietoja.
3. Vaihda tarvittaessa tuotteen kategoria. Tuntematon tuote jää valittavaksi. **Vain luokittelemattomat**, **Valitse näkyvät** ja kategoriavalinta luokittelevat monta tuotetta kerralla. Valitut valinnaiset oletuskategoriat, kuten Vaatteet, otetaan käyttöön hyväksynnässä.
4. Jos samalle päivälle löytyy samansuuruinen meno, valitse sama maksu korvattavaksi tai vahvista eri ostos. Toistuvasta sarjasta korvataan vain kuitin päivälle osuva tapahtuma; muut esiintymät säilyvät.
5. Käsin asetettu kategoriatoteuma edellyttää erillistä hyväksyntää paluulle kirjauksista laskettavaan toteumaan. Budjetin suunniteltua summaa ei muuteta.
6. Vahvista tarkistus ja kirjaa. Kategoriakohtaiset menot syntyvät kuitin ostopäivälle, riippumatta ylävalikon kuukaudesta. Kuitin loppusumma ei synny lisäksi erilliseksi menoksi.
7. Tuonnin voi kumota sivun yläosan **Kumoa**-painikkeella heti ennen muita muutoksia. Toiminto palauttaa aiemman koko tilan, kuten nykyinen CSV-tuonnin kumoaminen. Kuittituonnin kumoaminen poistuu seuraavan tallennetun muutoksen jälkeen, jotta myöhempiä muutoksia ei ylikirjoiteta.

Koko kuukauden toistuva menoarvio ei ole automaattisesti sama maksu kuin yksittäinen kuitti. Saman kategorian sarjoista näytetään tarkistus; käyttäjän on poistettava päällekkäinen arvio ennen hyväksyntää. Automaattista ennusteen jäännöksen laskentaa ei vielä ole.

## Todellisilla PDF-esimerkeillä varmennetut rakenteet

| Kuitti | Päivä | Tuoterivejä | Loppusumma |
| --- | --- | ---: | ---: |
| K-Citymarket | 5.4.2026 | 15 | 32,87 € |
| Prisma | 2.1.2026 | 22 | 121,46 € |
| Prisma | 16.3.2026 | 27 | 73,85 € |
| S-market | 1.11.2026 | 9 | 24,00 € |
| Prisma | 2.11.2026 | 9 | 22,44 € |
| Prisma | 9.11.2026 | 20 | 92,85 € |
| Alepa | 9.11.2026 | 2 | 1,65 € |
| S-market | 7.11.2026 | 6 | 16,92 € |

- **Prisman NORM./KAMPANJA:** tuotteen pääsumma on jo alennettu. Esimerkiksi 69,95 € − 21,00 € = 48,95 €; alennusta ei vähennetä 48,95 eurosta uudelleen.
- **Prisman TASAERÄ:** paketin 4,00 € sisältää sisällä esitetyt 4,58 € tuotteet ja 0,58 € alennuksen. Tuodaan yksi erä, ei otsikkoa ja sisätuotteita kahdesti.
- **K-kaupan PLUSSA-ETU:** loppuun merkitty miinus vähennetään tuotteesta tai edeltävästä tarjousryhmästä. Ryhmäalennus jaetaan suhteellisesti suurimpien senttijäännösten menetelmällä, tasatilanteessa lähdejärjestyksessä.
- Kappale-/kilomäärä ja yksikkö erotetaan rivihinnasta. Pantti ja kassi säilyvät omana rivinään.
- Tuotealue rajataan ennen summien lukemista: K-kuitissa se alkaa ostotapahtuman otsikon jälkeen ja päättyy `YHTEENSÄ`-riviin (tai sitä edeltävään erotinviivaan); S-ryhmän kuitissa käytetään tähtimerkityistä tuoteriveistä loppusummaan ulottuvaa aluetta. Maksutapa, asiakasomistajatiedot ja ALV-yhteenveto eivät ole uusia ostoksia.
- Kuitin otsikon tai tuotealueen jälkeisiä summia ei käsitellä tuotteina. Jos K-kuitin tuotealueen alkua ei voi tunnistaa rakennerajasta, skannaus pysähtyy eikä arvaa.
- PDF-sivujen tekstikohdat järjestetään sijainnin mukaan riveiksi. Valuuttamerkin ja yksikön väliset PDF-tekstikatkot sallitaan.

Yhteensä yhdeksän alkuperäistä PDF-tiedostoa, kahdeksan eri ostosta: samasta Korso-ostoksesta toimitettiin kaksi erilaista PDF-tiedostoa. Jälkimmäinen tunnistetaan kaksoistuonniksi myös eri SHA-256:lla.

Tuki tarkoittaa näitä testattuja kuittirakenteita. Muun K- tai S-kaupan formaatin toimivuutta ei luvata ilman esimerkkitestiä. Tunnistamaton raharivi tai täsmäytysero estää tallennuksen.

## Paikallinen tietomalli ja kaksoistuonti

`State.receiptImports` on yhteensopiva lisäkenttä skeemaan 1. Puuttuva lista alustetaan tyhjäksi vanhoissa varmuuskopioissa. Ryhmään tallennetaan PDF:n SHA-256, kauppa, kuittitunniste, ostopäivä, tarkistussumma, tuoterivit/lähderivit, hyväksytyt kategoriat ja luotujen menojen tunnisteet. Skeema, rivien erittely ja loppusumma validoidaan myös JSON-palautuksessa.

Ryhmä ei itsessään vaikuta kassavirtaan. Menot ovat tavallisia kertamenoja; kuittihistoria on alkuperäinen lähdekuva, jota myöhempi menon muokkaus ei muuta. Menon poistaminen ei poista kuitin tuontitunnistetta: sama kuitti ei tällöin vahingossa tule uudelleen.

Kaksoistuonti tarkistetaan sekä tiedostotiivisteellä että kauppa + kuittitunniste + päivä + loppusumma -avaimella. Sama kuitti uudelleen tallennettuna PDF:nä havaitaan näin myös tiedostotiivisteen muuttuessa. Tarkistus tehdään uudelleen hyväksynnässä ajantasaisesta tilasta.

JSON siirtää ryhmän ja erittelyn. CSV siirtää tavalliset menot, ei kuittiryhmiä eikä lähde-erittelyä. Käytä tätä tai uudempaa sovellusversiota uusien varmuuskopioiden palauttamiseen; vanha sovellus ei tunne kuittiryhmiä.

## Turvallisuus ja rajat

- PDF.js 6.5.438 on pakattu samaan HTML-tiedostoon Apache-2.0-lisenssillä. Kirjaston käsittelijä ladataan staattisesti pääsäikeeseen; ulkoista workeria, CDN:ää tai dynaamista moduulihakua ei tarvita. CSP:n verkkokielto säilyy.
- Ainoastaan tekstisisältö ja sen koordinaatit luetaan. PDF:n JavaScriptiä, lomakkeita, linkkejä ja liitteitä ei suoriteta tai avata. Dokumentin tekstiä ei käsitellä sovellukselle annettuina ohjeina.
- Alkuperäistä PDF:ää tai maksukortti-/jäsenyystietoja ei tallenneta. Tuoterivit, kauppa ja ostopäivä voivat silti olla henkilökohtaisia: tallennettu kuittierittely on muun paikallisen datan tavoin salaamaton.
- Rajat: 20 MiB, 50 sivua, 200 000 tekstimerkkiä, 2 000 tuoteriviä ja 2 000 tallennettua kuittiryhmää; nykyinen koko tilan 10 Mt raja ja selaimen kiintiö voivat tulla vastaan aiemmin.
- Peruuta keskeyttää käsittelyn; lataustehtävällä on 30 sekunnin aikaraja. Tyhjä sivu ohitetaan, mutta tekstittömällä sivulla havaittu kuva ohjataan OCR-tarpeeksi. Eteneminen näkyy sivumääränä.
- Kuvallisten kuittien/kamerakuvien OCR, salatun PDF:n salasanakysely, kuluhyvitysten kirjaus, monen tiedoston tuonti, tuotekohtainen oppimismuisti ja yleiset lasku-/sopimusparserit ovat jatkotyötä. Tunnistettu palautus estetään; sitä ei muuteta tuloksi tai positiiviseksi menoksi.
- Pääsäie ja kirjaston lisäys kasvattavat HTML:ää ja voivat vaikuttaa hitaaseen puhelimeen. Aikaraja ei keskeytä synkronista käsittelyä reaaliaikaisesti; erillinen offline-worker ja fyysisten laitteiden muistimittaus ovat jatkoparannuksia.

## Testaus

- `src/test/receipt-parser.test.ts` ja `receipt-robustness.test.ts`: käyttäjän toimittamista oikeista kuiteista anonymisoidut tekstifixtuurit, rakenne-, alennus-, paketti-, painotuote-, virhe- ja sivunvaihtovariaatiot.
- `src/test/receipt-import.test.ts`: kategoriakirjaukset, JSON-yhteensopivuus, kaksoistuonti, täsmäytys kerta-/toistuvaan maksuun, manuaalinen toteuma ja muuttumattoman lähdetilan varmistus.
- `python e2e_receipts.py`: kehittäjän regressio luo fixtuureistä PDF:t PyMuPDF:llä ja ajaa selaimessa koko polun. Vaatii Python Playwrightin, Chromiumin, PyMuPDF:n ja paikallisen testipalvelimen. `TALOUS_URL` ja `TALOUS_BROWSER` ovat valinnaisia.
- Samalle komennolle voi antaa kolme vanhaa PDF:ää tai yhdeksän paikallista PDF-polkua järjestyksessä K / Prisma tammikuu / Prisma maaliskuu / S-market Korso / Prisma 2.11. / Prisma 9.11. / Alepa / S-market Koivukylä / Korso-kopio. Ilman argumentteja generoidaan kahdeksan anonymisoidun tekstifixturen PDF:t sekä eri tavalla tallennettu kopio samasta ostoksesta. Alkuperäiset käyttäjän PDF:t tarkistettiin näin; niitä ei lisätä repositorioon. Fixturet eivät sisällä maksukortti- tai jäsenyystietoja.

Laajempi tavoite ja vielä toteuttamattomat osat: [PDF_IMPORT_PLAN.md](PDF_IMPORT_PLAN.md).


## Parseri v2: yleiset rakenteet ja lisätarkistukset

- Tunnistaa sekä `YHTEENSÄ` että tähtikoristellun `*YHTEENSÄ … *` -rivin. Tähtirivi ei ole tuote. Sama rakenne palvelee Prismaa, S-marketia ja Alepaa; myymälän nimeä tai kuittisummaa ei käytetä poimintasääntönä.
- Normalisoi Unicode-välilyönnit ja miinusmerkit, tukee rivin/sivun vaihtumista ja erilleen poimittua päivää/kellonaikaa. Ostopäivä etsitään vain tapahtumaotsikon läheltä.
- Tukee kahdelle riville jakautunutta S-ryhmän tuotenimeä ja hintaa, säilyttäen molemmat lähdeviitteet. Epäselvää jatkoriviä ei arvata.
- Määrä × yksikköhinta tarkistetaan rivi- tai normaalihintaa vasten; bruttosumma − alennus = maksettu summa tarkistetaan jokaiselta tuotteelta myös ennen hyväksyntää. Tallennettu yksikköhinta validoidaan uudelleen JSON-palautuksessa.
- ALV-yhteenvedon loppusumma ja yksittäinen `Debit/Veloitus` tarkistetaan, jos ne ovat saatavilla. Useat maksutavat eivät käytä yksittäisen veloituksen vertailua; yleinen monimaksutäsmäytys on jatkotyötä. ALV-sarakkeen desimaaliosaa ei saa tulkita seuraavan sarakkeen tuhaterottimeksi.
- Useamman tapahtumaotsikon sisältävä PDF estetään yhden kuitin tuonnissa, jotta toista ostosta ei ohiteta huomaamatta.
- Tunnistamaton erittelyrivi näytetään lähdetekstinä sivu-/riviviitteellä. Rakennevirhe estää tallennuksen, vaikka tunnistettujen tuotteiden summa täsmäisi.
- Vaipat luokitellaan ennen housuihin perustuvaa vaatesääntöä. Ruoka-/hygienia-/vaate-ehdotuksia täydennettiin, mutta esimerkiksi epäselvä setti, puhdistuspyyhe tai keräilytuote jää käsin valittavaksi.
- Uusien luonnosten versio on `receipt-2`. Vanhat `receipt-1`-kuittiryhmät säilyvät palautettavina; uusi valinnainen `unitPrice` ei riko vanhoja lähde-erittelyjä.

## Mitä 99,9 % luotettavuus tarkoittaisi?

Täydellistä tunnistusta ei luvata tuntemattomille kuittiversioille tai OCR-kuville. Nykyiset yhdeksän PDF:ää eivät ole yhdeksän riippumatonta ostosta, ja 512 synteettistä ulkoasu-/sivunvaihtovariaatiota eivät korvaa uutta tosielämän aineistoa. Kaikki summat voivat täsmätä myös väärällä tuotekategorialla tai toisensa kumoavilla poimintavirheillä.

Seurattavat asiat erotetaan:

1. **Poiminnan kattavuus:** kuinka monesta tuetun formaatin kuitista saadaan kaikki rivit ja pääkentät oikein ilman rakennekorjausta.
2. **Virheellisesti hyväksytyt tulokset:** kuinka moni väärä tuote-/summaerittely pääsee tarkistusportista läpi. Tavoite on estää tunnetut ristiriidat, ei väittää kaikkien mahdollisten virheiden havaitsemista.
3. **Kategoriat:** nimisääntöjen osuvuus ja käsin valittavien tuotteiden määrä mitataan erikseen. Käyttäjän vahvistusta ei lasketa automaattisen luokituksen onnistumiseksi.
4. **Koko työnkulku:** hyväksyntä, saman maksun täsmäytys, kaksoistuonti, kumoaminen ja varmuuskopion palautus.

99,9 %:n tavoitteen tilastollinen arviointi vaatisi suuren edustavan, riippumattoman testijoukon. Esimerkiksi noin 2 995 nollavirheistä riippumatonta tapausta antaisi yhden puolen 95 % binomisen luottamusrajan virheosuudelle alle 0,1 %:n (1 − 0,05^(1/n)). Tämä koskisi vain määriteltyä virhettä ja aineiston edustamaa jakaumaa, ei kaikkia tulevia kuitteja. Havaittu virhe, valikoituminen tai uusi formaatti muuttaa tulkintaa.

Jatkopolku: lisää edustavia anonymisoituja esimerkkejä, erillinen testijoukko kehitysaineiston ulkopuolelta, OCR omana vaiheena, tarkempi tuotetunnistus ja käyttäjän hallitsema paikallinen luokittelumuisti. Telemetriaa tai kuittien automaattista lähetystä ei lisätä.

## Testiaineiston rajaus

Parserin testit käyttävät vain oikeista, käyttäjän toimittamista kuiteista anonymisoituja tekstifixtuureja. Ladattava fiktiivinen PDF-kokoelma ja sen testigeneraattori on poistettu: synteettisesti samanmuotoiset kuitit eivät osoita, että kyseisen kauppanimen aidot kuitit toimivat.

## Yksi pääpaikka ja koko näkymän PDF-pudotus

Skanneri on menoissa oletuksena suljettu työkalu, jonka avaa lyhyt kuvakkeellinen painike. Budjetissa on sama pikatoiminto. PDF:n valintaan on nimetty painike; selaimen ylimääräinen englanninkielinen tiedostokenttä ei vie tilaa. Skannerin sulkeminen piilottaa työkalun ja palauttaa kohdistuksen avauspainikkeeseen. Keskeneräinen luonnos ja luokittelut säilyvät myös näkymää vaihdettaessa; koko talouden vaihtaminen luo uuden skanneri-istunnon.

Pudotusalue näkyy vain tiedostoa raahatessa. Se kattaa koko ikkunan eikä estä itse pudotusta. Menot, Budjetti ja Asetukset hyväksyvät yhden .pdf-tiedoston kerrallaan (myös isoilla kirjaimilla oleva pääte); enimmäiskoko on 20 MiB. PDF:n todellinen sisältö tarkistetaan edelleen lukijassa. Muut tiedostot, tyhjät tai liian suuret tiedostot ja monen tiedoston pudotus hylätään ennen navigointia. Muissa näkymissä tiedoston pudotus ei käynnistä skannausta tai avaa tiedostoa selaimen nykyisen sovelluksen tilalle. Tekstin raahaamista ei käsitellä tiedostopudotuksena.

Escape, ikkunasta poistuminen ja pudotus poistavat pudotuskorostuksen. Avoimen muokkaus-/katseluikkunan aikana pyydetään sulkemaan ikkuna ensin. Uusi PDF vaatii vahvistuksen, jos skannerissa on luonnos tai käsittely kesken; hylkääminen säilyttää aiemmat tiedot. Pudotus ei kirjaa menoja eikä muuta budjettia ilman normaalia hyväksyntää. Tilioteparseri ja kuitin/tiliotteen automaattinen reititys ovat edelleen jonossa; tämä toimitus koskee PDF-kuittien käynnistämistä.
