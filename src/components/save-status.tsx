import { CloudCheck, CloudAlert, LoaderCircle, CloudUpload } from 'lucide-react';
import type { ReactNode } from 'react';

export function SaveStatus({ status, label }: { status: string; label: ReactNode }) {
  const pending = status === 'saving' || status === 'loading';
  const problem = ['error', 'uncertain', 'conflict', 'rejected', 'legacy-review', 'remote-change', 'transition'].includes(status);
  const Icon = pending ? LoaderCircle : problem ? CloudAlert : status === 'dirty' ? CloudUpload : CloudCheck;
  return <span className={`save-indicator${problem ? ' has-problem' : ''}`}>
    <span className="save-indicator-icon" tabIndex={0}>
      <Icon size={19} className={pending ? 'save-spinning' : undefined} aria-hidden="true" />
      <span className="save-tooltip">{label}</span>
      <span className="sr-only">{label}</span>
    </span>
    {problem && <span className="save-problem-text">{label}</span>}
  </span>;
}
