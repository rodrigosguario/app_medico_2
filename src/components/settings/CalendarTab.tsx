// src/components/settings/CalendarTab.tsx
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Calendar, AlertTriangle, Info, ExternalLink, Download, Upload, RefreshCw, Settings } from 'lucide-react'
import { useICSManager } from '@/hooks/useICSManager'
import { useCalendarSync } from '@/hooks/useCalendarSync'
import { GoogleClientSetup } from '@/components/GoogleClientSetup'

export function CalendarTab() {
  const { isImporting, isExporting, importICS, exportICS } = useICSManager()
  const { 
    providers, 
    loading, 
    connectGoogleCalendar, 
    syncCalendar, 
    disconnectProvider,
    saveGeneralSettings 
  } = useCalendarSync()
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false)

  const handleImportICS = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.ics'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        importICS(file)
      }
    }
    input.click()
  }

  const handleAutoSyncChange = async (enabled: boolean) => {
    setAutoSyncEnabled(enabled)
    await saveGeneralSettings({
      autoSync: enabled,
      syncNotifications: true,
      bidirectionalSync: true
    })
  }

  const googleProvider = providers.find(p => p.id === 'google')

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
                Gerenciamento de Calendários
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Importe e exporte seus eventos em formato ICS padrão, compatível com todos os principais calendários.
              </p>
              
              <div className="flex items-center gap-8 mt-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                  <span className="text-foreground/80">Formato universal ICS</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-foreground/80">Compatível com Google, Outlook, Apple</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                  <span className="text-foreground/80">Dados seguros</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Google Calendar Integration */}
      <div className="modern-card p-6 group animate-fade-in">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl transition-all duration-300 bg-primary/10 text-primary">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">Google Calendar</h3>
              <p className="text-muted-foreground mt-1">Sincronização automática com sua conta Google</p>
            </div>
          </div>
          
          <Badge 
            variant="secondary" 
            className={googleProvider?.status === 'connected' ? 
              "bg-success/10 text-success border-success/20 px-3 py-1" : 
              "bg-muted/10 text-muted-foreground border-muted/20 px-3 py-1"
            }
          >
            <div className="flex items-center gap-2">
              <Info className="h-3 w-3" />
              {googleProvider?.status === 'connected' ? 'Conectado' : 'Desconectado'}
            </div>
          </Badge>
        </div>
        
        {googleProvider?.status === 'disconnected' && (
          <GoogleClientSetup />
        )}
        
        {googleProvider?.status === 'connected' && (
          <div className="mb-4 p-4 bg-success/5 border border-success/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-sync" className="text-sm font-medium">
                  Sincronização Automática
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Sincroniza automaticamente a cada 30 minutos
                </p>
              </div>
              <Switch
                id="auto-sync"
                checked={autoSyncEnabled}
                onCheckedChange={handleAutoSyncChange}
              />
            </div>
            {googleProvider.lastSync && (
              <p className="text-xs text-muted-foreground mt-2">
                Última sincronização: {googleProvider.lastSync}
              </p>
            )}
          </div>
        )}
        
        <div className="flex gap-3">
          {googleProvider?.status === 'connected' ? (
            <>
              <Button 
                onClick={() => syncCalendar('google')}
                disabled={loading}
                className="modern-button h-11"
              >
                <div className="flex items-center gap-2">
                  {loading ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {loading ? 'Sincronizando...' : 'Sincronizar Agora'}
                </div>
              </Button>
              <Button 
                onClick={() => disconnectProvider('google')}
                disabled={loading}
                variant="outline"
                className="h-11"
              >
                Desconectar
              </Button>
            </>
          ) : googleProvider?.status === 'syncing' ? (
            <Button 
              disabled
              className="flex-1 modern-button h-11"
            >
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sincronizando...
              </div>
            </Button>
          ) : (
            <Button 
              onClick={connectGoogleCalendar}
              disabled={loading}
              className="flex-1 modern-button h-11"
            >
              <div className="flex items-center gap-2">
                {loading ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Calendar className="h-4 w-4" />
                )}
                {loading ? 'Conectando...' : 'Conectar Google Calendar'}
              </div>
            </Button>
          )}
        </div>
      </div>

      {/* Aviso sobre outros provedores */}
      <Alert className="border-warning/20 bg-warning/5">
        <AlertTriangle className="h-4 w-4 text-warning" />
        <AlertDescription className="text-sm leading-relaxed">
          <strong>Outras integrações:</strong><br />
          Microsoft Outlook e Apple Calendar estão em desenvolvimento. 
          Use a sincronização do Google Calendar ou importação/exportação manual via arquivos ICS.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        {/* Importação de ICS */}
        <div className="modern-card p-6 group animate-fade-in">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl transition-all duration-300 bg-success/10 text-success">
                <Download className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground">Importar Calendário</h3>
                <p className="text-muted-foreground mt-1">Importe eventos de arquivos ICS de qualquer calendário</p>
              </div>
            </div>
            
            <Badge variant="secondary" className="bg-success/10 text-success border-success/20 px-3 py-1">
              <div className="flex items-center gap-2">
                <Info className="h-3 w-3" />
                Funcional
              </div>
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <ExternalLink className="h-4 w-4" />
            <span>Compatível com Google Calendar, Outlook, Apple Calendar, e outros</span>
          </div>
          
          <div className="flex gap-3">
            <Button 
              onClick={handleImportICS}
              disabled={isImporting}
              className="flex-1 modern-button h-11"
            >
              <div className="flex items-center gap-2">
                {isImporting ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {isImporting ? 'Importando...' : 'Selecionar arquivo ICS'}
              </div>
            </Button>
          </div>
        </div>

        {/* Exportação de ICS */}
        <div className="modern-card p-6 group animate-fade-in">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl transition-all duration-300 bg-primary/10 text-primary">
                <Upload className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground">Exportar Calendário</h3>
                <p className="text-muted-foreground mt-1">Baixe seus eventos em formato ICS padrão</p>
              </div>
            </div>
            
            <Badge variant="secondary" className="bg-success/10 text-success border-success/20 px-3 py-1">
              <div className="flex items-center gap-2">
                <Info className="h-3 w-3" />
                Funcional
              </div>
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <ExternalLink className="h-4 w-4" />
            <span>Use o arquivo gerado em qualquer aplicativo de calendário</span>
          </div>
          
          <div className="flex gap-3">
            <Button 
              onClick={exportICS}
              disabled={isExporting}
              className="flex-1 modern-button h-11"
            >
              <div className="flex items-center gap-2">
                {isExporting ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {isExporting ? 'Gerando arquivo...' : 'Baixar arquivo ICS'}
              </div>
            </Button>
          </div>
        </div>

        {/* Instruções */}
        <div className="modern-card p-6 bg-gradient-to-br from-muted/30 to-muted/10">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            Como usar arquivos ICS
          </h4>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div>
              <strong>Para importar:</strong> Baixe o arquivo ICS do seu calendário preferido e use a opção "Importar Calendário" acima.
            </div>
            <div>
              <strong>Para exportar:</strong> Use a opção "Exportar Calendário" e importe o arquivo gerado no seu aplicativo de calendário.
            </div>
            <div>
              <strong>Formatos suportados:</strong> Google Calendar (.ics), Outlook (.ics), Apple Calendar (.ics), e outros padrões iCalendar.
            </div>
            <div className="pt-2 border-t border-border/50">
              <strong>Nota:</strong> Esta é uma alternativa segura e confiável às sincronizações automáticas que estavam apresentando problemas.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CalendarTab