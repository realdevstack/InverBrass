import { describe, expect, it } from "vitest";

import { achievedMargin, commissionBreakdown, suggestRecommendedPrice } from "@/lib/rules/quotation";

describe("quotation pricing", () => {
  it("suggests a price from OEM price + freight + margin, never setting the final price", () => {
    expect(suggestRecommendedPrice({ oemPrice: 1000, freightAmount: 100, targetMarginPercentage: 10 })).toBe(1210);
    expect(suggestRecommendedPrice({ oemPrice: null, freightAmount: 100, targetMarginPercentage: 10 })).toBeNull();
    expect(suggestRecommendedPrice({ oemPrice: 500, freightAmount: null, targetMarginPercentage: null })).toBe(500);
  });

  it("computes commission on the invoice value with GST and TDS separated", () => {
    const breakdown = commissionBreakdown({ baseInvoiceAmount: 14750000, commissionPercentage: 5 });
    expect(breakdown.commissionAmount).toBe(737500);
    expect(breakdown.gstAmount).toBe(132750);
    expect(breakdown.tdsAmount).toBe(73750);
    expect(breakdown.netReceivable).toBe(796500);
  });

  it("reports achieved margin only when both figures exist", () => {
    expect(achievedMargin(1000, 1100)).toBe(10);
    expect(achievedMargin(null, 1100)).toBeNull();
  });
});
