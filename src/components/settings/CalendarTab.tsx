import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useCalendarSync } from '@/hooks/useCalendarSync';
import { useImprovedFeedbackToast } from '@/components/ImprovedFeedbackToast';
import { 
  RefreshCw, 
  CheckCircle,
  AlertCircle,
  Clock,
  Settings,
  Link,
  Trash2
} from 'lucide-react';

export const CalendarTab: React.FC = () => {
  const { 
    providers, 
    loading, 
    connectGoogleCalendar, 
    connectOutlookCalendar,
    connectIcloudCalendar,
    syncCalendar,
    disconnectProvider,
    saveGeneralSettings,
    loadGeneralSettings
  } = useCalendarSync();
  
  const feedbackToast = useImprovedFeedbackToast();
  const [autoSync, setAutoSync] = useState(true);
  const [syncNotifications, setSyncNotifications] = useState(true);
  const [bidirectionalSync, setBidirectionalSync] = useState(false);

  useEffect(() => {
    loadSavedSettings();
  }, []);

  const loadSavedSettings = async () => {
    try {
      const settings = await loadGeneralSettings();
      if (settings.autoSync !== undefined) setAutoSync(settings.autoSync);
      if (settings.syncNotifications !== undefined) setSyncNotifications(settings.syncNotifications);
      if (settings.bidirectionalSync !== undefined) setBidirectionalSync(settings.bidirectionalSync);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (newSettings: { autoSync?: boolean; syncNotifications?: boolean; bidirectionalSync?: boolean }) => {
    try {
      console.log('💾 Salvando configurações de sincronização:', newSettings);
      await saveGeneralSettings(newSettings);
      feedbackToast.success('Configurações salvas', 'Suas preferências foram atualizadas.');
    } catch (error: any) {
      console.error('❌ Erro ao salvar configurações:', error);
      
      let errorMessage = 'Não foi possível salvar as configurações.';
      if (error?.message && error.message.includes('JWT')) {
        errorMessage = 'Sessão expirada. Faça login novamente.';
      } else if (error?.message && error.message.includes('permission')) {
        errorMessage = 'Sem permissão para salvar configurações.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      feedbackToast.error('Erro ao salvar', errorMessage);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'syncing':
        return <Clock className="h-4 w-4 text-warning animate-pulse" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Conectado</Badge>;
      case 'syncing':
        return <Badge variant="secondary">Sincronizando</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge variant="outline">Desconectado</Badge>;
    }
  };

  const handleConnect = async (providerId: string) => {
    switch (providerId) {
      case 'google':
        await connectGoogleCalendar();
        break;
      case 'outlook':
        await connectOutlookCalendar();
        break;
      case 'icloud':
        await connectIcloudCalendar();
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Calendar Providers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Integrações de Calendário
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            {providers.map((provider) => (
              <div key={provider.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(provider.status)}
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium">{provider.name}</h4>
                      {getStatusBadge(provider.status)}
                    </div>
                    {provider.lastSync && (
                      <p className="text-sm text-muted-foreground">
                        Última sincronização: {provider.lastSync}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {provider.status === 'connected' ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => syncCalendar(provider.id)}
                        disabled={loading}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Sincronizar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => disconnectProvider(provider.id)}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Desconectar
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => handleConnect(provider.id)}
                      disabled={loading}
                    >
                      Conectar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sync Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações de Sincronização
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Sincronização automática</h4>
              <p className="text-sm text-muted-foreground">
                Sincronizar eventos automaticamente a cada hora
              </p>
            </div>
            <Switch 
              checked={autoSync} 
              onCheckedChange={(checked) => {
                setAutoSync(checked);
                saveSettings({ autoSync: checked });
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Notificações de sincronização</h4>
              <p className="text-sm text-muted-foreground">
                Receber notificações quando novos eventos forem sincronizados
              </p>
            </div>
            <Switch 
              checked={syncNotifications} 
              onCheckedChange={(checked) => {
                setSyncNotifications(checked);
                saveSettings({ syncNotifications: checked });
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Sincronização bidirecional</h4>
              <p className="text-sm text-muted-foreground">
                Permitir que alterações sejam sincronizadas em ambas as direções
              </p>
            </div>
            <Switch 
              checked={bidirectionalSync} 
              onCheckedChange={(checked) => {
                setBidirectionalSync(checked);
                saveSettings({ bidirectionalSync: checked });
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};