# Tietosuoja

## Kirjautumaton käyttö

Kirjautumatta sovellus pitää taloustiedot vain avoimen välilehden muistissa. Tietoja ei tallenneta automaattisesti selaimen pysyvään tallennustilaan eikä pilveen. Sivun päivitys, sulkeminen tai istunnon katkeaminen hävittää muistissa olevan talouden. JSON-varmuuskopion ja CSV-tiedostot voi ladata itse laitteelle. Aiemman sovellusversion selaintallennus voidaan viedä asetuksista; sitä ei tuoda automaattisesti.

## Kirjautuminen ja perhetili

Google- tai Apple-kirjautuminen välittää kirjautumispyynnön Supabaselle ja valitulle kirjautumispalvelulle. Supabase Auth käsittelee tilin tunnisteet ja palveluntarjoajalta saadut tiedot, kuten sähköpostiosoitteen silloin kun palvelu sen antaa. Kirjautumisistunto tallentuu selaimeen, jotta kirjautuminen säilyy sivun päivityksen yli.

Kirjautuneen vahvistetut muutokset tallennetaan automaattisesti valittuun talouteen Supabasen tietokannassa EU Central -alueella. Oma talous on henkilökohtainen; perheen jokainen jäsen voi nähdä ja muokata yhteistä taloutta. Kirjautuminen ei automaattisesti siirrä vierastilan muistissa olevia tietoja pilveen. Tallennus ei ole päästä päähän salattu; palveluntarjoajan tietokanta- ja palvelinkerros voi käsitellä tietoja selväkielisinä.

Kun henkilökohtaisten asetusten tallennus on käytössä, teema, väritila, korostusväri, summien piilotus, valittu kuukausi ja piilotetut ohjeet tallennetaan käyttäjätilin omiin asetuksiin. Asetukset eivät näy muille perheenjäsenille, ja ne poistuvat käyttäjätilin mukana. Vieraan valinnat ovat muistissa. Vanha ohjevalinta voi edelleen olla aiemman sovellusversion selaintallennuksessa; sitä ei siirretä automaattisesti.

Kutsukoodin haltija saa perheen jäsenyyden ja pääsyn sen kaikkiin tietoihin. Jäsenen myöhempi poistaminen ei poista hänen aiemmin lataamiaan kopioita.

## PDF-tiedostot ja tekoäly

PDF luetaan selaimessa. Itse PDF-tiedostoa ei lähetetä laskuanalyysiin. Laskun tekstiä ei lähetetä automaattisesti; lähetys käynnistyy erillisestä painikkeesta. Halutessaan käyttäjä voi avata poimitun tekstin esikatselun ennen lähetystä. Cloudflare Worker välittää pyynnön OpenRouterin `openrouter/free`-reitittimelle. Lähetetyssä tekstissä voi olla tunnisteita, yhteystietoja tai maksutietoja; esikatselun voi avata ennen päätöstä lähettää aineisto.

Kuittien tavallinen AI-kategorisointi lähettää tuotenimiä ja kategoriavaihtoehtoja. Jos paikallinen kuittiparseri ei tunnista tekstiä, varareitti voi lähettää rajatun kuittitekstin; yleisiä maksu- ja asiakasnumerorivejä suodatetaan, mutta täydellistä anonymisointia ei voida taata. Tarkista näkyvä kuittiesikatselu ennen AI-toimintoa. Palveluntarjoajien saatavuus, reititys, säilytyskäytännöt ja käsittelyehdot voivat muuttua.

API-avain pyydetään erikseen ja säilytetään vain välilehden istunnossa. PDF-tekstiä, API-avaimia tai AI-vastauksia ei lisätä sovelluksen talousdataan tai JSON-varmuuskopioon.

## Vienti, istunto ja poistaminen

JSON-varmuuskopio sisältää koko talouden. CSV on rajattu rivitietojen vienti eikä täydellinen varmuuskopio. Vientitiedostoja ei salata sovelluksessa; niiden suojaaminen ja poistaminen on käyttäjän vastuulla.

Uloskirjautuminen poistaa nykyisen selaimen kirjautumisistunnon, mutta ei poista pilveen tallennettuja tietoja. Perheen ylläpitäjä voi poistaa perheen, jolloin sen pilvitalous, kutsut ja jäsenyydet poistuvat tietokannasta. Käyttäjätilin poistossa henkilökohtainen talous poistetaan ja viimeisen jäsenen perhe poistetaan; jos ylläpitäjä jättää muita jäseniä, ylläpitäjyys siirtyy pisimpään perheessä olleelle jäsenelle. Aiemmin ladattuja varmuuskopioita ei voida poistaa jäsenten laitteilta. Supabasen teknisten varmuuskopioiden ja lokien säilytysaikoja hallinnoi palveluntarjoaja, joten sovellus ei voi luvata niiden välitöntä poistumista.
