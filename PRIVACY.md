# Tietosuoja

Sovellus ei pyydä nimeä, sähköpostia, henkilötunnusta, pankkitunnuksia tai tiliä. Offline-versio `index.html` ei lähetä talousdataa verkkoon. Erillinen `index-online.html` lähettää vain käyttäjän erikseen käynnistämän laskuanalyysin tekstin ja käyttäjän antaman API-avaimen OpenRouterille; OpenRouter voi välittää tekstin valitulle mallipalvelulle. Palveluntarjoajien säilytys- ja koulutusehdot on tarkistettava ennen käyttöä. Avainta ja laskutekstiä ei tallenneta sovelluksen talousdataan. Ei analytiikkaa, telemetryä, mainoksia, automaattisia päivityksiä, markkinadataa tai pankkiyhteyksiä.

Data käsitellään selaimen muistissa ja tallennetaan localStorageen. JSON ja CSV luetaan Browser File API:lla paikallisesti. Vienti luo paikallisen Blob-latauksen. Jos käyttäjä itse tallentaa varmuuskopion pilveen synkronoituun kansioon, pilvisynkronointi on käyttöjärjestelmän tai muun ohjelman toimintaa, ei tämän sovelluksen.

Sovellus ei salaa tallennusta tai varmuuskopioita. Summien piilotus on esitystilan suoja, ei salaus. Muokkauslomakkeet näyttävät muokattavat arvot. Suojaa laite, selainprofiili ja varmuuskopiot.

Poista kaikki tietoni poistaa sovelluksen oman localStorage-avaimen ja tarkistaa poiston. Se ei poista ladattuja JSON/CSV-tiedostoja, selaimen lataushistoriaa tai käyttöjärjestelmän varmuuskopioita. Esimerkkitalouden poistaminen poistaa koko kyseisen talouden, myös siihen tehdyt muutokset; ei vain alkuperäisiä fiktiivisiä rivejä.
