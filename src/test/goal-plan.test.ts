import { describe, expect, it } from "vitest";
import { goalPlan } from "../domain/goal-plan";
import { MAX } from "../domain/calculations";
describe("goal planning", () => {
  it("calculates monthly saving from existing savings and rounds cents up", () => {
    expect(goalPlan(10000, 100001, 0, "2027-02-10", "target", "2026-11-10")).toEqual({ target: 100001, monthly: 30001, months: 3 });
  });
  it("calculates the target from monthly saving over the same period", () => {
    expect(goalPlan(10000, 0, 20000, "2027-02-10", "monthly", "2026-11-10")).toEqual({ target: 70000, monthly: 20000, months: 3 });
  });
  it("counts only payments on or before the deadline", () => {
    expect(goalPlan(0, 10000, 0, "2027-02-09", "target", "2026-11-10").months).toBe(2);
  });
  it("clamps month-end payments including leap years", () => {
    expect(goalPlan(0, 10000, 0, "2027-02-28", "target", "2027-01-31").months).toBe(1);
    expect(goalPlan(0, 10000, 0, "2028-02-29", "target", "2028-01-31").months).toBe(1);
  });
  it("handles achieved targets and zero monthly saving", () => {
    expect(goalPlan(10000, 5000, 9999, "2025-01-01", "target", "2026-11-10").monthly).toBe(0);
    expect(goalPlan(10000, 5000, 0, "2027-01-10", "monthly", "2026-11-10").target).toBe(10000);
  });
  it("rejects impossible dates, invalid amounts and overflow", () => {
    expect(() => goalPlan(0, 10000, 0, "2026-11-10", "target", "2026-11-10")).toThrow();
    expect(() => goalPlan(0, 10000, 0, "2026-02-30", "target", "2026-11-10")).toThrow();
    expect(() => goalPlan(-1, 10000, 0, "2027-01-10", "target", "2026-11-10")).toThrow();
    expect(() => goalPlan(1, 0, MAX, "2027-01-10", "monthly", "2026-11-10")).toThrow();
  });
});
