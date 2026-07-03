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
    const match = t.body.match(/\n\n(Best(?: regards)?|Warm regards|Sincerely),[\s\S]*$/i);
    if (match) {
      const newBody = t.body.replace(match[0], `\n\n${match[1]},`);
      console.log(`Updating template ${t.id} - ${t.title}`);
      await supabase.from('templates').update({ body: newBody }).eq('id', t.id);
    }
  }
  console.log("Done");
}

run();
