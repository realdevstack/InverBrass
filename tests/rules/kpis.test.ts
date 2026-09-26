import { describe, expect, it } from "vitest";

import { computeKpis, type KpiInputs } from "@/lib/rules/kpis";

const base: KpiInputs = {
  totalRfis: 20,
  won: 5,
  lost: 3,
  quotationTurnarounds: [3, 5, 4],
  deliveryOnTime: [true, true, false, true],
  collectionDays: [30, 40],
  commissionRecoveryDays: [7, 9],
  oemDeliveries: [{ onTime: 3, known: 4 }],
  clientPoCounts: [1, 2, 3],
  employees: [{ assigned: 4, won: 2 }, { assigned: 2, won: 1 }],
};

describe("critical KPIs", () => {
  it("computes the ratio KPIs from raw rows", () => {
    const kpis = computeKpis(base);
    expect(kpis.tenderConversionPct).toBe(25);
    expect(kpis.avgQuotationTurnaroundDays).toBe(4);
    expect(kpis.deliveryAdherencePct).toBe(75);
    expect(kpis.avgPaymentCollectionDays).toBe(35);
    expect(kpis.avgCommissionRecoveryDays).toBe(8);
    expect(kpis.oemOnTimePct).toBe(75);
    expect(kpis.clientRepeatPct).toBe(66.7);
    expect(kpis.avgEmployeeClosurePct).toBe(50);
  });

  it("returns null rather than inventing a number when there is no data", () => {
    const kpis = computeKpis({
      totalRfis: 0,
      won: 0,
      lost: 0,
      quotationTurnarounds: [],
      deliveryOnTime: [],
      collectionDays: [],
      commissionRecoveryDays: [],
      oemDeliveries: [],
      clientPoCounts: [],
      employees: [],
    });
    expect(kpis.tenderConversionPct).toBeNull();
    expect(kpis.deliveryAdherencePct).toBeNull();
    expect(kpis.oemOnTimePct).toBeNull();
    expect(kpis.avgEmployeeClosurePct).toBeNull();
  });
});
