// src/components/settings/ProfileTab.tsx
import React, { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'

type ProfileForm = {
  name: string
  email: string
  crm: string
  specialty: string
  phone: string
  tax_type?: string
  tax_rate?: number | string
}

const DEFAULT_FORM: ProfileForm = {
  name: '',
  email: '',
  crm: '',
  specialty: '',
  phone: '',
  tax_type: 'simples_11',
  tax_rate: 6,
}

export default function ProfileTab() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profileForm, setProfileForm] = useState<ProfileForm>(DEFAULT_FORM)

  // Carrega perfil existente (se houver)
  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        if (error) throw error

        if (data) {
          setProfileForm({
            name: data.name ?? '',
            email: data.email ?? (user.email ?? ''),
            crm: data.crm ?? '',
            specialty: data.specialty ?? '',
            phone: data.phone ?? '',
            tax_type: data.tax_type ?? 'simples_11',
            tax_rate: typeof data.tax_rate === 'number' ? data.tax_rate : Number(data.tax_rate ?? 0),
          })
        } else {
          // Sem perfil: pré-preenche e-mail do auth
          setProfileForm((prev) => ({ ...prev, email: user.email ?? '' }))
        }
      } catch (err) {
        console.error('Erro ao carregar perfil:', err)
        toast({
          title: 'Erro ao carregar perfil',
          description: 'Tente novamente em alguns instantes.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const handleSave = async () => {
    try {
      setSaving(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      // Monta payload; garante user_id e normaliza tipos
      const payload: any = {
        user_id: user.id,
        name: (profileForm.name ?? '').trim(),
        email: (profileForm.email ?? user.email ?? '').trim(),
        crm: (profileForm.crm ?? '').trim(),
        specialty: (profileForm.specialty ?? '').trim(),
        phone: (profileForm.phone ?? '').trim(),
        tax_type: profileForm.tax_type ?? null,
        tax_rate: Number(profileForm.tax_rate) || 0,
        updated_at: new Date().toISOString(),
      }

      // Evita conflito com PK ao fazer upsert por user_id
      if ('id' in payload) delete payload.id

      const { data, error } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'user_id' }) // 👈 cria ou atualiza pelo user_id
        .select()
        .single()

      if (error) throw error

      // Atualiza formulário com o que foi persistido
      setProfileForm((prev) => ({
        ...prev,
        ...data,
        tax_rate: Number(data?.tax_rate ?? prev.tax_rate ?? 0),
      }))

      toast({
        title: 'Perfil salvo',
        description: 'Suas alterações foram salvas com sucesso.',
      })
    } catch (err: any) {
      console.error('Erro ao salvar perfil:', err)
      toast({
        title: 'Erro ao salvar',
        description: err?.message ?? 'Erro desconhecido',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 text-sm text-muted-foreground flex items-center">
        <span className="ml-2">Carregando perfil...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Informações Pessoais */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Informações Pessoais</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo</Label>
            <Input
              id="name"
              placeholder="Seu nome completo"
              value={profileForm.name}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={profileForm.email}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="crm">CRM</Label>
            <Input
              id="crm"
              placeholder="12345/SP"
              value={profileForm.crm}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, crm: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialty">Especialidade</Label>
            <Input
              id="specialty"
              placeholder="Cardiologia"
              value={profileForm.specialty}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, specialty: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              placeholder="(11) 99999-9999"
              value={profileForm.phone}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
            />
          </div>
        </div>
      </section>

      {/* Configurações Fiscais */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Configurações Fiscais</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Tipo de Tributação</Label>
            <Select
              value={profileForm.tax_type}
              onValueChange={(value) =>
                setProfileForm((prev) => ({ ...prev, tax_type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="simples_11">Simples Nacional (11%)</SelectItem>
                <SelectItem value="simples_6">Simples Nacional (6%)</SelectItem>
                <SelectItem value="pf_autonomo">Pessoa Física (autônomo)</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tax_rate">Taxa de Imposto (%)</Label>
            <Input
              id="tax_rate"
              type="number"
              step="0.01"
              placeholder="6.00"
              value={profileForm.tax_rate ?? ''}
              onChange={(e) =>
                setProfileForm((prev) => ({
                  ...prev,
                  tax_rate: e.target.value,
                }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Taxa de imposto sobre o faturamento bruto
            </p>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar Perfil'}
        </Button>
      </div>
    </div>
  )
}