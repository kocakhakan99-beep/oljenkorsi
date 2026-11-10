# Sijoitusten kurssit ja historia

## Toteutettu 10.11.2026

20 yleisen osake-/ETF-esimerkin valintapohjaa. Nimi, kaupankäyntitunnus ja alustava luokka esitäytetään nykyiseen sijoituslomakkeeseen. Tämä ei ole suosituimmuuslista. Kurssin puuttuminen kerrotaan näkyvästi; EUR-hinta ja arvostuspäivä ovat manuaalisia.

## Vielä tekemättä

- Varmennettu nykykurssi sekä aikaleima, alkuperäisvaluutta ja EUR-muunnos.
- Kahden vuoden historiatiedot kaikille kohteille ja yhteiset demotalouksien aineistot.
- Historiaa säilyttävä tietomalli ja arvostuksen ajankohtainen raportointi.
- Myöhempi kurssien päivitys, välimuisti, vanhentuneen hinnan merkintä ja verkkovirheiden käsittely.

Kurssilähteen ensimmäinen haku estyi komentoympäristön verkkorajoitukseen. Sallitulla yhteydellä Yahoo Finance palautti HTTP 429 ja vaihtoehtoinen Stooq-haku HTTP 404. Tämän kierroksen aikana ei saatu varmennettua hintadataa. Demohintoja ei merkitä tämän päivän markkinahinnoiksi.

## Toteutusjärjestys

1. Valitaan käyttötarkoitukseen soveltuva lähde ja varmistetaan sen ehdot, tunnukset ja 20 kohteen saatavuus.
2. Tallennetaan kohteen pysyvä tunniste, pörssi, kaupankäyntivaluutta, lähde sekä kurssin päivä/aika. Ulkomaisen hinnan EUR-muunnos tarvitsee päivätyn valuuttakurssin.
3. Tuodaan 24 kuukauden historia kiinteänä, päivättyinä demo-fixtureina. Erotetaan hintahistoria, osinkokorjattu historia ja todellinen sijoitustuotto.
4. Lisätään validointi puuttuvalle hinnalle, valuutalle ja päivämäärälle. Viimeisintä saatavilla olevaa kurssia ei kutsuta tämän päivän kurssiksi.
5. Kytketään historiakuvaaja ja vasta sen jälkeen livepäivitys. Offline-versio käyttää viimeksi varmennettua tietoa aikaleimoineen.
