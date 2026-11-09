# Oman talouden ja FIRE-laskennan toteutussuunnitelma

**Tila: ehdotus, ei toteutettu.** Päiväys 3.11.2026. Perusta: [ominaisuuskartoitus](FEATURE_RESEARCH.md) ja [lähteet](RESEARCH_SOURCES.md). Vaiheet ja riippuvuudet: [roadmap](ROADMAP.md). Nykyiset laskurit säilyvät nykyisinä, kunnes erillinen toteutus ja testit hyväksytään.

## 1. Rahavirrat ja varallisuus ennen FIRE-lukuja

Ehdotetut erilliset käsitteet ovat tilin tapahtuma, kulutus, tulovirta, sisäinen siirto, sijoitusosto/myynti, velan korko/kulu ja pääoman lyhennys. Pelkkä kategorian nimi ei saa ratkaista tapahtuman taloudellista luonnetta. Tapahtuman ja saldon yhteys on jäljitettävä; vanha manuaalinen saldo ei muutu automaattisesti tapahtumista johdetuksi ilman alkusaldoa ja täsmäytystä.

Esitä rinnakkain:

- Kulutusperusteinen ylijäämäaste = (käytettävissä olevat nettotulot − kulutus) / nettotulot. Kulutus sisältää korot ja maksut, ei sisäisiä siirtoja eikä velkapääoman lyhennystä.
- Kohdistetut säästö-/sijoitusvirrat ja velkapääoman lyhennykset erillisinä euroina. Ne eivät välttämättä vastaa ylijäämää samalla jaksolla, jos alkukassaa käytetään tai lainaa nostetaan.
- Nettovarallisuuden muutos = loppuvarat − loppuvelat − (alkuvarat − alkuvelat). Arvostusmuutokset erotetaan rahavirroista.
- Maksuvalmius tilikohtaisesta kassakalenterista; lainan koko maksu vähentää rahaa, vaikka vain korko/kulut kuuluvat kulutukseen.

Tulojen on kerrottava, ovatko ne nettoa vai bruttoa. Negatiivisilla tai nollan nettotuloilla prosenttimittari näytetään tässä mallissa ei laskettavissa; eurot säilyvät. Satunnaistulot ja kulutuspiikit saa sisällyttää tai näyttää erikseen, mutta rajaus näkyy luvun vieressä.

**Hyväksyntäesimerkki:** nettotulot 3 000 €, kulutus 2 000 €, sisäinen sijoitussiirto 500 € ja pääomalyhennys 200 €: ylijäämä 1 000 €, ylijäämäaste 33,3 %, sijoitusvirta 500 €, pääomalyhennys 200 € ja kohdistamaton kassalisäys 300 €. Varallisuuden siirto tililtä toiselle ei muuta nettovarallisuutta. Sijoitusosto ei vielä ole sijoitustuottoa. Sama lainaerä ei synny toistosta ja maksusta kahdesti.

## 2. Puskuri ja suunnittelun havaintopohja

Käyttäjä valitsee tarkasteluun 1/3/6/12 täyttä kuukautta tai oman perustellun menoarvion. Näytetään kattavuus: vahvistettuja kuukausia / valitut kuukaudet. Tyhjä kuukausi vaatii käyttäjän vahvistuksen ennen kuin se tulkitaan nollakulutukseksi. Nykyistä kuukautta ei käsitellä kokonaisena. Vuosittaiset vakuutukset ja muut tiedossa olevat menot jaksotetaan varauksiksi; ne eivät saa kasvattaa kulutusta toiseen kertaan maksukuussa.

Puskurikuukaudet = vapaasti käytettävä likvidi puskuri / keskimääräinen välttämätön kuukausikulutus. Nollanimittäjällä ei ääretöntä turvaa vaan puuttuva arvio. Käyttäjä valitsee puskuritavoitteen ja tulokatkosstressin; ei yhtä tutkimuksen takaamaa kuukausimäärää. Puskurin varaus vähennetään käytettävissä olevasta FIRE-pääomasta vain kerran.

Nykyinen stressiskenaario sallii oman menotason sekä 0–100 % tulonmenetyksen 1/3/6/12 kuukaudeksi. Se käyttää enintään kuuden vahvistetun kuukauden keskituloa, olettaa saman menetyksen kaikille tulolähteille eikä mallinna veroja, tukia tai maksujen järjestystä. Tulos ei ole ennuste eikä puskuritavoite.

## 3. FI-tavoitteen ensimmäinen deterministinen versio

Tarvittavat syötteet: suunnitelman aloitus, käyttäjän suunnitteluhorisontti, nykyinen sijoituskelpoinen pääoma, vuosikulutus, säästövirrat, erilliset tulevat tulot ja alkamisajat, kulut, inflaatio, veromallin rajaus ja käyttäjän valitsema alkunostoprosentti. Nykyinen asunto tai auto ei oletuksena rahoita nostoja. Jokainen omaisuuserä kohdistetaan kerran; asunto voidaan ottaa mukaan eksplisiittisellä realisointitapahtumalla, jonka myyntikulut ja uusi asumismeno näkyvät.

Yksivaiheinen havainnollistus nykyrahassa:

- E = vuosikulutus ja muut salkusta katettavat menot, esimerkiksi arvioidut nostoverot.
- I = samalla aikavälillä saatava toistuva nettotulo salkun ulkopuolelta. Salkun osinkoa ei lasketa sekä kokonaistuottoon että I:hin.
- G = max(0, E − I), vuosittainen rahoitusvaje.
- Tavoite = G / w, jossa w on käyttäjän alkunostoprosentti desimaalina ja w > 0.
- Kattavuus = FIRE-pääoma / tavoite; nollavajeella näytetään ”ei rahoitusvajetta tässä vaiheessa”, ei ääretöntä prosenttia.

**Esimerkki, ei suositus:** menot 30 000 €/v, muut nettotulot 6 000 €/v, verot/erilliskulut tässä esimerkissä 0 ja w = 0,04 → vaje 24 000 €/v, tavoite 600 000 €. Pääoma 150 000 € → kattavuus 25 %. Muilla samoilla oletuksilla w = 0,03 → 800 000 € ja w = 0,05 → 480 000 €. Nämä eivät ole turvallisuusluokituksia. 25 × menot pätee vain 4 %:iin ja kyseiseen rahoitusvajeen määritelmään.

FI-aika on ensimmäinen mallijakso, jolla kertynyt pääoma täyttää määritellyn tavoitteen. Se on ehdollinen laskelma, ei luvattu päivämäärä. Jos tavoite ei täyty valitulla horisontilla, näytetään ”ei saavuta näillä oletuksilla”. Malliin ei lisätä takautuvasti tulevaa eläkettä varhaisen eläkevaiheen tuloksi. Vaihtuva eläke-/osa-aikatulo vaatii vaiheistetun mallin; yksinkertainen G/w ei riitä.

## 4. Elinkaaren vaiheet ja nostovertailu

Mallinna vähintään työ/säästäminen, osa-aikatyö, eläkettä edeltävä salkkurahoitus ja eläkkeen jälkeinen rahoitus. Käyttäjän eläke-ennuste syötetään lähteen, päivämäärän, raha-arvon (reaali/nominaali), netto/brutto-tilan ja alkamisajan kanssa. Horisontti on käyttäjän valinta; lyhyempi kuin tutkimuksen esimerkkijakso ei saa tulla piilo-oletuksena. Esitä myös horisontin pidentämisen vaikutus.

Ensimmäinen versio laskee kuukausittain. Kirjaa yksiselitteisesti tapahtumajärjestys: kuun alun kulutus, ulkopuoliset tulot, vajeen rahoittava nosto ja verot, jäljelle jäävän salkun tuotto/kulut, kuun lopun sijoitus. Negatiivista salkkua ei sallita; kattamaton meno kirjataan vajelaskuriin. Sama tuotto- ja nostoaikataulu koskee kaikkia vertailtavia strategioita.

Vertaa kiinteää inflaatiokorjattua euromäärää, kiinteää prosenttia kulloisestakin salkusta ja myöhemmin kulutusrajoihin sidottua joustoa. Prosenttinosto voi välttää matemaattisen nollautumisen mutta alittaa elämiseen tarvittavan määrän. Raportoi siksi erikseen pääoman loppuminen, välttämättömän kulutuksen vaje, leikkausten suuruus/kesto ja loppupääoma. Lean/Fat ovat eri menobudjetteja, Barista lisää ajallisesti rajatun työtulon, Coast lopettaa lisäsäästämisen ennen nostovaihetta; kaikki käyttävät samaa laskentamoottoria.

## 5. Epävarmuus, verot ja sijoitustieto

Aloita herkkyyksistä: matalampi tuotto, korkeampi inflaatio, kulujen nousu, työttömyys, korkoshokki, suuri kertameno ja pidempi elinikä. Tuottojärjestysesimerkissä samat jaksotuotot permutoidaan: ilman virtoja geometrinen loppuarvo on sama, nostojen kanssa ero on sallittu ja selitetään. Älä käytä aritmeettista keskituottoa korkoa korolle -tuottona.

Historialliseen simulointiin kirjataan markkina, ajanjakso, osingot/kokonaistuotto, valuutta, inflaatio, allokaatio, tasapainotus ja puuttuvat havainnot. Raportoi valitun horisontin täydellisten jaksojen määrä ja päällekkäisyys. Monte Carlo tarvitsee malliversion, satunnaissiemenen, polkumäärän, korrelaatio- ja jakaumaoletukset sekä parametrien epävarmuuden käsittelyn. Onnistumisosuus nimetään mallin tulokseksi, ei henkilökohtaiseksi takeeksi. Aineistoton demo käyttää selvästi merkittyä synteettistä dataa.

Suomen veromalli on oma tarkistettava moduulinsa: voimassaolovuosi, viranomaislähde ja tarkistuspäivä; realisoitu voitto ei ole sama kuin nosto. Nettotulona syötettyä eläkettä ei veroteta uudelleen. Ensin voidaan julkaista käyttäjän syöttämään verovaraukseen perustuva rajattu malli; se ei väitä laskeneensa tarkkaa veroa. Monivaluutta ja verotilien erityissäännöt tulevat vasta erillisen määrittelyn jälkeen.

## 6. Tietomalli ja hyväksyntäportit

Ehdotetut uudet erilliset mallit: Account, CashTransaction, Transfer, DebtPayment, ValuationSnapshot, InvestmentTransaction, CashflowPhase, RetirementIncome, TaxAssumptions, FIPlan ja SimulationRun. Malleissa tarvitaan pysyvät tunnisteet, päivämäärät, yksiköt, tiedon lähde ja oletusten versio. Simulointitulos viittaa muuttumattomaan syötekopioon; muokattu suunnitelma merkitsee aiemman tuloksen vanhentuneeksi. Nämä eivät ole nykyisen skeeman kenttiä.

Ennen toteutuksen hyväksyntää tarvitaan laskentaspesifikaatio, skeemamigraatio, JSON/CSV-yhteensopivuus ja palautus vanhasta varmuuskopiosta. Varatut `investmentTransactions`-listat eivät vielä tarkoita tapahtumatukea.

| Portti | Vähimmäisnäyttö |
| --- | --- |
| Rahavirrat | Edellä kuvattu 3 000 € esimerkki, siirron nettovaikutus nolla, lainan koron ja lyhennyksen erottelu, toiston/toteuman kaksoiskirjauksen esto |
| FI-peruslaskenta | 600 000 €/25 % esimerkki, nollavaje, w ≤ 0 hylätään, nollapääoma, negatiivinen tuotto, tavoite ei täyty, puskurin ja asunnon rajaus |
| Elinkaari | Eläkkeen alkamisraja, vaiheiden katveet/päällekkäisyydet, inflaatiomuunnos, netto/brutto ja nostoveron kaksoislaskennan esto |
| Nostot | Nollatuoton käsin laskettava polku, tuottojärjestyskoe, salkun loppuminen, välttämättömän kulutuksen alitus myös positiivisella salkulla |
| Simulaatio | Sama siemen ja syötteet → sama tulos; eri strategioille samat polut; aineiston rajaus, nykyisen ajon tulostunniste ja mallirajoitteet näkyvät |
| Käyttö ja data | Nykyiset testit, uusi domain-/integraationäyttö, vanhan backupin migraatio, offline-HTML, näppäimistö- ja ruudunlukijapolku; ei verkon pakollisuutta |

Tämä suunnitelma ei itsessään lisää testejä tai muuta nykyisiä laskentatuloksia.
