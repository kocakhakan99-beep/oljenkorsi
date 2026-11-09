# Käyttäjätestauksen tärkeimmät kehityskohteet

Päivitetty 9.11.2026. Tämä suunnitelma perustuu sovelluksen käyttäjätestauksessa saatuun palautteeseen ja ohittaa muun roadmapin työjärjestyksen, kunnes alla olevat kohdat on toteutettu ja varmennettu.

## Havaitut ongelmat

- Menokategorioista puuttuu arjen kannalta tavallisia luokkia: päivittäistavarat, kosmetiikka, hygieniatarvikkeet ja luottokorttilasku.
- Menon kirjaamisen, budjettikategorian ja toistuvan laskun suhde on epäselvä. Kirjaus pitäisi voida aloittaa suoraan budjettikategoriasta.
- Tulon ja menon perustiedoiksi riittävät aluksi nimi, summa, kategoria ja päivä. Muut tiedot ovat valinnaisia tarkennuksia.
- Käyttäjän ei pitäisi joutua päättelemään tai valitsemaan, onko tapahtuma toteutunut. Tuleva päivä on suunniteltu; kulunut maksupäivä lasketaan toteutuneeksi. Päivämäärä ei kuitenkaan vahvista pankkitapahtumaa.
- Palkat ja etuudet ovat usein toistuvia. Viikonloppuun tai suomalaiseen pankkipyhään osuva toistuva tulopäivä aikaistetaan edeltävään pankkipäivään.

## Toteutussuunnitelma

1. Lisää neljä puuttuvaa menokategoriaa oletuksiin sopivilla kuvakkeilla. Täydennä kategoriat myös vanhoihin paikallisiin tietoihin ja varmuuskopioihin; säilytä käyttäjän arkistointi ja muut omat kategoriat.
2. Lisää budjettikategorian riville pikakirjaus, joka avaa menolomakkeen kyseinen kategoria valittuna. Menot- ja Tulot-näkymissä erottele kertakirjaus ja kuukausittainen toistuva kirjaus näkyviksi aloitustoiminnoiksi.
3. Pidä kirjauslomakkeen ensisijaisina tietoina nimi, summa, kategoria ja päivä. Säilytä kuvaus, menon tyyppi, välttämättömyys ja muut tarkennukset lisävalinnoissa. Lisää summan viereen euromääräiset pikasäädöt.
4. Laske tapahtuman tila päivästä automaattisesti. Tulevat esiintymät ovat suunniteltuja ja tämän päivän tai menneet esiintymät toteutuneita. Säilytä yksittäisen esiintymän manuaalinen poikkeus ja mahdollisuus palauttaa tila automaattiseksi. Näytä aina, ettei päiväperusteinen tila ole pankkivarmennus.
5. Siirrä toistuvan tulon viikonlopulle tai suomalaiselle pankkipyhälle osuva maksupäivä edeltävään pankkipäivään. Oletus on käytössä tuloille, ja sen voi poistaa lisävalinnasta. Menojen eräpäiviä ei siirretä tällä säännöllä.
6. Lisää yksikkö- ja selainvarmennukset kategoriamigraatiolle, budjetista alkavalle kirjaukselle, tilan automatiikalle ja viikonloppu-/pyhäpäivälogiikalle. Päivitä tietomalli-, käyttöliittymä-, laskenta- ja testausdokumentaatio.

## Rajaukset

Automaattinen tila käyttää maksupäivää kirjanpidollisena oletuksena; se ei tarkista, onko raha todella vaihtanut omistajaa. Käyttäjä voi korjata yksittäisen esiintymän tilan. Tulon pyhäpäiväsiirto käsittelee Suomen pankkipäivät yleissääntönä; se ei mallinna yksittäisen etuuden tai työnantajan maksatuskäytäntöä. Kertaluonteinen tulo säilyttää käyttäjän syöttämän päivän.

## Tila

- [x] Palaute ja toteutussuunnitelma dokumentoitu.
- [x] Oletuskategoriat ja vanhan datan täydennys.
- [x] Budjetista alkava kategorialtaan esitäytetty kirjaus ja kerta-/toistuva-kirjauspolut.
- [x] Nimi, summa, kategoria ja päivä ensin; tarkennukset lisävalintoihin ja summan pikasäädöt.
- [x] Päivämääräperusteinen toteumatila, yksittäisen esiintymän korjaus ja selittävät käyttöliittymätekstit.
- [x] Toistuvan tulon pankkipäiväsiirto.
- [x] Migraatio-, päivämäärä-, pankkipyhä-, UI- ja E2E-varmennukset sekä dokumentaatio.

Toteutus ja varmistus on valmis. Testitulokset ja testauksen rajaukset ovat [testiraportissa](TESTING.md); datan kentät ja migraatiot on kuvattu [tietomallissa](DATA_MODEL.md) ja [laskentakäytännöissä](CALCULATIONS.md).
