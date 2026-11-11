# Testausraportti 11.11.2026

## Worker-rajapinnan tarkistus 11.11.2026

- 169 yksikkötestiä, TypeScript, ESLint ja tuotantobuild läpäisivät. Simuloitu selaintesti varmisti Worker-avaimen Bearer-otsakkeen ja ilmaismallin tunnisteen; 401-virhe voi viitata sekä Workerin APP_API_KEY-arvoon että palvelinpuolen OpenRouter-avaimeen.
- Tämän ympäristön Workeriin tekemä avaimeton OPTIONS-esitarkistus palautti tavallisella selaimen User-Agent-tunnisteella HTTP 401 `Unauthorized` ilman Access-Control-Allow-Origin-otsaketta sekä `Origin: null`- että `Origin: https://example.com` -pyynnölle. Chromen paikallisessa testissä sovellus näytti tästä yhteys-/CORS-virheen. Tämä poikkeaa ilmoitetusta OPTIONS-käytöksestä, eikä virheen tarkkaa sijaintia Workerissä tai sen edessä ole vahvistettu. Oikeaa avainta tai henkilötietoja ei käytetty.

## Worker API-avaimella 11.11.2026

- 168 yksikkötestiä, tyyppitarkistus, ESLint ja tuotantobuild läpäisivät. Chromiumin simuloitu API-koe varmisti, että Worker vaatii API-avaimen, lähettää sen Bearer-otsakkeessa ja tyhjentää avainkentän. OpenRouterin polku läpäisi myös.
- Oikeaa API-avainta ei käytetty. Worker palautti aiemmin tästä ympäristöstä tehdylle avaimettomalle CORS-esitarkistukselle HTTP 403 / 1010; oikeaa Worker-yhteyttä ei ole todettu toimivaksi.

## Avaimeton Worker 11.11.2026

- 168 yksikkötestiä, TypeScript, ESLint ja tuotantobuild läpäisivät. Chromiumin simuloitu laskupolku varmisti, että Worker valitaan ilman avainkenttää tai vahvistusruutua ja pyyntö ei sisällä Authorization-otsaketta; OpenRouter vaatii edelleen avaimen.
- Muokattuun Workeriin lähetettiin tästä ympäristöstä avaimeton CORS-esitarkistus sekä fiktiivisellä tekstillä tehty POST, jossa pyydettiin ilmaista Nemotronia. Molemmat palauttivat Cloudflaren HTTP 403 / 1010; tämä ei todista muiden verkkojen toimintaa tai virheen tarkkaa syytä. Onnistunutta todellista Worker-vastausta ei ole varmennettu.

## Worker oletuksena ja kertakäyttöinen avain 11.11.2026

- 167 yksikkötestiä, tyyppitarkistus, ESLint ja tuotantobuild läpäisivät.
- Chromiumin simuloidussa API-testissä Worker oli oletuksena, ilmaismallin vahvistus vaadittiin, avainkenttä tyhjeni analyysipyynnön jälkeen ja avain ei tallentunut taloustilaan. Myös suoran OpenRouterin vaihtoehtoinen polku läpäisi.
- Oikeaa Worker-avainta ei käytetty. Aiempi Workerille tästä ympäristöstä tehty nimetön CORS OPTIONS palautti Cloudflaren 403/1010-vastauksen; palvelun oikea käyttö ja palvelinpuolen ilmaismalliasetukset vaativat edelleen varmistuksen.

## Ilmaismallit ja Cloudflare Worker 11.11.2026

- 167 yksikkötestiä, TypeScript, ESLint ja tuotantobuild läpäisivät. Selainkoe tarkisti simuloidulla vastauksella OpenRouterin ensisijaisen Nemotronin sekä Worker-vaihtoehdon vahvistuksen ja avaimen tallentumattomuuden.
- OpenRouterin julkinen malliluettelo palautti `nvidia/nemotron-3-ultra-550b-a55b:free` -mallille prompt- ja completion-hinnaksi 0. Malli ei luettelon mukaan tue `response_format`-parametria, joten sitä ei lähetetä. Saatavuus ja hinnat voivat muuttua; onnistunutta mallivastausta oikealla avaimella ei ole testattu.
- Workerille tehty nimetön CORS OPTIONS -koe tästä ympäristöstä palautti Cloudflaren HTTP 403 / 1010 ilman CORS-otsakkeita. Tämä ei osoita ongelman tarkkaa syytä eikä muiden ympäristöjen tilaa; Worker-pyyntöjä ei ole varmennettu oikealla avaimella. Worker-palvelimen on tuettava pyydettyjä OpenRouter-ilmaismallinimiä ja vastattava selaimen CORS-esitarkistukseen.

## OpenRouter tavallisessa index.html-tiedostossa 11.11.2026

- 165 yksikkötestiä, tyyppitarkistus, ESLint ja tuotantobuild läpäisivät. `index.html` ja vanha `index-online.html` ovat sisällöltään samat.
- `e2e_invoice.py` varmisti localhostilla tavallisen index.html-tiedoston budjettipikatoiminnon, käyttäjän käynnistämän simuloidun API-pyynnön, toistuvan menon tarkistuksen ja ettei avain tai laskuteksti päädy taloustietoihin.
- Chromiumin oikea yhteys OpenRouteriin palautti tarkoituksella virheelliselle testavaimelle HTTP 401, joka näytettiin avainvirheenä. OpenRouterin CORS-esitarkistus `Origin: null` palautti HTTP 204 ja salli Authorization-otsakkeen. Oikeaa avainta tai laskudataa ei lähetetty; onnistunutta oikeaa mallivastausta, palvelun kiintiötä tai tietojenkäsittelyehtoja ei tällä varmennettu.

## OpenRouter-laskuanalyysi 11.11.2026

- 164 yksikkötestiä, tyyppitarkistus, ESLint ja molempien HTML-versioiden build läpäisivät.
- Chromiumissa testattiin teksti-PDF, muokattava esikatselu, simuloitu API-vastaus, kerta- ja toistuva meno sekä se, etteivät avain tai laskuteksti päädy taloustallennukseen. Todellista laskua tai API-avainta ei käytetty.
- OpenRouterin julkinen malliluettelo vastasi HTTP 200 ja ilmoitti `openrouter/free`-reitittimen prompt- ja completion-hinnoiksi 0 sekä JSON-vastauksen tuen. Tämä ei todenna käyttäjän avaimen toimivuutta, varsinaisen analyysipäätepisteen CORS-tukea, mallin saatavuutta tai palveluntarjoajien tietojenkäsittelyehtoja. OCR ja aitojen laskujen tarkkuus ovat testaamatta.

## Tiedon minimointi ja Info-ikkunat 11.11.2026

- 161 yksikkötestiä 16 tiedostossa, TypeScript-tarkistus, ESLint ja standalone-tuotantobuild läpäisivät. Buildissa säilyy Viten suuren JavaScript-chunkin huomautus.
- Kuittituonnin hyväksyntä tallentaa vain tavalliset menot. Vanhat kuitin tuontiarkistot ja sovelluksen luomat tuoterivilistat poistuvat selaintallennuksesta ja JSON-palautuksesta.
- Budjetin raamien, omaisuuden arvion, kompassin havaintoperusteiden ja muiden selitteiden Info-ikkunat avautuvat näppäimistöllä. Sisäkkäisen ikkunan Escape ei sulje taustalla olevaa tietokorttia.
- Yhteenvedon kulutuksen erittely ja säästö-/sijoitussiirrot ovat oletuksena näkyvissä. Käyttötarkoitus on ilmaistu osioiden lyhyissä kuvauksissa.
- Kaikki 82 Chromium-selainvarmennusta läpäisivät localhost-ajossa. Lisäksi kaikki 32 kuittiskannerin selainvarmennusta läpäisivät 11 anonymisoidulla PDF-fixturella. Kirjaamisen jälkeen vain menokirjaukset jäivät tallennukseen; uudelleenlatauksen jälkeen ei ollut kuittihistoriaa tai tuoterivejä. Sovelluksen JavaScript-virheitä tai ulkoisia verkkopyyntöjä ei ollut. Chromium pyysi lisäksi omaa `/favicon.ico`-tiedostoaan, jota sovellus ei käytä; testiraportti suodattaa vain selaimen tämän 404-viestin.


## Kuittierän tarkistus ja lähdetiedostojen poisto 11.11.2026

- 17 uutta PDF-kuittia käytiin läpi selaimen PDF.js-parserilla. 15 tavallista ostokuittia parseutui tarkistuksetta; ABC:n polttoainekuitti ja palautuskuitti jätettiin pois käyttäjän pyynnöstä.
- Uusi K-Market-fixture anonymisoi myös päivämäärän ja summat synteettisiksi. K-marketin tuoterivit, määrätieto ja täsmäytys saavat nyt yhden suoran regressiotestin.
- Kaikki 21 repositorion seurattua PDF:ää poistettiin nykyisestä haarapuusta. Alkuperäiset uploadit säilyvät aiemmissa commit-historian kohdissa.
- 163 yksikkötestiä 16 tiedostossa, TypeScript-tarkistus, ESLint ja tuotantobuild läpäisivät. Build säilytti Viten suuren JavaScript-chunkin huomautuksen.

## Uudet Prisma-kuittitaitot ja fiktiivisten testikuittien poisto 10.11.2026

- Neljä käyttäjän toimittamaa PDF:ää ajettiin sovelluksen selaimessa toimivan PDF.js-lukijan läpi. Kaikki neljä tunnistuivat ja niiden tuoterivimäärät täsmäsivät. Kaksi tiedostoa olivat saman kuitin identtiset kopiot; toinen uusi kuitti käytti aiemmin testatusta ostoksesta erilaista, tähdetöntä taittoa.
- Parseri rajaa tähdettömän Prisma-tuotealueen avaavan ja sulkevan erotinviivan väliin. Se tunnistaa myös `Credit/Veloitus`- ja `VISA Debit: € summa` -maksurivit sekä tarkistaa maksun summan ostoksen loppusummaan. Rajaviivan puuttuessa riviä ei arvata tuotteeksi.
- Kolmesta uudesta kuittirakenteesta lisättiin anonymisoidut tekstifixtuurit. Testit tarkistavat tuoterivien lukumäärän ja kokonaissumman, kampanja-alennuksen laskennan, Credit/VISA-maksusumman ristiriidan estoineen sekä tähdellisen ja tähdettömän saman ostoksen kaksoistuonnin.
- 162 yksikkötestiä 16 tiedostossa, TypeScript, ESLint ja tuotantobuild läpäisivät. Selainregressiossa 10 eri kuituostosta kirjautui riveittäin oikein; kaksoistuonnit estettiin, tallennuksen hyväksyntä vaadittiin eikä sovellus tehnyt ulkoisia pyyntöjä.
- Fiktiivinen PDF-kokoelma, sen generaattori ja fiktiivisillä PDF:illä tehty parseritestistö on poistettu. Selainpudotuksen regressio muodostaa väliaikaiset testitiedostot vain anonymisoiduista, oikeisiin kuitteihin perustuvista fixtuureista.

## Kuittien tuoterajauksen korjaus 10.11.2026

- Esimerkkien rakenteista erotettiin kaksi sääntöä: S-ryhmän tuoterivit alkavat tähtimerkillä; K-Citymarketin tuoterivit alkavat ostotapahtuman otsikon jälkeen ja päättyvät loppusummaa edeltävään erotinviivaan. Jos K-pohjasta puuttuu erotinviiva, `YHTEENSÄ` rajaa alueen. Otsikon ja tuotealueen ulkopuoliset summat eivät ole tuoterivejä.
- Korjattiin K-kuitin aiempi liian yleinen poiminta, joka käsitteli ostorajan sisällä minkä tahansa summalla päättyvän rivin tuotteena. Uudet regressiotestit tarkistavat myös K-pohjan ilman erotinviivaa.
- Tuolloin toimitetut yhdeksän alkuperäistä PDF:ää sisälsivät kahdeksan eri ostosta. Korso-kuitin eri tiedostoversio estettiin kaksoistuontina. Myöhemmin repositorioon ladatut neljä PDF:ää ja niiden uudet rakenteet varmennettiin yllä olevassa ajantasaisessa ajossa.
- Tuolloin 153 yksikkötestiä 16 tiedostossa, TypeScript ja ESLint läpäisivät. Uudet regressiotestit varmistivat, ettei K-kuitin otsikon tai tuotealueen jälkeinen summa päädy ostoriviksi ja että loppusummarivi toimii erotinviivan puuttuessa.
- Fiktiivinen 14 PDF:n näytekokoelma, generaattori ja niiden parseritestit poistettiin käyttäjän pyynnöstä. Pudotustesti muodostaa väliaikaiset PDF:t oikeiden kuittien anonymisoiduista testifixtuureista. Alla olevat aiempien ajojen tulokset ovat historiaa; poistettuja näyte-PDF:iä ei enää toimiteta eikä käytetä kuittiformaattien kattavuusväitteenä.
- Tuolloisessa selainajossa 14 PDF-pudotuksen ja skannerin Chromium-varmennusta läpäisi väliaikaisilla Alepa- ja Prisma-fixtureistä tuotetuilla PDF:illä. Nämä kyseiset fiktiiviset esimerkkitiedostot ja niiden käyttämä vanha testiaineisto poistettiin myöhemmin.

## Kuittiskannauksen pääpaikka ja PDF-pudotus 10.11.2026

- TypeScript, ESLint, 166 yksikkötestiä 17 tiedostossa ja tuotantobuild läpäisivät. Uusi tiedostovalinnan portti kattaa yhden PDF:n, kirjainkoon, puuttuvan/tyhjän/ylisuuren tiedoston ja usean tiedoston hylkäyksen. PDF:n sisältötarkistus säilyy lukijassa.
- Menojen yksi skanneri on oletuksena suljettu; budjetin pikatoiminto ja vanhan tuontipaikan linkki avaavat saman työkalun. Käynnistyspainike toimii näppäimistöllä, ilmoittaa avautumistilan ja kohdistaa skanneriin; sulkeminen palauttaa kohdistuksen. PDF-valintapainike avaa selaimen oikean tiedostovalitsimen.
- 14 erillistä pudotus-/navigointivarmennusta: Menot, Budjetti ja Asetukset, pudotus otsikkoon/sivupalkkiin/korttiin, sisäkkäiset dragenter/dragleave-tapahtumat, Escape, luonnoksen ja kategoriavalinnan säilytys, korvaamisen hyväksyntä/hylkäys, monen tiedoston ja muun tiedostotyypin esto, avoimen editorin suoja sekä muiden näkymien rajaus. Tallennettu talous ei muuttunut pelkästä pudotuksesta tai poiminnasta.
- Kuittien 27 tuontivarmennusta ja 14 fiktiivisen PDF:n lukutarkistusta läpäisivät uudesta Menot-pääpaikasta. Sovelluksen 82 yleistä selainvarmennusta läpäisi: nykyiset kirjaukset, raportit, demot, JSON/CSV ja mobiilipolut säilyvät.
- Skannerin mobiiliasettelu 320/390/768 px ja tumman tilan pudotuskorostus varmennettiin; Menojen 390 px näkymä tarkistettiin kuvakaappauksesta. Ei JavaScript-/konsolivirheitä tai ulkoisia sovelluspyyntöjä.
- Testit käyttävät HTML5 DataTransfer -tiedostoja Chromiumissa localhostissa. Fyysisen käyttöjärjestelmän raahausta, kaikkia selaimia, file://-pysyvyyttä tai ruudunlukijan toimintaa ei tällä osoiteta. Tiliotteiden tunnistusta tai parseria ei lisätty.


## Aiempi fiktiivinen PDF-kuittikokoelma — poistettu 10.11.2026

- Luotiin 14 satunnaistettua, selvästi fiktiiviseksi merkittyä PDF:ää: kaksi kullekin tunnistettavalle kauppanimelle (Prisma, S-market, Alepa, Sale, K-Citymarket, K-Supermarket, K-Market). 29–37 riviä/kuitti, loppusummat 90,64–127,42 €. Laskenta tehdään kokonaislukusenteillä ja painotuotteissa Decimal-pyöristyksellä.
- TypeScript, ESLint ja 164 yksikkötestiä 16 tiedostossa läpäisivät. Uudet testit vertaavat lopullisesta PDF:stä poimittua tekstiä erikseen luotuun ostoskorin erittelyyn: nimet, netto-/bruttosummat, alennukset, määrät, yksiköt ja loppusummat. Fontit on upotettu ja ositettu; ZIP on noin 302 kt.
- Kaikki 14 lopullista PDF:ää varmennettiin sovelluksen PDF.js-lukijalla selaimessa. Jokainen tuotenimi ja nettosumma sekä kokonaisuus vastasivat generoitua ostoskoria. Luonnokset eivät muuttaneet tallennettua taloutta. Ei JavaScript-/konsolivirheitä tai ulkoisia sovelluspyyntöjä. Ensimmäinen Prisma-PDF tarkistettiin myös renderöidystä kuvasta.
- Sovelluksen ajonaikaista koodia tai tuotantobuildia ei muutettu tässä aineistotyössä. Synteettinen aineisto ei kasvattanut oikeiden ostosten havaintomäärää eikä osoittanut Salen/K-marketin/K-supermarketin aidon formaatin kattavuutta. Kokoelma ja sen generaattori on sittemmin poistettu; tämä osio säilyttää vain aiemman testauksen historian.


## S-market, Alepa ja kuittiparserin v2 10.11.2026

- TypeScript, ESLint, 149 yksikkötestiä 15 tiedostossa ja tuotantobuild läpäisivät. JavaScript noin 2 389 kB; Viten kokohuomautus säilyy.
- Kahdeksan eri ostoksen alkuperäiset PDF:t täsmäsivät: aiemmat K/Prisma 32,87 €, 121,46 € ja 73,85 € sekä S-market Korso 24,00 € (9 riviä), Prisma 2.11. 22,44 € (9), Prisma 9.11. 92,85 € (20), Alepa 1,65 € (2) ja S-market Koivukylä 16,92 € (6). Yhdeksäs alkuperäinen tiedosto oli Korso-ostoksen eri SHA-256:n saanut kopio, joka estettiin semanttisena kaksoistuontina.
- Kuittien 27 selainvarmennusta läpäisi: koko tarkistus-/kirjauspolku kaikilla kahdeksalla ostoksella, eri tiedoston kaksoistuonti, välitön kumoaminen, vanheneminen, uudelleenlataus ja virhepolut. Tuntematon rakennerivi näytettiin lähdetekstinä ja esti tallennuksen myös loppusumman täsmätessä. 320 px tumma virhenäkymä tarkistettiin kuvakaappauksesta. Ei JavaScript-/konsolivirheitä tai ulkoisia sovelluspyyntöjä.
- Yksi systemaattinen yksikkötesti kattaa 512 varianttia (8 kuittia × 64 yhdistelmää): tähtikoristeet, Unicode-välilyönnit, tyhjät rivit, miinusmerkit, erillinen päivämäärä ja sivunvaihdot. Näissä säilyivät tuotteet, summat, alennukset ja semanttinen tunniste. Tämä ei ole 512 riippumattoman aidon kuitin onnistumisnäyttö.
- Virhekokeet kattavat puuttuvat tuotteet ja kampanjarivit, muuttuneet hinnat, ristiriitaiset ALV-/korttisummat, virheellisen määrän/yksikköhinnan, kaksi kuittia samassa PDF:ssä sekä tuntemattomat rakennerivit. Erillinen koe estää ALV-sarakkeen desimaaliosan sekoittumisen seuraavan sarakkeen tuhaterottimeksi.
- Vanhojen receipt-1-kuittiryhmien JSON-palautus säilyy, ja receipt-2-yksikköhinta tarkistetaan myös tallennuksessa/palautuksessa. Vaippa ei luokitu vaatteeksi housu-sanan perusteella; epäselvät tuotetiedot jäävät manuaalisiksi kategoriavalinnoiksi.
- Sovelluksen 82 yleistä selainvarmennusta läpäisi. File://-pysyvyyttä, OCR:ää tai 99,9 % yleistä onnistumisosuutta ei tässä varmennettu. [Kattavuus ja mittarit](RECEIPT_SCANNER.md).


## Prisma- ja K-kaupan PDF-kuittiskannaus 10.11.2026

- TypeScript, ESLint, 130 yksikkötestiä 14 tiedostossa ja tuotantobuild läpäisivät. PDF.js kasvattaa JavaScriptin noin 2 386 kB:iin ja itsenäisen HTML:n noin 2,69 Mt:iin; Viten kokohuomautus säilyy.
- Alkuperäiset käyttäjän toimittamat kolme PDF-kuittia testattiin selaimessa: K-Citymarket 15 tuoteriviä / 32,87 €, Prisma 22 / 121,46 € ja Prisma 27 / 73,85 €. Kaikkien nettotuoterivien ja kategoriakirjausten summat täsmäävät sentilleen loppusummaan.
- Kuittien erillisessä selainajossa 15 varmennusta: poiminta, luonnoksen muuttumattomuus, monivalinnan luokittelu, hyväksynnän vaatimus, ostopäivän kuukauteen tallennus, lähde-erittely, kaksoistuonnin esto, välitön kumoaminen/uudelleentuonti, kumoamisen vanheneminen myöhemmän tallennuksen jälkeen ja uudelleenlatauksen pysyvyys. Virheellinen, kuvallinen, salattu ja yli 20 Mt PDF eivät muuttaneet taloustietoja. Ei JavaScript-/konsolivirheitä tai ulkoisia sovelluspyyntöjä.
- Yksikkötestit varmentavat erityisesti Prisman jo alennetun pääsumman, TASAERÄ:n sisärivien laskemisen vain kerran, K-kaupan PLUSSA-alennusten senttijaon (myös suurilla rahaluvuilla), painotuotteet ja erilliset valuuttaglyfit. Lisäksi alkuperäisen tilan muuttumattomuus, JSON-palautus/vanhan varmuuskopion oletus, semanttinen kaksoistuonti, kerta-/sarjamaksun täsmäytys, poikkeustilat sekä käsin korjatut lähde-/kohdekategoriatoteumat.
- Sovelluksen 82 yleistä Chromium-selainvarmennusta läpäisi PDF.js- ja Zod-päivitysten jälkeen. Kuittinäkymä ei ylivuotanut 320/390/768 px leveydessä, ja 390 px näkymä tarkistettiin kuvakaappauksesta.
- Myös repositorion siivotuista tekstifixtureistä generoitujen PDF:ien selainpolku läpäisi; alkuperäisiä PDF-tiedostoja tai kortti-/jäsenyystietoja ei lisätty repositorioon.
- Tuotantoriippuvuuksien npm-audit löysi vanhasta Zodista muistinkulutushaavoittuvuuden. Päivityksen 4.6.7 jälkeen audit raportoi 0 tunnettua haavoittuvuutta. Tämä ei ole koko sovelluksen tietoturva-auditointi.
- Suora file://-käynnistys offline-selaimessa yritettiin, mutta Chromiumin hallintapolitiikka esti sen ERR_BLOCKED_BY_ADMINISTRATOR-virheellä. Uusi kokonaisuus varmennettiin localhostissa tiukalla CSP:llä; file://-, fyysisen puhelimen ja ruudunlukijan toimivuutta ei väitetä tässä varmennetuksi. Kuvallisten PDF:ien OCR ei ole käytössä.


## Kurssihistoria, automallit ja neljä laajaa demoa 10.11.2026

- TypeScript, ESLint, 112 yksikkötestiä 12 tiedostossa ja tuotantobuild läpäisivät. JavaScript noin 678 kB; Viten kokohuomautus säilyy.
- 82 Chromium-selainvarmennusta läpäisi. Arvonmuutos-lomake pysyy näkyvissä myös mallin ollessa pois käytöstä; välilehden aktiivinen tausta ja teksti erottuvat. Merkin vaihtaminen Toyotasta Teslaan muuttaa laskettua arvoa. Peruuttaminen säilyttää alkuperäisen datan.
- Yksikkötestit kattavat 20 merkin vaikutukset, porrastetun arvonaleneman jatkuvuuden ja voimakkaamman alkuvaiheen, uutena ostetun auton lähtöiän sekä vanhan malliversion yhteensopivuuden. Kertoimet ovat skenaario-oletuksia, eivät mitattuja Suomen jälleenmyyntihintoja.
- Kaikkien 20 sijoituskohteen 720 lähdehavaintoa ja 730 valuuttakurssihavaintoa tarkistettiin. Kuukauden vaihto päivittää sijoituksen hinnan ja havaintopäivän muuttamatta kirjattua lähtöarvoa. Tulevaa kurssi- tai valuuttahavaintoa ei käytetä. Kortin 36 havaintoa ja kuvaaja varmennettiin selaimessa.
- Neljän demon 36 kuukautta kattavat vuodet 2024–2026: yhteensä 496 tulokirjausta ja 3 984 menokirjausta. Kaikissa on omaisuutta, velkoja, sijoituksia, tavoitteita, skenaarioita ja tallennettuja arvonmuutosmalleja. Demojen tulevat tapahtumat ovat suunnitelmia, eivät toteutuneita markkinahintoja.
- Nykyiset raportti-, velka-, tavoite-, tapahtumakorjaus-, JSON-/CSV- ja mobiilipolut 320–768 px läpäisivät. Erillinen lopullisen buildin 390 px tarkistus varmisti lomakkeen ja sijoituksen historiakortin mahtuvan ikkunaan ilman sivuttaisylivuotoa.
- Ei sovelluksen JavaScript-/konsolivirheitä tai ulkoisia ajonaikaisia verkkopyyntöjä. Hintojen haku on erillinen kehittäjäskripti; vapaaehtoinen tuleva API-käyttö on suunniteltu dokumentaatioon. File-käyttöä, ruudunlukijaa tai käyttäjäkoetta ei varmennettu.


## Arvonmuutos muokkausikkunan välilehdellä 10.11.2026

- TypeScript, ESLint, 104 yksikkötestiä ja tuotantobuild läpäisivät. JavaScript noin 594 kB; Viten kokohuomautus säilyy.
- 80 Chromium-selainvarmennusta localhostissa. Katselukortista puuttuu arviointilomake. Arvonmuutos-välilehdeltä otettiin malli käyttöön ja tallennettiin yhteisellä Tallenna-painikkeella; vuodesta 2020 ja lähtökilometreistä muodostui tallennettu malli lähtöarvon pysyessä ennallaan.
- Välilehtien vaihto ja nuolinäppäimet säilyttivät muuttuneen vuosimallin. Peruuta palautti talouden täsmälleen aiempaan tilaan myös perustietojen kuvauksen muuttuessa. Mallin poiskytkentä ja yhteinen tallennus palauttivat kirjatun arvon käyttöön.
- Lopullisen buildin erillinen puhelintarkistus varmisti tyhjän summan estävän tallennuksen ja avaavan Perustiedot-välilehden. Arvonmuutoksen luonnos säilyi ja peruutus ei muuttanut tallennusta. Muokkausikkuna mahtui 390 px leveyteen ja tarkistettiin kuvakaappauksesta.
- Nykyiset kuukausi-, saldo-, tavoite-, raportti-, CSV-/JSON-, demo- ja mobiilipolut läpäisivät. Ei sovelluksen JavaScript-/konsolivirheitä tai verkkopyyntöjä. File-käyttöä, ruudunlukijaa tai käyttäjäkoetta ei varmennettu.


## Yhteinen kuukausi ja helppo arvomalli 10.11.2026

- TypeScript, ESLint, 104 yksikkötestiä kymmenessä tiedostossa ja tuotantobuild läpäisivät. JavaScript noin 592 kB; Viten kokohuomautus säilyy.
- Viisi uutta testiä kattavat tilannepäivän (nykyinen päivä tai kuukauden loppu, myös karkausvuosi), malliin perustuvat asset/debt-arvot ilman lähdedatan muuttamista, mallin kategoriaristiriidan, nollaerän, alkukilometrien/ajon vaikutuksen, merkkitiedon neutraaliuden ilman kalibrointia sekä kerta-/toistuva-/keskeytetty-/päättynyt-kirjausten ja tavoitteiden aikarajauksen.
- 79 Chromium-selainvarmennusta localhostissa. Kuukauden vaihto muutti omaisuuden riviarviota ja korottoman 2 000 euron velan joulukuun saldoarvioksi 1 900 euroa (100 €/kk, lähtöpäivä 1.11.). Alkuperäinen pääoma säilyi. Arviomallin poistaminen palautti kirjatun arvon käyttöön.
- Lokakuussa alkamaton marraskuun sarja ja tulevan joulukuun kertameno eivät näkyneet marraskuun ulkopuolisessa listassa. Raportin oma kuukausi säilyi ylävalikon kuukauden vaihtuessa. Varallisuusraportti käyttää omaa tilannepäivää ja erottaa arvion historiasta.
- Erillinen puhelintarkistus varmisti kategoriaan lukitun automallin, puuttuvat prosenttisyötteet perustilassa, 20 merkin luettelon, käyttövoiman ja lähtökilometrien tallennuksen sekä kuukauden vaikutuksen skenaarion velkapohjaan, vuoden 2025 tuloihin ja omaisuusrivien rajaukseen. Autolomake tarkistettiin kuvakaappauksesta.
- Nykyiset tallennus-, palautus-, demo-, tavoite-, raportti- ja mobiilipolut 320–768 px läpäisivät. Ei sovelluksen JavaScript-/konsolivirheitä tai verkkopyyntöjä. File-käyttöä, ruudunlukijaa tai käyttäjäkoetta ei varmennettu.


## Omaisuuden arvonmuutosmallit 10.11.2026

- TypeScript, ESLint, 99 yksikkötestiä yhdeksässä tiedostossa ja tuotantobuild läpäisivät. JavaScript noin 587 kB; Viten kokohuomautus säilyy.
- Kuusi uutta testiä varmentavat kaikkien mallien ankkuroinnin kirjattuun arvoon, auton ikääntymisen ja ajokertoimen, maa-/markkinamallin, rakennuksen nollan arvo-osuuden, oletusvälin, puuttuvat/virheelliset lähtötiedot ja laskentarajan sekä asetusten JSON-palautuksen ja vanhan tietueen yhteensopivuuden.
- 77 Chromium-selainvarmennusta localhostissa. Arviointimalli vaati vuosimallin ajoneuvolle, laski arvion ja tallensi valinnat; kortin uudelleenavaus palautti vuosimallin 2020. Kirjattu 6 000 euron arvo säilyi.
- Oletuskatselu säilyi ilman syöttökenttiä. Nykyiset velka-, tavoite-, tapahtumakorjaus-, raportti-, demo- ja varmuuskopiopolut sekä 320–768 px mobiilitarkistukset läpäisivät. Ei sovelluksen JavaScript-/konsolivirheitä tai verkkopyyntöjä. File-käyttöä, ruudunlukijaa tai käyttäjäkoetta ei varmennettu.
- Erillinen mobiilitarkistus varmisti asuntomallin rakennusvuoden ja tulevan päivän laskennan sekä kolmen arviomittarin asettelun 390 px leveydessä ilman sivuttaisylivuotoa. Mittarit tarkistettiin kuvakaappauksesta.
- Mallien parametreja ei ole empiirisesti kalibroitu; testi todentaa laskennan ja tallennuksen, ei markkinaennusteen osuvuutta.


## Arvostus, korjausmerkki, velka-arvio ja sijoituspohjat 10.11.2026

- TypeScript, ESLint, 93 yksikkötestiä kahdeksassa tiedostossa ja tuotantobuild läpäisivät. JavaScript noin 580 kB; Viten kokohuomautus säilyy.
- Neljä uutta velkalaskennan testiä varmentavat maksupäivärajan, eräkulujen vaikutuksen vuosikorkoon, lyhentämättömän velan päiväkoron sekä kuun lopun ja virheellisen arvostuspäivän.
- 76 Chromium-selainvarmennusta localhostissa. Velan nollakoron vuosikorkoarvio oli 0 %; eräkulun lisääminen nosti sitä. Omaisuusrivillä oli Omistusosuus-sarake ilman päivämääräsaraketta, ja tuloissa Maksupäivä-otsikko. Kaikki 20 sijoituspohjaa löytyivät ja Nokia avautui esitäytettyyn lomakkeeseen.
- Nykyiset korjaus-, tallennus-, tavoite-, velkalinkki-, demo-, raportti- ja mobiilipolut 320–768 px läpäisivät. Katseluikkunan oletustilassa ei ole laskurin syöttökenttiä. Ei sovelluksen JavaScript-/konsolivirheitä tai verkkopyyntöjä. File-käyttöä, ruudunlukijaa tai käyttäjäkoetta ei varmennettu.
- Erillinen puhelintarkistus varmisti avattavan velkalaskurin leveyden ja skenaarion aloituspainikkeen vierityksen oikeaan laskuriin. Velkakortti tarkistettiin myös kuvakaappauksesta.
- Markkinadataa ei varmennettu: kurssilähdekokeilut palauttivat HTTP 429 ja HTTP 404. Kurssidataa ja historiaa ei lisätty sovellukseen.


## Velkojen rakenne ja tavoitelaskenta 10.11.2026

- TypeScript, ESLint, 89 yksikkötestiä seitsemässä tiedostossa ja tuotantobuild läpäisivät. JavaScript noin 573 kB; Viten kokohuomautus säilyy.
- Kuusi uutta yksikkötestiä kattavat nykyisen säästön vähentämisen, senttipyöristyksen ylöspäin, laskennan molemmat suunnat, eräpäivän rajauksen, kuukauden lopun/karkausvuoden, saavutetun tavoitteen, nollasäästön ja virheelliset/rajan ylittävät syötteet.
- 75 Chromium-selainvarmennusta localhostissa. Velkalistan seitsemän otsikkoa, korko ja kuukausierä tarkistettiin. Linkkikuvakkeen yhteydessä oli omaisuuden kategoriakuva; kuvake avasi omaisuuskortin ja velkakortti nimesi linkitetyn omaisuuden.
- Nykyisellä 500 euron säästöllä ja viiden erän ajalla tavoitteen muuttaminen 1 500 euroon laski kuukausisäästöksi 200 euroa. Kuukausisäästön muuttaminen 100 euroon palautti tavoitesummaksi 1 000 euroa. Molemmat arvot tallentuivat ja näkyivät uudelleen muokkauksessa.
- Työpöydän velkarivi ja puhelimen velkakortti sekä tavoitelomake tarkistettiin kuvakaappauksista. Toimintopainikkeet pysyivät rivin sisällä ja tavoitelomake mahtui 390 px leveyteen.
- Velkojen seitsemän saraketta huomioitiin mobiilitarkistuksissa 320–768 px. Nykyiset raportti-, kompassi-, demo-, tallennus- ja tapahtumakorjauspolut läpäisivät. Ei sovelluksen JavaScript-/konsolivirheitä tai verkkopyyntöjä. File-käyttöä, ruudunlukijaa tai käyttäjäkoetta ei varmennettu.


## Silmäavaus, rivien kohdistus ja budjetin huomiokortit 10.11.2026

- TypeScript, ESLint, 83 yksikkötestiä ja tuotantobuild läpäisivät. JavaScript noin 570 kB; Viten kokohuomautus säilyy.
- 73 Chromium-selainvarmennusta localhostissa. Suljetun talousrivin kuuden solun ylä- ja alareunat täsmäsivät alle 1 px tarkkuudella. Nuolta ja rivilaajennusta ei ole. Silmä avaa katselun Enterillä; Escape sulkee sen ja palauttaa kohdistuksen.
- Tapahtuman summan ja tilan korjaus, automatiikkaan palautus sekä ohitus varmennettiin katseluikkunan erillisestä korjaustoiminnosta. Oletuskatselussa ei ole syöttökenttiä. Kaikkien kuuden listan katselu, muokkaus, poisto, kumoaminen ja pikahaku läpäisivät.
- Budjettirivillä on erillinen silmä ja pienempi lisäyskuvake; leima ”Kirjauksista”, ryhmäluokitus ja ohjerajapoikkeama puuttuvat riviltä. Työpöydän testirivin korkeus oli enintään 66 px. Kategoriakuvake on 22 px ja toimintopainikkeet vähintään 44 px.
- Viimeisestä buildista tarkistettiin lisäksi kuvakaappauksin työpöytärivi, mobiilibudjetti ja huomiokortit. Erillinen selaintarkistus varmisti, että toimintopainikkeet pysyvät rivin sisällä, huomiokortti avaa kategorian ja käytöstä poistettu kategoriaraja ei näytä keksittyä nollaerotusta.
- Huomiokortit näyttävät budjetoidun summan ja ohjerajan poikkeaman erikseen. Ryhmän ja ohjerajan muutos päivittää huomiot. Ohjerajan −100,00 € löytyy kategoriakortista ja oman budjetin −500,00 € säilyy Jäljellä-sarakkeessa.
- Nykyiset 320–768 px ylivuototarkistukset ja pitkien nimien päällekkäisyystarkistus 320/390 px läpäisivät. Ei sovelluksen JavaScript-/konsolivirheitä tai verkkopyyntöjä. File-käyttöä, ruudunlukijaa tai käyttäjäkoetta ei varmennettu.


## Rivilaajennukset ja katseluikkunat 10.11.2026

- TypeScript, ESLint, 83 yksikkötestiä ja tuotantobuild läpäisivät. JavaScript noin 570 kB; Viten kokohuomautus säilyy.
- 72 Chromium-selainvarmennusta localhostissa. Kaikkien kuuden listan katseluikkuna avautuu, sisältää muokkaus-/poistopainikkeet eikä sisällä syöttökenttiä. Katselu ja sulkeminen eivät muuta tallennettua taloutta. Katselusta pääsee nykyiseen muokkauslomakkeeseen.
- Mobiilin rivilaajennus, katseluikkuna ja väljempi budjettikortti tarkistettiin lisäksi kuvakaappauksista 390 px leveydessä.
- Nuolen aria-controls viittaa saman rivin sisällä olevaan sisältöön. Rivien määrä ei kasva lisätietojen avaamisesta; Enter ja välilyönti toimivat edelleen. Tapahtumakohtaiset summa- ja tilakorjaukset läpäisivät.
- Katseluikkunan poisto sulkee ikkunan onnistumisen jälkeen ja kumoaminen palauttaa koko aiemman talouden. Pikahaun tulos avaa yhteisen katseluikkunan.
- Nykyiset 320–768 px ylivuototarkistukset, 44 px toimintopainikkeet ja pitkien nimien päällekkäisyystarkistus 320/390 px läpäisivät. Budjetin ja talouslistojen mobiilikortit säilyivät. Ei sovelluksen JavaScript-/konsolivirheitä tai verkkopyyntöjä. File-käyttöä, ruudunlukijaa tai käyttäjäkoetta ei varmennettu.


## Toistuvuus- ja tilakuvakkeet 10.11.2026

- TypeScript, ESLint, 83 yksikkötestiä ja tuotantobuild läpäisivät. JavaScript noin 565 kB; Viten kokohuomautus säilyy.
- 70 Chromium-selainvarmennusta localhostissa. Toistuvuus vaihdettiin muokkauslomakkeella kaikkien kahdeksan vaihtoehdon läpi ja kunkin rytmimerkintä tarkistettiin. Tuloissa ja menoissa on sama kuvakekomponentti.
- Toteutunut, suunniteltu, ohitettu, eri tiloja sisältävä ja tapahtumaton kuukausi tarkistettiin sovelluksessa. Toistuvuuden selite aukesi Enterillä ja sulkeutui välilyönnillä; suljettu selite oli piilossa ja painallusalue vähintään 44 × 44 px.
- Suljettu esimerkkimenorivi säilyi enintään 56 px korkeana. Nykyiset mobiilitarkistukset 320–768 px, pitkät nimet, tapahtumakohtaiset korjaukset, demo- ja raporttipolut läpäisivät. Ei sovelluksen JavaScript-/konsolivirheitä tai verkkopyyntöjä. File-käyttöä, ruudunlukijaa tai käyttäjien kuvaketulkintaa ei varmennettu.


## Tiiviit listat ja budjetin erotukset 10.11.2026

- TypeScript, ESLint, 83 yksikkötestiä ja tuotantobuild läpäisivät. JavaScript noin 561 kB; Viten kokohuomautus säilyy.
- Kaikki 69 Chromium-selainvarmennusta läpäisivät localhost-ajossa. Ei sovelluksen JavaScript-/konsolivirheitä tai verkkopyyntöjä.
- Kaikissa kuudessa talouslistassa on kuusi saraketta ja avattava lisätietorivi kattaa ne kaikki. Suljetun vuokrarivin korkeus työpöytätestissä oli enintään 56 px. Mobiilien 320–768 px ylivuototarkistukset ja 44 px toimintopainikkeet läpäisivät. Pitkän menonimen ja muokkaus-/poistopainikkeiden suorakulmiot eivät leikanneet 320 ja 390 px leveydessä.
- Säästötavoitteen vaje −600,00 ja välttämättömien liikkumavara +500,00 saivat oikeat värit ja etumerkit. Kategorian ohjerajan −100,00 ja oman budjetin −500,00 säilyivät erillisinä vertailuina. Ohjauspaneeli ei käyttänyt näkyvässä tekstissä ylitys-sanaa.
- Nykyiset tallennus-, palautus-, demo-, tapahtuma-, raportti- ja kompassipolut läpäisivät. File-käyttöä, ruudunlukijaa tai käyttäjien ymmärrystä ei varmennettu.


## Asetukset, tiedonhallinta ja raporttiohjaimet 10.11.2026

- TypeScript, ESLint, 83 yksikkötestiä ja tuotantobuild läpäisivät. JavaScript noin 560 kB; Viten kokohuomautus säilyy.
- Kaikki 67 Chromium-selainvarmennusta läpäisivät localhost-ajossa. Asetusten tiivis demopainike avasi yhteisen neljän talouden valintaikkunan, josta kaikki taloudet ladattiin onnistuneesti. Alkuperäisen selaintallennuksen vienti avattavista lisätyökaluista täsmäsi localStorage-sisältöön eikä muuttanut taloutta.
- CSV:n merkistö ja erotin olivat oletuksena piilossa mutta muokattavissa. Windows-1252-tiedoston epäonnistunut UTF-8-luku avasi lisäasetukset. Windows-1252-valinta palautti ääkköset esikatseluun ja mahdollisti tuonnin, ja asetukset pysyivät auki seuraavaa valintaa varten. Virheelliseen UTF-8-tulkintaan palaaminen esti vahvistuksen. Esikatselun korjaus ei muuttanut taloustietoja.
- Kaikkien tietojen poisto avattiin nimetyltä lisävalinnalta. Pysyvä poisto pysyi estettynä ennen POISTA-tekstiä; poisto ja JSON-palautus läpäisivät. Tuonnin rivivirheet, duplikaattien ohitus ja kumoaminen säilyivät.
- Raportin taulukkomuodossa ei näkynyt zoomausta; kaaviomuodossa historia-taulukko oli piilossa ja zoomaus käytettävissä. Kuukausitilassa ylimääräistä aikaväliotsikkoa ei ollut; aikavälitilan siirtymät ja virherajat läpäisivät.
- 320–768 px ylivuototarkistuksiin lisättiin Asetukset. Kaikki nykyiset mobiili-, raportti-, kompassi- ja tallennuspolut läpäisivät. Ei sovelluksen JavaScript-/konsolivirheitä tai verkkopyyntöjä. File-käyttöä, ruudunlukijaa tai manuaalista käyttäjäkoetta ei varmennettu.


## Raportit ja varallisuuslistojen UX 10.11.2026

- TypeScript, ESLint, 83 yksikkötestiä ja tuotantobuild läpäisivät. JavaScript noin 559 kB; Viten kokohuomautus säilyy.
- Kaikki 65 Chromium-selainvarmennusta läpäisivät localhost-ajossa. Kuvakepohjaisen muokkaustoiminnon 44 × 44 px painallusalue ja Enter-avaus tarkistettiin. Nykyinen tietueiden poisto, vahvistus ja kumoamispolku läpäisi samoilla käsittelijöillä.
- Sijoituksen hankinta-arvo oli rivillä ja avattavassa menetelmäselitteessä 160 euroa, kun hankintahinta oli 80 euroa ja määrä 2. Tavoiterivi näytti 50 % etenemisen toistamatta tavoitteen nimeä.
- Raportin budjettitietokortin kolme yhteistä mittaria ja avattava laskentaselite tarkistettiin. Käsin korjattu toteuma pysyi näkyvissä eikä kadonnut lisätietoihin. Nykyiset raporttivalinnat, kompassi, demot ja varmuuskopioiden palautus läpäisivät.
- 320–768 px ylivuototarkistuksiin lisättiin Omaisuus, Velat, Sijoitukset ja Tavoitteet. Kaikki tarkistukset läpäisivät. Ei sovelluksen JavaScript-/konsolivirheitä tai verkkopyyntöjä. File-käyttöä, ruudunlukijaa tai käyttäjien ymmärrystä ei varmennettu.


## Yhteiset UX-komponentit, yhteenveto ja budjetti 10.11.2026

- TypeScript, ESLint, 83 yksikkötestiä ja tuotantobuild läpäisivät. JavaScript-bundle noin 555 kB; Viten kokohuomautus säilyy.
- Kaikki 64 Chromium-selainvarmennusta läpäisivät localhost-ajossa. Mittarikortin lisätieto avautui/sulkeutui Enterillä ja välilyönnillä. Suunnitelma ja siirrot olivat oletuksena suljettuja ja avattavissa.
- Uusi vertailutesti käytti 500 euron budjettia, 900 euron kirjauksia ja 1000 euron omaa kategoriatoteumaa. Yhteenvedon ja budjetin käyttöaste oli molemmissa 200 %. Palkin arvo rajautui sataan, mutta 200 % säilyi tekstinä. Erillinen kategoriakohtainen ohjerajaylitys oli nimetty ohjerajaksi.
- Nykyiset 320–768 px mobiili-, tumma teema-, kirjaus-, raportti-, kompassi-, demo- ja varmuuskopiopolut läpäisivät. Ei sovelluksen JavaScript-/konsolivirheitä tai verkkopyyntöjä. File-käyttöä, ruudunlukijaa tai käyttäjien ymmärrystä ei tällä ajolla varmennettu.


## Demotalouksien vuodet 2025–2026

- TypeScript, ESLint, 83 yksikkötestiä kuudessa tiedostossa ja tuotantobuild läpäisivät. JavaScript noin 554 kB; Viten kokohuomautus säilyy.
- Uudet testit käyvät kaikista neljästä taloudesta läpi kaikki 24 kuukautta: tulot, menot, budjetit ja käytettyjen menokategorioiden budjettikattavuus. Kaikissa kuudessa tietolajissa on vähintään yksi tietue ja tallennettuja skenaarioita on kaksi. Kaikkien talouksien JSON-varmuuskopioiden roundtrip läpäisi.
- Tulokatkos alkaa 2026-08. Tulevia päivämääriä ei lasketa toteumiksi, kattavuusvahvistuksia ei anneta tuleville kuukausille ja aineiston ulkopuolinen avaus rajautuu esimerkkijaksoon. Palkkapäivien, kausivaihtelun ja kuukausisuunnitelman yhteys kompassin aikajanaan tarkistettiin.
- Kaikki 63 Chromium-selainvarmennusta läpäisivät localhost-ajossa. Kaikki neljä taloutta ladattiin ja niiden kahden vuoden aineisto tarkistettiin. Ladatun kriisitalouden Tulot-, Menot-, Budjetti-, Omaisuus-, Velat-, Sijoitukset-, Tavoitteet- ja Skenaariot-näkymissä oli näkyviä taulukkorivejä; raporttipaneeli ja kompassin 24 kuukausipylvästä näkyivät.
- Nykyiset 320–768 px responsiivisuus-, kompassi-, vienti-/palautus- ja raporttipolut läpäisivät. Ei sovelluksen JavaScript- tai konsolivirheitä eikä verkkopyyntöjä. File-käyttöä ei tässä ympäristössä varmennettu. Aineisto on fiktiivinen, eikä sen taloudellista edustavuutta väestöön nähden ole tutkittu.


## UX:n priorisointimalli: ensimmäinen soveltamiskierros

TypeScript, ESLint, 77 yksikkötestiä ja tuotantobuild läpäisivät. Kaikki 62 Chromium-selainvarmennusta läpäisivät localhost-ajossa. Yhteinen ohje näyttää oletuksena vain otsikon; Enter ja välilyönti avaavat/sulkevat sisällön. Piilotus ja palautus säilyivät. Budjetin laskentaselitys ja kompassin perustelu varmennettiin sekä suljettuna että avattuna. Nykyiset sääntöjen muokkaus-, kompassitoiminto-, vienti-/palautus- ja 320–768 px mobiilipolut läpäisivät. Ei sovelluksen JavaScript-/konsolivirheitä tai verkkopyyntöjä. File-käyttöä tai käyttäjien ymmärrystä ei tällä testillä varmennettu; JavaScriptin kokohuomautus säilyy (noin 550 kB).


## Yhteiset pääpaikat ja kirjauslomake

- TypeScript, ESLint, 77 yksikkötestiä ja tuotantobuild läpäisivät. JavaScript-bundlen kokohuomautus säilyy (noin 550 kB).
- Kaikki 62 Chromium-selainvarmennusta läpäisivät localhost-ajossa. Lisäys ja muokkaus varmennettiin samalla lomakkeella: viikkotoisto, loppupäivä, tunniste, monirivinen kuvaus sekä alkuperäinen ID säilyivät tallennuksen ja uudelleenavauksen yli. Tapahtumakohtaisten summapoikkeusten säilyminen varmennettiin sarjan muokkauksessa.
- Budjetin kokonaistoteuman korjaus varmennettiin kategoriakortin lisävalinnasta; päätaulukossa ei ole toista toteuman syöttökenttää. Tulot/Menot-näkymissä on vain tiivis raamitila ja linkki täyteen budjettiin. Varmuuskopio haettiin Asetusten linkistä Tuonti ja vienti -näkymään, minkä jälkeen JSON-vienti ja palautus läpäisivät.
- Mobiilileveydet 320–768 px, tumma tila ja nykyiset raportti-/kompassipolut läpäisivät. Ei JavaScript- tai konsolivirheitä eikä sovelluksen verkkopyyntöjä. File-käyttöä ei tässä ympäristössä varmennettu.


## 50/30/20 ja kategoriakohtaiset raamit

- TypeScript, ESLint, 77 yksikkötestiä viidessä tiedostossa ja tuotantobuild läpäisivät.
- Uudet laskentatestit kattavat 1500/900/600-jaon 3000 euron tulosta, tulevat ja ohitetut tapahtumat, nollatulot, budjetin ja tapahtumien kaksoislaskennan eston, käsin syötetyn toteuman ja säästösiirtojen erottelun, luokittelemattomat kategoriat, omat kategoriarajat, vanhan tiedon migraation ja JSON-palautuksen sekä kompassin konkreettisen menotarkistuksen.
- Kaikki 62 Chromium 155 -selainvarmennusta läpäisivät localhost-ajossa. Uusi polku muuttaa kategoriaryhmää ja rajaa, tarkistaa poikkeaman poistumisen/palaamisen sekä estää jaon, jonka summa ei ole 100 %. Yhteinen näkymä varmennettiin budjetissa, tuloissa ja menoissa.
- Responsiiviset 320–768 px tarkistukset, nykyiset kompassi-, raportti-, nimeämis- ja varmuuskopiopolut läpäisivät. Ei sovelluksen JavaScript- tai konsolivirheitä eikä verkkopyyntöjä.
- File-käyttöä ei tässä ympäristössä varmennettu. Viten kokohuomautus säilyy (JavaScript noin 550 kB); build onnistui. Suositusten henkilökohtaista sopivuutta tai säästövaikutusta ei testattu. Tulokset: `qa/e2e-results.json`.


## Budjetin kuvakkeet 9.11.2026

TypeScript, ESLint ja tuotantobuild läpäisivät. Kaikki 61 Chromium-selainvarmennusta läpäisivät; lisätarkistukset mittaavat kategoriakuvakkeen kehyksen (32 × 32 px), näkyvän kuvan (vähintään 20 × 20 px) ja tekstittömän menokuvakepainikkeen 44 px leveyden. Kuvakkeeseen osunut tekstin flex-venytys rajattiin pois.

## Budjetin kategoriakortit 9.11.2026

TypeScript, ESLint, 69 yksikkötestiä ja tuotantobuild läpäisivät. Chromium 155:n localhost-ajossa kaikki 61 selainvarmennusta läpäisivät: uusi testi avaa budjettikategorian menokortin, tarkistaa sen kuukauden tapahtuman ja summan sekä aloittaa samasta kategoriasta toistuvan kirjauksen. Nykyiset 320–768 px responsiivisuustarkistukset läpäisivät. Ei sovelluksen JavaScript-/konsolivirheitä tai verkkopyyntöjä. File-käyttöä ei tässä ajossa varmennettu. Buildin JavaScript-kokohuomautus säilyy (noin 535 kB).


## Käyttäjätestauksen kirjauspolut 9.11.2026

- `npm run typecheck`, `npm run lint`, 69 Vitest-testiä, `python -m py_compile e2e.py` ja `npm run build` läpäisivät. Build tuotti päivitetyn itsenäisen juuren `index.html`-tiedoston. Minifioitu JavaScript (noin 533 kB) ylittää Viten 500 kB:n huomautusrajan; build onnistui.
- Chromium 155.0.8059.79: kaikki 60 selainvarmennusta läpäisivät localhost-ajossa. Uudet polut tarkistavat puuttuvien kategorioiden näkyvyyden, nopeat kirjaukset, budjettikategoriasta aloittamisen, kerta-/toistuvan tulon ja menon, automaattisen tilan käyttöliittymäpolun, pyhäpäiväsiirron asetuksen sekä yksittäisen esiintymän manuaalisen tilan.
- Yksikkötestit kattavat päiväperusteisen tilan, ohitukset, vanhan datan kenttämigraation, oletuskategorioiden täydentämisen sekä viikonloput ja suomalaiset pankkipyhät, myös vuodenvaihteen yli. E2E kattaa lisäksi varmuuskopion pyöreän matkan, raportit, kompassin ja 320–768 px mobiilileveydet.
- Selaimessa ei havaittu JavaScript- tai konsolivirheitä eikä sovelluksen verkkopyyntöjä. `file://`-avausta ei ympäristön selainkäytännön vuoksi varmennettu. Tulokset: [`qa/e2e-results.json`](qa/e2e-results.json).
- Automaattinen toteumatila on päivämäärään perustuva oletus, ei pankkitapahtuman vahvistus. Etuuden maksupäivän käytäntö voi poiketa sovelluksen yleisestä pyhäpäiväsäännöstä.

## Puskuristressi ja lainaerän erittely 9.11.2026

- `npm run typecheck`, `npm run lint`, `npm test`, `python -m py_compile e2e.py` ja `npm run build` läpäisivät. Vitestissä 66 testiä neljästä tiedostosta.
- Chromium 155.0.8059.79: kaikki 60 selainvarmennusta läpäisivät localhost-ajossa. Uusi polku tallensi oman välttämättömien menojen arvion myös tyhjästä aloitustilasta ja tarkisti kolmen kuukauden tulokatkoksen puskuritarpeen. Velanmaksunäkymän testi varmisti koron, pääoman lyhennyksen ja jäljelle jäävän saldon.
- Ei sovelluksen JavaScript- tai konsolivirheitä eikä verkkopyyntöjä. Responsiivisuus tarkistettiin 320–768 pikselissä. `file://`-avausta ei ympäristön selainkäytännön vuoksi varmennettu.
- Standalone-build päivittyi. Minifioitu JavaScript on noin 528 kB ja ylittää Viten 500 kB:n huomautusrajan; build onnistui. Tulokset: [`qa/e2e-results.json`](qa/e2e-results.json).
- Puskuristressi on omaan dataan perustuva skenaario, joka ohittaa keskeneräisen kuukauden ja käyttää enintään kuutta vahvistettua tulokuukautta. Lainaerittely on nykytilasta tehty kuukausiarvio, ei toteutuneiden erien kirjanpito.

## Menotyyppien ja kuukausikattavuuden varmistus 9.11.2026

- `npm run typecheck`, `npm run lint`, `npm test`, `python -m py_compile e2e.py` ja `npm run build` läpäisivät. Vitestissä 64 testiä neljästä tiedostosta.
- Chromium 155.0.8059.79: kaikki 58 selainvarmennusta läpäisivät localhost-ajossa. Uusi polku vahvisti nollamenokuukauden ja varmisti, että kuukausi menettää vahvistuksen, kun siihen lisätään kirjaus.
- Ei sovelluksen JavaScript- tai konsolivirheitä eikä verkkopyyntöjä. Leveydet 320–768 px eivät aiheuttaneet ylivuotoa. `file://`-avausta ei ympäristön selainkäytännön vuoksi varmennettu.
- Tuotantobuild ja standalone-`index.html` päivittyivät. Minifioitu JavaScript on noin 523 kB ja ylittää Viten 500 kB:n huomautusrajan; build onnistui. Tulokset: [`qa/e2e-results.json`](qa/e2e-results.json).

## CSV-tuonnin selkeytys 9.11.2026

- `npm run typecheck`, `npm run lint`, `npm test`, `python -m py_compile e2e.py` ja `npm run build` läpäisivät. Vitestissä 61 testiä neljästä tiedostosta.
- Chromium 155.0.8059.79:n localhost-ajossa läpäisi 57 selainvarmennusta. CSV-polku varmisti suomenkielisten pankkiotsikoiden automaattikartoituksen, suppean perustietonäkymän, lisäkenttien piilotuksen, päivämäärättömän tiedoston tuonnin eston, negatiivisen menon normalisoinnin, positiivisen tulorivin ohjauksen sekä virhe- ja duplikaattirivien käsittelyn.
- Ajo ei tuottanut JavaScript- tai konsolivirheitä eikä ulkoisia verkkopyyntöjä. Mobiilileveydet 320–768 px eivät aiheuttaneet vaakasuuntaista ylivuotoa. Tuotantobuild läpäisi; minifioitu JavaScript on noin 519 kB ja ylittää Viten 500 kB:n huomautusrajan.
- Testiraportti: `qa/e2e-results.json`. `file://`-avaaminen on tässä ympäristössä estetty, joten tämä ajo varmisti sovelluksen localhost-HTTP-palvelun kautta.

## Syöttö ja raportointi 9.11.2026

- `npm run typecheck`, `npm run lint`, `npm test`, `python -m py_compile e2e.py` ja `npm run build` läpäisivät. Vitestissä 58 testiä neljästä tiedostosta.
- Chromium 155.0.8059.79:n paikallisessa HTTP-ajossa läpäisi 56 selainvarmennusta. Uudet polut tarkistavat nopean tulokirjauksen, saman lomakkeen tyhjentymisen seuraavaa kirjausta varten, toistuvan menon toteutuneen aloituspäivän ja suunnitellut tulevat esiintymät, raporttitaulukon suodatuksen/lajittelun sekä nykytilaraporttien aikarajauksen.
- Ajo ei tuottanut JavaScript- tai konsolivirheitä eikä ulkoisia verkkopyyntöjä. Mobiilileveydet 320–768 px eivät aiheuttaneet vaakasuuntaista ylivuotoa. Testiraportti: `qa/e2e-results.json`.
- Tuotantobuild läpäisi. Bundlen minifioitu JavaScript ylittää Viten 500 kB:n huomautusrajan (noin 516 kB); build ei epäonnistunut.
- Selain testattiin localhost-palvelun kautta. `file://`-osoitteen suora avaaminen on tässä ympäristössä hallintakäytännöllä estetty, joten sitä ei tässä kierroksessa varmennettu.

## UX- ja summapoikkeusten varmennus 6.–7.11.2026

- TypeScript-tarkistus, ESLint ja 58 Vitest-testiä läpäisivät.
- Standalone-build läpäisi; tuotettu `index.html` sisältää käyttöliittymäpäivitykset.
- Chromium E2E: 55 selainvarmennusta läpäisi. Polut tarkistavat kategorioiden näppäimistövalinnan, esiintymän tilan ja summan vaihtamisen ilman sarjan oletusten muuttumista, budjetoidun ja budjetoimattoman kulutuksen erottelun sekä CSV:n tila- ja summapoikkeusten roundtripin.
- Ei JavaScript- tai konsolivirheitä eikä sovelluksen verkkopyyntöjä. Loopback-HTTP-ajossa selaimen verkkotila oli sallittu localhostille; sovellus ei tehnyt ulkoisia pyyntöjä.
- Näppäimistö- ja ruudunlukijakäyttöä ei auditoitu kattavasti. `file://`-tallennusta ei tässä selainajossa varmennettu.

## Lisävarmennus 5.11.2026: kompassin päätössäännöt

- TypeScript-tarkistus ja ESLint läpäisivät; Vitestissä läpäisi 53 testiä neljästä tiedostosta.
- `npm run build` läpäisi ja tuotti päivitetyn itsenäisen `index.html`-tiedoston.
- `python -m py_compile e2e.py` läpäisi. Päivitetty selainpolku suoritettiin system Chromium 155:llä paikallisen HTTP-palvelimen kautta: kaikki 54 varmennusta läpäisivät, mukaan lukien kompassin aihekohtainen suodatus. Selaimessa ei havaittu JavaScript- tai konsolivirheitä eikä sovelluksen verkkopyyntöjä. `file://`-navigointi on edelleen ympäristön selainkäytännöllä estetty.
- Uudet yksikkötestit tarkistavat asumisosuuden rajauksen, vertailun oman kuluhistorian perusteella, FIRE-nostojen lähderajauksen, neuvontavinkin sekä `Ei onnistu nyt` -tilan tallentumisen ja määräajan. Käyttöliittymän testiin lisättiin myös siirto-, palautus- ja manuaalisen uudelleenarvioinnin polut.

## Suoritetut tarkistukset

- TypeScript strict `tsc --noEmit`, ESLint ja 37 Vitest-testiä läpäisivät.
- Vite production build ja standalone-jälkikäsittely tuottivat juureen itsenäisen `index.html`-tiedoston (noin 396 kB).
- Standalone-build varmistaa, että CSP lisätään tuotettuun HTML:ään eikä dokumenttiin jää ulkoisia script/link-tageja. Tailwind-luokat ja Lucide-kuvakkeet ovat mukana samassa bundle-tiedostossa.
- Playwrightillä suoritettiin 35 selainvarmennusta system Chromium 155:llä tuotetusta standalone-HTML:stä paikallisen localhost-palvelun kautta. Kaikki pääpolut läpäisivät, eikä JavaScript-, console- tai ulkoisia verkkovirheitä havaittu.
- Responsiivinen testi tarkisti yhteenvedon, budjetin, menot, skenaariot, raportit ja tuonnin/viennin 320, 375, 390, 600, 760 ja 768 pikselissä. Sivun leveys tai taulukkosäiliö ei ylittänyt näkymää, ja taulukkokortit aktivoituivat pienissä leveyksissä.
- `e2e.py` kattaa ohjelaatikon piilotuksen/palautuksen, summapikanapit, rivin näppäimistöavauksen, raportin jakson/kaavion/zoomin, valittavat raporttitietokortit sekä talousdatan vienti-, tuonti- ja palautuspolut. Tulokset ovat `qa/e2e-results.json`-tiedostossa.
- Suora `file://`-navigointi on hallitussa Chromiumissa estetty selaimen ylläpitokäytännöllä, joten tässä ajossa ei varmennettu offline-tilaa tai `file://`-tallennusta. Aiempi `qa`-ajon file/offline-tulos edeltää nykyisiä interaktioita ja ulkoasua.

## E2E:n sisältö

Suoritetussa E2E-ajossa: tyhjä aloitus; ohjeen piilotus/palautus; summa-pikanapit; tulo; toistuva meno; Enter/Space-avattava rivitieto; menon muokkaus; budjetin tallennus; omaisuus; velka; sijoitus; tavoite; kassavirta ja nettovarallisuus; kategorian nimeäminen; tumma tila ja summien piilotus; Ctrl K/Escape; kolme skenaariota; raportin ajanjakso, zoom ja kaaviot; valittavat raporttitietokortit; välilehtien näppäimistö; kuuden reitin responsiivisuus; selaimen uudelleenkäynnistys samalla profiililla; JSON-vienti; CSV-vienti/-tuonti ja virhe-/duplikaattiohitus; kumoaminen; poisto; JSON-palautus; virheellisen varmuuskopion hylkäys.

Ei sovelluksen verkkopyyntöjä, pageerror-virheitä tai console-error-viestejä tallennetussa aiemmassa ajossa. Nykyinen standalone-build säilyttää inline-tyylit, -kuvat ja -skriptin; staattinen lähdetagitarkistus ei korvaa selaimen verkkopyyntöjen mittausta. Selaimen taustapalvelujen liikennettä ei mitattu järjestelmätasolla.

## Yksikkötestit

Senttiparsinta, virheelliset luvut, kassavirta, käyttövara, säästöaste, nettovarallisuus, budjetti, hätävara, arvonalenema, tavoitteen kesto, velanmaksu, korkoa korolle, kulut, inflaatio, kuukausien loput, karkauspäivät, viikkotoistot, kuukausivälit, keskeytys, päivämäärävalidointi, JSON roundtrip/eheys/versio/prototyyppisuoja, CSV lainaus/rivinvaihdot/kaavasuoja/roundtrip/päivämuoto, storage roundtrip/poisto/ristiriita/kiintiö/esto.

## Mitä ei testattu

Edge, Firefox, Windows-työpöydän kaksoisklikkaus, fyysinen internetin katkaisu, kaikki neljä teemaa kattavasti, yksityinen selaus eri selaimissa, Excelin CSV-käyttäytyminen, ruudunlukija, täydellinen näppäimistöpolku, suorituskyky tuhansilla tietueilla, riippuvuuksien auditointi ja puhdas npm-asennus toisella koneella. React Testing Library -komponenttitestejä ei ole.

Pysyvän profiilin testaus epäonnistui aluksi ympäristön /mnt/data-tiedostojärjestelmään sijoitetulla selainprofiililla. Sama testi onnistui paikallisessa tilapäisessä profiilihakemistossa. Tämä oli testiprofiilin sijaintiin liittyvä ympäristörajoitus, ei syy muuttaa sovelluksen file://-jakelua.

## V1-hyväksyntä

Laajan alkuperäisen määrittelyn Definition of Done ei täyty. Toimitus on 0.1.0 ensimmäinen toimiva käyttöversio. Testilokit ja E2E-tulos löytyvät `qa/`-hakemistosta.
