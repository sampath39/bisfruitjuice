import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import dotenv from 'dotenv';

dotenv.config();

const sanitizeUrl = (url) => {
  if (!url) return '';
  let cleaned = url.trim();
  
  // Check if it's a PostgreSQL connection string instead of an API URL
  if (cleaned.includes('postgresql://') || cleaned.includes('db.supabase.co') || cleaned.includes(':5432')) {
    const match = cleaned.match(/@db\.(.+?)\.supabase/) || cleaned.match(/db\.(.+?)\.supabase/);
    if (match && match[1]) {
      console.warn(`[Supabase Config] Warning: Detected database connection string in SUPABASE_URL. Converting to API URL: https://${match[1]}.supabase.co`);
      return `https://${match[1]}.supabase.co`;
    }
  }
  
  // Clean duplicate protocols e.g. https://https://
  cleaned = cleaned.replace(/^(https?:\/\/)+/i, 'https://');
  if (cleaned && !cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = 'https://' + cleaned;
  }
  return cleaned;
};

const supabaseUrl = sanitizeUrl(process.env.SUPABASE_URL || 'https://placeholder.supabase.co');
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder').trim();

console.log('[Supabase Config] Initializing client with API URL:', supabaseUrl);

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
