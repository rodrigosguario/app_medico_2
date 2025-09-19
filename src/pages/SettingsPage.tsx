// src/pages/Settings.tsx
import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Settings as SettingsIcon,
  Calendar,
  Bell,
  Building2,
  User,
  Database,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'

// ✅ Use exports NOMEADOS (entre chaves) — compatível com o seu projeto
import { ProfileTab } from '@/components/settings/ProfileTab'
import { NotificationsTab } from '@/components/settings/NotificationsTab'
import { HospitalsTab } from '@/components/settings/HospitalsTab'
import { CalendarTab } from '@/components/settings/CalendarTab'
import { DataTab } from '@/components/settings/DataTab'
import { SystemTab } from '@/components/settings/SystemTab'
import Navigation from '@/components/Navigation'

export default function SettingsPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SettingsIcon className="h-6 w-6" />
          <h1 className="text-2xl font-semibold">Configurações</h1>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Dashboard
        </Button>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid grid-cols-6">
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="hospitals">
            <Building2 className="mr-2 h-4 w-4" />
            Hospitais
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <Calendar className="mr-2 h-4 w-4" />
            Calendário
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="data">
            <Database className="mr-2 h-4 w-4" />
            Dados
          </TabsTrigger>
          <TabsTrigger value="system">
            <ShieldCheck className="mr-2 h-4 w-4" />
            Sistema
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab />
        </TabsContent>
        <TabsContent value="hospitals">
          <HospitalsTab />
        </TabsContent>
        <TabsContent value="calendar">
          <CalendarTab />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationsTab />
        </TabsContent>
        <TabsContent value="data">
          <DataTab />
        </TabsContent>
        <TabsContent value="system">
          <SystemTab />
        </TabsContent>
      </Tabs>
        </div>
      </main>
    </div>
  )
}
