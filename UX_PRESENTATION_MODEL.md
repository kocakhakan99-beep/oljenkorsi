# Yhteinen UX-malli: vähemmän tekstiä, samat ominaisuudet

9.11.2026. Käyttäjän uusi työjonopyyntö. **Suunnitelma valmis, koko sovelluksen läpikäynti jonossa.** Käynnissä oleva toimintojen pääpaikkojen yhtenäistäminen jatkuu ensin. Ominaisuuksia ei lähtökohtaisesti poisteta: vähennetään rinnakkaisia toteutuksia ja näytetään lisätiedot tarpeen mukaan.

## Esittämisen hierarkia

Järjestys kertoo, missä vaiheessa tietoa kannattaa näyttää. Jokaisen kortin ei tarvitse sisältää kaikkia tasoja. Ensin näkyvät yleensä tasot 1–5, muut avautuvat tarvittaessa.

1. **Yksi lyhyt nimi ja tärkein luku.** Käyttäjä tunnistaa asian ja tuloksen heti: ”Ruoka · 320 €”. Jos luku ei ole olennainen, nimi riittää. Luvulla on yksikkö ja tarvittaessa ajanjakso.
2. **Tuttu kuvake nimen tukena.** Sama käsite käyttää samaa paikallista kuvaa kaikkialla. Pelkkä kuvake sopii esimerkiksi lisäykseen, sulkemiseen ja siirtymiseen, kun saavutettava nimi ja kosketuksella saatava selite ovat käytössä. Uusi tai monitulkintainen talouskäsite tarvitsee myös lyhyen nimen.
3. **Yksi pieni havainnollistus.** Palkki, rengas, pistejono tai yksinkertainen trendi näyttää tilanteen yhdellä silmäyksellä. Koriste ei kilpaile luvun kanssa. Selkeä asteikko tai tekstivastine kertoo vertailukohdan.
4. **Lyhyt tila vain tarvittaessa.** Esimerkiksi ”Yli 40 €”, ”Suunniteltu” tai ”Luokittelematta”. Väri tukee tilaa, mutta teksti tai symboli välittää sen myös ilman värinäköä. Rahoitusvaje, epävarma tulopohja ja tallennusvirhe eivät jää piiloon.
5. **Yksi ensisijainen toiminto.** Esimerkiksi ”Lisää”, ”Tarkista” tai ”Muokkaa”. Pikakäyttö avaa saman toiminnon kuin sen pääpaikka; se ei luo rinnakkaista lomaketta tai erillistä laskentaa.
6. **Yksi lyhyt lisärivi, jos se muuttaa tulkintaa.** Esimerkiksi maksupäivä, ”kirjauksista”, ”oma toteuma” tai ”nykyarvo”. Muuten rivi jätetään pois. Näkyvässä yhteenvedossa ei toisteta kaikkia ehtoja.
7. **Avattavat rivitiedot.** Toistuvuus, tapahtumat, erittely ja toissijaiset toiminnot avautuvat samasta, selvästi nimetystä kohdasta. Näppäimistö, kosketus ja ruudunlukija toimivat samalla tavalla.
8. **Kontekstiohje käyttäjän pyynnöstä.** Tietokuvake avaa yhden kysymyksen vastauksen. Sisältö toimii painamalla, ei vain hiiren hoverilla. Tärkeät varoitukset eivät kuulu pelkkään työkaluvihjeeseen.
9. **Tarkempi tietokortti.** Kokonainen kategorian kuukausierittely, raportin valittu havainto tai velan laskelma näytetään yhdessä kortissa. Kortista linkitetään muokkauksen pääpaikkaan.
10. **Lisävalinnat samassa lomakkeessa.** Harvemmin tarvittavat kentät, rajat ja poikkeukset ovat omassa avattavassa ryhmässään. Lisäys ja muokkaus käyttävät samaa rakennetta, yksiköitä ja tallennusta. Tallentamattomat tiedot eivät katoa ryhmää suljettaessa.
11. **Oman kokonaisuuden pääsivu.** Laajat historiat, raportit ja asetukset avataan omalle selkeälle sivulle. Muut sivut näyttävät vain yhteenvedon ja linkin, eivät kopioi koko työkalua.
12. **Menetelmä, lähde ja dokumentaatio.** Laskentakaavat, tutkimusrajaukset ja pitkät ohjeet ovat avattavissa tuloksen yhteydestä. Jos oletus muuttaa olennaisesti tulkintaa, sen lyhyt merkintä kuuluu jo tasolle 4 tai 6.

## Yhteiset säännöt

- Näkyvä kortti vastaa järjestyksessä: mikä asia, mikä tilanne, mitä voin tehdä, mistä näen lisää.
- Tuttu kuvake vähentää lukemista; epäselvä kuvake ei korvaa lyhyttä nimeä. Selkokielisyys on tärkeämpi kuin kuvakkeiden määrä.
- Yksi termi tarkoittaa samaa kaikkialla. Budjetti = suunnitelma, kirjaus = tapahtuma, kokonaistoteuman korjaus = erillinen kategoriapoikkeus. Varattu, toteutunut ja tilisaldo eivät ole synonyymejä.
- Kuvat, palkit, luvut ja toiminnot käyttävät yhtenäisiä kokoja. Painallusalue vähintään 44 × 44 px, vaikka itse kuvake on pienempi.
- Tavallinen käyttö ei edellytä ohjetekstin lukemista. Lyhyt ohje lisätään juuri päätöksen yhteyteen; samaa kappaletta ei kopioida jokaiselle sivulle.
- Pitkä selite piilotetaan ennen ominaisuutta. Kriittinen virhe, laskennan epävarmuus tai maksupäätökseen vaikuttava oletus säilyy näkyvänä.
- Kaavion rinnalla on saavutettava luku tai taulukko. Animaatiot noudattavat vähennetyn liikkeen asetusta.

## Työjono

- [x] Esittämisen hierarkia ja säilytettävien ominaisuuksien periaate määritelty.
- [ ] Yhteiset komponentit: mittarikortti, tilamerkki, edistymispalkki, rivitoiminto ja avattava ohje.
- [ ] Yhteenveto: tärkeimmät luvut ja yhden askeleen toiminnot, vähemmän kappaletekstiä.
- [ ] Budjetti: nimi, luku, palkki, poikkeama, ensisijainen lisäys; selitykset avattaviksi.
- [ ] Tulot ja menot: samat rivit, kentät, nimet ja lisävalinnat.
- [ ] Kompassi: yksi havainto ja seuraava askel; lähde ja perustelu avattaviksi.
- [ ] Raportit: kysymys, tulos ja visualisointi ensin; menetelmä ja erittely pyynnöstä.
- [ ] Omaisuus, velat, sijoitukset ja tavoitteet: sama korttirakenne, aihekohtaiset lisätiedot.
- [ ] Asetukset ja datan hallinta: selkeät pääpaikat, lyhyet nimet ja vahvistukset.
- [ ] Käyttäjä-, näppäimistö-, ruudunlukija- ja mobiilivarmennus.
