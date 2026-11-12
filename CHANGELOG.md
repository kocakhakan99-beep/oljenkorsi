# Muutosloki

### UX:n toimintojen pääpaikat ja tiivistys 11.11.2026

Budjettiraamien muokkaus keskitettiin asetuksiin ja menetelmän pitkät taustatiedot siirrettiin avattavaksi; tärkeä elämäntilanteen ja välttämättömän hoidon huomio säilyy näkyvissä. Sijoituskohteen valinta yhdistettiin lisäys-/muokkauslomakkeeseen, jossa valinta esitäyttää saatavilla olevan päivätyn hinnan. Viiva- ja aluekaaviot erotettiin selvästi. Muiden lisäosioiden auditoinnissa säilytettiin harvoin käytetyt syöttökentät, laskentaoletukset, tekniset tuontiasetukset sekä poistojen suoja.

### Worker-avainten selvennys 11.11.2026

Laskuanalyysi nimeää Workerin asiakasavaimen APP_API_KEY:ksi ja selventää, että Workeristä tuleva HTTP 401 voi johtua myös palvelinpuolen OpenRouter-avaimesta. Vain ilmaisten mallien tunnisteita lähetetään.

### Worker vaatii API-avaimen 11.11.2026

Korjattiin Worker-analyysi käyttämään käyttäjän API-avainta Bearer-otsakkeessa. Avain syötetään jokaista analyysiä varten ja tyhjennetään kentästä; ilmaismallien automaattinen valinta säilyy.

### Avaimeton Cloudflare Worker 11.11.2026

Worker-analyysi ei enää vaadi Bearer-avainta eikä ylimääräistä vahvistusruutua. Suora OpenRouter-yhteys vaatii edelleen käyttäjän antaman avaimen. Sovellus pyytää vain ilmaismallien tunnisteita.

### Worker oletuksena ja avain joka analyysiin 11.11.2026

Laskuanalyysin oletuspalvelu on Cloudflare Worker, ja Bearer-avain syötetään jokaisen analyysin alussa. Avainta ei tallenneta; Worker-avain voi olla eri kuin Cloudflare-tilin API-token. Suora OpenRouter säilyy valittavana, ja Worker vaatii ilmaismallin palvelinpuolen vahvistuksen.

### Nemotron ja valinnainen Cloudflare Worker 11.11.2026

Laskuanalyysi pyytää ensisijaisesti ilmaista Nemotron 3 Ultra -mallia ja saatavuus-/kiintiövirheessä automaattista ilmaismallireititintä. Palveluksi voi valita käyttäjän Cloudflare Workerin; asiakas pyytää vain ilmaismalleja, mutta palvelimen malliohjaus ja laskutus on käyttäjän varmistettava. Worker-yhteyden CORS ja mallin saatavuus ovat vielä varmentamatta.

### Laskuanalyysi tavallisessa sovelluksessa 11.11.2026

OpenRouter-laskuanalyysi toimii tavallisesta index.html-tiedostosta. Yhteys sallitaan ainoastaan OpenRouteriin ja käynnistyy vain käyttäjän painikkeesta; muut ominaisuudet eivät edellytä verkkoa. API-virheiden ilmoitukset erottavat avaimen, ilmaismallien saatavuuden, kiintiön ja yhteyden ongelmia.

### Vapaaehtoinen OpenRouter-laskuanalyysi 11.11.2026

Erillinen index-online.html tarjoaa teksti-PDF:n tai liitetyn laskutekstin tarkistuksen ja käyttäjän käynnistämän OpenRouter openrouter/free -analyysin. Ehdotus siirtyy käyttäjän tarkistamaan kerta- tai toistuvan menon lomakkeeseen; avainta ja laskutekstiä ei tallenneta talousdataan. Offline-version verkkokielto säilyy. OCR, suora API-varmennus ja kaksoiskirjausehdotukset ovat vielä tekemättä.

### Budjetoinnin ja kirjaamisen sujuvuus 11.11.2026

Budjettisummissa sarkain siirtyy seuraavaan kategoriaan ja vaihto pitää kategoriat näkyvissä tallennuksen jälkeen. Toistuvien palkkojen ja etuuksien maksupäivä siirtyy automaattisesti edeltävälle pankkipäivälle. Menojen lisävalinnat järjestettiin selkeämmin.

### Yksityisyyden ja yhteenvetonäkymän viimeistely 11.11.2026

Kuittiluonnos häviää hyväksynnän jälkeen; tallennukseen jää vain tavalliset kategoriakohtaiset menot, ei erillistä kuittihistoriaa, PDF-tiivistettä, tuoterivejä tai niiden listaa menon kuvauksessa. Vanhoista tallennuksista arkisto ja tuoterivilistat puhdistetaan. Ohjeet avautuvat kortin Info-kuvakkeesta ponnahdusikkunaan, myös budjetin raamien laskenta, omaisuuden arvio ja kompassin havaintoperusteet. Sisäkkäisen Info-ikkunan Escape sulkee vain päällimmäisen ikkunan. Yhteenvedon kulutuksen erittely sekä säästö- ja sijoitussiirrot ovat näkyvissä oletuksena ja niiden tarkoitus on kerrottu lyhyesti.

## 0.1.0, 3.11.2026

Ensimmäinen paikallinen käyttöversio. Single-file build, file://, localStorage ja virhetilat, JSON-backup/restore, CSV, talouskirjaukset, kategoriat, toistuvuudet, budjetti, yhteenveto, manuaaliset omaisuus/velka/sijoitusarvot, tavoitteet, rajatut skenaariot ja raportit, teemat ja yksityisyystila. 31 yksikkötestiä ja offline file:// E2E. Laaja V1-määrittely ei vielä kokonaan toteudu.

### Käyttäjätestauksen kirjauspolut 9.11.2026

Lisättiin päivittäistavara-, kosmetiikka-, hygieniatarvike- ja luottokorttilaskukategoriat; vanhoja varmuuskopioita täydennetään ilman omien kategorioiden tai arkistointien palauttamista. Budjettiriviltä voi avata kyseiseen kategoriaan esitäytetyn menokirjauksen. Kerta- ja toistuva kirjaus erotetaan selkeillä aloituspainikkeilla, ja nimen, summan, kategorian sekä päivän jälkeen tulevat tarkennukset ovat valinnaisia. Summakentässä on euromääräiset pikasäädöt.

Tapahtuman toteutunut/suunniteltu tila määräytyy maksupäivästä, ja yksittäisen toistuvan esiintymän tilan voi edelleen korjata. Toistuvan tulon voi aikaistaa viikonlopun tai sovelletun suomalaisen pankkipyhän yli edeltävälle pankkipäivälle. Sovellus kertoo, ettei päivämäärä ole pankkivarmennus. 69 yksikkötestiä ja 60 Chromium E2E -varmennusta läpäisivät.

### Ylläpito 5.11.2026

Yläpalkin kuukausivalitsin ja ikonipainikkeet viimeisteltiin. Järjestelmäteema vaihtuu heti, kun laitteen vaalea/tumma-asetus muuttuu sovelluksen ollessa auki. Chromium 155 -selainsarja suoritettiin valmiille HTML:lle loopback HTTP -palvelun kautta; `file://`-avaus ja selaimen offline-simulaatio jäivät ympäristörajoitteen vuoksi testaamatta.

### 50/30/20 ja budjettiraamit 9.11.2026

Budjetti, tulot ja menot näyttävät yhteiset ryhmäraamit ja kategoriaylitykset. Käyttäjä muokkaa osuuksia (summa 100 %), kategoriaryhmiä ja ohjerajoja; asetukset säilyvät JSON-varmuuskopiossa ja kategorian nimeämisessä. Kompassi tunnistaa rahoitusvajeen, säästövarauksen vajeen, puuttuvat luokitukset ja suurimmat kategoriaylitykset sekä ehdottaa laskujen ja menojen uudelleenjärjestelyä. Kehikko ja sovelluksen kategoriaprosentit on erotettu tutkimusnäytöstä. 77 yksikkötestiä ja 62 Chromium-selainvarmennusta läpäisivät.

### Toimintojen pääpaikat 9.11.2026

Tulojen ja menojen lisääminen ja muokkaus yhdistettiin samaan lomakkeeseen kaikkine toistuvuuksineen ja lisäkenttineen. Budjetin kokonaistoteuman korjaus siirrettiin kategoriakortin lisävalinnaksi; kirjaukset ovat tavallisen toteuman lähde. Täysi 50/30/20-paneeli on vain budjetissa, ja muissa kirjausnäkymissä näkyy tiivis poikkeamatila sekä linkki. Tavallinen varmuuskopiointi keskitettiin Tuonti ja vienti -näkymään. UX:n 12-tasoinen esittämismalli lisättiin seuraavaksi työpaketiksi ominaisuuksia säilyttävällä periaatteella. 77 yksikkötestiä ja 62 Chromium-selainvarmennusta läpäisivät.

### UX:n priorisointi 9.11.2026

Esittämismalli täsmennettiin vaihtoehtojen priorisointijärjestykseksi: ensimmäinen tarkoitukseen sopiva riittävä tapa valitaan, tasoja ei kerrosteta automaattisesti. Ohjelaatikot näyttävät ensin avattavan otsikon. Budjetin tulopohja ja kategoriaylitykset tiivistettiin luvuiksi ja lyhyiksi tiloiksi, laskentakuvaus on avattava. Kompassin varsinainen toimenpide ja havainto säilyvät näkyvissä; perustelu ja lisävaikutus avautuvat pyynnöstä myös demokorteissa. Kriittiset poikkeamat ja olennaiset tulopohjan oletukset säilyvät näkyvissä.

### Demotaloudet 2025–2026

Kaikkien neljän esimerkkitalouden tulot, menot ja kategoriabudjetit kattavat kiinteästi kaikki 24 kuukautta vuosilta 2025 ja 2026. Mukana on kausivaihtelua, eräpäiviä, viikoittaisia ruokaostoksia, pankkipäivälle aikaistettuja palkkoja ja etuuksia, säästö-/sijoitussiirtoja sekä kaikille talouksille tavoitteita ja kaksi tallennettua skenaariota. Omaisuus ja velat ovat linkitettyjä esimerkkitilannekuvia. Kriisitalouden tulokatkos alkaa 2026-08. Kompassin vieritettävä 24 kuukauden suunnitelmakuvaaja käyttää samaa aineistoa kuin ladattava talous; tulevat maksut eivät muutu toteutuneiksi. Vanha ladattu talous säilyy, kunnes käyttäjä lataa uuden esimerkin vahvistuksen kautta. 83 yksikkötestiä ja 63 selainvarmennusta läpäisivät.

### Yhteenveto ja budjetin UX 10.11.2026

Otettiin käyttöön yhteiset mittarikortit, tilamerkit, budjetin käyttöastepalkki ja avattava lisätieto. Yhteenvedossa näkyvät ensin tulot, menot ja säästöaste; kulutuksen erittely ja suunnitelman siirrot avautuvat pyynnöstä. Budjettitaulukon ohjerajalaskenta siirtyi kategoriakorttiin ja pitkä toteumaselitys avattavaksi. Yhteenvedon budjettikäyttöaste käyttää nyt samaa kategoriatoteumaa kuin budjetti, myös oman kokonaistoteuman korjauksen kanssa. Yli sadan prosentin toteuma säilyy tekstinä, ja kategoriakohtainen ohjerajaylitys nimetään erikseen. 83 yksikkötestiä ja 64 selainvarmennusta läpäisivät.

### Raportit ja varallisuuslistat 10.11.2026

Yhteiset kuvaketoiminnot talouslistoihin ja kategoriakorttiin; saavutettavat nimet, näppäimistökäyttö ja poiston vahvistus säilyvät. Omaisuuden, velkojen ja sijoitusten pääluvut ja manuaalisuus näkyvät lyhyessä yhteenvetokaistassa. Sijoitusrivillä näkyy hankinta-arvo kategorian toiston sijasta ja tavoiterivi näyttää vain etenemisen sekä aika-arvion. Raportin tietokortti erottaa pääsumman ja tietuemäärän sekä budjetin kolme vertailulukua. Pitkät laskentaselitteet avautuvat tarvittaessa, ja omat toteumat, nykytilan luonne ja FIRE-skenaarion rajaus pysyvät näkyvinä.

### Asetukset ja tiedonhallinnan UX 10.11.2026

Asetusten demogalleria korvattiin yhteisen valintaikkunan avauksella. Tallennuksen tila ja varmuuskopioinnin pääpaikka näkyvät lyhyesti; raakadatan vienti ja poistot säilyvät avattavissa lisävalinnoissa. CSV:n merkistö ja erotin siirrettiin tiedoston lisäasetuksiin, jotka avautuvat merkistövirheessä ja pysyvät auki korjauksen jälkeen. Virheet, duplikaatit ja tuotavien rivien määrä näkyvät tilamerkkeinä. Raportin kaavio ja taulukko ovat vaihtoehtoisia esityksiä, eikä taulukossa näy kaavion zoomausta. Kuukausivalinnan otsikkotoisto ja vanhentuneet toteumatilan käyttöohjeet korjattiin. 83 yksikkötestiä ja 67 selainvarmennusta läpäisivät.

### Tiiviit listat ja budjettierot 10.11.2026

Kaikkien kuuden talouslistan nimi ja kuvakkeellinen kategoria erotettiin omiin sarakkeisiin. Suljettuja rivejä madallettiin, tapahtumatietoja tiivistettiin ja pitkien nimien tila korjattiin puhelimella. Budjetin ryhmä-, kategoria- ja rahoituserot esitetään lyhyinä etumerkillisinä lukuina: vihreä plus on suotuisa, punainen miinus vaje. Vertailun saavutettava selite ja avattavat lisätiedot säilyvät. 83 yksikkötestiä ja 69 Chromium-selainvarmennusta läpäisivät.

### Tapahtumakuvakkeet 10.11.2026

Tulojen ja menojen toistuvuus sekä kuukauden tapahtumatila esitetään yhtenäisillä kuvakkeilla. Kahdeksan toistuvuusrytmiä erotetaan pienillä rytmimerkinnöillä, kertatapahtuma omalla kalenterillaan. Tilasymbolit erottavat toteutuneen, suunnitellun, ohitetun, eri tiloja sisältävän ja tapahtumattoman kuukauden sekä keskeytetyn sarjan. Selite avautuu hiirellä, kosketuksella ja näppäimistöllä. Tapahtumakorjauksen perusteella määräytyvä tila nimetään selitteessä erikseen.

### Rivilaajennus, katselu ja budjetin väljyys 10.11.2026

Lisätiedot laajenevat saman talousrivin sisään kaikissa kuudessa listassa. Uusi silmäpainike avaa katseluikkunan ilman syöttökenttiä; muokkaus ja vahvistettava poisto löytyvät myös ikkunasta. Sama katselu palvelee budjettikategorian menoluetteloa, pikahakua ja raporttien tietueita. Budjetin kategoriarivien välejä ja mobiiliasettelua väljennettiin. Laskentaa tai tietomallia ei muutettu.

### Yksi avauspolku ja kompakti budjetti 10.11.2026

Talouslistojen nuolilaajennus korvattiin silmäpainikkeen katselulla. Tapahtumakohtaiset korjaukset ovat katseluikkunan erillisessä valinnassa. Solujen korkeudet ja kohdistus yhtenäistettiin. Budjettiriviltä poistettiin ryhmäluokitus, ohjerajapoikkeama ja automaattisen toteuman leima; ryhmä ja ohjeraja löytyvät kategoriakortista. Silmä- ja pieni menon lisäyspainike siirrettiin omaan toimintokohtaan. Huomioiden kategoriakortit näyttävät budjetoidun summan ja selkeästi nimetyn ohjerajapoikkeaman.

### Velkojen sarakkeet ja automaattinen tavoitelaskenta 10.11.2026

Velan korko ja kuukausierä erotettiin omiin sarakkeisiinsa. Omaisuuslinkki näkyy linkki- ja kategoriakuvakkeena ja avaa omaisuuden katselun; tarkemmat linkkitiedot löytyvät velkakortista. Tavoitelomake laskee kuukausisäästön tavoitesummasta ja tavoitepäivästä tai tavoitesumman käyttäjän kuukausisäästöstä. Jo säästetty summa, jäljellä olevat kuukausierät, senttipyöristys ja mahdottomat aikavälit huomioidaan. Tietomalli säilyy.

### Talousrivien ja laskurien selkeys 10.11.2026

Omaisuuden arvostuspäivä siirrettiin kortille ja omistusosuus omaan sarakkeeseen; tuloissa käytetään Maksupäivä-otsikkoa ja tilakorjausten kuvakemerkkiä. Nollakuukausierä korvattiin selitteellä. Velkakortissa on erillisillä kuluilla toimiva jäljellä olevan suunnitelman vuosikorkoarvio ja valitun päivän saldoarvio, maksetuiksi oletetuin erinä. Skenaariot saivat kysymyskohtaisen aloitusvalinnan. Sijoituksiin lisättiin 20 valintapohjaa; nykykurssit ja kahden vuoden historia odottavat varmennettua tietolähdettä.

### Omaisuuden arvonmuutosarviot 10.11.2026

Lisättiin omaisuuskortille avattavat asunto-, ajoneuvo-, laite-, maa- ja yleismallit. Rakennusvuosi/vuosimalli, tekninen kuluminen, markkinamuutos sekä valinnainen ajomäärän lisävaikutus ovat muokattavissa. Nykyarvoon ankkuroitu laskenta näyttää arvion, oman osuuden ja käyttäjän oletusvälin. Oletukset tallentuvat ja palautuvat JSON-varmuuskopiosta; kirjattu arvo säilyy. Mallin aloitusparametrit ovat havainnollistavia, eivät markkinadataan kalibroituja.

### Kuukausisuodatus ja ajankohtaiset riviarvot 10.11.2026

Korjattiin tulo-/menolistojen puuttuva kuukausirajaus sekä tapahtumapäivien ja summien kohdistuminen valittuun kuukauteen. Omaisuuden mallit ja velan maksusuunnitelma päivittävät rivin arviota ajankohdan mukaan; lähdearvot säilyvät. Yhteenvedot käyttävät samoja arvioita. Raportoinnin aikaväli erotettiin yleisestä kuukaudesta. Omaisuusarvio nostettiin kortin yläosaan ja uusi perustila valitsee kertoimet. Auton tiedot ovat vuosimalli, lähtökilometrit, vuotuinen ajo, merkki ja käyttövoima; asunto käyttää rakennusvuotta. Malli sidotaan kategoriaan. Merkin/käyttövoiman hintavaikutuksia ei oleteta ilman kalibroitua aineistoa.

### Omaisuuden arvonmuutos omalle muokkausvälilehdelle

Arvonmuutosmallin lomake siirrettiin katselukortista omaisuuden muokkausikkunan Arvonmuutos-välilehdelle. Perustiedot ja malli käyttävät yhteistä tallennusta ja peruutusta. Välilehdet säilyttävät luonnoksen ja toimivat nuolinäppäimillä. Mallin käyttöönotto/poiskytkentä sekä esikatselu löytyvät samasta paikasta.

### 2024–2026 lähdehistoria, demot ja porrastettu auto

Arvonmuutoslomake näkyy aina muokkausvälilehdellä. Välilehtipalkki erottuu aktiivisella pinnalla ja kontrastilla. Autojen porrastettu v2 sisältää 20 merkin näkyvät arvio-oletukset sekä uuden auton alkuvaiheen, ja säilyttää vanhan v1:n. Kaikille 20 sijoituskohteelle lisättiin 720 päivättyä hintahavaintoa ja 730 EKP-valuuttahavaintoa; kurssikuvaaja ja havaintotaulukko näkyvät kortilla. Neljä demoa kattavat 36 kuukautta ja yhteensä 4 480 tulo-/menokirjausta, uudet arvomallit, velkatilanteet, tavoitteet ja salkut. Maksuttomien API:en käyttö- ja tietoturvasuunnitelma lisättiin, liveyhteyttä ei vielä kytketty.

### Prisma- ja K-kaupan PDF-kuittiskannaus

Lisättiin paikallinen PDF.js-tekstinpoiminta, deterministinen S/K-parseri, tuote- ja ryhmäalennukset, tarjouspaketit, painotuotteet, pantit ja täsmällinen summatarkistus. Tuonti ja vienti sisältää tuotekohtaisen ja monivalinnan kategoriatarkistuksen sekä menokirjaukset ostopäivälle. Kuittiryhmät säilyvät JSONissa, kaksoistuonti estetään ja aiempaan kerta-/sarjamaksuun voi täsmäyttää. Kolme käyttäjän PDF-kuittia varmennettiin koko selainpolussa; alkuperäisiä tiedostoja ei lisätä repositorioon. OCR, kuluhyvitykset ja yleiset lasku-/sopimusparserit säilyvät jatkotöinä.

### Kuittiparserin v2: Prisma, S-market, Alepa ja K-kaupat

Korjattiin tähtikoristellun loppusumman tunnistus yleisenä rakennesääntönä. Lisättiin sivu-/rivinvaihdot, läheinen päivä/kellonaika, Unicode-normalisointi, yksikköhinnan tarkistus ja ALV-/yksittäisen korttiveloituksen ristiintarkistukset. Epäselvä lähderivi näkyy käyttöliittymässä ja estää tallennuksen. Laajennetussa aineistossa yhdeksän alkuperäistä PDF:ää / kahdeksan ostosta, mukaan lukien semanttinen kaksoistuonti eri PDF-tiivisteellä. Vanhojen kuittiryhmien palautus säilyy; kategoriat tarkistetaan edelleen käyttäjällä.

### Kuittiskannaus menoihin ja koko näkymän PDF-pudotus

Kuittiskannerin pääpaikka siirrettiin menoihin avattavaksi työkaluksi. Menojen ja budjetin kuvakkeellinen pikapainike, Tuonti ja vienti -siirtymä sekä Menot-/Budjetti-/Asetukset-näkymän PDF-pudotus avaavat saman skannerin. Luonnos säilyy suljettaessa ja sivua vaihdettaessa. Pudotus tukee yhtä PDF:ää, suojaa aiempaa luonnosta ja avoimia editoreita sekä estää tiedoston avaamisen sovelluksen tilalle. PDF-valinta käyttää lyhyttä näppäimistöllä toimivaa painiketta.
