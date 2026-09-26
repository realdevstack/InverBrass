import { describe, expect, it } from "vitest";

import { parseDeliveryDate, parseLineItemsBulk } from "@/lib/rules/line-items";

describe("parseLineItemsBulk", () => {
  it("parses tab-separated rows and numbers them", () => {
    const result = parseLineItemsBulk("PN-1\tRadio set\t1000\tnos\t2026-12-01");
    expect(result.errors).toEqual([]);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toEqual({
      line_no: 1,
      part_number: "PN-1",
      client_part_number: null,
      description: "Radio set",
      quantity: 1000,
      uom: "nos",
      required_delivery_date: "2026-12-01",
    });
  });

  it("reads the optional trailing client part number", () => {
    const result = parseLineItemsBulk("PN-1, Radio, 10, nos, 2026-12-01, HAL-PN-77");
    expect(result.errors).toEqual([]);
    expect(result.rows[0].client_part_number).toBe("HAL-PN-77");
    expect(result.rows[0].part_number).toBe("PN-1");
  });

  it("parses comma-separated rows and skips blanks and comments", () => {
    const result = parseLineItemsBulk("# header\n\nPN-1, Radio, 10\nPN-2, Antenna, 5");
    expect(result.rows.map((r) => r.part_number)).toEqual(["PN-1", "PN-2"]);
    expect(result.rows[1].line_no).toBe(2);
  });

  it("rejects a missing part number, a non-positive quantity and a bad date with reasons", () => {
    const result = parseLineItemsBulk(", Radio, 10\nPN-2, Antenna, 0\nPN-3, Cable, 5, nos, 01-12-2026");
    expect(result.rows).toHaveLength(0);
    expect(result.errors).toHaveLength(3);
    expect(result.errors[0].reason).toMatch(/Part number is required/);
    expect(result.errors[1].reason).toMatch(/Quantity must be a positive number/);
    expect(result.errors[2].reason).toMatch(/YYYY-MM-DD/);
  });

  it("enforces the 500-line ceiling", () => {
    const text = Array.from({ length: 505 }, (_, i) => `PN-${i}, part, 1`).join("\n");
    const result = parseLineItemsBulk(text);
    expect(result.rows).toHaveLength(500);
    expect(result.errors).toHaveLength(5);
    expect(result.errors[0].reason).toMatch(/Only 500 line items/);
  });

  it("treats a legitimate blank delivery date as no date", () => {
    const result = parseLineItemsBulk("PN-1, Radio, 10, nos,");
    expect(result.errors).toEqual([]);
    expect(result.rows[0].required_delivery_date).toBeNull();
  });
});

describe("parseDeliveryDate", () => {
  it("accepts a real date and rejects an impossible one", () => {
    expect(parseDeliveryDate("2026-02-28")).toBe("2026-02-28");
    expect(parseDeliveryDate("2026-02-30")).toBe("invalid");
    expect(parseDeliveryDate("")).toBeNull();
  });
});
