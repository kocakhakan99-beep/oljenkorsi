import { useEffect, useState } from 'react';
import type { State } from '../domain/model';
import { familyBackup, restoreFamilyBackup } from '../services/family-backup';
import type { FamilyRevisionSession } from '../services/family-session';
import { revisionForFamilySession } from '../services/family-session';
import { supabase } from '../services/supabase';

type Family = { id: string; name: string; role: 'admin' | 'member'; state: unknown | null; revision: number };
type Member = { user_id: string; role: 'admin' | 'member'; joined_at: string };

// Saving and loading are deliberately explicit until automatic conflict handling is complete.
export function Family({ state, onLoad, exportBackup, userId, revisionSession, cloudManaged = false }: { state: State; onLoad: (state: State) => boolean | undefined; exportBackup: () => void; userId: string; revisionSession: { current: FamilyRevisionSession | null }; cloudManaged?: boolean }) {
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
  const [deleteFamilyText, setDeleteFamilyText] = useState('');
  const [deleteAccountText, setDeleteAccountText] = useState('');

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
    if (!current) {
      if (revisionSession.current?.userId === userId) revisionSession.current = null;
      setLoadedRevision(null);
    } else {
      setLoadedRevision(revisionForFamilySession(revisionSession.current, userId, current.id, current.revision));
    }
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
    await refresh(); if (cloudManaged) window.dispatchEvent(new Event('oljenkorsi-households-changed')); setMessage('Perhe luotu. Nykyisiä tietoja ei ole vielä tallennettu perheeseen.');
  }
  async function join() {
    const { data, error } = await supabase.rpc('family_join', { p_code: code.trim() });
    if (error) throw error;
    if (!data) { setMessage('Koodi ei kelpaa, on vanhentunut tai sitä ei voi enää käyttää.'); return; }
    setCode(''); await refresh(); if (cloudManaged) window.dispatchEvent(new Event('oljenkorsi-households-changed')); setMessage('Liityit perheeseen. Muistissa olevat tiedot ovat edelleen tässä näkymässä.');
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
    await refresh(); if (cloudManaged) window.dispatchEvent(new Event('oljenkorsi-households-changed')); setMessage(id === userId ? 'Erosit perheestä.' : 'Jäsen poistettu.');
  }
  async function transferAdmin(id: string) {
    const member = members.find(candidate => candidate.user_id === id);
    if (!member || !confirm(`Siirretäänkö ylläpitäjyys jäsenelle ${id.slice(0, 8)}? Sinusta tulee jäsen.`)) return;
    const { data, error } = await supabase.rpc('family_transfer_admin', { p_user_id: id });
    if (error) throw error;
    if (!data) throw new Error('Jäsentä ei löytynyt.');
    await refresh(); setMessage('Ylläpitäjyys siirretty.');
  }
  async function deleteFamily() {
    if (deleteFamilyText !== 'POISTA PERHE') return;
    const { data, error } = await supabase.rpc('family_delete');
    if (error) throw error;
    if (!data) throw new Error('Perhettä ei löytynyt.');
    revisionSession.current = null;
    setLoadedRevision(null);
    setFamily(null);
    setMembers([]);
    setInvite('');
    setDeleteFamilyText('');
    if (cloudManaged) window.dispatchEvent(new Event('oljenkorsi-households-changed'));
    setMessage('Perhe, sen pilveen tallennetut tiedot, kutsut ja jäsenyydet poistettiin. Avoimia tai aiemmin ladattuja kopioita ei voida poistaa etänä.');
  }
  async function deleteAccount() {
    if (deleteAccountText !== 'POISTA') return;
    const { error } = await supabase.functions.invoke('delete-account', { body: {} });
    if (error) throw error;
    const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });
    if (signOutError) throw new Error('Tili poistettiin, mutta paikallisen istunnon tyhjennys epäonnistui. Sulje välilehti.');
    window.location.replace(window.location.pathname);
  }
  async function load() {
    if (!confirm('Perheen tietojen lataus korvaa tässä välilehdessä olevat tiedot. Vie tarvittaessa ensin varmuuskopio. Jatketaanko?')) return;
    const { data, error } = await supabase.rpc('family_get');
    if (error) throw error;
    const fresh = data as Family | null;
    if (!fresh || fresh.id !== family?.id || !fresh.state) { setMessage('Perheessä ei ole vielä tallennettua taloutta.'); return; }
    const restored = restoreFamilyBackup(fresh.state);
    if (
      restored.integrity === 'unverified-legacy' &&
      !confirm('Tämä on vanhanmallinen perheen varmuuskopio. JSONB on järjestänyt tietojen avaimia uudelleen, joten alkuperäistä eheystarkistusta ei voida varmistaa. Tietorakenne tarkistetaan silti ennen latausta. Nykyisen välilehden tiedot korvataan. Jatketaanko?')
    ) return;
    if (onLoad(restored.state) === false) throw new Error('Tietojen lataaminen epäonnistui.');
    revisionSession.current = { userId, familyId: fresh.id, revision: fresh.revision };
    setFamily(fresh); setLoadedRevision(fresh.revision);
    setMessage(restored.integrity === 'verified' ? 'Perheen tiedot ladattu.' : 'Vanhan varmuuskopion tiedot ladattiin. Tarkista tiedot ja vie varmuuskopio ennen tallennusta.');
  }
  async function save() {
    if (!family) return;
    if (family.state !== null && loadedRevision === null) { setMessage('Lataa ensin perheen tiedot tai vie tämä talous varmuuskopioksi.'); return; }
    if (!confirm('Tallennetaanko tämän välilehden talous perheen yhteiseksi taloudeksi? Kaikki perheen jäsenet näkevät sen.')) return;
    const { data, error } = await supabase.rpc('family_save', {
      p_expected_revision: loadedRevision ?? family.revision,
      p_state: familyBackup(state),
    });
    if (error) throw error;
    const result = data as { ok: boolean; revision?: number };
    if (!result.ok || result.revision === undefined) {
      setLoadedRevision(null);
      revisionSession.current = null;
      setMessage('Perheen tiedot ovat muuttuneet toisella laitteella. Vie tämän välilehden tiedot varmuuskopioksi ja lataa perheen tiedot ennen uutta tallennusta.');
      return;
    }
    revisionSession.current = { userId, familyId: family.id, revision: result.revision };
    setFamily({ ...family, state: true, revision: result.revision });
    setLoadedRevision(result.revision); setMessage('Talous tallennettu perheelle. Myöhemmät muutokset täytyy tallentaa uudelleen.');
  }
  return <div>
    <h3>Perhetili</h3>
    <p>Kaikki jäsenet näkevät ja voivat muokata perheen yhteistä taloutta. {cloudManaged ? 'Valitse aktiivinen talous yläpalkista.' : 'Tallennus ja lataus tehdään toistaiseksi erikseen; muutoksia ei synkronoida automaattisesti.'}</p>
    {!ready ? <p>Haetaan perhetiliä…</p> : unavailable ? <button disabled={busy} onClick={() => void run(refresh)}>Yritä uudelleen</button> : family ? <>
      <p>Perhe: {family.name} · {family.role === 'admin' ? 'ylläpitäjä' : 'jäsen'}</p>
      {!cloudManaged && <><button disabled={busy} onClick={exportBackup}>Vie tämän välilehden varmuuskopio</button>{' '}
      <button disabled={busy} onClick={() => void run(load)}>Lataa perheen talous</button>{' '}
      <button disabled={busy} onClick={() => void run(save)}>Tallenna perheen talous</button></>}
      {family.role === 'admin' && <><p>Kertakäyttöinen kutsukoodi on voimassa 24 tuntia. Koodilla liittyvä näkee kaikki perheen tiedot.</p><button disabled={busy} onClick={() => void run(makeInvite)}>Luo kutsukoodi</button>{invite && <p>Kutsukoodi: <code>{invite}</code></p>}<button disabled={busy} onClick={() => void run(revokeInvites)}>Peru käyttämättömät kutsut</button></>}
      <h4>Jäsenet</h4><ul>{members.map(m => <li key={m.user_id}>{m.user_id === userId ? 'Sinä' : `Jäsen ${m.user_id.slice(0, 8)}`} · {m.role === 'admin' ? 'ylläpitäjä' : 'jäsen'} {(m.user_id === userId || family.role === 'admin') && <button disabled={busy || m.role === 'admin'} onClick={() => void run(() => removeMember(m.user_id))}>{m.user_id === userId ? 'Eroa' : 'Poista jäsen'}</button>} {family.role === 'admin' && m.user_id !== userId && m.role !== 'admin' && <button disabled={busy} onClick={() => void run(() => transferAdmin(m.user_id))}>Siirrä ylläpitäjyys</button>}</li>)}</ul>
      {family.role === 'admin' && <details className="danger-zone family-delete-zone"><summary>Poista perhe</summary><p>Poisto poistaa perheen pilveen tallennetun talouden, kutsut ja kaikkien jäsenten pääsyn. Avoimia tai aiemmin ladattuja kopioita ei voida poistaa etänä.</p><label>Kirjoita POISTA PERHE <input value={deleteFamilyText} onChange={event => setDeleteFamilyText(event.target.value)} autoComplete="off" /></label><button disabled={busy || deleteFamilyText !== 'POISTA PERHE'} onClick={() => void run(deleteFamily)}>Poista perhe pysyvästi</button></details>}
    </> : <>
      <label>Perheen nimi <input value={name} maxLength={100} onChange={e => setName(e.target.value)} /></label>{' '}
      <button disabled={busy || !name.trim()} onClick={() => void run(create)}>Luo perhe</button>
      <p>tai liity koodilla:</p><label>Kutsukoodi <input value={code} onChange={e => setCode(e.target.value)} autoComplete="off" /></label>{' '}
      <button disabled={busy || !code.trim()} onClick={() => void run(join)}>Liity perheeseen</button>
    </>}
    {ready && !unavailable && <details className="danger-zone family-account-delete-zone"><summary>Poista käyttäjätili</summary><p>Tämä poistaa kirjautumistilisi ja perhejäsenyytesi.</p><p>{family && members.length === 1 ? 'Olet perheen viimeinen jäsen. Perhe ja sen pilveen tallennettu talous poistetaan tilin mukana.' : family && family.role === 'admin' && members.filter(member => member.role === 'admin').length === 1 ? 'Ylläpitäjyys siirtyy pisimpään perheessä olleelle jäsenelle. Perheen tallennetut tiedot säilyvät.' : family ? 'Jäsenyytesi poistuu. Perhe ja sen pilveen tallennetut tiedot säilyvät muille jäsenille.' : 'Perhetiliäsi ei poisteta, koska et kuulu perheeseen.'}</p><p>Jäsenten aiemmin lataamia kopioita ei voida poistaa. Kirjoita POISTA jatkaaksesi.</p><label>Kirjoita POISTA <input value={deleteAccountText} onChange={event => setDeleteAccountText(event.target.value)} autoComplete="off" /></label><button disabled={busy || deleteAccountText !== 'POISTA'} onClick={() => void run(deleteAccount)}>Poista käyttäjätili ja sen kirjautumistiedot</button></details>}
    {message && <p role="status">{message}</p>}
  </div>;
}
