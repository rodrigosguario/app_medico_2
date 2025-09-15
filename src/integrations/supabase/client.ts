import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl) {
  console.error('VITE_SUPABASE_URL não está definida')
  throw new Error('VITE_SUPABASE_URL é obrigatória')
}

if (!supabaseAnonKey) {
  console.error('VITE_SUPABASE_PUBLISHABLE_KEY não está definida')
  throw new Error('VITE_SUPABASE_PUBLISHABLE_KEY é obrigatória')
}

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
  .catch(err => {
    console.error('❌ Falha na conectividade Supabase:', err)
  })

// Log de eventos de autenticação
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event, session?.user?.email)
})
