import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthGuard';

export function useICloudCalendarSync() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<{email: string, password: string} | null>(null);

  // Verificar conexão existente
  const checkConnection = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('calendar_sync_settings')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', 'icloud')
        .maybeSingle();

      if (error) {
        console.error('Erro ao verificar conexão iCloud:', error);
        return;
      }

      setIsConnected(!!data?.access_token);
      setLastSync(data?.last_sync || null);

    } catch (error) {
      console.error('Erro ao verificar conexão:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Conectar ao iCloud
  const connect = useCallback(async (email: string, appPassword: string) => {
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Usuário não autenticado',
        variant: 'destructive',
      });
      return;
    }

    if (!email || !appPassword) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Email e senha de aplicativo são obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);

      // Codificar credenciais em base64
      const encodedCredentials = btoa(`${email}:${appPassword}`);

      // Testar conexão primeiro
      const { data, error } = await supabase.functions.invoke('icloud-calendar-sync', {
        body: {
          action: 'import_events',
          credentials: encodedCredentials,
          userId: user.id
        }
      });

      if (error) {
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Falha na autenticação iCloud');
      }

      // Salvar credenciais se a conexão funcionou
      const { error: saveError } = await supabase
        .from('calendar_sync_settings')
        .upsert({
          user_id: user.id,
          provider: 'icloud',
          access_token: encodedCredentials,
          is_enabled: true,
          sync_direction: 'bidirectional',
          sync_frequency_minutes: 60,
          updated_at: new Date().toISOString()
        });

      if (saveError) {
        throw saveError;
      }

      setIsConnected(true);
      setCredentials({ email, password: appPassword });

      toast({
        title: 'Sucesso',
        description: 'iCloud Calendar conectado com sucesso!',
      });

    } catch (error) {
      console.error('Erro ao conectar:', error);
      toast({
        title: 'Erro na conexão',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Desconectar
  const disconnect = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('calendar_sync_settings')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', 'icloud');

      if (error) {
        throw error;
      }

      setIsConnected(false);
      setLastSync(null);
      setCredentials(null);

      toast({
        title: 'Desconectado',
        description: 'iCloud Calendar desconectado com sucesso',
      });

    } catch (error) {
      console.error('Erro ao desconectar:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao desconectar do iCloud',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Sincronizar
  const sync = useCallback(async () => {
    if (!user || !isConnected) return;

    try {
      setIsLoading(true);

      // Buscar credenciais
      const { data: settings, error: settingsError } = await supabase
        .from('calendar_sync_settings')
        .select('access_token')
        .eq('user_id', user.id)
        .eq('provider', 'icloud')
        .single();

      if (settingsError || !settings?.access_token) {
        throw new Error('Credenciais não encontradas');
      }

      // Chamar edge function
      const { data, error } = await supabase.functions.invoke('icloud-calendar-sync', {
        body: {
          action: 'sync_bidirectional',
          credentials: settings.access_token,
          userId: user.id
        }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        setLastSync(new Date().toISOString());
        toast({
          title: 'Sincronização concluída',
          description: data.message || 'Eventos sincronizados com sucesso',
        });
      } else {
        throw new Error(data?.error || 'Erro na sincronização');
      }

    } catch (error) {
      console.error('Erro na sincronização:', error);
      toast({
        title: 'Erro na sincronização',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, isConnected]);

  // Verificar conexão na inicialização
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  return {
    isLoading,
    isConnected,
    lastSync,
    credentials,
    connect,
    disconnect,
    sync,
    checkConnection
  };
}