# Kehittäminen

Pidä offline/file:///single-file-vaatimukset ensisijaisina. Älä lisää etäfontteja, CDN:ää, telemetryä, API-kutsuja tai PWA-riippuvuutta. Uuden ominaisuuden tulee toimia tuotantotiedostossa ilman verkkoa.

Ennen muutoksen hyväksyntää: typecheck, lint, yksikkötestit, production build, standalone, file:// E2E ja verkkopyyntöjen tarkistus. Lisää laskentatesti ennen talouslogiikan muutosta. Dokumentoi kaavat ja pyöristys. Älä muuta schemaVersionia ilman migraatiota ja palautustestejä.

Älä käytä oikeiden ihmisten talousdataa testeissä tai esimerkeissä. Älä lähetä käyttäjän backupia verkkoon virheen selvittämiseksi. Kerää vain käyttäjän itse anonymisoima minimaalinen esimerkki.

Sovelluksen oma koodi on tässä toimituksessa lisensoimatta erillisellä avoimen lähdekoodin lisenssillä. Kolmansien osapuolten lisenssit ovat `THIRD_PARTY_NOTICES.txt`:ssä. Jakelulisenssi tulee päättää ennen julkista levitystä.
