import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

console.log('🔧 Configuração Supabase:', {
  url: supabaseUrl ? '✅ Definida' : '❌ Ausente',
  key: supabaseAnonKey ? '✅ Definida' : '❌ Ausente',
  environment: import.meta.env.MODE
});

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage = 'Configuração do Supabase ausente. Verifique as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no arquivo .env';
  console.error('❌', errorMessage);
  throw new Error(errorMessage);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    debug: import.meta.env.MODE === 'development'
  },
  global: {
    headers: { 
      'x-client-info': 'medicoagenda-web',
      'x-app-version': '1.0.0'
    },
  },
  realtime: {
    params: { eventsPerSecond: 2 },
  },
})

// Teste de conectividade inicial
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.warn('⚠️ Problema na sessão inicial:', error.message);
  } else {
    console.log('✅ Cliente Supabase inicializado com sucesso');
    if (data.session) {
      console.log('👤 Sessão ativa encontrada:', data.session.user.email);
    }
  }
}).catch(err => {
  console.error('💥 Erro na inicialização do Supabase:', err);
});