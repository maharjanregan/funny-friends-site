const { createClient } = require('@supabase/supabase-js');

(async () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;
  const supabase = createClient(url, key);

  const { data, error } = await supabase
    .from('messages')
    .select('id, friend, text, image_url, created_at')
    .order('created_at', { ascending: false })
    .limit(1);

  console.log('error=', error && error.message);
  console.log('data=', data);
})();
