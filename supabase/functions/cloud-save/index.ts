import { withSupabase } from 'npm:@supabase/server@1.9.2';
import { validateCloudWrite } from '../_shared/cloud-validation.mjs';

const allowedOrigins = new Set([
  'https://kocakhakan99-beep.github.io',
  'http://localhost:5173', 'http://127.0.0.1:5173',
  'http://localhost:3000', 'http://127.0.0.1:3000',
  'http://localhost:5180', 'http://127.0.0.1:5180',
]);
const maxRequestBytes = 5_050_000;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function readRequest(request: Request): Promise<unknown> {
  const length = request.headers.get('content-length');
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > maxRequestBytes)) throw new Error('too large');
  if (!request.body) throw new Error('missing body');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxRequestBytes) { await reader.cancel(); throw new Error('too large'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
}

const save = withSupabase({ auth: 'user' }, async (request, context) => {
  if (request.method !== 'POST') return Response.json({ error: 'method_not_allowed' }, { status: 405 });
  const { data: { user }, error: authError } = await context.supabase.auth.getUser();
  if (authError || !user || user.is_anonymous) return Response.json({ error: 'authentication_required' }, { status: 401 });
  let body: Record<string, unknown>;
  try {
    const input = await readRequest(request);
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('invalid request');
    body = input as Record<string, unknown>;
    const keys = Object.keys(body);
    if (keys.length !== 4 || keys.some(key => !['householdId', 'expectedRevision', 'mutationId', 'snapshot'].includes(key)) ||
      typeof body.householdId !== 'string' || !uuid.test(body.householdId) ||
      typeof body.mutationId !== 'string' || !uuid.test(body.mutationId) ||
      typeof body.expectedRevision !== 'number' || !Number.isSafeInteger(body.expectedRevision) || body.expectedRevision < 0)
      throw new Error('invalid request');
    validateCloudWrite(body.snapshot);
  } catch {
    return Response.json({ error: 'invalid_document' }, { status: 400 });
  }

  const { data, error } = await context.supabaseAdmin.rpc('cloud_save_validated', {
    p_user_id: user.id,
    p_family_id: body.householdId,
    p_expected_revision: body.expectedRevision,
    p_mutation_id: body.mutationId,
    p_state: body.snapshot,
  });
  if (error) {
    if (error.code === '42501') return Response.json({ error: 'access_denied' }, { status: 403 });
    if (error.code === '22023') return Response.json({ error: 'invalid_request' }, { status: 400 });
    console.error('Cloud save failed.');
    return Response.json({ error: 'save_failed' }, { status: 500 });
  }
  if (!data || typeof data !== 'object') return Response.json({ error: 'save_failed' }, { status: 500 });
  return Response.json(data);
});

export default {
  async fetch(request: Request) {
    const origin = request.headers.get('origin');
    if (!origin || !allowedOrigins.has(origin)) return new Response('Origin not allowed.', { status: 403 });
    const cors = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-api-version',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Vary': 'Origin',
    };
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    try {
      const response = await save(request);
      const headers = new Headers(response.headers);
      for (const [key, value] of Object.entries(cors)) headers.set(key, value);
      return new Response(response.body, { status: response.status, headers });
    } catch {
      return Response.json({ error: 'save_failed' }, { status: 500, headers: cors });
    }
  },
};
