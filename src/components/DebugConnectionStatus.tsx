// src/components/DebugConnectionStatus.tsx
import React, { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'

type Status = 'idle' | 'checking' | 'connected' | 'error'

export default function DebugConnectionStatus() {
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState<string>('')

  useEffect(() => {
    const run = async () => {
      try {
        setStatus('checking')

        // Teste 1: consulta simples usando o client (respeita RLS/ambiente)
        const { error: basicError } = await supabase
          .from('profiles')
          .select('count', { count: 'exact', head: true })

        if (basicError) throw basicError

        // Teste 2: HEAD no REST usando a URL do ambiente (sem fixar projeto)
        const baseUrl = import.meta.env.VITE_SUPABASE_URL
        if (baseUrl) {
          await fetch(`${baseUrl}/rest/v1/`, { method: 'HEAD' })
        }

        setStatus('connected')
        setMessage('Conectado ao Supabase com sucesso.')
      } catch (e: any) {
        setStatus('error')
        setMessage(e?.message ?? 'Falha ao verificar conexão')
        console.error('DebugConnectionStatus error:', e)
      }
    }

    run()
  }, [])

  return (
    <div className="text-sm text-muted-foreground">
      Status: {status} {message ? `— ${message}` : ''}
    </div>
  )
}