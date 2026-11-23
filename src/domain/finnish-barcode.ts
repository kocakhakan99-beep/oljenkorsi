import { validDate } from "./calculations";

function mod97(value: string) {
  let remainder = 0;
  for (const digit of value) remainder = (remainder * 10 + Number(digit)) % 97;
  return remainder;
}

/** Reads the 54 numeric characters encoded in a Finnish payment barcode. */
export function parseFinnishBarcode(input: string) {
  const code = input.replace(/\s/g, "");
  if (!/^[45]\d{53}$/.test(code)) throw Error("Anna 54 numeroa sisältävä version 4 tai 5 virtuaaliviivakoodi.");
  const iban = `FI${code.slice(1, 17)}`;
  if (mod97(`${iban.slice(4)}1518${iban.slice(2, 4)}`) !== 1) throw Error("Tilinumeron tarkiste ei täsmää.");
  const amount = Number(code.slice(17, 25));
  const rawReference = code.slice(25, 48);
  let reference: string;
  if (code[0] === "4") {
    if (rawReference.slice(0, 3) !== "000") throw Error("Viivakoodin varattu kenttä on virheellinen.");
    reference = rawReference.slice(3).replace(/^0+/, "");
    if (reference.length < 4 || reference.length > 20) throw Error("Viitenumeron pituus on virheellinen.");
    const digits = reference.slice(0, -1).split("").reverse();
    const total = digits.reduce((sum, digit, index) => sum + Number(digit) * [7, 3, 1][index % 3], 0);
    if ((10 - total % 10) % 10 !== Number(reference.at(-1))) throw Error("Viitenumeron tarkiste ei täsmää.");
  } else {
    const body = rawReference.slice(2).replace(/^0+/, "");
    if (!body) throw Error("RF-viite puuttuu.");
    reference = `RF${rawReference.slice(0, 2)}${body}`;
    if (mod97(`${body}2715${rawReference.slice(0, 2)}`) !== 1) throw Error("RF-viitteen tarkiste ei täsmää.");
  }
  const dateCode = code.slice(48);
  const date = dateCode === "000000" ? "" : `20${dateCode.slice(0, 2)}-${dateCode.slice(2, 4)}-${dateCode.slice(4, 6)}`;
  if (date && !validDate(date)) throw Error("Eräpäivä on virheellinen.");
  return { iban, reference, amountCents: amount || null, date };
}
