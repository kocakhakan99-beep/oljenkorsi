# Roadmap

Päivitetty 9.11.2026. Nykyinen toimitus on 0.1.0, ei valmis V1. Nykytilan ja ehdotusten [kartoitus](FEATURE_RESEARCH.md), [tutkimuspohja](RESEARCH_SOURCES.md), [kompassin päätössäännöt](COMPASS_ENGINE.md), [FIRE-määrittely](FIRE_PLAN.md), [navigaation sekä ilmeen suunnitelma](UX_REDESIGN_PLAN.md) ja [budjetti-, raportti- ja käyttöliittymäsuunnitelma](UI_BUDGET_REPORTS_PLAN.md) täydentävät tätä suunnitelmaa. Prioriteetit ovat toteutusjärjestys, eivät aikataulu- tai julkaisulupaus.

## Käynnissä ja seuraavaksi: yhtenäistäminen

[Toimintojen pääpaikkojen](UNIFICATION_PLAN.md) ensimmäinen yhtenäistämiskierros on valmis. [UX-esittämisen 12 vaihtoehdon priorisointimallin](UX_PRESENTATION_MODEL.md) soveltaminen on käynnissä: valitaan ensimmäinen tarkoitukseen sopiva riittävä esitystapa ja pysähdytään siihen, ei kasata tasoja jokaiseen korttiin. Yhteiset ohjeotsikot avautuvat pyynnöstä, budjetin poikkeamat ovat lyhyitä lukurivejä ja kompassin toistavat perustelut avattavia. Yhteiset mittari- ja tilakomponentit on otettu käyttöön yhteenvedossa ja budjetissa; yhteenvedon erittelyt avautuvat tarvittaessa ja budjettiprosentti vastaa budjetin toteumaa. Raporttien yhteenveto ja budjettitietokortti, kategoriakortin rivit sekä omaisuus-, velka-, sijoitus- ja tavoitelistojen pääesitykset on myös tiivistetty. Seuraavaksi asetusten, tiedonhallinnan ja jäljelle jäävien raporttiohjainten läpikäynti. Nykyisiä ominaisuuksia ei lähtökohtaisesti poisteta.

## P0: toistettava ja turvallinen perusta

Vite-kehitysmalli `src/index.html` ja yksittäinen valmis juuren `index.html` on käytössä. Npm-lukitustiedosto lisättiin Tailwind- ja Lucide-riippuvuuksien kanssa; testien ja viimeisimmän selainajon lukumäärät kirjataan [testiraporttiin](TESTING.md). `e2e.py` kattaa raportit, kompassin, mobiilinäkymän, varmuuskopioinnin sekä esiintymäkohtaisen tilan ja summan poikkeutukset. `file://`-tallennusta tai offline-simulaatiota ei ole kaikissa ympäristöissä vahvistettu.

Seuraavaksi varmista Windows Edge/Chrome/Firefox file://-käyttö, tallennus/kiintiö/varmuuskopion palautus sekä näppäimistö- ja ruudunlukijapolut tarkoitukseen sopivissa ympäristöissä. Paranna moduulijakoa ja backupin eheystarkistusta. Kryptografinen tarkiste ei yksin tarkoita salausta tai aitoutta.

**Valmis kun:** puhtaasta asennuksesta syntyy lähdekoodia vastaava HTML, merkitykselliset testit suoritetaan ja ympäristökohtaiset rajoitukset raportoidaan. Ei julisteta yleistä selainyhteensopivuutta yhden selainajon perusteella.

## P1: luotettava arjen talous ja mittarit

Toteutettu 9.11.2026: neljän demotalouden aineisto kattaa vuodet 2025 ja 2026 kokonaan. Kaikissa talouksissa on tulot, menot, 24 kuukausibudjettia, omaisuutta, linkitettyä velkaa, sijoituksia, tavoitteita ja tallennettuja skenaarioita. Kompassin 24 kuukauden suunnitelmakuvaaja käyttää samaa ladattavaa aineistoa. Tulevat maksut säilyvät suunniteltuina, ja kriisitalouden tulokatkos alkaa elokuussa 2026.

Toteutettu 9.11.2026: [50/30/20 ja kategoriarajat](BUDGET_RULE_PLAN.md) yhdistävät budjetin, tulojen, menojen ja kompassin ohjauksen. Käyttäjä voi muuttaa osuuksia, kategoriaryhmiä ja rajoja. Varatut ja toteutuneet rahat erotetaan, puuttuvat luokitukset nostetaan esiin ja rahoitusvajeesta ilmoitetaan. Kategoriarajat eivät ole tutkimuksen vahvistamia enimmäismenoja.

Toteutettu 9.11.2026: budjetin kuvakkeellinen kategorianimi avaa kuukausikohtaisen menokortin. Kortista voi lisätä kerta- tai toistuvan menon esivalitulla kategorialla, muokata sarjaa ja siirtyä kategorian suodatettuun menoluetteloon. Ensimmäinen sarake on tiivistetty kiinteäkokoiseen kuvakkeeseen, nimeen ja plusmerkilliseen menokuvakepainikkeeseen.

Käyttäjätestauksen havaintoihin perustuva [kirjauspolkujen korjaus](USER_TESTING_PLAN.md) on tämän roadmapin ensisijainen työ, ja ensimmäinen kierros on toteutettu. Uudet neljä menokategoriaa täydentyvät vanhaan dataan palautuksessa, budjettikategoriasta voi avata esitäytetyn pikakirjauksen, kerta-/toistuva-polut ovat erilliset, perustiedot pysyvät lomakkeen alussa ja tila lasketaan maksupäivästä. Toistuvan tulon viikonloppu- ja pankkipyhäsiirto on valinnainen asetuksissa ja oletuksena käytössä tuloille. Testaus ja rajaukset on kirjattu [toteutussuunnitelmaan](USER_TESTING_PLAN.md) ja [testiraporttiin](TESTING.md). Seuraava työ on käyttäjäpalautteen avulla arvioida kuukausi- ja muun toistuvuuden oletuksia sekä tarkentaa etuuksien maksupäiväsääntöjä.

Kulutuksen, säästö- ja sijoitussiirron tyyppi on nyt eksplisiittinen kenttä, ja vanhat tags-merkinnät muunnetaan palautuksessa. Seuraavan lainaerän arvio näyttää koron, pääoman muutoksen ja jäljelle jäävän saldon; toteutuneiden lainaerien historiaa ei seurata. Toistuvan tapahtuman päivämääräkohtainen tila ja summapoikkeus ovat tuettuja. Lisää tilit, alkusaldot ja täsmäytys ilman kaksoislaskentaa. Tuo nykyisen säästöasteluvun rajaus näkyviin ennen uusien FI-lukujen käyttöönottoa.

Toteutettu tässä työpaketissa: yhteinen enintään 120 kuukauden raporttijakso (alku ja loppu), aihekohtainen esitysmuoto, budjetin suunnitelma/toteuma-vertailu, nykyhetken varallisuuserittely, omaisuuserään linkitettävä velka sekä oletuksilla merkitty velan takaisinmaksu- ja omaisuusarvio. Talouden kompassin havaintoperheitä on laajennettu asumiseen, välttämättömien menojen osuuteen, oman historian kulupoikkeamiin, tavoitteiden realistiseen tahtiin, toistuviin menoihin, velkojen kustannuksiin, säästösiirtojen ajoitukseen ja FIRE-nostojen stressitestaukseen. Käyttäjä voi päivittää tilanteen, kuitata ehdotuksen tai siirtää sen viikoksi tai kuukaudeksi. Kompassi ei tee muutoksia automaattisesti. Hätävaran 1/3/6/12 kk laskenta käyttää käyttäjän vahvistamia päättyneitä menokuukausia, erottaa vahvistetun nollan puuttuvasta datasta ja ohittaa keskeneräisen kuukauden. Kirjauksen muutos poistaa kyseisen kattavuusvahvistuksen automaattisesti. Hätävaraan voi nyt tallentaa oman välttämättömien menojen arvion ja testata 1/3/6/12 kuukauden tulonmenetystä vahvistettujen tulokuukausien perusteella. Jäljellä: tiedossa olevien vuosilaskujen tasaus, tulolähdekohtainen jatkuvuus ja omaisuuden arvostushistoria; älä rekonstruoi menneisyyttä nykyarvoista. Tarjoa vapaaehtoinen kuukausikatsaus ja tavoitteiden priorisointi.

Toteutettu 9.11.2026: yhteenveto avaa nopean tulo- tai menokirjauksen, viimeisiä tapahtumia voi kopioida ja lomake tukee usean kirjauksen sarjaa. Raportin ajaksi voi valita yhden kuukauden tai alku–loppu-jakson; nykytilan varallisuus- ja velkanäkymät eivät esitä aikahistoriaa jota data ei sisällä. Kaikkien raporttien taulukoihin lisättiin riveittäin haku ja näkymäkohtainen lajittelu. CSV-tuonnin yleisimmät suomalaiset otsikot tunnistetaan automaattisesti, perustietojen kartoitus pidetään etualalla ja päivämäärä on pakollinen virheellisten aikaleimojen estämiseksi. Pankin allekirjoitetut menot tulkitaan menojen itseisarvoksi, mutta positiiviset tulorivit pysäytetään Menot-tuonnissa väärinluokittelun estämiseksi. Raporttien ja syöttöpolkujen päällekkäisyyttä arvioidaan edelleen käyttäjätestillä.

**Riippuvuus:** P0 ja tietomallimigraation suunnittelu. **Valmis kun:** FIRE_PLANin rahavirtaesimerkit täsmäävät, vanha backup palautuu ja puuttuva havaintodata erottuu nollasta.

## P2: selitettävä FIRE ja elinkaarisuunnittelu

Yksivaiheinen menoperusteinen FI-pääomatavoite, ±10 % kulutusherkkyys ja tasaisen reaalituoton ehdollinen FI-aika on toteutettu käyttäjän oletuksilla. Seuraavaksi toteuta yhteinen deterministinen moottori: reaalinen/nominaalinen arvo, sijoituskelpoinen pääoma erilleen puskurista ja asunnosta, laajemmat herkkyydet ja vaiheistettu FI-aika. Käyttäjän osa-aikatulo, eläke-ennuste ja eläkkeen alkaminen muodostavat vaiheistetun suunnitelman. Lean/Fat/Coast/Barista ovat saman moottorin syöteprofiileja.

Lisää lainojen korko- ja lyhennysvertailu, sijoitustapahtumat/allokaatio ja kassavirroista erotetut tuotot. Verot ensin eksplisiittisenä käyttäjän varauksena; tarkka Suomen veromalli vasta lähdekatselmoinnin ja oman määrittelyn jälkeen. Vertaile kiinteää reaalinostoa ja prosenttinostoa, raportoi sekä pääoman että kulutuksen riittävyys.

**Riippuvuus:** P1:n rahavirrat ja historiat. **Valmis kun:** käsin tarkistettavat FI-/eläke-/nostopolut, migraatiot ja FIRE_PLANin hyväksyntäportit läpäisevät; oletukset ja rajaukset näkyvät tuloksissa. Ei ”turvallista nostoprosenttia” oletuslupauksena.

## P3: epävarmuus ja edistyneet päätösvertailut

Lisää joustavat nostorajat, pitkä elinikä ja samojen tuottojen eri järjestykset. Tämän jälkeen versioidut, lisensoidut historialliset aineistot ja Monte Carlo/lohko-otanta, oletusten herkkyys, verojen laajennus ja tarvittaessa valuutat. Vertaa kulutusleikkausten määrää ja kestoa, älä vain salkun nollautumista.

**Riippuvuus:** hyväksytty deterministinen moottori ja aineisto-/mallikatselmointi. **Valmis kun:** tulokset toistuvat samoilla syötteillä, epävarmuuden lähteet selitetään ja mallin onnistumisosuus erottuu tulevaisuuden lupauksesta.

## Myöhempi jakelu ja integraatiot

Aiemman versiopolun suunta säilyy: V1 offline-ydin, V1.1 käytettävyys/saavutettavuus, V1.2 edistyneet raportit/laskurit, V2 valinnainen hosted/PWA, V3 valinnainen tili ja salattu synkronointi, V4 markkinadata, V5 pankki-integraatiot, V6 mahdolliset eettiset yhteistyöt. P0–P3:n työpaketit kohdistetaan versioihin vasta hyväksytyn laajuuden perusteella. Integraatio ei ole FI-laskennan edellytys eikä ohita laskennan laatua.

Ei mainoksia, käyttäjädatan myyntiä tai luotonoton aggressiivista suosittelua. Paikallinen HTML säilyy hyödyllisenä ilman verkkopalveluita. Tämä roadmap kuvaa seuraavia toimituksia; jokaisen muutoksen toteutus ja validointi kirjataan erikseen.
