import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function list() {
  const { data, error } = await supabase.storage.from('attachments').list('registry', {
    limit: 100,
    offset: 0,
    sortBy: { column: 'name', order: 'asc' }
  });
  console.log('List API:', data, error);
}
list();
