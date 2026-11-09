# Muutosloki

## 0.1.0, 3.11.2026

Ensimmäinen paikallinen käyttöversio. Single-file build, file://, localStorage ja virhetilat, JSON-backup/restore, CSV, talouskirjaukset, kategoriat, toistuvuudet, budjetti, yhteenveto, manuaaliset omaisuus/velka/sijoitusarvot, tavoitteet, rajatut skenaariot ja raportit, teemat ja yksityisyystila. 31 yksikkötestiä ja offline file:// E2E. Laaja V1-määrittely ei vielä kokonaan toteudu.

### Käyttäjätestauksen kirjauspolut 9.11.2026

Lisättiin päivittäistavara-, kosmetiikka-, hygieniatarvike- ja luottokorttilaskukategoriat; vanhoja varmuuskopioita täydennetään ilman omien kategorioiden tai arkistointien palauttamista. Budjettiriviltä voi avata kyseiseen kategoriaan esitäytetyn menokirjauksen. Kerta- ja toistuva kirjaus erotetaan selkeillä aloituspainikkeilla, ja nimen, summan, kategorian sekä päivän jälkeen tulevat tarkennukset ovat valinnaisia. Summakentässä on euromääräiset pikasäädöt.

Tapahtuman toteutunut/suunniteltu tila määräytyy maksupäivästä, ja yksittäisen toistuvan esiintymän tilan voi edelleen korjata. Toistuvan tulon voi aikaistaa viikonlopun tai sovelletun suomalaisen pankkipyhän yli edeltävälle pankkipäivälle. Sovellus kertoo, ettei päivämäärä ole pankkivarmennus. 69 yksikkötestiä ja 60 Chromium E2E -varmennusta läpäisivät.

### Ylläpito 5.11.2026

Yläpalkin kuukausivalitsin ja ikonipainikkeet viimeisteltiin. Järjestelmäteema vaihtuu heti, kun laitteen vaalea/tumma-asetus muuttuu sovelluksen ollessa auki. Chromium 155 -selainsarja suoritettiin valmiille HTML:lle loopback HTTP -palvelun kautta; `file://`-avaus ja selaimen offline-simulaatio jäivät ympäristörajoitteen vuoksi testaamatta.

### 50/30/20 ja budjettiraamit 9.11.2026

Budjetti, tulot ja menot näyttävät yhteiset ryhmäraamit ja kategoriaylitykset. Käyttäjä muokkaa osuuksia (summa 100 %), kategoriaryhmiä ja ohjerajoja; asetukset säilyvät JSON-varmuuskopiossa ja kategorian nimeämisessä. Kompassi tunnistaa rahoitusvajeen, säästövarauksen vajeen, puuttuvat luokitukset ja suurimmat kategoriaylitykset sekä ehdottaa laskujen ja menojen uudelleenjärjestelyä. Kehikko ja sovelluksen kategoriaprosentit on erotettu tutkimusnäytöstä. 77 yksikkötestiä ja 62 Chromium-selainvarmennusta läpäisivät.
