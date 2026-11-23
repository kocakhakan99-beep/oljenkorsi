import { describe, expect, it } from "vitest";
import { empty, entry } from "../domain/model";
import { applyCsvReconciliation, reconciliationCandidates } from "../domain/csv-reconciliation";

function fixture() {
  const state = empty();
  const existing = entry({ name: "Vuokra", date: "2099-02-01", recurrence: "monthly", amount: 70000, category: "Asuminen", description: "Sopimus" });
  const imported = entry({ name: "Pankkirivi", date: "2099-03-01", amount: 70000, category: "Muu" });
  state.expenses = [existing];
  return { state, existing, imported };
}
describe("CSV:n täsmäytys", () => {
  it("kohdistaa vain samansuuruisen suunnitellun esiintymän oikeaan päivään", () => {
    const { state, existing, imported } = fixture();
    expect(reconciliationCandidates(state, "expenses", imported).map(item => item.id)).toEqual([existing.id]);
    expect(reconciliationCandidates(state, "expenses", { ...imported, date: "2099-03-02" })).toEqual([]);
    expect(reconciliationCandidates(state, "expenses", { ...imported, amount: 69999 })).toEqual([]);
  });
  it("merkitsee vain yhden toistuvan tapahtuman toteutuneeksi ja säilyttää muut tiedot", () => {
    const { state, existing, imported } = fixture();
    const next = applyCsvReconciliation(state, "expenses", [], [{ imported, targetId: existing.id }]);
    expect(next.expenses).toEqual([{ ...existing, occurrenceStatuses: { "2099-03-01": "actual" } }]);
    expect(state.expenses[0].occurrenceStatuses).toEqual({});
    expect(reconciliationCandidates(next, "expenses", imported)).toEqual([]);
  });
  it("hylkää saman tapahtuman kaksoiskohdistuksen sekä vanhentuneen kohteen", () => {
    const { state, existing, imported } = fixture();
    expect(() => applyCsvReconciliation(state, "expenses", [], [{ imported, targetId: existing.id }, { imported, targetId: existing.id }])).toThrow();
    expect(() => applyCsvReconciliation(state, "expenses", [], [{ imported, targetId: "missing" }])).toThrow();
    expect(state.expenses).toEqual([existing]);
  });
});
