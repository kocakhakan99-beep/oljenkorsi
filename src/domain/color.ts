function linearChannel(channel: number) {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string) {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) throw Error("Virheellinen väri.");
  const red = linearChannel(parseInt(hex.slice(1, 3), 16));
  const green = linearChannel(parseInt(hex.slice(3, 5), 16));
  const blue = linearChannel(parseInt(hex.slice(5, 7), 16));
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

export function contrastForeground(hex: string) {
  const luminance = relativeLuminance(hex);
  const white = 1.05 / (luminance + 0.05);
  const ink = (luminance + 0.05) / 0.05;
  return white >= ink ? "#ffffff" : "#101a15";
}
