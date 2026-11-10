import { MAX, validDate } from "./calculations";
const days = (a: string, b: string) => (Date.parse(b) - Date.parse(a)) / 86400000;
function dueDate(start: string, months: number) {
  const [y, m, d] = start.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1 + months, 1));
  const last = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0)).getUTCDate();
  base.setUTCDate(Math.min(d, last));
  return base.toISOString().slice(0, 10);
}
/** An estimate from the recorded balance date, never a verified bank balance. */
export function loanEstimate(balance: number, rate: number, payment: number, start: string, asOf: string, monthlyFee = 0, openingFee = 0) {
  if (!validDate(start) || !validDate(asOf) || asOf < start) throw Error("Valitse päivä aikaisintaan saldon päivämäärästä.");
  if (![balance, payment, monthlyFee, openingFee].every(v => Number.isSafeInteger(v) && v >= 0 && v <= MAX) || !Number.isFinite(rate) || rate < 0 || rate > 100) throw Error("Tarkista summat ja korko (0–100 %).");
  if (payment === 0) return { balance: balance + Math.round(balance * rate / 100 * days(start, asOf) / 365), apr: null, months: null, paid: 0 };
  let remaining = balance, previous = start, projected = balance, paid = 0, months: number | null = null;
  const flows: { date: string; amount: number }[] = [];
  for (let n = 1; n <= 1200 && remaining > 0; n++) {
    const date = dueDate(start, n);
    const interest = Math.round(remaining * rate / 100 * days(previous, date) / 365);
    if (asOf < date && asOf >= previous) projected = remaining + Math.round(remaining * rate / 100 * days(previous, asOf) / 365);
    const installment = Math.min(payment, remaining + interest);
    remaining = Math.max(0, remaining + interest - installment);
    if (remaining > MAX) throw Error("Arvio ylittää laskentarajan.");
    flows.push({ date, amount: installment + monthlyFee });
    if (date <= asOf) { projected = remaining; paid += installment + monthlyFee; }
    if (!remaining) { months = n; break; }
    previous = date;
  }
  if (months === null && asOf > previous) throw Error("Valittu päivä ylittää laskennan 100 vuoden rajan.");
  let apr: number | null = null;
  const net = balance - openingFee;
  if (months !== null && net > 0 && flows.length) {
    const pv = (r: number) => flows.reduce((sum, flow) => sum + flow.amount / Math.pow(1 + r, days(start, flow.date) / 365), 0);
    let low = -0.999, high = 1000;
    if (pv(high) <= net) {
      for (let i = 0; i < 100; i++) { const mid = (low + high) / 2; if (pv(mid) > net) low = mid; else high = mid; }
      apr = Math.max(0, (low + high) / 2 * 100);
    }
  }
  return { balance: projected, apr, months, paid };
}
