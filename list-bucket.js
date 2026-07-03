import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function listFiles() {
  const { data, error } = await supabase.storage.from('attachments').list();
  if (error) console.error(error);
  else console.log(data);
}
listFiles();
