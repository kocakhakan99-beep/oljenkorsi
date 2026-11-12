import { createClient } from '@supabase/supabase-js';

// The URL and publishable key identify the project; neither grants privileged access.
// All data access must be independently authorized by database policies.
export const supabaseUrl = 'https://xabfflmujxejqzhphpkh.supabase.co';
export const supabasePublishableKey = 'sb_publishable_JAUoPgqKILx2Ji_rVhQLIA_5bJcQ831';
export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey,
  { auth: { flowType: 'pkce', detectSessionInUrl: true } },
);
