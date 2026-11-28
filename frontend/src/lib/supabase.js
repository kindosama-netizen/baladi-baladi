import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.warn('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(url || '', key || '')

export const PUBLIC_SITE_URL =
  import.meta.env.VITE_PUBLIC_SITE_URL ||
  (typeof window !== 'undefined' ? window.location.origin : '')
