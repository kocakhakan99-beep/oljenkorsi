# Laskujen viivakoodiluku: selvitys ja toteutussuunnitelma

Päiväys 19.11.2026. Tila: suunnitelma; skanneria ei vielä toteutettu. Käyttäjän rajaus: vain Suomi; EPC-/EU-tuki ei kuulu toteutukseen. Ei maksullisia palveluja.

## Suositus

Laskun lisäys yrittää ensin paikallista viivakoodin tulkintaa. Maksutietojen automaattinen poiminta voi näin toimia ilman AI-avainta ja laskutekstin lähettämistä palveluun. Kuittien tuoterivien käsittely säilyy erillisenä työnkulkuna.

Kyseessä on avoimen lähdekoodin lukukirjasto ja maksutietoformaatin parseri. Erillistä verkkopalvelun API:a ei tarvita. Yhtä kaikkien EU-maiden laskut ymmärtävää formaattia ei näiden lähteiden perusteella pidä luvata.

## Varmennetut formaatit ja rajaukset

- Suomen pankkiviivakoodi on Code 128 -symboli. Versiot 4 ja 5 sisältävät FI-tilin, summan, viitteen ja eräpäivän. Virtuaaliviivakoodi on sama 54 numeron sisältö tekstinä. Saajan nimeä, laskun kuvausta tai kategoriaa siitä ei saada. Lähde: [Finanssialan opas](https://www.finanssiala.fi/wp-content/uploads/2021/03/Pankkiviivakoodi-opas.pdf).
- EPC:n SEPA-maksu-QR on erillinen QR-formaatti. Siinä on saajan nimi ja IBAN sekä valinnaisia maksutietoja; eräpäivä ei kuulu sen kenttiin. Tuki on vapaaehtoinen, joten sitä ei voi olettaa jokaiselta laskulta. Lähde: [EPC069-12 v3.1](https://www.europeanpaymentscouncil.eu/document-library/guidance-documents/quick-response-code-guidelines-enable-data-capture-initiation?documents_id=607).
- Muut kansalliset maksu-QR-formaatit rajataan myöhemmäksi. Tavallinen QR-verkkolinkki ei ole lasku eikä sitä avata skannauksen seurauksena.
- Viivakoodi ei todista laskuttajan aitoutta, laskun oikeellisuutta tai maksun toteutumista. Esikatselussa käyttäjä tarkistaa tiedot alkuperäisestä laskusta.

## Kirjastovalinta

1. Toteuta vaihdettava `BarcodeDecoder`-rajapinta. Selvitä selaimen `BarcodeDetector` ajonaikaisesti ja tarkista tuetut formaatit. Pelkkään natiiviin API:in ei nojata sen rajallisen selainkattavuuden vuoksi. [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Barcode_Detection_API).
2. Ensimmäisen kokeilun ehdokas on `@zxing/browser` + `@zxing/library`: selain-, kuva- ja kameratuki sekä Code 128 ja QR. Browser-kerros on MIT-lisensoitu, library Apache-2.0. [Browser](https://github.com/zxing-js/browser), [library](https://github.com/zxing-js/library).
3. Library-projekti ilmoittaa olevansa ylläpitotilassa ilman aktiivista kehitysroadmapia. Siksi lukitse versiot, tarkista riippuvuudet ja mittaa lukutarkkuus sekä nopeus ennen lopullista valintaa. Dekooderi pidetään vaihdettavana. Maksullista korvaajaa ei oteta käyttöön.
4. Kirjasto ladataan vasta skannauksen alkaessa, paikallisesta buildista. Ei CDN:ää eikä laskukuvan lähettämistä julkiseen dekoodauspalveluun.

## Käyttäjäpolku

Menot → Lisää lasku → valitse PDF/kuva tai liitä virtuaaliviivakoodi. Kamera tarjotaan mobiilissa omana toimintona myöhemmässä vaiheessa.

1. Tekstimuotoisesta PDF:stä etsitään ensin kelvollinen virtuaaliviivakoodi, jos sellainen on tekstikerroksessa.
2. Varsinainen palkkikoodi ei välttämättä ole tekstikerroksessa. PDF-sivu renderöidään canvas-kuvaksi ja kuvasta luetaan Code 128 / QR. Kuvallinenkin PDF voi toimia tässä ilman yleistä OCR:ää.
3. Tunnistettu sisältö siirretään formaattikohtaiselle parserille ja validoidaan. Useista kelvollisista koodeista näytetään valinta; ensimmäistä osumaa ei hyväksytä automaattisesti.
4. Esikatseluun täyttyvät vain tunnistetut tiedot. Käyttäjä täydentää nimen, kategorian sekä puuttuvan summan tai eräpäivän. Toistuvuus valitaan erikseen.
5. Käyttäjä hyväksyy tavallisen menokirjauksen nykyisellä tallennuspolulla.
6. Jos koodia ei löydy tai se ei riitä, tarjotaan käsin täyttö ja nykyinen erikseen käynnistettävä AI-analyysi. Epäonnistunut koodiluku ei automaattisesti lähetä aineistoa AI:lle.

Samalla laitteella oleva PDF tai kuva on mobiilissa usein kameran käyttöä helpompi. Kamera palvelee paperilaskuja ja toisella näytöllä näkyviä laskuja.

## Moduulit ja tietojen käsittely

- `domain/invoices/finnish-barcode.ts`: v4/v5 ja virtuaaliviivakoodin jäsennys.
- `domain/invoices/epc-qr.ts`: BCD/SCT-version ja kenttien jäsennys.
- `domain/invoices/draft.ts`: yhteinen luonnos ja kenttäkohtainen lähde; puuttuva arvo pysyy puuttuvana.
- `services/invoice-barcode.ts`: dekooderin adapteri ja kuvan/PDF-sivujen rajattu läpikäynti.
- `components/invoice-scanner.tsx`: nykyisen esikatselun laajennus ja lukutavan valinta.

Ensiversiossa IBAN ja viite näytetään tarkistusta varten vain istunnon luonnoksessa. Tallennetaan nykyisen Entry-mallin tarvitsemat tiedot: nimi, summa, päivä, kategoria ja alkuperä `invoice`. Maksutietojen pysyvä tallennus tarvitsee myöhemmin oman tietomallisuunnitelman; niitä ei piiloteta description/tags-kenttiin.

Mikään koodi ei aloita maksua tai merkitse sitä pankissa suoritetuksi. AI:n ja viivakoodin erimieliset summat tai päivät nostetaan käyttäjän ratkaistaviksi; tietoa ei korvata hiljaisesti.

## Validointi ja käytettävyys

- Suomen koodissa tarkistetaan pituus, numerot, versio, varakentät, IBAN ja kansallisen/RF-viitteen tarkisteet. Code 128:n symbolitarkiste kuuluu dekooderille; tekstinä syötetylle koodille sitä ei ole käytettävissä.
- Puuttuva summa tai eräpäivä säilyy puuttuvana. Nollakenttien tulkinta ja kaksinumeroisen vuoden sallittu tulkinta toteutetaan oppaan mukaan; epäselvää vuotta ei arvata käyttäjälle huomaamatta.
- EPC-parseri tarkistaa version, merkistön, tunnisteen, rivit, valuutan ja maksukenttien säännöt. Ensimmäisen version tukemat merkistöt ilmoitetaan; muut hylätään selkeästi.
- Skannerissa on peruutus, tiedostokoko-/sivumäärä-/pikseli- ja aikarajat. PDF:tä ei renderöidä kokonaan muistiin yhtä aikaa. Kameran kuvaraidat pysäytetään sulkemisessa, poistumisessa ja virheessä.
- Älä lokita kuvia, raakakoodeja, IBANeja tai viitteitä. Mahdollinen deduplikointi ei perustu pelkkään IBANiin tai nimeen. Maksutietojen pysyvää deduplikointirekisteriä ei luoda ensiversiossa.
- Kameralupa pyydetään vain painikkeesta HTTPS:ssä. Tiedoston valinta ja tekstikoodin liittäminen toimivat ilman kameraa.

## Vaiheistus ja hyväksyminen

### 1. Parserit ja tekstikoodi

- Puhtaat v4/v5-parserit, tarkisteet ja lähteistetyt fiktiiviset testiaineistot.
- Liitä virtuaaliviivakoodi -toiminto ja tarkistettava luonnos.
- Testit: v4, v5, etunollat, puuttuvat kentät, väärät tarkisteet, virheelliset päivät ja rajat. Samasta syötteestä sama tulos ilman verkkoa.

### 2. PDF- ja kuvaluku

- Rajattu dekooderikokeilu ennen kirjaston lopullista valintaa.
- Testikorpus: vektori- ja kuvallinen PDF, vinot ja pienet koodit, useat koodit, heikko kontrasti ja ei koodia. Tulosta raportoidaan tunnistusaste sekä väärät hyväksynnät; yleistä prosenttilupausta ei anneta pienellä aineistolla.
- Hyväksyntä: virheellistä koodia ei hyväksytä validiksi laskuksi, käyttäjä voi aina täydentää tiedot, peruutus toimii eikä skanneri kuormita aloituslatausta.

### Myöhemmäksi rajattu: EPC QR

Tämä osuus on taustaselvitystä, ei nykyisen toteutuksen työpaketti.

- Oma parseri ja testit, QR-dekoodaus käyttää samaa adapteria.
- Tarkista puuttuva summa ja eräpäivä, viite/viesti, merkistöt sekä QR, joka onkin verkkolinkki. Ei yleistä EU-yhteensopivuusväitettä.

### 3. Kamera ja julkaisu

- Takakameran valinta, lupavirheet, kameran vapautus ja vaihtoehtoinen kuvan valinta.
- Oikea iPhone Safari ja Android Chrome; lisäksi työpöydän kuva/PDF-polku. Pankkiviivakoodin leveys ja tarkennus vaativat fyysisen kamerakokeen.
- Nykyiset lasku-, kuitti-, tallennus- ja tuontitestit, tyyppitarkistus sekä build. Varmista CSP ja julkaisun resurssipolut.

Tämän ehdotuksen toteutus alkaa parserista ja virtuaaliviivakoodista. Kameralukua tai uutta maksutietojen tietokantarakennetta ei tarvita ensimmäiseen toimitukseen.
