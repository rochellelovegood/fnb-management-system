import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('[v0] Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const demoUsers = [
  {
    email: 'admin@fnberp.com',
    password: 'Admin@12345',
    role: 'admin',
    name: 'Admin User'
  },
  {
    email: 'manager@fnberp.com',
    password: 'Manager@12345',
    role: 'production_manager',
    name: 'Production Manager'
  },
  {
    email: 'staff@fnberp.com',
    password: 'Staff@12345',
    role: 'kitchen_staff',
    name: 'Kitchen Staff'
  }
];

async function createDemoUsers() {
  console.log('[v0] Starting demo user creation...\n');

  for (const user of demoUsers) {
    try {
      console.log(`[v0] Creating user: ${user.email}`);

      // Create auth user
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          console.log(`[v0] User ${user.email} already exists, updating...`);
        } else {
          throw authError;
        }
      } else {
        console.log(`[v0] ✓ Auth user created: ${authUser.user.id}`);

        // Create user profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: authUser.user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            created_at: new Date().toISOString(),
          })
          .select();

        if (profileError) {
          console.log(`[v0] Profile may already exist, skipping insert`);
        } else {
          console.log(`[v0] ✓ Profile created for ${user.name}`);
        }
      }

      console.log(`[v0] Email: ${user.email}`);
      console.log(`[v0] Password: ${user.password}`);
      console.log(`[v0] Role: ${user.role}\n`);

    } catch (error) {
      console.error(`[v0] Error creating user ${user.email}:`, error.message);
    }
  }

  console.log('[v0] Demo user creation completed!');
  console.log('\n=== DEMO CREDENTIALS ===\n');
  demoUsers.forEach(user => {
    console.log(`${user.role.toUpperCase()}`);
    console.log(`Email: ${user.email}`);
    console.log(`Password: ${user.password}\n`);
  });
  
  process.exit(0);
}

createDemoUsers().catch(error => {
  console.error('[v0] Fatal error:', error);
  process.exit(1);
});
