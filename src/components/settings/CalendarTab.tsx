import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthGuard';
import { supabase } from '@/integrations/supabase/client';
import { 
  RefreshCw, 
  CheckCircle,
  AlertCircle,
  Clock,
  Settings,
  Link,
  Trash2,
  Loader2
} from 'lucide-react';

type Provider = {
  id: string;
  name: string;
  status: "connected" | "disconnected" | "syncing";
  isEnabled: boolean;
  lastSync?: string;
};

export const CalendarTab: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [syncNotifications, setSyncNotifications] = useState(true);
  const [bidirectionalSync, setBidirectionalSync] = useState(false);
  
  const [providers, setProviders] = useState<Provider[]>([
    {
      id: "google",
      name: "Google Calendar",
      status: "disconnected",
      isEnabled: false,
    },
    {
      id: "outlook",
      name: "Microsoft Outlook",
      status: "disconnected",
      isEnabled: false,
    },
    {
      id: "icloud",
      name: "iCloud Calendar",
      status: "disconnected",
      isEnabled: false,
    },
  ]);

  useEffect(() => {
    if (user) {
      loadCalendarSettings();
    }
  }, [user]);

  const loadCalendarSettings = async () => {
    if (!user) return;
    
    try {
      // Validate session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('Sessão inválida:', sessionError);
        return;
      }

      console.log('📅 Carregando configurações de calendário...');
      
      const { data, error } = await supabase
        .from("calendar_sync_settings")
        .select("*")
        .eq("user_id", user.id);

      if (error) {
        console.error("❌ Erro ao carregar configurações:", error);
        return;
      }

      console.log('✅ Configurações carregadas:', data);

      if (data && data.length > 0) {
        setProviders((prev) =>
          prev.map((p) => {
            const found = data.find((d) => d.provider === p.id);
            if (found) {
              return {
                ...p,
                status: found.is_enabled ? "connected" : "disconnected",
                isEnabled: found.is_enabled,
                lastSync: found.last_sync
                  ? new Date(found.last_sync).toLocaleString("pt-BR")
                  : undefined,
              };
            }
            return p;
          })
        );

        // Load general settings
        const generalSettings = data.find(d => d.provider === 'general');
        if (generalSettings?.settings) {
          const settings = generalSettings.settings as any;
          setAutoSync(settings.autoSync ?? true);
          setSyncNotifications(settings.syncNotifications ?? true);
          setBidirectionalSync(settings.bidirectionalSync ?? false);
        }
      }
    } catch (error) {
      console.error('💥 Erro ao carregar configurações:', error);
    }
  };

  const saveSettings = async (newSettings: { autoSync?: boolean; syncNotifications?: boolean; bidirectionalSync?: boolean }) => {
    if (!user) return;

    try {
      // Validate session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      console.log('💾 Salvando configurações de calendário:', newSettings);

      // Check if general settings exist
      const { data: existing } = await supabase
        .from('calendar_sync_settings')
        .select('id')
        .eq('user_id', user.id)
        .eq('provider', 'general')
        .single();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('calendar_sync_settings')
          .update({
            settings: newSettings,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('calendar_sync_settings')
          .insert({
            user_id: user.id,
            provider: 'general',
            is_enabled: true,
            settings: newSettings
          });

        if (error) throw error;
      }

      toast({
        title: 'Configurações salvas',
        description: 'Suas preferências foram atualizadas.',
      });
    } catch (error: any) {
      console.error('❌ Erro ao salvar configurações:', error);
      toast({
        title: 'Erro ao salvar',
        description: error?.message || 'Não foi possível salvar as configurações.',
        variant: 'destructive',
      });
    }
  };

  const handleConnect = async (providerId: string) => {
    setLoading(true);
    try {
      // Show info about calendar integration setup
      toast({
        title: 'Integração de Calendário',
        description: `Para conectar ${providerId}, você precisa configurar as credenciais OAuth primeiro. Consulte a documentação do projeto.`,
      });
    } catch (error) {
      console.error('Erro ao conectar:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (providerId: string) => {
    setLoading(true);
    try {
      // Update status to syncing
      setProviders((prev) =>
        prev.map((p) =>
          p.id === providerId ? { ...p, status: "syncing" } : p
        )
      );

      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update last sync time
      setProviders((prev) =>
        prev.map((p) =>
          p.id === providerId
            ? {
                ...p,
                status: "connected",
                lastSync: new Date().toLocaleString("pt-BR"),
              }
            : p
        )
      );

      toast({
        title: 'Sincronização concluída',
        description: `${providerId} foi sincronizado com sucesso.`,
      });
    } catch (error) {
      console.error('Erro na sincronização:', error);
      setProviders((prev) =>
        prev.map((p) =>
          p.id === providerId ? { ...p, status: "connected" } : p
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (providerId: string) => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from("calendar_sync_settings")
        .update({ 
          is_enabled: false,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", user.id)
        .eq("provider", providerId);

      if (error) throw error;

      setProviders((prev) =>
        prev.map((p) =>
          p.id === providerId
            ? { 
                ...p, 
                status: "disconnected", 
                isEnabled: false,
                lastSync: undefined 
              }
            : p
        )
      );

      toast({
        title: 'Desconectado',
        description: `${providerId} foi desconectado com sucesso.`,
      });
    } catch (error: any) {
      console.error("❌ Erro ao desconectar:", error);
      toast({
        title: 'Erro',
        description: 'Falha ao desconectar o provedor.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'syncing':
        return <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
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

  if (!user) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando...</span>
      </div>
    );
  }

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
                        onClick={() => handleSync(provider.id)}
                        disabled={loading}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Sincronizar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnect(provider.id)}
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