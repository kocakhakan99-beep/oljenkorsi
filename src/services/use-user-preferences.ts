import { useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';
import { AutoSaveScheduler } from './auto-save-scheduler';
import { CloudSaveQueue, type QueueStatus } from './cloud-save-queue';
import { preferencesSchema, type UserPreferences } from './user-preferences';

type Status = QueueStatus | 'loading' | 'error' | 'guest' | 'empty';

/** Separate per-user queue; requests are pinned to the checked access token. */
export function useUserPreferences(enabled: boolean, userId: string | null, ready: boolean, apply: (value: UserPreferences) => void) {
  const [view, setView] = useState<{ owner: string | null; status: Status }>({ owner: null, status: 'guest' });
  const [attempt, setAttempt] = useState(0);
  const scheduler = useRef<AutoSaveScheduler<UserPreferences> | null>(null);
  const queue = useRef<CloudSaveQueue<UserPreferences> | null>(null);
  const applyRef = useRef(apply);
  applyRef.current = apply;
  useEffect(() => {
    scheduler.current?.dispose(); scheduler.current = null; queue.current = null;
    if (!enabled || !userId) { setView({ owner: null, status: 'guest' }); return; }
    if (!ready) { setView({ owner: userId, status: 'loading' }); return; }
    let active = true;
    setView({ owner: userId, status: 'loading' });
    async function token() {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session || data.session.user.id !== userId) throw new Error('Istunto vaihtui.');
      return data.session.access_token;
    }
    async function start() {
      try {
        const accessToken = await token();
        const { data, error } = await supabase.rpc('user_preferences_get').setHeader('Authorization', `Bearer ${accessToken}`);
        if (error) throw error;
        if (!active) return;
        if (!data || !Number.isSafeInteger(data.revision) || data.revision < 0) throw new Error('Virheellinen asetusversio.');
        if (data.preferences !== null) applyRef.current(preferencesSchema.parse(data.preferences));
        const q = new CloudSaveQueue<UserPreferences>(data.revision, async request => {
          const jwt = await token();
          const response = await supabase.rpc('user_preferences_save', {
            p_expected_revision: request.revision, p_mutation_id: request.mutationId, p_preferences: request.snapshot,
          }).setHeader('Authorization', `Bearer ${jwt}`);
          if (response.error) {
            if ([400, 401, 403, 404, 413].includes(response.status) || ['22023', '42501', 'PGRST301'].includes(response.error.code)) return { ok: false, reason: 'rejected' };
            throw response.error;
          }
          if (response.data?.conflict === true) return { ok: false, reason: 'conflict' };
          if (!response.data?.ok || !Number.isSafeInteger(response.data.revision) || response.data.revision <= request.revision) throw new Error('Epävarma tallennus.');
          return { ok: true, revision: response.data.revision };
        }, value => structuredClone(value), () => crypto.randomUUID(), status => {
          if (active) setView({ owner: userId, status });
        });
        queue.current = q;
        scheduler.current = new AutoSaveScheduler(q);
        setView({ owner: userId, status: data.preferences === null ? 'empty' : 'saved' });
      } catch { if (active) setView({ owner: userId, status: 'error' }); }
    }
    void start();
    return () => { active = false; scheduler.current?.dispose(); scheduler.current = null; queue.current = null; };
  }, [enabled, userId, ready, attempt]);

  const current = !enabled || !userId || (view.owner === userId && view.status !== 'loading' && view.status !== 'error');
  function update(value: UserPreferences) {
    if (!enabled || !userId) return;
    if (!current || !scheduler.current) throw new Error('Asetuksia ei ole vielä ladattu.');
    scheduler.current.update(preferencesSchema.parse(value));
  }
  return { status: view.owner === userId ? view.status : 'loading' as Status, current, update,
    retry: () => { if (queue.current?.getStatus() === 'uncertain') void scheduler.current?.flush(); else setAttempt(n => n + 1); },
    reload: () => setAttempt(n => n + 1),
  };
}
