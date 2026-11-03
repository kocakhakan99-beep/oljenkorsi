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

Sivupalkki, hash-navigointi, kuukausivalinta, näkyvä backup-painike ja sisältönäkymä. Native dialog tarjoaa modaalisen fokusrajan. Navigoinnin jälkeen fokus siirretään otsikkoon. Listat näyttävät aluksi 100 tietuetta ja tarjoavat lisää, eivät renderöi kaikkia rivejä heti.

## Tarkoituksellinen rajaus

Ominaisuusnäkymät ovat vielä samassa `main.tsx`-tiedostossa. Ne tulee erottaa feature-hakemistoihin ennen merkittävää laajentamista. MarketDataProvider, BankDataProvider, AuthenticationProvider, CloudSyncProvider, VehicleValuationProvider ja FeatureFlagProvider eivät ole vielä toteutettuja rajapintoja. Niitä ei esitetä valmiina. Offline-sovelluksessa ei ole niiden verkkototeutuksia.
