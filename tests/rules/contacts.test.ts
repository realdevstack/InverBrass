import { describe, expect, it } from "vitest";

import { pickPrimaryContact, sanitizeEmailAddress, toWhatsAppNumber } from "@/lib/rules/contacts";

describe("contact helpers", () => {
  it("prefers the primary contact that has a usable channel", () => {
    const picked = pickPrimaryContact([
      { email: null, phone: null, is_primary: true },
      { email: "secondary@example.invalid", phone: "9000000002", is_primary: false },
      { email: "primary@example.invalid", phone: "9000000001", is_primary: true },
    ]);
    expect(picked?.email).toBe("primary@example.invalid");
  });

  it("falls back to the first contact with a channel when no primary is usable", () => {
    const picked = pickPrimaryContact([
      { email: null, phone: null, is_primary: true },
      { email: "reachable@example.invalid", phone: null, is_primary: false },
    ]);
    expect(picked?.email).toBe("reachable@example.invalid");
  });

  it("returns null when nothing is on file", () => {
    expect(pickPrimaryContact([])).toBeNull();
    expect(pickPrimaryContact([{ email: null, phone: null }])).toBeNull();
  });

  it("strips mailto delimiters that could inject recipients or body", () => {
    expect(sanitizeEmailAddress("buyer@example.invalid?bcc=attacker@evil.invalid")).toBe(
      "buyer@example.invalidbcc=attacker@evil.invalid",
    );
    expect(sanitizeEmailAddress("a@b.com\r\nBcc: evil@x.invalid")).toBe("a@b.comBcc: evil@x.invalid");
    expect(sanitizeEmailAddress("  a@b.com  ")).toBe("a@b.com");
    expect(sanitizeEmailAddress("?#&")).toBeNull();
    expect(sanitizeEmailAddress(null)).toBeNull();
  });

  it("normalises a phone to a wa.me number", () => {
    expect(toWhatsAppNumber("+91-90000-00001")).toBe("919000000001");
    expect(toWhatsAppNumber("9000000001")).toBe("919000000001");
    expect(toWhatsAppNumber("09000000001")).toBe("919000000001");
    expect(toWhatsAppNumber("919000000001")).toBe("919000000001");
    expect(toWhatsAppNumber("(040) 2345 6789")).toBe("914023456789");
    expect(toWhatsAppNumber(null)).toBeNull();
    expect(toWhatsAppNumber("")).toBeNull();
    expect(toWhatsAppNumber("no digits")).toBeNull();
  });
});
