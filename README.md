# Taloussuunnittelu 0.1.0

Ilmainen, yksityinen henkilökohtaisen talouden paikallinen suunnittelusovellus. Tarkoitus on auttaa käyttäjää hyötymään omasta taloudestaan, ei myydä hänen tietojaan.

## Käyttö ilman asennusta

1. Tallenna `Taloussuunnittelu.html` pysyvään paikkaan, esimerkiksi työpöydälle.
2. Avaa se kaksoisklikkaamalla selaimessa. Osoite on `file://`.
3. Aloita tyhjästä, kokeile selvästi merkittyä fiktiivistä esimerkkitaloutta tai palauta JSON.
4. Vie varmuuskopio tärkeiden muutosten jälkeen ja ennen tiedoston siirtämistä.

Loppukäyttäjä ei tarvitse Node.js:ää, Pythonia, palvelinta, tiliä tai internetiä. Älä käytä sähköpostin tai pilvitallennuksen HTML-esikatselua; lataa tiedosto ensin paikalliseksi. Älä käytä yksityistä selausta, jos odotat datan säilyvän.

## Toteutettu

- Tulot, menot, omaisuus, velat, sijoitukset ja tavoitteet: lisäys, muokkaus, poisto.
- Kahdeksan toistuvuutta, alku- ja loppupäivä, aktiivisuus, suunniteltu/toteutunut/ohitettu.
- Kategoriabudjetti, inline-muokkaus, edellisen kuukauden kopiointi.
- Kassavirta, käyttövara, säästöaste, nettovarallisuus ja valitun kuukauden hätävaramittari.
- Manuaaliset sijoitushinnat euroina ja hankinta-arvo.
- Tavoitteiden eteneminen ja säästökuukausien arvio ilman tuottoa.
- Korkoa korolle, kulut, inflaatio, tallennettavien skenaarioiden vertailu ja velanmaksuarvio.
- 1/3/6/12 kuukauden kassavirtaraportti ja taulukkovastine.
- Paikallinen JSON backup/restore sekä CSV-tuonti ja vienti kaikille kuudelle tietotyypille.
- Neljä teemaa, tumma/vaalea/järjestelmätila, oma korostusväri ja summien piilotus.
- Yleishaku Ctrl/Cmd + K, listojen haku, kategoria/tila-suodatus ja lajittelu.

## Kehitysteknologiat

React 19.2.1, TypeScript strict, Vite 8.0.16, React Hook Form 7.66.0, Zod 4.1.12, oma CSS design system, Vitest, ESLint ja Prettier. E2E käyttää Python Playwrightia vain kehitysympäristössä. Kaaviot on toteutettu paikallisella CSS:llä ja semanttisilla taulukoilla. Tailwind, Recharts, Lucide ja React Testing Library eivät ole tässä toimituksessa käytössä.

## Kehittäjän asennus ja komennot

Kehittäjä tarvitsee Node.js 24:n ja pakettien asennukseen verkon. Tämä ei koske loppukäyttäjää.

```sh
npm install
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
```

Build suorittaa Viten ja `standalone.mjs`:n. Lopullinen `dist/` sisältää vain `Taloussuunnittelu.html`:n, ja sama tuore tiedosto päivitetään myös projektin juureen. `index.html` on Viten kehityspalvelimen ja buildin aloitussivu. Vite dev ei ole loppukäyttäjän käyttötapa.

E2E: asenna kehityskoneelle Python Playwright ja sen Chromium. Aja `python e2e.py`. Vaihtoehtoinen selainpolku annetaan `TALOUS_BROWSER`-ympäristömuuttujalla. Testit käyttävät erillistä tilapäistä selainprofiilia, eivät henkilökohtaista profiilia. Python ei ole sovelluksen ajonaikainen riippuvuus.

## Tallennus ja varmuuskopio

Selaimen localStorage toimii testatussa Chrome for Testing -ympäristössä file://-osoitteella. Tätä ei luvata kaikille selaimille. Tallennus tarkistetaan kirjoituksen jälkeen. Tallennusvirheessä sovellus pitää datan muistissa ja varoittaa viemään varmuuskopion. Älä sulje välilehteä ennen vientiä. Samanaikaista muokkausta useassa välilehdessä ei tueta; ristiriitainen kirjoitus estetään parhaalla mahdollisella tarkistuksella, ei atomisella lukituksella.

JSON on koko talouden siirrettävä kopio. CSV on tietuelistojen siirtomuoto, ei koko sovelluksen varmuuskopio. JSON ja selaindata ovat salaamattomia.

## Selainyhteensopivuus ja testit

Testattu: Google Chrome for Testing 149.0.7827.55, Linux, headless, Playwrightin offline-tila, file://, pysyvä profiili. Selainprosessi suljettiin ja käynnistettiin uudelleen; data säilyi. Edge, Firefox ja Windows-työpöydän kaksoisklikkaus eivät ole testattuja. Koneen fyysistä verkkoliitäntää ei katkaistu.

31 yksikkötestiä läpäisi. E2E testasi kirjaukset, budjetin, kategorian nimeämisen, skenaariot, teemat, JSON/CSV, poiston, palautuksen ja verkkopyyntöjen puuttumisen. Tarkat tulokset: `TESTING.md` ja `qa/`.

## Rakenne

`src/domain/`: mallit ja laskenta. `src/data/`: StorageProvider. `src/services/`: validointi, JSON ja CSV. `src/main.tsx`: sovellus ja ominaisuusnäkymät. `src/styles.css`: design system. `src/test/`: yksikkötestit.

## Tietosuoja ja turvallisuus

Ei ajonaikaisia ulkoisia resursseja, analytiikkaa tai API-kutsuja. CSP estää verkkoyhteydet. Tietojen suojaus ei kata haittaohjelmia, laajennuksia tai laitteen muita käyttäjiä. Katso `PRIVACY.md` ja `SECURITY.md`.

## Rajaus

Tämä on toimiva ensimmäinen toimitus, ei koko 61-kohdan määrittelyn valmis V1. Katso `KNOWN_LIMITATIONS.md` ja `ROADMAP.md`. Riippuvuuksien suorat versiot on kiinnitetty, mutta lukitustiedostoa ja puhtaalla koneella tehtyä asennuskoetta ei toimiteta. Transitiivisten riippuvuuksien täysin toistettava build on jatkotehtävä.

## Ominaisuuskartoitus ja FIRE-jatkokehitys

Tutkimuspohjainen [ominaisuuskartoitus](FEATURE_RESEARCH.md) erottaa toteutetut toiminnot, aiemmat suunnitelmat ja uudet puutteet. [Lähdemuistio](RESEARCH_SOURCES.md) kuvaa tutkimuksen soveltamisrajat; [FIRE-suunnitelma](FIRE_PLAN.md) määrittelee laskennan ja hyväksyntäesimerkit. Prioriteetit ovat [roadmapissa](ROADMAP.md). FIRE-laskenta on suunnitelma, ei nykyversion ominaisuus.
