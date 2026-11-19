# Arkkitehtuuri

> Nykytilan ensisijainen kuvaus: [ominaisuuksien nykytila](FEATURE_STATUS.md). Tämän dokumentin vanhat versio-, offline- ja tallennuskuvaukset ovat historiallisia, ellei niitä ole erikseen päivitetty.

## Kerrokset

- React UI hallitsee navigointia, lomakkeita ja näkymiä.
- `domain/model.ts` määrittelee versionoidun tilan ja tietueet.
- `domain/calculations.ts` sisältää puhtaat laskentafunktiot ilman Reactia tai tallennusta.
- `services/validation.ts` validoi Zodilla tilan rakenteen ja tarkemmilla domain-tarkistuksilla tietueet.
- `data/storage.ts` toteuttaa vierastilan muistissa olevan StorageProviderin. UI kutsuu provideria, ei tallennusavaimia normaalissa talouslogiikassa.
- `services/supabase.ts` luo selainasiakkaan publishable-avaimella; perhetalous siirtyy RPC-kutsujen kautta vain käyttäjän erillisestä lataus- tai tallennustoiminnosta.
- `services/family-backup.ts` säilyttää JSONB-avainten järjestystä kestävän varmuuskopion ja validoi vanhat tallennusmuodot.
- `services/csv.ts` käsittelee paikallisen CSV:n ja Blob-lataukset.

## Tallennuksen kulku

Vieraskäyttö: muutos → validointi → muistissa oleva tila. Sivun päivityksen yli säilyvää taloustallennusta ei ole. Kirjautuneena käyttäjä voi ladata perheen version muistissa olevaan tilaan tai tallentaa koko tilan erikseen Supabaseen; palvelimen revisio estää vanhaa versiota ohittamasta uudempaa. Kirjautumisistunto tallentuu selaimeen, mutta taloustietoja ei tallenneta automaattisesti selaimen pysyvään tallennukseen.

## UI-rakenne

Sivupalkki, hash-navigointi, kuukausivalinta, pikatoiminnot ja sisältönäkymä; varmuuskopio löytyy Tuonti ja vienti -näkymästä. Native dialog tarjoaa modaalisen fokusrajan. Navigoinnin jälkeen fokus siirretään otsikkoon. Listat näyttävät aluksi 100 tietuetta ja tarjoavat lisää, eivät renderöi kaikkia rivejä heti.

Tyylit on vaiheistettu: nykyinen design system elää `src/styles.css`-tiedostossa, ja Tailwind CSS 4 kokoaa luokat build-vaiheessa. `@tailwindcss/vite` ei lisää loppukäyttäjän ajonaikaista riippuvuutta. Lucide Reactista käytetyt SVG-kuvakkeet sisältyvät buildiin; ulkoisia kuvake- tai fonttipyyntöjä ei tehdä. Vite tuottaa koodijaetut staattiset tiedostot juuren `assets/`-hakemistoon. PDF.js ladataan dynaamisesti vasta PDF:n käsittelyn alkaessa.

## Tarkoituksellinen rajaus

Ominaisuusnäkymät ovat vielä samassa `main.tsx`-tiedostossa. Ne tulee erottaa feature-hakemistoihin ennen merkittävää laajentamista. Automaattinen synkronointi ja Apple-kirjautuminen eivät ole käytössä. Perheen poisto, ylläpitäjyyden siirto ja käyttäjätilin poisto ovat toteutettu lähdekoodissa, mutta niiden migraatio ja Edge Function on vielä otettava käyttöön palvelussa ja oikeustestattava erillisillä tileillä.

## Pikainen ylläpito- ja suorituskykykatsaus 11.11.2026

Havainnot perustuvat lähdekoodin tarkasteluun; käyttöliittymän vasteaikoja ei ole profiloitu. Ennen optimointia mittaa tyhjä talous ja suuri 4 480 kirjauksen demotalous samoilla laitteilla: ensimmäinen avaus, sivunvaihto, budjettisumman tallennus ja 120 kuukauden raportti. Vertaa tuloksia muutoksen jälkeen ja varmista laskentatulokset sekä tallennusvirheiden käsittely.

1. `src/main.tsx` on noin 8 800 riviä ja `src/styles.css` noin 5 500. Näkymien, lomakkeiden ja tyylien vaiheittainen irrotus pienentää muutosten vaikutusaluetta; pelkkä tiedostojako ei itsessään nopeuta sovellusta.
2. `App` tarvitsee budjettikoostetta ja kompassin toimintasuunnitelmaa useissa näkymissä. Nämä sekä valitun esimerkkitalouden laskelmat muistetaan nyt saman taloustilan ja päivän ajan, joten esimerkiksi valikon avaaminen ei laske niitä uudelleen. Kompassin täydellinen ja näkyvä lista käyttävät eri lähtötilaa, joten niitä ei ole yhdistetty. Mittaa suurella aineistolla, kannattaako laskentaa rajata näkymäkohtaisesti tai optimoida edelleen.
3. `budgetSummary` suodattaa kaikki menot uudestaan jokaiselle kategorialle. Pitkä raporttijakso laskee kuukausittain `datedState`- ja `metrics`-arvot ja budjettiraportti vielä oman koosteen. Kokeile kerran muodostettavaa kuukausi-/kategoriakoostetta; varmista samat tulokset toistuvuuksille, ohituksille ja käsin korjatuille toteumille.
4. Tallennuksen `commit` validoi koko tilan, `storage.update` validoi sen uudestaan ja `backup` vielä kerran. Validointi myös serialisoi dataa. Mittaa vaikutus suurella demolla; vältä päällekkäinen työ vasta, kun tuontirajojen validointi, koko- ja turvallisuustarkistukset sekä tallennusvirheiden käsittely säilyvät.
5. Tyhjä `useEffect` kuukauden ja raporttijakson riippuvuuksilla ei tee mitään. Sen voi poistaa erillisen rajatun siivouksen yhteydessä. Summamuotoilijat luodaan renderöinnissä useasti; mittaa vaikutus ennen optimointia.

Vanha yhden HTML-tiedoston jakelu sisälsi PDF.js:n heti aloituksessa. Nykyinen build jakaa koodin staattisiin tiedostoihin ja lataa PDF.js:n vasta PDF-käsittelyssä. Mittaa tämän jälkeen ensimmäinen lataus tavallisella ja suurella taloudella; koodijako ei korjaa `main.tsx`-tiedoston laskentakustannuksia.

Dokumentaatiossa on 36 Markdown-tiedostoa. `README.md` ja `CHECKLIST.md` kuvaavat nykytilaa, suunnitelma- ja auditointitiedostot sisältävät myös historiallisia oletuksia, ja `CHANGELOG.md` / `TESTING.md` ovat aikaleimattua historiaa. Vanhoja suunnitelmia ei pidä tulkita toteutuksen tilaksi ilman tarkistusta koodista. Yhdistämisen ehdokkaat ovat samasta aiheesta kertovat UX-suunnitelmat ja erilliset omaisuus-/sijoitussuunnitelmat; säilytä lähteet ja avoimet päätökset ennen arkistointia. Kokonaisvaltaista dokumenttikohtaista poistotarkastusta ei ole vielä tehty.
