import { describe, expect, it } from "vitest";
import {
  monthly,
  nextRenewal,
  parseLibrary,
  sampleLibrary,
  validate,
  validDate,
  daysUntil,
  type Subscription,
} from "./subscriptions";
const item: Subscription = {
  id: "one",
  name: "Test",
  price: 1200,
  cycle: "monthly",
  category: "Development",
  anchor: "2024-01-31",
  active: true,
};
describe("subscription calculations", () => {
  it("clamps short months and recovers the billing day", () => {
    expect(nextRenewal(item, "2024-02-01")).toBe("2024-02-29");
    expect(nextRenewal(item, "2024-03-01")).toBe("2024-03-31");
    expect(nextRenewal(item, "2025-02-01")).toBe("2025-02-28");
  });
  it("handles annual leap day renewals", () => {
    const annual = { ...item, cycle: "yearly" as const, anchor: "2024-02-29" };
    expect(nextRenewal(annual, "2025-01-01")).toBe("2025-02-28");
    expect(nextRenewal(annual, "2028-01-01")).toBe("2028-02-29");
  });
  it("includes today and preserves future start dates", () => {
    expect(nextRenewal(item, "2024-01-31")).toBe("2024-01-31");
    expect(nextRenewal(item, "2023-12-01")).toBe("2024-01-31");
  });
  it("normalizes annual costs and excludes paused subscriptions", () => {
    expect(monthly({ ...item, cycle: "yearly" })).toBe(100);
    expect(monthly({ ...item, active: false })).toBe(0);
  });
  it("uses calendar days without daylight saving drift", () => {
    expect(daysUntil("2024-03-11", "2024-03-09")).toBe(2);
  });
  it("rejects impossible dates and invalid money", () => {
    expect(validDate("2025-02-29")).toBe(false);
    expect(validDate("2024-02-29")).toBe(true);
    for (const price of [-1, NaN, Infinity, 0])
      expect(() => validate({ ...item, price })).toThrow();
  });
  it("round trips sample data and intentionally empty libraries", () => {
    const data = sampleLibrary("2026-11-14");
    expect(parseLibrary(JSON.stringify(data))).toEqual(data);
    expect(parseLibrary('{"version":1,"demo":false,"items":[]}').items).toEqual(
      [],
    );
  });
  it("rejects malformed backups and duplicates", () => {
    for (const raw of [
      "{}",
      "null",
      JSON.stringify({ version: 1, demo: false, items: [item, item] }),
      JSON.stringify({
        version: 1,
        demo: false,
        items: [{ ...item, category: "bad" }],
      }),
    ])
      expect(() => parseLibrary(raw)).toThrow();
  });
});
