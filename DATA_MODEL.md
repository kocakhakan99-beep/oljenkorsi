# Tietomalli, schemaVersion 1

AppState sisältää schemaVersionin, applicationVersionin, createdAtin, settingsin, categoriesin, incomesin, expensesin, budgetsin, budgetActualsin, actionStatesin, assetsin, liabilitiesin, investmentsin, investmentTransactionsin, goalsin, scenariosin ja themesin.

## Entry

Kuudelle tietotyypille yhteinen suppea V0.1-malli: id, name, amount, category, date, endDate, recurrence, status, active, essential, description, tags, quantity, purchasePrice, ownership, liquid, linkedAssetId, rate, payment, target, monthly, createdAt, updatedAt, schemaVersion.

- Rahat: kokonaislukusentit. quantity voi olla desimaalinen; määrä × yksikköhinta pyöristetään senttiin.
- Date: kalenteripäivä `yyyy-mm-dd`, ei aikavyöhykettä.
- createdAt/updatedAt: ISO-aikaleima metadatana.
- ID: crypto.randomUUID.
- Sijoitusten amount on nykyinen yksikköhinta euroina; purchasePrice on hankinnan yksikköhinta.
- Omaisuuden amount on koko omaisuuserän käyttäjän arvio; ownership prosenttiosuus.
- Velan amount on jäljellä oleva manuaalinen pääoma; payment kuukausierä sentteinä.
- `linkedAssetId` on tyhjä muissa tietotyypeissä ja velalla joko tyhjä tai viittaus olemassa olevan omaisuuserän ID:hen. Linkki mahdollistaa nykyisen oman pääoman laskennan sekä oletuksiin perustuvan takaisinmaksuajan ja omaisuuden arvon arvion. Linkitys ei muuta kassavirtaa tai velkasaldoa automaattisesti.
- Tavoitteen amount on nykyinen säästösumma; target tavoite ja monthly säästö.
- Status: actual, planned tai skipped. Active false keskeyttää toistuvuuden.

## Category

id, name, kind (incomes/expenses), color, icon ja archived. `icon` viittaa paikalliseen kuvakeluetteloon; vanhoista varmuuskopioista puuttuva tunniste päätellään nimestä. Alussa on 4 tulon ja 14 menon peruskategoriaa. Valinnaisia valmiita kategorioita voi lisätä tarpeen mukaan, ja käyttämättömät aiemmat vakiot arkistoidaan palautuksessa. Oma kuvake valitaan esikatselun kanssa. Arkistointi ei poista historiaa. Asuntolaina ja asunto käyttävät samaa kuvatunnistetta.

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

Vain skeema 1 hyväksytään. Tuntematon versio hylätään eikä dataa ylikirjoiteta. Skeema 1:n puuttuvat `linkedAssetId`- ja `actionStates`-kentät alustetaan yhteensopivuuden vuoksi tyhjiksi, jolloin vanhat varmuuskopiot säilyvät käytettävinä. Migraatio on additive eikä luo historiatietoa. Uuden skeemaversion julkaisu vaatii eksplisiittisen migraation ja roundtrip-testit.
