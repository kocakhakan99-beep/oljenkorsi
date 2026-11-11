import { useRef, useState } from 'react';
import { KeyRound } from 'lucide-react';
import { setSessionAPIKey, useSessionAPIKey } from '../services/session-api-key';

export function APIKeyButton({ disabled = false }: { disabled?: boolean }) {
  const key = useSessionAPIKey();
  const [value, setValue] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  function close() { setValue(''); dialog.current?.close(); }
  return <>
    <button type="button" className="ai-key-button" disabled={disabled} aria-label={key ? 'Vaihda tai poista avain' : 'Lisää avain'} title={key ? 'Avain käytössä tämän istunnon ajan' : 'Lisää avain'} onClick={() => { setValue(''); dialog.current?.showModal(); }}><KeyRound size={19} aria-hidden="true" />{key && <span aria-hidden="true">✓</span>}</button>
    <dialog ref={dialog} aria-label="Analyysin avain" onCancel={() => setValue('')} onClose={() => setValue('')}>
      <form onSubmit={e => { e.preventDefault(); if (value.trim()) { setSessionAPIKey(value); close(); } }}>
        <h2>Analyysin avain</h2>
        <p>{key ? 'Avain on jo käytössä. Voit vaihtaa sen tai poistaa sen.' : 'Syötä avain kerran, niin voit käyttää analyysiä tämän istunnon ajan.'}</p>
        <label>Avain<input autoFocus type="password" autoComplete="off" value={value} onChange={e => setValue(e.target.value)} /></label>
        <p>Avain unohtuu, kun suljet tämän välilehden.</p>
        <button type="submit" disabled={!value.trim()}>Tallenna</button>
        {key && <button type="button" onClick={() => { setSessionAPIKey(''); close(); }}>Poista avain</button>}
        <button type="button" onClick={close}>Peruuta</button>
      </form>
    </dialog>
  </>;
}
