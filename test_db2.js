import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://jpftaqubuokdthecsmmx.supabase.co', 'sb_publishable_b-kp7gDZi33r7pEKPT1NOA_M-MnHjW-');
async function run() {
  const { data, error } = await supabase.from('login_directory').select('*').ilike('country', '%Trinidad%');
  console.log(data);
}
run();
