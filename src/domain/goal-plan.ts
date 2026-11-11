import { MAX, validDate } from "./calculations";
import { today } from "./model";

/** First contribution is one month from the calculation date; month ends clamp. */
export function goalPlan(amount: number, target: number, monthly: number, deadline: string, mode: "target" | "monthly", asOf = today()) {
  if (!validDate(asOf) || !validDate(deadline)) throw Error("Valitse kelvollinen tavoitepäivä.");
  for (const value of [amount, target, monthly])
    if (!Number.isSafeInteger(value) || value < 0 || value > MAX) throw Error("Tarkista tavoitteen summat.");
  const [year, month, day] = asOf.split("-").map(Number);
  const [endYear, endMonth] = deadline.split("-").map(Number);
  let months = Math.max(0, (endYear - year) * 12 + endMonth - month);
  if (months > 0) {
    const lastDay = new Date(Date.UTC(endYear, endMonth, 0)).getUTCDate();
    const lastPayment = `${endYear}-${String(endMonth).padStart(2, "0")}-${String(Math.min(day, lastDay)).padStart(2, "0")}`;
    if (lastPayment > deadline) months--;
  }
  if (mode === "target" && target <= amount) return { target, monthly: 0, months };
  if (!months) throw Error("Valitse tavoitepäivä, johon mahtuu vähintään yksi kuukausisäästö. Ensimmäinen erä on kuukauden päästä.");
  const result = mode === "target"
    ? { target, monthly: Math.ceil((target - amount) / months), months }
    : { target: amount + monthly * months, monthly, months };
  if (!Number.isSafeInteger(result.target) || result.target > MAX) throw Error("Laskettu tavoitesumma ylittää laskentarajan.");
  return result;
}
