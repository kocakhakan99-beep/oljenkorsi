import type { ReactNode } from 'react';

/** The illustration is decorative; the live text reports actual work. */
export function DocumentProcessing({ kind, progress, action, stage = 'working' }: { kind: 'receipt' | 'invoice'; progress: string; action?: ReactNode; stage?: 'working' | 'waiting' | 'review' | 'attention' }) {
  const receipt = kind === 'receipt';
  return <div className={`document-processing document-processing--${kind}`}>
    <div className="document-processing-art" aria-hidden="true">
      <span className="document-processing-track" />
      <svg className="document-processing-paper document-processing-paper--in" viewBox="0 0 54 70">
        <path d={receipt ? 'M7 3h40v61l-5-4-5 4-5-4-5 4-5-4-5 4-5-4-5 4z' : 'M6 3h30l12 12v51H6z'} />
        {!receipt && <path className="document-processing-fold" d="M36 3v13h12" />}
        <path className="document-processing-lines" d="M15 24h24M15 32h24M15 40h17M15 49h20" />
      </svg>
      <svg className="document-processing-machine" viewBox="0 0 150 110">
        <rect x="15" y="22" width="120" height="76" rx="18" className="machine-shell" />
        <rect x="27" y="36" width="96" height="46" rx="10" className="machine-face" />
        <rect x="39" y="52" width="72" height="12" rx="6" className="machine-slot" />
        <circle cx="116" cy="30" r="4" className="machine-light" />
        <path d="M49 99v5M101 99v5" className="machine-feet" />
      </svg>
      <svg className="document-processing-paper document-processing-paper--out" viewBox="0 0 54 70">
        <path d={receipt ? 'M7 3h40v61l-5-4-5 4-5-4-5 4-5-4-5 4-5-4-5 4z' : 'M6 3h30l12 12v51H6z'} />
        {!receipt && <path className="document-processing-fold" d="M36 3v13h12" />}
        <path className="document-processing-check" d="m16 37 7 7 15-17" />
      </svg>
      <span className="document-processing-spark document-processing-spark--one">✦</span>
      <span className="document-processing-spark document-processing-spark--two">✦</span>
    </div>
    <div className="document-processing-copy"><strong>{receipt ? 'Kuittikone' : 'Laskukone'} {stage === 'working' ? 'työssä' : stage === 'review' ? 'valmiina tarkistukseen' : stage === 'attention' ? 'tarvitsee huomion' : 'odottaa tiedostoja'}</strong><p role="status" aria-live="polite">{progress || (receipt ? 'Käsitellään kuitteja…' : 'Käsitellään laskuja…')}</p>{action}</div>
  </div>;
}
