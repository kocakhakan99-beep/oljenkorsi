# Muutosloki

## 0.1.0, 3.11.2026

Ensimmäinen paikallinen käyttöversio. Single-file build, file://, localStorage ja virhetilat, JSON-backup/restore, CSV, talouskirjaukset, kategoriat, toistuvuudet, budjetti, yhteenveto, manuaaliset omaisuus/velka/sijoitusarvot, tavoitteet, rajatut skenaariot ja raportit, teemat ja yksityisyystila. 31 yksikkötestiä ja offline file:// E2E. Laaja V1-määrittely ei vielä kokonaan toteudu.

### Ylläpito 5.11.2026

Yläpalkin kuukausivalitsin ja ikonipainikkeet viimeisteltiin. Järjestelmäteema vaihtuu heti, kun laitteen vaalea/tumma-asetus muuttuu sovelluksen ollessa auki. Chromium 155 -selainsarja suoritettiin valmiille HTML:lle loopback HTTP -palvelun kautta; `file://`-avaus ja selaimen offline-simulaatio jäivät ympäristörajoitteen vuoksi testaamatta.
