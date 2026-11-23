import { describe, expect, it } from "vitest";
import { empty, entry, today } from "../domain/model";
import { dashboardAttention } from "../domain/dashboard-attention";
import { shiftMonth } from "../domain/monthly-planning";

describe("yhteenvedon huomioitavat asiat", () => {
  it("nostaa budjetin ylityksen, mutta ei tee epävarmaa ennustetta omasta toteumasta", () => {
    const state = empty();
    const asOf = today();
    const month = asOf.slice(0, 7);
    state.expenses = [entry({ name: "Ostos", category: "Ruoka", date: asOf, amount: 12000 })];
    state.budgets[month] = { Ruoka: 10000 };
    expect(dashboardAttention(state, month, asOf).budget).toEqual([{ category: "Ruoka", shortfall: 2000, actualOnly: false }]);
    state.budgetActuals[month] = { Ruoka: 15000 };
    expect(dashboardAttention(state, month, asOf).budget).toEqual([{ category: "Ruoka", shortfall: 5000, actualOnly: true }]);
    state.budgetActuals[month] = { Ruoka: 9000 };
    expect(dashboardAttention(state, month, asOf).budget).toEqual([]);
  });
  it("näyttää tarkistuksen vain päättyneelle vahvistamattomalle kuukaudelle", () => {
    const state = empty();
    const asOf = today();
    const current = asOf.slice(0, 7);
    const previous = shiftMonth(current, -1);
    expect(dashboardAttention(state, previous, asOf).review).toBe(true);
    expect(dashboardAttention(state, current, asOf).review).toBe(false);
    state.coverage = { incomeMonths: [previous], expenseMonths: [previous] };
    expect(dashboardAttention(state, previous, asOf).review).toBe(false);
  });
  it("näyttää lähellä erääntyvän vajaan varauksen ja poistaa huomion kun erä on katettu", () => {
    const state = empty();
    const asOf = today();
    const due = new Date(`${asOf}T00:00:00Z`);
    due.setUTCDate(due.getUTCDate() + 20);
    const date = due.toISOString().slice(0, 10);
    const bill = entry({ name: "Lasku", date, amount: 60000 });
    state.expenses = [bill]; state.annualReservePlans = [bill.id];
    expect(dashboardAttention(state, asOf.slice(0, 7), asOf).reserves[0].shortfallForNextDue).toBe(60000);
    state.annualReservations = [{ expenseId: bill.id, occurrenceDate: date, amount: 60000 }];
    expect(dashboardAttention(state, asOf.slice(0, 7), asOf).reserves).toEqual([]);
  });
});
