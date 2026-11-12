import { useEffect, useState } from 'react';
import type { State } from '../domain/model';
import { backup, restore } from '../services/validation';
import { supabase } from '../services/supabase';

type Family = { id: string; name: string; role: 'admin' | 'member'; state: unknown | null; revision: number };
type Member = { user_id: string; role: 'admin' | 'member'; joined_at: string };

// Saving and loading are deliberately explicit until automatic conflict handling is complete.
export function Family({ state, onLoad, exportBackup, userId }: { state: State; onLoad: (state: State) => boolean | undefined; exportBackup: () => void; userId: string }) {
  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [ready, setReady] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [loadedRevision, setLoadedRevision] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [invite, setInvite] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const { data, error } = await supabase.rpc('family_get');
    if (error) throw error;
    const current = data as Family | null;
    if (current) {
      const result = await supabase.rpc('family_members');
      if (result.error) throw result.error;
      setMembers(result.data as Member[]);
    } else setMembers([]);
    setFamily(current);
    setUnavailable(false);
    setLoadedRevision(null);
    setReady(true);
  }
  useEffect(() => { void refresh().catch(() => { setMessage('Perhetiliä ei voitu hakea.'); setUnavailable(true); setReady(true); }); }, []);
  async function run(action: () => Promise<void>) {
    setBusy(true); setMessage('');
    try { await action(); } catch (e) { setMessage('Toiminto epäonnistui: ' + (e instanceof Error ? e.message : 'Tarkista yhteys ja yritä uudelleen.')); }
    finally { setBusy(false); }
  }
  async function create() {
    const { error } = await supabase.rpc('family_create', { p_name: name.trim() });
    if (error) throw error;
    await refresh(); setMessage('Perhe luotu. Nykyisiä tietoja ei ole vielä tallennettu perheeseen.');
  }
  async function join() {
    const { data, error } = await supabase.rpc('family_join', { p_code: code.trim() });
    if (error) throw error;
    if (!data) { setMessage('Koodi ei kelpaa, on vanhentunut tai sitä ei voi enää käyttää.'); return; }
    setCode(''); await refresh(); setMessage('Liityit perheeseen. Muistissa olevat tiedot ovat edelleen tässä näkymässä.');
  }
  async function makeInvite() {
    const { data, error } = await supabase.rpc('family_invite');
    if (error) throw error;
    setInvite(data as string);
  }
  async function revokeInvites() {
    if (!confirm('Perutaanko kaikki käyttämättömät kutsukoodit?')) return;
    const { error } = await supabase.rpc('family_revoke_invites');
    if (error) throw error;
    setInvite(''); setMessage('Käyttämättömät kutsut peruttu.');
  }
  async function removeMember(id: string) {
    if (!confirm(id === userId ? 'Erotaanko perheestä?' : 'Poistetaanko jäsen perheestä?')) return;
    const { data, error } = await supabase.rpc('family_remove_member', { p_user_id: id });
    if (error) throw error;
    if (!data) throw new Error('Jäsentä ei löytynyt.');
    await refresh(); setMessage(id === userId ? 'Erosit perheestä.' : 'Jäsen poistettu.');
  }
  async function load() {
    if (!confirm('Perheen tietojen lataus korvaa tässä välilehdessä olevat tiedot. Vie tarvittaessa ensin varmuuskopio. Jatketaanko?')) return;
    const { data, error } = await supabase.rpc('family_get');
    if (error) throw error;
    const fresh = data as Family | null;
    if (!fresh || fresh.id !== family?.id || !fresh.state) { setMessage('Perheessä ei ole vielä tallennettua taloutta.'); return; }
    const restored = restore(JSON.stringify(fresh.state));
    if (onLoad(restored) === false) throw new Error('Tietojen lataaminen epäonnistui.');
    setFamily(fresh); setLoadedRevision(fresh.revision); setMessage('Perheen tiedot ladattu.');
  }
  async function save() {
    if (!family) return;
    if (family.state !== null && loadedRevision === null) { setMessage('Lataa ensin perheen tiedot tai vie tämä talous varmuuskopioksi.'); return; }
    if (!confirm('Tallennetaanko tämän välilehden talous perheen yhteiseksi taloudeksi? Kaikki perheen jäsenet näkevät sen.')) return;
    const { data, error } = await supabase.rpc('family_save', {
      p_expected_revision: loadedRevision ?? family.revision,
      p_state: JSON.parse(backup(state)) as unknown,
    });
    if (error) throw error;
    const result = data as { ok: boolean; revision?: number };
    if (!result.ok || result.revision === undefined) {
      setLoadedRevision(null);
      setMessage('Perheen tiedot ovat muuttuneet toisella laitteella. Vie tämän välilehden tiedot varmuuskopioksi ja lataa perheen tiedot ennen uutta tallennusta.');
      return;
    }
    setFamily({ ...family, state: true, revision: result.revision });
    setLoadedRevision(result.revision); setMessage('Talous tallennettu perheelle. Myöhemmät muutokset täytyy tallentaa uudelleen.');
  }
  return <div>
    <h3>Perhetili</h3>
    <p>Kaikki jäsenet näkevät ja voivat muokata perheen yhteistä taloutta. Tallennus ja lataus tehdään toistaiseksi erikseen; muutoksia ei synkronoida automaattisesti.</p>
    {!ready ? <p>Haetaan perhetiliä…</p> : unavailable ? <button disabled={busy} onClick={() => void run(refresh)}>Yritä uudelleen</button> : family ? <>
      <p>Perhe: {family.name} · {family.role === 'admin' ? 'ylläpitäjä' : 'jäsen'}</p>
      <button disabled={busy} onClick={exportBackup}>Vie tämän välilehden varmuuskopio</button>{' '}
      <button disabled={busy} onClick={() => void run(load)}>Lataa perheen talous</button>{' '}
      <button disabled={busy} onClick={() => void run(save)}>Tallenna perheen talous</button>
      {family.role === 'admin' && <><p>Kertakäyttöinen kutsukoodi on voimassa 24 tuntia. Koodilla liittyvä näkee kaikki perheen tiedot.</p><button disabled={busy} onClick={() => void run(makeInvite)}>Luo kutsukoodi</button>{invite && <p>Kutsukoodi: <code>{invite}</code></p>}<button disabled={busy} onClick={() => void run(revokeInvites)}>Peru käyttämättömät kutsut</button></>}
      <h4>Jäsenet</h4><ul>{members.map(m => <li key={m.user_id}>{m.user_id === userId ? 'Sinä' : `Jäsen ${m.user_id.slice(0, 8)}`} · {m.role === 'admin' ? 'ylläpitäjä' : 'jäsen'} {(m.user_id === userId || family.role === 'admin') && <button disabled={busy || m.role === 'admin'} onClick={() => void run(() => removeMember(m.user_id))}>{m.user_id === userId ? 'Eroa' : 'Poista jäsen'}</button>}</li>)}</ul>
    </> : <>
      <label>Perheen nimi <input value={name} maxLength={100} onChange={e => setName(e.target.value)} /></label>{' '}
      <button disabled={busy || !name.trim()} onClick={() => void run(create)}>Luo perhe</button>
      <p>tai liity koodilla:</p><label>Kutsukoodi <input value={code} onChange={e => setCode(e.target.value)} autoComplete="off" /></label>{' '}
      <button disabled={busy || !code.trim()} onClick={() => void run(join)}>Liity perheeseen</button>
    </>}
    {message && <p role="status">{message}</p>}
  </div>;
}
