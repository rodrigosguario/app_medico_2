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
    <Card className="group relative overflow-hidden border-none bg-gradient-to-br from-background via-background/50 to-muted/30 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-secondary/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <CardHeader className="relative pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${isConnected ? 'bg-primary/10 text-primary' : 'bg-muted/50 text-muted-foreground'} transition-all duration-300 group-hover:scale-110`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">{title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Badge className="bg-primary/10 text-primary border-primary/20 gap-2">
                <Check className="h-3 w-3" />
                Conectado
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-2">
                <X className="h-3 w-3" />
                Desconectado
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative space-y-4 pt-0">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Último sync: {formatTime(lastSync)}</span>
        </div>
        
        <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />
        
        <div className="flex gap-2">
          {!isConnected ? (
            connectComponent || (
              <Button 
                onClick={onConnect} 
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all duration-300 group/btn"
              >
                <div className="flex items-center gap-2">
                  {isLoading ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <LinkIcon className="h-4 w-4 transition-transform group-hover/btn:scale-110" />
                  )}
                  Conectar
                  <ChevronRight className="h-3 w-3 transition-transform group-hover/btn:translate-x-0.5" />
                </div>
              </Button>
            )
          ) : (
            <>
              <Button 
                variant="secondary" 
                onClick={onSync} 
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-secondary to-secondary/90 transition-all duration-300 hover:shadow-md group/btn"
              >
                <RefreshCcw className={`h-4 w-4 mr-2 transition-transform group-hover/btn:rotate-180 ${isLoading ? 'animate-spin' : ''}`} />
                Sincronizar
              </Button>
              <Button 
                variant="destructive" 
                onClick={onDisconnect} 
                disabled={isLoading}
                size="icon"
                className="transition-all duration-300 hover:shadow-md group/btn"
              >
                <Unlink className="h-4 w-4 transition-transform group-hover/btn:scale-110" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-8">
      {/* Header com gradiente futurístico */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/5 to-primary/10 rounded-2xl blur-xl opacity-60" />
        <div className="relative bg-gradient-to-br from-background via-background/80 to-muted/20 backdrop-blur-sm border border-primary/10 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 text-primary">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Sincronização Inteligente
              </h2>
              <p className="text-muted-foreground mt-1">
                Conecte seus calendários e automatize sua gestão médica com IA
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-primary">
              <Shield className="h-4 w-4" />
              Conexão segura
            </div>
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-4 w-4" />
              Sync automático
            </div>
            <div className="flex items-center gap-2 text-primary">
              <Zap className="h-4 w-4" />
              Processamento em tempo real
            </div>
          </div>
        </div>
      </div>

      <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />
      
      <div className="grid gap-6">
        {/* Google Calendar */}
        <ProviderCard
          title="Google Calendar"
          subtitle="Sincronização bidirecional com Google Workspace"
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
          subtitle="Integração com Microsoft 365 e Exchange"
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
          subtitle="Conexão via CalDAV com iCloud"
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
                  className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all duration-300 group/btn"
                  disabled={icloudSync.isLoading}
                >
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 transition-transform group-hover/btn:scale-110" />
                    Conectar iCloud
                    <ChevronRight className="h-3 w-3 transition-transform group-hover/btn:translate-x-0.5" />
                  </div>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Conectar iCloud Calendar
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="icloud-email">Email do iCloud</Label>
                    <Input
                      id="icloud-email"
                      type="email"
                      placeholder="seu@icloud.com"
                      value={icloudCredentials.email}
                      onChange={(e) => setIcloudCredentials(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="icloud-password">Senha de Aplicativo</Label>
                    <Input
                      id="icloud-password"
                      type="password"
                      placeholder="xxxx-xxxx-xxxx-xxxx"
                      value={icloudCredentials.password}
                      onChange={(e) => setIcloudCredentials(prev => ({ ...prev, password: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Use uma senha de aplicativo específica gerada nas configurações do iCloud
                    </p>
                  </div>
                  <div className="flex gap-2 pt-2">
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
                      className="flex-1"
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