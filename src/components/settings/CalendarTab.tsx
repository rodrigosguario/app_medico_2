// src/components/settings/CalendarTab.tsx
import React, { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/hooks/use-toast'
import { Calendar, RefreshCcw, Link as LinkIcon, Unlink } from 'lucide-react'

type ProviderId = 'google' | 'outlook' | 'icloud'

type ProviderState = {
  id: ProviderId
  name: string
  status: 'disconnected' | 'connected' | 'syncing' | 'error'
  lastSync?: string | null
  error?: string | null
}

const PROVIDERS: Record<ProviderId, Omit<ProviderState, 'status'>> = {
  google: { id: 'google', name: 'Google Calendar' },
  outlook: { id: 'outlook', name: 'Microsoft Outlook' },
  icloud: { id: 'icloud', name: 'Apple iCloud' },
}

function fmt(ts?: string | null) {
  if (!ts) return '—'
  try { return new Date(ts).toLocaleString() } catch { return ts }
}

async function getSessionAndUser() {
  const [{ data: sessionData, error: sErr }, { data: userData, error: uErr }] = await Promise.all([
    supabase.auth.getSession(),
    supabase.auth.getUser()
  ])
  if (sErr) throw sErr
  if (uErr) throw uErr
  const accessToken = sessionData?.session?.access_token
  const userId = userData?.user?.id
  if (!accessToken) throw new Error('Usuário não autenticado (sem token)')
  if (!userId) throw new Error('Usuário não autenticado (sem userId)')
  return { accessToken, userId }
}

function fnUrl(fn: string) {
  const base = import.meta.env.VITE_SUPABASE_URL
  if (!base) throw new Error('VITE_SUPABASE_URL ausente')
  return `${base}/functions/v1/${fn}`
}

export function CalendarTab() {
  const [loading, setLoading] = useState(true)
  const [providers, setProviders] = useState<Record<ProviderId, ProviderState>>({
    google: { ...PROVIDERS.google, status: 'disconnected' },
    outlook: { ...PROVIDERS.outlook, status: 'disconnected' },
    icloud: { ...PROVIDERS.icloud, status: 'disconnected' },
  })

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const { error, data } = await supabase
        .from('calendar_credentials')
        .select('provider_id, last_sync_at')

      if (error && error.code !== 'PGRST116') throw error

      const next = { ...providers }
      ;(Object.keys(next) as ProviderId[]).forEach((p) => {
        next[p] = { ...next[p], status: 'disconnected', lastSync: null, error: null }
      })

      ;(data || []).forEach((row: any) => {
        const pid = row.provider_id as ProviderId
        if (next[pid]) {
          next[pid] = {
            ...next[pid],
            status: 'connected',
            lastSync: row.last_sync_at ?? null,
            error: null,
          }
        }
      })

      setProviders(next)
    } catch (e: any) {
      console.error('Erro ao carregar provedores:', e)
      toast({
        title: 'Erro ao carregar',
        description: e?.message ?? 'Falha ao carregar status',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function callFunction(fnName: string, body: any) {
    const { accessToken, userId } = await getSessionAndUser()
    const res = await fetch(fnUrl(fnName), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, ...body }),
    })
    const text = await res.text()
    let json: any = null
    try { json = text ? JSON.parse(text) : null } catch { /* raw text */ }
    if (!res.ok) {
      const msg = json?.message || json?.error || text || 'Erro na função'
      throw new Error(msg)
    }
    return json
  }

  async function connect(provider: ProviderId) {
    try {
      setProviders((prev) => ({ ...prev, [provider]: { ...prev[provider], status: 'syncing', error: null } }))
      const fn =
        provider === 'google' ? 'google-calendar-sync'
        : provider === 'outlook' ? 'outlook-calendar-sync'
        : 'icloud-calendar-sync'

      const result = await callFunction(fn, { action: 'connect' })

      if (result?.authUrl) {
        window.location.href = result.authUrl as string
        return
      }

      toast({ title: `${PROVIDERS[provider].name}`, description: 'Conectado com sucesso.' })
      await load()
    } catch (e: any) {
      console.error('connect error:', e)
      setProviders((prev) => ({ ...prev, [provider]: { ...prev[provider], status: 'error', error: e?.message ?? 'Erro' } }))
      toast({ title: 'Falha ao conectar', description: e?.message ?? 'Verifique as credenciais', variant: 'destructive' })
    }
  }

  async function disconnect(provider: ProviderId) {
    try {
      setProviders((prev) => ({ ...prev, [provider]: { ...prev[provider], status: 'syncing', error: null } }))
      const fn =
        provider === 'google' ? 'google-calendar-sync'
        : provider === 'outlook' ? 'outlook-calendar-sync'
        : 'icloud-calendar-sync'
      await callFunction(fn, { action: 'disconnect' })
      toast({ title: `${PROVIDERS[provider].name}`, description: 'Conta desconectada.' })
      await load()
    } catch (e: any) {
      console.error('disconnect error:', e)
      setProviders((prev) => ({ ...prev, [provider]: { ...prev[provider], status: 'error', error: e?.message ?? 'Erro' } }))
      toast({ title: 'Falha ao desconectar', description: e?.message ?? 'Tente novamente', variant: 'destructive' })
    }
  }

  async function sync(provider: ProviderId) {
    try {
      setProviders((prev) => ({ ...prev, [provider]: { ...prev[provider], status: 'syncing', error: null } }))
      const fn =
        provider === 'google' ? 'google-calendar-sync'
        : provider === 'outlook' ? 'outlook-calendar-sync'
        : 'icloud-calendar-sync'
      const result = await callFunction(fn, { action: 'sync' })
      const info = Array.isArray(result?.synced) ? `${result.synced.length} eventos` : 'Sincronização disparada'
      toast({ title: `${PROVIDERS[provider].name}`, description: info })
      setProviders((prev) => ({
        ...prev,
        [provider]: { ...prev[provider], status: 'connected', lastSync: new Date().toISOString(), error: null },
      }))
    } catch (e: any) {
      console.error('sync error:', e)
      setProviders((prev) => ({ ...prev, [provider]: { ...prev[provider], status: 'error', error: e?.message ?? 'Erro' } }))
      toast({ title: 'Falha na sincronização', description: e?.message ?? 'Tente novamente', variant: 'destructive' })
    }
  }

  function ProviderCard({ p }: { p: ProviderState }) {
    const color =
      p.status === 'connected' ? 'bg-green-100 text-green-700'
      : p.status === 'syncing' ? 'bg-blue-100 text-blue-700'
      : p.status === 'error' ? 'bg-red-100 text-red-700'
      : 'bg-gray-100 text-gray-700'

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {PROVIDERS[p.id].name}
          </CardTitle>
          <Badge className={color}>{p.status}</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">
            Última sincronização: {fmt(p.lastSync)}
          </div>
          {p.error && <div className="text-sm text-red-600">{p.error}</div>}
          <div className="flex gap-2">
            {p.status !== 'connected' ? (
              <Button onClick={() => connect(p.id)} disabled={p.status === 'syncing'}>
                <LinkIcon className="h-4 w-4 mr-2" />
                Conectar
              </Button>
            ) : (
              <>
                <Button variant="secondary" onClick={() => sync(p.id)} disabled={p.status === 'syncing'}>
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Sincronizar agora
                </Button>
                <Button variant="destructive" onClick={() => disconnect(p.id)} disabled={p.status === 'syncing'}>
                  <Unlink className="h-4 w-4 mr-2" />
                  Desconectar
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Conecte suas contas de calendário e sincronize seus plantões automaticamente.
      </div>
      <Separator />
      {loading ? (
        <div className="text-sm text-muted-foreground">Carregando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.keys(providers) as ProviderId[]).map((id) => (
            <ProviderCard key={id} p={providers[id]} />
          ))}
        </div>
      )}
    </div>
  )
}

export default CalendarTab