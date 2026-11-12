# Supabase ja perhetili – toteutussuunnitelma

Tila 12.11.2026: ensimmäinen perhetilin versio ja manuaalinen tallennus on toteutettu. Automaattinen synkronointi, Apple-kirjautumisen asetukset, tilin ja perheen poisto sekä oikeilla käyttäjillä tehtävät päästä päähän -testit ovat vielä kesken. Tämä suunnitelma korvaa aiemman offline- ja yksittäisen HTML-tiedoston jakelutavoitteen tulevan verkkoversion osalta.

## Päätökset ja rajaus

- Kirjautuminen Googlella ja Applella Supabase Authin kautta. Selainkäyttö on ensimmäinen kohde.
- Perhe luodaan kirjautuneena; jäsenet liittyvät ylläpitäjän antamalla kutsukoodilla. Yhdellä käyttäjällä on ensimmäisessä versiossa enintään yksi perhe.
- Kaikki perheen taloustiedot ovat kaikkien sen jäsenten nähtävissä ja muokattavissa. Ylläpitäjä hallitsee kutsuja ja jäsenyyksiä. Perhetilassa ei ole yksityisiä taloustietoja; kirjautumattoman käyttäjän tila on erillinen.
- Sovellusta voi käyttää kirjautumatta. Tällöin taloustiedot ovat vain selaimen muistissa, eivät pysyvässä selaintallennuksessa tai pilvessä, ja katoavat sivun uudelleenlatauksessa, välilehden sulkemisessa tai istunnon keskeytyessä. Nykyinen CSV-vienti säilyy. Käyttöliittymä kertoo tilapäisyydestä selvästi. Pilveen siirto vaatii käyttäjän nimenomaisen valinnan. Palvelu ei tallenna lähde-PDF:iä tai kuittien tuoterivejä tämän suunnitelman perusteella.
- V1 käyttää HTTPS-yhteyttä, Supabasen levysalausta ja tietokannan jäsenyyteen perustuvaa RLS-rajausta. Se **ei ole päästä päähän salattu**: palveluntarjoajan infrastruktuuri voi käsitellä tietoja selväkielisinä. Valinta mahdollistaa tilin palauttamisen kirjautumalla ja pienentää riskiä menettää kaikki tiedot avaimen kadotessa. Muistissa olevat tiedot ja käyttäjän lataamat vientitiedostot eivät ole sovelluksen salaamia. Vahvempi asiakaspään salaus on myöhempi erikseen suunniteltava ominaisuus, jossa on ratkaistava perheavainten jako, jäsenen poisto ja palautus.

## Jakelu ja kirjautuminen

- Toteuta yksi verkkosovellus, jota kehitetään localhostissa ja joka julkaistaan myöhemmin HTTPS-osoitteessa. `file://`-jakelu ja offline-toiminta eivät ole uuden version tavoitteita. Kirjautumaton käyttö toimii saman verkkosovelluksen muistissa.
- Supabasen OAuth-palveluntarjoajan callback on Supabasen HTTPS-osoite; Supabasen sallittujen paluuosoitteiden listaan määritellään erikseen tarkka kehityksen localhost-osoite ja myöhemmin tuotannon HTTPS-osoite. Käytä selaimelle sopivaa OAuth PKCE -virtaa ja testaa koko paluuohjaus.
- Google Cloudissa tarvitaan OAuth-sovelluksen asetukset ja tunnisteet. Apple vaatii Apple Developer -jäsenyyden ja Sign in with Apple -asetukset, mukaan lukien Services ID:n, asianmukaisen verkkotunnuksen ja paluuosoitteen sekä client secretin ylläpidon. Apple-verkkokirjautumisen kokeilu saattaa edellyttää oikeaa verkkotunnusta ja HTTPS-jakelua: varmista käytännössä, älä oleta localhost-tukea. Google voidaan tutkia erikseen kehityksessä.
- Supabasen URL ja publishable-avain ovat selainjulkisia. Palveluntarjoajien salaisuudet ja Supabasen salaiset/service-role-avaimet kuuluvat vain palvelinpuolelle tai palvelun asetuksiin, eivät repositorioon, HTML:ään tai käyttäjän viesteihin. Istunnot ja uloskirjautuminen testataan; käyttöliittymä ei luota käyttäjän muokattaviin JWT-metatietoihin oikeuksia määrittäessään.

## Perhe ja kutsukoodi

- Luo perhe ja ensimmäinen ylläpitäjä yhtenä atomisena toimintona. Näytä jäsenet ja roolit. Jäsen voi erota; ylläpitäjä voi poistaa jäsenen ja perua kutsun. Viimeinen ylläpitäjä ei voi erota tai tulla poistetuksi ennen ylläpitäjyyden siirtoa tai perheen hallittua poistoa.
- Koodi on satunnaisesti generoitu, riittävän pitkä ja kertakäyttöinen; alustava muoto on 128 bitin satunnaisuuteen perustuva luettava koodi. Se vanhenee esimerkiksi 24 tunnissa. Näytä koodi vain luotaessa; tallenna vain turvallinen tiiviste. Älä kirjaa koodia lokeihin, URL-osoitteisiin tai analytiikkaan.
- Lunastus edellyttää kirjautumista ja käsitellään palvelinpuolella atomisesti: voimassaolo, käyttämättömyys ja käyttäjän kelpoisuus tarkistetaan samassa tapahtumassa jäsenyyden luonnin ja koodin kulutuksen kanssa. Kilpailevista lunastuksista vain yksi onnistuu. Rajoita luonti- ja arvausyrityksiä palvelinpuolella ja tarjoa yleinen virheviesti; pelkkään selaimen rajoitukseen ei luoteta.
- Koodin haltija saa jäsenyyden kautta pääsyn kaikkeen perheen dataan. Käyttöliittymä kertoo tämän ennen koodin luomista ja liittymistä. Poistettu jäsen menettää palvelinpuolen pääsyn heti seuraavissa tarkistuksissa, mutta hänen aiemmin lataamiaan kopioita ei voida poistaa etänä.

## Tietomalli ja rajapinta

- `families`: perheen tunniste, nimi ja luontiaika. `family_members`: perhe, Auth-käyttäjän ID ja rooli; yksikäsitteisyys estää päällekkäiset jäsenyydet. `family_invites`: perhe, koodin tiiviste, luoja, vanheneminen, peruminen ja käyttö. Kooditaulua ei avata suoraan selaimelle.
- Ensimmäisessä vaiheessa `family_state`: yksi versionoitu ja validoitu sovellustilan dokumentti perhettä kohti, mukana skeemaversio, palvelimen ylläpitämä revisio ja muokkausaika. Tämä sopii nykyiseen koko tilan tallentavaan `StorageProvider`-malliin, mutta koko dokumentin siirron kokorajat ja suorituskyky on mitattava. Tarvittaessa tietuekohtainen malli on myöhempi migraatio, ei oletus.
- RLS kaikkiin julkisen skeeman tauluihin, vähimmäisoikeuksien mukaiset GRANTit sekä jäsenyystarkistukset tietokannassa jokaiseen lukuun ja kirjoitukseen. Jäsen ei saa muuttaa rooleja tai jäsenyyksiä suoraan. Ylläpitotoimet ja kutsun lunastus toteutetaan rajattuina palvelinoperaatioina, joiden oikeudet, syötteet ja hakupolku tarkastetaan; mahdolliset korotetut oikeudet pidetään poissa julkisesta skeemasta ja niiden suoritus rajataan tarkasti.
- Lähetettävä ja vastaanotettava data validoidaan ja versioidaan. Palvelin asettaa revision ja varmistaa jäsenyyden; älä hyväksy asiakkaalta luotettavana perheen omistusta tai revision arvoa muuten kuin odotettuna versiona. Pysyvät migraatiot versioidaan repositorioon. Ennen käyttöönottoa suoritetaan Supabasen tietoturva- ja suorituskykyneuvot sekä oikeustestit.

## Synkronointi ja palautus

- Kirjautumattoman muistissa olevia tietoja ei yhdistetä tai siirretä automaattisesti. Perustamisessa käyttäjä näkee tilanteen, voi viedä tiedot CSV:nä ja vahvistaa yksiselitteisesti muistin datan kopioinnin tyhjään perheeseen. Olemassa olevaan perheeseen liittyessä muistissa olevien muutosten päälle ei kirjoiteta huomaamatta: tarjotaan ensin CSV-vienti ja selkeä valinta. Automaattista yhdistelyä ei ensimmäisessä versiossa tehdä. CSV ei ole täydellinen varmuuskopio; nykyisen JSON-viennin ja palautuksen säilyttäminen kirjautuneille sekä tilapäisille käyttäjille tarkistetaan toteutuksessa.
- Koko dokumentin tallennus käyttää atomista vertaa-ja-vaihda-toimintoa: päivitys hyväksytään vain, jos palvelimen revisio vastaa asiakkaan viimeksi lukemaa revisiota. Ristiriidassa pilvidataa ei ylikirjoiteta; paikalliset muutokset säilytetään, käyttäjälle näytetään ristiriita ja tarjotaan vienti sekä tietoinen palautus/lataus. Verkko- tai tallennusvirhe ei saa hävittää muokkauksia. Muistissa olevien lähettämättömien muutosten, uusintalähetyksen ja kirjautumisen päättymisen käsittely testataan; sivun sulkeutumisen yli säilyvää offline-jonoa ei luvata; älä lupaa automaattista tietuekohtaista yhdistämistä.
- Toteuta selkeä tila: tilapäisesti muistissa, tallennetaan, tallennettu pilveen tai vaatii käyttäjän toimia. Irrota asynkroninen pilvitallennus nykyisestä synkronisesta tallennusrajapinnasta. Kirjautumattoman dataa ei saa huomaamatta kirjoittaa localStorageen tai muuhun pysyvään tallennukseen.
- Määrittele ja testaa perheen ja käyttäjätilin poisto, varmuuskopiointi ja palautus ennen julkaisua. Erottava jäsen ei poista perheen tietoja. Perheen poisto vaatii ylläpitäjältä tietoisen vahvistuksen ja kertoo seuraukset; palvelun varmuuskopioiden säilytysaika ja lopullinen poistuminen selvitetään erikseen. Päivitä tietosuoja- ja käyttöohjeet vastaamaan todellista toteutusta ja palvelualueita.

## Työvaiheet ja hyväksyntä

1. Selvitä nykyisen datamallin ja varmuuskopion täydellisyys, tilan kokorajat ja verkkoversion siirtymä ja nykyisen localStorage-datan hallittu käsittely. Suunnittele palvelinpuolen operaatiot ja RLS sekä luo migraatiot paikallisesti testattaviksi.
2. Testaa kaksi perhettä, ylläpitäjä, jäsen, ulkopuolinen ja nimetön käyttäjä: ristiperheluku ja -kirjoitus, roolin korotus, kutsun arvaus/lunastus, vanhentuminen ja yhtäaikaiset lunastukset. Tarkista viimeisen ylläpitäjän suoja.
3. Toteuta autentikoinnin rajapinta, Google ja Apple sekä istunnon käsittely. Käytä kehityksessä testitunnuksia ja erillistä testiympäristöä; tuotannon OAuth-asetukset ja tarvittava HTTPS-host päätetään ennen julkaisua.
4. Toteuta perheen luonti, koodi, liittyminen ja jäsenhallinta. Testaa oikeilla erillisillä käyttäjillä ja palvelinpuolen oikeustestit.
5. Toteuta eksplisiittinen muistissa olevan tilan kopiointi, versioitu synkronointi ja ristiriidan käsittely. Testaa kahden selaimen samanaikaiset muutokset, verkkokatko, vanha sovellusversio, epäonnistunut tallennus, uloskirjautuminen ja varmuuskopiosta palautus.
6. Tarkista turvallisuus, yksityisyystekstit, poistaminen, saavutettavuus ja palautus; testaa kirjautumaton käyttö ja varmista, ettei talousdataa jää pysyvään selaintallennukseen. Nykyisille localStorage-käyttäjille suunnitellaan erikseen turvallinen esikatselu, vienti ja tietoinen siirto; vanhoja tietoja ei poisteta automaattisesti. Tuotantoon vasta kun molemmat kirjautumistavat ja oikeudet on todellisuudessa varmennettu.

## Avoimet käytännön edellytykset

- Tuotannon selainosoite ja hosting valitaan myöhemmin; Apple-verkkokirjautumisen verkkotunnusvaatimukset tarkistetaan sen yhteydessä.
- Google Cloud- ja Apple Developer -tilien käyttöoikeudet ja asetukset tarvitaan kirjautumisten aktivoimiseen. Älä lähetä salaisuuksia keskusteluun.
- Perheen oletusnimi, kutsun tarkka voimassaoloaika, mahdollinen jäsenmäärän raja ja yksityiskohtainen poistokäytäntö päätetään toteutuksen yhteydessä. Suunnitelman oletuksia voidaan muuttaa ennen julkaisua.

## Lähteet

- [Supabase: Google-kirjautuminen](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Supabase: Apple-kirjautuminen](https://supabase.com/docs/guides/auth/social-login/auth-apple)
- [Supabase: paluuosoitteet](https://supabase.com/docs/guides/auth/redirect-urls)
- [Supabase: RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase: API:n suojaus](https://supabase.com/docs/guides/api/securing-your-api)
