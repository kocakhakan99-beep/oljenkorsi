# 50/30/20 ja kategoriakohtaiset suositukset

9.11.2026. Käyttäjän priorisoima toteutussuunnitelma:

1. Yhteinen laskenta budjetille, tuloille, menoille ja kompassille. Kuukauden tulopohja sisältää toteutuneet ja tulevat kirjatut nettotulot, ei tulon brutto/netto-arvausta.
2. Välttämättömät menot enintään 50 %, valinnaiset enintään 30 %, säästö- ja sijoitussiirrot vähintään 20 %. Käyttäjä voi muuttaa prosentteja (summa 100), kategoriaryhmiä ja kategoriakohtaisia enimmäisosuuksia. Tuntematon luokka pyydetään luokittelemaan.
3. Näytä toteuma ja kuukauden varatut rahat erikseen. Varatut rahat ovat kategoriakohtaisesti vähintään budjetti, kirjatut tulevat ja toteutuneet tapahtumat tai suurempi manuaalinen toteuma; samoja euroja ei lasketa budjettina ja tapahtumina kahteen kertaan. Tulopohjan puuttuessa ei prosenttisuosituksia.
4. Pysyvät, päivittyvät ilmoitukset näissä kolmessa näkymässä; kompassiin priorisoidut toimenpiteet, euromääräinen poikkeama ja selkeä seuraava askel. Nykyiset tehty/siirretty/ei onnistu nyt -toiminnot säilyvät.
5. Kategoriarajat ovat sovelluksen muokattavia aloitusarvoja, eivät tutkimuksen todistamia suomalaisia keskiarvoja. 50/30/20 on käytännön budjetointikehikko (Warren & Tyagi, All Your Worth, 2005), ei henkilökohtainen optimi. Älä leikkaa välttämätöntä hoitoa tai ota velkaa säästötavoitteen saavuttamiseksi.
6. Vanhan tiedon yhteensopiva migraatio, lähde- ja laskentadokumentaatio, laskenta- ja selainvarmennukset.

Luottokorttilasku ja velan lisälyhennys vaativat käyttäjän oman luokituksen: jo kirjattuja korttiostoksia ei saa kirjata uudelleen laskuna. Velkasaldo ei muutu automaattisesti. Säästämisryhmän 20 % ei ole kulutusylijäämä: mukaan lasketaan vain kirjatut/varatut siirrot. Puuttuva kuukausikattavuus näytetään, tulevia tuloja ei pidetä pankkivarmennuksena.

## Toteutuksen tarkistuslista

- [x] Yhteinen ryhmä- ja kategoriakohtainen laskenta.
- [x] Raamikortit ja poikkeamat budjetissa, tuloissa ja menoissa.
- [x] Muokattavat osuudet, kategoriaryhmät ja enimmäisrajat.
- [x] Rahoitusvajeen, säästötavoitteen ja kategoriaylitysten konkreettiset kompassiaskeleet.
- [x] Vanhan datan oletukset, JSON-palautus ja uudelleennimeämisessä säilyvät asetukset.
- [x] Lähteet, laskentakuvaukset, 77 yksikkötestiä ja 62 Chromium-selainvarmennusta.

Toimitettu: ohjearvot päivittyvät kirjauksista ja omista asetuksista. Kirjattujen nettotulojen oikeellisuus ja kate sekä luottokorttilaskujen kaksoiskirjauksen välttäminen ovat käyttäjän tarkistettavia tietoja. Velan lisälyhennyksen ryhmitys ei vielä ole koron/pääoman erittely tai velkasaldon automaattinen muutos.
