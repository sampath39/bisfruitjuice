import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: class { constructor() {} addEventListener() {} removeEventListener() {} close() {} } }
});

const ADMIN_EMAIL = 'imran@juice.com';
const ADMIN_PASSWORD = 'Admin@1234';
const ADMIN_NAME = 'Imran';

async function createAdminUser() {
  console.log('🔧 Creating admin user in Supabase...\n');

  // Step 1: Create the user in auth.users
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true, // Skip email confirmation
    user_metadata: {
      full_name: ADMIN_NAME,
      role: 'admin'
    }
  });

  if (authError) {
    if (authError.message.includes('already been registered') || authError.message.includes('already exists')) {
      console.log('⚠️  User already exists in auth. Updating profile role to admin...');

      // Get the existing user by email
      const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) { console.error('Failed to list users:', listError.message); process.exit(1); }

      const existingUser = users.users.find(u => u.email === ADMIN_EMAIL);
      if (!existingUser) { console.error('Could not find user by email'); process.exit(1); }

      // Upsert the profile with admin role
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({ id: existingUser.id, full_name: ADMIN_NAME, role: 'admin' });

      if (profileError) {
        console.error('❌ Failed to update profile:', profileError.message);
        process.exit(1);
      }

      console.log('✅ Admin profile updated successfully!');
      console.log(`   Email: ${ADMIN_EMAIL}`);
      console.log(`   Password: ${ADMIN_PASSWORD}`);
      console.log(`   Role: admin`);
      return;
    }
    console.error('❌ Failed to create auth user:', authError.message);
    process.exit(1);
  }

  console.log('✅ Auth user created:', authData.user.id);

  // Step 2: Set the profile role to admin
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: authData.user.id,
      full_name: ADMIN_NAME,
      role: 'admin'
    });

  if (profileError) {
    console.error('❌ Failed to set profile role:', profileError.message);
    process.exit(1);
  }

  console.log('\n🎉 Admin user created successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`   Email   : ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
  console.log(`   Role    : admin`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

createAdminUser().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
