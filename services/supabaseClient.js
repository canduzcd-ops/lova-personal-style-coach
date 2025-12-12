import { createClient } from '@supabase/supabase-js';
// Verilen URL ve Anon Key
const supabaseUrl = 'https://yvsavtjonwhuywunlxsz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2c2F2dGpvbndodXl3dW5seHN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMzUwMjgsImV4cCI6MjA4MDYxMTAyOH0.Nvt06UXNzdLU3ImzHTz15rgqkrBW_9kJ6Fok0etvrms';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
