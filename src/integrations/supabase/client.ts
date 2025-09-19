import { createClient } from '@supabase/supabase-js'

// Configuração direta do Supabase (não usa variáveis de ambiente VITE_*)
const supabaseUrl = "https://kmwsoppkrjzjioeadtqb.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imttd3NvcHBrcmp6amlvZWFkdHFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3ODkzNzYsImV4cCI6MjA3MzM2NTM3Nn0.RsQd3r30Ezfi5x_Di2eLgkqm5SCDC9tlOIXIDRJcYMY"

console.log('🔧 Configuração Supabase:', {
  url: supabaseUrl ? '✅ Definida' : '❌ Ausente',
  key: supabaseAnonKey ? '✅ Definida' : '❌ Ausente'
});

// Verificação de configuração
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage = 'Configuração do Supabase ausente. Verifique a configuração do projeto.';
  console.error('❌', errorMessage);
  throw new Error(errorMessage);
}

// Criar cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    debug: false
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

// Log de debug para verificar se o cliente foi criado
console.log('🚀 Cliente Supabase criado:', !!supabase);