# Tuonti ja vienti

## JSON

Vienti sisältää wrapperin: format, schemaVersion, applicationVersion, createdAt, checksumAlgorithm, checksum ja data. Kaikki palautettava sovellustila on data-objektissa. Tyhjät investmentTransactions/themes-listat ovat mukana, mutta niiden käyttö ei ole vielä toteutettu.

Palautus: tiedostokokoraja → paikallinen luku → JSON-parseri ja vaarallisten avainten esto → wrapper/versio/eheys → Zod ja domain-validointi → tietuemäärien esikatselu → nykyisen backupin vientipainike → vahvistus → tallennus → laskelmien uudelleenrenderöinti. Vienti ennen korvausta on tarjottu, ei pakotettu. Väärä tiedosto ei muuta nykyistä tilaa. Tuntematon skeema hylätään.

FNV-1a-32 on ei-kryptografinen. JSON ei ole salattu. Varmuuskopioi ennen selaindatan poistoa, HTML:n siirtämistä tai selainvaihtoa.

## CSV

Kuusi tietotyyppiä: incomes, expenses, assets, liabilities, investments, goals. Tuonti lisää, ei korvaa. UTF-8 ja valinnainen Windows-1252, pilkku tai puolipiste, desimaalipilkku/piste, dd.mm.yyyy ja yyyy-mm-dd. UTF-8-dekoodaus on strict; virheessä valitse toinen merkistö. Ei täydellistä automaattista merkistötunnistusta.

Vientipohjan sarakkeet: name, amount, category, expenseType, date, recurrence, status, description, quantity, purchasePrice, ownership, liquid, rate, payment, target, monthly, endDate, tags, active, essential.

Nimi, summa ja päivämäärä ovat pakollisia. Puuttuva kategoria on Muu. Yleisiä suomalaisia pankkiotsikoita tunnistetaan automaattisesti, ja tuonti näyttää ensin perustiedot. Menojen miinusmerkkinen pankkisumma muunnetaan positiiviseksi menoksi; etumerkillisen seka-aineiston positiiviset tulorivit pitää tuoda Tulot-valinnalla. Rahasarakkeet ovat euroina. Toistuvuus: once/weekly/biweekly/monthly/bimonthly/quarterly/semiannual/yearly. Tila: actual/planned/skipped. Menon tyyppi: consumption/saving/investment. Booleanit true/false.

Tuonti näyttää sarakekartoituksen, viisi esimerkkiriviä, virheet ja duplikaattimäärät. Harvemmin tarvittavien kenttien kartoitus on suljettavissa. Virheet voidaan ohittaa tai korjata alkuperäisessä CSV:ssä ja valita tiedosto uudelleen. Duplikaattiheuristiikka: sama nimi, päivä, summa ja kategoria, myös tuontierän sisällä. Ei pankkikohtaista parseria. Viimeisin tuonti voidaan kumota istunnon aikana; kumoaminen palauttaa koko aiemman tilan, joten tee se ennen muita muutoksia.

CSV ei säilytä ID:tä tai koko sovellustilaa. Käytä JSON:ia täydelliseen palautukseen. Kaavasuoja voi lisätä tekstin alkuun apostrofin, joka voi jäädä näkyviin CSV:n takaisinluvussa.

## Käyttöliittymän pääpaikat

Tavallinen JSON-varmuuskopiointi ja CSV-siirto ovat Tuonti ja vienti -näkymässä. Asetukset ohjaa sinne. Alkuperäinen selaintallennus voidaan edelleen viedä Asetusten ”Tallennuksen lisätyökalut” -kohdasta vian selvittämistä varten.

CSV:n tietotyyppi on perusvalinta; merkistö ja erotin ovat ”Tiedoston lisäasetukset” -kohdassa. Virheellinen UTF-8 avaa asetukset ja esikatselun voi korjata valitsemalla esimerkiksi Windows-1252. Virhe ei itsessään muuta taloustietoja, eikä tuontia voi vahvistaa ratkaisemattoman tiedoston lukuvirheen aikana. Sarakekartoitus, rivivirheet, duplikaattien ohitus ja tuonnin kumoaminen säilyvät. JSON-palautus korvaa nykyisen talouden erillisen vahvistuksen jälkeen.

## PDF-kuittiskannaus

Tuonti ja vienti sisältää paikallisen Prisma-/K-kuittiskannauksen: [käyttöohje ja testatut muodot](RECEIPT_SCANNER.md). PDF:n valinta ei muuta taloutta. Hyväksytyt kategoriakirjaukset ja lähderyhmä tallentuvat yhdessä, kuitti täsmäytetään tarvittaessa aiempaan maksuun ja ostokuukausi määrää budjettitoteuman. JSON säilyttää tuoterivit ja kaksoistuontitunnisteet; CSV ei. Kumoaminen palauttaa koko aiemman tilan heti tuonnin jälkeen. OCR ja yleiset lasku-/sopimusparserit ovat jatkotyötä.
