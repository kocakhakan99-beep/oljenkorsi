import type { Entry, State, Scenario } from "./model";
export const MAX = 1000000000000;
export type ExpenseType = "consumption" | "saving" | "investment";
const EXPENSE_TYPE_TAG =
  /^talous:expense-type=(consumption|saving|investment)$/;
export function expenseType(e: Entry): ExpenseType {
  const tag = e.tags
    .split(/[;,]/)
    .map((value) => value.trim())
    .find((value) => EXPENSE_TYPE_TAG.test(value));
  const explicit = tag?.match(EXPENSE_TYPE_TAG)?.[1] as ExpenseType | undefined;
  if (explicit) return explicit;
  if (e.category.trim().toLocaleLowerCase("fi-FI") === "sijoittaminen")
    return "investment";
  if (e.category.trim().toLocaleLowerCase("fi-FI") === "säästäminen")
    return "saving";
  return "consumption";
}
export function setExpenseTypeTags(tags: string, type: ExpenseType) {
  const retained = userTags(tags)
    .split(/[;,]/)
    .map((value) => value.trim())
    .filter(Boolean);
  return [...retained, `talous:expense-type=${type}`].join(";");
}
export function userTags(tags: string) {
  return tags
    .split(/[;,]/)
    .map((value) => value.trim())
    .filter((value) => value && !EXPENSE_TYPE_TAG.test(value))
    .join(";");
}
export function money(s: string): number {
  const t = s.trim().replace(/[€\s\u00a0\u202f\u2009]/g, "");
  const negative = t.startsWith("-");
  const unsigned = negative ? t.slice(1) : t;
  const decimalIndex = Math.max(
    unsigned.lastIndexOf(","),
    unsigned.lastIndexOf("."),
  );
  const integerText =
    decimalIndex < 0 ? unsigned : unsigned.slice(0, decimalIndex);
  const fractionText = decimalIndex < 0 ? "" : unsigned.slice(decimalIndex + 1);
  const groupSeparator = integerText.includes(",")
    ? ","
    : integerText.includes(".")
      ? "."
      : "";
  const integerGroups = groupSeparator
    ? integerText.split(groupSeparator)
    : [integerText];
  const validInteger = groupSeparator
    ? /^[0-9]{1,3}$/.test(integerGroups[0]) &&
      integerGroups.slice(1).every((group) => /^[0-9]{3}$/.test(group))
    : /^\d+$/.test(integerText);
  if (
    !validInteger ||
    !/^\d{0,2}$/.test(fractionText) ||
    (decimalIndex >= 0 && fractionText.length === 0)
  )
    throw Error("Anna summa enintään kahdella desimaalilla.");
  const whole = Number(integerGroups.join(""));
  const fractional = Number(fractionText.padEnd(2, "0") || "0");
  let n = whole * 100 + (negative ? -1 : 1) * fractional;
  if (!Number.isSafeInteger(n) || Math.abs(n) > MAX)
    throw Error("Summa on liian suuri.");
  return n;
}
export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
export function validDate(s: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  let [y, m, d] = s.split("-").map(Number);
  return (
    y >= 1900 &&
    y <= 2200 &&
    m >= 1 &&
    m <= 12 &&
    d >= 1 &&
    d <= new Date(y, m, 0).getDate()
  );
}
export function occurrences(e: Entry, month: string): string[] {
  if (!e.active || e.status === "skipped") return [];
  let [y, m] = month.split("-").map(Number),
    start = `${month}-01`,
    end = `${month}-${new Date(y, m, 0).getDate()}`;
  if (e.date > end || (e.endDate && e.endDate < start)) return [];
  if (e.recurrence === "once")
    return e.date >= start && e.date <= end ? [e.date] : [];
  let [sy, sm, sd] = e.date.split("-").map(Number);
  let out: string[] = [];
  if (e.recurrence === "weekly" || e.recurrence === "biweekly") {
    let base = Date.UTC(sy, sm - 1, sd),
      step = (e.recurrence === "weekly" ? 7 : 14) * 86400000;
    for (
      let t =
        base +
        Math.max(0, Math.ceil((Date.UTC(y, m - 1, 1) - base) / step)) * step;
      t <= Date.UTC(y, m - 1, new Date(y, m, 0).getDate());
      t += step
    ) {
      let d = new Date(t).toISOString().slice(0, 10);
      if (!e.endDate || d <= e.endDate) out.push(d);
    }
    return out;
  }
  let interval =
    { monthly: 1, bimonthly: 2, quarterly: 3, semiannual: 6, yearly: 12 }[
      e.recurrence
    ] || 1;
  let delta = (y - sy) * 12 + m - sm;
  if (delta >= 0 && delta % interval === 0) {
    let d = `${month}-${String(Math.min(sd, new Date(y, m, 0).getDate())).padStart(2, "0")}`;
    if (d >= e.date && (!e.endDate || d <= e.endDate)) out.push(d);
  }
  return out;
}
export const total = (es: Entry[], m: string, actual = false) =>
  sum(
    es
      .filter((e) => !actual || e.status === "actual")
      .map((e) => e.amount * occurrences(e, m).length),
  );
export function emergencyFund(
  s: State,
  endMonth: string,
  requestedMonths: number,
) {
  if (
    !/^\d{4}-(0[1-9]|1[0-2])$/.test(endMonth) ||
    ![1, 3, 6, 12].includes(requestedMonths)
  )
    throw Error("Tarkista hätävaran tarkastelujakso.");
  const [year, month] = endMonth.split("-").map(Number);
  const essentialExpenses = s.expenses.filter(
    (e) =>
      e.status === "actual" && e.essential && expenseType(e) === "consumption",
  );
  const monthlyExpenses = Array.from(
    { length: requestedMonths },
    (_, index) => {
      const date = new Date(Date.UTC(year, month - 1 - index, 1));
      const period = date.toISOString().slice(0, 7);
      const observed = essentialExpenses.some(
        (e) => occurrences(e, period).length > 0,
      );
      return observed ? total(essentialExpenses, period, true) : null;
    },
  );
  const observedExpenses = monthlyExpenses.filter(
    (value): value is number => value !== null,
  );
  const observedMonths = observedExpenses.length;
  const averageEssential = observedMonths
    ? sum(observedExpenses) / observedMonths
    : null;
  const liquid = sum(
    s.assets
      .filter((e) => e.liquid)
      .map((e) => Math.round((e.amount * e.ownership) / 100)),
  );
  return {
    requestedMonths,
    observedMonths,
    averageEssential,
    liquid,
    buffer:
      averageEssential && averageEssential > 0
        ? liquid / averageEssential
        : null,
  };
}
export function metrics(s: State, m: string) {
  let income = total(s.incomes, m, true),
    expense = total(s.expenses, m, true),
    consumption = total(
      s.expenses.filter((e) => expenseType(e) === "consumption"),
      m,
      true,
    ),
    savingTransfers = total(
      s.expenses.filter((e) => expenseType(e) === "saving"),
      m,
      true,
    ),
    investmentTransfers = total(
      s.expenses.filter((e) => expenseType(e) === "investment"),
      m,
      true,
    ),
    planned = total(
      s.expenses.filter((e) => e.status === "planned"),
      m,
    ),
    assets = sum(
      s.assets.map((e) => Math.round((e.amount * e.ownership) / 100)),
    ),
    investments = sum(
      s.investments.map((e) => Math.round(e.amount * e.quantity)),
    ),
    debts = sum(s.liabilities.map((e) => e.amount)),
    budget = sum(Object.values(s.budgets[m] || {})),
    essential = total(
      s.expenses.filter((e) => e.essential),
      m,
      true,
    ),
    liquid = sum(
      s.assets
        .filter((e) => e.liquid)
        .map((e) => Math.round((e.amount * e.ownership) / 100)),
    );
  return {
    income,
    expense,
    consumption,
    earmarked: expense - consumption,
    savingTransfers,
    investmentTransfers,
    surplus: income - consumption,
    cash: income - expense,
    available: income - expense - planned,
    savingRate: income ? (100 * (income - consumption)) / income : null,
    assets,
    investments,
    debts,
    net: assets + investments - debts,
    budget,
    essential,
    buffer: essential ? liquid / essential : null,
    planned,
  };
}
export function compound(s: Scenario) {
  let v = s.initial,
    noFee = s.initial,
    invested = s.initial;
  let r = Math.pow(1 + s.rate / 100, 1 / 12) - 1,
    f = Math.pow(1 - s.fee / 100, 1 / 12);
  for (let i = 0; i < s.years * 12; i++) {
    v = Math.round(v * (1 + r) * f) + s.monthly;
    noFee = Math.round(noFee * (1 + r)) + s.monthly;
    invested += s.monthly;
  }
  return {
    value: v,
    invested,
    gain: v - invested,
    feeImpact: noFee - v,
    real: Math.round(v / Math.pow(1 + s.inflation / 100, s.years)),
  };
}
export function fiTarget(
  annualExpenses: number,
  annualOutsideIncome: number,
  capital: number,
  withdrawalRate: number,
) {
  if (
    ![annualExpenses, annualOutsideIncome, capital].every(
      (n) => Number.isSafeInteger(n) && n >= 0 && n <= MAX,
    ) ||
    !Number.isFinite(withdrawalRate) ||
    withdrawalRate <= 0 ||
    withdrawalRate > 100
  )
    throw Error("Tarkista FI-laskurin oletukset.");
  const gap = Math.max(0, annualExpenses - annualOutsideIncome);
  const target = Math.ceil(gap / (withdrawalRate / 100));
  if (!Number.isSafeInteger(target) || target > MAX)
    throw Error("FI-tavoite ylittää laskentarajan.");
  return {
    gap,
    target,
    shortfall: Math.max(0, target - capital),
    coverage: target ? (100 * capital) / target : null,
  };
}
export function fiMonths(
  capital: number,
  monthlySaving: number,
  realAnnualReturn: number,
  target: number,
  maxYears: number,
): number | null {
  if (
    ![capital, monthlySaving, target].every(
      (n) => Number.isSafeInteger(n) && n >= 0 && n <= MAX,
    ) ||
    !Number.isFinite(realAnnualReturn) ||
    realAnnualReturn <= -100 ||
    realAnnualReturn > 50 ||
    !Number.isInteger(maxYears) ||
    maxYears < 1 ||
    maxYears > 50
  )
    throw Error("Tarkista FI-aika-arvion oletukset.");
  if (capital >= target) return 0;
  const monthlyReturn = Math.pow(1 + realAnnualReturn / 100, 1 / 12) - 1;
  let value = capital;
  for (let month = 1; month <= maxYears * 12; month++) {
    value = Math.max(
      0,
      Math.round(value * (1 + monthlyReturn)) + monthlySaving,
    );
    if (value >= target) return month;
  }
  return null;
}
export function depreciation(value: number, rate: number, years: number) {
  return Math.round(value * Math.pow(1 + rate / 100, years));
}
export function goalMonths(e: Entry) {
  return e.target <= e.amount
    ? 0
    : e.monthly > 0
      ? Math.ceil((e.target - e.amount) / e.monthly)
      : null;
}
export function payoff(balance: number, payment: number, rate: number) {
  let b = balance,
    interest = 0;
  for (let months = 1; months <= 1200; months++) {
    let i = Math.round((b * rate) / 1200);
    if (payment <= i) return null;
    interest += i;
    b = Math.max(0, b + i - payment);
    if (!b) return { months, interest };
  }
  return null;
}
export function linkedAssetOutlook(
  asset: Entry,
  liabilities: Entry[],
  annualValueChange: number,
) {
  const linked = liabilities.filter((item) => item.linkedAssetId === asset.id);
  if (
    !linked.length ||
    !Number.isFinite(annualValueChange) ||
    annualValueChange <= -100 ||
    annualValueChange > 100
  )
    return null;
  const ownedValue = Math.round((asset.amount * asset.ownership) / 100);
  const debtBalance = sum(linked.map((item) => item.amount));
  const payoffs = linked.map((item) =>
    item.amount === 0
      ? { months: 0, interest: 0 }
      : payoff(item.amount, item.payment, item.rate),
  );
  const canProject = payoffs.every((result) => result !== null);
  const months = canProject
    ? Math.max(...payoffs.map((result) => result!.months))
    : null;
  const interest = canProject
    ? sum(payoffs.map((result) => result!.interest))
    : null;
  const projectedValue =
    months === null
      ? null
      : depreciation(ownedValue, annualValueChange, months / 12);
  return {
    linkedLiabilities: linked,
    ownedValue,
    debtBalance,
    currentEquity: ownedValue - debtBalance,
    payoffMonths: months,
    estimatedInterest: interest,
    projectedValueAtPayoff: projectedValue,
    estimatedEquityAtPayoff: projectedValue,
  };
}
