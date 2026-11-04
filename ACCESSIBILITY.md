# Saavutettavuus

Tavoite on WCAG 2.2 AA, ei tässä toimituksessa varmennettu vaatimustenmukaisuus.

Toteutettu: semanttinen nav/main/header/footer, otsikot, näkyvät labelit, valikoiden aria-labelit, taulukoiden otsikot, progress-mittarit, näkyvä focus, sisältöön siirtymislinkki, native dialogin fokusraja, fokuspalautus, Escape, Ctrl/Cmd K, ilmoitusten status/alert, reduced-motion-sääntö ja raportin taulukkovastine. Raporttien pylväät ja päivävalinnat ovat painikkeita, SVG-viivapisteet ja piirakan sektorit ovat näppäimistöllä aktivoitavia, ja valinta päivittää live-alueen tietokortin. Raporttivälilehdet käyttävät nuolinäppäimiä sekä Home/End-näppäimiä ja ovat yhteydessä omiin tabpanel-sisältöihinsä. Välilehtien ikonit ovat koristeellisia, ja välilehden nimi säilyy tekstinä.

Testattu aiemmassa selainajossa: Ctrl K ja Escape, budjetin tallennus Tabilla, lomakkeiden ja navigoinnin käyttö Playwrightin rooli/label-valitsimilla. Uudet raporttien välilehtien näppäimistöpolut on lisätty E2E-skriptiin, mutta tämän työympäristön selain ei käynnisty. Kaikkia käyttäjäpolkuja ei ole suoritettu pelkästään näppäimistöllä. Ruudunlukijaa, 200/400 % zoomia, kontrastimittauksia, axe-auditointia tai Windows High Contrast -tilaa ei ole kattavasti testattu.

Oman korostusvärin kontrastia ei lasketa automaattisesti; UI näyttää varoituksen. Summien piilotus ei peitä kaikkia johdettuja tietoja tai muokkauslomakkeita. Neljä valmista teemaa ja tumma tila ovat toteutettuja, mutta AA-kontrastia ei väitetä sertifioiduksi.
