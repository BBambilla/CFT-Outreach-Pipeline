import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://jpftaqubuokdthecsmmx.supabase.co', 'sb_publishable_b-kp7gDZi33r7pEKPT1NOA_M-MnHjW-');
async function run() {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'olly@cft-app.local',
    password: 'password' // or whatever it might be
  });
  console.log("Auth:", authError ? authError.message : "Success");
  if (!authError) {
    const { data, error } = await supabase.from('students').select('*').ilike('name', '%Junelle%');
    console.log(data);
  }
}
run();
