# Laskurit, navigaatio ja asetusten tallennus

## Tavoite ja lähtötilanne

Kaikki käyttäjän käyttämät laskurit löytyvät yhdestä Laskurit-näkymästä. Erillinen Skenaariot-sivu poistuu, mutta sinne tallennetut suunnitelmat, laskentakaavat ja vertailu säilyvät. Sivupalkki järjestetään uudelleen ja Asetukset jaetaan välilehtiin. Kirjautuneen henkilökohtaiset käyttöasetukset säilyvät laitteiden välillä; vieraan tiedot ovat väliaikaisia. Nykyinen toimiva pilvitallennus ja tuotantotiedot säilytetään koko muutoksen ajan.

Nykyinen Skenaariot-sivu sisältää FI-pääomatavoitteen ja tavoiteajan, korkoa korolle -laskurin, tallennettujen suunnitelmien vertailun sekä kirjattuihin velkoihin perustuvan takaisinmaksuarvion. Lisäksi muualla on esimerkiksi puskurin ja tulokatkoksen arvio, velan maksusuunnitelma ja todellinen vuosikorko, tavoitteiden säästölaskenta sekä omaisuuden arvon arviointi. Laskutoimintoja on myös raporteissa ja tietueiden muokkauslomakkeissa, joten inventaario tehdään koko sovelluksesta, ei pelkästään Skenaariot-sivulta.

Nykyiset `State.scenarios`-tiedot kuuluvat aktiivisen talouden pilvidokumenttiin. Ulkoasun ja valitun kuukauden kaltaiset valinnat sen sijaan korvataan jaetussa dokumentissa neutraaleilla arvoilla, eikä niille ole vielä käyttäjäkohtaista pilvitallennusta. Ohjelaatikoiden piilotus tallennetaan tällä hetkellä selaimen paikalliseen tallennustilaan. Toteutus aloitetaan julkaistun `main`-haaran pohjalta; vanhaa työpuuta tai sen muutoksia ei ylikirjoiteta.

## 1. Laskurit

1. Inventoidaan jokainen erillinen laskuri, sen syötteet, tulokset, kaavat, oletukset, riippuvuudet taloustiedoista ja nykyiset linkit. Kartoitetaan myös Kompassin, raporttien sekä omaisuuden, velkojen ja tavoitteiden lomakkeiden laskentatoiminnot.
2. Lisätään sivupalkkiin **Laskurit**. Näkymässä on selkeät ryhmät: **Säästäminen ja sijoittaminen**, **Velat**, **Puskuri ja riskit** sekä **Omaisuus ja tavoitteet**. Ryhmät ja lopulliset nimet tarkistetaan inventaarion perusteella. Yksittäinen laskuri avataan omana näkymänään tai paneelinaan, jotta sivusta ei tule yhtä pitkää lomaketta.
3. Siirretään nykyiset FI-, korkoa korolle- ja velkalaskurit sekä tallennettujen suunnitelmien vertailu Laskureihin. Myös puskurilaskuri, velan maksusuunnitelma ja vuosikorko, tavoitteiden säästölaskenta ja omaisuuden arvioinnin laskuri tehdään löydettäviksi siellä. Talouteen sidottujen laskurien yhteydessä kerrotaan, mitä tietoja ne käyttävät ja milloin tietoja puuttuu.
4. Erillisen laskurin pääkäyttö on Laskurit-sivulla. Tietueiden muokkaamiseen kuuluvat kentät ja automaattiset yhteenvetoluvut säilyvät niissä yhteyksissä, joissa niitä tarvitaan; niistä voi avata vastaavan laskurin suoraan. Laskentalogiikalla on yksi yhteinen toteutus, jotta luvut ja oletukset eivät eriydy.
5. Laskurin kokeilu ei muuta taloustietoja ilman käyttäjän erillistä tallennustoimintoa. Nykyiset tallennetut sijoitusskenaariot ja vertailu säilytetään sellaisenaan; niiden nimiä voi esittää käyttöliittymässä suunnitelmina. Keskeneräisiä laskurisyötteitä ei automaattisesti tallenneta preferensseihin. Nykyiset laskentaoletukset ja huomautukset arvioiden rajoituksista säilytetään.
6. Vanha `#scenarios`-osoite ohjataan Laskureihin. Päivitetään Kompassin `destination: "scenarios"`, pikatoiminnot, sisäiset linkit ja selaushistoria. Vanhat varmuuskopiot ja `scenarios`-kenttä säilyvät yhteensopivina; käyttöliittymän siirto ei vaadi taloustietojen massamigraatiota.

## 2. Sivupalkin uusi rakenne

Ehdotus nykyisten sivujen pohjalta:

| Ryhmä | Sivut |
| --- | --- |
| Kokonaiskuva | Yhteenveto, Talouden kompassi |
| Rahankäyttö | Tulot, Menot, Budjetti |
| Varallisuus | Omaisuus, Velat, Sijoitukset |
| Suunnittelu | Tavoitteet, Laskurit, Raportit |
| Sovellus | Tuonti ja vienti, Asetukset, Ohje ja tietosuoja |

Skenaariot poistetaan sivupalkista. Valitut nimikkeet tarkistetaan samalla koko sovelluksen teksteistä. Mobiilin valikko, aktiivisen sivun ilmaisin, näppäimistökäyttö ja pikatoiminnot säilytetään. Sivujen osoitteet säilyvät mahdollisuuksien mukaan, ja vanhoille osoitteille tehdään turvalliset uudelleenohjaukset.

## 3. Asetusten välilehdet

- **Ulkoasu ja käyttö:** teema, väritila, korostusväri, yksityisyysnäyttö ja ohjelaatikoiden palautus.
- **Talous:** yhteiset budjettiohjeet ja muut aktiivista taloutta koskevat asetukset. Nämä vaikuttavat perhetaloudessa kaikkiin jäseniin; vaikutus kerrotaan näkyvästi.
- **Tili ja perhe:** kirjautuminen, profiili, perheen jäsenet ja kutsut sekä uloskirjautuminen. Toiminnot ryhmitellään loogisesti ilman sisäkkäisiä päällekkäisiä otsikoita.
- **Tiedot:** tallennuksen tila, JSON- ja CSV-vienti, palautus, demotaloudet ja vahvistusta edellyttävät poistotoiminnot. Tuonti ja vienti voi säilyä myös omana sivunaan, johon välilehdeltä linkitetään.

Välilehdillä on selkeät nimet ja pysyvät kohdeosoitteet esimerkiksi profiilivalikosta ja budjettiohjeista tulevia linkkejä varten. Toteutetaan näppäimistö- ja ruudunlukijakäyttö sekä pienille näytöille sopiva asettelu. Valitun välilehden vaihto ei saa hävittää tallentamatonta lomaketta huomaamatta.

## 4. Henkilökohtaiset asetukset ja tietokanta

### Omistajuus ja sisältö

Lisätään erillinen käyttäjäkohtainen asetustietue, jonka omistaja on kirjautunut Supabase-käyttäjä (`auth.users.id`). Se ei kuulu yksittäiseen perhetalouteen. Saman käyttäjän asetukset seuraavat käyttäjää Oman talouden ja perhetalouden välillä; eri perheenjäsenet eivät voi nähdä tai muokata toistensa asetuksia. Tilin poistaminen poistaa myös käyttäjän asetukset.

Ensimmäiseen versioon tallennetaan eksplisiittisesti hyväksytyt käyttövalinnat: teema, vaalea/tumma/järjestelmä, korostusväri, summien piilotus, valittu kuukausi ja piilotetut ohjelaatikot. Tarkistetaan myös mahdolliset muut aidosti pysyvät käyttöpreferenssit. Näkymäkohtaiset ohimenevät hakutermit, avoimet lomakkeet, tiedostot, skannerien tekstit, kutsukoodit ja API-avaimet eivät kuulu asetuksiin. Budjettiohjeet, talouden kategoria-asetukset ja säästetyt skenaariot jäävät talouden yhteiseen dokumenttiin.

### Turvallisuus ja luotettavuus

- Lisätään rajoitettu skeema, turvalliset oletusarvot, validointi, kohtuullinen kokoraja sekä skeemaversio. Selain saa vain julkisen Supabase-avaimen ja oman käyttäjätokenin. RLS tai tarkistetut RPC:t sallivat vain oman käyttäjän rivin; pelkkä asiakkaan lähettämä käyttäjätunniste ei määrää oikeuksia.
- Asetukset ladataan erikseen taloudesta ja niillä on oma tallennustila ja versiointiin perustuva ristiriitasuoja. Hidas lataus ei saa ylikirjoittaa sillä välin tehtyä valintaa eikä käyttäjän tai tilin vaihto vuotaa asetuksia toiselle käyttäjälle. Epäonnistunut tallennus näkyy ja on uusittavissa; taloustietojen tallennuksen tila ei väitä asetuksia tallennetuiksi.
- Tallennetaan vain vahvistettuja asetusten muutoksia yhdistäen tiheät päivitykset. Ulkoasun virhe ei estä taloustietojen lukemista eikä tallenna tyhjää taloutta. Uusi asetus lisätään sekä validointiin että tietosuojakuvaukseen.
- Vieraan asetukset ja talous ovat vain väliaikaisia muistissa. Nykyisen paikallisesti säilyvän ohjepiilotuksen siirtymä tehdään hallitusti, eikä vieraan taloutta siirretä kirjautuessa ilman nimenomaista käyttäjän toimintoa.

### Nykyisten asetusten siirtymä ja varmuuskopiot

Jos käyttäjälle ei vielä ole pilviasetuksia, luodaan ne turvallisista oletuksista ja huomioidaan saman istunnon omat valinnat ilman, että `sharedCloudState`n neutraaleja paikkamerkkejä käsitellään käyttäjän valintoina. Vanhoja selaimessa säilyviä ohjepiilotuksia voidaan tarjota siirrettäväksi käyttäjän omiin asetuksiin; toimenpiteen pitää olla toistettava eikä se saa korvata jo olemassa olevia pilviasetuksia. Kahden laitteen ensimmäinen kirjautuminen ja kilpaileva luonti testataan.

Nykyiset JSON-varmuuskopiot säilyvät palautettavina. Määritellään ja merkitään erikseen, sisältääkö uusi vienti henkilökohtaiset asetukset; talouden palautus ei saa huomaamatta muuttaa käyttäjän henkilökohtaisia asetuksia tai toisen perheenjäsenen valintoja. Vieraan CSV/JSON-vienti toimii kuten ennen.

## 5. Toteutusjärjestys ja hyväksyminen

1. **Inventaario ja turvarajat:** kartoitetaan laskurit, osoitteet ja asetukset sekä tallennetaan nykyiset laskentaesimerkit vertailupohjaksi. Otetaan tuotantokäyttöön sopiva palautussuunnitelma ja tarkistetaan tietojen vienti. Ei muuteta tuotantotietoja.
2. **Laskurit ja navigaatio:** erotetaan tarvittavat komponentit, tehdään uusi Laskurit-näkymä, siirretään sisällöt ja vanhat linkit sekä säilytetään skenaariodata ja laskentatulokset. Testataan vieras, kirjautunut käyttäjä, mobiili ja näppäimistö.
3. **Asetusten välilehdet:** siirretään olemassa olevat toiminnot välilehtiin muuttamatta niiden vaikutusta. Testataan profiilista ja muualta tulevat suorat linkit, tietojen poiston vahvistus ja pienet näytöt.
4. **Käyttäjäpreferenssit:** lisätään erillinen migraatio ja rajapinta sekä lataus, validointi, tallennus ja ristiriitakäsittely. Testataan kahdella käyttäjällä ja kahdella selaimella, mukaan lukien perheenjäsenet, tilin vaihto, verkkokatko, tilin poisto ja vanhan datan siirtymä. Varmistetaan, että perheen talous ja asetukset eivät sekoitu.
5. **Yhdistetty julkaisu:** ajetaan yksikkö-, tietokanta- ja selainkokeet ilmaisessa paikallisessa testiympäristössä, jossa ei käytetä oikeita henkilötietoja. Käyttöönotto tehdään vaiheittain nykyiseen Supabase-projektiin ilman maksullista haaraa; ensin yhteensopiva tietokantalisäys ja sitten asiakas. Testataan tuotannossa yhdellä käyttäjällä, toisella selaimella sekä vanhalla linkillä. Huolehditaan, että GitHub Pagesin varsinainen julkaisuhaara ja build-asetukset vastaavat julkaistua koodia.

Valmista on, kun kaikki käyttäjän laskurit löytyvät Laskurit-sivulta, vanhat skenaariot ja taloustiedot ovat tallella, vanhat linkit toimivat, asetusten välilehdet ovat käytettävissä mobiilissa ja kirjautuneen henkilökohtaiset valinnat palautuvat toisella laitteella muuttamatta muiden perheenjäsenten valintoja.
