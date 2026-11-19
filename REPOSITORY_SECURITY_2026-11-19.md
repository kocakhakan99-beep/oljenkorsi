# Repositorion tietotarkistus 19.11.2026

## Tulos

Julkisen repositorion nykyisessä tiedostopuussa ei löytynyt alkuperäisiä kuitti-PDF:iä tai salaista palveluavainta. Git-historiasta löytyi 20 erillistä alkuperäistä kuitti-PDF-objektia. Osa tiedostoista oli esiintynyt usealla nimellä. Ne sisälsivät ostoshistoriaa sekä maksukorttien peitettyjä numeroita/loppunumeroita, kanta-asiakas- ja tapahtumatunnisteita. Tunnisteiden arvoja ei toisteta tässä raportissa.

## Tehty korjaus

Käyttäjän nimenomaisella luvalla historian juuritason PDF:t poistettiin git-filter-repolla ja molemmat GitHub-haarat (`main`, `codex/fire-expense-types`) päivitettiin atomisella, vanhan haarakärjen tarkistavalla force-pushilla. Uusi kärki puhdistuksen jälkeen: 8b8c1c34d60c22ac4faae8e4f4edfe46d7105f32.

Tarkistettu ennen pushia: kaikki 20 tunnistettua yksityistä PDF-objektia puuttuivat puhdistetun historian saavutettavista objekteista, 14 fiktiivistä esimerkkikuittia säilyivät ja nykyisen sovelluksen Git-puu oli täsmälleen ennallaan. Etähaarojen kärjet tarkistettiin pushin jälkeen. Tageja ei löytynyt. GitHubin API raportoi tarkistushetkellä nolla forkia; se ei sulje pois yksityisiä ladattuja kopioita.

## Vielä avoin poisto GitHubissa

GitHubin hallinnoimat PR-viitteet 1–5 viittaavat yhä vanhaan historiaan. Niitä ei voi päivittää tavallisilla Git-oikeuksilla. Myös vanha commit-URL tai välimuisti voi säilyttää aineiston. Täydellistä poistoa ei ole vahvistettu.

Omistajan tulee avata [GitHub Support -pyyntö](https://support.github.com/) ja pyytää arkaluontoisen kuittiaineiston PR-viitteiden ja välimuistien poistoa sekä palvelinpuolen garbage collectionia. GitHub arvioi pyynnön; hyväksyntää ei voi luvata.

Tukipyynnön tiedot:

- Repository: `kocakhakan99-beep/oljenkorsi`.
- Sisältö: henkilökohtaiset alkuperäiset ostokuitit/PDF:t ja niissä olevat maksukorttien loppunumerot sekä kanta-asiakas-/maksutapahtumatunnisteet. Kyseessä ei ole korvattavissa oleva API-salaisuus.
- Puhdistettu: kaikki julkaistut haarat, ei tageja.
- Vaikutuksen alaiset PR:t: 1, 2, 3, 4, 5 (viisi PR-viitettä).
- Ensimmäinen muuttunut commit: `97084c2affc23b4f8ed93557295a4e8130e9404f`.
- Puhdistusrajaus: kaikki repositorion juuren PDF-tiedostot kaikkine historiaversioineen; fiktiiviset `examples/receipts/`-aineistot säilytettiin.
- Pyydä ensisijaisesti vanhojen PR-viitteiden dereferointia ja arkaluontoisten tiedostonäkymien poistamista. GitHub voi joutua poistamaan vanhojen PR:ien diff-näkymiä tai muita viitteitä.

Älä liitä kuittien sisältöä tai kortti-/asiakastunnisteita julkiseen issueen. Tämä tarkistus ei lähettänyt tukipyyntöä.

## Tarkistuksen kattavuus

- Gitin seuraamat nykyiset tiedostot: tunniste-/salaisuuskuviot sekä ympäristötiedostojen luonne.
- Saavutettava Git-historia: Gitleaks 8.24.3, lisäksi historiassa olevien PDF-objektien paikallinen tekstipoiminta.
- Gitleaksin ainoa havainto oli Supabasen julkinen `sb_publishable_`-avain. Se on tarkoitettu selainkoodiin eikä ole palvelimen salainen tai service-role-avain. Sen vaihtamista ei suositella tämän osuman perusteella.
- `src/.env.production` sisältää vain kaksi ominaisuuslippua. Avaimen näköinen tiedosto ei tässä tapauksessa ole salaisuus.
- Tarkistus ei todista kaikkien mahdollisten henkilötietojen tai epätavallisesti koodattujen salaisuuksien puuttumista. Testifixturejen mahdollinen aitoihin ostoksiin perustuva anonymisoitu tuoteaineisto ja Git-tekijöiden nimi-/sähköpostimetatieto arvioidaan eri asiana kuin salainen palveluavain.
- Kaikkia kuvien pikseleitä, historiallisten ZIP-tiedostojen sisältöä, GitHub Actions -lokeja, kommentteja tai ulkopuolisia klooneja ei tarkistettu. Salaisuusraportin raakaversio ja väliaikaiset PDF-poiminnat käsiteltiin paikallisesti, eivätkä ne kuulu repositorioon.

## Uudelleenaltistuksen ehkäisy

Juuritason PDF:t, paikalliset salaisuustiedostot ja `private-uploads/` lisättiin ignore-sääntöihin. Pakotettu `git add -f` voi ohittaa ne; ignore ei ole tietoturvaraja.

Vanha klooni voi palauttaa poistetun historian yhdistämällä sen uuteen. Muiden koneiden vanhat kloonit tulee korvata uudella kloonilla. Tallentamattomat muutokset siirretään erikseen tarkistetulla patchilla, ei vanhan historian mergellä. Tässä työpuussa työhaarat kohdistettiin puhdistettuun historiaan. Muut työtilat tai omat koneet eivät puhdistu automaattisesti.

Lähde: [GitHubin ohje arkaluontoisen aineiston poistamiseen](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository).
