# Sijoitusten kurssit ja historia — tilanne 10.11.2026

## Toteutettu

- Kaikille 20 valitulle kohteelle 2024–2026 päivätty lähdehistoria: 720 hintahavaintoa ja 730 EKP-valuuttahavaintoa.
- Lähdehinta valittuun päivään, EUR-muunnos hintapäivän tai aiemman päivän valuuttakurssilla, päivämäärän ja keskeneräisyyden merkintä.
- Offline-kurssikuvaaja ja havaintotaulukko sijoituksen kortilla; demojen fiktiiviset omistukset kytketty lähdeaineistoon.
- Omat EUR-hinnat säilyvät vaihtoehtona. JSON-varmuuskopio sisältää symbolikytkennän.

[Lähteet ja hintojen semantiikka](MARKET_DATA_SOURCES.md). [Ilmaisten API:en kartoitus ja turvallinen käyttöönotto](FREE_API_INTEGRATION_PLAN.md).

## Suunniteltu, ei toteutettu

Valinnainen EOD-/viiveellinen verkkopäivitys, FMP/Alpha Vantage -BYOK-koe, kattavuus ja näyttöoikeudet jokaiselle instrumentille, rajattu CSP, kiintiöt sekä välimuisti. Reaaliaikaista kurssilupausta ei anneta. Pankin omistustapahtumat, osingot ja yhtiötapahtumien automaattinen käsittely ovat erillisiä jatkotöitä.

Vuoden 2026 tulevat päivät eivät saa keksittyä toteutunutta hintaa. Historiallinen hintasarja ei ole osingot sisältävä kokonaistuotto. API-avaimia tai henkilökohtaisia taloustietoja ei lähetetä nykyisessä offline-versiossa.
