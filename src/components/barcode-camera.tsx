import { useEffect, useRef, useState } from "react";
import { parseFinnishBarcode } from "../domain/finnish-barcode";

export function BarcodeCamera({ active, onRead }: { active: boolean; onRead: (value: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const run = useRef(0);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState("");

  function stop() {
    run.current++;
    stream.current?.getTracks().forEach(track => track.stop());
    stream.current = null;
    setScanning(false);
  }
  useEffect(() => {
    if (!active) stop();
    return () => {
      run.current++;
      stream.current?.getTracks().forEach(track => track.stop());
      stream.current = null;
    };
  }, [active]);

  async function reader() {
    const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
      import("@zxing/browser"), import("@zxing/library"),
    ]);
    return new BrowserMultiFormatReader(new Map([[DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.CODE_128]]]));
  }
  async function start() {
    stop();
    const token = run.current;
    setMessage("");
    setScanning(true);
    try {
      const decoder = await reader();
      if (token !== run.current) return;
      const camera = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      if (token !== run.current) { camera.getTracks().forEach(track => track.stop()); return; }
      stream.current = camera;
      if (!video.current) throw Error("Kameranäkymää ei voitu avata.");
      const controls = await decoder.decodeFromStream(camera, video.current, result => {
        if (!result || token !== run.current) return;
        try {
          const value = result.getText();
          parseFinnishBarcode(value);
          onRead(value);
          setMessage("Viivakoodi luettu. Tarkista tiedot ja lisää ne laskuluonnokseen.");
          stop();
        } catch { /* Continue scanning until a valid payment barcode is found. */ }
      });
      if (token !== run.current) controls.stop();
    } catch {
      if (token !== run.current) return;
      stop();
      setMessage("Kameraa ei voitu avata. Tarkista selaimen kameraoikeus tai valitse kuva.");
    }
  }
  async function readImage(file: File) {
    stop();
    const token = run.current;
    setMessage("Luetaan kuvaa…");
    if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) {
      setMessage("Valitse enintään 10 Mt:n kuvatiedosto.");
      return;
    }
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.onload = () => typeof fileReader.result === "string" ? resolve(fileReader.result) : reject(new Error("Kuvan lukeminen epäonnistui."));
        fileReader.onerror = () => reject(new Error("Kuvan lukeminen epäonnistui."));
        fileReader.readAsDataURL(file);
      });
      const decoder = await reader();
      const result = await decoder.decodeFromImageUrl(dataUrl);
      if (token !== run.current) return;
      const value = result.getText();
      parseFinnishBarcode(value);
      onRead(value);
      setMessage("Viivakoodi luettu. Tarkista tiedot ja lisää ne laskuluonnokseen.");
    } catch {
      if (token === run.current) setMessage("Kuvasta ei löytynyt kelvollista pankkiviivakoodia. Kokeile terävämpää kuvaa tai liitä virtuaaliviivakoodi.");
    }
  }
  return <div className="barcode-camera">
    {scanning ? <button type="button" onClick={stop}>Sulje kamera</button> : <button type="button" onClick={() => void start()}>Lue kameralla</button>}
    <label>Valitse kuva viivakoodista<input type="file" accept="image/*" onChange={event => { const file = event.target.files?.[0]; if (file) void readImage(file); event.target.value = ""; }} /></label>
    <video ref={video} hidden={!scanning} muted playsInline aria-label="Kameran kuva viivakoodin lukemiseen" />
    {message && <p role="status">{message}</p>}
  </div>;
}
