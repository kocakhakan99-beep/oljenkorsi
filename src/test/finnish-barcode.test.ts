import { describe, expect, it } from "vitest";
import { parseFinnishBarcode } from "../domain/finnish-barcode";

// Finanssiala guide section 13.2, test invoice 3.
const rf = "5" + "0250004640001302" + "00069380" + "61" + "000000000698756720839" + "110724";
// Finanssiala guide section 13.1, test invoice 6.
const domestic = "4" + "7331313001000058" + "00000000" + "000" + "00000000000000868624" + "130809";

describe("suomalainen virtuaaliviivakoodi", () => {
  it("lukee kansallisen viitteen ja puuttuvan summan", () => {
    expect(parseFinnishBarcode(domestic)).toEqual({ iban: "FI7331313001000058", amountCents: null, reference: "868624", date: "2013-08-09" });
  });
  it("lukee RF-viitteen ja sallitut välilyönnit", () => {
    expect(parseFinnishBarcode(`${rf.slice(0, 20)} ${rf.slice(20)}`)).toEqual({ iban: "FI0250004640001302", amountCents: 69380, reference: "RF61698756720839", date: "2011-07-24" });
  });
  it("hyväksyy puuttuvan eräpäivän", () => {
    expect(parseFinnishBarcode(domestic.slice(0, 48) + "000000").date).toBe("");
  });
  it.each([
    "123", "6" + domestic.slice(1),
    domestic.slice(0, 10) + "9" + domestic.slice(11),
    domestic.slice(0, 25) + "100" + domestic.slice(28),
    domestic.slice(0, 47) + "5" + domestic.slice(48),
    domestic.slice(0, 48) + "260230",
    rf.slice(0, 25) + "62" + rf.slice(27),
  ])("hylkää virheellisen koodin %s", code => {
    expect(() => parseFinnishBarcode(code)).toThrow();
  });
});
