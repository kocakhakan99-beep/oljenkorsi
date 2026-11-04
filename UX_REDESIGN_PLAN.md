# Navigaation ja visuaalisen ilmeen kehityssuunnitelma

Päivitetty 4.11.2026. Suunnitelma perustuu `src/main.tsx`-navigaatioon ja `src/styles.css`-tyyleihin. Toteutettu: viisi navigaatioryhmää, avattava mobiilivalikko, mobiilin pikatoiminnot, yhteenvedon kolme erisävyistä mittarialuetta sekä kirjaus-, budjetti-, skenaario- ja hallintanäkymien ensimmäiset pintaroolit. Yhteenvetoon lisättiin nopeat tulo- ja menokirjaukset sekä suorat siirtymät budjettiin ja raportteihin. Tumman tilan korostustekstillä ja fokuksella on omat väritokenit, ja kaikkien tietojen poisto on erotettu vaara-alueeksi. Yläpalkin kuukausivalitsin on mitoitettu viereisten painikkeiden kanssa samaan linjaan; yhteenvedon 5/4/3 mittarin ryhmät täyttävät leveän ruudun tasaisesti ja kapealla ruudulla kortit asettuvat yhteen palstaan. Navigaatioon ja raporttivälilehtiin lisättiin paikalliseen bundleen sisältyvät Lucide-kuvakkeet. Opastuslaatikot voi sulkea sivukohtaisesti ja palauttaa Asetuksista; määräkentän pikasäädöt ja raporttijakson vieritettävät valinnat nopeuttavat kosketuskäyttöä. Raportteihin lisättiin 24 kuukauden ja vuoden alusta jaksot, kaavion suurennus, aluekaavio ja valintaan kohdistuva tietokortin fokus. Tailwind CSS 4 on tuotu buildiin asteittaista siirtymää varten; vanha CSS-järjestelmä on yhä käytössä ja toimii nykyisten teemojen lähteenä.

## Alkuperäisen suunnitelman havainnot

Seuraavat ongelmat ja toteutusvaiheet ovat suunnitelman alkuvaiheen kartoitusta. Monet niistä on sittemmin ratkaistu yllä kuvatuilla muutoksilla; jäljelle jäävät työt ovat tiekartassa.

- Sivupalkissa on 13 samanarvoista linkkiä. Arkikirjaukset, suunnittelu, raportit ja datan hallinta sekoittuvat yhdeksi pitkäksi listaksi. Mobiilissa lista muuttuu vaakasuunnassa vieritettäväksi nauhaksi, jossa osa kohteista jää helposti piiloon.
- Yhteenvedon värillinen kassavirtanosto on selkeä, mutta muut mittarikortit ja lähes kaikki paneelit käyttävät samaa `--surface`-taustaa. Sisällön tärkeys ja eri tehtävät eivät erotu ennen tekstin lukemista.
- `nav button.selected` näyttää nykyisen sivun, mutta ryhmätasoa ei ole. Pikatoiminnot löytyvät sivupalkin alalaidasta, joka piilotetaan mobiilissa; Ctrl/Cmd K toimii silti.
- Värimuuttujia on vähän (`--bg`, `--surface`, `--soft`, `--accent`, `--negative`). Niillä ei voi ilmaista erikseen tietoa, varoitusta, suunnittelua ja eri sisältöalueita kaikissa teemoissa.
- Yksityisyystila piilottaa monet summat, mutta värien ei pidä yksin paljastaa tuloksen merkitystä tai korvata tekstiselitteitä.

## Tavoite ja navigaatiokartta

Käyttäjä löytää yleisimmät tehtävät kahdella askeleella, nykyinen sijainti näkyy myös ilman värejä ja tärkein toiminto pysyy nähtävissä pienellä näytöllä. Säilytä nykyiset hash-reitit ja nimikkeet siirtymävaiheessa, jotta vanhat linkit ja tallennettu tila toimivat.

| Ryhmä | Kohteet | Yleinen tehtävä |
| --- | --- | --- |
| Aloitus | Yhteenveto | Talouden tila ja kuukauden tärkeimmät luvut |
| Arki | Tulot, Menot, Budjetti | Tapahtumien kirjaus ja kuukauden suunnittelu |
| Varallisuus | Omaisuus, Velat, Sijoitukset | Saldot ja nettovarallisuuden osat |
| Tulevaisuus | Tavoitteet, Skenaariot, Raportit | Tavoitteet, FI-laskurit ja historia |
| Hallinta | Tuonti ja vienti, Asetukset, Ohje ja tietosuoja | Tiedonsiirto, tietosuoja ja ohjeet |

Työpöydällä ryhmäotsikot ja välit rytmittävät sivupalkkia. Ryhmät ovat näkyvissä ilman ylimääräistä klikkausta. Näytä `aria-current="page"` nykyisellä kohteella sekä selvä merkki (esimerkiksi vasen reunaviiva) valitulla rivillä. Säilytä hakupikatoiminto, mutta lisää näkyvä pikatoimintopainike myös kapeaan yläpalkkiin.

Mobiilissa korvaa 13 kohteen vieritettävä nauha painikkeella **Valikko**, joka avaa kaikki ryhmät. Näytä aktiivisen sivun nimi painikkeen yhteydessä. Valikon sulkeminen, Escape, fokuksen palautus ja näppäimistöpolku on määriteltävä. Pidä kuukauden valinta, summien piilotus ja ensisijainen sivukohtainen toiminto käyttökelpoisina myös mobiilissa; varmuuskopio siirtyy Hallinta-ryhmään ja pysyy lisäksi selvästi saatavilla Asetuksissa. Älä tee mobiiliin päällekkäisiä 13 kohteen valikkoja.

## Värien ja pintojen roolit

Väri kertoo sisällön tehtävästä, mutta otsikko, kuvake tai tekstiselite kertoo saman asian. Käytä maltillisesti värillisiä pintoja: yksi vahva nosto näkymässä, sävytetyt ryhmäpinnat ja muuten rauhallinen perusta. Älä tee joka kortista omaa kirkasta väriään.

| Rooli | Käyttö | Vaalea esimerkkisävy | Tumma esimerkkisävy |
| --- | --- | --- | --- |
| Perusta | Sivun tausta ja peruspaneelit | `#f4f6f3` / `#ffffff` | `#141a18` / `#202a26` |
| Toiminta | Valittu navigaatio, pääpainike | `#17604d` | `#70c7a3` |
| Rahavirta | Tulot, menot ja niiden vertailu | vaalea sinivihreä `#e6f3ee` | tumma vihreä `#203d34` |
| Suunnittelu | Budjetti, tavoitteet ja FI-oletukset | vaalea sininen `#eaf1fa` | tumma sininen `#20334a` |
| Varallisuus | Omaisuus, velat ja sijoitukset | vaalea violetti `#f1edf8` | tumma violetti `#342a44` |
| Huomio | Tallennusvirheet, vajaus ja poikkeamat | vaalea keltainen `#fff4dc` | tumma ruskea `#45351f` |
| Vaara | Poisto ja peruuttamaton korvaus | vaalea punainen `#fdebec` | tumma punainen `#44272a` |

Värit ovat suunnittelun lähtöarvoja, eivät valmiiksi mitattuja kontrastipareja. Tokenisoi vähintään pinta, teksti, reunus, korostus ja fokus jokaiselle roolille sekä vaaleaan että tummaan tilaan. Korkean kontrastin teemassa käytä ensisijaisesti reunuksia ja selkeitä tekstejä, ei hienovaraisia taustasävyjä. Mukautetun korostusvärin vaikutus rajataan toimintaelementteihin; se ei saa muuttaa vaara- tai huomiorooleja.

## Näkymien hierarkia

1. **Yhteenveto:** säilytä kassavirran pääkortti. Ryhmitä muut mittarit otsikoituihin lohkoihin: kuukauden rahavirta, varallisuus ja tulevaisuus. Korosta vain lohkon tärkein luku, esimerkiksi säästöaste tai nettovarallisuus; pienemmät tiedot pysyvät neutraaleina. Näytä suunnitellut siirrot eri selitteellä kuin kulutus.
2. **Kirjausnäkymät:** aloita sivun kuvaavalla yhdellä lauseella ja yhdellä selkeällä lisäyspainikkeella. Suodattimet omalle kevyesti sävytetylle kaistalle, taulukko/pitkä lista neutraalille pinnalle. Värimerkki voi kertoa toteutunut/suunniteltu/ohitettu-tilasta, mutta teksti säilyy.
3. **Budjetti:** sininen suunnittelupinta ympäröi budjetin jäljellä- ja päivävaraluvut. Ylitys näkyy tekstinä ja huomio-/vaaravärinä. Taulukon syöttökentät eivät saa sulautua kortin taustaan.
4. **Varallisuus:** erota omaisuus, velat ja sijoitukset otsikoiden lisäksi pintasävyllä. Vältä sitä, että samanväriset kortit näyttäisivät saman riskitason tai likviditeetin omaavilta.
5. **Skenaariot:** erota FI-pääomatavoite, korkoa korolle -laskuri ja tallennetut vertailut omiksi lohkoikseen. Oletus- ja tuloskentät käyttävät eri pintoja. Muuttuvat oletukset ja laskettu tulos eivät saa näyttää muokattavuudeltaan samoilta.
6. **Hallinta:** varmuuskopio, esimerkkidatan lataus ja kaiken datan poisto erotetaan selkein otsikoin ja vaara-alue omalla pinnallaan. Vahvistuksen kuvaus kertoo, mikä data korvataan.

## Toteutusjärjestys

1. **Perusrakenne — toteutettu:** navigaatioryhmät ovat yhdessä tietorakenteessa. Työpöytä näyttää ryhmät ja mobiili avattavan valikon; hash-reitit ja nykyinen `navigate`-toiminta säilyvät. Selaimessa tarkistettu sivulle siirtyminen, valikon Escape-sulku ja pikatoiminnot sekä suora hash-linkki ja taakse-siirtyminen. Eteen-siirtyminen jää vielä erikseen varmistettavaksi.
2. **Väritokenit — osittain toteutettu:** rahavirran, varallisuuden ja suunnittelun taustat on lisätty vaaleaan ja tummaan tilaan sekä neutraaleina korkean kontrastin tilaan. Valitun navigaation tekstille ja fokusrenkaalle on omat `--accent-ink`- ja `--focus`-tokenit; vaara-alueella on oma pinta ja reunus. Esimerkkiparien laskennallinen kontrasti: tumman tilan valittu navigaatio 8,08:1, vaarateksti 6,61:1 ja vaara-alueen reunus 3,67:1. Mittaa vielä kaikki teemat, mukautettu korostusväri, tavallinen ja suuri teksti sekä toiminta-/fokuselementit; tavoite on WCAG 2.2 AA. Nämä pistokokeet eivät ole koko käyttöliittymän saavutettavuusauditointi.
3. **Yhteenveto ja kirjausnäkymät — osittain toteutettu:** yhteenvedon mittarit on ryhmitetty kolmeen otsikoituun alueeseen ja kirjausnäkymien suodattimet omaan sävytettyyn kaistaan. Tarkista vielä fiktiivisellä demo- ja tyhjällä taloudella, että negatiivinen kassavirta ja puuttuvat tiedot näkyvät selkeästi.
4. **Budjetti, varallisuus, tulevaisuus ja hallinta — osittain toteutettu:** budjetin yhteenveto, FI- ja korkoa korolle -laskurit sekä hallinnan esimerkkitalousalue saivat eri pintaroolit. Kaikkien tietojen poisto näkyy erillisessä vaara-alueessa ja tekstissä kehotetaan ottamaan varmuuskopio. Viimeistele muut paneelit ja mittarikomponentit niin, että niiden sisältöroolit pysyvät erilaisina. Poista vanha vain ulkoasua ohjaava tyylikoodi, kun vastaava uusi token on käytössä.
5. **Viimeistely:** testaa 320 px mobiilileveys, 200/400 % suurennus, vaalea/tumma/korkean kontrastin tila, näppäimistö, näkyvä fokus ja ruudunlukijan ilmoitukset. Mittaa myös päänavigaation ja sivunvaihdon käyttö pienellä näytöllä.

## Hyväksymiskriteerit

- Jokainen nykyinen sivu löytyy uudesta navigaatiosta. Aktiivinen sivu ja ryhmä näkyvät tekstin tai muodon avulla ilman värin erottamista.
- 320 px leveydessä päänavigaatio ei vaadi vaakavieritystä. Päätoiminto, kuukauden valinta ja datan vienti löytyvät ilman arvaamista.
- Vaalean, tumman ja korkean kontrastin tilan tekstit, syöttökentät, fokus ja valittu navigaatio läpäisevät sovitut kontrastitarkistukset. Vaarallinen toiminto erottuu myös tekstin perusteella.
- Yhteenvedon vähintään kolme sisältöaluetta erottuvat visuaalisesti ja semanttisesti. Kaikkia paneeleita ei värjätä yhtä voimakkaasti.
- Näppäimistöllä voi avata ja sulkea mobiilivalikon, siirtyä sivulle ja palata odotettuun kohtaan. Escape ei sulje muuta avointa dialogia väärässä järjestyksessä.
- Valmis yhden tiedoston `index.html` toimii edelleen ilman verkkoa tai ulkoisia fontti-/kuvakeresursseja. Tietomalli ja talouslaskenta eivät muutu ulkoasutyön vuoksi.

Toteutuksen aikana kannattaa kerätä pari ennen/jälkeen-kuvaa samasta fiktiivisestä demotaloudesta sekä tyhjästä näkymästä. Niillä on helpompi tarkistaa, että uusi värien käyttö auttaa hahmottamaan sisällön järjestystä myös ilman oikeaa talousdataa.
