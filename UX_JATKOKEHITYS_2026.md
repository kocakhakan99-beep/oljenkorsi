# Käytettävyyden jatkokehitys – 17.11.2026

## Rajaus

Katselmoin nykyisen sovelluksen rakennetta ja tärkeimpien toimintojen koodia sekä avasin tyhjän vierastilan ja fiktiivisen demotalouden Chromiumissa 390 × 844 pikselin näkymässä. Tarkastelu ei käytä oikeita taloustietoja. Kyseessä on heuristinen katselmus, ei käyttäjätutkimus, saavutettavuussertifiointi tai suorituskykymittaus.

Vanhat `UX_AUDIT.md`- ja `KNOWN_LIMITATIONS.md`-dokumentit sisältävät paikalliseen/offline-käyttöön ja vanhempiin ominaisuuksiin liittyviä väitteitä, jotka eivät kaikilta osin kuvaa nykyistä pilviversiota. Tässä ehdotukset perustuvat nykyiseen koodiin ja kuvattuun rajattuun selainkokeeseen.

**Toteutuksen tila:** aktiivinen talous, erillinen pilviversion yhteenveto ja saman talouden lataaminen, demokorvauksen pilvivaroitus, tulevien tapahtumien järjestys sekä yhteenvedon kategoriatiivistys ja mobiilisummien luettavuus on toteutettu. Esikatselu näyttää määriä ja enintään viisi pilvitietueen nimeä lajia kohti, ei täydellistä erojen vertailua. Erillinen demotila, kattavampi ristiriitojen vertailu, menon lisäämisen uusi rakenne ja kuukausikatsaus ovat vielä jatkotyötä.

## Ensimmäisenä: luottamus ja tietojen hallinta

### 1. Näytä aktiivinen talous ilman profiilikortin avaamista

**Havainto:** talouden valitsin on profiilikortissa, mutta sivun otsikko sanoo vain ”Sinun taloutesi”. Perheen tai oman talouden nimeä ei näe jatkuvasti avoimessa näkymässä. Tallennuksen tilan yhteys kohteeseen jää käyttäjän pääteltäväksi.

**Ehdotus:** näytä yläosassa pieni ”Oma talous” / perheen nimi -ilmaisin tallennustilan yhteydessä. Profiilikuvakkeen alta tehdään edelleen varsinainen vaihto. Nimen painaminen voi avata saman kortin. Ilmoita yhteinen talous selvästi ja säilytä vaihdon suoja keskeneräisille muutoksille.

**Valmis, kun:** käyttäjä näkee tallennuskohteen kaikilla pääsivuilla myös 320 px leveydellä ja vaihto ei hävitä keskeneräistä muutosta.

### 2. Tee versioristiriidan selvittämisestä vaiheittainen

**Havainto:** ristiriitatilassa nykyinen käyttöliittymä tarjoaa JSON-viennin sekä muutosten hylkäämisen ja lataamisen uudelleen. Käyttäjä ei näe uusinta pilviversiota ennen päätöstä. Talouden vaihtoa estävä ilmoitus kehottaa tallentamaan tai viemään, vaikka pelkkä vienti ei yksin vapauta vaihtoa.

**Ehdotus:** avaa erillinen selkeä palautusnäkymä: ”Tässä välilehdessä on muutoksia” ja ”Pilvessä on uudempi versio”. Tarjoa nykyisen työn vienti, pilvitilanteen lukeminen erilliseen esikatseluun ja erikseen vahvistettava lataus. Älä yhdistä tai ylikirjoita automaattisesti. Kerro täsmällisesti, että viennin jälkeen vaihto edellyttää myös paikallisen version tietoista hylkäämistä.

**Valmis, kun:** kahden selaimen ristiriidassa kumpikaan versio ei katoa ilman vahvistusta ja verkkokatkon jälkeen käyttäjä ymmärtää, mitä on palvelimella ja mitä vain välilehdessä.

### 3. Erota demoon tutustuminen oikean talouden korvaamisesta

**Havainto:** demotalouden lataus korvaa aktiivisen talouden vahvistuksen jälkeen ja kirjautuneena muutos voi tallentua pilveen. Käyttäjä voi silti tulkita sanan ”demo” väliaikaiseksi esikatseluksi.

**Ehdotus:** ensisijaisesti avaa demo erillisenä vain lukuun tai väliaikaisena esittelynä, johon ei liity pilvitallennusta, ja tarjoa selkeä ”Takaisin omaan talouteen”. Jos toteutus tehdään myöhemmin, vahvista nykyisessä korvausdialogissa aktiivisen talouden nimi, pilvitallennuksen vaikutus ja mahdollisuus viedä JSON ennen toimintoa.

**Valmis, kun:** esittelyä voi kokeilla muuttamatta oikeaa taloutta; tilan vaihtaminen ei menetä tallentamatonta työtä.

## Seuraavaksi: mobiilin arjen sujuvuus

### 4. Tiivistä yläosa ja tee yhteenveto helpommin silmäiltäväksi

**Havainto:** 390 × 844 -kokeessa ennen varsinaista sisältöä on brändi, valikkorivi, kuukauden valinta ja oma kuvakerivinsä. Tyhjän vierastilan varoitus ja otsikko vievät myös tilaa. Fiktiivisen Keskiverto-demon koko yhteenveto oli noin 5 348 CSS-pikseliä korkea; arvo riippuu aineistosta eikä ole suorituskykymittaus. Varallisuuskorteissa suurten summien euromerkki siirtyi omalle rivilleen.

**Ehdotus:** kokeile kompaktimpaa otsaketta ja selkeästi ryhmiteltyjä kuukauden toimintoja. Nosta yhteenvetoon ensin kassavirta, tulevat eräpäivät ja yksi seuraava toimi. Muu tieto jää löydettäväksi lyhyiden otsikoiden alta tai tarkoituksenmukaisiin näkymiin. Näytä laajoista kategorioista ensin muutama suurin sekä ”Näytä kaikki”. Korjaa summakorttien typografia ja leveydet niin, että rahamäärä pysyy luettavana ilman vaakaylivuotoa.

**Valmis, kun:** 320, 390 ja 768 px leveydellä tärkeimmät tiedot ja toiminnot löytyvät nopeasti, kaikki tiedot ovat edelleen saavutettavissa eikä summia leikata. Verrataan ennen/jälkeen samalla demodatalla; sivukorkeus ei yksin todista parempaa käytettävyyttä.

### 5. Järjestä tulevat menot tapahtumapäivän mukaan

**Havainto:** yhteenvedon ”Tulevat suunnitellut menot” muodostetaan menotietueiden järjestyksessä. Demossa myöhempi päivämäärä näkyi ennen aikaisempaa. Saman toistuvan menon useita esiintymiä yhdistetään yhdelle riville ja summaksi.

**Ehdotus:** muodosta ensin yksittäiset tulevat tapahtumat ja lajittele ne päivämäärän, sitten nimen mukaan. Näytä otsikossa esimerkiksi ”Seuraavat menot”, päivämäärä ja summa; pitkälle listalle ”Näytä kaikki”. Säilytä selite siitä, että tila on arvio eikä pankkivarmennus.

**Valmis, kun:** samana päivänä erääntyvät ja toistuvan tapahtuman eri esiintymät näkyvät oikein kronologisesti, myös kuunvaihteessa. Kuukauden yhteissumma pysyy entisellään.

### 6. Tee menon lisäämisestä yksi selkeä aloitus

**Havainto:** Menot-näkymän otsikossa on erilliset toiminnot kertamenolle, toistuvalle menolle, kuitille ja laskulle. Ne ovat hyödyllisiä, mutta erityisesti mobiilissa käyttäjä joutuu valitsemaan käsittelytavan ennen kuin näkee lomakkeen.

**Ehdotus:** yksi ”Lisää meno” avaa tiiviin valinnan: kertameno, toistuva lasku, kuitti tai laskutiedosto. Käytä nykyisiä käsittelypolkuja ja pidä usein käytetty valinta helposti saavutettavana. Älä automaattisesti lähetä tiedostoja tai tekstiä tekoälypalveluun.

**Valmis, kun:** kaikki nykyiset polut toimivat, valinta on näppäimistöllä käytettävä ja käyttäjä löytää ensimmäisen menon ilman ohjetta. Varmistetaan tämä lyhyellä käyttäjäkokeella.

## Uusia ideoita arvioitavaksi

### Kuukausikatsaus

Yksi pieni kortti: toteutuneet tulot ja menot, seuraavat eräpäivät ja tieto siitä, onko kuukausi vahvistettu. Kortti johtaa tarvittaessa tarkempiin kirjauksiin. Käytetään olemassa olevaa tietoa ja pidetään pankin vahvistamattomat tilat selkeästi arvioina.

### Kevyt ensimmäinen kuukausi

Vapaaehtoinen kolmen askeleen polku: lisää tulot, lisää tärkeimmät menot, tarkista budjetti. Polku näyttää vain puuttuvat vaiheet, sallii ohittamisen ja näyttää, mihin talouteen tiedot kirjataan. Vieraan vientitarve kerrotaan silloin kun käyttäjä on poistumassa tai haluaa kirjautua.

### Talouden tarkistuslista

Kompassin nykyisiin tietoihin perustuva valinnainen tarkistus: ”vahvista päättyneen kuukauden tulot ja menot”, ”tarkista epävarmat kuitit” tai ”päivitä vanha velkasaldo”. Jokainen ehdotus kertoo perusteen, vie suoraan oikeaan kohtaan ja on ohitettavissa. Ei oleteta käyttäjän maksukykyä eikä tulkita puuttuvaa merkintää nollaksi.

### Mobiiliin nopea kirjaus

Tutkitaan kiinteää, helposti saavutettavaa ”Lisää” -toimintoa, josta pääsee tuloon ja menoon. Se ei saa peittää sisältöä, laitteen alareunaa tai näytönlukuohjelman toimintoja. Ennen toteutusta verrataan sitä nykyiseen pikatoimintoon ja lasketaan todelliset napautukset.

## Ehdotettu järjestys

1. Aktiivisen talouden näkyvyys sekä ristiriita- ja demonäkymän turvatekstit.
2. Tulevien tapahtumien oikea järjestys ja pienet mobiilin luettavuuskorjaukset.
3. Yhteenvedon ja menon lisäämisen prototyyppi, jonka jälkeen lyhyt käyttäjäkoe ennen laajempaa muutosta.
4. Eristetty demotila ja erillinen ristiriidan esikatselu, jotka vaativat huolellisemman tilanhallinnan.
5. Tarkistuslista ja muut uudet ideat vasta sen jälkeen, kun tärkeimmät peruskäyttökulut ovat selkeitä.

Jokaisessa vaiheessa testataan vieras ja kirjautunut käyttäjä, puhelin ja työpöytä sekä näppäimistö. Pilvitallennukseen liittyvät muutokset testataan paikallisesti synteettisellä aineistolla ja kahdella selaimella ennen tuotantoa. Maksullista testipalvelua ei tarvita.
