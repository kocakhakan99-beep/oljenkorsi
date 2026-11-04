# Käyttöliittymän, budjetin ja raportoinnin toteutussuunnitelma

Päivitetty 4.11.2026. Tämä suunnitelma vastaa viiteen käyttäjäpalautteeseen: listojen avauspainikkeet, budjetin manuaalinen toteuma, rahavirta- ja kulurakenneraportit, omaisuus- ja velkakategorioiden ikonit sekä sisältökorttien rauhallisempi ulkoasu. Toteutus tehdään vaiheittain, jotta nykyiset JSON-varmuuskopiot, laskentakaavat ja offline-käyttö säilyvät.

## Nykyinen lähtökohta

- Listan rivit ovat tällä hetkellä suoria `.simple-row`-rivejä. Lähdekoodissa ei ole yhteistä `details/summary`-rakennetta eikä toimivaa nuolipainiketta, joten avauskäyttäytyminen pitää määritellä ja toteuttaa yhtenäisenä komponenttina.
- Budjetin `budgets` sisältää kuukauden ja kategorian suunnitellun summan. Budjetin toteuma lasketaan suoraan `expenses`-tapahtumista; sitä ei voi syöttää erillisenä kuukausikohtaisena havaintona.
- Raportti näyttää kuukausittaiset tulo- ja menobaarit sekä taulukon. Se ei vielä jaa kuluja rakenteeseen, esitä tulojen ja menojen ajankohtia saman kuukauden sisällä tai laske kassavajetta päivän yli.
- `Category` sisältää värin, mutta ei kuvaketta tai semanttista tunnistetta. Omaisuus- ja velkakategoriat ovat tällä hetkellä vapaata tekstiä.
- Sisältökortit, taulukot ja rivit käyttävät pääosin samaa pintaa. Tiivistämistä tarvitaan erityisesti listoissa, jotta yksittäisen tietueen yksityiskohdat avautuvat vasta pyydettäessä.

## Toteutusjärjestys

### 1. Listojen avaus ja nuolipainikkeet

Tee yhteinen `ExpandableRow`-komponentti tuloille, menoille, omaisuudelle, veloille, sijoituksille ja tavoitteille. Rivin vasen sisältö pysyy valittavana ja oikeaan laitaan tulee vähintään 44 × 44 pikselin painike, jossa on selkeä chevron-ikoni, `aria-expanded` ja `aria-controls`. Painikkeen koko rivin korkeudessa on helppo osua hiirellä ja kosketuksella.

Suljettu tila näyttää vain nimen, kategorian, summan ja tärkeimmän tilan. Avattu tila näyttää päivämäärän, toistuvuuden, kuvauksen, tunnisteet ja muut nykyiset metatiedot sekä Muokkaa/Poista-toiminnot. Avaus ei käynnistä muokkausta eikä poista nykyistä vahvistusta poistolle. Näppäimistö käyttää samaa painiketta kuin hiiri, Escape sulkee vain avoimen rivin tarvittaessa, ja kerrallaan voidaan pitää useita rivejä auki.

Nuolen on oltava visuaalisesti vähintään 16 pikselin kokoinen, mutta sen osuma-alue 44 pikseliä. Suunta vaihtuu avattaessa, ja tekstimuotoinen tila varmistetaan `aria-expanded`-attribuutilla. Jos käyttöliittymässä on myöhemmin ryhmiteltäviä listoja, sama komponentti voidaan käyttää myös kategorian yhteenvetoon.

### 2. Budjetin erillinen suunnitelma ja toteuma

Pidä `budgets` suunniteltuna kuukausisummana ja lisää uusi rakenne `budgetActuals: Record<string, Record<string, number>>`. Se sisältää käyttäjän syöttämän toteuman sentteinä kuukauden ja kategorian mukaan. Kenttä on vapaaehtoinen: puuttuva toteuma näytetään tilana **Ei syötetty**, ei nollana.

Budjettitaulukon sarakkeet ovat:

| Kategoria | Suunniteltu | Toteutunut | Ero | Lähde |
| --- | ---: | ---: | ---: | --- |
| Ruoka | 500 € | 463 € | +37 € | Manuaalinen / tapahtumista |

Käyttöliittymässä toteutuneen summan syöttö on suoraan taulukossa, mutta muokkaus säilyy rauhallisena: kenttä aktivoituu fokuksella, tallentuu blurilla tai Enterillä ja näyttää tallennuksen tilan. Nykyiset tapahtumista johdetut menot näkyvät vertailuna. Käyttäjä voi valita kategoriakohtaisesti lähteeksi **Manuaalinen toteuma** tai **Tapahtumista laskettu**. Ensimmäisessä versiossa oletus on tapahtumista laskettu, jotta nykyinen käyttäytyminen ei muutu vanhassa datassa.

Jos käyttäjä syöttää manuaalisen toteuman, raportit ja budjetin seuranta käyttävät sitä kyseisen kuukauden kulutuksen vertailulukuna. Rahavirta säilyy tapahtumapohjaisena, jotta sama meno ei tule kassavirtaan kahdesti. Tämä ero näkyy käyttöliittymässä selvästi: budjetin toteuma ei ole automaattisesti sama asia kuin pankista vahvistettu kassavirta.

Vanhan varmuuskopion migraatio luo tyhjän `budgetActuals`-rakenteen. Vanhoja tapahtumasummia ei kopioida siihen hiljaisesti, koska se muuttaisi uuden kentän lähde-merkitystä. Skeemaversio 1 säilyy yhteensopivana valinnaisen kentän oletuksella; jos validointimalli vaatii uuden skeeman, tehdään eksplisiittinen roundtrip- ja palautustesti.

### 3. Kulurakenne ja päivänsisäinen rahavirta

Raportit jaetaan kolmeen näkymään:

1. **Kokonaiskuva:** valittu aikaväli, tulot, menot, kulutus, säästö-/sijoitussiirrot ja kassavirta.
2. **Kulurakenne:** kulut kategorioittain euroina ja prosenttina, suurimmat kategoriat, välttämättömän ja muun kulutuksen erottelu sekä budjetin ja toteuman poikkeama. Puuttuva manuaalinen toteuma näkyy omana tilanaan.
3. **Rahavirran ajoitus:** tapahtumat päiväjärjestyksessä, päivän saldo ja kumulatiivinen saldo. Tulot ja menot näkyvät samalla aikajanalla; kuukauden sisäinen kattavuus lasketaan näin:

   - aloita kuukauden alkusaldosta, jos käyttäjä on sen antanut, muuten merkitse alkusaldo puuttuvaksi;
   - lisää saman päivän tulot ennen menoja vain, jos tapahtumien tarkka kellonaika ei ole tiedossa ja tämä oletus näytetään;
   - laske päivän päättävä saldo ja pienin saldo kuukauden aikana;
   - merkitse päiväväli, jolla saldo tai kumulatiivinen kassavirta on negatiivinen;
   - näytä tekstinä esimerkiksi: “1.–15. päivän tulot kattavat 68 % kuukauden toteutuneista menoista; 16. päivän tulo nostaa kumulatiivisen saldon positiiviseksi.”

Raportti ei väitä maksujen todellista pankkiajoitusta nykyisellä päivämäärämallilla. Toistuvat tapahtumat laajennetaan esiintymiksi kuten nykyisissä laskennoissa, ja ajoituksen oletus kerrotaan raportin yhteydessä. Myöhempi kellonaika- tai tilimalli vaatii erillisen tietomallin.

Visualisointi tehdään saavutettavana taulukkona ja tekstiyhteenvedolla, jota täydentää kaavio. Väri ei yksin ilmaise ylijäämää, vajetta tai tulon lähdettä.

### 4. Omaisuus- ja velkakategorioiden ikonit

Lisää semanttinen `categoryKey` tai normalisoitu ikonihakemisto, mutta säilytä käyttäjän nykyinen kategoriateksti ja varmuuskopioiden yhteensopivuus. Ensimmäinen ikonijoukko:

| Aihe | Omaisuus | Velka |
| --- | --- | --- |
| Asuminen | `home` | `home-loan` |
| Autoilu | `car` | `car-loan` |
| Käteinen ja pankki | `cash` | `credit` |
| Sijoitukset | `portfolio` | `student-loan` tarvittaessa erikseen |
| Metsä/maa | `land` | `other-loan` |
| Muu | `asset` | `debt` |

Asuntolaina ja asunto käyttävät samaa taloaihetta eri tilamerkillä. Ikonit toteutetaan inline-SVG:nä tai nykyisen offline-ratkaisun mukaisina tekstittöminä kuvakkeina; ulkoista kuvakekirjastoa ei lisätä vain koristeen vuoksi. Jokaisella ikonilla on tekstivastine tai `aria-hidden` silloin, kun kategoria näkyy vieressä tekstinä. Tuntematon käyttäjän oma kategoria saa neutraalin oletusikonin.

### 5. Korttien ja rivien minimalistinen hierarkia

Muuta listat tiiviimmiksi ja erottele rivit vaalealla, hienovaraisesti rajatulla pinnalla. Rivi käyttää noin 10–12 pikselin pystypehmustetta, 1 pikselin reunaa tai taustasävyä ja selkeää hover/focus-tilaa. Kortin otsikko ja tärkein luku ovat näkyvissä; kuvaus, tarkemmat metatiedot ja toiminnot avautuvat vasta nuolesta.

Säilytä isojen tietokorttien erilaiset pintaroolit, mutta vähennä pienten rivien pyöristystä, varjoja ja korkeutta. Budjetin, raportin ja listan rivit saavat saman neutraalin rivipinnan. Värillisiä pintoja käytetään edelleen näkymän tai merkityksen ryhmittelyyn, ei jokaisen rivin koristeluun. Kontrastin tulee säilyä vaaleassa, tummassa ja korkean kontrastin teemassa.

## Hyväksymisportit

- Nuolipainike on vähintään 44 × 44 pikseliä, avaa ja sulkee rivin hiirellä, kosketuksella ja näppäimistöllä, ja `aria-expanded` muuttuu oikein.
- Vanha JSON-varmuuskopio palautuu ilman `budgetActuals`-kenttää. Uusi varmuuskopio sisältää kentän, ja manuaalinen toteuma säilyy roundtripissä.
- Budjetin manuaalinen toteuma ei muuta kassavirtaa tai tapahtumien kokonaismäärää. Sen lähde näkyy käyttäjälle.
- Kuluraportin euro- ja prosenttiosuudet täsmäävät laskennallisesti. Rahavirran ajoituksessa negatiivinen jakso, pienin saldo ja kattava tulopäivä ovat tekstinä luettavissa ilman kaaviota.
- Asunto/asuntolaina ja auto/autolaina käyttävät johdonmukaista ikoniperhettä. Tuntematon kategoria toimii ilman kuvaketta.
- 320, 390, 768 ja työpöytäleveyksillä ei synny vaakavieritystä. Rivit ovat matalampia suljettuina ja yksityiskohdat avautuvat vasta käyttäjän pyynnöstä.
- Tyyppitarkistus, linttaus, domain-testit, varmuuskopioiden palautus, build ja selainpolut läpäisevät.

## Toteutuspaketit

1. `ExpandableRow` ja listojen visuaalinen tiivistys.
2. `budgetActuals`-tietomalli, validointi, migraatio ja budjettitaulukon toteumakenttä.
3. Kulurakenne- ja rahavirta-aikalaskennat sekä raporttinäkymät.
4. Ikonihakemisto ja kategorian esityskomponentti.
5. Teemojen, mobiilin ja saavutettavuuden viimeistely sekä regressiotestit.

Budjetin toteuma kannattaa toteuttaa ennen ajoitusraporttia, koska raportin lähdevalinnat ja poikkeamien tulkinta riippuvat siitä, erotetaanko tapahtumista laskettu kulutus käyttäjän vahvistamasta budjettitoteumasta.
