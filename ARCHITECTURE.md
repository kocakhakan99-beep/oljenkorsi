# Arkkitehtuuri

## Kerrokset

- React UI hallitsee navigointia, lomakkeita ja näkymiä.
- `domain/model.ts` määrittelee versionoidun tilan ja tietueet.
- `domain/calculations.ts` sisältää puhtaat laskentafunktiot ilman Reactia tai tallennusta.
- `services/validation.ts` validoi Zodilla tilan rakenteen ja tarkemmilla domain-tarkistuksilla tietueet.
- `data/storage.ts` toteuttaa StorageProviderin. UI kutsuu provideria, ei tallennusavaimia normaalissa talouslogiikassa.
- `services/csv.ts` käsittelee paikallisen CSV:n ja Blob-lataukset.

## Tallennuksen kulku

Muutos → validointi → serialisointi ja eheystarkistus → localStorage → takaisinluvun tarkistus → React-tila. Jos kirjoitus epäonnistuu, validi tila jää muistissa käytettäväksi ja varmuuskopioitavaksi. Käyttöliittymä ilmoittaa tästä. Toisen välilehden muuttama tallennus ei ylikirjoitu normaalissa peräkkäisessä käytössä; tarkistus ei ole atominen eikä korvaa monikäyttäjälukitusta.

## UI-rakenne

Sivupalkki, hash-navigointi, kuukausivalinta, pikatoiminnot ja sisältönäkymä; varmuuskopio löytyy Tuonti ja vienti -näkymästä. Native dialog tarjoaa modaalisen fokusrajan. Navigoinnin jälkeen fokus siirretään otsikkoon. Listat näyttävät aluksi 100 tietuetta ja tarjoavat lisää, eivät renderöi kaikkia rivejä heti.

Tyylit on vaiheistettu: nykyinen design system elää `src/styles.css`-tiedostossa, ja Tailwind CSS 4 kokoaa uudet utility-luokat build-vaiheessa. `@tailwindcss/vite` ei lisää loppukäyttäjän ajonaikaista riippuvuutta. Lucide Reactista käytetyt SVG-kuvakkeet tree-shakataan bundleen; ulkoisia kuvake- tai fonttipyyntöjä ei tehdä. `standalone.mjs` upottaa tyylit, kuvat ja JavaScriptin juuren `index.html`-tiedostoon.

## Tarkoituksellinen rajaus

Ominaisuusnäkymät ovat vielä samassa `main.tsx`-tiedostossa. Ne tulee erottaa feature-hakemistoihin ennen merkittävää laajentamista. MarketDataProvider, BankDataProvider, AuthenticationProvider, CloudSyncProvider, VehicleValuationProvider ja FeatureFlagProvider eivät ole vielä toteutettuja rajapintoja. Niitä ei esitetä valmiina. Offline-sovelluksessa ei ole niiden verkkototeutuksia.

## Pikainen ylläpito- ja suorituskykykatsaus 11.11.2026

Havainnot perustuvat lähdekoodin tarkasteluun; käyttöliittymän vasteaikoja ei ole profiloitu. Ennen optimointia mittaa tyhjä talous ja suuri 4 480 kirjauksen demotalous samoilla laitteilla: ensimmäinen avaus, sivunvaihto, budjettisumman tallennus ja 120 kuukauden raportti. Vertaa tuloksia muutoksen jälkeen ja varmista laskentatulokset sekä tallennusvirheiden käsittely.

1. `src/main.tsx` on noin 8 800 riviä ja `src/styles.css` noin 5 500. Näkymien, lomakkeiden ja tyylien vaiheittainen irrotus pienentää muutosten vaikutusaluetta; pelkkä tiedostojako ei itsessään nopeuta sovellusta.
2. `App` laskee budjettikoostetta ja kompassin toimintasuunnitelmaa myös muilla sivuilla. `planActions` suoritetaan erikseen ja uudelleen `visibleActions`-funktion kautta; myös demokompassin laskentaa tehdään renderöinnissä. Selvitä profiloinnilla osuus viiveestä, ja hyödynnä sama laskentatulos sekä rajaa raskaat laskennat tarvittavaan näkymään.
3. `budgetSummary` suodattaa kaikki menot uudestaan jokaiselle kategorialle. Pitkä raporttijakso laskee kuukausittain `datedState`- ja `metrics`-arvot ja budjettiraportti vielä oman koosteen. Kokeile kerran muodostettavaa kuukausi-/kategoriakoostetta; varmista samat tulokset toistuvuuksille, ohituksille ja käsin korjatuille toteumille.
4. Tallennuksen `commit` validoi koko tilan, `storage.update` validoi sen uudestaan ja `backup` vielä kerran. Validointi myös serialisoi dataa. Mittaa vaikutus suurella demolla; vältä päällekkäinen työ vasta, kun tuontirajojen validointi, koko- ja turvallisuustarkistukset sekä tallennusvirheiden käsittely säilyvät.
5. Tyhjä `useEffect` kuukauden ja raporttijakson riippuvuuksilla ei tee mitään. Sen voi poistaa erillisen rajatun siivouksen yhteydessä. Summamuotoilijat luodaan renderöinnissä useasti; mittaa vaikutus ennen optimointia.

Yhden tiedoston offline-jakelu selittää ison osan noin 2,6 MiB:n HTML-tiedostosta; PDF.js on mukana paketissa. Koko ei yksin todista hitauden syytä. Älä ota verkkoriippuvuutta tai riko yksittäisen HTML-tiedoston käyttöä optimoinnin nimissä.

Dokumentaatiossa on 36 Markdown-tiedostoa. `README.md` ja `CHECKLIST.md` kuvaavat nykytilaa, suunnitelma- ja auditointitiedostot sisältävät myös historiallisia oletuksia, ja `CHANGELOG.md` / `TESTING.md` ovat aikaleimattua historiaa. Vanhoja suunnitelmia ei pidä tulkita toteutuksen tilaksi ilman tarkistusta koodista. Yhdistämisen ehdokkaat ovat samasta aiheesta kertovat UX-suunnitelmat ja erilliset omaisuus-/sijoitussuunnitelmat; säilytä lähteet ja avoimet päätökset ennen arkistointia. Kokonaisvaltaista dokumenttikohtaista poistotarkastusta ei ole vielä tehty.
