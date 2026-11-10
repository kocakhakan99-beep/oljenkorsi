# Kurssiaineiston lähteet 2024–2026

Poiminta 10.11.2026: 20 valittua instrumenttia, kullekin 36 päivättyä havaintoa (vuoden 2024 ensimmäinen saatavilla oleva havainto sekä kuukausien viimeiset saatavilla olevat havainnot tammikuusta 2024 marraskuuhun 2026). Yhteensä 720 hintapistettä. Vuoden 2026 loppuvuosi ei ole vielä toteutunut kokonaan.

## Hintalähde

Yahoo Finance chart, esimerkiksi https://query2.finance.yahoo.com/v8/finance/chart/AAPL?period1=1704067200&period2=1794355200&interval=1d&events=splits

20 tunnusta: NOKIA.HE, NDA-FI.HE, KNEBV.HE, SAMPO.HE, UPM.HE, FORTUM.HE, NESTE.HE, WRT1V.HE, ELISA.HE, KESKOB.HE, AAPL, MSFT, NVDA, GOOGL, AMZN, BRK-B, TSLA, META, EUNL.DE ja VWCE.DE.

Aineistossa säilyvät jokaisen sarjan URL, valuutta, pörssin aikavyöhyke, lähteen markkina-aikaleima sekä raakavastauksen SHA-256. Historiallinen Close on lähteen split-oikaistussa yksikössä. Osinkoja ei ole lisätty tuottoon. Tietoa ei esitetä takuuna kaupankäynnin toteutushinnasta tai reaaliaikaisesta kurssista. Saman päivän keskeneräistä päiväkynttilää merkitään provisional-tiedolla.

## Valuutta

EKP: https://data-api.ecb.europa.eu/service/data/EXR/D.USD.EUR.SP00.A?startPeriod=2024-01-01&endPeriod=2026-11-10&format=csvdata

730 USD per EUR -havaintoa. USD-hinta euroina = USD-hinta / USD per EUR. Käytetään hintapäivän tai sitä edeltävän päivän havaintoa. Alkuperäinen lähdehinta säilyy desimaalitarkkuudella. Yksikköhinta näytetään rahakentässä sentteinä, mutta salkun kokonaisarvo lasketaan tarkasta EUR-muunnoksesta ja pyöristetään vasta lopuksi senttiin.

## Mitä käyttöliittymä tekee

- Kuukausivalinta käyttää viimeistä tuohon päivään mennessä saatavilla olevaa snapshot-havaintoa.
- Hinta voi olla kuukausiaineiston vuoksi vanhempi kuin valittu päivä. Alkuperäinen havaintopäivä näkyy aina.
- Joulukuulle 2026 ei ole keksitty toteutunutta kurssia: näkyviin jää viimeisin marraskuun lähdehavainto päivämäärineen.
- Kurssiaineisto on valinnainen. Käyttäjä voi valita oman EUR-hinnan, jolloin symboliin perustuva arvostus ei ohita omaa hintaa.
- Demonomistukset ovat fiktiivisiä. Toteutuneita omistajan ostoja tai osinkoja ei väitetä tunnetuiksi. Määrät ja hankintahinnat on esitetty samassa split-oikaistussa yksikössä kuin hintahistoria.
- Uudelleenpoiminta voi muuttaa vanhoja arvoja lähteen jälkikorjausten tai uusien split-oikaisujen vuoksi. Tiedostoa ei päivitetä käyttäjän selaimessa hiljaisesti.

Reproduktiotyökalu: `python scripts/fetch-market-history.py`. Haku on kehitystoiminto ja tarvitsee verkkoyhteyden. Sovellus ei tee ajonaikaisia kurssipyyntöjä. API:n tekninen avoimuus ei tarkoita ilmaista julkista tai kaupallista edelleenjakelulisenssiä; palveluintegraation oikeudet on varmistettava käyttötarkoituksen mukaan, ks. [API-suunnitelma](FREE_API_INTEGRATION_PLAN.md).
