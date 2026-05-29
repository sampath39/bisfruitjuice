import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lgztolrpwgdydrxxiejn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnenRvbHJwd2dkeWRyeHhpZWpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MzY4NzQsImV4cCI6MjA5NTUxMjg3NH0.wSTKvkAWt8M3YCr-ILZBUL5aVEnCoeymGx6aO7dmTso';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: class { constructor() {} addEventListener() {} removeEventListener() {} close() {} } }
});

async function run() {
  console.log('Testing sign in with incorrect credentials to check responsiveness...');
  try {
    const start = Date.now();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'nonexistent@test.com',
      password: 'wrongpassword'
    });
    console.log(`Finished in ${Date.now() - start}ms`);
    console.log('Response:', { data: data.user ? 'User data returned' : null, error: error?.message });
  } catch (err) {
    console.error('Catch error:', err);
  }
}

run();
