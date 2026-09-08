import { createClient } from '@supabase/supabase-js';

// We must use the Service Role Key on the backend to bypass Row Level Security,
// exactly like the old Drizzle postgres connection did.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'placeholder-key';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)) {
  console.warn('Supabase URL or Key is missing. Database operations will fail at runtime.');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});
