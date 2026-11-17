import { useRef, useState, type ReactNode } from 'react';
import { UserRound } from 'lucide-react';
import type { AuthState } from '../services/use-auth';
import { GoogleButton, GoogleIcon } from './account';

export function ProfileMenu({ auth, onAccount, hasChanges, cloudManaged = false, householdPicker }: { auth: AuthState; onAccount: () => void; hasChanges: boolean; cloudManaged?: boolean; householdPicker?: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const [brokenAvatar, setBrokenAvatar] = useState<string | null>(null);
  const provider = auth.user?.app_metadata?.provider;
  const method = provider === 'google' ? 'Google' : provider === 'apple' ? 'Apple' : 'Muu kirjautuminen';
  const metadata = auth.user?.user_metadata;
  const name = typeof metadata?.full_name === 'string' && metadata.full_name.trim() ? metadata.full_name.trim() : typeof metadata?.name === 'string' && metadata.name.trim() ? metadata.name.trim() : '';
  const picture = metadata?.avatar_url ?? metadata?.picture;
  let avatar: string | null = null;
  try {
    if (provider === 'google' && typeof picture === 'string') {
      const url = new URL(picture);
      if (url.protocol === 'https:' && url.hostname === 'lh3.googleusercontent.com' && !url.username && !url.password) avatar = url.href;
    }
  } catch { /* Missing or invalid pictures use the default icon. */ }
  return <details className="profile-menu" ref={ref} onKeyDown={event => {
    if (event.key === 'Escape') { event.preventDefault(); if (ref.current) ref.current.open = false; ref.current?.querySelector('summary')?.focus(); }
  }}>
    <summary aria-label={auth.user ? 'Oma profiili' : 'Vieraan profiili'}>
      <span className="profile-avatar">{avatar && avatar !== brokenAvatar ? <img src={avatar} alt="" referrerPolicy="no-referrer" onError={() => setBrokenAvatar(avatar)} /> : <UserRound size={19} aria-hidden="true" />}</span>
    </summary>
    <div className="profile-popover">
      <p className="profile-kicker">{auth.user ? 'OMA PROFIILI' : 'VIERASTILA'}</p>
      <strong>{name || auth.user?.email || (auth.user ? 'Kirjautunut' : 'Käytät sovellusta vieraana')}</strong>
      {name && auth.user?.email && <p>{auth.user.email}</p>}
      {auth.user ? <p className="profile-provider">Kirjautumistapa: {provider === 'google' && <GoogleIcon />}{method}</p> : <p>Tiedot ovat vain tämän välilehden muistissa.</p>}
      {auth.user && cloudManaged && householdPicker}
      {auth.user && !cloudManaged && <p>Perhetilin tiedot ladataan ja tallennetaan erikseen.</p>}
      {!auth.user && <GoogleButton disabled={auth.loading || auth.pending || !auth.providers?.google} onClick={() => void auth.signIn('google', hasChanges)} />}
      <button type="button" onClick={() => { if (ref.current) ref.current.open = false; onAccount(); }}>Tili ja perhetili</button>
      {auth.user && <button type="button" disabled={auth.pending} onClick={() => void auth.signOut()}>Kirjaudu ulos</button>}
      {auth.error && <p role="alert">{auth.error}</p>}
    </div>
  </details>;
}
