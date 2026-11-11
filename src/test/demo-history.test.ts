import { describe, expect, it } from "vitest";
import { createCompassDemoCases, demoMonths, demoMonthSummary } from "../domain/compass-demos";
import { occurrenceStatus, scheduledOccurrences, total, validDate } from "../domain/calculations";
import { backup, restore } from "../services/validation";
import { kinds, today } from "../domain/model";

describe("Demotalouksien kolmen vuoden aineisto", () => {
  it("kattaa kaikissa neljässä taloudessa kaikki vuosien 2024–2026 kuukaudet", () => {
    expect(demoMonths).toHaveLength(36);
    expect(demoMonths[0]).toBe("2024-01");
    expect(demoMonths[35]).toBe("2026-12");
    for (const { state, timeline } of createCompassDemoCases("2026-11")) {
      expect(timeline.map(row => row.month)).toEqual(demoMonths);
      expect(Object.keys(state.budgets)).toEqual(demoMonths);
      for (const month of demoMonths) {
        expect(total(state.incomes, month)).toBeGreaterThan(0);
        expect(total(state.expenses, month)).toBeGreaterThan(0);
        expect(Object.keys(state.budgets[month]).length).toBeGreaterThan(10);
        const occurring = state.expenses.filter(item => scheduledOccurrences(item, month).length > 0);
        for (const expense of occurring) expect(state.budgets[month][expense.category]).toBeDefined();
      }
    }
  });
  it("antaa kaikkiin tietonäkymiin esimerkin ja säilyttää ne varmuuskopiossa", () => {
    for (const { state } of createCompassDemoCases("2026-11")) {
      for (const kind of kinds) expect(state[kind].length).toBeGreaterThan(0);
      expect(state.scenarios).toHaveLength(3);
      expect(state.liabilities.some(item => item.linkedAssetId)).toBe(true);
      expect(restore(backup(state))).toEqual(state);
      for (const kind of kinds) for (const item of state[kind]) {
        expect(validDate(item.date)).toBe(true);
        expect(item.amount).toBeGreaterThanOrEqual(0);
        expect(item.date >= "2024-01-01" && (kind === "goals" || item.date <= "2026-12-31")).toBe(true);
      }
    }
  });
  it("esittää tulokatkoksen kiinteästi elokuusta 2026 lähtien", () => {
    const { state, timeline } = createCompassDemoCases("2026-11")[3];
    const july = timeline.find(row => row.month === "2026-07")!;
    const august = timeline.find(row => row.month === "2026-08")!;
    expect(august.income).toBeLessThan(july.income * .6);
    expect(state.incomes.some(item => item.name === "Aikuisen 1 nettopalkka" && item.date === "2026-07-15")).toBe(true);
    expect(state.incomes.some(item => item.name === "Aikuisen 1 nettopalkka" && item.date >= "2026-08-01")).toBe(false);
    expect(state.incomes.some(item => item.name === "Aikuisen 2 nettopalkka" && item.date.startsWith("2026-12"))).toBe(true);
  });
  it("ei merkitse tulevia tapahtumia toteutuneiksi tai vahvista tulevia kuukausia", () => {
    for (const { state } of createCompassDemoCases("2026-11")) {
      for (const entry of [...state.incomes, ...state.expenses]) {
        expect(entry.occurrenceStatuses).toEqual({});
        if (entry.date > today()) expect(occurrenceStatus(entry, entry.date)).toBe("planned");
      }
      expect(state.coverage.incomeMonths.every(month => month < today().slice(0, 7))).toBe(true);
      expect(state.coverage.expenseMonths.every(month => month < today().slice(0, 7))).toBe(true);
    }
  });
  it("tarjoaa vaihtelua ja saman kuukausisuunnitelman kompassiin kuin ladattavaan aineistoon", () => {
    for (const { state, timeline } of createCompassDemoCases("2026-11")) {
      expect(new Set(timeline.map(row => row.income)).size).toBeGreaterThan(6);
      expect(new Set(timeline.map(row => row.expense)).size).toBeGreaterThan(6);
      for (const row of timeline) expect(row).toEqual(demoMonthSummary(state, row.month));
      expect(state.expenses.some(item => item.recurrence === "monthly" && item.endDate === "2026-12-31")).toBe(true);
    }
  });
  it("pitää esimerkin valitun kuukauden aineiston sisällä myös vuosien ulkopuolelta avattaessa", () => {
    expect(createCompassDemoCases("2023-12").every(item => item.state.settings.month === "2024-01")).toBe(true);
    expect(createCompassDemoCases("2027-01").every(item => item.state.settings.month === "2026-12")).toBe(true);
  });
  it("sisältää uudet arvomallit, porrastetut autot, 20 lähdehintakohdetta ja arkisia tapahtumia", () => {
    const cases=createCompassDemoCases("2026-11");
    const symbols=new Set(cases.flatMap(({state})=>state.investments.map(item=>item.marketSymbol)));
    expect(symbols.size).toBe(20);
    for(const {state} of cases){expect(state.expenses.length).toBeGreaterThan(950);expect(state.assets.filter(item=>item.assetModel).length).toBe(3);expect(state.assets.find(item=>item.category==="Auto")!.assetModel!.vehicleCurve).toBe("staged-v2");expect(state.liabilities.some(item=>item.category==="Opintolaina"&&item.payment===0)).toBe(true);expect(state.goals).toHaveLength(3);expect(state.expenses.some(item=>item.category==="Hygieniatarvikkeet")).toBe(true);expect(state.expenses.some(item=>Object.keys(item.occurrenceAmounts).length>0)).toBe(true);}
  });

});
