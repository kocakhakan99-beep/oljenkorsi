# Tietomalli, schemaVersion 1

AppState sisältää schemaVersionin, applicationVersionin, createdAtin, settingsin, categoriesin, incomesin, expensesin, budgetsin, budgetActualsin, `coverage`-tiedon, actionStatesin, assetsin, liabilitiesin, investmentsin, investmentTransactionsin, goalsin, scenariosin ja themesin.

`coverage.incomeMonths` ja `coverage.expenseMonths` ovat käyttäjän vahvistamia päättyneitä kuukausia muodossa `yyyy-mm`. Menokattavuutta käytetään hätävaran keskiarvossa ja tulokattavuutta kompassin tulovaihtelussa. Vahvistus kertoo, että käyttäjä on tarkistanut kirjaukset; se ei varmista niitä pankista. Vahvistettu nollakuukausi on eri asia kuin kuukausi, jonka tietojen kattavuutta ei ole vahvistettu. Vanha varmuuskopio saa tyhjät listat, eikä sen historiakattavuutta päätellä tapahtumista.

`settings.essentialMonthlyEstimate` tallentaa käyttäjän oman välttämättömien menojen kuukausiarvion sentteinä tai `null`. Se ei muuta kirjattuja tapahtumia, vaan toimii tulokatkoksen suunnittelun oletuksena. Vanha varmuuskopio saa arvoksi `null`.

## Entry

Kuudelle tietotyypille yhteinen suppea V0.1-malli: id, name, amount, category, expenseType, date, endDate, recurrence, status, adjustToPreviousBankDay, occurrenceStatuses, occurrenceAmounts, active, essential, description, tags, quantity, purchasePrice, ownership, liquid, linkedAssetId, rate, payment, target, monthly, createdAt, updatedAt, schemaVersion.

- Rahat: kokonaislukusentit. quantity voi olla desimaalinen; määrä × yksikköhinta pyöristetään senttiin.
- Date: kalenteripäivä `yyyy-mm-dd`, ei aikavyöhykettä.
- createdAt/updatedAt: ISO-aikaleima metadatana.
- ID: crypto.randomUUID.
- Sijoitusten amount on nykyinen yksikköhinta euroina; purchasePrice on hankinnan yksikköhinta.
- Omaisuuden amount on koko omaisuuserän käyttäjän arvio; ownership prosenttiosuus.
- Velan amount on jäljellä oleva manuaalinen pääoma; payment kuukausierä sentteinä.
- `linkedAssetId` on tyhjä muissa tietotyypeissä ja velalla joko tyhjä tai viittaus olemassa olevan omaisuuserän ID:hen. Linkki mahdollistaa nykyisen oman pääoman laskennan sekä oletuksiin perustuvan takaisinmaksuajan ja omaisuuden arvon arvion. Linkitys ei muuta kassavirtaa tai velkasaldoa automaattisesti.
- `expenseType` erottaa kulutuksen, säästösiirron ja sijoitussiirron omaksi kentäkseen. Vanhan varmuuskopion piilotettu tags-merkintä tai kaksi vanhaa oletuskategoriaa muunnetaan palautuksessa kentäksi ja merkintä poistetaan käyttäjän tunnisteista. Tämä ei vielä mallinna tilisiirtoa tai lainan pääomalyhennystä.
- Tavoitteen amount on nykyinen säästösumma; target tavoite ja monthly säästö.
- `status`: sarjan oletustila (`actual`, `planned` tai `skipped`); `active: false` keskeyttää toistuvuuden. Näytettävä ja laskennassa käytettävä esiintymän tila lasketaan maksupäivästä: mennyt tai tämä päivä on actual, tuleva planned. Sarjan `skipped` ohittaa esiintymät. `occurrenceStatuses` tallentaa yksittäisten päivien valinnaiset poikkeukset; päiväkohtainen tila ohittaa automatiikan. Automaattinen tila ei varmista maksua pankista.
- `adjustToPreviousBankDay` siirtää toistuvan tulon viikonlopulle tai huomioidulle Suomen pankkipyhälle osuvan esiintymän edeltävälle pankkipäivälle. Oletus on päällä uusille tulokirjauksille. Kertakirjaus ja menot eivät siirry. Vanhoista varmuuskopioista puuttuva arvo alustetaan tulolle todeksi ja muille tyypeille epätodeksi.

## Category

id, name, kind (incomes/expenses), color, icon ja archived. `icon` viittaa paikalliseen kuvakeluetteloon; vanhoista varmuuskopioista puuttuva tunniste päätellään nimestä. Alussa on 4 tulon ja 18 menon peruskategoriaa. Päivittäistavara, kosmetiikka, hygieniatarvikkeet ja luottokorttilasku ovat oletuksena käytössä. Palautus täydentää puuttuvat oletukset vanhaan dataan poistamatta omia kategorioita tai palauttamatta käyttäjän arkistoimia oletuksia. Valinnaisia valmiita kategorioita voi lisätä tarpeen mukaan. Oma kuvake valitaan esikatselun kanssa. Arkistointi ei poista historiaa. Asuntolaina ja asunto käyttävät samaa kuvatunnistetta.

## Budget

Kuukausi → kategorian nimi → suunniteltu senttimäärä. `budgetActuals` sisältää erikseen käyttäjän manuaalisesti syöttämän toteuman kuukausi- ja kategoriatasolla. Vanhoista varmuuskopioista puuttuva rakenne alustetaan tyhjäksi. Puuttuva toteuma näytetään tapahtumista lasketulla kulutuksella, eikä manuaalinen arvo muuta kassavirtaa. Kategorioita ei vielä viitata ID:llä; nimeämisen migraatio hoidetaan yhdessä UI-muutoksessa.

Raportin toteuma käyttää kategoriakohtaista manuaalista arvoa silloin, kun käyttäjä on syöttänyt sen, ja muuten tapahtumista laskettua toteutunutta kulutusta. Säästö- ja sijoitussiirrot rajataan kulutusraportista pois.

## Talouden kompassi

`actionStates` tallentaa deterministisesti muodostettujen tarkistusten tilan ID:n perusteella: `done` tai `snoozed`, päivitysaika ja siirretyn tehtävän viimeinen piilotuspäivä. Tarkistukset muodostuvat uudelleen sen hetken tiedoista; tila ei sisällä käyttäjän taloustietojen kopiota. Säännöt eivät tee automaattisia muutoksia budjettiin, kirjauksiin tai lainoihin.

Kompassin ohjeet kertovat havainnon, kokeiltavan askeleen, lähdeviitteen ja laskennan rajauksen. Deatonin (1991) ja Carrollin (1997) likviditeetti- ja varautumissäästämisen tutkimukset eivät määrää kaikille samaa puskurin kokoa; kompassin tunnistuskynnykset ovat käyttöliittymän tarkistussääntöjä, eivät tutkimustuloksia. Tulojen vaihtelu, epäsäännöllisten menojen tasaus ja tavoitteet johdetaan syötetystä historiasta. Neljä kuvitteellista kahden aikuisen ja yhden lapsen reittitapausta luodaan yhteisestä demodatasta. Ne näkyvät kompassissa tallentamatta mitään, ja saman reitin voi halutessaan ladata käyttöönotosta, kompassista tai asetuksista nykyisen talouden tilalle. Kriisiesimerkissä yhden aikuisen palkkatulo katkeaa, kun taas toisen palkka ja lapsilisä jatkuvat.

## Scenario

id, name, initial, monthly, rate, fee, inflation ja years. Oletukset validoidaan; aikaa 1–50 vuotta.

## Tulevat mallit

Erilliset AssetValuation, PortfolioValuation, InvestmentTransaction, ImportJob, ImportError, BudgetPeriod ja täydellinen RecurrenceRule ovat jatkokehitystä. investmentTransactions ja themes ovat tällä hetkellä tyhjiä varattuja listoja; ei-tyhjä sisältö hylätään, jotta sitä ei hukata palautuksessa.

## Migraatiot

Vain skeema 1 hyväksytään. Tuntematon versio hylätään eikä dataa ylikirjoiteta. Skeema 1:n puuttuvat `linkedAssetId`-, `actionStates`-, `coverage`-, `occurrenceStatuses`-, `occurrenceAmounts`- ja `adjustToPreviousBankDay`-kentät alustetaan yhteensopivuuden vuoksi. Puuttuva pankkipäiväsiirto oletetaan vanhoilla tulotietueilla päälle ja muilla pois. Puuttuvat uudet oletuskategoriat lisätään palautuksen yhteydessä; jo olemassa olevat säilyttävät värinsä, kuvakkeensa ja arkistointitilansa. Vanhan menotyypin tags-merkintä tai vanha säästö-/sijoituskategoria muunnetaan palautuksessa `expenseType`-kentäksi ja tekninen merkintä poistetaan käyttäjän tunnisteista. Migraatio on additive eikä luo historiatietoa. Uuden skeemaversion julkaisu vaatii eksplisiittisen migraation ja roundtrip-testit.

## Budjetin ohjearvot

`settings.budgetGuidance` sisältää `needs`, `wants` ja `saving` -prosentit (0–100, summa 100) sekä `categories`-sanakirjan. Kategoria-asetuksen avain on kategorian ID; näin käyttäjän ryhmä ja raja säilyvät nimeämisessä. Ilman kategoria-ID:tä käytetään `name:`-alkuista avainta. Arvo on `{ group: needs | wants | saving | unclassified, maxPercent: number | null }`. Null poistaa kategoriakohtaisen rajan. Puuttuvat asetukset saavat 50/30/20-jaon ja tyhjän poikkeusluettelon; kategoriakohtainen oletus päätellään nimestä laskennassa. Tuntemattoman kategorian oletus on luokittelematta. Säästö-/sijoitussiirron eksplisiittinen menotyyppi ohittaa kategoriaryhmän. Ohjearvot säilyvät JSON-varmuuskopiossa; CSV ei ole asetusten siirtomuoto.

## Syöttöpolkujen yhtenäistäminen

Tietomalli ja vanhat kokonaistoteuman poikkeukset säilyvät. Tulojen ja menojen yhteinen lomake lisää uuden ID:n vain lisäyksessä/kopioinnissa; muokkaus säilyttää ID:n, aikaleimametadatan sekä päiväkohtaiset tila- ja summapoikkeukset. Sarjan toistuvuus, loppupäivä, aktiivisuus, tunnisteet ja monirivinen kuvaus ovat lisävalinnoissa sekä lisäyksessä että muokkauksessa. Budjetin kokonaistoteuman erillinen korjaus löytyy vain kategoriakortin lisävalinnasta; päätaulukko näyttää toteuman ja sen lähteen. Korjauksen voi poistaa palaamalla kirjauksista laskettuun toteumaan.

## Demotalouksien kattavuus

Käyttöliittymän neljä esimerkkitaloutta luodaan yhteisesti `createCompassDemoCases`-funktiolla. Jokaisessa on kaikki kuukaudet 2025-01–2026-12 tuloineen, menoineen ja kategoriabudjetteineen sekä vähintään yksi omaisuus-, velka-, sijoitus- ja tavoitetietue ja kaksi tallennettua skenaariota. Internet on yksi aikarajattu kuukausisarja; muiden menojen kuukausikohtaiset erot tallennetaan erillisinä tapahtumina. Ruokaostokset jakautuvat neljään erään ja palkkojen sekä etuuksien päivä on aikaistettu tarvittaessa pankkipäivälle.

Tulokatkos on kriisitaloudessa kiinteästi elokuusta 2026 alkaen. Tulevia kuukausia ei vahvisteta kattaviksi eikä niille tallenneta keinotekoisia actual-poikkeuksia. Kompassin esimerkkikuvaaja näyttää koko kuukaudelle kirjatun suunnitelman (myös tulevat tapahtumat); ladatun sovelluksen toteumaraportit käyttävät tavallista päiväperusteista tilaa. Varallisuus ja velat ovat manuaalinen esimerkkitilannekuva, eivät kahden vuoden saldohistoria. Aineiston ulkopuolelta ladattaessa valittu kuukausi rajataan 2025-01–2026-12-väliin. Kehityksen vanha `model.demo()`-testifixture ei ole käyttöliittymässä ladattava esimerkkitalous.

## Tavoitesuunnittelu ja velkalista 10.11.2026

Tietomalli ja schemaVersion säilyvät. Tavoitteen amount on jo säästetty summa, date tavoitepäivä, target tavoitesumma ja monthly suunniteltu kuukausisäästö. Lomake laskee target/monthly-parin valitun syöttösuunnan mukaan ja tallentaa molemmat. Syöttösuunta on lomakkeen tilaa; sitä ei tallenneta. Vanhoja tavoitteita ei muuteta latauksessa. Muokkaus käyttää nykyhetkeä ja olemassa olevaa tavoitepäivää; liian aikainen päivä vaatii käyttäjältä korjauksen, jos tavoite on kesken.

Velan rate ja payment näkyvät erillisissä korko- ja kuukausieräsarakkeissa. linkedAssetId esitetään linkki- ja omaisuuskategoriakuvakkeena, josta voi avata omaisuuden katselun. Velan katselussa näytetään linkitetyn omaisuuden nimi ja kategoria. Linkki ei luo menoa eikä päivitä saldoja.

## Velkakortin arvio ja sijoituspohjat 10.11.2026

SchemaVersion säilyy. Velan laskentapäivä ja kulut ovat istuntokohtaisia laskurin oletuksia, eivät tallennettu velan maksuaikataulu. Maksetuiksi oletetut erät eivät muuta velkaa tai luo menoja. Sijoituspohja esitäyttää vain nimen, luokan ja tunnuksen kuvaukseen. Kurssihistoria tai valuuttamalli ei kuulu vielä tietomalliin; ks. INVESTMENT_MARKET_DATA_PLAN.md.

## Omaisuuden arviointioletukset 10.11.2026

Valinnainen Entry.assetModel sisältää mallin (home/vehicle/equipment/land/custom), vuosiluvun year, marketRate-, annualWear-, life-, residual-, buildingShare-, annualMileage-, mileagePenalty- ja uncertainty-oletukset. Parametrit validoidaan ja siirtyvät JSON-varmuuskopiossa. Puuttuva kenttä normalisoidaan null-arvoksi, schemaVersion säilyy. Arviointipäivä ja laskettu arvo eivät tallennu. Amount, date ja ownership ovat edelleen kirjatun arvon lähde. CSV ei sisällä arviointioletuksia.

## Ajankohtaiset tilannearvot ja automaattimallit

AssetModel sai valinnaiset automatic-, initialMileage-, brand- ja powertrain-kentät. Vanhat oletukset säilyvät mukautettuina. Lähtöarvon amount/date pysyvät muuttumattomina; datedState tuottaa valitun päivän omaisuus-/velka-arviot ja suodattaa arvostuspäivää myöhemmät kohteet pois. Velan positiivinen payment käynnistää lyhennysarvion, ei tallennettuja maksutapahtumia. Positiivinen korko ilman erää antaa vain yksinkertaisen päiväkoron kertymäarvion. Tavoitteen näkyvyys perustuu createdAt-päivään. Demotavoitteille määritettiin aloituspäivä 1.1.2025. Raportointijakso on käyttöliittymässä erillinen yleisestä kuukaudesta.

## Suunnitteilla: PDF-tuonnin ryhmät ja täsmäytys

[PDF_IMPORT_PLAN.md](PDF_IMPORT_PLAN.md) määrittelee vasta ehdotuksen: DocumentDraft, ImportGroup/ReceiptGroup, lähdeviitteet, kategorioidut tuoterivit, kuluhyvityksen suunnan sekä ennusteen ja maksun erottelun. Näitä ei ole nykyisessä skeemassa. Monikategorista kuittia tai velkasopimuksen kaikkia kuluja ei saa tuoda nykyiseen Entryyn kiertämällä validointia. Mahdollinen migraatio ja JSON-/CSV-rajaukset toteutetaan ennen ominaisuuden käyttöönottoa.

Arvonmuutosmallin siirto muokkausvälilehdelle ei muuta skeemaa. Perustietojen ja assetModel-kentän muutokset ovat yhteinen tallennus; mallin käytöstä poistaminen tallentaa null-arvon. Välilehtien luonnokset ovat paikallista käyttöliittymätilaa, eivät automaattisesti tallennettua talousdataa.

## Kurssihistoria ja porrastettu automalli

Entry.marketSymbol on valinnainen, oletuksena tyhjä. Se kytkee sijoituksen globaaliin päivättyyn offline-aineistoon. Symboli säilyy JSON-varmuuskopiossa; CSV ei sisällä kytkentää. Amount ja purchasePrice säilyvät kirjattuina EUR-sentteinä, mutta päivätty tilannekuva voi käyttää tarkkaa lähdehintaa EUR-senttien murto-osina ja pyöristää vasta koko position arvon. Näitä johdettuja murto-osia ei tallenneta Entry.amount-kenttään.

AssetModel.vehicleCurve erottaa legacy-v1- ja staged-v2-mallit. Puuttuva versio tulkitaan vanhaksi v1:ksi. AssetModel.newAtBase tarkoittaa, että auto oli uusi lähtöarvon päivänä; sen ensimmäinen nopea alenemavuosi alkaa siitä. Brand vaikuttaa v2:n näkyvään arvio-oletukseen; powertrain on toistaiseksi taustatieto.

Demojen tiedot ja 36 kuukauden sisältö on kuvattu [DEMO_DATA_PLAN.md](DEMO_DATA_PLAN.md). Hintahavaintojen lähteet ja valuuttaoikaisu on kuvattu [MARKET_DATA_SOURCES.md](MARKET_DATA_SOURCES.md). Talouden JSON ei kopioi koko 720 pisteen hintakirjastoa, vaan nykyinen sovellus sisältää sen; päivitys on aina nimenomainen kehitystoiminto.
