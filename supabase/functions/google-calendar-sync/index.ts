// supabase/functions/google-calendar-sync/index.ts
// Deno Deploy (Edge Function) – Google Calendar OAuth + armazenamento dos tokens
// Fluxo:
//  - POST /functions/v1/google-calendar-sync  { action: "connect", userId }
//      -> retorna { authUrl } para redirecionar o usuário ao Google
//  - GET  /functions/v1/google-calendar-sync/callback?code=...&state=<userId>
//      -> troca "code" por tokens e salva em "calendar_credentials"
//  - POST /functions/v1/google-calendar-sync  { action: "disconnect", userId }
//      -> remove credenciais
//  - POST /functions/v1/google-calendar-sync  { action: "sync", userId }
//      -> (stub) verifica credenciais; aqui você pode puxar eventos etc.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS básico
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}

function badRequest(msg: string) {
  return json({ error: msg, message: msg }, 400)
}

function serverError(msg: string) {
  return json({ error: msg, message: msg }, 500)
}

function getEnvOrNull(name: string) {
  const v = Deno.env.get(name)
  return (v && v.trim().length > 0) ? v : null
}

function getSupabase() {
  const url = getEnvOrNull('SUPABASE_URL')
  const key = getEnvOrNull('SUPABASE_SERVICE_ROLE_KEY') // precisa da role para ignorar RLS na function
  if (!url || !key) throw new Error('SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY ausentes')
  return createClient(url, key)
}

function buildRedirectUriFromEnv() {
  // Você pode deixar fixo via GOOGLE_REDIRECT_URI ou construir a partir do SUPABASE_URL
  const configured = getEnvOrNull('GOOGLE_REDIRECT_URI')
  if (configured) return configured
  const supabaseUrl = getEnvOrNull('SUPABASE_URL')
  if (!supabaseUrl) throw new Error('SUPABASE_URL ausente')
  // CALLBACK desta function:
  // https://<project>.supabase.co/functions/v1/google-calendar-sync/callback
  return `${supabaseUrl}/functions/v1/google-calendar-sync/callback`
}

// ---------- Handlers ----------

async function handleConnect(userId: string) {
  console.log('🔗 Iniciando conexão Google Calendar para usuário:', userId)
  
  const clientId = getEnvOrNull('GOOGLE_CLIENT_ID')
  const clientSecret = getEnvOrNull('GOOGLE_CLIENT_SECRET')
  const redirectUri = buildRedirectUriFromEnv()

  console.log('🔧 Configurações OAuth:', {
    clientId: clientId ? `DEFINIDO (${clientId.substring(0, 10)}...)` : 'AUSENTE',
    clientSecret: clientSecret ? 'DEFINIDO' : 'AUSENTE',
    redirectUri
  })

  // Validamos tudo e falamos exatamente o que falta
  const missing: string[] = []
  if (!clientId) missing.push('GOOGLE_CLIENT_ID')
  if (!clientSecret) missing.push('GOOGLE_CLIENT_SECRET')
  if (!redirectUri) missing.push('GOOGLE_REDIRECT_URI (ou SUPABASE_URL)')

  if (missing.length) {
    console.error('❌ Configurações ausentes:', missing)
    return badRequest(`Configuração OAuth incompleta. Configure no Supabase Dashboard: ${missing.join(', ')}`)
  }

  const scope = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events',
  ].join(' ')

  const params = new URLSearchParams({
    client_id: clientId!,
    redirect_uri: redirectUri!,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    scope,
    state: userId, // vamos recuperar no callback
  })

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  console.log('✅ URL de autorização gerada')
  
  return json({ authUrl })
}

async function handleCallback(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const userId = url.searchParams.get('state') // veio de "state" no connect

  console.log('🔄 Callback recebido:', { code: !!code, userId })

  if (!code || !userId) {
    console.error('❌ Callback inválido - code ou userId ausente')
    return badRequest('Missing code or state (userId)')
  }

  const clientId = getEnvOrNull('GOOGLE_CLIENT_ID')
  const clientSecret = getEnvOrNull('GOOGLE_CLIENT_SECRET')
  const redirectUri = buildRedirectUriFromEnv()

  if (!clientId || !clientSecret || !redirectUri) {
    console.error('❌ Configurações OAuth ausentes:', { clientId: !!clientId, clientSecret: !!clientSecret, redirectUri })
    return badRequest('Missing required parameters for token exchange')
  }

  console.log('🔗 Trocando code por tokens...')
  
  // Troca "code" por tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  const tokenJson = await tokenRes.json()
  if (!tokenRes.ok) {
    console.error('❌ Erro na troca de tokens:', tokenJson)
    return serverError('Failed to exchange authorization code')
  }

  console.log('✅ Tokens obtidos com sucesso')

  const accessToken: string = tokenJson.access_token
  const refreshToken: string | undefined = tokenJson.refresh_token
  const expiresInSec: number = tokenJson.expires_in ?? 3600
  const expiresAt = new Date(Date.now() + expiresInSec * 1000).toISOString()

  // Salva/atualiza credenciais
  const supabase = getSupabase()
  const { error } = await supabase
    .from('calendar_credentials')
    .upsert({
      user_id: userId,
      provider_id: 'google',
      access_token: accessToken,
      refresh_token: refreshToken ?? null,
      expires_at: expiresAt,
      last_sync_at: null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,provider_id' })

  if (error) {
    console.error('❌ Erro ao salvar no banco:', error)
    return serverError('Failed to persist credentials')
  }

  console.log('✅ Credenciais salvas no banco')

  // Redirecionar de volta para o app com sucesso
  const appUrl = getEnvOrNull('APP_PUBLIC_URL') || 'https://f718139e-0921-4562-b04f-6519c248b00c.lovableproject.com'
  const successUrl = `${appUrl}/#/oauth/callback?google_connected=true`
  
  return new Response(null, {
    status: 302,
    headers: { 
      Location: successUrl, 
      ...corsHeaders 
    },
  })
}

async function handleDisconnect(userId: string) {
  const supabase = getSupabase()
  const { error } = await supabase
    .from('calendar_credentials')
    .delete()
    .eq('user_id', userId)
    .eq('provider_id', 'google')

  if (error) {
    console.error('disconnect error:', error)
    return serverError('Failed to remove credentials')
  }
  return json({ ok: true })
}

async function handleSync(userId: string) {
  // Verifica se existem credenciais para o usuário
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('calendar_credentials')
    .select('access_token, expires_at, refresh_token')
    .eq('user_id', userId)
    .eq('provider_id', 'google')
    .maybeSingle()

  if (error) {
    console.error('load credentials error:', error)
    return serverError('Failed to load credentials')
  }

  if (!data) {
    return badRequest('Missing credentials – conecte primeiro')
  }

  // Aqui você pode chamar a Google Calendar API com data.access_token
  // Para este passo a passo, só retornamos OK.
  return json({ synced: [] })
}

// ---------- Router ----------

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const url = new URL(req.url)
  try {
    console.log('📍 Request path:', url.pathname, 'Method:', req.method)
    
    // Callback da autorização do Google (não requer autenticação)
    if (url.pathname.includes('/callback')) {
      console.log('🔄 Processing Google OAuth callback')
      return await handleCallback(req)
    }

    // JSON POST com action e userId
    if (req.method !== 'POST') {
      return badRequest('Use POST ou /callback')
    }

    // Verificar autenticação apenas para requisições POST (não para callback)
    const auth = req.headers.get('authorization') || ''
    if (!auth.startsWith('Bearer ')) {
      return badRequest('Missing or invalid Authorization header')
    }

    const body = await req.json().catch(() => ({}))
    const action = body?.action as string | undefined
    const userId = body?.userId as string | undefined

    if (!action) return badRequest('Missing action')
    if (!userId) return badRequest('Missing userId')

    if (action === 'connect') return await handleConnect(userId)
    if (action === 'disconnect') return await handleDisconnect(userId)
    if (action === 'sync') return await handleSync(userId)

    return badRequest('Unknown action')
  } catch (e: any) {
    console.error('Unhandled error:', e)
    return serverError(e?.message ?? 'Internal error')
  }
})
