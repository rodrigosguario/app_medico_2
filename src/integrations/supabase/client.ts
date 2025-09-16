import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kmwsoppkrjzjioeadtqb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imttd3NvcHBrcmp6amlvZWFkdHFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3ODkzNzYsImV4cCI6MjA3MzM2NTM3Nn0.RsQd3r30Ezfi5x_Di2eLgkqm5SCDC9tlOIXIDRJcYMY'

console.log('Configurando Supabase client...')
console.log('URL:', supabaseUrl)
console.log('Key (primeiros 20 chars):', supabaseAnonKey?.substring(0, 20) + '...')

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'planton-sync@1.0.0'
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Teste de conectividade
supabase.from('profiles').select('count', { count: 'exact', head: true })
  .then(({ error, count }) => {
    if (error) {
      console.error('Erro de conectividade Supabase:', error)
    } else {
      console.log('✅ Supabase conectado com sucesso. Perfis encontrados:', count)
    }
  })

// Log de eventos de autenticação
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event, session?.user?.email)
})
