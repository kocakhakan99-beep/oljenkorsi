# Omaisuuden arvonmuutosarviot

Toteutettu 10.11.2026. Mallit ovat käyttäjän oletuksiin perustuvia herkkyyslaskelmia, eivät tilastollisesti estimoituja markkinahintaennusteita. Kirjattu arvo ja arvostuspäivä ankkuroivat laskennan. Kirjattu lähtöarvo säilyy. Tallennettu malli muuttaa valitun ajankohdan riviarviota ja johdettuja yhteenvetoja.

| Kohde | Syöttötiedot | Menetelmä |
| --- | --- | --- |
| Asunto, rakennus, mökki | Rakennusvuosi tai kokonaisuudistuksen vertailuvuosi, rakennuksen osuus arvosta, tekninen käyttöikä, jäännösosuus, markkinamuutos | Rakennuksen teknisen kertoimen suhteellinen muutos ja markkinakehitys; muu arvo-osuus ei teknisesti kulu |
| Auto, ajoneuvo | Vuosimalli, perusalenema, jäännösosuus, tuleva km/vuosi ja valinnainen lisäalenema/10 000 km | Ikääntymistä loiventava geometrinen malli, suhteutettuna arvostuspäivän ikään |
| Laite, vene, kone | Valmistusvuosi, perusalenema ja jäännösosuus | Sama geometrinen malli ilman ajokerrointa |
| Maa, metsä | Käyttäjän markkinamuutos | Korkoa korolle -muutos; puustoa, hakkuita tai tontin kaavoitusta ei mallinneta |
| Muu omaisuus, arvoesine | Käyttäjän markkinamuutos | Käyttäjän skenaario; ei oletettua automaattista kulumista |

## Kaavat

Olkoon V0 kirjattu arvo, t arvostuspäivästä kuluneet vuodet (365,2425 päivää/vuosi), a ikä arvostuspäivänä, m markkinamuutos, f tekninen jäännösosuus ja b rakennuksen arvo-osuus. Vuosiluvun tarkkuus on vuosi, joten ikä lasketaan vuoden alusta.

- Markkinakerroin M = (1 + m)^t.
- Rakennuksen tekninen kerroin C(a) = f + (1 − f) × max(0, 1 − a/L), jossa L on tekninen vertailukäyttöikä. Ikäkerroin A = (1 − b) + b × C(a+t)/C(a).
- Auton/laitteen tekninen kerroin C(a) = f + (1 − f) × (1 − d)^a, jossa d on perusalenema. Ikäkerroin A = C(a+t)/C(a).
- Auton valinnainen ajokerroin K = (1 − k)^(vuotuinen ajomäärä × t / 10 000). Lisäalenema k on oletuksena nolla, jotta ajokulumista ei vähennetä automaattisesti kahdesti.
- Arvio V = round(V0 × M × A × K). Maa ja muu omaisuus käyttävät A = K = 1.
- Oma osuus = round(V × omistusosuus/100).
- Oletusväli = V × (1 ± käyttäjän vaihteluprosentti). Se ei ole luottamusväli eikä sisällä todennäköisyysväitettä.

Ankkurointi C(a+t)/C(a) on olennainen: tänään kirjattua käytetyn auton hintaa ei alenneta uudelleen koko auton aiemman käyttöiän verran. Jäännösosuus rajaa teknistä kulumista, ei markkinoiden euromääräistä hintalattiaa.

## Aloitusluvut ja rajaukset

Auton 15 % ja laitteen 20 % perusalenema, rakennuksen 60 vuoden tekninen vertailuikä, 70 % rakennusosuus, 10 % jäännösosuus ja ±20 % oletusväli ovat muokattavia esimerkkejä. Niitä ei ole kalibroitu suomalaisiin toteutuneisiin kauppoihin eikä esitetä suosituksina tai keskiarvoina. Markkinaoletus alkaa nollasta.

Sijainti, pinta-ala, kunto, taloyhtiön korjausvelka, toteutuneet remontit, autossa malli/käyttövoima/huoltohistoria sekä jo ajetut kilometrit sisältyvät käyttäjän antamaan lähtöarvoon. Niistä ei keksitä erillisiä hintakertoimia. Osaremontti ei oikeuta koko rakennuksen iän nollaamiseen. Inflaatio, myyntikulut, verot ja arvostushistoria eivät sisälly laskelmaan. Talletuksille, sijoituksille tai veloille ei aseteta automaattista kulumista.

## Tallennus ja käyttö

Omaisuuden muokkausikkunan Arvonmuutos-välilehti sisältää mallin valinnan, tiedot, arviointipäivän ja kaavaselitteen. Mallia voi vaihtaa; vuodella on pakollinen rooli rakennus-, ajoneuvo- ja laitemallissa. Malli otetaan käyttöön tai pois käytöstä välilehden valinnalla ja tallennetaan yhdessä perustietojen kanssa. Peruuta hylkää molempien välilehtien luonnokset. Arviointipäivä on istuntokohtainen.

Entry.assetModel on valinnainen ja vanhat tietueet saavat null-arvon. JSON-varmuuskopio sisältää oletukset. CSV ei siirrä näitä malliasetuksia. Kirjattua lähtöarvoa ei korvata automaattisesti lasketulla arvolla. Katselukortissa ei enää ole arviointilomaketta tai erillistä mallin tallennuspainiketta.

## Menetelmien tausta

Geometrinen ja lineaarinen kuluminen ovat vakiintuneita pääoman ikääntymisen malliperheitä (OECD, Measuring Capital, 2009; Hulten & Wykoff, The Measurement of Economic Depreciation, 1981). Asuntojen markkinahinnan ominaisuuksista riippuvaa luonnetta kuvaa hedonisten hintojen kirjallisuus (Rosen, Hedonic Prices and Implicit Markets, 1974). Näistä ei seuraa tämän sovelluksen parametrien empiiristä oikeellisuutta.

Jatkossa: paikkakuntakohtainen varmennettu asuntohintaindeksi, ajoneuvon vertailukaupat, remontti-/kuntotapahtumat, metsävaratiedot sekä arvostuksen historiatietomalli.

## Tarkennus: helppo perustila ja ajankohtaiset arvot

Uudet mallit käyttävät oletuksena sovelluksen kertoimia. Auto tarvitsee vuosimallin, kilometrit arvostuspäivänä ja vuotuisen ajon. Asunto/rakennus tarvitsee rakennusvuoden tai kokonaisuudistuksen vertailuvuoden. Prosentteja ei kysytä perustilassa; ne löytyvät vain valinnaisesta mukautetusta tilasta. Vanhat tallennetut mukautetut mallit säilyvät, kunnes käyttäjä vaihtaa sovelluksen oletuksiin.

Aiemman v1-automallin C(a, km) = 0,1 + 0,9 × 0,88^a × 0,98^(km / 10 000). Arvio = lähtöarvo × C(a+t, alkukm + vuotuinen ajo × t) / C(a, alkukm). Näin lähtökilometrit vaikuttavat käyrän muotoon, mutta käytetyn auton arvoa ei vähennetä kahteen kertaan. Autoille on 20 merkin esimerkkiluettelo ja käyttövoimavalinta. Aiemmassa v1-mallissa merkki ja käyttövoima ovat taustatietoja. Uuden v2-mallin läpinäkyvät merkkipainot on kuvattu alla. Luetteloa ei esitetä virallisena suosituimmuusjärjestyksenä.

Automaattisen asuntomallin markkinamuutos on neutraali 0 %, tekninen käyttöikä 60 vuotta, rakennusosuus 70 % ja tekninen jäännösosuus 10 %. Laitteen geometrinen perusalenema on 20 %. Automaattisten mallien oletusväli on ±25 %. Nämä ovat läpinäkyviä heuristisia laskentaoletuksia, eivät yleispäteviä tutkimuksen osoittamia hintaprosentteja. Yleinen kaavaperhe ei tee parametrien arvoista empiirisesti oikeita.

Kategoria lukitsee asunto-, ajoneuvo-, laite- ja maamallin. Muissa kategorioissa mallin voi valita tai käyttää mukautettua mallia. Jos vanha tallennettu malli on eri tyyppiä kuin nykyinen kategoria, rivillä käytetään kirjattua arvoa ja pyydetään tallentamaan oikea malli.

Rivin ja yhteenvedon arvio lasketaan valitun kuukauden tilannepäivään: kuluvalle kuukaudelle tämä päivä, muille kuun viimeinen päivä. Ennen arvostuspäivää arvoa ei päätellä. Ennen tilannepäivää kirjaamattomia kohteita ei näytetä tilannekuvassa. Raportointi käyttää omaa loppukuukauttaan. Jatkokehityksessä automaattisten oletusten versio on tallennettava, jos kertoimia muutetaan.

## Porrastettu v2 ja merkkipainot

Uudet automallit ja demot käyttävät staged-v2-versiota. Vanhat ilman versiokenttää tallennetut automaattimallit käyttävät legacy-v1-käyrää, kunnes käyttäjä valitsee v2:n tai vaihtaa merkin. Vanha mukautettu malli säilyy. Vaihtoehdot näkyvät Arvokäyrä-valinnassa.

Peruskäyrän vuosialenemat ovat 0–1 vuotta 22 %, 1–3 vuotta 14 %, 3–5 vuotta 10 %, 5–10 vuotta 7 % ja yli 10 vuotta 4 %. Vaiheiden kertymä lasketaan logaritmisesti, jolloin käyrä on jatkuva rajakohdissa: R(a) = exp(sum(vaiheeseen kulunut aika × ln(1 − vaiheen alenema))). Merkkipaino w muuttaa kulumista muodossa R(a)^w.

C(a, km) = 0,06 + 0,94 × R(a)^w × 0,98^(km/10 000). V = V0 × C(a+t, alkukm + vuotuinen ajo × t) / C(a, alkukm). Arvostuspäivänä V = V0 myös käytetylle autolle. Jos Auto oli uusi arvostuspäivänä on valittu, a = 0 kyseisenä päivänä: loppuvuonna uutena ostetun auton ensimmäinen vuosi ei ala takautuvasti tammikuusta. Muuten ikä arvioidaan vuosimallin vuoden alusta.

| Merkki | Kulumispaino w | Merkki | Kulumispaino w |
| --- | ---: | --- | ---: |
| Toyota | 0,85 | Volkswagen | 0,96 |
| Volvo | 0,95 | Škoda | 0,94 |
| Ford | 1,05 | Mercedes-Benz | 1,04 |
| BMW | 1,08 | Nissan | 1,03 |
| Kia | 0,94 | Opel | 1,09 |
| Audi | 1,04 | Hyundai | 0,97 |
| Peugeot | 1,12 | Renault | 1,10 |
| Honda | 0,88 | Mazda | 0,91 |
| Citroën | 1,14 | SEAT | 1,02 |
| Mitsubishi | 1,01 | Tesla | 1,16 |

Tuntematon/muu merkki käyttää painoa 1. **Nämä painot ja vaiherajat ovat sovelluksen arvio-oletuksia, eivät Suomen toteutuneista kaupoista laskettuja merkkikohtaisia ennusteita.** Pienempi paino loiventaa kulumista. Merkki on karkea taustatekijä: saman merkin eri mallit, kunto ja kysyntä voivat poiketa paljon. Käyttövoimasta ei tehdä erillistä hintakerrointa ilman kalibrointia. Merkkiluettelo ei ole virallinen 20 yleisimmän järjestys.

Taustatarkistus: iSeeCarsin 2026 tutkimus käsittelee eri mallien ja käyttövoimien 5 vuoden arvonaleneman vaihtelua: https://www.iseecars.com/cars-that-hold-their-value-study . Aineisto on Yhdysvalloista eikä kalibroi yllä olevia suomalaisen sovelluksen painoja. Empiirinen Suomi-kalibrointi vertailukaupoista on edelleen jatkotyö.

Arvonmuutosvälilehti ja sen lomake näkyvät omaisuudessa aina, vaikka Käytä arvonmuutosmallia olisi pois päältä. Valinta ohjaa mallin tallentumista ja käyttöä riveillä, ei lomakkeen näkyvyyttä. Käytöstä poissa olevan keskeneräisen mallin puuttuvat tiedot näytetään neutraalina esikatseluhuomiona.
