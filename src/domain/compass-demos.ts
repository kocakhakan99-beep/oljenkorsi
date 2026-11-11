import { defaultAssetModel } from "./asset-valuation";
import { marketQuote } from "./market-history";
import { investmentCatalog } from "./investment-catalog";
import { expenseType, previousFinnishBankDay, total } from "./calculations";
import { categoryIconFor, optionalCategoryDefinitions } from "./categories";
import { empty, entry, today, type State } from "./model";

export const compassDemoProfiles = [
  {
    id: "strained",
    rank: "1",
    label: "Haastava",
    title: "Menot kirivät tulojen ohi",
    story:
      "Kolmen hengen arjessa välttämättömät laskut vievät suuren osan tuloista. Useampi kuukausi päättyy miinukselle, vaikka menoja ei ole lisätty äkillisesti.",
    prompt:
      "Mikä on seuraavan kuukauden tärkein maksu, ja mitkä tiedot pitää tarkistaa ennen päätöksiä?",
    weather: "headwind",
    icon: "cloud-rain",
  },
  {
    id: "everyday",
    rank: "2",
    label: "Keskiverto",
    title: "Tavallinen arki, vaihtelevat viikot",
    story:
      "Tulot kattavat menot useimpina kuukausina. Ruokaostokset, lasten menot ja yksittäiset laskut heiluttavat summaa, joten yksi keskikuukausi ei kerro koko tarinaa.",
    prompt: "Mikä vaihtelee aidosti, ja mikä vain kirjautuu eri kuukaudelle?",
    weather: "clouds",
    icon: "cloud-sun",
  },
  {
    id: "steady",
    rank: "3",
    label: "Hyvä eteneminen",
    title: "Puskuri ja tavoite kulkevat rinnakkain",
    story:
      "Tulovirta on melko vakaa, likvidi puskuri on näkyvissä ja tavoitesäästö sopii kuukausittaiseen liikkumavaraan. Suunnitelmaa voi tarkistaa ilman, että jokainen euro on jo sidottu.",
    prompt:
      "Kestääkö suunnitelma myös heikomman tulokuukauden tai isomman vuosilaskun?",
    weather: "tailwind",
    icon: "sun",
  },
  {
    id: "shock",
    rank: "4",
    label: "Äkillinen kriisi",
    title: "Tulot katkeavat, laskut jatkuvat",
    story:
      "Yhden aikuisen palkkatulo katkeaa. Toisen palkka ja lapsilisä jatkuvat, mutta asuminen, ruoka ja velkojen eräpäivät jatkuvat. Puskuri on pieni, joten lähiviikkojen kassavirta on tärkein.",
    prompt:
      "Miten seuraavat 30 päivää järjestetään, ja kenen kanssa kannattaa olla ajoissa yhteydessä?",
    weather: "storm",
    icon: "lightning",
  },
] as const;

export type CompassDemoId = (typeof compassDemoProfiles)[number]["id"];

export interface CompassDemoCase {
  profile: (typeof compassDemoProfiles)[number];
  state: State;
  timeline: Array<{
    month: string;
    income: number;
    expense: number;
    cash: number;
  }>;
}

const series: Record<
  CompassDemoId,
  {
    income: number[];
    essential: number[];
    flexible: number[];
    liquid: number;
    investment: number;
    debt: number;
    rate: number;
    payment: number;
  }
> = {
  strained: {
    income: [344000, 337000, 342000, 329000, 338000, 331000],
    essential: [286000, 289000, 291000, 288000, 294000, 290000],
    flexible: [76000, 81000, 79000, 84000, 78000, 82000],
    liquid: 165000,
    investment: 180000,
    debt: 1450000,
    rate: 7.4,
    payment: 48000,
  },
  everyday: {
    income: [322000, 341000, 329000, 356000, 318000, 347000],
    essential: [218000, 225000, 217000, 231000, 222000, 229000],
    flexible: [77000, 85000, 81000, 91000, 86000, 83000],
    liquid: 690000,
    investment: 2450000,
    debt: 980000,
    rate: 4.2,
    payment: 39000,
  },
  steady: {
    income: [574000, 601000, 619000, 589000, 625000, 611000],
    essential: [215000, 221000, 218000, 224000, 219000, 223000],
    flexible: [89000, 92000, 96000, 100000, 94000, 97000],
    liquid: 2200000,
    investment: 9640000,
    debt: 710000,
    rate: 2.9,
    payment: 44000,
  },
  shock: {
    income: [414000, 407000, 179400, 183400, 176900, 180500],
    essential: [254000, 258000, 261000, 256000, 265000, 260000],
    flexible: [81000, 76000, 67000, 72000, 64000, 69000],
    liquid: 26000,
    investment: 850000,
    debt: 2180000,
    rate: 15.2,
    payment: 24000,
  },
};

export const demoMonths = Array.from({ length: 36 }, (_, index) => `${2024 + Math.floor(index / 12)}-${String(index % 12 + 1).padStart(2, "0")}`);

export function demoMonthSummary(state: State, month: string) {
  const income = total(state.incomes, month);
  const expense = total(state.expenses.filter(item => expenseType(item) === "consumption"), month);
  return { month, income, expense, cash: income - expense };
}

export function createCompassDemoCases(requestedMonth: string): CompassDemoCase[] {
  const month = requestedMonth < "2024-01" ? "2024-01" : requestedMonth > "2026-12" ? "2026-12" : requestedMonth;
  return compassDemoProfiles.map((profile) => {
    const values = series[profile.id];
    const state = empty();
    state.settings.onboarded = true;
    state.settings.demo = true;
    state.settings.month = month;
    state.settings.essentialMonthlyEstimate = values.essential[5];
    const mortgagePayment = { strained: 85000, everyday: 60000, steady: 55000, shock: 85000 }[profile.id];
    const saving = { strained: 1000, everyday: 12000, steady: 120000, shock: 0 }[profile.id];
    // One actual recurring series demonstrates editing without double-counting monthly rows.
    state.expenses.push(entry({ id: `${profile.id}-internet`, name: "Kodin internet", category: "Internet", amount: 3400, date: "2024-01-05", endDate: "2026-12-31", recurrence: "monthly", occurrenceAmounts:{"2024-07-05":2990,"2025-04-05":3790,"2026-10-05":3490}, essential: true, description: "Fiktiivinen jatkuva internetliittymä vuosille 2024–2026. Muutamassa kuussa kampanja tai lisämaksu." }));
    demoMonths.forEach((period, ordinal) => {
      const m = Number(period.slice(5));
      const index = (ordinal + 1) % 6;
      const shock = profile.id === "shock" && period >= "2026-08";
      const yearFactor = period.startsWith("2024") ? .92 : period.startsWith("2025") ? .96 : 1;
      let income = Math.round((values.income[index] + (profile.id === "everyday" ? 35000 : 0)) * yearFactor);
      if (profile.id === "shock") income = shock ? values.income[2 + ((ordinal - 19) % 4)] : Math.round((410000 + [4000, -3000, 9000, -6000, 2000, 0][index]) * yearFactor);
      const benefit = 9400;
      const bonus = !shock && (m === 6 || m === 12) ? Math.round(income * 0.06) : 0;
      const sideIncome = !shock && m % 3 === 0 ? 8000 + index * 1200 : 0;
      const wageTotal = income - benefit - sideIncome;
      const firstWage = shock ? 0 : Math.round(wageTotal * 0.55);
      const secondWage = wageTotal - firstWage;
      const addIncome = (key: string, name: string, category: string, amount: number, day: number) => {
        if (amount > 0) state.incomes.push(entry({ id: `${profile.id}-${key}-${period}`, name, category, amount, date: previousFinnishBankDay(`${period}-${String(day).padStart(2, "0")}`), description: "Fiktiivinen nettotulo. Päivä on aikaistettu tarvittaessa edeltävään pankkipäivään." }));
      };
      addIncome("adult-1", "Aikuisen 1 nettopalkka", "Palkka", firstWage, 15);
      addIncome("adult-2", "Aikuisen 2 nettopalkka", "Palkka", secondWage, 5);
      addIncome("benefit", "Lapsilisä", "Etuudet", benefit, 26);
      addIncome("side-income", "Satunnainen keikkatulo", "Sivutulot", sideIncome, 22);
      addIncome("bonus", m === 6 ? "Lomaraha" : "Tulospalkkio", "Palkka", bonus, 20);
      const essential = Math.round(values.essential[index] * yearFactor * ([1, 2, 12].includes(m) ? 1.04 : 1));
      const flexible = Math.round(values.flexible[index] * yearFactor * (m === 12 ? 1.2 : m === 7 ? 1.1 : 1));
      const plans: Record<string, number> = { Internet: 3400 };
      const addExpense = (key: string, name: string, category: string, amount: number, day: number, necessary: boolean, type: "consumption" | "saving" | "investment" = "consumption") => {
        state.expenses.push(entry({ id: `${profile.id}-${key}-${period}`, name, category, amount, date: `${period}-${String(day).padStart(2, "0")}`, essential: necessary, expenseType: type, description: "Fiktiivinen esimerkkitapahtuma, ei todellinen lasku." }));
      };
      const essentialCategories: Array<[string, string, number, number]> = [
        ["Asuminen", "Asuntolainan erä ja vastike", .50, 3], ["Sähkö", "Sähkölasku", .05, 12],
        ["Vesi", "Vesimaksu", .02, 8], ["Vakuutukset", "Koti- ja henkilövakuutukset", .04, 17],
        ["Ruoka", "Ruokaostokset", .21, 2], ["Lapset ja perhe", "Päivähoito ja lapsen arki", .10, 14],
        ["Liikenne", "Työmatkat", .06, 4], ["Puhelin", "Kaksi puhelinliittymää", .02, 21],
      ];
      let allocated = 0;
      essentialCategories.forEach(([category, name, share, day], i) => {
        const part = i === essentialCategories.length - 1 ? essential - allocated : Math.round(essential * share);
        allocated += part;
        const amount = part - (category === "Asuminen" ? 3400 : 0);
        plans[category] = Math.round(amount * (category === "Ruoka" ? .96 : 1));
        if (category === "Asuminen") {
          const housingAmount = Math.max(amount,mortgagePayment+values.payment+10000);
          plans.Asuminen = housingAmount - values.payment;
          plans.Lainat = values.payment;
          addExpense("mortgage-payment", "Asuntolainan kuukausierä", "Asuminen", mortgagePayment, 3, true);
          addExpense("housing-maintenance", "Vastike ja kodin ylläpito", "Asuminen", housingAmount - mortgagePayment - values.payment, 3, true);
          addExpense("consumer-payment", "Kulutusluoton kuukausierä", "Lainat", values.payment, 11, true);
        } else if (category === "Ruoka") {
          const major = Math.round(amount*.75), weekly = Math.floor(major / 4), minor=amount-major, small=Math.floor(minor/4);
          [2, 9, 16, 23].forEach((d, week) => addExpense(`food-${week}`, `${week%2?"K-supermarket":"Prisma"} · ${name}`, category, week === 3 ? major - weekly * 3 : weekly, d, true));
          [5,12,19,26].forEach((d,week)=>addExpense(`food-small-${week}`,`${week%2?"K-Market":"S-market"} · täydennysostos`,category,week===3?minor-small*3:small,d,true));
        } else addExpense(`essential-${i}`, name, category, amount, day, true);
      });
      let flexibleAllocated = 0;
      const flexibleCategories: Array<[string, string, number]> = [["Harrastukset", "Perheen harrastukset", .45], ["Ravintolat ja kahvilat", "Yhteinen ravintolakäynti", .25], ["Tilaukset", "Suoratoisto ja tilaukset", .12], ["Kosmetiikka", "Kosmetiikkaostokset", .08], ["Vaatteet", m === 12 ? "Talvivaatteet ja juhlat" : "Vaatteet", .10]];
      flexibleCategories.forEach(([category, name, share], i) => {
        const amount = i === flexibleCategories.length - 1 ? flexible - flexibleAllocated : Math.round(flexible * share);
        flexibleAllocated += amount;
        plans[category] = Math.round(amount * (profile.id === "strained" || shock ? .9 : 1.03));
        addExpense(`flexible-${i}`, name, category, amount, 7 + i * 4, false);
      });
      const monthlySaving = profile.id === "shock" && !shock ? 15000 : saving;
      if (monthlySaving) {
        const investmentPart = Math.round(monthlySaving * (profile.id === "steady" ? .75 : .25));
        addExpense("saving", "Siirto puskuritilille", "Säästäminen", monthlySaving - investmentPart, 27, false, "saving");
        addExpense("investment", "Kuukausisijoitus indeksirahastoon", "Sijoittaminen", investmentPart, 28, false, "investment");
        plans.Säästäminen = monthlySaving - investmentPart;
        plans.Sijoittaminen = investmentPart;
      }
      // Everyday purchases and calendar-specific bills: distinct names make category drill-down useful.
      const extra = (key:string,name:string,category:string,amount:number,day:number,necessary=true) => {
        addExpense(key,name,category,amount,day,necessary);plans[category]=(plans[category]||0)+Math.round(amount*(shock ? .9 : 1.03));
      };
      extra("hygiene",m%2?"S-kauppa · hygienia ja pesuaineet":"K-kauppa · kodin tarvikkeet","Hygieniatarvikkeet",1850+(ordinal%5)*430,10);
      extra("medicine","Apteekki · perheen lääkkeet","Lääkkeet",900+(ordinal%4)*670,19);
      extra("car-fuel","Tankkaus ja lataaminen","Autoilu",4200+(index%3)*1800,6);
      if(m===4||m===10)extra("tyres","Renkaiden vaihto ja säilytys","Autoilu",6500+(profile.id==="steady"?2500:0),18);
      if(m===9)extra("car-service",m===9?"Auton vuosihuolto":"Auton tarkastus","Autoilu",profile.id==="strained"?38500:24800,20);
      if(m===3)extra("dental","Hammastarkastus ja omavastuu","Terveys",profile.id==="shock"?12500:8900,12);
      if(m===8)extra("school","Lapsen harrastuskauden tarvikkeet","Lapset ja perhe",6900+(index%3)*1400,13);
      if(m===11)extra("insurance-extra","Matka- ja tapaturmavakuutuksen vuosimaksu","Vakuutukset",11800,18);
      if(m===2&&profile.id!=="shock")extra("repair","Kodinkoneen korjaus / huoltokäynti","Kodin ylläpito",15900,24);
      if(m===7&&profile.id==="steady")extra("holiday","Perheen kesäloma Suomessa","Matkailu",98000,8,false);
      if(m===12)extra("gifts","Lahjat ja joulun valmistelut","Lahjat",profile.id==="steady"?24000:12500,17,false);
      if(period==="2025-05"&&profile.id==="strained")extra("unexpected-repair","Auton odottamaton korjaus","Autoilu",74500,22);
      if(period==="2026-09"&&shock)extra("crisis-invoice","Välttämätön lääkärikäynti tulokatkoksen aikana","Terveys",13200,16);
      state.budgets[period] = plans;
    });
    const completeMonths = demoMonths.filter(period => period < today().slice(0, 7));
    state.coverage.incomeMonths = [...completeMonths];
    state.coverage.expenseMonths = [...completeMonths];
    const homeId = `${profile.id}-home`;
    const car = {strained:{brand:"Ford",year:2016,km:155000,annual:18000,value:980000,powertrain:"diesel" as const},everyday:{brand:"Toyota",year:2020,km:70000,annual:14000,value:1850000,powertrain:"hybrid" as const},steady:{brand:"Tesla",year:2024,km:0,annual:16000,value:4990000,powertrain:"electric" as const},shock:{brand:"Škoda",year:2018,km:125000,annual:21000,value:1290000,powertrain:"petrol" as const}}[profile.id];
    state.assets = [
      entry({ id: `${profile.id}-cash`, name: "Heti käytettävissä oleva puskuri", category: "Talletukset", amount: values.liquid, date:"2024-01-01", liquid: true,description:"Fiktiivinen kirjattu likvidi lähtöpuskuri. Kassavirta ei päivitä pankkitilin saldoa automaattisesti." }),
      entry({ id: homeId, name: "Perheen koti", category: "Asunto", amount:profile.id==="steady"?36500000:28200000,date:"2024-01-01",assetModel:{...defaultAssetModel("Asunto"),automatic:true,year:profile.id==="steady"?2016:profile.id==="strained"?1985:2003},description:"Fiktiivinen omistusasunto. Tekninen kuluminen on skenaario, ei paikkakunnan hintaennuste." }),
      entry({ id: `${profile.id}-car`, name: "Perheen käytetty auto", category: "Auto", amount:car.value,date:"2024-01-01",assetModel:{...defaultAssetModel("Auto"),automatic:true,year:car.year,initialMileage:car.km,annualMileage:car.annual,brand:car.brand,powertrain:car.powertrain,newAtBase:profile.id==="steady",vehicleCurve:"staged-v2"},description:"Fiktiivinen auto. Porrastettu arvokäyrä ja näkyvä merkkipaino ovat arvio-oletuksia." }),
      entry({id:`${profile.id}-equipment`,name:"Perheen tietokone ja kodin laitteet",category:"Laitteet",amount:profile.id==="steady"?420000:145000,date:"2024-01-01",assetModel:{...defaultAssetModel("Laite"),automatic:true,year:2022},description:"Käyttöomaisuutta: ei likvidi hätävara."}),
    ];
    state.liabilities = [
      entry({ id: `${profile.id}-mortgage`, name: "Asuntolaina", category: "Asuntolaina", amount: profile.id === "steady" ? 7100000 : profile.id === "everyday" ? 12000000 : 16000000, rate: 3.4, payment: mortgagePayment, linkedAssetId: homeId, date:"2024-01-01" }),
      entry({ id: `${profile.id}-consumer-loan`, name: "Kulutusluotto", category: "Kulutusluotto", amount:values.debt*(profile.id==="strained"||profile.id==="everyday"?2:1), rate: values.rate, payment: values.payment, date:"2024-01-01", description: "Kirjattu esimerkkisaldo säilyy. Rivin valitun päivän saldoarvio olettaa kuukausierät maksetuiksi." }),
      entry({id:`${profile.id}-student-loan`,name:"Opintolaina · takaisinmaksu ei alkanut",category:"Opintolaina",amount:profile.id==="steady"?1200000:1850000,rate:3.1,payment:0,date:"2024-01-01",description:"Fiktiivinen esimerkki: maksuja ei oleteta. Koron pääomitus on tarkistettava pankista."}),
    ];
    const baskets:Record<CompassDemoId,readonly string[]>={strained:["NOKIA.HE","NDA-FI.HE","FORTUM.HE","NESTE.HE"],everyday:["VWCE.DE","EUNL.DE","KNEBV.HE","SAMPO.HE","UPM.HE","ELISA.HE","KESKOB.HE"],steady:["EUNL.DE","AAPL","MSFT","NVDA","GOOGL","AMZN","BRK-B","META","WRT1V.HE"],shock:["TSLA","NOKIA.HE"]};
    const basket=baskets[profile.id];
    state.investments=basket.map((symbol,index)=>{
      const quote=marketQuote(symbol,"2024-01-31")!;
      const share=index===0&&basket.length>4?.5: (basket.length>4?.5/(basket.length-1):1/basket.length);
      const invested=Math.round(values.investment*share);
      return entry({id:`${profile.id}-holding-${symbol}`,name:investmentCatalog.find(([,code])=>code===symbol)![0],category:symbol.endsWith(".DE")?"ETF":"Osakkeet",marketSymbol:symbol,amount:quote.eurCents,purchasePrice:quote.eurCents,quantity:Number((invested/quote.exactUnitCents).toFixed(6)),date:quote.date,description:`Fiktiivinen omistus. Lähdehinta Yahoo Finance ${quote.date}; EUR-muunnos EKP. Määrä on split-oikaistussa yksikössä, ei varmennettu tapahtumahistoria.`});
    });
    // Quarterly lots are funded by the already-recorded monthly investment transfers: no duplicate cash expense.
    for(let quarter=0;quarter<12;quarter++) {
      const periods=demoMonths.slice(quarter*3,quarter*3+3),last=periods[2];
      const contribution=state.expenses.filter(e=>periods.includes(e.date.slice(0,7))&&e.expenseType==="investment").reduce((sum,e)=>sum+e.amount,0);
      const symbol=basket[0],date=`${last}-${new Date(Date.UTC(Number(last.slice(0,4)),Number(last.slice(5)),0)).getUTCDate()}`,quote=marketQuote(symbol,date);
      if(contribution>0&&quote&&quote.date.slice(0,7)===last)state.investments.push(entry({id:`${profile.id}-lot-${last}`,name:`${investmentCatalog.find(([,code])=>code===symbol)![0]} · lisäosto ${last}`,category:symbol.endsWith(".DE")?"ETF":"Osakkeet",marketSymbol:symbol,amount:quote.eurCents,purchasePrice:quote.eurCents,quantity:Number((contribution/quote.exactUnitCents).toFixed(6)),date:quote.date,description:"Fiktiivinen neljännesvuosittainen lisäosto. Rahoitus sisältyy jo menojen sijoitussiirtoihin. Ei uutta kassavirtakirjausta."}));
    }
    state.goals = [
      entry({ createdAt:"2024-01-01T00:00:00.000Z",id:`${profile.id}-buffer-goal`,name:profile.id==="shock"?"Ensimmäinen 1 000 euron turva":"Perheen puskuritavoite",category:"Hätävara",amount:profile.id==="shock"?values.liquid:Math.min(values.liquid,values.essential[5]*3),target:profile.id==="shock"?100000:Math.max(values.essential[5]*3,values.liquid+100000),monthly:saving||5000,date:"2026-12-31"}),
      entry({createdAt:"2024-01-01T00:00:00.000Z",id:`${profile.id}-car-goal`,name:"Auton huolto- ja vaihtovara",category:"Autoilu",amount:profile.id==="steady"?420000:35000,target:600000,monthly:profile.id==="steady"?30000:8000,date:"2027-12-31"}),
      entry({createdAt:"2025-01-01T00:00:00.000Z",id:`${profile.id}-child-goal`,name:"Lapsen tulevaisuuden säästö",category:"Perhe",amount:profile.id==="steady"?360000:75000,target:500000,monthly:profile.id==="steady"?15000:4000,date:"2028-12-31"}),
    ];
    state.expenses.push(entry({id:`${profile.id}-paused`,name:"Kuntosali · tauolla",category:"Harrastukset",amount:2990,date:"2025-01-01",endDate:"2026-12-31",recurrence:"monthly",active:false,essential:false,description:"Keskeytetty sarja näkyy hallintaa varten, mutta ei lisää toteumaa."}));
    state.scenarios = [
      { id: `${profile.id}-scenario-base`, name: "Esimerkki · maltillinen tuotto-oletus", initial: values.investment, monthly: saving, rate: 3, fee: .2, inflation: 2, years: 15 },
      { id:`${profile.id}-scenario-fees`,name:"Esimerkki · suuremmat kulut",initial:values.investment,monthly:saving,rate:3,fee:1.5,inflation:2,years:15 },
      { id: `${profile.id}-scenario-stress`, name: "Esimerkki · nollatuotto ja inflaatio", initial: values.investment, monthly: saving, rate: 0, fee: .2, inflation: 3, years: 15 },
    ];
    // Optional categories used in the demo must also exist in its category editor.
    for (const name of new Set(state.expenses.map(item => item.category))) {
      if (!state.categories.some(category => category.kind === "expenses" && category.name === name)) {
        const preset = optionalCategoryDefinitions.find(category => category.kind === "expenses" && category.name === name);
        state.categories.push({ id: `${profile.id}-category-${name}`, kind: "expenses", name, icon: preset?.icon || categoryIconFor(name, "expenses"), color: preset?.color || "#245c78", archived: false });
      }
    }
    return { profile, state, timeline: demoMonths.map(period => demoMonthSummary(state, period)) };
  });
}
