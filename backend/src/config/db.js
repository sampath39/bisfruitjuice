import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import dotenv from 'dotenv';

dotenv.config();

const sanitizeUrl = (url) => {
  if (!url) return '';
  let cleaned = url.trim();
  if (cleaned && !cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = 'https://' + cleaned;
  }
  return cleaned;
};

const supabaseUrl = sanitizeUrl(process.env.SUPABASE_URL || 'https://placeholder.supabase.co');
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder').trim();

const hasPlaceholder = 
  supabaseUrl.includes('placeholder') || 
  supabaseUrl.includes('your-supabase-project') ||
  supabaseServiceKey === 'placeholder' ||
  supabaseServiceKey.includes('your-service-role-key');

if (hasPlaceholder) {
  console.warn(
    'WARNING: Backend is operating in MOCK MODE because Supabase URL/Key are placeholders. Remote queries are bypassed to avoid DNS timeouts.'
  );
}

// Create a Supabase client with the service role key and WebSocket transport
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  realtime: {
    transport: ws
  }
});

export const isMockMode = hasPlaceholder;
