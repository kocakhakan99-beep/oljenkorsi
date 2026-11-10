# Kuittiskannaus — toteutettu 10.11.2026

## Käyttö

**Tuonti ja vienti → Kuittiskannaus → Valitse kuitti (PDF) → Tarkista → Kirjaa menoihin.**

1. Valitse Prisman tai K-kaupan tekstimuotoinen PDF-kuitti. PDF luetaan selaimessa ilman verkkoyhteyttä tai tiedoston lähettämistä.
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

- **Prisman NORM./KAMPANJA:** tuotteen pääsumma on jo alennettu. Esimerkiksi 69,95 € − 21,00 € = 48,95 €; alennusta ei vähennetä 48,95 eurosta uudelleen.
- **Prisman TASAERÄ:** paketin 4,00 € sisältää sisällä esitetyt 4,58 € tuotteet ja 0,58 € alennuksen. Tuodaan yksi erä, ei otsikkoa ja sisätuotteita kahdesti.
- **K-kaupan PLUSSA-ETU:** loppuun merkitty miinus vähennetään tuotteesta tai edeltävästä tarjousryhmästä. Ryhmäalennus jaetaan suhteellisesti suurimpien senttijäännösten menetelmällä, tasatilanteessa lähdejärjestyksessä.
- Kappale-/kilomäärä ja yksikkö erotetaan rivihinnasta. Pantti ja kassi säilyvät omana rivinään.
- Tuote-erittely päättyy ensimmäiseen ostosten loppusummaan. Maksutapa, asiakasomistajatiedot ja ALV-yhteenveto eivät ole uusia ostoksia.
- PDF-sivujen tekstikohdat järjestetään sijainnin mukaan riveiksi. Valuuttamerkin ja yksikön väliset PDF-tekstikatkot sallitaan.

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

- `src/test/receipt-parser.test.ts`: kolme siivottua tekstifixtureä sekä alennus-, paketti-, painotuote-, tuntematon tuote-, virhe-, palautus- ja ohjetekstikokeet.
- `src/test/receipt-import.test.ts`: kategoriakirjaukset, JSON-yhteensopivuus, kaksoistuonti, täsmäytys kerta-/toistuvaan maksuun, manuaalinen toteuma ja muuttumattoman lähdetilan varmistus.
- `python e2e_receipts.py`: kehittäjän regressio luo fixtuureistä PDF:t PyMuPDF:llä ja ajaa selaimessa koko polun. Vaatii Python Playwrightin, Chromiumin, PyMuPDF:n ja paikallisen testipalvelimen. `TALOUS_URL` ja `TALOUS_BROWSER` ovat valinnaisia.
- Samalle komennolle voi antaa kolme paikallista PDF-polkua järjestyksessä K / Prisma tammikuu / Prisma maaliskuu. Alkuperäiset käyttäjän PDF:t tarkistettiin näin; niitä ei lisätä repositorioon. Fixturet eivät sisällä maksukortti- tai jäsenyystietoja.

Laajempi tavoite ja vielä toteuttamattomat osat: [PDF_IMPORT_PLAN.md](PDF_IMPORT_PLAN.md).
