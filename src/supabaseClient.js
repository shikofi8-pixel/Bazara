import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kpnxxpmfiwhonphmgazq.supabase.co'
const supabaseKey = 'sb_publishable_DIBefLmMh9YfcUFPWhwGLg_TJH6HHaX'

export const supabase = createClient(supabaseUrl, supabaseKey)