# Tietoturva

## Selain ja tietojen käsittely

- Käyttäjän teksti esitetään Reactin tekstisolmuina. PDF.js lukee PDF:n tekstikerroksen selaimessa eikä suorita dokumentin JavaScriptiä, linkkejä tai liitteitä.
- JSON-tuonti ja sovellustila validoidaan Zodilla ja domain-tarkistuksilla. `__proto__`, `constructor` ja `prototype` hylätään. JSON on enintään 10 Mt; rivimäärille ja yksittäisille kentille on kokorajoja.
- Kirjautumattoman käyttäjän talous on muistissa eikä pysyvässä selainvarastossa. Supabase-istunto tallennetaan selaimeen. Sovelluksen asetuksissa voi yhä olla käyttöliittymän tai vanhan tallennuksen tietoja.
- CSP rajaa verkkopyynnöt Supabaseen ja sovelluksen Cloudflare Workeriin. Ulkoisia skriptejä, fontteja tai CDN:iä ei ladata.

## Supabase ja perhetili

- Selain sisältää vain Supabasen publishable-avaimen. Service-role- tai muuta ylläpitoavainta ei saa viedä selainkoodiin.
- Perhetaulut ovat `family_private`-skeemassa, johon selainrooleilla ei ole tauluoikeuksia. RLS on päällä puolustukseksi. Selaimen RPC-kutsut tarkistavat kirjautumisen ja perheen jäsenyyden; kutsun luonti, lunastus, jäsenyys ja kirjoitukset kulkevat rajattujen funktioiden kautta.
- Ylläpitäjäroolia ei hyväksytä käyttäjän muokattavista profiilimetatiedoista. Kutsukoodi tallennetaan tietokantaan tiivisteenä, se vanhenee 24 tunnissa ja palvelin rajoittaa luontia sekä lunastusyrityksiä.
- Perheen tallennus käyttää palvelimen revisiota ja lukitusta, jotta vanha muutos ei hiljaisesti korvaa uutta. Jäsenyystestit kahdella erillisellä oikealla käyttäjällä ja kutsukilpailun testaus puuttuvat.
- Perheen JSON-dokumenttia validoidaan selaimessa ennen tallennusta. Uuden formaatin eheystarkistus kestää JSONB:n avainten uudelleenjärjestelyn. Vanha formaatti voi vaatia vahvistuksen, koska sen FNV-tarkistussummaa ei aina voi palauttaa avainjärjestyksen muututtua. FNV-1a-32 ei ole kryptografinen eikä estä tahallista muuttamista.
- Perheen poisto, ylläpitäjyyden siirto ja käyttäjätilin poisto on toteutettu lähdekoodissa. Käyttäjätilin Edge Function tarkistaa istunnon palvelinpuolella ja voi poistaa vain kutsuvan käyttäjän; Supabase secret -avain ei päädy selaimeen. Tietokantatriggeri siirtää viimeisen ylläpitäjän roolin vanhimmalle jäljelle jäävälle jäsenelle tai poistaa perheen viimeisen jäsenen mukana. Uusi migraatio ja Edge Function eivät vielä ole tuotantopalvelussa.

## Tekoäly ja PDF:t

Laskun PDF luetaan selaimessa. Analyysi ei käynnisty avaimen läsnäolon tai PDF:n valinnan perusteella: käyttäjä painaa erillistä lähetyspainiketta. Ennen sitä hän voi avata poimitun tekstin esikatselun. Lähetetty teksti kulkee Cloudflare Workerin ja OpenRouterin kautta. Sovellus ei voi valvoa Worker- tai mallipalvelun omaa säilytyskäytäntöä, kustannuksia tai edelleenreititystä.

Kuittien AI-kategorisointi lähettää tuotenimiä ja kategoriavaihtoehtoja. Paikallisen jäsennyksen epäonnistuessa kuittitekstiä voidaan lähettää varareitille rajattuna. Pyyntöjen vastaukset validoidaan, mutta käyttäjä tarkistaa AI:n ehdotukset ennen kirjausta. API-avain on välilehden istunnossa eikä talousvarmuuskopiossa.

## Avoimet tarkistukset

- Google-palveluntarjoaja on Supabasessa aktiivinen ja tuotanto-osoitteen OAuth-aloitus ohjautuu Googleen. Oikeaa kirjautumista ja paluuta sovellukseen ei ole varmennettu erillisellä käyttäjätilillä. Apple-palveluntarjoaja on pois käytöstä.
- Julkisessa repositoriossa aiemmin olleet PDF:t on poistettu nykyisestä työpuusta. Git-historiaa ei ole siivottu; vanhat commitit voivat sisältää aiempia tiedostoja.
- Tuotantopalvelun lokit, varmuuskopioiden säilytys ja poistokäytännöt ovat palveluntarjoajien vastuulla. Sovellus ei ole päästä päähän salattu.
- Erilliset käyttäjätilien oikeustestit oikeassa Supabase-ympäristössä, Edge Functionin integraatiotesti ja manuaalinen tietoturvakatselmus ovat jatkotyötä. Poistomigraation toimintaa on kokeiltu paikallisessa PostgreSQL-testitietokannassa fiktiivisillä käyttäjillä.
