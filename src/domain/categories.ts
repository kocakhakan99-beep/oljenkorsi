export const categoryIconIds = [
  "salary",
  "benefit",
  "side-income",
  "pension",
  "business",
  "rental",
  "refund",
  "gift",
  "home",
  "electricity",
  "water",
  "insurance",
  "food",
  "dining",
  "transit",
  "car",
  "health",
  "medicine",
  "phone",
  "wifi",
  "subscription",
  "family",
  "clothing",
  "hobby",
  "entertainment",
  "pet",
  "education",
  "travel",
  "charity",
  "tax",
  "loan",
  "interest",
  "savings",
  "portfolio",
  "bank",
  "land",
  "boat",
  "motorcycle",
  "valuables",
  "fuel",
  "other",
] as const;

export type CategoryIconId = (typeof categoryIconIds)[number];
export type CategoryKind = "incomes" | "expenses";

export interface CategoryDefinition {
  name: string;
  kind: CategoryKind;
  icon: CategoryIconId;
  color: string;
}

export const categoryIconLabels: Record<CategoryIconId, string> = {
  salary: "Palkka",
  benefit: "Etuudet",
  "side-income": "Sivutulo",
  pension: "Eläke",
  business: "Yritys",
  rental: "Vuokraus",
  refund: "Palautus",
  gift: "Lahja",
  home: "Koti",
  electricity: "Sähkö",
  water: "Vesi",
  insurance: "Vakuutus",
  food: "Ruoka",
  dining: "Ravintola",
  transit: "Joukkoliikenne",
  car: "Auto",
  health: "Terveys",
  medicine: "Lääke",
  phone: "Puhelin",
  wifi: "Internet",
  subscription: "Jatkuva tilaus",
  family: "Perhe",
  clothing: "Vaatteet",
  hobby: "Harrastus",
  entertainment: "Viihde",
  pet: "Lemmikki",
  education: "Koulutus",
  travel: "Matka",
  charity: "Hyväntekeväisyys",
  tax: "Vero",
  loan: "Laina",
  interest: "Korko",
  savings: "Säästö",
  portfolio: "Sijoitus",
  bank: "Pankki ja talletukset",
  land: "Maa ja metsä",
  boat: "Vene",
  motorcycle: "Moottoripyörä",
  valuables: "Arvoesine",
  fuel: "Polttoaine",
  other: "Muu",
};

const incomeDefaults: Array<[string, CategoryIconId]> = [
  ["Palkka", "salary"],
  ["Etuudet", "benefit"],
  ["Sivutulot", "side-income"],
  ["Muu tulo", "other"],
];

const expenseDefaults: Array<[string, CategoryIconId]> = [
  ["Asuminen", "home"],
  ["Sähkö", "electricity"],
  ["Vesi", "water"],
  ["Vakuutukset", "insurance"],
  ["Ruoka", "food"],
  ["Päivittäistavara", "food"],
  ["Kosmetiikka", "health"],
  ["Hygieniatarvikkeet", "health"],
  ["Luottokorttilasku", "loan"],
  ["Liikenne", "transit"],
  ["Terveys", "health"],
  ["Lapset ja perhe", "family"],
  ["Puhelin", "phone"],
  ["Internet", "wifi"],
  ["Tilaukset", "subscription"],
  ["Säästäminen", "savings"],
  ["Sijoittaminen", "portfolio"],
  ["Muu meno", "other"],
];

const incomeOptional: Array<[string, CategoryIconId]> = [
  ["Eläke", "pension"],
  ["Yritystulot", "business"],
  ["Vuokratulot", "rental"],
  ["Sijoitustulot", "portfolio"],
  ["Veronpalautukset", "refund"],
  ["Lahjat", "gift"],
];

const expenseOptional: Array<[string, CategoryIconId]> = [
  ["Autoilu", "car"],
  ["Julkinen liikenne", "transit"],
  ["Ravintolat ja kahvilat", "dining"],
  ["Lääkkeet", "medicine"],
  ["Vaatteet", "clothing"],
  ["Harrastukset", "hobby"],
  ["Viihde", "entertainment"],
  ["Lemmikit", "pet"],
  ["Koulutus", "education"],
  ["Matkailu", "travel"],
  ["Lahjat", "gift"],
  ["Hyväntekeväisyys", "charity"],
  ["Verot", "tax"],
  ["Lainat", "loan"],
  ["Korot", "interest"],
  ["Polttoaine", "fuel"],
];

function definitions(
  entries: Array<[string, CategoryIconId]>,
  kind: CategoryKind,
): CategoryDefinition[] {
  return entries.map(([name, icon]) => ({
    name,
    kind,
    icon,
    color: kind === "incomes" ? "#17604d" : "#245c78",
  }));
}

export const defaultCategoryDefinitions = [
  ...definitions(incomeDefaults, "incomes"),
  ...definitions(expenseDefaults, "expenses"),
];

export const optionalCategoryDefinitions = [
  ...definitions(incomeOptional, "incomes"),
  ...definitions(expenseOptional, "expenses"),
];

export const categoryIconOptions = categoryIconIds.map((id) => ({
  id,
  label: categoryIconLabels[id],
}));

export function isCategoryIconId(value: unknown): value is CategoryIconId {
  return (
    typeof value === "string" &&
    categoryIconIds.includes(value as CategoryIconId)
  );
}

function normalized(value: string) {
  return value
    .toLocaleLowerCase("fi-FI")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function categoryIconFor(name: string, kind?: string): CategoryIconId {
  const key = normalized(name);
  if (kind === "incomes") {
    if (/palk|palkka|ansiot/.test(key)) return "salary";
    if (/etuus|lapsilisa|etuudet|tuki/.test(key)) return "benefit";
    if (/elake|pension/.test(key)) return "pension";
    if (/vuokra/.test(key)) return "rental";
    if (/yritys|liikevaihto/.test(key)) return "business";
    if (/sijoit|osing|korkotulo/.test(key)) return "portfolio";
    if (/veronpalaut/.test(key)) return "refund";
    if (/lahja/.test(key)) return "gift";
    if (/sivu|keikka/.test(key)) return "side-income";
    return "other";
  }
  if (/asunto|asuntolaina|koti|asuminen|asuntovelka/.test(key)) return "home";
  if (/vene|boat/.test(key)) return "boat";
  if (/moottoripyor|moottorikelkka|mopo/.test(key)) return "motorcycle";
  if (/auto|ajoneuvo|autolaina/.test(key)) return "car";
  if (/mets|maa|tontti|kiinteisto/.test(key)) return "land";
  if (/arvoesine|koru|taide|yritys|muu omaisuus/.test(key)) return "valuables";
  if (/rahasto|osake|sijoit|etf|portfolio/.test(key)) return "portfolio";
  if (/tallete|pankki|kates|hatar|puskuri/.test(key)) return "bank";
  if (/lain|velk|opint|luotto|kortti/.test(key)) return "loan";
  if (/korko/.test(key)) return "interest";
  if (/sahko|energia/.test(key)) return "electricity";
  if (/vesi/.test(key)) return "water";
  if (/vakuut/.test(key)) return "insurance";
  if (/ruoka|ruokakaupp/.test(key)) return "food";
  if (/ravintol|kahvil/.test(key)) return "dining";
  if (/joukkoliik|julkinen liik|liikenne|matka/.test(key)) return "transit";
  if (/polttoaine|bensa|lataus/.test(key)) return "fuel";
  if (/kosmetiik|hygieni|terveys|laak|hammas|lääk/.test(key))
    return /laak|lääk/.test(key) ? "medicine" : "health";
  if (/puhelin|liittym/.test(key)) return "phone";
  if (/internet|laajakaist|wifi/.test(key)) return "wifi";
  if (/tilaus|suoratoist|palvelumaks/.test(key)) return "subscription";
  if (/laps|perhe|paivakot/.test(key)) return "family";
  if (/vaate|kenka/.test(key)) return "clothing";
  if (/harrast/.test(key)) return "hobby";
  if (/viihde|peli|elokuva/.test(key)) return "entertainment";
  if (/lemmik|koira|kissa/.test(key)) return "pet";
  if (/koulut|opisk/.test(key)) return "education";
  if (/matkail|matka|loma/.test(key)) return "travel";
  if (/lahja/.test(key)) return "gift";
  if (/hyvanteke|lahjoit/.test(key)) return "charity";
  if (/vero/.test(key)) return "tax";
  if (/saast/.test(key)) return "savings";
  return "other";
}

export function categoryDefinitionFor(
  name: string,
  kind: CategoryKind,
): CategoryDefinition | undefined {
  return [...defaultCategoryDefinitions, ...optionalCategoryDefinitions].find(
    (definition) => definition.kind === kind && definition.name === name,
  );
}
