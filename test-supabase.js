import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://jpftaqubuokdthecsmmx.supabase.co', process.env.SUPABASE_ANON_KEY || 'dummy');
const { data } = supabase.storage.from('attachments').getPublicUrl('registry/Breno Montserrat.pdf');
console.log(data.publicUrl);
