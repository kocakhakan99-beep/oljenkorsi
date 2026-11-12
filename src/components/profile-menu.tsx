import { useRef } from 'react';
import { UserRound } from 'lucide-react';
import type { AuthState } from '../services/use-auth';
import { GoogleButton } from './account';

export function ProfileMenu({ auth, onAccount, hasChanges }: { auth: AuthState; onAccount: () => void; hasChanges: boolean }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const provider = auth.user?.app_metadata?.provider;
  const method = provider === 'google' ? 'Google' : provider === 'apple' ? 'Apple' : 'Muu kirjautuminen';
  return <details className="profile-menu" ref={ref} onKeyDown={event => {
    if (event.key === 'Escape') { event.preventDefault(); if (ref.current) ref.current.open = false; ref.current?.querySelector('summary')?.focus(); }
  }}>
    <summary aria-label={auth.user ? 'Oma profiili' : 'Vieraan profiili'}>
      <span className="profile-avatar"><UserRound size={19} aria-hidden="true" /></span>
      <span className="profile-trigger-label">{auth.user ? 'Oma profiili' : 'Vieras'}</span>
    </summary>
    <div className="profile-popover">
      <p className="profile-kicker">{auth.user ? 'OMA PROFIILI' : 'VIERASTILA'}</p>
      <strong>{auth.user?.email || (auth.user ? 'Kirjautunut' : 'Käytät sovellusta vieraana')}</strong>
      <p>{auth.user ? `Kirjautumistapa: ${method}` : 'Tiedot ovat vain tämän välilehden muistissa.'}</p>
      {auth.user && <p>Perhetilin tiedot ladataan ja tallennetaan erikseen.</p>}
      {!auth.user && <GoogleButton disabled={auth.loading || auth.pending || !auth.providers?.google} onClick={() => void auth.signIn('google', hasChanges)} />}
      <button type="button" onClick={() => { if (ref.current) ref.current.open = false; onAccount(); }}>Tili ja perhetili</button>
      {auth.user && <button type="button" disabled={auth.pending} onClick={() => void auth.signOut()}>Kirjaudu ulos</button>}
      {auth.error && <p role="alert">{auth.error}</p>}
    </div>
  </details>;
}
