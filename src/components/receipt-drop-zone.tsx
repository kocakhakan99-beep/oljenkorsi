import { useEffect, useRef, useState } from "react";
import { ScanLine } from "lucide-react";
import { importBatchError } from "../domain/receipts/files";

/** Window capture reaches headings, cards, buttons and native file inputs alike. */
export function ReceiptDropZone({ enabled, onFiles, onError }: { enabled: boolean; onFiles: (files: File[], kind: "receipt" | "invoice") => void; onError: (message: string) => void }) {
  const [over, setOver] = useState(false);
  const [pending, setPending] = useState<File[]>([]);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (pending.length) dialog.current?.showModal(); }, [pending]);
  const depth = useRef(0), current = useRef({ enabled, onFiles, onError });
  current.current = { enabled, onFiles, onError };
  useEffect(() => { if (!enabled) { depth.current = 0; setOver(false); } }, [enabled]);
  useEffect(() => {
    const isFile = (e: DragEvent) => Array.from(e.dataTransfer?.types || []).includes("Files");
    const reset = () => { depth.current = 0; setOver(false); };
    const enter = (e: DragEvent) => {
      if (!isFile(e)) return;
      e.preventDefault();
      if (!current.current.enabled || document.querySelector("dialog[open]")) return;
      depth.current++; setOver(true);
    };
    const overFile = (e: DragEvent) => {
      if (!isFile(e)) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = current.current.enabled ? "copy" : "none";
    };
    const leave = () => { depth.current = Math.max(0, depth.current - 1); if (!depth.current) setOver(false); };
    const drop = (e: DragEvent) => {
      if (!isFile(e)) return;
      // Prevent browser navigation and native input handling, including unsupported drops.
      e.preventDefault(); e.stopPropagation(); reset();
      if (!current.current.enabled) return;
      if (document.querySelector("dialog[open]")) { current.current.onError("Sulje avoin ikkuna ennen PDF-kuitin pudottamista."); return; }
      const files = Array.from(e.dataTransfer?.files || []);
      const error = importBatchError(files);
      if (error) { current.current.onError(error); return; }
      setPending(files);
    };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") reset(); };
    window.addEventListener("dragenter", enter, true); window.addEventListener("dragover", overFile, true);
    window.addEventListener("dragleave", leave, true); window.addEventListener("drop", drop, true);
    window.addEventListener("dragend", reset); window.addEventListener("blur", reset); window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("dragenter", enter, true); window.removeEventListener("dragover", overFile, true);
      window.removeEventListener("dragleave", leave, true); window.removeEventListener("drop", drop, true);
      window.removeEventListener("dragend", reset); window.removeEventListener("blur", reset); window.removeEventListener("keydown", key);
    };
  }, []);
  return <>{pending.length > 0 && <dialog ref={dialog} onCancel={() => setPending([])} aria-label="Valitse tuontitapa"><h2>{pending.length} PDF-tiedostoa</h2><p>Ovatko tiedostot kuitteja vai laskuja? Tuo erityyppiset tiedostot erikseen.</p>{(["receipt", "invoice"] as const).map(kind => <button key={kind} onClick={() => { dialog.current?.close(); onFiles(pending, kind); setPending([]); }}>{kind === "receipt" ? "Kuitti" : "Lasku"}</button>)}<button onClick={() => { dialog.current?.close(); setPending([]); }}>Peruuta</button></dialog>}{over && enabled ? <div className="receipt-drop-overlay" role="status"><div><ScanLine size={38} aria-hidden="true" /><strong>Pudota PDF-tiedostot</strong><span>Valitse seuraavaksi kuitti tai lasku</span></div></div> : null}</>;
}
