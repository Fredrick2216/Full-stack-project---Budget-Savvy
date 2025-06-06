
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://bxkfbigjzzrghinholwm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4a2ZiaWdqenpyZ2hpbmhvbHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3NDIxMDMsImV4cCI6MjA2MTMxODEwM30.OVIaM-c-28sadPULg0n6FJHbNmgj8z3DoOTgW9odoAM";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});
