import { describe, expect, it } from "vitest";

import {
  buildImportPlan,
  parseDelimited,
  parseHistoryCsv,
  reconcile,
} from "@/lib/rules/history-import";

const CSV = `project_name,customer_agency,part_number,description,quantity,uom,oem_name,oem_category,quoted_price,final_price,result,loss_reason,l1_price,competitor,submission_date
Radar Module,HAL,PN-RAD-01,"Radar module, long range",100,nos,Bharat Dynamics Ltd,Defence,1000000,1150000,won,,,2025-11-02
Radar Module,HAL,PN-RAD-01,"Radar module, long range",100,nos,L&T Defence,Naval,1050000,1050000,lost,price,980000,Alpha Systems,2025-11-02
Bad Row,DRDO,,Widget,10,nos,X,General,1000,1200,lost,,,2026-02-01
Sensor Array,IAF,PN-SEN-09,Sensor,abc,nos,BDL,Defence,5000,6000,won,,,2026-03-01
Old Bid,BSF,PN-OLD-1,Old,5,nos,L&T Defence,Naval,100,120,maybe,,,2026-03-02`;

describe("history import rules", () => {
  it("parses quoted CSV fields and maps header aliases", () => {
    const grid = parseDelimited('a,"b,c",d\n1,2,3');
    expect(grid[0]).toEqual(["a", "b,c", "d"]);

    const rows = parseHistoryCsv(CSV);
    expect(rows).toHaveLength(5);
    expect(rows[0].description).toBe("Radar module, long range");
  });

  it("rejects bad rows with a reason and keeps the good ones", () => {
    const plan = buildImportPlan(parseHistoryCsv(CSV));

    expect(plan.rowsRead).toBe(5);
    expect(plan.records).toHaveLength(2);
    expect(plan.rejected.map((r) => r.rowNumber)).toEqual([3, 4, 5]);
    expect(plan.rejected[0].reason).toMatch(/part number/i);
    expect(plan.rejected[1].reason).toMatch(/positive number/i);
    expect(plan.rejected[2].reason).toMatch(/result must be one of/i);
  });

  it("groups requirements, OEMs and line items without duplicating", () => {
    const plan = buildImportPlan(parseHistoryCsv(CSV));

    expect(plan.requirements.map((r) => r.projectName)).toEqual(["Radar Module"]);
    expect(plan.lineItems).toHaveLength(1);
    expect(plan.oems.map((o) => o.name).sort()).toEqual(["Bharat Dynamics Ltd", "L&T Defence"]);
    expect(plan.quotations).toHaveLength(2);
    expect(plan.quotations.map((q) => q.result)).toEqual(["won", "lost"]);
  });

  it("reconciles row counts: every row is imported or rejected", () => {
    const unbalanced = reconcile(5, 2, 2);
    expect(unbalanced.balanced).toBe(false);
    expect(unbalanced.difference).toBe(1);

    const balanced = reconcile(5, 2, 3);
    expect(balanced.balanced).toBe(true);
  });
});
