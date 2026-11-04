# Laskentakäytännöt

Kaikki tallennetut rahasummat ovat kokonaislukusenttejä. Käyttäjän desimaalipilkku ja -piste hyväksytään, enintään kaksi desimaalia. Syöttö ei käytä `parseFloat`-oikaisua. NaN, Infinity, eksponenttimuoto, yli kaksi desimaalia ja liian suuret summat hylätään.

## Kuukausi

Toteutunut tulo/meno = amount × kyseisen kuukauden esiintymien määrä, vain actual-tilassa. Planned ei sisälly toteumaan; skipped ja keskeytetty eivät generoi esiintymiä.

- Kassavirta = tulot − menot.
- Käyttövara = kassavirta − suunnitellut menot. Erillistä säästövarausta ei vähennetä.
- Säästöaste = (tulot − kulutusmenot) / tulot × 100. Menon tyyppi tallentuu varattuna `talous:expense-type=...`-merkintänä olemassa olevaan tags-kenttään. Nollatuloilla ei laskettavissa. Muut kategoriat lasketaan kulutukseksi.
- Kulutusmenojen jälkeinen ylijäämä = tulot − kulutusmenot. Tämä ei ole todennettu säästö- tai sijoitusvirta.
- Budjetin jäljellä oleva summa = kategoriabudjetti − toteutuneet kulutusmenot. Säästö- ja sijoitussiirrot eivät vähennä kategoriabudjettia, vaikka ne näkyvät kassavirrassa.
- Päiväkohtainen budjettivara = budjetista jäljellä / jäljellä olevat kalenteripäivät, nykykuukaudessa. Muussa kuukaudessa käytetään kaikkia kuukauden päiviä. Ei ennuste.
- Nettovarallisuus = summa(omaisuus × omistusosuus) + summa(sijoituksen hinta × määrä) − velat.
- Hätävara = likvidien omaisuuserien omistusosuuden mukainen summa / valitun kuukauden välttämättömät toteutuneet menot. Ei usean kuukauden keskiarvo.

## Toistuvuus

Kerran, viikko, kaksi viikkoa, kuukausi, kaksi kuukautta, neljännesvuosi, puolivuosi ja vuosi. Viikkovälit lasketaan UTC-kalenteripäivinä, ei paikallisen kellon kesäaikahyppyjen kautta. Kuukausitoistot perustuvat alkuperäiseen kuukauden päivään; 31. päivä siirtyy lyhyen kuukauden viimeiseen päivään mutta palautuu seuraavassa kuussa 31. päivään. Loppupäivä on inklusiivinen. Ei pysyvää massagenerointia.

## Skenaariot

Kuukausituotto r = (1 + vuosituotto/100)^(1/12) − 1.
Kulukerroin f = (1 − vuosikulu/100)^(1/12).
Seuraava arvo = round(edellinen arvo × (1+r) × f) + kuukausisijoitus.
Kuukausisijoitus tapahtuu kuukauden lopussa. Jokainen kuukausi pyöristetään senttiin.
Kulujen vaikutus = samalla tuotto-oletuksella kuluttoman laskelman arvo − kulullinen arvo.
Reaaliarvo = round(nimellisarvo / (1 + inflaatio/100)^vuodet).

Tuottoprosenttien laskenta käyttää liukulukuja tarkoituksellisesti, mutta tulokset pyöristetään rahaksi sentteinä. Verot, vaihtuvat tuotot, valuuttakurssit ja todellisten rahastojen kulujen tarkka veloitustapa eivät sisälly.

## Tavoite ja velka

FI-pääomatavoitteen yksivaiheinen havainnollistus: rahoitusvaje = max(0, vuosikulut − muut vuosittaiset nettotulot), tavoite = ceil(rahoitusvaje / (alkunostoprosentti / 100)) sentteinä. Puuttuva pääoma = max(0, tavoite − nostettavissa oleva pääoma). Kattavuus = pääoma / tavoite × 100; nollavajeella ei prosenttia. Prosentin on oltava yli 0 ja enintään 100. Tulos ei mallinna muuttuvia tuloja, veroja, tuottoja tai nostojen kestävyyttä.

Tavoitteen säästökuukaudet = ceil(max(0, tavoite − nykyinen) / kuukausisäästö). Nollasäästöllä keskeneräiselle tavoitteelle ei arviota. Tavoitepäivä on tässä versiossa informatiivinen.
Velan kuukausikorko = round(pääoma × vuosikorko/1200). Erä vähentää pääomaa koron jälkeen. Jos erä ei ylitä korkoa tai aika ylittää 1200 kuukautta, arviota ei näytetä. Velkasaldoa ei päivitetä automaattisesti.

Arvonalenemafunktio on yksikkötestattu mutta ei omaisuuden UI:n arvomalli. Käyttöliittymä näyttää manuaaliset arvot.

## Jatkokehityksen erillinen määrittely

Menoille voi valita tyypin kulutus, säästösiirto tai sijoitussiirto. Siirrot ovat edelleen kassavirrassa ja kokonaismenoissa, mutta eivät kulutusmenoissa. Vanhojen tietueiden kaksi oletuskategoriaa tunnistetaan, ellei niissä ole eksplisiittistä tyyppimerkintää. Luokitus on käyttäjän kirjaus, ei pankki- tai sijoitustapahtumasta todennettu virta. Merkintä käyttää vanhaa tags-kenttää yhteensopivuuden vuoksi. FIRE-pääoma, vaiheistetut eläketulot ja nostot eivät kuulu nykyisiin kaavoihin. Laajempi ehdotus on [FIRE-suunnitelmassa](FIRE_PLAN.md).
