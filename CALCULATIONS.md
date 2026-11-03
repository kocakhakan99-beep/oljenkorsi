# Laskentakäytännöt

Kaikki tallennetut rahasummat ovat kokonaislukusenttejä. Käyttäjän desimaalipilkku ja -piste hyväksytään, enintään kaksi desimaalia. Syöttö ei käytä `parseFloat`-oikaisua. NaN, Infinity, eksponenttimuoto, yli kaksi desimaalia ja liian suuret summat hylätään.

## Kuukausi

Toteutunut tulo/meno = amount × kyseisen kuukauden esiintymien määrä, vain actual-tilassa. Planned ei sisälly toteumaan; skipped ja keskeytetty eivät generoi esiintymiä.

- Kassavirta = tulot − menot.
- Käyttövara = kassavirta − suunnitellut menot. Erillistä säästövarausta ei vähennetä.
- Säästöaste = kassavirta / tulot × 100. Nollatuloilla ei laskettavissa.
- Budjetin jäljellä oleva summa = kategoriabudjetti − toteutuneet menot.
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

Tavoitteen säästökuukaudet = ceil(max(0, tavoite − nykyinen) / kuukausisäästö). Nollasäästöllä keskeneräiselle tavoitteelle ei arviota. Tavoitepäivä on tässä versiossa informatiivinen.
Velan kuukausikorko = round(pääoma × vuosikorko/1200). Erä vähentää pääomaa koron jälkeen. Jos erä ei ylitä korkoa tai aika ylittää 1200 kuukautta, arviota ei näytetä. Velkasaldoa ei päivitetä automaattisesti.

Arvonalenemafunktio on yksikkötestattu mutta ei omaisuuden UI:n arvomalli. Käyttöliittymä näyttää manuaaliset arvot.
