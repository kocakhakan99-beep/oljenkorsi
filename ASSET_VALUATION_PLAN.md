# Omaisuuden arvonmuutosarviot

Toteutettu 10.11.2026. Mallit ovat käyttäjän oletuksiin perustuvia herkkyyslaskelmia, eivät tilastollisesti estimoituja markkinahintaennusteita. Kirjattu arvo ja arvostuspäivä ankkuroivat laskennan. Malli ei muuta tasearvoja, velkoja tai nettovarallisuutta.

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

Omaisuuden katselukortin avattava Arvonmuutoksen arvio sisältää mallin valinnan, tiedot, arviointipäivän ja kaavaselitteen. Mallia voi vaihtaa; vuodella on pakollinen rooli rakennus-, ajoneuvo- ja laitemallissa. Oletukset tallennetaan erikseen tai poistetaan. Arviointipäivä on istuntokohtainen.

Entry.assetModel on valinnainen ja vanhat tietueet saavat null-arvon. JSON-varmuuskopio sisältää oletukset. CSV ei siirrä näitä malliasetuksia. Kirjattua arvoa ei korvata automaattisesti lasketulla arvolla.

## Menetelmien tausta

Geometrinen ja lineaarinen kuluminen ovat vakiintuneita pääoman ikääntymisen malliperheitä (OECD, Measuring Capital, 2009; Hulten & Wykoff, The Measurement of Economic Depreciation, 1981). Asuntojen markkinahinnan ominaisuuksista riippuvaa luonnetta kuvaa hedonisten hintojen kirjallisuus (Rosen, Hedonic Prices and Implicit Markets, 1974). Näistä ei seuraa tämän sovelluksen parametrien empiiristä oikeellisuutta.

Jatkossa: paikkakuntakohtainen varmennettu asuntohintaindeksi, ajoneuvon vertailukaupat, remontti-/kuntotapahtumat, metsävaratiedot sekä arvostuksen historiatietomalli.
