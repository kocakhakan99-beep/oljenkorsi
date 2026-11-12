import { Family } from './family';
import type { State } from '../domain/model';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, supabaseUrl, supabasePublishableKey } from '../services/supabase';

type Provider = 'google' | 'apple';

export function Account({ exportBackup, state, onLoad }: { exportBackup: () => void; state: State; onLoad: (state: State) => boolean | undefined }) {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [providers, setProviders] = useState<Record<Provider, boolean> | null>(null);
  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      if (!error) setUser(data.user);
    });
    void fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: { apikey: supabasePublishableKey },
    }).then(response => {
      if (!response.ok) throw new Error('settings unavailable');
      return response.json() as Promise<{ external?: { google?: boolean; apple?: boolean } }>;
    }).then(settings => {
      if (active) setProviders({ google: settings.external?.google === true, apple: settings.external?.apple === true });
    }).catch(() => { if (active) setError('Kirjautumisen asetuksia ei voitu tarkistaa.'); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setUser(session?.user ?? null);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  async function signIn(provider: Provider) {
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      setError('Kirjautuminen vaatii verkkosovelluksen HTTPS-osoitteen tai localhost-kehitysympäristön.');
      return;
    }
    if (!confirm('Kirjautuminen avaa uuden sivun ja muistissa olevat tiedot katoavat. Vie ensin varmuuskopio, jos haluat säilyttää tiedot. Jatketaanko?')) return;
    setPending(true);
    setError('');
    const redirectTo = `${location.origin}${location.pathname}#settings`;
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
    if (error) { setError('Kirjautuminen ei onnistunut: ' + error.message); setPending(false); }
  }

  async function signOut() {
    setPending(true);
    const { error } = await supabase.auth.signOut();
    if (error) setError('Uloskirjautuminen ei onnistunut: ' + error.message);
    setPending(false);
  }
  return <section className="panel" aria-labelledby="account-title">
    <h2 id="account-title">Käyttäjätili</h2>
    <p>Kirjautuminen ei itsessään tallenna taloustietoja.</p>
    {user ? <><p>Kirjautunut{user.email ? `: ${user.email}` : '.'}</p><p>Uloskirjautuminen ei tyhjennä tässä välilehdessä jo näkyviä tietoja.</p><button disabled={pending} onClick={() => void signOut()}>Kirjaudu ulos</button><Family state={state} onLoad={onLoad} exportBackup={exportBackup} userId={user.id} /></> : <>
      <p>Kirjautumiseen siirtyminen sulkee nykyisen näkymän ja tyhjentää sen muistissa olevat tiedot.</p>
      <button onClick={exportBackup}>Vie JSON-varmuuskopio</button>{' '}
      <button disabled={pending || !providers?.google} onClick={() => void signIn('google')}>Kirjaudu Googlella</button>{' '}
      <button disabled={pending || !providers?.apple} onClick={() => void signIn('apple')}>Kirjaudu Applella</button>
      {providers && (!providers.google || !providers.apple) && <p>Kirjautumispalveluiden asetukset ovat vielä kesken.</p>}
    </>}
    {error && <p role="alert">{error}</p>}
  </section>;
}
