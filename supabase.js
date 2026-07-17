import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
const supabaseUrl = "https://qfcduhnbmmmnhnzcqhni.supabase.co";
const supabaseAnonKey = "sb_publishable_9WQsosayet2OjL4bz1yzEA_jEHfmNpn";
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdminKey="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmY2R1aG5ibW1tbmhuemNxaG5pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzY4MzM1MCwiZXhwIjoyMDk5MjU5MzUwfQ.gUuVRgU3AS9IIEeMqXoLp1lzcNMuBhjWRJRcPXNxbiU"
export const supabaseAdmin = createClient(supabaseUrl, supabaseAdminKey);
export default supabase;