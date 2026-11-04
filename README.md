# Taloussuunnittelu 0.1.0

Ilmainen, yksityinen henkilökohtaisen talouden paikallinen suunnittelusovellus. Tarkoitus on auttaa käyttäjää hyötymään omasta taloudestaan, ei myydä hänen tietojaan.

## Käyttö ilman asennusta

1. Tallenna projektin juuren valmis `index.html` pysyvään paikkaan, esimerkiksi työpöydälle. Tiedoston voi nimetä uudelleen haluamakseen.
2. Avaa se kaksoisklikkaamalla selaimessa. Osoite on `file://`.
3. Aloita tyhjästä, kokeile selvästi merkittyä fiktiivistä esimerkkitaloutta tai palauta JSON.
4. Vie varmuuskopio tärkeiden muutosten jälkeen ja ennen tiedoston siirtämistä.

Esimerkkitalouden voi ladata uudelleen Asetukset-näkymästä. Lataus korvaa nykyisen talouden vahvistuksen jälkeen; vie JSON-varmuuskopio ensin, jos haluat palauttaa omat tietosi.

Loppukäyttäjä ei tarvitse Node.js:ää, Pythonia, palvelinta, tiliä tai internetiä. Älä käytä sähköpostin tai pilvitallennuksen HTML-esikatselua; lataa tiedosto ensin paikalliseksi. Älä käytä yksityistä selausta, jos odotat datan säilyvän.

## Toteutettu

- Tulot, menot, omaisuus, velat, sijoitukset ja tavoitteet: lisäys, muokkaus, poisto.
- Kahdeksan toistuvuutta, alku- ja loppupäivä, aktiivisuus, suunniteltu/toteutunut/ohitettu.
- Kategoriabudjetti, inline-muokkaus, edellisen kuukauden kopiointi.
- Kassavirta, käyttövara, säästöaste, nettovarallisuus ja 1/3/6/12 kuukauden hätävaramittari havaintokattavuudella.
- Manuaaliset sijoitushinnat euroina ja hankinta-arvo.
- Tavoitteiden eteneminen ja säästökuukausien arvio ilman tuottoa.
- Korkoa korolle, kulut, inflaatio, tallennettavien skenaarioiden vertailu ja velanmaksuarvio.
- FI-pääomatavoitteen yksivaiheinen havainnollistus, ehdollinen aika-arvio omalla säästö- ja reaalituotto-oletuksella sekä ±10 % kulutusherkkyys.
- 1/3/6/12 kuukauden tai itse rajatun enintään 120 kuukauden kassavirtaraportti ja taulukkovastine.
- Raporteissa valittava pylväs-/viivakaavio, kulurakenne pylväs-/piirakkakaaviona sekä valittavien pisteiden, pylväiden ja sektoreiden tapahtumakohtaiset tietokortit.
- Valitun raporttijakson tulot, menot, nettokassavirta ja kokonaisjakson säästöaste; tulot-, menot- ja kassavirtasummista pääsee suoraan niiden kirjauksiin.
- Kuukauden sisäisen rahavirran ajoitus, päiväsaldo ja negatiivisen jakson palautumispäivä.
- Paikallinen JSON backup/restore sekä CSV-tuonti ja vienti kaikille kuudelle tietotyypille.
- Neljä teemaa, tumma/vaalea/järjestelmätila, oma korostusväri ja summien piilotus.
- Viiteen ryhmään jaettu navigaatio, avattava mobiilivalikko sekä yhteenvedon ja suunnittelun erisävyiset mittari- ja sisältöalueet.
- Yhteenvedosta pääsee yhdellä painalluksella tulon tai menon kirjaukseen sekä budjettiin ja raportteihin.
- Yleishaku Ctrl/Cmd + K, listojen haku, kategoria/tila-suodatus ja lajittelu.

## Kehitysteknologiat

React 19.2.1, TypeScript strict, Vite 8.0.16, React Hook Form 7.66.0, Zod 4.1.12, Tailwind CSS 4.3 ja Lucide React 1.68. Tailwind toimii vain build-vaiheessa: CSS kootaan suoraan itsenäiseen HTML-tiedostoon. Lucide-kuvakkeet sisällytetään samaan tiedostoon; sovellus ei hae kuvakkeita verkosta. Vanha design system on edelleen `src/styles.css`-tiedostossa, ja uusia sekä uudistettuja alueita voidaan siirtää Tailwind-luokkiin asteittain. Kaaviot ovat omia, paikallisia HTML/SVG-toteutuksia ja niiden rinnalla on taulukkomuotoinen tietosisältö. Testit: Vitest ja ESLint; E2E käyttää Python Playwrightia vain kehitysympäristössä.

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

Build suorittaa Viten ja `standalone.mjs`:n. Viten kehitysmalli on `src/index.html`. Valmis, itsenäinen sovellus kirjoitetaan projektin juuren `index.html`-tiedostoon. Väliaikainen `dist/` poistetaan koosteen lopuksi. Vite dev ei ole loppukäyttäjän käyttötapa. Asenna lukitulla riippuvuuspuulla komennolla `npm ci`.

E2E: asenna kehityskoneelle Python Playwright ja sen Chromium. Aja `python e2e.py`. Vaihtoehtoinen selainpolku annetaan `TALOUS_BROWSER`-ympäristömuuttujalla. Testit käyttävät erillistä tilapäistä selainprofiilia, eivät henkilökohtaista profiilia. Python ei ole sovelluksen ajonaikainen riippuvuus.

## Tallennus ja varmuuskopio

Selaimen localStorage toimii testatussa Chrome for Testing -ympäristössä file://-osoitteella. Tätä ei luvata kaikille selaimille. Tallennus tarkistetaan kirjoituksen jälkeen. Tallennusvirheessä sovellus pitää datan muistissa ja varoittaa viemään varmuuskopion. Älä sulje välilehteä ennen vientiä. Samanaikaista muokkausta useassa välilehdessä ei tueta; ristiriitainen kirjoitus estetään parhaalla mahdollisella tarkistuksella, ei atomisella lukituksella.

JSON on koko talouden siirrettävä kopio. CSV on tietuelistojen siirtomuoto, ei koko sovelluksen varmuuskopio. JSON ja selaindata ovat salaamattomia.

## Selainyhteensopivuus ja testit

Testattu: Google Chrome for Testing 149.0.7827.55, Linux, headless, Playwrightin offline-tila, file://, pysyvä profiili. Selainprosessi suljettiin ja käynnistettiin uudelleen; data säilyi. Edge, Firefox ja Windows-työpöydän kaksoisklikkaus eivät ole testattuja. Koneen fyysistä verkkoliitäntää ei katkaistu.

Yksikkö- ja E2E-testien ajantasaiset tulokset ovat tiedostossa `TESTING.md` ja lokit hakemistossa `qa/`.

## Rakenne

`src/domain/`: mallit ja laskenta. `src/data/`: StorageProvider. `src/services/`: validointi, JSON ja CSV. `src/main.tsx`: sovellus ja ominaisuusnäkymät. `src/styles.css`: nykyinen design system sekä Tailwindin build-aikainen tuonti ja teematokenit. `src/test/`: yksikkötestit.

## Tietosuoja ja turvallisuus

Ei ajonaikaisia ulkoisia resursseja, analytiikkaa tai API-kutsuja. CSP estää verkkoyhteydet. Tietojen suojaus ei kata haittaohjelmia, laajennuksia tai laitteen muita käyttäjiä. Katso `PRIVACY.md` ja `SECURITY.md`.

## Rajaus

Tämä on toimiva ensimmäinen toimitus, ei koko 61-kohdan määrittelyn valmis V1. Katso `KNOWN_LIMITATIONS.md` ja `ROADMAP.md`. Suorat ja transitiiviset npm-riippuvuudet on lukittu `package-lock.json`-tiedostoon; puhtaan ympäristön asennus toimii komennolla `npm ci`.

## Ominaisuuskartoitus ja FIRE-jatkokehitys

Tutkimuspohjainen [ominaisuuskartoitus](FEATURE_RESEARCH.md) erottaa toteutetut toiminnot, aiemmat suunnitelmat ja uudet puutteet. [Lähdemuistio](RESEARCH_SOURCES.md) kuvaa tutkimuksen soveltamisrajat; [FIRE-suunnitelma](FIRE_PLAN.md) määrittelee laskennan ja hyväksyntäesimerkit. Prioriteetit ovat [roadmapissa](ROADMAP.md). FIRE-laskenta on suunnitelma, ei nykyversion ominaisuus.
