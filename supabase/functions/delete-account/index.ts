import { withSupabase } from 'npm:@supabase/server@1.9.2';

const allowedOrigins = new Set([
  'https://kocakhakan99-beep.github.io',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5180',
  'http://127.0.0.1:5180',
]);

function corsHeaders(origin: string) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-api-version',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

const deleteOwnAccount = withSupabase({ auth: 'user' }, async (request, context) => {
  if (request.method !== 'POST')
    return Response.json({ error: 'Method not allowed.' }, { status: 405 });

  const { data, error: userError } = await context.supabase.auth.getUser();
  if (userError || !data.user)
    return Response.json({ error: 'Kirjautumista ei voitu vahvistaa.' }, { status: 401 });

  const { error: deleteError } = await context.supabaseAdmin.auth.admin.deleteUser(data.user.id);
  if (deleteError) {
    console.error('Account deletion failed.');
    return Response.json({ error: 'Tiliä ei voitu poistaa. Yritä myöhemmin uudelleen.' }, { status: 500 });
  }

  return new Response(null, { status: 204 });
});

export default {
  async fetch(request: Request) {
    const origin = request.headers.get('origin');
    if (!origin || !allowedOrigins.has(origin))
      return new Response('Origin not allowed.', { status: 403 });

    const headers = corsHeaders(origin);
    if (request.method === 'OPTIONS')
      return new Response('ok', { headers });

    try {
      const response = await deleteOwnAccount(request);
      const responseHeaders = new Headers(response.headers);
      for (const [key, value] of Object.entries(headers)) responseHeaders.set(key, value);
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    } catch {
      return Response.json(
        { error: 'Tiliä ei voitu poistaa. Yritä myöhemmin uudelleen.' },
        { status: 500, headers },
      );
    }
  },
};
