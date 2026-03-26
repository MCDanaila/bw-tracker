import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing SUPABASE_URL or SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function seedTestAthletes() {
  console.log('🌱 Seeding test athletes...');

  // Get the first coach (the logged-in user)
  const { data: coachUsers, error: coachErr } = await supabase
    .from('profiles')
    .select('id, username, email')
    .eq('role', 'coach')
    .limit(1);

  if (coachErr) {
    console.error('Error fetching coach:', coachErr);
    process.exit(1);
  }

  if (!coachUsers || coachUsers.length === 0) {
    console.error('No coach found in profiles table. Please ensure you are logged in as a coach.');
    process.exit(1);
  }

  const coachId = coachUsers[0].id;
  const coachEmail = coachUsers[0].email;
  console.log(`✓ Found coach: ${coachUsers[0].username || coachEmail}`);

  // Test athletes to create
  const testAthletes = [
    { username: 'marco', email: 'marco@example.com', height: 180, initial_weight: 75 },
    { username: 'giulia', email: 'giulia@example.com', height: 165, initial_weight: 62 },
    { username: 'alex', email: 'alex@example.com', height: 178, initial_weight: 80 },
  ];

  // Check which athletes already exist
  const { data: existingEmails } = await supabase
    .from('profiles')
    .select('email')
    .in(
      'email',
      testAthletes.map(a => a.email)
    );

  const existingEmailSet = new Set((existingEmails ?? []).map(e => e.email));
  const athletesToCreate = testAthletes.filter(a => !existingEmailSet.has(a.email));

  if (athletesToCreate.length === 0) {
    console.log('✓ All test athletes already exist');
  } else {
    console.log(`Creating ${athletesToCreate.length} new athletes...`);

    // Create profiles via auth.admin.createUser (requires SERVICE_ROLE_KEY)
    for (const athlete of athletesToCreate) {
      // First, create the auth user
      const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
        email: athlete.email,
        password: 'test1234',
        email_confirm: true,
      });

      if (authErr) {
        console.error(`Error creating auth user for ${athlete.email}:`, authErr);
        continue;
      }

      const athleteId = authUser.user.id;

      // Then update the profile
      const { error: profileErr } = await supabase.from('profiles').upsert({
        id: athleteId,
        email: athlete.email,
        username: athlete.username,
        role: 'athlete',
        height: athlete.height,
        initial_weight: athlete.initial_weight,
      });

      if (profileErr) {
        console.error(`Error creating profile for ${athlete.email}:`, profileErr);
        continue;
      }

      // Assign to coach
      const { error: assignErr } = await supabase.from('coach_athletes').upsert({
        coach_id: coachId,
        athlete_id: athleteId,
        status: 'active',
      });

      if (assignErr) {
        console.error(`Error assigning ${athlete.email} to coach:`, assignErr);
        continue;
      }

      console.log(`✓ Created athlete: ${athlete.username} (${athlete.email})`);
    }
  }

  console.log('✅ Test athletes seeding complete!');
  console.log(`Go to http://localhost:5174/dashboard/athletes to view athletes`);
  console.log(`Then visit http://localhost:5174/dashboard/ai-planner and select an athlete`);
}

seedTestAthletes().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
