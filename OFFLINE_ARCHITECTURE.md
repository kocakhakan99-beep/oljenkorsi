# Offline-arkkitehtuuri

V1:n virallinen jakelutavoite on yksi itsenäinen HTML, jonka käyttäjä avaa paikallisesti file://-protokollalla. Tässä toimituksessa se on toteutettu. Kehityspalvelin ei ole loppukäyttäjän vaatimus.

`src/index.html` on Viten kehitysmalli. Vite tuottaa ensin JS:n ja CSS:n väliaikaiseen `dist/`-hakemistoon. `standalone.mjs` lukee ne, upottaa HTML:ään, sijoittaa skriptin root-elementin jälkeen ja kirjoittaa valmiin projektin juuren `index.html`-tiedoston. Sen jälkeen väliaikainen `dist/` poistetaan. Valmis `index.html` toimii ilman palvelinta. Skriptin upotuksessa käytetään replacement-callbackia, jotta JavaScriptin dollarimerkit eivät muutu string-replacement-metamerkeiksi.

Ei PWA:ta, service workeria, manifestia, HTTPS-vaatimusta, backendia, tiliä, remote loggingia tai API:a. Ei dynaamisia importteja tai ajonaikaisia moduulilatauksia. CSS, React, lomakekirjasto ja Zod ovat HTML:n sisällä. Fontit ovat system font stack; symbolit paikallista tekstiä. Hash-navigointi ei tarvitse palvelimen fallbackia.

CSP estää connect-src:n ja ulkoiset resurssit. Normaaleissa testatuissa poluissa ei verkkopyyntöjä. Browser File API ja Blob-vienti toimivat paikallisesti. Selaimen omat taustayhteydet eivät ole sovelluksen hallinnassa.

LocalStorage on eristetty StorageProvideriin. file://-tallennuksen käyttäytyminen on selainkohtainen eikä standardin perusteella luvata pysyvyyttä kaikille selaimille. Testatussa Chrome for Testing -profiilissa data säilyi prosessin sulkemisen jälkeen. Tiedoston polun, selaimen tai profiilin vaihto voi muuttaa tallennusaluetta. JSON on ensisijainen siirrettävä varmistus.

Tulevat verkkopalvelut on toteutettava erillisinä valinnaisina adaptereina. Niiden rajapinnat eivät ole vielä tämän version koodissa. Offline-jakelu säilytetään erillisenä eikä sitä saa tehdä riippuvaiseksi verkosta.
