import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://varotbfrookhcaxwsacv.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhcm90YmZyb29raGNheHdzYWN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyODE5NTIsImV4cCI6MjEwNTg1Nzk1Mn0.mx4wgucn4Ks6WDCz_zPmIqr7ynzoJva7WsT0eK6Nk2s';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

