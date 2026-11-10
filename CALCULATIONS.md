# Laskentakäytännöt

Kaikki tallennetut rahasummat ovat kokonaislukusenttejä. Käyttäjän desimaalipilkku ja -piste hyväksytään, enintään kaksi desimaalia. Syöttö ei käytä `parseFloat`-oikaisua. NaN, Infinity, eksponenttimuoto, yli kaksi desimaalia ja liian suuret summat hylätään.

## Kuukausi

Toteutunut tulo/meno = amount × kyseisen kuukauden esiintymien määrä, vain actual-tilassa. Esiintymän automaattinen tila on actual, kun sen maksupäivä on tänään tai menneisyydessä, ja planned tulevaisuudessa. Käyttäjä voi tallentaa yksittäiselle esiintymälle poikkeuksen, joka ohittaa automaattisen tilan. Sarjan skipped-tila ohittaa kaikki esiintymät; inactive-sarja ei tuota esiintymiä. Päivämäärä on kirjanpidollinen oletus, ei pankkitapahtuman varmennus.

- Kassavirta = tulot − menot.
- Käyttövara = kassavirta − suunnitellut menot. Erillistä säästövarausta ei vähennetä.
- Säästöaste = (tulot − kulutusmenot) / tulot × 100. Menon tyyppi tallennetaan omana `expenseType`-kenttänä. Vanhoista varmuuskopioista muunnetaan aiempi piilotettu tags-merkintä tai oletuskategoria tähän kenttään. Nollatuloilla ei laskettavissa. Muut kategoriat lasketaan kulutukseksi.
- Kulutusmenojen jälkeinen ylijäämä = tulot − kulutusmenot. Tämä ei ole todennettu säästö- tai sijoitusvirta.
- Budjetin jäljellä oleva summa = kategoriabudjetti − toteutuneet kulutusmenot. Säästö- ja sijoitussiirrot eivät vähennä kategoriabudjettia, vaikka ne näkyvät kassavirrassa.
- Budjetin toteuma valitaan kategoriakohtaisesti: jos kuukaudelle on syötetty manuaalinen toteuma, se korvaa budjettinäkymän tapahtumista lasketun kulutuksen. Muussa tapauksessa käytetään toteutuneiksi merkittyjä kulutustapahtumia. Manuaalinen toteuma ei muuta kassavirtaa, säästöastetta tai tapahtumien lukumäärää.
- Päiväkohtainen budjettivara = budjetista jäljellä / jäljellä olevat kalenteripäivät, nykykuukaudessa. Muussa kuukaudessa käytetään kaikkia kuukauden päiviä. Ei ennuste.
- Nettovarallisuus = summa(omaisuus × omistusosuus) + summa(sijoituksen hinta × määrä) − velat.
- Yhteenvedon hätävarakuukaudet = likvidien omaisuuserien omistusosuuden mukainen summa / valitun 1/3/6/12 kuukauden jakson **käyttäjän vahvistettujen, päättyneiden** välttämättömien kulutusmenojen kuukausikeskiarvo. Nykyisen tai tulevan kuukauden valinta rajataan viimeiseen päättyneeseen kuukauteen; historiallisella valinnalla jakso päättyy valittuun kuukauteen. Vahvistettu kuukausi, jossa ei ole välttämättömiä kirjauksia, lasketaan aidoksi nollaksi. Vahvistamattomat kuukaudet jätetään keskiarvosta pois, ja havaintojen määrä näytetään. Jos keskiarvo puuttuu tai on nolla, kestoa ei näytetä. Vahvistus kertoo käyttäjän tarkistuksesta, ei pankkivarmennuksesta. Uuden tai muutetun tapahtuman tallennus mitätöi kyseisen kuukauden kattavuuden; toistuvan sarjan muutto mitätöi muutetusta kuukaudesta eteenpäin. Vanhassa `metrics().buffer`-kentässä säilyy yhden kuukauden laskutapa sisäistä yhteensopivuutta varten.
- Tulokatkoksen puskuri = max(0, käyttäjän menoarvio tai hätävaran historiakeskiarvo − vahvistettujen tulokuukausien keskitulo × (1 − tulonmenetysosuus)) × skenaarion kuukaudet. Tulohistoria sisältää enintään kuusi valittuun päättymiskuukauteen päättyvää vahvistettua kuukautta, myös vahvistetut nollat. Nykyinen kuukausi ohitetaan. Tarvittavan puskurin ja likvidien varojen erotus näytetään erikseen. Tämä ei ole ennuste: veroja, etuuksia, tulojen lähdekohtaista jatkuvuutta tai uusia velkoja ei mallinneta.

## Toistuvuus

Kerran, viikko, kaksi viikkoa, kuukausi, kaksi kuukautta, neljännesvuosi, puolivuosi ja vuosi. Viikkovälit lasketaan UTC-kalenteripäivinä, ei paikallisen kellon kesäaikahyppyjen kautta. Kuukausitoistot perustuvat alkuperäiseen kuukauden päivään; 31. päivä siirtyy lyhyen kuukauden viimeiseen päivään mutta palautuu seuraavassa kuussa 31. päivään. Loppupäivä on inklusiivinen. Ei pysyvää massagenerointia.

Toistuvalle tulolle voidaan asettaa `adjustToPreviousBankDay`. Kun esiintymä osuu lauantaille, sunnuntaille tai huomioidulle suomalaiselle pankkipyhälle, maksupäivä siirtyy taaksepäin edeltävälle arkipäivälle, joka ei ole pankkipyhä. Huomioitavat pyhät ovat pitkäperjantai, toinen pääsiäispäivä ja helatorstai; lisäksi 1.1., loppiainen, vappu, itsenäisyyspäivä, juhannusaatto, 24.–26.12. ja 31.12. Kuukausirytmi lasketaan alkuperäisen päivän mukaan, joten siirto ei muuta myöhempien kuukausien aikataulua. Tämä yleissääntö ei mallinna pankin, työnantajan tai yksittäisen etuuden maksatuskäytäntöä. Kertaluonteista tuloa tai menon eräpäivää ei siirretä.

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

FI-aika-arvio on ensimmäinen kuukausi (enintään käyttäjän valitsema 1–50 vuotta), jolloin pääoma saavuttaa saman FI-tavoitteen. Kuun lopun pääoma = max(0, round(alkupääoma × (1 + reaalinen vuosituotto/100)^(1/12)) + lisäsijoitus). Reaalituotto-oletuksen tulee sisältää sijoituskulut. Jos tavoite ei täyty jaksolla, arviota ei näytetä. Tasainen reaalituotto, muuttumaton kulutus ja muut tulot ovat oletuksia, eivät ennusteita.

Tavoitteen säästökuukaudet = ceil(max(0, tavoite − nykyinen) / kuukausisäästö). Nollasäästöllä keskeneräiselle tavoitteelle ei arviota. Tavoitepäivä on tässä versiossa informatiivinen.
Velan kuukausikorko = round(pääoma × vuosikorko/1200). Erä vähentää pääomaa koron jälkeen. Jos erä ei ylitä korkoa tai aika ylittää 1200 kuukautta, arviota ei näytetä. Velkasaldoa ei päivitetä automaattisesti.

Seuraavan lainaerän erittely käyttää tallennettua nykyistä saldoa, vuosikorkoa ja kuukausierää: kuukauden korko = round(saldo × vuosikorko/1200), toteutuva erä rajataan enintään saldoon + korkoon, ja pääoman muutos = toteutuva erä − korko. Negatiivinen pääoman muutos näytetään saldon kasvuna, jos erä ei kata korkoa. Tämä on yhden kuukauden vakio-oletuksiin perustuva laskelma, ei lainanantajan maksusuunnitelma eikä toteutuneen erän seuranta.

Arvonalenemafunktio on yksikkötestattu mutta ei omaisuuden UI:n arvomalli. Käyttöliittymä näyttää manuaaliset arvot.

## Jatkokehityksen erillinen määrittely

Menoille voi valita tyypin kulutus, säästösiirto tai sijoitussiirto. Siirrot ovat edelleen kassavirrassa ja kokonaismenoissa, mutta eivät kulutusmenoissa. Vanhojen tietueiden kaksi oletuskategoriaa tai piilotettu merkintä muunnetaan palautuksessa eksplisiittiseen kenttään. Luokitus on käyttäjän kirjaus, ei pankki- tai sijoitustapahtumasta todennettu virta. Lainan korkoa ja pääomalyhennystä ei vielä eroteta. FIRE-pääoma, vaiheistetut eläketulot ja nostot eivät kuulu nykyisiin kaavoihin. Laajempi ehdotus on [FIRE-suunnitelmassa](FIRE_PLAN.md).

## 50/30/20 ja kategoriarajat

Tulopohja on valitun kuukauden toteutuneiden ja suunniteltujen (ei ohitettujen) kirjattujen tulojen summa. Nettomääräisyys on käyttäjän vastuulla. Toteutuneet tulot näytetään erikseen. Tulopohjan ollessa nolla ei lasketa euromääräisiä prosenttirajoja eikä muodosteta suhderajoihin perustuvia kompassitehtäviä.

Kunkin kategorian varattu summa = max(kategoriabudjetti, kuukauden ei-ohitettujen tapahtumien summa, kategoriatoteuma). Manuaalinen kategoriatoteuma korvaa vain toteutuneen kulutuksen, ei säästö-/sijoitussiirtoja. Tapahtumien eurot ryhmitellään kategoriaryhmän mukaan; säästö-/sijoitussiirto ohittaa ryhmän säästämiseksi. Mahdollinen budjetin tai suuremman manuaalisen toteuman ja tapahtumien erotus kohdistetaan kategoriaryhmään. Näin budjetti ja sen kattamat tapahtumat eivät kertaudu.

Välttämättömien ja valinnaisten ryhmäraja = tulopohja × käyttäjän prosentti, ylitys = max(0, varattu − raja). Säästämisen tavoite on vähimmäisosuus ja vaje = max(0, tavoite − varattu). Kirjaamatonta kulutusylijäämää ei oleteta säästösiirroksi. Säästämiseksi voi luokitella myös velan lisälyhennyksen; tämä ei erottele korkoa eikä muuta velkasaldoa. Hätävaralaskennan oma `essential`-valinta ei muutu kategoriaryhmästä.

Kategorian enimmäisraja = tulopohja × maxPercent, ylitys = max(0, kategorian varattu − raja). Raja voi olla pois käytöstä. Sovelluksen oletuksia ovat esimerkiksi asuminen 30 %, ruoka 15 %, liikenne 10 %, tilaukset 3 % ja kosmetiikka 2 %. Nämä ovat muokattavia suunnittelun aloitusarvoja, eivät väestökeskiarvoja. Ryhmä- ja kategoriapoikkeamat ilmoitetaan erikseen, eikä niiden lukumäärä tarkoita eri euroja. Luokittelemattomat menot eritellään ja lasketaan kokonaisvaraukseen. Kokonaisvaraus yli tulopohjan tuottaa rahoitusvajeilmoituksen ja kompassiin tarkistuskehotuksen.

## Yhteenvedon budjettikäyttöaste

”Budjetoiduista käytetty” = budjetoitujen kategorioiden toteuma / näiden kategoriabudjettien summa × 100. Sama kategoriatoteuman lähde kuin budjettinäkymässä: oma kokonaistoteuman korjaus korvaa kyseisen kategorian kulutustoteuman, ja budjetoimaton kulutus näytetään erikseen. Tämä ei muuta kassavirtaa. Käyttöaste voi ylittää 100 %; visuaalinen palkki rajataan sataan, mutta tekstilukema näyttää todellisen prosenttiosuuden. Ilman budjettia prosenttia ei lasketa. Kategorian 50/30/20-ohjeraja perustuu nettotuloihin ja on eri vertailu kuin käyttäjän oma kategoriabudjetti.

## Budjetin näkyvien erotusten etumerkki

Esitystapa ei muuta edellä määriteltyjä laskentasääntöjä. Välttämättömien ja valinnaisten erotus = ryhmäraja − varattu; säästöjen erotus = varattu − vähimmäistavoite. Kategorian ohjerajan erotus = enimmäisraja − varattu, oman budjetin jäljellä = budjetti − toteuma ja rahoituksen erotus = tulopohja − kokonaisvaraus. Positiivinen on vihreä ja sisältää plusmerkin, negatiivinen punainen ja sisältää miinusmerkin; nolla on neutraali. Vertailun nimi säilyy saavutettavassa selitteessä. Eurot käyttävät samaa suomalaista muotoilua ja summien piilotusta kuin muutkin rahaluvut.
