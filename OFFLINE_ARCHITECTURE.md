# Offline-arkkitehtuuri

> **Kehitysversion muutos:** Kirjautumattoman käyttäjän talous on vain välilehden muistissa ja katoaa sivun päivityksessä tai sulkemisessa. Vie tiedot ennen poistumista. Aiempi selaintallennus säilyy ja on vietävissä asetuksista. Alla olevat offline- ja pysyvää localStorage-tallennusta koskevat kuvaukset ovat aiemman version dokumentaatiota. Supabase-kirjautumisen ja perhetilin ensimmäinen versio on kehitteillä. Talous tallennetaan ja ladataan perhetilillä toistaiseksi käyttäjän toiminnolla; automaattista synkronointia ei ole. Google on otettu käyttöön, Apple-asetukset ja oikeilla käyttäjillä tehtävät päästä päähän -testit ovat kesken.

V1:n virallinen jakelutavoite on yksi itsenäinen HTML, jonka käyttäjä avaa paikallisesti file://-protokollalla. Tässä toimituksessa se on toteutettu. Kehityspalvelin ei ole loppukäyttäjän vaatimus.

`src/index.html` on Viten kehitysmalli. Vite tuottaa ensin JS:n ja CSS:n väliaikaiseen `dist/`-hakemistoon. `standalone.mjs` lukee ne, upottaa HTML:ään, sijoittaa skriptin root-elementin jälkeen ja kirjoittaa valmiin projektin juuren `index.html`-tiedoston. Sen jälkeen väliaikainen `dist/` poistetaan. Valmis `index.html` toimii ilman palvelinta. Skriptin upotuksessa käytetään replacement-callbackia, jotta JavaScriptin dollarimerkit eivät muutu string-replacement-metamerkeiksi.

Ei PWA:ta, service workeria, manifestia, omaa backendia, tilipakkoa tai remote loggingia. OpenRouter API vaatii verkkoyhteyden vain käyttäjän käynnistämään laskuanalyysiin. Ei dynaamisia importteja tai ajonaikaisia moduulilatauksia. CSS, React, lomakekirjasto, Zod ja paikalliset fontit ovat HTML:n sisällä. Hash-navigointi ei tarvitse palvelimen fallbackia.

CSP sallii OpenRouter- ja Cloudflare Worker -verkkoyhteydet käyttäjän käynnistämää laskuanalyysiä varten ja estää muut yhteyskohteet. Muut tavalliset toiminnot eivät edellytä verkkoa. Browser File API ja Blob-vienti toimivat paikallisesti. Selaimen omat taustayhteydet eivät ole sovelluksen hallinnassa.

LocalStorage on eristetty StorageProvideriin. file://-tallennuksen käyttäytyminen on selainkohtainen eikä standardin perusteella luvata pysyvyyttä kaikille selaimille. Testatussa Chrome for Testing -profiilissa data säilyi prosessin sulkemisen jälkeen. Tiedoston polun, selaimen tai profiilin vaihto voi muuttaa tallennusaluetta. JSON on ensisijainen siirrettävä varmistus.

Vapaaehtoinen OpenRouter-laskuanalyysi toimii nyt `index.html`-tiedostossa; sen verkko-oikeus on rajattu OpenRouteriin ja käyttäjän Workeriin ja pyyntö vaatii käyttäjän toiminnon. `index-online.html` säilyy samansisältöisenä yhteensopivuuskopiona. Muita ominaisuuksia ei saa tehdä verkkoyhteydestä riippuvaisiksi.
