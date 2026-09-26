/**
 * Critical KPIs from the client's "Dashboard requirements" tab. Pure and
 * unit-tested: it turns the raw rows the SQL views return into the ratio KPIs,
 * so the numbers are reproducible and a missing input yields null, never a
 * made-up figure.
 */

export type KpiInputs = {
  totalRfis: number;
  won: number;
  lost: number;
  /** Days from quotation creation to submission, for submitted quotations. */
  quotationTurnarounds: number[];
  /** on-time flag per delivery where a committed deadline exists. */
  deliveryOnTime: boolean[];
  /** Days from invoice date to first payment. */
  collectionDays: number[];
  /** Days from the OEM invoice being paid to the commission being raised. */
  commissionRecoveryDays: number[];
  /** Per-OEM delivery counts. */
  oemDeliveries: Array<{ onTime: number; known: number }>;
  /** PO count per client (for repeat business). */
  clientPoCounts: number[];
  /** Per-employee assigned vs won requirement counts. */
  employees: Array<{ assigned: number; won: number }>;
};

export type Kpis = {
  tenderConversionPct: number | null;
  avgQuotationTurnaroundDays: number | null;
  deliveryAdherencePct: number | null;
  avgPaymentCollectionDays: number | null;
  avgCommissionRecoveryDays: number | null;
  oemOnTimePct: number | null;
  clientRepeatPct: number | null;
  avgEmployeeClosurePct: number | null;
};

function round(value: number, digits = 1): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return round(values.reduce((sum, v) => sum + v, 0) / values.length, 2);
}

function percentage(numerator: number, denominator: number): number | null {
  if (denominator === 0) return null;
  return round((numerator / denominator) * 100);
}

export function computeKpis(input: KpiInputs): Kpis {
  const oemOnTime = input.oemDeliveries.reduce((sum, o) => sum + o.onTime, 0);
  const oemKnown = input.oemDeliveries.reduce((sum, o) => sum + o.known, 0);

  const employeeClosures = input.employees
    .filter((e) => e.assigned > 0)
    .map((e) => (e.won / e.assigned) * 100);

  return {
    tenderConversionPct: percentage(input.won, input.totalRfis),
    avgQuotationTurnaroundDays: average(input.quotationTurnarounds),
    deliveryAdherencePct: percentage(input.deliveryOnTime.filter(Boolean).length, input.deliveryOnTime.length),
    avgPaymentCollectionDays: average(input.collectionDays),
    avgCommissionRecoveryDays: average(input.commissionRecoveryDays),
    oemOnTimePct: oemKnown === 0 ? null : round((oemOnTime / oemKnown) * 100),
    clientRepeatPct: percentage(input.clientPoCounts.filter((c) => c > 1).length, input.clientPoCounts.length),
    avgEmployeeClosurePct: employeeClosures.length === 0 ? null : round(employeeClosures.reduce((s, v) => s + v, 0) / employeeClosures.length),
  };
}
