import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

const isPlaceholder = 
  supabaseUrl.includes('placeholder') || 
  supabaseUrl.includes('your-supabase-project') ||
  supabaseAnonKey === 'placeholder' ||
  supabaseAnonKey.includes('your-anon-public-key');

if (isPlaceholder) {
  console.warn(
    'WARNING: Frontend is operating in MOCK MODE because Supabase keys are placeholders. Remote auth is bypassed.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const isMockMode = isPlaceholder;
