import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import { getSupabaseConfig } from '@/lib/supabase-config'

const { url: supabaseUrl, anonKey: supabaseAnonKey } = getSupabaseConfig()

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
