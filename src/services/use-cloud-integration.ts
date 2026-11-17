import { useEffect, useRef, useState } from 'react';
import { empty, type State } from '../domain/model';
import { supabase } from './supabase';
import { CloudApi, type CloudHousehold } from './cloud-api';
import { CloudSession, type CloudSessionStatus } from './cloud-session';

type View = { owner: string | null; status: CloudSessionStatus | 'guest' | 'transition'; items: CloudHousehold[]; active: string | null };

/** This integration is enabled only in builds targeting the new backend. */
export function useCloudIntegration(enabled: boolean, authLoading: boolean, userId: string | null,
  state: State, dirty: { current: boolean }, apply: (state: State) => void) {
  const [view, setView] = useState<View>({ owner: null, status: 'guest', items: [], active: null });
  const owner = useRef<string | null>(null);
  const desired = useRef<string | null>(userId);
  const session = useRef<CloudSession | null>(null);
  const latest = useRef(state);
  const applyRef = useRef(apply);
  const transition = useRef(false);
  latest.current = state;
  desired.current = userId;
  applyRef.current = apply;

  function activate(target: string | null, clear: boolean) {
    session.current?.dispose();
    session.current = null;
    transition.current = false;
    if (clear) { const fresh = empty(); applyRef.current(fresh); latest.current = fresh; dirty.current = false; }
    owner.current = target;
    if (!target) { setView({ owner: null, status: 'guest', items: [], active: null }); return; }
    setView({ owner: target, status: 'loading', items: [], active: null });
    const controller = new CloudSession(new CloudApi(supabase, target),
      (next, item) => {
        if (session.current !== controller || desired.current !== target) return;
        // A late asynchronous edit must not be overwritten by a load.
        if (dirty.current) throw new Error('Paikallisia muutoksia on tallentamatta.');
        applyRef.current(next); latest.current = next; dirty.current = false;
        setView(current => ({ ...current, active: item.id }));
      },
      status => {
        if (session.current !== controller || desired.current !== target) return;
        if (status === 'saved' || status === 'empty') dirty.current = false;
        setView(current => ({ ...current, status }));
      },
      items => { if (session.current === controller && desired.current === target) setView(current => ({ ...current, items })); });
    session.current = controller;
    void controller.start(latest.current);
  }

  useEffect(() => {
    if (!enabled || authLoading) return;
    if (owner.current === userId && (userId === null || session.current)) return;
    const old = session.current;
    const oldStatus = old?.getStatus();
    const unsaved = dirty.current || (oldStatus !== undefined && !['saved', 'empty'].includes(oldStatus));
    if (unsaved) {
      old?.dispose(); session.current = null; transition.current = true;
      setView(current => ({ ...current, status: 'transition' }));
      return;
    }
    activate(userId, owner.current !== null);
  }, [enabled, authLoading, userId]);

  useEffect(() => () => { session.current?.dispose(); session.current = null; }, []);
  useEffect(() => {
    if (!enabled) return;
    const refresh = () => {
      const current = session.current;
      if (current) void current.refreshHouseholds().catch(() => {
        if (session.current === current) setView(view => ({ ...view, status: 'rejected' }));
      });
    };
    window.addEventListener('oljenkorsi-households-changed', refresh);
    return () => window.removeEventListener('oljenkorsi-households-changed', refresh);
  }, [enabled]);
  useEffect(() => {
    if (!enabled || !userId) return;
    const check = () => {
      if (document.visibilityState === 'visible') void session.current?.refreshHouseholds().catch(() => {});
    };
    document.addEventListener('visibilitychange', check);
    const timer = window.setInterval(check, 30000);
    return () => { document.removeEventListener('visibilitychange', check); window.clearInterval(timer); };
  }, [enabled, userId]);

  const identityMatches = owner.current === userId && !transition.current;
  const canEdit = !enabled || (!authLoading && identityMatches &&
    (userId === null || ['saved', 'empty', 'dirty', 'saving', 'uncertain', 'conflict', 'rejected', 'remote-change'].includes(view.status)));
  function update(next: State) {
    latest.current = next;
    if (!enabled || !userId) return;
    if (!identityMatches || !session.current || !canEdit) throw new Error('Pilvitalous ei ole vielä valmis.');
    try { session.current.update(next); }
    catch (error) { setView(current => ({ ...current, status: 'rejected' })); throw error; }
    if (session.current.getStatus() === 'saved') dirty.current = false;
  }
  async function select(id: string) {
    if (!session.current || !identityMatches) return;
    if (dirty.current) throw new Error('Tallenna tai vie keskeneräiset muutokset ennen talouden vaihtoa.');
    await session.current.open(id, latest.current);
  }
  async function acceptLegacy() { await session.current?.acceptLegacy(latest.current); }
  function retry() {
    if (!userId || dirty.current) return;
    activate(userId, false);
  }
  function discardAndContinue() { activate(desired.current, true); }
  return { ...view, canEdit, identityMatches, hasUnsaved: dirty.current, update, select, acceptLegacy, retry, discardAndContinue, saveNow: () => session.current?.saveNow() };
}
