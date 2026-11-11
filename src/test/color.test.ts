import { describe, expect, it } from "vitest";
import { contrastForeground, relativeLuminance } from "../domain/color";

describe("Teemojen värikontrasti", () => {
  it("valitsee vaalealle ja tummalle korostusvärille kontrastisen tekstin", () => {
    expect(contrastForeground("#ffffff")).toBe("#101a15");
    expect(contrastForeground("#000000")).toBe("#ffffff");
    expect(contrastForeground("#075b45")).toBe("#ffffff");
    expect(contrastForeground("#f4c95d")).toBe("#101a15");
  });

  it("laskee sRGB-värin suhteellisen luminanssin ja hylkää virheellisen arvon", () => {
    expect(relativeLuminance("#000000")).toBe(0);
    expect(relativeLuminance("#ffffff")).toBe(1);
    expect(() => relativeLuminance("teal")).toThrow("Virheellinen väri.");
  });
});
