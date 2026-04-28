import { supabase } from './src/lib/supabaseClient';

async function test() {
  const { data, error } = await supabase.from('igrejas').select('*');
  console.log(data, error);
}

test();
