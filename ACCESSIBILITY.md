# Saavutettavuus

Tavoite on WCAG 2.2 AA, ei tässä toimituksessa varmennettu vaatimustenmukaisuus.

Toteutettu: semanttinen nav/main/header/footer, otsikot, näkyvät labelit, valikoiden aria-labelit, taulukoiden otsikot, progress-mittarit, näkyvä focus, sisältöön siirtymislinkki, native dialogin fokusraja, fokuspalautus, Escape, Ctrl/Cmd K, ilmoitusten status/alert, reduced-motion-sääntö ja raportin taulukkovastine. Yleiset painikkeet ja uudet raporttien valinnat on mitoitettu vähintään 44 pikselin kosketusalueelle. Summakentän eurokohtaiset pikasäätimet ovat oikeita painikkeita, ja tekstikenttään voi edelleen syöttää summan suoraan. Opastuslaatikot voi piilottaa; valinta tallentuu selaimen paikalliseen asetukseen ja ohjeet saa palautettua Asetuksista.

Raporttien aikavälipainikkeet toimivat näppäimistöllä, ja pitkä painikerivi vierii vaakasuunnassa. Kaaviotyypin valinta sekä suurennuksen plus/miinus- ja liukusäädin ilmoittavat tilansa; suurennusalue on 70–180 %. Pylväs- ja viivakaavioita voi vierittää vaakasuunnassa. Pylväät, päivät ja valitun jakson KPI-summat ovat painikkeita. SVG-viivapisteet ja piirakan sektorit ovat näppäimistöllä aktivoitavia; valinta tuo raportin tietokortin näkyviin ja siirtää siihen fokuksen. Raporttivälilehdet käyttävät nuolinäppäimiä sekä Home/End-näppäimiä ja ovat yhteydessä omiin tabpanel-sisältöihinsä. Välilehtien ikonit ovat koristeellisia, ja välilehden nimi säilyy tekstinä.

Testattu aiemmassa selainajossa: Ctrl K ja Escape, budjetin tallennus Tabilla, lomakkeiden ja navigoinnin käyttö Playwrightin rooli/label-valitsimilla. Uudet raporttien välilehtien näppäimistöpolut on lisätty E2E-skriptiin, mutta tämän työympäristön selain ei käynnisty. Kaikkia käyttäjäpolkuja ei ole suoritettu pelkästään näppäimistöllä. Ruudunlukijaa, 200/400 % zoomia, kontrastimittauksia, axe-auditointia tai Windows High Contrast -tilaa ei ole kattavasti testattu.

Oman korostusvärin kontrastia ei lasketa automaattisesti; UI näyttää varoituksen. Summien piilotus ei peitä kaikkia johdettuja tietoja tai muokkauslomakkeita. Neljä valmista teemaa ja tumma tila ovat toteutettuja, mutta AA-kontrastia ei väitetä sertifioiduksi.
