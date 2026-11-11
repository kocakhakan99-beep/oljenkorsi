# Käyttöliittymän vertailu taloussovelluksiin

Päivitetty 4.11.2026. Tämä on julkisten ominaisuuskuvausten heuristinen vertailu, ei sovellusten käytettävyystesti. Tuotesivut kertovat toimittajien markkinoimista ominaisuuksista; ne eivät yksin todista niiden laatua, saavutettavuutta tai sopivuutta suomalaiselle käyttäjälle.

## Vertailu

| Sovellus ja julkinen kuvaus | Toimiva käyttötapa | Oljenkorressa | Sovellettava jatko |
| --- | --- | --- | --- |
| [YNAB: Features](https://www.ynab.com/features) | Tavoitteet auttavat kohdistamaan rahaa, ja lainalaskuri tukee velan takaisinmaksua. Tuotesivu nostaa esiin myös mobiiliwidgetit ja mukautettavat näkymät. | Tavoitteet, velanmaksuarvio ja mobiilinäkymä ovat olemassa. | Tavoitteeseen voisi liittää tilin tai varallisuuserän sekä erottaa tavoitesumman ja kuukausirahoituksen näkyvämmin. |
| [Monarch: Tracking](https://www.monarch.com/features/tracking) | Raportteja voi rajata ajanjakson ja kategorian mukaan; esimerkkinä on Sankey-rahavirtakaavio. Sivulla mainitaan myös toistuvien laskujen kalenterinäkymä ja muokattavat koontinäytön widgetit. | Raporttijaksoa voi rajata, kaaviota suurentaa ja pisteistä avata tietokortteja. Toistuvat tapahtumat ja koontinäyttö ovat käytettävissä. | Seuraava selkeä raportointilaajennus on interaktiivinen Sankey-näkymä. Toistuvien menojen kalenteri voisi näyttää tulevat eräpäivät yhdellä silmäyksellä. |
| [Monarch: Budgeting](https://www.monarch.com/features/budgeting) | Menot ryhmitellään kiinteisiin, joustaviin ja harvemmin toistuviin; budjettia voi rullata kuukausien yli ja ennustaa tulevaa kulutusta. | Kategoriabudjetti ja käsin syötettävä toteuma auttavat vertaamaan suunnitelmaa toteumaan. | Lisää tulevan kuukauden näkymä ja valinnainen ylijäämän siirto, mutta pidä suunniteltu, toteutunut ja tapahtumista laskettu summa erillään. |
| [Monarch: Planning](https://www.monarch.com/features/planning) | Tavoitteessa on kohdesumma ja kuukausitalletus; tilejä voi kohdistaa tavoitteisiin ja seurata etenemistä. | Tavoitesumma ja suunniteltu kuukausisummaa on jo tuettu. | Tilin kohdistaminen tavoitteeseen tekisi säästötavoitteesta konkreettisemman; tavoitteen sulkemisen pitäisi jäädä käyttäjän hallintaan. |
| [Copilot Money](https://www.copilot.money/) | Markkinoi avustajaa, joka tunnistaa menokehitystä ja ehdottaa budjettimuutosta; sovellus kokoaa kulutuksen, säästämisen ja sijoittamisen. | Sovellus kokoaa arjen tulot/menot sekä omaisuuden, velat ja sijoitukset yhteen ilman automaattista tiliyhteyttä. | Paikallinen sovellus voi tuoda kontekstuaalisia havaintoja itse datasta: esimerkiksi “ruokamenot ylittävät budjetin” ja suoran linkin kyseiseen raporttikorttiin. Ehdotus ei saa muuttaa budjettia ilman käyttäjän valintaa. |

## Suunnittelupäätökset

Raporttien pitkä aikavälipainikerivi, mukautettu jakso, kaaviotyylin vaihto, suurennus ja suoraan valittuun kirjaukseen vievä tietokortti ovat vertailun zoomattavan ja suodatettavan raportointimallin sovelluksia. Yksityiskohdat pidetään avattavina, jotta yhteenveto säilyy rauhallisena. Opasteen voi sulkea ja palauttaa asetuksista; summan eurokohtaiset pikasäädöt nopeuttavat toistuvaa syöttöä.

Pankkiyhteyttä tai automaattista tapahtumien tuontia ei lisätä tämän vertailun perusteella: sovelluksen nykyinen arvolupaus on yksityinen, paikallinen käyttö. Sen sijaan tuodaan nopeutta käsin kirjaamiseen, CSV-tuontiin ja valinnaisiin demotietoihin. Kaikki yhteenvedot ja ehdotukset perustuvat käyttäjän omaan dataan ja pysyvät tarkasteltavina ennen muutosta.

## Prioriteetit

1. **Toteutettu tässä käyttöliittymäkierroksessa:** suljettavat opastukset, summan pikasäädöt, raporttien 1–24 kuukauden ja vuoden alusta valinnat, mukautettu aikaväli, pylväs-/viiva-/aluekuvaaja, 70–180 % suurennus ja valinnan fokus tietokorttiin.
2. **Seuraavaksi:** Sankey-raportti, jos siitä saa helposti seurattavan myös pienellä näytöllä ja ilman väreihin nojaamista. Lisää samalle valinnalle saavutettava taulukko- tai tekstivastine.
3. **Sen jälkeen:** tulevien laskujen kalenterinäkymä ja budjetin seuraavien kuukausien suunnittelu. Käsittele manuaalinen toteuma, tapahtumista johdettu toteuma ja suunnitelma eri lähteinä.
4. **Myöhemmin:** tavoitteen kohdistaminen omaisuuserään, muokattavat yhteenvetokortit ja datasta johdetut havaintovinkit. Kaikkien vinkkien pitää olla ohitettavia; mikään ei muuta taloustietoja automaattisesti.

## Lähteiden rajat

Lähteet tarkistettu 4.11.2026. Tuotesivut voivat muuttua tai kuvata vain maksullista, aluekohtaista tai kokeellista ominaisuutta. Niiden esimerkeistä ei pidä päätellä, että sama toteutus sopisi offline-käyttöön, Suomen pankkeihin tai suomalaiseen talousdataan. Vertailu koskee käyttöliittymäkuvioita ja ominaisuuksien löytämistä, ei hintoja, tietoturvaa tai asiakkaiden todellisia tuloksia.
