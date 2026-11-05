export const guidanceSources = {
  R1: {
    citation: "Modigliani & Brumberg (1954), elinkaaren kulutusteoria",
    idea: "Tulot, varallisuus ja kulutus liittyvät elämän eri vaiheissa toisiinsa.",
    boundary:
      "Malli ei kerro yhdelle kotitaloudelle optimaalista säästöastetta tai eläkeikää.",
  },
  R2: {
    citation: "Deaton (1991), Saving and Liquidity Constraints",
    idea: "Likviditeetti ja epävarmat tulot vaikuttavat säästämisen tarpeeseen.",
    boundary:
      "Tutkimus ei tue kaikille samaa kolmen tai kuuden kuukauden puskuria.",
  },
  R3: {
    citation: "Carroll (1997), Buffer-Stock Saving and the Life Cycle",
    idea: "Varautumissäästäminen liittyy tuloriskiin ja kotitalouden omaan tilanteeseen.",
    boundary:
      "Laskennallinen kuukausimäärä perustuu kirjattuihin menoihin, ei ennusteeseen.",
  },
  R4: {
    citation: "Thaler & Benartzi (2004), Save More Tomorrow",
    idea: "Ennalta sovittu säästösuunnitelma voi helpottaa säästämisen aloittamista.",
    boundary:
      "Tutkimuksen työpaikkaohjelman tuloksia ei voi sellaisenaan luvata sovelluksen muistutuksille.",
  },
  R5: {
    citation: "Markowitz (1952), Portfolio Selection",
    idea: "Sijoituskokonaisuuden riski riippuu myös omistusten yhteisvaihtelusta.",
    boundary:
      "Tämä kompassi ei arvioi sijoitusten hajautusta tai ennusta tuottoa.",
  },
  R6: {
    citation: "Sharpe (1991), The Arithmetic of Active Management",
    idea: "Sijoituskulut pienentävät sijoittajalle jäävää nettotuottoa.",
    boundary: "Lähde ei suosittele yksittäistä rahastoa tai arvopaperia.",
  },
  R7: {
    citation: "Bengen (1994), historialliset nostoskenaariot",
    idea: "Nostot, inflaatio ja tuottojakso vaikuttavat eläkesalkun kestoon yhdessä.",
    boundary: "Historiallinen laskelma ei takaa tulevaa nostotasoa.",
  },
  R8: {
    citation: "Cooley, Hubbard & Walz (1998), historialliset nostojaksot",
    idea: "Nostoprosenttien tulokset riippuvat valitusta historiasta ja ajanjaksosta.",
    boundary:
      "Aiemman jakson onnistuminen ei ole henkilökohtainen onnistumistodennäköisyys.",
  },
  R9: {
    citation: "Pfau (2010), nostosääntöjen kansainvälinen soveltuvuus",
    idea: "Yhdysvaltalaisia nostosääntöjä ei voi siirtää sellaisinaan kaikkiin maihin.",
    boundary:
      "Suomen verotus, eläkejärjestelmä ja tulevat tuotot eivät sisälly tähän kompassiin.",
  },
  R10: {
    citation: "Guyton & Klinger (2006), joustavat nostosäännöt",
    idea: "Joustavien nostojen vaikutukset kulutukseen kannattaa tehdä näkyviksi.",
    boundary:
      "Kulutuksen pienentäminen on käyttäjän valinta, ei automaattinen suositus.",
  },
  R11: {
    citation: "Lusardi & Mitchell (2014), talousosaamisen tutkimuskatsaus",
    idea: "Suunnittelun ja käsitteiden ymmärtämisen merkitys saa kirjallisuudesta tukea.",
    boundary:
      "Tietokortti tai laskuri ei yksin todista varallisuuden tai hyvinvoinnin kasvua.",
  },
  R12: {
    citation: "Eurostat, Housing cost overburden rate",
    idea: "Eurostat käyttää yli 40 %:n asumiskustannusosuutta käytettävissä olevista tuloista väestötason ylikuormitusindikaattorissa.",
    boundary:
      "Tämä sovellus ei laske Eurostatin indikaattoria: luokitukset, asumistukien käsittely ja ekvivalentit käytettävissä olevat tulot voivat poiketa. 40 % on tarkistussignaali, ei henkilökohtainen enimmäisraja tai muutto-ohje.",
  },
  R13: {
    citation: "Oikeuspalveluvirasto, talous- ja velkaneuvonta",
    idea: "Suomessa julkinen talous- ja velkaneuvonta auttaa selvittämään maksuvaikeuksia ja velkatilannetta maksutta.",
    boundary:
      "Neuvonta arvioi tilanteen yksilöllisesti. Kompassi ei ratkaise etuuksia, velkajärjestelyä tai oikeudellisia kysymyksiä.",
  },
} as const;

export type GuidanceSourceId = keyof typeof guidanceSources;

export const compassPrinciples = [
  "Näytä havainto ja sen lähde ennen ehdotusta.",
  "Tee yhdestä pienestä tarkistuksesta seuraava askel.",
  "Tuo epävarmuus ja tietojen puutteet näkyviin.",
  "Jätä tavoitetaso ja päätös käyttäjälle.",
];
