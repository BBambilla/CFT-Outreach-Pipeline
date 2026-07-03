import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://jpftaqubuokdthecsmmx.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_b-kp7gDZi33r7pEKPT1NOA_M-MnHjW-';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data, error } = await supabase.rpc('execute_sql', { query: "ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS country text; ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS submission_date date;" });
  console.log("Data:", data, "Error:", error);
}

run();
