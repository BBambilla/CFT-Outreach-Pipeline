import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://jpftaqubuokdthecsmmx.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_b-kp7gDZi33r7pEKPT1NOA_M-MnHjW-';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data, error } = await supabase.from('templates').select('*');
  if (error) {
    console.error(error);
    return;
  }
  for (const t of data) {
    console.log(`ID: ${t.id} | Title: ${t.title} | Subject: ${t.subject}`);
  }
}

run();
