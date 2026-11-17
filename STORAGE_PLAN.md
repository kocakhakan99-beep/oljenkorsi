# Tietojen tallennus – toteutussuunnitelma 14.11.2026

Tämä suunnitelma korvaa aiemman Supabase-suunnitelman tallennusta ja synkronointia koskevat oletukset. Automaattisen pilvitallennuksen kokeiluversio on toteutettu työpuuhun, mutta sitä ei ole vielä julkaistu.

## 1. Nykytila ja tavoite

`src/main.tsx`-tiedoston `commit()` päivittää validoidun tilan ja `MemoryStorageProvider`-muistin. Kirjautuminen ei vaihda tätä tallennustapaa. `Family`-komponentti hakee, lataa ja tallentaa perheen tiedot erillisillä toiminnoilla vain asetussivulla. Tuotannon `family_save` tarkistaa jäsenyyden ja revision, mutta dokumentista vain objektityypin ja 5 000 000 tavun enimmäiskoon. Työtilassa oleva JSONB-varmuuskopiokorjaus ei vielä sisälly julkaistuun kirjautumiskorjaukseen.

Tämä selittää, miksi kirjautuminen ei tällä hetkellä tuo odotettua jatkuvaa tallentumista. Käyttäjän raportoiman manuaalisen tallennusvirheen tarkka syy selvitetään ensimmäisessä vaiheessa; sitä ei päätellä pelkästä tästä rakennepuutteesta.

**Vaiheen 0 tarkennus:** tuotantotietokannassa on edelleen kolme alkuperäistä perhetilimigraatiota ja `family_save(p_expected_revision, p_state)`. Rajapinta ei hyväksy erillistä talouden tunnistetta eikä kirjoitustunnistetta, joten se ei yksin toteuta usean talouden automaattitallennusta tai kadonneen vastauksen turvallista uusintaa. Nykyisten käyttäjätietojen sisältöä ei luettu. Manuaalisen tallennuksen ilmoitettua virhettä ei ole vielä toistettu erillisellä käyttäjällä.

**Toteutuksen välitila:** työpuussa migraatio `20261114104043_cloud_households.sql` lisää oman talouden omistuksen, talouksien listauksen ja lukemisen sekä kirjoituskuittien taulun ja versiotarkistetun sisäisen tallennuksen. Uusi `cloud-save` Edge Function tarkistaa käyttäjän ja dokumentin ennen palvelinroolin kutsua; `CloudApi` toteuttaa vastaavat selainkutsut. Selainroolit eivät voi kutsua sisäistä kirjoitusfunktiota. `CloudSession` hallitsee talouden latausta ja tallennusjonoa, ja `cloud-state` erottaa selaimen näyttöasetukset jaetusta talousdatasta. Käyttöliittymän alustava kytkentä on kokeiltavissa kehityspalvelimella asetuksella `VITE_CLOUD_SAVE_ENABLED=true`; tavallinen build ei aktivoi sitä. Paikallisessa Supabase-pinossa selain, Auth, tallennusfunktio ja PostgreSQL toimivat yhdessä synteettisellä käyttäjällä; toinen koe tarkisti lisäksi kahden käyttäjän perhejaon ja oikeudet. Toteutusta ei ole asennettu tuotantoon eikä testattu isännöidyssä Supabasessa oikeilla OAuth-tileillä. Vanha `family_save` on vielä tuotannossa käytössä; erillinen migraatio `20261117111137_cloud_cutover_disable_legacy_save.sql` poistaa sen kirjoitusoikeuden käyttöönoton yhteydessä. Vanhat asiakkaat voivat yhä ladata ja viedä tietoja, mutta niiden pilvitallennus lakkaa, kunnes sovellus päivitetään. Kuittien vanhennus, palautushistoria, saavutettavuus ja isännöidyn testiympäristön päästä päähän -testit ovat vielä tekemättä.

Tavoite: kirjautuneen käyttäjän vahvistetut kirjaukset tallentuvat automaattisesti Supabaseen ja palautuvat seuraavalla käynnistyksellä. Näkyvä tallennustila perustuu palvelimen kuittaukseen. Perheen jäsenet käyttävät samaa taloutta ilman hiljaisia ylikirjoituksia.

## 2. Käyttötapa ja tietojen omistus

- **Vieras:** talous on vain välilehden muistissa. JSON- ja CSV-vienti säilyvät. Sivun sulkeminen tai uudelleenlataus hävittää tiedot. Pysyvää selainkopiota tai offline-jonoa ei lisätä.
- **Kirjautunut:** ensimmäisellä käyttökerralla syntyy yksityinen Oma talous. Perheen perustamista ei tarvita oman talouden tallentamiseen.
- **Perhe:** erillinen yhteinen talous, jonka kaikki jäsenet näkevät ja jota he voivat muokata. Oma talous ja perhetalous eivät sekoitu. Käyttöliittymä näyttää koko ajan aktiivisen talouden.
- **Nykyiset käyttäjät:** olemassa olevat perheet ja tallennukset säilyvät. Jo olemassa oleva perhe avautuu alkuvaiheessa nykyisen käyttäjän oletustaloudeksi; uutta tyhjää taloutta ei aseteta sen päälle.
- Vieraan tietojen siirto tai JSON-palautus pilvitalouteen on aina tietoinen valinta. Tarjotaan vienti ennen korvaamista. Pelkkä sisäänkirjautuminen ei julkaise vieraan tietoja perheelle.
- OAuth lataa sivun uudelleen, joten vieraan data täytyy viedä tiedostoon ennen kirjautumista ja tuoda sen jälkeen. Tätä rajoitusta ei peitetä automaattisen siirron lupauksella.

Valittu oletus on Oma talous + erillinen perhetalous. Tämä laajentaa nykyistä yhden perheen jäsenyysmallia, mutta välttää oman talouden menetyksen perheeseen liittymisen yhteydessä.

## 3. Tietomalli

Hyödynnetään nykyisiä perhetauluja talouden säiliönä; tuloja ja menoja ei tässä vaiheessa siirretä erillisiin relaatiotauluihin.

1. Taloudelle lisätään tyyppi `personal` tai `shared`. Henkilökohtaisella taloudella on yksi omistaja; siihen ei voi luoda kutsuja tai lisätä jäseniä.
2. Jäsenyyden yksikäsitteisyys muuttuu käyttäjäkohtaisesta yhdistelmäksi `(family_id, user_id)`. Käyttäjällä voi olla Oma talous ja yhteinen perhetalous. Vanhoja jäsenyyksiä ei poisteta migraatiossa.
3. Jokainen luku ja kirjoitus nimeää kohdetalouden. Palvelin tarkistaa sen jäsenyyden joka kerta. Käyttäjän aktiivinen talous on käyttömukavuusasetus, ei oikeuksien lähde.
4. Dokumentilla on `schema_version`, palvelimen kasvattama `revision`, `updated_at` ja validoitu JSONB-sisältö. Uusin hyväksytty versio on tietokannassa; Reactin tila on muokattava työversio.
5. Kirjoituskuitille tallennetaan talouden, käyttäjän ja `mutation_id`:n yhdistelmä, pyynnön palvelimella laskettu tiiviste ja tulosrevisio. Kuitilla voi selvittää, tallentuiko aikakatkaistu pyyntö. Kuittien säilytys on rajattu, esimerkiksi seitsemän päivää.
6. Tietueiden nykyiset pysyvät ID:t säilyvät. Päivämäärät ja rahamäärät säilyttävät nykyiset domain-säännöt; rahasummat tallennetaan kokonaisina sentteinä.
7. Teema, avoin näkymä, valittu kuukausi ja muut henkilökohtaiset näyttövalinnat erotetaan yhteisen talouden dokumentista. Niiden muutos ei tee koko perheen talouskirjoitusta tai muuta toisen jäsenen näkymää. Varsinaiset budjettisäännöt ovat yhteistä dataa.

Kokonaisdokumentti on ensimmäisen version rajaus. Palvelimen 5 MB:n kokoraja yhtenäistetään asiakkaan kanssa todellisina UTF-8-tavuina. Varoitus annetaan ennen rajaa. Jos realistinen iso aineisto tai kirjoituskilpailu osoittaa mallin riittämättömäksi, tietuekohtainen tallennus suunnitellaan mitattujen tulosten perusteella.

## 4. Tallennuspalvelu ja käynnistyminen

Pilvitallennus erotetaan synkronisesta `StorageProvider`-rajapinnasta omaksi asynkroniseksi palveluksi ja React-hookiksi. `Family` hallitsee kutsuja ja jäsenyyksiä; sivun vaihtaminen ei katkaise tallennuksen tilaa.

Palvelun operaatiot: `listHouseholds`, `ensurePersonalHousehold`, `load`, `save`, `getMutationReceipt` sekä hallittu aktiivisen talouden vaihto. Toistuva henkilökohtaisen talouden perustamispyyntö palauttaa saman talouden; samanaikaiset selaimet eivät luo kaksoiskappaleita.

Käynnistyksen järjestys:

1. Selvitä Auth-istunto ja lataa käyttäjän taloudet.
2. Valitse sallittu oletustalous tai pyydä valinta. Palvelin ei luota selaimen vanhaan talouden tunnisteeseen.
3. Lataa tallennus, validoi ja tarvittaessa suorita tunnettu skeemamuunnos.
4. Aseta palvelimen dokumentti ja revisio lähtötilaksi. Vasta tämän jälkeen salli pilvitalouden muokkaus ja automaattitallennus.

Tyhjän talouden luonti on eri tila kuin latausvirhe. Epäonnistuneen latauksen, tuntemattoman skeemaversion tai puuttuvan jäsenyyden jälkeen ei käynnistetä tyhjän oletustilan tallennusta.

## 5. Automaattitallennus ja kuittaukset

- Kirjauksen vahvistaminen, poistaminen, kumoaminen tai talouden asetuksen tallentaminen luo uuden paikallisen version. Keskeneräistä lomaketta ei tallenneta pilveen.
- Muutos näkyy heti käyttöliittymässä. Tallennus käynnistyy noin 800 ms viimeisestä muutoksesta, jatkuvassa muokkauksessa viimeistään noin kolmen sekunnin välein. Lisäksi tarjotaan Tallenna nyt.
- Yhdellä taloudella on korkeintaan yksi kirjoitus käynnissä tässä selaimessa. Sen aikana syntyneet muutokset jäävät jonoon. Vanha vastaus ei korvaa uudempaa paikallista tilaa.
- Lähetys sisältää muuttumattoman dokumenttikopion, odotetun palvelinrevision ja satunnaisen `mutation_id`:n. Uusinta lähettää saman kopion ja tunnisteen. Uudempi dokumentti saa uuden tunnisteen.
- Palvelin tarkistaa jäsenyyden, koon, skeeman ja odotetun revision samassa kirjoitustransaktiossa. Hyväksyntä kasvattaa revisiota ja tallentaa kirjoituskuitin atomisesti.
- Sama tunniste ja sama sisältö palauttavat aiemman tuloksen; sama tunniste eri sisällöllä hylätään. Näin verkkouusinta ei luo toista muutosta.
- Kuittaus merkitsee vain lähetetyn paikallisversion tallennetuksi. Jos käyttäjä ehti muokata lisää, tila pysyy Muutoksia tallentamatta, ja seuraava lähetys käyttää uutta palvelinrevisiota.
- Istunnon, käyttäjän tai kohdetalouden vaihtuessa vanhojen pyyntöjen vastaukset ohitetaan sukupolvitunnisteen avulla. Vanhan talouden sisältöä ei koskaan lähetetä uuden käyttäjän tai talouden kontekstiin.

Näytettävät tilat: **Haetaan tietoja**, **Vieras – vain muistissa**, **Muutoksia tallentamatta**, **Tallennetaan**, **Tallennettu [aika]**, **Yhteysvirhe**, **Kirjaudu uudelleen** ja **Versioristiriita**. Tallennettu tarkoittaa, että kaikki nykyiset vahvistetut paikalliset muutokset on kuitattu palvelimelta.

## 6. Verkkovirheet, ristiriidat ja monta selainta

- Aikakatkaisussa tallentuminen on aluksi epävarmaa. Tarkistetaan kirjoituskuitti tai uusitaan sama pyyntö. Pelkkä katkennut HTTP-vastaus ei tarkoita, ettei tietokanta tallentanut muutosta.
- Ohimenevissä verkkovirheissä muutokset pysyvät muistissa ja lähetys uusitaan viiveellä, esimerkiksi 1, 2, 5, 10 ja enintään 30 sekunnin välein satunnaistetusti. Käyttäjä voi yrittää heti uudelleen tai viedä JSONin.
- 401/403-, validointi- ja versioristiriitoja ei yritetä loputtomasti uudelleen. Ne vaativat istunnon tarkistuksen tai käyttäjän toiminnon.
- Revisioristiriita pysäyttää automaattitallennuksen. Paikallinen työversio säilyy; tarjotaan sen JSON-vienti sekä palvelimen uusimman version tarkastelu ja tietoinen lataus. Ensimmäiseen versioon ei tule automaattista yhdistelyä eikä hiljaista viimeisin kirjoitus voittaa -toimintoa.
- Puhdas näkymä voi ladata toisen laitteen uudemman version automaattisesti. Jos paikallisia muutoksia tai muokattava lomake on avoinna, näytetään päivitysilmoitus eikä korvata työtä kesken muokkauksen.
- Uudempi revisio tarkistetaan välilehden aktivoituessa ja esimerkiksi 30 sekunnin välein näkyvässä välilehdessä. Ensimmäinen versio ei tarvitse Realtime-kanavaa; myöhemmin se voi ilmoittaa revision muuttumisesta, mutta luku ja oikeustarkistus tehdään silti palvelimella.
- Sulkemisvaroitus näytetään vain kuittaamattomista muutoksista. `beforeunload` tai `sendBeacon` eivät takaa viimeisen tallennuksen onnistumista. Mobiiliselaimen sulkeminen voi hukata kuittaamattoman muistiversion; tämä kerrotaan virhetilassa.
- Talouden vaihto, uloskirjautuminen ja OAuth-uudelleenkirjautuminen tarjoavat ensin tallennuksen tai viennin. Vaihdon jälkeen vanhan talouden data poistetaan käyttöliittymän ja palvelun muistista. Käyttäjätilien tiedot eivät saa näkyä ristiin edes hetkellisesti.

## 7. Tietoturva ja yksityisyys

- Selain käyttää publishable-avainta ja käyttäjän JWT:tä. Ylläpitoavaimia ei toimiteta selaimelle. Oikeudet perustuvat tietokannan jäsenyyteen, eivät muokattaviin profiilimetatietoihin.
- Yksityiset taulut, vähimmäisoikeudet ja tarkistetut RPC:t säilytetään. Jokainen listaus, luku, kirjoitus, kuitti, historia ja poistotoiminto tarkistaa kohdetalouden ja nykyisen jäsenyyden. Kutsukoodin lunastus ei siirrä käyttäjän omaa taloutta perheelle.
- Validointi tehdään sekä selaimessa että palvelimella. Tietokannan JSONB-skeemaan käytetään Supabasen `pg_jsonschema`-laajennusta, jos sen saatavuus ja Zodista tuotetun skeeman yhteensopivuus varmennetaan. Sen rinnalla tarvitaan domain-tarkistukset, kuten ID-viitteet, päivämäärien kelvollisuus ja sallitut rahamäärät. Muussa tapauksessa valitaan vastaava palvelinratkaisu ennen käyttöönottoa. Pelkkä selainvalidointi ei riitä.
- Vanha julkinen tallennusreitti ei saa jäädä kiertämään uusia tarkistuksia. Kokoraja, kirjoitustahti ja rivimäärien/tekstikenttien rajat tarkistetaan palvelimella. Rajojen tulee perustua mitattuun normaaliin käyttöön; virhe ei saa aiheuttaa loputonta uusintatulvaa.
- Pilvidokumenttiin ei päädy lähde-PDF:iä, API-avaimia, kirjautumiskoodeja tai skannerin raakatekstiä. Sallittu sisältö määritellään eksplisiittisellä skeemalla. Tekstisisältö käsitellään datana ja renderöidään Reactin tekstinä.
- Lokiin kirjataan toiminto, tekninen virheluokka, revisio, kesto ja korrelaatiotunniste. Dokumenttisisältöä, summia, selitteitä, JWT:tä, kutsukoodeja tai OAuth-parametreja ei lokiteta.
- HTTPS ja palveluntarjoajan salaus suojaavat tiedonsiirtoa ja levyjä. Tämä malli ei ole päästä päähän salattu. Kanoninen tarkistussumma auttaa tahattomien muutosten tunnistamisessa; FNV ei ole tietoturvaraja eikä käyttöoikeustarkistus.
- Istunnon päättyminen pysäyttää uudet kirjoitukset. Perheestä poistaminen estää seuraavat palvelinoperaatiot välittömästi jäsenyyden tarkistuksella; aiemmin ladattua kopiota ei voida poistaa toisesta selaimesta.

## 8. Palautus, poistaminen ja ylläpito

- JSON-vienti ja validoitu palautus säilyvät. CSV on rajattu vienti, ei täydellinen palautusmuoto.
- Lisätään rajattu palvelinpuolen versiohistoria vahinkokorvauksen palauttamiseen. Lähtöoletus: enintään 20 versiota taloutta kohti ja enintään 30 päivän säilytys; rajoja tarkennetaan aineiston koon ja kustannusmittauksen jälkeen. Historiaa ei kopioida rajatta jokaisesta näppäily- tai näyttöasetuksen muutoksesta.
- Palautus on uusi revisio ja käyttää samaa ristiriitasuojausta; se ei kelauta revisionumeroa taaksepäin.
- Supabasen varmuuskopioiden saatavuus, säilytys ja palautusmahdollisuus selvitetään käytössä olevasta palvelutasosta. Sovelluksen historia ja käyttäjän JSON-vienti eivät yksin takaa palvelukatastrofista palautumista. Palautus harjoitellaan erillisessä ympäristössä.
- Talouden poisto poistaa myös historian ja kirjoituskuitit sovelluksen aktiivisesta tietokannasta. Palveluntarjoajan teknisten varmuuskopioiden poistumisaika dokumentoidaan erikseen.
- Henkilökohtaisen talouden poistaminen ja käyttäjätilin poistaminen erotetaan perheen poistamisesta. Henkilökohtaisia talouksia ei käsitellä nykyisellä perheen automaattisen ylläpitäjäsiirron säännöllä. Nykyinen poistomigraatio sovitetaan uuteen usean talouden malliin ennen sen julkaisua.
- Seurataan tallennusten onnistumista, viivettä, dokumenttikokoa, konfliktien määrää ja kustannuksia sisällöttömillä mittareilla.

## 9. Toteutusjärjestys ja hyväksymiskriteerit

### Vaihe 0: nykyisen tallennusvirheen rajaus ja suojaus

Toistetaan tuotantoa vastaavassa testiympäristössä perheen luonti, ensimmäinen manuaalinen tallennus ja uudelleenlataus. Tarkistetaan RPC:n virheluokka, JSONB-palautus, asiakasversio ja revisio. Nykyinen tietokanta varmistetaan ennen migraatioita. Vanhan muodon kopioita ei kirjoiteta yli ennen onnistunutta lukua ja vientimahdollisuutta.

Hyväksyntä: tiedetään mikä nykyisessä ketjussa epäonnistuu; käyttäjän raportoimaa virhettä ei kuitata pelkällä automaattitallennuksen lisäämisellä.

### Vaihe 1: tietomalli ja palvelinrajapinta

Luodaan lisäävät migraatiot omalle/yhteiselle taloudelle, usealle jäsenyydelle, skeemavalidoinnille, revisioille ja kirjoituskuiteille. Vanhat dokumentit ja jäsenyydet säilytetään. Uusi rajapinta versioidaan; vanhojen asiakkaiden kirjoitukset ohjataan samoihin tarkistuksiin tai hylätään selkeällä päivitystarpeella.

Hyväksyntä: nimetön, jäsen, ylläpitäjä, poistettu jäsen ja toisen talouden käyttäjä eivät voi ylittää oikeuksiaan. Kaksi yhtäaikaista perustamista ei tee kahta Omaa taloutta. Kaksi samalla revisiolla kirjoittavaa eivät molemmat onnistu. Sama kirjoitusyritys voidaan uusia turvallisesti. Rikkinäinen dokumentti ja liian suuri pyyntö hylätään ennen korvaamista.

### Vaihe 2: käynnistys ja tallennuspalvelu

Toteutetaan automaattinen lataus, palvelimen kuittaukseen perustuva tila, yhden lähetyksen jono, aikakatkaisun selvitys ja istuntoon sidottu konteksti. Liitetään kaikki talouden muutokset samaan polkuun, mukaan lukien kumoa, tuonti ja kategoriat.

Hyväksyntä: muokkaus näkyy uudelleenlatauksen ja toisen laitteen jälkeen; latausvirhe ei tallenna tyhjää taloutta; vanha vastaus ei merkitse uudempia muutoksia tallennetuiksi; käyttäjän tai talouden vaihto ei vuoda tietoja.

### Vaihe 3: käyttöliittymä ja perhetili

Lisätään Oma talous / perhetalous -valinta, tallennusindikaattori, Tallenna nyt ja virhetoiminnot. Poistetaan ristiriitaiset muistissa/pilvessä-tekstit ja vanhan erillisen manuaalitallennuksen rinnakkaiset lupaukset. Perheeseen liittyminen säilyttää oman talouden. Demot ja palautus korvaavat aktiivisen talouden vain nimenomaisella vahvistuksella.

Hyväksyntä: käyttäjä osaa kertoa, mihin talouteen hän kirjoittaa ja onko muutos tallennettu. Molemmat perheen jäsenet näkevät saman hyväksytyn version. Kirjautumaton käyttö säilyy muistissa ja CSV/JSON-vienti toimii.

### Vaihe 4: virhe- ja palautustestit

Testataan viivästynyt vastaus, kadonnut kuittaus, verkkokatko kesken kirjoituksen, palautuva yhteys, vanhentunut istunto, kaksi välilehteä/laitetta, samanaikainen kirjoitus, kesken pyynnön poistettu jäsen, talouden vaihto, vanha asiakas, tuonti, kumoa, vahinkokorvauksen palautus ja käyttäjätilin/perheen poisto.

Hyväksyntä: palvelimelle hyväksytyt tiedot eivät katoa; kuittaamaton työ ei katoa sovelluksen virheenkäsittelyssä; ristiriita ei ylikirjoita toisen työtä. Sulkemisen aiheuttama muistiversion menetys on rajattu ja selvästi kerrottu.

### Vaihe 5: julkaisu ja palautusvalmius

Testiympäristöön ensin palvelin ja migraatiot, sitten asiakas. Oikeilla erillisillä testikäyttäjillä tehty päästä päähän -koe vaaditaan ennen tuotantoa. Googlella toimivan tallennuksen julkaisua ei sidota vielä pois käytöstä olevaan Apple-provideriin; Apple testataan ennen sen omaa käyttöönottoa.

Tuotannossa otetaan ensin käyttöön yhteensopiva backend ja sen jälkeen tallennusominaisuus pienelle testijoukolle. Tarkistetaan, että sekä `main` että GitHub Pagesin todellinen julkaisuhaara sisältävät sovitut muutokset. Sivulta varmistetaan käytössä oleva julkaisuversio. Käyttöönoton peruminen pysäyttää uudet automaattikirjoitukset ja säilyttää JSON-viennin sekä pilveen jo hyväksytyt dokumentit; tietokantamuutoksia tai revisioita ei peruta dataa poistamalla.

## 10. Valmis tarkoittaa

Uusi kirjautunut käyttäjä lisää menon, näkee palvelimen kuittauksen, sulkee sivun ja löytää saman menon uudelleen sekä toiselta laitteelta. Perheen jäsenen muutos ei häviä toisen jäsenen tallennukseen. Tallennusvirhe on näkyvä ja työ on vietävissä tiedostoon. Vierastalous ei jää pysyvään selaintallennukseen. Oikeudet, poistaminen ja palautuminen on testattu oikeaa Supabase-ympäristöä vasten.

Lähteet: [Supabase JSON Schema -validointi](https://supabase.com/docs/guides/database/extensions/pg_jsonschema), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [käyttäjätietojen hallinta](https://supabase.com/docs/guides/auth/managing-user-data).
