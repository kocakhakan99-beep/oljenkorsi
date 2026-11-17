// Run only against an isolated local Supabase stack and a synthetic snapshot.
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { createClient } from '@supabase/supabase-js';

const url = process.env.LOCAL_SUPABASE_URL;
const key = process.env.LOCAL_SUPABASE_ANON_KEY;
const fixture = process.argv[2];
if (!url || !key || !fixture || !['127.0.0.1', 'localhost', '[::1]'].includes(new URL(url).hostname)) {
  throw new Error('Provide LOCAL_SUPABASE_URL (loopback only), LOCAL_SUPABASE_ANON_KEY and a synthetic snapshot path.');
}
const snapshot = JSON.parse(await readFile(fixture, 'utf8'));
const client = () => createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
async function account() {
  const result = client();
  const { data, error } = await result.auth.signUp({ email: `${randomUUID()}@example.com`, password: `${randomUUID()}aA1!` });
  if (error || !data.session) throw new Error(`Local signup failed: ${error?.message ?? 'confirmation required'}`);
  return { client: result, token: data.session.access_token, id: data.user.id };
}
function check(condition, message) { if (!condition) throw new Error(message); }
const owner = await account();
const outsider = await account();
const { data: household, error: createError } = await owner.client.rpc('cloud_ensure_personal');
if (createError) throw createError;
const mutationId = randomUUID();
async function save(token, body) {
  const response = await fetch(`${url}/functions/v1/cloud-save`, {
    method: 'POST', headers: { apikey: key, authorization: `Bearer ${token}`, origin: 'http://localhost:5173', 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: response.status, data: await response.json() };
}
const body = { householdId: household, expectedRevision: 0, mutationId, snapshot };
let result = await save(owner.token, body);
check(result.status === 200 && result.data.ok === true && result.data.revision === 1, `First save failed: ${result.status} ${JSON.stringify(result.data)}`);
result = await save(owner.token, body);
check(result.status === 200 && result.data.ok === true && result.data.revision === 1, 'Retry did not return the same revision');
result = await save(owner.token, { ...body, mutationId: randomUUID() });
check(result.status === 200 && result.data.conflict === true, 'Stale revision was not rejected');
result = await save(outsider.token, { ...body, expectedRevision: 1, mutationId: randomUUID() });
check(result.status === 403, `Outsider write was not denied: ${result.status}`);
const invalid = structuredClone(snapshot);
invalid.backup.data.settings.apiKey = 'synthetic-secret';
result = await save(owner.token, { ...body, expectedRevision: 1, mutationId: randomUUID(), snapshot: invalid });
check(result.status === 400, `Invalid document was not rejected: ${result.status}`);
const read = await owner.client.rpc('cloud_get_household', { p_household_id: household });
check(!read.error && read.data.revision === 1 && isDeepStrictEqual(read.data.state, snapshot), 'Saved snapshot did not round-trip');
const outsiderRead = await outsider.client.rpc('cloud_get_household', { p_household_id: household });
check(Boolean(outsiderRead.error), 'Outsider could read the household');
const bypass = await owner.client.rpc('cloud_save_validated', { p_user_id: randomUUID(), p_family_id: household, p_expected_revision: 1, p_mutation_id: randomUUID(), p_state: snapshot });
check(Boolean(bypass.error), 'Authenticated user could bypass server validation');
const family = await owner.client.rpc('family_create', { p_name: 'Synteettinen testiperhe' });
check(!family.error && family.data, 'Family creation failed');
const invite = await owner.client.rpc('family_invite');
check(!invite.error && invite.data, 'Invitation creation failed');
const joined = await outsider.client.rpc('family_join', { p_code: invite.data });
check(!joined.error && joined.data === true, 'Family invitation failed');
const otherPersonal = await outsider.client.rpc('cloud_ensure_personal');
check(!otherPersonal.error && otherPersonal.data !== household, 'Second personal household failed');
const list = await outsider.client.rpc('cloud_list_households');
check(!list.error && list.data.some(item => item.id === family.data) && list.data.some(item => item.id === otherPersonal.data), 'Personal and family households were not both listed');
const familyBody = { ...body, householdId: family.data, mutationId: randomUUID() };
result = await save(owner.token, familyBody);
check(result.status === 200 && result.data.revision === 1, 'Family save failed');
const familyRead = await outsider.client.rpc('cloud_get_household', { p_household_id: family.data });
check(!familyRead.error && familyRead.data.revision === 1 && isDeepStrictEqual(familyRead.data.state, snapshot), 'Family member could not read saved state');
const removed = await owner.client.rpc('family_remove_member', { p_user_id: outsider.id });
check(!removed.error && removed.data === true, 'Family member removal failed');
result = await save(outsider.token, { ...familyBody, expectedRevision: 1, mutationId: randomUUID() });
check(result.status === 403, 'Removed family member could still write');
const oldSave = await owner.client.rpc('family_save', { p_expected_revision: 1, p_state: snapshot });
check(Boolean(oldSave.error), 'Legacy write bypass was not disabled');
console.log('PASS local Auth, Edge Function, database, family sharing, removal, isolation, idempotency and conflict');
