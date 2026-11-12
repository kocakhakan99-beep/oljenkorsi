import { Family } from './family';
import type { State } from '../domain/model';
import type { AuthState } from '../services/use-auth';

export function GoogleButton({ onClick, disabled = false }: { onClick: () => void; disabled?: boolean }) {
  return <button type="button" className="google-signin" disabled={disabled} onClick={onClick}>
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 48 48">
      <path fill="#4285f4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4H24v7.6h11a9.4 9.4 0 0 1-4.1 6.2v5h6.6c3.9-3.5 6.1-8.7 6.1-14.8z" />
      <path fill="#34a853" d="M24 44c5.5 0 10.1-1.8 13.5-4.7l-6.6-5c-1.8 1.2-4.2 1.9-6.9 1.9-5.3 0-9.9-3.6-11.5-8.5H5.7v5.2A20.4 20.4 0 0 0 24 44z" />
      <path fill="#fbbc05" d="M12.5 27.7a12.3 12.3 0 0 1 0-7.4v-5.2H5.7a20 20 0 0 0 0 17.8z" />
      <path fill="#ea4335" d="M24 11.8c3 0 5.7 1 7.8 3.1l5.8-5.7A19.6 19.6 0 0 0 24 4 20.4 20.4 0 0 0 5.7 15.1l6.8 5.2c1.6-4.9 6.2-8.5 11.5-8.5z" />
    </svg>
    <span>Jatka Googlella</span>
  </button>;
}

export function Account({ exportBackup, state, onLoad, auth, hasChanges }: { exportBackup: () => void; state: State; onLoad: (state: State) => boolean | undefined; auth: AuthState; hasChanges: boolean }) {
  const { user, providers, error, pending, signIn, signOut } = auth;
  return <section className="panel" aria-labelledby="account-title">
    <h2 id="account-title">Käyttäjätili</h2>
    <p>Kirjautuminen ei itsessään tallenna taloustietoja.</p>
    {user ? <><p>Kirjautunut{user.email ? `: ${user.email}` : '.'}</p><p>Uloskirjautuminen ei tyhjennä tässä välilehdessä jo näkyviä tietoja.</p><button disabled={pending} onClick={() => void signOut()}>Kirjaudu ulos</button><Family state={state} onLoad={onLoad} exportBackup={exportBackup} userId={user.id} /></> : <>
      <p>Kirjautumiseen siirtyminen sulkee nykyisen näkymän ja tyhjentää sen muistissa olevat tiedot.</p>
      <button onClick={exportBackup}>Vie JSON-varmuuskopio</button>{' '}
      <GoogleButton disabled={pending || !providers?.google} onClick={() => void signIn('google', hasChanges)} />{' '}
      {providers?.apple && <button disabled={pending} onClick={() => void signIn('apple', hasChanges)}>Jatka Applella</button>}
      {providers && !providers.google && <p>Google-kirjautumisen asetukset ovat vielä kesken.</p>}
    </>}
    {error && <p role="alert">{error}</p>}
  </section>;
}
