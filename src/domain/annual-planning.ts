import { expenseType, occurrenceAmount, occurrenceStatus, scheduledOccurrences } from "./calculations";
import type { AnnualReservation, Entry, State } from "./model";
import { shiftMonth } from "./monthly-planning";

export type AnnualCalendarOccurrence = {
  expenseId: string;
  name: string;
  category: string;
  date: string;
  amount: number;
};

export type AnnualReserveItem = {
  expense: Entry;
  eligible: boolean;
  annualizedMonthly: number;
  occurrences: AnnualCalendarOccurrence[];
  staleReservations: AnnualReservation[];
  nextDue: AnnualCalendarOccurrence | null;
  reservedForNextDue: number;
  shortfallForNextDue: number;
  savingsInstallments: number;
  neededPerMonth: number | null;
};

function addMonthsClamped(date: string, months: number) {
  const [year, month, day] = date.split("-").map(Number);
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target.toISOString().slice(0, 10);
}

function savingsInstallmentsBefore(asOf: string, dueDate: string) {
  let count = 0;
  for (let index = 1; index <= 600; index++) {
    const date = addMonthsClamped(asOf, index);
    if (date > dueDate) break;
    count++;
  }
  return count;
}

function upcomingOccurrences(expense: Entry, fromDate: string, months: number) {
  const fromMonth = fromDate.slice(0, 7);
  return Array.from({ length: months + 1 }, (_, index) => shiftMonth(fromMonth, index))
    .flatMap((month) => scheduledOccurrences(expense, month))
    .filter((date) => date >= fromDate && occurrenceStatus(expense, date) === "planned")
    .map((date) => ({
      expenseId: expense.id,
      name: expense.name,
      category: expense.category,
      date,
      amount: occurrenceAmount(expense, date),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function annualReserveSummary(state: State, asOf: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf)) throw Error("Tarkista laskentapäivä.");
  const startMonth = asOf.slice(0, 7);
  const months = Array.from({ length: 12 }, (_, index) => shiftMonth(startMonth, index));
  const endMonth = months[months.length - 1];
  const plans = new Set(state.annualReservePlans || []);
  const reservations = state.annualReservations || [];
  const expenses = new Map(state.expenses.map((item) => [item.id, item]));
  const orphanPlans = [...plans].filter((expenseId) => !expenses.has(expenseId));
  const items: AnnualReserveItem[] = [...plans]
    .map((expenseId) => expenses.get(expenseId))
    .filter((item): item is Entry => Boolean(item))
    .map((expense) => {
      const eligible = expense.active && expenseType(expense) === "consumption";
      const occurrences = eligible ? upcomingOccurrences(expense, asOf, 11) : [];
      const annualWindowStart = eligible && expense.recurrence !== "once"
        ? upcomingOccurrences(expense, asOf, 24)[0]?.date
        : undefined;
      const annualWindowEnd = annualWindowStart ? addMonthsClamped(annualWindowStart, 12) : "";
      const annualOccurrences = annualWindowStart
        ? upcomingOccurrences(expense, annualWindowStart, 12).filter(item => item.date < annualWindowEnd)
        : [];
      const recurringTotal = annualOccurrences.reduce((total, occurrence) => total + occurrence.amount, 0);
      if (!Number.isSafeInteger(recurringTotal)) throw Error("Vuosikellon laskettu summa ylittää turvallisen laskentarajan.");
      const annualizedMonthly = Math.ceil(recurringTotal / 12);
      const nextDue = occurrences[0] || null;
      const scheduledDates = new Set(Array.from({ length: 25 }, (_, index) => shiftMonth(asOf.slice(0, 7), index))
        .flatMap(month => scheduledOccurrences(expense, month).filter(date => occurrenceStatus(expense, date) !== "skipped")));
      const staleReservations = reservations.filter(item => item.expenseId === expense.id && item.occurrenceDate >= asOf && !scheduledDates.has(item.occurrenceDate));
      const nextReservation = nextDue
        ? reservations.find((item) => item.expenseId === expense.id && item.occurrenceDate === nextDue.date)
        : undefined;
      const reservedForNextDue = nextReservation
        ? Math.max(0, nextReservation.amount - (nextReservation.usedAmount || 0))
        : 0;
      const shortfallForNextDue = nextDue ? Math.max(0, nextDue.amount - reservedForNextDue) : 0;
      const savingsInstallments = nextDue ? savingsInstallmentsBefore(asOf, nextDue.date) : 0;
      return {
        expense,
        eligible,
        annualizedMonthly,
        occurrences,
        staleReservations,
        nextDue,
        reservedForNextDue,
        shortfallForNextDue,
        savingsInstallments,
        neededPerMonth: !nextDue || shortfallForNextDue === 0 || savingsInstallments === 0
          ? shortfallForNextDue === 0 && nextDue ? 0 : null
          : Math.ceil(shortfallForNextDue / savingsInstallments),
      };
    })
    .sort((a, b) => (a.nextDue?.date || "9999-99-99").localeCompare(b.nextDue?.date || "9999-99-99") || a.expense.name.localeCompare(b.expense.name, "fi"));

  const monthlyByMonth = Object.fromEntries(months.map((month) => [month, [] as AnnualCalendarOccurrence[]]));
  for (const item of items)
    for (const occurrence of item.occurrences)
      monthlyByMonth[occurrence.date.slice(0, 7)].push(occurrence);

  const monthlyReserve = items.reduce((total, item) => total + item.annualizedMonthly, 0);
  if (!Number.isSafeInteger(monthlyReserve)) throw Error("Vuosikellon kuukausivaraus ylittää turvallisen laskentarajan.");
  return {
    months,
    endMonth,
    orphanPlans,
    items,
    monthlyReserve,
    monthlyByMonth,
  };
}
