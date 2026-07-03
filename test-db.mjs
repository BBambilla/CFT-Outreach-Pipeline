import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://jpftaqubuokdthecsmmx.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_b-kp7gDZi33r7pEKPT1NOA_M-MnHjW-';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data, error } = await supabase.from('sponsors').select('submission_date, country').limit(1);
  console.log("Data:", data, "Error:", error);
}

run();
