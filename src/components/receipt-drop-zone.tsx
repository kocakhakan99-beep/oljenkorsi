import { useEffect, useRef, useState } from "react";
import { ScanLine } from "lucide-react";
import { receiptFileError } from "../domain/receipts/files";

/** Window capture reaches headings, cards, buttons and native file inputs alike. */
export function ReceiptDropZone({ enabled, onFile, onError }: { enabled: boolean; onFile: (file: File) => void; onError: (message: string) => void }) {
  const [over, setOver] = useState(false);
  const depth = useRef(0), current = useRef({ enabled, onFile, onError });
  current.current = { enabled, onFile, onError };
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
      const error = receiptFileError(files);
      if (error) { current.current.onError(error); return; }
      current.current.onFile(files[0]);
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
  return over && enabled ? <div className="receipt-drop-overlay" role="status"><div><ScanLine size={38} aria-hidden="true" /><strong>Pudota PDF-kuitti</strong><span>Avataan kuittiskannaus menoissa</span></div></div> : null;
}
