// src/hooks/useUserHospitals.ts
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'

export type Hospital = {
  id: string
  user_id: string
  name: string
  address?: string | null
  phone?: string | null
  email?: string | null
  created_at?: string
  updated_at?: string
}

function normalize(s: any) {
  return (typeof s === 'string' ? s : s ?? '').trim()
}

function nowIso() {
  return new Date().toISOString()
}

function useUserHospitals() {
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data: auth } = await supabase.auth.getUser()
      const user = auth?.user
      if (!user) {
        setHospitals([])
        return
      }

      const { data, error } = await supabase
        .from('hospitals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setHospitals((data || []) as Hospital[])
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao carregar hospitais')
      console.error('load hospitals error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function createHospital(input: Partial<Hospital>) {
    const { data: auth } = await supabase.auth.getUser()
    const user = auth?.user
    if (!user) throw new Error('Usuário não autenticado')

    const payload: Partial<Hospital> = {
      user_id: user.id,
      name: normalize(input.name),
      address: normalize(input.address),
      phone: normalize(input.phone),
      email: normalize(input.email),
      created_at: nowIso(),
      updated_at: nowIso(),
    }

    const { data, error } = await supabase
      .from('hospitals')
      .insert(payload)
      .select()
      .single()

    if (error) throw error
    setHospitals(prev => [data as Hospital, ...prev])
    return data as Hospital
  }

  async function updateHospital(id: string, updates: Partial<Hospital>) {
    const { data: auth } = await supabase.auth.getUser()
    const user = auth?.user
    if (!user) throw new Error('Usuário não autenticado')

    const payload: Partial<Hospital> = {
      name: updates.name !== undefined ? normalize(updates.name) : undefined,
      address: updates.address !== undefined ? normalize(updates.address) : undefined,
      phone: updates.phone !== undefined ? normalize(updates.phone) : undefined,
      email: updates.email !== undefined ? normalize(updates.email) : undefined,
      updated_at: nowIso(),
    }

    // garante que não tentaremos alterar user_id
    delete (payload as any).user_id

    const { data, error } = await supabase
      .from('hospitals')
      .update(payload)
      .eq('id', id)
      .eq('user_id', user.id)      // ajuda a bater com a policy
      .select()
      .single()

    if (error) throw error
    setHospitals(prev => prev.map(h => (h.id === id ? (data as Hospital) : h)))
    return data as Hospital
  }

  async function deleteHospital(id: string) {
    const { data: auth } = await supabase.auth.getUser()
    const user = auth?.user
    if (!user) throw new Error('Usuário não autenticado')

    // Otimista: remove da UI primeiro
    const snapshot = hospitals
    setHospitals(prev => prev.filter(h => h.id !== id))

    // Importante: NÃO chamar .select() aqui (evita SELECT na linha deletada sob RLS)
    const { error } = await supabase
      .from('hospitals')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Erro ao remover hospital:', error)
      // Rollback da UI se falhar
      setHospitals(snapshot)
      throw error
    }
  }

  return {
    hospitals,
    loading,
    error,
    load,
    createHospital,
    updateHospital,
    deleteHospital,
  }
}

export { useUserHospitals }
export default useUserHospitals
