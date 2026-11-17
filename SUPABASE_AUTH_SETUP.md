# Google- ja Apple-kirjautumisen käyttöönotto

Tila 12.11.2026: Google-palveluntarjoaja on aktiivinen. Tuotannon OAuth-aloitus hyväksyy GitHub Pagesin paluuosoitteen ja ohjautuu Googlelle; oikealla käyttäjätilillä tehtävää kirjautumista ja paluuta sovellukseen ei ole varmennettu. Apple-palveluntarjoaja on pois käytöstä. Perhetilin lataus ja tallennus ovat käyttäjän käynnistämiä. Kirjautuminen ei itsessään tallenna taloustietoja.

## Supabase

Projektin `oljenkorsi` Supabase-osoite on `https://xabfflmujxejqzhphpkh.supabase.co`. Sen OAuth-palveluntarjoajille rekisteröitävä callback on `https://xabfflmujxejqzhphpkh.supabase.co/auth/v1/callback`. Asiakassovelluksen paluuosoite määritetään erikseen Supabasen Auth URL Configuration -asetuksiin. Kehityksessä se on esimerkiksi `http://localhost:5173/`; lisää myös käytössä oleva tarkka localhost-osoite, jos se eroaa tästä. Tuotannossa käytetään omaa HTTPS-sovellusosoitetta. Tarkista käytössä olevat paluuosoitteet oikean kirjautumiskokeen yhteydessä.

## GitHub Pages -verkko-osoite

Sovelluksen julkaisuosoite on `https://kocakhakan99-beep.github.io/oljenkorsi/`. Supabasen OAuth-aloitusta kokeiltiin tällä täsmällisellä redirect-osoitteella: Auth hyväksyi pyynnön ja palautti Googlelle HTTP 302 -ohjauksen. Tämä ei varmista Google-tilillä kirjautumisen eikä paluun toimivuutta. Supabasen Site URL:n arvoa ei voitu lukea käytettävissä olevalla rajapinnalla; sovellus lähettää kirjautumispyynnössä täsmällisen paluuosoitteen `https://kocakhakan99-beep.github.io/oljenkorsi/#settings`. Kehityksen localhost-paluuosoite säilyy erillisenä. Googlen Authorized JavaScript origins -kohtaan tulee `https://kocakhakan99-beep.github.io` ilman polkua. Googlen Authorized redirect URI on edelleen Supabasen callback. GitHub Pagesin aliverkkotunnuksen sopivuus Applen verkkotunnuksen vahvistukseen on varmistettava erikseen; älä oleta, että käyttäjä hallitsee `github.io`-juuriverkkotunnusta.

## Google

1. Luo tai valitse Google Cloud -projekti ja määritä OAuth consent screen sekä tarvittaessa testikäyttäjät.
2. Luo Web application -tyyppinen OAuth client. Lisää yllä oleva Supabasen callback Googlen Authorized redirect URIs -listaan.
3. Aseta client ID ja client secret Supabasen Dashboardissa Authentication → Sign In / Providers → Google, ja ota palveluntarjoaja käyttöön. Tallenna salaisuudet vain palvelun asetuksiin. Älä lisää niitä repoon tai chatiin.
4. Kokeile kirjautumista erillisellä testikäyttäjällä localhost-kehityspalvelimesta. Tarkista Supabasen paluuosoitteiden sallintalista, jos ohjaus epäonnistuu.

## Apple

Tarvitaan Apple Developer -jäsenyys ja Sign in with Apple -asetukset, mukaan lukien App ID, Services ID, verkkotunnus, Supabasen callback ja Applelle luotu avain. Applen verkkokirjautuminen vaatii rekisteröidyn verkkotunnuksen; toteutus ja palveluntarjoajan asetukset varmennetaan, kun HTTPS-verkkosovelluksen osoite on valittu. Lisää tarvittavat arvot Supabasen Apple-providerin asetuksiin. Applen client secretin voimassaolo ja uusiminen on järjestettävä ennen julkaisua. Älä jaa yksityistä avainta keskustelussa tai tallenna sitä repoon.

## Tietosuoja ja kehitystilanne

Selaimeen sisältyvä Supabasen publishable-avain on julkinen tunniste, ei palvelimen salainen avain. Salaisia tai service-role-avaimia ei saa sisällyttää selainkoodiin. Kirjautumiseen siirtyminen lataa uuden sivun ja poistaa vierastilan muistissa olevan talouden; vie ensin varmuuskopio. OAuth-asetukset voivat vaatia palveluntarjoajan hyväksynnän ennen julkista käyttöä. Testit todellisilla Google- ja Apple-tileillä ovat tekemättä.

## Perheen ja tilin poistaminen

Perheen poistaminen, ylläpitäjyyden siirto ja käyttäjätilin poistaminen ovat koodissa mutta vaativat uuden tietokantamigraation sekä `delete-account` Edge Functionin käyttöönoton. Function tarkistaa kirjautuneen käyttäjän `@supabase/server`-kirjastolla ja poistaa vain tämän saman käyttäjän. Se käyttää Supabasen palvelinpuolen `SUPABASE_SECRET_KEYS`-avainta; älä lisää sitä selainkoodiin tai repositorioon. `verify_jwt = false` on tarkoituksellinen, koska function tarkistaa käyttäjätokenin itse. CORS sallii vain GitHub Pagesin sovellusoriginin ja luetellut localhost-kehitysportit.

Ota ensin migraatio käyttöön ja vasta sitten Edge Function. Testaa erillisillä testitileillä vähintään perheen poistaminen, ylläpitäjyyden siirto, viimeisen ylläpitäjän tilin poisto ja viimeisen jäsenen tilin poisto. Functionin poisto on peruuttamaton; Supabasen varmuuskopioiden säilytysaika määräytyy palvelun käytäntöjen mukaan.

Lähteet: [Supabase Google](https://supabase.com/docs/guides/auth/social-login/auth-google), [Supabase Apple](https://supabase.com/docs/guides/auth/social-login/auth-apple), [Supabase redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).
