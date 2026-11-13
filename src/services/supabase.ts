import { createClient } from '@supabase/supabase-js';

// The URL and publishable key identify the project; neither grants privileged access.
// All data access must be independently authorized by database policies.
export const supabaseUrl = 'https://xabfflmujxejqzhphpkh.supabase.co';
export const supabasePublishableKey = 'sb_publishable_JAUoPgqKILx2Ji_rVhQLIA_5bJcQ831';
// Capture callback markers before the client consumes or removes them from the URL.
const callbackUrl = new URL(window.location.href);
const callbackHash = new URLSearchParams(callbackUrl.hash.slice(1));
export const authCallbackAttempt = ['code', 'error', 'error_code', 'error_description'].some(
  key => callbackUrl.searchParams.has(key) || callbackHash.has(key),
);
export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey,
  { auth: { flowType: 'pkce', detectSessionInUrl: true } },
);
