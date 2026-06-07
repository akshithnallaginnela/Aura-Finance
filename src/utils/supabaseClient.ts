import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kjfjjrrsixhsnmzbmocq.supabase.co';
// Read VITE_SUPABASE_ANON_KEY. Default to a dummy string if not set, so it won't crash on build/load.
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'dummy-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
