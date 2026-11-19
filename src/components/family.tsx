import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

type Family = { id: string; name: string; role: 'admin' | 'member'; state: unknown | null; revision: number };
type Member = { user_id: string; role: 'admin' | 'member'; joined_at: string };

// Household documents are loaded and saved by CloudSession; this component manages membership only.
export function Family({ userId, cloudManaged = false }: { userId: string; cloudManaged?: boolean }) {
  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [ready, setReady] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
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
  return <div>
    <h3>Perhetili</h3>
    <p>Kaikki jäsenet näkevät ja voivat muokata perheen yhteistä taloutta. {cloudManaged ? 'Valitse aktiivinen talous yläpalkista.' : 'Pilvitallennus ei ole käytössä tässä sovellusversiossa.'}</p>
    {!ready ? <p>Haetaan perhetiliä…</p> : unavailable ? <button disabled={busy} onClick={() => void run(refresh)}>Yritä uudelleen</button> : family ? <>
      <p>Perhe: {family.name} · {family.role === 'admin' ? 'ylläpitäjä' : 'jäsen'}</p>
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
