const missingSupabaseConfigMessage =
  'Konfigurasi Supabase belum lengkap. Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY dengan publishable/anon key di .env.local, lalu restart server dev.'

const secretKeyInBrowserMessage =
  'NEXT_PUBLIC_SUPABASE_ANON_KEY berisi secret API key. Gunakan publishable/anon key Supabase untuk browser, lalu restart server dev.'

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey || anonKey === 'your-supabase-anon-key') {
    throw new Error(missingSupabaseConfigMessage)
  }

  if (anonKey.startsWith('sb_secret_')) {
    throw new Error(secretKeyInBrowserMessage)
  }

  return { url, anonKey }
}

export function getSupabaseAuthErrorMessage(message: string) {
  if (message.toLowerCase().includes('invalid api key')) {
    return 'Supabase API key tidak valid. Perbarui NEXT_PUBLIC_SUPABASE_ANON_KEY di .env.local dengan publishable/anon key dari Supabase, lalu restart server dev.'
  }

  if (message.toLowerCase().includes('secret api key')) {
    return secretKeyInBrowserMessage
  }

  return message
}
