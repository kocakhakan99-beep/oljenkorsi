# Ominaisuuksien nykytila

Päivitetty 19.11.2026. Tämä lista kuvaa sovelluksen koodia; toiminnon toteutus ja sen käytännön varmennus ovat eri asioita. Tarkempi kartoitus: [auditointi](AUDIT_2026-11-19.md).

| Ominaisuus | Tila ja rajaus |
| --- | --- |
| Tulot, menot, varat, velat, sijoitukset ja tavoitteet | Toteutettu; kirjaukset ja toistuvuus ovat käyttäjän omia tietoja. |
| Budjetti, vertailu ja kuukausitarkistus | Toteutettu; uusien toimintojen kattava regressiovarmennus kesken. |
| Vuosikello ja hintahistoria | Toteutettu; varaus ei todista pankkimaksua. Reunatapauksia varmennetaan. |
| Laskurit, raportit, kompassi ja kokeilutila | Toteutettu; kokeilu säilyy välilehden muistissa. |
| Kuitti- ja laskutuonti | Tekstimuotoinen PDF ja käyttäjän tarkistamat AI-ehdotukset; OCR puuttuu. |
| Kirjautuminen | Google käytössä; Apple-vaihtoehdon todellista tuotantotoimivuutta ei ole varmennettu. |
| Pilvitallennus ja perhetilit | Automaattitallennus, revisiot, kutsut ja jäsenhallinta toteutettu. Kahden käyttäjän kokonaiskoe on avoin. |
| Vieraskäyttö | Talous on välilehden muistissa; JSON on täydellinen varmuuskopio. |
| Julkaisu | GitHub Pages seuraa `codex/fire-expense-types`-haaraa. `cloud-save` validoi kirjoitusversion 0.4.0. |
| Offline/PWA ja pankkiyhteydet | Eivät kuulu nykyiseen toteutukseen. |

Korjausten eteneminen ja hyväksyntäkriteerit: [toteutussuunnitelma](KORJAUSSUUNNITELMA_2026-11-19.md).

## Korjauskierros 19.11.2026

- Repositorion yksityisten kuittien historia puhdistettu julkaisuhaaroista; GitHubin PR-viitteiden poisto odottaa Supportia. Katso [tietotarkistus](REPOSITORY_SECURITY_2026-11-19.md).
- Vuosikellon, hintahistorian, budjettikopion ja kokeilun regressioita lisätty: nykyinen testiajo 30 tiedostoa / 229 testiä. Laajempi selain-/oikeusvarmennus on edelleen avoin.
- Käyttämättömien symbolien TypeScript-tarkistus käytössä, käynnistysnäkymä erotettu komponentiksi ja tarkistava CI-työnkulku lisätty. CI:n GitHub-ajo vahvistetaan erikseen.
- Laskuviivakoodin toteutus rajattu Suomeen; skanneria ei ole toteutettu.
