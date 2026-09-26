/**
 * Quotation pricing helpers (IMPLEMENTATION-PLAN Step 8).
 *
 * Pure, unit-tested. A recommended price is only ever a suggestion: the figure
 * that leaves the door is `final_price`, entered by a human, and nothing here
 * writes it. Commission is computed on the OEM invoice value at the OEM-wise
 * percentage with GST and TDS separated.
 */

export type PricingInputs = {
  oemPrice: number | null;
  freightAmount: number | null;
  targetMarginPercentage: number | null;
};

/** Recommended selling price before tax: (OEM price + freight) marked up. */
export function suggestRecommendedPrice(input: PricingInputs): number | null {
  if (input.oemPrice === null) return null;
  const base = input.oemPrice + (input.freightAmount ?? 0);
  const margin = input.targetMarginPercentage ?? 0;
  const price = base * (1 + margin / 100);
  return Math.round(price * 100) / 100;
}

export type CommissionInputs = {
  baseInvoiceAmount: number;
  commissionPercentage: number;
  gstPercentage?: number;
  tdsPercentage?: number;
};

export type CommissionBreakdown = {
  commissionAmount: number;
  gstAmount: number;
  tdsAmount: number;
  netReceivable: number;
};

export function commissionBreakdown(input: CommissionInputs): CommissionBreakdown {
  const commission = round2((input.baseInvoiceAmount * input.commissionPercentage) / 100);
  const gst = round2((commission * (input.gstPercentage ?? 18)) / 100);
  const tds = round2((commission * (input.tdsPercentage ?? 10)) / 100);
  return {
    commissionAmount: commission,
    gstAmount: gst,
    tdsAmount: tds,
    netReceivable: round2(commission + gst - tds),
  };
}

/** Margin actually achieved at a final price, for the past-bid view. */
export function achievedMargin(oemPrice: number | null, finalPrice: number | null): number | null {
  if (oemPrice === null || finalPrice === null || oemPrice === 0) return null;
  return round2(((finalPrice - oemPrice) / oemPrice) * 100);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
