# Tietoturva

## Toteutetut suojaukset

- Ei evalia, vaarallista HTML-injektiota, ulkoisia skriptejä tai etäresursseja.
- React esittää käyttäjän tekstit tekstinä, ei HTML:nä.
- CSP: default-src none; connect-src none; script/style vain inline; ei objectia, fonttiverkkoa, base-uri-muutoksia tai lomakkeen verkkolähetystä.
- Zod validoi tilan rakenteen; domain-tarkistukset validoivat tietueet, päivät, prosentit, kokonaislukusentit ja listakoot.
- **proto**, constructor ja prototype hylätään JSON-tuonnissa ja validoinnissa.
- JSON enintään 10 Mt; CSV enintään 5 Mt; enintään 20 000 tietuetta/lista, 500 kategoriaa ja 100 skenaariota. Selaimen kiintiö voi tulla vastaan aiemmin.
- CSV-vienti lainaa kentät ja lisää apostrofin kaava-alkuisiin (=, +, -, @) kenttiin myös alkuvälilyöntien jälkeen. Taulukkolaskentaohjelmien käyttäytyminen vaihtelee; Excelissä ei ole tehty erillistä testiä.
- Backupin FNV-1a-32 tarkistaa tahattomia muutoksia. Se ei ole kryptografinen eikä suojaa tahallista väärentämistä.
- Tallennus tarkistetaan takaisinluvulla. Toisen välilehden muuttama tallennus tunnistetaan ennen kirjoitusta. Tarkistus ei ole atominen.
- Vioittunutta tallennusta ei automaattisesti korvata; alkuperäinen raakakopio voidaan pelastaa onboardingista.

## Uhkamallin ulkopuolella

Haittaohjelmat, laitteen muut käyttäjät, selainlaajennukset, selaimen omat verkkotoiminnot, pilveen synkronoitu latauskansio ja käyttöjärjestelmän varmuuskopiot. Offline ei yksin tarkoita salausta tai täydellistä turvallisuutta.

## Jatkotehtävät

Kryptografinen backup-tarkiste, valinnainen salasanasalaus, riippuvuusauditointi ja lukitustiedosto, kattava fuzz-testaus sekä manuaalinen tietoturvakatselmointi. Riippuvuuksien CVE-auditointia ei ole tehty tässä kierroksessa.
