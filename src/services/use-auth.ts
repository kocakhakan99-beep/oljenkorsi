import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, supabaseUrl, supabasePublishableKey, authCallbackAttempt } from './supabase';

type Provider = 'google' | 'apple';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<Record<Provider, boolean> | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
      setLoading(false);
    });
    // Initial auth errors are returned by initialize(), not by INITIAL_SESSION.
    // Never show provider error text or authorization codes to the user.
    void supabase.auth.initialize().then(async result => {
      if (!authCallbackAttempt || !active) return;
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (!active || (!result.error && !sessionError && data.session)) return;
      setError('Kirjautumista ei voitu viimeistellä. Yritä uudelleen samassa selaimessa. Jos virhe jatkuu, tarkista kirjautumispalvelun asetukset.');
      const url = new URL(window.location.href);
      for (const key of ['code', 'sb_flow_id', 'error', 'error_code', 'error_description']) url.searchParams.delete(key);
      const hash = new URLSearchParams(url.hash.slice(1));
      const hadErrorHash = ['error', 'error_code', 'error_description'].some(key => hash.has(key));
      if (hadErrorHash) url.hash = 'settings';
      window.history.replaceState(window.history.state, '', url.toString());
      if (hadErrorHash) window.dispatchEvent(new Event('hashchange'));
    }).catch(() => {
      if (active && authCallbackAttempt) setError('Kirjautumista ei voitu viimeistellä. Yritä uudelleen samassa selaimessa.');
    });
    void fetch(`${supabaseUrl}/auth/v1/settings`, { headers: { apikey: supabasePublishableKey } })
      .then(response => {
        if (!response.ok) throw new Error('settings unavailable');
        return response.json() as Promise<{ external?: { google?: boolean; apple?: boolean } }>;
      })
      .then(settings => {
        if (active) setProviders({ google: settings.external?.google === true, apple: settings.external?.apple === true });
      })
      .catch(() => { if (active) setError('Kirjautumisen asetuksia ei voitu tarkistaa. Tarkista verkkoyhteys tai jatka vieraana.'); });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  async function signIn(provider: Provider, warnAboutChanges: boolean) {
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      setError('Kirjautuminen vaatii verkkosovelluksen HTTPS-osoitteen tai localhost-kehitysympäristön.');
      return;
    }
    if (warnAboutChanges && !confirm('Kirjautuminen avaa uuden sivun ja muistissa olevat tiedot katoavat. Vie ensin varmuuskopio, jos haluat säilyttää tiedot. Jatketaanko?')) return;
    setPending(true);
    setError('');
    try {
      const redirectTo = `${location.origin}${location.pathname}#settings`;
      const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
      if (error) throw error;
    } catch (e) {
      setError('Kirjautuminen ei onnistunut: ' + (e instanceof Error ? e.message : 'Yritä uudelleen.'));
      setPending(false);
    }
  }
  async function signOut() {
    setPending(true); setError('');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (e) {
      setError('Uloskirjautuminen ei onnistunut: ' + (e instanceof Error ? e.message : 'Yritä uudelleen.'));
    } finally { setPending(false); }
  }
  return { user, loading, providers, error, pending, signIn, signOut };
}
export type AuthState = ReturnType<typeof useAuth>;
