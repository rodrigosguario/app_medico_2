// src/components/settings/CalendarTab.tsx
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Calendar, RefreshCcw, Link as LinkIcon, Unlink, Zap, Shield, Sparkles, Check, X, Clock, ChevronRight } from 'lucide-react'
import { useGoogleCalendarSync } from '@/hooks/useGoogleCalendarSync'
import { useOutlookCalendarSync } from '@/hooks/useOutlookCalendarSync'
import { useICloudCalendarSync } from '@/hooks/useICloudCalendarSync'

function formatTime(ts?: string | null) {
  if (!ts) return 'Nunca'
  try { 
    const date = new Date(ts)
    return date.toLocaleString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  } catch { 
    return 'Inválido' 
  }
}

export function CalendarTab() {
  const googleSync = useGoogleCalendarSync()
  const outlookSync = useOutlookCalendarSync()
  const icloudSync = useICloudCalendarSync()
  
  const [icloudCredentials, setIcloudCredentials] = useState({ email: '', password: '' })
  const [showIcloudDialog, setShowIcloudDialog] = useState(false)

  const handleIcloudConnect = async () => {
    if (!icloudCredentials.email || !icloudCredentials.password) return
    
    await icloudSync.connect(icloudCredentials.email, icloudCredentials.password)
    setShowIcloudDialog(false)
    setIcloudCredentials({ email: '', password: '' })
  }

  const ProviderCard = ({ 
    title, 
    subtitle, 
    icon: Icon, 
    isConnected, 
    isLoading, 
    lastSync, 
    onConnect, 
    onDisconnect, 
    onSync,
    connectComponent 
  }: {
    title: string
    subtitle: string
    icon: any
    isConnected: boolean
    isLoading: boolean
    lastSync?: string | null
    onConnect: () => void
    onDisconnect: () => void
    onSync: () => void
    connectComponent?: React.ReactNode
  }) => (
    <div className="modern-card p-6 group animate-fade-in">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl transition-all duration-300 ${
            isConnected 
              ? 'bg-success/10 text-success' 
              : 'bg-muted/50 text-muted-foreground'
          }`}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground">{title}</h3>
            <p className="text-muted-foreground mt-1">{subtitle}</p>
          </div>
        </div>
        
        <Badge 
          variant={isConnected ? "default" : "secondary"}
          className={`${
            isConnected 
              ? 'bg-success/10 text-success border-success/20' 
              : 'bg-muted/50 text-muted-foreground'
          } px-3 py-1`}
        >
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Check className="h-3 w-3" />
            ) : (
              <X className="h-3 w-3" />
            )}
            {isConnected ? 'Conectado' : 'Desconectado'}
          </div>
        </Badge>
      </div>
      
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Clock className="h-4 w-4" />
        <span>Último sync: {formatTime(lastSync)}</span>
      </div>
      
      <div className="flex gap-3">
        {!isConnected ? (
          connectComponent || (
            <Button 
              onClick={onConnect} 
              disabled={isLoading}
              className="flex-1 modern-button h-11"
            >
              <div className="flex items-center gap-2">
                {isLoading ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <LinkIcon className="h-4 w-4" />
                )}
                Conectar
                {!isLoading && <ChevronRight className="h-3 w-3" />}
              </div>
            </Button>
          )
        ) : (
          <>
            <Button 
              variant="secondary" 
              onClick={onSync} 
              disabled={isLoading}
              className="flex-1 h-11 hover:bg-primary/5 hover:text-primary hover:border-primary/20"
            >
              <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Sincronizar
            </Button>
            <Button 
              variant="outline" 
              onClick={onDisconnect} 
              disabled={isLoading}
              size="icon"
              className="h-11 w-11 hover:bg-destructive/5 hover:text-destructive hover:border-destructive/20"
            >
              <Unlink className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-8">
      {/* Header com design clean e profissional */}
      <div className="relative">
        <div className="modern-card p-8 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-subtle opacity-60" />
          
          <div className="relative flex items-start gap-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 text-primary">
              <Calendar className="h-8 w-8" />
            </div>
            
            <div className="flex-1">
              <h2 className="text-3xl font-bold gradient-text mb-3">
                Sincronização de Calendários
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Conecte seus calendários favoritos e mantenha sua agenda médica sempre organizada e atualizada automaticamente.
              </p>
              
              <div className="flex items-center gap-8 mt-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                  <span className="text-foreground/80">Sincronização automática</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-foreground/80">Conexão segura</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                  <span className="text-foreground/80">Tempo real</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid gap-6">
        {/* Google Calendar */}
        <ProviderCard
          title="Google Calendar"
          subtitle="Integração completa com Google Workspace"
          icon={Calendar}
          isConnected={googleSync.isConnected}
          isLoading={googleSync.isLoading}
          lastSync={googleSync.lastSync}
          onConnect={googleSync.connect}
          onDisconnect={googleSync.disconnect}
          onSync={googleSync.sync}
        />

        {/* Microsoft Outlook */}
        <ProviderCard
          title="Microsoft Outlook"
          subtitle="Sincronização com Microsoft 365 e Exchange"
          icon={Calendar}
          isConnected={outlookSync.isConnected}
          isLoading={outlookSync.isLoading}
          lastSync={outlookSync.lastSync}
          onConnect={outlookSync.connect}
          onDisconnect={outlookSync.disconnect}
          onSync={outlookSync.sync}
        />

        {/* Apple iCloud */}
        <ProviderCard
          title="Apple iCloud Calendar"
          subtitle="Acesso via CalDAV para dispositivos Apple"
          icon={Calendar}
          isConnected={icloudSync.isConnected}
          isLoading={icloudSync.isLoading}
          lastSync={icloudSync.lastSync}
          onConnect={() => setShowIcloudDialog(true)}
          onDisconnect={icloudSync.disconnect}
          onSync={icloudSync.sync}
          connectComponent={
            <Dialog open={showIcloudDialog} onOpenChange={setShowIcloudDialog}>
              <DialogTrigger asChild>
                <Button 
                  className="flex-1 modern-button"
                  disabled={icloudSync.isLoading}
                >
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Conectar iCloud
                    <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md modern-card">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Calendar className="h-5 w-5" />
                    </div>
                    Conectar iCloud Calendar
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6 pt-4">
                  <div className="space-y-3">
                    <Label htmlFor="icloud-email" className="text-sm font-medium">Email do iCloud</Label>
                    <Input
                      id="icloud-email"
                      type="email"
                      placeholder="seu@icloud.com"
                      value={icloudCredentials.email}
                      onChange={(e) => setIcloudCredentials(prev => ({ ...prev, email: e.target.value }))}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="icloud-password" className="text-sm font-medium">Senha de Aplicativo</Label>
                    <Input
                      id="icloud-password"
                      type="password"
                      placeholder="xxxx-xxxx-xxxx-xxxx"
                      value={icloudCredentials.password}
                      onChange={(e) => setIcloudCredentials(prev => ({ ...prev, password: e.target.value }))}
                      className="h-11"
                    />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Gere uma senha específica para aplicativos nas configurações de segurança do seu iCloud
                    </p>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowIcloudDialog(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleIcloudConnect}
                      disabled={!icloudCredentials.email || !icloudCredentials.password || icloudSync.isLoading}
                      className="flex-1 modern-button"
                    >
                      {icloudSync.isLoading ? 'Conectando...' : 'Conectar'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          }
        />
      </div>
    </div>
  )
}

export default CalendarTab