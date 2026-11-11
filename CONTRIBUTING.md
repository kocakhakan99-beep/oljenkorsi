# Kehittäminen

Pidä file:///single-file-käyttö ja normaalien ominaisuuksien offline-toiminta ensisijaisina. `index.html` sallii käyttäjän käynnistämän OpenRouter-laskuanalyysin; muut verkkoyhteydet tarvitsevat erillisen suunnitelman. Älä lisää etäfontteja, CDN:ää, telemetryä tai PWA-riippuvuutta.

## Tarkistukset muutoksen mukaan

Valitse tarkistukset muutetun käyttäytymisen ja riskin perusteella. Aiemmin läpäisseitä tarkistuksia ei tarvitse toistaa, ellei uusi muutos, virhe tai epäselvyys anna siihen syytä. Kirjaa mitä ajettiin ja mitä ei voitu varmistaa. Testien lukumäärä ei ole tavoite; lisää regressiotesti, kun se suojaa olennaista toimintaa tai havaittua virhettä.

| Muutos | Tarkista vähintään |
| --- | --- |
| Vain dokumentaatio | Lue muutos, tarkista linkit ja `git diff --check`. Sovelluksen testejä ja buildia ei yleensä tarvita. |
| Teksti tai rajattu ulkoasu | Tarkista muuttunut kohta; tarvittaessa yksi selainkatselu oikealla näkymällä ja mobiilileveydellä. Uusi yksikkötesti ei yleensä ole tarpeen. |
| UI-toiminto tai lomake | Testaa muuttunut käyttöpolku ja mahdollinen näppäimistökäyttö; aja muutosta koskevat testit sekä `npm run typecheck` ja `npm run lint` tarpeen mukaan. |
| Laskenta, toistuvuus tai raha | Aja kyseisen alueen Vitest-testit ja lisää tarvittaessa käyttäytymistä suojaava rajatapaustesti. Dokumentoi muuttuneet kaavat ja pyöristys. |
| Tallennus, skeema tai tuonti/vienti | Aja kohdennetut validointi-, tallennus- ja palautustestit; tarkista vanhan datan yhteensopivuus sekä virhepolut. Skeemamuutos tarvitsee migraation ja palautustestit. |
| PDF-parseri | Aja parserin ja kuittituonnin testit; selain-PDF-regressio tarvitaan, kun PDF:n luku tai koko kirjauspolku muuttuu. |
| Build, offline, riippuvuudet tai julkaisu | Aja `npm run typecheck`, `npm run lint`, koko `npm test`, `npm run build` sekä tarkoituksenmukainen standalone-/offline- ja selaintarkistus. Laaja `python e2e.py` on julkaisun ja laajojen yhteisten muutosten regressio, ei jokaisen muutoksen oletus. |

Kohdennetun testin voi ajaa esimerkiksi `npx vitest run src/test/receipt-import.test.ts` tai `npx vitest run src/test/domain.test.ts`. `npm test` ajaa kaikki yksikkötestit ja on tässä projektissa nopea; laaja E2E puolestaan käy läpi paljon erillisiä näkymiä. Jos muuttunut lähdekoodi toimitetaan mukana olevana itsenäisenä `index.html`-tiedostona, aja `npm run build` ennen toimitusta. Jos file://- tai offline-koe ei onnistu ympäristössä, ilmoita se; localhost-testi ei osoita samaa asiaa. `TESTING.md` sisältää vanhojen ajojen historiat, eikä sen testimäärää pidä käyttää ajantasaisena vaatimuksena.

Älä käytä oikeiden ihmisten talousdataa testeissä tai esimerkeissä. Älä lähetä käyttäjän backupia verkkoon virheen selvittämiseksi. Kerää vain käyttäjän itse anonymisoima minimaalinen esimerkki.

Sovelluksen oma koodi on tässä toimituksessa lisensoimatta erillisellä avoimen lähdekoodin lisenssillä. Kolmansien osapuolten lisenssit ovat `THIRD_PARTY_NOTICES.txt`:ssä. Jakelulisenssi tulee päättää ennen julkista levitystä.
