# Tietomalli, schemaVersion 1

AppState sisältää schemaVersionin, applicationVersionin, createdAtin, settingsin, categoriesin, incomesin, expensesin, budgetsin, assetsin, liabilitiesin, investmentsin, investmentTransactionsin, goalsin, scenariosin ja themesin.

## Entry

Kuudelle tietotyypille yhteinen suppea V0.1-malli: id, name, amount, category, date, endDate, recurrence, status, active, essential, description, tags, quantity, purchasePrice, ownership, liquid, rate, payment, target, monthly, createdAt, updatedAt, schemaVersion.

- Rahat: kokonaislukusentit. quantity voi olla desimaalinen; määrä × yksikköhinta pyöristetään senttiin.
- Date: kalenteripäivä `yyyy-mm-dd`, ei aikavyöhykettä.
- createdAt/updatedAt: ISO-aikaleima metadatana.
- ID: crypto.randomUUID.
- Sijoitusten amount on nykyinen yksikköhinta euroina; purchasePrice on hankinnan yksikköhinta.
- Omaisuuden amount on koko omaisuuserän käyttäjän arvio; ownership prosenttiosuus.
- Velan amount on jäljellä oleva manuaalinen pääoma; payment kuukausierä sentteinä.
- Tavoitteen amount on nykyinen säästösumma; target tavoite ja monthly säästö.
- Status: actual, planned tai skipped. Active false keskeyttää toistuvuuden.

## Category

id, name, kind (incomes/expenses), color ja archived. Väri on datassa, mutta värin/kuvakkeen muokkausta ei ole UI:ssa. Uudelleennimeäminen päivittää tietueet ja budjetit. Arkistointi ei poista historiaa.

## Budget

Kuukausi → kategorian nimi → senttimäärä. Kategorioita ei vielä viitata ID:llä; nimeämisen migraatio hoidetaan yhdessä UI-muutoksessa.

## Scenario

id, name, initial, monthly, rate, fee, inflation ja years. Oletukset validoidaan; aikaa 1–50 vuotta.

## Tulevat mallit

Erilliset AssetValuation, PortfolioValuation, InvestmentTransaction, ImportJob, ImportError, BudgetPeriod ja täydellinen RecurrenceRule ovat jatkokehitystä. investmentTransactions ja themes ovat tällä hetkellä tyhjiä varattuja listoja; ei-tyhjä sisältö hylätään, jotta sitä ei hukata palautuksessa.

## Migraatiot

Vain skeema 1 hyväksytään. Tuntematon versio hylätään eikä dataa ylikirjoiteta. Aiemman skeeman migraatiota ei tarvita eikä toteuteta näennäisesti. Uuden skeeman julkaisu vaatii eksplisiittisen migraation ja roundtrip-testit.
