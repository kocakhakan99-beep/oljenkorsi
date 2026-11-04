# Roadmap

Päivitetty 4.11.2026. Nykyinen toimitus on 0.1.0, ei valmis V1. Nykytilan ja ehdotusten [kartoitus](FEATURE_RESEARCH.md), [tutkimuspohja](RESEARCH_SOURCES.md), [FIRE-määrittely](FIRE_PLAN.md), [navigaation sekä ilmeen suunnitelma](UX_REDESIGN_PLAN.md) ja [budjetti-, raportti- ja käyttöliittymäsuunnitelma](UI_BUDGET_REPORTS_PLAN.md) täydentävät tätä suunnitelmaa. Prioriteetit ovat toteutusjärjestys, eivät aikataulu- tai julkaisulupaus.

## P0: toistettava ja turvallinen perusta

Viten kehitysmalli `src/index.html` ja yksittäinen valmis juuren `index.html` on otettu käyttöön. Seuraavaksi lisää lukitustiedosto ja varmista puhdas asennus/build sekä tuotetun HTML:n vastaavuus lähdekoodiin myös uudessa ympäristössä. Hallittu Chromium esti aiemmin file://-E2E:n. Aiemmat QA-raportit eivät korvaa uutta file://-näyttöä.

Varmista Windows Edge/Chrome/Firefox file://-käyttö, tallennus/kiintiö/varmuuskopion palautus sekä näppäimistö- ja ruudunlukijapolut tarkoitukseen sopivissa ympäristöissä. Paranna moduulijakoa ja backupin eheystarkistusta. Kryptografinen tarkiste ei yksin tarkoita salausta tai aitoutta.

**Valmis kun:** puhtaasta asennuksesta syntyy lähdekoodia vastaava HTML, merkitykselliset testit suoritetaan ja ympäristökohtaiset rajoitukset raportoidaan. Ei julisteta yleistä selainyhteensopivuutta yhden selainajon perusteella.

## P1: luotettava arjen talous ja mittarit

Erottele kulutus, säästö-/sijoitussiirrot, korko ja lainapääoman lyhennys. Lisää tilit, alkusaldot, täsmäytys ja esiintymäkohtainen toteuma/poikkeus ilman kaksoislaskentaa. Tuo nykyisen säästöasteluvun rajaus näkyviin ennen uusien FI-lukujen käyttöönottoa.

Lisää epäsäännöllisten menojen varaukset, budjettipohjat ja vaihtoehtoiset budjettitavat sekä kassakalenteri/kuun lopun ennuste. Hätävaran 1/3/6/12 kk havaintopohjainen keskiarvo ja kirjauskuukausien määrä on toteutettu; seuraavaksi erota vahvistettu nollakuukausi puuttuvasta kuukaudesta, huomioi keskeneräinen kuukausi ja lisää oma menoarvio sekä tulokatkosstressi. Lisää oma raportointiaikaväli ja arvostushistoria; älä rekonstruoi menneisyyttä nykyarvoista. Tarjoa vapaaehtoinen kuukausikatsaus ja tavoitteiden priorisointi.

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

Ei mainoksia, käyttäjädatan myyntiä tai luotonoton aggressiivista suosittelua. Paikallinen HTML säilyy hyödyllisenä ilman verkkopalveluita. Tässä dokumentointityössä ei muuteta toteutusta, skeemaa tai nykyisiä laskentakaavoja.
